class Map {
    constructor(page, mapContainer) {
        this.page = page;
        this.mapContainer = mapContainer;
        this.marker = L.marker([0, 0]);
    }

    _getTileLayer(language) {
        let tileUrl = language === 'ru' ? 'https://tiles.montemap.ru/tile/{z}/{x}/{y}.png' : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
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

    hasCoordinatesInURL() {
        return /^#-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(window.location.hash);
    }

    initMap() {
        let map0 = document.createElement("div");
        map0.classList.add("map");
        this.map0 = map0;
        this.mapContainer.appendChild(map0);

        let initialPosition;
        if (this.hasCoordinatesInURL()) {
            let [lat, lon] = window.location.hash.slice(1).split(',').map(parseFloat);
            initialPosition = { lat, lng: lon };
        } else {
            initialPosition = this.getSavedPosition();
        }

        let initialZoom = this.hasCoordinatesInURL() ? 13 : this.getSavedZoom();

        this.map = L.map(map0, {
            minZoom: 8,
            maxZoom: 19,
            attributionControl: false,
            zoomControl: false,
            contextmenu: true,
            contextmenuItems: []
        }).setView(initialPosition, initialZoom);

        this.marker.addTo(this.map);

        if (this.hasCoordinatesInURL()) {
            this.marker.setLatLng(initialPosition);
        }

        this.map.on('moveend', () => {
            let center = this.map.getCenter();
            this.savePosition(center.lat, center.lng);
        });

        let language = this.page.getSavedLanguage();
        this.currentLayer = this._getTileLayer(language).addTo(this.map);
    }

    getThatSiteLink(lat, lon) {
        return `${window.location.origin}/#${lat.toFixed(6)},${lon.toFixed(6)}`;
    }

    getOsmLink(lat, lon) {
        return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=13/${lat}/${lon}`;
    }

    getYandexLink(lat, lon) {
        return `https://yandex.ru/maps/?ll=${lon}%2C${lat}&mode=whatshere&whatshere%5Bpoint%5D=${lon}%2C${lat}&whatshere%5Bzoom%5D=15&z=13`;
    }

    getGoogleLink(lat, lon) {
        return `https://www.google.com/maps/place/${lat},${lon}/@${lat},${lon},13z`;
    }

    async copyToBufferAndMessage(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.page.bubble("Скопировано!");
        } catch (error) {
            alert("Не удалось скопировать в буфер обмена: " + error.message);
        }
    }

    addContextMenu() {
        let latlng = { lat: 0, lng: 0 };

        let rootMenu = new Menu(this.page, this.mapContainer);
        let anotherMapsMenu = new Menu(this.page, this.mapContainer);
        let linkSharingMenu = new Menu(this.page, this.mapContainer);

        let coordsCopy = rootMenu.getNewItem();
        coordsCopy.setIcon('bx bx-copy');  // Иконка копирования
        coordsCopy.setLabel('Скопировать координаты');
        coordsCopy.setAction(() => {
            let coords = `${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`;
            this.copyToBufferAndMessage(coords);
        });

        let openInAnotherMap = rootMenu.getNewItem();
        openInAnotherMap.setIcon('bx bx-map-alt');  // Иконка карты
        openInAnotherMap.setLabel('Открыть в другом месте...');
        openInAnotherMap.setSubmenu(anotherMapsMenu);

        let shareLink = rootMenu.getNewItem();
        shareLink.setIcon("bx bx-share-alt");  // Иконка общего доступа
        shareLink.setLabel("Поделиться ссылкой...");
        shareLink.setSubmenu(linkSharingMenu);

        {
            let googleItem = anotherMapsMenu.getNewItem();
            googleItem.setIcon("google-icon");
            googleItem.setLabel("Google");
            googleItem.setAction(() => {
                window.open(this.getGoogleLink(latlng.lat, latlng.lng));
            });

            let osmItem = anotherMapsMenu.getNewItem();
            osmItem.setIcon('osm-icon');
            osmItem.setLabel("OpenStreetMap");
            osmItem.setAction(() => {
                window.open(this.getOsmLink(latlng.lat, latlng.lng));
            });

            let yandexItem = anotherMapsMenu.getNewItem();
            yandexItem.setIcon('yandex-icon');
            yandexItem.setLabel("Yandex");
            yandexItem.setAction(() => {
                window.open(this.getYandexLink(latlng.lat, latlng.lng));
            });
        }

        {
            let thatSiteItem = linkSharingMenu.getNewItem();
            thatSiteItem.setIcon("bx bx-link-alt");  // Иконка ссылки
            thatSiteItem.setLabel("Этот сайт");
            thatSiteItem.setAction(() => {
                this.copyToBufferAndMessage(this.getThatSiteLink(latlng.lat, latlng.lng));
            });

            let googleItem = linkSharingMenu.getNewItem();
            googleItem.setIcon("google-icon");
            googleItem.setLabel("Google");
            googleItem.setAction(() => {
                this.copyToBufferAndMessage(this.getGoogleLink(latlng.lat, latlng.lng));
            });

            let osmItem = linkSharingMenu.getNewItem();
            osmItem.setIcon('osm-icon');
            osmItem.setLabel("OpenStreetMap");
            osmItem.setAction(() => {
                this.copyToBufferAndMessage(this.getOsmLink(latlng.lat, latlng.lng));
            });

            let yandexItem = linkSharingMenu.getNewItem();
            yandexItem.setIcon('yandex-icon');
            yandexItem.setLabel("Yandex");
            yandexItem.setAction(() => {
                this.copyToBufferAndMessage(this.getYandexLink(latlng.lat, latlng.lng));
            });
        }


        this.map.on('contextmenu', (e) => {
            latlng = e.latlng;
            let menuId = rootMenu.show();
            this.marker.menuId = menuId;
            this.marker.setLatLng(latlng);

        });

        // Прослушиваем пользовательское событие allMenusClosed
        this.mapContainer.addEventListener('allMenusClosed', (e) => {
            this.marker.setLatLng([0, 0]);
        });
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
