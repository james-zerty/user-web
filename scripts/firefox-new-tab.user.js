// ==UserScript==
// @name        firefox-new-tab
// @description insert bookmarks into firefox's new tab
// @namespace   https://github.com/james-zerty/
// @version     11
// @author      2010+, james_zerty
// @include     about:blank
// @include     about:newtab
// @include     https://www.google.co.uk/
// @require     https://rawgit.com/james-zerty/user-web/master/scripts/jquery/jquery-2.1.0.js
// ==/UserScript==
"use strict";

try {
    var logPrefix = "[firefox-new-tab] ";
    var isTop = window.top == window.self;

    if (isTop) {
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
                if (me.isGoogle) {
                    me.doodleGone();
                }

                me.addStyle();

                var body = $("body");
                var outer = me.addElement(body, "div", "outer");
                var inner = me.addElement(outer, "div", "inner");
                var t = me.addElement(inner, "table", "grid");

                var tr = me.addElement(t, "tr");
                me.addLink(tr, "Gmail", "gmail", "https://mail.google.com/mail/u/0/#inbox");
                me.addLink(tr, "Calendar", "google_calendar", "https://calendar.google.com/calendar/r/custom/3/w");
                me.addLink(tr, "Keep", "google_keep", "https://keep.google.com/#home");
                var td = me.addElement(tr, "td"); me.addElement(td, "div", "spacer");
                me.addLink(tr, "Inoreader", "inoreader", "https://www.inoreader.com/" + me.inoUrl);
                me.addLink(tr, "Pocket", "pocket", "https://getpocket.com/a/queue/list/");

                var tr = me.addElement(t, "tr");
                me.addLink(tr, "Met Weather", "met_weather", "https://www.metoffice.gov.uk/mobile/forecast/" + me.metWeather);
                me.addLink(tr, "BBC Weather", "bbc_weather", "http://m.bbc.co.uk/weather/" + me.bbcWeather);
                me.addLink(tr, "Google Weather", "google_weather", "https://www.google.co.uk/search?q=weather");
                me.addElement(tr, "td");
                me.addLink(tr, "Amazon EF", "amazon", "https://www.easyfundraising.org.uk/retailer/amazon/visit/");
                me.addLink(tr, "Amazon", "amazon", "https://www.amazon.co.uk/gp/css/homepage.html/");

                var tr = me.addElement(t, "tr");
                me.addLink(tr, "Google", "google", "https://www.google.co.uk/");
                me.addLink(tr, "Drive", "google_drive", "https://drive.google.com/drive/u/0/#my-drive");
                me.addLink(tr, "Maps", "google_maps", "https://www.google.co.uk/maps/" + me.urlGoogleMaps);
                me.addElement(tr, "td");
                me.addLink(tr, "Contacts", "google_contacts", "https://www.google.com/contacts/u/0/#contacts");
                me.addLink(tr, "News", "bbc_news", "http://m.bbc.co.uk/news/");

                // me.addLink(tr, "Desktop", "pocket", "https://getpocket.com/a/archive/list/h/");
                //me.addLink(tr, "Tasks", "google_tasks", "https://mail.google.com/tasks/canvas?pli=1");
                // me.addElement(tr, "td");
                // me.addLink(tr, "Google+", "google_plus", "https://plus.google.com/u/0/");
                // me.addLink(tr, "Google Photos", "google_plus", "https://photos.google.com/u/0/collections");
                // me.addLink(tr, "BBC iPlayer", "bbc_iplayer", "http://www.bbc.co.uk/iplayer");
                // me.addLink(tr, "Feedly", "feedly", "https://feedly.com/#index");
                // me.addLink(tr, "Play", "google_play", "https://play.google.com/store");

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
                        'width: 102px;' +
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
                        'width: 48px;' +
                        'height: 48px;' +
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
                        '#tsf {' +
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
                    '#gb, #footer, .jsb, #tophf, .sfbg .nojsv, .sfbgg {' +
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
                amazon: "iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAAB3RJTUUH3gIXDgID8k/1iwAAA9ZJREFUaN7tmVtsVEUYx39nzp6z23O6tLTU3qyVuy312oVq1JRqvKAYaCQk4gPeotEHUCNYSk2INKAGLG4DwWvkwRhvjSIXW0OEB6jUNr1EIKVqy7LtdpuwtGDb3e3uHh+aYMV0tbHtUjn/l8nJTCb/3zfzzZnJB6ZiK8kwDGMqA4ipvgImgAlwtQNYonX6PU7CPi8D3jNE+jsnN7J6JlpqNnJSKrb0NWM/Rkeat+csikl0L56q+0eIUVdgpPloEZhYOYchANLHmAOxNw+29DXYcxYx4D0z9iSe7D0fTdG8mMeoCWACmAAmgAnw/72NXq4L7g/YX9NCQX4Ws25eR3PtThQ5QM+5IIuXlFD9TTkPLCsD4MdDm3F39bFi1U142wdoPtFNJBJhdraduXkpHD7UzbXpFubc8gq/tVQSCkNrWyePFOeAsnr8Afq73uO+4kocDgdbd3zJ0QM6L5buJxjw4XJ1kbPgMG2tp9n2u0RSgp8tO44S8A9S80M7zz9dyJ7PTnCstomNLxfxaVUrB2qaMISND51xVO09zr7qNs6dP0/LyXvYuGkCAPSMZ1lR3IxuG6KxURAOh4iP1ygpvZdtld/x6LI8fL5ZeL0ecuZez/2LZ9Pt7aW+qZ1b77yGxzy5uFxulj50F0tXVrBr++McO97Kwe8bsKkWXniqgF/cgtZf3RDcA+rq8c2Bn468wedfN7By+Y0kT1eRhYQkJAwiGEjoNjAiIayqhS/2tmGzQu78RCQkutsuUPp6Fc888SBpaXYsFkEoFEaSBIZhIISERQarOjzvhOWAZAzx0ScNnO3spf7nQeJ1C7IsocUNt4oiUBSBkAUNjR34+oawKDLvflxLgm6lcudXdHSc5XZHHhW76xjs97G9fDn7qptRFIFVFdis8sQALCwsYffbMoFAiCdXObDHqaTPWEhW1jQ2rV/MjGSNQCCMLCTiNI36pkyKHi7jdMNbpCQlUfpcPpK/nz5hI3nOWo4c3Mz0BJ35+Wux6xWoikwwJOP3p/zr7TPmFbjt7nV/+U7rKmPI3cE8h/NvY4syh9t5+evxd1Xic/VgV3rQMxYAULjktUtjM254aXKO0cuV6ChnoH0r3m+LEHomqp6IIUcACUmKEA6phPo8qPYEUu94n96TW0gc5xee5b9OoM3cgDZzA0HXmwz5gxiBXgwjhJDjsWnTsBa88ydwbmlsf2TRpF73Kqp5lTABTAATwAQwAa4UAKFnXjkmo3gZFUBLzebiqTr8HmfMjPs9zks1gjFfJeSkVDSGiwwQG4iRBY7R3yhRCt1TusRkytRVoj8APglqWvzEB4wAAAAASUVORK5CYII%3D",
                bbc_iplayer: "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%3D",
                bbc_news: "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%3D%3D",
                bbc_weather: "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",
                feedly: "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",
                gmail: "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%3D%3D",
                google: "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%3D",
                google_calendar: "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",
                google_contacts: "iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAB3RJTUUH3gIXDgMyuorE8AAAAzRJREFUaN7tmF1oFFcUx39nPnbjrkmgbEjSrJa20YJB/Kq2SE18kGCfQitF0BcFkT5WfPNFfPDBN/FNkIAIgi0VRAptn4RQSl0RRQTBWPq1pXETyfqRuLszc3yIIalOkpnNjLvg/OHCwJx77/nP+d//PbuQIEGCBAneZshiL6/+5enfU0sEvYKKB9+sM6ThBHq+dbVYVjDCL2rbcHfIYG17/ER809t7zdHiEwUbMMOPmguDP3vcf+xpQwj8WnqZzDLq+sdT2HDFpfhM9Y0TkIjEOeUKay873JuMrxK+ub73naN/PotoB4XOFfBBq6Dhp7KqxeGLvLL/oxZpDIH52SzjM3+/ZYI96ztfy9eKJCmpt9bB97kw3uH7qj4CLqzOOvS02TiuS+GhIKYQp9ALJS8iAgq7VwvD21NkbcEUYWQMPv/BQ9LERsKSEC60GDpalOFPXbozQpsNWUvY3SNc2uWhzhJyCzuCEAtLIGML3Stfn/ZZlw2e6zsnn4VVmXASMwV+GdMlz44Vu8koHPhQOL7RIMxtkDJAzrkz3UCUBMoV5WbJYXPH/6deGHX9BSnwYxEmKhqqAikjWDcQmsBkVfhqRDjzsUMuY2GLcv6BcuY2SMq/Ev9MKW6J0BIKYr1WPZb2e1kZugaWMaP5SnXh5FE4tKYZJKSQteGdFPR3CTs6DWbbtLQJx256KDA23YQSMgS25ZQTm0wG31Vf9z3Ya/K4BidvVTk7alGuzDlIwyWUS8PlndCdXXzVNhtObbXZ0F5h/4g9s3ozSGiFBd1ZK/Ah6c+3zN0JTeFCIfsDV5vMhSRkJ5k2msyFJipwpKBUvGCbP63p3MoCP/0Lj6oNlNCTGpy+44Urw7zNCw+VwlgdfWqkN/FyfuQbxIYYl34ziIaA+3LEFR8rgRrs6xX29QrUYoivh0DKDOibCof7hIsDplwcMOVwnyxu9mHjA+TkS+DLrilwg5HIZ8T3Oar42ap9/f50cAKntrdKX3sVajKn1wVGdd7tVPU08niqsKfX4OimlcH/2JrFjf+e62+TqQUPigdsywlbczN3dWFc9fq4RhavwJbWaT7pyQoJEiRIkCCBD14A7bxY1pjcZisAAAAASUVORK5CYII%3D",
                google_keep: "iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAALEQAACxEBf2RfkQAAAAd0SU1FB94CFw4FNAWzxkMAAAAYdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuMWLo9nwAAAOISURBVGhD7Zg9TBNhGMcLQbTqICElGhOVTR00OLk4MJjoYpiMOhjj6sCgJiaOLsaE6EAkxhAmFhMTFZHPQqkf4UOEpQQDiECDIKgY76Pt9fr4vG+vpXc8B9fG94rJ/ZNf0t7d+9z/f+9Xez5Pnjx52t6CXl8lcg9ZQsAlhpELiN+wUZiwQC2yjFA3cYM2JGDYyU/YkD35YprP0IKUG7acCxuxYUMVLAbVhi3nwkZujvmtqDdsORdRxDHSa3uo6x3QaNhyLqLIlqRNloASroF45BYkZpuQJxCfuAPKu9P8XIEhmgxbzkUU2RRmTO49DNric0jFFiGlfIXkj7dIGD/P8mPJ5Q5Q+o8VEkJcgPRT94ESOg76nwlObPw6SB17s+ekN36IjV4C/fc46PK00Rt0PRsEB0Cz+q8RZAh74dC6cQtydwCSqyEMGcHPVfwYVZNAbIB45Dak1AVQBk6aDFPIwWo+vBLTD/h3qiaByACloK+NgjbfYjK6Gcy8Ln0Gqb2crEkgKkApyD0H+QSNjV0lzVKog+d5Gx4gvB+gfx9R24S4AEroBDejDp4lzVIo4VPrAZj5DOQ9OAJ7IHgk3QMfL5JmKdQPtXQA+xDiAkjtZTieJyEx84g0SxGfvMv3BqljzzYIgIYSU/chJc/w+WA1a0XuquDLqDbfzL9DF7K5eYaIACVIOoDccwB7YQqSS69w09ptMmwCh4wWbcWnP4c78lF+jAfIQN6HIyJAaRZmRB3ClUWdh+RKEOTOCrNxBu7GLGBKjeKufJkfM5l3P0AZQJ+fkzEZG7vGJ6c214xr/UMzXx7zc/HIzez1xQ0Q3JENkAmhDp7jJvW1T/xnhZmR9Go1eoU2736AnbYBlL70+M5F7qzEc9/sA/Qg1H3SiAiwyzaAtvgCtIVWM9Fn9j3QjVD3WOdfB8AVKMe8NUDyey9O2DYz+F+ADNCPewF5DxPuBshrCJH1N+ByD6ziPzHWC7mshOgeIOtvQMAcYJPOEkAZqMEl9CnuytPcrAncI9g55f0ZWHtpqbU1AgIwLAEy6D+HNwRgO7XU5ivEPENwgJxjLAAzSZF7XZ4ICuAe/32ABsOWc2Ej9oqbKlYM6gxbzoWN2Pt5qpjbRJEqw5ZzYSM/wt7PU0XdIoHcMCzlL2wcQNj7eaq4aNiTL9x8RlikHKlG6pFGpEkwDUgdkv+w8eTJkyeX5fP9BZK75MHfiiYAAAAAAElFTkSuQmCC",
                google_drive: "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%3D",
                google_play: "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%3D",
                google_plus: "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%3D",
                google_tasks: "iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAACxIAAAsSAdLdfvwAAAAHdElNRQfeAhcOBTl7Arr+AAAAGHRFWHRTb2Z0d2FyZQBwYWludC5uZXQgNC4wLjFi6PZ8AAAChElEQVRoQ+2Wy0odQRRFL0QwCA4CQhAECYiQgSAJGHwk8RHfo5BJvioEQRBjxJjEdzLJxzjxGxw41EHrLtzFuSenvVXVLd1iD9bEq7fWOl1VbSvLMs/V5cWDowmomiagapqAqmkC7ovWxnhm/VxTywDIE+tzSe0CpHxIRK0CXn395KW7Nic8T768yY2oTQDkpXT3t0nP063J3CdRiwApDdmerSlP7/e3Hiui8gBMntIUfbb97j/6dt47dER0wOn5WVYWkKe4FiXPFdonKsCSSEULQ67/x3Q2sDvjGfw524blFBxgSaSC/Z4nDtEXv+Y8Q7/ncuVB4YDW2oTD+swC2wbikKa4lIbw8N4Hx8v9eYflQwoFUN6x3jmC8ph6njilRw4WHJaLJDmgTf424K4IPflO4qOHix3lQVKAJe7AW9SIkPucU6e0FH59tJSNHS8HTZ5EB7TJywDI34ADKiOkvJw4paX4+Mlytvrvc7A8iAoIkcfblPc6twynLreLFKf81J+VKHmQHkB5EQB5vJh4x/OwanlMX04d4inyICqgLULJA/lWldPX8pi+lJ/+u5okD6IDXIQxfWwfTl9elfrAcutIeXyntWYISQHAHVYhj3/I5OQpr8U5eYjjwPL7rDVDSA4AjJB7X76ksHX0geXkpTyw1gyhUADg9LH39fQRYB1YbhuJtWYIhQNA/+6iC+CdLw9u3p7XWGuGUEoAwJMA+uBy+nfJA2vNEEoLAHL6PLxy+tbfEGvNEEoNAHgKnD7ve2D9rsRaM4TSA8DYyUd/derbJg9rzRDuJSAFa80QHk8AsBYuA2utUKICgCVQBGuNGKID6kYTUDVNQNU0AVXTBFTLResaSeS9XSazxt4AAAAASUVORK5CYII%3D",
                google_maps: "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%3D%3D",
                google_weather: "iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAIAAADYYG7QAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuMWLo9nwAAAJMSURBVFhH7Zc9T8MwEIb5uYzMrMyszKzMrMyszFVVqUQVpVCFIhRFlCLzxHZL4sT2OQ0SQx7d0HzY9+bufHZP1D9jFBRjFBRjFBRjFBSjr6CvtXq/U8+XKjtTj6e/xiU3ecQLvUgX9Jmpl6uGCJ+hjJcTSRT0Xaj8Ri3OXd8B431GiembMpLiOA7Y04Vck0jQbrfbbDavGn5wWd0lHY7jgIk1xQWVZTmbzSY1uORm9ewP4uQK2m63WZYZx9PpNM9zR42BmzZOqfUUoyEIH53uOyF31RgSt752HQcstu4agoiH9SaAerLDoHhwG5LP6AVBGoKWy6X1JmaxWJDlajCaHN8+C/ZMK4hkEZ5D9SRBqVlNwtyxFPxUglAzn8/t9L0gTtVkwkYQzFolKKl0fJjpXN+dRrX5qQQVRWGa3jGY6aSl7adR1ANAOhzfneYnKKicJBvt2PHdaX6CgpxZjjFSKTskBQUJC6JtxOnt1hpJpB0Ms9sLC6JuDPGEga2mvi/RhG33ahIUlLSZY0RCgye79vRxhTudewAd1Z4aagQF8a2Oy4Dt291qtbIO9+DY/mpBzMyoA0FBIDw+YzpTPXZDe2rYExMk3A3QrRusdZICaTWuDDFBwKnKcd+2j3tebCdLQrogCLQ7Hu2XVT9BHDHqy00miC7SqUlnClgsfGi/0wvUl5tMELQ1cZrW7a5fYBwOy00syFCvJ103gxxdDGa5JQoC1p3pBTo88j8FUUx1pwsy6ELmqGknG4LjBP0Zo6AYo6AYo6AYo6AwSv0Az3wwowfYkn8AAAAASUVORK5CYII%3D",
                inoreader: "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",
                met_weather: "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",
                outlook: "iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAACxIAAAsSAdLdfvwAAAAHdElNRQfeAhcOBTQFs8ZDAAAAGHRFWHRTb2Z0d2FyZQBwYWludC5uZXQgNC4wLjFi6PZ8AAADPElEQVRoQ+2YS2gTQRzGV6WFIvhA6gNEqHj0ooggnvToQQuCL7AXPQiivYgoelA8SlGw0IOK6E1UVKpW+7D1USytIjXYmla01jamJrXVPpKmST6/2ZmlTZmYTR+7EfaDH+lsdma/bzLz3+0anjx58pTbQq2xjFwgQQKHaCY7SYGyMT1xgG2kj+gu4gSVpFDZyU7sKGbeTfMWN0i+smVf7CSWjW5ANyhStuyLnZxc85koVbbsSzOIm5QrW/alGcRNKpQt+9IMkh01pJo8VX/rzrGPAwEswwLRbtoA+I8DffeA9ztmGmK2A8wDnhcADUuAlyuk2Y6TNHsXGP2MFCXHgQ97cyxA41ogeBsYagUSEeU0jRJRBtiTYwFaNgPxP8phBuVkgGYGGP+tHGaQCOA7CLwo5HJbpWElUM+lqLvOBG4G4BL7cg54xn6Z0F1LMvcBxkM1GGk/gWhXuTqiJAJ857FIN08amMQgMBaUlcrtACP+UwhVGvhVtxrhJwYGGzey+sTllyJAT0XK+aaiPbK8+va7GyA+/AnhqjxEvl4y25GuKwg/Nujvptk2A3Rf5ueYbAuJctuyFfh5HwhcczdANHDHnH2z3gvxM/TQwGjHGdkWm7h1N2f6gGx3ngbebefy6ZPt3qvuBhj78QDhRwaSsX6zLcqrGaDzvGyLX6CXs9x2SFacj6xIk+V2gEQ0iP7qxbynlZjLadh3xNwHMW5qeYLaA8kEMNzGA0l53JLbAYRioVqank8WIMzlNOI/q76h0m1iS4Hr7geQSiA+5ONSYomcrEwB/Mek+X/fqZ0IkEbmHuAySafWXRNPsOlxMwCrUPth9tkEvN2SSgupX6i/RiqzHYBmrKqTSTn5MNewlOWwhM84LJWBW8BgE3+RKWvfUk4GEFiG6vIYaBGfNvmPzZv1vGHtA75dBAZeqQSUeFzIuQDpEEbFphSVpYo0rgNer9Gfax8HA0xFBJrZ7AtcDDA7/PcBypQt+2In8YpbN5gbFCtb9sVO4v28bjCn6SHLlS37YqcCIt7P6wZ1ihg5qixlL3YuJOL9vG7wuUbM/PTNW+Ig+aSIlJJyUjHHlJFikv2y8eTJkyeHZRh/AX0Zl0zrSHiWAAAAAElFTkSuQmCC",
                outlook_blue: "iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAALEQAACxEBf2RfkQAAAAd0SU1FB94CFw4FNAWzxkMAAAAYdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuMWLo9nwAAANCSURBVGhD7ZlbSBRRHManwkCCLoRdIIKix16KsLSntBuGKViWkfuSD5aZLxJdQbGblBS5YKAS+hKWkhT2YkFoD6FPIVQPBhUGmrvezduuX///nLOa66y7s7pzNpgPfujZcf7zfWfOOc6c1WzZsmUrypWM9UQJ0U3AItqI40SsdBGmknGA6CGMLmIFr4k46cakRM+rNO/jKbFSujIhMWyMCqpgm3RlQtaO+WAUSFcmZFxIFU7pyoSMC6miQroyIeNCoXOQOEQckb8b/U3oWBDAZ5ih9q5c4JITaGgFUq7J4/7nhM7SBlhGZmJTgLVpwMYTwuzlSqC+Bej8hTma8gCnbtF50RRg+1mg7j3w6RswNiGdBtD4JJBZQudFU4D4C8DQqHQYRNEZIA8YNBEguxSIywA2Z85n00kaiunG1/kHdQF4iBXV0HmHQ8DgWpLIB2hun0Lh41E468flJ0IcwNkI/PwN9A/PMjACdPeJlUp5gCvOUWj7erEltQ9avAu7swfg8YpjHKDi1fzAXb1iec26TTVVBvj63YOYRBcePhvT2+XPx6DtdaGmSdwJDvCoAZiY0pu6eLndXwC8/ABUNVFNlQFevBvXe5/Xexb/1BJ7cb3ij97mSZxRDJy5ozdxtRpIKgR6+kW7UnWAxpYJCuCCe3Bab/PyygGKq0QAvgNVb4BzD8SKk31X/3hGygN0u71Yk+SGo2hYH065pSP6PGhuo64n+eaAl/J9/gFMi5wzUh6A9bZ9EsvpLqxIcEEjbjyZPRhoEvtUTXdHeQCWl1adjk4PLZFzuzhYgPxyqsnmF/5PHfkAgcQBeJgEUtpNqimfYBdAXQBehXJoAu85DyRc9CMfWHXM+Bp+LG0ANuMekg6DKCof5tbRw5fjHlBcC9Q2Ax+/iMcDI0VlAB1pKIZeGVen0osNrfE7c4DT9PJyvw5o7ZAJSPrjQtQFCAQb5UnJK8tRYIcD2Jolj4WPhQH84UCL631GYYCl4b8PUCZdmZDY4jYqpoJ06cqExP68UTGr6SI2SFcmxF8uiP15o6JWMUnkSUdhiL9cEPvzRsUjDff8Isz7xF8u8P48b3HzLjGvCJGljEgnwhg2tmzZsmWtNO0v4yOlvg++ZE8AAAAASUVORK5CYII%3D",
                pocket: "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%3D",
                settings: "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%3D%3D",
                custom: "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"
            };

            me.doodleGone = function () {
                me.removeElement("#epbar");                        // cookie warning
                me.removeElement("#body");                         // logo and promo
                me.removeElement("[name='btnI']");                 // lucky button
                me.removeElement("#fsl");                          // advertising business about
                me.removeElement("a:contains('Privacy')");         // terms
                me.removeElement("a:contains('Terms')");           // privacy
                me.removeElement("a:contains('Send feedback')");   // feedback
                me.removeElement(".gb_Lc.gb_n.gb_0c.gb_Sc");                // g+, gmail, images
                me.removeElement(".gb_Zb.gb_qb.gb_n.gb_Sc");                // share
                //me.removeElement("[data-pid='119']");                // gmail
                //me.removeElement("[data-pid='23']");                // gmail
                //me.removeElement("[data-pid='2']");                // gmail
                me.removeElement(".gb_Tb");                        // "+" share button in top right
                //me.removeElement("#hplogo");                     // doodle/google logo
                $(".gb_da.gbii").css("background-image", "url(data:image/jpeg;base64," + me.getBinary("settings") + ")");
            };

            me.removeElement = function (selector) {
                log("removing", selector);

                var el = $(selector);

                if (el != null) {
                    //log("removing", selector);
                    el.remove();
                }
            };

        };

        /* ================================================== */

        if (document.location.href.match(/google.*chrome.*newtab|about\:blank|google\.co/i) != null) {
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