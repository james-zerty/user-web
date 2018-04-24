// ==UserScript==
// @name        template-script
// @description template user script
// @namespace   https://github.com/james-zerty/
// @version     1
// @grant       none
// @author      2010+, james_zerty
// @include     /^https://.*/whatever/.*/
// @match       https://whatever.com/*
// @match       https://xxlocalhost/*
// @require     https://rawgit.com/james-zerty/user-web/master/scripts/jquery/jquery-2.1.0.min.js
// ==/UserScript==
"use strict";

try {
    var logPrefix = "[template-script] ";
    var isTop = window.top == window.self;

    // function Thing() {
        // this.Aa = 1;
        // this.Bb = 2;
    // }

    // log(new Thing());
    // log(new Date());
    // log(new Error("haha"));
    // throw new lala();

    // pop(">>", document.location.href.match("cgi-bin"));
    // pop("yo", "ho ho ");

    if (isTop) {
        var obj = new function () {
            var me = this;

            // config...
            me.config = [
                { exp: /localhost:44300/i, filter: ".some-ad" },
                { exp: /blah\.co.\uk/i, filter: ".blah" },
            ];

            me.load = function () {
                log("load");
                me.url = document.location.href;
                me.isLinux = navigator.userAgent.indexOf("Linux") > -1;
                var isSmall = $(window).width() < 800;

                pop("url", me.url.substr(0, 100));

                // regex match...
                if (me.url.match(me.config[0].exp)) {
                    pop("found", me.config[0].exp);
                }

                // timer...
                var j = 0;
                var timer = setInterval(function () {
                    j++;

                    pop("checking", j);
                    var btn = $(".btn");
                    if (btn.length > 0) {
                        log("clicking...");
                        btn[0].click();
                        clearInterval(timer);
                    }

                    if (j > 3) {
                        pop("quitting");
                        clearInterval(timer);
                        return;
                    }
                }, 1000);
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