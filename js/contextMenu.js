class ContextMenu {
    constructor(items = [], targetElement = document.body) {
        this.items = items;
        this.menu = null;
        this.targetElement = targetElement;
        this.onOutsideClick = this.onOutsideClick.bind(this);
    }

    createMenu(items) {
        let menu = document.createElement('div');
        menu.className = 'context-menu';

        items.forEach(item => {
            let menuItem = document.createElement('div');
            menuItem.className = 'context-menu-item';

            // Добавляем иконку, если она есть
            if (item.icon) {
                let icon = document.createElement('i');
                icon.className = item.icon;
                menuItem.appendChild(icon); // Добавляем иконку в меню
            }

            let textNode = document.createTextNode(item.label);
            menuItem.appendChild(textNode);

            if (item.submenu) {
                menuItem.classList.add('has-submenu');

                let submenu = this.createMenu(item.submenu);
                submenu.classList.add('submenu'); // Добавляем класс подменю
                menuItem.appendChild(submenu);

                // Показываем подменю при наведении
                menuItem.addEventListener('mouseenter', () => {
                    submenu.style.display = 'block';

                    // Корректировка подменю
                    this.correctSubmenuInMap(menu, submenu, this.targetElement);
                });

                // Прячем подменю при уходе курсора
                menuItem.addEventListener('mouseleave', () => {
                    submenu.style.display = 'none';
                    submenu.removeAttribute('data-space-right');
                    submenu.removeAttribute('data-space-below');
                });
            } else if (item.action) {
                menuItem.addEventListener('click', (e) => {
                    e.stopPropagation();
                    item.action();
                    this.hide();
                });
            }

            menu.appendChild(menuItem);
        });

        return menu;
    }

    show(x, y) {
        this.hide(); // Удаляем предыдущее меню, если есть

        this.menu = this.createMenu(this.items);

        this.menuId = this.generateId();

        // Добавляем меню в целевой элемент
        this.targetElement.appendChild(this.menu);

        this.correctMenuInMap(this.menu, this.targetElement, x, y);

        this.targetElement.addEventListener('click', this.onOutsideClick);

        return this.menuId;
    }

    correctMenuInMap(menu, map, x, y) {
        if (x && y) {
            menu.style.left = `${x}px`;
            menu.style.top = `${y}px`;
        }

        let mapRectInDocument = map.getBoundingClientRect();
        let menuRectInDocument = menu.getBoundingClientRect();

        let menuRectInMap = {
            left: menuRectInDocument.left - mapRectInDocument.left,
            top: menuRectInDocument.top - mapRectInDocument.top,
            right: menuRectInDocument.right - mapRectInDocument.left,
            bottom: menuRectInDocument.bottom - mapRectInDocument.top
        }

        // Координаты целевого элемента относительно родителя
        let menuX_InMap = menuRectInMap.left;
        let menuY_InMap = menuRectInMap.top;

        let menuWidth = menu.offsetWidth;
        let menuHeight = menu.offsetHeight;

        // Корректировка по правому краю
        if (menuRectInDocument.left + menuWidth > mapRectInDocument.right) {
            menuX_InMap = menuX_InMap - menuWidth;
        }

        // Корректировка по нижнему краю
        if (menuRectInDocument.top + menuHeight > mapRectInDocument.bottom) {
            menuY_InMap = menuY_InMap - menuHeight;
        }

        menu.style.left = `${menuX_InMap}px`;
        menu.style.top = `${menuY_InMap}px`;
    }

    correctSubmenuInMap(menu, submenu, map) {
        const submenuRect = submenu.getBoundingClientRect();
        const mapRect = map.getBoundingClientRect();

        console.log('Map Rect:', mapRect);
        console.log('Submenu Rect:', submenuRect);

        // Проверка, выходит ли подменю за пределы карты
        if (submenuRect.right > mapRect.right) {
            submenu.setAttribute('data-space-right', 'false');
        }

        if (submenuRect.bottom > mapRect.bottom) {
            submenu.setAttribute('data-space-below', 'false');
        }
    }

    hide() {
        if (this.menu) {
            this.menu.remove();
            this.menu = null;
            this.targetElement.removeEventListener('click', this.onOutsideClick);

            // Триггерим пользовательское событие contextMenuClosed с id контекстного окна
            const event = new CustomEvent('contextMenuClosed', {
                bubbles: true,
                detail: { menuId: this.menuId }
            });
            this.targetElement.dispatchEvent(event);
        }
    }

    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    onOutsideClick(event) {
        if (this.menu && !this.menu.contains(event.target)) {
            this.hide();
        }
    }
}
