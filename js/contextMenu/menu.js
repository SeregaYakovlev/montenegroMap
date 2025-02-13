class Menu {
    constructor(page, targetElement) {
        this.page = page;
        this.targetElement = targetElement;
        this.items = [];
        this.previousMenu = null;
        this.nextMenus = [];

        // Привязываем `this` к обработчику клика
        this.onOutsideClick = this.onOutsideClick.bind(this);

        this.menuLevel = 0;
        this.menuVisible = false;
    }

    isRootMenu() {
        return this.menuLevel === 0;
    }

    linkNextMenu(submenu) {
        this.nextMenus.push(submenu);
        submenu.setMenuLevel(this.menuLevel + 1);
    }

    linkPreviousMenu(prevousMenu) {
        this.previousMenu = prevousMenu;
    }

    setMenuLevel(menuLevel) {
        this.menuLevel = menuLevel;
    }

    getTargetElement() {
        return this.targetElement;
    }

    getNewItem() {
        let newItem = new Item(this.page, this);
        this.items.push(newItem);
        return newItem;
    }

    asHTMLElement() {
        let menu = document.createElement('div');
        menu.className = 'context-menu';

        for (let item of this.items) {
            menu.appendChild(item.asHTMLElement());
        }

        return menu;
    }

    show() {
        this.menu = this.asHTMLElement();

        this.menuId = this.generateId();

        // Добавляем меню в целевой элемент
        this.targetElement.appendChild(this.menu);

        this.menu.classList.toggle('open');

        this.targetElement.addEventListener('pointerdown', this.onOutsideClick);

        this.menuVisible = true;

        return this.menuId;
    }

    close() {
        if (this.menu) {
            this.menu.remove();
            this.menu = null;
            this.menuVisible = false;
            this.targetElement.removeEventListener('pointerdown', this.onOutsideClick);

            this.triggerMenuClosedEvent();
        }
    }

    isVisible() {
        return this.menuVisible;
    }

    isNextMenusVisible() {
        return this.isVisible() || this.nextMenus.some(menu => menu.isNextMenusVisible());
    }

    triggerMenuClosedEvent() {
        if (!this.isRootMenu() && !this.isNextMenusVisible()) {
            this.previousMenu.triggerMenuClosedEvent();
        }
        else if (this.isRootMenu() && !this.isNextMenusVisible()) {
            this.triggerAllMenusHiddenEvent();
        }
    }

    triggerAllMenusHiddenEvent() {
        // Триггерим пользовательское событие, если ВСЕ меню закрыты
        let event = new CustomEvent('allMenusClosed', {
            bubbles: true,
        });
        this.targetElement.dispatchEvent(event);
    }

    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    onOutsideClick(event) {
        if (this.menu && !this.menu.contains(event.target)) {
            this.close();
        }
    }
}
