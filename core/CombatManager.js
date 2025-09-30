import { getDef } from './DataManager.js';
const ATB_THRESHOLD = 100; 
const ATB_SPEED_MULTIPLIER = 0.2;

export default class CombatManager {
    constructor(uiManager, allies, enemies, onCombatEnd) {
        this.uiManager = uiManager;
        this.allies = allies;
        this.enemies = enemies;
        this.onCombatEnd = onCombatEnd;
        
        this.combatants = [...allies, ...enemies].sort((a, b) => b.speed - a.speed);
        this.turnQueue = [];
        this.isRunning = true;
        this.isAwaitingPlayerInput = false;

        this.start();
    }

    start() {
        this.uiManager.showCombatUI(this.allies, this.enemies);
        this.combatLoop();
    }

    combatLoop() {
        if (!this.isRunning) return;

        // 1. Atualiza as barras de ATB
        if (!this.isAwaitingPlayerInput) {
            this.updateATB();
        }
        
        // 2. Atualiza a UI (barras de vida, ATB, etc)
        this.uiManager.updateCombatUI(this.combatants);

        // 3. Processa o próximo da fila de turno
        if (this.turnQueue.length > 0 && !this.isAwaitingPlayerInput) {
            const currentCombatant = this.turnQueue.shift();
            this.processTurn(currentCombatant);
        }

        requestAnimationFrame(() => this.combatLoop());
    }

    updateATB() {
        for (const c of this.combatants) {
            if (c.hp > 0) {
                c.turnMeter += c.speed * ATB_SPEED_MULTIPLIER;
                if (c.turnMeter >= ATB_THRESHOLD) {
                    c.turnMeter = ATB_THRESHOLD;
                    if (!this.turnQueue.includes(c)) {
                        this.turnQueue.push(c);
                    }
                }
            }
        }
    }

    processTurn(combatant) {
        combatant.isDefending = false; // Reset no status de defesa

        // É um aliado (jogador)?
        if (this.allies.includes(combatant)) {
            this.isAwaitingPlayerInput = true;
            this.uiManager.showActionMenu(combatant, (action) => this.handlePlayerAction(action, combatant));
        } else {
            // É um inimigo?
            this.enemyAI(combatant);
        }
    }

    handlePlayerAction(action, data) {
        if (!this.isAwaitingPlayerInput) return;
        this.isAwaitingPlayerInput = false;
        
        let player = this.allies[0]; // Assumindo que o jogador é o primeiro
        let target = this.enemies.find(e => e.hp > 0); // Pega o primeiro inimigo vivo
        switch (action) {
            case 'attack':
                const damage = Math.max(1, player.atk - (target.def || 0));
                target.hp -= target.isDefending ? Math.floor(damage * 0.8) : damage;
                this.uiManager.updateCombatLog(`Você ataca ${target.name} e causa ${damage} de dano!`);
                break;
            case 'defend':
                player.isDefending = true;
                this.uiManager.updateCombatLog(`Você está defendendo!`);
                break;
            case 'item':
                const itemDef = getDef('items', data);
                if (itemDef && itemDef.effect.action === 'restore_hp') {
                    player.hp = Math.min(player.maxHp, player.hp + itemDef.effect.amount);
                    this.uiManager.updateCombatLog(`Você usou ${itemDef.name} e curou ${itemDef.effect.amount} de HP!`);
                }
                break;

            case 'flee':
                const fleeChance = 50 + player.speed - this.enemies.reduce((acc, e) => acc + e.speed, 0) / this.enemies.length;
                if (Math.random() * 100 < fleeChance) {
                    this.uiManager.updateCombatLog(`Você fugiu com sucesso!`);
                    this.end('fled');
                    return;
                } else {
                    this.uiManager.updateCombatLog(`A fuga falhou!`);
                }
                break;
        }

        player.turnMeter = 0;
        this.isAwaitingPlayerInput = false;
        this.checkCombatStatus();
    }

    enemyAI(enemy) {
        let target = this.allies.find(a => a.hp > 0); // Pega o primeiro aliado vivo
        if (!target) return;

        const damage = Math.max(1, enemy.atk - (target.def || 0));
        target.hp -= target.isDefending ? Math.floor(damage * 0.8) : damage;
        this.uiManager.updateCombatLog(`${enemy.name} ataca e causa ${damage} de dano!`);

        enemy.turnMeter = 0;
        this.checkCombatStatus();
    }

    checkCombatStatus() {
        const aliveAllies = this.allies.filter(a => a.hp > 0).length;
        const aliveEnemies = this.enemies.filter(e => e.hp > 0).length;

        if (aliveAllies === 0) {
            this.end('lose');
        } else if (aliveEnemies === 0) {
            this.end('win');
        }
    }

    end(result) {
        this.isRunning = false;
        this.uiManager.hideCombatUI();
        this.onCombatEnd(result, this.enemies);
    }
}