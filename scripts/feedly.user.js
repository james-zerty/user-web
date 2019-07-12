// ==UserScript==
// @name        feedly
// @description add pocket links to feedly
// @namespace   https://github.com/james-zerty/
// @author      2010+, james_zerty
// @version     2
// @noframes
// @grant       none
// @include     https://feedly.com/i/*
// @require     https://rawgit.com/james-zerty/user-web/master/scripts/utils.js
// @require     https://rawgit.com/james-zerty/user-web/master/scripts/jquery/jquery-3.3.1.min.js
// ==/UserScript==
"use strict";
try {
    var $ = window.$;
    var loadAfter = 100;
    setupLog("[feedly]");
    
    var obj = new function () {
        var me = this;

        me.load = function () {
            me.url = document.location.href;
            me.switchLinks();
            
            $(document).bind("DOMNodeInserted", function(){
                me.switchLinks();
            });
        };

        me.switchLinks = function() {
            $(".entryholder a.title, .entryholder a.secondary").each(function() {
                var el = $(this);
                if (el.hasClass("pock-done")) return;
                el.addClass("pock-done");
                var href = el.attr("href");
                if (href) {
                    var prefix = "https://getpocket.com/edit?";
                    if (href.indexOf(prefix) > -1) return;
                    
                    var u = encodeURIComponent(href);
                    //var title = encodeURIComponent(window.document.title);
                    var pocketUrl = prefix + "url=" + u; // + "&title=" + title;
                    log("switching", el.text(), " : ", href, " to ", pocketUrl);
                    $("<a href=" + pocketUrl + ">Add to Pocket</a>").insertAfter(el);
                }
            });
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