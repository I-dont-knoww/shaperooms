const hallwayLength = 750; // 750
const roomSize = 1500; // 1500
let zoomOutSize = localStorage.zoomOutSize ? localStorage.zoomOutSize : 0.05;
let regZoom = 0.8;
let minZoom = 0.8;
let difficultyStart = 2;

let allWeapons = [TriplePowerfulSniper, RocketShotgun, ClusterBombLauncher, ExplosiveMinigun, LightShow, PowerfulSniper, HomingShotgun, MissileSniper, Minigun, LaserContinuous, AssaultSniper, AssaultShotgun, MissileLauncher, AssaultRifle, LaserShotgun, ChargeLaserPistol, Shotgun, Pistol, Sniper, LandmineShooter, RocketLauncher, LaserPistol, ChargePistol];
let weapons = [TriplePowerfulSniper, RocketShotgun, ClusterBombLauncher, ExplosiveMinigun, LightShow, PowerfulSniper, HomingShotgun, MissileSniper, Minigun, LaserContinuous, AssaultSniper, AssaultShotgun, MissileLauncher, AssaultRifle, LaserShotgun, ChargeLaserPistol, ChargePistol];
if (localStorage.defeatedCurseBoss == "true") {
    let curseBossWeapons = [RainbowMinigun, SplitterShotgun, PiercingSniper, ClusterBombBattery, ExplosiveLaserPistol, ChargeNuke, ChargeStatusPistol, ChargeLaserShotgun];
    weapons = weapons.concat(curseBossWeapons);
    allWeapons = allWeapons.concat(curseBossWeapons);
}

const allRarities = allWeapons.map(v => {
    let weapon = new v();
    return weapon.constructor.calculateRarity(weapon);
});
let rarityExponent = 2;
const rarities = weapons.map(v => {
    let weapon = new v();
    return weapon.constructor.calculateRarity(weapon);
});

const reforgerSpawnChance = 2;
const powerupMakerSpawnChance = 4;

class Dungeon {
    constructor(players, numOfRooms, numOfShops, difficulty, boss) {
        players.forEach(v => {
            v.x = 20;
            v.y = 20;
            
            v.dx = 0;
            v.dy = 0;
        });
        
        this.players = players;
        this.difficulty = difficulty;
        difficultyStart = 2;
        this.waves = 2;
        
        this.rooms = Dungeon.generate(players, numOfRooms, numOfShops);
        this.startRoom = this.rooms[this.rooms.length - 1];
        this.endRoom = this.rooms[0];
        
        this.startRoom.generatedWaves = true;
        this.startRoom.madeLootbox = true;
        this.endRoom.generatedWaves = 1;
        
        this.boss = boss;
        this.coinShape = new Polygon(~~(coins/10 + 3), 20, "#ffff00");
    }
    
    update(keys) {
        // make the zoom better
        if (curRoom.players.length > 1) {
            let drawerx = drawer.x + canvas.width/(2 * drawer.zoom);
            let drawery = drawer.y + canvas.height/(2 * drawer.zoom);
            let maxDistanceIndex = 0;
            for (let i in curRoom.players) {
                let player = curRoom.players[i];
                let maxPlayer = curRoom.players[maxDistanceIndex];

                let curDistance = (player.x - drawerx) ** 2 + (player.y - drawery) ** 2;
                let maxDistance = (maxPlayer.x - drawerx) ** 2 + (maxPlayer.y - drawery) ** 2;

                if (curDistance > maxDistance) maxDistanceIndex = i;
            }
            
            let maxPlayer = curRoom.players[maxDistanceIndex];
            let maxDistance = (maxPlayer.x - drawerx) ** 2 + (maxPlayer.y - drawery) ** 2;
            
            if (maxDistance == 0) maxDistance = 1;
            regZoom = Math.min(minZoom, 300/Math.sqrt(maxDistance));
        } else regZoom = minZoom;
        
        // draw minimap
        if (keys["y"] && curRoom.enemies.length == 0 && curRoom.waves.length == 0) drawer.zoom = zoomOutSize;
        else drawer.zoom = regZoom;
            
        this.rooms.forEach(v => {
            if (v == this.startRoom || v == this.endRoom) {
                drawer.ctx.fillStyle = v == this.startRoom ? "rgba(0, 255, 0, 0.3)" : "rgba(255, 0, 0, 0.3)";
                drawer.fillRect(v.boundary.x, v.boundary.y, v.boundary.width, v.boundary.height);
            } else if (v.generatedWaves == -1) {
                drawer.ctx.fillStyle = "rgba(255, 255, 0, 0.3)";
                drawer.fillRect(v.boundary.x, v.boundary.y, v.boundary.width, v.boundary.height);
            } else if (v.generatedWaves && v.waves.length == 0 && v.enemies.length == 0 && v.constructor != Hallway) {
                drawer.ctx.fillStyle = "rgba(0, 0, 255, 0.3)";
                drawer.fillRect(v.boundary.x, v.boundary.y, v.boundary.width, v.boundary.height);
            }
            if (!v.generatedWaves && curRoom == v && curRoom.constructor != Hallway) {
                for (var i = difficultyStart; i < (this.waves * this.difficulty) + difficultyStart; i += this.difficulty)
                    v.generateWaves(i);
                v.generatedWaves = true;
                this.waves += ~~(Math.random() * 2);
                difficultyStart += 1;
            }
            v.update(keys);
        });
        
        // summon boss
        if (curRoom == this.endRoom && curRoom.generatedWaves == 1 && curRoom.enemies == 0) {
            let x = curRoom.boundary.x + curRoom.boundary.width/2;
            let y = curRoom.boundary.y + curRoom.boundary.height/2;
            curRoom.enemies.push(new this.boss(x, y));
            curRoom.totalOpen = false;
        }
        
        if (curRoom.generatedWaves == 2) {
            curRoom.misc.push(new Portal(curRoom.boundary.x + curRoom.boundary.width/2, curRoom.boundary.y + curRoom.boundary.height/2));
            curRoom.generatedWaves = 3;
        }
        
        for (let i in this.players) {
            if (!curRoom.inRoom(this.players[i].x, this.players[i].y)) {
                requestAnimationFrame(_ => drawer.shake = 0);
                
                let oldRoom = curRoom;
                
                curRoom.players = [];
                for (let j in this.rooms) {
                    if (this.rooms[j].inRoom(this.players[i].x, this.players[i].y)) {
                        curRoom = this.rooms[j];
                        curRoom.players = this.players;
                        break;
                    }
                }
                for (let j in this.players) {
                    let xIncrease = 0;
                    let yIncrease = 0;
                    
                    if (oldRoom.constructor == Hallway && curRoom.generatedWaves !== true && curRoom.generatedWaves !== 3 && curRoom.generatedWaves !== -1) {
                        if (oldRoom.smallestEdge == "x") xIncrease = Math.sign(this.players[i].dx) * 20;
                        else if (oldRoom.smallestEdge == "y") yIncrease = Math.sign(this.players[i].dy) * 20;
                    }
                    this.players[j].x = this.players[i].x + xIncrease;
                    this.players[j].y = this.players[i].y + yIncrease;
                }
            }
        }
        
        // coins that the player has
        drawer.ctx.fillStyle = border;
        drawer.ctx.textAlign = "left";
        drawer.ctx.textBaseline = "top";
        drawer.ctx.font = "30px Raleway";
        drawer.ctx.fillText(coins, 60, 15);
        drawer.ctx.fillText("Dungeon " + curFloor, 10, 55); // dungeon you are on

        drawer.ctx.shadowBlur = 10;
        drawer.ctx.shadowColor = this.coinShape.color;
        drawer.ctx.fill(this.coinShape.draw(25, 25)); // coin shape
        this.coinShape.sides = ~~(coins/10) + 3;
        this.coinShape.direction += 0.01;
        drawer.ctx.shadowBlur = 0;
        
        if (bosses.at(-1) == CurseBoss && mode == 0 && this.boss != CurseBoss) {
            drawer.ctx.fillStyle = border;              
            drawer.ctx.textAlign = "left";
            drawer.ctx.textBaseline = "top";
            drawer.ctx.font = "30px Raleway";
            
            drawer.fillText("The curse stirs...", 10, 10);
        }
        
        if (this.boss == CurseBoss) {
            drawer.ctx.fillStyle = border;              
            drawer.ctx.textAlign = "left";
            drawer.ctx.textBaseline = "top";
            drawer.ctx.font = "30px Raleway";
            
            drawer.fillText("The curse awakens...", 10, 10);
            if (~~(Math.random() * 10) == 0) curRoom.misc.push(new CurseBossDungeonGlitchParticle(Math.random() * canvas.width, Math.random() * canvas.height   ));
        }
        
        this.players.forEach(v => v.draw());
    }
    
    static generate(players, numOfRooms, numOfShops, rooms=[new Room(players, 0, 0, roomSize, roomSize)]) {
        curRoom = rooms[0];
        let prevRandom = 5;
        
        for (var i = 0; i < numOfRooms - 1; i++) {
            let startingRoom;
            do {
                startingRoom = rooms[~~(Math.random() * rooms.length)];
            } while (!((startingRoom.constructor != Hallway && !startingRoom.open.every(v => v))) || Dungeon.noRoomsAround(rooms, startingRoom));
            
            let room;
            let done = false;
            
            while (!done) {
                done = true;
                
                let random = ~~(Math.random() * 4);
                if (random == prevRandom) random %= random + 2;

                let x = startingRoom.boundary.x;
                let y = startingRoom.boundary.y;
                let w = startingRoom.boundary.width;
                let h = startingRoom.boundary.height;

                if (random == 0) room = new Room([], x - w - hallwayLength, y, w, h);
                else if (random == 1) room = new Room([], x + w + hallwayLength, y, w, h);
                else if (random == 2) room = new Room([], x, y - w - hallwayLength, w, h);
                else room = new Room([], x, y + w + hallwayLength, w, h);
                
                rooms.forEach(v => {
                    if (v.boundary.x == room.boundary.x && v.boundary.y == room.boundary.y) done = false;
                });
                prevRandom = random;
            }
            
            rooms.unshift(new Hallway(startingRoom, room));
            rooms.unshift(room);
        }
        
        let lastRoom = rooms[0];
        prevRandom = 5;
        for (var i = 0; i < numOfShops; i++) {
            let startingRoom;
            do {
                startingRoom = rooms[~~(Math.random() * rooms.length)];
            } while (!((startingRoom.constructor != Hallway && !startingRoom.open.every(v => v))) || Dungeon.noRoomsAround(rooms, startingRoom));
            
            let room;
            let done = false;
            
            while (!done) {
                done = true;
                
                let random = ~~(Math.random() * 4);
                if (random == prevRandom) random %= random + 2;

                let x = startingRoom.boundary.x;
                let y = startingRoom.boundary.y;
                let w = startingRoom.boundary.width;
                let h = startingRoom.boundary.height;

                if (random == 0) room = new Room([], x - w - hallwayLength, y, w, h);
                else if (random == 1) room = new Room([], x + w + hallwayLength, y, w, h);
                else if (random == 2) room = new Room([], x, y - w - hallwayLength, w, h);
                else room = new Room([], x, y + w + hallwayLength, w, h);
                
                rooms.forEach(v => {
                    if (v.boundary.x == room.boundary.x && v.boundary.y == room.boundary.y) done = false;
                });
                prevRandom = random;
            }
            
            room.generatedWaves = true;
            room.misc.push(new Shop(room, weapons.map(v => new v()), rarities.map(v => v ** rarityExponent)));
            if (~~(Math.random() * reforgerSpawnChance) == 0)
                room.misc.push(new Reforger(room.boundary.x + 200, room.boundary.y + 200));
            if (~~(Math.random() * powerupMakerSpawnChance) == 0)
                room.misc.push(new PowerupMaker(room.boundary.x + room.boundary.width - 200, room.boundary.y + 200));
            
            rooms.unshift(new Hallway(startingRoom, room));
            rooms.unshift(room);
        }
        
        rooms.splice(numOfShops * 2, 1);
        rooms.unshift(lastRoom);
        
        rarityExponent = Math.max(1, rarityExponent - 0.5);
        return rooms;
    }
    
    static noRoomsAround(rooms, room) {
        let x = room.boundary.x;
        let y = room.boundary.y;
        let w = room.boundary.width;
        let h = room.boundary.height;
        
        let roomsInside = [];
        for (var i = 0; i < 4; i++) {
            let room;
            
            if (i == 0) room = new Room([], x - w - hallwayLength, y, w, h);
            else if (i == 1) room = new Room([], x + w + hallwayLength, y, w, h);
            else if (i == 2) room = new Room([], x, y - w - hallwayLength, w, h);
            else room = new Room([], x, y + w + hallwayLength, w, h);
            
            let roomInside = false;
            rooms.forEach(v => {
                if (v.boundary.x == room.boundary.x && v.boundary.y == room.boundary.y) roomInside = true;
            });
            roomsInside.push(roomInside);
        }
        
        return roomsInside.every(v => v);
    }
}