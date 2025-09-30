// core/GameManager.js
import UIManager from './UImanager.js';
import Renderer from './Renderer.js';
import MapManager from './MapManager.js';
import { Player, Monster, loadMobData, preloadImages } from './EntityManager.js'; // Adiciona preloadImages
import InputManager from './InputManager.js';
import CombatManager from './CombatManager.js';

export default class GameManager {
    constructor(container) {
        this.container = container;
        this.gameState = 'MainMenu';
        this.uiManager = new UIManager(container);
        this.inputManager = new InputManager();
        this.mapManager = new MapManager();
        this.renderer = null;
        this.currentMap = null;
        this.player = null;
        this.entities = [];
        this.lastTime = 0;
        this.moveCooldown = 150;
        this.timeSinceMove = 0;
    }

    // ÚNICA E CORRETA VERSÃO DO 'start'
    async start() {
        console.log("Iniciando carregamento...");
        
        // Lista de imagens essenciais para o jogo começar
        const essentialAssets = [
            'assets/wander/player.png',
            'assets/wander/goblin.png',
            'assets/wander/rat.png',
            'assets/wander/skeleton.png',
            // --- CÓDIGO NOVO ---
            'assets/battle/player.png',
            'assets/battle/goblin.png',
            'assets/battle/rat.png',
            'assets/battle/skeleton.png'
        ];
        
        // Usa o Promise.all para carregar tudo em paralelo
        await Promise.all([
            loadMobData(),
            preloadImages(essentialAssets)
        ]);

        console.log("Carregamento concluído!");
        this.changeState('Playing');
    }

    // ÚNICA E CORRETA VERSÃO DO 'changeState'
    changeState(newState, data) {
        this.gameState = newState;
        console.log(`O estado do jogo mudou para: ${newState}`);

        if (this.gameState === 'Playing') {
            const { canvas } = this.uiManager.createGameUI();
            this.renderer = new Renderer(canvas);
            this.loadLevel(1);
            requestAnimationFrame(this.gameLoop.bind(this));
        }

        if (this.gameState === 'Combat') {
            // Pausa o loop de exploração
            this.combatManager = new CombatManager(
                this.uiManager,
                this.player,
                data.enemy,
                (result, enemyDefeated) => this.onCombatEnd(result, enemyDefeated)
            );
        }
    }

    onCombatEnd(result, enemyDefeated) {
        console.log(`Combate finalizado com resultado: ${result}`);
        if (result === 'win') {
            // Remove o inimigo da lista de entidades
            this.entities = this.entities.filter(e => e.id !== enemyDefeated.id);
        } else {
            // Fim de jogo
            alert("VOCÊ MORREU!");
            window.location.reload();
        }
        // Volta para o estado de exploração
        this.gameState = 'Playing';
    }

    loadLevel(levelNumber) {
        const levelData = this.mapManager.generateDungeon(50, 30);
        this.currentMap = levelData;
        const startPos = this.currentMap.startPoint;
        this.player = new Player(startPos.x, startPos.y);
        this.entities = [this.player, ...levelData.entities];
    }

    gameLoop(currentTime) {
        try {
            if (!this.lastTime) this.lastTime = currentTime;
            const deltaTime = currentTime - this.lastTime;
            this.lastTime = currentTime;

            // Só atualiza e renderiza se estiver no estado 'Playing'
            if (this.gameState === 'Playing') {
                this.update(deltaTime);
                this.render();
            }

            requestAnimationFrame(this.gameLoop.bind(this));
        } catch (e) {
            console.error("--- ERRO CRÍTICO DENTRO DO GAME LOOP ---", e);
        }
    }

    update(deltaTime) {
        this.timeSinceMove += deltaTime;
        if (this.timeSinceMove < this.moveCooldown) return;

        let dx = 0;
        let dy = 0;

        if (this.inputManager.keys.up) dy = -1;
        else if (this.inputManager.keys.down) dy = 1;
        else if (this.inputManager.keys.left) dx = -1;
        else if (this.inputManager.keys.right) dx = 1;

        if (dx !== 0 || dy !== 0) {
            this.player.move(dx, dy, this.mapManager);
            this.timeSinceMove = 0;
            this._checkForCombat();
        }
    }

    _checkForCombat() {
        for (const entity of this.entities) {
            if (entity === this.player) continue;
            if (this.player.x === entity.x && this.player.y === entity.y) {
                this.changeState('Combat', { enemy: entity });
                return;
            }
        }
    }

    render() {
        if (this.renderer) {
            this.renderer.render(this.currentMap, this.entities);
        }
    }
}