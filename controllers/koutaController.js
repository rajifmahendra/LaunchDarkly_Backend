const kuotaModel = require('../models/kuota');
const db = require('../models/db');

// GET kuota
exports.getQuota = (ldClient) => {
    return async (req, res) => {
        try {
            const user = { key: "anonymous-user" };

            await ldClient.waitForInitialization();

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
            const user = { key: "anonymous-user" };

            await ldClient.waitForInitialization();
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

                res.status(201).json({ message: "Data berhasil disimpan", id: result.insertId });
            });

        } catch (err) {
            console.error("Error checking flag:", err);
            res.status(500).json({ error: "Terjadi kesalahan pada server" });
        }
    };
};
