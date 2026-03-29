// ─── STATE ───────────────────────────────────────

let currentUser = JSON.parse(localStorage.getItem("ev_user")) || null;
let orders = [];
let editingId = null;
let deletingId = null;
let viewingId = null;

// ─── PRICE CONFIG ────────────────────────────────

const BASE_PRICES = {
    "VOLT Apex S": 42000, "VOLT Apex X": 58000,
    "VOLT Cruiser": 35000, "VOLT Cargo Pro": 48000,
    "VOLT Urban 2": 29000, "VOLT Titan 4x4": 65000
};
const RANGE_ADD    = { "350": 0, "500": 6000, "650": 12000, "800": 20000 };
const CHARGE_ADD   = { "Standard": 0, "Fast Charge": 2500, "Ultra Fast": 6000 };
const INTERIOR_ADD = { "Standard": 0, "Premium Leather": 4000, "Vegan Alcantara": 5500, "Executive Suite": 9500 };
const WHEEL_ADD    = { "18-inch Standard": 0, "20-inch Sport": 1500, "21-inch Performance": 2800, "22-inch Ultra": 4200 };
const EXTRA_ADD    = { "Autopilot": 5000, "Full Self-Drive": 12000, "Glass Roof": 2200, "Premium Audio": 1800, "Heated Seats": 900, "Tow Package": 2500, "Air Suspension": 3500, "Enhanced Security": 1200 };


// ─── INIT ─────────────────────────────────────────

document.addEventListener("DOMContentLoaded", function () {

    if (currentUser) {
        showOrdersScreen();
    } else {
        showLoginScreen();
    }

});


// ─── AUTH TAB SWITCH ─────────────────────────────

function switchTab(tab) {
    document.getElementById("tabLogin").classList.toggle("active", tab === "login");
    document.getElementById("tabRegister").classList.toggle("active", tab === "register");
    document.getElementById("loginForm").style.display    = tab === "login"    ? "flex" : "none";
    document.getElementById("registerForm").style.display = tab === "register" ? "flex" : "none";
    document.getElementById("loginError").innerText    = "";
    document.getElementById("registerError").innerText = "";
}


// ─── LOGIN ────────────────────────────────────────

document.getElementById("loginBtn").addEventListener("click", function () {

    const email    = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    if (!email || !password) {
        document.getElementById("loginError").innerText = "Please fill in all fields.";
        return;
    }

    fetch(apiUrl("/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    })
    .then(res => res.json())
    .then(data => {

        if (data.success) {
            currentUser = data.user;
            localStorage.setItem("ev_user", JSON.stringify(currentUser));
            showOrdersScreen();
        } else {
            document.getElementById("loginError").innerText = data.error || "Login failed.";
        }

    });

});


// ─── REGISTER ────────────────────────────────────

document.getElementById("registerBtn").addEventListener("click", function () {

    const full_name = document.getElementById("regName").value.trim();
    const email     = document.getElementById("regEmail").value.trim();
    const password  = document.getElementById("regPassword").value;

    if (!full_name || !email || !password) {
        document.getElementById("registerError").innerText = "All fields are required.";
        return;
    }

    fetch(apiUrl("/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name, email, password })
    })
    .then(res => res.json())
    .then(data => {

        if (data.success) {
            currentUser = data.user;
            localStorage.setItem("ev_user", JSON.stringify(currentUser));
            showOrdersScreen();
        } else {
            document.getElementById("registerError").innerText = data.error || "Registration failed.";
        }

    });

});


// ─── LOGOUT ──────────────────────────────────────

document.getElementById("logoutBtn").addEventListener("click", function () {
    localStorage.removeItem("ev_user");
    currentUser = null;
    orders = [];
    showLoginScreen();
});


// ─── SHOW / HIDE SCREENS ─────────────────────────

function showLoginScreen() {
    document.getElementById("loginScreen").style.display  = "flex";
    document.getElementById("ordersScreen").style.display = "none";
    document.getElementById("logoutBtn").style.display    = "none";
    document.getElementById("userGreeting").style.display = "none";
    document.getElementById("loginNavBtn").style.display  = "inline-block";  // ← add this
}

function showOrdersScreen() {
    document.getElementById("loginScreen").style.display  = "none";
    document.getElementById("ordersScreen").style.display = "block";
    document.getElementById("logoutBtn").style.display    = "inline-block";
    document.getElementById("userGreeting").style.display = "inline";
    document.getElementById("userGreeting").innerHTML     = "Hello, <strong>" + currentUser.full_name + "</strong>";
    document.getElementById("loginNavBtn").style.display  = "none";   // ← add this
    loadOrders();
}


// ─── LOAD ORDERS ─────────────────────────────────

function loadOrders() {

    // Change this:
    //fetch("/orders/" + currentUser.id)
    // To this:
    //fetch("/orders")
    fetch(apiUrl("/api/orders?user_id=" + currentUser.id + "&full_name=" + encodeURIComponent(currentUser.full_name)))

    .then(res => res.json())
    .then(data => {

        orders = data;
        renderOrders();
    });

}


// ─── RENDER ORDERS TABLE ─────────────────────────

function renderOrders() {

    const wrap = document.getElementById("ordersTableWrap");

    document.getElementById("totalOrders").innerText = orders.length;
    document.getElementById("totalValue").innerText  = "$" + orders.reduce((s, o) => s + parseFloat(o.estimated_price || 0), 0).toLocaleString();

    if (orders.length === 0) {
        wrap.innerHTML = `
            <div class="empty-state">
                <p>No orders yet. Place your first order!</p>
                <button class="btn btn-primary" onclick="openCreateModal()">+ New Order</button>
            </div>`;
        return;
    }

    let rows = "";

    orders.forEach(function (o) {

        const extras = safeJson(o.extra_features, []);
        const date   = new Date(o.created_at).toLocaleDateString();

        rows += `
            <tr>
                <td>#${o.id}</td>
                <td>${o.full_name}</td>   <!-- add this -->
                <td>${o.car_model}</td>
                <td>${o.color}</td>
                <td>${o.battery_range} km</td>
                <td>$${parseFloat(o.estimated_price).toLocaleString()}</td>
                <td><span class="status-badge status-${o.status}">${o.status}</span></td>
                <td>${date}</td>
                <td>
                    <button class="btn btn-sm" onclick="openViewModal(${o.id})">View</button>
                    <button class="btn btn-sm btn-warn" onclick="openEditModal(${o.id})">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="openDeleteModal(${o.id})">Delete</button>
                </td>
            </tr>`;

    });

    wrap.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>ID</th><th>Customer</th><th>Model</th><th>Color</th><th>Range</th>
                    <th>Price</th><th>Status</th><th>Date</th><th>Actions</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>`;

}


// ─── PRICE CALCULATOR ────────────────────────────

function calcPrice() {

    const model    = document.getElementById("f_car_model").value;
    const range    = document.getElementById("f_battery_range").value;
    const charge   = document.getElementById("f_charging_type").value;
    const interior = document.getElementById("f_interior").value;
    const wheels   = document.getElementById("f_wheels").value;
    const extras   = [...document.querySelectorAll("#f_extras input:checked")].map(c => c.value);

    const price = (BASE_PRICES[model] || 0)
        + (RANGE_ADD[range]       || 0)
        + (CHARGE_ADD[charge]     || 0)
        + (INTERIOR_ADD[interior] || 0)
        + (WHEEL_ADD[wheels]      || 0)
        + extras.reduce((s, e) => s + (EXTRA_ADD[e] || 0), 0);

    document.getElementById("pricePreview").innerText = price ? "$" + price.toLocaleString() : "$0";

    return price;

}


// ─── OPEN CREATE MODAL ───────────────────────────

function openCreateModal() {
    editingId = null;
    resetOrderForm();
    document.getElementById("orderFormTitle").innerText = "New Order";
    document.getElementById("saveOrderBtn").innerText   = "Place Order";
    document.getElementById("orderFormOverlay").style.display = "flex";

    // Show status field only for admin
    document.getElementById("statusField").style.display = currentUser.full_name === "admin" ? "block" : "none";
    document.getElementById("f_status").value = o.status;
}


// ─── OPEN EDIT MODAL ─────────────────────────────

function openEditModal(id) {

    const o = orders.find(x => x.id == id);
    if (!o) return;

    editingId = id;
    resetOrderForm();

    document.getElementById("f_car_model").value     = o.car_model;
    document.getElementById("f_color").value         = o.color;
    document.getElementById("f_battery_range").value = String(o.battery_range);
    document.getElementById("f_charging_type").value = o.charging_type;
    document.getElementById("f_interior").value      = o.interior;
    document.getElementById("f_wheels").value        = o.wheels;
    document.getElementById("f_notes").value         = o.notes || "";
    document.getElementById("f_status").value        = o.status;

    // Explicitly show OR hide — never leave it to chance
    if (currentUser.full_name === "admin") {
        document.getElementById("statusField").style.display = "block";
    } else {
        document.getElementById("statusField").style.display = "none";
    }

    const extras = safeJson(o.extra_features, []);
    document.querySelectorAll("#f_extras input").forEach(function (cb) {
        cb.checked = extras.includes(cb.value);
    });

    calcPrice();
    updateCarImage();

    document.getElementById("orderFormTitle").innerText = "Edit Order";
    document.getElementById("saveOrderBtn").innerText   = "Save Changes";
    document.getElementById("viewOrderOverlay").style.display  = "none";
    document.getElementById("orderFormOverlay").style.display  = "flex";

}


// ─── SAVE ORDER ──────────────────────────────────

document.getElementById("saveOrderBtn").addEventListener("click", function () {

    // Add this with the other field values
    const status = currentUser.full_name === "admin"
        ? document.getElementById("f_status").value
        : orders.find(o => o.id == editingId)?.status || "Pending";

    const car_model     = document.getElementById("f_car_model").value;
    const color         = document.getElementById("f_color").value;
    const battery_range = document.getElementById("f_battery_range").value;

    if (!car_model || !color || !battery_range) {
        alert("Please fill in all required fields.");
        return;
    }

    const charging_type   = document.getElementById("f_charging_type").value;
    const interior        = document.getElementById("f_interior").value;
    const wheels          = document.getElementById("f_wheels").value;
    const notes           = document.getElementById("f_notes").value;
    const extra_features  = JSON.stringify([...document.querySelectorAll("#f_extras input:checked")].map(c => c.value));
    const estimated_price = calcPrice();

    if (editingId) {

        fetch(apiUrl("/api/orders/update"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: editingId, car_model, color, battery_range, charging_type, interior, wheels, extra_features, estimated_price, notes, status})
        })
        .then(res => res.json())
        .then(data => {

            if (data.success) {
                closeModal("orderFormOverlay");
                loadOrders();
            } else {
                alert("Failed to update order.");
            }

        });

    } else {

        fetch(apiUrl("/api/orders"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: currentUser.id, car_model, color, battery_range, charging_type, interior, wheels, extra_features, estimated_price, notes })
        })
        .then(res => res.json())
        .then(data => {

            if (data.success) {
                closeModal("orderFormOverlay");
                loadOrders();
            } else {
                alert("Failed to place order.");
            }

        });

    }

});


// ─── VIEW MODAL ──────────────────────────────────

function openViewModal(id) {

    const o = orders.find(x => x.id == id);
    if (!o) return;

    viewingId = id;

    const extras = safeJson(o.extra_features, []);
    const date   = new Date(o.created_at).toLocaleString();

    // Find car image from cars array
    const car      = cars.find(c => c.model_name === o.car_model);
    const carImage = car
        ? `<img src="${car.image_path}" alt="${o.car_model}" style="width:100%; max-height:200px; object-fit:contain; border-radius:6px; border:1px solid #ddd; padding:0.5rem; background:#f9f9f9; margin-bottom:1rem;" />`
        : "";

    document.getElementById("viewOrderBody").innerHTML = `
        ${carImage}

        <p><strong>Order ID:</strong> #${o.id}</p>
        <p><strong>Model:</strong> ${o.car_model}</p>
        <p><strong>Color:</strong> ${o.color}</p>
        <p><strong>Battery Range:</strong> ${o.battery_range} km</p>
        <p><strong>Charging Type:</strong> ${o.charging_type}</p>
        <p><strong>Interior:</strong> ${o.interior}</p>
        <p><strong>Wheels:</strong> ${o.wheels}</p>
        <p><strong>Extras:</strong> ${extras.length ? extras.join(", ") : "None"}</p>
        <p><strong>Estimated Price:</strong> $${parseFloat(o.estimated_price).toLocaleString()}</p>
        <p><strong>Status:</strong> ${o.status}</p>
        <p><strong>Notes:</strong> ${o.notes || "—"}</p>
        <p><strong>Placed On:</strong> ${date}</p>
    `;

    document.getElementById("viewOrderOverlay").style.display = "flex";

}

document.getElementById("viewEditBtn").addEventListener("click", function () {
    if (viewingId) openEditModal(viewingId);
});


// ─── DELETE MODAL ────────────────────────────────

function openDeleteModal(id) {
    deletingId = id;
    const o = orders.find(x => x.id == id);
    document.getElementById("deleteOrderName").innerText = o ? o.car_model + " — " + o.color : "this order";
    document.getElementById("deleteOrderOverlay").style.display = "flex";
}

document.getElementById("confirmDeleteBtn").addEventListener("click", function () {

    fetch(apiUrl("/api/orders/delete"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deletingId })
    })
    .then(res => res.json())
    .then(data => {

        if (data.success) {
            closeModal("deleteOrderOverlay");
            loadOrders();
        } else {
            alert("Failed to delete order.");
        }

    });

});


// ─── CLOSE MODALS ────────────────────────────────

function closeModal(id) {
    document.getElementById(id).style.display = "none";
}

document.getElementById("closeFomBtn").addEventListener("click",    function () { closeModal("orderFormOverlay"); });
document.getElementById("closeViewBtn").addEventListener("click",   function () { closeModal("viewOrderOverlay"); });
document.getElementById("closeDeleteBtn").addEventListener("click", function () { closeModal("deleteOrderOverlay"); });


// ─── RESET FORM ──────────────────────────────────

function resetOrderForm() {
    document.getElementById("f_car_model").value     = "";
    document.getElementById("f_color").value         = "";
    document.getElementById("f_battery_range").value = "";
    document.getElementById("f_charging_type").value = "Standard";
    document.getElementById("f_interior").value      = "Standard";
    document.getElementById("f_wheels").value        = "18-inch Standard";
    document.getElementById("f_notes").value         = "";
    document.getElementById("statusField").style.display = "none"; // ← always hide on reset
    document.querySelectorAll("#f_extras input").forEach(cb => cb.checked = false);
    document.getElementById("pricePreview").innerText = "$0";
    updateCarImage();
}


// ─── HELPERS ─────────────────────────────────────

function safeJson(val, fallback) {
    try { return JSON.parse(val) || fallback; }
    catch (e) { return fallback; }
}


// ─── CAR IMAGE ───────────────────────────────────

const CAR_IMAGES = {
    "VOLT Apex S"    : "/images/cars/apex-s.jpg",
    "VOLT Apex X"    : "/images/cars/apex-x.jpg",
    "VOLT Cruiser"   : "/images/cars/cruiser.jpg",
    "VOLT Cargo Pro" : "/images/cars/cargo-pro.jpg",
    "VOLT Urban 2"   : "/images/cars/urban-2.jpg",
    "VOLT Titan 4x4" : "/images/cars/titan-4x4.jpg",
};

function updateCarImage() {

    const model = document.getElementById("f_car_model").value;
    const wrap  = document.getElementById("carImageWrap");
    const img   = document.getElementById("carImage");

    // Find car from database results
    const car = cars.find(c => c.model_name === model);

    if (!car) {
        wrap.style.display = "none";
        return;
    }

    img.style.opacity = "0";
    img.src = car.image_path;

    img.onload = function () {
        wrap.style.display = "block";
        img.style.opacity  = "1";
    };

    img.onerror = function () {
        wrap.style.display = "none";
    };

}

let cars = [];

document.addEventListener("DOMContentLoaded", function () {

    loadCars(); // ← add this

    if (currentUser) {
        showOrdersScreen();
    } else {
        showLoginScreen();
    }

});

// ─── LOAD CARS FROM DATABASE ─────────────────────

function loadCars() {

    fetch(apiUrl("/cars"))
    .then(res => res.json())
    .then(data => {

        cars = data;

        const select = document.getElementById("f_car_model");

        // Clear existing options except the first
        select.innerHTML = '<option value="">— Select Model —</option>';

        cars.forEach(function (car) {
            const option = document.createElement("option");
            option.value = car.model_name;
            option.textContent = car.model_name;
            select.appendChild(option);
        });

    });

}

// Show dashboard link only for admin
const dashLink = document.getElementById("dashboardLink");
if (dashLink) {
    dashLink.style.display =
        currentUser && currentUser.full_name === "admin" ? "list-item" : "none";
}