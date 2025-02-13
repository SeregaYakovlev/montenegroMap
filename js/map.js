class Map {
    constructor(page, mapContainer) {
        this.page = page;
        this.mapContainer = mapContainer;
        this.marker = L.marker([0, 0]);
    }

    _getTileLayer(language) {
        let tileUrl = language === 'ru' ? 'http://192.168.2.36:8080/tile/{z}/{x}/{y}.png' : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
        let tileLayer = L.tileLayer(tileUrl, {
            /* Нелогичность leaflet,
            при котором без указания этого параметра тайлы 19-го зума не загружаются,
            несмотря на то, что в L.map() указано maxZoom: 19
            В документации указано, что по умолчанию значение MaxZoom 18 в L.tileLayer */
            maxZoom: 19,
            lang: language
        });
        return tileLayer;
    }

    initMap() {
        let map0 = document.createElement("div");
        map0.classList.add("map");
        this.map0 = map0;

        this.mapContainer.appendChild(map0);

        let urlParams = new URLSearchParams(window.location.search);
        let lat = urlParams.get('lat');
        let lon = urlParams.get('lng');
        let zoom = urlParams.get('z');

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

        this.marker.addTo(this.map);

        if (lat && lon) {
            this.marker.setLatLng([parseFloat(lat), parseFloat(lon)]);
        }

        this.map.on('moveend', () => {
            let center = this.map.getCenter();
            this.savePosition(center.lat, center.lng);
        });

        let language = this.page.getSavedLanguage();
        this.currentLayer = this._getTileLayer(language).addTo(this.map);
    }

    /*async getThatSiteLink() {
        let longUrl = window.location.origin + "?lat=" + this.map.getCenter().lat + "&lon=" + this.map.getCenter().lng + "&zoom=" + this.map.getZoom();
        
        try {
            let shortUrl = await Utils.shortenUrl(longUrl); // Используем await для получения результата
            return shortUrl; // Возвращаем короткую ссылку
        } catch (error) {
            return longUrl; // Возвращаем длинную ссылку, если произошла ошибка
        }
    }*/

    getThatSiteLink() {
        let longUrl = window.location.origin + "?lat=" + this.map.getCenter().lat + "&lng=" + this.map.getCenter().lng + "&z=" + this.map.getZoom();
        return longUrl;
    }

    getOrganicMapsLink(lat, lon) {
        return `https://organicmaps.app/map?lat=${lat}&lon=${lon}&zoom=15`;
    }


    getOsmLink(lat, lon) {
        return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=15/${lat}/${lon}`;
    }

    getYandexLink(lat, lon) {
        return `https://yandex.ru/maps/?ll=${lon}%2C${lat}&mode=whatshere&whatshere%5Bpoint%5D=${lon}%2C${lat}&whatshere%5Bzoom%5D=15&z=15`;
    }

    getGoogleLink(lat, lon) {
        return `https://www.google.com/maps/place/${lat},${lon}/@${lat},${lon},15z`;
    }

    addContextMenu() {
        let latlng = { lat: 0, lng: 0 };

        // Создаем контекстное меню
        let menu = new ContextMenu([
            {
                label: 'Скопировать координаты',
                icon: 'bx bx-current-location',
                action: () => {
                    this.copyCoords(latlng);
                    this.page.bubble('Координаты скопированы');
                }
            },
            {
                label: 'Открыть в другой карте...',
                icon: 'bx bx-window-open',
                submenu: [
                    {
                        label: 'Google',
                        icon: "bx bxl-google",
                        action: () => {
                            window.open(this.getGoogleLink(latlng.lat, latlng.lng));
                        }
                    },
                    {
                        label: "Organic Maps",
                        icon: 'bx bx-globe',
                        action: () => {
                            window.open(this.getOrganicMapsLink(latlng.lat, latlng.lng));
                        }
                    },
                    {
                        label: 'OpenStreetMap',
                        icon: 'bx bx-globe',
                        action: () => {
                            console.log(`b: ${latlng.lat}, ${latlng.lng}`);
                            window.open(this.getOsmLink(latlng.lat, latlng.lng));
                        }
                    },
                    {
                        label: 'Яндекс',
                        icon: 'bx bxs-map-alt',
                        action: () => {
                            window.open(this.getYandexLink(latlng.lat, latlng.lng));
                        }
                    }
                ]
            },
            {
                label: 'Поделиться ссылкой на...',
                icon: 'bx bxs-share',
                submenu: [
                    {
                        label: 'Google',
                        icon: "bx bxl-google",
                        action: () => {
                            navigator.clipboard.writeText(this.getGoogleLink(latlng.lat, latlng.lng));
                            this.page.bubble('Ссылка скопирована');
                        }
                    },
                    {
                        label: "Organic Maps",
                        icon: 'bx bx-globe',
                        action: () => {
                            window.open(this.getOrganicMapsLink(latlng.lat, latlng.lng));
                        }
                    },
                    {
                        label: 'OpenStreetMap',
                        icon: 'bx bx-globe',
                        action: () => {
                            navigator.clipboard.writeText(this.getOsmLink(latlng.lat, latlng.lng));
                            this.page.bubble('Ссылка скопирована');
                        }
                    },
                    {
                        label: 'Яндекс',
                        icon: 'bx bxs-map-alt',
                        action: () => {
                            navigator.clipboard.writeText(this.getYandexLink(latlng.lat, latlng.lng));
                            this.page.bubble('Ссылка скопирована');
                        }
                    }
                ]
            }
        ], this.mapContainer);

        this.map.on('contextmenu', (e) => {
            latlng = e.latlng;
            let menuId = menu.show(e.containerPoint.x, e.containerPoint.y);
            this.marker.menuId = menuId;
            this.marker.setLatLng(latlng);
        });

        // Прослушиваем пользовательское событие contextMenuClosed
        this.mapContainer.addEventListener('contextMenuClosed', (e) => {
            if (this.marker.menuId === e.detail.menuId) {
                this.marker.setLatLng([0, 0]);
            }
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

    isRussianLang() {
        return this.currentLayer.options.lang === 'ru';
    }
    
    isLocalLang() {
        return this.currentLayer.options.lang === 'local';
    }
    
    switchToRussian() {
        let russianLayer = this._getTileLayer('ru');
        this.map.removeLayer(this.currentLayer);
        this.currentLayer = russianLayer.addTo(this.map);
    }
    
    switchToLocal() {
        let localLayer = this._getTileLayer('local');
        this.map.removeLayer(this.currentLayer);
        this.currentLayer = localLayer.addTo(this.map);
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

    getSavedZoom() {
        return localStorage.getItem('mapZoom') || 8;
    }

    getSavedPosition() {
        let position = localStorage.getItem('mapPosition');
        return position ? JSON.parse(position) : { lat: 42.5, lng: 19.3 };
    }
}
