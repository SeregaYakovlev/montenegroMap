class ThemeSwitcher {
    constructor(page) {
        this.page = page;
        this.themeSwitcher = document.createElement("div");
        this.themeSwitcher.id = "themeSwitcher";
        this.themeSwitcher.className = "action";
        this.themeSwitcher.addEventListener('click', () => this.toggleTheme());
        this.updateText();
    }

    addToPage(){
        this.page.addAction(this.themeSwitcher);
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
