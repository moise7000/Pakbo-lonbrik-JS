const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const player = {
    x: 50,
    y: 50,
    width: 20,
    height: 40,
    color: '#00f',
    speed: 15,
    jumping: false,
    velocityY: 0,
    gravity: 0.5
};

let currentScene = 'scene1.json';
let sceneData = {};

// Charger la scène depuis un JSON
async function loadScene(sceneFile) {
    const response = await fetch(sceneFile);
    const sceneData = await response.json();
    return sceneData;
}

// Dessiner les éléments de la scène
function drawScene(scene) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    scene.elements.forEach(element => {
        ctx.fillStyle = element.color;
        ctx.fillRect(element.x, element.y, element.width, element.height);
    });
    drawPlayer();
}


function drawPlayer() {
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
}


function checkCollisions(scene) {
    scene.elements.forEach(element => {
        if (element.type === 'teleporter' &&
            player.x < element.x + element.width &&
            player.x + player.width > element.x &&
            player.y < element.y + element.height &&
            player.y + player.height > element.y) {
            currentScene = element.targetScene;
            loadSceneAndUpdate(currentScene);
        }
    });
}


async function loadSceneAndUpdate(sceneFile) {
    sceneData = await loadScene(sceneFile);
    drawScene(sceneData);
    checkCollisions(sceneData);
}


const keys = {};
document.addEventListener('keydown', (event) => {
    keys[event.key] = true;
});

document.addEventListener('keyup', (event) => {
    keys[event.key] = false;
});


function updatePlayer() {
    if (keys['ArrowLeft']) {
        player.x -= player.speed;
    }
    if (keys['ArrowRight']) {
        player.x += player.speed;
    }
    if (keys['ArrowUp'] && !player.jumping) {
        player.jumping = true;
        player.velocityY = -10;
    }

    if (player.jumping) {
        player.velocityY += player.gravity;
        player.y += player.velocityY;
        if (player.y + player.height > canvas.height) {
            player.y = canvas.height - player.height;
            player.jumping = false;
            player.velocityY = 0;
        }
    }
}


async function gameLoop() {
    await loadSceneAndUpdate(currentScene);


    function loop() {
        updatePlayer();
        drawScene(sceneData);
        checkCollisions(sceneData);
        requestAnimationFrame(loop);
    }

    loop();
}


gameLoop();
