// ==UserScript==
// @name        google-search
// @description enhance google search results
// @namespace   https://github.com/james-zerty/
// @author      2010+, james_zerty
// @version     2
// @noframes
// @grant       none
// @include     https://www.google.*/search*
// @require     https://rawgit.com/james-zerty/user-web/master/scripts/utils.js
// @require     https://rawgit.com/james-zerty/user-web/master/scripts/jquery/jquery-3.3.1.min.js
// ==/UserScript==
"use strict";
try {
    var $ = window.$;
    var loadAfter = 100;
    setupLog("[google-search]");

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

        me.googleSite = function (site) {
            var query = site == null ? "" : "site:" + site + "+";
            var val = $("#lst-ib, input[name='q']")
                .val()
                .replace(/ /g, "+")
                .replace(/#/g, "%23")
                .replace(/=/g, "%3D")
                .replace(/\?/g, "%3F")
                .replace(/&/g, "%26")
                .replace(/site\:[^\+]*\+/g, "");
            var url = "https://www.google.co.uk/search?q=" + query + val;

            document.location.href = url;
        };

        me.addLink = function (parent, baseUrl, param, text) {
            parent.append(
                $("<a>")
                    .text(text)
                    .prop("href", baseUrl + "&tbs=qdr:" + param)
                    .addClass("q qs")
            );
        };

        me.addJsLink = function (parent, text, fn) {
            parent.append(
                $("<a>")
                    .text(text)
                    .addClass("q qs")
                    .click(function() { me.run( function() {
                        fn();
                    })})
            );
        };
        
        me.run = function(fn) {
            try {
                fn();
            }
            catch (ex) {
                log(ex);
            }
        };
    }();

    /* ================================================== */

    window.self.setTimeout(function () {
        try {
            obj.load();
        }
        catch (ex) {
            log(ex);
        }
    }, loadAfter);
}
catch (ex) {
    log(ex);
}