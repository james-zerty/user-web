// ==UserScript==
// @name        new-tab
// @description insert bookmarks into firefox or chrome new tab
// @namespace   https://github.com/james-zerty/
// @version     11
// @author      2010+, james_zerty
// @include     about:blank
// @include     about:newtab
// @include     *chrome/newtab*
// @include     https://localhost:44300/new-tab.htm
// @include     https://www.google.co.uk/
// @require     https://rawgit.com/james-zerty/user-web/master/scripts/jquery/jquery-2.1.0.min.js
// ==/UserScript==
"use strict";

try {
    var logPrefix = "[new-tab] ";

    var obj = new function () {
        var me = this;
        var url = document.location.href;

        me.bbcWeather = "";
        me.metWeather = "";
        me.inoUrl = "";
        me.urlOutlook = "https://outlook.office365.com/owa/";
        me.urlPortal = "";
        me.urlGoogleMaps = "";
            // me.custom = [
                // { title: "Title 1 Here", icon: "custom", url: "https://blah1.com" },
                //{},
                // { title: "Title 2 Here", icon: "custom", url: "https://blah2.com" }
            // ];

        me.isGoogle = url.indexOf("google") > -1;

        me.isLinux = navigator.appVersion.indexOf("Linux") != -1;

        me.debug = {
            localUrls: 0,
            reloader: 0
        };

        if (me.debug.reloader) {
            $(document).dblclick(function () {
                document.location.href = document.location.href;
            });
            document.oncontextmenu = function (e) {
                document.location.reload(true);
                return false;
            };
        }

        me.getRoot = function () {
            return me.debug.localUrls ? "https://localhost:44300/" : "https://rawgit.com/james-zerty/user-web/master/";
        }

        me.load = function () {
            me.addStyle();

            var body = $("body");
            var outer = me.addElement(body, "div", "outer");
            var inner = me.addElement(outer, "div", "inner");
            var t = me.addElement(inner, "table", "grid");

            var tr = me.addElement(t, "tr");
            me.addLink(tr, "Google", "google", "http://www.google.co.uk/");
            me.addLink(tr, "Gmail", "gmail", "https://mail.google.com/mail/u/0/#inbox");
            me.addLink(tr, "Calendar", "google_calendar", "https://calendar.google.com/calendar/r/custom/3/w");
            me.addLink(tr, "Keep", "google_keep", "https://keep.google.com/#home");
            me.addLink(tr, "Maps", "google_maps", "https://www.google.co.uk/maps/" + me.urlGoogleMaps);
            me.addLink(tr, "Find", "google_find", "https://www.google.com/android/find/");

            var tr = me.addElement(t, "tr");
            me.addLink(tr, "Inoreader", "inoreader", "https://www.inoreader.com/" + me.inoUrl);
            me.addLink(tr, "Pocket", "pocket", "https://getpocket.com/a/queue/list/");
            me.addLink(tr, "News", "bbc_news", "http://m.bbc.co.uk/news/");
            me.addLink(tr, "Wikipedia", "wikipedia", "https://en.wikipedia.org/wiki/Main_Page");
            me.addLink(tr, "Guardian", "guardian", "https://www.theguardian.com/uk");
            me.addLink(tr, "BBC iPlayer", "bbc_iplayer", "http://www.bbc.co.uk/iplayer");

            var tr = me.addElement(t, "tr");
            me.addLink(tr, "Met Weather", "met_office", "https://www.metoffice.gov.uk/mobile/forecast/" + me.metWeather);
            me.addLink(tr, "BBC Weather", "bbc_weather", "http://m.bbc.co.uk/weather/" + me.bbcWeather);
            me.addLink(tr, "Google Weather", "google_weather", "https://www.google.co.uk/search?q=weather");
            me.addSpacer(tr);
            me.addLink(tr, "Amazon EF", "amazon", "https://www.easyfundraising.org.uk/retailer/amazon/visit/");
            me.addLink(tr, "Amazon", "amazon", "https://www.amazon.co.uk/gp/css/homepage.html/");

            if (me.custom) {
                var tr = me.addElement(t, "tr");
                for (var i = 0; i < me.custom.length; i++) {
                    var c = me.custom[i];
                    if (c.title == null) {
                        me.addElement(tr, "td");
                    }
                    else {
                        me.addLink(tr, c.title, c.icon, c.url);
                    }
                }
            }

            $("a").click(function () {
                this.blur();
            });
        };

        me.addLink = function (tr, text, image, link) {
            var td = me.addElement(tr, "td");

            var link = me
                .addElement(td, "a")
                .attr("href", link);

            if (image == null) {
                return;
            }

            var img = me
                .addElement(link, "img");

            if (me.binaries[image] == null) {
                //img.attr("src", me.getRoot() + "styles/buttons/" + image.replace("_", "-") + ".png");
            }
            else {
                img.attr("src", "data:image/jpeg;base64," + me.getBinary(image));
            }

            var text = me
                .addElement(link, "div")
                .html(text);
        };

        me.addSpacer = function (tr) {
            var td = me.addElement(tr, "td");
            me.addElement(td, "div", "spacer");
        };

        me.addElement = function (parent, tag, className, text) {
            var el = $("<" + tag + "></" + tag + ">");

            if (className != null) {
                el.addClass(className);
            }

              if (text != null) {
                el.text(text);
            }

            if (parent != null) {
                $(parent).append(el);
            }

            return el;
        };

        me.insertStyle = function (css) {
            $(document.head).append(
                $('<style>')
                    .attr('id', "user-web-menu-css")
                    .attr('rel', 'stylesheet')
                    .attr('type', 'text/css')
                    .text(css));
        };

        me.addStyle = function () {
            var searchTopLarge = 182;
            var searchTopSmall = 0;

            if (me.custom && me.custom.length) {
                var searchTopLarge = 270;
                var searchTopSmall = 50;
            }

            me.insertStyle(
                '#f {' +
                    'position: relative !important;' +
                    'top: 512px !important;' +
                '}' +
                'html, body, .outer {' +
                    'margin: 0;' +
                '}' +
                'html, body, .outer, a, td {' +
                    'font-family: Verdana, URW Gothic L, Ubuntu Light, DejaVu Sans, Courier New, Arial;' +
                '}' +
                'div.inner {' +
                    'position: absolute;' +
                    'top: 50px;' +
                    'left: 50%;' +
                    'transform: translate(-50%, 0);' +
                '}' +
                'div.footer {' +
                    'padding: 0 10px 5px;' +
                    'position: absolute;' +
                    'top: 100%;' +
                    'height: 20px;' +
                    'transform: translate(0, -25px);' +
                '}' +
                'a, .a, a:visited {' +
                    'text-decoration: none;' +
                    'color: #555;' +
                    'cursor: pointer;' +
                '}' +
                'a:hover {' +
                    'color: #000080;' +
                    'text-decoration: underline;' +
                '}' +
                '.grid {' +
                    'text-align: center;' +
                    'border-collapse: collapse;' +
                '}' +
                '.grid div.spacer {' +
                    'width: 62px;' +
                '}' +
                '.grid a {' +
                    'width: 120px;' +
                    'cursor: pointer;' +
                    'padding: 15px 0 15px;' +
                    'margin: 5px;' +
                    'display: block;' +
                    'border: solid 1px #ddd;' +
                    'font-size: 12px;' +
                    'line-height: 12px;' +
                '}' +
                '.grid a:hover {' +
                    'border: solid 1px #000080;' +
                '}' +
                '.grid a img {' +
                    'width: 36px;' +
                    'height: 36px;' +
                    'padding: 4px;' +
                '}' +
                '._Ubu {' +
                    'display: none !important;' +
                '}' +
                (me.isGoogle ? '' : '.grid div { margin-top: 2px; }') + //hack for different doctypes
                '@media (min-width: 902px) {' +
                    '#searchform {' +
                        'height: 0 !important;' +
                    '}' +
                    '#tsf {' +
                        'margin-top: 0 !important;' +
                        'top: ' + searchTopLarge + 'px !important;' +
                        'position: relative;' +
                    '}' +
                '}' +
                '@media (max-width: 901px) {' +
                    '.grid a {' +
                        'width: 57px;' +
                        'padding: 8px 0px;' +
                        'margin: 0px;' +
                        'font-size: 9px;' +
                        'line-height: 11px;' +
                        'height: 48px;' +
                    '}' +
                    '.grid a img {' +
                        'width: 24px;' +
                        'height: 24px;' +
                    '}' +
                    '.grid div {' +
                        'padding: 0 1px !important;' +
                    '}' +
                    '.grid div.spacer {' +
                        'width: 10px;' +
                    '}' +
                    'div.inner {' +
                        'top: 5px;' +
                    '}' +
                    '#tsf, #f {' +
                        'margin-top: 0 !important;' +
                        'width: 300px !important;' +
                        'top: ' + searchTopSmall + 'px !important;' +
                        'position: relative !important;' +
                    '}' +
                    '.sfibbbc {' +
                        'width: 300px;' +
                    '}' +
                    '.hp .tsf-p {' +
                        'padding: 0px !important;' +
                    '}' +
                '}' +
                '#main, #gb, #footer, .jsb, #tophf, .sfbg .nojsv, .sfbgg, #most-visited, #lga, #gs_st0 {' +
                    'display: none !important;' +
                '}' +
                'div#searchform {' +
                    'min-width: 0px;' +
                '}' +
                '#viewport, div.sfbg, div.sfbgg, div#searchform, .hp #tsf {' +
                    'min-width: 300px !important;' +
                '}'
            );
        };

        me.getBinary = function (key) {
            return me.binaries[key];
        };

        me.binaries = {
            amazon: "iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAIAAABuYg/PAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAAAd0SU1FB94CFw4CA/JP9YsAAAAZdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuMTZEaa/1AAAC3klEQVRYR2P4////92cTv1yperU3+sUmB6ojoLFAw4FWAC1igNsEZNAIwe1jgNsEtJlGAG4fA61tggCIfQzAYKWPZUCLRi2jEIxaRhUwahlVAHbLPj6evWxu7t0LXUD2hWNTrp7s3b+tHcjesaEZLP//+J6m1YuK//9Z+OL29J0b6revq711tuv/z/lAZbfPdwMV3L046ea5SZtWlv//tQCiBQiwWPbl6UwzE52sjARdXbNPj6c6OHhaWZrLSMu6urkryCuuWdKyb3ONi7OjrbVFamLQuSMToyJDFBRUZk9KbaxONjc1NjO3vnxySmN1tKmJmZKyakt9OsRYIMDus67WrKm9qZbmFu8fTPTxCT6yqyfA12XxnOKJXZlTe7Ovnuzuak4pygmxszH+/3/55tV1NtYWz+8sNDYyOLm/u78jpaslsbMxfv603Oqq/NiY4P8/oZ7DYtmpA+0mpuav707y8bD79GiSr1/I4V1d/r6u65YUT+hInTM5v6E6bVJXypzJKfY2Js9vzdTV1Vkwu+H/l3XmZkZHd3dM6EzrbE7obk5YPDO3qaE0IS6EgGWmJkadTfH6unr7tnVGRkYc29sdGea5cXnJ1N70hTMKm+oy4iPdfL0cnR3NG6oSbCyMjQ10G6qT87PiQoKDvD0cbpyZ0NOauGJefmdbeUZqOD7LgODsoa5ju9te3Zn8/enM66d6vzyfffNM59v7k5/dmPDy1sRPT2bv2wJKKUDBd/dm/3o4+ffNjje3JwBFDmxruni0F8h4er3v9Z2JT29MuXuhB2QiGGC3DBm8P139/nQulIMBvj+d9OJ4zdczabi0IwPClgHB13ttQAXASvbDiez3pzPfn876cCbj7Ym8lztD3x9LASp4f7UVohI/IMoyCPj5sOPLzabPl4o+XcwDNiV+3OuAShANSLCMcjBqGVXAqGVUAcPeMrp2LOjaZQKy4PbRCEFsAjLo2M39/x8AXFpaqXzZ1psAAAAASUVORK5CYII=",
            bbc_iplayer: "iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAYAAADhAJiYAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAAAd0SU1FB94CFw02CjL/AIEAAAAZdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuMTZEaa/1AAAFdUlEQVRYR+2YfUzVVRjHr+byBbz3934uaGm+BSRFJBddjBfzJV8mBEhUSsiECRSSRiaSoSijIgiUl7VquWzgHzIdspyuRW2izPojNObaKAcoAsaQOf1Dt2/PcxTFJLhOh/9wt+/Oueec33k+v+/znN+9+9kqKveNOVJ31BUUHP6FbaxeMWacOeJS9ZmV27Ztj7fxh2F8/FwgGNDkY5HtCQPjxltYsTJmk+22M4MuHEnZxuh41jcQtttpGnTRSIpdsrxmENitPA66aCRlG2tAjAINoVGg4TQkkKIo98jDw2NQORyOQcc9PT1ht9v/d+6/+3NMt4FM00R+fj727t2LyspKlJWVoaSkBAUFBfDz80NRUZEc47k9e/bIuaysLAQFBcl+aWmpnKuoqJD91NTU+6A4pttAXl5e6OzsRG1tLRISEpCdnY2rV6+ip6cH4eHhuH79ugyYmJiIwsJC3Lx5E6dPn0ZsbCxu3LiBqqoqpKSkSJAzZ86grq4OEyZMuCcGx3QbyOl0oqOj486dpqWloaWlBd3d3QgNDcW1a9eQkZGB6upqREZG4sqVKzh16hRiYmLQ0NCA9PR0CX/58mXZHjp06NEAlZeXY9WqVfLO6+vr7wHKzMxEXFwcoqKi0NzcLIF4HUOyQwM/jwyIHcrNzUVeXh6Ki4vvc4jrJzk5GQcPHkRjYyOio6PR2toqQQ8cOID9+/fjxIkTOHz48MMBcQ21t7fLNNXU1OD48ePo6+uTdRUWFobe3l40NTXJOQ7I9cWp4pRxfbW1tUkgnu/q6np4IFVVERgYCFeQCy5XMMklTxCPCSFkn8f6xd/9/f3h7e0t+6zg4LvX+fr6ysfFwBgcc0ggBy0yFZ1ah+wbDg2GXYVO8nTY5YamXYOmqLI/mDjQYOOsgTDDAvHfgBDNB+dEDr4y18DLoeKY+S6arK04K7JRZSUhTgvCn+Ijal3wVOyYLMFZBEFtf6D+MTu1rLtjd8eHB7J5wKXNxj4zAWu1BSgx43DWysYvZibWayH425mLZrENnc58JOovI0T1wZv6Atm61FkIpZadE4qBCNUPPupULNH8EasHYZoi4K9Ox3x1NgKoXakHugf0kjoT5UY8ApTpmKV445j1Do6YG2BSuhrEZlwQebgkdqPAeA0/io2otTbgvNiB8wTb4dyNeeoMvKEHo8dZgCaxlZSNo1Y6GsX7qBbr0ULrzontKDVflw4PC7RCC0Cv8zMs057HeGUSEsiBv0QufhNb0EXOfGe+jW5q07QIrNNDsNuMwq8iC81WDtqcO7HZWITvrXVoJ/CLYhc+N2KQSG6fd+5Aq9hJa/IQRTFUcscth5ZpL+Afurtl6lwkUcA22qTR2oz39IVYSvYvpFQwGNcZpy9VD8VJa5N0gWvsJLl4jmqMa/ACAfF4mRmPYmO1dPgPZw6EakgYt4CWay+ijxyqsZKpjubjd7L9BzMNEx30a00WL1afIwc/laAMVUHBLjp34WeRiUgtEJcobeyojzIVP1kb5fWfGNH4kgC/FYmUsh3wehCgaapAuh6BMJWeGQSQRMW8mk4Wnwo+IXOUKcjQXyGwucg2l+NDYyli9Hl4i9LytGKiRXyMr601mKh4YopiIc2IQKEZIwubCzxFC4WhaO4C3TqSHgTSfyzZFVb/BgPnPZTJd1REJ7KeipwLPJAKu/8RwNdOIrjJ1LIG7sUaEog1cLG74qP+gfEqvrHWYjG50H8z7ohjPnIgFt85p+lBYFgcc0igx6FRoOE0CjSc7rxscGjPVPKXwRaNpPh1zOw5AbBt2bI13tP+FD0QVUnJ1o2oOCbBPDnRC4uWRFbKt2hJKZmbFi+JgimmyzyOpDhN7AzD5OTkOP4FuoISQiLbLk8AAAAASUVORK5CYII=",
            bbc_news: "iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAYAAADhAJiYAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAAAd0SU1FB94CFw02CjL/AIEAAAAZdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuMTZEaa/1AAADeUlEQVRYR+2Wa0iTURjH/drFtBuZmhYRRYJFhl2MovsVIku8pBlEWXYh0sysKKyoLLp90EqdZrNwzax0hte0mVtOy5Y6rRaY6XKlm4GNmfXvPcd22Go6A8kFe+HH9jzvOe/72znPOWd2fNeJsCbskoeOgDVhE7KEXdJQ+7fJQ+zbrAHiYkcDM6aDAudiE+oTm5Al+iOUv9EPXV++QC2rRKtECr1GQ+PS7WF4L3qEzhYVVE/E0NY30LxOrYZw5mz6Xa/VQiUuQ6v0GfQdHXhx5pzZdzD6I1ToHwhy5a5eh+q4C5BERNFYHL4XzY9LoCp7iqLAYORt2ASNoh7dOh0yZ3nje1cXCgM249Xlq5BfvIwWTpp8mnsH42+EcpauQHHwFlQcOUZjY6HsxcuQNccHHUolE2ouLqECxteAChX4BaBbr4doxWr86O42EZJfuoKP5RJIo6KZEJErDgmlI/Wd69epUg2sUEXMUYh37UHd9Rs0NgiRaSrdtgNlu/dCU6dgQuRqyi/gam0nnoSF4/NL+cAICaZ7ovxA5B9kenlT2d/zT/ftB9/F/Y88IXvJcrPvYPRH6J/y3whVnTyN25OmmOSeczme/Ug88FkIRWIyQzjDi05HxlQP1rbQP4hbkaEsvjN5KiSRUUgdPQ7VZ+OgzBDQLcFwn9GbkLbhNd0Ib45xYjlSvCmOY7iVsxXvhPfwcNESSpqTC8q4Aq8+d76n7TAHtNfU0GfwhjvSXFXsKVpblSdi6eaY5T0f4p272bMZvQpxu+6z6Bg05ojoqJCcsVBtfIJJ+7Sx46lAyohRyF21FkqBEG/S7yDf149KtdfWIW2cC2THjqOel4oUh9Em/Rl9CZEH1cZfQ23CNZozFtJ9+ow2bhkTBB6e9L4iMYlOg/KuEKKVa+hG2ijKRd56X04ihbZJ5frX3Uikgllzfdj7GJaEyOiQUZJGHe5zhAj35y2AukJGJcm0kVybXI6P3PlH6s64LTmGtA0NJjmKJSHyndSRWibDt86vTKg+mUf3GgLJGfqRupMePMRiScRBfKp6zmLSN2OaB9LdJnE7+TuWZ/Qm9IZ/G7xfv5JAVlxTXn5PjXDTQXZoA6RmDO2KgkLAd3Zj8S3nCfT8M8RkGj8UFtF/DeQoMuQZvQkNGjYhS9iELGGdQuZuDCI2IUtYnxDflTuTrAZ3/ASxQM2wMID8vwAAAABJRU5ErkJggg==",
            bbc_weather: "iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAIAAABuYg/PAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwQAADsEBuJFr7QAAAAd0SU1FB94CFw4CI8kh1UMAAAAZdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuMTZEaa/1AAAEHElEQVRYR+2WX0xbVRzHZ+aDZo+aGKMjS8YWcYmOKCRuThsCbIlhYJYYQ8gksreJDyaDxWRR9uCcWw0saaEFimAM0JUZLJHIv4IrLchIi2CKSGkDpSsModDWtvSec/3e3rOm0Faari4++Ml9OL/f+fO558/9s49/jPwvSwtpkxG/nbpHeMqxOB7pk/1ezt3dT1e+Y3E8kpJ5vd7JyUmtVqvRaLq6unQ63dLSEqsT8Zg4/X7ulww+5GaZeOwtW15eVqlUcrm8oaGhsbFRqVSiDIaGhkKhkNCCbnPmNzn9E+R+U7hHQvaQbWxsQICh+/r61tfXMUWPxzM3N9fU1CSTyYxGo9CIhIjjJmc+CSsiGnAQWzUNeYWqnSSUUUp9Ph8cMI2MjLDsQ9bW1hQKRX19vcvl2t4WHDwhNLBErB9zo08T/T7q+ibccAdxZNA4nc6Ojg6sG24fspWVFVb3ECxgT0+PsJpyOaY+Pj6ODHH/LOyc8Vli+5SGNlnTKOLIHA4HNBilublZlKGwtbXFqsMMDw+HRXKsJ+aHQm9vLyFBcl9BgqusUQy7ZZhWe3s7+s/MzGB9JiYmxBOBkLUQFoy0tLQg2d3djUljF9EF4cLCAmuRgN2yzc1NdFOr1Szm+fn5eRwEjMjiMFNTU3gYAoGAGFqtVvQaHBxEmTMcEC/i+lasjbBb5na70Q3PE4uTw263o1d/fz/KOB3scrWItRF2y7BEbW1t2DObzcZSe+H3+3FzkM3OzrJUAuIcECw99gxgt5JBPE3YPy4UoH/28NsbbKAY4sgAlqW1tRVDJANuCy+wYDBIPWZO/yQ39hyxX+FDD9hYUcSXpQQlPguxvMeNHhA2zJTN0lGkQ0Y5stpJfjsrvK7w6AScxPoJWb3NaqNIXUacMu7ey+TB9zwJcqYcYTZOGatLwCPI7J9Fzjf1/sqNPsUZn6H+nZ+enaRHFg6vcOPPk/WfxDAuaZPxxEeDa6ycgEeQeUww0b/+YHESpC5Lgf+GbHp6ejQKvPjxDhwbG2NxGIT4TzAYWChisVjYEDEklJ0792529qtVVZcqKy8eOXI4M/Pw4uJiVtZLBQX5SJ4/X5aR8SJCfOcOHcrIzX29urrq8uXqEyfeqKj4kA0Rwz/JiouLVKrm2tqvL1yoiMhqaj4vL/+gt/fHo0czRdnx468YDIaionfOnCksKSlOXWY2mwD6R8u02h+QxCREWVlZ6bVrXxw8+IJ4pS5TKhWFhfkDAwNYyYistPT9ysqPrl//UpTl5LyG3y+J5O1Tp06ePl2Qoiw3N0cqld648ZVE8lZkZiUlZ6XSm1ev1hw7liXKsGd5eZK6utpbt+ry8/NSkel0g52dHZFLo7mNg3fnTld0EiH+YtXqzuikXn+XDRFDQtm/wWOU8fzfzSKc0QansfIAAAAASUVORK5CYII=",
            custom: "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",
            gmail: "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",
            google_calendar: "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",
            google_find: "iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAIAAABuYg/PAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABl0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC4xNkRpr/UAAAUOSURBVFhHrVfdT5tVHPY/MNFF55yLM+7GC290V2YXGi+8MPHOzM2hQ+aciRcuJi5+ZDHzYtlmiGSMBBX6NSik0AIthUKhKQxKP6CFfkFb2reFUqBf8NLyDT7yHl/eHtrSLnvyXL05v9/Tc87v95xfn9svAdvb28lkkmEYt9tttVqHhoaGh4dtNpvH44lEIisrK7u7u2RpURwjtrW1NTEx0dbWptfr7Xa73+9H9oUDQNvn80FSp9O1t7e7XK6dnR0SVgDFxJaXl8VicVdXVyqVgurcWvwvt+7uuOKKvrrK8PCBXdXqfxLLpDY3N7Ggo6NDpVKxLEuC8yG/2MbGhtPpbGlpYSLhMLvc4O3/sPPXFxouPf/PRYoviyo+1d3TMJZ5NuH2uKVSqdfrxbGTRLnII5bNZru7u41G43xy6Y6t5T3ljy82XqY0KJ5ovPxB5y8t/qHUanpwcNBkMuU90jxiWDo6Oopf98NIA7JQeYvwFfEXD6c0OBWlUomDIekEyBHb29tDvWEpk4pV6KupXCXytqU5llyWyWSBQAAJSeoD5IihwORyOU6vcrAm7w2VwpPiipqprkQ6iZJJp9Mk9QEOxXDKqOC5ubmO0Nixl1Scr8uq3MkImsHhcAg3dygWi8X6+/vTWfb9jp+p4Kfgx913EumUWq1GuREBodj4+PjMzMx9ezsVxvOC8pZydpTiecVNahlP2YxhYGAAOYmAUAzlnkgkzrcVDFYERshSAaonO6llPC/1P5idnYUnkKW8GAyiubnZkwifkX5FxfBUM1b93OQNYx1Pezz4yKWllvF8V3EzkIrW1tbyPU7E4HU4376I/VXJl1QMT4hRqY9+EfKNx9dMMS88BbbHqRAxeAwsQxu2nXp2YmeklUNRF/YQDAY5FSJmNpstFovIq4fXUTE8yxUDUUFwL95NiNjk5OTIyIjcZ0RLUgE8yxWD1WkYa29vL14iToWIwTt6enq6Gesp8TM7xteklcaoE5YUjUY5FSK2tramUCiM887TkqtUDM9yxc41Xbcs+urr6/m+JmIwFfivfzECp6FieCK1f2VB2NHRTLKI2AXVLTfjb2pq4iQAIgbgzsLh8Efq21QMTzzTZKkAv1nl1DKeN4yPxsxmzA1kqVAsFAqhINUh84nGz6kwjniuhB3NsVD1viS6Mhh2wPhXV1eJgFAMJ4uTxDRxdeBPKvIp+JNJgnPCIyx8sg/FAHgxjN+y5Dsru0YFl8V3FN8vZtOYuvg65JAjBhNrbW21Oxx3bYoiDVecbz7+Wh+2wyPQYdQ8mSMGrK+va7XaqRnP324dzp1KdCxPiira/E+MT4axLYx4JOn/oMUAPDSYIIJMSM1YTksLtt1RviX/1hEPujxujUaDH03SCZBHDIBPo/MxaetmbRd19841fUPlpfh263fXDbXOaAD1jAqERZBEucgvBmAiQ71gyLWMW8cWvH84VJ9of4eRCzXOyqo+67sP+3YnGNPYGDaEoePo6fEoKAbgeuPxeE1NDd5VNptht7KJjVWGXdIyNryisI/EBsturS8uLdXV1YlEIrQUNbtRKCbGAXqwHBhB3iEX3dnX1yeRSPA3h3wqjOPFAIx/3EBOlTL2YTAY8D2TyZBPRVGSGIDqgr+gdfj9oSlRC+gTzC/cl2NRqhiAfeDZxd9AHB2uB+899lT8kiiUIQZgE7g8vHzY5fT0dIl/OHmUJwZAAGaNv7Zl7ek/7O//CwuFrkZsjXN3AAAAAElFTkSuQmCC",
            google_keep: "iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAYAAADhAJiYAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAALEAAACxABrSO9dQAAAAd0SU1FB94CFw4FNAWzxkMAAAAZdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuMTZEaa/1AAADTElEQVRYR82YTUwTQRSAC0G06kFCIBoTlZt60ODJiwcOJnoxnIx6MMarBw5qYuLRizEheiASYwgnLiYmKmL5K5T6E35EuJRgABFoKggqxv1pu90+35tl2+7yFnZbKU7yJd2Z6bwvb2dem/GZDXp9lcg9ZBGBIjGMXED8axpGw446ZAnhvlQM2pEqU4Yys50yJq1IOQnRa+ImbAc1JFTMPbMZDSTEDbhCeu0MN98FTXkJGUFLQAnXQiJyC5KzzcgTSEzcAeXdaTGWp1SzZyEKJPceBi32HNLxGKSVr5D68RYJ4+dZ0ZdaCoDSfywfKfdCRlZ8oISOg/5nQhAfvw5SYG9mTHrjh/joJdB/j4MuT69li1/PAY9CGFz/NYIMYZYOZUVsyN1VkFoJoXQEP1eLPm5NBm9CichtSKsLoAyctAhwyMEa8TqT0w/EM7cmgxehUtBXR0Gbb7UE3giS0aXPIHWUs2syuBUqBbnnoNiw8bGrbHAOdfC8+I4QCu8H6N/HrG3BvZASOiEWVwfPssE5lPCprBDJmLAxBB4yFDxiZOjjRTY4h/qhjhdylnIvJHWU4X6YhOTMIzY4R2LyrqhNUmDPFghhgOTUfUjLM2I/2YPbkbsqxLHX5lvEM3QhG8sQboRKEENI7jmAWZqC1OIrLIK7LQIW8BVp0TbMzhxW7KOiTwiZsHEEboRKM9DC6hCeHHUeUstBkDsrrCIEVmsSTqtRrNqXRZ9FpnChMoA+v8AMGh+7JjarNteCteahlS+PxVgicjMz/98KBXdkhEwpdfCcCKqvfhI/I1ZGjNM4eoWXKVxop6OQ0mfsj1zkzkoc++Ys1INwcQzcCO1yFNJiL0BbaLMSfeacoW6Ei5FlMyE8YTkydqHU917cwO1W8L8QK9SPtYiNYaEwIU+vjF1/HQVmaAX/KVKWclkO8Rli11+Hiz1Em9AmpAzU4pF/ilV7WgS3gDWKxpT3Z2D1pW2tzXEhRNiETPSfw+uEqJJL7b58ZAiPQjl9JERBOXLnecSlUPH474QaSYiuRLjB7aCehOh+hhssNlGkmoT8CN3PcJOKRRK5Ie6HqOFDFUL3M9zkrYYyk5UxG3aWIzVIA9KENG8xjUg9Ur2mgM3n+wu7+eTBX89pygAAAABJRU5ErkJggg==",
            google_maps: "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",
            google_play: "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",
            google_weather: "iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAIAAABuYg/PAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABl0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC4xNkRpr/UAAAKtSURBVFhH7ZVLb9NAFIXzc6mADVDxEhIvCSFYAQKx6g4JBAh2iLcQRUiwgV3SRm1ix3m0tWM7Lye2D8fONDg3tpNUEQvUT1dRF835MjN37hTwDzmWrYRjGfw27A+o34F+Hvp6XBfRvA93E0FH/c88FpD5DsxnqJ5G5UR6aedgv8HoAAjVVzJYRGah8x2tx9Ihqn4T7lcgUN9KI1MWhmG327Usq91ue54H34XzUQpEaevo/MjxTckoCA5pNptbW1ulmHK57Lougi5aD6VAlH4Bg7KKm0HJqOEKGFosFpluGAY/+fcEiqP19X7BuIbKmnQkq3EXgTuOFSgZd4xxKjgDbinCITwd1ktUT0lHsszn41iBku3t7anIbPhrqtVqr9dD6MF6JQXJ0s6kLq7A47FtW9M0FTkPKrkNGO3DuC4dk6qeROenMiQo8KjmbqBgZ2cHoY/9Den4W2s4eKIMCQpcVn15oq+aT/M6pfUozp+iwD48AtFX7bd5Y4WXZIa0S+1+g/N5fnGm8GyEg61h3ED9NqwXKi1BmowTVkTklH4JzQdRGVfRvIfe76xLRtJknOUiMbVql6PhxLZkOss3+TkYDGq1GjuI8GijOZAgdRs3Ze5sRWOpxGvDa9eKMU2Tpt3dXdWyMezz6F4ekibj+8RHS6SLcr8Mh0NONZUaIybcGC7R9/1xcJqM2O9kerLqt4LAazQaqemC7e3taAjEZMj4EvJ9Eo5J2e+5LLFjWXAnOx31lGfICB9Mvk9TmrVoRPVLfIf6/T73R+XlwtXzREejESOzZXwD2WxshImsdgVehQfODaxUKksNOZ4uR0GOjAQY6tH7NJY5nzxvQI0KWAauj3MxXxbDO2S9hnaWXcqpvUhTpMLNXEA2Jp4LjuPoR4U/dGHZKjiWrYT/VQb8AW+EFh9q8p/iAAAAAElFTkSuQmCC",
            google: "iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAIAAABuYg/PAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAALEAAACxABrSO9dQAAAAd0SU1FB94CFw4DCHyGHUIAAAAZdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuMTZEaa/1AAAD7ElEQVRYR72WXUxTZxjHe8PMluzCO7Psdpk3JruwG0tjt4mIYpfFLwxzxk1mJJqgF2oUMV64+sEi8jWV+AXTCWnVCYogrcYZ2EAFiqKAziAaWjj9gp4eTs9X69O+L/X07TmlbQi//O/6PP9f25z3nKMJJYHkpwP3rb6K496dv7rycqkVOmp5JmXQuzat9u4ros+f4nofS4KAp9WZQSYMDUwaS6iVOipLmziu9Sv8F05LXg/eVEJVJo7ZJw7tJRpnjkHP1NeGVH6lsoxta4Y1sijpeLZvFuyjuEtGnCwYpE+fJJbTiHNNtjjmwJ3TxMokyXfCSKylF/jG0IZrp4mR+WtriJ30omgC3su4rg5q2ZfEmjyeooKpa/X84DNp0hsMsCI1zvU8pM/94co3yMfUTACWwUlywgGS7cjjLtzE9/ehSQUEnrlhogzfwGQCE4Bl9Nkqebs8vqrfJZ5HYwkQ3rxmrlxMYAIiMs4VMC9w5y0iNBD6bHVkbHYIy6SRMsGawd+eN7HjM7nJW7wLDc0WYZnQpQUZCn3kEyp7cVi2Si86KTQ0W2hCgVHB+kFUBmEvznf98AV9pgKPzB4aafya3ITCNX4kOobxiBI9w0KLjU8pTp+kEV8dJkwQvv1z3KrCQTO71OhPKc29vEZ8vo0whdOXh1tVSENW+w+nEZ7kkyZrhjhYhFtVSENWdScwd7KTLYG5+xur20A2VxdI3QNO+dJ3tH085nuDi5Uwd3K/3WDVknOUJkyQ1j4eDrWdONSPWhbkmAwVvXW4OEU8fikrzgQZtIuR21Unvl3x1ow/by78qmHN4oa1S8w/Olk32k+J6w95QgPJLfULYuTeKL4O34gnLB/u/ftr0ESz68GRICpIGiYgbahkCBOkxMTCp5FHDO8esny61pwjN6FU2i6FB5LmWJPyhXO3P/xEjMhCoeq+S4QmmtLuc4I089suPDUrWwOEA2VduZ8Twv8RltEcs7JxK6GJZmPrbptzAE0q0u96saW54tvjI4QG5WoXh8awDOiw92gb1hEaebZYi+uHbj1zv/Swk4zAOqc8Nmrg8mBTgaUYDWj/+llf1kmYfqlhou/H72VAzdOGaHW6Wa87dWWpEZ+znGP0C4eI2wkZvKwYH52J2085mecPf3d0HE6b5WnMm1KMDAiGguW9dcRyGsm8vP2mzYdLpyFliObh+/qrPxH7ySfr+ub20W7cJUNZBjj81J72Um1cUeLAJbb/3zIn68UtsajKEM/d/5f8V64z5xOl8dGZ8mFywP0KbyoxgwwBp9Ay0gGnu8B6ILdxK7gzTXlLzBu/byosvHfoRPeFe287GX4KT6sRCr0DEQdDd2TYxmQAAAAASUVORK5CYII=",
            guardian: "iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAIAAABuYg/PAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAALEAAACxABrSO9dQAAAAd0SU1FB94CFw4GL6T7XGwAAAAZdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuMTZEaa/1AAADy0lEQVRYR6WXPSh+URzHH/xForwlBmQRg5D3MCoyWKWYUMqgGA30zyQMDAYMyiAsGJTZJCmDCYsFYSDy/vy/55zvvc85597ndj3/T6nnnt/L1z0vv/O7kWgILi8vl5aW+vr6qqurc3Nz/0jwA48YhAkOdA0kSOzr62tjY6OlpSUSArjBGSEM9iOu2MHBQUVFBTOFBiEIZAoPPmKvr69DQ0OMTgiEIwnTadhiNzc39fX1DDLBOjU3N4+Ojs7Pz6+srHR0dGRlZU1NTbW2tiYnJ9PJAUmQikkdDDGYfaeuvLx8cXHx/v4ePk9PT+Pj40VFRUlJSTBtb29j8OLiYmRkJDU1VfkrkMrSi4nhxb3vlJOTs7y87C77w8NDVVUVbZLs7OyrqytlPT8/b2xspEGChPp8xsQGBwfp4oBJu76+plnS09NDm0ZTU9P7+7tyeHt7s+YGaZUJUAxbiEaHzs5Oa5EPDw9p84CJpVM02t7ezlEHd38Ksc/PT+vfweu/vLwoD5fu7m6aPWD99vb2lJtXDMnVQggxHEYOSzIzM70VAauF3UgPP/Ly8tSce8UAJGASYlgbjklmZmZEepOtrS2a49PW1oZJ8hVDfUGSCF6CAxLsrufnZyWgMzExQY9AcJx9Dw8QQiijfJIMDw8zvUlXVxc9EkUIoWzzSbK7u8v0JpWVlfRIFCGEa4JPktvbW6Y3wfrTI1GEEK4lPkUiqHXM7SF4K4ZBCOlZSkpKmNvk+/tbVcL/QQjpYmVlZUxv4hVD1N9ACgsL6eoghPRphAfTm/z8/HjfrLa2dm5ujh4aZ2dnAwMD1g0AhJC+QVJSUj4+PhhkkpGRQSeN9PR0mjV8izUQQtbWPz09ZZBJcXExPTR+JSaErEONW5hBJlZJU/xKTAhZ5QqXE4NM+vv76aERXgxLLoRgtpq1o6MjFaazsLBAs0Z4MRZi/FlXDBoY7HUZGOPk5IRmjfBisSsGN5tVqmdnZ2VgDOx+HHmaHUKKGZcnsNoCHEBvRZ6enqbZIaSY0RYorMY0LS1tc3OTNsnj42N+fj7NEq8YGp66ujqaJUhLmy7mbeWwhcbGxvRmZGdnRy8lltjx8XFNTQ1tkritHPBtUktLS9fW1txmbX19HU2KMrli2D69vb1WX4xUcZtUBczeVhUUFBSg8d7f34fD3d3d6uoqOg4UwMnJSetGVDQ0NFhKwBYDePHgDwvUSbTfvtVSEfbDwgVbKF7rEgBC3L3nJa4YwOHAYQzzMYhd818fgzooayijKNtYHlxLOIUAP/CIQZjgQNcAotF/uRmYoXFpNt0AAAAASUVORK5CYII=",
            inoreader: "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",
            met_office: "iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAIAAABuYg/PAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABl0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC4xNkRpr/UAAAUOSURBVFhH7Zbni1xlFMbnD8i6RhOVGHuMDaxgrEhExBYUoqBiFxuKEUsQRT/YlQgasQRUokRDBGOLyM5s79nZXrO7c6eXO723O/fe8Tdzr7Mzs5uYDxs/yB4Ow92d897nnPM857xjKP6HtgK2LLYCli04g2mjJ/GDK77bl/w5nhtRVUn/7qjtX8DUopzMT437nzAJa5ssDRU3Co1djksdsS9IQlHzpcClTC0qfJuXA6FMizWy40hgBE0FtjULJzVZVtV6Q7vtHMDabRtarOt6nJsm/E9Zox/7kj/5UwdCmVYx9as7/t18+J0x8eEe51Wt1vWc6nVevTQYGflTv3fYz6/FWAWAPfZ5WhJkJamoWT5T0qw1uqPHeWW54prgOl8STE1Llkn/M0ZLY3Vop/1CZ+wrpYonOlxQYilpLpEfT+Qn/KnfpgLP97s3E9liPbXZerLmlE4DqH46+KJBVlPaYZobyw5woNV6WjUMKU8FnsvLohamGZGj4oMd9vOahbUmYbVJWNNmO2vQe6c3uY/m52QfGWueK3glJVrmtWgwe7ZwptNBOuvqqsE77BcE0n9W85+WrGPio0bh+LrIkmosjQgHOqcDL/hTfyTz05ISAQbd4gUlYXAn9pg9t5OXUVhdOclzl+MSIfIRjdJBikVZTbviX9OiShhuEk7odV0zF3ozkDoQzw1HswOexJ4J/5Md9o28xCScSOma97tuMDhiu8Tk/lzBE8uZvYl99uhOhBTLDZKIDlI2BqDffaPRclw1UrfzcjSNUvSgBVMlOYwmh7x3AaMFlwQyJj5EB8h3JvhKONNBx9ViQT9SVkGmYBciH0J1BQOHV0vkvQpMQUmG0qaZ4Mt9ruvb7eci2jHxEXfi+2zBLauZZH4SLj2JHw3omMmgoBHffe32ja2206lgwv802IhlwH1z3ZxBjNlzB3xoMPTWHd/d7bisqbZozdEBOgIJFBJakD6zVVDikWwXk0iv645pTire5F5NWhhtMHturestjgLGxcfmw2/Nh9/mgVqRKyka4HbAc8uI797JwLO26E6qzMt+CBOTvxwKvTrs3cro9Ls2021nbJckRzQYAuzRzxaJZc2o735WqKrqRBCG9GkmU8hCMYBUfYA0SX/YezeqKfMna15RP2Uhij7XdbUrowGxRbP9tIcYWUmjjmHfPQwVnWRddTkung29XgJjaDrtF8EZxTG/PLB+mq2ntFjXmz23OWJfIhzWRCTb54x/0+e6tm4cUf9McLuslJYDYOFMe7fjitpUSl5SI7cGstYywhCY1kY+qWA29Fqvc5PRsniENW9gazAnWt2oYFR8YDGFqJ8UDwW36wJBGkhz0LulzXZ2qXDbGSiTPnCJIDzKmgu9wX5D8dRBZbDFKgik/9JuNT5d8W/rKMTZJpbwu9mCp8yiamBz26KfLl7wFeftXBNC5INEbozZz0jWtDSfl4NaNdAZy5oZ3rqCqGY6sK1uoxpGS0O9EFR2rqsNSGDIu/Wg+6ZyQaULCWrZYawiW/QTb2Iva8kSef8ga2XRnuRUPDekI1RZtRob6NK4+DgcMPb/KFBloUB+NNtH01kN6LtMvuYLAJpDAX1T1Jz++lrTwaBhJvgSA6H/+zCG7tk9VMYs122WNtuZrCs0oocuZSUwBp7rnFfp/zsKo25JCbO7mX1fcj91IzH9u8ObgR8zMK//dYzNwDWqPx57O9Kvq2W3FbBlsf8rWLH4N9yBDrVyKv1oAAAAAElFTkSuQmCC",
            outlook_blue: "iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAIAAABuYg/PAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAALDwAACw8BkvkDpQAAAAd0SU1FB94CFw4FNAWzxkMAAAAZdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuMTZEaa/1AAADGklEQVRYR+2W60tTYRzH+zPKpCgryOgeUUIXfBFRQUQvzOhCFEQQpTNN0UwtM4sukqWmJUqm+MIyyqlzc3PTOee8bKKmNqelzjaX87a79mXneJTj8bh1Vi/CL1/YeS7n9znn/H7P82zFynD+P/MyzCf2ArY6onxDtGBPkvjki/qo4rZsiW773WraHHazwfx4/MDYqmPP6iKKNHmyPoXWNPDLMmVzTk/PQFaHKyi5hnYLu+dgePCdCdUn0uQ3CtTpQq2g7afOOGm1u9yRGcQJdihVOmlzuojH9kCcYMGPZY5FX4NB/zUs+JHs+HM5i488qUUpUAhOsPPZjRNWJzLNaNTtmMWxK3FueXCCHX1aF1aoDivULDRKGu89Mm7DuqQQbDA8WrFy4Pq71vBCjajDgEolB9wC7GKOCtWLXpoxs6JteH+yxOghzOWavpbfEhBdeSW3+Uymcm1kxSuhlhxzi4AtXCl2pyvlS1dAtGDvPbGnsDK1fv3tytruEVwjYpa4F00sc2IUYoQNjVrQue++RNplPPe60SMYQlx624TZVCzThH3LHeGbGh3ZdsNOpSuGRq1EEzPxZLuTqs9mKQ3jNtznKQyfAulN+tRJNCH0HHwond8DWNCDGiSmpd+MzGVLejfFCFLLutCPUe9gh1NliaV0WPLnr2TbDQvNUsaWtG+OrQrJUO5IEPHVw9SX8AKG3ws5KsSa7ZjBlwmMExYpfpDt2Zyh8EpUgzffq+enE/ICBpU2D62Lqqz/ZsI1utMEPRtjBHozmSGIgNEKhJJ3MFxfzWsB4HJu0+mXCpRygfw7OeaWL2GQzeH6oBrkFWniP3a09ptpYZeEhWYqG7SmrfEiCsEGY9eSMGxm/rfmdmH478Ko4IQ5wVCu3fqJnmEGd+vHD6RIqeCEOcGwqHFcLWYqMmVusD8+qbGtiTsNvYZJ85TD4VyaygkGr+LxcZRsixcht9gUciQ6eY/JMIYlwMDmCmO0f0Q5jvaQjIa4kvb82n5s7X3GKZyrFrvT9zCa/XjlayIrcNzg7yyOVtoou72GcfEyzAcO5/8GgMG7w4ik4WAAAAAASUVORK5CYII=",
            outlook: "iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAYAAADhAJiYAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAALEQAACxEBf2RfkQAAAAd0SU1FB94CFw4FNAWzxkMAAAAZdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuMTZEaa/1AAADEElEQVRYR+2YS2gTURSGR6ULEXwVUUFciEs3igjixrp040LwBXajCze6ElF0oXbpQkHBhbrQnaio+Ki21dZHsVhFarA1rWitbZo0aZu2SfNokt//3DtDmzLJTNo0KeIPP8m9cyfn49xz70yuYQkNRiVdQ/tplMgSS2JWmhha7KiiA7TdTaWwxK6yYCQz5YSxLAyVAiQpsxtQDtcIUClrxsl+AbK7UC7/i0D1dB39wvxuN8a9ZwBkAYil3bIZ8J4AAg+AL7tnC+UEtAB4vRhoWg68Xa2Dd55i8PvA+A9kKTMBfN0/x0DNGwD/XWCsDUjHzMg5lI4TaN8cA7VuA1KjZkQHlQToI4EmRsyIDhIgz2HgzSpO71obrwEaOfV2cSZdTCBO6c/zwEve52S7WNqBgoEmgvWIdpxEvPua2WNKgP6wL9bDQcNTHAYSfr0SnYEGCgKKek8j+MTA0Kt1CD03EG7ewtWV0hcFqPd61nileK/eDjwH3QCFXAOlIt8Rqq1A7Ndl1Y51X0XomcF4t1VbAfVc4WdCt0WyPbTuAAYeAr6bboAGXQPFffdUdtR+I+Jn8LGB8c6zui1F3baXmTik211ngM+7OF0B3e674QZoyDVQov8RQk8NZJKDqi3bgQLquqDbkqE+ZqH9iF5R37jipsodUNg1UDrux2DdMu6R1Wr6Ip5jqo6SLHI9wKyhTBqItLMjo/stuQMaKaiok8EGQiykFyHE6Yt6z5lXqFxFbcl3yw3QaEFAWmmkxjycOi7pqXIC8h7XMPl38sgMgHJI1RCnJZfa9ky+IeR2tIhAXGUdR3nPVuDT9my30o1L7GNke9wBiD9urSonFefhGs8P1LSCy7eazygubd8dINzCjE2rHUvFAUrkBxJbAV5VEHApn+Z8UfuwiRvgAeD3JWD4nUlEyeNhdkBJZ6BclsBSpLJyaunmjcD79fZj3Ts1c6DpFsDZZUecFqD59EcR/4HyOEOrV9j5ctggQOqwYT4cx6js0Oo4RlzOAysLZqc6sBKxYWWqlEd6AtJPX6RXahLD+AtxYLsG407rGQAAAABJRU5ErkJggg==",
            pocket: "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",
            wikipedia: "iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAYAAADhAJiYAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAALEQAACxEBf2RfkQAAAAd0SU1FB94CFw4GL6T7XGwAAAAZdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuMTZEaa/1AAADGElEQVRYR+2XWciOaRiAPztjX0MpjkiW5EjZDhxIcUQ4cGCaA2NSipQSsoRCKGQ7ECMTyhIOFQeaTMnBzCRjbTASxr4v1/X133r/1/t8/9LvhO+qq7/3+e7ve+73We7n+UtVqnyLLMMVFfwJpS+uKtCY7ijtcTmuzbkE2+AP6Hc2VrC0Gc/gG/yY8RzuwXkofXAfPsGIeYWHsCdKB9yKlzFi/sH1aEK6Ev2dfzFi3qL9bcMyzXANRsAH7IpF/Ih+btx1bI15xqMxz3GADQWMxvc1zsLmWIse6BtHUtOxCKflP4zEx2Iep8jPl5afipmIfv9Y+SnBrxgJnUJHroj5mIpri7dr7GJDgr34Dh2pJBMwpuMFum6KcM08wIgbiMHPaLujlMJE/d7fWDTln3HRZRebOyLFBoy4HTaAu+gK3sOONiSYi35vcfmpDhZgdHQD7aQIR8+3NO4l9sYpNc9u9RSOyCV8ilEuKmK9ia3t9E3GFNsxknc0/8BnGGWgiBHo2jmMqTVaC4MOYnRkfUgxFK0hxjlKvsA6rIR1z/hJ5ad64lvE4tbhmOIkRtxDTG0E6YSP0KXQwoaGcBajo502JIgCZ9yf2ApTTEVfdGH5qYHMxEjoPloQi7DuXEPj6qorJ/Axuk4bjMNrIpHUL1hEP8yeb6exCKfS9Xa0/NRIPLmjI6ejqIitRj9/XfPXKRmGebxV+FnRUVNv+mPUGqdjHGbphv+jFdeTOpLfjVna4VX8C1va0FgsAccxOvLcyuIx4Vt7Wo9EkzbO3WaywRg0rtJxUm9GoT9mR/4dhOKbekzcQu9BJv87RvJOUXAAvW81ajHnsaMLGB1tQXEL++w6C6ZhxN1Ed2YvdNqPYJMxG6Oju+jl7SK6frLnUWe8g8Y5mjPQC527q+I1o6GYgJ1HUp5DdrgL83imRZyL3dGt85rRGDZhdKQmNBjzeOrn7+eLsMkZgtmOrLop9mPEWZmzO67JcFedRzuxCHoAp8ieb7/Z8LWInWU9+uK/hAye5N6NnNYmXcx5LAFzsD43Pf/98QWqVPmeKZU+AdCH/pUXFAsCAAAAAElFTkSuQmCC"
        };
    };

    /* ================================================== */

    if (document.location.href.match(/google.*chrome.*newtab|about\:blank|google\.co|dev-new-tab|new-tab/i) != null) {
        try {
            if ($('body').length == 0) {
                document.location = "about:blank";
            }
            else {
                obj.load();
            }
        }
        catch (ex) {
            log(ex);
        }
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