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

    showCombatUI(player, enemy, onAction) {
        let combatScreen = document.getElementById('combat-screen');
        if (combatScreen) combatScreen.remove();

        combatScreen = this._createElement('div', 'combat-screen');
        combatScreen.innerHTML = `
            <div class="combat-arena">
                <div class="combatant" id="enemy-combatant">
                    <img src="${enemy.battleSprite.src}" alt="${enemy.name}">
                    <div class="hp-bar-container">
                        <div class="hp-bar" id="enemy-hp-bar" style="width: 100%;"></div>
                    </div>
                </div>
                <div class="combatant" id="player-combatant">
                    <img src="${player.battleSprite.src}" alt="Player">
                    <div class="hp-bar-container">
                        <div class="hp-bar" id="player-hp-bar" style="width: 100%;"></div>
                    </div>
                </div>
            </div>
            <div class="combat-log">Batalha contra ${enemy.name}!</div>
            <div class="combat-actions">
                <button id="attack-btn">ATACAR</button>
            </div>
        `;
        this.appContainer.appendChild(combatScreen);

        document.getElementById('attack-btn').onclick = () => onAction('attack');
    }

    // Adicione este novo método para atualizar a UI durante a batalha
    updateCombatUI(player, enemy) {
        const playerHpBar = document.getElementById('player-hp-bar');
        const enemyHpBar = document.getElementById('enemy-hp-bar');
        if (playerHpBar) {
            playerHpBar.style.width = `${(player.hp / player.maxHp) * 100}%`;
        }
        if (enemyHpBar) {
            enemyHpBar.style.width = `${(enemy.hp / enemy.maxHp) * 100}%`;
        }

        // Animação de dano
        const enemySprite = document.querySelector('#enemy-combatant img');
        if (enemySprite) {
            enemySprite.classList.add('shake');
            setTimeout(() => enemySprite.classList.remove('shake'), 300);
        }
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