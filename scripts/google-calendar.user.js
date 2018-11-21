// ==UserScript==
// @name        google-calendar
// @description fix google calendar
// @namespace   https://github.com/james-zerty/
// @version     1
// @author      2010+, james_zerty
// @grant       none
// @noframes
// @include     https://calendar.google.com/*
// @require     https://rawgit.com/james-zerty/user-web/master/scripts/utils.js
// @require     https://rawgit.com/james-zerty/user-web/master/scripts/jquery/jquery-3.3.1.min.js
// ==/UserScript==
"use strict";
try {
    var $ = window.$;
    setupLog("[google-calendar]");

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
            // $(".VrDepf[style='border-color: #D81B60;'], .VrDepf[style='border-color: rgb(216, 27, 96);']")
            $(".VrDepf[style='border-color:#" + shrt + ";'], .VrDepf[style='border-color: #" + shrt + ";'], .VrDepf[style='border-color:rgb(" + lng + ");'], .VrDepf[style='border-color: rgb(" + lng + ");']")
                .parent().hide().parent().css({"background-color": "#" + shrt + "", "color": "#fff"});
        };
    };

    /* ================================================== */

    window.self.setTimeout(function() {
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