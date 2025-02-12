class Page {
    constructor(){

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
}