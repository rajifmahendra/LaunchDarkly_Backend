const kuotaModel = require('../models/kuota');
const db = require('../models/db');

const { v4: uuidv4 } = require('uuid'); // Kalau mau generate ID unik (jika tidak ada ID dari client)

exports.getQuota = (ldClient) => {
    return async (req, res) => {
        try {
            const userAgent = req.headers['user-agent'] || "unknown";

            // Tentukan browser berdasarkan user-agent
            let browserName = "Other";
            if (userAgent.includes("Chrome") && !userAgent.includes("Edg")) {
                browserName = "Chrome";
            } else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) {
                browserName = "Safari";
            } else if (userAgent.includes("Firefox")) {
                browserName = "Firefox";
            } else if (userAgent.includes("Edg")) {
                browserName = "Edge";
            } else if (userAgent.includes("Opera") || userAgent.includes("OPR")) {
                browserName = "Opera";
            }

            // Tentukan OS berdasarkan user-agent
            let operatingSystem = "Other";
            if (userAgent.includes("Mac")) {
                operatingSystem = "MacOS";
            } else if (userAgent.includes("Windows")) {
                operatingSystem = "Windows";
            } else if (userAgent.includes("Linux")) {
                operatingSystem = "Linux";
            } else if (userAgent.includes("Android")) {
                operatingSystem = "Android";
            } else if (userAgent.includes("iPhone") || userAgent.includes("iPad")) {
                operatingSystem = "iOS";
            }

            // Tentukan device type
            let deviceType = "Desktop";
            if (/mobile/i.test(userAgent)) {
                deviceType = "Mobile";
            } else if (/tablet|ipad/i.test(userAgent)) {
                deviceType = "Tablet";
            }

            // Gunakan ID unik atau IP sebagai key
            const id = req.ip || uuidv4();

            const deviceContext = {
                kind: "device",        // context kind = device
                key: id,               // unique identifier (IP atau UUID)
                device: deviceType,    // Desktop / Mobile / Tablet
                operatingSystem: operatingSystem, // OS name
                browserName: browserName          // Browser name
            };

            await ldClient.waitForInitialization();
            await ldClient.identify(deviceContext); // supaya context muncul di LaunchDarkly

            const isKuotaEnabled = await ldClient.variation("kuota", deviceContext, false);

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
