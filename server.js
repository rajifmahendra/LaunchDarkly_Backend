require('dotenv').config();
const express = require('express');
const LaunchDarkly = require('launchdarkly-node-server-sdk');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());

const ldClient = LaunchDarkly.init(process.env.LD_SDK_KEY);

app.get('/promo-banner', async (req, res) => {
    try {
        await ldClient.waitForInitialization();

        const user = { key: req.query.user || "anonymous-user" };

        // Dapatkan varian banner dari LaunchDarkly
        const bannerVersion = await ldClient.variation("promo-banner-version", user, "A");

        res.json({ bannerVersion });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Terjadi kesalahan saat mengambil feature flag" });
    }
});

app.listen(port, () => {
    console.log(`Server berjalan di http://localhost:${port}`);
});
