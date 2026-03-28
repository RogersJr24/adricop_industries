// Import express
const express = require("express");
const cors = require("cors");

// Import database connection
const db = require("./config/db");

// Create express application
const app = express();

// Server port
const PORT = process.env.PORT || 3000;

const clientOrigins = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(",").map((s) => s.trim()).filter(Boolean)
    : null;

app.use(cors({
    origin: clientOrigins && clientOrigins.length ? clientOrigins : true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.static("public"));

// Middleware to read form data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


// ─── AUTH ────────────────────────────────────────

// Register
app.post("/register", (req, res) => {

    const { full_name, email, password } = req.body;

    const checkSql = "SELECT id FROM users WHERE email = ?";

    db.query(checkSql, [email], (err, results) => {

        if (err) {
            console.log(err);
            return res.json({ success: false, error: "Server error." });
        }

        if (results.length > 0) {
            return res.json({ success: false, error: "Email already registered." });
        }

        const sql = "INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)";

        db.query(sql, [full_name, email, password], (err, result) => {

            if (err) {
                console.log(err);
                return res.json({ success: false, error: "Registration failed." });
            }

            res.json({ success: true, user: { id: result.insertId, full_name, email } });

        });

    });

});

// Login
app.post("/login", (req, res) => {

    const { email, password } = req.body;

    const sql = "SELECT id, full_name, email FROM users WHERE email = ? AND password = ?";

    db.query(sql, [email, password], (err, results) => {

        if (err) {
            console.log(err);
            return res.json({ success: false, error: "Server error." });
        }

        if (results.length === 0) {
            return res.json({ success: false, error: "Invalid email or password." });
        }

        res.json({ success: true, user: results[0] });

    });

});


// ─── ORDERS ──────────────────────────────────────

// Get orders — admin sees all, user sees own
app.get("/api/orders", (req, res) => {

    const { user_id, full_name } = req.query;

    let sql;
    let params;

    if (full_name === "admin") {
        sql = "SELECT orders.*, users.full_name FROM orders LEFT JOIN users ON orders.user_id = users.id ORDER BY orders.id DESC";
        params = [];
    } else {
        sql = "SELECT orders.*, users.full_name FROM orders LEFT JOIN users ON orders.user_id = users.id WHERE orders.user_id = ? ORDER BY orders.id DESC";
        params = [user_id];
    }

    db.query(sql, params, (err, results) => {

        if (err) {
            console.log(err);
            return res.json([]);
        }

        res.json(results);

    });

});

// Get single order
app.get("/api/order/:id", (req, res) => {

    const sql = "SELECT * FROM orders WHERE id = ?";

    db.query(sql, [req.params.id], (err, results) => {

        if (err) {
            console.log(err);
            return res.json(null);
        }

        res.json(results[0] || null);

    });

});

// Create order
app.post("/api/orders", (req, res) => {

    const { user_id, car_model, color, battery_range, charging_type, interior, wheels, extra_features, estimated_price, notes } = req.body;

    const sql = "INSERT INTO orders (user_id, car_model, color, battery_range, charging_type, interior, wheels, extra_features, estimated_price, notes) VALUES (?,?,?,?,?,?,?,?,?,?)";

    db.query(sql, [user_id, car_model, color, battery_range, charging_type, interior, wheels, extra_features, estimated_price, notes], (err, result) => {

        if (err) {
            console.log(err);
            return res.json({ success: false });
        }

        res.json({ success: true, id: result.insertId });

    });

});

// Update order
app.post("/api/orders/update", (req, res) => {

    const { id, car_model, color, battery_range, charging_type,
            interior, wheels, extra_features, estimated_price, notes, status } = req.body;

    const sql = "UPDATE orders SET car_model=?, color=?, battery_range=?, charging_type=?, interior=?, wheels=?, extra_features=?, estimated_price=?, notes=?, status=? WHERE id=?";

    db.query(sql, [car_model, color, battery_range, charging_type, interior, wheels, extra_features, estimated_price, notes, status, id], (err) => {

        if (err) {
            console.log(err);
            return res.json({ success: false });
        }

        res.json({ success: true });

    });

});

// Delete order
app.post("/api/orders/delete", (req, res) => {

    const sql = "DELETE FROM orders WHERE id = ?";

    db.query(sql, [req.body.id], (err) => {

        if (err) {
            console.log(err);
            return res.json({ success: false });
        }

        res.json({ success: true });

    });

});


// ─── CARS ────────────────────────────────────────

// Get all cars
app.get("/cars", (req, res) => {

    const sql = "SELECT * FROM cars ORDER BY model_name";

    db.query(sql, (err, results) => {

        if (err) {
            console.log(err);
            return res.json([]);
        }

        res.json(results);

    });

});


// ─── CONTACT ─────────────────────────────────────

// Save contact form
app.post("/contact", (req, res) => {

    const name    = req.body?.name;
    const email   = req.body?.email;
    const message = req.body?.message;

    const sql = "INSERT INTO feedback (name,email,message) VALUES (?,?,?)";

    db.query(sql, [name, email, message], (err, result) => {

        if (err) {
            console.log(err);
            res.json({ success: false });
        } else {
            res.json({ success: true });
        }

    });

});

// Get all messages
app.get("/messages", (req, res) => {

    const sql = "SELECT * FROM feedback ORDER BY id DESC";

    db.query(sql, (err, results) => {

        if (err) {
            console.log(err);
            res.json([]);
        } else {
            res.json(results);
        }

    });

});


// ─── PAGES ───────────────────────────────────────

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/index.html");
});

app.get("/about", (req, res) => {
    res.sendFile(__dirname + "/public/about.html");
});

app.get("/contact", (req, res) => {
    res.sendFile(__dirname + "/public/contact.html");
});

app.get("/myorders", (req, res) => {
    res.sendFile(__dirname + "/public/orders.html");
});

app.get("/products", (req, res) => {
    res.sendFile(__dirname + "/public/products.html");
});


// ─── START SERVER ────────────────────────────────

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});