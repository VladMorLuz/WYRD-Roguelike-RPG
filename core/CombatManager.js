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
        this.currentTurn = null;

        this.start();
    }

    start() {
        this.uiManager.showCombatUI(this.allies, this.enemies);
        this.combatLoop();
    }

    combatLoop() {
        if (!this.isRunning) return;

        if (!this.currentTurn) {
            this.updateATB();
        }
        this.uiManager.updateCombatUI(this.combatants);

        if (this.turnQueue.length > 0 && !this.currentTurn) {
            this.currentTurn = this.turnQueue.shift();
            this.processTurn(this.currentTurn);
        }

        requestAnimationFrame(() => this.combatLoop());
    }

    updateATB() {
        for (const c of this.combatants) {
            if (c.hp > 0) {
                c.turnMeter += c.speed * ATB_SPEED_MULTIPLIER;
                if (c.turnMeter >= ATB_THRESHOLD) {
                    c.turnMeter = ATB_THRESHOLD;
                    if (!this.turnQueue.includes(c)) this.turnQueue.push(c);
                }
            }
        }
    }

    async processTurn(combatant) {
        combatant.isDefending = false;

        let action;
        if (this.allies.includes(combatant)) {
            action = await this.waitForPlayerAction(combatant);
        } else {
            action = this.getEnemyAIAction(combatant);
        }
        
        await this.executeAction(combatant, action);
        
        if (this.isRunning) {
            combatant.turnMeter = 0;
            this.currentTurn = null;
            this.checkCombatStatus();
        }
    }

    waitForPlayerAction(player) {
        return new Promise(resolve => {
            this.uiManager.showActionMenu(player, (action) => resolve(action));
        });
    }

    async executeAction(caster, action) {
        if (action.type === 'defend') {
            console.log("AÇÃO DEFENDER EXECUTADA. O TURNO DEVE TERMINAR AQUI."); // Log de Debug
            caster.isDefending = true;
            this.uiManager.updateCombatLog(`${caster.name || 'Você'} está se defendendo.`);
            return; // FINALIZA A AÇÃO
        }

        if (action.type === 'flee') {
            const fleeChance = 50 + caster.speed - this.enemies.reduce((acc, e) => acc + e.speed, 0) / this.enemies.length;
            if (Math.random() * 100 < fleeChance) {
                this.uiManager.updateCombatLog(`Fuga bem-sucedida!`);
                this.end('fled');
            } else {
                this.uiManager.updateCombatLog(`A fuga falhou!`);
            }
            return; // FINALIZA A AÇÃO
        }

        const actionDef = getDef(action.type === 'item' ? 'items' : 'skills', action.id);
        const targetType = action.targetType || actionDef?.target || 'enemy_single';

        let possibleTargets = [];
        if (targetType.includes('enemy')) possibleTargets = this.enemies.filter(e => e.hp > 0);
        else if (targetType.includes('ally')) possibleTargets = this.allies.filter(a => a.hp > 0);
        else if (targetType === 'self') possibleTargets = [caster];
        
        if (possibleTargets.length === 0) {
            this.uiManager.updateCombatLog("Nenhum alvo válido!");
            await this.processTurn(caster); return;
        }

        let targets = [];
        if (targetType.includes('all')) {
            targets = possibleTargets;
        } else if (possibleTargets.length === 1) {
            targets = [possibleTargets[0]];
        } else {
            const targetId = await this.waitForTargetSelection(possibleTargets);
            if (targetId) {
                targets = [this.combatants.find(c => c.id === targetId)];
            } else {
                await this.processTurn(caster); return;
            }
        }
        
        if (targets.length === 0 || !targets[0]) {
            await this.processTurn(caster); return;
        }
        
        this.uiManager.updateCombatLog(`${caster.name || 'Você'} usa ${actionDef?.name || action.type}!`);
        await new Promise(resolve => setTimeout(resolve, 300));

        for (const target of targets) {
            if (this._applyAction(caster, target, action, actionDef)) {
                this.uiManager.shakeCombatant(target.id);
            }
        }
    }
    
    _applyAction(caster, target, action, actionDef) {
        let wasHit = false;
        if (action.type === 'attack') {
            const result = this._resolveAttack(caster, target);
            if (result.hit) {
                target.hp -= result.damage;
                this.uiManager.updateCombatLog(`${target.name} sofreu ${result.damage} de dano${result.crit ? ' CRÍTICO' : ''}!`);
                wasHit = true;
            } else {
                this.uiManager.updateCombatLog(`${caster.name || 'Você'} errou o ataque contra ${target.name}!`);
            }
            return wasHit;
        }

        if (action.type === 'item' || action.type === 'skill') {
            if (caster.ep < (actionDef.cost || 0)) {
                this.uiManager.updateCombatLog(`Energia insuficiente!`);
                return false;
            }
            caster.ep -= (actionDef.cost || 0);
            return this.applyEffect(actionDef.effect, target, caster);
        }
        return false;
    }
    
    _resolveAttack(attacker, defender) {
        const hitChance = Math.max(5, Math.min(95, attacker.hit - defender.eva));
        if (Math.random() * 100 > hitChance) return { hit: false, crit: false, damage: 0 };

        let damage = Math.max(1, attacker.atk - (defender.def || 0));
        let isCrit = false;
        if (Math.random() * 100 < attacker.critChance) {
            isCrit = true;
            damage = Math.floor(damage * attacker.critMult);
        }
        if (defender.isDefending) damage = Math.floor(damage * 0.8);
        return { hit: true, crit: isCrit, damage: Math.max(1, damage) };
    }

    waitForTargetSelection(possibleTargets) {
        return new Promise(resolve => {
            this.uiManager.enableTargeting(possibleTargets, (targetId) => resolve(targetId));
        });
    }
    
    applyEffect(effect, target, caster) {
        switch (effect.action) {
            case 'restore_hp':
                target.hp = Math.min(target.maxHp, target.hp + effect.amount);
                this.uiManager.updateCombatLog(`${target.name} curou ${effect.amount} de HP!`);
                return true;
            case 'restore_ep':
                target.ep = Math.min(target.maxEp, target.ep + effect.amount);
                this.uiManager.updateCombatLog(`${target.name} restaurou ${effect.amount} de EP!`);
                return true;
            case 'damage_hp':
                const damage = Math.max(1, effect.amount - (target.def || 0));
                target.hp -= damage;
                this.uiManager.updateCombatLog(`${target.name} sofreu ${damage} de dano mágico!`);
                return true;
        }
        return false;
    }

       getEnemyAIAction(enemy) {
        // IA "Burra": sempre ataca o jogador com a vida mais baixa.
        const target = this.allies.filter(a => a.hp > 0).sort((a, b) => a.hp - b.hp)[0];
        if (!target) return { type: 'defend' }; // Se não tiver alvo, defende
        return { type: 'attack', targetType: 'ally_single' };
    }

    checkCombatStatus() {
        const aliveAllies = this.allies.filter(a => a.hp > 0).length;
        const aliveEnemies = this.enemies.filter(e => e.hp > 0).length;

        if (aliveAllies === 0) this.end('lose');
        else if (aliveEnemies === 0) this.end('win');
    }

    end(result) {
        if (!this.isRunning) return;
        this.isRunning = false;
        this.uiManager.hideCombatUI();
        this.onCombatEnd(result, this.enemies);
    }
}