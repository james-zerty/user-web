// ==UserScript==
// @name        user-web-inject
// @description insert user styles
// @namespace   https://github.com/james-zerty/
// @version     15
// @author      2010+, james_zerty
// @grant       GM.setClipboard
// @noframes
// @include     http*://*/*
// @exclude     https://localhost:44300/dev*
// @require     https://rawgit.com/james-zerty/user-web/master/scripts/jquery/jquery-2.1.0.js
// ==/UserScript==
"use strict";
try {
    var logPrefix = "[user-web-inject] ";
    $(document.body).append($('<script type="text/javascript" src="https://localhost:44300/scripts/jquery/jquery-2.1.0.min.js"></script>'));
    $(document.body).append($('<script type="text/javascript" src="https://localhost:44300/scripts/user-web.user.js"></script>'));
}
catch (ex) {
    console.log("========================================================================================================================");
    console.log(logPrefix + ": error inserting user-web:")
    console.log(ex.message);
    console.log("========================================================================================================================");
}
