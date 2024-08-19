console.log("health boss is move stacking which makes him nigh impossible to beat after u wait 30 seconds.");

let debugMode = false;
let godMode = false;

const canvas = document.createElement("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const ctx = canvas.getContext("2d");
const drawer = new Drawer(ctx);

const letterLength = 18;

const body = document.getElementById("body");
body.appendChild(canvas);

let keys = {};
let prevKeys = {};
let virtualKeys = {};

let mouse = {x: 0, y: 0, click: false};
let prevMouse = {x: 0, y: 0, click: false};
let virtualMouse = {x: 0, y: 0, click: false};

let roomsToGenerate = localStorage.roomsToGenerate ? localStorage.roomsToGenerate : 8;
let shopsToGenerate = localStorage.shopsToGenerate ? localStorage.shopsToGenerate : 2;

let player1 = new Player(20, 20, new Triangle(15, "#00ffff"), new Pistol(), ["w", "a", "s", "d", "j"]);
let player2 = new Player(20, 20, new Square(15, "#00ffff"), new Pistol(), ["ArrowUp", "ArrowLeft", "ArrowDown", "ArrowRight", "+"]);
let playerArr;

const bosses = [CollisionBoss, ExplosionBoss, HealthBoss, LaserBoss];
// const bosses = [CurseBoss]
let bossIndex = 0;
let curFloor = 1;

let mode = 0;
let modes = ["Normal", "Endless"];

let dungeon;
let curRoom = new Room([], 0, 0, canvas.width / drawer.zoom, canvas.height / drawer.zoom);
curRoom.enemies.push(new (bosses[~~(Math.random() * bosses.length)])(curRoom.boundary.x + curRoom.boundary.width/2, curRoom.boundary.y + curRoom.boundary.height/2));
if (~~(Math.random() * 2) == 0) curRoom.enemies[0].health = 1;

const play1Button = new Button(canvas.width/14 + 30, canvas.height/20 * 6, 200, 50, "Play", "rgba(0, 0, 0, 0)", "27px monospace");
const play2Button = new Button(canvas.width/14 + 30, canvas.height/20 * 8, 200, 50, "Multiplayer", "rgba(0, 0, 0, 0)", "27px monospace");
const changeModeButton = new Button(canvas.width/14 + 30, canvas.height/20 * 10, 200, 50, "Current Mode: ", "rgba(0, 0, 0, 0)", "27px monospace");
const settingsButton = new Button(canvas.width/14 + 30, canvas.height/20 * 12, 200, 50, "Settings", "rgba(0, 0, 0, 0)", "27px monospace");

const roomsToGeneratePlus = new Button(10000, canvas.height/20 * 6, 50, 50, "+", "rgba(0, 0, 0, 0)", "27px monospace");
const roomsToGenerateMinus = new Button(10000, canvas.height/20 * 6, 50, 50, "-", "rgba(0, 0, 0, 0)", "27px monospace");

const shopsToGeneratePlus = new Button(10000, canvas.height/20 * 8, 50, 50, "+", "rgba(0, 0, 0, 0)", "27px monospace");
const shopsToGenerateMinus = new Button(10000, canvas.height/20 * 8, 50, 50, "-", "rgba(0, 0, 0, 0)", "27px monospace");

const zoomOutSizePlus = new Button(10000, canvas.height/20 * 10, 50, 50, "+", "rgba(0, 0, 0, 0)", "27px monospace");
const zoomOutSizeMinus = new Button(10000, canvas.height/20 * 10, 50, 50, "-", "rgba(0, 0, 0, 0)", "27px monospace");

const screenShakeMultiplierPlus = new Button(10000, canvas.height/20 * 12, 50, 50, "+", "rgba(0, 0, 0, 0)", "27px monospace");
const screenShakeMultiplierMinus = new Button(10000, canvas.height/20 * 12, 50, 50, "-", "rgba(0, 0, 0, 0)", "27px monospace");

const setToDefaultButton = new Button(10000, canvas.height/20 * 16, 200, 50, "Set To Default", "rgba(0, 0, 0, 0)", "27px monospace");
const antiLagButton = new Button(10000, canvas.height/20 * 14, 200, 50, "Anti-lag Mode", "rgba(0, 0, 0, 0)", "27px monospace");
const settingsOffButton = new Button(10000, canvas.height/20 * 18, 200, 50, "Back", "rgba(0, 0, 0, 0)", "27px monospace");

let settingsOn = true;

let shape1 = new Square(75, "#ff3333");
let shape2 = new Triangle(112.5, "#3333ff");

shape1.direction = Math.random() * 2;
shape2.direction = Math.random() * 2;

mainMenu();

function mainMenu() {
    if (curRoom.enemies.length >= 10) curRoom.enemies.splice(1, 1);
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    drawer.ctx.fillStyle = background;
    drawer.ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawer.ctx.fillRect(0, 0, canvas.width, canvas.height);

    keys = {...virtualKeys};
    mouse.x = (virtualMouse.x/drawer.zoom) + drawer.x;
    mouse.y = (virtualMouse.y/drawer.zoom) + drawer.y;
    mouse.click = virtualMouse.click;
    
    curRoom.update({});
    drawer.ctx.fillStyle = background;
    drawer.ctx.fillRect(canvas.width/2 - 220, 30, 440, 40);
    drawer.ctx.globalAlpha = 0.7;
    drawer.ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawer.ctx.globalAlpha = 1;
    
    drawer.ctx.shadowBlur = 10;
    drawer.ctx.shadowColor = shape1.color;
    drawer.ctx.fill(shape1.draw(canvas.width/16 + 30, canvas.height/5));
    drawer.ctx.shadowColor = shape2.color;
    drawer.ctx.fill(shape2.draw(canvas.width/16 + (12 * 27) + 30, canvas.height/5));
    
    shape1.direction += 0.01;
    shape2.direction += 0.01;
    
    drawer.ctx.shadowColor = border;
    let text = settingsOn ? "Shape Rooms" : "Settings";
    drawer.ctx.fillStyle = border;
    drawer.ctx.textAlign = "center";
    drawer.ctx.textBaseline = "middle";
    drawer.ctx.font = "600 36px monospace";

    for (let i in text) {
        drawer.ctx.fillText(text[i], ~~(canvas.width/16 + i * 27) + 30, canvas.height/20 * 4);
    }
    drawer.ctx.shadowBlur = 0;
    
    play1Button.update();
    play2Button.update();
    changeModeButton.update();
    settingsButton.update();
    
    roomsToGeneratePlus.update();
    roomsToGenerateMinus.update();
    
    shopsToGeneratePlus.update();
    shopsToGenerateMinus.update();
    
    zoomOutSizePlus.update();
    zoomOutSizeMinus.update();
    zoomOutSize = (Math.round(zoomOutSize * 1000)/1000);
    
    screenShakeMultiplierPlus.update();
    screenShakeMultiplierMinus.update();
    screenShakeMultiplier = (Math.round(screenShakeMultiplier * 1000)/1000);
    
    setToDefaultButton.update();
    antiLagButton.update();
    settingsOffButton.update();
    
    if (settingsOn) {
        roomsToGeneratePlus.x += 40;
        roomsToGenerateMinus.x += 40;
        
        shopsToGeneratePlus.x += 40;
        shopsToGenerateMinus.x += 40;
        
        zoomOutSizePlus.x += 40;
        zoomOutSizeMinus.x += 40;
        
        screenShakeMultiplierPlus.x += 40;
        screenShakeMultiplierMinus.x += 40;
        
        drawer.ctx.shadowBlur = 10;
        drawer.ctx.shadowColor = border;
        drawer.ctx.fillStyle = border;
        drawer.ctx.fillText("Rooms to Generate: " + roomsToGenerate, roomsToGenerateMinus.x + 55, canvas.height/20 * 6 + 25);
        drawer.ctx.fillText("Shops to Generate: " + shopsToGenerate, shopsToGenerateMinus.x + 55, canvas.height/20 * 8 + 25);
        drawer.ctx.fillText("Zoom Out size: " + zoomOutSize, zoomOutSizeMinus.x + 55, canvas.height/20 * 10 + 25);
        drawer.ctx.fillText("Screen Shake Multiplier: " + screenShakeMultiplier, screenShakeMultiplierMinus.x + 55, canvas.height/20 * 12 + 25);
        drawer.ctx.shadowBlur = 0;
        
        setToDefaultButton.x += 40;
        antiLagButton.x += 40;
        settingsOffButton.x += 40;
        
        changeModeButton.text = "Current Mode: " + modes[mode];
        
        if (virtualMouse.y >= play1Button.y && virtualMouse.y <= play1Button.y + play1Button.height) {
            if (virtualMouse.click) {
                curRoom.misc = null;
                curRoom.enemies = [];
                drawer.shake = 0;
                saveSettings();
                startGame(1);
                return;
            }
            play1Button.x = Math.max(canvas.width/14 + 30, Math.min(canvas.width/14 + 30 + 100, play1Button.x + 10));
        } else {
            play1Button.x = Math.max(canvas.width/14 + 30, Math.min(canvas.width/14 + 30 + 100, play1Button.x - 10));
        }

        if (virtualMouse.y >= play2Button.y && virtualMouse.y <= play2Button.y + play2Button.height) {
            if (virtualMouse.click) {
                curRoom.misc = null;
                curRoom.enemies = [];
                drawer.shake = 0;
                saveSettings();
                startGame(2);
                return;
            }
            play2Button.x = Math.max(canvas.width/14 + 30, Math.min(canvas.width/14 + 30 + 100, play2Button.x + 10));
        } else {
            play2Button.x = Math.max(canvas.width/14 + 30, Math.min(canvas.width/14 + 30 + 100, play2Button.x - 10));
        }

        if (virtualMouse.y >= settingsButton.y && virtualMouse.y <= settingsButton.y + settingsButton.height) {
            if (virtualMouse.click) {
                settingsOn = false;
                virtualMouse.click = false;
            }
            settingsButton.x = Math.max(canvas.width/14 + 30, Math.min(canvas.width/14 + 30 + 100, settingsButton.x + 10));
        } else {
            settingsButton.x = Math.max(canvas.width/14 + 30, Math.min(canvas.width/14 + 30 + 100, settingsButton.x - 10));
        }
        
        if (virtualMouse.y >= changeModeButton.y && virtualMouse.y <= changeModeButton.y + changeModeButton.height) {
            if (virtualMouse.click) {
                mode = (mode + 1) % modes.length;
                virtualMouse.click = false;
            }
            changeModeButton.x = Math.max(canvas.width/14 + 30, Math.min(canvas.width/14 + 30 + 100, changeModeButton.x + 10));
        } else {
            changeModeButton.x = Math.max(canvas.width/14 + 30, Math.min(canvas.width/14 + 30 + 100, changeModeButton.x - 10));
        }
    } else {
        play1Button.x += 40;
        play2Button.x += 40;
        changeModeButton.x += 40;
        settingsButton.x += 40;
        
        roomsToGeneratePlus.x = canvas.width/14 + 30 + 327 + roomsToGenerate.toString().length * letterLength + letterLength;
        shopsToGeneratePlus.x = canvas.width/14 + 30 + 327 + shopsToGenerate.toString().length * letterLength + letterLength;
        zoomOutSizePlus.x = canvas.width/14 + 30 + 255 + zoomOutSize.toString().length * letterLength + letterLength;
        screenShakeMultiplierPlus.x = canvas.width/14 + 30 + 412 + screenShakeMultiplier.toString().length * letterLength + letterLength;
        
        roomsToGenerateMinus.x = canvas.width/14 + 30;
        shopsToGenerateMinus.x = canvas.width/14 + 30;
        zoomOutSizeMinus.x = canvas.width/14 + 30;
        screenShakeMultiplierMinus.x = canvas.width/14 + 30;
        
        drawer.ctx.shadowBlur = 10;
        drawer.ctx.shadowColor = border;
        drawer.ctx.fillStyle = border;
        drawer.ctx.fillText("Rooms to Generate: " + roomsToGenerate, roomsToGenerateMinus.x + 55, canvas.height/20 * 6 + 25);
        drawer.ctx.fillText("Shops to Generate: " + shopsToGenerate, shopsToGenerateMinus.x + 55, canvas.height/20 * 8 + 25);
        drawer.ctx.fillText("Zoom Out Size: " + zoomOutSize, zoomOutSizeMinus.x + 55, canvas.height/20 * 10 + 25);
        drawer.ctx.fillText("Screen Shake Multiplier: " + screenShakeMultiplier, screenShakeMultiplierMinus.x + 55, canvas.height/20 * 12 + 25);
        drawer.ctx.shadowBlur = 0;
        
        if (roomsToGeneratePlus.click && !prevMouse.click) roomsToGenerate++;
        if (roomsToGeneratePlus.click && keys.Shift && !prevMouse.click) roomsToGenerate += 9;
        if (roomsToGenerateMinus.click && !prevMouse.click) roomsToGenerate--;
        if (roomsToGenerateMinus.click && keys.Shift && !prevMouse.click) roomsToGenerate -= 9;
        
        if (shopsToGeneratePlus.click && !prevMouse.click) shopsToGenerate++;
        if (shopsToGeneratePlus.click && keys.Shift && !prevMouse.click) shopsToGenerate += 9;
        if (shopsToGenerateMinus.click && !prevMouse.click) shopsToGenerate--;
        if (shopsToGenerateMinus.click && keys.Shift && !prevMouse.click) shopsToGenerate -= 9;
        
        if (zoomOutSizePlus.click && !prevMouse.click) zoomOutSize += 0.01;
        if (zoomOutSizePlus.click && keys.Shift && !prevMouse.click) zoomOutSize -= 0.005;
        if (zoomOutSizeMinus.click && !prevMouse.click) zoomOutSize -= 0.01;
        if (zoomOutSizeMinus.click && keys.Shift && !prevMouse.click) zoomOutSize += 0.005;
        
        if (screenShakeMultiplierPlus.click && !prevMouse.click) screenShakeMultiplier += 1;
        if (screenShakeMultiplierPlus.click && keys.Shift && !prevMouse.click) screenShakeMultiplier -= 0.5;
        if (screenShakeMultiplierMinus.click && !prevMouse.click) screenShakeMultiplier -= 1;
        if (screenShakeMultiplierMinus.click && keys.Shift && !prevMouse.click) screenShakeMultiplier += 0.5;
        
        if (virtualMouse.y >= settingsOffButton.y && virtualMouse.y <= settingsOffButton.y + settingsOffButton.height) {
            if (virtualMouse.click) {
                settingsOn = true;
                virtualMouse.click = false;
            }
            settingsOffButton.x = Math.max(canvas.width/14 + 30, Math.min(canvas.width/14 + 30 + 100, settingsOffButton.x + 10));
        } else {
            settingsOffButton.x = Math.max(canvas.width/14 + 30, Math.min(canvas.width/14 + 30 + 100, settingsOffButton.x - 10));
        }
        
        antiLagButton.text = "Anti-lag Mode: " + (antilag ? "ON" : "OFF");
        if (virtualMouse.y >= antiLagButton.y && virtualMouse.y <= antiLagButton.y + antiLagButton.height) {
            if (virtualMouse.click) {
                antilag = !antilag;
                virtualMouse.click = false;
            }
            antiLagButton.x = Math.max(canvas.width/14 + 30, Math.min(canvas.width/14 + 30 + 100, antiLagButton.x + 10));
        } else {
            antiLagButton.x = Math.max(canvas.width/14 + 30, Math.min(canvas.width/14 + 30 + 100, antiLagButton.x - 10));
        }
        
        if (virtualMouse.y >= setToDefaultButton.y && virtualMouse.y <= setToDefaultButton.y + setToDefaultButton.height) {
            if (virtualMouse.click) {
                roomsToGenerate = 8;
                shopsToGenerate = 2;
                zoomOutSize = 0.05;
                screenShakeMultiplier = 1;
                virtualMouse.click = false;
            }
            setToDefaultButton.x = Math.max(canvas.width/14 + 30, Math.min(canvas.width/14 + 30 + 100, setToDefaultButton.x + 10));
        } else {
            setToDefaultButton.x = Math.max(canvas.width/14 + 30, Math.min(canvas.width/14 + 30 + 100, setToDefaultButton.x - 10));
        }
    }
    
    drawer.update();
    
    prevKeys = {...keys};
    prevMouse = {...mouse};
    if (curRoom.enemies != []) requestAnimationFrame(mainMenu);
}

function startGame(players) {
    if (godMode) playerMaxHealth = Infinity;

    playerArr = players == 2 ? [player1, player2] : [player1];
    tutorialText = players == 2 ? ["P1 uses J to shoot", "P2 uses + to shoot"] : ["Press J to shoot"];
    
    dungeon = new Dungeon(playerArr, roomsToGenerate, shopsToGenerate, bossIndex + 1, bosses[bossIndex]);
    bossIndex++;
    
    if (localStorage.saveFile0 && localStorage.saveFile0 != "null" && mode == 0) {
        let codes = localStorage.saveFile0.split(";");
        curse = Number(codes[0]);
        coins = Number(codes[1]);
        playerMaxHealth = Number(codes[2]);
        roomsToGenerate = Number(codes[3]);
        shopsToGenerate = Number(codes[4]);
        curFloor = Number(codes[5]);
        bossIndex = curFloor;
        
        player1.weapon = new (new Function("return " + codes[6])())();
        player1.power = new (new Function("return " + codes[7])())();
        player1.power.gotPowerup(player1);
        
        if (codes.length > 8) {
            player2.weapon = new (new Function("return " + codes[8])())();
            player2.power = new (new Function("return " + codes[9])())();
            player2.power.gotPowerup(player2);
        }
        dungeon = new Dungeon(playerArr, roomsToGenerate, shopsToGenerate, (curFloor + 1) * 2 - 1, bosses[bossIndex - 1]);
        
        localStorage.saveFile0 = null;
        
        setTimeout(_ => {
            curRoom.misc.push(new LoadedSaveFile(playerArr[0].x, playerArr[0].y - 20));
        }, 100);
    } else if (localStorage.saveFile1 && localStorage.saveFile1 != "null" && mode == 1) {
        let codes = localStorage.saveFile1.split(";");
        curse = Number(codes[0]);
        coins = Number(codes[1]);
        playerMaxHealth = Number(codes[2]);
        roomsToGenerate = Number(codes[3]);
        shopsToGenerate = Number(codes[4]);
        curFloor = Number(codes[5]);
        bossIndex = 0;
        
        bossHealthIncrease = (~~((curFloor - 1) / 4)) * 100;
        bossDamageMultiplier = ~~(curFloor / 4) + 1;
        
        for (let i = 1; i < curFloor; i++) bosses.push(bosses.shift());
        
        player1.weapon = new (new Function("return " + codes[6])())();
        player1.power = new (new Function("return " + codes[7])())();
        player1.power.gotPowerup(player1);
        
        if (codes.length > 8) {
            player2.weapon = new (new Function("return " + codes[8])())();
            player2.power = new (new Function("return " + codes[9])())();
            player2.power.gotPowerup(player2);
        }
        dungeon = new Dungeon(playerArr, roomsToGenerate, shopsToGenerate, (curFloor + 1) * 2, bosses[bossIndex]);
        
        localStorage.saveFile1 = null;
        
        setTimeout(_ => {
            curRoom.misc.push(new LoadedSaveFile(playerArr[0].x, playerArr[0].y - 20));
        }, 100);
    }
    
    if (!localStorage.instructionsRead) {
        let tutorial = generateTutorialDungeon(playerArr);

        function tutorialUpdate() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            if (curRoom.generatedWaves == 4) {
                curRoom = dungeon.startRoom;
                draw();
                return;
            }

            drawer.ctx.fillStyle = background;
            drawer.ctx.fillRect(0, 0, canvas.width, canvas.height);

            keys = {...virtualKeys};
            mouse.x = (virtualMouse.x/drawer.zoom) + drawer.x;
            mouse.y = (virtualMouse.y/drawer.zoom) + drawer.y;
            mouse.click = virtualMouse.click;

            tutorial.update(keys);
            drawText(tutorial);

            var coordinates = curRoom.getCoordinates();

            drawer.x = coordinates.x - canvas.width/(2 * drawer.zoom);
            drawer.y = coordinates.y - canvas.height/(2 * drawer.zoom);
            drawer.update();

            prevKeys = {...keys};
            requestAnimationFrame(tutorialUpdate);
        }

        tutorialUpdate();
        localStorage.instructionsRead = true;
    } else {
        setTimeout(_ => {
            if (debugMode) generate();
        }, 100);
        draw();
    }

    function draw() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        if (curRoom.generatedWaves == 4 || bossIndex > bosses.length) {
            if (mode == 1) {
                bosses.push(bosses[0]);
                bosses.shift();
                if (bosses[0] == CollisionBoss) {
                    bossHealthIncrease += 100;
                    bossDamageMultiplier += 1;
                }
                bossIndex = 0;
            }
            if (bossIndex + 1 > bosses.length) {
                localStorage.saveFile0 = null;
                const hint = 'Beat a floor with 12 curse to get a special boss!';
                if (localStorage.beatGame == '' || !localStorage.beatGame) alert(hint);
                else alert("You win!!");
                localStorage.beatGame = 'yes';
                return;
            }
            roomsToGenerate += 2;
            shopsToGenerate += 1;
            dungeon = new Dungeon(playerArr, roomsToGenerate, shopsToGenerate, (curFloor + 1) * 2, bosses[bossIndex]);
            bossIndex++;
            curFloor++;
            if (mode == 0) {
                localStorage.saveFile0 = `${curse};${coins};${playerMaxHealth};${roomsToGenerate};${shopsToGenerate};${curFloor};${player1.weapon.constructor.name};${player1.power.constructor.name}`;
                if (players == 2) localStorage.saveFile0 += `;${player2.weapon.constructor.name};${player2.power.constructor.name}`;
            } else {
                localStorage.saveFile1 = `${curse};${coins};${playerMaxHealth};${roomsToGenerate};${shopsToGenerate};${curFloor};${player1.weapon.constructor.name};${player1.power.constructor.name}`;
                if (players == 2) localStorage.saveFile1 += `;${player2.weapon.constructor.name};${player2.power.constructor.name}`;
            }
        }
        
        drawer.ctx.fillStyle = background;
        drawer.ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawer.ctx.fillRect(0, 0, canvas.width, canvas.height);

        keys = {...virtualKeys};
        mouse.x = (virtualMouse.x/drawer.zoom) + drawer.x;
        mouse.y = (virtualMouse.y/drawer.zoom) + drawer.y;
        mouse.click = virtualMouse.click;
        dungeon.update(keys);

        var coordinates = curRoom.getCoordinates();

        drawer.x = coordinates.x - canvas.width/(2 * drawer.zoom);
        drawer.y = coordinates.y - canvas.height/(2 * drawer.zoom);
        drawer.update();

        prevKeys = {...keys};
        requestAnimationFrame(draw);
    }
}

function saveSettings() {
    localStorage.roomsToGenerate = roomsToGenerate;
    localStorage.shopsToGenerate = shopsToGenerate;
    localStorage.zoomOutSize = zoomOutSize;
    localStorage.screenShakeMultiplier = screenShakeMultiplier;
    localStorage.antilag = antilag;
    
    roomsToGenerate = Number(roomsToGenerate);
    shopsToGenerate = Number(shopsToGenerate);
    zoomOutSize = Number(zoomOutSize);
    screenShakeMultiplier = Number(screenShakeMultiplier);
}

document.addEventListener('keydown', event => virtualKeys[event.key] = true);
document.addEventListener('keyup', event => delete virtualKeys[event.key]);

document.addEventListener('mouseup', event => {
    virtualMouse.click = false;
    
    virtualMouse.x = event.x;
    virtualMouse.y = event.y;
});
document.addEventListener('mousedown', event => {
    virtualMouse.click = true;
    
    virtualMouse.x = event.x;
    virtualMouse.y = event.y;
});
document.addEventListener('mousemove', event => {
    virtualMouse.x = event.x;
    virtualMouse.y = event.y;
});

document.addEventListener('touchend', event => {
    virtualMouse.click = false;
    if (!event.touches[0]) return;
    virtualMouse.x = event.touches[0].clientX;
    virtualMouse.y = event.touches[0].clientY;
});
document.addEventListener('touchcancel', event => {
    virtualMouse.click = false;
    virtualMouse.ctrl = false;
});
document.addEventListener('touchstart', event => {
    virtualMouse.click = true;
    
    virtualMouse.x = event.touches[0].clientX;
    virtualMouse.y = event.touches[0].clientY;
});
document.addEventListener('touchmove', event => {
    virtualMouse.x = event.touches[0].clientX;
    virtualMouse.y = event.touches[0].clientY;
});

function generate() {
    curRoom.misc.push(new GunHolder(100, 100, new CollisionBossPlayerCharge(), true));
    curRoom.misc.push(new GunHolder(100, 150, new CollisionBossPlayerChargeOP(), true));
    curRoom.misc.push(new GunHolder(100, 200, new ExplosionBossPlayerLauncher(), true));
    curRoom.misc.push(new GunHolder(100, 250, new ExplosionBossPlayerLandminer(), true));
    curRoom.misc.push(new GunHolder(100, 300, new HealthBossPlayerWeapon(), true));
    curRoom.misc.push(new GunHolder(100, 350, new HealthBossPlayerHealAll(), true));
    curRoom.misc.push(new GunHolder(100, 400, new LaserBossPlayerBigLaser(), true));
    curRoom.misc.push(new GunHolder(100, 450, new LaserBossPlayerLightShow(), true));

    curRoom.misc.push(new GunHolder(150, 100, new Pistol(), true));
    curRoom.misc.push(new GunHolder(150, 150, new AssaultRifle(), true));
    curRoom.misc.push(new GunHolder(150, 200, new Minigun(), true));
    curRoom.misc.push(new GunHolder(150, 250, new ExplosiveMinigun(), true));
    curRoom.misc.push(new GunHolder(150, 300, new RainbowMinigun(), true));
    
    curRoom.misc.push(new GunHolder(200, 100, new Shotgun(), true));
    curRoom.misc.push(new GunHolder(200, 150, new AssaultShotgun(), true));
    curRoom.misc.push(new GunHolder(200, 200, new HomingShotgun(), true));
    curRoom.misc.push(new GunHolder(200, 250, new RocketShotgun(), true));
    curRoom.misc.push(new GunHolder(200, 300, new SplitterShotgun(), true));
    
    curRoom.misc.push(new GunHolder(250, 100, new Sniper(), true));
    curRoom.misc.push(new GunHolder(250, 150, new AssaultSniper(), true));
    curRoom.misc.push(new GunHolder(250, 200, new PowerfulSniper(), true));
    curRoom.misc.push(new GunHolder(250, 250, new TriplePowerfulSniper(), true));
    curRoom.misc.push(new GunHolder(250, 300, new PiercingSniper(), true));
    
    curRoom.misc.push(new GunHolder(300, 100, new RocketLauncher(), true));
    curRoom.misc.push(new GunHolder(300, 150, new MissileLauncher(), true));
    curRoom.misc.push(new GunHolder(300, 200, new MissileSniper(), true));
    curRoom.misc.push(new GunHolder(300, 250, new ClusterBombLauncher(), true));
    curRoom.misc.push(new GunHolder(300, 300, new ClusterBombBattery(), true));
    
    curRoom.misc.push(new GunHolder(350, 100, new LaserPistol(), true));
    curRoom.misc.push(new GunHolder(350, 150, new LaserShotgun(), true));
    curRoom.misc.push(new GunHolder(350, 200, new LaserContinuous(), true));
    curRoom.misc.push(new GunHolder(350, 250, new LightShow(), true));
    curRoom.misc.push(new GunHolder(350, 300, new ExplosiveLaserPistol(), true));
    
    curRoom.misc.push(new GunHolder(400, 100, new ChargePistol(), true));
    curRoom.misc.push(new GunHolder(400, 150, new ChargeLaserPistol(), true));
    curRoom.misc.push(new GunHolder(400, 200, new ChargeLaserShotgun(), true));
    curRoom.misc.push(new GunHolder(400, 250, new ChargeStatusPistol(), true));
    curRoom.misc.push(new GunHolder(400, 300, new ChargeNuke(), true));
    
    curRoom.misc.push(new GunHolder(450, 100, new LandmineShooter(), true));
    curRoom.misc.push(new GunHolder(450, 150, new AdminGun(), true));

    curRoom.misc.push(new PowerHolder(550, 100, new HealthBossPlayerPower(), true));
    curRoom.misc.push(new PowerHolder(550, 150, new LaserBossPlayerPower(), true));

    curRoom.misc.push(new PowerHolder(600, 100, new NoPower(), true));
    curRoom.misc.push(new PowerHolder(600, 150, new Health(), true));
    curRoom.misc.push(new PowerHolder(600, 200, new MoveSpeed(), true));
    curRoom.misc.push(new PowerHolder(600, 250, new HomingPowerup(), true));
    curRoom.misc.push(new PowerHolder(600, 300, new BouncingPowerup(), true));

    curRoom.misc.push(new PowerHolder(650, 100, new AssaultBulletLifespan(), true));
    curRoom.misc.push(new PowerHolder(650, 150, new AssaultBulletSpeed(), true));
    curRoom.misc.push(new PowerHolder(650, 200, new AssaultBulletDamage(), true));
    curRoom.misc.push(new PowerHolder(650, 250, new AssaultReloadSpeed(), true));

    curRoom.misc.push(new PowerHolder(700, 100, new ShotgunBulletLifespan(), true));
    curRoom.misc.push(new PowerHolder(700, 150, new ShotgunBulletSpeed(), true));
    curRoom.misc.push(new PowerHolder(700, 200, new ShotgunBulletDamage(), true));
    curRoom.misc.push(new PowerHolder(700, 250, new ShotgunReloadSpeed(), true));

    curRoom.misc.push(new PowerHolder(750, 100, new LauncherBulletLifespan(), true));
    curRoom.misc.push(new PowerHolder(750, 150, new LauncherBulletSpeed(), true));
    curRoom.misc.push(new PowerHolder(750, 200, new LauncherBulletDamage(), true));
    curRoom.misc.push(new PowerHolder(750, 250, new LauncherReloadSpeed(), true));
    
    curRoom.misc.push(new PowerHolder(800, 100, new SniperBulletLifespan(), true));
    curRoom.misc.push(new PowerHolder(800, 150, new SniperBulletSpeed(), true));
    curRoom.misc.push(new PowerHolder(800, 200, new SniperBulletDamage(), true));
    curRoom.misc.push(new PowerHolder(800, 250, new SniperReloadSpeed(), true));

    curRoom.misc.push(new PowerHolder(850, 100, new MiscBulletLifespan(), true));
    curRoom.misc.push(new PowerHolder(850, 150, new MiscBulletSpeed(), true));
    curRoom.misc.push(new PowerHolder(850, 200, new MiscBulletDamage(), true));
    curRoom.misc.push(new PowerHolder(850, 250, new MiscReloadSpeed(), true));
}