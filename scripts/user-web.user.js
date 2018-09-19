﻿// ==UserScript==
// @name        user-web
// @description insert user styles
// @namespace   https://github.com/james-zerty/
// @version     15
// @author      2010+, james_zerty
// @grant       GM.setClipboard
// @noframes
// @include     http*://*/*
// @exclude     https://localhost:44300/dev*
// @require     https://rawgit.com/james-zerty/user-web/master/scripts/jquery/jquery-2.1.0.min.js
// @require     https://rawgit.com/james-zerty/user-web/master/scripts/jquery/jquery.cookie.js
// ==/UserScript==
"use strict";
try {
    var $ = window.$;
    var loadAfter = 100;
    var logPrefix = "[user-web] ";
    var url = document.location.href;

    var settings = { localUrls: 0, uniqueUrls: 0, reloader: 0, autoShow: 0, handleErrors: 1 };
    if (url.match(/localhost.*\/(home|dev).*\.htm/i) != null) {
        settings = { localUrls: 0, uniqueUrls: 0, reloader: 1, autoShow: 1, handleErrors: 0 };
    }

    if (navigator.userAgent.indexOf("Mozilla/5.0 (Windows NT 6.3; Win64; x64;" > -1)) {
        settings.localUrls = 1;
    }

    log("url", url.substr(0, 100));
    log("loaded", new Date());
    // log("navigator.userAgent", navigator.userAgent);

    var userWeb = new function() {
        var me = this;

        // config...
        me.siteConfigs = [
            { exp: /localhost:44300/i, filter: ".ad, #ad1" },
            { exp: /calendar\.google\.com\/calendar/i, icon: "https://calendar.google.com/googlecalendar/images/favicon_v2014_31.ico" },
            { exp: /bbc\.co\.uk\/weather/i, icon: "https://localhost:44300/styles/icons/bbc-weather.png" },
            { exp: /bbc\.co.\uk\/news/i, filter: "#breaking-news-container, .share", icon: "https://localhost:44300/styles/icons/bbc-news.png" },
            { exp: /\/dana\/home\/index\.cgi/i, icon: "https://localhost:44300/styles/icons/net-home.ico" },
            { exp: /messengernewspapers\.co\.uk/i, filter: "#__nq__hh" },
            { exp: /(thenib|medium)\.com/i, filter: ".metabar, .postActionsBar, .promoCardWrapper, [data-image-id='1*8Ns0Hg0Tbw8jFjaMLN-qYw.gif']" },
            { exp: /tumblr\.com/i, filter: ".tumblr_controls, #notes" },
            { exp: /amazon\.co/i, filter: "#dp-ads-middle-3psl, #tellAFriendBox_feature_div, #quickPromoBucketContent, #quickPromoDivId, #sc-new-upsell, #nav-swmslot, #hqpWrapper, #huc-v2-cobrand-stripe, #nav-upnav, #detail-ilm_div, #navFooter" },
        ];

        me.tidyUpExcludes = "www.inoreader.com|google.com|getpocket.com|outlook.office.com".replace(/\./g, "\\\.");

        me.load = function() {
            me.url = document.location.href;
            me.tidyUpExclude = me.url.match(me.tidyUpExcludes) != null;

            //fnt
            me.fontA = {
                large: { size: 16, height: 22, face: "Open Sans", weight: "normal", color: "#222", "indent": 0 },
                small: { size: 14, height: 18, face: "Open Sans", weight: "normal", color: "#222", "indent": 0 },
            };
            me.fontB = {
                large: { size: 16, height: 26, face: "Open Sans", weight: "normal", color: "#222", "indent": 10 },
                small: { size: 14, height: 23, face: "Open Sans", weight: "normal", color: "#222", "indent": 10 }
            };
            me.fontC = {
                large: { size: 18, height: 29, face: "Georgia", weight: "normal", color: "#222", "indent": 15 },
                small: { size: 18, height: 29, face: "Georgia", weight: "normal", color: "#222", "indent": 15 }
            };

            me.marked = $();
            me.forced = $();
            me.readingState = 0;
            me.menuTimeoutTime = 1000;
            me.noRead = me.url.match(/:9000/i) != null;

            me.setReloader();
            me.siteConfig();
            me.switchLinks();
            me.loadUserStyle();
            me.bindPageMouse();
            me.bindPageKeyDown();
            me.readLite();

            if (settings.autoShow) {
                me.run(function() {
                    // me.readLite();
                    // me.addStyles(); me.doMarkAuto();
                    // me.doReadAuto();
                    // me.doPopoutAuto();
                    // throw new Error("test!");
                });
            }
        };

        me.switchLinks = function() {
            $("body a").each(function() {
                var el = $(this);
                var href = el.attr("href");
                if (href) {
                    el.attr("href", href.replace("en\.wikipedia", "en\.m\.wikipedia"));
                }
            });
        };

        /*** page events ********************************************************************************************** */

        me.bindPageMouse = function() {
            $("html").mouseup(function(e) {
                me.onPageMouseUp(e);
            });
        };

        me.onPageMouseUp = function(e) {
            me.run(function() {
                if (e.button != 0) {
                    return;
                }
                if (me.saveSelection(e)) {
                    if (me.menuShowing) {
                        me.hideMenu();
                        return;
                    }

                    var tagName = e.target == null ? "UNKNOWN" : e.target.tagName;

                    switch (tagName) {
                        case "IMG":  //img doesn't clear selection
                        case "HTML": //scrollbar
                            log("not showing!", e.target.tagName, e.target, e.pageX, e.pageY);
                            me.hideMenu();
                            return;
                    }

                    me.showMenu(e);
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                }
            });
        };

        me.saveSelection = function(e) {
            var text = "";
            if ($(e.target).is("input[type='text']") || $(e.target).is("textarea")) {
                text = e.target.value.substring(e.target.selectionStart, e.target.selectionEnd);
            }
            else {
                text = window.getSelection().toString();
            }
            if (text) {
                me.selectedText = text;
                return true;
            }
            else {
                return false;
            }
        };

        me.clearSelection = function(e) {
            if (window.getSelection) {
                try {
                    window.getSelection().removeAllRanges();
                }
                catch (ex) {
                    //happens on IE during enableAutoReadr
                }
            }
            else if (document.selection) {
                document.selection.empty();
            }
        };

        me.bindPageKeyDown = function() {
            if (!me.isPageKeyDownBound) {
                me.isPageKeyDownBound = true;
                $("body").bind("keydown.uw-page", function(e) {
                    me.run(function() {
                        me.onPageKeyDown(e);
                    });
                });
            }
        };

        me.cancelEvent = function(e) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        };

        me.onPageKeyDown = function(e) {
            // log("onPageKeyDown", "key:", e.key, " code:", e.keyCode, " ctrl:", e.ctrlKey, " alt:", e.altKey, " shift:", e.shiftKey);
            me.run(function() {
                switch (e.keyCode) { //qq
                    case 192: // ` firefox
                    case 223: // ` chrome
                        if (navigator.userAgent.indexOf("Chrome") > -1 && e.keyCode == 192) return;
                        // `                read cycle > Lite, Read, Large, Off
                        // Alt+`            show menu
                        // F2               mark next clicked element / resume marking
                        // Ctrl+`           find > [DEL/d/RC] delete, [ENTER/r] read, [m] mark, [p] popout
                        // Shift+`          undo read
                        // Ctrl+Shift+`     toggle user style
                        if (e.ctrlKey && e.shiftKey) { //toggle user style...
                            log("Ctrl+Shift+`", "toggle user style");
                            if (me.activeUserStyle) {
                                me.unloadUserStyle();
                            }
                            else {
                                settings.uniqueUrls = 1;
                                me.loadUserStyle();
                            }
                        }
                        else if (e.shiftKey) {
                            log("Shift+`", "undo read");
                            me.undoRead();
                        }
                        else if (e.altKey) {
                            log("Alt+`", "show menu");
                            me.showMenu(e);
                        }
                        else if (e.ctrlKey) {
                            log("Ctrl+`", "find element");
                            me.startFind();
                        }
                        else { //reading...
                            switch (me.readingState) {
                                case 0:
                                    me.tidyUp();
                                    me.readLite();
                                    break;
                                case 1:
                                    me.doReadAuto();
                                    break;
                                case 2:
                                    me.setFontB();
                                    break;
                                default:
                                    me.undoRead();
                                    break;
                            }
                        }

                        return me.cancelEvent(e);
                    case 113: // F2
                        log("F2", "mark");
                        me.markElementAndBind(me.marked);
                        return me.cancelEvent(e);
                    case 37: // left
                    case 39: // right
                    case 74: // j
                    case 75: // k
                        if (me.marking) {
                            if (e.ctrlKey || e.shiftKey || e.altKey) return;

                            var fwd = e.keyCode == 39 || e.keyCode == 74;
                            var curr = $(".uw-marked");
                            var next = fwd? curr.next() : curr.prev();

                            function getNext(fwd, curr) {
                                var ps = $("p");
                                var index = $.inArray(curr[0], ps);
                                return fwd? $(ps[index+1]) : $(ps[index-1]);
                            }

                            if (curr.prop("tagName") == "P") {
                                //log("we're reading p's");
                                next = getNext(fwd, curr);
                            }

                            if (next.length == 0) {
                                var p = curr.parent();

                                next = fwd? p.next() : p.prev();

                                if (next.length == 0) {
                                    log("next is empty");
                                    next = getNext(fwd, curr);
                                }
                            }

                            if (next.is(":hidden") || next.css("visibility") == "hidden" || next.text().length == 0) {
                                log("next is hidden");
                                next = fwd? next.next() : next.prev();
                            }

                            if (next.length > 0) {
                                me.markElement(next);
                            }

                            e.preventDefault();
                            e.stopPropagation();
                        }

                        break;
                    case 191: // ?
                        if (e.ctrlKey && e.shiftKey) {
                            me.showHelp();
                        }
                        break;
                    default:
                        if (me.marking) {
                            log(e.keyCode, "Cancel Marking");
                            me.markElementCancel();
                            //e.preventDefault();
                            //e.stopPropagation();
                        }
                        break;
                }

                me.hideMenu();
            });
        };

        /*** menu ui ************************************************************************************************** */

        me.showMenu = function(e) {
            me.menuShowing = true;
            me.clickEvent = e;

            var adjustY = -10;
            var adjustX = 160;
            var offsetY = 0;
            var offsetX = 0;

            var ePageX = e.pageX;
            var ePageY = e.pageY;
            log("", "ePageX: ", ePageX, "; ePageY: ", ePageY);
            if (isNaN(ePageY)) {
                ePageY = $(window).scrollTop();
            }
            if (isNaN(ePageX)) {
                ePageX = $(window).scrollLeft();
                adjustX = -10;
            }
            log("", "ePageX: ", ePageX, "; ePageY: ", ePageY);

            if (me.menu == null) {
                me.createMenu();
            }
            else {
                me.menu.show();
            }

            if (me.selectedText) {
                offsetY = 10;
                offsetX = 70;
                me.ulReadr.show();
                me.ulSearch.show();
                me.ulReadr.css("min-height", "161px"); //hack for the vertical separator
            }
            else {
                me.ulReadr.show();
                me.ulSearch.hide();
                me.ulReadr.css("min-height", "1px");
            }

            var top = ePageY - adjustY + offsetY;
            var left = ePageX - adjustX + offsetX;
            if (left < 10) {
                left = 10;
            }

            // log("top", top);
            // log("left", left);

            me.menu.css({
                top: top + "px",
                left: left + "px"
            });

            var pos = me.menu.position();
            pos.height = me.menu.height();
            pos.width = me.menu.width();
            pos.bottom = pos.top + pos.height;
            pos.right = pos.left + pos.width;

            var wpos = [];
            wpos.height = $(window).height();
            wpos.width = $(window).width();
            wpos.scrollTop = $(window).scrollTop();
            wpos.scrollBottom = wpos.scrollTop + wpos.height;

            if (pos.bottom > wpos.scrollBottom) {
                me.menu.css("top", ePageY - pos.height - 20 + "px");
            }

            if (pos.top < 0) {
                me.menu.css("top", "0px");
            }

            if (pos.right > wpos.width) {
                me.menu.css("left", wpos.width - pos.width - 20 + "px");
            }

            if (pos.left < 0) {
                me.menu.css("left", "0px");
            }

            me.menuTimeoutClear();
            me.menuTimeoutSet();
        };

        me.menuTimeoutSet = function() {
            me.menuTimeoutId = setTimeout(function() {
                me.hideMenu();
            }, me.menuTimeoutTime);
        };

        me.menuTimeoutClear = function() {
            if (typeof me.menuTimeoutId == "number") {
                clearTimeout(me.menuTimeoutId);
                delete me.menuTimeoutId;
            }
        };

        me.hideMenu = function() {
            if (me.menu) {
                me.menu.hide();
                me.menuTimeoutClear();
            }

            me.menuShowing = false;
        };

        me.createMenu = function() {
            if (me.menu) {
                return;
            }

            me.addStyles();
            me.menu = $("<div id='UserWebMenu' class='uw-menu'>");
            me.ulReadr = $("<ul class='uw-menu-left'>");

            me.menu.hover(
                function() { // on hover
                    me.menuTimeoutClear();
                },
                function() { // on exit
                    me.menuTimeoutClear();
                    me.menuTimeoutSet();
                }
            );

            me.menu.bind("click.uw-menu", function(e) {
                me.run(function() {
                    me.hideMenu();
                });
            });

            me.menu.append(me.ulReadr);

            me.linkRunReadrFull =
                me.addLink(me.ulReadr, "Read", function() { //normal = hide fixed + style all p's
                    var el = $(me.clickEvent.target);
                    me.doReadFromElement(el);
                    me.clearSelection();
                    me.scrollToElement(el);
                }, null, "Tidy + set font for elements with same width (`)");

            me.linkRunReadrLite =
                me.addLink(me.ulReadr, "Read Lite", function() { //lite = hide fixed + justify all p's
                    me.tidyUp();
                    me.readLite();
                }, null, "Tidy and justify");

            me.linkTidyOff =
                me.addLink(me.ulReadr, "Tidy off", function() {
                    $.cookie("tidy", "off", { path: '/' });
                    document.location.reload(true);
                }, null, "Turn tidy off and reload");

            me.linkTidyOn =
                me.addLink(me.ulReadr, "Tidy on", function() {
                    $.cookie("tidy", "on", { path: '/' });
                    document.location.reload(true);
                }, null, "Turn tidy on and reload");

            me.linkRunReadrFind =
                me.addLink(me.ulReadr, "Find...", function() {
                    me.startFind();
                }, null, "Find an element then choose to read, popout or delete - see help for more info (Ctrl+Shift+`)");

            me.separatorRead1 = me.addSeparator(me.ulReadr).hide();

            me.linkUndoReadr =
                me.addLink(me.ulReadr, "Undo Read", function() {
                    me.undoRead();
                }, null, "Remove reading styles and highlights (Shift+`)").hide();

            me.userStyleSeparator = me.addSeparator(me.ulReadr);

            me.linkReloadStyle =
                me.addLink(me.ulReadr, "Reload style", function() {
                    settings.uniqueUrls = 1;
                    me.loadUserStyle();
                }, null, "Reload the user style (Ctrl+Shift+`)").hide();

            me.linkReloadStyleOnDblClick =
                me.addLink(me.ulReadr, "Reload dblclick", function() {
                    $("body").bind("dblclick.uw-find", function() {
                        me.run(function() {
                            settings.uniqueUrls = 1;
                            me.loadUserStyle();
                        });

                        me.clearSelection();
                        me.hideMenu();
                    });

                    me.reloadStyleOnDblClickIsBound = true;
                    me.linkReloadStyleOnDblClick.hide();
                    me.linkReloadStyleOnDblClickOff.show();
                    settings.uniqueUrls = 1;
                    me.loadUserStyle();
                }, null, "Reload the user style on dblclick").hide();

            me.linkReloadStyleOnDblClickOff =
                me.addLink(me.ulReadr, "Reload cancel", function() {
                    $("body").unbind("dblclick.uw-find");
                    me.linkReloadStyleOnDblClick.show();
                    me.linkReloadStyleOnDblClickOff.hide();
                }, null, "Stop reloading the user style on dblclick").hide();

            me.linkOpenStyle =
                me.addLink(me.ulReadr, "Open style", function() {
                    me.openUserStyle();
                }, null, "Open user style in new tab").hide();

            me.linkUnloadStyle =
                me.addLink(me.ulReadr, "Unload style", function() {
                    me.unloadUserStyle();
                }, null, "Unload the user style").hide();

            me.linkShowLinks =
                me.addLink(me.ulReadr, "Show links", function() { //qq
                    $(".uw-container a").attr("style", "text-decoration: underline #ccc !important"); /* uw-uln */
                }, null, "Show hidden links").hide();

            me.linkHideLinks =
                me.addLink(me.ulReadr, "Hide links", function() {
                    $(".uw-container a").attr("style", "text-decoration: none !important"); /* uw-uln */
                }, null, "Hide link underlines").hide();

            me.addSeparator(me.ulReadr);

            me.linkEnableSelect =
                me.addLink(me.ulReadr, "Enable selection", function() {
                    me.enableSelect();
                    me.clearSelection();
                    me.hideMenu();
                }, null, "Allow selection of text");

            me.linkImagesHide =
                me.addLink(me.ulReadr, "Hide Images", function() {
                    me.hideImages();
                }, null, "Hide all images in the page");

            me.linkImagesShow =
                me.addLink(me.ulReadr, "Show Images", function() {
                    me.showImages();
                }, null, "Redisplay hidden images").hide();

            me.addSeparator(me.ulReadr);

            me.linkLevelUp =
                me.addLink(me.ulReadr, "Up", function() {
                    me.levelUp();
                }, null, "Got to URL parent");

            me.addSeparator(me.ulReadr);

            me.addLink(me.ulReadr, "Help", function() {
                me.showHelp();
            });

            me.ulSearch = $("<ul class='uw-menu-right'>");
            me.menu.append(me.ulSearch);

            me.addLink(me.ulSearch, "Copy", function() { me.setClipboard(); });
            me.linkMarkElement =
                me.addLink(me.ulSearch, "Mark", function() {
                    var el = $(me.clickEvent.target);
                    me.markElementAndBind(el);
                });
            me.linkResumeMarkElement =
                me.addLink(me.ulSearch, "Resume Marking", function() {
                    me.markElementAndBind(me.marked);
                }).hide();
            me.linkHighlightElement =
                me.addLink(me.ulSearch, "Highlight", function() {
                    me.highlightElement($(me.clickEvent.target));
                });
            me.addSeparator(me.ulSearch);
            var u = encodeURIComponent(window.location.href);
            var title = encodeURIComponent(window.document.title);
            var prefix = "https://getpocket.com/edit?";
            var pocketUrl = prefix + "url=" + u + "&title=" + title;
            me.addLink(me.ulSearch, "Add to Pocket", null, pocketUrl);
            me.addSeparator(me.ulSearch);
            me.linkNavigateTo = me.addLink(me.ulSearch, "Go to", function() { me.navigateTo(me.selectedText); });
            me.addSeparator(me.ulSearch);
            me.linkSearchTitle = me.addListItem(me.ulSearch, "Search...").addClass("bold");
            me.addLink(me.ulSearch, "Google", function() { me.openSearch("https://www.google.co.uk/search?q=TESTSEARCH"); });
            me.addLink(me.ulSearch, "Google Define", function() { me.openSearch("https://www.google.co.uk/search?q=define:TESTSEARCH"); });
            me.addLink(me.ulSearch, "Google Maps", function() { me.openSearch("https://maps.google.co.uk/maps?q=TESTSEARCH"); });
            me.addLink(me.ulSearch, "Google Images", function() { me.openSearch("https://www.google.co.uk/search?tbm=isch&q=TESTSEARCH"); });
            me.addSeparator(me.ulSearch);
            me.addLink(me.ulSearch, "Stack Overflow", function() { me.openSearch("https://www.google.co.uk/search?q=site%3Astackoverflow.com+TESTSEARCH"); });
            me.addLink(me.ulSearch, "Super User", function() { me.openSearch("https://www.google.co.uk/search?q=site%3Asuperuser.com+TESTSEARCH"); });
            me.addLink(me.ulSearch, "Stack Exchange", function() { me.openSearch("https://www.google.co.uk/search?q=site%3Astackexchange.com+TESTSEARCH"); });
            me.addSeparator(me.ulSearch);
            me.addLink(me.ulSearch, "Twitter", function() { me.openSearch("https://twitter.com/search?q=TESTSEARCH&src=typd"); });
            me.addLink(me.ulSearch, "Wikipedia", function() { me.openSearch("https://en.m.wikipedia.org/wiki/Special:Search?search=TESTSEARCH&go=Go"); });
            me.addLink(me.ulSearch, "Amazon", function() { me.openSearch("http://www.amazon.co.uk/s/ref=nb_sb_noss_1?url=search-alias%3Daps&field-keywords=TESTSEARCH&x=0&y=0"); });

            $("body").append(me.menu);

            me.refreshMenu();
        };

        me.addLink = function(parent, text, fn, href, title) {
            var li = $("<li>")
                .append($("<a>" + text + "</a>")
                    .click(function() { me.run(fn); }));

            if (href != null) li.find("a").prop("href", href);
            if (title != null) li.prop("title", title);

            parent.append(li);
            return li;
        };

        me.addListItem = function(parent, text) {
            var li = $("<li>")
                .append($("<span>" + text + "</span>"));

            parent.append(li);
            return li;
        };

        me.addSeparator = function(parent) {
            return me.addListItem(parent, "").addClass("uw-separator");
        };

        me.refreshMenu = function() {
            if (me.menu) {
                if (me.imageHide) {
                    me.linkImagesShow.show();
                    me.linkImagesHide.hide();
                }
                else {
                    me.linkImagesShow.hide();
                    me.linkImagesHide.show();
                }

                if (me.marked.length > 0) {
                    me.linkResumeMarkElement.show();
                }

                if (me.foundUserStyle) {
                    me.userStyleSeparator.show();
                    me.linkReloadStyle.show();

                    if (!me.reloadStyleOnDblClickIsBound) {
                        me.linkReloadStyleOnDblClick.show();
                    }
                }
                else {
                    me.userStyleSeparator.hide();
                    me.linkReloadStyle.hide();
                    me.linkReloadStyleOnDblClick.hide();
                }

                if (me.activeUserStyle) {
                    me.linkOpenStyle.show();
                    me.linkUnloadStyle.show();
                }
                else {
                    me.linkOpenStyle.hide();
                    me.linkUnloadStyle.hide();
                }

                if (me.activeReadr) {
                    me.separatorRead1.show();
                    me.linkUndoReadr.show();
                    me.linkShowLinks.show();
                    me.linkHideLinks.show();
                }
                else {
                    me.separatorRead1.hide();
                    me.linkUndoReadr.hide();
                    me.linkShowLinks.hide();
                    me.linkHideLinks.hide();
                }

                if ($.cookie("tidy") == "off") {
                    me.linkTidyOff.hide();
                    me.linkTidyOn.show();
                }
                else {
                    me.linkTidyOff.show();
                    me.linkTidyOn.hide();
                }
            }
        };

        me.showHelp = function(e) {
            me.addStyles();
            var pop = $("<div class='uw-help'>");
            pop.html(
                "<table>" +
                    "<tr><th>General...</th></tr>" +
                    "<tr><td>`</td><td>Toggle...</td></tr>" +
                    "<tr><td></td><td>Read Lite</td></tr>" +
                    "<tr><td></td><td>Read</td></tr>" +
                    "<tr><td></td><td>Read large</td></tr>" +
                    "<tr><td></td><td>Undo reading</td></tr>" +
                    "<tr><td>Alt+`</td><td>Show menu</td></tr>" +
                    "<tr><td>Ctrl+`</td><td>Find element</td></tr>" +
                    "<tr><td>Shift+`</td><td>Undo read</td></tr>" +
                    "<tr><td>Ctrl+Shift+`</td><td>Toggle user style</td></tr>" +
                    "<tr><td>F2</td><td>Mark</td></tr>" +
                    "<tr><td>Ctrl+Shift+?</td><td>Show help</td></tr>" +
                    "<tr><td>&nbsp;</td></tr>" +
                    "<tr><th>Marking...</th></tr>" +
                    "<tr><td>Left or k</td><td>Previous paragraph</td></tr>" +
                    "<tr><td>Right or j</td><td>Next paragraph</td></tr>" +
                    "<tr><td>ESC</td><td>Cancel Marking</td></tr>" +
                    "<tr><td>&nbsp;</td></tr>" +
                    "<tr><th>Finding...</th></tr>" +
                    "<tr><td>Enter or f</td><td>Forced read</td></tr>" +
                    "<tr><td>p</td><td>Popout read</td></tr>" +
                    "<tr><td>DEL</td><td>Delete elements</td></tr>" +
                    "<tr><td>ESC</td><td>Cancel find</td></tr>" +
                    "<tr><td>Right / Left</td><td>Next / Previous node</td></tr>" +
                "</table>"
            );

            var cls = $("<div class='uw-help-button'>")
                .text("Close")
                .click(function(e) {
                    pop.hide();
                    return false;
                });
            pop.append(cls);
            $("body").append(pop);
        };

        /*** menu actions ********************************************************************************************* */

        me.hideImages = function() {
            $("img").hide();
            me.imageHide = true;
            me.refreshMenu();
        };

        me.showImages = function() {
            $("img").show();
            me.imageHide = false;
            me.refreshMenu();
        };

        me.levelUp = function() {
            var url = document.location.href;
            url = url.replace(/\/[^\/]*\/*$/g, "");
            log("new url", url);
            document.location.href = url;
        };

        me.enableSelect = function() {
            var styles="*, p, div { user-select:text !important; -moz-user-select:text !important; -webkit-user-select:text !important; }";
            $("head").append($("<style />").html(styles));

            var allowNormal = function() {
                return true;
            };

            $("*[onselectstart], *[ondragstart], *[oncontextmenu]")
                .unbind("contextmenu")
                .unbind("selectstart")
                .unbind("dragstart")
                .unbind("mousedown")
                .unbind("mouseup")
                .unbind("click")
                .attr("onselectstart", allowNormal)
                .attr("oncontextmenu", allowNormal)
                .attr("ondragstart",allowNormal);
        };

        me.setClipboard = function(url) {
            me.run(function() {
                window.GM.setClipboard(trim(me.selectedText));
            });
        };

        me.openSearch = function(url) {
            me.run(function() {
                window.open(url.replace("TESTSEARCH", encodeURIComponent(trim(me.selectedText)).replace(/%20/g, "+")), "", "");
            });
        };

        me.navigateTo = function(url) {
            me.run(function() {
                url = trim(url);
                if (url.indexOf("http") != 0) {
                    url = "http://" + url;
                }

                window.open(url, "", "");
            });
        };

        /*** fonts **************************************************************************************************** */

        me.fonts = [ //fnt
            "Ubuntu",
            "Kalinga",
            "open sans",
            "Yu Mincho",
            "Georgia",
            "Urdu Typesetting", //sans...
            "Euphemia",
            "Corbel",
            "Segoe UI",
            "Levenim MT",
            "Leelawadee UI",
            "Century Gothic",
            "Gadugi",
            "Yu Gothic",
            "Estrangelo Edessa",
            "Malgun Gothic",
            "Comic Sans MS", //serif...
            "Batang",
            "Traditional Arabic",
            "Comic Sans MS", //more...
            "Gisha",
            "Candara",
            "SimSun-ExtB",
            "Sitka Display",
            "Verdana",
            "Arial",
            "BatangChe",
            "Book Antiqua",
            "Calibri",
            "Calibri Light",
            "Cambria",
            "Cambria Math",
            "Consolas",
            "Constantia",
            "Courier New",
            "David",
            "DokChampa",
            "Dotum",
            "DotumChe",
            "Ebrima",
            "FangSong",
            "Gabriola",
            "Gautami",
            "Gulim",
            "GulimChe",
            "Gungsuh",
            "KaiTi",
            "Kartika",
            "Khmer UI",
            "Lao UI",
            "Latha",
            "Leelawadee",
            "Lucida Console",
            "Lucida Sans Unicode",
            "Mangal",
            "Meiryo",
            "Microsoft JhengHei",
            "Microsoft New Tai Lue",
            "Microsoft Sans Serif",
            "Microsoft Tai Le",
            "Microsoft YaHei",
            "Microsoft Yi Baiti",
            "Miriam, Miriam Fixed",
            "MS Gothic, MS PGothic",
            "MS UI Gothic",
            "MV Boli",
            "Myanmar Text",
            "Narkisim",
            "Nirmala UI",
            "NSimSun",
            "Nyala",
            "Palatino Linotype",
            "Plantagenet Cherokee",
            "Raavi",
            "Rod",
            "Sakkal Majalla",
            "Segoe Print",
            "Segoe Script",
            "Segoe UI Symbol",
            "Shruti",
            "SimHei",
            "Simplified Arabic",
            "SimSun",
            "Sitka Banner",
            "Sitka Heading",
            "Sitka Small",
            "Sitka Subheading",
            "Sitka Text",
            "Sylfaen",
            "Tahoma",
            "Vani",
            "Vrinda",
            "Comic Sans MS"
        ];

        /*** menu and reading styles ********************************************************************************** */

        me.addStyleElement = function(id, css) {
            $(document.head).append(
                $("<style>")
                    .attr("id", id)
                    .attr("rel", "stylesheet")
                    .attr("type", "text/css")
                    .text(css));
        };

        me.addStyles = function() {
            if (me.addStylesDone) return;
            me.addStylesDone = true;

            me.addStyleElement("uw-css",
                "html body .uw-help { " +
                    "position: absolute; top: 10px; left: 10px; border: solid 1px #000; background-color: #fff; z-index: 9999999; padding: 10px;" +
                "}" +
                "html body .uw-help td, html body .uw-help th { " +
                    "padding: 1px 20px 1px 5px;" +
                "}" +
                "html body .uw-help-button { " +
                    "border:solid 1px #000; padding:5px; margin-top:20px; text-align:center; cursor:pointer;" +
                "}" +
                "html body .uw-menu { " +
                    "text-align: left !important;" +
                    "padding: 0 !important;" +
                    "position: absolute;" +
                    "border: solid 1px #000;" +
                    "font-family: calibri;" +
                    "font-size: 12px;" +
                    "color: #000;" +
                    "z-index: 999999999;" +
                    "text-align: center;" +
                    "user-select: none;" +
                "}" +
                "html body .uw-menu, html body .uw-menu *, html body .uw-menu ul li a, html body .uw-menu ul li span, html body .uw-help td, html body .uw-help th { " +
                    "font-family: Corbel, Comic Sans MS !important;" +
                    "font-size: 13px !important;" +
                    "font-style: normal !important;" +
                    "line-height: 13px !important;" +
                    "letter-spacing: 0 !important;" +
                    "color: #000 !important;" +
                    "background-color: #fff !important;" +
                    "text-align: left !important;" +
                    "margin: 0 !important;" +
                "}" +
                "html body .uw-menu ul {" +
                    "display: table-cell !important;" +
                "}" +
                "html body .uw-menu ul.uw-menu-left {" +
                    "border-right: solid 1px #000 !important;" +
                "}" +
                "html body .uw-menu ul, html body .uw-menu li {" +
                    "margin: 0 !important;" +
                    "padding: 0 !important;" +
                    "list-style-type: none !important;" +
                    "list-style: none !important;" +
                    "white-space: nowrap !important;" +
                "}" +
                "html body .uw-menu a:visited {" +
                    " color: #000 !important;" +
                "}" +
                "html body .uw-menu a {" +
                    "text-decoration: none !important;" +
                    "cursor: pointer !important;" +
                "}" +
                "html body .uw-menu li {" +
                    "border-top: solid 1px #ddd !important;" +
                "}" +
                "html body .uw-menu li.bold * {" +
                    "font-weight: bold !important;" +
                "}" +
                "html body .uw-menu li.uw-separator {" +
                    "padding: 0 !important;" +
                    "border-top: solid 1px #aaa !important;" +
                "}" +
                "html body .uw-menu li.uw-separator span {" +
                    "padding: 0 !important;" +
                "}" +
                "html body .uw-menu a, html body .uw-menu span {" +
                    "padding: 1px 10px !important;" +
                    "font-weight: normal !important;" +
                    "display: block !important;" +
                "}" +
                "html body .uw-menu span {" +
                    "color: #888 !important;" +
                    "font-style: italic !important;" +
                "}" +
                "html body .uw-menu a:hover {" +
                    "background-color: #def !important;" +
                "}" +
                "html body .uw-container a {" +
                    "text-decoration: underline #ccc !important;" + /* uw-uln */
                    "border-bottom: none !important;" + /* uw-btm */
                "}" +
                "html body.uw-fontB .uw-container a {" +
                    "text-decoration: none !important;" +
                "}" +
                "html body .uw-container h1, html body .uw-container h2, html body .uw-container h3, html body .uw-container h4 {" +
                    "font-family: " + me.fontA.large.face + ", Comic Sans MS !important;" +
                    "font-weight: bold !important;" +
                    "margin-top: 30px !important;" +
                    "margin-bottom: 10px !important;" +
                "}" +
                "html body .uw-container p, html body p.uw-container {" +
                    "text-indent: " + me.fontA.large.indent + "px !important;" +
                    "margin-top: 15px !important;" + /* uw-pmgn */
                    "margin-bottom: 15px !important;" +
                "}" +
                "html body.uw-fontB .uw-container p, html body.uw-fontB p.uw-container {" +
                    "text-indent: " + me.fontB.large.indent + "px !important;" +
                "}" +
                "html body .uw-container img + * {" +
                    "font-style: italic !important;" +
                "}" +
                "html body .uw-marked {" +
                    "border-top: dotted 1px #f8f !important; padding-top: 5px !important;" +
                "}" +
                "html body .uw-highlight {" +
                    "background-color: #ffff80 !important;" +
                "}" +
                "html body .uw-popout {" +
                    "min-width: 350px;" +
                    "max-width: 900px;" +
                    "margin: 40px auto 800px !important;" +
                    "background-color: #fff;" +
                    "border: solid 1px #bbb;" +
                    "border-radius: 7px !important;" +
                    "padding: 70px;" +
                    "z-index: 99999999;" +
                "}" +
                "html body .uw-links h1 {" +
                    " margin: 0 0 20px !important;" +
                    " font-size: 20px !important;" +
                    " font-style: italic !important;" +
                "}" +
                "html body .uw-links a:visited {" +
                    " color: #222 !important;" + /* uw-clr */
                "}" +
                "html body .uw-popout * {" +
                    "position: relative !important;" +
                    "float: none !important;" +
                    "width: 100% !important;" +
                    "max-width: 99999px !important;" +
                    "background-color: #fff !important;" +
                "}" + //fnt...
                "html body .uw-container, html body .uw-container * {" +
                    "font-family: " + me.fontA.large.face + ", Comic Sans MS !important;" +
                    "font-size: " + me.fontA.large.size + "px !important;" +
                    "line-height: " + me.fontA.large.height + "px !important;" +
                    "font-weight: " + me.fontA.large.weight + " !important;" +
                    "color: " + me.fontA.large.color + " !important;" +
                    "font-style: normal !important;" + /* uw-sty */
                    "text-align: justify !important;" + /* uw-jfy */
                "}" +
                "html body.uw-fontB .uw-container, html body.uw-fontB .uw-container * {" +
                    "font-family: " + me.fontB.large.face + ", Comic Sans MS !important;" +
                    "font-size: " + me.fontB.large.size + "px !important;" +
                    "line-height: " + me.fontB.large.height + "px !important;" +
                    "font-weight: " + me.fontB.large.weight + " !important;" +
                    "color: " + me.fontB.large.color + " !important;" +
                "}" +
                "html body .uw-read, html body .uw-read * {" +
                    "opacity: 0.5 !important;" +
                "}" +
                "@media (max-width: 800px) {" +
                    "html body .uw-container, html body .uw-container * {" +
                        "font-family: " + me.fontA.small.face + ", Comic Sans MS !important;" +
                        "font-size: " + me.fontA.small.size + "px !important;" +
                        "line-height: " + me.fontA.small.height + "px !important;" +
                        "font-weight: " + me.fontA.small.weight + " !important;" +
                        "color: " + me.fontA.small.color + " !important;" +
                    "}" +
                    "html body.uw-fontB .uw-container, html body.uw-fontB .uw-container * {" +
                        "font-family: " + me.fontB.small.face + ", Comic Sans MS !important;" +
                        "font-size: " + me.fontB.small.size + "px !important;" +
                        "line-height: " + me.fontB.small.height + "px !important;" +
                        "font-weight: " + me.fontB.small.weight + " !important;" +
                        "color: " + me.fontB.small.color + " !important;" +
                    "}" +
                    "html body .uw-popout {" +
                        "min-width: 100px;" +
                        "margin: 10px auto 800px !important;" +
                    "}" +
                "}"
            );
        };

        me.setFont1 = function() {
            $("body").removeClass("uw-fontB");
        };

        me.setFontB = function() {
            $("body").addClass("uw-fontB");
            me.readingState = 3;
        };

        /*** user style *********************************************************************************************** */

        me.loadUserStyle = function() {

            var config = {
                amazon: { exp: /amazon\.co/i },
                bbc_news: { exp: /bbc\.co\.uk\/(news|sport)/i },
                bbc_weather: { exp: /bbc\.co\.uk\/(weather)/i },
                boing_boing: { exp: /boingxboing\.net/i },
                bing_maps: { exp: /bing\.com\/maps/i },
                gmail: { exp: /mail\.google\.com/i },
                google_calendar: { exp: /google\.com\/calendar/i },
                google_keep: { exp: /keep\.google\.com/i },
                google_maps: { exp: /maps\.google\.co/i },
                google_search: { exp: /google\.(co\.uk|com)\/(search|webhp)/i },
                guardian: { exp: /(guardian\.co\.uk)|theguardian\.com/i },
                inoreader: { exp: /inoreader\.com/i },
                messenger: { exp: /messengernewspapers\.co\.uk/i },
                met_weather: { exp: /metoffice\.gov\.uk\/mobile/i },
                office: { exp: /outlook\.office(365)*\.com/i },
                outlook: { exp: /portal\..*com\/owa/i },
                pocket: { exp: /getpocket\.com/i },
                reddit: { exp: /reddit\.com/i },
                stack_overflow: { exp: /(stackoverflow|stackexchange|superuser)\.com/i },
                test: { exp: /(testlocal|home|dev|dev-fonts|testinject|testxx)\.htm/i },
                tutorials_point: { exp: /tutorialspoint\.com/i },
                yammer: { exp: /yammer\.com/i },
                wikipedia: { exp: /wikipedia\.org/i }
            };

            me.foundUserStyle = false;

            for (var name in config) {
                var cfg = config[name];
                cfg.name = name;

                if (me.url.match(cfg.exp) == null) continue;

                me.currentConfig = cfg;
                if (cfg.exp != "") {
                    me.foundUserStyle = true;

                    if (name == "feedly" && me.isSmall()) {
                        name = "feedly_compact";
                    }

                    me.loadUserStyleSheet(name.replace(/_/ig, "-"));
                    break;
                }
            }

            me.activeUserStyle = me.foundUserStyle;
            me.refreshMenu();
        };

        me.loadUserStyleSheet = function(name) {
            var url = me.getUrl("styles/" + name + ".css");

            log("inserting style", url);

            if (me.userStyleSheet == null) {
                me.userStyleSheet = $("<link>")
                    .attr("id", "uw-css")
                    .attr("rel", "stylesheet")
                    .attr("type", "text/css");

                $(document.head).append(me.userStyleSheet);
            }

            me.userStyleSheet.attr("href", url);
            me.activeUserStyle = true;
        };

        me.unloadUserStyle = function() {
            me.userStyleSheet.attr("href", "");
            me.activeUserStyle = false;
            me.refreshMenu();
        };

        me.openUserStyle = function() {
            window.open(me.userStyleSheet.attr("href"));
        };

        /*** display ************************************************************************************************** */

        me.tidyBound = false;
        me.tidyWaiting = false;
        me.tidyLast = new Date().valueOf();
        me.tidyUp = function(e) { //qqqq
            if (me.tidyUpExclude) return;

            if ($.cookie("tidy") == "off") return;

            log("tidyUp", "tidying");
            me.tidyLast = new Date().valueOf();
            me.tidyWaiting = false;

            $("*").filter(function() {
                var el = $(this);
                var pos = el.css("position");
                var match = (pos === "fixed" || pos === "sticky") && el.prop("tagName") != "PICTURE";
                // if (match) log("tidyUp", "found: ", me.elToString(el));
                return match;
            }).attr("style", "display:none !important");

            $("html, body").css({overflow: "auto", height: "auto"})

            if (!me.tidyBound) {
                me.tidyBound = true;

                //DOMNodeInserted vs DOMSubtreeModified

                $(document).bind("DOMNodeInserted", function(){
                    var now = new Date().valueOf();
                    log("tidyUp", "DOMNodeInserted ", now);

                    if (me.tidyWaiting) return;

                    if (now - me.tidyLast > 2000) {
                        me.tidyUp();
                    }
                    else {
                        me.tidyWaiting = true;
                        window.setTimeout(function() {
                            me.tidyUp();
                        }, 2001);
                    }
                });
            }
        };

        me.siteConfig = function() {
            for (var i in me.siteConfigs) {
                var cfg = me.siteConfigs[i];

                if (me.url.match(cfg.exp) != null) {

                    if (cfg.filter) {
                        log("site filter", cfg.filter);

                        $(cfg.filter).each(function(i) {
                            var id = this.id; if (id == "") id = "[none]";
                            var className = this.className; if (className == "") className = "[none]";
                            log("", "removing: id:", id, "; class:", className, ";");
                            $(this).remove();
                        });

                        me.addStyleElement(
                            "uw-filter",
                            cfg.filter + " { display: none !important; }"
                        );
                    }

                    if (cfg.icon) {
                        log("site icon", cfg.icon);

                        $("link[rel='icon']").remove();

                        var lnk = document.createElement('link');
                        lnk.rel = 'icon';
                        lnk.href = cfg.icon;
                        lnk.type = 'image/x-icon';

                        document.getElementsByTagName('head')[0].appendChild( lnk );
                    }

                    window.self.setTimeout(function() {
                        me.run(function() { me.siteConfig(); });
                    }, 6 * 60 * 60 * 1000); //run every 6 hours
                }
            }
        };

        /*** reading ************************************************************************************************** */

        me.readLite = function() { //qqqq
            $("p").css({"text-align" : "justify"});
            me.readingState = 1;
        };

        me.doReadAuto = function() {
            var main = me.getMainAuto();
            me.doRead(main);
        };

        me.doMarkAuto = function() {
            var main = me.getMainAuto();
            var el = main.find("p:first");
            if (me.marked.length > 0) el = me.marked;
            me.markElementAndBind(el);
        };

        me.doReadFromElement = function(el) {
            var main = me.getMainFromElement(el);
            if (main == null || main.length == 0) return;
            me.doRead(main);
            return main;
        };

        me.doRead = function(main) {
            me.addStyles();
            me.tidyUp();
            main.addClass("uw-container");
            me.activeReadr = true;
            me.refreshMenu();
            me.readingState = 2;
        };

        me.undoRead = function() {
            if (me.popoutDiv != null) {
                me.popoutDiv.remove();
                me.popoutDiv = null;
                me.scrollToElement($("body"));
                me.marked = $();
            }
            me.activePopout = false;
            me.activeReadr = false;
            me.setFont1();
            $(".uw-marked").removeClass("uw-marked");
            $(".uw-read").removeClass("uw-read");
            $(".uw-container").removeClass("uw-container");
            me.markElementCancel();
            me.refreshMenu();
            me.readingState = 0;
        };

        me.doPopoutAuto = function() {
            var main = me.getMainAuto();
            if (main && main.length > 0) {
                me.doPopout(main);
            }
        };

        me.doPopout = function(el) {
            me.tidyUp();
            me.addStyles();
            me.setFontB();
            me.activeReadr = true;

            var rem = el.find("iframe, script, link, button, input, form, textarea, aside").remove();
            // rem.each(function() { log($(this).html()); });

            var exclude = /share|sharing|social|twitter|tool|^side|related|comment|discussion|extra|contentWellBottom|kudo|^ad|keywords|secondary-column$|furniture|hidden|embedded-hyper/gi;
            var hid = el.find("*").filter(function() {
                return (typeof (this.className) == "string" && this.className.match(exclude) !== null) ||
                    (typeof (this.id) == "string" && this.id.match(exclude) !== null) ||
                    $(this).css("visibility") == "hidden" ||
                    $(this).css("display") == "none";
            });
            // hid.each(function() { log("removed", $(this).html().substr(0, 100)); });
            hid.remove();

            el.find("*").attr("style", "");

            var inner = el.html();
            var doc = [];
            doc.push("<div class='uw-popout uw-container'>");
            doc.push(" <div class='uw-links'>");
            doc.push("  <a href='" + document.location.href + "'><h1>" + document.title + "</h1></a>");
            doc.push(" </div>");
            doc.push(" <div>");
            doc.push(inner);
            doc.push(" </div>");
            doc.push("</div>");
            var html = doc.join("");

            document.body.insertAdjacentHTML("afterbegin", html);
            me.popoutDiv = $(".uw-popout");
            me.activePopout = true;
            me.refreshMenu();
            me.readingState = 4;
            $('html, body').scrollTop(0);
        };

        /*** content ************************************************************************************************** */

        me.getMainAuto = function() {
            if (me.forced.length > 0) {
                return me.forced;
            }

            var ps = $("p");
            var parents = [];
            var parentCounter = [];

            //get array of parents of p's...
            ps.each(function() {
                var el = $(this);
                var elP = el.parent();

                var res = $.grep(parents, function(p, i) {
                    return p.el[0] == elP[0];
                });

                if (res.length == 0) {
                    parents.push({ el:elP, ps:1 });
                }
                else {
                    res[0].ps++;
                }
            });

            //find parent with most p's...
            var sorted = parents.sort(function(a, b) {
                return b.ps - a.ps;
            });

            if (sorted.length == 0) {
                log("getMainAuto", "can't find main p container");
                return null;
            }
            else {
                var main = sorted[0].el;
                return main;
            }
        };

        me.getMainFromElement = function(el, original) {
            // log("getMainFromElement", me.elToString(el));
            var parent = el.parent();

            if (parent.length == 0 || parent[0].tagName.toUpperCase() == "BODY") {
                log("parent null, return", me.elToString(el));
                return el;
            }

            if (parent.width() > el.width() + 30) {
                if (el == original) el = parent;
                // log("main parent", me.elToString(el));
                return el;
            }

            return me.getMainFromElement(parent, original);
        };

        /*** finding ************************************************************************************************** */

        me.startFind = function() {
            me.clearSelection();
            me.markElementCancel();
            me.finder = new function() {
                this.els = [];
                this.el = function() {
                    return this.els[this.els.length - 1];
                };
                this.el0 = function() {
                    return this.els[0];
                };
            }();

            log("uw binding", "startFind");
            $("body").bind("mouseup.uw-find-first",
                function(e) {
                    me.run(function() {
                        $("body").unbind("mouseup.uw-find-first");
                        var el = $(e.target);
                        me.finder.els.push(el);
                        el.css("background-color", "orange");
                        log("uw find", "adding bindings");

                        $("body").bind("keyup.uw-find", me.onFindingKeyUp);
                        $("body").bind("mouseup.uw-find", me.onFindingMouseUp);

                        document.oncontextmenu = function() {
                            return false;
                        };
                    });
                }
            );

            me.refreshMenu();
        };

        me.onFindingKeyUp = function(e) {
            me.run(function() {
                switch (e.keyCode) {
                    case 27: //esc
                        me.cancelFind();
                        break;
                    case 13: //enter > force read
                    case 70: //f
                    case 82: //r
                        me.found("force");
                        break;
                    case 68: //d
                    case 46: //DEL
                        me.found("remove");
                        break;
                    case 77: //m > mark
                        me.found("mark");
                        break;
                    case 80: //p > popout
                        me.found("popout");
                        break;
                    case 37: //back
                        if (me.finder.el() != me.finder.el0()) {
                            me.finder.el().css("background-color", "");
                            me.finder.els.pop();
                        }
                        break;
                    case 39: //forward
                        me.findParent();
                        break;
                }
            });
        };

        me.onFindingMouseUp = function(e) {
            me.run(function() {
                switch (e.button) {
                    case 0:
                        me.findParent(); //chrome
                        break;
                    case 1:
                        if (document.all) { //IE
                            me.findParent();
                        }
                        break;
                    case 2: //right click
                        setTimeout(function() {
                            me.found("remove");
                        }, 1);
                        break;
                }
            });
        };

        me.findParent = function() {
            var el = me.finder.el();
            if (el[0].tagName == "BODY") {
                return;
            }

            var elp = el.parent();
            if (elp[0].tagName == "BODY") {
                elp.css("background-color", "red");
            }
            else {
                elp.css("background-color", "gold");
            }

            elp.addClass("uw-find-el");
            me.finder.els.push(elp);
        };

        me.found = function(option) {
            var el = me.finder.el();
            me.cancelFind();

            switch (option) {
                case "force":
                    me.forced = el;
                    me.doRead(el);
                    break;
                case "mark":
                    me.markElementAndBind(el);
                    return;;
                case "remove":
                    el.remove();
                    return;
                case "popout":
                    me.forced = el;
                    me.doPopout(el);
                    return;
            }
        };

        me.cancelFind = function() {
            $(".uw-find-el").css("background-color", "");
            me.finder.el0().css("background-color", "");
            $("*").unbind(".uw-find");
            me.setReloader();
            me.finder = null;
        };

        /*** mark and highlight *************************************************************************************** */

        me.markElementAndBind = function(el) {
            if (!me.marking) {
                me.marking = true;
                if (me.linkResumeMarkElement) {
                    me.linkResumeMarkElement.show();
                }
                me.addStyles();
                $("body").bind("mouseup.uw-marking", me.markElementMouseUp);
                $("body").bind("keyup.uw-marking", me.markElementKeyUp);
                $("body").bind("dblclick.uw-marking", me.markElementCancel);

                document.oncontextmenu = function() {
                    me.markElementCancel();
                    return false;
                };

                if (me.marked.is(":hidden")) {
                    return;
                }
            }

            me.markElement(el);
        };

        me.markElementKeyUp = function(e) {
            me.run(function() {
                switch (e.keyCode) {
                    case 27: //esc
                        me.markElementCancel();
                        break;
                }
            });
        };

        me.markElementCancel = function() {
            if (me.marking) {
                log("markElementCancel");
                me.marking = false;
                $("body").unbind("mouseup.uw-marking");
                $("body").unbind("keyup.uw-marking");
                $("body").unbind("dblclick.uw-marking");
            }

            me.setReloader();
        };

        me.markElement = function(target) {
            me.clearSelection();
            $(".uw-marked").removeClass("uw-marked");
            if (target.prop("tagName") != "P" && target.parent().prop("tagName") == "P") target = target.parent();
            me.marked.addClass("uw-read");
            me.marked = target;
            target.removeClass("uw-read").addClass("uw-marked");
            me.scrollToElement(target);
        };

        me.markElementMouseUp = function(e) {
            switch (e.button) {
                case 0: //chrome
                    me.run(function() {
                        me.markElement($(e.target));
                    });
                    break;
                case 1:
                    if (document.all) { //IE
                        me.run(function() {
                            me.markElement($(e.target));
                        });
                    }
                    break;
                case 2: //right click
                    break;
            }
        };

        me.highlightElement = function(target) {
            me.clearSelection();
            if (target.prop("tagName") != "P" && target.parent().prop("tagName") == "P") target = target.parent();
            target.addClass("uw-highlight");
        };

        /*** utils **************************************************************************************************** */

        me.getUrl = function(path) {
            var unique = settings.uniqueUrls ? "?" + new Date().valueOf() : "";
            return me.getRoot() + path + unique;
        };

        me.getRoot = function() {
            return settings.localUrls ? "https://localhost:44300/" : "https://rawgit.com/james-zerty/user-web/master/";
        };

        me.isSmall = function() {
            return $(window).width() < 700;
        };

        me.run = function(fn) {
            if (settings.handleErrors) {
                try {
                    fn();
                }
                catch (ex) {
                    log(ex);
                }
            }
            else {
                fn();
            }
        };

        me.elToString = function(el) {
            try {
                var res = "<" + el.prop("tagName");
                var id = el.attr("id");

                if (id) {
                    res += " id='" + id + "'";
                }

                var class1 = el.prop("class");
                if (class1) {
                    res += " class='" + class1 + "'";
                }

                return res + ">";
            }
            catch (ex) {
                return "failed to log el: " + ex.message;
            }
        };

        me.scrollToElement = function(el) {
            if (el == null || el.length == 0) return;

            var top = el.offset().top - 15;
            $('html, body').scrollTop(top);
        };

        /*** dev ****************************************************************************************************** */

        me.setReloader = function() {
            if (settings.reloader) {
                document.oncontextmenu = function(e) {
                    document.location.reload(true);
                    return false;
                };
            }
            else {
                document.oncontextmenu = null;
            }
        };

    }();

    /* ================================================== */

    window.self.setTimeout(function() {
        if (settings.handleErrors) {
            try {
                userWeb.load();
            }
            catch (ex) {
                log(ex);
            }
        }
        else {
            userWeb.load();
        }
    }, loadAfter);
}
catch (ex) {
    log(ex);
}

/* == utils ================================================================= */
var logPopup;
var DO_POP = "DO_POP";
function hidePop() {
    if (logPopup && logPopup.style) {
        logPopup.style.display = "none";
    }
}
function pop() {
    Array.prototype.unshift.call(arguments, DO_POP);
    log.apply(this, arguments);
}
function log() {
    function tidy(str) {
        if (str && typeof (str) == "string") {
            return str.replace(/(?:\r\n|\r|\n)/g, "");
        }

        return str;
    }

    function popup(msg) {
        if (logPopup == null) {
            var style = "position:absolute; top:0px; left:0px; background-color:#fff; " +
                        "border:solid 1px #000; padding:10px; z-index:99999999; color:#000; " +
                        "min-width:400px; font: 12px/18px Consolas, Verdana; text-align: justify;";
            logPopup = addElement(document.body, "div");
            logPopup.style = style;
            logPopup.oncontextmenu = function(e) {
                logPopup.style.display = "none";
                return false;
            };
        }

        logPopup.innerHTML = logPopup.innerHTML + msg.replace(/(\s)/g, "&nbsp;") + "<br />";
        logPopup.style.display = "block";
    }

    var text1 = "", text2 = "", doPop = false;

    if (arguments.length > 0) {
        if (typeof(arguments[0]) == "object") {
            var ob = arguments[0];
            text1 = "object";
            text2 = ob.toString();
            if (text2.indexOf("Error") > -1) text1 = "error";
            for (var key in ob) {
                text2 += key + ":" + ob[key] + ";";
            }
        }
        else {
            text1 = tidy(arguments[0]);
        }
    }

    if (text1 == DO_POP) {
        doPop = true;
        text1 = null;
        Array.prototype.shift.apply(arguments);
        if (arguments.length > 0) {
            text1 = tidy(arguments[0]);
        }
    }

    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            text2 += tidy(arguments[i]);
        }
    }

    if (text1 == null) text1 = "";
    if (text2 == null) text2 = "";

    text1 = trim(text1.toString());
    text2 = trim(text2.toString()).replace(/( >>$)/g, "");

    var max1 = 20;
    var max2 = 100;

    if (text2 != null) {
        if (text1.length < max1) {
            text1 = text1 + Array(max1 + 1 - text1.length).join(" ");
        }

        if (text1.length > max1) {
            text1 = text1.substr(0, max1);
        }

        text1 = text1 + ": ";
    }

    if (text1.length > max2) {
        text1 = text1.substr(0, max2) + "...";
    }

    try {
        var dt = getDateStamp() + " ";
        if (window.console) {
            window.console.log(dt + logPrefix + text1, text2);
        }
        else {
        }

        if (doPop) {
            popup(dt + logPrefix + text1 + text2);
        }
    }
    catch (ex) {
        window.alert(logPrefix + text1 + "\r\r" + ex.message);
    }
}
function addElement(parent, tag, className, text) {
    var el = document.createElement(tag);

    if (className != null) {
        el.class = className;
    }

    if (text != null) {
        el.innerText = text;
    }

    if (parent != null) {
        parent.appendChild(el);
    }

    return el;
}
function getDateStamp(dt) {
    return getDateString(dt).replace(/[-:]/g, "");
}
function getDateString(dt) {
    if (dt == null ) dt = new Date();
    return dt.getFullYear() + "-" +
        zeroFill(dt.getMonth() + 1) + "-" +
        zeroFill(dt.getDate()) + "_" +
        zeroFill(dt.getHours()) + ":" +
        zeroFill(dt.getMinutes()) + ":" +
        zeroFill(dt.getSeconds());
}
function zeroFill(val, n) {
    if (n == null) n = 2;
    return val.toString().padStart(n, "0");
}
function trim(val) {
    const pattern = /[\0-\x1F\x7F-\x9F\xAD\u0378\u0379\u037F-\u0383\u038B\u038D\u03A2\u0528-\u0530\u0557\u0558\u0560\u0588\u058B-\u058E\u0590\u05C8-\u05CF\u05EB-\u05EF\u05F5-\u0605\u061C\u061D\u06DD\u070E\u070F\u074B\u074C\u07B2-\u07BF\u07FB-\u07FF\u082E\u082F\u083F\u085C\u085D\u085F-\u089F\u08A1\u08AD-\u08E3\u08FF\u0978\u0980\u0984\u098D\u098E\u0991\u0992\u09A9\u09B1\u09B3-\u09B5\u09BA\u09BB\u09C5\u09C6\u09C9\u09CA\u09CF-\u09D6\u09D8-\u09DB\u09DE\u09E4\u09E5\u09FC-\u0A00\u0A04\u0A0B-\u0A0E\u0A11\u0A12\u0A29\u0A31\u0A34\u0A37\u0A3A\u0A3B\u0A3D\u0A43-\u0A46\u0A49\u0A4A\u0A4E-\u0A50\u0A52-\u0A58\u0A5D\u0A5F-\u0A65\u0A76-\u0A80\u0A84\u0A8E\u0A92\u0AA9\u0AB1\u0AB4\u0ABA\u0ABB\u0AC6\u0ACA\u0ACE\u0ACF\u0AD1-\u0ADF\u0AE4\u0AE5\u0AF2-\u0B00\u0B04\u0B0D\u0B0E\u0B11\u0B12\u0B29\u0B31\u0B34\u0B3A\u0B3B\u0B45\u0B46\u0B49\u0B4A\u0B4E-\u0B55\u0B58-\u0B5B\u0B5E\u0B64\u0B65\u0B78-\u0B81\u0B84\u0B8B-\u0B8D\u0B91\u0B96-\u0B98\u0B9B\u0B9D\u0BA0-\u0BA2\u0BA5-\u0BA7\u0BAB-\u0BAD\u0BBA-\u0BBD\u0BC3-\u0BC5\u0BC9\u0BCE\u0BCF\u0BD1-\u0BD6\u0BD8-\u0BE5\u0BFB-\u0C00\u0C04\u0C0D\u0C11\u0C29\u0C34\u0C3A-\u0C3C\u0C45\u0C49\u0C4E-\u0C54\u0C57\u0C5A-\u0C5F\u0C64\u0C65\u0C70-\u0C77\u0C80\u0C81\u0C84\u0C8D\u0C91\u0CA9\u0CB4\u0CBA\u0CBB\u0CC5\u0CC9\u0CCE-\u0CD4\u0CD7-\u0CDD\u0CDF\u0CE4\u0CE5\u0CF0\u0CF3-\u0D01\u0D04\u0D0D\u0D11\u0D3B\u0D3C\u0D45\u0D49\u0D4F-\u0D56\u0D58-\u0D5F\u0D64\u0D65\u0D76-\u0D78\u0D80\u0D81\u0D84\u0D97-\u0D99\u0DB2\u0DBC\u0DBE\u0DBF\u0DC7-\u0DC9\u0DCB-\u0DCE\u0DD5\u0DD7\u0DE0-\u0DF1\u0DF5-\u0E00\u0E3B-\u0E3E\u0E5C-\u0E80\u0E83\u0E85\u0E86\u0E89\u0E8B\u0E8C\u0E8E-\u0E93\u0E98\u0EA0\u0EA4\u0EA6\u0EA8\u0EA9\u0EAC\u0EBA\u0EBE\u0EBF\u0EC5\u0EC7\u0ECE\u0ECF\u0EDA\u0EDB\u0EE0-\u0EFF\u0F48\u0F6D-\u0F70\u0F98\u0FBD\u0FCD\u0FDB-\u0FFF\u10C6\u10C8-\u10CC\u10CE\u10CF\u1249\u124E\u124F\u1257\u1259\u125E\u125F\u1289\u128E\u128F\u12B1\u12B6\u12B7\u12BF\u12C1\u12C6\u12C7\u12D7\u1311\u1316\u1317\u135B\u135C\u137D-\u137F\u139A-\u139F\u13F5-\u13FF\u169D-\u169F\u16F1-\u16FF\u170D\u1715-\u171F\u1737-\u173F\u1754-\u175F\u176D\u1771\u1774-\u177F\u17DE\u17DF\u17EA-\u17EF\u17FA-\u17FF\u180F\u181A-\u181F\u1878-\u187F\u18AB-\u18AF\u18F6-\u18FF\u191D-\u191F\u192C-\u192F\u193C-\u193F\u1941-\u1943\u196E\u196F\u1975-\u197F\u19AC-\u19AF\u19CA-\u19CF\u19DB-\u19DD\u1A1C\u1A1D\u1A5F\u1A7D\u1A7E\u1A8A-\u1A8F\u1A9A-\u1A9F\u1AAE-\u1AFF\u1B4C-\u1B4F\u1B7D-\u1B7F\u1BF4-\u1BFB\u1C38-\u1C3A\u1C4A-\u1C4C\u1C80-\u1CBF\u1CC8-\u1CCF\u1CF7-\u1CFF\u1DE7-\u1DFB\u1F16\u1F17\u1F1E\u1F1F\u1F46\u1F47\u1F4E\u1F4F\u1F58\u1F5A\u1F5C\u1F5E\u1F7E\u1F7F\u1FB5\u1FC5\u1FD4\u1FD5\u1FDC\u1FF0\u1FF1\u1FF5\u1FFF\u200B-\u200F\u202A-\u202E\u2060-\u206F\u2072\u2073\u208F\u209D-\u209F\u20BB-\u20CF\u20F1-\u20FF\u218A-\u218F\u23F4-\u23FF\u2427-\u243F\u244B-\u245F\u2700\u2B4D-\u2B4F\u2B5A-\u2BFF\u2C2F\u2C5F\u2CF4-\u2CF8\u2D26\u2D28-\u2D2C\u2D2E\u2D2F\u2D68-\u2D6E\u2D71-\u2D7E\u2D97-\u2D9F\u2DA7\u2DAF\u2DB7\u2DBF\u2DC7\u2DCF\u2DD7\u2DDF\u2E3C-\u2E7F\u2E9A\u2EF4-\u2EFF\u2FD6-\u2FEF\u2FFC-\u2FFF\u3040\u3097\u3098\u3100-\u3104\u312E-\u3130\u318F\u31BB-\u31BF\u31E4-\u31EF\u321F\u32FF\u4DB6-\u4DBF\u9FCD-\u9FFF\uA48D-\uA48F\uA4C7-\uA4CF\uA62C-\uA63F\uA698-\uA69E\uA6F8-\uA6FF\uA78F\uA794-\uA79F\uA7AB-\uA7F7\uA82C-\uA82F\uA83A-\uA83F\uA878-\uA87F\uA8C5-\uA8CD\uA8DA-\uA8DF\uA8FC-\uA8FF\uA954-\uA95E\uA97D-\uA97F\uA9CE\uA9DA-\uA9DD\uA9E0-\uA9FF\uAA37-\uAA3F\uAA4E\uAA4F\uAA5A\uAA5B\uAA7C-\uAA7F\uAAC3-\uAADA\uAAF7-\uAB00\uAB07\uAB08\uAB0F\uAB10\uAB17-\uAB1F\uAB27\uAB2F-\uABBF\uABEE\uABEF\uABFA-\uABFF\uD7A4-\uD7AF\uD7C7-\uD7CA\uD7FC-\uF8FF\uFA6E\uFA6F\uFADA-\uFAFF\uFB07-\uFB12\uFB18-\uFB1C\uFB37\uFB3D\uFB3F\uFB42\uFB45\uFBC2-\uFBD2\uFD40-\uFD4F\uFD90\uFD91\uFDC8-\uFDEF\uFDFE\uFDFF\uFE1A-\uFE1F\uFE27-\uFE2F\uFE53\uFE67\uFE6C-\uFE6F\uFE75\uFEFD-\uFF00\uFFBF-\uFFC1\uFFC8\uFFC9\uFFD0\uFFD1\uFFD8\uFFD9\uFFDD-\uFFDF\uFFE7\uFFEF-\uFFFB\uFFFE\uFFFF]/g;
    return val.replace(pattern, "").trim();
}
/* == utils END ============================================================= */
function doTests() {
    for (var i = 0; i < 1000; i++) log(getDateStamp());

    var dt = new Date(1990, 0, 2, 3, 4, 5, 6, 7);
    log(getDateString());
    log(getDateStamp());
    log(getDateString(dt));
    log(getDateStamp(dt));


    log("000000123", zeroFill(123, 9));
    log("123      ", zeroFill(123, 3));
    log("123      ", zeroFill(123, 2));

    log("xxxxxx123", "123".padStart(9, "x"));
    log("123      ", "123".padStart(3, "x"));
    log("123      ", "123".padStart(2, "x"));

    log("888888123", "123".padStart(9, 8));
    log("123      ", "123".padStart(3, 8));
    log("123      ", "123".padStart(2, 8));
}