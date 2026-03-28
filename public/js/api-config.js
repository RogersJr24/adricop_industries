(function () {
    var m = document.querySelector('meta[name="api-base"]');
    var raw = m && m.getAttribute("content") ? m.getAttribute("content").trim() : "";
    window.__API_BASE__ = raw.replace(/\/$/, "");
})();

window.apiUrl = function (path) {
    var p = path.charAt(0) === "/" ? path : "/" + path;
    return (window.__API_BASE__ || "") + p;
};
