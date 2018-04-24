// ==UserScript==
// @name        outlook-auto
// @description auto login to outlook
// @namespace   https://github.com/james-zerty/
// @version     10
// @grant       none
// @author      2010+, james_zerty
// @include     /^https://.*/adfs/.*/
// @match       https://login.microsoftonline.com/*
// @match       https://outlook.office.com/owa/*
// @match       https://XXlocalhost/*
// @require     https://rawgit.com/james-zerty/user-web/master/scripts/jquery/jquery-2.1.0.min.js
// ==/UserScript==
"use strict";

try {
    var logPrefix = "[outlook-auto] ";
    var isTop = window.top == window.self;

    if (isTop) {
        var obj = new function () {
            var me = this;
            me.autoSubmit = true;

            me.load = function () {
                var url = document.location.href;

                log("starting");
                log("url", url.substr(0, 100));

                if (url.match("login\.microsoft") != null) {

                    pop("found", "login.microsoft");
                    var par = $("#login_cta_text");
                    var par2 = $("#login_workload_logo_text");
                    var lgn = $("#i0116"); // enter Sign In (email)
                    var pick = $(".table[role='button']").first(); //pick an account

                    if (
                        (par.length > 0 && par.text().indexOf("Sorry") > -1) ||
                        (par2.length > 0 && par2.text().indexOf("signed out") > -1) ||
                        (url.match("/logout") != null)
                    ) {

                        pop("found logout", "reloading in 5s...");

                        setTimeout(function () {
                            try {
                                pop("logging back in...");
                                if (me.autoSubmit)
                                    document.location = "https://outlook.office.com/owa/";
                            }
                            catch (ex) {
                                pop(ex.message);
                            }
                        }, 5000); //wait 5s in case the page is already reloading
                    }
                    else if (lgn.length > 0) {
                        pop("found", "login");

                        var timer = setInterval(function () {
                            try {
                                pop("checking login...");

                                if (lgn.val() == "") {
                                    pop("login is blank");
                                }
                                else {
                                    clearInterval(timer);
                                    pop("login non-blank", "submitting...");
                                    if (me.autoSubmit)
                                        $("#idSIButton9")[0].click();
                                }
                            }
                            catch (ex) {
                                pop(ex.message);
                            }
                        }, 1000);
                    }
                    else if (pick.length > 0) {
                        pop("found", "pick an account");

                        pop("checking account...");

                        if (pick.text().indexOf(".com") == -1) {
                            pop("wait", "found ", pick.text(), " in first '.table'");
                        }
                        else {
                            pop("found login", "submitting...");
                            if (me.autoSubmit)
                                pick[0].click();
                        }
                    }

                    return;
                }
                else if (url.toLowerCase().indexOf("authredirect=true") > -1) {

                    log("found", "authredirect=true");
                    var secs = 20;
                    log("found redirect", "checking again in " + secs + "s...");

                    setTimeout(function () {
                        try {
                            log("redirect", "checking for failed redirect...");
                            url = document.location.href;
                            log("url", url.substr(0, 100));

                            if (url.toLowerCase().indexOf("authredirect=true") == -1) {
                                log("redirect", "redirect no longer in url");
                                hidePop();
                                return;
                            }
                            log("reloading...");
                            //if (me.autoSubmit)
                            //jms1 document.location = "https://outlook.office.com/owa/";
                        }
                        catch (ex) {
                            pop(ex.message);
                        }
                    }, secs * 1000); //wait in case the page is already reloading

                    return;
                }

                var submitButton = document.getElementById("submitButton");
                var errMsg = document.getElementById("error");

                if (errMsg != null && errMsg.innerText.trim() != "") {
                    pop("error found", errMsg.innerText);
                }
                else if (submitButton != null) {
                    pop("found", "submitButton");
                    var pw = $("#passwordInput");
                    var timer = setInterval(function () {
                        try {
                            pop("checking password...");

                            if (pw.val() == "") {
                                pop("password is blank");
                            }
                            else {
                                clearInterval(timer);
                                pop("password non-blank", "submitting...");
                                if (me.autoSubmit)
                                    submitButton.click();
                            }
                        }
                        catch (ex) {
                            pop(ex.message);
                        }
                    }, 3000);
                }
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