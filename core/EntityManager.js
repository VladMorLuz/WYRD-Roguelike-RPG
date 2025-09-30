import { getDef } from './DataManager.js'; // Adicione este import


export function preloadImages(sources) {
    const promises = sources.map(src => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(`Falha ao carregar imagem: ${src}`);
            img.src = src;
        });
    });
    return Promise.all(promises);
}

// Função para carregar os dados dos monstros do arquivo JSON
export async function loadMobData() {
    if (MOB_DEFS.length > 0) return; // Já carregou, não faz de novo
    try {
        const response = await fetch('../data/mobs.json');
        if (!response.ok) throw new Error('Network response was not ok');
        MOB_DEFS = await response.json();
        console.log("Definições de monstros carregadas:", MOB_DEFS);
    } catch (error) {
        console.error("Falha ao carregar mobs.json:", error);
    }
}
// --- FIM DO CÓDIGO NOVO ---

export class Entity {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.id = crypto.randomUUID(); // ID único para cada entidade
        this.turnMeter = 0; // Barra de ATB de cada entidade
        this.isDefending = false;
    }
}

export class Player extends Entity {
    constructor(x, y) {
        super(x, y);
        this.maxHp = 20;
        this.hp = 20;
        this.atk = 5;
        this.def = 1;
        this.speed = 5;
        this.sprite = new Image();
        this.sprite.src = 'assets/wander/player.png';
        this.battleSprite = new Image();
        this.battleSprite.src = 'assets/battle/player.png'; //
// Inventário de itens e habilidades
        this.inventory = []; 
        this.skills = [];
    }
    move(dx, dy, map) {
        const newX = this.x + dx;
        const newY = this.y + dy;
        if (map.isWalkable(newX, newY)) {
            this.x = newX;
            this.y = newY;
        }
    }
}

export class Monster extends Entity {
    constructor(id, x, y) {
        super(x, y);
        const data = getDef('mobs', id);
        if (!data) {
            console.error(`Monstro com id "${id}" não encontrado em mobs.json`);
            return;
        }
        
        this.name = data.id;
        this.maxHp = Array.isArray(data.maxHp) ? data.maxHp[0] : data.maxHp;
        this.hp = this.maxHp;
        this.atk = Array.isArray(data.atk) ? data.atk[0] : data.atk;
        this.def = Array.isArray(data.def) ? data.def[0] : data.def;
        this.speed = data.speed || 5; //
        this.sprite = new Image();
        this.sprite.src = data.spriteWander || `assets/wander/${id}.png`; //
        this.battleSprite = new Image();
        this.battleSprite.src = data.spriteBattle || `assets/battle/${id}.png`;
    }
}
