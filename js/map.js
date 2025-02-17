class Map {
    constructor(page, mapContainer) {
        this.page = page;
        this.mapContainer = mapContainer;

        // Создание маркеров с этими иконками
        this.rightClickMarker = new Marker(this);
        this.rightClickMarker.setColor("#9C2BCB", "#742E98");

        this.siteLinkMarker = new Marker(this);
        this.siteLinkMarker.setColor("#CB2B3E", "#982E40");

        this.bufferMarker = new Marker(this);
        this.bufferMarker.setColor("#2A81CB", "#3274A3");
    }

    getBufferMarker(){
        return this.bufferMarker;
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

    setView(latlng, zoom){
        this.map.setView(latlng, zoom);
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

        this.rightClickMarker.addTo(this.map);
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

    isInMapBounds(lat, lng) {
        if (!this.bounds) return true; // Если границы не заданы, считаем, что всё подходит
        return this.bounds.contains([lat, lng]);
    }

    addContextMenu() {
        let rightClickMarkerConfig = {
            openAnotherMap: {
                google: true,
                osm: true,
                yandex: true
            },
            linkSharing: {
                thisSiteLink: true,
                google: true,
                osm: true,
                yandex: true
            },
            coordsCopy: true,
            coordsPaste: true,
        }

        let rightClickMenu = new MarkerMenu(this.page, this.mapContainer, this.rightClickMarker, rightClickMarkerConfig);

        rightClickMenu.build();

        let siteLinkMarkerConfig = {
            openAnotherMap: {
                google: true,
                osm: true,
                yandex: true
            },
            linkSharing: {
                thisSiteLink: true,
                google: true,
                osm: true,
                yandex: true
            },
            coordsCopy: true,
            delete: true
        }

        let siteLinkMenu = new MarkerMenu(this.page, this.mapContainer, this.siteLinkMarker, siteLinkMarkerConfig);

        siteLinkMenu.build();

        this.siteLinkMarker.setOnClickAction(() => {
            siteLinkMenu.show();
        })

        let bufferMarkerConfig = {
            openAnotherMap: {
                google: true,
                osm: true,
                yandex: true
            },
            linkSharing: {
                thisSiteLink: true,
                google: true,
                osm: true,
                yandex: true
            },
            coordsCopy: true,
            delete: true
        }

        let bufferMenu = new MarkerMenu(this.page, this.mapContainer, this.bufferMarker, bufferMarkerConfig);

        bufferMenu.build();

        this.bufferMarker.setOnClickAction(() => {
            bufferMenu.show();
        })

        this.map.on('contextmenu', (e) => {
            this.rightClickMarker.setLatLng(e.latlng);
            this.rightClickMarker.runAction(() => {
                rightClickMenu.show();
            });
        });

        // Прослушиваем пользовательское событие allMenusClosed
        this.mapContainer.addEventListener('allMenusClosed', (e) => {
            this.rightClickMarker.setLatLng([0, 0]);
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
