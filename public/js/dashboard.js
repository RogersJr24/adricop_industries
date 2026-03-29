// ─── STATE ───────────────────────────────────────

let currentUser = JSON.parse(localStorage.getItem("ev_user")) || null;
let allOrders   = [];

function isAdminUser() {
    return (
        currentUser &&
        String(currentUser.full_name || "").trim().toLowerCase() === "admin"
    );
}

// ─── INIT ─────────────────────────────────────────

document.addEventListener("DOMContentLoaded", function () {

    // Not logged in or not admin — deny access
    if (!currentUser || !isAdminUser()) {
        document.getElementById("accessDenied").style.display    = "flex";
        document.getElementById("dashboardScreen").style.display = "none";
        return;
    }

    // Show nav info
    document.getElementById("userGreeting").style.display = "inline";
    document.getElementById("userGreeting").innerHTML     = "Hello, <strong>" + currentUser.full_name + "</strong>";
    document.getElementById("logoutBtn").style.display    = "inline-block";

    // Load data
    loadDashboard();

});


// ─── LOGOUT ──────────────────────────────────────

document.getElementById("logoutBtn").addEventListener("click", function () {
    localStorage.removeItem("ev_user");
    window.location.href = "/myorders";
});


// ─── LOAD DASHBOARD DATA ─────────────────────────

function loadDashboard() {

    fetch(apiUrl("/api/orders?user_id=" + currentUser.id + "&full_name=" + encodeURIComponent(currentUser.full_name)))
    .then(function (res) {
        if (!res.ok) {
            throw new Error("HTTP " + res.status);
        }
        return res.json();
    })
    .then(function (data) {

        allOrders = data;
        document.getElementById("dashboardScreen").style.display = "block";
        renderStats();
        renderStatusBars();
        renderModelBars();
        renderRecentOrders();

    })
    .catch(function (err) {
        console.error("[dashboard]", err);
        document.getElementById("dashboardScreen").innerHTML =
            "<p class=\"no-data\" style=\"padding:2rem;text-align:center;\">Could not load dashboard data. Check API URL in env.js and Railway CORS (CLIENT_URL).</p>";
        document.getElementById("dashboardScreen").style.display = "block";
    });

}


// ─── RENDER STAT CARDS ───────────────────────────

function renderStats() {

    const total      = allOrders.length;
    const pending    = allOrders.filter(o => o.status === "Pending").length;
    const confirmed  = allOrders.filter(o => o.status === "Confirmed").length;
    const production = allOrders.filter(o => o.status === "In Production").length;
    const delivered  = allOrders.filter(o => o.status === "Delivered").length;
    const cancelled  = allOrders.filter(o => o.status === "Cancelled").length;
    const revenue    = allOrders.reduce((s, o) => s + parseFloat(o.estimated_price || 0), 0);
    const customers  = new Set(allOrders.map(o => o.user_id)).size;

    document.getElementById("statTotal").innerText      = total;
    document.getElementById("statPending").innerText    = pending;
    document.getElementById("statConfirmed").innerText  = confirmed;
    document.getElementById("statProduction").innerText = production;
    document.getElementById("statDelivered").innerText  = delivered;
    document.getElementById("statCancelled").innerText  = cancelled;
    document.getElementById("statRevenue").innerText    = "$" + revenue.toLocaleString();
    document.getElementById("statCustomers").innerText  = customers;

}


// ─── RENDER STATUS BARS ───────────────────────────

function renderStatusBars() {

    const statuses = ["Pending", "Confirmed", "In Production", "Delivered", "Cancelled"];
    const colors   = { "Pending": "#e65100", "Confirmed": "#1565c0", "In Production": "#6a1b9a", "Delivered": "#2e7d32", "Cancelled": "#c62828" };
    const total    = allOrders.length || 1;

    let html = "";

    statuses.forEach(function (s) {

        const count   = allOrders.filter(o => o.status === s).length;
        const percent = Math.round((count / total) * 100);

        html += `
            <div class="bar-row">
                <div class="bar-label">
                    <span>${s}</span>
                    <span class="bar-count">${count}</span>
                </div>
                <div class="bar-track">
                    <div class="bar-fill" style="width:${percent}%; background:${colors[s]}"></div>
                </div>
                <span class="bar-pct">${percent}%</span>
            </div>`;

    });

    document.getElementById("statusBars").innerHTML = html;

}


// ─── RENDER MODEL BARS ────────────────────────────

function renderModelBars() {

    // Count orders per model
    const modelCount = {};

    allOrders.forEach(function (o) {
        modelCount[o.car_model] = (modelCount[o.car_model] || 0) + 1;
    });

    // Sort by count descending
    const sorted = Object.entries(modelCount).sort((a, b) => b[1] - a[1]);
    const max    = sorted[0] ? sorted[0][1] : 1;

    let html = "";

    if (sorted.length === 0) {
        html = `<p class="no-data">No orders yet.</p>`;
    }

    sorted.forEach(function ([model, count]) {

        const percent = Math.round((count / max) * 100);

        html += `
            <div class="bar-row">
                <div class="bar-label">
                    <span>${model}</span>
                    <span class="bar-count">${count}</span>
                </div>
                <div class="bar-track">
                    <div class="bar-fill" style="width:${percent}%; background:var(--red)"></div>
                </div>
                <span class="bar-pct">${count} order${count !== 1 ? "s" : ""}</span>
            </div>`;

    });

    document.getElementById("modelBars").innerHTML = html;

}


// ─── RENDER RECENT ORDERS ────────────────────────

function renderRecentOrders() {

    const wrap   = document.getElementById("recentOrdersWrap");
    const recent = allOrders.slice(0, 10);

    if (recent.length === 0) {
        wrap.innerHTML = `<p class="no-data">No orders yet.</p>`;
        return;
    }

    let rows = "";

    recent.forEach(function (o) {

        const date = new Date(o.created_at).toLocaleDateString();

        rows += `
            <tr>
                <td>#${o.id}</td>
                <td>${o.full_name}</td>
                <td>${o.car_model}</td>
                <td>$${parseFloat(o.estimated_price).toLocaleString()}</td>
                <td><span class="status-badge status-${o.status}">${o.status}</span></td>
                <td>${date}</td>
            </tr>`;

    });

    wrap.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Customer</th>
                    <th>Model</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Date</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>`;

}
