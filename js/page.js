class Page {
    constructor(){
        this._applySavedTheme();
    }

    isPC() {
        return window.innerWidth > 768;
    }
    
    isMobile() {
        return window.innerWidth <= 768;
    }
    

    setDarkTheme(){
        document.body.setAttribute("theme", "dark");
        this._saveTheme("dark");
    }

    setLightTheme(){
        document.body.setAttribute("theme", "light");
        this._saveTheme("light");
    }

    isLight(){
        return document.body.getAttribute("theme") === "light";
    }

    isDark(){
        return document.body.getAttribute("theme") === "dark";
    }

    saveLanguage(language) {
        localStorage.setItem('language', language);
    }

    getSavedLanguage() {
        return localStorage.getItem('language') || 'ru';
    }

    bubble(message){
        let bubble = document.createElement('div');
        bubble.className = 'notification-bubble';
        bubble.textContent = message;
        document.body.appendChild(bubble);

        setTimeout(() => {
            bubble.remove();
        }, 1000);
    }

    _applySavedTheme(){
        let savedTheme = this._getSavedTheme();
        if(savedTheme === "dark"){
            this.setDarkTheme();
        }
        else if(savedTheme === "light"){
            this.setLightTheme();
        }
        else {
            throw new Error("Algorithm error");
        }
    }

    _getSavedTheme() {
        return localStorage.getItem('theme') || 'light';
    }

    _saveTheme(theme) {
        localStorage.setItem('theme', theme);
    }
}