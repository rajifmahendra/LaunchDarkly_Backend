// controllers/koutaController.js
const kuotaModel = require('../models/kuota');

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
                return res.json({ message: "Fitur kuota tidak tersedia." });
            }
        } catch (error) {
            console.error("Error checking quota flag:", error);
            res.status(500).json({ error: "Terjadi kesalahan saat mengecek kuota" });
        }
    };
};
