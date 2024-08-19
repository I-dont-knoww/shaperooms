const pickupDistance = 30;
const invincibilityTime = 100;
const targetDistance = 800;
const reviveTime = 1000;
let playerMaxHealth = 20;
let coins = 0;
let curse = 0;
let maxCurse = 0;

class Player {
    constructor(x, y, shape, weapon, keybinds) {
        this.shape = shape;
        this.weapon = weapon;
        this.power = new NoPower();
        
        this.x = x;
        this.y = y;
        
        this.dx = 0;
        this.dy = 0;
        
        this.moveSpeed = 1 / slowness;
        this.defaultMoveSpeed = 1 / slowness;
        
        this.health = playerMaxHealth;
        this.prevHealth = 3;
        this.invincibility = false;
        
        this.pickingUp = false;
        
        this.controls = {
            [keybinds[0]]: "up",
            [keybinds[1]]: "left",
            [keybinds[2]]: "down",
            [keybinds[3]]: "right",
        };
        this.shootButton = keybinds[4];
    }
    
    update(keys) {
        // death update
        if (this.health <= 0) {
            if (mode == 0) localStorage.saveFile0 = null;
            else localStorage.saveFile1 = null;
            this.draw();
            return;
        }
        
        // aim weapon
        if (curRoom.enemies.length > 0) {
            let closestDistance = 0;
            for (let i in curRoom.enemies) {
                let enemy = curRoom.enemies[i];
                let distance1 = (this.x - enemy.x) ** 2 + (this.y - enemy.y) ** 2;
                let distance2 = (this.x - curRoom.enemies[closestDistance].x) ** 2 + (this.y - curRoom.enemies[closestDistance].y) ** 2;
                if (distance1 <= targetDistance ** 2 && distance1 < distance2) closestDistance = i;
            }

            let closestEnemy = curRoom.enemies[closestDistance];

            if ((this.x - closestEnemy.x) ** 2 + (this.y - closestEnemy.y) ** 2 <= targetDistance ** 2) {
                const screenShake = drawer.shake;
                const bulletSpeed = (this.weapon.bulletSpeed + this.power.bulletSpeed) || new this.weapon.bullet(0, 0, [], 0, this.power ? this.power : new NoPower()).speed;
                const distance = Math.sqrt((this.x - closestEnemy.x) ** 2 + (this.y - closestEnemy.y) ** 2);
                drawer.shake = screenShake;

                const timeItTakes = isFinite(distance/bulletSpeed) ? distance/bulletSpeed : 0;

                this.shape.direction = Math.atan2((closestEnemy.y + closestEnemy.dy * timeItTakes) - this.y, (closestEnemy.x + closestEnemy.dx * timeItTakes) - this.x);
            }
            else this.shape.direction = Math.atan2(this.dy, this.dx);
        }
        else this.shape.direction = Math.atan2(this.dy, this.dx);

        
        // movement update
        if (localStorage.defeatedCurseBoss == "true" && curse > 0) this.moveSpeed = this.defaultMoveSpeed * 2;
        else this.moveSpeed = this.defaultMoveSpeed;
        
        this.x += this.dx;
        this.y += this.dy;
        
        let correction = curRoom.checkBoundaries(this);
        
        this.x += this.dx * correction.x;
        this.y += this.dy * correction.y;
        
        this.dx *= correction.dx;
        this.dy *= correction.dy;
        
        this.dx *= friction;
        this.dy *= friction;
        
        this.move(keys);
        
        // pickup + update + shoot weapons
        this.weapon.update(this.power);
        if (keys[this.shootButton] && !prevKeys[this.shootButton] && curRoom.enemies.length == 0 && curRoom.waves.length == 0) {
            for (let i in curRoom.misc) {
                let curItem = curRoom.misc[i];
                
                if (!curItem.gun && !curItem.power) continue;
                
                if (curItem.gun && (curItem.x - this.x) ** 2 + (curItem.y - this.y) ** 2 <= pickupDistance ** 2) {
                    let t = curItem;
                    curRoom.misc[i] = new GunHolder(this.x, this.y, this.weapon);
                    this.weapon = t.gun;
                    this.pickingUp = true;
                    
                    setTimeout((_ => {
                        this.pickingUp = false;
                    }).bind(this), 100);
                    
                    break;
                }
                else if (curItem.power && (curItem.x - this.x) ** 2 + (curItem.y - this.y) ** 2 <= pickupDistance ** 2) {
                    if (curItem.power.oneTime) {
                        curItem.power.gotPowerup(this);
                        curItem.delete = true;
                        this.pickingUp = true;
                        
                        setTimeout((_ => {
                            this.pickingUp = false;
                        }).bind(this), 100);
                        
                        break;
                    }
                    
                    let t = curItem;
                    
                    this.power.dropPowerup(this);
                    curRoom.misc[i] = new PowerHolder(this.x, this.y, this.power);
                    this.power = t.power;
                    this.power.gotPowerup(this);
                    this.pickingUp = true;
                    
                    setTimeout((_ => {
                        this.pickingUp = false;
                    }).bind(this), 100);
                    
                    break;
                }
            }
            if (!this.pickingUp) {
                // weapon shoot
                if (keys[this.shootButton]) this.weapon.shoot(this.x, this.y, curRoom.enemies, this.shape.direction, this.power, this);
            }
        } else if (!this.pickingUp) {
            // weapon shoot
            if (keys[this.shootButton]) this.weapon.shoot(this.x, this.y, curRoom.enemies, this.shape.direction, this.power, this);
        }

        // weapon stats
        for (let i in curRoom.misc) {
            let curItem = curRoom.misc[i];

            if (!curItem.gun && !curItem.power) continue;

            if (curItem.gun && (curItem.x - this.x) ** 2 + (curItem.y - this.y) ** 2 <= pickupDistance ** 2) {
                curItem.showText();
                break;
            }
            else if (curItem.power && (curItem.x - this.x) ** 2 + (curItem.y - this.y) ** 2 <= pickupDistance ** 2) {
                curItem.showText();
                break;
            }
        }
        
        // revive players
        if (keys[this.shootButton]) {
            for (let i in curRoom.players) {
                let player = curRoom.players[i];
                if (player == this) continue;
                
                let distance = (this.x - player.x) ** 2 + (this.y - player.y) ** 2;
                
                if (player.health <= 1 && distance <= pickupDistance ** 2) player.health++;
            }
        }
        
        // health update
        if (curse == 0) maxCurse = 0;
        maxCurse = Math.max(maxCurse, curse);
        
        if (this.invincibility) this.health = this.prevHealth;
        if (this.health < this.prevHealth) {
            if (curse > 0 && curRoom.enemies.length > 0) {
                this.health = 0;
                curse = 0;
            }
            if (curRoom.generatedWaves == 1) this.health -= (this.prevHealth - this.health) * (bossDamageMultiplier - 1);
            this.invincibility = true;
            setTimeout((_ => {this.invincibility = false}).bind(this), invincibilityTime);
        }
        this.prevHealth = this.health;
        
        // display my own health & curse
        if ((mouse.x - this.x) ** 2 + (mouse.y - this.y) ** 2 <= (pickupDistance ** 2) * 2) {
            drawer.ctx.fillStyle = border;
            drawer.ctx.textAlign = "center";
            drawer.ctx.textBaseline = "middle";
            drawer.ctx.font = "20px Raleway";
            drawer.fillText("Status: " + Math.round(this.health * 10)/10 + "/" + playerMaxHealth, this.x, this.y - 30);
            
            if (curse > 0) drawer.fillText("Curse: " + curse, this.x, this.y - 50);
        }
    }
    
    move(keys) {
        let x;
        let y;
        for (let i in keys) {
            if (!keys[i]) continue;
            
            let control = this.controls[i];
            if (!control) continue;
            
            if (control == "up") {
                y = -this.moveSpeed;
            }
            else if (control == "left") {
                x = -this.moveSpeed;
            }
            else if (control == "down") {
                y = this.moveSpeed;
            }
            else if (control == "right") {
                x = this.moveSpeed;
            }
        }
        
        if (x && y) {
            this.dx += x / Math.SQRT2;
            this.dy += y / Math.SQRT2;
            return;
        }
        if (x) this.dx += x;
        if (y) this.dy += y;
    }
    
    draw() {
        this.shape.color = curse > 0 ? "#ff00ff" : "#00ffff";
        
        drawer.ctx.shadowBlur = 10;
        drawer.ctx.shadowColor = this.shape.color;
        if (this.invincibility) {
            drawer.ctx.fillStyle = background;
            drawer.fill(this.shape.draw(this.x, this.y, true));
        }
        else
            drawer.fill(this.shape.draw(this.x, this.y));
        drawer.ctx.shadowBlur = 0;
        
        let healthBar = new Bar(this.x - 30, this.y - 20, 60, 6, this.health, playerMaxHealth);
        healthBar.drawRelative();
        
        if (curse > 0) {
            let curseBar = new Bar(this.x - 30, this.y - 20, 60, 6, curse, maxCurse);
            curseBar.color1 = "#00ff00";
            curseBar.color2 = "#ff00ff";
            curseBar.drawRelative();
        }
    }
}