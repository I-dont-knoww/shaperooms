const weaponDropRate = 5;
const powerDropRate = 10;
const extraHealthDropRate = 5;

const spawnWithPower = 5;

let dropRateMultiplier = 1;

class Enemy {
    constructor(x, y, speed, friction, weapon, health, shape, ai, rareDrops=[]) {
        this.x = x;
        this.y = y;
        
        this.dx = 0;
        this.dy = 0;
        
        this.speed = (speed / slowness) * (1.5 ** 2);
        this.friction = friction;
        
        this.weapon = weapon;
        this.shootOffset = (Math.random() + 0.5);
        this.shootDelay = 0;
        this.rareDrops = rareDrops;
        
        this.power = ~~(Math.random() * spawnWithPower) == 0 ? Enemy.generatePower(this.weapon) : null;
        
        this.health = health;
        this.prevHealth = health;
        this.maxHealth = health;
        this.invincibility = false;
        
        this.shape = shape;
        if (this.power) {
            this.shape.size += 5;
            let newShape = new ShapeStack([new Polygon(this.power.shape.sides, this.shape.size * 1/2, this.shape.color.replaceAll("f", "a")), this.shape]);
            this.shape = newShape;
        }
        this.ai = ai;
        this.controls = {
            w: "up",
            a: "left",
            s: "down",
            d: "right",
        };
        
        this.exploded = false;

        const screenShake = drawer.shake;
        this.bulletSpeed = new this.weapon.bullet(0, 0, [], 0, this.power ? this.power : new NoPower()).speed;
        drawer.shake = screenShake;
    }
    
    update() {
        if (this.delete) {
            // remove a curse
            curse = Math.max(0, curse - 1);
            
            // coins added based on max health
            let coinsDropped = ~~(Math.random() * this.maxHealth/2);
            curRoom.dropCoins(this, coinsDropped);
            
            if (~~(Math.random() * powerDropRate * dropRateMultiplier) == 0 && !this.power) {
                let x = Math.random() * 30 - 15;
                let y = Math.random() * 30 - 15;
                
                let constructor = powers[this.weapon.classification][~~(Math.random() * 4)];
                curRoom.misc.push(new PowerHolder(this.x + x, this.y + y, new constructor()));
            }
            if (this.power && ~~(Math.random() * weaponDropRate * dropRateMultiplier) == 0) {
                let x = Math.random() * 30 - 15;
                let y = Math.random() * 30 - 15;
                
                curRoom.misc.push(new PowerHolder(this.x + x, this.y + y, new this.power.constructor()));
            }
            
            let weaponDropped = false;
            for (var i in this.rareDrops) {
                if (~~(Math.random() * this.rareDrops[i][0] * dropRateMultiplier) == 0) {
                    let x = Math.random() * 30 - 15;
                    let y = Math.random() * 30 - 15;
                    
                    let item = new this.rareDrops[i][1]();
                    
                    if (item.isPower)
                        curRoom.misc.push(new PowerHolder(this.x + x, this.y + y, item));
                    else
                        curRoom.misc.push(new GunHolder(this.x + x, this.y + y, item));
                    weaponDropped = true;
                    break;
                }
            }
            if (!weaponDropped && ~~(Math.random() * weaponDropRate * dropRateMultiplier) == 0) {
                let x = Math.random() * 30 - 15;
                let y = Math.random() * 30 - 15;
                
                curRoom.misc.push(new GunHolder(this.x + x, this.y + y, new this.weapon.constructor()));
            }
            if (~~(Math.random() * extraHealthDropRate * dropRateMultiplier) == 0) {
                let x = Math.random() * 30 - 15;
                let y = Math.random() * 30 - 15;
                
                curRoom.misc.push(new PowerHolder(this.x + x, this.y + y, new Health()));
            }
        }
        
        // explode when spawn
        if (!this.exploded) {
            curRoom.misc.push(new SpawnExplosion(this.x, this.y));
            this.exploded = true;
        }
        
        // aim weapon
        let closestEnemy;
        if (curRoom.players.length > 0) {
            var closestDistance = 0;
            for (var i in curRoom.players) {
                var enemy = curRoom.players[i];
                var distance1 = (this.x - enemy.x) ** 2 + (this.y - enemy.y) ** 2;
                var distance2 = (this.x - curRoom.players[closestDistance].x) ** 2 + (this.y - curRoom.players[closestDistance].y) ** 2;
                if (distance1 <= targetDistance ** 2 && distance1 < distance2) closestDistance = i;
            }

            closestEnemy = curRoom.players[closestDistance];

            if ((this.x - closestEnemy.x) ** 2 + (this.y - closestEnemy.y) ** 2 <= targetDistance ** 2) {
                const bulletSpeed = this.bulletSpeed;
                const distance = Math.sqrt((this.x - closestEnemy.x) ** 2 + (this.y - closestEnemy.y) ** 2);

                const timeItTakes = isFinite(distance/bulletSpeed) ? distance/bulletSpeed * this.shootOffset : 0;

                this.shape.direction = Math.atan2((closestEnemy.y + closestEnemy.dy * timeItTakes) - this.y, (closestEnemy.x + closestEnemy.dx * timeItTakes) - this.x);
            }
            else {
                closestEnemy = null;
                this.shape.direction = Math.atan2(this.dy, this.dx);
            }
        }
        else this.shape.direction = Math.atan2(this.dy, this.dx);
        
        // weapon update
        this.weapon.update(this.power, this);
        if (closestEnemy) {
            let direction = this.shape.direction;
            let power = this.power;
            setTimeout((_ => {this.weapon.shoot(this.x, this.y, curRoom.players, direction, power, this);}).bind(this), this.shootDelay);
        }
        
        // movement update
        this.move(this.ai.update(closestEnemy, this));
        
        this.x += this.dx;
        this.y += this.dy;
        
        let correction = curRoom.checkBoundaries(this);
        
        this.x += this.dx * correction.x;
        this.y += this.dy * correction.y;
        
        this.dx *= correction.dx;
        this.dy *= correction.dy;
        
        this.dx *= friction;
        this.dy *= friction;
        
        // health update
        if (this.invincibility) this.health = this.prevHealth;
        if (this.health < this.prevHealth) {
            this.invincibility = true;
            setTimeout((_ => {this.invincibility = false}).bind(this), invincibilityTime);
        }
        if (this.health <= 0) this.delete = true;
        this.prevHealth = this.health;
        
        this.draw();
    }
    
    move(keys) {
        for (var i in keys) {
            if (!keys[i]) continue;
            
            var control = this.controls[i];
            if (!control) continue;
            
            var x;
            var y;
            
            if (control == "up") {
                y = -this.speed;
            }
            else if (control == "left") {
                x = -this.speed;
            }
            else if (control == "down") {
                y = this.speed;
            }
            else if (control == "right") {
                x = this.speed;
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
        drawer.ctx.shadowBlur = 10;
        drawer.ctx.shadowColor = this.shape.color;
        if (this.invincibility) {
            drawer.ctx.fillStyle = background;
            drawer.fill(this.shape.draw(this.x, this.y, true));
        }
        else 
            drawer.fill(this.shape.draw(this.x, this.y));
        drawer.ctx.shadowBlur = 0;
        
        let healthBar = new Bar(this.x - 30, this.y - 20, 60, 6, this.health, this.maxHealth);
        healthBar.drawRelative();
    }
    
    static generatePower(weapon) {
        for (let i in rarePowerups) {
            if (~~(Math.random() * rarePowerups[i][1]) == 0) return new rarePowerups[i][0]();
        }
        
        return new powers[weapon.classification][~~(Math.random() * 4)]();
    }
}

class Miniboss extends Enemy {
    constructor(x, y, speed, friction, weapon, health, shape, ai, children=[], rareDrops=[]) {
        super(x, y, speed, friction, weapon, health, shape, ai, rareDrops);
        this.children = children;
        this.spawnedChildren = false;
    }
    
    update() {
        if (this.delete && !this.spawnedChildren) {
            this.spawnedChildren = true;
            for (var i in this.children) {
                let distance = Math.random() * this.shape.size * 2;
                let direction = Math.random() * Math.PI * 2;
                
                let x = Math.cos(direction) * distance + this.x;
                let y = Math.sin(direction) * distance + this.y;
                
                x = Math.max(curRoom.boundary.x + 20, Math.min(curRoom.boundary.x + curRoom.boundary.width - 20, x));
                y = Math.max(curRoom.boundary.y + 20, Math.min(curRoom.boundary.y + curRoom.boundary.height - 20, y));
                
                curRoom.enemies.push(new this.children[i](x, y));
            }
        }
        super.update();
    }
}

class PistolEnemy extends Enemy {
    constructor(x, y) {
        super(x, y, 0.5, 0.9, new Pistol(), 5, new Triangle(15, "#ff0000"), new RangeBasedAI(400));
    }
}

class ShotgunEnemy extends Enemy {
    constructor(x, y) {
        super(x, y, 0.5, 0.9, new Shotgun(), 7, new Triangle(15, "#0000ff"), new RangeBasedAI(300));
    }
}

class MissileEnemy extends Enemy {
    constructor(x, y) {
        super(x, y, 0.4, 0.9, new RocketLauncher(), 7, new Triangle(15, "#ffff00"), new RangeBasedAI(300));
    }
}

class SniperEnemy extends Enemy {
    constructor(x, y) {
        super(x, y, 0.2, 0.9, new Sniper(), 3, new Triangle(15, "#00ff00"), new RangeBasedAI(750));
    }
}

class AssaultRifleEnemy extends Enemy {
    constructor(x, y) {
        super(x, y, 0.4, 0.9, new AssaultRifle(), 10, new Square(15, "#ff0000"), new RangeBasedAI(300), [[5, Minigun]]);
    }
}

class AssaultShotgunEnemy extends Enemy {
    constructor(x, y) {
        super(x, y, 0.4, 0.9, new AssaultShotgun(), 15, new Square(15, "#0000ff"), new RangeBasedAI(150), [[5, HomingShotgun]]);
    }
}

class MissileLauncherEnemy extends Enemy {
    constructor(x, y) {
        super(x, y, 0.3, 0.9, new MissileLauncher(), 5, new Square(15, "#ffff00"), new RangeBasedAI(500), [[5, MissileSniper]]);
    }
}

class AssaultSniperEnemy extends Enemy {
    constructor(x, y) {
        super(x, y, 0.1, 0.9, new AssaultSniper(), 20, new Square(15, "#00ff00"), new RangeBasedAI(750), [[5, PowerfulSniper]]);
    }
}

class LaserPistolEnemy extends Enemy {
    constructor(x, y) {
        super(x, y, 0.5, 0.9, new LaserPistol(), 1, new Triangle(15, "#00ffff"), new RangeBasedAI(500));
        this.shootDelay = 100;
    }
}

class LaserShotgunEnemy extends Enemy {
    constructor(x, y) {
        super(x, y, 0.5, 0.9, new LaserShotgun(), 3, new Square(15, "#00ffff"), new RangeBasedAI(150), [[7, LaserContinuous]]);
        this.shootDelay = 100;
    }
}

class LandmineEnemy extends Enemy {
    constructor(x, y) {
        super(x, y, 0.5, 0.9, new LandmineShooter(), 10, new Triangle(15, border), new RangeBasedAI(0));
    }
}

class LandmineMiniboss extends Miniboss {
    constructor(x, y) {
        super(x, y, 1.2, 0.9, new LandmineShooter(), 15, new Square(15, border), new RangeBasedAI(0), [LandmineEnemy, LandmineEnemy, LandmineEnemy], [[2, MoveSpeed]]);
    }
}

class ShotgunMiniboss extends Miniboss {
    constructor(x, y) {
        super(x, y, 0.7, 0.9, new HomingShotgun(), 10, new Pentagon(15, "#0000ff"), new RangeBasedAI(500), [AssaultShotgunEnemy, AssaultShotgunEnemy, AssaultShotgunEnemy], [[2, HomingPowerup]])
    }
}

class MissileMiniboss extends Miniboss {
    constructor(x, y) {
        super(x, y, 0.1, 0.9, new MissileSniper(), 15, new Pentagon(15, "#ffff00"), new RangeBasedAI(750), [MissileLauncherEnemy, MissileLauncherEnemy, MissileLauncherEnemy], [[3, MissileSniper], [5, ClusterBombLauncher]]);
        this.shootDelay = 200;
    }
}

class MinigunMiniboss extends Miniboss {
    constructor(x, y) {
        super(x, y, 0.5, 0.9, new Minigun(), 25, new Pentagon(15, "#ff0000"), new RangeBasedAI(500), [AssaultRifleEnemy, AssaultRifleEnemy, AssaultRifleEnemy], [[3, Minigun], [7, ExplosiveMinigun]]);
    }
}

class TestEnemy extends Enemy {
    constructor(x, y) {
        super(x, y, 0, 0, new NoGun(), Number.MAX_VALUE, new Pentagon(15, "#0000ff"), new RangeBasedAI(0));
    }
}