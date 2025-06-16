const mysql = require('mysql2');

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

db.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Gagal koneksi DB:', err.message);
    } else {
        console.log('✅ Terkoneksi ke MySQL DB');
        connection.release(); // lepas koneksi setelah uji koneksi awal
    }
});

module.exports = db;
