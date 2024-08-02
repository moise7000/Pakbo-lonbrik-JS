const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const player = {
    x: 50,
    y: 50,
    width: 16,
    height: 16,
    color: '#00f',
    speed: 5,
    jumping: false,
    velocityY: 0,
    gravity: 0.5,
    direction: 'right',
    frameX: 0,
    frameY: 0,
    frameCount: 0,
    frameDelay: 5
};

let currentScene = 'scene1.json';
let sceneData = {};
let spriteSheet = new Image();
spriteSheet.src = 'assets/sprites.png'; // Assurez-vous que ce fichier existe

// Charger la scène depuis un fichier JSON
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

// Dessiner le joueur
function drawPlayer() {
    if (player.direction === 'left') {
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(
            spriteSheet,
            player.frameX * player.width,
            player.frameY * player.height,
            player.width,
            player.height,
            -player.x - player.width,
            player.y,
            player.width,
            player.height
        );
        ctx.restore();
    } else {
        ctx.drawImage(
            spriteSheet,
            player.frameX * player.width,
            player.frameY * player.height,
            player.width,
            player.height,
            player.x,
            player.y,
            player.width,
            player.height
        );
    }
}

// Vérifier les collisions
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

// Charger la scène et mettre à jour l'affichage
async function loadSceneAndUpdate(sceneFile) {
    sceneData = await loadScene(sceneFile);
    drawScene(sceneData);
    checkCollisions(sceneData);
}

// Gérer les contrôles du joueur
const keys = {};
document.addEventListener('keydown', (event) => {
    keys[event.key] = true;
});

document.addEventListener('keyup', (event) => {
    keys[event.key] = false;
});

// Mettre à jour la position du joueur
function updatePlayer() {
    if (keys['ArrowLeft']) {
        player.x -= player.speed;
        player.direction = 'left';
    }
    if (keys['ArrowRight']) {
        player.x += player.speed;
        player.direction = 'right';
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

    // Update animation frame
    if (keys['ArrowLeft'] || keys['ArrowRight']) {
        player.frameCount++;
        if (player.frameCount >= player.frameDelay) {
            player.frameCount = 0;
            player.frameX = (player.frameX + 1) % 4; // Assuming 4 frames per row
        }
    } else {
        player.frameX = 0; // Reset to idle frame when not moving
    }
}

// Fonction principale du jeu
async function gameLoop() {
    await loadSceneAndUpdate(currentScene);

    // Boucle de jeu
    function loop() {
        updatePlayer();
        drawScene(sceneData);
        checkCollisions(sceneData);
        requestAnimationFrame(loop);
    }

    loop();
}

// Démarrer le jeu
gameLoop();
