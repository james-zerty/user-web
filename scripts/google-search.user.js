// ==UserScript==
// @name        google-search
// @description enhance google search results
// @namespace   https://github.com/james-zerty/
// @version     2
// @grant       none
// @author      2010+, james_zerty
// @include     https://www.google.*/search*
// @include     xhttps://localhost:44300/Home.htm
// @require     https://rawgit.com/james-zerty/user-web/master/scripts/jquery/jquery-2.1.0.js
// ==/UserScript==
"use strict";

try {
    var logPrefix = "[google-search] ";
    var isTop = window.top == window.self;

    if (isTop) {
        var obj = new function () {
            var me = this;

            me.load = function () {
                me.url = document.location.href;
                // log("page url", "'", me.url, "'");

                var parent = $("#hdtb-msb");
                //if (parent.length == 0) parent = $(".nav a:last");//for test
                var baseUrl = me.url.replace(/&tbs=[\w:]*/, "");
                me.addLink(parent, baseUrl, "h", "H");
                me.addLink(parent, baseUrl, "d", "D");
                me.addLink(parent, baseUrl, "w", "W");
                me.addLink(parent, baseUrl, "m", "M");
                me.addLink(parent, baseUrl, "y", "Y");
                me.addJsLink(parent, "SE", function() {
                    me.googleSite("stackexchange.com");
                });
                me.addJsLink(parent, "SU", function() {
                    me.googleSite("superuser.com");
                });
                me.addJsLink(parent, "SO", function() {
                    me.googleSite("stackoverflow.com");
                });
                me.addJsLink(parent, "Reset", function() {
                    me.googleSite();
                });
            };

            me.googleSite = function(site) {
                var query = site == null ? "" : "site:" + site + "+"
                document.location.href = "https://www.google.co.uk/search?q=" + query +
                    $("#lst-ib").val()
                        .replace(/ /g, "+")
                        .replace(/#/g, "%23")
                        .replace(/=/g, "%3D")
                        .replace(/\?/g, "%3F")
                        .replace(/&/g, "%26")
                        .replace(/site\:[^\+]*\+/g, "");
            }

            me.addLink = function (parent, baseUrl, param, text) {
                // log("addLink");
                parent.append(
                    $("<a>")
                        .text(text)
                        .prop("href", baseUrl + "&tbs=qdr:" + param)
                        .addClass("q qs")
                );
            };

            me.addJsLink = function (parent, text, fn) {
                // log("addLink");
                parent.append(
                    $("<a>")
                        .text(text)
                        .addClass("q qs")
                        .click(function() {
                            fn();
                        })
                );
            };

            me.addElement = function (parent, html) {
                parent.append(
                    $(html)
                        .addClass("q qs")
                );
            };

        };

        /* ================================================== */

        setTimeout(function () {
            try {
                obj.load();
            }
            catch (ex) {
                log(ex);
            }
        }, 1000);
    }
    else {
        //log("skipping frame", "'", document.location.href, "'");
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