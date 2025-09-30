// core/GameManager.js
import UIManager from './UImanager.js';
import Renderer from './Renderer.js';
import MapManager from './MapManager.js';
import { loadAllGameData, getDef } from './DataManager.js';
import { Player, Monster, preloadImages } from './EntityManager.js'; // Adiciona preloadImages
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
            loadAllGameData(), // Substitui o antigo loadMobData()
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
                data.allies,  // << CORRETO: Passando a LISTA de aliados
                data.enemies, // << CORRETO: Passando a LISTA de inimigos
                (result, enemiesDefeated) => this.onCombatEnd(result, enemiesDefeated)
            );
        }
    }

    onCombatEnd(result, enemiesDefeated) {
        console.log(`Combate finalizado com resultado: ${result}`);
        if (result === 'win') {
            const defeatedIds = enemiesDefeated.map(e => e.id);
            this.entities = this.entities.filter(e => !defeatedIds.includes(e.id));
        } else if (result === 'lose') {
            alert("VOCÊ MORREU!");
            window.location.reload();
        } else if (result === 'fled') {
            console.log("Você fugiu da batalha.");
        }
        this.gameState = 'Playing'; // Volta para a exploração
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
        const COMBAT_RADIUS = 3; // Raio de 3 tiles para puxar inimigos
        const enemiesInVicinity = [];
        let collisionEnemy = null;

        for (const entity of this.entities) {
            if (entity === this.player) continue;

            // Encontra o inimigo da colisão direta
            if (this.player.x === entity.x && this.player.y === entity.y) {
                collisionEnemy = entity;
            }
        }
        
        if (collisionEnemy) {
            // Se houve colisão, encontra todos os outros inimigos próximos
            for (const entity of this.entities) {
                if (entity === this.player) continue;
                const distance = Math.sqrt(Math.pow(collisionEnemy.x - entity.x, 2) + Math.pow(collisionEnemy.y - entity.y, 2));
                if (distance <= COMBAT_RADIUS) {
                    enemiesInVicinity.push(entity);
                }
            }
            
            // Garante que o inimigo da colisão está na lista, mesmo que seja o único
            if (!enemiesInVicinity.includes(collisionEnemy)) {
                enemiesInVicinity.push(collisionEnemy);
            }

            console.log(`${enemiesInVicinity.length} inimigos entraram em combate!`);
            this.changeState('Combat', { allies: [this.player], enemies: enemiesInVicinity });
        }
    }

    render() {
        if (this.renderer) {
            this.renderer.render(this.currentMap, this.entities);
        }
    }
}