// Import mysql2 package
const mysql = require("mysql2");

function getConnectionOptions() {
    const url = process.env.DATABASE_URL || process.env.MYSQL_URL;
    if (url && (url.startsWith("mysql://") || url.startsWith("mysql2://"))) {
        return url;
    }

    const useSsl = process.env.MYSQL_SSL === "true" || process.env.MYSQL_SSL === "1";

    return {
        host: process.env.MYSQLHOST || process.env.MYSQL_HOST || "localhost",
        port: Number(process.env.MYSQLPORT || process.env.MYSQL_PORT || 3306),
        user: process.env.MYSQLUSER || process.env.MYSQL_USER || "root",
        password: process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD || "admin",
        database: process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || "adricop_industries",
        ssl: useSsl ? { rejectUnauthorized: false } : false
    };
}

const connection = mysql.createConnection(getConnectionOptions());

// Connect to database
connection.connect((err) => {
    if (err) {
        console.log("Database connection failed:", err);
    } else {
        console.log("Connected to MySQL database");
    }
});

// Export connection so other files can use it
module.exports = connection;
