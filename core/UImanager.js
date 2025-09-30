export default class UIManager {
    constructor(appContainer) {
        this.appContainer = appContainer;
        this.isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    }

    // Método principal para construir a UI do jogo
    createGameUI() {
        // Limpa qualquer coisa que estivesse na tela (como o menu principal)
        this.appContainer.innerHTML = '';

        const gameScreen = this._createElement('div', '', 'game-screen');
        const gameContainer = this._createElement('div', '', 'game-container');
        const canvas = this._createElement('canvas', 'game-canvas', 'game-canvas');
        const uiPanel = this._createUIPanel();

        // Adiciona os controles apenas se for um dispositivo móvel
        if (this.isMobile) {
            const mobileControls = this._createMobileControls();
            gameContainer.appendChild(mobileControls);
        }
        
        // Monta a estrutura (um dentro do outro)
        gameContainer.appendChild(canvas);
        gameContainer.appendChild(uiPanel);
        gameScreen.appendChild(gameContainer);
        this.appContainer.appendChild(gameScreen);

        // Retorna referências para os elementos que outros módulos podem precisar
        return { canvas, uiPanel };
    }

    // Função auxiliar para criar o painel de status
    _createUIPanel() {
        const panel = this._createElement('div', 'ui-panel');
        // Usamos a mesma estrutura HTML do projeto antigo, mas criada dinamicamente
        panel.innerHTML = `
            <div id="ui-top">
                <div class="tabs">
                    <button class="tab-button active">🎒</button>
                    <button class="tab-button">⚔️</button>
                    <button class="tab-button">🙍‍♂️</button>
                    <button class="tab-button">📚</button>
                    <button class="tab-button">⚙️</button>
                </div>
                <div class="profile-row">
                    <div class="portrait-wrap">
                        <img id="player-portrait" src="assets/player-portrait.png" alt="Portrait">
                    </div>
                    <div id="player-stats" class="player-stats">
                        <h2>|| STATUS ||</h2>
                        <div id="player-stats-content">Carregando...</div>
                    </div>
                </div>
                <div id="ui-content" class="ui-content">
                    <div id="inventory" class="tab-content active">Seu inventário está vazio.</div>
                </div>
            </div>
            <div id="ui-log" class="ui-log">
                <p>Bem-vindo ao WYRD 2.0!</p>
            </div>
        `;
        return panel;
    }

    

    // Função auxiliar para criar os controles mobile
    _createMobileControls() {
        const controls = this._createElement('div', 'mobile-controls');
        controls.innerHTML = `
            <div class="dpad">
                <button id="dpad-up" class="dpad-btn">▲</button>
                <button id="dpad-left" class="dpad-btn">◀</button>
                <button id="dpad-right" class="dpad-btn">▶</button>
                <button id="dpad-down" class="dpad-btn">▼</button>
            </div>
            <div class="action-btn-container">
                <button id="action-btn" class="action-btn">E</button>
            </div>
        `;
        return controls;
    }

    // Uma pequena função "helper" para não repetir código
    _createElement(tag, id = '', className = '') {
        const element = document.createElement(tag);
        if (id) element.id = id;
        if (className) element.className = className;
        return element;
    }

    // Placeholder para futuras atualizações
    updateStats(playerData) {
        const statsContent = document.getElementById('player-stats-content');
        if (!statsContent) return;

        statsContent.innerHTML = `
            Vida: ${playerData.hp}/${playerData.maxHp}<br>
            Ataque: ${playerData.atk}<br>
            Defesa: ${playerData.def}<br>
            Velocidade: ${playerData.speed}<br>
            `;
    }

    showCombatUI(allies, enemies) {
        let combatScreen = document.getElementById('combat-screen');
        if (combatScreen) combatScreen.remove();

        combatScreen = this._createElement('div', 'combat-screen');
        
        let alliesHtml = allies.map(a => this._createCombatantHtml(a, 'ally')).join('');
        let enemiesHtml = enemies.map(e => this._createCombatantHtml(e, 'enemy')).join('');

        combatScreen.innerHTML = `
            <div class="combat-arena">
                <div class="combat-team" id="enemies-team">${enemiesHtml}</div>
                <div class="combat-team" id="allies-team">${alliesHtml}</div>
            </div>
            <div class="combat-log-container"><div class="combat-log"></div></div>
            <div id="action-menu-container"></div>
        `;
        this.appContainer.appendChild(combatScreen);
    }

    // Adicione esta função auxiliar
    _createCombatantHtml(c, type) {
        return `
            <div class="combatant" id="combatant-${c.id}" data-combatant-id="${c.id}">
                <img src="${c.battleSprite.src}" alt="${c.name || 'Player'}">
                <div class="atb-bar-container">
                    <div class="atb-bar" style="width: 0%;"></div>
                </div>
                <div class="hp-bar-container">
                    <div class="hp-bar" style="width: 100%;"></div>
                </div>
            </div>
        `;
    }
    
    // Substitua o updateCombatUI
    updateCombatUI(combatants) {
        for (const c of combatants) {
            const c_element = document.querySelector(`[data-combatant-id="${c.id}"]`);
            if (c_element) {
                const hp_bar = c_element.querySelector('.hp-bar');
                const atb_bar = c_element.querySelector('.atb-bar');
                hp_bar.style.width = `${Math.max(0, c.hp / c.maxHp) * 100}%`;
                atb_bar.style.width = `${(c.turnMeter / 100) * 100}%`;
            }
        }
    }

    // Adicione a função para o menu de ações
    showActionMenu(player, onActionCallback) {
        const container = document.getElementById('action-menu-container');
        if (!container) return;
        container.innerHTML = `
            <div class="action-menu">
                <button data-action="attack">Atacar</button>
                <button data-action="defend">Defender</button>
                <button data-action="item">Item</button>
                <button data-action="skill">Habilidade</button>
                <button data-action="flee">Fugir</button>
            </div>
        `;
        container.querySelector('.action-menu').onclick = (e) => {
            if (e.target.tagName === 'BUTTON') {
                const action = e.target.dataset.action;
                // Se for item ou skill, mostra o submenu. Senão, executa a ação.
                if (action === 'item' || action === 'skill') {
                    this.showSubMenu(player, action, onActionCallback);
                } else {
                    container.innerHTML = '';
                    onActionCallback(action);
                }
            }
        };
    }

    // Crie esta nova função para os submenus
    showSubMenu(player, type, onActionCallback) {
        const container = document.getElementById('action-menu-container');
        if (!container) return;

        const list = (type === 'item') ? player.inventory : player.skills;
        let listHtml = list.map(item => `<button data-action="${type}" data-id="${item.id}">${item.name}</button>`).join('');
        if (list.length === 0) {
            listHtml = `<p>Nenhum ${type} disponível.</p>`;
        }

        container.innerHTML = `
            <div class="action-menu">
                ${listHtml}
                <button data-action="cancel">Cancelar</button>
            </div>
        `;

        container.querySelector('.action-menu').onclick = (e) => {
            if (e.target.tagName === 'BUTTON') {
                const action = e.target.dataset.action;
                if (action === 'cancel') {
                    // Se cancelar, mostra o menu principal de novo
                    this.showActionMenu(player, onActionCallback);
                } else {
                    container.innerHTML = '';
                    // Envia a ação E o ID do item/skill usado
                    onActionCallback(action, e.target.dataset.id);
                }
            }
        };
    }

    hideCombatUI() {
        const combatScreen = document.getElementById('combat-screen');
        if (combatScreen) combatScreen.remove();
    }

    updateCombatLog(message) {
        const log = document.querySelector('.combat-log');
        if (log) log.innerHTML += `<br>${message}`;
    }
}