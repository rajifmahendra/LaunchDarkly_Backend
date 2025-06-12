// models/kuota.js
module.exports = {
    getAvailableQuota: () => {
        return [
            { data: "2GB" },
            { data: "5GB" },
            { data: "10GB" },
            { data: "30GB" },
            { data: "50GB" },
            { data: "100GB" }
        ];
    }
};
