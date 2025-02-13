class ThemeSwitcher {
    constructor(page) {
        this.page = page;
        this.themeSwitcher = document.querySelector('#themeSwitcher');
        this.themeSwitcher.addEventListener('click', () => this.toggleTheme());
        this.updateText();
    }

    toggleTheme() {
        if (this.page.isDark()) {
            this.page.setLightTheme();
        } else if (this.page.isLight()) {
            this.page.setDarkTheme();
        } else {
            throw new Error("Algorithm error");
        }
        this.updateText();
    }

    updateText() {
        // если карта светлая - надпись означает кнопку переключения на тёмную тему
        this.themeSwitcher.textContent = this.page.isLight() ? 'Тёмная тема' : 'Светлая тема';
    }
}
