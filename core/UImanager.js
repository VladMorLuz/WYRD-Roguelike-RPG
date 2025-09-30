// core/UImanager.js

export default class UIManager {
    constructor(appContainer) {
        this.appContainer = appContainer;
        this.isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    }

    createGameUI() {
        this.appContainer.innerHTML = '';
        const gameScreen = this._createElement('div', 'game-screen');
        const gameContainer = this._createElement('div', 'game-container');
        const canvas = this._createElement('canvas', 'game-canvas');
        const uiPanel = this._createUIPanel();

        if (this.isMobile) {
            const mobileControls = this._createMobileControls();
            gameContainer.appendChild(mobileControls);
        }
        
        gameContainer.appendChild(canvas);
        gameContainer.appendChild(uiPanel);
        gameScreen.appendChild(gameContainer);
        this.appContainer.appendChild(gameScreen);

        this._addTabListeners();
        if (this.isMobile) this._attachInputListeners();
        return { canvas, uiPanel };
    }

    update(player, floorNumber) {
        if (!player) return;
        const statsContent = document.getElementById('player-stats-content');
        if (statsContent) {
            statsContent.innerHTML = `
                HP: ${player.hp} / ${player.maxHp}<br>
                EP: ${player.ep} / ${player.maxEp}<br>
                Nível: ${player.level || 1}<br>
                Andar: ${floorNumber || 1}
            `;
        }
        this._updateTabs(player);
    }

    log(message) {
        const logPanel = document.getElementById('ui-log');
        if (logPanel) {
            const p = document.createElement('p');
            p.textContent = message;
            logPanel.appendChild(p);
            logPanel.scrollTop = logPanel.scrollHeight;
        }
    }

    showCombatUI(allies, enemies) {
        const existingScreen = document.getElementById('combat-screen');
        if(existingScreen) existingScreen.remove();

        const combatScreen = this._createElement('div', 'combat-screen');
        const alliesHtml = allies.map(a => this._createCombatantHtml(a)).join('');
        const enemiesHtml = enemies.map(e => this._createCombatantHtml(e)).join('');

        combatScreen.innerHTML = `
            <div class="combat-arena">
                <div class="combat-team" id="enemies-team">${enemiesHtml}</div>
                <div class="combat-team" id="allies-team">${alliesHtml}</div>
            </div>
            <div class="combat-log-container"><div class="combat-log"></div></div>
            <div id="action-menu-container"></div>
        `;
        document.getElementById('game-screen').appendChild(combatScreen);
    }

    hideCombatUI() {
        const combatScreen = document.getElementById('combat-screen');
        if (combatScreen) combatScreen.remove();
    }

    updateCombatUI(combatants) {
        for (const c of combatants) {
            const c_element = document.querySelector(`[data-combatant-id="${c.id}"]`);
            if (c_element) {
                const hp_bar = c_element.querySelector('.hp-bar');
                const atb_bar = c_element.querySelector('.atb-bar');
                const ep_bar = c_element.querySelector('.ep-bar');

                if (hp_bar) hp_bar.style.width = `${Math.max(0, c.hp / c.maxHp) * 100}%`;
                if (atb_bar) atb_bar.style.width = `${(c.turnMeter / 100) * 100}%`;
                if (ep_bar && c.maxEp > 0) ep_bar.style.width = `${Math.max(0, c.ep / c.maxEp) * 100}%`;
            }
        }
    }
    
    updateCombatLog(message) {
        const log = document.querySelector('.combat-log');
        if (log) log.innerHTML = message;
    }

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
                if (action === 'item' || action === 'skill') {
                    this.showSubMenu(player, action, onActionCallback);
                } else {
                    container.innerHTML = '';
                    onActionCallback({ type: action });
                }
            }
        };
    }

    showSubMenu(player, type, onActionCallback) {
        const container = document.getElementById('action-menu-container');
        if (!container) return;
        const list = (type === 'item') ? player.inventory : player.skills;
        let listHtml = list.map(item => `<button data-action="${type}" data-id="${item.id}">${item.name}</button>`).join('');
        if (list.length === 0) listHtml = `<p>Nenhum ${type} disponível.</p>`;

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
                    this.showActionMenu(player, onActionCallback);
                } else {
                    container.innerHTML = '';
                    onActionCallback({ type: action, id: e.target.dataset.id });
                }
            }
        };
    }

    enableTargeting(possibleTargets, onTargetSelected) {
        this.updateCombatLog("Selecione um alvo...");
        const arena = document.querySelector('.combat-arena');
        if (!arena) return;

        const clickHandler = (e) => {
            const targetElement = e.target.closest('.combatant');
            // Limpa o listener e os cursores
            document.querySelectorAll('.target-cursor').forEach(c => c.remove());
            arena.removeEventListener('click', clickHandler, true);

            if (targetElement && possibleTargets.some(t => t.id === targetElement.dataset.combatantId)) {
                onTargetSelected(targetElement.dataset.combatantId);
            } else {
                onTargetSelected(null); // Indica que a seleção foi cancelada
            }
        };
        // Usa 'true' para capturar o evento antes que ele se propague
        arena.addEventListener('click', clickHandler, true);
        
        possibleTargets.forEach(target => this.showTargetCursor(target.id));
    }

    showTargetCursor(combatantId, show = true) {
        const combatantElement = document.querySelector(`[data-combatant-id="${combatantId}"]`);
        if (!combatantElement) return;

        const oldCursor = combatantElement.querySelector('.target-cursor');
        if (oldCursor) oldCursor.remove();

        if (show) {
            const cursor = this._createElement('div', '', 'target-cursor');
            combatantElement.appendChild(cursor);
        }
    }
    
    shakeCombatant(combatantId) {
        const combatantElement = document.querySelector(`[data-combatant-id="${combatantId}"] img`);
        if (combatantElement) {
            combatantElement.classList.add('shake');
            setTimeout(() => combatantElement.classList.remove('shake'), 300);
        }
    }
    
    _createUIPanel() {
        const panel = this._createElement('div', 'ui-panel');
        panel.innerHTML = `
            <div class="tabs">
                <button class="tab-button active" data-tab="inventory">🎒</button>
                <button class="tab-button" data-tab="status">🙍‍♂️</button>
                <button class="tab-button" data-tab="skills">📚</button>
            </div>
            <div class="profile-row">
                <div class="portrait-wrap"><img id="player-portrait" src="assets/player-portrait.png" alt="Portrait"></div>
                <div class="player-stats">
                    <h2>|| STATUS ||</h2>
                    <div id="player-stats-content">Carregando...</div>
                </div>
            </div>
            <div id="ui-content" class="ui-content">
                <div id="inventory-tab" class="tab-content active"></div>
                <div id="status-tab" class="tab-content"></div>
                <div id="skills-tab" class="tab-content"></div>
            </div>
            <div id="ui-log" class="ui-log"></div>
        `;
        return panel;
    }
    
    _createCombatantHtml(c) {
        const epBarHtml = c.maxEp > 0 ? `<div class="ep-bar-container"><div class="ep-bar" style="width: 100%;"></div></div>` : '';
        return `
            <div class="combatant" data-combatant-id="${c.id}">
                <img src="${c.battleSprite.src}" alt="${c.name || 'Player'}">
                <div class="hp-bar-container"><div class="hp-bar" style="width: 100%;"></div></div>
                ${epBarHtml}
                <div class="atb-bar-container"><div class="atb-bar" style="width: 0%;"></div></div>
            </div>
        `;
    }

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
    
    _attachInputListeners() {
        setTimeout(() => {
            const touchMap = {
                'dpad-up': 'up', 'dpad-down': 'down',
                'dpad-left': 'left', 'dpad-right': 'right',
                'action-btn': 'action'
            };
            for (const [elementId, action] of Object.entries(touchMap)) {
                const element = document.getElementById(elementId);
                if (element) {
                    element.addEventListener('touchstart', (e) => {
                        e.preventDefault();
                        window.dispatchEvent(new CustomEvent('virtual-input', { detail: { action, active: true } }));
                    }, { passive: false });
                    element.addEventListener('touchend', (e) => {
                        e.preventDefault();
                        window.dispatchEvent(new CustomEvent('virtual-input', { detail: { action, active: false } }));
                    }, { passive: false });
                }
            }
        }, 100);
    }

    _addTabListeners() {
        const uiPanel = document.getElementById('ui-panel');
        if (!uiPanel) return;
        
        uiPanel.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-button')) {
                const tabId = e.target.dataset.tab;
                uiPanel.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
                uiPanel.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
                e.target.classList.add('active');
                document.getElementById(`${tabId}-tab`).classList.add('active');
            }
        });
    }

    _updateTabs(player) {
        const inventoryTab = document.getElementById('inventory-tab');
        if (inventoryTab) {
            inventoryTab.innerHTML = player.inventory.length > 0
                ? `<ul>${player.inventory.map(item => `<li>${item.name}</li>`).join('')}</ul>`
                : 'Inventário vazio.';
        }
        const statusTab = document.getElementById('status-tab');
        if (statusTab) {
            statusTab.innerHTML = `
                Ataque: ${player.atk}<br>
                Defesa: ${player.def}<br>
                Velocidade: ${player.speed}<br>
                Acerto: ${player.hit}%<br>
                Evasão: ${player.eva}%<br>
                Crítico: ${player.critChance}% (${player.critMult}x)
            `;
        }
        const skillsTab = document.getElementById('skills-tab');
        if (skillsTab) {
            skillsTab.innerHTML = player.skills.length > 0
                ? `<ul>${player.skills.map(skill => `<li>${skill.name} (Custo: ${skill.cost} EP)</li>`).join('')}</ul>`
                : 'Nenhuma habilidade aprendida.';
        }
    }

    _createElement(tag, id = '', className = '') {
        const element = document.createElement(tag);
        if (id) element.id = id;
        if (className) element.className = className;
        return element;
    }
}