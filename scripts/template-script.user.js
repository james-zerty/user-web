// ==UserScript==
// @name        template-script
// @description template user script
// @namespace   https://github.com/james-zerty/
// @version     1
// @author      2010+, james_zerty
// @grant       none
// @noframes
// @include     /^https://.*/whatever/.*/
// @match       https://whatever.com/*
// @match       https://xxlocalhost/*
// @require     https://rawgit.com/james-zerty/user-web/master/scripts/utils.js
// @require     https://rawgit.com/james-zerty/user-web/master/scripts/jquery/jquery-3.3.1.min.js
// ==/UserScript==
"use strict";
try {
    var $ = window.$;
    setupLog("[template-script]");

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
catch (ex) {
    log(ex);
}