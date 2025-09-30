import { TILE_SIZE, TILE } from './Contants.js';

export default class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.pixelRatio = window.devicePixelRatio || 1;
        this.resize();
        window.addEventListener('resize', () => this.resize(), { passive: true });

        // Cores do nosso mapa
        this.colors = {
            [TILE.FLOOR]: '#2b2b2b',
            [TILE.WALL]: '#444',
            [TILE.CHEST]: '#f59e0b',    
            [TILE.BOOKSHELF]: '#a855f7'
        };
    }

    resize() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * this.pixelRatio;
        this.canvas.height = rect.height * this.pixelRatio;
        this.ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
        this.ctx.imageSmoothingEnabled = false;
    }

    // A FUNÇÃO PRINCIPAL DE DESENHO
    render(map, entities) {
       // console.log("Renderer.render chamado com:", { map, entities }); // <--- ADICIONE ESTA LINHA

        this.clear();
        // --- CHECAGENS DE SEGURANÇA ---
        if (!map) {
            console.error("Renderer Falhou: O objeto 'map' é inválido.", map);
            return;
        }
        if (!entities || !Array.isArray(entities) || entities.length === 0) {
            console.error("Renderer Falhou: A lista 'entities' é inválida ou está vazia.", entities);
            return;
        }
        
        const player = entities[0]; // O jogador deve ser o primeiro da lista
        if (!player || typeof player.x !== 'number' || typeof player.y !== 'number') {
            console.error("Renderer Falhou: O jogador (entities[0]) não é uma entidade válida.", player);
            return;
        }
        // --- FIM DAS CHECAGENS ---

        const camera = this._calculateCameraOffset(map, player);

        this._drawMap(map, camera);
        
        for (const entity of entities) {
            this._drawEntity(entity, camera);
        }
    }
    // Renomeia a função _drawPlayer para uma _drawEntity mais genérica
    _drawEntity(entity, camera) {
        // ADICIONE ESTE BLOCO DE CÓDIGO AQUI
        if (!entity.sprite) {
            console.warn("Entidade não tem sprite:", entity);
            return;
        }
        if (!entity.sprite.complete) {
            console.warn(`Sprite para '${entity.name || 'player'}' ainda não carregou.`);
            return; // NÃO TENTA DESENHAR SE NÃO ESTIVER PRONTO
        }
        // FIM DO BLOCO NOVO

        if (entity.sprite && entity.sprite.complete) {
            this.ctx.drawImage(
                entity.sprite,
                Math.floor(camera.x + entity.x * TILE_SIZE),
                Math.floor(camera.y + entity.y * TILE_SIZE),
                TILE_SIZE,
                TILE_SIZE
            );
        }
    }

    _calculateCameraOffset(map, player) {
        const canvasWidth = this.canvas.width / this.pixelRatio;
        const canvasHeight = this.canvas.height / this.pixelRatio;
        
        // Centraliza a câmera no jogador
        let camX = canvasWidth / 2 - player.x * TILE_SIZE;
        let camY = canvasHeight / 2 - player.y * TILE_SIZE;

        // Limites da câmera para não mostrar fora do mapa
        const mapWidthPx = map.width * TILE_SIZE;
        const mapHeightPx = map.height * TILE_SIZE;
        camX = Math.min(0, Math.max(canvasWidth - mapWidthPx, camX));
        camY = Math.min(0, Math.max(canvasHeight - mapHeightPx, camY));
        
        return { x: camX, y: camY };
    }

    _drawMap(map, camera) {
        for (let y = 0; y < map.height; y++) {
            for (let x = 0; x < map.width; x++) {
                const tileType = map.tiles[y][x];
                if (this.colors[tileType]) {
                    this.ctx.fillStyle = this.colors[tileType];
                    this.ctx.fillRect(
                        Math.floor(camera.x + x * TILE_SIZE),
                        Math.floor(camera.y + y * TILE_SIZE),
                        TILE_SIZE,
                        TILE_SIZE
                    );
                }
            }
        }
    }

    clear() {
        const width = this.canvas.width / this.pixelRatio;
        const height = this.canvas.height / this.pixelRatio;
        this.ctx.fillStyle = '#111217';
        this.ctx.fillRect(0, 0, width, height);
    }
}