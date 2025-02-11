class Map {
    constructor(mapContainer) {
        this.mapContainer = mapContainer;
    }

    initTileLayer() {
        this.tileLayer = L.tileLayer('http://192.168.2.36:8080/tile/{z}/{x}/{y}.png').addTo(this.map);
    }

    initMap() {
        let map0 = document.createElement("div");
        map0.classList.add("map");
        this.map0 = map0;

        this.mapContainer.appendChild(map0);

        this.map = L.map(map0, {
            minZoom: 8,
            maxZoom: 18,
            attributionControl: false,
            zoomControl: false
        }).setView([42.5, 19.3], 8);
    }

    setAttribution() {
        L.control.attribution({
            prefix: "© <a href='https://www.openstreetmap.org'>OpenStreetMap</a>"
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

        select.addEventListener('change', (e) => {
            let lang = e.target.value;
            let tileUrl = lang === 'ru' ? 'http://192.168.2.36:8080/tile/{z}/{x}/{y}.png' : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
            this.map.removeLayer(this.tileLayer);
            this.tileLayer = L.tileLayer(tileUrl).addTo(this.map);
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

        select.addEventListener('change', (e) => {
            let theme = e.target.value;
            document.body.setAttribute('theme', theme);
        });
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
}
