// Firebase + Railway: window.RAILWAY_API_BASE in env.js wins; meta api-base is optional override.
(function () {
    var m = document.querySelector('meta[name="api-base"]');
    var fromMeta = "";
    if (m && m.hasAttribute("content")) {
        fromMeta = String(m.getAttribute("content") || "").trim();
    }
    var fromEnv =
        typeof window.RAILWAY_API_BASE === "string"
            ? window.RAILWAY_API_BASE.trim()
            : "";

    // env.js first so your Railway URL is not overridden by an empty meta tag
    var raw = fromEnv || fromMeta;

    if (raw && !/^https?:\/\//i.test(raw)) {
        raw = "https://" + raw.replace(/^\/+/, "");
    }

    window.__API_BASE__ = raw.replace(/\/$/, "");

    var host = typeof location !== "undefined" ? location.hostname : "";
    var onFirebase =
        host.indexOf("web.app") !== -1 || host.indexOf("firebaseapp.com") !== -1;
    if (onFirebase && !window.__API_BASE__) {
        console.error(
            "[api] Set window.RAILWAY_API_BASE in public/js/env.js to https://YOUR-APP.up.railway.app then firebase deploy."
        );
    }
})();

function ensureHttpsBase(base) {
    if (!base || typeof base !== "string") {
        return "";
    }
    base = base.trim().replace(/\/$/, "");
    if (!base) {
        return "";
    }
    if (!/^https?:\/\//i.test(base)) {
        base = "https://" + base.replace(/^\/+/, "");
    }
    return base;
}

window.apiUrl = function (path) {
    var p = path.charAt(0) === "/" ? path : "/" + path;
    var base = ensureHttpsBase(window.__API_BASE__ || "");
    if (base !== window.__API_BASE__) {
        window.__API_BASE__ = base;
    }
    return base + p;
};
