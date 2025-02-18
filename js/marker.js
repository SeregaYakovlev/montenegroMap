class Marker {
    constructor(map) {
        this.marker = L.marker([0, 0]);
        this.map = map;
    }

    getMap(){
        return this.map;
    }

    remove(){
        // не удаляем маркер фактически с карты
        // так как этот объект установлен в map.js в конструкторе
        this.marker.setLatLng([0, 0]);
    }

    addTo(leafletMap) {
        this.marker.addTo(leafletMap);
    }

    getLatLng(){
        return this.marker.getLatLng();
    }

    setLatLng(latlng) {
        this.marker.setLatLng(latlng);
    }

    async setColor(colorInside, colorOutside) {
        let colorfulIcon = await this._getColorfulIcon(colorInside, colorOutside);
        this.marker.setIcon(colorfulIcon);
    }

    async _getColorfulIcon(colorInside, colorOutside) {
        let iconPath = "/images/marker/marker-icon.svg";
        let iconShadowPath = "/images/marker/marker-shadow.svg";
    
        if (!this.colorfulIconSvg) {
            // Загрузите SVG-файл
            let response = await fetch(iconPath);
            let svgText = await response.text();
            this.colorfulIconSvg = svgText;
        }
    
        let svgText = this.colorfulIconSvg;
    
        // Миксируем цвета для верха и низа
        let insideTop = this.getLighter(colorInside);
        let insideBottom = this.getDarker(colorInside);
        let outsideTop = this.getLighter(colorOutside);
        let outsideBottom = this.getDarker(colorOutside);
    
        let modifiedSvg = svgText
            .replace(/stop-color="[^"]*"\s*data-color="inside-bottom"/, `stop-color="${insideBottom}" data-color="inside-bottom"`)
            .replace(/stop-color="[^"]*"\s*data-color="inside-top"/, `stop-color="${insideTop}" data-color="inside-top"`)
            .replace(/stop-color="[^"]*"\s*data-color="outside-bottom"/, `stop-color="${outsideBottom}" data-color="outside-bottom"`)
            .replace(/stop-color="[^"]*"\s*data-color="outside-top"/, `stop-color="${outsideTop}" data-color="outside-top"`);
    
        let icon = new L.Icon({
            iconUrl: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(modifiedSvg),
            shadowUrl: iconShadowPath,
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });
    
        return icon;
    }

    setOnClickAction(action){
        this.marker.on('click', (event) => {
            this.blink();
            // При клике вызываем метод для отображения контекстного меню
            action(event);
        });
    }

    runAction(action){
        action();
    }
    
    blink() {
        if (!this.marker.options.icon) {
            return;
        }
    
        const originalIcon = this.marker.options.icon; // Сохраняем текущую иконку
    
        // Устанавливаем временный цвет (например, белый)
        this.setColor("#CB8427", "#98652E");
    
        setTimeout(() => {
            this.marker.setIcon(originalIcon); // Восстанавливаем оригинальную иконку
        }, 250);
    }
    

    // Миксируем цвета для светлой и темной версии
    getLighter(color, factor = 0.3) {
        const { r, g, b } = this.hexToRgb(color);
        const lighten = (c) => Math.min(255, c + (255 - c) * factor);
        return this.rgbToHex(lighten(r), lighten(g), lighten(b));
    }

    getDarker(color, factor = 0.3) {
        const { r, g, b } = this.hexToRgb(color);
        const darken = (c) => Math.max(0, c - c * factor);
        return this.rgbToHex(darken(r), darken(g), darken(b));
    }

    hexToRgb(hex) {
        let r = 0, g = 0, b = 0;

        if (hex.length === 4) { // 3 digits (например, "#abc")
            r = parseInt(hex[1] + hex[1], 16);
            g = parseInt(hex[2] + hex[2], 16);
            b = parseInt(hex[3] + hex[3], 16);
        } else if (hex.length === 7) { // 6 digits (например, "#aabbcc")
            r = parseInt(hex[1] + hex[2], 16);
            g = parseInt(hex[3] + hex[4], 16);
            b = parseInt(hex[5] + hex[6], 16);
        }

        return { r, g, b };
    }

    rgbToHex(r, g, b) {
        return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1).toUpperCase();
    }
}