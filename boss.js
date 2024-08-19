let bossHealthIncrease = 0;
let bossDamageMultiplier = 1;

class CurseBoss {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        
        this.dx = 0;
        this.dy = 0;
        
        this.speed = 1 / slowness;
        this.friction = 0.9;
        
        this.health = 300 + bossHealthIncrease;
        this.prevHealth = 300 + bossHealthIncrease;
        this.maxHealth = 300 + bossHealthIncrease;
        this.invincibility = false;
        
        this.controls = {
            w: "up",
            a: "left",
            s: "down",
            d: "right",
        };
        
        this.shape = CurseBoss.makeShape();
        
        this.ai = new ModeBasedAI([this.attack1, this.attack2, this.attack3, this.attack4, this.attack5], []);
        this.timer = 0;
        
        this.guns = [new CurseBossTurretGunShooter(), new CurseBossLightShow(), new CurseBossLightShowPreview(), new CurseBossBouncyLaserShooter(), new CurseBossBouncyLaserPreviewShooter(), new CurseBossFollowerShooter()];
        
        curse = 1;
    }
    
    update() {
        this.timer++;
        if (this.delete) {
            bossDeathAnimation(this, 10);
            
            curRoom.dropCoins({x: curRoom.boundary.x + curRoom.boundary.width/2, y: curRoom.boundary.y + curRoom.boundary.height/2, shape: this.shape}, 20 * (bossIndex + 1));
            
            curRoom.generatedWaves = 2;
            curse = 0;
        }
        
        // find closest enemy
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

            if ((this.x - closestEnemy.x) ** 2 +
                (this.y - closestEnemy.y) ** 2 <= targetDistance ** 2);
            else {
                closestEnemy = null;
            }            
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
        if (this.health <= this.maxHealth/2) this.rage = true;
        
        if (this.rage) generateRageParticles(this);
        
        // draw
        this.draw();
    }
    
    draw(drawHealthBar=true) {
        if (this.timer % 5 == 0) {
            this.shape = CurseBoss.makeShape();
            this.shape.direction = Math.random() * Math.PI * 2;
        }
        
        let healthBar = new Bar(canvas.width/2 - 200, 40, 400, 20, this.health, this.maxHealth);
        if (drawHealthBar) healthBar.draw();
        
        drawer.ctx.shadowBlur = 10;
        drawer.ctx.shadowColor = this.shape.color;
        this.shape.draw(this.x, this.y);
        drawer.ctx.shadowBlur = 0;
        
        let x = Math.random() * 140 - 70 + this.x;
        let y = Math.random() * 140 - 70 + this.y;
        curRoom.misc.unshift(new CurseBossGlitchParticle(x, y));
        
        if (~~(Math.random() * 10) == 0) {
            let x = Math.random() * curRoom.boundary.width + curRoom.boundary.x;
            let y = Math.random() * curRoom.boundary.height + curRoom.boundary.y;
            curRoom.misc.unshift(new CurseBossGlitchParticle(x, y));
        }
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
    
    attack1(AI) {
        setTimeout((_ => {
            for (let i = 0; i < (this.rage ? 6 : 4); i++) {
                let direction = Math.PI * 2/(this.rage ? 6 : 4) * i + this.shape.direction;
                this.guns[0].update();
                this.guns[0].shoot(this.x, this.y, curRoom.players, direction, null);
            }

            setTimeout(_ => {
                AI.attacking = false;
            }, 2000);
        }).bind(this), 0);
    }
    
    attack2(AI) {
        let direction = Math.random() * Math.PI * 2;
        
        this.guns[2].update(null);
        this.guns[2].shoot(this.x, this.y, [], direction, null);
        
        setTimeout((_ => {
            this.guns[1].update(null);
            this.guns[1].shoot(this.x, this.y, curRoom.players, direction, null);
        }).bind(this), 500);
        
        for (let i = 0; i < 500; i++) {
            for (let j = 0; j < 5; j++) {
                let distance = Math.random() * 400 - 200 + i * 2;
                let direction = Math.random() * Math.PI * 2;
                setTimeout((_ => {
                    curRoom.misc.unshift(new CurseBossGlitchParticle(Math.cos(direction) * distance + this.x, Math.sin(direction) * distance + this.y));
                }).bind(this), i);
            }
        }
        
        setTimeout(_ => AI.attacking = false, 1500);
    }
    
    attack3(AI) {
        this.x = NaN; this.y = NaN;
        for (let i = 0; i < 5; i++) {
            setTimeout((_ => {
                if (curRoom.generatedWaves === true || curRoom.generatedWaves == 3) {AI.attacking = false; return;}
                for (let i = 0; i < 2; i++) {
                    let x = Math.random() * curRoom.boundary.width + curRoom.boundary.x;
                    let y = Math.random() * curRoom.boundary.height + curRoom.boundary.y;

                    curRoom.misc.push(new CurseBossExplosionMarker(x, y, curRoom.players));
                }
            }).bind(this), (this.rage ? 500 : 750) * i);
        }
        
        setTimeout((_ => {
            if (curRoom.generatedWaves === true || curRoom.generatedWaves == 3) {AI.attacking = false; return;}
            this.x = curRoom.boundary.x + curRoom.boundary.width/2;
            this.y = curRoom.boundary.y + curRoom.boundary.height/2;
            AI.attacking = false;
        }).bind(this), (this.rage ? 500 : 750) * 5 + 750);
    }
    
    attack4(AI) {
        let direction = Math.random() * Math.PI * 2;
        
        this.guns[4].update(null);
        this.guns[4].shoot(this.x, this.y, [], direction, null);
        
        if (this.rage) {
            this.guns[4].update(null);
            this.guns[4].shoot(this.x, this.y, [], direction + Math.PI, null);
        }
        
        setTimeout((_ => {
            this.guns[3].update(null);
            this.guns[3].shoot(this.x, this.y, curRoom.players, direction, null);
            
            if (this.rage) {
                this.guns[3].update(null);
                this.guns[3].shoot(this.x, this.y, [], direction + Math.PI, null);
            }
        }).bind(this), 500);
        
        setTimeout(_ => AI.attacking = false, 1500);
    }
    
    attack5(AI) {
        for (let i = 0; i < 500; i++) {
            for (let j = 0; j < 5; j++) {
                let distance = Math.random() * 400 - 200 + (500 - i) * 2;
                let direction = Math.random() * Math.PI * 2;
                setTimeout((_ => {
                    curRoom.misc.unshift(new CurseBossGlitchParticle(Math.cos(direction) * distance + this.x, Math.sin(direction) * distance + this.y));
                }).bind(this), i);
            }
        }
        
        setTimeout((_ => {
            this.guns[5].update(null);
            this.guns[5].shoot(this.x, this.y, curRoom.players, 0, null);
        }).bind(this), 800);
        
        setTimeout(_ => AI.attacking = false, 2000);
    }
    
    static makeShape() {
        return new ShapeStack([new Polygon(~~(Math.random() * 7) + 3, 30, "#ff00ff"), new Polygon(~~(Math.random() * 7) + 3, 70, "#8f00ff")]);
    }
}

class CurseBossFollowerShooter extends Gun {
    constructor() {
        super(CurseBossFollowerBullet, [1], new Triangle(15, "#ff0000"), 25);
    }
}

class CurseBossFollowerBullet extends Bullet {
    constructor(x, y, targets, direction, power) {
        super(x, y, 1, power, targets, [0, Math.PI * 2], [200, 200], [9, 9], new Circle(5, "rgba(0, 0, 0, 0)"));
        this.oldPos = [];
    }
    
    update() {
        if (curRoom.generatedWaves === true || curRoom.generatedWaves == 3) {this.delete = true; return;}
        
        (curRoom.players.length > 0) && (this.direction = Math.atan2(curRoom.players[0].y - this.y, curRoom.players[0].x - this.x));
        
        this.oldPos.push({x: this.x, y: this.y});
        for (let i in this.oldPos) if (~~(Math.random() * 10) == 0) {
            let x = Math.random() * 140 - 70 + this.oldPos[i].x;
            let y = Math.random() * 140 - 70 + this.oldPos[i].y;
            setTimeout(_ => curRoom.misc.push(new CurseBossGlitchParticle(x, y)), Math.random() * 500);
        }
        
        super.update();
    }
}

class CurseBossBouncyLaserShooter extends Gun {
    constructor() {
        super(CurseBossBouncyLaser, [1], new Triangle(15, "#ff0000"));
    }
}

class CurseBossBouncyLaserPreviewShooter extends Gun {
    constructor() {
        super(CurseBossBouncyLaserPreview, [1], new Triangle(15, "#ff0000"));
    }
}

class CurseBossBouncyLaser extends Laser {
    constructor(x, y, targets, direction, power) {
        super(x, y, 1, power, targets, [direction, direction], new Circle(4, "#ff0000"));
        this.ai = this.ai || new BouncingBullets();
        this.ai.bounces = 10;
    }
}

class CurseBossBouncyLaserPreview extends Laser {
    constructor(x, y, targets, direction, power) {
        super(x, y, 0, power, targets, [direction, direction], new Circle(40, "#ff00ff"));
        this.ai = this.ai || new BouncingBullets();
        this.ai.bounces = 10;
    }
}

class CurseBossExplosion extends Explosion {
    constructor(x, y, targets) {
        super(x, y, 1, targets, [10, 17], [10, 10], new Circle(0, "rgba(255, 0, 255, 1)"), "rgba(255, 0, 255, 0.3)");
        
        for (let i = 0; i < 200; i++) {
            let distance = Math.random() * 200;
            let direction = Math.random() * Math.PI * 2;
            setTimeout(_ => curRoom.misc.unshift(new CurseBossGlitchParticle(Math.cos(direction) * distance + this.x, Math.sin(direction) * distance + this.y)), i * 2);
        }
    }
}

class CurseBossExplosionMarker extends Explosion {
    constructor(x, y, targets) {
        super(x, y, 0, [], [-2, -2], [30, 35], new Circle(200, "rgba(255, 0, 255, 1)"), "rgba(255, 0, 255, 0)");
        this.futureTargets = targets;
    }
    
    update() {
        if (this.delete) curRoom.misc.push(new CurseBossExplosion(this.x, this.y, this.futureTargets));
        super.update();
    }
}

class CurseBossLightShow extends Gun {
    constructor() {
        super(StrongLaserPistolBullet, [1], new Hexagon(10, "#00ffff"), -90, "shotgun", 
              (x, y, targets, direction, power) => {
            for (let i = 1; i < 20; i++) {
                let dir = (i/20) * Math.PI * 2 + direction;
                curRoom.misc.push(new StrongLaserPistolBullet(x, y, targets, dir, power));
            }
        });
        this.rarityBias = 34;
        
        this.name = "Light Show";
    }
}

class CurseBossLightShowPreview extends Gun {
    constructor() {
        super(CurseBossLightShowPreviewlaser, [1], new Hexagon(10, "#00ffff"), 0, "shotgun", 
              (x, y, targets, direction, power) => {
            for (let i = 1; i < 20; i++) {
                let dir = (i/20) * Math.PI * 2 + direction;
                curRoom.misc.push(new CurseBossLightShowPreviewlaser(x, y, targets, dir, power));
            }
        });
        this.rarityBias = 34;
        
        this.name = "Light Show";
    }
}

class CurseBossLightShowPreviewlaser extends Laser {
    constructor(x, y, targets, direction, power) {
        super(x, y, 0, power, [], [direction, direction], new Circle(40, "rgba(255, 0, 255, 1)"));
    }
}

class CurseBossTurretGunShooter extends Gun {
    constructor() {
        super(CurseBossTurretBullet, [1], new Triangle(15, "#ff0000"));
    }
}

class CurseBossTurretBullet extends Bullet {
    constructor(x, y, targets, direction, power) {
        super(x, y, 1, power, targets, [direction, direction], [1000000, 1000000], [10, 10], new ShapeStack([new Circle(10, "#aa0000"), new Circle(20, "#ff0000")]));
        this.weapon = new CurseBossTurretGun();
        this.shootSpeed = ~~(Math.random() * 20) + 15;
    }
    
    update() {
        this.weapon.update(null);
        if (this.timer % this.shootSpeed == 0) this.weapon.shoot(this.x, this.y, curRoom.players, Math.random() * Math.PI * 2, null);
        super.update();
    }
}

class CurseBossTurretGun extends Gun {
    constructor() {
        super(CurseBossTurretBulletInception, [1], new Triangle(15, "#ff0000"));
    }
}

class CurseBossTurretBulletInception extends Bullet {
    constructor(x, y, targets, direction, power) {
        super(x, y, 1, power, targets, [direction, direction], [30, 35], [15, 18], new Circle(7, "#ff0000"));
    }
}

class CurseBossGlitchParticle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        
        this.w = Math.random() * 100 + 50;
        this.h = Math.random() * 100 + 50;
    }
    
    update() {
        this.delete = true;
        this.draw();
    }
    
    draw() {
        drawer.ctx.fillStyle = border;
        drawer.fillRect(this.x - this.w/2, this.y - this.h/2, this.w, this.h);
    }
}

class CurseBossDungeonGlitchParticle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        
        this.w = Math.random() * 100 + 50;
        this.h = Math.random() * 100 + 50;
    }
    
    update() {
        this.delete = true;
        this.draw();
    }
    
    draw() {
        drawer.ctx.fillStyle = border;
        drawer.ctx.fillRect(this.x - this.w/2, this.y - this.h/2, this.w, this.h);
    }
}

class LaserBoss {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        
        this.dx = 0;
        this.dy = 0;
        
        this.speed = 1 / slowness;
        this.friction = 0.85;
        
        this.health = 300 + bossHealthIncrease;
        this.prevHealth = 300 + bossHealthIncrease;
        this.maxHealth = 300 + bossHealthIncrease;
        this.invincibility = false;
        
        this.controls = {
            w: "up",
            a: "left",
            s: "down",
            d: "right",
        };
        
        this.shape = new ShapeStack([new Triangle(40, "#666666"), new Pentagon(70, "#444444")]);
        
        this.ai = new ModeBasedAI([this.attack1, this.attack2, this.attack3, this.attack4, this.attack5], []);
        
        this.guns = [new LaserBossContinuousBeam(), new LaserBossContinuousBeam(), new LaserBossContinuousBeam(), new LaserBossChargeUpShooter(), new LaserBossBigLaserShooter(), new LaserBossExplodingLaserShooter(), new LaserBossBouncyLaserShooter()];
    }
    
    update() {
        if (this.delete) {
            bossDeathAnimation(this, 10);
            
            curRoom.dropCoins({x: curRoom.boundary.x + curRoom.boundary.width/2, y: curRoom.boundary.y + curRoom.boundary.height/2, shape: this.shape}, 20 * (bossIndex + 1));
            
            let distance = Math.random() * 20 + 200;
            let direction = Math.random() * Math.PI * 2;
            
            let x = Math.cos(direction) * distance + curRoom.boundary.width/2 + curRoom.boundary.x;
            let y = Math.sin(direction) * distance + curRoom.boundary.height/2 + curRoom.boundary.y;
            
            let drops = [LaserBossPlayerBigLaser, LaserBossPlayerLightShow, LaserBossPlayerPower];
            
            let item = new drops[~~(Math.random() * drops.length)]();
            if (!item.isPower) curRoom.misc.push(new GunHolder(x, y, item));
            else curRoom.misc.push(new PowerHolder(x, y, item));
            
            curRoom.generatedWaves = 2;
        }
        
        // find closest enemy
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

            if ((this.x - closestEnemy.x) ** 2 +
                (this.y - closestEnemy.y) ** 2 <= targetDistance ** 2);
            else {
                closestEnemy = null;
            }
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
        if (this.health <= this.maxHealth/2) this.rage = true;
        
        if (this.rage) generateRageParticles(this);
        
        // draw
        this.draw();
    }
    
    draw(drawHealthBar=true) {
        let healthBar = new Bar(canvas.width/2 - 200, 40, 400, 20, this.health, this.maxHealth);
        if (drawHealthBar) healthBar.draw();
        
        drawer.ctx.shadowBlur = 10;
        drawer.ctx.shadowColor = this.shape.color;
        this.shape.draw(this.x, this.y);
        drawer.ctx.shadowBlur = 0;
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
    
    attack1(AI) {
        if (curRoom.generatedWaves === true || curRoom.generatedWaves == 3) {AI.attacking = false; return;}
        
        this.guns[0].bulletIndex = 0;
        this.guns[1].bulletIndex = 0;
        this.guns[2].bulletIndex = 0;
        for (let i = 0; i < 250; i++) {
            setTimeout((_ => {
                if (curRoom.generatedWaves === true || curRoom.generatedWaves == 3) return;
                
                let dir = (i/(this.rage ? 200 : 250)) * Math.PI * 2;
                this.shape.direction = dir;
                
                this.guns[0].update(null);
                this.guns[1].update(null);
                this.guns[2].update(null);

                this.guns[0].shoot(this.x, this.y, curRoom.players, dir, null);
                this.guns[1].shoot(this.x, this.y, curRoom.players, dir + 2/3 * Math.PI, null);
                this.guns[2].shoot(this.x, this.y, curRoom.players, dir + 4/3 * Math.PI, null);
            }).bind(this), 30 * i);
        }
        
        setTimeout((_ => {
            AI.attacking = false;
        }).bind(this), this.rage ? 2000 : 4000);
    }
    
    attack2(AI) {
        if (curRoom.generatedWaves === true || curRoom.generatedWaves == 3) {AI.attacking = false; return;}
        
        let player = curRoom.players[~~(Math.random() * curRoom.players.length)];
        let direction = player ? Math.atan2(player.y - this.y, player.x - this.x) : Math.random() * Math.PI * 2;
        
        this.shape.direction = direction;
        
        this.guns[3].update(null);
        this.guns[3].shoot(this.x, this.y, [], direction, null);
        
        setTimeout((_ => {
            for (var i = 0; i < 20; i++) {
                setTimeout((_ => {
                    this.guns[4].update(null);
                    this.guns[4].shoot(this.x, this.y, curRoom.players, direction, null);
                }).bind(this), i * 10);
            }
            
            setTimeout((_ => {
                AI.attacking = false;
            }).bind(this), this.rage ? 500 : 1000);
        }).bind(this), 1050);
    }
    
    attack3(AI, checking=false, timesChecked=0) {
        if (curRoom.generatedWaves === true || curRoom.generatedWaves == 3) {AI.attacking = false; return;}
        
        if (timesChecked > 25) {
            AI.attacking = false;
            return;
        }
        if (checking) {
            if (curRoom.enemies.length <= 1) {
                AI.attacking = false;
                return;
            }
            setTimeout((_ => {
                this.attack3(AI, true, timesChecked + 1);
            }).bind(this), 100);
            return;
        }
        
        for (var i = 0; i < (this.rage ? 7 : 5); i++) {
            let x = Math.random() * (curRoom.boundary.width - 200) + curRoom.boundary.x + 100;
            let y = Math.random() * (curRoom.boundary.height - 200) + curRoom.boundary.y + 100;
            curRoom.enemies.push(new LaserPistolEnemy(x, y));
        }
        
        setTimeout((_ => {
            this.attack3(AI, true);
        }).bind(this), 100);
    }
    
    attack4(AI) {
        for (let i = 0; i < (this.rage ? 6 : 4); i++) {
            let direction = Math.PI * 2 / (this.rage ? 6 : 4) * i;
            
            this.guns[5].update(null);
            this.guns[5].shoot(this.x, this.y, curRoom.players, direction, null);
        }
        
        setTimeout(_ => AI.attacking = false, 1000);
    }
    
    attack5(AI) {
        let direction = Math.random() * Math.PI * 2;
        this.shape.direction = direction;
        
        this.guns[6].update(null);
        this.guns[6].shoot(this.x, this.y, curRoom.players, direction, null);
        
        setTimeout(_ => AI.attacking = false, 1000);
    }
}

class LaserBossBouncyLaserShooter extends Gun {
    constructor() {
        super(LaserBossBouncyLaserPreview, [1], new Triangle(15, "#ff0000"));
    }
}

class LaserBossExplodingLaserShooter extends Gun {
    constructor() {
        super(LaserBossExplodingLaser, [1], new Triangle(15, "#ff0000"));
    }
}

class LaserBossContinuousBeam extends LaserContinuous {
    constructor() {
        super();
        this.reloadTime = (new Array(500).fill(1)).concat([100]);
        this.bullet = LaserBossContinuousBullet;
        this.shake = -3;
        
        this.customShoot = () => {};
    }
}

class LaserBossChargeUpShooter extends Gun {
    constructor() {
        super(LaserBossChargeUp, [1], new Triangle(15, "#ff0000"));
    }
}

class LaserBossBigLaserShooter extends Gun {
    constructor() {
        super(LaserBossBigLaser, [1], new Triangle(15, "#ff0000"), -12);
    }
}

class LaserBossBouncyLaserPreview extends Laser {
    constructor(x, y, targets, direction, power) {
        super(x, y, 0, power, targets, [direction, direction], new Circle(10, "#ff0000"));
        this.ai = this.ai || new BouncingBullets();
        
        setTimeout(_ => curRoom.misc.push(new LaserBossBouncyLaser(x, y, targets, direction, power)), 1000);
    }
}

class LaserBossBouncyLaser extends Laser {
    constructor(x, y, targets, direction, power) {
        super(x, y, 10, power, targets, [direction, direction], new Circle(10, "#444444"));
    }
}

class LaserBossExplosionSummoner extends Bullet {
    constructor(x, y, targets, direction, power) {
        super(x, y, 0, power, targets, [direction, direction], [100, 100], [200, 200], new Circle(0, "rgba(0, 0, 0, 0)"), [[MissileExplosion, 1]], true);
    }
}

class LaserBossExplodingLaser extends Laser {
    constructor(x, y, targets, direction, power) {
        super(x, y, 5, power, targets, [direction, direction], new Circle(70, "#ff0000"));
        curRoom.misc.push(new LaserBossExplosionSummoner(x, y, targets, direction, power));
    }
}

class LaserBossContinuousBullet extends Laser {
    constructor(x, y, targets, direction, power) {
        super(x, y, 5, power, targets, [direction, direction], new Circle(5, "#ff0000"));
        this.original = {x: x, y: y};
        this.disappearTime = 0;
    }
}

class LaserBossChargeUp extends Explosion {
    constructor(x, y, _, direction) {
        super(x + Math.cos(direction) * 70, y + Math.sin(direction) * 70, 0, [], [-2, -2], [80, 80], new Circle(160, "rgba(102, 102, 102, 0.7)"), "rgba(102, 102, 102, 0.7)", 4);
    }
}

class LaserBossBigLaser extends Laser {
    constructor(x, y, targets, direction, power) {
        super(x, y, 20, power, targets, [direction, direction], new Circle(20, "#ff0000"));
    }
}

class LaserBossPlayerBigLaser extends Gun {
    constructor() {
        super(LaserBossPlayerBigLaserBullet, [70], new ShapeStack([new Triangle(9, "#666666"), new Pentagon(20, "#444444")]), -10, "misc");
        
        this.name = "Laser Calamity";
    }
    
    update() {
        super.update();
    }
}

class LaserBossPlayerBigLaserBullet extends Laser {
    constructor(x, y, targets, direction, power) {
        super(x, y, 20, power, targets, [direction, direction], new Circle(30, "#ff0000"));
        this.disappearTime = 60;
    }
}

class LaserBossPlayerLightShow extends Gun {
    constructor() {
        super(LaserShotgunBullet, [15, 0, 0, 0], new ShapeStack([new Triangle(9, "#666666"), new Pentagon(20, "#444444")]), 2, "misc");
        
        this.name = "Laser Storm";
    }
}

class LaserBossPlayerPower extends Power {
    constructor() {
        super(1, 3, 0, 0, "laser", new ShapeStack([new Triangle(9, "#666666"), new Pentagon(20, "#444444")]));
        
        this.name = "Focus Shot";
    }
    
    bulletGotPowerup(bullet) {
        bullet.shape.size += 10;
    }
}

class CollisionBoss {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.dx = 0;
        this.dy = 0;
        
        this.speed = 0.5 / slowness;
        this.friction = 0.9;
        
        this.health = 50 + bossHealthIncrease;
        this.prevHealth = 50 + bossHealthIncrease;
        this.maxHealth = 50 + bossHealthIncrease;
        this.invincibility = false;
        
        this.shape = new ShapeStack([new Triangle(50, "#ffd580"), new Square(70, "#ffa500"), new Pentagon(90, "#da680f")]);
        this.xDir = 1;
        this.yDir = 1;
        
        this.ai = new ModeBasedAI([this.attack1, this.attack2, this.attack3, this.attack4, this.attack5], []);
        this.guns = [new CollisionBossChargeUpBigShooter(), new CollisionBossBigHitboxShooter(), new CollisionBossTeleportBulletShooter(), new CollisionBossSmallHitboxShooter(), new CollisionBossChargeUpShooter(), new CollisionBossLaserPreviewShooter(), new CollisionBossLaserShooter()];
        this.hitbox = new CollisionBossRegHitboxShooter();
        
        this.controls = {
            w: "up",
            a: "left",
            s: "down",
            d: "right",
        };
    }
    
    update() {
        if (this.delete) {
            bossDeathAnimation(this, 30);
            
            curRoom.dropCoins({x: curRoom.boundary.x + curRoom.boundary.width/2, y: curRoom.boundary.y + curRoom.boundary.height/2, shape: this.shape}, 20 * (bossIndex + 1));
            
            let distance = Math.random() * 20 + 200;
            let direction = Math.random() * Math.PI * 2;

            let x = Math.cos(direction) * distance + curRoom.boundary.width/2 + curRoom.boundary.x;
            let y = Math.sin(direction) * distance + curRoom.boundary.height/2 + curRoom.boundary.y;
            if (Math.random() > 0.01) curRoom.misc.push(new GunHolder(x, y, new CollisionBossPlayerCharge()));
            else curRoom.misc.push(new GunHolder(x, y, new CollisionBossPlayerChargeOP()));
            
            curRoom.generatedWaves = 2;
        }
        
        // find closest enemy
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

            if ((this.x - closestEnemy.x) ** 2 +
                (this.y - closestEnemy.y) ** 2 <= targetDistance ** 2);
            else {
                closestEnemy = null;
            }
        }
        
        // movement update
        this.move(this.ai.update(closestEnemy, this));
        
        this.hitbox.update(null);
        this.hitbox.shoot(this.x, this.y, curRoom.players, 0, null);
        
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
        if (this.health != this.prevHealth) {
            this.invincibility = true;
            setTimeout((_ => {this.invincibility = false}).bind(this), invincibilityTime);
        }
        if (this.health <= 0) this.delete = true;
        this.prevHealth = this.health;
        if (this.health <= this.maxHealth/2) this.rage = true;
        
        if (this.rage) generateRageParticles(this);
        
        // draw
        this.draw();
    }
    
    draw(drawHealthBar=true) {
        let healthBar = new Bar(canvas.width/2 - 200, 40, 400, 20, this.health, this.maxHealth);
        if (drawHealthBar) healthBar.draw();
        
        drawer.ctx.shadowBlur = 10;
        drawer.ctx.shadowColor = this.shape.color;
        this.shape.draw(this.x, this.y);
        drawer.ctx.shadowBlur = 0;
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
    
    attack1(AI, prevX, prevY, direction) {
        if (curRoom.generatedWaves === true || curRoom.generatedWaves == 3) {AI.attacking = false; return;}
        
        if (!prevX || !prevY || !direction) {
            let player = curRoom.players[~~(Math.random() * curRoom.players.length)];
            let direction = player ? Math.atan2(player.y - this.y, player.x - this.x) : Math.random() * Math.PI * 2;
            
            this.guns[0].update(null);
            this.guns[0].shoot(this.x, this.y, [], direction, null);
            
            this.shape.direction = direction;
            curRoom.misc.push(new CollisionBossTrailWarning(this.x, this.y, Math.cos(direction) * 1000 + this.x, Math.sin(direction) * 1000 + this.y));

            setTimeout((_ => {
                this.attack1(AI, this.x, this.y, direction);
            }).bind(this), 2000);
        } else {
            this.guns[1].update(null);
            this.guns[1].shoot(this.x, this.y, curRoom.players, direction, null);
            
            let x1 = curRoom.boundary.x + 100;
            let x2 = curRoom.boundary.width + curRoom.boundary.x - 100;
            let y1 = curRoom.boundary.y + 100;
            let y2 = curRoom.boundary.height + curRoom.boundary.y - 100;
            
            this.x = Math.min(x2, Math.max(x1, Math.cos(direction) * 1000 + this.x));
            this.y = Math.min(y2, Math.max(y1, Math.sin(direction) * 1000 + this.y));
            
            curRoom.misc.push(new CollisionBossTrail(this.x, this.y, prevX, prevY));
            drawer.shake = 10;
            
            setTimeout((_ => {
                AI.attacking = false;
            }), this.rage ? 750 : 1250);
        }
    }
    
    attack2(AI) {
        if (curRoom.generatedWaves === true || curRoom.generatedWaves == 3) {AI.attacking = false; return;}
        
        for (let i = 0; i < 10; i++) {
            setTimeout((_ => {
                this.guns[2].update(null);
                this.guns[2].shoot(this.x, this.y, curRoom.players, Math.random() * Math.PI * 2, null);
            }).bind(this), Math.random() * 500 + 500);
        }
        
        setTimeout(_ => {
            AI.attacking = false;
        }, this.rage ? 2500 : 3500);
    }
    
    attack3(AI, prevX, prevY, num, direction) {
        if (curRoom.generatedWaves === true || curRoom.generatedWaves == 3) {AI.attacking = false; return;}
        
        if (!num) {
            let player = curRoom.players[~~(Math.random() * curRoom.players.length)];
            let direction = player ? Math.atan2(player.y - this.y, player.x - this.x) : Math.random() * Math.PI * 2;
            
            this.guns[4].update(null);
            this.guns[4].shoot(this.x, this.y, [], direction, null);
            
            this.shape.direction = direction;
            curRoom.misc.push(new CollisionBossTrailWarning(this.x, this.y, Math.cos(direction) * 1000 + this.x, Math.sin(direction) * 1000 + this.y));
            
            setTimeout((_ => {
                this.attack3(AI, this.x, this.y, 1, direction);
            }).bind(this), 2000);
        } else {
            this.guns[3].update(null);
            this.guns[3].shoot(this.x, this.y, curRoom.players, direction, null);
            
            let x1 = curRoom.boundary.x + 100;
            let x2 = curRoom.boundary.width + curRoom.boundary.x - 100;
            let y1 = curRoom.boundary.y + 100;
            let y2 = curRoom.boundary.height + curRoom.boundary.y - 100;
            
            this.x = Math.min(x2, Math.max(x1, Math.cos(direction) * 1000 + this.x));
            this.y = Math.min(y2, Math.max(y1, Math.sin(direction) * 1000 + this.y));
            
            curRoom.misc.push(new CollisionBossTrail(this.x, this.y, prevX, prevY));
            drawer.shake = 5;
            
            if (num == 4) {
                setTimeout((_ => {
                    AI.attacking = false;
                }), this.rage ? 1250 : 1750);
                return;
            }
            else {
                let player = curRoom.players[~~(Math.random() * curRoom.players.length)];
                let newDirection = player ? Math.atan2(player.y - this.y, player.x - this.x) : Math.random() * Math.PI * 2;
                
                this.shape.direction = newDirection;
                curRoom.misc.push(new CollisionBossTrailWarning(this.x, this.y, Math.cos(newDirection) * 1000 + this.x, Math.sin(newDirection) * 1000 + this.y));

                setTimeout((_ => {
                    this.attack3(AI, this.x, this.y, num + 1, newDirection);
                }).bind(this), 1000);
            }
        }
    }
    
    attack4(AI) {
        for (let i = 0; i < 200; i++) {
            setTimeout((_ => {
                this.shape.direction = Math.atan2(this.yDir, this.xDir);
                
                this.x += (this.rage ? 30 : 15) * this.xDir;
                this.y += (this.rage ? 30 : 15) * this.yDir;
                
                if (this.x - this.shape.size <= curRoom.boundary.x || this.x + this.shape.size >= curRoom.boundary.x + curRoom.boundary.width) {
                    this.xDir = -this.xDir;
                    drawer.shake = 5;
                }
                if (this.y - this.shape.size <= curRoom.boundary.y || this.y + this.shape.size >= curRoom.boundary.y + curRoom.boundary.height) {
                    this.yDir = -this.yDir;
                    drawer.shake = 5;
                }
            }).bind(this), i * 10);
        }
        
        setTimeout(_ => AI.attacking = false, 200 * 10 + 750);
    }
    
    attack5(AI) {
        let player = curRoom.players[~~(Math.random() * curRoom.players.length)];
        let direction = player ? Math.atan2(player.y - this.y, player.x - this.x) : Math.random() * Math.PI * 2;
        
        this.guns[5].update(null);
        this.guns[5].shoot(this.x, this.y, curRoom.players, direction, null);
        
        setTimeout((_ => {
            if (curRoom.generatedWaves === true || curRoom.generatedWaves == 3) {AI.attacking = false; return;}
            
            this.guns[6].update(null);
            this.guns[6].shoot(this.x, this.y, curRoom.players, direction, null);
            drawer.shake = 10;
        }).bind(this), 1000);
        
        setTimeout(_ => AI.attacking = false, 2000);
    }
}

class CollisionBossLaserShooter extends Gun {
    constructor() {
        super(CollisionBossLaser, [1], new Triangle(15, "#ff0000"));
    }
}

class CollisionBossLaserPreviewShooter extends Gun {
    constructor() {
        super(CollisionBossLaserPreview, [1], new Triangle(15, "#ff0000"));
    }
}

class CollisionBossTeleportBulletShooter extends Gun {
    constructor() {
        super(CollisionBossTeleportBullet, [1], new Triangle(15, "#ff0000"));
    }
}

class CollisionBossBigHitboxShooter extends Gun {
    constructor() {
        super(CollisionBossBigHitbox, [1], new Triangle(15, "#ff0000"));
    }
}

class CollisionBossSmallHitboxShooter extends Gun {
    constructor() {
        super(CollisionBossSmallHitbox, [1], new Triangle(15, "#ff0000"));
    }
}

class CollisionBossRegHitboxShooter extends Gun {
    constructor() {
        super(CollisionBossRegHitbox, [1], new Triangle(15, "#ff0000"));
    }
}

class CollisionBossChargeUpBigShooter extends Gun {
    constructor() {
        super(CollisionBossChargeUpBig, [1], new Triangle(15, "#ff0000"));
    }
}

class CollisionBossChargeUpShooter extends Gun {
    constructor() {
        super(CollisionBossChargeUp, [1], new Triangle(15, "#ff0000"));
    }
}

class CollisionBossLaser extends Laser {
    constructor(x, y, targets, direction, power) {
        super(x, y, 3, power, targets, [direction, direction], new Circle(50, "rgb(255, 213, 128)"));
        this.ai = this.ai || new BouncingBullets();
    }
    
    update() {
        if (this.delete) {
            if (curRoom.generatedWaves === true || curRoom.generatedWaves == 3) {AI.attacking = false; return;}
            
            let boss = curRoom.enemies[0];
            
            boss.x = this.x;
            boss.y = this.y;
            
            let x1 = curRoom.boundary.x + 100;
            let x2 = curRoom.boundary.width + curRoom.boundary.x - 100;
            let y1 = curRoom.boundary.y + 100;
            let y2 = curRoom.boundary.height + curRoom.boundary.y - 100;
            
            boss.x = Math.min(x2, Math.max(x1, boss.x));
            boss.y = Math.min(y2, Math.max(y1, boss.y));
        }
        super.update();
    }
}

class CollisionBossLaserPreview extends Laser {
    constructor(x, y, targets, direction, power) {
        super(x, y, 0, power, targets, [direction, direction], new Circle(70, "#ff0000"));
        this.ai = this.ai || new BouncingBullets();
    }
}

class CollisionBossTeleportBullet extends Bullet {
    constructor(x, y, targets, direction, power) {
        super(x, y, 1, power, targets, [direction - 0.02, direction + 0.02], [10, 30], [20, 22], new Circle(8, "#ff0000"));
    }
    
    update() {
        if (this.delete) {
            let boss;
            for (let i in curRoom.enemies) if (curRoom.enemies[i].constructor == CollisionBoss)
                boss = curRoom.enemies[i];

            let x1 = curRoom.boundary.x + 100;
            let x2 = curRoom.boundary.width + curRoom.boundary.x - 100;
            let y1 = curRoom.boundary.y + 100;
            let y2 = curRoom.boundary.height + curRoom.boundary.y - 100;

            this.x = Math.min(x2, Math.max(x1, this.x));
            this.y = Math.min(y2, Math.max(y1, this.y));

            try {
                boss.x = this.x;
                boss.y = this.y;

                drawer.shake = 10;
                
                boss.shape.direction = Math.random() * Math.PI * 2;
            } catch (e) {}

            curRoom.misc.push(new MissileExplosion(this.x, this.y, curRoom.players));
            drawer.shake -= 14;
        }
        
        super.update();
    }
}

class CollisionBossChargeUpBig extends Explosion {
    constructor(x, y, _, direction) {
        super(x + Math.cos(direction) * 40, y + Math.sin(direction) * 40, 0, [], [-2, -2], [120, 120], new Circle(240, "rgba(255, 213, 128, 0.7)"), "rgba(255, 213, 128, 0.7)", 4);
    }
}

class CollisionBossChargeUp extends Explosion {
    constructor(x, y, _, direction) {
        super(x + Math.cos(direction) * 40, y + Math.sin(direction) * 40, 0, [], [-2, -2], [160, 160], new Circle(320, "rgba(255, 213, 128, 0.7)"), "rgba(255, 213, 128, 0.7)", 4);
    }
}

class CollisionBossHitbox extends Bullet {
    constructor(x, y, damage, powerItems, targets, direction, lifespan, speed, shape, trail=[]) {
        super(x, y, damage, powerItems, targets, direction, lifespan, speed, shape, trail);
    }
    
    update() {
        // delete myself
        this.timer++;
        if (this.timer > this.lifespan) {
            this.delete = true;
            return;
        }
        
        // collide with targets
        for (let i in this.targets) {
            // have to check this.delete because it does that last second double update
            if (this.collision(this.targets[i]) && !this.delete) {
                this.targets[i].health -= this.damage;
                this.delete = true;
                return;
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
        
        // update x/y
        this.x += Math.cos(this.direction) * this.speed;
        this.y += Math.sin(this.direction) * this.speed;
        
        // draw
        this.shape.direction = this.direction;
        this.draw();
    }
}

class CollisionBossBigHitbox extends CollisionBossHitbox {
    constructor(x, y, targets, direction, power) {
        super(x, y, 20, power, targets, [direction, direction], [1, 1], [1000, 1000], new Circle(90, "rgba(0, 0, 0, 0)"));
    }
}

class CollisionBossSmallHitbox extends CollisionBossHitbox {
    constructor(x, y, targets, direction, power) {
        super(x, y, 6, power, targets, [direction, direction], [1, 1], [1000, 1000], new Circle(90, "rgba(0, 0, 0, 0)"));
    }
}

class CollisionBossRegHitbox extends CollisionBossHitbox {
    constructor(x, y, targets, direction, power) {
        super(x, y, 1, power, targets, [direction, direction], [1, 1], [0, 0], new Circle(90, "rgba(0, 0, 0, 0)"));
    }
}

class CollisionBossTrail extends Trail {
    constructor(x1, y1, x2, y2) {
        super(x1, y1, x2, y2, 90, "rgba(255, 213, 128, 1)", "rgba(255, 213, 128, 0)");
    }
}

class CollisionBossTrailWarning extends Trail {
    constructor(x1, y1, x2, y2) {
        super(x1, y1, x2, y2, 90, "rgba(255, 0, 0, 0)", "rgba(255, 0, 0, 1)");
        this.spawnedDisappear = false;
    }
    
    update() {
        if (this.delete && !this.spawnedDisappear) {
            curRoom.misc.push(new CollisionBossTrailWarningDissapate(this.x, this.y, this.x2, this.y2));
            this.spawnedDisappear = true;
        }
        super.update();
    }
}

class CollisionBossTrailWarningDissapate extends Trail {
    constructor(x1, y1, x2, y2) {
        super(x1, y1, x2, y2, 90, "rgba(255, 0, 0, 1)", "rgba(255, 0, 0, 0)");
    }
    
    update() {
        super.update();
    }
}

class CollisionBossPlayerChargeOP extends Gun {
    constructor() {
        super(NothingBullet, [3], new ShapeStack([new Triangle(7, "#ffaaaa"), new Square(15, "#ff5555"), new Pentagon(20, "#ff0000")]), 0, "misc",
              (x, y, targets, direction, power, player) => {
            const originalPlayerX = player.x;
            const originalPlayerY = player.y;
            
            let x1 = curRoom.boundary.x + player.shape.size;
            let x2 = curRoom.boundary.width + curRoom.boundary.x - player.shape.size;
            let y1 = curRoom.boundary.y + player.shape.size;
            let y2 = curRoom.boundary.height + curRoom.boundary.y - player.shape.size;

            player.x = Math.min(x2, Math.max(x1, Math.cos(direction) * 800 + player.x));
            player.y = Math.min(y2, Math.max(y1, Math.sin(direction) * 800 + player.y));
            
            curRoom.misc.push(new Trail(x, y, player.x, player.y, player.shape.size, "rgba(255, 0, 0, 1)", "rgba(255, 0, 0, 1)"));
            
            targets.forEach(v => {
                if (this.collisionDetect(x, y, player.x, player.y, v)) {
                    v.health -= 1 + power.power.damage;

                    const x = originalPlayerX + (Math.random() * 2 - 1) * 10;
                    const y = originalPlayerY + (Math.random() * 2 - 1) * 10;

                    curRoom.misc.push(new HealthBossLifeStealEffect(x, y));
                }
            });
        });

        this.bulletSpeed = 10000;
        
        this.name = "Demon Slashes";
    }
    
    collisionDetect(x1, y1, x2, y2, object) {
        let totalSize = object.shape.size + 30;
        if ((x1 - object.x) ** 2 + (y1 - object.y) ** 2 <= totalSize ** 2) return true;
        if ((x2 - object.y) ** 2 + (y2 - object.y) ** 2 <= totalSize ** 2) return true;
        
        let distanceBetween = (x2 - x1) ** 2 + (y2 - y1) ** 2;
        let dotProduct = (((object.x - x1) * (x2 - x1)) + ((object.y - y1) * (y2 - y1)))/distanceBetween;
        
        let cX = x1 + (dotProduct * (x2 - x1));
        let cY = y1 + (dotProduct * (y2 - y1));
        
        if (cX < Math.min(x1, x2) || cX > Math.max(x1, x2)) return false;
        if (cY < Math.min(y1, y2) || cY > Math.max(y1, y2)) return false;
        
        let distance = (object.x - cX) ** 2 + (object.y - cY) ** 2;
        if (distance <= totalSize ** 2) return true;
        return false;
    }
}

class CollisionBossPlayerCharge extends Gun {
    constructor() {
        super(NothingBullet, [40], new ShapeStack([new Triangle(7, "#ffd580"), new Square(15, "#ffa500"), new Pentagon(20, "#da680f")]), 0, "misc",
              (x, y, targets, direction, power, player) => {
            let x1 = curRoom.boundary.x + player.shape.size;
            let x2 = curRoom.boundary.width + curRoom.boundary.x - player.shape.size;
            let y1 = curRoom.boundary.y + player.shape.size;
            let y2 = curRoom.boundary.height + curRoom.boundary.y - player.shape.size;

            player.x = Math.min(x2, Math.max(x1, Math.cos(direction) * 800 + player.x));
            player.y = Math.min(y2, Math.max(y1, Math.sin(direction) * 800 + player.y));
            
            curRoom.misc.push(new Trail(x, y, player.x, player.y, player.shape.size, "rgba(255, 213, 128, 1)", "rgba(255, 213, 128, 0)"));
            
            targets.forEach(v => {
                if (this.collisionDetect(x, y, player.x, player.y, v)) {
                    v.health -= 5 + power.power.damage;
                    player.invincibility = true;
                    setTimeout(_ => {player.invincibility = false}, 200);
                }
            });
        });

        this.bulletSpeed = 10000;
        
        this.name = "Kinetic Propel";
    }
    
    collisionDetect(x1, y1, x2, y2, object) {
        let totalSize = object.shape.size + 30;
        if ((x1 - object.x) ** 2 + (y1 - object.y) ** 2 <= totalSize ** 2) return true;
        if ((x2 - object.y) ** 2 + (y2 - object.y) ** 2 <= totalSize ** 2) return true;
        
        let distanceBetween = (x2 - x1) ** 2 + (y2 - y1) ** 2;
        let dotProduct = (((object.x - x1) * (x2 - x1)) + ((object.y - y1) * (y2 - y1)))/distanceBetween;
        
        let cX = x1 + (dotProduct * (x2 - x1));
        let cY = y1 + (dotProduct * (y2 - y1));
        
        if (cX < Math.min(x1, x2) || cX > Math.max(x1, x2)) return false;
        if (cY < Math.min(y1, y2) || cY > Math.max(y1, y2)) return false;
        
        let distance = (object.x - cX) ** 2 + (object.y - cY) ** 2;
        if (distance <= totalSize ** 2) return true;
        return false;
    }
}

class HealthBoss {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        
        this.dx = 0;
        this.dy = 0;
        
        this.speed = 0.1 / slowness;
        this.friction = 0.85;
        
        this.health = 125 + bossHealthIncrease;
        this.prevHealth = 125 + bossHealthIncrease;
        this.maxHealth = 125 + bossHealthIncrease;
        this.invincibility = false;
        this.healing = false;
        
        this.shape = new ShapeStack([new Triangle(20, "#ff00ff"), new Square(40, "#0000ff")]);
        this.square = new Square(15, "#0000ff");
        this.sine = 0;
        
        this.ai = new ModeBasedAI([this.attack1, this.attack2, this.attack3, this.attack4, this.attack5], []);
        this.guns = [new HealthBossHealGun(), new HealthBossSniper(), new HealthBossCharge(), new HealthBossHealing(), new HealthBossLandmineBulletShooter()];
        this.closeRangeGun = new HealthBossLaserShooter();
        
        this.controls = {
            w: "up",
            a: "left",
            s: "down",
            d: "right",
        };
    }
    
    update() {
        if (this.delete) {
            bossDeathAnimation(this, 15);
            
            curRoom.dropCoins({x: curRoom.boundary.x + curRoom.boundary.width/2, y: curRoom.boundary.y + curRoom.boundary.height/2, shape: this.shape}, 20 * (bossIndex + 1));
            
            let distance = Math.random() * 20 + 200;
            let direction = Math.random() * Math.PI * 2;
            
            let x = Math.cos(direction) * distance + curRoom.boundary.width/2 + curRoom.boundary.x;
            let y = Math.sin(direction) * distance + curRoom.boundary.height/2 + curRoom.boundary.y;
            
            let drops = [HealthBossPlayerHealAll, HealthBossPlayerPower, HealthBossPlayerWeapon];
            
            let constructor = drops[~~(Math.random() * drops.length)];
            if (constructor != HealthBossPlayerPower) curRoom.misc.push(new GunHolder(x, y, new constructor()));
            else curRoom.misc.push(new PowerHolder(x, y, new constructor()));
            curRoom.generatedWaves = 2;
        }
        
        // find closest enemy
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

            if ((this.x - closestEnemy.x) ** 2 +
                (this.y - closestEnemy.y) ** 2 <= targetDistance ** 2);
            else {
                closestEnemy = null;
            }
        }
        
        if (closestEnemy && (this.x - closestEnemy.x) ** 2 + (this.y - closestEnemy.y) ** 2 <= 10000) {
            this.closeRangeGun.update(null);
            this.closeRangeGun.shoot(this.x, this.y, curRoom.players, Math.atan2(closestEnemy.y - this.y, closestEnemy.x - this.x), null);
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
        if (this.healing) {
            this.health += this.rage ? (1.4 * (this.prevHealth - this.health)) : (1.1 * (this.prevHealth - this.health));
            this.guns[3].update();
            this.guns[3].shoot(this.x, this.y, [], Math.random() * Math.PI * 2, null);
        }
        else if (this.invincibility) this.health = this.prevHealth;
        
        if (this.health < this.prevHealth) {
            this.invincibility = true;
            setTimeout((_ => {this.invincibility = false}).bind(this), invincibilityTime);
        }
        if (this.health <= 0) this.delete = true;
        this.prevHealth = this.health;
        this.health = Math.min(this.health, this.maxHealth);
        if (this.health <= this.maxHealth/2) this.rage = true;
        
        if (this.rage) {
            generateRageParticles(this);
        }
        
        // draw
        this.draw();
    }
    
    draw(drawHealthBar=true) {
        let healthBar = new Bar(canvas.width/2 - 200, 40, 400, 20, this.health, this.maxHealth);
        if (drawHealthBar) healthBar.draw();
        
        drawer.ctx.shadowBlur = 10;
        drawer.ctx.shadowColor = this.square.color;
        for (var i = 0; i < 4; i++) {
            let direction = i * Math.PI/2 + this.shape.direction + Math.PI/4;
            let distance = Math.sin(this.sine) * 3 + 19;
            
            this.square.direction = direction + Math.PI/4;
            let x = Math.cos(direction) * distance + this.x;
            let y = Math.sin(direction) * distance + this.y;
            drawer.fill(this.square.draw(x, y));
        }
        this.sine += 0.07;
        
        
        drawer.ctx.shadowColor = this.shape.shapes[0].color
        this.shape.draw(this.x, this.y);
        drawer.ctx.shadowBlur = 0;
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
    
    attack1(AI) {
        if (curRoom.generatedWaves === true || curRoom.generatedWaves == 3) {AI.attacking = false; return;}
        
        let direction = Math.random() * Math.PI * 2;
        this.shape.direction = direction;
        this.guns[0].update(null);
        this.guns[0].shoot(this.x, this.y, curRoom.players, direction, null);
        if (this.rage) {
            this.guns[0].update(null);
            this.guns[0].shoot(this.x, this.y, curRoom.players, direction + Math.PI, null);
        }
    }
    
    attack2(AI) {
        if (curRoom.generatedWaves === true || curRoom.generatedWaves == 3) {AI.attacking = false; return;}
        
        this.healing = true;
        setTimeout((_ => {
            this.healing = false;
        }).bind(this), 3000);

        setTimeout((_ => {
            AI.attacking = false;
        }).bind(this), 5000)
    }
    
    attack3(AI) {
        if (curRoom.generatedWaves === true || curRoom.generatedWaves == 3) {AI.attacking = false; return;}
        
        let player = curRoom.players[~~(Math.random() * curRoom.players.length)];
        let direction = player ? Math.atan2(player.y - this.y, player.x - this.x) : Math.random() * Math.PI * 2;
        this.shape.direction = direction;

        this.guns[2].timer = 999;
        this.guns[2].update(null);
        this.guns[2].shoot(this.x, this.y, curRoom.players, direction, null);
        drawer.shake -= 22;
        for (var i = 0; i < 5; i++) {
            setTimeout((_ => {
                if (curRoom.generatedWaves === true || curRoom.generatedWaves == 3) {AI.attacking = false; return;}
                
                let player = curRoom.players[~~(Math.random() * curRoom.players.length)];
                let direction = player ? Math.atan2(player.y - this.y, player.x - this.x) : Math.random() * Math.PI * 2;
                this.shape.direction = direction;
                
                this.guns[1].timer = 999;
                this.guns[1].update(null);
                this.guns[1].shoot(this.x, this.y, curRoom.players, direction, null);
                drawer.shake -= 10;
            }).bind(this), this.rage ? (400 * i + 1000) : (600 * i + 1000));
        }
        
        setTimeout((_ => {
            AI.attacking = false;
        }), this.rage ? 2400 : 3600);
    }
    
    attack4(AI, checking=false, timesChecked=0) {
        if (curRoom.generatedWaves === true || curRoom.generatedWaves == 3) {AI.attacking = false; return;}
        
        if (timesChecked > (this.rage ? 100 : 150)) {
            AI.attacking = false;
            return;
        }
        if (checking) {
            if (curRoom.enemies.length <= 1) {
                AI.attacking = false;
                return;
            }
            setTimeout((_ => {
                this.attack4(AI, true, timesChecked + 1);
            }).bind(this), 100);
            return;
        }
        
        let enemies = [PistolEnemy, MissileEnemy, ShotgunEnemy, LandmineEnemy];
        
        for (var i = 0; i < 3; i++) {
            let constructor = enemies[~~(Math.random() * enemies.length)];
            let x = Math.random() * (curRoom.boundary.width - 200) + curRoom.boundary.x + 100;
            let y = Math.random() * (curRoom.boundary.height - 200) + curRoom.boundary.y + 100;
            curRoom.enemies.push(new constructor(x, y));
        }
        
        setTimeout((_ => {
            this.attack4(AI, true);
        }).bind(this), 100);
    }
    
    attack5(AI) {
        for (let i = 0; i < 4; i++) {
            let direction = Math.PI/2 * i;
            
            this.guns[4].update(null);
            this.guns[4].shoot(this.x, this.y, curRoom.players, direction, null);
        }
        
        setTimeout(_ => AI.attacking = false, (this.rage ? 3000 : 2000));
    }
}

class HealthBossLaserShooter extends Gun {
    constructor() {
        super(HealthBossLaser, [3], new Triangle(15, "#ff0000"));
    }
}

class HealthBossLandmineBulletShooter extends Gun {
    constructor() {
        super(HealthBossLandmineBullet, [1], new Triangle(15, "#ff0000"), 10);
    }
}

class HealthBossHealGun extends Gun {
    constructor() {
        super(HealthBossHealBullets, [1], new Triangle(15, "#ff0000"), -0.5);
    }
}

class HealthBossCharge extends Gun {
    constructor() {
        super(HealthBossChargeExplosion, [1], new Triangle(15, "#ff0000"));
    }
}

class HealthBossSniper extends Gun {
    constructor() {
        super(HealthBossSniperBullet, [70], new Triangle(15, "#ff0000"), 10);
    }
}

class HealthBossHealing extends Gun {
    constructor() {
        super(HealthBossHealingParticle, [1], new Triangle(15, "#ff0000"));
    }
}

class HealthBossLaser extends Laser {
    constructor(x, y, targets, direction, power) {
        super(x, y, 1, {power: null, classification: "None"}, targets, [direction, direction], new Circle(1, "#00ff00"));
        this.madeHeal = false;
        drawer.shake -= 3
    }

    update() {
        if (this.delete && !this.madeHeal && this.thingKilled) {
            curRoom.enemies[0].health += 1;
            this.madeHeal = true;
        }
        super.update();
    }
}

class HealthBossLandmineBullet extends Bullet {
    constructor(x, y, targets, direction, power) {
        super(x, y, 5, power, targets, [direction - 0.1, direction + 0.1], [100, 100], [20, 22], new Triangle(15, "#ff0000"), [[HealthBossHealLandmine, 5]], true);
    }
}

class HealthBossHealLandmine extends Bullet {
    constructor(x, y, targets) {
        super(x, y, 5, {power: null, classification: "None"}, targets, [0, Math.PI * 2], [500, 500], [0, 0], new Hexagon(20, "#ff0000"));
        this.madeHeal = false;
        drawer.shake -= 3;
    }
    
    update() {
        if (this.delete && !this.madeHeal && this.thingKilled) {
            for (let i = 0; i < 20; i++) {
                let distance = Math.random() * 40;
                let direction = Math.random() * Math.PI * 2;
                curRoom.misc.push(new HealthBossLifeStealEffectForHealthBoss(Math.cos(direction) * distance + this.x, Math.sin(direction) * distance + this.y));
            }
            this.madeHeal = true;
        }
        super.update();
    }
}

class HealthBossHealingParticle extends Explosion {
    constructor(x, y, _, direction) {
        super(x, y, 0, [], [0, 0], [40, 60], new Hexagon(10, "rgba(0, 255, 0, 1)"), "rgba(0, 255, 0, 0)");
        this.x += Math.cos(direction) * 30;
        this.y += Math.sin(direction) * 30;
        this.direction = direction;
    }
    
    update() {
        super.update();
        this.x += Math.cos(this.direction) * 3;
        this.y += Math.sin(this.direction) * 3;
    }
}

class HealthBossSniperBullet extends Bullet {
    constructor(x, y, targets, direction, power) {
        super(x, y, 2, power, targets, [direction, direction], [60, 60], [100, 100], new Triangle(8, "#ff0000"), [[SniperSmoke, 1]])
    }
}

class HealthBossChargeExplosion extends Explosion {
    constructor(x, y, _, direction) {
        super(x + Math.cos(direction) * 40, y + Math.sin(direction) * 40, 0, [], [-2, -2], [60, 60], new Circle(120, "rgba(255, 0, 255, 1)"), "rgba(255, 0, 255, 1)", 5);
    }
}

class HealthBossHealBullets extends Bullet {
    constructor(x, y, targets, direction, power) {
        super(x, y, 1, power, targets, [direction, direction], [30, 35], [20, 22], new Circle(8, "#ff0000"));
    }
    
    update() {
        if (this.delete) {
            let healthBoss;
            for (var i = 0; i < curRoom.enemies.length; i++) if (curRoom.enemies[i].constructor == HealthBoss) {
                healthBoss = curRoom.enemies[i];
                break;
            }
            curRoom.enemies.push(new HealthBossEnemy(this.x, this.y, healthBoss));
        }
        super.update();
    }
}

class HealthBossEnemy extends Enemy {
    constructor(x, y, healthBoss) {
        super(x, y, 0.5, 0.85, new Pistol(), 5, new Triangle(15, "#ff00ff"), new RangeBasedAI(300));
        
        this.x = Math.max(curRoom.boundary.x + 100, Math.min(curRoom.boundary.x + curRoom.boundary.width - 100, this.x));
        this.y = Math.max(curRoom.boundary.y + 100, Math.min(curRoom.boundary.y + curRoom.boundary.height - 100, this.y));
        
        this.healthBoss = healthBoss;
        this.setNotAttacking = false;

        setTimeout(_ => {
            if (!this.healthBoss) return;

            this.healthBoss.ai.attacking = false;
            this.setNotAttacking = true;
        }, this.healthBoss?.rage ? 80000 : 12000);
    }
    
    update() {
        if (this.health <= 0 && !this.setNotAttacking) {
            setTimeout(_ => this.healthBoss.ai.attacking = false, this.healthBoss.rage ? 100 : 500);
            this.setNotAttacking = true;
        }
        
        if (!this.healthBoss) {
            this.delete = true;
            return;
        }
        
        super.update();
        if (this.healthBoss.health < this.healthBoss.maxHealth) {
            setTimeout((_ => {
                this.healthBoss.health = Math.min(this.healthBoss.maxHealth, this.healthBoss.health + 0.1);
            }).bind(this), 1000);
        }
    }
}

class HealthBossPlayerPower extends Power {
    constructor() {
        super(1, 0, 0, 0, "None", new ShapeStack([new Triangle(10, "#ff00ff"), new Square(20, "#0000ff")]));
        this.prevDirection = this.shape.direction;
        
        this.name = "Passive Healing";
    }
    
    gotPowerup(player, firstTime=true) {
        if (firstTime) this.prevDirection = this.shape.direction;
        if (this.shape.direction != this.prevDirection) {
            this.prevDirection = this.shape.direction;
            return;
        }
        if (player.health > 0) player.health = Math.min(playerMaxHealth, player.health + 0.1);
        setTimeout(_ => {
            this.gotPowerup(player, false);
        }, 100);
    }
}

class HealthBossPlayerHealAll extends Gun {
    constructor() {
        super(HealthBossBigLifestealBullet, [60], new ShapeStack([new Triangle(10, "#ff00ff"), new Square(20, "#0000ff")]), 0, "misc");
        
        this.name = "Soul Reaper";
    }
}

class HealthBossBigLifestealBullet extends Bullet {
    constructor(x, y, targets, direction, power, player) {
        super(x, y, 1, power, targets, [direction - 0.05, direction + 0.05], [30, 35], [25, 27], new Circle(7, "#ff0000"));
    }
    
    update() {
        if (this.delete && this.thingKilled) for (let i = 0; i < 3; i++) {
            let x = this.x + Math.random() * 100 - 50;
            let y = this.y + Math.random() * 100 - 50;
            curRoom.misc.push(new HealthBossLifeStealEffect(x, y));
        }
        super.update();
    }
}

class HealthBossPlayerWeapon extends Gun {
    constructor() {
        super(SniperBullet, [45], new ShapeStack([new Triangle(10, "#ff00ff"), new Square(20, "#0000ff")]), -3, "misc",
              (x, y, targets, direction, power, player) => {
            curRoom.misc.push(new HealthBossLifestealBullet(x, y, targets, direction, power, player));
        });
        
        this.name = "Soul Gatherer";
    }
}

class HealthBossLifestealBullet extends Bullet {
    constructor(x, y, targets, direction, power, player) {
        super(x, y, 1, power, targets, [direction - 0.05, direction + 0.05], [60, 75], [20, 22], new Circle(5, "#ff0000"));
    }
    
    update() {
        if (this.delete && this.thingKilled) {
            let healthGiven = Math.min(5, Math.ceil(this.thingKilled.maxHealth / 5));

            for (let i = 0; i < healthGiven; i++) curRoom.misc.push(new HealthBossLifeStealEffect(this.x + Math.random() * 100 - 50, this.y + Math.random() * 100 - 50));
        }

        super.update();
    }
}

class HealthBossLifeStealEffect {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        
        this.shape = new Circle(8, "#00ff00");
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
        
        for (let i in curRoom.players) {
            let v = curRoom.players[i];
            
            let distance = Math.sqrt((this.x - v.x) ** 2 + (this.y - v.y) ** 2);
            let direction = Math.atan2(v.y - this.y, v.x - this.x);
            
            this.x += Math.cos(direction) * (1000/distance);
            this.y += Math.sin(direction) * (1000/distance);
            
            if (distance <= pickupDistance * 2) {
                v.health = Math.min(playerMaxHealth, v.health + 1.5);
                this.delete = true;
                return;
            }
        }
        
        this.draw();
    }
    
    draw() {
        drawer.ctx.shadowBlur = 30;
        drawer.ctx.shadowColor = this.shape.color;
        drawer.fill(this.shape.draw(this.x, this.y));
        drawer.ctx.shadowBlur = 0;
    }
}

class HealthBossLifeStealEffectForHealthBoss {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        
        this.shape = new Circle(8, "#00ff00");
        this.timer = 0;
    }
    
    update() {
        if (this.delete) return;
        
        if (curRoom.enemies.length == 0) this.delete = true;
        
        // anti-lag
        this.timer++;
        if (this.timer >= itemStayTime) {
            this.delete = true;
            return;
        }
        
        for (let i in curRoom.enemies) {
            let v = curRoom.enemies[i];
            
            let distance = Math.sqrt((this.x - v.x) ** 2 + (this.y - v.y) ** 2);
            let direction = Math.atan2(v.y - this.y, v.x - this.x);
            
            this.x += Math.cos(direction) * (1000/distance);
            this.y += Math.sin(direction) * (1000/distance);
            
            if (distance <= pickupDistance * 2) {
                v.health = Math.min(v.maxHealth, v.health + 1.5);
                this.delete = true;
                return;
            }
        }
        
        this.draw();
    }
    
    draw() {
        drawer.ctx.shadowBlur = 30;
        drawer.ctx.shadowColor = this.shape.color;
        drawer.fill(this.shape.draw(this.x, this.y));
        drawer.ctx.shadowBlur = 0;
    }
}

class ExplosionBoss {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        
        this.dx = 0;
        this.dy = 0;
        
        this.speed = 1 / slowness;
        this.friction = 0.85;
        
        this.health = 100 + bossHealthIncrease;
        this.prevHealth = 100 + bossHealthIncrease;
        this.maxHealth = 100 + bossHealthIncrease;
        this.invincibility = false;
        this.rage = false;
        
        this.controls = {
            w: "up",
            a: "left",
            s: "down",
            d: "right",
        };
        
        this.shape = new ShapeStack([new Pentagon(20, "#ff0000"), new Polygon(7, 40, "#0000ff")]);
        
        this.ai = new ModeBasedAI([this.attack1, this.attack2, this.attack3, this.attack4, this.attack5], []);
        
        this.guns = [new ExplosionBossRingGun(), new ExplosionBossSpiralGun(), new ExplosionBossLandmineShooter(), new ExplosionBossRocketLauncher(), new ExplosionBossExplosionSummonerShooter()];
    }
    
    update() {
        if (this.delete) {
            bossDeathAnimation(this, 10);
            
            curRoom.dropCoins({x: curRoom.boundary.x + curRoom.boundary.width/2, y: curRoom.boundary.y + curRoom.boundary.height/2, shape: this.shape}, 20 * (bossIndex + 1));
            
            let distance = Math.random() * 15 + 200;
            let direction = Math.random() * Math.PI * 2;
            
            let x = Math.cos(direction) * distance + curRoom.boundary.width/2 + curRoom.boundary.x;
            let y = Math.sin(direction) * distance + curRoom.boundary.height/2 + curRoom.boundary.y;
            if (~~(Math.random() * 2) == 0) {
                curRoom.misc.push(new GunHolder(x, y, new ExplosionBossPlayerLauncher()));
            } else {
                curRoom.misc.push(new GunHolder(x, y, new ExplosionBossPlayerLandminer()));
            }
            curRoom.generatedWaves = 2;
        }
        
        // find closest enemy
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

            if ((this.x - closestEnemy.x) ** 2 +
                (this.y - closestEnemy.y) ** 2 <= targetDistance ** 2);
            else {
                closestEnemy = null;
            }
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
        
        if (this.health <= this.maxHealth/2) this.rage = true;
        
        // rage update
        if (this.rage) {
            this.moveSpeed = 1.2 / slowness;
            generateRageParticles(this);
        }
        
        // draw
        this.draw();
    }
    
    draw(drawHealthBar=true) {
        let healthBar = new Bar(canvas.width/2 - 200, 40, 400, 20, this.health, this.maxHealth);
        if (drawHealthBar) healthBar.draw();
        
        drawer.ctx.shadowBlur = 10;
        drawer.ctx.shadowColor = this.shape.color;
        this.shape.draw(this.x, this.y);
        drawer.ctx.shadowBlur = 0;
    }
    
    attack1(AI) {
        if (curRoom.generatedWaves === true || curRoom.generatedWaves == 3) {AI.attacking = false; return;}
        
        for (var i = 0; i < Math.PI * 2; i += Math.PI/10) {
            this.guns[0].update(null);
            this.guns[0].shoot(this.x, this.y, curRoom.players, i, null);
        }
        drawer.shake = 10;
        
        setTimeout(_ => {AI.attacking = false}, this.rage ? 750 : 1250);
    }
    
    attack2(AI, direction) {
        if (curRoom.generatedWaves === true || curRoom.generatedWaves == 3) {AI.attacking = false; return;}
        
        if (!direction) {
            direction = 0;
            this.attack2(AI, Math.PI);
            setTimeout(_ => {AI.attacking = false}, this.rage ? 3250 : 3750);
        }
        if (direction > Math.PI * 3) return;
        direction += Math.PI/10;
        this.guns[1].update(null);
        this.guns[1].shoot(this.x, this.y, curRoom.players, direction, null);
        this.shape.direction += Math.PI/20;
        setTimeout((_ => this.attack2(AI, direction)).bind(this), 100);
    }
    
    attack3(AI, timesMoved) {
        if (curRoom.generatedWaves === true || curRoom.generatedWaves == 3) {AI.attacking = false; return;}
        
        if (!timesMoved) timesMoved = 0;
        if (timesMoved >= 3) {
            AI.attacking = false;
            return;
        }
        
        this.guns[2].timer += 10;
        this.guns[3].timer += 10;
        this.guns[2].update(null);
        this.guns[3].update(null);
        
        if (this.guns[2].timer > 70) {
            for (var i = 0; i < 7; i++) {
                this.guns[2].timer = 100;
                let direction = i * Math.PI * 2/7 + this.shape.direction;
                this.guns[2].shoot(this.x + Math.cos(direction) * 140, this.y + Math.sin(direction) * 140, curRoom.players, direction, null);
            }
            drawer.shake -= 35;
        }
        if (this.guns[3].timer > 70) {
            for (var i = 0; i < 5; i++) {
                this.guns[3].timer = 100;
                let direction = i * Math.PI * 2/5 + this.shape.direction;
                this.guns[3].shoot(this.x, this.y, curRoom.players, direction, null);
            }
        }
        
        setTimeout((_ => {
            if (!AI.targetPos.x && !AI.targetPos.y) {
                AI.targetPos.x = ~~(Math.random() * (curRoom.boundary.width - 200) + curRoom.boundary.x + 100);
                AI.targetPos.y = ~~(Math.random() * (curRoom.boundary.height - 200) + curRoom.boundary.y + 100);
                timesMoved++;
            }
            this.attack3(AI, timesMoved);
        }).bind(this), 100);
    }
    
    attack4(AI) {
        for (let i = 0; i < (this.rage ? 6 : 4); i++) {
            let direction = (Math.PI * 2 / (this.rage ? 6 : 4)) * i;
            this.guns[4].update(null);
            this.guns[4].shoot(this.x, this.y, curRoom.players, direction, null);
        }
        
        setTimeout(_ => AI.attacking = false, this.rage ? 1500 : 3000);
    }
    
    attack5(AI, timesMoved) {
        if (curRoom.generatedWaves === true || curRoom.generatedWaves == 3) {AI.attacking = false; return;}
        
        if (!timesMoved) timesMoved = 0;
        if (timesMoved >= 3) {
            AI.attacking = false;
            return;
        }
        
        setTimeout((_ => {
            if (!AI.targetPos.x && !AI.targetPos.y) {                
                for (let i = 0; i < 3; i++) {
                    setTimeout(_ => {
                        let mines = (i + 1) * 5;
                        for (let j = 0; j < mines; j++) {
                            let direction = Math.PI * 2/mines * j;
                            let distance = (i + 1) * 100;
                            this.guns[2].timer = 100;
                            this.guns[2].update(null);
                            this.guns[2].shoot(Math.cos(direction) * distance + this.x, Math.sin(direction) * distance + this.y, curRoom.players, direction, null);
                        }
                    }, i * 250);
                }
                
                setTimeout(_ => {
                    AI.targetPos.x = ~~(Math.random() * (curRoom.boundary.width - 200) + curRoom.boundary.x + 100);
                    AI.targetPos.y = ~~(Math.random() * (curRoom.boundary.height - 200) + curRoom.boundary.y + 100);
                    timesMoved++;
                    this.attack5(AI, timesMoved)
                }, 3 * 250);
                
                return;
            }
            
            this.attack5(AI, timesMoved);
        }).bind(this), 100);
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
}

class ExplosionBossExplosionSummonerShooter extends Gun {
    constructor() {
        super(ExplosionBossExplosionSummoner, [1], new Triangle(15, "#ff0000"));
    }
}

class ExplosionBossRingGun extends Gun {
    constructor() {
        super(ExplosionBossRing, [1], new Triangle(15, "#ff0000"), -8);
    }
}

class ExplosionBossSpiralGun extends Gun {
    constructor() {
        super(ExplosionBossSpiral, [1], new Triangle(15, "#ff0000"));
    }
}

class ExplosionBossLandmineShooter extends Gun {
    constructor() {
        super(ExplosionBossLandmine, [70], new Triangle(15, "#ff0000"))
    }
}

class ExplosionBossRocketLauncher extends Gun {
    constructor() {
        super(ExplosionBossMissile, [70], new Triangle(15, "#ff0000"))
    }
}

class ExplosionBossExplosionSummoner extends Bullet {
    constructor(x, y, targets, direction, power) {
        super(x, y, 4, power, targets, [direction, direction], [100, 100], [10, 15], new Triangle(15, "#ff0000"), [[MissileExplosion, 20]], true);
    }
}

class ExplosionBossMissile extends RocketBullet {
    constructor(x, y, targets, direction, power) {
        super(x, y, 0, power, targets, [direction - 0.05, direction + 0.05], [30, 35], [20, 22], ExplosionBossRingExplosion, new Square(7, "#ff0000"), [[Smoke, 2], [Smoke, 1000]]);
    }
}

class ExplosionBossSpiral extends RocketBullet {
    constructor(x, y, targets, direction, power) {
        super(x, y, 2, power, targets, [direction, direction], [30, 50], [15, 15], ExplosionBossSpiralExplosion, new Square(7, "#ff0000"), [[Smoke, 20]]);
    }
}

class ExplosionBossSpiralExplosion extends Explosion {
    constructor(x, y, targets) {
        super(x, y, 2, targets, [15, 15], [3, 3], new Circle(0, "rgba(255, 165, 0, 1)"), "rgba(255, 165, 0, 0.3)", -14);
    }
}

class ExplosionBossExplosionSummonerExplosion extends Explosion {
    constructor(x, y, targets) {
        super(x, y, 2, targets, [15, 15], [10, 10], new Circle(0, "rgba(255, 165, 0, 1)"), "rgba(255, 165, 0, 0.3)", -14);
    }
}

class ExplosionBossRingExplosion extends Explosion {
    constructor(x, y, targets) {
        super(x, y, 3, targets, [15, 15], [5, 5], new Circle(0, "rgba(255, 165, 0, 1)"), "rgba(255, 165, 0, 0.3)", -14);
    }
}

class ExplosionBossRing extends RocketBullet {
    constructor(x, y, targets, direction, power) {
        super(x, y, 3, power, targets, [direction, direction], [30, 50], [10, 10], ExplosionBossRingExplosion, new Square(10, "#ff0000"), [[Smoke, 10]]);
    }
}

class ExplosionBossLandmine extends RocketBullet {
    constructor(x, y, targets, direction, power) {
        super(x, y, 5, power, targets, [direction, direction], [500, 500], [0, 0], ExplosionBossRingExplosion, new Hexagon(10, "#ff0000"));
    }
}

class ExplosionBossPlayerLauncher extends Gun {
    constructor(x, y, targets, direction, power) {
        super(ExplosionBossPlayerMissile, [70], new ShapeStack([new Pentagon(10, "#ff0000"), new Polygon(7, 20, "#0000ff")]), -29, "misc",
              (x, y, targets, direction, power) => {
            for (var i = 1; i < 12; i++) {
                let dir = (i/12) * Math.PI * 2 + direction;
                curRoom.misc.push(new ExplosionBossPlayerMissile(x, y, targets, dir, power));
            }
        });
        
        this.name = "Ring of Fire";
    }
}

class ExplosionBossPlayerLandminer extends Gun {
    constructor(x, y, targets, direction, power) {
        super(ExplosionBossPlayerLandmineBig, [35], new ShapeStack([new Pentagon(10, "#ff0000"), new Polygon(7, 20, "#0000ff")]), -10, "misc",
              (x, y, targets, direction, power) => {
            for (var i = 0; i < 6; i++) {
                let dir = (i/6) * Math.PI * 2;
                curRoom.misc.push(new ExplosionBossPlayerLandmine(x + Math.cos(dir) * 30, y + Math.sin(dir) * 30, targets, dir, power));
            }
        });
        
        this.name = "Cherry Blossom";
    }
}

class ExplosionBossPlayerLandmine extends RocketBullet {
    constructor(x, y, targets, direction, power) {
        super(x, y, 5, power, targets, [direction, direction], [500, 500], [0, 0], ExplosionBossRingExplosion, new Hexagon(10, "#f09eff"));
    }
}

class ExplosionBossPlayerLandmineBig extends RocketBullet {
    constructor(x, y, targets, direction, power) {
        super(x, y, 5, power, targets, [direction, direction], [500, 500], [0, 0], ExplosionBossRingExplosion, new Hexagon(20, "#ff55ff"));
    }
}

class ExplosionBossPlayerMissile extends RocketBullet {
    constructor(x, y, targets, direction, power) {
        super(x, y, 8, power, targets, [direction, direction], [50, 50], [15, 15], ExplosionBossSpiralExplosion, new Square(15, "#f93f12"), [[Smoke, 10]]);
    }
}

function bossDeathAnimation(boss, numOfExplosions) {
    for (let i = 0; i < numOfExplosions; i++) {
        let distance = Math.random() * boss.shape.size * 1.5 + boss.shape.size/2;
        let direction = Math.random() * Math.PI * 2;
        
        let x = Math.cos(direction) * distance + boss.x;
        let y = Math.sin(direction) * distance + boss.y;
        
        setTimeout(_ => {
            curRoom.misc.push(new SpawnExplosion(x, y))
        }, Math.random() * 1000);
    }
}

function generateRageParticles(boss) {
    for (let i = 0; i < (antilag ? 1 : 5); i++) {
        let direction = Math.random() * Math.PI * 2;
        
        curRoom.misc.push(new BossRageParticle(boss.x + Math.cos(direction) * (boss.shape.size - 20), boss.y + Math.sin(direction) * (boss.shape.size - 20), direction));
    }
}

class BossRageParticle extends Explosion {
    constructor(x, y, direction) {
        super(x, y, 0, [], [0, 0], [40, 60], new Circle(10, "rgba(102, 0, 102, 1)"), "rgba(102, 0, 102, 0)");
        this.x += Math.cos(direction) * 30;
        this.y += Math.sin(direction) * 30;
        this.direction = direction;
    }
    
    update() {
        super.update();
        this.x += Math.cos(this.direction) * 3;
        this.y += Math.sin(this.direction) * 3;
    }
}