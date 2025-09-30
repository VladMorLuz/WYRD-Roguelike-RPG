import { TILE } from './Contants.js';
import { Monster } from './EntityManager.js';

export default class MapManager {
    constructor() {
        // Configurações da geração do mapa
        this.MIN_ROOMS = 8;
        this.MAX_ROOMS = 12;
        this.ROOM_MIN_SIZE = 6;
        this.ROOM_MAX_SIZE = 12;
    }

    generateDungeon(width, height) {
        // Inicializa o mapa com paredes
        this.width = width;
        this.height = height;
        this.tiles = Array(this.height).fill(null).map(() => Array(this.width).fill(TILE.WALL));

        const rooms = [];
        let roomCount = this._randomInt(this.MIN_ROOMS, this.MAX_ROOMS);

        for (let i = 0; i < roomCount; i++) {
            const w = this._randomInt(this.ROOM_MIN_SIZE, this.ROOM_MAX_SIZE);
            const h = this._randomInt(this.ROOM_MIN_SIZE, this.ROOM_MAX_SIZE);
            const x = this._randomInt(1, width - w - 1);
            const y = this._randomInt(1, height - h - 1);

            const newRoom = { x, y, w, h, center: { x: Math.floor(x + w / 2), y: Math.floor(y + h / 2) } };
            
            // Verifica se a nova sala colide com salas existentes
            let failed = false;
            for (const otherRoom of rooms) {
                if (this._roomsIntersect(newRoom, otherRoom)) {
                    failed = true;
                    break;
                }
            }

            if (!failed) {
                this._createRoom(newRoom);
                if (rooms.length > 0) {
                    const prevRoom = rooms[rooms.length - 1];
                    this._createCorridor(prevRoom.center, newRoom.center);
                }
                rooms.push(newRoom);
            }
        }

        const entities = [];
        // Para cada sala (exceto a primeira, onde o jogador começa)
        for (let i = 1; i < rooms.length; i++) {
            const room = rooms[i];
            // Adiciona uma chance de ter 1 a 3 monstros
            if (Math.random() < 0.8) { // 80% de chance de ter monstros na sala
                const numMonsters = this._randomInt(1, 2);
                for (let j = 0; j < numMonsters; j++) {
                    const monsterX = this._randomInt(room.x, room.x + room.w - 1);
                    const monsterY = this._randomInt(room.y, room.y + room.h - 1);
                    // Por enquanto, vamos criar só goblins
                    entities.push(new Monster('goblin', monsterX, monsterY));
                }
            }
        }
        for (const room of rooms) {
            if (Math.random() < 0.2) { // 20% de chance
                const x = this._randomInt(room.x + 1, room.x + room.w - 2);
                const y = this._randomInt(room.y + 1, room.y + room.h - 2);
                // 50/50 chance de ser baú ou estante
                this.tiles[y][x] = (Math.random() > 0.5) ? TILE.CHEST : TILE.BOOKSHELF;
            }
        }
        
        const startRoom = rooms[0];
        this.entryPoint = { x: startRoom.center.x, y: startRoom.center.y };

        return {
            tiles: this.tiles,
            width: this.width,
            height: this.height,
            startPoint: this.entryPoint,
            entities: entities,
            rooms: rooms
        };
    }

    isWalkable(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return false;
        }
        return this.tiles[y][x] === TILE.FLOOR;
    }
    
    // Funções auxiliares (privadas)
    _createRoom(room) {
        for (let y = room.y; y < room.y + room.h; y++) {
            for (let x = room.x; x < room.x + room.w; x++) {
                this.tiles[y][x] = TILE.FLOOR;
            }
        }
    }

    _createCorridor(start, end) {
        let x = start.x;
        let y = start.y;

        while (x !== end.x || y !== end.y) {
            if (x !== end.x && Math.random() > 0.5) {
                this.tiles[y][x] = TILE.FLOOR;
                x += Math.sign(end.x - x);
            } else if (y !== end.y) {
                this.tiles[y][x] = TILE.FLOOR;
                y += Math.sign(end.y - y);
            } else {
                 this.tiles[y][x] = TILE.FLOOR;
                x += Math.sign(end.x - x);
            }
        }
    }
    
    _roomsIntersect(room1, room2) {
        return (room1.x <= room2.x + room2.w &&
                room1.x + room1.w >= room2.x &&
                room1.y <= room2.y + room2.h &&
                room1.y + room1.h >= room2.y);
    }
    
    _randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}