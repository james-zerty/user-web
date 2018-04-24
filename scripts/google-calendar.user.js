// ==UserScript==
// @name        google-calendar
// @description fix google calendar
// @namespace   https://github.com/james-zerty/
// @version     1
// @grant       none
// @author      2010+, james_zerty
// @include     https://calendar.google.com/*
// @include     xhttps://localhost:44300/Home.htm
// @require     https://rawgit.com/james-zerty/user-web/master/scripts/jquery/jquery-2.1.0.min.js
// ==/UserScript==
"use strict";

try {
    var logPrefix = "[google-calendar] ";
    var isTop = window.top == window.self;

    if (isTop) {
        var obj = new function () {
            var me = this;

            me.load = function () {
                me.url = document.location.href;

                setInterval(function() {
                    if ($(".QNFxAc.gc-fixed").length == 0) {
                        log("setting bg colors", new Date());
                        me.setEventBgColor("4285F4", "66, 133, 244"); //blue
                        me.setEventBgColor("0B8043", "11, 128, 67");  //dark green
                        me.setEventBgColor("7CB342", "124, 179, 66"); //light green
                        me.setEventBgColor("8E24AA", "142, 36, 170"); //purple
                        me.setEventBgColor("616161", "97, 97, 97");   //gray
                        me.setEventBgColor("D81B60", "216, 27, 96");  //pink
                        $(".QNFxAc").addClass("gc-fixed");
                    }
                }, 1000);

            };

            me.setEventBgColor = function (shrt, lng) {
                $(".VrDepf[style='border-color: #" + shrt + ";'], .VrDepf[style='border-color: rgb(" + lng + ");']")
                    .parent().hide().parent().css({"background-color": "#" + shrt + "", "color": "#fff"});
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