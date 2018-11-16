﻿// ==UserScript==
// @name        user-web
// @description insert user styles
// @namespace   https://github.com/james-zerty/
// @version     15
// @author      2010+, james_zerty
// @grant       GM.setClipboard
// @grant       GM_setClipboard
// @noframes
// @include     http*://*/*
// @exclude     https://localhost:44300/dev*
// @require     https://rawgit.com/james-zerty/user-web/master/scripts/utils.js
// @require     https://rawgit.com/james-zerty/user-web/master/scripts/jquery/jquery-3.3.1.min.js
// @require     https://rawgit.com/james-zerty/user-web/master/scripts/jquery/jquery.cookie.js
// ==/UserScript==
"use strict";
try {
    var $ = window.$;
    var loadAfter = 100;
    var url = document.location.href;
    setupLog("[user-web]");

    var settings = { localUrls: 0, uniqueUrls: 0, reloader: 0, autoShow: 0, handleErrors: 1 };

    log("url", url.substr(0, 100));
    // log("loaded", new Date());
    // log("navigator.userAgent", navigator.userAgent);

    var userWeb = new function() {
        var me = this;

        me.load = function() {
            me.url = document.location.href;
            me.tidyUpExcludes = "www.inoreader.com|google.com|getpocket.com|outlook.office.com".replace(/\./g, "\\\.");
            me.tidyUpExclude = me.url.match(me.tidyUpExcludes) != null;

            // config...
            me.siteConfigs = [
                { exp: /localhost:44300/i, filter: ".ad, #ad1", custom: function() { me.switchWikipediaLinks(); } },
                { exp: /calendar\.google\.com\/calendar/i, icon: "https://calendar.google.com/googlecalendar/images/favicon_v2014_31.ico" },
                { exp: /bbc\.co\.uk\/weather/i, icon: me.getUrl("styles/icons/bbc-weather-icon.png") },
                { exp: /bbc\.co.\uk\/news/i, filter: "#breaking-news-container, .share", icon: me.getUrl("styles/icons/bbc-news-icon.png") },
                { exp: /\/dana\/home\/index\.cgi/i, icon: me.getUrl("styles/icons/net-home.ico") },
                { exp: /messengernewspapers\.co\.uk/i, filter: "#__nq__hh" },
                { exp: /(thenib|medium)\.com/i, filter: ".metabar, .postActionsBar, .promoCardWrapper, [data-image-id='1*8Ns0Hg0Tbw8jFjaMLN-qYw.gif']" },
                { exp: /tumblr\.com/i, filter: ".tumblr_controls, #notes" },
                { exp: /amazon\.co/i, filter: "#dp-ads-middle-3psl, #tellAFriendBox_feature_div, #quickPromoBucketContent, #quickPromoDivId, #sc-new-upsell, #nav-swmslot, #hqpWrapper, #huc-v2-cobrand-stripe, #nav-upnav, #detail-ilm_div, #navFooter" },
                { exp: /google\.co/i, custom: function() { me.switchWikipediaLinks(); } },
                { exp: /wikipedia\.org/i, custom: function() { me.addWikipediaRandom(); } },
            ];

            //fnt
            me.fontA = { size: 14, height: 20, sizeS: 13, heightS: 18, weight: '400', color: '#333', serif: 0, fixed: 0, indent: 0,  face: 'Verdana' };
            me.fontB = { size: 18, height: 25, sizeS: 15, heightS: 19, weight: '400', color: '#333', serif: 0, fixed: 0, indent: 10, face: 'Corbel' };
            me.fontC = { size: 19, height: 30, sizeS: 15, heightS: 23, weight: '400', color: '#555', serif: 1, fixed: 0, indent: 15, face: 'Georgia' };

            me.marked = $();
            me.forced = $();
            me.readingState = 0;
            me.menuTimeoutTime = 1000;

            me.setReloader();
            me.siteConfig();
            me.loadUserStyle();
            me.bindPageMouse();
            me.bindPageKeyDown();
            me.tidyUp();
            me.readLite();

            if (settings.autoShow) {
                me.run(function() {
                    // me.readLite();
                    // me.addStyles(); me.doMarkAuto();
                    // me.doReadAuto();
                    // me.doPopoutAuto();
                    // throw new Error("test!");
                    me.showMenu([]); //also need to stop hideMenu
                });
            }
        };

        /*** custom functions ***************************************************************************************** */

        me.switchWikipediaLinks = function() { //used on google search results...
            $("body a").each(function() {
                var el = $(this);
                var href = el.attr("href");
                if (href && href.indexOf("en\.wikipedia") > -1) {
                    log("switching", href);
                    el[0].onmousedown = function() {}; //remove google's redirect warning (they must be checking the link hasn't been hijacked)
                    el.attr("href", href.replace("en\.wikipedia", "en\.m\.wikipedia"));
                }
            });
        };

        me.addWikipediaRandom = function() { //change wikipedia header to link to a random page...
            log("wikipedia", "changing header link to random");
            $("header .branding-box a").attr("href", "/wiki/Special:Random");
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
                    case 13: // enter
                        if (e.ctrlKey) {
                            me.doPopoutAuto();
                        }
                        break;
                    case 192: // ` firefox
                    case 223: // ` chrome
                        if (navigator.userAgent.indexOf("Chrome") > -1 && e.keyCode == 192) return;
                        // `                read cycle > Lite, Read, Large, Off
                        // Alt+`            show menu
                        // F2               mark next clicked element / resume marking
                        // Ctrl+`           find > [DEL/d] delete, [r] read, [m] mark, [h] highlight, [ENTER/p/RC] popout
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
                            log("Shift+`", "undo read + popout");
                            me.undoPopout();
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
                            switch (me.readingState) { //qq
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
                                case 3:
                                    me.setFontC();
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
                    case 65: // a
                    case 27: // esc
                        if (me.marking) {
                            log(e.keyCode, "Cancel Marking");
                            me.markElementCancel();
                        }
                        break;
                    default:
                        if (me.marking) {
                            log(e.keyCode, "Marking");
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
            // log("", "ePageX: ", ePageX, "; ePageY: ", ePageY);
            if (isNaN(ePageY)) {
                ePageY = $(window).scrollTop();
            }
            if (isNaN(ePageX)) {
                ePageX = $(window).scrollLeft();
                adjustX = -10;
            }
            // log("", "ePageX: ", ePageX, "; ePageY: ", ePageY);

            if (me.menu == null) {
                me.createMenu();
            }
            else {
                me.menu.show();
            }

            if (me.selectedText) {
                offsetY = 10;
                offsetX = 70;
            }

            var top = ePageY - adjustY + offsetY;
            var left = ePageX - adjustX + offsetX;
            if (top < 10) {
                top = 10;
            }
            if (left < 10) {
                left = 10;
            }

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
                top = ePageY - pos.height - 20;
                if (top < 0) {
                    top = 0;
                }
                me.menu.css("top", top + "px");
            }
            else if (pos.top < 0) {
                me.menu.css("top", "0px");
            }

            if (pos.right > wpos.width) {
                left = wpos.width - pos.width - 20;
                if (left < 0) {
                    left = 0;
                }
                me.menu.css("left", left + "px");
            }
            else if (pos.left < 0) {
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
            if (settings.autoShow) return;

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
            $("body").append(me.menu);

            var tbl = me.addEl(me.menu, "table");
            var row1 = me.addEl(tbl, "tr");
            var row2 = me.addEl(tbl, "tr");

            var rowX = me.addEl(tbl, "tr");
            var td = me.addEl(rowX, "td", "uw-separator"); td.attr("colspan", 4);

            var row3 = me.addEl(tbl, "tr");
            var td = me.addEl(row3, "td"); td.attr("colspan", 2);
            me.ulReader = me.addEl(td, "ul", "uw-menu-left");
            var td = me.addEl(row3, "td"); td.attr("colspan", 2);
            me.ulSearch = me.addEl(td, "ul", "uw-menu-right");

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

            //--------------------------------------------------------------------------------------

            me.lnkScrollTop =
                me.addCellLink(row1, "Top", function() { //qqqq
                    me.scrollToY(0);
                }, null, "Scroll to top");
            me.lnkScrollBottom =
                me.addCellLink(row2, "Bottom", function() {
                    me.scrollToY($(document).height());
                }, null, "Scroll to bottom");
            me.lnkPopoutAuto =
                me.addCellLink(row1, "Popout", function() {
                    me.doPopoutAuto();
                }, null, "Auto popout");
            me.lnkRunReadrFind =
                me.addCellLink(row2, "Find", function() {
                    me.startFind();
                }, null, "Find an element then choose to read, popout or delete - see help for more info");

            me.lnkMarkElement =
                me.addCellLink(row1, "Mark", function() {
                    var el = $(me.clickEvent.target);
                    me.markElementAndBind(el);
                });
            me.lnkHighlightElement =
                me.addCellLink(row2, "Highlight", function() {
                    me.highlightElement($(me.clickEvent.target));
                });

            me.addCellLink(row1, "Copy", function() {
                me.setClipboard();
            });
            me.lnkTidyOff =
                me.addCellLink(row2, "Tidy off", function() {
                    $.cookie("tidy", "off", { path: '/' });
                    document.location.reload(true);
                }, null, "Turn tidy off and reload").hide();
            me.lnkTidyOn =
                me.addCellLink(row2, "Tidy on", function() {
                    $.cookie("tidy", "on", { path: '/' });
                    me.tidyUp();
                    me.refreshMenu();
                }, null, "Turn tidy on");

            //--------------------------------------------------------------------------------------

            me.lnkLevelUp =
                me.addLink(me.ulReader, "Up", function() {
                    me.levelUp();
                }, null, "Got to URL parent");

            me.lnkClose =
                me.addLink(me.ulReader, "Close", function() {
                    document.location.href = "about:blank";
                }, null, "Got to new tab");

            me.addSeparator(me.ulReader); //--------------------------------------------------------

            me.lnkEnableSelect =
                me.addLink(me.ulReader, "Enable selection", function() {
                    me.enableSelect();
                }, null, "Allow selection of text");

            me.lnkShowImages =
                me.addLink(me.ulReader, "Show images", function() {
                    me.showImages();
                }, null, "Redisplay hidden images").hide();

            me.lnkHideImages =
                me.addLink(me.ulReader, "Hide images", function() {
                    me.hideImages();
                }, null, "Hide all images in the page");

            me.lnkShowLinks =
                me.addLink(me.ulReader, "Show links", function() {
                    me.showLinks();
                }, null, "Show hidden links").hide();

            me.lnkHideLinks =
                me.addLink(me.ulReader, "Hide links", function() {
                    me.hideLinks();
                }, null, "Hide link underlines");

            me.addSeparator(me.ulReader); //--------------------------------------------------------

            me.lnkRunReadrFull =
                me.addLink(me.ulReader, "Read", function() { //normal = hide fixed + style all p's
                    var el = $(me.clickEvent.target);
                    me.doReadFromElement(el);
                    me.clearSelection();
                    me.scrollToElement(el);
                }, null, "Tidy + set font for elements with same width");

            me.lnkUndoReadr =
                me.addLink(me.ulReader, "Undo read", function() {
                    me.undoPopout();
                    me.undoRead();
                }, null, "Remove reading styles, highlights and popout");

            me.userStyleSeparator = me.addSeparator(me.ulReader); //--------------------------------

            me.lnkReloadStyle =
                me.addLink(me.ulReader, "Reload style", function() {
                    settings.uniqueUrls = 1;
                    me.loadUserStyle();
                }, null, "Reload the user style");

            me.lnkReloadStyleOnDblClick =
                me.addLink(me.ulReader, "Reload dblclick", function() {
                    $("body").bind("dblclick.uw-find", function() {
                        me.run(function() {
                            settings.uniqueUrls = 1;
                            me.loadUserStyle();
                        });

                        me.clearSelection();
                        me.hideMenu();
                    });

                    me.reloadStyleOnDblClickIsBound = true;
                    me.lnkReloadStyleOnDblClick.hide();
                    me.lnkReloadStyleOnDblClickOff.show();
                    settings.uniqueUrls = 1;
                    me.loadUserStyle();
                }, null, "Reload the user style on dblclick");

            me.lnkReloadStyleOnDblClickOff =
                me.addLink(me.ulReader, "Reload cancel", function() {
                    $("body").unbind("dblclick.uw-find");
                    me.lnkReloadStyleOnDblClick.show();
                    me.lnkReloadStyleOnDblClickOff.hide();
                }, null, "Stop reloading the user style on dblclick").hide();

            me.lnkOpenStyle =
                me.addLink(me.ulReader, "Open style", function() {
                    me.openUserStyle();
                }, null, "Open user style in new tab");

            me.lnkUnloadStyle =
                me.addLink(me.ulReader, "Unload style", function() {
                    me.unloadUserStyle();
                }, null, "Unload the user style");

            me.addSeparator(me.ulReader); //--------------------------------------------------------

            me.addLink(me.ulReader, "Help", function() {
                me.showHelp();
            });

            var u = encodeURIComponent(window.location.href);
            var title = encodeURIComponent(window.document.title);
            var prefix = "https://getpocket.com/edit?";
            var pocketUrl = prefix + "url=" + u + "&title=" + title;
            me.addLink(me.ulSearch, "Add to Pocket", null, pocketUrl);
            me.addLink(me.ulSearch, "Browse URL", function() { me.navigateTo(me.selectedText); });

            me.addSeparator(me.ulSearch); //--------------------------------------------------------
            me.addLink(me.ulSearch, "Google", function() { me.openSearch("https://www.google.co.uk/search?q=TESTSEARCH"); });
            me.addLink(me.ulSearch, "Google Define", function() { me.openSearch("https://www.google.co.uk/search?q=define:TESTSEARCH"); });
            me.addLink(me.ulSearch, "Google Maps", function() { me.openSearch("https://maps.google.co.uk/maps?q=TESTSEARCH"); });
            me.addLink(me.ulSearch, "Google Images", function() { me.openSearch("https://www.google.co.uk/search?tbm=isch&q=TESTSEARCH"); });

            me.addSeparator(me.ulSearch); //--------------------------------------------------------
            me.addLink(me.ulSearch, "Stack Overflow", function() { me.openSearch("https://www.google.co.uk/search?q=site%3Astackoverflow.com+TESTSEARCH"); });
            me.addLink(me.ulSearch, "Super User", function() { me.openSearch("https://www.google.co.uk/search?q=site%3Asuperuser.com+TESTSEARCH"); });
            me.addLink(me.ulSearch, "Stack Exchange", function() { me.openSearch("https://www.google.co.uk/search?q=site%3Astackexchange.com+TESTSEARCH"); });

            me.addSeparator(me.ulSearch); //--------------------------------------------------------
            me.addLink(me.ulSearch, "Twitter", function() { me.openSearch("https://twitter.com/search?q=TESTSEARCH&src=typd"); });
            me.addLink(me.ulSearch, "Wikipedia", function() { me.openSearch("https://en.m.wikipedia.org/wiki/Special:Search?search=TESTSEARCH&go=Go"); });
            me.addLink(me.ulSearch, "Amazon", function() { me.openSearch("http://www.amazon.co.uk/s/ref=nb_sb_noss_1?url=search-alias%3Daps&field-keywords=TESTSEARCH&x=0&y=0"); });
            me.addLink(me.ulSearch, "Reddit", function() { me.openSearch("https://www.reddit.com/search?q=TESTSEARCH"); });

            me.refreshMenu();
        };

        me.addEl = function(parent, tag, className, text) { //qqq move / replace addElement
            var el = $("<" + tag + ">");

            if (className != null) {
                el.addClass(className);
            }

            if (text != null) {
                el.text(text);
            }

            if (parent != null) {
                parent.append(el);
            }

            return el;
        };

        me.addCellLink = function(parent, text, fn, href, title) { //qqqq merge
            var td = $("<td>")
                .append($("<a>" + text + "</a>")
                    .click(function() { me.run(fn); }));

            if (href != null) td.find("a").prop("href", href);
            if (title != null) td.prop("title", title);

            parent.append(td);
            return td;
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

        me.addSeparator = function(parent) {
            var li = $("<li>")
                .addClass("uw-separator");

            parent.append(li);
            return li;
        };

        me.refreshMenu = function() {
            if (me.menu) {
                if (me.imagesHidden) {
                    me.lnkShowImages.show();
                    me.lnkHideImages.hide();
                }
                else {
                    me.lnkShowImages.hide();
                    me.lnkHideImages.show();
                }

                if (me.linksHidden) {
                    me.lnkShowLinks.show();
                    me.lnkHideLinks.hide();
                }
                else {
                    me.lnkShowLinks.hide();
                    me.lnkHideLinks.show();
                }

                if (me.foundUserStyle) {
                    me.userStyleSeparator.show();
                    me.lnkReloadStyle.show();

                    if (!me.reloadStyleOnDblClickIsBound) {
                        me.lnkReloadStyleOnDblClick.show();
                    }
                }
                else {
                    me.userStyleSeparator.hide();
                    me.lnkReloadStyle.hide();
                    me.lnkReloadStyleOnDblClick.hide();
                }

                if (me.activeUserStyle) {
                    me.lnkOpenStyle.show();
                    me.lnkUnloadStyle.show();
                }
                else {
                    me.lnkOpenStyle.hide();
                    me.lnkUnloadStyle.hide();
                }

                if (me.tidyBound) {
                    me.lnkTidyOff.show();
                    me.lnkTidyOn.hide();
                }
                else {
                    me.lnkTidyOff.hide();
                    me.lnkTidyOn.show();
                }
            }
        };

        me.showHelp = function(e) {
            me.addStyles();
            var pop = $("<div class='uw-help'>"); //qq
            pop.html(
                "<table>" +
                    "<tr><th>General...</th></tr>" +
                    "<tr><td>Ctrl+Enter</td><td>Auto popout</td></tr>" +
                    "<tr><td>`</td><td>Toggle...</td></tr>" +
                    "<tr><td></td><td>Read lite</td></tr>" +
                    "<tr><td></td><td>Read</td></tr>" +
                    "<tr><td></td><td>Read large</td></tr>" +
                    "<tr><td></td><td>Undo reading</td></tr>" +
                    "<tr><td>Alt+`</td><td>Show menu</td></tr>" +
                    "<tr><td>Ctrl+`</td><td>Find element</td></tr>" +
                    "<tr><td>Shift+`</td><td>Undo read</td></tr>" +
                    "<tr><td>Ctrl+Shift+`</td><td>Toggle user style</td></tr>" +
                    "<tr><td>F2</td><td>Mark / resume marking</td></tr>" +
                    "<tr><td>Ctrl+Shift+Alt+?</td><td>Show help</td></tr>" +
                    "<tr><td>&nbsp;</td></tr>" +
                    "<tr><th>Marking...</th></tr>" +
                    "<tr><td>Left or k</td><td>Previous paragraph</td></tr>" +
                    "<tr><td>Right or j</td><td>Next paragraph</td></tr>" +
                    "<tr><td>Esc</td><td>Cancel marking</td></tr>" +
                    "<tr><td>&nbsp;</td></tr>" +
                    "<tr><th>Finding...</th></tr>" +
                    "<tr><td>r</td><td>Read</td></tr>" +
                    "<tr><td>m</td><td>Mark</td></tr>" +
                    "<tr><td>h</td><td>Highlight</td></tr>" +
                    "<tr><td>p / Enter / RC</td><td>Popout</td></tr>" +
                    "<tr><td>d / Del</td><td>Delete elements</td></tr>" +
                    "<tr><td>Esc</td><td>Cancel find</td></tr>" +
                    "<tr><td>Right / Left</td><td>Next / previous node</td></tr>" +
                "</table>"
            );

            var cls = $("<div class='uw-help-button'>")
                .text("Close")
                .click(function(e) {
                    pop.remove();
                    return false;
                });
            pop.append(cls);
            $("body").append(pop);
        };

        /*** menu actions ********************************************************************************************* */

        me.hideImages = function() {
            $("img").hide();
            me.imagesHidden = true;
            me.refreshMenu();
        };

        me.showImages = function() {
            $("img").show();
            me.imagesHidden = false;
            me.refreshMenu();
        };

        me.hideLinks = function() {
            $("a").attr("style", "text-decoration: none !important");
            me.linksHidden = true;
            me.refreshMenu();
        };

        me.showLinks = function() {
            $("a").attr("style", "background-color: lime !important");
            $(".uw-menu a").attr("style", null);
            me.linksHidden = false;
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

            me.clearSelection();
            me.hideMenu();
        };

        me.setClipboard = function(url) {
            var text = trim(me.selectedText);
            try {
                GM.setClipboard(text);
            }
            catch(ex1) {
                try {
                    GM_setClipboard(text);
                }
                catch(ex2) {
                    log(ex2);
                }
            }
        };

        me.openSearch = function(url) {
            window.open(url.replace("TESTSEARCH", encodeURIComponent(trim(me.selectedText)).replace(/%20/g, "+")), "", "");
        };

        me.navigateTo = function(url) {
            url = trim(url);
            if (url.indexOf("http") != 0) {
                url = "http://" + url;
            }

            window.open(url, "", "");
        };

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
                //----------------------------------------------------------------------------------
                "html body .uw-menu { " +
                    "text-align: left !important;" +
                    "padding: 0 !important;" +
                    "position: absolute;" +
                    "font-family: calibri;" +
                    "font-size: 12px;" +
                    "color: #000;" +
                    "z-index: 999999999;" +
                    "text-align: center;" +
                    "user-select: none;" +
                    "border-collapse: collapse !important;" +
                    "border: solid 1px #000 !important;" + //qqqq
                "}" +
                "html body .uw-menu, html body .uw-menu *, html body .uw-menu ul li a, html body .uw-help td, html body .uw-help th { " +
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
                "html body .uw-menu table, html body .uw-menu table td {" +
                    "border-collapse: collapse !important;" +
                    "vertical-align: top !important;" +
                    "padding: 0 !important;" +
                "}" +
                "html body .uw-menu table td {" +
                    "border: solid 1px #aaa !important;" +
                    "background-color: #eee !important;" +
                "}" +
                "html body .uw-menu ul {" +
                    "display: block !important;" +
                "}" +
                "html body .uw-menu ul, html body .uw-menu li {" +
                    "padding: 0 !important;" +
                    "list-style-type: none !important;" +
                    "list-style: none !important;" +
                    "white-space: nowrap !important;" +
                "}" +
                "html body .uw-menu li {" +
                    "border-top: solid 1px #ddd !important;" +
                    "min-width: 140px !important;" +
                "}" +
                "html body .uw-menu li:last-child {" + //qqq
                    "border-bottom: solid 1px #ddd !important;" +
                "}" +
                "html body .uw-menu .uw-separator {" +
                    "padding: 17px 0 0 0 !important;" +
                    "background-color: #eee !important;" +
                "}" +
                "html body .uw-menu a {" +
                    "text-decoration: none !important;" +
                    "cursor: pointer !important;" +
                    "padding: 2px 10px !important;" +
                    "font-weight: normal !important;" +
                    "display: block !important;" +
                "}" +
                "html body .uw-menu a:hover {" +
                    "background-color: #def !important;" +
                "}" +
                "html body .uw-menu a:visited {" +
                    " color: #000 !important;" +
                "}" +
                //----------------------------------------------------------------------------------
                "html body .uw-container a {" +
                    "text-decoration: underline #ccc !important;" + /* uw-uln */
                    "border-bottom: none !important;" + /* uw-btm */
                "}" +
                "html body.uw-fontB .uw-container a {" +
                    "text-decoration: none !important;" +
                "}" +
                "html body .uw-container h1, html body .uw-container h2, html body .uw-container h3, html body .uw-container h4 {" +
                    "font-family: " + me.fontA.face + ", Comic Sans MS !important;" +
                    "font-weight: bold !important;" +
                    "margin-top: 30px !important;" +
                    "margin-bottom: 10px !important;" +
                "}" +
                "html body .uw-container p, html body p.uw-container {" +
                    "text-indent: " + me.fontA.indent + "px !important;" +
                    "margin-top: 15px !important;" + /* uw-pmgn */
                    "margin-bottom: 15px !important;" +
                "}" +
                "html body.uw-fontB .uw-container p, html body.uw-fontB p.uw-container {" +
                    "text-indent: " + me.fontB.indent + "px !important;" +
                "}" +
                "html body.uw-fontC .uw-container p, html body.uw-fontC p.uw-container {" +
                    "text-indent: " + me.fontC.indent + "px !important;" +
                "}" +
                "html body .uw-container img + * {" +
                    "font-style: italic !important;" +
                "}" +
                "html body .uw-marked {" +
                    "border-top: dotted 1px #f8f !important; padding-top: 5px !important;" +
                "}" +
                "html body .uw-highlight, html body .uw-popout .uw-highlight {" +
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
                "html body .uw-lite {" +
                    "text-align: justify !important;" + /* uw-jfy */
                "}" + //fnt...
                "html body .uw-container, html body .uw-container * {" +
                    "font-family: " + me.fontA.face + ", Comic Sans MS !important;" +
                    "font-size: " + me.fontA.size + "px !important;" +
                    "line-height: " + me.fontA.height + "px !important;" +
                    "font-weight: " + me.fontA.weight + " !important;" +
                    "color: " + me.fontA.color + " !important;" +
                    "font-style: normal !important;" + /* uw-sty */
                    "text-align: justify !important;" + /* uw-jfy */
                "}" +
                "html body.uw-fontB .uw-container, html body.uw-fontB .uw-container * {" +
                    "font-family: " + me.fontB.face + ", Comic Sans MS !important;" +
                    "font-size: " + me.fontB.size + "px !important;" +
                    "line-height: " + me.fontB.height + "px !important;" +
                    "font-weight: " + me.fontB.weight + " !important;" +
                    "color: " + me.fontB.color + " !important;" +
                "}" +
                "html body.uw-fontC .uw-container, html body.uw-fontC .uw-container * {" +
                    "font-family: " + me.fontC.face + ", Comic Sans MS !important;" +
                    "font-size: " + me.fontC.size + "px !important;" +
                    "line-height: " + me.fontC.height + "px !important;" +
                    "font-weight: " + me.fontC.weight + " !important;" +
                    "color: " + me.fontC.color + " !important;" +
                "}" +
                "@media (max-width: 800px) {" +
                    "html body .uw-container, html body .uw-container * {" +
                        "font-family: " + me.fontA.face + ", Comic Sans MS !important;" +
                        "font-size: " + me.fontA.sizeS + "px !important;" +
                        "line-height: " + me.fontA.heightS + "px !important;" +
                        "font-weight: " + me.fontA.weight + " !important;" +
                        "color: " + me.fontA.color + " !important;" +
                    "}" +
                    "html body.uw-fontB .uw-container, html body.uw-fontB .uw-container * {" +
                        "font-family: " + me.fontB.face + ", Comic Sans MS !important;" +
                        "font-size: " + me.fontB.sizeS + "px !important;" +
                        "line-height: " + me.fontB.heightS + "px !important;" +
                        "font-weight: " + me.fontB.weight + " !important;" +
                        "color: " + me.fontB.color + " !important;" +
                    "}" +
                    "html body.uw-fontC .uw-container, html body.uw-fontC .uw-container * {" +
                        "font-family: " + me.fontC.face + ", Comic Sans MS !important;" +
                        "font-size: " + me.fontC.sizeS + "px !important;" +
                        "line-height: " + me.fontC.heightS + "px !important;" +
                        "font-weight: " + me.fontC.weight + " !important;" +
                        "color: " + me.fontC.color + " !important;" +
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
            $("body").removeClass("uw-fontC");
        };

        me.setFontB = function() {
            $("body").removeClass("uw-fontC");
            $("body").addClass("uw-fontB");
            me.readingState = 3;
        };

        me.setFontC = function() {
            $("body").removeClass("uw-fontB");
            $("body").addClass("uw-fontC");
            me.readingState = 4;
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
        me.tidyIsOn = function(e) { return $.cookie("tidy") == "on"; };
        me.tidyIsOff = function(e) { return $.cookie("tidy") == "off"; };
        me.tidyUp = function(e) { //qq
            if (me.tidyUpExclude) return;

            if (me.tidyIsOff()) return;

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

            me.restoreScroll();

            if (!me.tidyBound) {
                me.tidyBound = true;

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
                            log("removing", "id:", id, "; class:", className, ";");
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

                    if (cfg.custom) {
                        log("custom function", cfg.custom);

                        cfg.custom();
                    }

                    window.self.setTimeout(function() {
                        me.run(function() { me.siteConfig(); });
                    }, 6 * 60 * 60 * 1000); //run every 6 hours
                }
            }
        };

        /*** reading ************************************************************************************************** */

        me.readLite = function() { //qq
            me.addStyles();
            $("p").addClass("uw-lite");
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

        me.undoRead = function() { //qq
            me.activeReadr = false;
            me.setFont1();
            $(".uw-lite").removeClass("uw-lite");
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

        me.doPopout = function(el) { //qq
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
            me.forced = me.popoutDiv;
            me.activePopout = true;
            me.refreshMenu();
            me.scrollToY(0);
            me.restoreScroll();
        };

        me.undoPopout = function() {
            if (me.popoutDiv != null) {
                me.popoutDiv.remove();
                me.popoutDiv = null;
                me.scrollToElement($("body"));
                me.marked = $();
                me.forced = $();
            }
            me.activePopout = false;
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
                        el.attr("style", "background-color: orange !important");
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
                switch (e.keyCode) { //qq
                    case 27: //esc
                        me.cancelFind();
                        break;
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
                    case 72: //h > highlight
                        me.found("highlight");
                        break;
                    case 13: //enter > popout
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
                            me.found("popout");
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
                elp.attr("style", "background-color: red !important");
            }
            else {
                elp.attr("style", "background-color: gold !important");
            }

            elp.addClass("uw-find-el");
            me.finder.els.push(elp);
        };

        me.found = function(option) {
            var el = me.finder.el();
            me.cancelFind();

            switch (option) { //qq
                case "force":
                    me.forced = el;
                    me.doRead(el);
                    break;
                case "mark":
                    me.markElementAndBind(el);
                    return;
                case "highlight":
                    me.highlightElement(el);
                    return;
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

            var wh = $(window).height();
            var ot = wh / 2 * 0.5;

            if (wh < 600) ot = 0;

            var top = el.offset().top - 15 - ot;

            me.scrollToY(top);
        };

        me.scrollToY = function(y) {
            window.scroll({
                top: y,
                left: 0,
                behavior: "smooth"
            });
        };

        me.restoreScroll = function() {
            $("html, body").css({overflow: "auto", height: "auto"});
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
