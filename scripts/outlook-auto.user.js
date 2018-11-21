// ==UserScript==
// @name        outlook-auto
// @description auto login to outlook
// @namespace   https://github.com/james-zerty/
// @version     10
// @author      2010+, james_zerty
// @grant       none
// @noframes
// @include     /^https://.*/adfs/.*/
// @match       https://login.microsoftonline.com/*
// @match       https://outlook.office.com/owa/*
// @match       https://XXlocalhost/*
// @require     https://rawgit.com/james-zerty/user-web/master/scripts/utils.js
// @require     https://rawgit.com/james-zerty/user-web/master/scripts/jquery/jquery-3.3.1.min.js
// ==/UserScript==
"use strict";
try {
    var $ = window.$;
    setupLog("[outlook-auto]");

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
catch (ex) {
    log(ex);
}