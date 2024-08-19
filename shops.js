const costMultiplier = 5;
const costBias = -80;

const curseRarity = 3;
const curseCostDecrease = 7;

const lootboxWeaponDropRate = 2;
const lootboxCoinDropRate = 5;

const reforgerUpgradeChance = 7;

const primaryColors = ["#ff0000", "#00ff00", "#0000ff"];
const darkPrimaryColors = ["#990000", "#009900", "#000099"];

const rarePowerups = [[HomingPowerup, 10], [BouncingPowerup, 10]];

class SellingWeapon {
    constructor(x, y, weapon, curse) {
        this.x = x;
        this.y = y;
        this.weapon = weapon;
        this.curse = curse;
        this.weapon.shape.direction = Math.random() * Math.PI * 2;
        this.cost = ((this.weapon.shape.sides - 2) * 10 + ~~(Math.random() * (bossIndex + 1) * 3 + 2)) * costMultiplier + costBias;
        if (this.weapon.costBias) this.cost += this.weapon.costBias;
        this.cost -= (curse * curseCostDecrease);
        this.cost = Math.max(0, this.cost);
    }
    
    draw() {
        if ((mouse.x - this.x) ** 2 + (mouse.y - this.y) ** 2 <= pickupDistance ** 2) {
            this.showText();
        }
        
        drawer.ctx.shadowBlur = 10;
        drawer.ctx.shadowColor = this.curse > 0 ? "#ff00ff" : this.weapon.shape.color;
        drawer.fill(this.weapon.shape.draw(this.x, this.y));
        drawer.ctx.shadowBlur = 0;
    }
    
    showText() {
        drawer.ctx.fillStyle = border;
        drawer.ctx.textAlign = "center";
        drawer.ctx.textBaseline = "middle";
        if (this.curse <= 0) {
            drawer.ctx.font = "20px Raleway";
            drawer.fillText(this.weapon.name, this.x, this.y - 40);
            drawer.ctx.font = "15px Raleway";
            drawer.fillText("Classification: " + this.weapon.classification, this.x, this.y - 20);
        } else {
            drawer.ctx.font = "20px Raleway";
            drawer.fillText(this.weapon.name, this.x, this.y - 60);
            drawer.ctx.font = "15px Raleway";
            drawer.fillText("Classification: " + this.weapon.classification, this.x, this.y - 40);
            drawer.ctx.font = "15px Raleway";
            drawer.fillText("Curse: " + this.curse, this.x, this.y - 20);
        }
    }
    
    check(players) {
        return players.some(v => {
            if ((v.x - this.x) ** 2 + (v.y - this.y) ** 2 <= (pickupDistance - 4) ** 2) {
                this.showText();
                return true;
            }
            return false;
        });
    }
    
    buy(players) {
        return players.some(v => {
            if ((v.x - this.x) ** 2 + (v.y - this.y) ** 2 <= (pickupDistance - 4) ** 2 && keys[v.shootButton])
                return true;
            return false;
        });
    }
}

class Shop {
    constructor(room, weapons, rarities) {
        this.x = room.boundary.x + room.boundary.width/2;
        this.y = room.boundary.y + room.boundary.height/2;
        
        room.generatedWaves = -1;
        this.room = room;
        
        this.shape = new Polygon(~~(Math.random() * 6 + 3), 30, "#ff0000");
        
        let chosenWeapons = [];
        while (chosenWeapons.length < 4) {
            let index = ~~(Math.random() * weapons.length);
            if (~~(Math.random() * rarities[index]) == 0) {
                chosenWeapons.push(weapons[index]);
                weapons.splice(index, 1);
                rarities.splice(index, 1);
            }
        }
        
        this.weapons = chosenWeapons.map((v, i) => new SellingWeapon(this.x + (i - (chosenWeapons.length - 1)/2) * 50, this.y + 40, v, ~~(Math.random() * curseRarity) == 0 ? Shop.generateCurse(v) : 0));
    }
    
    update() {
        this.draw();
        
        for (let i in this.weapons) {
            if (this.weapons[i].check(this.room.players)) {
                drawer.ctx.fillStyle = border;
                drawer.ctx.textAlign = "center";
                drawer.ctx.textBaseline = "middle";
                drawer.ctx.font = "900 20px Raleway";
                drawer.fillText(this.weapons[i].cost, this.x, this.y - 8);
                if (coins >= this.weapons[i].cost && this.weapons[i].buy(this.room.players)) {
                    curRoom.misc.push(new GunHolder(this.weapons[i].x, this.weapons[i].y, this.weapons[i].weapon));
                    curse += this.weapons[i].curse;
                    coins -= this.weapons[i].cost;
                    this.weapons.splice(i, 1);
                }
            }
        }
    }
    
    draw() {
        drawer.ctx.shadowBlur = 10;
        drawer.ctx.shadowColor = this.shape.color;
        drawer.fill(this.shape.draw(this.x, this.y - 10));
        drawer.ctx.shadowBlur = 0;
        this.weapons.forEach(v => v.draw());
    }
    
    static generateCurse(weapon) {
        return weapon.shape.sides + ~~(Math.random() * weapon.shape.sides);
    }
}

class Reforger {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        
        let color = ~~(Math.random() * primaryColors.length);
        this.size = 60;
        this.shape = new ShapeStack([new Square(this.size / 3 * 2, darkPrimaryColors[color]), new Square(this.size, primaryColors[color])]);
        this.shape.direction += Math.PI / 4;
        
        this.cost = 5;
        this.waiting = 0;
    }
    
    update() {
        this.draw();
        
        this.waiting = Math.max(this.waiting - 1, 0);
        for (let i in curRoom.players) {
            let player = curRoom.players[i];
            if ((player.x - this.x) ** 2 + (player.y - this.y) ** 2 <= this.size ** 2) {
                drawer.ctx.fillStyle = border;
                drawer.ctx.textAlign = "center";
                drawer.ctx.textBaseline = "middle";
                drawer.ctx.font = "900 20px Raleway";
                drawer.fillText(this.cost, this.x, this.y);
                if (this.waiting > 0) return;
                if (keys[player.shootButton] && !prevKeys[player.shootButton] && coins >= this.cost && player.weapon.shape.constructor != ShapeStack) {
                    // target sides = the number of sides i want for this new weapon
                    let targetSides = Math.min(player.weapon.shape.sides + Number(~~(Math.random() * reforgerUpgradeChance) == 0), localStorage.defeatedCurseBoss ? 7 : 6);
                    let newWeapon = new allWeapons[~~(Math.random() * allWeapons.length)]();
                    while (newWeapon.shape.sides != targetSides || newWeapon.constructor == player.weapon.constructor) newWeapon = new allWeapons[~~(Math.random() * allWeapons.length)]();

                    player.weapon = newWeapon;
                    curRoom.misc.unshift(new SpawnExplosion(this.x, this.y));
                    for (let i = 0; i < 20; i++) {
                        setTimeout((_ => {
                            curRoom.misc.unshift(new ReforgerExplosionParticle(this.x, this.y, Math.random() * Math.PI * 2));
                        }).bind(this), Math.random() * 50);
                    }
                    
                    coins -= this.cost;
                    this.cost *= 2;
                    this.waiting = 100;
                    return;
                }
            }
        }
    }
    
    draw() {
        drawer.ctx.shadowBlur = 10;
        drawer.ctx.shadowColor = this.shape.color;
        drawer.fill(this.shape.draw(this.x, this.y));
        drawer.ctx.shadowBlur = 0;
    }
}

class ReforgerExplosionParticle extends Explosion {
    constructor(x, y, direction) {
        super(x, y, 0, [], [0, 0], [20, 30], new Circle(10, "rgba(255, 255, 0, 1)"), "rgba(255, 255, 0, 0)");
        this.x += Math.cos(direction);
        this.y += Math.sin(direction);
        this.direction = direction;
    }
    
    update() {
        super.update();
        this.x += Math.cos(this.direction) * 10;
        this.y += Math.sin(this.direction) * 10;
    }
}

class PowerupMaker {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        
        this.shape = new Square(60, primaryColors[~~(Math.random() * primaryColors.length)]);
        this.shape.direction = Math.PI / 4;
        
        this.cost = 20;
    }
    
    update() {
        this.draw();
        for (let i in curRoom.players) {
            let player = curRoom.players[i];
            if ((player.x - this.x) ** 2 + (player.y - this.y) ** 2 <= this.shape.size ** 2) {
                drawer.ctx.fillStyle = border;
                drawer.ctx.textAlign = "center";
                drawer.ctx.textBaseline = "middle";
                drawer.ctx.font = "900 20px Raleway";
                drawer.fillText(this.cost, this.x, this.y);
                
                if (coins >= this.cost && keys[player.shootButton]) {
                    coins -= this.cost;
                    this.cost *= 2;
                    
                    let powerClasses = powers[player.weapon.classification];
                    let power = powerClasses[~~(Math.random() * powerClasses.length)];
                    
                    for (let i in rarePowerups) if (~~(Math.random() * rarePowerups[i][1]) == 0) power = rarePowerups[i][0];
                    
                    let direction = Math.random() * Math.PI * 2;
                    let distance = Math.random() * this.shape.size * 2 + this.shape.size * 1.5;
                    
                    let x = Math.max(Math.min(Math.cos(direction) * distance + this.x, curRoom.boundary.x + curRoom.boundary.width), curRoom.boundary.x);
                    let y = Math.max(Math.min(Math.sin(direction) * distance + this.y, curRoom.boundary.y + curRoom.boundary.height), curRoom.boundary.y);
                    
                    curRoom.misc.unshift(new PowerHolder(x, y, new power()));
                    
                    curRoom.misc.unshift(new SpawnExplosion(x, y));
                    for (let i = 0; i < 20; i++) {
                        setTimeout((_ => {
                            curRoom.misc.unshift(new PowerupMakerExplosionParticle(x, y, Math.random() * Math.PI * 2));
                        }).bind(this), Math.random() * 50);
                    }
                    
                    virtualKeys[player.shootButton] = false;
                    return;
                }
            }
        }
    }
    
    draw() {
        drawer.ctx.shadowBlur = 10;
        drawer.ctx.shadowColor = this.shape.color;
        drawer.fill(this.shape.draw(this.x, this.y));
        drawer.ctx.shadowBlur = 0;
    }
}

class PowerupMakerExplosionParticle extends Explosion {
    constructor(x, y, direction) {
        super(x, y, 0, [], [0, 0], [20, 30], new Circle(10, "rgba(255, 0, 0, 1)"), "rgba(255, 0, 0, 0)");
        this.x += Math.cos(direction);
        this.y += Math.sin(direction);
        this.direction = direction;
    }
    
    update() {
        super.update();
        this.x += Math.cos(this.direction) * 10;
        this.y += Math.sin(this.direction) * 10;
    }
}

class Lootbox {
    constructor(x, y, weapons, rarities) {
        this.x = x;
        this.y = y;
        this.shape = new Square(20, primaryColors[~~(Math.random() * primaryColors.length)]);
        this.shape.direction = Math.random() * Math.PI * 2
        
        let exponentated = rarities.map(v => v ** Math.max(1, (rarityExponent + 0.5) + 1));
        
        this.weapon = null;
        if (~~(Math.random() * lootboxWeaponDropRate) == 0) {
            while (!this.weapon) {
                let index = ~~(Math.random() * weapons.length);
                if (~~(Math.random() * exponentated[index]) == 0) this.weapon = weapons[index];
            }
        }
        
        curRoom.misc.push(new SpawnExplosion(this.x, this.y));
    }
    
    update() {
        if (this.delete) return;
        for (let i in curRoom.players) {
            let player = curRoom.players[i];
            if ((this.x - player.x) ** 2 + (this.y - player.y) ** 2 <= (pickupDistance ** 2) * 2) {
                this.delete = true;
                curRoom.misc.push(new SpawnExplosion(this.x, this.y));
                if (this.weapon) curRoom.misc.push(new GunHolder(this.x, this.y, new this.weapon()));
                else curRoom.dropCoins({x: this.x, y: this.y, shape: {size: 70}}, curFloor * lootboxCoinDropRate);
            }
        }
        
        this.draw();
    }
    
    draw() {
        drawer.ctx.shadowBlur = 10;
        drawer.ctx.shadowColor = this.shape.color;
        drawer.fill(this.shape.draw(this.x, this.y));
        drawer.ctx.shadowBlur = 0;
    }
}

class CoinItem {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        
        this.shape = new Circle(8, "#ffff00");
        this.timer = 0;
    }
    
    update() {
        if (this.delete) return;
        
        // anti-lag
        this.timer++;
        if (this.timer >= itemStayTime) {
            this.delete = true;
            return;
        }
        
        curRoom.players.forEach(v => {
            let distance = Math.sqrt((this.x - v.x) ** 2 + (this.y - v.y) ** 2);
            let direction = Math.atan2(v.y - this.y, v.x - this.x);
            
            this.x += Math.cos(direction) * (1000/distance);
            this.y += Math.sin(direction) * (1000/distance);
            
            if (distance <= pickupDistance * 2) {
                coins += 1;
                this.delete = true;
            }
        });
        
        this.draw();
    }
    
    draw() {
        drawer.ctx.shadowBlur = 30;
        drawer.ctx.shadowColor = this.shape.color;
        drawer.fill(this.shape.draw(this.x, this.y));
        drawer.ctx.shadowBlur = 0;
    }
}