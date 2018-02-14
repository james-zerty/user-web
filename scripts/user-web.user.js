// ==UserScript==
// @name        user-web
// @description insert user styles
// @namespace   https://github.com/james-zerty/
// @version     15
// @author      2010+, james_zerty
// @grant       GM.setClipboard
// @noframes
// @include     http*://*/*
// @exclude     https://mailxx.google.com*
// @require     https://rawgit.com/james-zerty/user-web/master/scripts/jquery/jquery-2.1.0.js
// ==/UserScript==
"use strict";

try {
    var loadAfter = 1000;
    var logPrefix = "[user-web] ";
    var url = document.location.href;
    var isTop = window.top == window.self || url.toLowerCase().indexOf("inoreader") > -1 || url.toLowerCase().indexOf("home.htm") > -1;
    log("url", url.substr(0, 100));
    log("istop", isTop);

    if (isTop) {
        var userWeb = new function () {
            var me = this;

            // config...
            me.adblockConfig = [
                { exp: /localhost:44300/i, filter: ".some-ad" },
                { exp: /messengernewspapers\.co\.uk/i, filter: "#__nq__hh" },
                { exp: /(thenib|medium)\.com/i, filter: ".metabar, .postActionsBar, .promoCardWrapper, [data-image-id='1*8Ns0Hg0Tbw8jFjaMLN-qYw.gif']" },
                { exp: /bbc\.co.\uk/i, filter: "#breaking-news-container, .share" },
                { exp: /tumblr\.com/i, filter: ".tumblr_controls, #notes" },
                { exp: /amazon\.co/i, filter: "#dp-ads-middle-3psl, #tellAFriendBox_feature_div, #quickPromoBucketContent, #quickPromoDivId, #sc-new-upsell, #nav-swmslot, #hqpWrapper, #huc-v2-cobrand-stripe, #nav-upnav, #detail-ilm_div" },
            ];

            me.adblock = function () {
                for (var i in me.adblockConfig) {
                    var cfg = me.adblockConfig[i];

                    if (me.url.match(cfg.exp) != null) {
                        log("filter", cfg.filter);

                        $(cfg.filter).each(function(i) {
                            log("removing", i, " - #", this.id, " - ", this.className);
                            $(this).remove();
                        });

                        me.addStyle(
                            cfg.filter + ' { display: none !important; }'
                        );
                    }
                }
            }

            me.load = function () {
                me.url = document.location.href;
                me.isLinux = navigator.userAgent.indexOf("Linux") > -1;
                me.fontSize = 16; //fnt
                me.fontSizeSmall = 14;
                me.fontRatio = 1.5;
                me.menuTimeoutTime = 1000;
                me.noRead = me.url.match(/:9000/i) != null;

                //log("navigator.userAgent", navigator.userAgent);

                me.debug = { localUrls: 0, uniqueUrls: 0, reloader: 0, autoShow: 0 };

                if (me.url.match(/localhost.*\/(home|testlocal)\.htm/i) != null) {
                    me.debug = { localUrls: 0, uniqueUrls: 0, reloader: 0, autoShow: 0 };
                }

                /*
                    Windows NT 10.0 > Windows 10
                    Windows NT 6.3  > Windows 8.1
                    Windows NT 6.2  > Windows 8
                    Windows NT 6.1  > Windows 7
                */
                if (navigator.userAgent.indexOf("Mozilla/5.0 (Windows NT 6.3; Win64; x64;" > -1)) {
                    me.debug.localUrls = 1;
                }

                if (me.debug.reloader) {
                    document.oncontextmenu = function (e) {
                        document.location.reload(true);
                        return false;
                    };
                }

                me.loadUserStyle();
                me.bindMouse();
                me.adblock();
                me.bindOnKeyDown();//qq1

                if (me.debug.autoShow) {
                    me.run(function () {
                        var e = {
                            pageX: 400,
                            pageY: 300,
                            target: $("p")[0]
                        };

                        //TODO: wrap this up...
                        me.selectedText = "test";
                        me.showMenu(e);
                        me.hideMenu();
                        me.tidyUp();
                        me.runReadr(e);
                        me.markElementAndBind(e);
                    });
                }

                // me.addStyles();
                // me.showHelp();
            };

            me.getRoot = function () {
                return me.debug.localUrls ? "https://localhost:44300/" : "https://rawgit.com/james-zerty/user-web/master/";
            }

            me.isSmall = function () {
                return $(window).width() < 800;
            }

            me.run = function (fn) {
                try {
                    fn();
                }
                catch (ex) {
                    log(ex);
                }
            };

            me.saveSelection = function (e) {
                var text = "";

                if ($(e.target).is("input[type='text']") || $(e.target).is("textarea")) {
                    text = me.getTextFieldSelection(e.target);
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

            me.getTextFieldSelection = function (textField) {
                return textField.value.substring(textField.selectionStart, textField.selectionEnd);
            };

            /* events ********************************************************************************************************************** */

            me.bindMouse = function () {
                if (url.match("keep\.google")) return;

                $('html').mousedown(function (e) {
                    me.startX = e.pageX;
                    me.startY = e.pageY;
                });
                $('html').mouseup(function (e) {
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

                            //log("showing", e.target.tagName, e.target, e.pageX, e.pageY);

                            var text = me.selectedText;
                            if (text.length > 20) {
                                text = text.substr(0, 20) + "...";
                            }

                            var x = e.pageX - me.startX;
                            var y = e.pageY - me.startY;
                            log("x,y = ", x, ",", y);

                            // 0 —— x
                            // |
                            // y
                            if (x < 0 && text.length < 10) { //backwards selection //qq
                            //if (((x < 0 && y <= 10) || (y <= -10)) && text.length < 100) { //backwards selection //qq-selection
                                if (me.noRead) return;
                                if (tagName == "INPUT" || tagName == "TEXTAREA") return;
                                me.createMenu();
                                me.tidyUp();
                                var $target = $(e.target);
                                me.doRead($target.width(), 50, "readr-container");
                                me.markElementAndBind(e);
                                me.hideMenu();
                            }
                            else { //normal selection
                                me.showMenu(e);
                                me.bindMenuClick();
                            }

                            e.preventDefault();
                            e.stopPropagation();
                            return;
                        }
                    });
                });
            };

            me.bindMenuClick = function () {
                if (!me.isClickBound) {
                    me.isClickBound = true;

                    me.menu.bind("click", function (e) {
                        me.run(function () {
                            me.onMenuClick(e);
                        });
                    });
                }
            };

            me.onMenuClick = function (e) {
                me.hideMenu();
            };

            me.bindOnKeyDown = function () {
                if (!me.isKeyDownBound) {
                    me.isKeyDownBound = true;

                    $('body').bind("keydown", function (e) {
                        me.run(function () {
                            me.onKeyDown(e);
                        });
                    });
                }
            };

            me.countGrave = 0;
            me.onKeyDown = function (e) {
                //log("onKeyDown", e.keyCode, e.ctrlKey);
                me.run(function () {
                    switch (e.keyCode) {
                        case 191: // /
                            if (me.menuShowing) {
                                me.showHelp();
                            }
                            break;
                        case 192: // `
                            // Ctrl+Shift+`     toggle user style
                            // `                read lite
                            // Alt+`            show menu
                            // Ctrl+`           find element
                            // Shift+`          undo read

                            if (e.ctrlKey && e.shiftKey) { //toggle user style...
                                log("Ctrl+Shift+`", "toggle user style");
                                if (me.activeUserStyle) {
                                    me.unloadUserStyle();
                                }
                                else
                                {
                                    me.debug.uniqueUrls = 1;
                                    me.loadUserStyle();
                                }
                            }
                            else if (e.shiftKey) { //undo read...
                                log("Shift+`", "undo read");
                                me.undoReadr(); //qq1
                                if (me.marking) {
                                    me.markElementCancel();
                                }
                            }
                            else if (e.altKey) { //show menu...
                                log("Alt+`", "show menu");
                                me.showMenu(e);
                                return;
                            }
                            else if (e.ctrlKey) { //find element...
                                log("Ctrl+`", "find element");
                                me.runReadr(null, { find: true });
                                return;
                            }
                            else { //read lite...
                                if (me.countGrave == 0) { //qqqqq
                                    log("`", "Read Lite");
                                    me.readLite();
                                }
                                else if (me.countGrave == 1) {
                                    me.run(function () { //Medium = hide fixed + style all p's
                                        me.tidyUp();
                                    me.setFont(0);
                                        me.doRead(500, 400, "readr-container");
                                    });
                                }
                                else if (me.countGrave == 2) {
                                  me.setFontSize(2);
                                    me.setFont(1);
                                }
                                else {
                                    me.setFont(1);
                                }
                                me.countGrave++;
                            }
                            break;
                        case 16: // shift
                        case 17: // ctrl
                        case 18: // alt
                        case 9: // tab?
                            me.hideMenu();
                            return;
                        case 107: // num plus
                            if (e.altKey && e.shiftKey) {
                                me.setFontSize(1);
                            }
                            else if (e.ctrlKey && e.altKey) {
                                me.setFont(1);
                            }

                            break;
                        case 109: // num minus
                            if (e.altKey && e.shiftKey) {
                                me.setFontSize(-1);
                            }
                            else if (e.ctrlKey && e.altKey) {
                                me.setFont(-1);
                            }

                            break;
                        case 32: // space
                            if (me.menuShowing) {
                                me.runReadr(me.clickEvent);
                                e.preventDefault();
                                e.stopPropagation();
                            }

                            break;
                        case 37: // left
                        case 39: // right
                        case 74: // j
                            if (me.marking) {
                                var fwd = e.keyCode != 37;
                                var curr = $(".readr-marked");
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

                                if (next.is(':hidden') || next.css("visibility") == "hidden" || next.text().length == 0) {
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
                            //log(e.keyCode, "Do nothing");
                            break;
                    }

                    me.hideMenu();
                });
            };

            me.scrollToElement = function (el) {
                var offset = el.offset();
                offset.top -= me.isSmall() ? 15 : 15;
                $('html, body').animate({
                    scrollTop: offset.top
                });
            };

            /* display ********************************************************************************************************************** */

            me.showHelp = function(e) {
                var pop = $("<div class='user-web-help'>");
                pop.html(
                    "<table>" +
                        "<tr><td>`</td><td>read lite</td></tr>" +
                        "<tr><td>Alt+`</td><td>show menu</td></tr>" +
                        "<tr><td>Ctrl+`</td><td>find element</td></tr>" +
                        "<tr><td>Shift+`</td><td>undo read</td></tr>" +
                        "<tr><td>Ctrl+Shift+`</td><td>toggle user style</td></tr>" +
                        "<tr><td>&nbsp;</td></tr>" +
                        "<tr><td>Ctrl+Alt+NumPlus</td><td>change font</td></tr>" +
                        "<tr><td>Ctrl+Alt+NumMinus</td><td>change font</td></tr>" +
                        "<tr><td>Shift+Alt+Num+</td><td>font size +</td></tr>" +
                        "<tr><td>Shift+Alt+Num-</td><td>font size -</td></tr>" +
                        "<tr><td>&nbsp;</td></tr>" +
                        "<tr><th>Menu...</th></tr>" +
                        "<tr><td>/</td><td>Help</td></tr>" +
                        "<tr><td>Space</td><td>Run Readr</td></tr>" +
                        "<tr><td>&nbsp;</td></tr>" +
                        "<tr><th>Marking...</th></tr>" +
                        "<tr><td>Left</td><td>Previous paragraph</td></tr>" +
                        "<tr><td>Right or j</td><td>Next paragraph</td></tr>" +
                        "<tr><td>ESC</td><td>Cancel Marking</td></tr>" +
                        "<tr><td>&nbsp;</td></tr>" +
                        "<tr><th>Finding...</th></tr>" +
                        "<tr><td>ESC</td><td>Cancel</td></tr>" +
                        "<tr><td>Enter</td><td>Forced</td></tr>" +
                        "<tr><td>DEL</td><td>Delete elements</td></tr>" +
                        "<tr><td>p</td><td>Popout</td></tr>" +
                        "<tr><td>Right / Left</td><td>Next / Previous node</td></tr>" +
                    "</table>"
                );

                var cls =   $("<div class='user-web-help-button'>")
                    .text("Close")
                    .click(function(e) {
                        pop.hide();
                        return false;
                    });
                pop.append(cls);
                $('body').append(pop);
            };

            me.tidyUp = function (e) {
                if (me.url.match(/inoreader\.com/i)) return;

                $('*').filter(function() {
                    var el = $(this);
                    var pos = el.css("position");

                    return (pos === 'fixed' || pos === 'sticky') && el.prop("tagName") != "PICTURE";
                }).attr('style','display:none !important');
            };

            me.readLite = function (e) {
                me.tidyUp();
                $("p").css({"text-align" : "justify"});
            };

            me.showMenu = function (e) {
                me.menuShowing = true;
                me.clickEvent = e;

                var adjustY = -10;
                var adjustX = 160;
                var offsetY = 0;
                var offsetX = 0;

                var ePageX = e.pageX; //qq1
                var ePageY = e.pageY;
                log("", "ePageX: ", ePageX, "; ePageY: ", ePageY)
                if (isNaN(ePageY)) {
                    ePageY = $(window).scrollTop();
                }
                if (isNaN(ePageX)) {
                    ePageX = $(window).scrollLeft();
                    adjustX = -10;
                }
                log("", "ePageX: ", ePageX, "; ePageY: ", ePageY)

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

                log("top", top);
                log("left", left);

                me.menu.css({
                    top: top + 'px',
                    left: left + 'px'
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
                    me.menu.css("top", ePageY - pos.height - 20 + 'px');
                }

                if (pos.top < 0) {
                    me.menu.css("top", '0px');
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

            me.menuTimeoutClear = function () {
                if (typeof me.menuTimeoutId == "number") {
                    clearTimeout(me.menuTimeoutId);
                    delete me.menuTimeoutId;
                }
            };

            me.menuTimeoutSet = function () {
                me.menuTimeoutId = setTimeout(function () {
                    me.hideMenu();
                }, me.menuTimeoutTime);
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

                me.bindOnKeyDown();
                me.addStyles();
                me.menu = $("<div id='UserWebMenu' class='user-web-menu'>");
                me.ulReadr = $("<ul class='user-web-readr'>");

                me.menu.hover(
                    function () { // on hover
                        me.menuTimeoutClear();
                    },
                    function () { // on exit
                        me.menuTimeoutClear();
                        me.menuTimeoutSet();
                    }
                );

                me.menu.append(me.ulReadr);

                me.linkRunReadrFullAndMark = //qq-readr
                    me.addLink(me.ulReadr, "Read & Mark", function () {
                        me.run(function () { //Medium = hide fixed + style all p's
                            me.tidyUp();
                            var $target = $(me.clickEvent.target);
                            var w = $target.width();
                            log("w", w);
                            me.doRead(w, 50, "readr-container");
                            me.markElementAndBind(me.clickEvent);
                        });
                    }, null, "Tidy and set font family + size - everything of same width - and mark paragraph");

                me.linkRunReadrFull = //qq-readr
                    me.addLink(me.ulReadr, "Read", function () {
                        me.run(function () { //Medium = hide fixed + style all p's
                            me.tidyUp();
                            var $target = $(me.clickEvent.target);
                            var w = $target.width();
                            log("w", w);
                            me.doRead(w, 50, "readr-container");
                            me.clearSelection();
                            me.scrollToElement($target);
                        });
                    }, null, "Tidy and set font family + size - everything of same width");

                me.linkRunReadrMed = //qq-readr
                    me.addLink(me.ulReadr, "Read Medium", function () {
                        me.run(function () { //Medium = hide fixed + style all p's
                            me.tidyUp();
                            var $target = $(me.clickEvent.target);
                            var w = $(me.clickEvent.target).width();
                            log("w", w);
                            me.doRead(w, 50, "readr-med");
                            me.clearSelection();
                            me.scrollToElement($target);
                        });
                    }, null, "Tidy and set font family - everything of same width");

                me.linkRunReadrLite =
                    me.addLink(me.ulReadr, "Read Lite", function () {
                        me.run(function () { //Lite = hide fixed + justify all p's
                            me.readLite();
                        });
                    }, null, "Tidy and justify");

                me.separatorRead1 = me.addSeparator(me.ulReadr).hide();

                me.linkFontUp =
                    me.addLink(me.ulReadr, "Font bigger", function () {
                        me.run(function () {
                            me.setFontSize(1);
                        });
                    }).hide();

                me.linkFontDown =
                    me.addLink(me.ulReadr, "Font smaller", function () {
                        me.run(function () {
                            me.setFontSize(-1);
                        });
                    }).hide();

                me.separatorRead2 = me.addSeparator(me.ulReadr).hide();

                me.linkUndoReadr =
                    me.addLink(me.ulReadr, "Undo Read", function () {
                        me.run(function () {
                            me.undoReadr();
                        });
                    }).hide();

                me.userStyleSeparator = me.addSeparator(me.ulReadr);

                me.linkReloadStyle =
                    me.addLink(me.ulReadr, "Reload style", function () {
                        me.run(function () {
                            me.debug.uniqueUrls = 1;
                            me.loadUserStyle();
                        });
                    }).hide();

                me.linkReloadStyleOnDblClick =
                    me.addLink(me.ulReadr, "Reload dblclick", function () {
                        $('body').bind("dblclick.uws", function () {
                            me.run(function () {
                                me.debug.uniqueUrls = 1;
                                me.loadUserStyle();
                            });

                            me.clearSelection();
                            me.hideMenu();
                        });

                        me.reloadStyleOnDblClickIsBound = true;
                        me.linkReloadStyleOnDblClick.hide();
                        me.linkReloadStyleOnDblClickOff.show();

                        me.run(function () {
                            me.debug.uniqueUrls = 1;
                            me.loadUserStyle();
                        });
                    }).hide();

                me.linkReloadStyleOnDblClickOff =
                    me.addLink(me.ulReadr, "Reload cancel", function () {
                        $('body').unbind("dblclick.uws");
                        me.linkReloadStyleOnDblClick.show();
                        me.linkReloadStyleOnDblClickOff.hide();
                    }).hide();

                me.linkOpenStyle =
                    me.addLink(me.ulReadr, "Open style", function () {
                        me.run(function () {
                            me.openUserStyle();
                        });
                    }).hide();

                me.linkUnloadStyle =
                    me.addLink(me.ulReadr, "Unload style", function () {
                        me.run(function () {
                            me.unloadUserStyle();
                        });
                    }).hide();

                me.addSeparator(me.ulReadr);
                
                me.linkImagesHide = //qqq
                    me.addLink(me.ulReadr, "Hide Images", function () {
                        me.run(function () {
                            me.hideImages();
                        });
                    });
                
                me.linkImagesShow =
                    me.addLink(me.ulReadr, "Show Images", function () {
                        me.run(function () {
                            me.showImages();
                        });
                    }).hide();

                me.linkRunReadrFind =
                    me.addLink(me.ulReadr, "Find...", function () {
                        me.run(function () {
                            me.runReadr(null, { find: true });
                        });
                    });

                me.addSeparator(me.ulReadr);

                me.addLink(me.ulReadr, "Help", function () {
                    me.run(function () {
                        me.showHelp();
                    });
                });

                me.ulSearch = $("<ul class='user-web-search'>");
                me.menu.append(me.ulSearch);

                me.addLink(me.ulSearch, "Copy", function () { me.setClipboard(); });
                me.linkMarkElement =
                    me.addLink(me.ulSearch, "Mark", function () {
                        me.run(function () {
                            me.markElementAndBind(me.clickEvent);
                        });
                    });
                me.linkHighlightElement =
                    me.addLink(me.ulSearch, "Highlight", function () {
                        me.run(function () {
                            me.highlightElement($(me.clickEvent.target));
                        });
                    });
                me.addSeparator(me.ulSearch);
                me.addSeparator(me.ulSearch);
                me.linkNavigateTo = me.addLink(me.ulSearch, "Go to", function () { me.navigateTo(me.selectedText); });
                me.addSeparator(me.ulSearch);
                me.linkSearchTitle = me.addListItem(me.ulSearch, "Search..."); //.addClass("bold");
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

                $('body').append(me.menu);

                me.refreshMenu();
            };

            me.addLink = function (parent, text, fn, href, title) {
                var li = $("<li>")
                    .append($("<a>" + text + "</a>")
                        .click(fn));

                if (href != null) li.prop("href", href);
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
                return me.addListItem(parent, "").addClass("user-web-separator");
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
                        me.separatorRead2.show();
                        me.linkUndoReadr.show();
                        me.linkFontUp.show();
                        me.linkFontDown.show();
                    }
                    else {
                        me.separatorRead1.hide();
                        me.separatorRead2.hide();
                        me.linkUndoReadr.hide();
                        me.linkFontUp.hide();
                        me.linkFontDown.hide();
                    }
                }
            };

            me.addStyle = function (css) {
                $(document.head).append(
                    $('<style>')
                        .attr('id', "user-web-menu-css")
                        .attr('rel', 'stylesheet')
                        .attr('type', 'text/css')
                        .text(css));
            };

            me.addStyles = function () {
                me.addStyle(
                    '.user-web-help { ' +
                        'position: fixed; top: 10px; left: 10px; border: solid 1px #000; background-color: #fff; z-index: 9999999; padding: 10px;' +
                    '}' +
                    '.user-web-help td, .user-web-help th { ' +
                        'padding: 1px 20px 1px 5px;' +
                    '}' +
                    '.user-web-help-button { ' +
                        'border:solid 1px #000; padding:5px; margin-top:20px; text-align:center; cursor:pointer;' +
                    '}' +
                    '.user-web-menu { ' +
                        'text-align: left !important;' +
                        'padding: 0 !important;' +
                        'position: absolute;' +
                        'border: solid 1px #000;' +
                        'font-family: calibri;' +
                        'font-size: 12px;' +
                        'color: #000;' +
                        'z-index: 999999999;' +
                        'text-align: center;' +
                    '}' +
                    '.user-web-menu, .user-web-menu *, .user-web-menu ul li a, .user-web-menu ul li span, .user-web-help td, .user-web-help th { ' +
                        'font-family: Corbel, URW Gothic L, Ubuntu, DejaVu Sans, Courier New, Arial !important;' +
                        'font-size: 13px !important;' +
                        'font-style: normal !important;' +
                        'line-height: 13px !important;' +
                        'letter-spacing: 0 !important;' +
                        'color: #000 !important;' +
                        'background-color: #fff !important;' +
                        'text-align: left !important;' +
                        'margin: 0 !important;' +
                    '}' +
                    '.user-web-menu ul {' +
                        'display: table-cell !important;' +
                    '}' +
                    '.user-web-menu ul.user-web-readr {' +
                        'border-right: solid 1px #000 !important;' +
                    '}' +
                    '.user-web-menu ul, .user-web-menu li {' +
                        'margin: 0 !important;' +
                        'padding: 0 !important;' +
                        'list-style-type: none !important;' +
                        'list-style: none !important;' +
                        'white-space: nowrap !important;' +
                    '}' +
                    '.user-web-menu a:visited {' +
                        ' color: #000 !important;' +
                    '}' +
                    '.user-web-menu a {' +
                        'text-decoration: none !important;' +
                        'cursor: pointer !important;' +
                    '}' +
                    '.user-web-menu li {' +
                        'border-top: solid 1px #ddd !important;' +
                    '}' +
                    '.user-web-menu li.bold * {' +
                        'font-weight: bold !important;' +
                    '}' +
                    '.user-web-menu li.user-web-separator {' +
                        'padding: 0 !important;' +
                        'border-top: solid 1px #aaa !important;' +
                    '}' +
                    '.user-web-menu li.user-web-separator span {' +
                        'padding: 0 !important;' +
                    '}' +
                    '.user-web-menu a, .user-web-menu span {' +
                        'padding: 1px 10px !important;' +
                        'font-weight: normal !important;' +
                        'display: block !important;' +
                    '}' +
                    '.user-web-menu span {' +
                        'color: #888 !important;' +
                        'font-style: italic !important;' +
                    '}' +
                    '.user-web-menu a:hover {' +
                        'background-color: #def !important;' +
                    '}' +
                    '.readr-container a {' +
                        'text-decoration: none !important;' +
                        'border-bottom: 1px dotted #ddd !important;' +
                    '}' +
                    '.readr-container h1, .readr-container h2, .readr-container h3, .readr-container h4 {' +
                        'font-family: ' + me.fonts[me.currentFont] + ', Verdana, Corbel, Ubuntu Light, URW Gothic L, DejaVu Sans, Courier New, Arial !important;' +
                        'font-weight: bold !important;' +
                    '}' +
                    '.readr-container img + * {' +
                        'font-style: italic !important;' +
                    '}' +
                    '.readr-container-forced, .readr-container-forced * {' +
                        'color: #000 !important;' +
                    '}' +
                    '.readr-marked {' +
                        //'border-left: solid 1px #888 !important; padding-left: 5px !important;' +
                        'border-top: dotted 1px #f8f !important; padding-top: 5px !important;' +
                        'border-bottom: dotted 1px #f8f !important; padding-bottom: 8px !important;' +
                    '}' +
                    '.readr-highlight {' +
                        'background-color: #ffff80 !important;' +
                    '}' +
                    me.getReadrFont()
                );
            };

            me.getReadrFont = function (match) {
                log("setFont", me.fonts[me.currentFont], " (", me.fontSize, "/", me.getLineHeight(), ")");
                if ( match == null) match = '*';
                    return '' +
                    '.readr-container, .readr-container ' + match + ' {' +
                        'font-family: ' + me.fonts[me.currentFont] + ', Verdana, Corbel, Arial, Ubuntu Light, URW Gothic L, DejaVu Sans, Courier New !important;' +
                        //'font-family: ' + me.fonts[me.currentFont] + ', Comic Sans MS !important;' +
                        //'border: solid 1px #f0f !important;' +
                        //'background-color: #fffff4 !important;' +
                        'text-align: justify !important;' +
                        'font-size: ' + me.fontSize + 'px !important;' +
                        'font-weight: 300 !important;' +
                        'line-height: ' + me.getLineHeight() + 'px !important;' +
                    '}' +
                    '.readr-med, .readr-med * {' +
                        'font-family: ' + me.fonts[me.currentFont] + ', Verdana, Corbel, Arial, Ubuntu Light, URW Gothic L, DejaVu Sans, Courier New !important;' +
                        'text-align: justify !important;' +
                    '}' +
                    '@media (max-width: 840px) {' +  //fnt
                        '.readr-container, .readr-container ' + match + ',' +
                        '.readr-med, .readr-med * {' +
                            'font-size: ' + me.fontSizeSmall + 'px !important;' +
                            'line-height: ' + me.getLineHeightSmall() + 'px !important;' +
                        '}' +
                    '}';
            };

            /* menu actions ********************************************************************************************************************** */

            me.markElementAndBind = function (e) {
                if (!me.marking) { //qq-readr
                    me.marking = true;
                    me.markElement($(e.target));
                    //log("readr binding", "markElement");
                    $('body').bind("mouseup.uw-markElement", me.mouseUpMarkElement);
                    $('body').bind("keyup.uw-keyUpMarkElement", me.keyUpMarkElement);

                    document.oncontextmenu = function (e) {
                        if (me.marking) {
                            me.markElementCancel();
                            return false;
                        }
                    };
                }
            };

            me.keyUpMarkElement = function (e) {
                userWeb.run(function () {
                    switch (e.keyCode) {
                        case 27: //esc
                            me.markElementCancel();
                            break;
                    }
                });
            };

            me.markElementCancel = function () {
                userWeb.run(function () {
                    userWeb.marking = false;
                    $('body').unbind("mouseup.uw-markElement");
                    $('body').unbind("keyup.uw-keyUpMarkElement");
                });
            };

            me.markElement = function (target) { //qq-readr
                me.clearSelection();
                $(".readr-marked").removeClass("readr-marked");
                if (target.prop("tagName") != "P" && target.parent().prop("tagName") == "P") target = target.parent();
                target.addClass("readr-marked");
                me.scrollToElement(target);
            };

            me.highlightElement = function (target) { //qq-readr
                me.clearSelection();
                if (target.prop("tagName") != "P" && target.parent().prop("tagName") == "P") target = target.parent();
                target.addClass("readr-highlight");
            };

            me.mouseUpMarkElement = function (e) {
                if (e.pageX >= me.startX + 20 || e.pageY >= me.startY + 20) {
                    me.markElementCancel();
                    return;
                }

                switch (e.button) {
                    case 0: //chrome
                        userWeb.run(function () {
                            me.markElement($(e.target));
                        });
                        break;
                    case 1:
                        if (document.all) { //IE
                            userWeb.run(function () {
                                me.markElement($(e.target));
                            });
                        }
                        break;
                    case 2: //right click
                        break;
                }
            };

            me.hideImages = function () { //qqq
                $("img").hide();
                me.imageHide = true;
                me.refreshMenu();
            };

            me.showImages = function () {
                $("img").show();
                me.imageHide = false;
                me.refreshMenu();
            };

            me.doRead = function(width, widthMargin, parentClass) { //qq-readr
                if (me.url.match(/mail\.google/i) == null) {
                    $("*").filter(function() {
                        var w = $(this).width();
                        return w <= width + widthMargin && w >= width - widthMargin;
                    }).addClass(parentClass);
                }
                else {
                    $(".ii.gt.adP.adO").addClass(parentClass);
                }

                me.activeReadr = true;
                me.refreshMenu();
            };

            me.runReadr = function (e, options) { //qq-readr
                me.clearSelection();

                var target = e ? e.target : null;

                userWebStyle.load(target, options);
                me.refreshMenu();
            };

            me.undoReadr = function () {
                userWebStyle.unload();
                $(".readr-marked").removeClass("readr-marked");
                me.refreshMenu();
            };

            me.fonts = [
                "Ubuntu",
                "Segoe UI",
                "Kalinga",
                "Leelawadee UI",
                "Corbel",
                "Century Gothic",
                "Euphemia",
                "Gadugi",
                "Yu Gothic",
                "Yu Mincho",
                "Comic Sans MS", //qq-font //fnt
                "Gisha",
                "Candara",
                "SimSun-ExtB",
                "Sitka Display",
                "Verdana",
                "Arial Nova",
                "Aharoni",
                "Aldhabi",
                "Arial",
                "Arial Black",
                "Batang",
                "BatangChe",
                "Book Antiqua",
                "Browallia New",
                "BrowalliaUPC",
                "Calibri",
                "Calibri Light",
                "Calisto MT",
                "Cambria",
                "Cambria Math",
                "Comic Sans MS",
                "Consolas",
                "Constantia",
                "Copperplate Gothic Bold",
                "Copperplate Gothic Light",
                "Cordia New",
                "CordiaUPC",
                "Courier New",
                "DaunPenh",
                "David",
                "Dengxian",
                "DFKai-SB",
                "DilleniaUPC",
                "DokChampa",
                "Dotum",
                "DotumChe",
                "Ebrima",
                "Estrangelo Edessa",
                "EucrosiaUPC",
                "FangSong",
                "Franklin Gothic Medium",
                "FrankRuehl",
                "FreesiaUPC",
                "Gabriola",
                "Gautami",
                "Georgia",
                "Georgia Pro",
                "Gill Sans Nova",
                "Gulim",
                "GulimChe",
                "Gungsuh",
                "GungsuhChe",
                "Impact",
                "IrisUPC",
                "Iskoola Pota",
                "JasmineUPC",
                "KaiTi",
                "Kartika",
                "Khmer UI",
                "KodchiangUPC",
                "Kokila",
                "Lao UI",
                "Latha",
                "Leelawadee",
                "Levenim MT",
                "LilyUPC",
                "Lucida Console",
                "Lucida Handwriting Italic",
                "Lucida Sans Unicode",
                "Malgun Gothic",
                "Mangal",
                "Manny ITC",
                "Marlett",
                "Meiryo",
                "Meiryo UI",
                "Microsoft Himalaya",
                "Microsoft JhengHei",
                "Microsoft JhengHei UI",
                "Microsoft New Tai Lue",
                "Microsoft PhagsPa",
                "Microsoft Sans Serif",
                "Microsoft Tai Le",
                "Microsoft Uighur",
                "Microsoft YaHei",
                "Microsoft YaHei UI",
                "Microsoft Yi Baiti",
                "MingLiU, PMingLiU",
                "MingLiU-ExtB, PMingLiU-ExtB",
                "MingLiU_HKSCS",
                "MingLiU_HKSCS-ExtB",
                "Miriam, Miriam Fixed",
                "Mongolian Baiti",
                "MoolBoran",
                "MS Gothic, MS PGothic",
                "MS Mincho, MS PMincho",
                "MS UI Gothic",
                "MV Boli",
                "Myanmar Text",
                "Narkisim",
                "Neue Haas Grotesk Text Pro",
                "News Gothic MT",
                "Nirmala UI",
                "NSimSun",
                "Nyala",
                "Palatino Linotype",
                "Plantagenet Cherokee",
                "Raavi",
                "Rockwell Nova",
                "Rod",
                "Sakkal Majalla",
                "Sanskrit Text",
                "Segoe MDL2 Assets",
                "Segoe Print",
                "Segoe Script",
                "Segoe UI Historic",
                "Segoe UI Symbol",
                "Shonar Bangla",
                "Shruti",
                "SimHei",
                "SimKai",
                "Simplified Arabic",
                "SimSun",
                "Sitka Banner",
                "Sitka Heading",
                "Sitka Small",
                "Sitka Subheading",
                "Sitka Text",
                "Sylfaen",
                "Symbol",
                "Tahoma",
                "Times New Roman",
                "Traditional Arabic",
                "Trebuchet MS",
                "Tunga",
                "Urdu Typesetting",
                "Utsaah",
                "Vani",
                "Verdana Pro",
                "Vijaya",
                "Vrinda",
                "Webdings",
                "Westminster",
                "Wingdings",
                "Yu Gothic UI"
            ];

            me.currentFont = 0;

            me.setFont = function (change) {
                me.currentFont += change;
                if (me.currentFont >= me.fonts.length) me.currentFont = 0;
                if (me.currentFont < 0) me.currentFont = me.fonts.length - 1;

                me.addStyle(me.getReadrFont());
            };

            me.setFontSize = function (change) {
                me.fontSize += change; //fnt
                me.fontSizeSmall += change;
                me.addStyle(me.getReadrFont());
            };

            me.getLineHeight = function () {
                return parseInt(me.fontSize * me.fontRatio, 10);
            };

            me.getLineHeightSmall = function () {
                return parseInt(me.fontSizeSmall * me.fontRatio, 10);
            };

            me.setClipboard = function (url) {
                me.run(function () {
                    GM.setClipboard(me.selectedText.trim());
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

            /* user style ********************************************************************************************************************** */

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
                    test: { exp: /(testlocal|home|testinject|testxx)\.htm/i },
                    tutorials_point: { exp: /tutorialspoint\.com/i },
                    yammer: { exp: /yammer\.com/i },
                    wikipedia: { exp: /wikipedia\.org/i }
                };

                me.foundUserStyle = false;

                for (var name in config) {
                    var cfg = config[name];
                    cfg.name = name;

                    if (me.url.match(cfg.exp) != null) {
                        me.currentConfig = cfg;

                        if (cfg.exp != "") {
                            me.foundUserStyle = true;

                            if (name == "feedly" && me.isSmall()) {
                                name = "feedly_compact";
                            }

                            me.loadUserStyleSheet(name.replace(/_/ig, "-"));
                            me.bindOnKeyDown();
                            break;
                        }
                    }
                }

                //if (!me.foundUserStyle) {
                //    log("no userstyle match", me.url.substr(0, 100));
                //}

                me.activeUserStyle = me.foundUserStyle;
                me.refreshMenu();
            };

            me.getUrl = function (path) {
                var unique = me.debug.uniqueUrls ? "?" + new Date().valueOf() : "";
                return me.getRoot() + path + unique;
            };

            me.loadUserStyleSheet = function (name) {
                var url = me.getUrl("styles/" + name + ".css");

                //console.log(logPrefix + "inserting style     :", url);
                log("inserting style", url); //qq-log

                if (me.userStyleSheet == null) {
                    me.userStyleSheet = $('<link>')
                        .attr('id', "user-web-css")
                        .attr('rel', 'stylesheet')
                        .attr('type', 'text/css');

                    $(document.head).append(me.userStyleSheet);
                }

                me.userStyleSheet.attr('href', url);
                me.activeUserStyle = true;
            };

            me.unloadUserStyle = function () {
                me.userStyleSheet.attr('href', "");
                me.activeUserStyle = false;
                me.refreshMenu();
            };

            me.openUserStyle = function () {
                window.open(me.userStyleSheet.attr('href'));
            };

       };

        /* --------------------------------------------------------------- */

        var userWebStyle = new function () {
            var me = this;
            me.url = document.location.href;
            me.loadAttempts = 0;
            me.el0 = null;
            me.el = null;
            me.els = [];

            me.load = function (target, options) { //qq-readr
                me.options = options || {};

                if (target == null) {
                    log("readr binding", "mouseUpStart");
                    $('body').bind("mouseup.uws", me.mouseUpStart);
                }
                else {
                    //log("readr target", me.elToString($(target)));
                    me.find(target);
                }
            };

            me.unload = function () {
                $(".readr-container").removeClass("readr-container").removeClass("readr-container-forced");
                userWeb.activeReadr = false;
            };

            me.mouseUpStart = function (e) {
                userWeb.run(function () {
                    $('body').unbind("mouseup.uws");
                    me.find(e.target);
                });
            };

            me.find = function (target) {
                me.el0 = $(target);
                me.el = me.el0;
                me.els.push(me.el);

                if (me.options.find) {
                    me.boundAdvanced = true;
                    me.el0.css("background-color", "orange");
                    log("readr find", "adding bindings");

                    $('body').bind("keyup.uws", me.keyUp); //TODO: can this be bound repeatedly?
                    $('body').bind("mouseup.uws", me.mouseUpNext);

                    document.oncontextmenu = function () {
                        return false;
                    };
                }
                else {
                    var main = me.findMain(me.el, me.el);

                    if (main) {
                        me.el = main;
                        me.found();
                        me.lastTarget = target;
                    }
                }
            };

            me.findMain = function (el, original) { //qq-readr
                log("findMain", me.elToString(el));
                var parent = el.parent();

                if (parent.length == 0) {
                    log("parent null, return", me.elToString(el));
                    return el;
                }

                if (parent.width() > el.width() + 30) {
                    if (el == original) el = parent;
                    log("main found", me.elToString(el));
                    return el;
                }

                return me.findMain(parent, original);
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

                    return res + ">";;
                }
                catch (ex) {
                    return "failed to log el: " + ex.message;
                }
            };

            me.keyUp = function (e) {
                userWeb.run(function () {
                    switch (e.keyCode) {
                        case 27: //esc
                            me.cancelFind();
                            break;
                        case 13: //enter
                            me.options.forced = true;
                            me.found();
                            break;
                        case 46: //delete
                            me.options.remove = true;
                            me.found();
                            break;
                        case 80: //popout
                            me.options.popout = true;
                            me.found();
                            break;
                        case 37: //back
                            if (me.el != me.el0) {
                                me.el.css("background-color", "");
                                me.els.pop();
                                me.el = me.els[me.els.length - 1];
                            }
                            break;
                        case 39: //forward
                            me.findNext();
                            break;
                    }
                });
            };

            me.mouseUpNext = function (e) {
                userWeb.run(function () {
                    switch (e.button) {
                        case 0:
                            me.findNext(); //chrome
                            break;
                        case 1:
                            if (document.all) { //IE
                                me.findNext();
                            }
                            break;
                        case 2: //right click
                            setTimeout(function () {
                                me.options.remove = true;
                                me.found();
                            }, 1);
                            break;
                    }
                });
            };

            me.findNext = function () {
                if (me.el[0].tagName == "BODY") {
                    return;
                }

                me.el = me.el.parent();

                if (me.el[0].tagName == "BODY") {
                    me.el.css("background-color", "red");
                }
                else {
                    me.el.css("background-color", "gold");
                }

                me.el.addClass("uws-el");
                me.els.push(me.el);
            };

            me.exclude = /share|sharing|social|twitter|tool|related|comment|discussion|extra|contentWellBottom|kudo|$ad|keywords|secondary-column|furniture|hidden|embedded-hyper/;

            me.found = function () {
                var title = document.title;
                var root = userWeb.getRoot();

                // log("popout", me.options.popout);
                // log("remove", me.options.remove);
                // log("forced", me.options.forced);

                me.cancelFind();
                me.originalHtml = $("html").html();

                if (me.options.popout) {
                    log("popout");

                    var rem = me.el.find("iframe, script, link, button, input, form, textarea").remove();

                    /*rem.each(function () {
                        log($(this).html());
                    });*/

                    var hid = me.el.find("*").filter(function (a, b, c) {
                        return this.className.match(me.exclude) !== null ||
                            typeof (this.id) != "string" ||
                            this.id.match(me.exclude) ||
                            $(this).css('visibility') == 'hidden';
                    });

                    /*hid.each(function () {
                        log($(this).html());
                    });*/

                    hid.remove();

                    me.el.find('*').attr('style', '');
                    me.findMainContainers(me.el);

                    var containerClass = me.el.hasClass("readr-container") ? " readr-container" : "";
                    var html = me.el.html();
                    var doc = [];

                    $("head").remove();
                    $("body").remove();

                    doc.push("<head>");
                    doc.push("<title>" + title + "</title>");
                    doc.push("<link rel='stylesheet' type='text/css' href='" + userWeb.getUrl("styles/readr.css") + "'>");
                    doc.push("</head>");
                    doc.push("<body>");
                    doc.push("<div class='readr-inner" + containerClass + "'>");
                    doc.push("<h1>" + title + "</h1>");
                    doc.push(html);

                    doc.push("<div class='readr-links'>");

                    var u = document.location.href.split("#")[0].split("/");

                    if (u[u.length - 1] == "") {
                        u.pop();
                    }

                    while (u.length > 2) {
                        doc.push("<a href=" + u.join("/") + ">" + u.join("/") + "</a><br />");
                        u.pop();
                    }

                    doc.push("</div>");
                    doc.push("</div>");
                    doc.push("</body>");

                    $("html").html(doc.join(""));

                    // $('html').append(userWeb.menu);
                    // userWeb.addStyles();

                    me.el = null;
                    me.el0 = null;
                    me.els = [];

                    return;
                }
                else {
                    if (me.options.forced) {
                        log("forced");
                        me.el.addClass("readr-container").addClass("readr-container-forced");
                    }
                    else if (me.options.remove) {
                        log("removing");
                        me.el.remove();
                        return;
                    }
                    else {
                        log("reading ", userWeb.fonts[userWeb.currentFont], " (", userWeb.fontSize, "/", userWeb.getLineHeight(), ")");
                        me.findMainContainers(me.el);
                    }
                }

                userWeb.activeReadr = true;
                userWeb.refreshMenu();
            };

            me.cancelFind = function () {
                if (me.boundAdvanced) {
                    $(".uws-el").css("background-color", "");
                    me.el0.css("background-color", "");
                    me.boundAdvanced = false;
                    $("*").unbind(".uws");
                    document.oncontextmenu = null;
                }
            };

            me.findMainContainers = function (content) {
                var paras = $(content).find("*");
                var parents = [];

                paras.parent().data("readrParentId", null)

                var parentId = 0;

                for (var i = 0; i < paras.length; i++) {
                    var $para = $(paras[i]);
                    var $parent = $para.parent();

                    if ($parent.data("readrParentId") == null) {
                        $parent.data("readrParentId", parentId);
                        parents[$parent.data("readrParentId")] = {
                            el: $parent,
                            count: 1,
                            parentId: parentId
                        };
                        parentId++;
                    }
                    else {
                        var id = $parent.data("readrParentId");

                        parents[id].count++;
                    }
                }

                if (parentId > 0) {
                    for (var j = 0; j < parents.length; j++) {
                        if (parents[j].count > 0) {
                            parents[j].el.addClass("readr-container");
                        }
                    }
                }
            };
        };

        /* ================================================== */

        window.self.setTimeout(function () {
            try {
                userWeb.load();
            }
            catch (ex) {
                log(ex);
            }
        }, loadAfter);
    }
    else {
        log("skipping frame", "'", document.location.href, "'");
    }
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
};
function pop() {
    Array.prototype.unshift.call(arguments, DO_POP);
    log.apply(this, arguments);
};
function log() {
    function tidy(str) {
        if (str && typeof (str) == "string") {
            return str.replace(/(?:\r\n|\r|\n)/g, "");
        }

        return str;
    };

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
            }
        }

        logPopup.innerHTML = logPopup.innerHTML + msg.replace(/(\s)/g, "&nbsp;") + "<br />";
        logPopup.style.display = "block";
    };

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
            console.log(logPrefix + text1, text2);
        }
        else {
        }

        if (doPop) {
            popup(logPrefix + text1 + text2);
        }
    }
    catch (ex) {
        alert(logPrefix + text1 + "\r\r" + ex.message);
    }
};
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
};
/* == utils END ============================================================= */