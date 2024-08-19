let summonedWeapon = false;
let summonedPower = false;
let tutorialText;

class TutorialBoss extends MissileLauncherEnemy {
    constructor(x, y) {
        super(x, y);
        this.health = 15;
        this.maxHealth = 15;
        this.prevHealth = 15;
    }
    
    update() {
        if (this.delete) curRoom.generatedWaves = 2;
        super.update();
    }
}

function drawText(tutorialDungeon) {
    tutorialDungeon.players.forEach(v => {
        if (v.health <= 0) v.health = 1;
    });
    
    dropRateMultiplier = 100000000000000000;
    
    drawer.ctx.fillStyle = border;
    drawer.ctx.textAlign = "left";
    drawer.ctx.textBaseline = "top";
    drawer.ctx.font = "30px Raleway";
    
    if (tutorialDungeon.players.length == 2) {
        drawer.fillText("Player 1 uses WASD to move.", 10, 10);
        drawer.fillText("Player 2 uses 8456 to move.", 10, 40);
        drawer.fillText("Hold Y to open the minimap.", 10, 70);
    } else {
        drawer.fillText("Use WASD to move", 10, 10);
        drawer.fillText("Hold Y to open the minimap", 10, 40);
    }
    
    let endRoom = tutorialDungeon.endRoom;
    drawer.ctx.textAlign = "center";
    drawer.ctx.textBaseline = "middle";
    drawer.ctx.font = "30px Raleway";
    drawer.fillText("Defeat the boss to finish this dungeon!", endRoom.boundary.x + endRoom.boundary.width/2, endRoom.boundary.y + endRoom.boundary.height/2);
    
    for (var i in tutorialDungeon.rooms) {
        let room = tutorialDungeon.rooms[i];
        if (room.generatedWaves == -1) {
            drawer.fillText("This is a shop! Shops offer weapons that can be bought.", room.boundary.x + room.boundary.width/2, room.boundary.y + room.boundary.height/2 - 190);
            drawer.fillText("Your coins show up on the top-left corner on your screen.", room.boundary.x + room.boundary.width/2, room.boundary.y + room.boundary.height/2 - 160);
            drawer.fillText("To buy an item, just move onto the weapon in question", room.boundary.x + room.boundary.width/2, room.boundary.y + room.boundary.height/2 - 130);
            drawer.fillText("Press the shoot button to buy the weapon", room.boundary.x + room.boundary.width/2, room.boundary.y + room.boundary.height/2 - 100);
            
            coins = 150;
        }
        
        if ((room.generatedWaves === false || room.generatedWaves === true) && room != tutorialDungeon.startRoom && room.constructor != Hallway) {
            for (var i in tutorialText)
                drawer.fillText(tutorialText[i], room.boundary.x + room.boundary.width/2, room.boundary.y + room.boundary.height/2 - (tutorialText.length * 30 + 30) + (i * 30));
            if (room.generatedWaves === true && room.enemies.length == 0 && room.waves.length == 0 && room != tutorialDungeon.startRoom) {
                if (!summonedWeapon) {
                    setTimeout(_ => {
                        tutorialText = ["This is a weapon. Weapons come in all kinds of different shapes.",
                                        "The more sides a weapon has, the better it is.",
                                        "Different colors means different types of weapons.",
                                        "Put your mouse over items to find out more about them.",
                                        "You may only hold one weapon.",
                                        "Press the shoot button to equip this weapon.",
                                        "v            "];
                        room.misc.push(new GunHolder(room.boundary.x + room.boundary.width/2 - 50, room.boundary.y + room.boundary.height/2, new RocketLauncher()));
                    }, 0);
                    summonedWeapon = true;
                }
                if (!summonedPower) {
                    setTimeout(_ => {
                        tutorialText = ["This is a powerup. You may only hold one powerup on you.",
                                        "Powerups spin, and weapons don't. Thats how you tell them apart.",
                                        "Different sides on a powerup means that they buff.",
                                        "a different attribute of a weapon. Different colors.",
                                        "means that the power buffs different types of weapons.",
                                        "Press the shoot button to equip this powerup.",
                                        "v"];
                        room.misc.push(new PowerHolder(room.boundary.x + room.boundary.width/2, room.boundary.y + room.boundary.height/2, new SniperBulletDamage()));
                    }, 9000);
                    setTimeout(_ => {
                        tutorialText = ["There is one very important powerup: the pink square",
                                        "The pink square upgrades your health by one pernamently",
                                        "It's the only way you can buff yourself pernamently",
                                        "Enemies may sometimes drop this.",
                                        "            v"];
                        room.misc.push(new PowerHolder(room.boundary.x + room.boundary.width/2 + 50, room.boundary.y + room.boundary.height/2, new Health()));
                    }, 18000);
                    summonedPower = true;
                }
            }
        }
    }
}

function generateTutorialDungeon(playerArr) {
    let tutorialDungeon = new Dungeon(playerArr, 2, 1, 1, TutorialBoss);
    
    for (let i in tutorialDungeon.rooms) {
        if (tutorialDungeon.rooms[i].misc.length > 0) {
            tutorialDungeon.rooms[i].misc[0].weapons.forEach(v => {
                v.curse = 0;
            });
            break;
        }
    }
    
    tutorialDungeon.endRoom.generatedWaves = false;
    let startingRoom = tutorialDungeon.endRoom;
    
    let done = false;
    while (!done) {
        done = true;

        let random = ~~(Math.random() * 4);

        let x = startingRoom.boundary.x;
        let y = startingRoom.boundary.y;
        let w = startingRoom.boundary.width;
        let h = startingRoom.boundary.height;

        if (random == 0) room = new Room([], x - w - hallwayLength, y, w, h);
        else if (random == 1) room = new Room([], x + w + hallwayLength, y, w, h);
        else if (random == 2) room = new Room([], x, y - w - hallwayLength, w, h);
        else room = new Room([], x, y + w + hallwayLength, w, h);

        tutorialDungeon.rooms.forEach(v => {
            if (v.boundary.x == room.boundary.x && v.boundary.y == room.boundary.y) done = false;
        });
    }
    tutorialDungeon.rooms.unshift(new Hallway(startingRoom, room));
    tutorialDungeon.rooms.unshift(room);
    
    tutorialDungeon.endRoom = room;
    tutorialDungeon.endRoom.generatedWaves = 1;
    
    tutorialDungeon.rooms.forEach(v => v.madeLootbox = true);
    
    return tutorialDungeon;
}