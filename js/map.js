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

    getThatSiteLink(lat, lon) {
        let url = window.location.origin + "?lat=" + lat + "&lng=" + lon + "&z=13";
        return url;
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

    async readBuffer() {
        try {
            // Читаем буфер обмена
            const text = await navigator.clipboard.readText();
            return text;
        } catch (e) {
            alert("Ошибка доступа к буферу обмена");
            throw e;
        }
    }

    extractCoordinates(text) {
        try {

            let match;

            // Проверка на наличие координат через запятую
            match = text.match(/(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
            if (match) {
                const lat = parseFloat(match[1]);
                const lng = parseFloat(match[2]);
                // Проверяем, что координаты - это числа
                if (!isNaN(lat) && !isNaN(lng)) {
                    return { lat, lng };
                }
            }

            // Проверка на Google Maps
            if (text.includes("google")) {
                match = text.match(/(?:.*@)?(-?\d+\.\d+),(-?\d+\.\d+)/);
                if (match) {
                    const lat = parseFloat(match[1]);
                    const lng = parseFloat(match[2]);
                    if (!isNaN(lat) && !isNaN(lng)) {
                        return { lat, lng };
                    }
                }
            }

            // Проверка на Яндекс.Карты
            if (text.includes("yandex")) {
                match = text.match(/.*[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/);
                if (match) {
                    const lat = parseFloat(match[2]);
                    const lng = parseFloat(match[1]);
                    if (!isNaN(lat) && !isNaN(lng)) {
                        return { lat, lng };
                    }
                }
            }

            // Проверка на OpenStreetMap
            if (text.includes("openstreetmap")) {
                match = text.match(/.*[?&]mlat=(-?\d+\.\d+).*mlon=(-?\d+\.\d+)/);
                if (match) {
                    const lat = parseFloat(match[1]);
                    const lng = parseFloat(match[2]);
                    if (!isNaN(lat) && !isNaN(lng)) {
                        return { lat, lng };
                    }
                }
            }
        } catch (e) {
            alert(`Не удалось определить координаты из буфера: ${text}`);
            throw e;
        }
    }



    addContextMenu() {
        let latlng = { lat: 0, lng: 0 };

        let rootMenu = new Menu(this.page, this.mapContainer);
        let anotherMapsMenu = new Menu(this.page, this.mapContainer);
        let linkSharingMenu = new Menu(this.page, this.mapContainer);


        let parseCoords = rootMenu.getNewItem();
        parseCoords.setIcon("bx bx-current-location");
        parseCoords.setLabel("Добавить метку из буфера");
        parseCoords.setAction(async () => {
            // Читаем буфер обмена
            const text = await this.readBuffer();

            // Парсим координаты
            const coords = this.extractCoordinates(text);

            // Добавляем метку на карту
            L.marker([coords.lat, coords.lng]).addTo(this.map);

            // Центрируем карту на метке
            this.map.setView([coords.lat, coords.lng], 13);
        })

        let coordsCopy = rootMenu.getNewItem();
        coordsCopy.setIcon('bx bx-current-location');
        coordsCopy.setLabel('Скопировать координаты');
        coordsCopy.setAction(() => {
            // Здесь ты можешь вызвать функцию копирования
            let coords = `${latlng.lat}, ${latlng.lng}`;
            this.copyToBufferAndMessage(coords);
        });


        let openInAnotherMap = rootMenu.getNewItem();
        openInAnotherMap.setIcon('bx bx-window-open');
        openInAnotherMap.setLabel('Открыть в другом месте...');
        openInAnotherMap.setSubmenu(anotherMapsMenu);

        let shareLink = rootMenu.getNewItem();
        shareLink.setIcon("bx bxl-google");
        shareLink.setLabel("Поделиться ссылкой...");
        shareLink.setSubmenu(linkSharingMenu);

        {
            let googleItem = anotherMapsMenu.getNewItem();
            googleItem.setIcon("bx bxl-google");
            googleItem.setLabel("Google");
            googleItem.setAction(() => {
                window.open(this.getGoogleLink(latlng.lat, latlng.lng));
            });

            let osmItem = anotherMapsMenu.getNewItem();
            osmItem.setIcon('bx bx-globe');
            osmItem.setLabel("OpenStreetMap");
            osmItem.setAction(() => {
                window.open(this.getOsmLink(latlng.lat, latlng.lng));
            });

            let yandexItem = anotherMapsMenu.getNewItem();
            yandexItem.setIcon('bx bxs-map-alt');
            yandexItem.setLabel("Yandex");
            yandexItem.setAction(() => {
                window.open(this.getYandexLink(latlng.lat, latlng.lng));
            });
        }

        {

            let thatSiteItem = linkSharingMenu.getNewItem();
            thatSiteItem.setIcon("bx bxl-google");
            thatSiteItem.setLabel("Этот сайт");
            thatSiteItem.setAction(() => {
                this.copyToBufferAndMessage(this.getThatSiteLink(latlng.lat, latlng.lng));
            });

            let googleItem = linkSharingMenu.getNewItem();
            googleItem.setIcon("bx bxl-google");
            googleItem.setLabel("Google");
            googleItem.setAction(() => {
                this.copyToBufferAndMessage(this.getGoogleLink(latlng.lat, latlng.lng));
            });

            let osmItem = linkSharingMenu.getNewItem();
            osmItem.setIcon('bx bx-globe');
            osmItem.setLabel("OpenStreetMap");
            osmItem.setAction(() => {
                this.copyToBufferAndMessage(this.getOsmLink(latlng.lat, latlng.lng));
            });

            let yandexItem = linkSharingMenu.getNewItem();
            yandexItem.setIcon('bx bxs-map-alt');
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
