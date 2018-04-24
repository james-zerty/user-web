// ==UserScript==
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
// ==/UserScript==
"use strict";
try {
    var $ = window.$;
    var loadAfter = 100;
    var logPrefix = "[user-web] ";
    var url = document.location.href;

    var settings = { localUrls: 0, uniqueUrls: 0, reloader: 0, autoShow: 0, handleErrors: 1 };
    if (url.match(/localhost.*\/(xhome|dev).*\.htm/i) != null) {
        settings = { localUrls: 0, uniqueUrls: 0, reloader: 0, autoShow: 1, handleErrors: 0 };
    }

    if (navigator.userAgent.indexOf("Mozilla/5.0 (Windows NT 6.3; Win64; x64;" > -1)) {
        settings.localUrls = 1;
    }

    log("url", url.substr(0, 100));
    log("loaded", new Date());
    // log("navigator.userAgent", navigator.userAgent);

    var userWeb = new function () {
        var me = this;

        // config...
        me.filterConfig = [
            { exp: /localhost:44300/i, filter: ".ad, #ad1" },
            { exp: /messengernewspapers\.co\.uk/i, filter: "#__nq__hh" },
            { exp: /(thenib|medium)\.com/i, filter: ".metabar, .postActionsBar, .promoCardWrapper, [data-image-id='1*8Ns0Hg0Tbw8jFjaMLN-qYw.gif']" },
            { exp: /bbc\.co.\uk/i, filter: "#breaking-news-container, .share" },
            { exp: /tumblr\.com/i, filter: ".tumblr_controls, #notes" },
            { exp: /amazon\.co/i, filter: "#dp-ads-middle-3psl, #tellAFriendBox_feature_div, #quickPromoBucketContent, #quickPromoDivId, #sc-new-upsell, #nav-swmslot, #hqpWrapper, #huc-v2-cobrand-stripe, #nav-upnav, #detail-ilm_div" },
        ];

        me.load = function () {
            me.url = document.location.href;

            //fnt
            me.fontA = { 
                large: { size: 17, height: 28, face: "Ubuntu", weight: "300", color: "#222" }, 
                small: { size: 14, height: 23, face: "Ubuntu", weight: "300", color: "#222" } };
            me.fontB = { 
                large: { size: 19, height: 29, face: "Yu Mincho", weight: "300", color: "#000" }, 
                small: { size: 15, height: 22, face: "Yu Mincho", weight: "300", color: "#000" } };

            me.currentFont = 0;
            me.fontSizeCurrent = me.fontA.large.size;
            me.fontRatio = me.fontA.large.height / me.fontA.large.size;

            me.marked = $(); //qqq
            me.readingState = "none";
            me.menuTimeoutTime = 1000;
            me.noRead = me.url.match(/:9000/i) != null;

            me.setReloader();
            me.filterSpam();
            me.loadUserStyle();
            me.bindPageMouse();
            me.bindPageKeyDown();

            if (settings.autoShow) {
                me.run(function () {
                    // me.testFonts();
                    // me.doReadAuto();
                    // me.doPopoutAuto();
                    // throw new Error("test!");
                });
            }
        };

        /*** page events ********************************************************************************************** */

        me.bindPageMouse = function () {
            if (url.match("keep\.google")) return;

            $("html").mousedown(function (e) {
                me.startX = e.pageX;
                me.startY = e.pageY;
            });
            $("html").mouseup(function (e) {
                me.onPageMouseUp(e);
            });
        };

        me.onPageMouseUp = function (e) {
            me.run(function () {
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
                    var text = me.selectedText;
                    var x = e.pageX - me.startX;
                    var y = e.pageY - me.startY;
                    // 0 —— x
                    // |
                    // y
                    if (x < 0 && text.length < 10) { //backwards selection
                        if (me.noRead) return;
                        if (tagName == "INPUT" || tagName == "TEXTAREA") return;
                        var el = $(e.target);
                        me.doReadFromElement(el);
                        me.markElementAndBind(el);
                    }
                    else { //normal selection
                        me.showMenu(e);
                    }
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                }
            });
        };

        me.saveSelection = function (e) {
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

        me.clearSelection = function (e) {
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

        me.bindPageKeyDown = function () {
            if (!me.isPageKeyDownBound) {
                me.isPageKeyDownBound = true;
                $("body").bind("keydown.uw-page", function (e) {
                    me.run(function () {
                        me.onPageKeyDown(e);
                    });
                });
            }
        };

        me.cancelEvent = function (e) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        };
        
        me.onPageKeyDown = function (e) {
            // log("onPageKeyDown", "key:", e.key, " code:", e.keyCode, " ctrl:", e.ctrlKey, " alt:", e.altKey, " shift:", e.shiftKey);
            me.run(function () {
                switch (e.keyCode) {
                    case 192: // ` firefox
                    case 223: // ` chrome
                        if (navigator.userAgent.indexOf("Chrome") > -1 && e.keyCode == 192) return;
                        // Ctrl+Shift+`     toggle user style
                        // `                read cycle
                        // Alt+`            show menu
                        // Ctrl+`           find element
                        // Shift+`          undo read
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
                        else if (e.shiftKey) { //undo read...
                            log("Shift+`", "undo read");
                            me.undoRead();
                        }
                        else if (e.altKey) { //show menu...
                            log("Alt+`", "show menu");
                            me.showMenu(e);
                        }
                        else if (e.ctrlKey) { //find element...
                            log("Ctrl+`", "find element");
                            me.startFind();
                        }
                        else { //reading...
                            switch (me.readingState) {
                                case "none":
                                    log("`", "reading");
                                    me.doReadAuto();
                                    break;
                                case "reading":
                                    if (!me.isFontB()) {
                                        log("`", "reading large");
                                        me.setFontB(); //qqq
                                        me.scrollToElement(me.marked, true);
                                        break;
                                    }
                                    else {
                                        log("`", "reading popout");
                                        me.doPopoutAuto();
                                        break;
                                    }
                                default:
                                    log("`", "reading reset");
                                    me.undoRead();
                                    break;
                            }
                        }
                        
                        return me.cancelEvent(e);
                    case 16: // shift
                    case 17: // ctrl
                    case 18: // alt
                    case 9: // tab?
                        me.hideMenu();
                        return;
                    case 107: // num plus
                        if (e.altKey && e.shiftKey) {
                            me.setAltFontSize(1);
                        }
                        else if (e.ctrlKey && e.altKey) {
                            me.setAltFont(1);
                        }
                        else {
                            var msg = me.getFontMsg();
                            log("++font", msg);
                        }

                        break;
                    case 109: // num minus
                        if (e.altKey && e.shiftKey) {
                            me.setAltFontSize(-1);
                        }
                        else if (e.ctrlKey && e.altKey) {
                            me.setAltFont(-1);
                        }
                        else {
                            var msg = me.getFontMsg();
                            log("--font", msg);
                        }

                        break;
                    case 37: // left
                    case 39: // right
                    case 74: // j
                    case 75: // k
                        if (me.marking) {
                            if (e.ctrlKey || e.shiftKey || e.altKey) return;

                            var fwd = e.keyCode == 39 || e.keyCode == 74;
                            var curr = $(".uw-marked");
                            var next = fwd? curr.next() : curr.prev();

                            if (curr.prop("tagName") == "P") {
                                log("we're reading p's");
                                var ps = $("p");
                                var index = $.inArray(curr[0], ps);
                                next = fwd? $(ps[index+1]) : $(ps[index-1]);
                            }

                            if (next.length == 0) {
                                var p = curr.parent();

                                next = fwd? p.next() : p.prev();

                                if (next.length == 0) {
                                    log("next is empty");
                                    var ps = $("p");
                                    var index = $.inArray(curr[0], ps);
                                    next = fwd? $(ps[index+1]) : $(ps[index-1]);
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
                    case 27: // ESC
                        if (me.marking) {
                            log(e.keyCode, "Cancel Marking");
                            me.markElementCancel();
                            e.preventDefault();
                            e.stopPropagation();
                        }
                        break;
                    default:
                        // log(e.keyCode, "Do nothing");
                        break;
                }

                me.hideMenu();
            });
        };

        /*** menu ui ************************************************************************************************** */

        me.showMenu = function (e) {
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

        me.menuTimeoutSet = function () {
            me.menuTimeoutId = setTimeout(function () {
                me.hideMenu();
            }, me.menuTimeoutTime);
        };

        me.menuTimeoutClear = function () {
            if (typeof me.menuTimeoutId == "number") {
                clearTimeout(me.menuTimeoutId);
                delete me.menuTimeoutId;
            }
        };

        me.hideMenu = function () {
            if (me.menu) {
                me.menu.hide();
                me.menuTimeoutClear();
            }

            me.menuShowing = false;
        };

        me.createMenu = function () {
            if (me.menu) {
                return;
            }

            me.addStyles();
            me.menu = $("<div id='UserWebMenu' class='uw-menu'>");
            me.ulReadr = $("<ul class='uw-menu-left'>");

            me.menu.hover(
                function () { // on hover
                    me.menuTimeoutClear();
                },
                function () { // on exit
                    me.menuTimeoutClear();
                    me.menuTimeoutSet();
                }
            );

            me.menu.bind("click.uw-menu", function (e) {
                me.run(function () {
                    me.hideMenu();
                });
            });

            me.menu.append(me.ulReadr);

            me.linkRunReadrFull =
                me.addLink(me.ulReadr, "Read", function () {
                    me.run(function () { //normal = hide fixed + style all p's
                        var el = $(me.clickEvent.target);
                        me.doReadFromElement(el);
                        me.clearSelection();
                        me.scrollToElement(el);
                    });
                }, null, "Tidy + set font for elements with same width (`)");

            me.linkRunReadrLarge =
                me.addLink(me.ulReadr, "Read Large", function () {
                    me.run(function () { //large = hide fixed + style all p's with large font
                        var el = $(me.clickEvent.target);
                        me.setFontB();
                        me.doReadFromElement(el);
                        me.clearSelection();
                        me.scrollToElement(el);
                    });
                }, null, "Tidy + set large font for elements with same width (``)");

            me.linkRunReadrLite =
                me.addLink(me.ulReadr, "Read Lite", function () {
                    me.run(function () { //lite = hide fixed + justify all p's
                        me.readLite();
                    });
                }, null, "Tidy and justify");

            me.linkRunReadrFind =
                me.addLink(me.ulReadr, "Find...", function () {
                    me.run(function () {
                        me.startFind();
                    });
                }, null, "Find an element then choose to read, popout or delete - see help for more info (Ctrl+`)");

            me.separatorRead1 = me.addSeparator(me.ulReadr).hide();

            me.linkUndoReadr =
                me.addLink(me.ulReadr, "Undo Read", function () {
                    me.run(function () {
                        me.undoRead();
                    });
                }, null, "Remove reading styles and highlights (Shift+`)").hide();

            me.userStyleSeparator = me.addSeparator(me.ulReadr);

            me.linkReloadStyle =
                me.addLink(me.ulReadr, "Reload style", function () {
                    me.run(function () {
                        settings.uniqueUrls = 1;
                        me.loadUserStyle();
                    });
                }, null, "Reload the user style (Ctrl+Shift+`)").hide();

            me.linkReloadStyleOnDblClick =
                me.addLink(me.ulReadr, "Reload dblclick", function () {
                    $("body").bind("dblclick.uw-find", function () {
                        me.run(function () {
                            settings.uniqueUrls = 1;
                            me.loadUserStyle();
                        });

                        me.clearSelection();
                        me.hideMenu();
                    });

                    me.reloadStyleOnDblClickIsBound = true;
                    me.linkReloadStyleOnDblClick.hide();
                    me.linkReloadStyleOnDblClickOff.show();

                    me.run(function () {
                        settings.uniqueUrls = 1;
                        me.loadUserStyle();
                    });
                }, null, "Reload the user style on dblclick").hide();

            me.linkReloadStyleOnDblClickOff =
                me.addLink(me.ulReadr, "Reload cancel", function () {
                    $("body").unbind("dblclick.uw-find");
                    me.linkReloadStyleOnDblClick.show();
                    me.linkReloadStyleOnDblClickOff.hide();
                }, null, "Stop reloading the user style on dblclick").hide();

            me.linkOpenStyle =
                me.addLink(me.ulReadr, "Open style", function () {
                    me.run(function () {
                        me.openUserStyle();
                    });
                }, null, "Open user style in new tab").hide();

            me.linkUnloadStyle =
                me.addLink(me.ulReadr, "Unload style", function () {
                    me.run(function () {
                        me.unloadUserStyle();
                    });
                }, null, "Unload the user style (Ctrl+Shift+`)").hide();

            me.addSeparator(me.ulReadr);

            me.linkEnableSelect =
                me.addLink(me.ulReadr, "Enable selection", function () {
                    me.run(function () {
                        me.enableSelect();
                        me.clearSelection();
                        me.hideMenu();
                    });
                }, null, "Allow selection of text");

            me.linkImagesHide =
                me.addLink(me.ulReadr, "Hide Images", function () {
                    me.run(function () {
                        me.hideImages();
                    });
                }, null, "Hide all images in the page");

            me.linkImagesShow =
                me.addLink(me.ulReadr, "Show Images", function () {
                    me.run(function () {
                        me.showImages();
                    });
                }, null, "Redisplay hidden images").hide();

            me.addSeparator(me.ulReadr);

            me.addLink(me.ulReadr, "Help", function () {
                me.run(function () {
                    me.showHelp();
                });
            });

            me.ulSearch = $("<ul class='uw-menu-right'>");
            me.menu.append(me.ulSearch);

            me.addLink(me.ulSearch, "Copy", function () { me.setClipboard(); });
            me.linkMarkElement =
                me.addLink(me.ulSearch, "Mark", function () {
                    me.run(function () {
                        var el = $(me.clickEvent.target);
                        me.markElementAndBind(el);
                    });
                });
            me.linkResumeMarkElement =
                me.addLink(me.ulSearch, "Resume Marking", function () {
                    me.run(function () {
                        me.markElementAndBind(me.marked);
                    });
                }).hide();
            me.linkHighlightElement =
                me.addLink(me.ulSearch, "Highlight", function () {
                    me.run(function () {
                        me.highlightElement($(me.clickEvent.target));
                    });
                });
            me.addSeparator(me.ulSearch);
            var u = encodeURIComponent(window.location.href);
            var title = encodeURIComponent(window.document.title);
            var prefix = "https://getpocket.com/edit?";
            var pocketUrl = prefix + "url=" + u + "&title=" + title;
            me.addLink(me.ulSearch, "Add to Pocket", null, pocketUrl);
            me.addSeparator(me.ulSearch);
            me.linkNavigateTo = me.addLink(me.ulSearch, "Go to", function () { me.navigateTo(me.selectedText); });
            me.addSeparator(me.ulSearch);
            me.linkSearchTitle = me.addListItem(me.ulSearch, "Search...").addClass("bold");
            me.addLink(me.ulSearch, "Google", function () { me.openSearch("https://www.google.co.uk/search?q=TESTSEARCH"); });
            me.addLink(me.ulSearch, "Google Define", function () { me.openSearch("https://www.google.co.uk/search?q=define:TESTSEARCH"); });
            me.addLink(me.ulSearch, "Google Maps", function () { me.openSearch("https://maps.google.co.uk/maps?q=TESTSEARCH"); });
            me.addLink(me.ulSearch, "Google Images", function () { me.openSearch("https://www.google.co.uk/search?tbm=isch&q=TESTSEARCH"); });
            me.addSeparator(me.ulSearch);
            me.addLink(me.ulSearch, "Stack Overflow", function () { me.openSearch("https://www.google.co.uk/search?q=site%3Astackoverflow.com+TESTSEARCH"); });
            me.addLink(me.ulSearch, "Super User", function () { me.openSearch("https://www.google.co.uk/search?q=site%3Asuperuser.com+TESTSEARCH"); });
            me.addLink(me.ulSearch, "Stack Exchange", function () { me.openSearch("https://www.google.co.uk/search?q=site%3Astackexchange.com+TESTSEARCH"); });
            me.addSeparator(me.ulSearch);
            me.addLink(me.ulSearch, "Twitter", function () { me.openSearch("https://twitter.com/search?q=TESTSEARCH&src=typd"); });
            me.addLink(me.ulSearch, "Wikipedia", function () { me.openSearch("http://en.wikipedia.org/wiki/Special:Search?search=TESTSEARCH&go=Go"); });
            me.addLink(me.ulSearch, "Amazon", function () { me.openSearch("http://www.amazon.co.uk/s/ref=nb_sb_noss_1?url=search-alias%3Daps&field-keywords=TESTSEARCH&x=0&y=0"); });

            $("body").append(me.menu);

            me.refreshMenu();
        };

        me.addLink = function (parent, text, fn, href, title) {
            var li = $("<li>")
                .append($("<a>" + text + "</a>")
                    .click(fn));

            if (href != null) li.find("a").prop("href", href);
            if (title != null) li.prop("title", title);

            parent.append(li);
            return li;
        };

        me.addListItem = function (parent, text) {
            var li = $("<li>")
                .append($("<span>" + text + "</span>"));

            parent.append(li);
            return li;
        };

        me.addSeparator = function (parent) {
            return me.addListItem(parent, "").addClass("uw-separator");
        };

        me.refreshMenu = function () {
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
                }
                else {
                    me.separatorRead1.hide();
                    me.linkUndoReadr.hide();
                }
            }
        };

        me.showHelp = function(e) {
            var pop = $("<div class='uw-help'>");
            pop.html(
                "<table>" +
                    "<tr><th>General...</th></tr>" +
                    "<tr><td>`</td><td>Toggle...</td></tr>" +
                    "<tr><td></td><td>Read</td></tr>" +
                    "<tr><td></td><td>Read large</td></tr>" +
                    "<tr><td></td><td>Popout</td></tr>" +
                    "<tr><td></td><td>Undo reading</td></tr>" +
                    "<tr><td>Alt+`</td><td>Show menu</td></tr>" +
                    "<tr><td>Ctrl+`</td><td>Find element</td></tr>" +
                    "<tr><td>Shift+`</td><td>Undo read</td></tr>" +
                    "<tr><td>Ctrl+Shift+`</td><td>Toggle user style</td></tr>" +
                    "<tr><td>&nbsp;</td></tr>" +
                    "<tr><th>Reading...</th></tr>" +
                    "<tr><td>Ctrl+Alt+Num+</td><td>Change font</td></tr>" +
                    "<tr><td>Ctrl+Alt+Num-</td><td>Change font</td></tr>" +
                    "<tr><td>Shift+Alt+Num+</td><td>Font size +</td></tr>" +
                    "<tr><td>Shift+Alt+Num-</td><td>Font size -</td></tr>" +
                    "<tr><td>&nbsp;</td></tr>" +
                    "<tr><th>Marking...</th></tr>" +
                    "<tr><td>Left or k</td><td>Previous paragraph</td></tr>" +
                    "<tr><td>Right or j</td><td>Next paragraph</td></tr>" +
                    "<tr><td>ESC</td><td>Cancel Marking</td></tr>" +
                    "<tr><td>&nbsp;</td></tr>" +
                    "<tr><th>Finding...</th></tr>" +
                    "<tr><td>f</td><td>Forced read</td></tr>" +
                    "<tr><td>Enter or p</td><td>Popout read</td></tr>" +
                    "<tr><td>DEL</td><td>Delete elements</td></tr>" +
                    "<tr><td>ESC</td><td>Cancel find</td></tr>" +
                    "<tr><td>Right / Left</td><td>Next / Previous node</td></tr>" +
                "</table>"
            );

            var cls =   $("<div class='uw-help-button'>")
                .text("Close")
                .click(function(e) {
                    pop.hide();
                    return false;
                });
            pop.append(cls);
            $("body").append(pop);
        };

        /*** menu actions ********************************************************************************************* */

        me.hideImages = function () {
            $("img").hide();
            me.imageHide = true;
            me.refreshMenu();
        };

        me.showImages = function () {
            $("img").show();
            me.imageHide = false;
            me.refreshMenu();
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

        me.setClipboard = function (url) {
            me.run(function () {
                window.GM.setClipboard(me.selectedText.trim());
            });
        };

        me.openSearch = function (url) {
            me.run(function () {
                window.open(url.replace("TESTSEARCH", encodeURIComponent(me.selectedText.trim()).replace(/%20/g, "+")), "", "");
            });
        };

        me.navigateTo = function (url) {
            me.run(function () {
                url = url.trim();

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
            "Yu Mincho",
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

        me.addStyleElement = function (id, css) {
            $(document.head).append(
                $("<style>")
                    .attr("id", id)
                    .attr("rel", "stylesheet")
                    .attr("type", "text/css")
                    .text(css));
        };

        me.addStyles = function () {
            if (me.addStylesDone) return;
            me.addStylesDone = true;

            me.addStyleElement("uw-css",
                "html body .uw-help { " +
                    "position: fixed; top: 10px; left: 10px; border: solid 1px #000; background-color: #fff; z-index: 9999999; padding: 10px;" +
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
                    "text-decoration: underline dotted #aaa !important;" + /* uw-uln */
                    "border-bottom: none !important;" + /* uw-btm */
                "}" +
                "html body .uw-container h1, html body .uw-container h2, html body .uw-container h3, html body .uw-container h4 {" +
                    "font-family: " + me.fonts[me.currentFont] + ", Comic Sans MS !important;" +
                    "font-weight: bold !important;" +
                    "margin-top: 30px !important;" +
                    "margin-bottom: 10px !important;" +
                "}" +
                "html body .uw-container p, html body p.uw-container {" +
                    "margin-top: 15px !important;" + /* uw-pmgn */
                    "margin-bottom: 15px !important;" +
                "}" +
                "html body.uw-large .uw-container p, html body.uw-large p.uw-container {" +
                    "text-indent: 20px !important;" +
                    "margin-top: 30px !important;" +
                    "margin-bottom: 30px !important;" +
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
                "html body.uw-large .uw-container, html body.uw-large .uw-container * {" +
                    "font-family: " + me.fontB.large.face + ", Comic Sans MS !important;" +
                    "font-size: " + me.fontB.large.size + "px !important;" +
                    "line-height: " + me.fontB.large.height + "px !important;" +
                    "font-weight: " + me.fontB.large.weight + " !important;" +
                    "color: " + me.fontB.large.color + " !important;" +
                "}" +
                "html body .uw-read, html body .uw-read * {" +
                    "color: #888 !important;" +
                "}" +
                "@media (max-width: 700px) {" +
                    "html body .uw-container, html body .uw-container * {" +
                        "font-family: " + me.fontA.small.face + ", Comic Sans MS !important;" +
                        "font-size: " + me.fontA.small.size + "px !important;" +
                        "line-height: " + me.fontA.small.height + "px !important;" +
                        "font-weight: " + me.fontA.small.weight + " !important;" +
                        "color: " + me.fontA.small.color + " !important;" +
                    "}" +
                    "html body.uw-large .uw-container, html body.uw-large .uw-container * {" +
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

        me.getFontMsg = function () {
            return me.fonts[me.currentFont] + " (" + me.fontSizeCurrent + "/" + me.getLineHeight() + ")";
        };

        me.getAltFontCss = function () {
            log("getAltFontCss", me.getFontMsg());

            return "" +
                "html body .uw-container, html body .uw-container * {" +
                    "font-family: " + me.fonts[me.currentFont] + ", Comic Sans MS !important;" +
                    "font-size: " + me.fontSizeCurrent + "px !important;" +
                    "line-height: " + me.getLineHeight() + "px !important;" +
                "}";
        };

        me.setAltFont = function (change) { //fnt
            me.currentFont += change;
            if (me.currentFont >= me.fonts.length) me.currentFont = 0;
            if (me.currentFont < 0) me.currentFont = me.fonts.length - 1;
            me.addStyleElement("uw-set-font", me.getAltFontCss());
        };

        me.setAltFontSize = function (change) {
            me.fontSizeCurrent += change;
            me.addStyleElement("uw-set-font-size", me.getAltFontCss());
        };

        me.setFontA = function () {
            $("body").removeClass("uw-large");
        };

        me.setFontB = function () {
            $("body").addClass("uw-large");
        };

        me.isFontB = function () {
            return $("body").hasClass("uw-large");
        };

        me.getLineHeight = function () {
            return parseInt(me.fontSizeCurrent * me.fontRatio, 10);
        };

        /*** user style *********************************************************************************************** */

        me.loadUserStyle = function () {

            var config = {
                amazon: { exp: /amazon\.co/i },
                bbc_news: { exp: /bbc\.co\.uk\/(news|sport)/i },
                bbc_weather: { exp: /bbc\.co\.uk\/(weather)/i },
                boing_boing: { exp: /boingxboing\.net/i },
                bing_maps: { exp: /bing\.com\/maps/i },
                feedly: { exp: /\/\/feedly\.com/i },
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
                private_eye: { exp: /private-eye\.co\.uk/i },
                reddit: { exp: /reddit\.com/i },
                sonar: { exp: /\:9000/i },
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

        me.loadUserStyleSheet = function (name) {
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

        me.unloadUserStyle = function () {
            me.userStyleSheet.attr("href", "");
            me.activeUserStyle = false;
            me.refreshMenu();
        };

        me.openUserStyle = function () {
            window.open(me.userStyleSheet.attr("href"));
        };

        /*** display ************************************************************************************************** */

        me.tidyUp = function (e) {
            if (me.url.match(/www\.inoreader\.com/i)) return;

            $("*").filter(function() {
                var el = $(this);
                var pos = el.css("position");

                return (pos === "fixed" || pos === "sticky") && el.prop("tagName") != "PICTURE";
            }).attr("style", "display:none !important");
        };

        me.filterSpam = function () {
            for (var i in me.filterConfig) {
                var cfg = me.filterConfig[i];
                if (me.url.match(cfg.exp) != null) {
                    log("filter", cfg.filter);

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
            }
        };

        /*** reading ************************************************************************************************** */

        me.readLite = function (e) {
            me.tidyUp();
            $("p").css({"text-align" : "justify"});
        };

        me.doReadAuto = function() {
            var main = me.getMainAuto();
            me.doRead(main);
            var el = main.find("p:first");
            if (me.marked.length > 0) el = me.marked;
            me.markElementAndBind(el); //qqq
        };

        me.doReadFromElement = function(el) {
            var main = me.getMainFromElement(el);
            if (main == null || main.length == 0) return;
            me.doRead(main);
        };

        me.doRead = function(main) {
            me.readingState = "reading";
            me.addStyles();
            me.tidyUp();
            main.addClass("uw-container");
            me.activeReadr = true;
            me.refreshMenu();
        };

        me.undoRead = function () {
            if (me.popoutDiv != null) {
                me.popoutDiv.remove();
                me.scrollToElement($("body"));
            }
            me.activePopout = false;
            me.activeReadr = false;
            me.readingState = "none";
            me.setFontA();
            $(".uw-container").removeClass("uw-container");
            //qqq $(".uw-marked").removeClass("uw-marked");
            me.markElementCancel();
            me.refreshMenu();
        };

        me.doPopoutAuto = function() {
            var main = me.getMainAuto();
            if (main && main.length > 0) {
                me.doPopout(main);
            }
        };

        me.doPopout = function (el) {
            me.tidyUp();
            me.addStyles();
            me.setFontB();
            me.readingState = "popout";
            me.activeReadr = true;

            var rem = el.find("iframe, script, link, button, input, form, textarea, aside").remove();
            // rem.each(function () { log($(this).html()); });

            var exclude = /share|sharing|social|twitter|tool|^side|related|comment|discussion|extra|contentWellBottom|kudo|^ad|keywords|secondary-column$|furniture|hidden|embedded-hyper/gi;
            var hid = el.find("*").filter(function () {
                return (typeof (this.className) == "string" && this.className.match(exclude) !== null) ||
                    (typeof (this.id) == "string" && this.id.match(exclude) !== null) ||
                    $(this).css("visibility") == "hidden" ||
                    $(this).css("display") == "none";
            });
            // hid.each(function () { log("removed", $(this).html().substr(0, 100)); });
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
        
            var el = $(".uw-popout p:first");
            me.markElementAndBind(el); //qqq

            me.activePopout = true;
            me.refreshMenu();
        };

        /*** content ************************************************************************************************** */

        me.getMainAuto = function() {
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

        me.getMainFromElement = function (el, original) {
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

        me.startFind = function () {
            me.clearSelection();
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
                function (e) {
                    me.run(function () {
                        $("body").unbind("mouseup.uw-find-first");
                        var el = $(e.target);
                        me.finder.els.push(el);
                        el.css("background-color", "orange");
                        log("uw find", "adding bindings");

                        $("body").bind("keyup.uw-find", me.onFindingKeyUp);
                        $("body").bind("mouseup.uw-find", me.onFindingMouseUp);

                        document.oncontextmenu = function () {
                            return false;
                        };
                    });
                }
            );

            me.refreshMenu();
        };

        me.onFindingKeyUp = function (e) {
            me.run(function () {
                switch (e.keyCode) {
                    case 27: //esc
                        me.cancelFind();
                        break;
                    case 70: //f > force
                        me.found("force");
                        break;
                    case 68: //d
                    case 46: //DEL
                        me.found("remove");
                        break;
                    case 13: //enter
                    case 80: //p > popout
                        me.found("popout");
                        break;
                    case 37: //back
                        if (me.finder.el() != me.finder.el0()) {
                            me.finder.el().css("background-color", "");
                            me.finder.els.pop();
                            //me.finder.el = me.finder.els[me.finder.els.length - 1];
                        }
                        break;
                    case 39: //forward
                        me.findParent();
                        break;
                }
            });
        };

        me.onFindingMouseUp = function (e) {
            me.run(function () {
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
                        setTimeout(function () {
                            me.found("remove");
                        }, 1);
                        break;
                }
            });
        };

        me.findParent = function () {
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

        me.found = function (option) {
            var el = me.finder.el();
            me.cancelFind();

            switch (option) {
                case "force":
                    me.doRead(el);
                    break;
                case "remove":
                    el.remove();
                    return;
                case "popout":
                    me.doPopout(el);
                    return;
            }
        };

        me.cancelFind = function () {
            $(".uw-find-el").css("background-color", "");
            me.finder.el0().css("background-color", "");
            $("*").unbind(".uw-find");
            me.setReloader();
            me.finder = null;
        };

        /*** mark and highlight *************************************************************************************** */

        me.markElementAndBind = function (el) {
            if (!me.marking) {
                me.marking = true;
                if (me.linkResumeMarkElement) {
                    me.linkResumeMarkElement.show();
                }
                $("body").bind("mouseup.uw-marking", me.markElementMouseUp);
                $("body").bind("keyup.uw-marking", me.markElementKeyUp);
                $("body").bind("dblclick.uw-marking", me.markElementCancel);
                
                document.oncontextmenu = function () {
                    me.markElementCancel();
                    return false;
                };
            }

            me.markElement(el);
        };

        me.markElementKeyUp = function (e) {
            me.run(function () {
                switch (e.keyCode) {
                    case 27: //esc
                        me.markElementCancel();
                        break;
                }
            });
        };

        me.markElementCancel = function () {
            if (me.marking) {
                log("markElementCancel");
                me.marking = false;
                $("body").unbind("mouseup.uw-marking");
                $("body").unbind("keyup.uw-marking");
                $("body").unbind("dblclick.uw-marking");
                me.scrollToElement(me.marked, true);
            }

            me.setReloader();
        };

        me.markElement = function (target) {
            me.clearSelection();
            $(".uw-marked").removeClass("uw-marked");
            if (target.prop("tagName") != "P" && target.parent().prop("tagName") == "P") target = target.parent();
            me.marked.addClass("uw-read");
            me.marked = target;
            target.removeClass("uw-read").addClass("uw-marked");
            me.scrollToElement(target);
        };

        me.markElementMouseUp = function (e) {

            //if we're selecting text then cancel marking...
            var x = e.pageX - me.startX;
            var y = e.pageY - me.startY;
            if (x < -5 || y < -5 || x > 5 || y > 5) {
                me.markElementCancel();
                return;
            }

            switch (e.button) {
                case 0: //chrome
                    me.run(function () {
                        me.markElement($(e.target));
                    });
                    break;
                case 1:
                    if (document.all) { //IE
                        me.run(function () {
                            me.markElement($(e.target));
                        });
                    }
                    break;
                case 2: //right click
                    break;
            }
        };

        me.highlightElement = function (target) {
            me.clearSelection();
            if (target.prop("tagName") != "P" && target.parent().prop("tagName") == "P") target = target.parent();
            target.addClass("uw-highlight");
        };

        /*** utils **************************************************************************************************** */

        me.getUrl = function (path) {
            var unique = settings.uniqueUrls ? "?" + new Date().valueOf() : "";
            return me.getRoot() + path + unique;
        };

        me.getRoot = function () {
            return settings.localUrls ? "https://localhost:44300/" : "https://rawgit.com/james-zerty/user-web/master/";
        };

        me.isSmall = function () {
            return $(window).width() < 700;
        };

        me.run = function (fn) {
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

        me.elToString = function (el) {
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

        me.scrollToElement = function (el, instant) {
            if (el == null || el.length == 0) return;
            
            var top = el.offset().top - 15;
            
            if (instant) {
                $('html, body').scrollTop(top);
            }
            else {
                $("html, body").animate({ scrollTop: top });
            }
        };

        /*** dev ****************************************************************************************************** */

        me.setReloader = function() {
            if (settings.reloader) {
                document.oncontextmenu = function (e) {
                    document.location.reload(true);
                    return false;
                };
            }
            else {
                document.oncontextmenu = null;
            }
        };

        me.testFonts = function () {
            //test normal...
            me.fontSizeCurrent = me.fontA.small.size;
            me.fontRatio = me.fontA.small.height / me.fontA.small.size;
            //test large...
            me.fontSizeCurrent = me.fontB.large.size;
            me.fontRatio = me.fontB.large.height / me.fontB.large.size;

            me.addStyles();

            var doc = [];
            doc.push("<div class='uw-popout uw-container'>");
            var len = me.fonts.length;
            for (var i = 0; i < len; i++) {
                var msg = me.getFontMsg();
                doc.push(" <h4>" + msg + "</h4>");
                doc.push(" <p style='font-family:" + me.fonts[i] + ", Comic Sans MS !important;'>");
                doc.push(" Wikipedia began as a complementary project for Nupedia, a free online English-language encyclopedia project whose articles were written by experts and reviewed under a formal process. Nupedia was founded on March 9, 2000, under the ownership of Bomis, a web portal company. Its main figures were the Bomis CEO Jimmy Wales and Larry Sanger, editor-in-chief for Nupedia and later Wikipedia. Nupedia was licensed initially under its own Nupedia Open Content License, switching to the GNU Free Documentation License before Wikipedia's founding at the urging of Richard Stallman. Sanger and Wales founded Wikipedia. While Wales is credited with defining the goal of making a publicly editable encyclopedia, Sanger is credited with the strategy of using a wiki to reach that goal. On January 10, 2001, Sanger proposed on the Nupedia mailing list to create a wiki as a feeder project for Nupedia.");
                doc.push(" </p>");
            }
            doc.push("</div>");
            var html = doc.join("");

            document.body.insertAdjacentHTML("afterbegin", html);
            me.popoutDiv = $(".uw-popout");
            me.scrollToElement(me.popoutDiv);

            me.activePopout = true;
            me.refreshMenu();
        };

    }();

    /* ================================================== */

    window.self.setTimeout(function () {
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
            logPopup.oncontextmenu = function (e) {
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

    text1 = text1.toString().trim();
    text2 = text2.toString().trim().replace(/( >>$)/g, "");

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
        if (window.console) {
            window.console.log(logPrefix + text1, text2);
        }
        else {
        }

        if (doPop) {
            popup(logPrefix + text1 + text2);
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
/* == utils END ============================================================= */