class Map {
    constructor(page, mapContainer) {
        this.page = page;
        this.mapContainer = mapContainer;
    }

    _getTileLayer(language) {
        let tileUrl = language === 'ru' ? 'http://192.168.2.36:8080/tile/{z}/{x}/{y}.png' : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
        return L.tileLayer(tileUrl, {
            /* Нелогичность leaflet,
            при котором без указания этого параметра тайлы 19-го зума не загружаются,
            несмотря на то, что в L.map() указано maxZoom: 19
            В документации указано, что по умолчанию значение MaxZoom 18 в L.tileLayer */
            maxZoom: 19
        });
    }

    initMap() {
        let map0 = document.createElement("div");
        map0.classList.add("map");
        this.map0 = map0;

        this.mapContainer.appendChild(map0);

        let urlParams = new URLSearchParams(window.location.search);
        let lat = urlParams.get('lat');
        let lon = urlParams.get('lon');
        let zoom = urlParams.get('zoom');

        let initialPosition = lat && lon ? { lat: parseFloat(lat), lng: parseFloat(lon) } : this.getSavedPosition();
        let initialZoom = zoom ? parseInt(zoom) : this.getSavedZoom();

        this.map = L.map(map0, {
            minZoom: 8,
            maxZoom: 19,
            attributionControl: false,
            zoomControl: false,
            contextmenu: true,
            contextmenuItems: []
        }).setView(initialPosition, initialZoom);

        if (lat && lon) {
            L.marker([parseFloat(lat), parseFloat(lon)]).addTo(this.map);
        }

        this.map.on('moveend', () => {
            let center = this.map.getCenter();
            this.savePosition(center.lat, center.lng);
        });

        let language = this.getSavedLanguage();
        this.currentLayer = this._getTileLayer(language).addTo(this.map);
    }

    getThatSiteLink() {
        return window.location.href + "?lat=" + this.map.getCenter().lat + "&lon=" + this.map.getCenter().lng + "&zoom=" + this.map.getZoom();
    }

    getOsmLink(lat, lon){
        return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=15/${lat}/${lon}`;
    }

    getYandexLink(lat, lon){
        return `https://yandex.ru/maps/?ll=${lon}%2C${lat}&mode=whatshere&whatshere%5Bpoint%5D=${lon}%2C${lat}&whatshere%5Bzoom%5D=15&z=15`;
    }

    getGoogleLink(lat, lon){
        return `https://www.google.com/maps/place/${lat},${lon}/@${lat},${lon},15z`;
    }

    addContextMenu() {
        let contextMarker = L.marker([0, 0]).addTo(this.map);

        this.map.on('contextmenu', (e) => {
            contextMarker.setLatLng(e.latlng);
            console.log(`a: ${e.latlng.lat}, ${e.latlng.lng}`);

            let latlng = e.latlng; // Сохраняем координаты в переменной

            // Нужно решить проблему того, что работают два контекстного меню независимо друг от друга
            $.contextMenu({
                selector: '.mapContainer',
                items: {
                    "copyCoords": {
                        name: "Скопировать координаты",
                        icon: "fa-regular fa-location-arrow",
                        callback: () => {
                            this.copyCoords(latlng);
                            this.page.bubble("Координаты скопированы");
                        }
                    },
                    "openIn": {
                        name: "Открыть в...",
                        icon: "fa-regular fa-arrow-up-right-from-square",
                        items: {
                            "openOSM": {
                                name: "OpenStreetMap",
                                icon: "fa-regular fa-globe",
                                callback: () => {
                                    console.log(`b: ${latlng.lat}, ${latlng.lng}`);
                                    window.open(this.getOsmLink(latlng.lat, latlng.lng));
                                }
                            },
                            "openYandex": {
                                name: "Яндекс",
                                icon: "fa-brands fa-yandex",
                                callback: () => {
                                    window.open(this.getYandexLink(latlng.lat, latlng.lng));
                                }
                            },
                            "openGoogle": {
                                name: "Google",
                                icon: "fa-brands fa-google",
                                callback: () => {
                                    window.open(this.getGoogleLink(latlng.lat, latlng.lng));
                                }
                            }
                        }
                    },
                    "shareLink": {
                        name: "Поделиться ссылкой на...",
                        icon: "fa-regular fa-share",
                        items: {
                            "thatSite": {
                                name: "Этот сайт",
                                icon: "fa-regular fa-link",
                                callback: () => {
                                    navigator.clipboard.writeText(this.getThatSiteLink());
                                    this.page.bubble("Ссылка скопирована");
                                }
                            },
                            "shareOSM": {
                                name: "OpenStreetMap",
                                icon: "fa-regular fa-globe",
                                callback: () => {
                                    navigator.clipboard.writeText(this.getOsmLink(latlng.lat, latlng.lng));
                                    this.page.bubble("Ссылка скопирована");
                                }
                            },
                            "shareYandex": {
                                name: "Яндекс",
                                icon: "fa-brands fa-yandex",
                                callback: () => {
                                    navigator.clipboard.writeText(this.getYandexLink(latlng.lat, latlng.lng));
                                    this.page.bubble("Ссылка скопирована");
                                }
                            },
                            "shareGoogle": {
                                name: "Google",
                                icon: "fa-brands fa-google",
                                callback: () => {
                                    navigator.clipboard.writeText(this.getGoogleLink(latlng.lat, latlng.lng));
                                    this.page.bubble("Ссылка скопирована");
                                }
                            }
                        }
                    }
                },
                events: {
                    hide: () => {
                        contextMarker.setLatLng([0, 0]);
                    }
                }
            });
        });
    }

    copyCoords(latlng) {
        let coords = `${latlng.lat}, ${latlng.lng}`;
        navigator.clipboard.writeText(coords);
    }

    setAttribution() {
        L.control.attribution({
            prefix: "© <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap contributors</a>"
        }).addTo(this.map);
    }

    setBounds() {
        this.bounds = L.latLngBounds([41.8, 18.4], [43.6, 20.4]);
        this.map.setMaxBounds(this.bounds);
        this.map.on('drag', () => {
            this.map.panInsideBounds(this.bounds, { animate: false });
        });
    }

    addLanguageControl() {
        let div = document.createElement('div');
        div.className = 'switcher-control';
        div.style.left = '10px';
        div.style.top = '10px';

        let select = document.createElement('select');
        select.id = 'languageSwitcher';

        let optionRu = document.createElement('option');
        optionRu.value = 'ru';
        optionRu.textContent = 'Русский';
        select.appendChild(optionRu);

        let optionLocal = document.createElement('option');
        optionLocal.value = 'local';
        optionLocal.textContent = 'Местный';
        select.appendChild(optionLocal);

        div.appendChild(select);

        // Добавляем элемент управления на карту
        this.mapContainer.appendChild(div);

        select.value = this.getSavedLanguage();

        select.addEventListener('change', (e) => {
            let language = e.target.value;
            this.map.removeLayer(this.currentLayer);
            this.currentLayer = this._getTileLayer(language);
            this.currentLayer.addTo(this.map);
            this.saveLanguage(language);
        });
    }

    addThemeControl() {
        let div = document.createElement('div');
        div.className = 'switcher-control';
        div.style.left = '10px';
        div.style.bottom = '10px';

        let select = document.createElement('select');
        select.id = 'themeSwitcher';

        let optionLight = document.createElement('option');
        optionLight.value = 'light';
        optionLight.textContent = 'Светлая';
        select.appendChild(optionLight);

        let optionDark = document.createElement('option');
        optionDark.value = 'dark';
        optionDark.textContent = 'Тёмная';
        select.appendChild(optionDark);

        div.appendChild(select);

        // Добавляем элемент управления на карту
        this.mapContainer.appendChild(div);

        select.value = this.getSavedTheme();

        select.addEventListener('change', (e) => {
            let theme = e.target.value;
            document.body.setAttribute('theme', theme);
            this.saveTheme(theme);
        });

        document.body.setAttribute('theme', this.getSavedTheme());
    }

    addCustomZoomControl() {
        let div = document.createElement('div');
        div.className = 'leaflet-control-zoom-custom';

        let zoomInButton = document.createElement('button');
        zoomInButton.id = 'zoomIn';
        zoomInButton.innerHTML = '+';
        div.appendChild(zoomInButton);

        let zoomOutButton = document.createElement('button');
        zoomOutButton.id = 'zoomOut';
        zoomOutButton.innerHTML = '-';
        div.appendChild(zoomOutButton);

        // Добавляем элемент управления на карту
        this.mapContainer.appendChild(div);

        zoomInButton.addEventListener('click', () => {
            this.map.zoomIn();
            this.updateZoomButtons();
        });

        zoomOutButton.addEventListener('click', () => {
            this.map.zoomOut();
            this.updateZoomButtons();
        });

        this.updateZoomButtons(); // состояние инициализации, может быть минимальный/максимальный зум

        this.map.on('zoomend', () => {
            let zoom = this.map.getZoom();
            this.saveZoom(zoom);

            this.updateZoomButtons();
        });
    }

    updateZoomButtons() {
        let zoomInButton = document.getElementById('zoomIn');
        let zoomOutButton = document.getElementById('zoomOut');

        if (this.map.getZoom() === this.map.getMaxZoom()) {
            zoomInButton.classList.add('disabled');
        } else {
            zoomInButton.classList.remove('disabled');
        }

        if (this.map.getZoom() === this.map.getMinZoom()) {
            zoomOutButton.classList.add('disabled');
        } else {
            zoomOutButton.classList.remove('disabled');
        }
    }

    saveZoom(zoom) {
        localStorage.setItem('mapZoom', zoom);
    }

    savePosition(centerLat, centerLon) {
        let position = {
            lat: centerLat,
            lng: centerLon
        };
        localStorage.setItem('mapPosition', JSON.stringify(position));
    }

    saveTheme(theme) {
        localStorage.setItem('mapTheme', theme);
    }

    saveLanguage(language) {
        localStorage.setItem('mapLanguage', language);
    }

    getSavedZoom() {
        return localStorage.getItem('mapZoom') || 8;
    }

    getSavedPosition() {
        let position = localStorage.getItem('mapPosition');
        return position ? JSON.parse(position) : { lat: 42.5, lng: 19.3 };
    }

    getSavedTheme() {
        return localStorage.getItem('mapTheme') || 'light';
    }

    getSavedLanguage() {
        return localStorage.getItem('mapLanguage') || 'ru';
    }
}
