// Import mysql2 package
const mysql = require("mysql2");

function getConnectionOptions() {
    // Railway / many hosts provide a single URL (check several common names)
    const url =
        process.env.DATABASE_URL ||
        process.env.MYSQL_URL ||
        process.env.MYSQL_PRIVATE_URL ||
        process.env.MYSQL_PUBLIC_URL;

    if (url && (url.startsWith("mysql://") || url.startsWith("mysql2://"))) {
        return url;
    }

    const useSsl =
        process.env.MYSQL_SSL === "true" || process.env.MYSQL_SSL === "1";

    const host =
        process.env.MYSQLHOST ||
        process.env.MYSQL_HOST ||
        "127.0.0.1";

    // Use 127.0.0.1 instead of "localhost" so Node does not prefer IPv6 ::1 (fixes local/XAMPP oddities)
    const resolvedHost = host === "localhost" ? "127.0.0.1" : host;

    return {
        host: resolvedHost,
        port: Number(process.env.MYSQLPORT || process.env.MYSQL_PORT || 3306),
        user: process.env.MYSQLUSER || process.env.MYSQL_USER || "root",
        password: process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD || "admin",
        database:
            process.env.MYSQLDATABASE ||
            process.env.MYSQL_DATABASE ||
            "adricop_industries",
        ssl: useSsl ? { rejectUnauthorized: false } : false
    };
}

const opts = getConnectionOptions();
const isUrl = typeof opts === "string";

if (process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID) {
    if (isUrl) {
        console.log("[db] using DATABASE_URL / MYSQL_* URL for MySQL");
    } else {
        console.log(
            "[db] MySQL target:",
            opts.host + ":" + opts.port,
            "database:",
            opts.database
        );
    }
    if (
        !isUrl &&
        (opts.host === "127.0.0.1" || opts.host === "localhost") &&
        !process.env.MYSQLHOST &&
        !process.env.MYSQL_HOST
    ) {
        console.error(
            "[db] No MYSQLHOST / MYSQL_HOST / DATABASE_URL set. The app is trying localhost, which fails on Railway."
        );
        console.error(
            "[db] Fix: Railway → your MySQL service → copy variables, then on your web service → Variables → New variable → Reference → pick MySQL and add MYSQLHOST, MYSQLUSER, MYSQLPASSWORD, MYSQLDATABASE, MYSQLPORT (or paste MYSQL_URL / DATABASE_URL)."
        );
    }
}

const connection = mysql.createConnection(opts);

connection.connect((err) => {
    if (err) {
        console.error("Database connection failed:", err.message);
    } else {
        console.log("Connected to MySQL database");
    }
});

module.exports = connection;
