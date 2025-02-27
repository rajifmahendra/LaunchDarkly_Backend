async function checkFeatureFlag() {
    try {
        const response = await fetch('/feature-flag?user=browser-user');
        const data = await response.json();

        if (data.showPromoBanner) {
            document.getElementById("promo-banner").style.display = "block";
        }
    } catch (error) {
        console.error("Error fetching feature flag:", error);
    }
}

checkFeatureFlag();
