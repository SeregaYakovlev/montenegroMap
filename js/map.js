class Map {
    constructor(page, mapContainer) {
        this.page = page;
        this.mapContainer = mapContainer;

        let redIcon = new L.Icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });

        let greenIcon = new L.Icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });

        let violetIcon = new L.Icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });

        // Создание маркеров с этими иконками
        this.contextMenuMarker = L.marker([0, 0], { icon: violetIcon });
        this.siteLinkMarker = L.marker([0, 0], { icon: redIcon });
        this.bufferMarker = L.marker([0, 0], { icon: greenIcon });
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

        let initialPosition = this.getSavedPosition();

        let initialZoom = this.getSavedZoom();

        this.map = L.map(map0, {
            minZoom: 8,
            maxZoom: 19,
            attributionControl: false,
            zoomControl: false,
            contextmenu: true,
            contextmenuItems: []
        }).setView(initialPosition, initialZoom);

        this.contextMenuMarker.addTo(this.map);
        this.siteLinkMarker.addTo(this.map);
        this.bufferMarker.addTo(this.map);

        this.map.on('moveend', () => {
            let center = this.map.getCenter();
            this.savePosition(center.lat, center.lng);
        });

        let language = this.page.getSavedLanguage();
        this.currentLayer = this._getTileLayer(language).addTo(this.map);
    }

    messageOutsideMontenegro(textData, lat, lng) {
        return alert(`Ссылка за пределами Черногории?\n
            Данные: ${textData}
            Широта: ${lat}
            Долгота: ${lng}
            `);
    }

    showMarkerFromURL() {
        if (this.hasCoordinatesInURL()) {
            let [lat, lng] = window.location.hash.slice(1).split(',').map(parseFloat);

            if (this.isInMapBounds(lat, lng)) {
                let positionInUrl = { lat: lat, lng: lng };
                this.siteLinkMarker.setLatLng(positionInUrl);
                this.map.setView(positionInUrl, 13);
            }
            else {
                return this.messageOutsideMontenegro(window.location.hash, lat, lng);
            }

        }
    }

    getThatSiteLink(lat, lon) {
        return `${window.location.origin}/#${lat.toFixed(6)},${lon.toFixed(6)}`;
    }

    getOsmLink(lat, lon, zoom = 13) {
        // допустимые значения zoom для сервиса OpenStreetMap
        zoom = Math.max(0, Math.min(zoom, 19));
        return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=${zoom}/${lat}/${lon}`;
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
            this.page.bubble("Скопировано!", 2000);
        } catch (error) {
            alert("Не удалось скопировать в буфер обмена: " + error.message);
            throw error;
        }
    }

    async readFromBufferOrMessage() {
        try {
            let text = await navigator.clipboard.readText();
            return text;
        } catch (error) {
            alert("Не удалось прочитать буфер обмена: " + error.message);
            throw error;
        }
    }

    isInMapBounds(lat, lng) {
        if (!this.bounds) return true; // Если границы не заданы, считаем, что всё подходит
        return this.bounds.contains([lat, lng]);
    }

    parseCoordsFromString(string) {
        // Декодируем URL (заменяет %2C на , и другие закодированные символы)
        let decodedString = decodeURIComponent(string);

        // Ищем пары чисел, разделённые `,` или пробелами
        let regex = /(-?\d+\.\d+)[^\d-]+(-?\d+\.\d+)/g;
        let matches;
        let initialCoords = [];

        while ((matches = regex.exec(decodedString)) !== null) {
            let num1 = parseFloat(matches[1]);
            let num2 = parseFloat(matches[2]);

            // Определяем, какая координата широта (lat должна быть в пределах -90...90)
            let coords;
            if (Math.abs(num1) > 90 && Math.abs(num2) <= 90) {
                coords = { lat: num2, lng: num1 };
            } else {
                coords = { lat: num1, lng: num2 };
            }

            initialCoords.push(coords);
        }

        // Копируем массив перед изменениями
        let correctedCoords = [];

        for (let coords of initialCoords) {
            if (!this.isInMapBounds(coords)) {
                // Перепутаны широта и долгота? Меняем их местами
                let swappedCoords = { lat: coords.lng, lng: coords.lat };

                // всё ок? Добавляем. Опять не подходит? Значит и не координаты.
                if (this.isInMapBounds(swappedCoords)) {
                    correctedCoords.push(swappedCoords);
                }
            } else {
                correctedCoords.push(coords);
            }
        }

        return { initialCoords: initialCoords, correctedCoords: correctedCoords };
    }

    getContextMarkerLatLng(){
        // Возвращаем координаты маркера
        return this.contextMenuMarker.getLatLng();
    }

    addContextMenu() {
        let rootMenu = new Menu(this.page, this.mapContainer);
        let anotherMapsMenu = new Menu(this.page, this.mapContainer);
        let linkSharingMenu = new Menu(this.page, this.mapContainer);

        let openInAnotherMap = rootMenu.getNewItem();
        openInAnotherMap.setIcon('bx bx-map-alt');  // Иконка карты
        openInAnotherMap.setLabel('Открыть другую карту...');
        openInAnotherMap.setSubmenu(anotherMapsMenu);

        let shareLink = rootMenu.getNewItem();
        shareLink.setIcon("bx bx-share-alt");  // Иконка общего доступа
        shareLink.setLabel("Поделиться ссылкой...");
        shareLink.setSubmenu(linkSharingMenu);

        let coordsCopy = rootMenu.getNewItem();
        coordsCopy.setIcon('bx bx-copy');  // Иконка копирования
        coordsCopy.setLabel('Копировать координаты метки');
        coordsCopy.setAction(() => {
            let latlng = this.getContextMarkerLatLng();
            let coords = `${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`;
            this.copyToBufferAndMessage(coords);
        });

        let coordsPaste = rootMenu.getNewItem();
        coordsPaste.setIcon("bx bx-paste");
        coordsPaste.setLabel("Вставить метку из буфера");
        coordsPaste.setAction(async () => {
            let text = await this.readFromBufferOrMessage();
            let coords = this.parseCoordsFromString(text);
            console.log(text);
            console.log(coords);

            if (coords.initialCoords.length === 0) {
                return alert(`Не удалось извлечь допустимые координаты из текста:
                    ${text}
                    `);
            };

            if (coords.correctedCoords.length === 0) {
                return this.messageOutsideMontenegro(text, coords.initialCoords[0].lat, coords.initialCoords[0].lng);
            }

            if (coords.correctedCoords.length > 0) {
                this.bufferMarker.setLatLng(coords.correctedCoords[0]);
                this.page.bubble("Метка из буфера успешно добавлена!", 3000);

                // Центрируем карту на новых координатах с зумом 13
                this.map.setView(coords.correctedCoords[0], 13);
            }
        });

        {
            let googleItem = anotherMapsMenu.getNewItem();
            googleItem.setIcon("google-icon");
            googleItem.setLabel("Метка на Google Картах");
            googleItem.setAction(() => {
                let latlng = this.getContextMarkerLatLng();
                window.open(this.getGoogleLink(latlng.lat, latlng.lng));
            });

            let osmItem = anotherMapsMenu.getNewItem();
            osmItem.setIcon('osm-icon');
            osmItem.setLabel("Метка в OpenStreetMap");
            osmItem.setAction(() => {
                let latlng = this.getContextMarkerLatLng();
                window.open(this.getOsmLink(latlng.lat, latlng.lng, this.map.getZoom()));
            });

            let yandexItem = anotherMapsMenu.getNewItem();
            yandexItem.setIcon('yandex-icon');
            yandexItem.setLabel("Метка на Яндекс Картах");
            yandexItem.setAction(() => {
                let latlng = this.getContextMarkerLatLng();
                window.open(this.getYandexLink(latlng.lat, latlng.lng));
            });
        }

        {
            let thatSiteItem = linkSharingMenu.getNewItem();
            thatSiteItem.setIcon("bx bx-link-alt");  // Иконка ссылки
            thatSiteItem.setLabel("Метка на этом сайте");
            thatSiteItem.setAction(() => {
                let latlng = this.getContextMarkerLatLng();
                this.copyToBufferAndMessage(this.getThatSiteLink(latlng.lat, latlng.lng));
            });

            let googleItem = linkSharingMenu.getNewItem();
            googleItem.setIcon("google-icon");
            googleItem.setLabel("Метка на Google Картах");
            googleItem.setAction(() => {
                let latlng = this.getContextMarkerLatLng();
                this.copyToBufferAndMessage(this.getGoogleLink(latlng.lat, latlng.lng));
            });

            let osmItem = linkSharingMenu.getNewItem();
            osmItem.setIcon('osm-icon');
            osmItem.setLabel("Метка в OpenStreetMap");
            osmItem.setAction(() => {
                let latlng = this.getContextMarkerLatLng();
                this.copyToBufferAndMessage(this.getOsmLink(latlng.lat, latlng.lng, this.map.getZoom()));
            });

            let yandexItem = linkSharingMenu.getNewItem();
            yandexItem.setIcon('yandex-icon');
            yandexItem.setLabel("Метка на Яндекс Картах");
            yandexItem.setAction(() => {
                let latlng = this.getContextMarkerLatLng();
                this.copyToBufferAndMessage(this.getYandexLink(latlng.lat, latlng.lng));
            });
        }


        this.map.on('contextmenu', (e) => {
            rootMenu.show();
            this.contextMenuMarker.setLatLng(e.latlng);

        });

        // Прослушиваем пользовательское событие allMenusClosed
        this.mapContainer.addEventListener('allMenusClosed', (e) => {
            this.contextMenuMarker.setLatLng([0, 0]);
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
