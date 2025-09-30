// core/DataManager.js

let gameData = {
    mobs: [],
    items: [],
    skills: []
};

// Função para carregar um único arquivo JSON
async function loadDataFile(key, path) {
    try {
        const response = await fetch(path);
        if (!response.ok) throw new Error(`Falha ao carregar ${path}`);
        gameData[key] = await response.json();
        console.log(`Dados de '${key}' carregados com sucesso.`);
    } catch (error) {
        console.error(error);
    }
}

// Função principal que será chamada para carregar tudo
export async function loadAllGameData() {
    await Promise.all([
        loadDataFile('mobs', 'data/mobs.json'),
        loadDataFile('items', 'data/items.json'),
        loadDataFile('skills', 'data/skills.json')
    ]);
}

// Função para pegar uma definição de item/mob pelo ID
export function getDef(type, id) {
    return gameData[type]?.find(def => def.id === id);
}