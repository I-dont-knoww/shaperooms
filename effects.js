class Explosion {
    // ONLY ACCEPTS RGBA
    constructor(x, y, damage, targets, speed, lifespan, shape, transformColor, screenShake=0) {
        this.x = x;
        this.y = y;
        
        this.damage = damage;
        this.targets = targets;
        
        this.lifespan = Math.random() * (lifespan[1] - lifespan[0]) + lifespan[0];
        this.speed = Math.random() * (speed[1] - speed[0]) + speed[0];
        this.timer = 0;
        
        this.color = shape.color.replace("rgba(", "").replace(")", "").split(",").map(v => Number(v));
        this.transformColor = transformColor.replace("rgba(", "").replace(")", "").split(",").map(v => Number(v));
        this.shape = shape;
        
        // shake based on damage
        try {
            drawer.shake += this.speed;
            drawer.shake += screenShake;
        } catch (e) {}
    }
    
    update() {
        // delete myself
        this.timer++;
        if (this.timer > this.lifespan) {
            this.delete = true;
            return;
        }
        
        // collide
        for (var i in this.targets) {
            if (this.collision(this.targets[i])) {
                this.targets[i].health -= this.damage;
            }
        }
        
        // color
        for (var i = 0; i < 4; i++) {
            this.color[i] = this.color[i] + (this.transformColor[i] - this.color[i]) * this.timer/this.lifespan;
        }
        this.shape.color = "rgba(" + this.color.join(",") + ")";
        
        // size
        this.shape.size += this.speed;
        this.draw();
    }
    
    collision(object) {
        if ((this.x - object.x) ** 2 + (this.y - object.y) ** 2 <= (object.shape.size + this.shape.size) ** 2) return true;
        return false;
    }
    
    draw() {
        drawer.ctx.shadowBlur = 10;
        drawer.ctx.shadowColor = this.shape.color;
        drawer.fill(this.shape.draw(this.x, this.y));
        drawer.ctx.shadowBlur = 0;
    }
}

class ChargeExplosion {
    // starting size = shape.size
    constructor(sizeIncrease, shape, transformColor) {
        this.x = 0; this.y = 0;
        
        this.sizeIncrease = sizeIncrease;
        this.shape = shape;
        
        this.color = shape.color.replace("rgba(", "").replace(")", "").split(",").map(v => Number(v));
        this.transformColor = transformColor.replace("rgba(", "").replace(")", "").split(",").map(v => Number(v));
    }
    
    update(x, y, direction, chargeWeapon) {
        this.x = Math.cos(direction) * 15 + x; this.y = Math.sin(direction) * 15 + y;
        let timer = chargeWeapon.timer - chargeWeapon.chargeDelayTime;
        
        // color
        for (var i = 0; i < 4; i++) {
            this.color[i] = this.color[i] + (this.transformColor[i] - this.color[i]) * timer/chargeWeapon.chargeTime;
        }
        this.shape.color = "rgba(" + this.color.join(",") + ")";
        
        // size
        this.shape.size = this.sizeIncrease * timer;
        this.draw();
    }
    
    draw() {
        drawer.ctx.shadowBlur = 10;
        drawer.ctx.shadowColor = this.shape.color;
        drawer.fill(this.shape.draw(this.x, this.y));
        drawer.ctx.shadowBlur = 0;
    }
}

class TextFade extends Explosion {
    constructor(x, y, text, fontSize, lifespan, color1, color2) {
        super(x, y, 0, [], [0, 0], lifespan, new Circle(0, color1), color2);
        this.fontSize = fontSize;
        this.text = text;
    }
    
    draw() {
        drawer.ctx.fillStyle = this.shape.color;
        drawer.ctx.textAlign = "center";
        drawer.ctx.textBaseline = "middle";
        drawer.ctx.font = this.fontSize + "px Raleway";
        
        drawer.ctx.shadowBlur = 10;
        drawer.ctx.shadowColor = this.shape.color;
        drawer.fillText(this.text, this.x, this.y);
        drawer.ctx.shadowBlur = 0;
    }
}

class Trail extends Explosion {
    constructor(x1, y1, x2, y2, size, color1, color2) {
        super(x1, y1, 0, [], [0, 0], [60, 60], new Circle(0, color1), color2);
        this.x2 = x2;
        this.y2 = y2;
        this.size = size;
    }
    
    draw() {
        drawer.ctx.shadowBlur = 10;
        drawer.ctx.shadowColor = this.shape.color;
        
        drawer.ctx.strokeStyle = this.shape.color;
        drawer.ctx.lineWidth = this.size;
        drawer.ctx.lineCap = "round";
        
        let path = new Path2D();
        path.moveTo(this.x, this.y);
        path.lineTo(this.x2, this.y2);
        
        drawer.stroke(path);
        drawer.ctx.shadowBlur = 0;
    }
}

class MaxHealthIncrease extends TextFade {
    constructor(x, y) {
        super(x, y, "+1 Max HP!", 25, [240, 240], "rgba(0, 255, 0, 1)", "rgba(0, 255, 0, 0)");
    }
    
    update() {
        this.y -= 1.5;
        super.update();
    }
}

class LoadedSaveFile extends TextFade {
    constructor(x, y) {
        super(x, y, "Save File Loaded!", 40, [480, 480], "rgba(255, 0, 255, 1)", "rgba(255, 0, 255, 0)");
    }
    
    update() {
        this.y -= 1.5;
        super.update();
    }
}

class LaserGhost extends Trail {
    constructor(x1, y1, x2, y2, shape, lifespan=20) {
        super(x1, y1, x2, y2, shape.size, "rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0)");
        this.shape.color = shape.color;
        this.maxSize = shape.size;
        this.lifespan = lifespan;
    }
    
    update() {
        // delete myself
        this.timer++;
        if (this.timer > this.lifespan) {
            this.delete = true;
            return;
        }
        
        // collide
        for (var i in this.targets) {
            if (this.collision(this.targets[i])) {
                this.targets[i].health -= this.damage;
            }
        }
        
        // size
        this.shape.size += this.speed;
        this.draw();
    }
    
    draw() {
        this.size = ((this.lifespan - this.timer)/this.lifespan) * this.maxSize + 0.1;
        super.draw();
    }
}

class SpawnExplosion extends Explosion {
    constructor(x, y) {
        super(x, y, 0, [], [15, 15], [7, 7], new Circle(0, "rgba(255, 165, 0, 1)"), "rgba(255, 165, 0, 0.3)", -14.5);
    }
}

class ChargePistolEffect extends ChargeExplosion {
    constructor() {
        super(0.25, new Circle(0, "rgba(255, 0, 0, 1)"), "rgba(255, 0, 0, 1)");
    }
}

class ChargeStatusPistolEffect extends ChargeExplosion {
    constructor() {
        super(0.5, new Circle(0, "rgba(255, 0, 0, 1)"), "rgba(255, 0, 0, 1)");
    }
}

class ChargeNukeEffect extends ChargeExplosion {
    constructor() {
        super(0.083, new Circle(0, "rgba(255, 0, 0, 1)"), "rgba(255, 0, 0, 1)");
    }
}

class ChargeLaserShotgunEffect extends ChargeExplosion {
    constructor() {
        super(0.125, new Circle(0, "rgba(255, 0, 0, 1)"), "rgba(255, 0, 0, 1)");
    }
}

class BigMissileExplosion extends Explosion {
    constructor(x, y, targets) {
        super(x, y, 10, targets, [15, 15], [15, 15], new Circle(0, "rgba(255, 165, 0, 1)"), "rgba(255, 165, 0, 0.3)");
    }
    
    update() {
        if (this.delete) {
            for (var i = 0; i < 5; i++) {
                let direction = i * (Math.PI * 2)/5;
                curRoom.misc.push(new MissileExplosion(Math.cos(direction) * 175 + this.x, Math.sin(direction) * 175 + this.y));
            }
        }
        super.update();
    }
}

class MissileExplosion extends Explosion {
    constructor(x, y, targets) {
        super(x, y, 3, targets, [15, 15], [7, 7], new Circle(0, "rgba(255, 165, 0, 1)"), "rgba(255, 165, 0, 0.3)");
    }
}

class SmallMissileExplosion extends Explosion {
    constructor(x, y, targets) {
        super(x, y, 2, targets, [15, 15], [3, 3], new Circle(0, "rgba(255, 165, 0, 1)"), "rgba(255, 165, 0, 0.3)", -12);
    }
}

class TinyMissileExplosion extends Explosion {
    constructor(x, y, targets) {
        super(x, y, 2, targets, [15, 15], [2, 2], new Circle(0, "rgba(255, 165, 0, 1)"), "rgba(255, 165, 0, 0.3)", -14);
    }
}

class NukeExplosion extends Explosion {
    constructor(x, y, targets, charge) {
        super(x, y, charge * 0.27 + 10, targets, [charge * 0.26, charge * 0.26], [7, 7], new Hexagon(100, "rgba(255, 165, 0, 1)"), "rgba(255, 165, 0, 0.3)");
        for (let i = 0; i < 10 * this.shape.size/30; i++) {
            let distance = Math.random() * (this.shape.size + this.lifespan * this.speed);
            let direction = Math.random() * Math.PI * 2;
            setTimeout(_ => {
                curRoom.misc.push(new MissileExplosion(Math.cos(direction) * distance + x, Math.sin(direction) * distance + y, targets));
            }, Math.random() * 500);
        }
    }
    
    update() {
        this.shape.direction += 0.3;
        super.update();
    }
}

class Smoke extends Explosion {
    constructor(x, y) {
        super(x, y, 0, [], [1, 1], [50, 50], new Circle(0, "rgba(100, 100, 100, 1)"), "rgba(100, 100, 100, 0.01)", -1);
    }
}

class SniperSmoke extends Explosion {
    constructor(x, y) {
        super(x, y, 0, [], [0.5, 0.7], [30, 30], new Circle(0, "rgba(255, 0, 0, 1)"), "rgba(255, 0, 0, 0)", -0.5);
    }
}

class Portal {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        
        this.shapes = [];
        let sides = ~~(Math.random() * 3 + 3);
        
        for (let i = 0; i < 5; i++) {
            let r = Math.min(255, Math.max(Math.random() * 255 + (i - 1) * 40, 0));
            let g = Math.min(255, Math.max(Math.random() * 255 + (i - 1) * 40, 0));
            let b = Math.min(255, Math.max(Math.random() * 255 + (i - 1) * 40, 0));
            let color = `rgb(${r}, ${g}, ${b})`;
            this.shapes.push(new Polygon(sides, (i + 1) * 15, color));
        }
    }
    
    update() {
        drawer.ctx.shadowBlur = 10;
        for (let i = this.shapes.length - 1; i >= 0; i--) {
            this.shapes[this.shapes.length - 1 - i].direction += i/50 + 0.01;
            drawer.ctx.shadowColor = this.shapes[i].color;
            drawer.fill(this.shapes[i].draw(this.x, this.y));
        }
        
        for (let i in curRoom.players) {
            let player = curRoom.players[i];
            if ((player.x - this.x) ** 2 + (player.y - this.y) ** 2 <= (pickupDistance * 2) ** 2 && (keys[player.shootButton] && !prevKeys[player.shootButton])) {
                curRoom.generatedWaves = 4;
                
                // summon curse boss
                if (curse >= 12 && mode == 0 && bosses.at(-1) != CurseBoss) bosses.push(CurseBoss);
                if (bosses[bossIndex] == CurseBoss) {
                    localStorage.defeatedCurseBoss = true;
                }
                
                this.delete = true;
                break;
            }
        }
        drawer.ctx.shadowBlur = 0;
    }
}