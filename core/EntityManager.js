// core/EntityManager.js
import { getDef } from './DataManager.js';

// Função auxiliar para sortear um número, usada na criação de monstros
function rollStat(stat) {
    if (Array.isArray(stat) && stat.length === 2) {
        const [min, max] = stat;
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    return stat || 0;
}

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

// CLASSE BASE PARA TODAS AS CRIATURAS
export class Entity {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.id = crypto.randomUUID();
        
        // Atributos Padrão
        this.trait = "unknown";
        this.color = "white";
        this.maxHp = 1;
        this.hp = 1;
        this.maxEp = 0;
        this.ep = 0;
        this.atk = 1;
        this.def = 0;
        this.hit = 75;  // Chance de Acerto (em %)
        this.eva = 5;   // Chance de Evasão (em %)
        this.critChance = 5; // Chance de Crítico (em %)
        this.critMult = 1.5; // Multiplicador de dano crítico
        this.speed = 5;
        this.level = 1;

        // Atributos de Combate
        this.turnMeter = 0;
        this.isDefending = false;
    }
}

// CLASSE DO JOGADOR
export class Player extends Entity {
    constructor(x, y) {
        super(x, y);

        // Atributos específicos do Jogador
        this.trait = "humanoid";
        this.color = "cyan";
        this.maxHp = 20;
        this.hp = 20;
        this.maxEp = 10;
        this.ep = 10;
        this.atk = 5;
        this.def = 1;
        this.speed = 10;
        this.level = 1;

        // Sprites
        this.sprite = new Image();
        this.sprite.src = 'assets/wander/player.png';
        this.battleSprite = new Image();
        this.battleSprite.src = 'assets/battle/player.png';

        // Inventário e Habilidades
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

// CLASSE DOS MONSTROS
export class Monster extends Entity {
    constructor(id, x, y) {
        super(x, y);
        const data = getDef('mobs', id);
        if (!data) {
            console.error(`Monstro com id "${id}" não encontrado em mobs.json`);
            return;
        }
        
        // Atributos vindos do JSON, com randomização
        this.name = data.id;
        this.trait = data.trait || "monster";
        this.color = data.color || "red";
        this.maxHp = rollStat(data.maxHp);
        this.hp = this.maxHp;
        this.maxEp = rollStat(data.maxMp); // Usando maxMp do JSON como maxEp
        this.ep = this.maxEp;
        this.atk = rollStat(data.atk);
        this.def = rollStat(data.def);
        this.hit = rollStat(data.hit);
        this.eva = rollStat(data.eva);
        this.critChance = rollStat(data.critChance);
        this.critMult = rollStat(data.critMult);
        this.speed = rollStat(data.speed);
        this.xpReward = rollStat(data.xpReward); // XP que o monstro dá

        // Sprites
        this.sprite = new Image();
        this.sprite.src = data.spriteWander || `assets/wander/${id}.png`;
        this.battleSprite = new Image();
        this.battleSprite.src = data.spriteBattle || `assets/battle/${id}.png`;
    }
}