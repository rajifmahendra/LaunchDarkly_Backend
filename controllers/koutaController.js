const kuotaModel = require('../models/kuota');
const db = require('../models/db');

// GET kuota
exports.getQuota = (ldClient) => {
    return async (req, res) => {
        try {
            const userAgent = req.headers['user-agent'] || "unknown";

            // Bisa pakai lib tambahan seperti "ua-parser-js" untuk deteksi OS & browser dengan detail
            const user = {
                key: "anonymous-user", // atau IP atau ID session
                custom: {
                    userAgent: userAgent,
                    browser: userAgent.includes("Chrome") ? "Chrome"
                             : userAgent.includes("Safari") ? "Safari"
                             : "Other",
                    os: userAgent.includes("Mac") ? "Mac"
                        : userAgent.includes("Windows") ? "Windows"
                        : "Other"
                }
            };

            await ldClient.waitForInitialization();
            await ldClient.identify(user); // agar muncul di LaunchDarkly

            const isKuotaEnabled = await ldClient.variation("kuota", user, false);

            if (isKuotaEnabled) {
                const availableQuota = kuotaModel.getAvailableQuota();
                return res.json({ available: availableQuota });
            } else {
                return res.json({ message: "kuota tidak tersedia." });
            }

        } catch (error) {
            console.error("Error checking quota flag:", error);
            res.status(500).json({ error: "Terjadi kesalahan saat mengecek kuota" });
        }
    };
};


// POST kuota

exports.postQuota = (ldClient) => {
    return async (req, res) => {
        const { nama, email, no_hp, kuota } = req.body;

        if (!nama || !email || !no_hp || !kuota) {
            return res.status(400).json({ error: "Semua field wajib diisi." });
        }

        try {
            const user = {
                key: email || "anonymous-user",
                email: email
                // anonymous: true
            };

            await ldClient.waitForInitialization();

            // 🔒 Check if user is blocked based on email rules from LaunchDarkly
            const isBlocked = await ldClient.variation("be-kuota-blocked", user, false);
            if (isBlocked) {
                return res.status(403).json({ message: "Maaf, user dengan email ini tidak bisa post kuota." });
            }
            
            // Check if posting feature is enabled
            const isPostEnabled = await ldClient.variation("be-kuota-data", user, false);
            if (!isPostEnabled) {
                return res.status(403).json({ message: "Fitur post kuota sedang dimatikan." });
            }


            const query = 'INSERT INTO pembelian (nama, email, no_hp, kuota) VALUES (?, ?, ?, ?)';
            db.query(query, [nama, email, no_hp, kuota], (err, result) => {
                if (err) {
                    console.error("Gagal simpan ke DB:", err);
                    return res.status(500).json({ error: "Gagal menyimpan data ke database." });
                }

                console.log(`✅ Data saved successfully: ID=${result.insertId}, Nama=${nama}, Email=${email}`);
                res.status(201).json({ message: "Data saved successfully", id: result.insertId });
            });

        } catch (err) {
            console.error("Error checking flag:", err);
            res.status(500).json({ error: "Terjadi kesalahan pada server" });
        }
    };
};
