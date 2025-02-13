class LanguageSwitcher {
    constructor(page, map) {
        this.page = page;
        this.map = map;
        this.languageSwitcher = document.querySelector('#languageSwitcher');
        this.languageSwitcher.addEventListener('click', () => this.switchLanguage());
        this.updateText();
    }

    switchLanguage() {
        if (this.map.isRussianLang()) {
            this.map.switchToLocal();
            this.page.saveLanguage("local");
        } else if (this.map.isLocalLang()) {
            this.map.switchToRussian();
            this.page.saveLanguage("ru");
        } else {
            throw new Error("Algorithm error");
        }
        this.updateText();
    }

    updateText() {
        // если карта русская - надпись означает кнопку переключения на местный язык
        this.languageSwitcher.textContent = this.map.isRussianLang() ? 'Местный язык' : 'Русский язык';
    }
}
