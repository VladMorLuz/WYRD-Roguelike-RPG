// core/CombatManager.js

export default class CombatManager {
    constructor(uiManager, player, enemy, onCombatEnd) {
        this.uiManager = uiManager;
        this.player = player;
        this.enemy = enemy;
        this.onCombatEnd = onCombatEnd; // Função para chamar quando o combate acabar
        this.isPlayerTurn = true;

        this.start();
    }

    start() {
        console.log("COMBATE INICIADO!", this.player, this.enemy);
        this.uiManager.showCombatUI(this.player, this.enemy, (action) => this.handlePlayerAction(action));
    }

    handlePlayerAction(action) {
        if (!this.isPlayerTurn) return;
        this.isPlayerTurn = false; // Desativa o botão imediatamente

        if (action === 'attack') {
            const damage = Math.max(1, this.player.atk - (this.enemy.def || 0));
            this.enemy.hp -= damage;
            console.log(`Jogador ataca! ${this.enemy.name} perde ${damage} HP. Vida restante: ${this.enemy.hp}`);
            this.uiManager.updateCombatUI(this.player, this.enemy); // ATUALIZA A UI

        }
        
        this.uiManager.updateCombatLog(`Você atacou o ${this.enemy.name}!`);
        this.checkCombatStatus();
        
        // Passa o turno para o inimigo depois de um tempinho
        this.isPlayerTurn = false;
        setTimeout(() => this.enemyTurn(), 1000);
    }

    enemyTurn() {
        const damage = Math.max(1, this.enemy.atk - (this.player.def || 0));
        this.player.hp -= damage;
        console.log(`Inimigo ataca! Jogador perde ${damage} HP. Vida restante: ${this.player.hp}`);
        
        this.uiManager.updateCombatUI(this.player, this.enemy); // ATUALIZA A UI
        const playerSprite = document.querySelector('#player-combatant img');
        if (playerSprite) {
            playerSprite.classList.add('shake');
            setTimeout(() => playerSprite.classList.remove('shake'), 300);
        }

        this.checkCombatStatus();
        this.isPlayerTurn = true;
    }

    checkCombatStatus() {
        if (this.player.hp <= 0) {
            console.log("Jogador foi derrotado! GAME OVER.");
            this.end('lose');
        } else if (this.enemy.hp <= 0) {
            console.log("Inimigo derrotado! VITÓRIA!");
            this.end('win');
        }
    }

    end(result) {
        this.uiManager.hideCombatUI();
        this.onCombatEnd(result, this.enemy); // Devolve o resultado para o GameManager
    }
}