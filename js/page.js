class Page {
    constructor() {
        this._applySavedTheme();
    }

    init() {
        let mapContainer = document.getElementById("content");

        let map = new Map(page, mapContainer);

        map.initMap();
        map.setAttribution();
        map.setBounds();
        map.addCustomZoomControl();
        map.addContextMenu();

        this.map = map;

        let languageSwitcher = new LanguageSwitcher(page, map);
        languageSwitcher.addToPage();

        let themeSwitcher = new ThemeSwitcher(page);
        themeSwitcher.addToPage();

        this._setMarkerFromURL();
    }

    addAction(action){
        let actions = document.getElementById("actions");
        actions.appendChild(action);
    }

    _setMarkerFromURL() {
        let urlParams = new URLSearchParams(window.location.search);
        let coordinates = urlParams.get('c');
        
        if (coordinates) {
            let [lat, lng] = coordinates.split(',').map(parseFloat);
            
            if (lat && lng && this.map.isInMapBounds(lat, lng)) {
                let positionInUrl = { lat: lat, lng: lng };
                this.map.getSiteLinkMarker().setLatLng(positionInUrl);
                this.map.setView(positionInUrl);
            } else {
                return this.messageOutsideMontenegro(window.location.search, lat, lng);
            }
        }
    }

    isPC() {
        return window.innerWidth > 768;
    }

    isMobile() {
        return window.innerWidth <= 768;
    }


    setDarkTheme() {
        document.body.setAttribute("theme", "dark");
        this._saveTheme("dark");
    }

    setLightTheme() {
        document.body.setAttribute("theme", "light");
        this._saveTheme("light");
    }

    isLight() {
        return document.body.getAttribute("theme") === "light";
    }

    isDark() {
        return document.body.getAttribute("theme") === "dark";
    }

    saveLanguage(language) {
        localStorage.setItem('language', language);
    }

    getSavedLanguage() {
        return localStorage.getItem('language') || 'ru';
    }

    bubble(message, ms = 2000) {
        let bubble = document.createElement('div');
        bubble.className = 'notification-bubble';
        bubble.textContent = message;
        document.body.appendChild(bubble);

        setTimeout(() => {
            bubble.remove();
        }, ms);
    }

    _applySavedTheme() {
        let savedTheme = this._getSavedTheme();
        if (savedTheme === "dark") {
            this.setDarkTheme();
        }
        else if (savedTheme === "light") {
            this.setLightTheme();
        }
        else {
            throw new Error("Algorithm error");
        }
    }

    _getSavedTheme() {
        return localStorage.getItem('theme') || 'light';
    }

    _saveTheme(theme) {
        localStorage.setItem('theme', theme);
    }

    messageOutsideMontenegro(textData, lat, lng) {
        return alert(`Место за пределами Черногории?\n
            Данные: ${textData}
            Широта: ${lat}
            Долгота: ${lng}
            `);
    }
}