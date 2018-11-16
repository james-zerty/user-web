// ==UserScript==
// @name        bbc-weather
// @description make weather more readable
// @namespace   https://github.com/james-zerty/
// @version     2
// @author      2010+, james_zerty
// @grant       none
// @noframes
// @include     https://www.bbc.co.uk/weather/*
// @require     https://rawgit.com/james-zerty/user-web/master/scripts/utils.js
// @require     https://rawgit.com/james-zerty/user-web/master/scripts/jquery/jquery-3.3.1.min.js
// ==/UserScript==
"use strict";
try {
    var $ = window.$;
    var loadAfter = 100;
    var logPrefix = "[bbc-weather] ";

    var obj = new function () {
        var me = this;

        me.load = function () {
            // $(".largeTabInner").each(function(i) {
                // var t = $(this).text();

                // if (t.indexOf("Sat") > -1 || t.indexOf("Sun") > -1) {
                    // $(this).css("background-color", "#B9DC0C");
                // }
            // });

            // $(".weatherTime td").each(function(i) {
                // var t = parseInt($(this).text().substr(0, 2), 10);

                // if (isNaN(t)) {
                    // t = new Date().getHours();
                // }

                // if (t < 6 || t > 20) {
                    // $(this).css("background-color", "#2863B4"); // night
                // }
                // else if (t < 9 || t > 17) {
                    // $(this).css("background-color", "#91B3DC"); // morning / eve
                // }
                // else {
                    // $(this).css("background-color", "#DEEDFF"); // day
                // }
            // });

            // $(".weatherRain td").each(function(i) {
                // var val = parseInt($(this).text().match(/\d+/i, ""), 10);

                // if (val < 30) {
                    // $(this).css("background-color", "#8f8");
                // }
                // else if (val < 50) {
                    // $(this).css("background-color", "#f8f");
                // }
                // else {
                    // $(this).css("background-color", "#f88");
                // }
            // });

            // $(".weatherFeel td").each(function(i) {
                // var val = parseInt($(this).text().match(/\d+/i, ""), 10);

                // $(this).addClass("icon icon-animated").attr("data-value", val)
                    // .css({
                        // display: "table-cell",
                        // borderRight: "solid 1px #fff",
                        // height: "auto",
                        // paddingTop: "2px"
                    // });
            // });

            var url = document.location.href;
            if (url.indexOf("#") > -1) {
                url = url.substring(0, url.indexOf("#"));
            }

            log("loading");
            $("#wr-location-name-id").append("<a href=" + url + ">[reload]</a>");
            $("#wr-location-name-id a").css({ color:"#ffffff", fontSize:"60%", margin:"0 10px 0 20px" });
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