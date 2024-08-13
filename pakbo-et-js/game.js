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
    frameDelay: 5,
    state: 'idle' // Nouvel état pour gérer les animations
};

let currentScene = 'scene1.json';
let sceneData = {};
let spriteSheet = new Image();
spriteSheet.src = 'assets/lombric.png';

const platformImage = new Image();
platformImage.src = 'assets/platform.png';

const teleporterImage = new Image();
teleporterImage.src = 'assets/teleporter.png';

let backgroundImage = new Image();

const playButtonSilverImage = new Image();
playButtonSilverImage.src = 'assets/play_silver.png';

const playButtonGoldImage = new Image();
playButtonGoldImage.src = 'assets/play_gold.png';

let currentButtonImage = playButtonSilverImage;

async function loadScene(sceneFile) {
    const response = await fetch(sceneFile);
    const sceneData = await response.json();
    return sceneData;
}

function drawScene(scene) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (scene.background) {
        backgroundImage.src = scene.background;
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    }
    scene.elements.forEach(element => {
        if (element.type === 'platform') {
            drawScaledImage(platformImage, element.x, element.y, element.width, element.height);
        } else if (element.type === 'teleporter') {
            drawScaledImage(teleporterImage, element.x, element.y, element.width, element.height);
        } else {
            ctx.fillStyle = element.color;
            ctx.fillRect(element.x, element.y, element.width, element.height);
        }
    });
    drawPlayer();
}

function drawScaledImage(image, x, y, width, height) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, x, y, width, height);
    ctx.imageSmoothingEnabled = true;
}

function drawPlayer() {
    const scale = 3;
    let frameY = 0;
    let frameCountMax = 7;

    if (player.state === 'walk') {
        frameY = 1;
        frameCountMax = 8;
    } else if (player.state === 'attack') {
        frameY = 2;
        frameCountMax = 4;
    } else if (player.state === 'jump') {
        frameY = 3;
        frameCountMax = 1;
    }

    if (player.direction === 'left') {
        ctx.save();
        ctx.scale(-scale, scale);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(
            spriteSheet,
            player.frameX * player.width,
            frameY * player.height,
            player.width,
            player.height,
            -player.x / scale - player.width,
            player.y / scale,
            player.width,
            player.height
        );
        ctx.imageSmoothingEnabled = true;
        ctx.restore();
    } else {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(
            spriteSheet,
            player.frameX * player.width,
            frameY * player.height,
            player.width,
            player.height,
            player.x,
            player.y,
            player.width * scale,
            player.height * scale
        );
        ctx.imageSmoothingEnabled = true;
    }
}

function checkCollisions(scene) {
    scene.elements.forEach(element => {
        if (element.type === 'teleporter' &&
            player.x < element.x + element.width &&
            player.x + player.width * 3 > element.x &&
            player.y < element.y + element.height &&
            player.y + player.height * 3 > element.y) {
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
        player.direction = 'left';
        player.state = 'walk';
    }
    if (keys['ArrowRight']) {
        player.x += player.speed;
        player.direction = 'right';
        player.state = 'walk';
    }
    if (keys['ArrowUp'] && !player.jumping) {
        player.jumping = true;
        player.velocityY = -10;
        player.state = 'jump';
    }
    if (keys['x']) {
        player.state = 'attack';
    }

    if (player.jumping) {
        player.velocityY += player.gravity;
        player.y += player.velocityY;
        if (player.y + player.height * 3 > canvas.height) {
            player.y = canvas.height - player.height * 3;
            player.jumping = false;
            player.velocityY = 0;
            player.state = 'idle';
        }
    }

    // Update animation frame
    if (player.state === 'walk' || player.state === 'attack') {
        player.frameCount++;
        let frameCountMax = player.state === 'walk' ? 8 : 4;
        if (player.frameCount >= player.frameDelay) {
            player.frameCount = 0;
            player.frameX = (player.frameX + 1) % frameCountMax;
        }
    } else if (player.state === 'jump') {
        player.frameX = 0;
    } else {
        player.frameCount++;
        if (player.frameCount >= player.frameDelay) {
            player.frameCount = 0;
            player.frameX = (player.frameX + 1) % 7;
        }
    }
}

function drawPlayButton() {
    const buttonX = (canvas.width - currentButtonImage.width) / 2;
    const buttonY = (canvas.height - currentButtonImage.height) / 2;
    ctx.drawImage(currentButtonImage, buttonX, buttonY);
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

function startGame() {
    gameLoop();
}

function handleMouseMove(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const buttonX = (canvas.width - currentButtonImage.width) / 2;
    const buttonY = (canvas.height - currentButtonImage.height) / 2;
    if (x >= buttonX && x <= buttonX + currentButtonImage.width &&
        y >= buttonY && y <= buttonY + currentButtonImage.height) {
        currentButtonImage = playButtonGoldImage;
    } else {
        currentButtonImage = playButtonSilverImage;
    }
    drawPlayButton();
}

function handleMouseOut(event) {
    currentButtonImage = playButtonSilverImage;
    drawPlayButton();
}

playButtonSilverImage.onload = () => {
    drawPlayButton();
    canvas.addEventListener('click', (event) => {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const buttonX = (canvas.width - currentButtonImage.width) / 2;
        const buttonY = (canvas.height - currentButtonImage.height) / 2;
        if (x >= buttonX && x <= buttonX + currentButtonImage.width &&
            y >= buttonY && y <= buttonY + currentButtonImage.height) {
            startGame();
        }
    });
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseout', handleMouseOut);
};
