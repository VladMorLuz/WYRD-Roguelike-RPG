export default class InputManager {
    constructor() {
        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false,
            action: false
        };

        // Mapeia as teclas do teclado para as nossas ações
        this.keyMap = {
            'ArrowUp': 'up', 'w': 'up',
            'ArrowDown': 'down', 's': 'down',
            'ArrowLeft': 'left', 'a': 'left',
            'ArrowRight': 'right', 'd': 'right',
            'e': 'action', ' ': 'action'
        };

        // Mapeia os botões de toque para as nossas ações
        this.touchMap = {
            'dpad-up': 'up',
            'dpad-down': 'down',
            'dpad-left': 'left',
            'dpad-right': 'right',
            'action-btn': 'action'
        };

        this._addEventListeners();
    }

    _addEventListeners() {
        // Eventos de Teclado (continua igual)
        window.addEventListener('keydown', e => {
            const action = this.keyMap[e.key];
            if (action) this.keys[action] = true;
        });
        window.addEventListener('keyup', e => {
            const action = this.keyMap[e.key];
            if (action) this.keys[action] = false;
        });

        // --- CÓDIGO NOVO ---
        // Ouvinte para os nossos eventos customizados vindos da UI
        window.addEventListener('virtual-input', (e) => {
            const { action, active } = e.detail;
            if (this.keys.hasOwnProperty(action)) {
                this.keys[action] = active;
            }
        });
    }
}