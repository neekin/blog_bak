var _hmt = _hmt || [];
(function () {
    var links = document.getElementsByTagName('link');
    for (i = 0; i < links.length; i++) {
        if (links[i].rel = 'load') {
            links[i].rel = "stylesheet"
        }
    }
    var hm = document.createElement("script");
    hm.src = "//hm.baidu.com/hm.js?6e13ebe6d1ee1f9b031cd4bb53bb09ad";
    var s = document.getElementsByTagName("script")[0];
    s.parentNode.insertBefore(hm, s);
})();