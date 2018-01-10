﻿// ==UserScript==
// @name        met-weather
// @description make weather more readable
// @namespace   https://github.com/james-zerty/
// @include     https://www.metoffice.gov.uk/mobile/forecast/*
// @version     2
// @grant       none
// @require     https://rawgit.com/james-zerty/user-web/master/scripts/jquery/jquery-2.1.0.js
// ==/UserScript==
"use strict";
console.log("000");
try {
    var logPrefix = "[met-weather] ";
    var isTop = window.top == window.self;

    if (isTop) {
        var obj = new function () {
            var me = this;

            me.load = function () {
console.log("300");
                $(".weatherTime td").each(function(i) {
                    var t = parseInt($(this).text().substr(0, 2), 10);

                    if (isNaN(t)) {
                        t = new Date().getHours();
                    }

                    if (t < 6 || t > 20) {
                        $(this).css("background-color", "#2863B4"); // night
                    }
                    else if (t < 9 || t > 17) {
                        $(this).css("background-color", "#91B3DC"); // morning / eve
                    }
                    else {
                        $(this).css("background-color", "#DEEDFF"); // day
                    }
                });
console.log("310");
                $(".weatherRain td").each(function(i) {
                    var val = parseInt($(this).text().match(/\d+/i, ""), 10);

                    if (val < 30) {
                        $(this).css("background-color", "#8f8");
                    }
                    else if (val < 50) {
                        $(this).css("background-color", "#f8f");
                    }
                    else {
                        $(this).css("background-color", "#f88");
                    }
                });
console.log("320");
                var url = document.location.href;
                if (url.indexOf("#") > -1) {
                    url = url.substring(0, url.indexOf("#"));
                }
console.log("330");
                me.title = $(".main header h1").text();
                me.loadDate = new Date($(".issue time").attr("datetime"));
                $(".main header h1").html("<a href=" + url + ">" + me.title + "</a><div id=timeSpan style='font-size:16px;'></div>");
console.log("340");
                me.setTitle();
console.log("350");
                //set the timeout at 1s past the minute...
                var secs = 60 - new Date().getSeconds() + 1;
                setTimeout(function() {
console.log("400");
                    me.setTitle();
console.log("410");
                    setInterval(function() {
console.log("500");
                        me.setTitle();
console.log("510");
                    }, 60 * 1000);
                }, secs * 1000);
console.log("420");
            };

            me.setTitle = function () {
                var now = new Date();
                var msg = getTimeSpan(me.loadDate, now);

                $(".main header h1 #timeSpan").text("Issued " + msg + " ago");
            };
        };

        /* ================================================== */

        setTimeout(function () {
            try {
console.log("200");
                obj.load();
console.log("900");
            }
            catch (ex) {
                log(ex);
            }
        }, 100);
    }
    else {
        //log("skipping frame", "'", document.location.href, "'");
    }
}
catch (ex) {
console.log("990");
    log(ex);
console.log("999");
}

function getTimeSpan(start, end, includeSecs, includeMillisecs) {

    var delta = Math.abs(end - start) / 1000;
    var days = Math.floor(delta / 86400);
    delta -= days * 86400;
    var hours = Math.floor(delta / 3600) % 24;
    delta -= hours * 3600;
    var mins = Math.floor(delta / 60) % 60;
    delta -= mins * 60;
    var secs = delta % 60;
    if (!includeMillisecs) {
        secs = parseInt(secs, 10);
    }

    var msg = "";
    if (days > 0) msg += days + "d, ";
    if (hours > 0) msg += hours + "h, ";
    if (includeSecs) {
        if (mins > 0) msg += mins + "m, ";
        msg += secs + "s";
    }
    else {
        msg += mins + "m";
    }
    return msg;
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