(function () {
    function isAdminUser() {
        try {
            var u = JSON.parse(localStorage.getItem("ev_user") || "null");
            return u && String(u.full_name || "").trim().toLowerCase() === "admin";
        } catch (e) {
            return false;
        }
    }

    document.addEventListener("DOMContentLoaded", function () {
        var dash = document.getElementById("dashboardLink");
        if (!dash) return;
        dash.style.display = isAdminUser() ? "list-item" : "none";
    });
})();
