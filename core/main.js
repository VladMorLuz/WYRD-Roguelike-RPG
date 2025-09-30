// core/main.js
import GameManager from './GameManager.js';

window.addEventListener('DOMContentLoaded', () => {
    const appContainer = document.getElementById('app');
    const game = new GameManager(appContainer);
    game.start(); // O start agora é assíncrono, mas não muda a chamada
});