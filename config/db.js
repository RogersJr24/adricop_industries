// Import mysql2 package
const mysql = require("mysql2");

function isAivenHost(hostOrUrl) {
    if (!hostOrUrl) {
        return false;
    }
    const s = String(hostOrUrl);
    return s.includes("aivencloud.com") || s.includes("aivencloud.net");
}

function buildSslOptions() {
    // Optional: paste Aiven CA PEM into MYSQL_SSL_CA (full certificate text)
    if (process.env.MYSQL_SSL_CA && process.env.MYSQL_SSL_CA.trim().length > 0) {
        return {
            ca: process.env.MYSQL_SSL_CA,
            rejectUnauthorized: true
        };
    }
    // Aiven and most cloud MySQL require TLS; without a CA bundle, this is the usual approach
    return { rejectUnauthorized: false };
}

function getConnectionOptions() {
    const url =
        process.env.DATABASE_URL ||
        process.env.MYSQL_URL ||
        process.env.MYSQL_PRIVATE_URL ||
        process.env.MYSQL_PUBLIC_URL;

    const forceSsl =
        process.env.MYSQL_SSL === "true" ||
        process.env.MYSQL_SSL === "1" ||
        process.env.AIVEN_MYSQL === "1";

    if (url && (url.startsWith("mysql://") || url.startsWith("mysql2://"))) {
        const needSsl = forceSsl || isAivenHost(url);
        if (needSsl) {
            return {
                uri: url.replace(/^mysql2:\/\//, "mysql://"),
                ssl: buildSslOptions()
            };
        }
        return url.replace(/^mysql2:\/\//, "mysql://");
    }

    const host =
        process.env.MYSQLHOST ||
        process.env.MYSQL_HOST ||
        "127.0.0.1";

    const resolvedHost = host === "localhost" ? "127.0.0.1" : host;

    const needSsl =
        forceSsl || isAivenHost(resolvedHost);

    return {
        host: resolvedHost,
        port: Number(process.env.MYSQLPORT || process.env.MYSQL_PORT || 3306),
        user: process.env.MYSQLUSER || process.env.MYSQL_USER || "root",
        password: process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD || "admin",
        database:
            process.env.MYSQLDATABASE ||
            process.env.MYSQL_DATABASE ||
            "adricop_industries",
        ssl: needSsl ? buildSslOptions() : false
    };
}

const opts = getConnectionOptions();
const isUrlObject = typeof opts === "object" && opts !== null && Boolean(opts.uri);

if (process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID) {
    if (typeof opts === "string") {
        console.log("[db] using DATABASE_URL (mysql connection string)");
    } else if (isUrlObject) {
        console.log("[db] using DATABASE_URL with SSL (e.g. Aiven)");
    } else {
        console.log(
            "[db] MySQL target:",
            opts.host + ":" + opts.port,
            "database:",
            opts.database
        );
    }
    if (
        typeof opts === "object" &&
        opts.host &&
        (opts.host === "127.0.0.1" || opts.host === "localhost") &&
        !process.env.MYSQLHOST &&
        !process.env.MYSQL_HOST &&
        !process.env.DATABASE_URL &&
        !process.env.MYSQL_URL
    ) {
        console.error(
            "[db] No DATABASE_URL / MYSQL_HOST set. The app is trying localhost, which fails on Railway."
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
