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
        // Eventos de Teclado
        window.addEventListener('keydown', e => {
            const action = this.keyMap[e.key];
            if (action) {
                this.keys[action] = true;
            }
        });
        window.addEventListener('keyup', e => {
            const action = this.keyMap[e.key];
            if (action) {
                this.keys[action] = false;
            }
        });

        // Eventos de Toque (usando 'setTimeout' para garantir que os botões já existam)
        setTimeout(() => {
            for (const [elementId, action] of Object.entries(this.touchMap)) {
                const element = document.getElementById(elementId);
                if (element) {
                    element.addEventListener('touchstart', e => {
                        e.preventDefault();
                        this.keys[action] = true;
                    }, { passive: false });

                    element.addEventListener('touchend', e => {
                        e.preventDefault();
                        this.keys[action] = false;
                    }, { passive: false });
                }
            }
        }, 0);
    }
}