const doorSize = 300;
let background = "#28282b";
let border = "#ffffff";

class Room {
    constructor(players, x, y, width, height) {
        this.enemies = [];
        this.misc = []; // explosions, bullets, etc.
        this.players = players;
        
        this.waves = []; // like waves of enemies
        this.sentWave = false;
        this.generatedWaves = false;
        this.madeLootbox = false;
        
        this.totalOpen = false;
        this.open = [false, false, false, false];
        this.boundary = {
            x: x,
            y: y,
            width: width,
            height: height
        };
    }
    
    getCoordinates() {
        var sumX = 0;
        var sumY = 0;
        
        for (var i in this.players) {
            sumX += this.players[i].x;
            sumY += this.players[i].y;
        }
        
        return {x: sumX/this.players.length, y: sumY/this.players.length};
    }
    
    update(keys) {
        this.draw();
        
        // loop backward because i have to delete element
        for (var i = this.misc.length - 1; i >= 0; i--) {
            this.misc[i].update();
            if (this.misc[i].delete) {
                this.misc[i].update(); // might be buggy; its here to update explosions
                this.misc.splice(i, 1); // unshift is deadly
            }
        }
        
        for (var i = this.enemies.length - 1; i >= 0; i--) {
            this.enemies[i].update();
            if (this.enemies[i].delete) {
                this.enemies[i].update();
                this.enemies.splice(i, 1);
            }
        }
        
        for (var i = this.players.length - 1; i >= 0; i--) {
            this.players[i].update(keys);
            if (this.players[i].delete) {
                this.players[i].update(keys);
                this.players.splice(i, 1);
            }
        }
        
        if (this.enemies.length == 0 && this.waves.length == 0 && this.generatedWaves === true && !this.madeLootbox) {
            this.misc.push(new Lootbox(this.boundary.x + this.boundary.width/2, this.boundary.y + this.boundary.height/2, allWeapons, allRarities));
            this.madeLootbox = true;
        }
        
        if (this.enemies.length == 0 && !this.sentWave) {
            if (this.waves.length == 0) {
                this.players.forEach(v => v.health = playerMaxHealth);
                this.totalOpen = true;
                return;
            } else {
                this.totalOpen = false;
            }
            this.sentWave = true;
            setTimeout((_ => {
                this.enemies.push(...this.waves[0]);
                this.waves.shift();
                this.sentWave = false;
            }).bind(this), 2000);
        }
    }
    
    generateWaves(difficulty) {
        // [enemy constructor, difficulty num]
        let enemies = [[MinigunMiniboss, 12], [MissileMiniboss, 9], [ShotgunMiniboss, 12], [LaserShotgunEnemy, 8], [LaserPistolEnemy, 2], [LandmineMiniboss, 9], [LandmineEnemy, 2], [AssaultRifleEnemy, 7], [AssaultShotgunEnemy, 7], [AssaultSniperEnemy, 10], [MissileLauncherEnemy, 5], [PistolEnemy, 1], [ShotgunEnemy, 2], [SniperEnemy, 2], [MissileEnemy, 2]];
        let generatedWave = [];
        while (difficulty != 0) {
            for (let i = enemies.length - 1; i >= 0; i--) {
                if (enemies[i][1] > difficulty) enemies.splice(i, 1);
            }
            
            let random = ~~(Math.random() * enemies.length);
            
            difficulty -= enemies[random][1];
            let constructor = enemies[random][0];
            
            let x;
            let y;
            
            let done = false;
            while (!done) {
                x = Math.random() * (this.boundary.width - 15 * 2) + this.boundary.x + 15;
                y = Math.random() * (this.boundary.height - 15 * 2) + this.boundary.y + 15;
                
                done = true;
                for (var i in this.players) {
                    if ((this.players[i].x - x) ** 2 + (this.players[i].y - y) ** 2 <= (targetDistance / 3) ** 2) {
                        done = false;
                        break;
                    }
                }
            }
            
            generatedWave.push(new constructor(x, y));
        }
        
        this.waves.push(generatedWave);
    }
    
    draw() {
        drawer.ctx.strokeStyle = border;
        drawer.ctx.shadowColor = drawer.ctx.strokeStyle;
        drawer.ctx.lineWidth = 10 * drawer.zoom;
        drawer.strokeRect(this.boundary.x, this.boundary.y, this.boundary.width, this.boundary.height);
        
        if (this.totalOpen) {
            let x1 = this.boundary.x;
            let y1 = this.boundary.y;
            let x2 = this.boundary.x + this.boundary.width;
            let y2 = this.boundary.y + this.boundary.height;
            
            let mx = (x1 + x2)/2;
            let my = (y1 + y2)/2;
            
            let zoom = drawer.zoom ** 0.1;
            drawer.ctx.fillStyle = background;
            if (this.open[0]) drawer.fillRect(mx - doorSize/2 + 5 / zoom, y1 - 10 / zoom, doorSize - 10 / zoom, 20 / zoom);
            if (this.open[1]) drawer.fillRect(mx - doorSize/2 + 5 / zoom, y2 - 10 / zoom, doorSize - 10 / zoom, 20 / zoom);
            if (this.open[2]) drawer.fillRect(x1 - 10 / zoom, my - doorSize/2 + 5 / zoom, 20 / zoom, doorSize - 10 / zoom);
            if (this.open[3]) drawer.fillRect(x2 - 10 / zoom, my - doorSize/2 + 5 / zoom, 20 / zoom, doorSize - 10 / zoom);
        }
    }
    
    checkBoundaries(object) {
        let tolerance = object.shape.size;
        
        let x1 = this.boundary.x;
        let y1 = this.boundary.y;
        let x2 = this.boundary.x + this.boundary.width;
        let y2 = this.boundary.y + this.boundary.height;
        
        let correction = {x: 0, y: 0, dx: 1, dy: 1};
        
        if (Math.abs(object.x - x1) <= tolerance || Math.abs(object.x - x2) <= tolerance) {
            correction.x = -1;
            correction.dx = 0;
        }
        if (Math.abs(object.y - y1) <= tolerance || Math.abs(object.y - y2) <= tolerance) {
            correction.y = -1;
            correction.dy = 0;
        }
        
        if (this.totalOpen) {
            if (this.open[0] && Math.abs(object.x - (x1 + x2)/2) <= doorSize/2 && object.y <= (y1 + y2)/2) {
                correction.y = 0;
                correction.dy = 1;
            }
            else if (this.open[1] && Math.abs(object.x - (x1 + x2)/2) <= doorSize/2 && object.y >= (y1 + y2)/2) {
                correction.y = 0;
                correction.dy = 1;
            }
            else if (this.open[2] && Math.abs(object.y - (y1 + y2)/2) <= doorSize/2 && object.x <= (x1 + x2)/2) {
                correction.x = 0;
                correction.dx = 1;
            }
            else if (this.open[3] && Math.abs(object.y - (y1 + y2)/2) <= doorSize/2 && object.x >= (x1 + x2)/2) {
                correction.x = 0;
                correction.dx = 1;
            }
        }
        
        if (!this.inRoom(object.x, object.y)) correction = {x: 0, y: 0, dx: 1, dy: 1};
        
        return correction;
    }
    
    inRoom(x, y) {
        let x1 = this.boundary.x;
        let y1 = this.boundary.y;
        let x2 = this.boundary.x + this.boundary.width;
        let y2 = this.boundary.y + this.boundary.height;
        
        if (x < x1) return false;
        if (x > x2) return false;
        if (y < y1) return false;
        if (y > y2) return false;
        
        return true;
    }
    
    dropCoins(object, howMany) {
        for (var i = 0; i < howMany; i++) {
            let distance = Math.random() * object.shape.size * 3;
            let direction = Math.random() * Math.PI * 2;
            
            let x = Math.cos(direction) * distance + object.x;
            let y = Math.sin(direction) * distance + object.y;
            
            curRoom.misc.push(new CoinItem(x, y));
        }
    }
}

class Hallway extends Room {
    constructor(room1, room2) {
        let smallestEdge;
        
        let x1; let y1;
        let x2; let y2;
        
        if (room1.boundary.x == room2.boundary.x) smallestEdge = "y";
        if (room1.boundary.y == room2.boundary.y) smallestEdge = "x";
        
        if (smallestEdge == "x") {
            if (room1.boundary.x > room2.boundary.x) {
                let t = room1;
                room1 = room2;
                room2 = t;
            }
            
            room1.open[3] = true;
            room2.open[2] = true;
            
            x1 = room1.boundary.x + room1.boundary.width;
            y1 = (room1.boundary.y * 2 + room1.boundary.height)/2 - doorSize/2;

            x2 = room2.boundary.x;
            y2 = (room1.boundary.y * 2 + room1.boundary.height)/2 + doorSize/2;
        } else {
            if (room1.boundary.y > room2.boundary.y) {
                let t = room1;
                room1 = room2;
                room2 = t;
            }
            
            room1.open[1] = true;
            room2.open[0] = true;
            
            x1 = (room1.boundary.x * 2 + room1.boundary.width)/2 - doorSize/2;
            y1 = room1.boundary.y + room1.boundary.height;
            
            x2 = (room1.boundary.x * 2 + room1.boundary.width)/2 + doorSize/2;
            y2 = room2.boundary.y;
        }
        
        super([], x1, y1, x2 - x1, y2 - y1);
        
        this.rooms = [room1, room2];
        this.smallestEdge = smallestEdge;
        this.totalOpen = true;
        this.generatedWaves = true;
        this.madeLootbox = true;
        this.open = [false, false, false, false];
    }
    
    generateWaves() {
        
    }
    
    checkBoundaries(object, tolerance) {
        let x1 = this.boundary.x;
        let y1 = this.boundary.y;
        let x2 = this.boundary.x + this.boundary.width;
        let y2 = this.boundary.y + this.boundary.height;
        
        let correction = {x: 0, y: 0, dx: 1, dy: 1};
        
        if (this.smallestEdge == "y") {
            if (object.x - object.shape.size < x1 || object.x + object.shape.size > x2) {
                correction.x = -1;
                correction.dx = 0;
            }
        }
        else if (this.smallestEdge == "x") {
            if (object.y - object.shape.size <= y1 || object.y + object.shape.size >= y2) {
                correction.y = -1;
                correction.dy = 0;
            }
        }
        
        if (!this.inRoom(object.x, object.y)) correction = {x: 0, y: 0, dx: 1, dy: 1};
        
        return correction;
    }
    
    draw() {
        let path = new Path2D();
        
        if (this.smallestEdge == "x") {
            path.moveTo(this.boundary.x, this.boundary.y);
            path.lineTo(this.boundary.x + this.boundary.width, this.boundary.y);
            
            path.moveTo(this.boundary.x, this.boundary.y + this.boundary.height);
            path.lineTo(this.boundary.x + this.boundary.width, this.boundary.y + this.boundary.height);
        }
        else if (this.smallestEdge == "y") {
            path.moveTo(this.boundary.x, this.boundary.y);
            path.lineTo(this.boundary.x, this.boundary.y + this.boundary.height);
            
            path.moveTo(this.boundary.x + this.boundary.width, this.boundary.y);
            path.lineTo(this.boundary.x + this.boundary.width, this.boundary.y + this.boundary.height);
        }
        
        drawer.ctx.strokeStyle = border;
        drawer.ctx.shadowColor = drawer.ctx.strokeStyle;
        drawer.ctx.lineWidth = 10 / (drawer.zoom ** -0.2);
        drawer.stroke(path);
    }
}