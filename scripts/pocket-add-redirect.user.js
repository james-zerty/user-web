// ==UserScript==
// @name        pocket-add-redirect
// @description redirect the add-to-pocket page to display the article in pocket
// @namespace   https://github.com/james-zerty/
// @author      2010+, james_zerty
// @version     6
// @noframes
// @grant       none
// @include     https://getpocket.com/edit?url=*
// @require     https://rawgit.com/james-zerty/user-web/master/scripts/utils.js
// @require     https://rawgit.com/james-zerty/user-web/master/scripts/jquery/jquery-3.3.1.min.js
// ==/UserScript==
try {
    var $ = window.$;
    setupLog("[pocket-add-redirect]");
    
    var match = $("a.removeitem").attr("href").match(/deleteid=([^&]+)/);

    if (match && match.length > 1) {
        var id = match[1];
        var url = "http://getpocket.com/a/read/" + id;
        log("changing link to", url);

        $(".item-detail a.item-link").attr("href", url);
    }
    else {
        log("id not found");
    }
}
catch (ex) {
    log("error: " + ex.message);
}