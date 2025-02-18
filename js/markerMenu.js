class MarkerMenu {
    constructor(page, targetElement, marker, config) {
        this.page = page;
        this.targetElement = targetElement;
        this.marker = marker;
        this.config = config;
        this.menu = null;
    }

    build() {
        let rootMenu = new Menu(this.page, this.targetElement);

        // Перебираем ключи конфигурации и добавляем элементы в том порядке, в котором они идут в объекте
        Object.entries(this.config).forEach(([key, value]) => {
            switch (key) {
                case 'coordsCopy':
                    if (value) this._addCoordsCopy(rootMenu);
                    break;
                case 'coordsPaste':
                    if (value) this._addCoordsPaste(rootMenu);
                    break;
                case 'delete':
                    if (value) this._addDelete(rootMenu);
                    break;
                case 'openAnotherMap':
                    if (value) {
                        this._addOpenAnotherMap(rootMenu);

                        // Добавляем вложенные элементы для openAnotherMap, если они есть
                        if (value.google) this._add_google_open(value.submenu);
                        if (value.osm) this._add_osm_open(value.submenu);
                        if (value.yandex) this._add_yandex_open(value.submenu);
                    }
                    break;
                case 'linkSharing':
                    if (value) {
                        this._addLinkSharing(rootMenu);

                        // Добавляем вложенные элементы для linkSharing, если они есть
                        if (value.thisSiteLink) this._add_this_site_copy_link(value.submenu);
                        if (value.google) this._add_google_copy_link(value.submenu);
                        if (value.osm) this._add_osm_copy_link(value.submenu);
                        if (value.yandex) this._add_yandex_copy_link(value.submenu);
                    }
                    break;
                default:
                    break;
            }
        });

        this.menu = rootMenu;
    }


    show() {
        this.menu.show();
    }

    _addLinkSharing(menu) {
        let submenu = new Menu(this.page, this.targetElement);
        let item = menu.getNewItem();
        item.setIcon("bx bx-share-alt");  // Иконка общего доступа
        item.setLabel("Поделиться ссылкой...");
        item.setSubmenu(submenu);

        this.config.linkSharing.submenu = submenu;

        return item;
    }

    _addOpenAnotherMap(menu) {
        let submenu = new Menu(this.page, this.targetElement);
        let item = menu.getNewItem();
        item.setIcon('bx bx-map-alt');  // Иконка карты
        item.setLabel('Открыть другую карту...');
        item.setSubmenu(submenu);

        this.config.openAnotherMap.submenu = submenu;

        return item;
    }

    _addCoordsCopy(menu) {
        let coordsCopy = menu.getNewItem();
        coordsCopy.setIcon('bx bx-copy');  // Иконка копирования
        coordsCopy.setLabel('Копировать координаты метки');
        coordsCopy.setAction(() => {
            let latlng = this.marker.getLatLng();
            let coords = `${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`;
            this.copyToBufferAndMessage(coords);
        });

        return coordsCopy;
    }

    _addCoordsPaste(menu) {
        let coordsPaste = menu.getNewItem();
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
                return this.page.messageOutsideMontenegro(text, coords.initialCoords[0].lat, coords.initialCoords[0].lng);
            }

            if (coords.correctedCoords.length > 0) {
                this.marker.getMap().getBufferMarker().setLatLng(coords.correctedCoords[0]);
                this.page.bubble("Метка из буфера успешно добавлена!", 3000);

                // Центрируем карту на новых координатах
                this.marker.getMap().setView(coords.correctedCoords[0]);
            }
        });

        return coordsPaste;
    }

    _add_this_site_copy_link(menu) {
        let item = menu.getNewItem();
        item.setIcon("bx bx-link-alt");  // Иконка ссылки
        item.setLabel("Метка на этом сайте");
        item.setAction(() => {
            let latlng = this.marker.getLatLng();
            this.copyToBufferAndMessage(this.getThisSiteLink(latlng.lat, latlng.lng));
        });

        return item;
    }

    _add_osm_copy_link(menu) {
        let item = menu.getNewItem();
        item.setIcon('osm-icon');
        item.setLabel("Метка в OpenStreetMap");
        item.setAction(() => {
            let latlng = this.marker.getLatLng();
            this.copyToBufferAndMessage(this.getOsmLink(latlng.lat, latlng.lng, this.marker.getMap().getZoom()));
        });

        return item;
    }

    _add_osm_open(menu) {
        let item = menu.getNewItem();
        item.setIcon('osm-icon');
        item.setLabel("Метка в OpenStreetMap");
        item.setAction(() => {
            let latlng = this.marker.getLatLng();
            this.openInAnotherTab(this.getOsmLink(latlng.lat, latlng.lng, this.marker.getMap().getZoom()));
        });

        return item;
    }

    _add_google_copy_link(menu) {
        let item = menu.getNewItem();
        item.setIcon("google-icon");
        item.setLabel("Метка на Google Картах");
        item.setAction(() => {
            let latlng = this.marker.getLatLng();
            this.copyToBufferAndMessage(this.getGoogleLink(latlng.lat, latlng.lng));
        });

        return item;
    }

    _add_google_open(menu) {
        let item = menu.getNewItem();
        item.setIcon("google-icon");
        item.setLabel("Метка на Google Картах");
        item.setAction(() => {
            let latlng = this.marker.getLatLng();
            this.openInAnotherTab(this.getGoogleLink(latlng.lat, latlng.lng));
        });

        return item;
    }

    _add_yandex_copy_link(menu) {
        let item = menu.getNewItem();
        item.setIcon('yandex-icon');
        item.setLabel("Метка на Яндекс Картах");
        item.setAction(() => {
            let latlng = this.marker.getLatLng();
            this.copyToBufferAndMessage(this.getYandexLink(latlng.lat, latlng.lng));
        });

        return item;
    }

    _add_yandex_open(menu) {
        let item = menu.getNewItem();
        item.setIcon('yandex-icon');
        item.setLabel("Метка на Яндекс Картах");
        item.setAction(() => {
            let latlng = this.marker.getLatLng();
            this.openInAnotherTab(this.getYandexLink(latlng.lat, latlng.lng));
        });

        return item;
    }

    _addDelete(menu) {
        let item = menu.getNewItem();
        item.setIcon('bx bx-trash');
        item.setLabel("Стереть маркер");
        item.setAction(() => {
            this.marker.remove();
            this.close();
        });

        return item;
    }

    getThisSiteLink(lat, lon) {
        return `${window.location.origin}/?c=${lat.toFixed(6)},${lon.toFixed(6)}`;
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
            if (!this.marker.getMap().isInMapBounds(coords)) {
                // Перепутаны широта и долгота? Меняем их местами
                let swappedCoords = { lat: coords.lng, lng: coords.lat };

                // всё ок? Добавляем. Опять не подходит? Значит и не координаты.
                if (this.marker.getMap().isInMapBounds(swappedCoords)) {
                    correctedCoords.push(swappedCoords);
                }
            } else {
                correctedCoords.push(coords);
            }
        }

        return { initialCoords: initialCoords, correctedCoords: correctedCoords };
    }

    openInAnotherTab(url) {
        window.open(url, '_blank');  // Открывает URL в новой вкладке
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

    close(){
        this.menu.close();
    }
}