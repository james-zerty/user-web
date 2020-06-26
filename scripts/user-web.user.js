// ==UserScript==
// @name        user-web
// @description insert user styles
// @namespace   https://github.com/james-zerty/
// @author      2010+, james_zerty
// @version     17
// @noframes
// @grant       GM.setClipboard
// @grant       GM_setClipboard
// @include     http*://*/*
// @exclude     https://localhost:44300/dev*
// @exclude     http://192.168.1.1/*
// @require     https://rawgit.com/james-zerty/user-web/master/scripts/scripts/readability.js
// @require     https://rawgit.com/james-zerty/user-web/master/scripts/jquery/jquery-3.3.1.min.js
// ==/UserScript==
"use strict";

/* === utils ==================================================================================== */

var utils = new function () {
    var me = this;
    var DO_POP = "DO_POP";
    me.url = document.location.href;
    me.logPopup = null;
    me.logPrefix = "UTILS";

    me.setupLog = function (prefix) {
        me.logPrefix = prefix;
    };

    me.hidePop = function () {
        if (me.logPopup && me.logPopup.style) {
            me.logPopup.style.display = "none";
        }
    };

    me.pop = function () {
        Array.prototype.unshift.call(arguments, DO_POP);
        utils.log.apply(this, arguments);
    };

    me.log = function () {
        function tidy(str) {
            if (str && typeof (str) == "string") {
                return str.replace(/(?:\r\n|\r|\n)/g, "");
            }

            return str;
        }

        function popup(msg) {
            if (me.logPopup == null) {
                var style = "position:absolute; top:0px; left:0px; background-color:#fff; overflow:auto; " +
                    "border:solid 1px #000; padding:10px; z-index:99999999; color:#000; " +
                    "min-width:400px; max-height:100px; font: 12px/18px Consolas, Verdana; text-align: justify;";
                me.logPopup = utils.addEl($$("body"), "div")[0];
                me.logPopup.style = style;
                $$(me.logPopup).mousedown(handle_mousedown);
                me.logPopup.oncontextmenu = function (e) {
                    me.logPopup.style.display = "none";
                    return false;
                };
            }

            //keep multi spaces in text, unless it looks like html...
            if (!msg.match(/</)) {
                msg = msg.replace(/(\s)/g, "&nbsp;");
            }

            me.logPopup.innerHTML = me.logPopup.innerHTML + msg + "<br />";
            me.logPopup.style.display = "block";

            function handle_mousedown(e) {
                window.popDrag = {};
                popDrag.pageX0 = e.pageX;
                popDrag.pageY0 = e.pageY;
                popDrag.el = $$(this);
                popDrag.offset0 = popDrag.el.offset();
                if (popDrag.pageY0 - popDrag.offset0.top > 10) return;
                popDrag.el.css('user-select', 'none');
                function handle_dragging(e) {
                    var left = popDrag.offset0.left + (e.pageX - popDrag.pageX0);
                    var top = popDrag.offset0.top + (e.pageY - popDrag.pageY0);
                    popDrag.el.offset({ top: top, left: left });
                }
                function handle_mouseup(e) {
                    popDrag.el.css('user-select', 'auto');
                    $$('body')
                        .off('mousemove', handle_dragging)
                        .off('mouseup', handle_mouseup);
                }
                $$('body')
                    .on('mouseup', handle_mouseup)
                    .on('mousemove', handle_dragging);
            }
        }

        var text1 = "", text2 = "", doPop = false;

        if (arguments.length > 0) {
            if (typeof (arguments[0]) == "object") {
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

        text1 = utils.trim(text1.toString());
        text2 = utils.trim(text2.toString()).replace(/( >>$)/g, "");

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
            var dt = utils.getDateStamp() + " ";
            if (window.console) {
                window.console.log(dt + me.logPrefix + " " + text1, text2);
            }
            else {
            }

            if (doPop) {
                popup(dt + me.logPrefix + " " + text1 + text2);
            }
        }
        catch (ex) {
            window.alert(me.logPrefix + " " + text1 + "\r\r" + ex.message);
        }
    };

    me.addEl = function (parent, tag, className, text, click, prepend) {
        var el = $$("<" + tag + ">");

        if (className != null) {
            el.addClass(className);
        }

        if (text != null) {
            el.text(text);
        }

        if (click != null) {
            el.click(function (e) { return click(e); });
        }

        if (parent != null) {
            if (prepend) {
                parent.prepend(el);
            }
            else {
                parent.append(el);
            }
        }

        return el;
    };

    me.elToString = function (el) {
        try {
            var elj = $$(el);
            var res = "<" + elj.prop("tagName");
            var id = elj.attr("id");

            if (id) {
                res += " id='" + id + "'";
            }

            var class1 = elj.prop("class");
            if (class1) {
                res += " class='" + class1 + "'";
            }

            var text = utils.trim(elj.text());
            if (text.length > 30) text = text.substr(0, 30) + "...";

            return res + ">" + text;
        }
        catch (ex) {
            return "failed to utils.log el: " + ex.message;
        }
    };

    me.getDateStamp = function (dt) {
        return utils.getDateString(dt).replace(/[-:]/g, "");
    };

    me.getDateString = function (dt) {
        if (dt == null) dt = new Date();
        return dt.getFullYear() + "-" +
            utils.zeroFill(dt.getMonth() + 1) + "-" +
            utils.zeroFill(dt.getDate()) + "_" +
            utils.zeroFill(dt.getHours()) + ":" +
            utils.zeroFill(dt.getMinutes()) + ":" +
            utils.zeroFill(dt.getSeconds());
    };

    me.zeroFill = function (val, n) {
        if (n == null) n = 2;
        //return val.toString().padStart(n, "0"); //qq - doesn't work on IE11 so we need this...

        n -= val.toString().length;
        if (n > 0) {
            return new Array(n + (/\./.test(val) ? 2 : 1)).join('0') + val;
        }
        return val + ""; // always return a string
    };

    me.trim = function (val) { //qq
        // \u000A \u000D \u000C

        const pattern = /[\0-\x1F\x7F-\x9F\xAD\u0378\u0379\u037F-\u0383\u038B\u038D\u03A2\u0528-\u0530\u0557\u0558\u0560\u0588\u058B-\u058E\u0590\u05C8-\u05CF\u05EB-\u05EF\u05F5-\u0605\u061C\u061D\u06DD\u070E\u070F\u074B\u074C\u07B2-\u07BF\u07FB-\u07FF\u082E\u082F\u083F\u085C\u085D\u085F-\u089F\u08A1\u08AD-\u08E3\u08FF\u0978\u0980\u0984\u098D\u098E\u0991\u0992\u09A9\u09B1\u09B3-\u09B5\u09BA\u09BB\u09C5\u09C6\u09C9\u09CA\u09CF-\u09D6\u09D8-\u09DB\u09DE\u09E4\u09E5\u09FC-\u0A00\u0A04\u0A0B-\u0A0E\u0A11\u0A12\u0A29\u0A31\u0A34\u0A37\u0A3A\u0A3B\u0A3D\u0A43-\u0A46\u0A49\u0A4A\u0A4E-\u0A50\u0A52-\u0A58\u0A5D\u0A5F-\u0A65\u0A76-\u0A80\u0A84\u0A8E\u0A92\u0AA9\u0AB1\u0AB4\u0ABA\u0ABB\u0AC6\u0ACA\u0ACE\u0ACF\u0AD1-\u0ADF\u0AE4\u0AE5\u0AF2-\u0B00\u0B04\u0B0D\u0B0E\u0B11\u0B12\u0B29\u0B31\u0B34\u0B3A\u0B3B\u0B45\u0B46\u0B49\u0B4A\u0B4E-\u0B55\u0B58-\u0B5B\u0B5E\u0B64\u0B65\u0B78-\u0B81\u0B84\u0B8B-\u0B8D\u0B91\u0B96-\u0B98\u0B9B\u0B9D\u0BA0-\u0BA2\u0BA5-\u0BA7\u0BAB-\u0BAD\u0BBA-\u0BBD\u0BC3-\u0BC5\u0BC9\u0BCE\u0BCF\u0BD1-\u0BD6\u0BD8-\u0BE5\u0BFB-\u0C00\u0C04\u0C0D\u0C11\u0C29\u0C34\u0C3A-\u0C3C\u0C45\u0C49\u0C4E-\u0C54\u0C57\u0C5A-\u0C5F\u0C64\u0C65\u0C70-\u0C77\u0C80\u0C81\u0C84\u0C8D\u0C91\u0CA9\u0CB4\u0CBA\u0CBB\u0CC5\u0CC9\u0CCE-\u0CD4\u0CD7-\u0CDD\u0CDF\u0CE4\u0CE5\u0CF0\u0CF3-\u0D01\u0D04\u0D0D\u0D11\u0D3B\u0D3C\u0D45\u0D49\u0D4F-\u0D56\u0D58-\u0D5F\u0D64\u0D65\u0D76-\u0D78\u0D80\u0D81\u0D84\u0D97-\u0D99\u0DB2\u0DBC\u0DBE\u0DBF\u0DC7-\u0DC9\u0DCB-\u0DCE\u0DD5\u0DD7\u0DE0-\u0DF1\u0DF5-\u0E00\u0E3B-\u0E3E\u0E5C-\u0E80\u0E83\u0E85\u0E86\u0E89\u0E8B\u0E8C\u0E8E-\u0E93\u0E98\u0EA0\u0EA4\u0EA6\u0EA8\u0EA9\u0EAC\u0EBA\u0EBE\u0EBF\u0EC5\u0EC7\u0ECE\u0ECF\u0EDA\u0EDB\u0EE0-\u0EFF\u0F48\u0F6D-\u0F70\u0F98\u0FBD\u0FCD\u0FDB-\u0FFF\u10C6\u10C8-\u10CC\u10CE\u10CF\u1249\u124E\u124F\u1257\u1259\u125E\u125F\u1289\u128E\u128F\u12B1\u12B6\u12B7\u12BF\u12C1\u12C6\u12C7\u12D7\u1311\u1316\u1317\u135B\u135C\u137D-\u137F\u139A-\u139F\u13F5-\u13FF\u169D-\u169F\u16F1-\u16FF\u170D\u1715-\u171F\u1737-\u173F\u1754-\u175F\u176D\u1771\u1774-\u177F\u17DE\u17DF\u17EA-\u17EF\u17FA-\u17FF\u180F\u181A-\u181F\u1878-\u187F\u18AB-\u18AF\u18F6-\u18FF\u191D-\u191F\u192C-\u192F\u193C-\u193F\u1941-\u1943\u196E\u196F\u1975-\u197F\u19AC-\u19AF\u19CA-\u19CF\u19DB-\u19DD\u1A1C\u1A1D\u1A5F\u1A7D\u1A7E\u1A8A-\u1A8F\u1A9A-\u1A9F\u1AAE-\u1AFF\u1B4C-\u1B4F\u1B7D-\u1B7F\u1BF4-\u1BFB\u1C38-\u1C3A\u1C4A-\u1C4C\u1C80-\u1CBF\u1CC8-\u1CCF\u1CF7-\u1CFF\u1DE7-\u1DFB\u1F16\u1F17\u1F1E\u1F1F\u1F46\u1F47\u1F4E\u1F4F\u1F58\u1F5A\u1F5C\u1F5E\u1F7E\u1F7F\u1FB5\u1FC5\u1FD4\u1FD5\u1FDC\u1FF0\u1FF1\u1FF5\u1FFF\u200B-\u200F\u202A-\u202E\u2060-\u206F\u2072\u2073\u208F\u209D-\u209F\u20BB-\u20CF\u20F1-\u20FF\u218A-\u218F\u23F4-\u23FF\u2427-\u243F\u244B-\u245F\u2700\u2B4D-\u2B4F\u2B5A-\u2BFF\u2C2F\u2C5F\u2CF4-\u2CF8\u2D26\u2D28-\u2D2C\u2D2E\u2D2F\u2D68-\u2D6E\u2D71-\u2D7E\u2D97-\u2D9F\u2DA7\u2DAF\u2DB7\u2DBF\u2DC7\u2DCF\u2DD7\u2DDF\u2E3C-\u2E7F\u2E9A\u2EF4-\u2EFF\u2FD6-\u2FEF\u2FFC-\u2FFF\u3040\u3097\u3098\u3100-\u3104\u312E-\u3130\u318F\u31BB-\u31BF\u31E4-\u31EF\u321F\u32FF\u4DB6-\u4DBF\u9FCD-\u9FFF\uA48D-\uA48F\uA4C7-\uA4CF\uA62C-\uA63F\uA698-\uA69E\uA6F8-\uA6FF\uA78F\uA794-\uA79F\uA7AB-\uA7F7\uA82C-\uA82F\uA83A-\uA83F\uA878-\uA87F\uA8C5-\uA8CD\uA8DA-\uA8DF\uA8FC-\uA8FF\uA954-\uA95E\uA97D-\uA97F\uA9CE\uA9DA-\uA9DD\uA9E0-\uA9FF\uAA37-\uAA3F\uAA4E\uAA4F\uAA5A\uAA5B\uAA7C-\uAA7F\uAAC3-\uAADA\uAAF7-\uAB00\uAB07\uAB08\uAB0F\uAB10\uAB17-\uAB1F\uAB27\uAB2F-\uABBF\uABEE\uABEF\uABFA-\uABFF\uD7A4-\uD7AF\uD7C7-\uD7CA\uD7FC-\uF8FF\uFA6E\uFA6F\uFADA-\uFAFF\uFB07-\uFB12\uFB18-\uFB1C\uFB37\uFB3D\uFB3F\uFB42\uFB45\uFBC2-\uFBD2\uFD40-\uFD4F\uFD90\uFD91\uFDC8-\uFDEF\uFDFE\uFDFF\uFE1A-\uFE1F\uFE27-\uFE2F\uFE53\uFE67\uFE6C-\uFE6F\uFE75\uFEFD-\uFF00\uFFBF-\uFFC1\uFFC8\uFFC9\uFFD0\uFFD1\uFFD8\uFFD9\uFFDD-\uFFDF\uFFE7\uFFEF-\uFFFB\uFFFE\uFFFF]/g;
        return val.replace(pattern, "").trim();
    };

    me.clearSelection = function (e) {
        if (window.getSelection) {
            try {
                window.getSelection().removeAllRanges();
            }
            catch (ex) {
                //happens on IE during enableAutoReadr
            }
        }
        else if (document.selection) {
            document.selection.empty();
        }
    };

    me.setClipboard = function (txt) {
        try {
            GM.setClipboard(txt);
        }
        catch (ex1) {
            try {
                GM_setClipboard(txt);
            }
            catch (ex2) {
                utils.log(ex2);
                prompt("Can't set clipboard", txt);
            }
        }
    };

    me.cancelEvent = function (e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    };

    me.scrollToElement = function (el, behavior) {
        if (el == null || el.length == 0) return;

        var wh = $$(window).height();
        var ot = 150;

        if (wh < 800) ot = 0;

        var top = el.offset().top - 15 - ot;

        me.scrollToY(top, behavior);
    };

    me.scrollToY = function (y, behavior) {
        if (behavior == null) behavior = "smooth";
        window.scroll({
            top: y,
            left: 0,
            behavior: behavior
        });
    };

    me.restoreScroll = function () {
        $$("html, body").css({ overflow: "auto", height: "auto" });
    };

    me.fullscreen = () => {
        var el = document.documentElement;
        var req = el.requestFullScreen || el.webkitRequestFullScreen || el.mozRequestFullScreen;
        req.call(el); //qqq
    };

    me.fullscreenExit = () => {
        if (document.fullscreenElement !== null) {
            document.exitFullscreen();
        }
    };
};

/* === userWeb ================================================================================== */

var userWeb = new function () {

    /*** setup ********************************************************************************** */

    var me = this;

    me.load = function () {
        me.url = document.location.href;
        me.tidyUpExcludes = "xlocalhost|www.inoreader.com|google.com|getpocket.com|outlook.office.com|brouter|openstreetmap".replace(/\./g, "\\\.");
        me.tidyUpExclude = me.url.match(me.tidyUpExcludes) != null;
        me.clickEvent = [];
        me.selectedText = "";
        me.showingMore = false;

        // config...
        me.siteConfigs = [
            { exp: /localhost:44300/i, filter: ".ad, #ad1", custom: function () { custom.doLocalhost(); } },
            { exp: /calendar\.google\.com\/calendar/i, icon: "https://calendar.google.com/googlecalendar/images/favicon_v2014_31.ico" },
            { exp: /bbc\.co\.uk\/weather/i, icon: me.getUrl("styles/icons/bbc-weather-icon.png") },
            { exp: /bbc\.co.\uk\/news/i, filter: "#breaking-news-container, .share", icon: me.getUrl("styles/icons/bbc-news-icon.png") },
            { exp: /bbc\.co.\uk\/(iplayer|sounds|programmes|bbcone|bbctwo|tv\/bbcthree|bbcfour)/i, custom: function () { custom.doIplayer(); } },
            { exp: /\/dana\/home\/index\.cgi/i, icon: me.getUrl("styles/icons/net-home.ico") },
            { exp: /(thenib|medium)\.com/i, filter: ".metabar, .postActionsBar, .promoCardWrapper, [data-image-id='1*8Ns0Hg0Tbw8jFjaMLN-qYw.gif']" },
            { exp: /tumblr\.com/i, filter: ".tumblr_controls, #notes" },
            { exp: /google\.co/i, custom: function () { custom.switchWikipediaLinks(); } },
            { exp: /wikipedia\.org/i, custom: function () { custom.doWikipedia(); } },
        ];

        // me.fontA = { size: 16, height: 22, weight: "300", color: "#000", sizeS: 14, heightS: 22, serif: 0, fixed: 0, indent: 0,  face: "Ubuntu" };
        me.fontA = { size: 17, height: 24, margin: 8, weight: "400", color: "#444", sizeS: 14, heightS: 22, serif: 0, fixed: 0, indent: 10, face: "Ubuntu" };

        // me.fontB = { size: 18, height: 27, weight: "300", color: "#222", sizeS: 14, heightS: 24, serif: 0, fixed: 0, indent: 10, face: "Ubuntu" }; //nh
        // me.fontB = { size: 16, height: 28, weight: "400", color: "#555", sizeS: 14, heightS: 24, serif: 0, fixed: 0, indent: 10, face: "Open Sans" }; //nh
        me.fontB = { size: 16, height: 28, margin: 8, weight: "400", color: "#444", sizeS: 14, heightS: 24, serif: 0, fixed: 0, indent: 10, face: "Open Sans" };

        //qq
        me.fontC = { size: 20, height: 27, margin: 15, weight: "400", color: "#333", sizeS: 19, heightS: 27, serif: 1, fixed: 0, indent: 10, face: "Cambria" };

        me.marked = $$();
        me.readingState = 0;
        me.menuTimeoutTime = 1000;

        me.setReloader();
        me.siteConfig();
        me.loadUserStyle();
        me.readLite();

        me.setEvents();
        me.checkedEvents = 0;
        if (!me.checkEvents()) {
            return;
        }

        if (settings.autoRun) { //qq

            // me.doPopout();
            // me.setFontC();
            // custom.switchWikipediaLinks();
            // me.testMinecraft();
            // me.openMaps("OSM");
            // me.markElement($$("p:nth-child(3)"));
            // me.markElementAndBind($$("p:nth-child(3)"));
            // me.doReadAuto();
            // me.setFontA();
            // me.readLite();
            // throw new Error("test!");
            // var el = me.getTarget();
            // var el = $$("#readThis");
            // me.markElementAndBind(el);
            // utils.pop("yo");
            // me.setFontC();
            // me.editFonts();
            // window.scroll({ top: 2620, left: 300 });
            // utils.pop("lalala lalala lalala");
            // setInterval(function() {
            // utils.pop("lalala lalala lalala");
            // }, 1000);
        }

        if (settings.autoShow) {
            me.showMenu([]);
        }
    };

    me.setEvents = function () {
        me.bindPageMouse();
        me.bindPageKeyDown();
    };

    me.checkEvents = function () {
        /*
        var delayEvents =
            me.url.match(/\/iplayer\//i) ||
            (me.url.match(/\.bbc\./i) && $$("#mediaContainer, .player-with-placeholder, .vxp-media__error-message, .lx-c-media-player").length > 0);
        */

        var ok = false;
        try {
            var evs = $$._data(document.body, 'events');
            if (evs) {
                var mus = evs["mouseup"];
                for (var i = 0; i < mus.length; i++) {
                    var mu = mus[i];
                    if (mu.namespace == "uw-mu") {
                        // utils.log("checkEvents", "ok");
                        ok = true;
                        break;
                    }
                }
            }
            else {
                utils.log("checkEvents", "NO EVENTS!");
            }
        }
        catch (ex) {
            utils.log("checkEvents", "ERROR!", ex.message);
        }

        if (ok) {
            me.checkedEvents++;
            if (me.checkedEvents < 10) {
                window.self.setTimeout(function () {
                    me.checkEvents();
                }, 1000);
            }
            return true;
        }
        else {
            me.reloadMe();
            return false;
        }
    };

    me.reloadMe = function () {
        utils.log("RELOADING", "RELOADING!");
        var sj = document.createElement('script');
        sj.src = me.getUrl("scripts/jquery/jquery-3.3.1.min.js");
        sj.onload = function () {
            me.run(function () {
                var su = document.createElement('script');
                su.src = me.getUrl("scripts/user-web.user.js");
                document.getElementsByTagName('head')[0].appendChild(su);
                $$("*").unbind(".fontEdit");
                $$("*").unbind(".uw-find");
                $$("*").unbind(".uw-find-first");
                $$("*").unbind(".uw-marking");
                $$("*").unbind(".uw-menu");
                $$("*").unbind(".uw-mu");
                $$("*").unbind(".uw-page");
                $$("*").unbind(".uw-wikipedia");
                me.menu.remove();
            });
        };
        document.getElementsByTagName('head')[0].appendChild(sj);
    };

    /*** page events **************************************************************************** */

    me.bindPageMouse = function () {
        $$("body").unbind("mouseup.uw-mu");
        $$("body").bind("mouseup.uw-mu", function (e) { me.run(function () { return me.onPageMouseUp(e); }); });

        //bbc video unloads jq events so we use raw js as a fallback...
        // document.body.ondblclick = function(e) {
        // me.onPageDblClick(e);
        // }
    };

    // me.onPageDblClick = function(e) { //qqd
    // me.run(function() {
    // if (me.menuShowing || fontEdit.showing) {
    // return;
    // }

    // me.showMenu(e);
    // e.preventDefault();
    // e.stopPropagation();
    // return;
    // });
    // };

    me.onPageMouseUp = function (e) {
        if (e.button != 0) {
            return;
        }

        if (me.saveSelection(e)) {
            if (me.menuShowing) {
                me.hideMenu();
                return;
            }

            var tagName = e.target == null ? "UNKNOWN" : e.target.tagName;
            switch (tagName) {
                case "TEXTAREA":
                // case "INPUT":
                case "IMG":       //img doesn't clear selection
                case "HTML":      //scrollbar
                    utils.log("onPageMouseUp", "not showing for: ", e.target.tagName);
                    me.hideMenu();
                    return;
            }

            if ($$(e.target).parents('[contenteditable="true"]').length > 0) {
                utils.log("onPageMouseUp", "not showing for contenteditable: ", e.target.tagName);
                return; //qq
            }

            me.showMenu(e);
            e.preventDefault();
            e.stopPropagation();
            return;
        }
    };

    me.saveSelection = function (e) {
        var text = "";
        var el = $$(e.target);

        if ((el.is("input") && el.prop("type") == "text") || el.is("textarea")) {
            text = e.target.value.substring(e.target.selectionStart, e.target.selectionEnd);
        }
        else {
            text = window.getSelection().toString();
        }

        if (text) {
            me.selectedText = text;
            return true;
        }
        else {
            return false;
        }
    };

    me.bindPageKeyDown = function () {
        if (!me.isPageKeyDownBound) {
            me.isPageKeyDownBound = true;
            $$("body").bind("keydown.uw-page", function (e) { me.run(function () { me.onPageKeyDown(e); }); });
        }
    };

    me.onPageKeyDown = function (e) {
        // utils.log("onPageKeyDown", "key:", e.key, " code:", e.keyCode, " ctrl:", e.ctrlKey, " alt:", e.altKey, " shift:", e.shiftKey);
        switch (e.keyCode) {
            case 192: // ` firefox
            case 223: // ` chrome
                if (navigator.userAgent.indexOf("Chrome") > -1 && e.keyCode == 192) return;
                // `                cycle > Popout, 2, 3, Off //qq: check comments and help text for key mappings are correct
                // Alt+`            show menu
                // F2               find for marking
                // Ctrl+`           find > [DEL/d/RV] delete, [r] read, [m] mark, [h] highlight, [p] popout
                // Shift+`          undo read
                // Ctrl+Shift+`     toggle user style
                if (e.ctrlKey && e.shiftKey) { //toggle user style...
                    utils.log("Ctrl+Shift+`", "toggle user style");
                    if (me.activeUserStyle) {
                        me.unloadUserStyle();
                    }
                    else {
                        settings.uniqueUrls = 1;
                        me.loadUserStyle();
                    }
                }
                else if (e.altKey) {
                    utils.log("Alt+`", "show menu");
                    me.selectedText = "";
                    me.showMenu(e);
                }
                else if (e.ctrlKey) {
                    utils.log("Ctrl+`", "find element");
                    me.startFind();
                }
                else { //reading...
                    if (e.shiftKey) {
                        var nextState = me.readingState - 1;
                    }
                    else {
                        if (me.readingState == 0) { //first time...
                            me.readingState = 1;
                            me.tidyUp();
                            me.readLite();
                            document.oncontextmenu = function () {
                                return false;
                            };
                            me.findF2 = true;
                            me.startFind();
                            return utils.cancelEvent(e);
                        }
                        else if (me.readingState == 1) {
                            if (me.findF2) {
                                me.cancelFind();
                                me.doPopout();
                                me.setFontC();
                                return;
                            }

                            me.doReadFromElement(me.marked);
                        }

                        var nextState = me.readingState + 1;
                    }

                    if (nextState == -1) nextState = 0;
                    if (nextState == 5) nextState = 0;

                    switch (nextState) {
                        case 0:
                            me.undoRead();
                            me.readLite();
                            break;
                        case 1:
                            me.undoRead();
                            me.tidyUp();
                            me.readLite();
                            break;
                        case 2:
                            me.setFontA();
                            break;
                        case 3:
                            me.setFontB();
                            break;
                        case 4:
                            me.setFontC();
                            break;
                    }
                }

                return utils.cancelEvent(e);
            case 113: // F2
                document.oncontextmenu = function () {
                    return false;
                };
                me.findF2 = true;
                me.startFind();
                return utils.cancelEvent(e);
            case 37: // left
            case 39: // right
            case 74: // j
            case 75: // k
                if (e.keyCode == 39 && e.altKey && e.shiftKey) { //shift+alt+right
                    if (fontEdit.showing) return;
                    me.editFonts();
                    return;
                }

                if (me.marking) {
                    if (e.ctrlKey || e.shiftKey || e.altKey) return;

                    var fwd = e.keyCode == 39 || e.keyCode == 74;
                    var curr = $$(".uw-marked");
                    var next = fwd ? curr.next() : curr.prev();

                    function getNext(fwd, curr) {
                        var ps = $$("p");
                        var index = $$.inArray(curr[0], ps);
                        return fwd ? $$(ps[index + 1]) : $$(ps[index - 1]);
                    }

                    if (curr.prop("tagName") == "P") {
                        next = getNext(fwd, curr);
                    }

                    if (next.length == 0) {
                        var p = curr.parent();

                        next = fwd ? p.next() : p.prev();

                        if (next.length == 0) {
                            utils.log("next is empty");
                            next = getNext(fwd, curr);
                        }
                    }

                    if (next.is(":hidden") || next.css("visibility") == "hidden" || next.text().length == 0) {
                        utils.log("next is hidden");
                        next = getNext(fwd, next);
                    }

                    if (next.length > 0) {
                        me.markElement(next);
                    }

                    e.preventDefault();
                    e.stopPropagation();
                }

                break;
            case 49: // 1
                me.setFontA();
                break;
            case 50: // 2
                me.setFontB();
                break;
            case 51: // 3
                me.setFontC();
                break;
            case 191: // ?
                if (e.ctrlKey && e.shiftKey) {
                    me.showHelp();
                }
                break;
            //case 65: // a
            case 27: // esc
                if (me.marking) {
                    me.markElementCancel();
                }
                else if (me.activePopout) {
                    me.undoRead();
                }
                else if (!me.tidyOn) {
                    me.tidyUp();
                }
                else {
                    me.undoRead();
                }
                break;
        }

        me.hideMenu();
    };

    /*** menu ui ******************************************************************************** */

    me.getTarget = function () {
        var el = $$(me.clickEvent.target);
        if (el.length == 0) {
            utils.log("getTarget", "target is null, returning first p");
            el = $$("p").first();
        }

        return el;
    };

    me.showMenu = function (e) {
        me.menuShowing = true;
        me.clickEvent = e;

        if (me.menu == null) {
            me.createMenu();
        }
        else {
            me.menu.show();
        }

        var mnu = {
            height: me.menu.height(),
            width: me.menu.width(),
            left: 0,
            top: 0
        };

        //window viewport
        var view = {
            top: $$(window).scrollTop(),
            left: $$(window).scrollLeft()
        };
        view.bottom = view.top + $$(window).height();
        view.right = view.left + $$(window).width();

        //event location
        var ev = {
            y: e.pageY,
            x: e.pageX
        };
        if (isNaN(ev.y)) {
            ev.y = view.top;
        }
        if (isNaN(ev.x)) {
            ev.x = view.left;
        }

        var sel = { top: view.top, left: view.left, height: 0, bottom: view.top, right: view.left };
        var selection = window.getSelection();

        utils.log("showMenu", "10");
        if (selection.rangeCount == 0) { //text in a textbox //qq
            utils.log("showMenu", "20");
            var targ = me.getTarget();
            sel.top = sel.bottom = targ.offset().top + targ.outerHeight();
            sel.left = sel.right = ev.x;
            utils.log("showMenu", "30");
        }
        else {
            utils.log("showMenu", "40");
            var range = selection.getRangeAt(0).cloneRange();
            var rects = range.getClientRects();

            if (rects.length == 0) {
                utils.log("showMenu", "50");
                //sel.top = sel.bottom = ev.y; // + view.top;
                //sel.left = sel.right = ev.x; // + view.left;
                var targ = me.getTarget();
                sel.top = sel.bottom = targ.offset().top + targ.outerHeight();
                sel.left = sel.right = ev.x;
            }
            else {
                utils.log("showMenu", "60");
                var rect = rects[0];

                if (ev.y > rect.bottom + view.top) {
                    utils.log("showMenu", "70");
                    rect = rects[rects.length - 1];
                }

                // hit alt+` after show!!

                sel = {
                    top: rect.top + view.top,
                    left: rect.left + view.left,
                    height: rect.height,
                    bottom: rect.bottom + view.top,
                    right: rect.right + view.left
                };

                for (var i = 0; i < rects.length; i++) {
                    var rect = rects[i];
                    if (rect.top + view.top == sel.top) {
                        sel.left = Math.min(sel.left, rect.left + view.left);
                        sel.right = Math.max(sel.right, rect.right + view.left);
                    }
                }
            }
        }

        sel.width = sel.right - sel.left;
        if (sel.width > mnu.width) {
            sel.right = ev.x;// - mnu.width / 2;
            sel.left = ev.x;// - mnu.width / 2;
        }

        if (sel.bottom + mnu.height < view.bottom) { //fits below...
            mnu.top = sel.bottom;
        }
        else { //can't fit below...
            if (sel.top - mnu.height > view.top) { //fits above...
                mnu.top = sel.top - mnu.height;
            }
            else { //can't fit above...
                mnu.top = view.bottom - mnu.height - 20;
            }
        }

        mnu.left = sel.left + ((sel.right - sel.left) / 2) - mnu.width / 2;
        if (mnu.left + mnu.width > view.right - 2) {
            mnu.left = view.right - 2 - mnu.width;
        }
        else if (mnu.left < view.left) {
            mnu.left = view.left;
        }

        /*
        utils.log("sel.left", sel.left);
        utils.log("sel.right", sel.right);
        utils.log("sel.top", sel.top);
        utils.log("sel.bottom", sel.bottom);

        utils.log("mnu.top", mnu.top);
        utils.log("mnu.left", mnu.left);
        utils.log("mnu.height", mnu.height);
        utils.log("mnu.width", mnu.width);
        */

        me.menu.css("top", mnu.top + "px");
        me.menu.css("left", mnu.left + "px");
        me.menuTimeoutClear();
        me.menuTimeoutSet();
    };

    me.menuTimeoutSet = function () {
        me.menuTimeoutId = window.self.setTimeout(function () {
            me.hideMenu();
        }, me.menuTimeoutTime);
    };

    me.menuTimeoutClear = function () {
        if (typeof me.menuTimeoutId == "number") {
            clearTimeout(me.menuTimeoutId);
            delete me.menuTimeoutId;
        }
    };

    me.hideMenu = function () {
        if (settings.autoShow) return;

        if (me.skipHide) {
            me.skipHide = false;
            return;
        }

        if (me.menu) {
            me.menu.hide();
            me.menuTimeoutClear();
        }

        me.menuShowing = false;
    };

    me.createMenu = function () {
        if (me.menu) {
            return;
        }

        me.addStyles();
        me.menu = $$("<div id='UserWebMenu' class='uw-menu'>");
        $$("body").append(me.menu);

        var tbl = utils.addEl(me.menu, "table");
        var row1 = utils.addEl(tbl, "tr");
        var row2 = utils.addEl(tbl, "tr");
        var row3 = utils.addEl(tbl, "tr");

        var rowX = utils.addEl(tbl, "tr");
        var td = utils.addEl(rowX, "td", "uw-separator"); td.attr("colspan", 4);

        var row4 = utils.addEl(tbl, "tr");
        var td = utils.addEl(row4, "td"); td.attr("colspan", 2);
        var ulLeft = utils.addEl(td, "ul", "uw-menu-left");
        var td = utils.addEl(row4, "td"); td.attr("colspan", 2);
        var ulRight = utils.addEl(td, "ul", "uw-menu-right");
        var ulMore = utils.addEl(td, "ul", "uw-menu-right");
        me.ulRight = ulRight;
        me.ulMore = ulMore;
        ulMore.hide();

        me.menu.hover(
            function () { // on hover
                me.menuTimeoutClear();
            },
            function () { // on exit
                me.menuTimeoutClear();
                me.menuTimeoutSet();
            }
        );

        me.menu.bind("click.uw-menu", function (e) {
            me.run(function () {
                me.hideMenu();
            });
        });

        //------------------------------------------------------------------------------------------

        me.addCellLink(row1, "Top", function () {
            utils.scrollToY(0);
        }, null, "Scroll to top");

        me.addCellLink(row2, "Bottom", function () {
            utils.scrollToY($$(document).height());
        }, null, "Scroll to bottom");

        //------------------------------------------------------------------------------------------

        me.addCellLink(row1, "Read A", function () {
            var el = me.getTarget();
            me.activeReadr = true;
            me.setFontA();
            me.markElementAndBind(el);
        });

        me.addCellLink(row2, "Pop A", function () {
            me.doPopout();
        }, null, "Auto popout A");

        //------------------------------------------------------------------------------------------

        me.addCellLink(row1, "Mark", function () {
            var el = me.getTarget();
            me.tidyUp();
            me.markElementAndBind(el);
        });

        me.addCellLink(row2, "Higlight", function () {
            var el = me.getTarget();
            me.highlightElement(el);
        });

        //------------------------------------------------------------------------------------------

        me.addCellLink(row1, "Copy", function () {
            utils.setClipboard(me.selectedText);
        });

        me.addCellLink(row2, "Find", function () {
            me.startFind();
        }, null, "Find an element then choose to read, popout or delete - see help for more info");

        //------------------------------------------------------------------------------------------
        //------------------------------------------------------------------------------------------

        me.addListLink(ulLeft, "Go up", function () { me.levelUp(); }, null, "Show parent URLs");
        me.addListLink(ulLeft, "Search this site", function () { me.searchSite(); }, null, "Search this site"); //qq
        me.addListLink(ulLeft, "Go to selected URL", function () { me.navigateTo(me.selectedText); }, null, "Open the selected text in a new tab");

        me.addSeparator(ulLeft); //-----------------------------------------------------------------

        var u = encodeURIComponent(window.location.href);
        var title = encodeURIComponent(window.document.title);
        var prefix = "https://getpocket.com/edit?";
        var pocketUrl = prefix + "url=" + u + "&title=" + title;
        var gmailUrl = "http://mail.google.com/mail/?view=cm&fs=1&tf=1&su=" + title + "&body=" + u;

        me.lnkReloadStyle =
            me.addListLink(ulLeft, "Add to Pocket", function () { //note: can't use addListLink with a url because ublock "AdGuard Social Media" blocks links matching the pocket url
                me.navigateTo(pocketUrl);
            }, null, "Reload the user style");

        me.addListLink(ulLeft, "Share with Gmail", null, gmailUrl);

        me.userStyleSeparator = me.addSeparator(ulLeft); //-----------------------------------------

        me.lnkReloadStyle =
            me.addListLink(ulLeft, "Reload style", function () {
                settings.uniqueUrls = 1;
                me.loadUserStyle();
            }, null, "Reload the user style");

        me.lnkReloadStyleOnDblClick =
            me.addListLink(ulLeft, "Reload dblclick", function () {
                $$("body").bind("dblclick.uw-find", function () {
                    me.run(function () {
                        settings.uniqueUrls = 1;
                        me.loadUserStyle();
                    });

                    utils.clearSelection();
                    me.hideMenu();
                });

                me.reloadStyleOnDblClickIsBound = true;
                me.lnkReloadStyleOnDblClick.hide();
                me.lnkReloadStyleOnDblClickOff.show();
                settings.uniqueUrls = 1;
                me.loadUserStyle();
            }, null, "Reload the user style on dblclick");

        me.lnkReloadStyleOnDblClickOff =
            me.addListLink(ulLeft, "Reload cancel", function () {
                $$("body").unbind("dblclick.uw-find");
                me.lnkReloadStyleOnDblClick.show();
                me.lnkReloadStyleOnDblClickOff.hide();
            }, null, "Stop reloading the user style on dblclick").hide();

        me.lnkOpenStyle =
            me.addListLink(ulLeft, "Open style", function () {
                me.openUserStyle();
            }, null, "Open user style in new tab");

        me.lnkUnloadStyle =
            me.addListLink(ulLeft, "Unload style", function () {
                me.unloadUserStyle();
            }, null, "Unload the user style");

        me.userStyleSeparator = me.addSeparator(ulLeft); //-----------------------------------------

        me.lnkShowMore =
            me.addListLink(ulLeft, "More...", function () {
                me.showMoreLess(true);
            }, null, "Show more functions");

        me.lnkShowLess =
            me.addListLink(ulLeft, "Less", function () {
                me.showMoreLess(false);
            }, null, "Hide extra functions").hide();

        //------------------------------------------------------------------------------------------
        //------------------------------------------------------------------------------------------

        me.addListLink(ulMore, "Undo read", function () {
            me.undoRead();
        }, null, "Remove reading styles, highlights and popout");

        me.addSeparator(ulMore); //-----------------------------------------------------------------

        me.addListLink(ulMore, "Edit fonts", function () {
            me.editFonts();
        }, null, "Edit user fonts");

        me.addSeparator(ulMore); //-----------------------------------------------------------------

        me.lnkTidyOn =
            me.addListLink(ulMore, "Tidy on", function () {
                me.tidyUp();
                me.refreshMenu();
            }, null, "Turn tidy on - removes elements with fixed and sticky positions");

        me.lnkTidyOff =
            me.addListLink(ulMore, "Tidy off", function () {
                me.tidyOn = false;
                me.refreshMenu();
            }, null, "Turn tidy off (this does not restore deleted elements, it just stops new elements from being deleted)").hide();

        me.addSeparator(ulMore); //-----------------------------------------------------------------

        me.addListLink(ulMore, "Hide links", function () {
            me.hideLinks();
        }, null, "Hide link underlines");
        me.addListLink(ulMore, "Show links", function () {
            me.showLinks();
        }, null, "Show hidden links");

        me.addListLink(ulMore, "Hide images", function () {
            $$("img, video").hide();
        }, null, "Hide all images in the page");
        me.addListLink(ulMore, "Show images", function () {
            $$("img, video").show();
        }, null, "Redisplay hidden images");

        me.addListLink(ulMore, "Hide matches...", function () {
            eval("$$('" + prompt("Enter a jquery selector expression") + "').hide();");
        }, null, "Hide elements matching a selector expression");

        me.addListLink(ulMore, "Eval expression...", function () {
            while (true) {
                //test with: $$("p:visible").first().hide()
                var res = prompt("Enter JavaScript to eval", me.lastEval);
                if (res) {
                    me.lastEval = res;
                    eval(me.lastEval);
                }
                else {
                    break;
                }
            }
        }, null, "Enter JavaScript to eval");

        me.addListLink(ulMore, "Enable selection", function () {
            me.enableSelect();
        }, null, "Allow selection of text");

        me.addSeparator(ulMore); //-----------------------------------------------------------------

        me.addListLink(ulMore, "Reload user-web", function () {
            me.reloadMe();
        }, null, "Reload the user-web menu and events");

        me.addSeparator(ulMore); //-----------------------------------------------------------------

        me.addListLink(ulMore, "Help", function () {
            me.showHelp();
        });

        //------------------------------------------------------------------------------------------
        //------------------------------------------------------------------------------------------

        me.addListLink(ulRight, "Google", function () { me.openSearch("https://www.google.co.uk/search?q=TESTSEARCH"); });
        me.addListLink(ulRight, "Google Define", function () { me.openSearch("https://www.google.co.uk/search?q=define:TESTSEARCH"); });
        me.addListLink(ulRight, "Google Images", function () { me.openSearch("https://www.google.co.uk/search?tbm=isch&q=TESTSEARCH"); });
        me.addListLink(ulRight, "Google Translate", function () { me.openSearch("https://translate.google.co.uk/#view=home&op=translate&sl=auto&tl=en&text=TESTSEARCH"); });
        me.addListLink(ulRight, "Duck Images", function () { me.openSearch("https://duckduckgo.com/?t=h_&iax=images&ia=images&q=TESTSEARCH"); });

        me.addSeparator(ulRight); //--------------------------------------------------------
        me.addListLink(ulRight, "Google Maps", function () { me.openMaps("GOOGLE"); });
        me.addListLink(ulRight, "Bing Aerial", function () { me.openMaps("BING_AERIAL"); });
        me.addListLink(ulRight, "Bing OS", function () { me.openMaps("BING_OS"); });
        me.addListLink(ulRight, "BRouter", function () { me.openMaps("BROUTER"); });
        me.addListLink(ulRight, "OSM", function () { me.openMaps("OSM"); });

        me.addSeparator(ulRight); //--------------------------------------------------------
        me.addListLink(ulRight, "Stack Overflow", function () { me.openSearch("https://www.google.co.uk/search?q=site%3Astackoverflow.com+TESTSEARCH"); });
        me.addListLink(ulRight, "Stack Exchange", function () { me.openSearch("https://www.google.co.uk/search?q=site%3Astackexchange.com+TESTSEARCH"); });
        me.addListLink(ulRight, "Super User", function () { me.openSearch("https://www.google.co.uk/search?q=site%3Asuperuser.com+TESTSEARCH"); });

        me.addSeparator(ulRight); //--------------------------------------------------------
        me.addListLink(ulRight, "Wikipedia", function () { me.openSearch("https://en.m.wikipedia.org/wiki/Special:Search?search=TESTSEARCH&go=Go"); });
        me.addListLink(ulRight, "BBC News", function () { me.openSearch("https://www.bbc.co.uk/search?q=TESTSEARCH"); });
        me.addListLink(ulRight, "Amazon", function () { me.openSearch("http://www.amazon.co.uk/s/ref=nb_sb_noss_1?url=search-alias%3Daps&field-keywords=TESTSEARCH&x=0&y=0"); });
        me.addListLink(ulRight, "Twitter", function () { me.openSearch("https://twitter.com/search?q=TESTSEARCH&src=typd"); });
        me.addListLink(ulRight, "Reddit", function () { me.openSearch("https://www.reddit.com/search?q=TESTSEARCH"); });
        me.addListLink(ulRight, "eBay", function () { me.openSearch("https://www.ebay.co.uk/sch/i.html?_sop=15&LH_BIN=1&_blrs=recall_filtering&_nkw=TESTSEARCH"); });

        me.refreshMenu();
    };

    me.addCellLink = function (parent, text, fn, href, title) { //qq reorder params
        return me.addLink(parent, "td", text, fn, href, title);
    };

    me.addListLink = function (parent, text, fn, href, title) {
        return me.addLink(parent, "li", text, fn, href, title);
    };

    me.addLink = function (parent, tag, text, fn, href, title) {
        var lnk = $$("<a>" + text + "</a>").click(function () { me.run(fn); });
        var el = $$("<" + tag + ">").append(lnk)

        if (title != null) el.prop("title", title);
        if (href != null) lnk.prop("href", href);

        parent.append(el);
        return el;
    };

    me.addSeparator = function (parent) {
        var li = $$("<li>")
            .addClass("uw-separator");

        parent.append(li);
        return li;
    };

    me.showMoreLess = function (show) {
        me.skipHide = true;
        me.showingMore = show;
        me.refreshMenu();
        me.showMenu(me.clickEvent);
        me.menuTimeoutClear();
    };

    me.refreshMenu = function () {
        if (me.menu) {
            if (me.showingMore) {
                me.ulRight.attr("style", "display: none !important;");
                me.lnkShowMore.hide();
                me.ulMore.show();
                me.lnkShowLess.show();
            }
            else {
                me.ulRight.show();
                me.lnkShowMore.show();
                me.ulMore.attr("style", "display: none !important;");
                me.lnkShowLess.hide();
            }

            if (me.foundUserStyle) {
                me.userStyleSeparator.show();
                me.lnkReloadStyle.show();

                if (!me.reloadStyleOnDblClickIsBound) {
                    me.lnkReloadStyleOnDblClick.show();
                }
            }
            else {
                me.userStyleSeparator.hide();
                me.lnkReloadStyle.hide();
                me.lnkReloadStyleOnDblClick.hide();
            }

            if (me.activeUserStyle) {
                me.lnkOpenStyle.show();
                me.lnkUnloadStyle.show();
            }
            else {
                me.lnkOpenStyle.hide();
                me.lnkUnloadStyle.hide();
            }

            if (me.tidyOn) {
                me.lnkTidyOff.show();
                me.lnkTidyOn.hide();
            }
            else {
                me.lnkTidyOff.hide();
                me.lnkTidyOn.show();
            }
        }
    };

    me.showHelp = function (e) {
        me.addStyles();
        var pop = $$("<div class='uw-help'>");
        pop.html(
            "<table>" +
            "<tr><th>General...</th></tr>" +
            "<tr><td>F2</td><td>Find for marking</td></tr>" +
            "<tr><td>`</td><td>Toggle...</td></tr>" +
            "<tr><td></td><td>Popout</td></tr>" +
            "<tr><td></td><td>Font B</td></tr>" +
            "<tr><td></td><td>Font C</td></tr>" +
            "<tr><td></td><td>Reset</td></tr>" +
            "<tr><td>Alt+`</td><td>Show menu</td></tr>" +
            "<tr><td>Ctrl+`</td><td>Find element</td></tr>" +
            "<tr><td>Shift+`</td><td>Undo read</td></tr>" +
            "<tr><td>Ctrl+Shift+`</td><td>Toggle user style</td></tr>" +
            "<tr><td>Ctrl+Shift+Alt+?</td><td>Show help</td></tr>" +
            "<tr><td>&nbsp;</td></tr>" +
            "<tr><th>Marking...</th></tr>" +
            "<tr><td>Left or k</td><td>Previous paragraph</td></tr>" +
            "<tr><td>Right or j</td><td>Next paragraph</td></tr>" +
            "<tr><td>Esc</td><td>Cancel marking</td></tr>" +
            "<tr><td>&nbsp;</td></tr>" +
            "<tr><th>Finding...</th></tr>" +
            "<tr><td>1</td><td>Font 1</td></tr>" +
            "<tr><td>2</td><td>Font 2</td></tr>" +
            "<tr><td>3</td><td>Font 3</td></tr>" +
            "<tr><td>m</td><td>Mark</td></tr>" +
            "<tr><td>h</td><td>Highlight</td></tr>" +
            "<tr><td>p</td><td>Popout</td></tr>" +
            "<tr><td>d / Del / RC</td><td>Delete elements</td></tr>" +
            "<tr><td>Esc</td><td>Cancel find</td></tr>" +
            "<tr><td>Right / Left</td><td>Next / previous node</td></tr>" +
            "</table>"
        );

        var cls = $$("<div class='uw-help-button'>")
            .text("Close")
            .click(function (e) {
                pop.remove();
                return false;
            });
        pop.append(cls);
        $$("body").append(pop);
    };

    /*** menu actions *************************************************************************** */

    me.hideLinks = function () {
        $$("a").attr("style", "text-decoration: none !important");
        me.linksHidden = true;
        me.refreshMenu();
    };

    me.showLinks = function () {
        $$("a").attr("style", "background-color: lime !important");
        $$(".uw-menu a").attr("style", null);
        me.linksHidden = false;
        me.refreshMenu();
    };

    me.levelUp = function () {
        var root = window.location.origin;
        var url = document.location.href;
        var u = url;
        var i = 1;

        while (true) {
            u = u.replace(/\/[^\/]*\/*$/g, "");
            if (u.length <= root.length) {
                break;
            }

            utils.pop(i, "<a href='" + u + "'>" + u + "</a>");
            i++;
        }

        utils.pop(i, "<a href='" + root + "'>" + root + "</a>");
        utils.scrollToY(0);
    };

    me.searchSite = function () { //qq
        var root = window.location.origin;
        var url = document.location.href;
        var u = url;
        var i = 1;
        var q = prompt("Search for", me.selectedText.toLowerCase());

        q = encodeURIComponent(utils.trim(q)).replace(/%20/g, "+");


        while (true) {
            u = u.replace(/\/[^\/]*\/*$/g, "");
            if (u.length <= root.length) {
                break;
            }

            utils.pop(i, "<a href='https://www.google.com/search?q=site%3A" + u + "+" + q + "'>" + u + "</a>");
            i++;
        }

        utils.pop(i, "<a href='https://www.google.com/search?q=site%3A" + root + "+" + q + "'>" + root + "</a>");
        utils.scrollToY(0);
    };

    me.enableSelect = function () {
        var styles = "*, p, div { user-select:text !important; -moz-user-select:text !important; -webkit-user-select:text !important; }";
        $$("head").append($$("<style />").html(styles));

        var allowNormal = function () {
            return true;
        };

        $$("*[onselectstart], *[ondragstart], *[oncontextmenu]")
            .unbind("contextmenu")
            .unbind("selectstart")
            .unbind("dragstart")
            .unbind("mousedown")
            .unbind("mouseup")
            .unbind("click")
            .attr("onselectstart", allowNormal)
            .attr("oncontextmenu", allowNormal)
            .attr("ondragstart", allowNormal);

        utils.clearSelection();
        me.hideMenu();
    };

    me.openSearch = function (url) {
        window.open(url.replace("TESTSEARCH", encodeURIComponent(utils.trim(me.selectedText.toLowerCase())).replace(/%20/g, "+")), "", "");
    };

    me.openMaps = function (type) {
        var url = document.location.href;

        utils.log("maps", "1");
        if (utils.trim(me.selectedText)) {
            utils.log("maps", "found me.selectedText >", me.selectedText, "<");

            switch (type) {
                case "OSM":
                    me.openSearch("https://www.openstreetmap.org/search?query=TESTSEARCH");
                    break;
                case "BROUTER":
                    me.openSearch("https://brouter.de/brouter-web/?TESTSEARCH");
                    break;
                case "GOOGLE":
                    me.openSearch("https://maps.google.co.uk/maps?q=TESTSEARCH");
                    break;

            }
        }
        else {
            utils.log("maps", "get coords from url...");

            var coords = "";
            if (url.match(/openstreetmap|brouter/i)) {
                utils.log("maps", "get coords from OSM url...");
                coords = url.match(/map=[\d\.\/-]*/i);
                if (coords) {
                    var tmp = coords[0].split("/");
                    coords = [tmp[0].substr(4), tmp[1], tmp[2]];
                }
            }
            else if (url.match(/google.*\/maps/i)) {
                utils.log("maps", "get coords from GOOGLE url...");
                coords = url.match(/@[\d\.\-,]*/i);
                if (coords) {
                    var tmp = coords[0].split(",");

                    //on google earth / satellite
                    // 13.72z > 9906m
                    // 16.97z > 1041m
                    // 17z    >  712m


                    coords = [tmp[2], tmp[0].substr(1), tmp[1]];

                    if (coords[0].length > 2) {
                        coords[0] = 16;
                    }
                }
            }
            else if (url.match(/bing\.com\/maps/i)) {
                utils.log("maps", "get coords from BING url...");
                var coords = []
                var params = new URLSearchParams(url);
                coords = params.get("cp").split("~");
                coords.unshift(params.get("lvl"));
            }

            utils.log("maps", "coords from url: ", coords);

            switch (type) {
                case "OSM":
                    var u = "https://www.openstreetmap.org/#map=" + coords[0] + "/" + coords[1] + "/" + coords[2];
                    utils.log("maps", u);
                    break;
                case "BROUTER":
                    var u = "http://brouter.de/brouter-web/#map=" + coords[0] + "/" + coords[1] + "/" + coords[2] + "/standard";
                    utils.log("maps", u);
                    break;
                case "GOOGLE":
                    var u = "https://www.google.co.uk/maps/@" + coords[1] + "," + coords[2] + "," + coords[0] + "z";
                    utils.log("maps", u);
                    break;
                case "BING_OS":
                    var u = "https://www.bing.com/maps?osid=93c03dfb-f71d-449d-a5e8-33d609dbd00f&cp=" + coords[1] + "~" + coords[2] + "&lvl=" + coords[0] + "&style=s&v=2&sV=2&form=S00027";
                    utils.log("maps", u);
                    break;
                case "BING_AERIAL":
                    var u = "https://www.bing.com/maps?osid=93c03dfb-f71d-449d-a5e8-33d609dbd00f&cp=" + coords[1] + "~" + coords[2] + "&lvl=" + coords[0] + "&style=h&v=2&sV=2&form=S00027";
                    utils.log("maps", u);
                    break;
            }

            if (me.url.match(/localhost/)) return;

            window.open(u, "", "");
        }
    };

    me.navigateTo = function (url) {
        url = utils.trim(url);
        if (url.indexOf("http") != 0) {
            url = "http://" + url;
        }

        window.open(url, "", "");
    };

    /*** menu and reading styles **************************************************************** */

    me.editFonts = function () {
        if (!userWeb.marking) {
            me.markElement(me.getTarget());
            me.setFontA();
        }
        if (fontEdit.loaded) {
            fontEdit.show();
        }
        else {
            fontEdit.load();
        }
    };

    me.addScriptElement = function (id, src) {
        $$(document.head).append(
            $$("<script>")
                .attr("id", id)
                .attr("type", "text/javascript")
                .attr("src", src));
    };

    me.addStyleElement = function (id, css) {
        $$(document.head).append(
            $$("<style>")
                .attr("id", id)
                .attr("rel", "stylesheet")
                .attr("type", "text/css")
                .text(css));
    };

    me.addStyles = function () {
        $$("body").addClass("uw-body"); //this is sometimes lost on pocket so we have to reapply
        if (me.addStylesDone) return;
        me.addStylesDone = true;

        me.addStyleElement("uw-css",
            "html body .uw-menu, html body .uw-menu *, html body .uw-help, html body .uw-help * { " +
                "font-family: Corbel, Comic Sans MS !important;" +
                "font-size: 13px !important;" +
                "font-style: normal !important;" +
                "line-height: 13px !important;" +
                "letter-spacing: 0 !important;" +
                "color: #000 !important;" +
                "background-color: #fff !important;" +
                "text-align: left !important;" +
                "margin: 0 !important;" +
                "padding: 0 !important;" +
                "border: 0 !important;" +
                "width: auto !important;" +
                "text-decoration: none !important;" +
                "box-shadow: none !important;" +
                "text-shadow: none !important;" +
            "}" +
            "html body .uw-help { " +
                "position: absolute !important;" +
                "top: 10px !important;" +
                "left: 10px !important;" +
                "border: solid 1px #000 !important;" +
                "background-color: #fff !important;" +
                "z-index: 9999999 !important;" +
                "padding: 10px !important;" +
            "}" +
            "html body .uw-help td, html body .uw-help th { " +
                "padding: 1px 20px 1px 5px !important;" +
            "}" +
            "html body .uw-help-button { " +
                "border:solid 1px #000 !important;" +
                "padding:5px !important;" +
                "margin-top:20px !important;" +
                "text-align:center !important;" +
                "cursor:pointer !important;" +
            "}" +
            //--------------------------------------------------------------------------------------
            "html body .uw-menu { " +
                "text-align: left !important;" +
                "padding: 0 !important;" +
                "position: absolute;" +
                "font-family: calibri;" +
                "font-size: 12px;" +
                "color: #000;" +
                "z-index: 999999999;" +
                "text-align: center;" +
                "user-select: none;" +
                "border-collapse: collapse !important;" +
                "border: solid 1px #000 !important;" +
            "}" +
            "html body .uw-menu * {" +
                "background: none !important;" +
                "background-color: #fff !important;" +
            "}" +
            "html body .uw-menu table {" +
                "display: block !important;" +
            "}" +
            "html body .uw-menu table, html body .uw-menu table td {" +
                "border-collapse: collapse !important;" +
                "vertical-align: top !important;" +
                "padding: 0 !important;" +
            "}" +
            "html body .uw-menu table td {" +
                "border: solid 1px #aaa !important;" +
                "background-color: #eee !important;" +
            "}" +
            "html body .uw-menu ul {" +
                "display: block !important;" +
                "min-height: 361px !important;" +
                "background-color: #eee !important;" +
            "}" +
            "html body .uw-menu ul, html body .uw-menu li {" +
                "padding: 0 !important;" +
                "list-style-type: none !important;" +
                "list-style: none !important;" +
                "white-space: nowrap !important;" +
            "}" +
            "html body .uw-menu li {" +
                "border-top: solid 1px #ddd !important;" +
                "min-width: 140px !important;" +
            "}" +
            "html body .uw-menu li:last-child {" +
                "border-bottom: solid 1px #ddd !important;" +
            "}" +
            "html body .uw-menu .uw-separator {" +
                "padding: 17px 0 0 0 !important;" +
                "background-color: #eee !important;" +
            "}" +
            "html body .uw-menu a {" +
                "text-decoration: none !important;" +
                "cursor: pointer !important;" +
                "padding: 2px 10px !important;" +
                "font-weight: normal !important;" +
                "display: block !important;" +
                "border: 0 !important;" +
                "text-transform: none !important;" +
            "}" +
            "html body .uw-menu a:hover {" +
                "background-color: #def !important;" +
            "}" +
            "html body .uw-menu a:visited {" +
                " color: #000 !important;" +
            "}" +
            //--------------------------------------------------------------------------------------
            "html body .uw-container a {" +
                "text-decoration: underline #ccc !important;" + /* uw-uln */
                "border-bottom: none !important;" + /* uw-btm */
                "box-shadow: none !important;" +
                "text-shadow: none !important;" +
                "background-image: none !important;" +
            "}" +
            "html body .uw-container p, html body p.uw-container {" + //qq
                "margin: 8px auto !important;" + /* uw-pmgn */
            "}" +
            "html body.uw-fontA .uw-container p, html body.uw-fontA p.uw-container {" +
                "text-indent: " + me.fontA.indent + "px !important;" +
                "margin: " + me.fontA.margin + "px auto !important;" +
            "}" +
            "html body.uw-fontB .uw-container p, html body.uw-fontB p.uw-container {" +
                "text-indent: " + me.fontB.indent + "px !important;" +
                "margin: " + me.fontB.margin + "px auto !important;" +
            "}" +
            "html body.uw-fontC .uw-container p, html body.uw-fontC p.uw-container {" +
                "text-indent: " + me.fontC.indent + "px !important;" +
                "margin: " + me.fontC.margin + "px auto !important;" +
            "}" +
            "html body .uw-container img + * {" +
                "font-style: italic !important;" +
            "}" +
            "html body .uw-hidden {" + //qq
                "display: none !important;" +
            "}" +
            "html body .uw-marked," +
            "html body .uw-popout .uw-marked {" +
                "border-top: dotted 1px #ddd !important; padding-top: 5px !important;" +
                "padding-top: 8px !important;" +
            "}" +
            "html body .uw-highlight, html body.uw-body .uw-container .uw-highlight {" +
                "background-color: #ffff80 !important;" +
            "}" +
            "html body.uw-popout-body {" +
                "background-color: #333 !important;" +
            "}" +
            "html body .uw-popout {" +
                "min-width: 350px !important;" +
                "max-width: 700px !important;" + //qq
                "margin: 0px auto 50px !important;" +
                "background-color: #fff !important;" +
                "border: solid 0 #000 !important;" +
                "border-radius: 0 !important;" +
                "padding: 120px 120px 300px !important;" +
                "box-sizing: content-box !important;" +
                "z-index: 99999999 !important;" +
            "}" +
            "html body .uw-popout .uw-links h1 {" +
                "margin: 0 0 20px !important;" +
                "font-size: 25px !important;" +
                "font-style: italic !important;" +
            "}" +
            "html body .uw-links a:visited {" +
                "color: #222 !important;" + /* uw-clr */
            "}" +
            "html body .uw-popout * {" +
                "position: relative !important;" +
                "float: none !important;" +
                "max-width: 99999px !important;" +
                "background-color: #fff !important;" +
                "padding: 0 !important;" +
            "}" +
            "html body .uw-popout figure," +
            "html body .uw-popout figcaption," +
            "html body .uw-popout img {" +
                "display: block !important;" +
                "margin: 15px auto !important;" +
                "height: auto !important;" +
                "max-width: 100% !important;" +
            "}" +
            "html body .uw-lite {" +
                "text-align: justify !important;" + /* uw-jfy */
                "white-space: normal !important;" +
            "}" +
            "html body.uw-body .uw-container, html body.uw-body .uw-container * {" +
                "font-style: normal !important;" + /* uw-sty */
                "text-align: justify !important;" + /* uw-jfy */
                "white-space: normal !important;" +
                "background-color: white !important;" +
            "}" +
            "html body.uw-fontA .uw-container, html body.uw-fontA .uw-container * {" +
                "font-family: " + me.fontA.face + ", Comic Sans MS !important;" +
                "font-size: " + me.fontA.size + "px !important;" +
                "line-height: " + me.fontA.height + "px !important;" +
                "font-weight: " + me.fontA.weight + " !important;" +
                "color: " + me.fontA.color + " !important;" +
            "}" +
            "html body.uw-fontB .uw-container, html body.uw-fontB .uw-container * {" +
                "font-family: " + me.fontB.face + ", Comic Sans MS !important;" +
                "font-size: " + me.fontB.size + "px !important;" +
                "line-height: " + me.fontB.height + "px !important;" +
                "font-weight: " + me.fontB.weight + " !important;" +
                "color: " + me.fontB.color + " !important;" +
            "}" +
            "html body.uw-fontC .uw-container, html body.uw-fontC .uw-container * {" +
                "font-family: " + me.fontC.face + ", Comic Sans MS !important;" +
                "font-size: " + me.fontC.size + "px !important;" +
                "line-height: " + me.fontC.height + "px !important;" +
                "font-weight: " + me.fontC.weight + " !important;" +
                "color: " + me.fontC.color + " !important;" +
            "}" +
            "html body.uw-body .uw-container h1," +
            "html body.uw-body .uw-container h2," +
            "html body.uw-body .uw-container h3," +
            "html body.uw-body .uw-container h4 {" +
                "margin-top: 30px !important;" +
                "margin-bottom: 10px !important;" +
            "}" +
            "html body.uw-body .uw-container h1," +
            "html body.uw-body .uw-container h2," +
            "html body.uw-body .uw-container h3," +
            "html body.uw-body .uw-container h4," +
            "html body.uw-body .uw-container th," +
            "html body.uw-body .uw-container dt," +
            "html body.uw-body .uw-container b," +
            "html body.uw-body .uw-container b *," +
            "html body.uw-body .uw-container strong," +
            "html body.uw-body .uw-container strong * {" +
                "font-weight: bold !important;" +
            "}" +
            "html body.uw-body .uw-container blockquote," +
            "html body.uw-body .uw-container blockquote *," +
            "html body.uw-body .uw-container em," +
            "html body.uw-body .uw-container em *," +
            "html body.uw-body .uw-container i," +
            "html body.uw-body .uw-container i * {" +
                "font-style: italic !important;" +
            "}" +
            "@media (max-width: 800px) {" +
                "html body .uw-container, html body .uw-container * {" +
                    "font-family: " + me.fontA.face + ", Comic Sans MS !important;" +
                    "font-size: " + me.fontA.sizeS + "px !important;" +
                    "line-height: " + me.fontA.heightS + "px !important;" +
                    "font-weight: " + me.fontA.weight + " !important;" +
                    "color: " + me.fontA.color + " !important;" +
                "}" +
                "html body.uw-fontA .uw-container, html body.uw-fontA .uw-container * {" +
                    "font-family: " + me.fontA.face + ", Comic Sans MS !important;" +
                    "font-size: " + me.fontA.sizeS + "px !important;" +
                    "line-height: " + me.fontA.heightS + "px !important;" +
                    "font-weight: " + me.fontA.weight + " !important;" +
                    "color: " + me.fontA.color + " !important;" +
                "}" +
                "html body.uw-fontB .uw-container, html body.uw-fontB .uw-container * {" +
                    "font-family: " + me.fontB.face + ", Comic Sans MS !important;" +
                    "font-size: " + me.fontB.sizeS + "px !important;" +
                    "line-height: " + me.fontB.heightS + "px !important;" +
                    "font-weight: " + me.fontB.weight + " !important;" +
                    "color: " + me.fontB.color + " !important;" +
                "}" +
                "html body.uw-fontC .uw-container, html body.uw-fontC .uw-container * {" +
                    "font-family: " + me.fontC.face + ", Comic Sans MS !important;" +
                    "font-size: " + me.fontC.sizeS + "px !important;" +
                    "line-height: " + me.fontC.heightS + "px !important;" +
                    "font-weight: " + me.fontC.weight + " !important;" +
                    "color: " + me.fontC.color + " !important;" +
                "}" +
                "html body .uw-popout {" +
                    "min-width: 100px;" +
                    "margin: 10px auto 800px !important;" +
                "}" +
            "}"
        );
    };

    me.setFontA = function () {
        $$("body").addClass("uw-fontA");
        $$("body").removeClass("uw-fontB");
        $$("body").removeClass("uw-fontC");
        me.readingState = 2;
        me.markRefocus();
    };

    me.setFontB = function () {
        $$("body").removeClass("uw-fontA");
        $$("body").addClass("uw-fontB");
        $$("body").removeClass("uw-fontC");
        me.readingState = 3;
        me.markRefocus();
    };

    me.setFontC = function () {
        $$("body").removeClass("uw-fontA");
        $$("body").removeClass("uw-fontB");
        $$("body").addClass("uw-fontC");
        me.readingState = 4;
        me.markRefocus();
    };

    /*** user style ***************************************************************************** */

    me.loadUserStyle = function () {

        var config = {
            amazon: { exp: /amazon\.co/i },
            bbc_news: { exp: /bbc\.co\.uk\/(news|sport)/i },
            bbc_weather: { exp: /bbc\.co\.uk\/(weather)/i },
            boing_boing: { exp: /boingxboing\.net/i },
            bing_maps: { exp: /bing\.com\/maps/i },
            gmail: { exp: /mail\.google\.com/i },
            google_calendar: { exp: /google\.com\/calendar/i },
            //google_keep: { exp: /keep\.google\.com/i },
            google_maps: { exp: /maps\.google\.co/i },
            google_search: { exp: /google\.(co\.uk|com)\/(search|webhp)/i },
            guardian: { exp: /(guardian\.co\.uk)|theguardian\.com/i },
            inoreader: { exp: /inoreader\.com/i },
            messenger: { exp: /messengernewspapers\.co\.uk/i },
            met_weather: { exp: /metoffice\.gov\.uk\/mobile/i },
            office: { exp: /outlook\.office(365)*\.com/i },
            outlook: { exp: /portal\..*com\/owa/i },
            pocket: { exp: /getpocket\.com/i },
            reddit: { exp: /reddit\.com/i },
            stack_overflow: { exp: /(stackoverflow|stackexchange|superuser)\.com/i },
            test: { exp: /(testlocal|home|dev|dev-fonts|testinject|testxx)\.htm/i },
            tutorials_point: { exp: /tutorialspoint\.com/i },
            yammer: { exp: /yammer\.com/i },
            youtube: { exp: /youtube\.com/i },
            wikipedia: { exp: /wikipedia\.org/i }
        };

        me.foundUserStyle = false;

        for (var name in config) {
            var cfg = config[name];
            cfg.name = name;

            if (me.url.match(cfg.exp) == null) continue;

            me.currentConfig = cfg;
            if (cfg.exp != "") {
                me.foundUserStyle = true;

                if (name == "feedly" && me.isSmall()) {
                    name = "feedly_compact";
                }

                me.loadUserStyleSheet(name.replace(/_/ig, "-"));
                break;
            }
        }

        me.activeUserStyle = me.foundUserStyle;
        me.refreshMenu();
    };

    me.loadUserStyleSheet = function (name) {
        var url = me.getUrl("styles/" + name + ".css");

        utils.log("inserting style", name);

        if (me.userStyleSheet == null) {
            me.userStyleSheet = $$("<link>")
                .attr("id", "uw-css")
                .attr("rel", "stylesheet")
                .attr("type", "text/css");

            $$(document.head).append(me.userStyleSheet);
        }

        me.userStyleSheet.attr("href", url);
        me.activeUserStyle = true;
    };

    me.unloadUserStyle = function () {
        me.userStyleSheet.attr("href", "");
        me.activeUserStyle = false;
        me.refreshMenu();
    };

    me.openUserStyle = function () {
        window.open(me.userStyleSheet.attr("href").replace(/\?.*/, ""));
    };

    /*** display ******************************************************************************** */

    me.tidyBound = false;
    me.tidyOn = false;
    me.tidyUp = function (e) {
        if (me.tidyUpExclude) {
            utils.log("tidy", "excluded from tidy");
            return;
        }

        if (!me.tidyOn) {
            me.tidyOn = true;
            me.refreshMenu();
        }

        $$(".u-fixed").each(function () {
            utils.log("u-fixed", $$(this).css("position"));
        });

        $$("*").filter(function () {
            try {
                var el = $$(this);
                var pos = el.css("position");
                var id = el.attr("id") || "";
                var tagName = el.prop("tagName");
                var match = (pos === "fixed" || pos === "sticky") && tagName != "BODY" && tagName != "PICTURE" && id.indexOf("uw-") != 0;
                if (match) utils.log("tidyUp", "found: ", utils.elToString(el));
                return match;
            }
            catch (ex) {
                utils.log(ex);
                utils.log("tidy ex", utils.elToString($$(this)));
            }
        }).remove();

        utils.restoreScroll();

        me.tidyBind(); //bind if not already bound
    };

    me.tidyBind = function (e) {
        if (me.tidyBound) return;

        me.tidyBound = true;

        var targetNode = document.body;
        var config = { attributes: false, childList: true, subtree: true };
        var callback = function (mutationsList, observer) {
            if (!me.tidyOn) return;

            me.tidyUp();
        };

        var observer = new MutationObserver(callback);
        observer.observe(targetNode, config);
    };

    me.siteConfig = function () {
        for (var i in me.siteConfigs) {
            var cfg = me.siteConfigs[i];

            if (me.url.match(cfg.exp) != null) {

                if (cfg.filter) {
                    utils.log("site filter", cfg.filter);

                    $$(cfg.filter).each(function (i) {
                        var id = this.id; if (id == "") id = "[none]";
                        var className = this.className; if (className == "") className = "[none]";
                        utils.log("removing", "id:", id, "; class:", className, ";");
                        $$(this).remove();
                    });

                    me.addStyleElement(
                        "uw-filter",
                        cfg.filter + " { display: none !important; }"
                    );
                }

                if (cfg.icon) {
                    utils.log("site icon", cfg.icon.substr(cfg.icon.lastIndexOf("/") + 1));

                    $$("link[rel='icon']").remove();

                    var lnk = document.createElement("link");
                    lnk.rel = "icon";
                    lnk.href = cfg.icon;
                    lnk.type = "image/x-icon";

                    document.getElementsByTagName("head")[0].appendChild(lnk);
                }

                if (cfg.custom) {
                    utils.log("custom function", cfg.custom);

                    me.run(function () {
                        cfg.custom();
                    });
                }

                window.self.setTimeout(function () {
                    me.run(function () { me.siteConfig(); });
                }, 6 * 60 * 60 * 1000); //run every 6 hours
            }
        }
    };

    /*** reading ******************************************************************************** */

    me.readLite = function () {
        me.addStyles();
        $$("p").addClass("uw-lite");
    };

    me.doReadFromElement = function (el) {
        var main = me.getMainFromElement(el);
        if (main == null || main.length == 0) return;
        me.doRead(main);
        return main;
    };

    me.getMainFromElement = function (el) {
        var parent = el.parent();

        if (parent.length == 0 || parent[0].tagName.toUpperCase() == "BODY") {
            return el;
        }

        if (parent.width() > el.width() + 30) {
            return el;
        }

        return me.getMainFromElement(parent);
    };

    me.doRead = function (main) {
        me.addStyles();
        me.tidyUp();
        main.addClass("uw-container");
        me.activeReadr = true;
        me.refreshMenu();
    };

    me.undoRead = function () {
        me.undoPopout();
        me.activeReadr = false;
        $$("body").removeClass("uw-fontA");
        $$("body").removeClass("uw-fontB");
        $$("body").removeClass("uw-fontC");
        $$(".uw-lite").removeClass("uw-lite");
        me.markRefocus();
        $$(".uw-marked").removeClass("uw-marked");
        $$(".uw-read").removeClass("uw-read");
        $$(".uw-container").removeClass("uw-container");
        me.markElementCancel();
        me.refreshMenu();
        me.readingState = 0;
    };

    me.doPopout = function (el, markEl) {
        me.tidyUp();
        me.addStyles();
        me.setFontA();
        me.activeReadr = true;
        $$("body").addClass("uw-popout-body");

        if (el == null) {
            el = [];
            var doc = document.cloneNode(true);
            var article = new Readability(doc).parse();
            var inner = article.content;
            // utils.log("title  ", article.title  ); // article title
            // utils.log("content", article.content); // HTML string of processed article content
            // utils.log("length ", article.length ); // length of an article, in characters
            // utils.log("excerpt", article.excerpt); // article description, or short excerpt from the content
            // utils.log("byline ", article.byline ); // author metadata
            // utils.log("dir    ", article.dir    ); // content direction
            //document.write(article.content);
        }
        else {
            var rem = el.find("iframe, script, link, button, input, form, textarea, aside").remove();
            // rem.each(function() { utils.log($$(this).html()); });

            var exclude = /share|sharing|social|twitter|tool|^side|related|comment|discussion|extra|contentWellBottom|kudo|^ad|keywords|secondary-column$|furniture|hidden|embedded-hyper/gi;
            var hid = el.find("*").filter(function () {
                return (typeof (this.className) == "string" && this.className.match(exclude) !== null) ||
                    (typeof (this.id) == "string" && this.id.match(exclude) !== null) ||
                    $$(this).css("visibility") == "hidden" ||
                    $$(this).css("display") == "none";
            });
            //hid.each(function() { utils.log("removed", $$(this).html().substr(0, 100)); });
            hid.remove();

            el.find("*").attr("style", "");

            var inner = el[0].outerHTML;
        }

        $(document.body).children().addClass("uw-hidden"); //qq

        var doc = [];
        doc.push("<div class='uw-popout uw-container'>");
        doc.push(" <div class='uw-links'>");
        doc.push("  <a href='" + document.location.href + "'><h1>" + document.title + "</h1></a>");
        doc.push(" </div>");
        doc.push(" <div>");
        doc.push(inner);
        doc.push(" </div>");
        doc.push("</div>");
        var html = doc.join("");

        document.body.insertAdjacentHTML("afterbegin", html);
        me.popoutDiv = $$(".uw-popout");
        me.activePopout = true;
        me.refreshMenu();
        utils.scrollToY(0);
        utils.restoreScroll();

        if (markEl) {
            var markText = markEl.text();
            var tagName = markEl[0].tagName;
            var sibs = me.popoutDiv.find(tagName);
            var index = -1;
            for (var i = 0; i < sibs.length; i++) {
                var eli = $$(sibs[i]);
                if (eli.text() == markText) {
                    el = eli;
                    utils.log("found!!!", el.text());
                    break;
                }
            }
        }
        if (el.length == 0) el = me.popoutDiv.find("p:visible:first");
        if (el.length == 0) el = me.popoutDiv.find(":visible:first");
        if (el.length == 0) el = me.popoutDiv;
        me.markElementAndBind(el);
        utils.fullscreen(); //qqq
    };

    me.undoPopout = function () {
        if (me.popoutDiv != null) {
            me.popoutDiv.remove();
            me.popoutDiv = null;
            utils.scrollToElement($$("body"));
            me.marked = $$();
            $$("body").removeClass("uw-popout-body");
            $(".uw-hidden").removeClass("uw-hidden");
        }
        me.activePopout = false;
        utils.fullscreenExit(); //qqq
    };

    /*** finding ******************************************************************************** */

    me.startFind = function () {
        utils.clearSelection();
        me.markElementCancel();
        me.finder = new function () {
            this.els = [];
            this.el = function () {
                return this.els[this.els.length - 1];
            };
            this.el0 = function () {
                return this.els[0];
            };
        }();

        document.oncontextmenu = function () {
            return false;
        };

        $$("body").bind("mouseup.uw-find-first", function (e) { me.run(function () { return me.onFindingFirstMouseUp(e); }); });

        me.refreshMenu();
    };

    me.onFindingFirstMouseUp = function (e) {
        $$("body").unbind("mouseup.uw-find-first");
        var el = $$(e.target);

        // right click - delete element ------------------------------------------------------------
        if (e.button == 2) {
            me.finder.els.push(el);
            me.readingState = 0;
            window.self.setTimeout(function () {
                me.found("remove");
            }, 1);
            return utils.cancelEvent(e);
        }

        // left click - mark or find ---------------------------------------------------------------
        if (me.findF2) {
            me.findF2 = false;
            me.markElementAndBind(el);
        }
        else {
            me.finder.els.push(el);
            el.attr("style", "background-color: orange !important");
            $$("body").bind("keyup.uw-find", function (e) { me.run(function () { return me.onFindingKeyUp(e); }); });
            $$("body").bind("mouseup.uw-find", function (e) { me.run(function () { return me.onFindingMouseUp(e); }); });

            document.oncontextmenu = function () {
                return false;
            };
        }
    };

    me.onFindingKeyUp = function (e) {
        switch (e.keyCode) {
            case 27: //esc
                me.cancelFind();
                break;
            case 49: //1
            case 50: //2
            case 51: //3
                me.found(e.key);
                break;
            case 68: //d
            case 46: //DEL
                me.found("remove");
                break;
            case 77: //m > mark
                me.found("mark");
                break;
            case 72: //h > highlight
                me.found("highlight");
                break;
            case 80: //p > popout
                me.found("popout");
                break;
            case 37: //back
                if (me.finder.el() != me.finder.el0()) {
                    me.finder.el().css("background-color", "");
                    me.finder.els.pop();
                }
                break;
            case 39: //forward
                me.findParent();
                break;
        }
    };

    me.onFindingMouseUp = function (e) {
        switch (e.button) {
            case 0:
                me.findParent(); //chrome
                break;
            case 1:
                if (document.all) { //IE
                    me.findParent();
                }
                break;
            case 2: //right click
                window.self.setTimeout(function () {
                    me.found("remove");
                }, 1);
                break;
        }
    };

    me.findParent = function () {
        var el = me.finder.el();
        if (el[0].tagName == "BODY") {
            return;
        }

        var elp = el.parent();
        if (elp[0].tagName == "BODY") {
            elp.attr("style", "background-color: red !important");
        }
        else {
            elp.attr("style", "background-color: gold !important");
        }

        elp.addClass("uw-find-el");
        me.finder.els.push(elp);
    };

    me.found = function (option) {
        var el = me.finder.el();
        me.cancelFind();

        switch (option) {
            case "1":
            case "2":
            case "3":
                me.doRead(el);
                if (option == "1") me.setFontA();
                else if (option == "2") me.setFontB();
                else me.setFontC();
                break;
            case "mark":
                me.markElementAndBind(el);
                return;
            case "highlight":
                me.highlightElement(el);
                return;
            case "remove":
                el.remove();
                return;
            case "popout":
                me.doPopout(el, el);
                return;
        }
    };

    me.cancelFind = function () {
        $$(".uw-find-el").css("background-color", "");
        try {
            me.finder.el0().css("background-color", "");
        }
        catch (ex) { }
        $$("*").unbind(".uw-find");
        $$("body").unbind("mouseup.uw-find-first");
        me.setReloader();
        me.finder = null;
    };

    /*** mark and highlight ********************************************************************* */

    me.markElementAndBind = function (el) {
        if (!me.marking) {
            me.marking = true;
            me.addStyles();
            $$("body").bind("mouseup.uw-marking", function (e) { me.run(function () { return me.markElementMouseUp(e); }); });
            $$("body").bind("keyup.uw-marking", function (e) { me.run(function () { return me.markElementKeyUp(e); }); });

            document.oncontextmenu = function () {
                me.markElementCancel();
                return false;
            };

            if (me.marked.is(":hidden")) {
                return;
            }
        }

        me.markElement(el);
    };

    me.markElementKeyUp = function (e) {
        switch (e.keyCode) {
            case 27: //esc
                me.markElementCancel();
                break;
        }
    };

    me.markElementCancel = function () {
        if (me.marking) {
            me.marking = false;
            $$("body").unbind("mouseup.uw-marking");
            $$("body").unbind("keyup.uw-marking");
        }

        me.setReloader();
    };

    me.markRefocus = function () {
        if (me.marking) {
            utils.scrollToElement(me.marked, "auto");
        }
    };

    me.markElement = function (target) {
        if (fontEdit.showing && target.parents("#uw-fe-outer").length > 0) return;

        if (me.menuShowing) return;

        utils.clearSelection();
        if (target.prop("tagName") != "P") {

            if (target.parent().prop("tagName") == "P") {
                target = target.parent();
            }
            else {
                utils.log("Not marking", target.prop("tagName"));
                return;
            }
        }

        $$(".uw-marked").removeClass("uw-marked");
        me.marked.addClass("uw-read");

        if (me.activeReadr) {
            var parent = target.parent();
            while (true) {
                var parentTag = parent[0].tagName.toUpperCase();

                if (parentTag.match(/^(HTML|BODY)$/)) {
                    me.doReadFromElement(target);
                    break;
                }

                if (parent.hasClass("uw-container")) {
                    break;
                }

                parent = parent.parent();
            }
        }

        me.marked = target;
        target.removeClass("uw-read").addClass("uw-marked");
        utils.scrollToElement(target);
    };

    me.markElementMouseUp = function (e) {
        switch (e.button) {
            case 0: //chrome
                me.run(function () {
                    me.markElement($$(e.target));
                });
                break;
            case 1:
                if (document.all) { //IE
                    me.run(function () {
                        me.markElement($$(e.target));
                    });
                }
                break;
            case 2: //right click
                break;
        }
    };

    me.highlightElement = function (target) {
        utils.clearSelection();
        if (target.prop("tagName") != "P" && target.parent().prop("tagName") == "P") target = target.parent();
        target.addClass("uw-highlight");
    };

    /*** helpers ******************************************************************************** */

    me.getUrl = function (path) {
        var unique = settings.uniqueUrls ? "?" + new Date().valueOf() : "";
        return me.getRoot() + path + unique;
    };

    me.getRoot = function () {
        return settings.localUrls ? "https://localhost:44300/" : "https://rawgit.com/james-zerty/user-web/master/";
    };

    me.isSmall = function () {
        return $$(window).width() < 700;
    };

    me.run = function (fn) {
        if (settings.handleErrors) {
            try {
                fn();
            }
            catch (ex) {
                utils.log(ex);
            }
        }
        else {
            fn();
        }
    };

    me.setReloader = function () {
        if (settings.reloader == 1) {
            document.oncontextmenu = function (e) {
                document.location.reload(true);
                return false;
            };
        }
        else if (settings.reloader == 2) {
            document.ondblclick = function (e) {
                document.location.reload(true);
                return false;
            };
        }
        else {
            document.oncontextmenu = null;
        }
    };
}();

/* === fontEdit ================================================================================= */

var fontEdit = new function () {
    var me = this;

    me.load = function () {
        me.loaded = true;
        me.url = document.location.href;
        me.open();
    };

    me.show = function () {
        me.div.show();
        me.showing = true;
    };

    me.open = function () {

        me.showing = true;
        me.fonts = [];

        /*
        keep marking during font edit
        split into: small/large sans/serif/fixed
        remove some fonts
        type in own font names
        save results
        */

        //normal...
        // me.fonts.push({ sep: true, face: "=== Sans Small ===" }); //-------------------------------------------------------------------------------------------------------------
        me.fonts.push(userWeb.fontA); var fontA = me.fonts.length - 1;
        me.fonts.push({ size: 17, height: 27, margin: 8, weight: "300", color: "#222", sizeS: 14, heightS: 24, serif: 0, fixed: 0, indent: 10, face: "Ubuntu" });
        me.fonts.push({ size: 19, height: 31, margin: 8, weight: "300", color: "#222", sizeS: 14, heightS: 24, serif: 0, fixed: 0, indent: 10, face: "Ubuntu" });
        me.fonts.push({ size: 19, height: 32, margin: 8, weight: "400", color: "#555", sizeS: 14, heightS: 24, serif: 0, fixed: 0, indent: 10, face: "Ubuntu" });
        // me.fonts.push({ sep: true, face: "=== Sans Large ===" }); //-------------------------------------------------------------------------------------------------------------
        me.fonts.push({ size: 20, height: 30, margin: 8, weight: "300", color: "#333", sizeS: 16, heightS: 23, serif: 0, fixed: 0, indent: 10, face: "Corbel" });//nh
        me.fonts.push(userWeb.fontB); var fontB = me.fonts.length - 1;
        // me.fonts.push({ size: 18, height: 28, weight: "300", color: "#333", sizeS: 18, heightS: 29, serif: 0, fixed: 0, indent: 10, face: "Open Sans" });
        // me.fonts.push({ size: 18, height: 28, weight: "300", color: "#333", sizeS: 17, heightS: 27, serif: 0, fixed: 0, indent: 10, face: "Tahoma" });
        // me.fonts.push({ size: 18, height: 28, weight: "300", color: "#333", sizeS: 19, heightS: 28, serif: 0, fixed: 0, indent: 10, face: "Calibri" });
        // me.fonts.push({ size: 18, height: 28, weight: "300", color: "#333", sizeS: 18, heightS: 27, serif: 0, fixed: 0, indent: 10, face: "Ebrima" });
        // me.fonts.push({ size: 18, height: 28, weight: "300", color: "#333", sizeS: 18, heightS: 29, serif: 0, fixed: 0, indent: 10, face: "Century Gothic" });
        // me.fonts.push({ size: 18, height: 28, weight: "300", color: "#333", sizeS: 18, heightS: 29, serif: 0, fixed: 0, indent: 10, face: "Segoe UI" });
        // me.fonts.push({ size: 18, height: 28, weight: "300", color: "#333", sizeS: 16, heightS: 25, serif: 0, fixed: 0, indent: 10, face: "Arial" });
        // me.fonts.push({ size: 18, height: 28, weight: "300", color: "#333", sizeS: 17, heightS: 27, serif: 0, fixed: 0, indent: 10, face: "Lucida Sans Unicode" });
        // me.fonts.push({ size: 18, height: 28, weight: "300", color: "#333", sizeS: 16, heightS: 25, serif: 0, fixed: 0, indent: 10, face: "Trebuchet MS" });
        // me.fonts.push({ size: 18, height: 28, weight: "300", color: "#333", sizeS: 16, heightS: 25, serif: 0, fixed: 0, indent: 10, face: "Verdana" });
        // me.fonts.push({ size: 18, height: 28, weight: "300", color: "#333", sizeS: 18, heightS: 29, serif: 0, fixed: 0, indent: 10, face: "Malgun Gothic" });

        //me.fonts.push({ sep: true, face: "=== Sans Medium ===" }); //-------------------------------------------------------------------------------------------------------------
        // me.fonts.push({ size: 20, height: 30, weight: "400", color: "#555", sizeS: 18, heightS: 29, serif: 0, fixed: 0, indent: 10, face: "Microsoft JhengHei UI" });
        // me.fonts.push({ size: 20, height: 30, weight: "400", color: "#555", sizeS: 17, heightS: 27, serif: 0, fixed: 0, indent: 10, face: "MS Reference Sans Serif" });
        // me.fonts.push({ size: 20, height: 30, weight: "600", color: "#555", sizeS: 18, heightS: 27, serif: 0, fixed: 0, indent: 10, face: "Calibri Light" });
        // me.fonts.push({ size: 20, height: 30, weight: "600", color: "#555", sizeS: 18, heightS: 29, serif: 0, fixed: 0, indent: 10, face: "Segoe UI Symbol" });
        // me.fonts.push({ size: 20, height: 30, weight: "600", color: "#555", sizeS: 18, heightS: 29, serif: 0, fixed: 0, indent: 10, face: "Segoe UI Light" });

        // me.fonts.push({ sep: true, face: "=== Serif Small ===" }); //------------------------------------------------------------------------------------------------------------
        // me.fonts.push({ sep: true, face: "=== Serif Big ===" }); //--------------------------------------------------------------------------------------------------------------
        me.fonts.push(userWeb.fontC); var fontC = me.fonts.length - 1; //qq
        me.fonts.push({ size: 19, height: 29, margin: 15, weight: "400", color: "#000", sizeS: 19, heightS: 27, serif: 1, fixed: 0, indent: 10, face: "Lora" });
        me.fonts.push({ size: 20, height: 30, margin: 15, weight: "400", color: "#444", sizeS: 17, heightS: 27, serif: 1, fixed: 0, indent: 10, face: "Georgia" });
        me.fonts.push({ size: 19, height: 30, margin: 15, weight: "300", color: "#333", sizeS: 15, heightS: 19, serif: 1, fixed: 0, indent: 10, face: "Merriweather" });
        me.fonts.push({ size: 19, height: 28, margin: 15, weight: "500", color: "#444", sizeS: 15, heightS: 25, serif: 1, fixed: 0, indent: 10, face: "Yu Mincho" });
        me.fonts.push({ size: 21, height: 30, margin: 15, weight: "400", color: "#000", sizeS: 17, heightS: 27, serif: 1, fixed: 0, indent: 10, face: "Cardo" });
        /*
        me.fonts.push({ size: 20, height: 34, weight: "300", color: "#333", sizeS: 18, heightS: 29, serif: 1, fixed: 0, indent: 10, face: "Bookman Old Style" });
        me.fonts.push({ size: 20, height: 34, weight: "300", color: "#333", sizeS: 20, heightS: 28, serif: 1, fixed: 0, indent: 10, face: "Centaur" });
        me.fonts.push({ size: 20, height: 34, weight: "300", color: "#333", sizeS: 18, heightS: 29, serif: 1, fixed: 0, indent: 10, face: "Century" });
        me.fonts.push({ size: 20, height: 34, weight: "300", color: "#333", sizeS: 18, heightS: 27, serif: 1, fixed: 0, indent: 10, face: "Constantia" });
        me.fonts.push({ size: 20, height: 34, weight: "300", color: "#333", sizeS: 20, heightS: 29, serif: 1, fixed: 0, indent: 10, face: "Garamond" });
        me.fonts.push({ size: 20, height: 34, weight: "300", color: "#333", sizeS: 18, heightS: 29, serif: 1, fixed: 0, indent: 10, face: "High Tower Text" });
        me.fonts.push({ size: 20, height: 34, weight: "300", color: "#333", sizeS: 17, heightS: 27, serif: 1, fixed: 0, indent: 10, face: "Lucida Bright" });
        me.fonts.push({ size: 20, height: 34, weight: "300", color: "#333", sizeS: 16, heightS: 25, serif: 1, fixed: 0, indent: 10, face: "Lucida Fax" });
        me.fonts.push({ size: 20, height: 34, weight: "300", color: "#333", sizeS: 18, heightS: 29, serif: 1, fixed: 0, indent: 10, face: "Mongolian Baiti" });
        me.fonts.push({ size: 20, height: 34, weight: "300", color: "#333", sizeS: 18, heightS: 29, serif: 1, fixed: 0, indent: 10, face: "Palatino Linotype" });
        me.fonts.push({ size: 20, height: 34, weight: "300", color: "#333", sizeS: 18, heightS: 29, serif: 1, fixed: 0, indent: 10, face: "Sylfaen" });
        me.fonts.push({ size: 20, height: 34, weight: "300", color: "#333", sizeS: 18, heightS: 29, serif: 1, fixed: 0, indent: 10, face: "Times New Roman" });
        */
        // me.fonts.push({ size: 18, height: 29, weight: "900", color: "#060", sizeS: 10, heightS: 20, serif: 1, fixed: 0, indent: 10, face: "Broadway" });

        //fixed...
        /*
        me.fonts.push({ sep: true, face: "=== Fixed ===" }); //---------------------------------------------------------------------------------------------------------------------
        me.fonts.push({ size: 18, height: 22, weight: "400", color: "#333", sizeS: 18, heightS: 22, serif: 1, fixed: 1, indent: 10, face: "Courier New" });
        me.fonts.push({ size: 15, height: 21, weight: "400", color: "#333", sizeS: 15, heightS: 21, serif: 0, fixed: 1, indent: 10, face: "Consolas" });
        me.fonts.push({ size: 16, height: 25, weight: "400", color: "#333", sizeS: 16, heightS: 25, serif: 0, fixed: 1, indent: 10, face: "Lucida Console" });
        me.fonts.push({ size: 18, height: 29, weight: "400", color: "#333", sizeS: 18, heightS: 29, serif: 1, fixed: 0, indent: 10, face: "SimSun" });
        */

        var opts = "";
        for (var i = 0; i < me.fonts.length; i++) {
            var f = me.fonts[i];
            f.val = i;
            opts += "<option value=" + f.val + ">" + f.face + "</option>";
        }
        var doc = [];
        doc.push("<div id='uw-fe-outer'>" +
                    "<div class='fe-row'>" +
                        "<a class='fe-close fe-se'>X</a>" +
                        "<a class='fe-add fe-sw fe-right'>+</a>" +
                        "<a class='fe-prev fe-sw'>&lt;</a>" +
                        "<a class='fe-next fe-sw'>&gt;</a>" +
                    "</div>" +
                    "<div class='fe-row'>" +
                        "<select id='fe-list'>" + opts + "</select>" +
                    "</div>" +
                    "<div class='fe-row'>" +
                        "<div class='fe-size'></div>" +
                            "<a class='fe-fsup fe-right'>+</a>" +
                            "<a class='fe-fsdn'>-</a>" +
                        "</div>" +
                    "<div class='fe-row'>" +
                        "<div class='fe-height'></div>" +
                            "<a class='fe-lhup fe-right'>+</a>" +
                            "<a class='fe-lhdn'>-</a>" +
                        "</div>" +
                    "<div class='fe-row'>" +
                        "<div class='fe-weight'></div>" +
                            "<a class='fe-fwup fe-right'>+</a>" +
                            "<a class='fe-fwdn'>-</a>" +
                        "</div>" +
                    "<div class='fe-row'>" +
                        "<input type='text' class='fe-color' />" +
                        "<a class='fe-clup fe-right'>+</a>" +
                        "<a class='fe-cldn'>-</a>" +
                    "</div>" +
                "</div>");

        var html = doc.join("");

        document.body.insertAdjacentHTML("afterbegin", html);

        me.feList = $$("#fe-list");
        me.div = $$("#uw-fe-outer");

        if ($$("body").hasClass("uw-fontA")) {
            me.feList[0].selectedIndex = fontA;
        }
        else if ($$("body").hasClass("uw-fontB")) {
            me.feList[0].selectedIndex = fontB;
        }
        else if ($$("body").hasClass("uw-fontC")) {
            me.feList[0].selectedIndex = fontC;
        }
        else {
            me.feList[0].selectedIndex = fontA;
        }

        me.setStyleCommon();
        me.setEvents();
    };

    me.setEvents = function () {
        me.feList.change(function () {
            me.change();
        });

        me.feList.change();
        me.feList.focus();

        $$(".fe-close").click(function () {
            me.div.hide();
            me.showing = false;
        });
        $$(".fe-add").click(function () {
            var nf = prompt("New font...", "Arial");
            if (nf) {
                utils.log("fonts", nf);
                var f = { size: 10, height: 38, sizeS: 17, heightS: 27, weight: "400", color: "#000", serif: 1, fixed: 0, indent: 10, face: nf };
                me.fonts.push(f);
                f.val = me.fonts.length - 1;
                utils.log("fonts", "val ", f.val);
                me.feList.append($$("<option value=" + f.val + ">" + f.face + "</option>"))
                me.feList[0].selectedIndex = f.val;
                me.feList.change();
            }
            else {
                utils.log("fonts", "cancelled");
            }
        });
        $$(".fe-prev").click(function () {
            me.feListShift("-");
        });
        $$(".fe-next").click(function () {
            me.feListShift("+");
        });

        $$("body").bind("keydown.fontEdit", function (e) {
            if (e.altKey && e.shiftKey) {
                if (e.keyCode == 37) { // left
                    me.feListShift("-");
                }
                else if (e.keyCode == 39) { // right
                    me.feListShift("+");
                }
            }
        });
        $$(".fe-fsup").click(function () {
            me.incProp(this, "size", 1);
        });
        $$(".fe-fsdn").click(function () {
            me.incProp(this, "size", -1);
        });
        $$(".fe-lhup").click(function () {
            me.incProp(this, "height", 1);
        });
        $$(".fe-lhdn").click(function () {
            me.incProp(this, "height", -1);
        });
        $$(".fe-fwup").click(function () {
            me.incProp(this, "weight", 100);
        });
        $$(".fe-fwdn").click(function () {
            me.incProp(this, "weight", -100);
        });
        $$(".fe-clup").click(function () {
            me.incProp(this, "color", 111);
        });
        $$(".fe-cldn").click(function () {
            me.incProp(this, "color", -111);
        });
        $$(".fe-color").keyup(function () {
            if (this.value.length > 3) {
                me.changeProp(this, "color", this.value);
            }
        });
    };

    me.feListShift = function (dir) {
        var i = me.feList[0].selectedIndex;

        if (dir == "+") {
            if (i >= me.feList[0].options.length - 1) {
                i = 0;
            }
            else {
                i++;
            }
        }
        else {
            if (i == 0) {
                i = me.feList[0].options.length - 1;
            }
            else {
                i--;
            }
        }

        me.feList[0].selectedIndex = i;
        me.change();
    };

    me.change = function () {
        var f = me.getFont();
        me.setStyle(f);
    };

    me.getFont = function () {
        return me.fonts[me.feList[0].selectedIndex];
    };

    me.addStyleElement = function (id, css) {
        $$("#" + id).remove();
        $$(document.body).append(
            $$("<style>")
                .attr("id", id)
                .attr("rel", "stylesheet")
                .attr("type", "text/css")
                .text(css));
    };

    me.incProp = function (el, prop, inc) {
        var f = me.getFont();
        var val = f[prop];
        utils.log(prop, val);
        var num = parseInt(val.toString().replace("#", ""), 10);
        utils.log(prop, num);
        num = num + inc;
        if (prop == "color") {
            if (num == 0) {
                num = "#000";
            }
            else {
                num = "#" + num;
            }
        }
        utils.log(prop, num);
        f[prop] = num;

        me.setStyle(f);
        utils.clearSelection();
    };

    me.changeProp = function (el, prop, val) {
        var f = me.getFont();
        f[prop] = val;

        me.setStyle(f);
        utils.clearSelection();
    };

    me.setStyleCommon = function () {
        me.addStyleElement("fe-css",
            "html body div#uw-fe-outer { " +
                "position: fixed !important; " +
                "top: 10px !important; " +
                "left: 10px !important; " +
                "color: #000 !important; " +
                "border: solid 1px #bbb !important; " +
                "background-color: #fff !important; " +
                "z-index: 9999999 !important; " +
                "padding: 0 !important;" +
                "width: 100px !important;" +
                "display: flex;" +
                "flex-direction: column !important;" +
            "}" +
            "html body div#uw-fe-outer * { " +
                "font: 10px/18px Verdana !important; " +
            "}" +
            "html body div#uw-fe-outer .fe-row { " +
                "display: flex !important;" +
            "}" +
            "html body div#uw-fe-outer a { " +
                "-webkit-user-select: none !important;" +  /* Chrome all / Safari all */
                "-moz-user-select: none !important;" +     /* Firefox all */
                "-ms-user-select: none !important;" +      /* IE 10+ */
                "user-select: none !important;" +          /* Likely future */
                "cursor: pointer !important; " +
                "border: solid 1px #bbb !important; " +
                "border-width: 1px 0 0 1px !important; " +
                "min-width: 16px !important; " +
                "min-height: 16px !important; " +
                "text-align: center !important; " +
                "text-decoration: none !important; " +
            "}" +
            "html body div#uw-fe-outer a.fe-right { " +
                "margin: 0 0 0 auto !important;" +
            "}" +
            "html body div#uw-fe-outer a.fe-se { " +
                "border-width: 0 1px 1px 0 !important; " +
            "}" +
            "html body div#uw-fe-outer a.fe-sw { " +
                "border-width: 0 0 1px 1px !important; " +
            "}" +
            "html body div#uw-fe-outer div.fe-size, " +
            "html body div#uw-fe-outer div.fe-height, " +
            "html body div#uw-fe-outer div.fe-weight { " +
                "padding-left: 5px !important; " +
            "}" +
            "html body div#uw-fe-outer input { " +
                "padding: 0 2px !important;" +
                "width: 61px !important; " +
                "border: 0 !important; " +
            "}" +
            "html body div#uw-fe-outer select { " +
                "width: 121px !important; " +
                "height: 20px !important; " +
                "border: 0 !important; " +
                "-webkit-appearance: none !important; " +
                "appearance: none !important; " +
            "}"
        );
    };

    me.setStyle = function (f) {
        me.addStyleElement("fe-css-i",
            "html body.uw-body .uw-container *, " +
            "html body.uw-body .uw-container p { " +
                "font-family: " + utils.trim(f.face.replace(/=/g, "")) + ", Comic Sans MS !important; " +
                "font-size: " + f.size + "px !important; " +
                "line-height: " + f.height + "px !important; " +
                "font-weight: " + f.weight + " !important; " +
                "color: " + f.color + " !important; " +
                "text-align: justify !important; " +
                "white-space: normal !important;" +
                "text-indent: " + f.indent + "px !important; " +
            "} " +
            "@media (max-width: 800px) {" +
                "html body .uw-container * { " +
                    "font-size: " + f.sizeS + "px !important; " +
                    "line-height: " + f.heightS + "px !important; " +
                "}" +
            "}"
        );

        me.feList.val(f.val);
        $$(".fe-size").text(f.size);
        $$(".fe-height").text(f.height);
        $$(".fe-weight").text(f.weight);
        $$(".fe-color").val(f.color);

        if (userWeb.marked) {
            utils.scrollToElement(userWeb.marked, "auto");
        }
    };

    me.rgb2hex = function (rgb) {
        rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
        function hex(x) {
            return ("0" + parseInt(x).toString(16)).slice(-2);
        }
        return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
    }

}();

/* === custom =================================================================================== */

var custom = new function () {
    var me = this;
    me.url = document.location.href;

    me.doLocalhost = function () {

        $("#TestButton").click(function () {
            var u = "http://localhost:8573/?objectId=" + utils.getDateStamp();
            // $.get(u);

            $$.ajax({
                url: u,
                dataType: 'jsonp', // Notice! JSONP <-- P (lowercase)
                success: function (json) {
                    // do stuff with json (in this case an array)
                    utils.log("Success");
                },
                error: function (data) {

                    utils.log("Result", data.status, " from ", u);
                    // for(var e in data) {
                    // utils.log("Error", e, " > ", data[e]);
                    // }

                    // utils.log("Error", "Yo");
                    // for(var i = 0; i < data.length; i++) {
                    // utils.log("Error", i, ":", data[i]);
                    // }
                }
            });
        });
        // function(data) { 
        // $$(".result")
        // .html(data);
        // alert( "Load was performed." ); 
        // });

        // me.testTidy();
        // me.wikipediaCustom();
        // me.switchWikipediaLinks();
        // me.doIplayer();
    };

    me.testTidy = function () { //add fixed element when page scrolls...
        $$(window).scroll(function () {
            utils.log("scrolling!");
            if ($$(".uw-tidy-test").length == 0) {
                utils.log("adding!");
                $$("body").append("<div class='uw-tidy-test' style='position:fixed; top:10px; left:10px; background-color:yellow;'>Fixed " + new Date() + "</div>");
            }
        });
    };

    me.switchWikipediaLinks = function () { //used on google search results...
        utils.log("switching", "checking...");

        for (let element of document.querySelectorAll('#res .r > a')) {
            utils.log("switching", "md   : ", href);
            element.removeAttribute('onmousedown');
            var el = $$(element);
            var href = el.attr("href");
            // el[0].onmousedown = function() {}; //remove google's redirect warning (they must be checking the link hasn't been hijacked)
            if (href && href.indexOf("en\.wikipedia") > -1) {
                utils.log("switching", "from : ", href);
                // el[0].onmousedown = function() {}; //remove google's redirect warning (they must be checking the link hasn't been hijacked)
                var targ = href.replace("en\.wikipedia", "en\.m\.wikipedia");
                utils.log("switching", "to   : ", targ);
                el.attr("href", targ);
            }
        }
    };

    me.doWikipedia = function () {
        utils.log("wikipedia", "changing header link to random and adding lightboxes");

        //change wikipedia header to link to a random page...
        $$("header .branding-box a").attr("href", "/wiki/Special:Random");

        //add hi-res lightbox to image clicks...
        //adapted from https://en.m.wikipedia.org/wiki/User:Rezonansowy/SimpleLightbox
        $$("a.image, image").bind("mousedown.uw-wikipedia", function (e) {
            utils.log("e.button", e.button);
            if (e.button == 2) return;
            var src = $$(this).find("img").attr("src");
            utils.log('wikipedia', 'src: ', src);

            if (src.match("/thumb/")) {
                src = src.replace("/thumb", "").replace(/\/[\-_.%\w]*$/, "");
            }

            if (src.indexOf('http') != 0) {
                src = 'https:' + src;
            }

            utils.log('wikipedia', src);
            if (me.lightbox == null) {
                $$("body").append("<div id='uw-lightbox' style='display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);text-align:center;z-index:9999'></div>");
                me.lightbox = $$("#uw-lightbox");
            }
            me.lightbox
                .html("<img src='" + src + "' style='background:#fff;box-shadow: 0 0 25px #111;max-height:100%;max-width:100%;vertical-align:middle;cursor:pointer;' />")
                .css("line-height", $$(window).height() + "px")
                .fadeIn("fast")
                .click(function () { $$(this).fadeOut("fast"); });

            return utils.cancelEvent(e);
        });

        utils.log("wikipedia", "done");
    };

    me.doIplayer = function () {
        // if ($$(".uw-ip-btns").length > 0) return; //custom runs every 6 hours

        $$(".uw-ip-btns").remove();
        $$("body").before($$("<div class='uw-ip-btns' style='background-color:black'></div>"));

        // utils.log("IP tst", tst1("yohowdo", /how/i));
        function tst1(tst, exp) {
            var res = tst.match(exp);
            if (res.length == 0) return "";
            return res[0];
        }

        if (me.url.match(/bbcone|bbctwo|bbcthree|bbcfour/gi)) {
            me.ipFlatten();
        }
        me.ipAddButtons(document.title, document.location.href);
    };

    me.ipFlatten = function () {

        var progs = $$("<div class='uw-ip-holder uw-ip-progs'></div>");
        var dupes = $$("<div class='uw-ip-holder uw-ip-dupes'></div>");

        userWeb.addStyleElement(
            "uw-ip-style",
            ".uw-ip-holder .content-item {" +
            "position: relative;" +
            "display: block;" +
            "height: auto;" +
            "max-width: 200px;" +
            "background-color: black;" +
            "border-top: solid 1px #f54997;" +
            "padding: 10px;" +
            "margin: 0 auto;" +
            "}" +
            ".uw-ip-holder .content-item * {" +
            "text-decoration: none;" +
            "}" +
            ".uw-ip-holder .uw-ip-dupes .content-item {" +
            "border-bottom: solid 15px green;" +
            "}"
        );

        $$("#main").prepend(progs);
        $$("body").append(dupes);
        var texts = [];

        $$(".content-item").each(function (x) {
            var i = $$(this.cloneNode(true));
            var t = i.find(".content-item__info__text").text();

            var toLoad = i.find(".rs-image--not-loaded");
            if (toLoad.length > 0) {
                var src = toLoad.text().match(/srcSet=\"[^ ]*/ig)[0].substr(8);
                toLoad.append($$("<img src=" + src + " style='width:200px;'>"));
            }

            if (texts.includes(t) || t.match(/EastEnders|Holby City|Top Gear|Two Pints of Lager|Summer Heights High|Private School Girl|We Can Be Heroes/gi)) {
                dupes.append(i);
                utils.log("dupe", t);
            }
            else {
                progs.append(i);
                texts.push(t);
            }
        });
    };

    me.ipAddButtons = function (title, url) {
        title = title.replace(/BBC (One|Two|Three|Four|Scotland|iPlayer|Sounds|Radio \d+) - | - Available Episodes| - Available now| - Episode guide| - BBC Sounds/gi, "");
        utils.log("IP url ============", url);
        utils.log("IP title", title);
        var media = me.ipGetMedia(url);

        var episode = me.ipGetString(url.match(/\/episode\/[\w\d]+/i), 9) ||
            me.ipGetString(url.match(/\/programmes\/[\w\d]+(?=\/*$)/i), 12) ||
            me.ipGetString(url.match(/\/play\/[\w\d]+/i), 6);

        //javascript:(function() { console.clear(); if (window.jQuery && jQuery.css) { doIt(); } else { ld("https://rawgit.com/james-zerty/user-web/master/scripts/jquery/jquery-3.3.1.min.js"); window.setTimeout(function() { doIt(); }, 1000); } function doIt() { var $$ = window.jQuery; $$(".uw-ip-btns").remove(); ld("https://localhost:44300/scripts/user-web.user.js?"+new Date().valueOf()); } function ld(u) { var s = document.createElement('script'); s.src = u; document.getElementsByTagName('head')[0].appendChild(s); } })();
        //javascript:(function() { console.clear(); if (window.jQuery && jQuery.css) { doIt(); } else { ld("https://localhost:44300/scripts/jquery/jquery-3.3.1.min.js");                        window.setTimeout(function() { doIt(); }, 1000); } function doIt() { var $$ = window.jQuery; ld("https://localhost:44300/scripts/talk-talk-router.user.js?"+                     new Date().valueOf()); } function ld(u) { var s = document.createElement('script'); s.src = u; document.getElementsByTagName('head')[0].appendChild(s); } })();

        if (episode) {
            me.ipAddButton(media + "1 " + episode + " " + title);
        }
        else {
            var series = me.ipGetString(url.match(/\/brand\/[\w\d]+/i), 7) ||
                me.ipGetString(url.match(/\/programmes\/[\w\d]+/i), 12) ||
                me.ipGetString(url.match(/\/episodes\/[\w\d]+/i), 10);
            if (series)
                me.ipAddButton(media + "0 " + series + " " + title);
        }

        if (series == null) {
            var seriesLink = $$(".primary-title");
            var seriesTitle = seriesLink.text() || title;

            if (seriesLink.length == 0) {
                seriesLink = $$("a:contains('Programme website')");
                seriesTitle = $$(".play-cta__text__title").text() || title;
            }

            if (seriesLink.length == 0) {
                seriesLink = $$(".br-masthead__title a");
                seriesTitle = seriesLink.text() || title;
            }

            if (seriesTitle == title) {
                seriesTitle = $$(".play-cta__title").text() || title;
                utils.log(10045, seriesTitle);
            }

            if (seriesLink.length > 0) {
                var seriesUrl = seriesLink.attr("href");
                series = seriesUrl.substr(seriesUrl.indexOf("/programmes/") + 12);
                if (series != episode) {
                    me.ipAddButton(media + "0 " + series + " " + seriesTitle);
                }
            }
        }
    };

    me.ipAddButton = function (txt) {
        utils.log("IP res", txt);
        var btn = $$("<button class='uw-ip-btn'>" + txt + "</button>");
        btn.css({
            color: "white",
            backgroundColor: "#F54997",
            padding: "3px 5px",
            margin: "0 5px 0 0",
            border: "3px",
            borderRadius: "2px",
            fontSize: "12px",
            fontFamily: "Arial",
            textDecoration: "none",
            cursor: "pointer",
        });

        btn[0].onclick = function () {
            utils.setClipboard(txt);
        };

        $$(".uw-ip-btns").prepend(btn);
    };

    me.ipGetString = function (arr, n) { //TODO: nicer way of splitting url strings
        // utils.log("IP array", arr);
        if (arr == null || arr[0].length < n) return "";
        return arr[0].substr(n);
    };

    me.ipGetMedia = function (url) {
        var media = "x";

        if (url.match(/\/iplayer\//i)) {
            media = "t";
        }
        else if (url.match(/\/sounds\//i)) {
            media = "r";
        }
        else {
            var playout = $$(".playout__messagetext");
            if (playout.text().includes("Listen")) { //TODO: replace indexOf + match with includes!!
                media = "r";
            }
            else if (playout.text().includes("Watch")) {
                media = "t";
            }
            else {
                var hd = $$(".br-masthead__masterbrand");
                if (hd.length > 0) {
                    media = hd.prop("href").toLowerCase().includes("radio") ? "r" : "t";
                }
            }
        }

        return media;
    };
};

/* === load ===================================================================================== */

var $$ = window.$;
try {
    var loadAfter = 100;
    var url = document.location.href;
    utils.setupLog("[user-web]");

    var settings = { localUrls: 0, uniqueUrls: 0, reloader: 0, autoRun: 0, autoShow: 0, handleErrors: 1 };
    if (url.match(/localhost.*\/(home|dev).*\.htm/i) != null) {
        settings = { localUrls: 1, uniqueUrls: 0, reloader: 2, autoRun: 1, autoShow: 0, handleErrors: 1 };
    }

    settings.localUrls = 1; // for dev machine

    utils.log("url", url.substr(0, 100));
    // utils.log("userAgent", navigator.userAgent);

    window.self.setTimeout(function () {
        if (settings.handleErrors) {
            try {
                userWeb.load();
            }
            catch (ex) {
                utils.log(ex);
            }
        }
        else {
            userWeb.load();
        }
    }, loadAfter);
}
catch (ex) {
    utils.log(ex);
}

/* === END ====================================================================================== */
