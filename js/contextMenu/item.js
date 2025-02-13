class Item {
    constructor(page, menu) {
        this.page = page;
        this.menu = menu;
    }

    setIcon(icon) {
        this.icon = icon;
    }

    setLabel(label) {
        this.label = label;
    }

    setAction(action) {
        this.action = action;
    }

    setSubmenu(submenu) {
        this.submenu = submenu;
        this.menu.linkNextMenu(submenu);
        this.submenu.linkPreviousMenu(this.menu);
    }

    asHTMLElement() {
        let menuItem = document.createElement('div');
        menuItem.className = 'context-menu-item';

        // Если есть иконка, добавляем её
        if (this.icon) {
            let icon = document.createElement('i');
            icon.className = this.icon;
            menuItem.appendChild(icon);
        }

        // Добавляем текстовое имя пункта меню
        let textNode = document.createTextNode(this.label);
        menuItem.appendChild(textNode);

        // Если у пункта есть подменю, добавляем обработчик
        if (this.submenu) {
            menuItem.classList.add('has-submenu');
            menuItem.addEventListener('click', (event) => {
                event.stopPropagation(); // Останавливаем всплытие, чтобы не закрывалось мгновенно

                // не менять эти строки местами. См. triggerMenuClosedEvent() и isNextMenusVisible()
                this.submenu.show(); 
                this.menu.close();
            });
        }

        else if (this.action) {
            menuItem.addEventListener("click", (event) => {
                event.stopPropagation();
                this.action();
            })
        }

        return menuItem;
    }
}
