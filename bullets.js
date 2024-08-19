const slowness = 1.5;
let antilag = localStorage.antilag ? (localStorage.antilag == "true" ? true : false) : false;

class Bullet {
    // lifespan is array, speed is array, direction is array
    // trail is a 2d array
    constructor(x, y, damage, powerItems, targets, direction, lifespan, speed, shape, trail=[], bypassAntilag=false) {
        this.x = x;
        this.y = y;
        
        this.damage = damage;
        this.targets = targets;
        this.thingKilled = false;
        
        this.direction = Math.random() * (direction[1] - direction[0]) + direction[0];
        this.lifespan = Math.random() * (lifespan[1] - lifespan[0]) + lifespan[0];
        this.speed = Math.random() * (speed[1] - speed[0]) + speed[0];
        this.timer = 0;
        
        this.speed /= slowness;
        this.lifespan *= slowness;
        
        this.shape = shape;
        this.ai = null;
        
        this.trail = bypassAntilag ? trail : antilag ? [] : trail;
        this.trailIndex = 0;
        this.trailTimer = 0;
        
        // shake based on dmg
        try {drawer.shake += Math.max(0, this.damage - 2)}
        catch (e) {}
        
        this.classification = this.constructor.classify(this.damage, this.lifespan, this.speed);
        
        this.powerItems = powerItems;
        if (powerItems.power && (this.classification.includes(powerItems.power.classification) ||
            powerItems.classification.includes(powerItems.power.classification))) {
            this.damage += powerItems.power.damage;
            this.lifespan += powerItems.power.lifespan;
            this.speed += powerItems.power.bulletSpeed;

            powerItems.power.bulletGotPowerup(this);
        }
    }
    
    update() {
        if (this.delete && this.ai) this.ai.delete(this);
        
        // delete itself
        if (!curRoom.inRoom(this.x, this.y)) {
            this.delete = true;
            return;
        }
        
        this.timer++;
        if (this.timer > this.lifespan) {
            this.delete = true;
            return;
        }
        
        // collide with targets
        let goDelete = false;
        for (let i in this.targets) {
            // have to check this.delete because it does that last second double update
            if (this.collision(this.targets[i]) && !this.delete) {
                this.thingKilled = this.targets[i];
                this.targets[i].health -= this.damage;
                goDelete = true;
            }
        }
        
        if (goDelete) {
            this.delete = true;
            return;
        }
        
        // update trail
        if (this.trail.length != 0) {
            this.trailTimer++;
            
            if (this.trailTimer >= this.trail[this.trailIndex][1]) {
                curRoom.misc.push(new this.trail[this.trailIndex][0](this.x, this.y, this.targets));
                this.trailIndex++; this.trailIndex %= this.trail.length;
                this.trailTimer = 0;
            }
        }
        
        let correction = this.wallCollision();
        
        // update x/y
        this.x += Math.cos(this.direction) * this.speed;
        this.y += Math.sin(this.direction) * this.speed;
        
        if (correction) {
            this.delete = true;
            this.x = correction.x;
            this.y = correction.y;
        }
        
        if (this.ai) this.ai.update(this);
        
        // draw
        this.shape.direction = this.direction;
        this.draw();
    }
    
    collision(object) {
        let totalSize = object.shape.size + this.shape.size;
        if ((this.x - object.x) ** 2 + (this.y - object.y) ** 2 <= totalSize ** 2) return true;
        
        let x2 = Math.cos(this.direction) * this.speed + this.x;
        let y2 = Math.sin(this.direction) * this.speed + this.y;
        
        let dotProduct = (((object.x - this.x) * (x2 - this.x)) + ((object.y - this.y) * (y2 - this.y)))/(this.speed ** 2);
        
        let cX = this.x + (dotProduct * (x2 - this.x));
        let cY = this.y + (dotProduct * (y2 - this.y));
        
        if (cX < Math.min(this.x, x2) || cX > Math.max(this.x, x2)) return false;
        if (cY < Math.min(this.y, y2) || cY > Math.max(this.y, y2)) return false;
        
        let distance = (object.x - cX) ** 2 + (object.y - cY) ** 2;
        if (distance <= totalSize ** 2) return true;
        return false;
    }
    
    wallCollision() {
        let thing1 = this.lineCollision(curRoom.boundary.x, curRoom.boundary.y, curRoom.boundary.x + curRoom.boundary.width, curRoom.boundary.y);
        let thing2 = this.lineCollision(curRoom.boundary.x, curRoom.boundary.y, curRoom.boundary.x, curRoom.boundary.y + curRoom.boundary.height);
        let thing3 = this.lineCollision(curRoom.boundary.x + curRoom.boundary.width, curRoom.boundary.y, curRoom.boundary.x + curRoom.boundary.width, curRoom.boundary.y + curRoom.boundary.height);
        let thing4 = this.lineCollision(curRoom.boundary.x, curRoom.boundary.y + curRoom.boundary.height, curRoom.boundary.x + curRoom.boundary.width, curRoom.boundary.y + curRoom.boundary.height);
        
        return thing1 ? thing1 : thing2 ? thing2 : thing3 ? thing3 : thing4;
    }
    
    lineCollision(x1, y1, x2, y2) {
        let x3 = this.x;
        let y3 = this.y;
        let x4 = this.x + Math.cos(this.direction) * this.speed;
        let y4 = this.y + Math.sin(this.direction) * this.speed;
        
        let uA = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));
        let uB = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));
        
        if (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1) {
            let intersectionX = x1 + (uA * (x2 - x1));
            let intersectionY = y1 + (uA * (y2 - y1));
            
            return {x: intersectionX, y: intersectionY};
        }
        return false;
    }
    
    calculateDamage() {
        return this.damage;
    }
    
    draw() {
        drawer.ctx.shadowBlur = 10;
        drawer.ctx.shadowColor = this.shape.color;
        drawer.fill(this.shape.draw(this.x, this.y));
        drawer.ctx.shadowBlur = 0;
    }
    
    static classify(damage, lifespan, speed) {
        let classification = "";
        if (damage <= 1) classification += "low-damage";
        else if (damage <= 3) classification += "medium-damage";
        else classification += "high-damage";
        
        classification += " ";
        
        if (lifespan * speed <= 700) classification += "low-range";
        else if (lifespan * speed <= 1000) classification += "medium-range";
        else classification += "high-range";
        
        classification += " ";
        
        if (speed <= 30) classification += "low-speed";
        else if (speed <= 70) classification += "medium-speed";
        else classification += "high-speed";
        
        return classification;
    }
}

class RocketBullet extends Bullet {
    constructor(x, y, damage, power, targets, direction, lifespan, speed, explosion, shape, trail=[]) {
        super(x, y, damage, power, targets, direction, lifespan, speed, shape, trail);
        this.explosion = explosion;
    }
    
    update() {
        if (this.delete) curRoom.misc.push(new this.explosion(this.x, this.y, this.targets));
        super.update();
    }
    
    calculateDamage() {
        let explosion = new this.explosion(0, 0, []);
        return this.damage + explosion.damage;
    }
    
    static classify(damage, lifespan, speed) {
        return Bullet.classify(damage, lifespan, speed) + " exploding";
    }
}

class Laser extends Bullet {
    // shape size and color matters thats all
    constructor(x, y, damage, power, targets, direction, shape, trail=[]) {
        super(x, y, damage, power, targets, direction, [100, 100], [10000, 10000], shape, trail);
        this.prevPos = {x: x, y: y};
        this.classification += " laser";
        this.disappearTime = 20;
    }
    
    update() {
        if (this.delete) this.draw();
        if (this.delete && this.ai) this.ai.delete(this);
        
        // delete itself
        if (!curRoom.inRoom(this.x, this.y)) {
            this.delete = true;
            return;
        }
        
        this.timer++;
        if (this.timer > this.lifespan) {
            this.delete = true;
            return;
        }
        
        // collide with targets
        for (var i in this.targets) {
            // have to check this.delete because it does that last second double update
            if (this.collision(this.targets[i]) && !this.delete) {
                this.thingKilled = this.targets[i];
                this.targets[i].health -= this.damage;
            }
        }
        
        // update trail
        if (this.trail.length != 0) {
            this.trailTimer++;
            
            if (this.trailTimer >= this.trail[this.trailIndex][1]) {
                curRoom.misc.push(new this.trail[this.trailIndex][0](this.x, this.y));
                this.trailIndex++; this.trailIndex %= this.trail.length;
                this.trailTimer = 0;
            }
        }
        
        let correction = this.wallCollision();
        
        // update x/y
        this.x += Math.cos(this.direction) * this.speed;
        this.y += Math.sin(this.direction) * this.speed;
        
        if (correction) {
            this.delete = true;
            this.x = correction.x;
            this.y = correction.y;
        }
        
        if (this.ai) this.ai.update(this);
        
        // draw
        this.shape.direction = this.direction;
        this.draw();
    }
    
    draw() {
        drawer.ctx.shadowBlur = 10;
        drawer.ctx.shadowColor = this.shape.color;
        
        drawer.ctx.strokeStyle = this.shape.color;
        // bad code down there
        curRoom.misc.push(new LaserGhost(this.prevPos.x, this.prevPos.y, this.x, this.y, this.shape, this.disappearTime));
        
        let path = new Path2D();
        path.moveTo(this.prevPos.x, this.prevPos.y);
        path.lineTo(this.x, this.y);
        
        drawer.ctx.lineWidth = this.shape.size;
        drawer.ctx.lineCap = "round";
        drawer.stroke(path);
        
        drawer.ctx.shadowBlur = 0;
    }
    
    static classify(damage, lifespan, speed) {
        return Bullet.classify(damage, lifespan, speed) + " laser";
    }
}

class ChargeBullet extends Bullet {
    constructor(x, y, damageMultiplier, damage, powerItems, targets, direction, lifespan, speed, sizeMultiplier, shape, trail=[]) {
        super(x, y, damage, powerItems, targets, direction, lifespan, speed, shape, trail);
        
        this.originalDamage = this.damage;
        this.damageMultiplier = damageMultiplier;
        
        this.originalSize = shape.size;
        this.sizeMultiplier = sizeMultiplier;
        
        this.calculatedCharge = false;
        
        // try to counteract shake coz damage isn't fully calculated
        try {drawer.shake -= Math.max(0, this.damage - 2)}
        catch (e) {}
    }
    
    update() {
        if (!this.calculatedCharge) {
            this.damage = Math.round((this.damageMultiplier * this.charge + this.originalDamage) * 2) / 2;
            this.shape.size = this.sizeMultiplier * this.charge + this.originalSize;
            
            // make shake coz hasn't been done yet
            try {drawer.shake += Math.max(0, this.damage - 2)}
            catch (e) {}
            
            this.calculatedCharge = true;
        }
        super.update();
    }
    
    calculateDamage(maxCharge) {
        return Math.round((this.damageMultiplier * maxCharge + this.originalDamage) * 2) / 2;
    }
}

class ChargeLaser extends Laser {
    constructor(x, y, damageMultiplier, damage, power, targets, direction, sizeMultiplier, shape, trail=[]) {
        super(x, y, damage, power, targets, direction, shape, trail);
        
        this.originalDamage = this.damage;
        this.damageMultiplier = damageMultiplier;
        
        this.originalSize = shape.size;
        this.sizeMultiplier = sizeMultiplier;
        
        this.calculatedCharge = false;
        
        // try to counteract shake coz damage isn't fully calculated
        try {drawer.shake -= Math.max(0, this.damage - 2)}
        catch (e) {}
    }
    
    update() {
        if (!this.calculatedCharge) {
            this.damage = Math.round((this.damageMultiplier * this.charge + this.originalDamage) * 2) / 2;
            this.shape.size = this.sizeMultiplier * this.charge + this.originalSize;
            
            // make shake coz hasn't been done yet
            try {drawer.shake += Math.max(0, this.damage - 2)}
            catch (e) {}
            
            this.calculatedCharge = true;
        }
        super.update();
    }
    
    calculateDamage(maxCharge) {
        return Math.round((this.damageMultiplier * maxCharge + this.originalDamage) * 2) / 2;
    }
}

class AdminBullet extends Bullet {
    constructor(x, y, targets, direction, power) {
        super(x, y, 10000, power, targets, [direction, direction], [20, 20], [100, 100], new Circle(4, "#ff0000"));
    }
}

class NothingBullet extends Bullet {
    constructor(x, y, targets, direction, power) {
        super(0, 0, 0, power, [], [0, 0], [0, 0], [0, 0], new Circle(0, "rgba(0, 0, 0, 0)"));
    }
}

class PistolBullet extends Bullet {
    constructor(x, y, targets, direction, power) {
        super(x, y, 1, power, targets, [direction - 0.05, direction + 0.05], [30, 35], [20, 22], new Circle(4, "#ff0000"));
    }
}

class MinigunBullet extends Bullet {
    constructor(x, y, targets, direction, power) {
        super(x, y, 1, power, targets, [direction - 0.1, direction + 0.1], [35, 40], [20, 22], new Circle(4, "#ff0000"));
    }
}

class MinigunMissile extends RocketBullet {
    constructor(x, y, targets, direction, power) {
        super(x, y, 0, power, targets, [direction - 0.07, direction + 0.07], [30, 35], [20, 22], TinyMissileExplosion, new Circle(4, "#ff0000"));
    }
}

class MinigunPoisonBullet extends Bullet {
    constructor(x, y, targets, direction, power) {
        super(x, y, 0.5, power, targets, [direction - 0.07, direction + 0.07], [30, 35], [20, 22], new Circle(4, "#00ff00"));
    }
    
    update() {
        if (this.thingKilled) {
            let enemy = this.thingKilled;
            enemy.speed *= 0.5;
            for (let i = 0; i < 11; i++) {
                setTimeout(_ => {
                    enemy.health -= 0.5;
                }, 500 * (i + 1));
            }
            setTimeout(_ => {
                enemy.speed /= 0.5;
            }, 500 * 14);
        }
        
        super.update();
    }
}

class MinigunBurnBullet extends Bullet {
    constructor(x, y, targets, direction, power) {
        super(x, y, 0.5, power, targets, [direction - 0.07, direction + 0.07], [30, 35], [20, 22], new Circle(4, "#ff0000"));
    }
    
    update() {
        if (this.thingKilled) {
            let enemy = this.thingKilled;
            for (let i = 0; i < 3; i++) {
                setTimeout(_ => {
                    enemy.health -= 2;
                }, 500 * (i + 1));
            }
        }
        
        super.update();
    }
}

class MinigunFreezeBullet extends Bullet {
    constructor(x, y, targets, direction, power) {
        super(x, y, 0.5, power, targets, [direction - 0.07, direction + 0.07], [30, 35], [20, 22], new Circle(4, "#0000ff"));
    }
    
    update() {
        if (this.thingKilled && (this.thingKilled.constructor.prototype.__proto__.constructor == Enemy || this.thingKilled.constructor.prototype.__proto__.constructor == Miniboss)) this.thingKilled.speed = 0;
        
        super.update();
    }
}

class ShotgunBullet extends Bullet {
    constructor(x, y, targets, direction, power) {
        super(x, y, 1.5, power, targets, [direction - 0.1, direction + 0.1], [35, 40], [20, 22], new Circle(4, "#ff0000"));
    }
}

class ShotgunMissile extends RocketBullet {
    constructor(x, y, targets, direction, power) {
        super(x, y, 5, power, targets, [direction - 0.1, direction + 0.1], [60, 65], [10, 22], SmallMissileExplosion, new Square(7, "#ff0000"), [[Smoke, Math.random() * 5], [Smoke, 1000]]);
    }
}

class HomingShotgunBullet extends Bullet {
    constructor(x, y, targets, direction, power) {
        super(x, y, 3, power, targets, [direction - 0.3, direction + 0.3], [70, 70], [10, 22], new Circle(4, "#ff0000"));
        this.ai = new HomingBullets(targets, 800);
    }
    
    update() {
        super.update();
    }
}

class SplitterBullet extends RocketBullet {
    constructor(x, y, targets, direction, power, size=32) {
        super(x, y, 0, power, targets, [direction, direction], [15, 15], [20, 22], SmallMissileExplosion, new Circle(size, "#ff0000"));
        this.damage += this.shape.size / 2; // += instead of = because of powerups
        this.split = false;
    }
    
    update() {
        if (this.delete && !this.split && this.shape.size >= 2) {
            curRoom.misc.push(new SplitterBullet(this.x, this.y, this.targets, this.direction - 0.2, this.powerItems, this.shape.size / 2));
            curRoom.misc.push(new SplitterBullet(this.x, this.y, this.targets, this.direction + 0.2, this.powerItems, this.shape.size / 2));
            this.split = true;
        }
        
        super.update();
    }
}

class SniperBullet extends Bullet {
    constructor(x, y, targets, direction, power) {
        super(x, y, 3, power, targets, [direction - 0.01, direction + 0.01], [60, 60], [50, 54], new Triangle(8, "#ff0000"));
    }
}

class PowerfulSniperBullet extends Bullet {
    constructor(x, y, targets, direction, power) {
        super(x, y, 12, power, targets, [direction, direction], [60, 60], [100, 100], new Triangle(8, "#ff0000"), [[SniperSmoke, 1]])
    }
}

class PiercingSniperBullet extends Bullet {
    constructor(x, y, targets, direction, power) {
        super(x, y, 20, power, targets, [direction, direction], [60, 60], [200, 200], new Triangle(10, "#ff0000"), [[MissileExplosion, 1]], true);
        this.pierced = false;
    }
    
    update() {
        if (this.delete && this.thingKilled && !this.pierced) {
            setTimeout((_ => curRoom.misc.push(new this.constructor(this.x, this.y, this.targets, this.direction, this.powerItems))).bind(this), 0);
            this.pierced = true;
        }
        
        super.update();
    }
}

class Missile extends RocketBullet {
    constructor(x, y, targets, direction, power) {
        super(x, y, 0, power, targets, [direction - 0.05, direction + 0.05], [30, 35], [20, 22], MissileExplosion, new Square(7, "#ff0000"), [[Smoke, 2], [Smoke, 1000]]);
    }
}

class SniperMissile extends RocketBullet {
    constructor(x, y, targets, direction, power) {
        super(x, y, 5, power, targets, [direction - 0.01, direction + 0.01], [60, 60], [50, 54], MissileExplosion, new ShapeStack([new Triangle(8, "#ff0000"), new Circle(40, "rgba(0, 0, 0, 0)")]), [[Smoke, 2], [Smoke, 2], [Smoke, 1000]]);
    }
}

class ClusterBomb extends RocketBullet {
    constructor(x, y, targets, direction, power) {
        super(x, y, 0, power, targets, [direction - 0.05, direction + 0.05], [50, 55], [20, 22], BigMissileExplosion, new ShapeStack([new Square(10, "#ff0000"), new Circle(40, "rgba(0, 0, 0, 0)")]), [[Smoke, 2]]);
    }
}

class LaserPistolBullet extends Laser {
    constructor(x, y, targets, direction, power) {
        super(x, y, 1, power, targets, [direction, direction], new Circle(5, "#ff0000"));
    }
}

class StrongLaserPistolBullet extends Laser {
    constructor(x, y, targets, direction, power) {
        super(x, y, 8, power, targets, [direction, direction], new Circle(5, "#ff0000"));
    }
}

class VeryStrongLaserPistolBullet extends Laser {
    constructor(x, y, targets, direction, power) {
        super(x, y, 10, power, targets, [direction, direction], new Circle(20, "#ff0000"));
        try {
            curRoom.misc.push(new ExplosionSummoner(x, y, targets, direction, power));
        } catch (e) {}
    }
}

class ExplosionSummoner extends Bullet {
    constructor(x, y, targets, direction, power) {
        super(x, y, 0, power, targets, [direction, direction], [100, 100], [200, 200], new Circle(0, "rgba(0, 0, 0, 0)"), [[MissileExplosion, 1]], true);
    }
}

class LaserShotgunBullet extends Laser {
    constructor(x, y, targets, direction, power) {
        super(x, y, 2, power, targets, [direction - 0.1, direction + 0.1], new Circle(5, "#ff0000"));
    }
}

class LaserContinuousBullet extends Laser {
    constructor(x, y, targets, direction, power) {
        super(x, y, 1, power, targets, [direction, direction], new Circle(5, "#ff0000"));
        this.disappearTime = 0;
    }
}

class ChargePistolBullet extends ChargeBullet {
    constructor(x, y, targets, direction, power) {
        super(x, y, 0.125, 1, power, targets, [direction - 0.05, direction + 0.05], [60, 70], [20, 22], 0.25, new Circle(1, "#ff0000"));
    }
}

class ChargeLaserBullet extends ChargeLaser {
    constructor(x, y, targets, direction, power) {
        super(x, y, 0.125, 1, power, targets, [direction - 0.05, direction + 0.05], 0.25, new Circle(1, "#ff0000"));
    }
}

class ChargeLaserBulletShotgun extends ChargeLaser {
    constructor(x, y, targets, direction, power) {
        super(x, y, 0.0625, 1, power, targets, [direction - 0.1, direction + 0.1], 0.125, new Circle(1, "#ff0000"));
    }
}

class ChargeStatusBullet extends ChargeBullet {
    constructor(x, y, targets, direction, power) {
        super(x, y, 0.0625, 1, power, targets, [direction - 0.05, direction + 0.05], [60, 70], [20, 22], 0.5, new Triangle(1, "#ff0000"), [[Smoke, 1]]);
    }
    
    update() {
        if (this.thingKilled && (this.thingKilled.constructor.prototype.__proto__.constructor == Enemy || this.thingKilled.constructor.prototype.__proto__.constructor == Miniboss)) this.thingKilled.speed /= 2;
        
        if (this.thingKilled) {
            let enemy = this.thingKilled;
            for (let i = 0; i < 11; i++) {
                setTimeout(_ => {
                    enemy.health -= Math.round(this.damage);
                }, 500 * (i + 1));
            }
        }
        
        super.update();
    }
}

class ChargeNukeBullet extends ChargeBullet {
    constructor(x, y, targets, direction, power) {
        super(x, y, 0, 0, power, targets, [direction - 0.05, direction + 0.05], [1000, 1000], [20, 22], 0.083, new Circle(1, "#ff0000"), [[Smoke, 1]]);
    }
    
    update() {
        if (this.delete) {
            curRoom.misc.push(new NukeExplosion(this.x, this.y, this.targets, this.charge));
        }
        
        super.update();
    }
}

class Landmine extends RocketBullet {
    constructor(x, y, targets, direction, power) {
        super(x, y, 5, power, targets, [direction, direction], [500, 500], [0, 0], MissileExplosion, new Hexagon(20, "#ff0000"));
        this.speed = 0;
    }
}