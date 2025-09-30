// core/GameManager.js
import { TILE } from './Contants.js';
import UIManager from './UImanager.js';
import Renderer from './Renderer.js';
import MapManager from './MapManager.js';
import { loadAllGameData, getDef } from './DataManager.js';
import { Player, preloadImages } from './EntityManager.js';
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
        this.combatManager = null;
        this.currentMap = null;
        this.player = null;
        this.entities = [];
        this.lastTime = 0;
        this.moveCooldown = 150;
        this.timeSinceMove = 0;
    }

    async start() {
        console.log("Iniciando carregamento...");
        const essentialAssets = [
            'assets/wander/player.png', 'assets/wander/goblin.png', 'assets/wander/rat.png', 'assets/wander/skeleton.png',
            'assets/battle/player.png', 'assets/battle/goblin.png', 'assets/battle/rat.png', 'assets/battle/skeleton.png',
            'assets/player-portrait.png'
        ];
        
        await Promise.all([
            loadAllGameData(),
            preloadImages(essentialAssets)
        ]);

        console.log("Carregamento concluído!");
        this.changeState('Playing');
    }

    changeState(newState, data) {
        this.gameState = newState;
        console.log(`O estado do jogo mudou para: ${newState}`);

        if (this.gameState === 'Playing') {
            // Se estamos voltando do combate, não precisa recriar a UI
            if (!this.renderer) {
                const { canvas } = this.uiManager.createGameUI();
                this.renderer = new Renderer(canvas);
                this.loadLevel(1);
                requestAnimationFrame(this.gameLoop.bind(this));
            }
        }

        if (this.gameState === 'Combat') {
            this.combatManager = new CombatManager(
                this.uiManager,
                data.allies,
                data.enemies,
                (result, enemiesDefeated) => this.onCombatEnd(result, enemiesDefeated)
            );
        }
    }

    onCombatEnd(result, enemiesDefeated) {
        this.combatManager = null; // Limpa o gerenciador de combate
        console.log(`Combate finalizado com resultado: ${result}`);
        if (result === 'win') {
            const defeatedIds = enemiesDefeated.map(e => e.id);
            this.entities = this.entities.filter(e => !defeatedIds.includes(e.id));
            this.uiManager.log("Você venceu a batalha!");
        } else if (result === 'lose') {
            alert("VOCÊ MORREU!");
            window.location.reload();
        } else if (result === 'fled') {
            this.uiManager.log("Você fugiu da batalha.");
        }
        this.changeState('Playing');
    }

    loadLevel(levelNumber) {
        const levelData = this.mapManager.generateDungeon(50, 30);
        this.currentMap = levelData;
        this.currentMap.floorNumber = levelNumber; // Adiciona o número do andar

        const startPos = this.currentMap.startPoint;
        this.player = new Player(startPos.x, startPos.y);
        
        // Exemplo: Adiciona skills iniciais ao jogador a partir do JSON
        const startingSkill = getDef('skills', 'fireball');
        if(startingSkill) this.player.skills.push(startingSkill);

        this.entities = [this.player, ...levelData.entities];
        this.uiManager.log(`Bem-vindo ao Andar ${levelNumber}.`);
    }

    gameLoop(currentTime) {
        try {
            if (!this.lastTime) this.lastTime = currentTime;
            const deltaTime = currentTime - this.lastTime;
            this.lastTime = currentTime;

            if (this.gameState === 'Playing') {
                this.update(deltaTime);
                this.render();
            }

            // Atualiza a UI lateral independentemente do estado do jogo
            this.uiManager.update(this.player, this.currentMap?.floorNumber);

            requestAnimationFrame(this.gameLoop.bind(this));
        } catch (e) {
            console.error("--- ERRO CRÍTICO DENTRO DO GAME LOOP ---", e);
        }
    }

    update(deltaTime) {
        this.timeSinceMove += deltaTime;
        if (this.timeSinceMove >= this.moveCooldown) {
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
        this._checkForInteraction();
    }

    _checkForInteraction() {
        if (!this.inputManager.keys.action) return;
        this.inputManager.keys.action = false; // Consome a ação para evitar repetição

        const p = this.player;
        const surroundingTiles = [
            { x: p.x, y: p.y - 1 }, { x: p.x, y: p.y + 1 },
            { x: p.x - 1, y: p.y }, { x: p.x + 1, y: p.y }
        ];

        for (const tilePos of surroundingTiles) {
            const tile = this.mapManager.tiles[tilePos.y]?.[tilePos.x];
            if (tile === TILE.CHEST) {
                const item = getDef('items', 'potion_heal');
                if (item) {
                    this.player.inventory.push(item);
                    this.mapManager.tiles[tilePos.y][tilePos.x] = TILE.FLOOR;
                    this.uiManager.log(`Você encontrou: ${item.name}!`);
                }
                return;
            }
            if (tile === TILE.BOOKSHELF) {
                const skill = getDef('skills', 'heal_light');
                if (skill && !this.player.skills.find(s => s.id === skill.id)) {
                    this.player.skills.push(skill);
                    this.mapManager.tiles[tilePos.y][tilePos.x] = TILE.FLOOR;
                    this.uiManager.log(`Você aprendeu: ${skill.name}!`);
                } else if (skill) {
                    this.uiManager.log("Você já conhece esta habilidade.");
                }
                return;
            }
        }
    }

    _checkForCombat() {
        const COMBAT_RADIUS = 3;
        const enemiesInVicinity = [];
        let collisionEnemy = null;

        for (const entity of this.entities) {
            if (entity === this.player) continue;
            if (this.player.x === entity.x && this.player.y === entity.y) {
                collisionEnemy = entity;
                break; // Achamos a colisão, podemos parar
            }
        }
        
        if (collisionEnemy) {
            for (const entity of this.entities) {
                if (entity === this.player || entity.hp <= 0) continue; // Ignora jogador e mortos
                const distance = Math.sqrt(Math.pow(collisionEnemy.x - entity.x, 2) + Math.pow(collisionEnemy.y - entity.y, 2));
                if (distance <= COMBAT_RADIUS) {
                    enemiesInVicinity.push(entity);
                }
            }
            
            if (!enemiesInVicinity.includes(collisionEnemy)) {
                enemiesInVicinity.push(collisionEnemy);
            }

            this.uiManager.log(`${enemiesInVicinity.length} inimigos se aproximam!`);
            this.changeState('Combat', { allies: [this.player], enemies: enemiesInVicinity });
        }
    }

    render() {
        if (this.renderer) {
            this.renderer.render(this.currentMap, this.entities);
        }
    }
}