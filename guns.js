const itemStayTime = 2000;

class GunHolder {
    constructor(x, y, gun, forever=false) {
        this.x = x;
        this.y = y;
        
        this.timer = 0;
        this.forever = forever;
        
        this.gun = gun;
        this.gun.shape.direction = Math.random() * Math.PI * 2;
    }
    
    update() {
        // delete myself
        if (curRoom.enemies.length == 0 && curRoom.waves.length == 0) this.timer++;
        if (this.forever) this.timer = 0;
        if (this.timer >= itemStayTime) {
            this.delete = true;
            return;
        }
        
        drawer.ctx.shadowBlur = 10;
        drawer.ctx.shadowColor = this.gun.shape.color;
        this.gun.draw(this.x, this.y);
        drawer.ctx.shadowBlur = 0;
        
        if ((mouse.x - this.x) ** 2 + (mouse.y - this.y) ** 2 <= pickupDistance ** 2) {
            this.showText();
        }
    }
    
    showText() {
        drawer.ctx.fillStyle = border;
        drawer.ctx.textAlign = "center";
        drawer.ctx.textBaseline = "middle";
        drawer.ctx.font = "20px Raleway";
        drawer.fillText(this.gun.name, this.x, this.y - 40);
        drawer.ctx.font = "15px Raleway";
        drawer.fillText("Classification: " + this.gun.classification, this.x, this.y - 20);
    }
}

class Gun {
    // reload time is arr
    constructor(bullet, reloadTime, shape, shake=0, classification="", customShoot=null) {
        this.bullet = bullet;
        
        this.timer = 0;
        this.bulletIndex = 0;
        this.reloadTime = reloadTime;
        this.maxReloadTime = Math.max(...reloadTime);
        this.shake = shake;
        
        this.shape = shape;
        
        this.classification = classification != "" ? classification : Gun.classify(reloadTime);
        this.customShoot = customShoot;
        this.alwaysShoot = undefined;
        
        this.recoil = 0;
        this.constantRecoil = 0;
        
        this.rarityModifier = 1;
        this.rarityBias = 0;
        
        this.name = "";
    }
    
    draw(x, y) {
        drawer.fill(this.shape.draw(x, y));
    }
    
    update(power) {
        if (power && this.classification.includes(power.classification)) this.timer += power.timerSpeed - 1;
        this.timer++;
        
        if (this.timer >= this.maxReloadTime * 2) this.bulletIndex = 0;
    }
    
    shoot(x, y, targets, direction, power, shooter) {
        if (this.alwaysShoot) this.alwaysShoot.bind(this)(x, y, targets, direction, {power: power, classification: this.classification}, shooter);
        if (shooter) {
            shooter.x = shooter.x - Math.cos(shooter.shape.direction) * this.constantRecoil;
            shooter.y = shooter.y - Math.sin(shooter.shape.direction) * this.constantRecoil;
            
            let x1 = curRoom.boundary.x + shooter.shape.size;
            let x2 = curRoom.boundary.width + curRoom.boundary.x - shooter.shape.size;
            let y1 = curRoom.boundary.y + shooter.shape.size;
            let y2 = curRoom.boundary.height + curRoom.boundary.y - shooter.shape.size;
            
            shooter.x = Math.min(x2, Math.max(x1, shooter.x));
            shooter.y = Math.min(y2, Math.max(y1, shooter.y));
        }
        
        if (this.timer >= (this.reloadTime[this.bulletIndex]) * slowness / 1.5) {
            // shake
            drawer.shake += this.shake;
            
            curRoom.misc.push(new this.bullet(x, y, targets, direction, {power: power, classification: this.classification}));
            this.timer = 0;
            
            this.bulletIndex++;
            this.bulletIndex %= this.reloadTime.length;
            
            if (shooter) {
                shooter.dx = shooter.dx - Math.cos(shooter.shape.direction) * this.recoil;
                shooter.dy = shooter.dy - Math.sin(shooter.shape.direction) * this.recoil;
            }
            
            if (this.customShoot) this.customShoot.bind(this)(x, y, targets, direction, {power: power, classification: this.classification}, shooter);
            
            if (this.reloadTime[this.bulletIndex] <= 0) this.shoot(x, y, targets, direction, power, shooter);
        }
    }
    
    static classify(reloadTime) {
        if (reloadTime.length == 1) {
            if (reloadTime[0] < 10) return "assault";
            else return "sniper";
        }
        let type = {shotgun: 0, launcher: 0};
        for (var i in reloadTime) {
            if (reloadTime[i] == 0) type.shotgun++;
            else if (reloadTime[i] <= 15) type.launcher++;
        }
        if (type.shotgun == type.launcher) return "misc";
        else if (type.shotgun > type.launcher) return "shotgun";
        else if (type.launcher > type.shotgun) return "launcher";
    }
    
    static calculateRarity(gun) {
        let bullet = new gun.bullet(0, 0, [], [], {power: null, classification: ""});
        let damage = bullet.calculateDamage();
        
        let totalReloadSpeed = gun.reloadTime.reduce((a, c) => a + c);
        // damage in 100 frames
        return Math.round(((damage * gun.reloadTime.length)/totalReloadSpeed) * 100 * gun.rarityModifier) + gun.rarityBias;
    }
}

class ChargeGun {
    // charge weapons and slowness dont mix
    constructor(chargeEffect, chargeTime, chargeDelayTime, reloadTime, shape, shake=0, classification="") {
        /*
        no custom shoot yet
        only one charge attack
        then reg attacks
        [[time, bullet]]
        */
        this.chargeEffect = new chargeEffect();
        this.chargeTime = chargeTime;
        this.chargeDelayTime = chargeDelayTime;
        
        this.shape = shape;
        
        this.timer = 0;
        this.reloadTime = reloadTime;
        this.maxReloadTime = reloadTime.reduce((a, c) => Math.max(a, c[0]));
        this.shake = shake;
        
        this.shape = shape;
        
        this.classification = classification != "" ? classification : Gun.classify(reloadTime);
        
        this.recoil = 0;
        this.constantRecoil = 0;
        
        this.rarityModifier = 1;
        this.rarityBias = 0;
        
        this.name = "";

        this.bulletSpeed = new this.reloadTime[0][1](0, 0, [], 0, this.power ? this.power : new NoPower()).speed;
    }
    
    draw(x, y) {
        drawer.fill(this.shape.draw(x, y));
    }
    
    update(power) {
        if (this.timer <= this.chargeDelayTime && (this.chargeEffect.x != this.x || this.chargeEffect.y != this.y)) {
            if (power && this.classification.includes(power.classification)) this.timer += power.timerSpeed - 1;
            this.timer++;
        }
    }
    
    shoot(x, y, targets, direction, power, shooter) {
        if (power && this.classification.includes(power.classification)) this.timer += power.timerSpeed - 1;
        this.timer++;
        
        if (this.timer < this.chargeDelayTime * slowness / 1.5) return;
        this.chargeEffect.update(x, y, direction, this);
        
        setTimeout((_ => {
            if (!keys[shooter.shootButton] && this.timer > this.chargeDelayTime) {
                let timer = Math.min(this.timer - this.chargeDelayTime, this.chargeTime);
                let sum = 0;
                for (let i in this.reloadTime) {
                    sum += this.reloadTime[i][0];
                    setTimeout((_ => {
                        let bullet = new this.reloadTime[i][1](x, y, targets, direction, {power: power, classification: this.classification});
                        bullet.charge = timer;
                        curRoom.misc.push(bullet);
                    }).bind(this), sum);
                }
                this.timer = 0;
            }
        }).bind(this), 20);
        
        if (shooter) {
            shooter.x = shooter.x - Math.cos(shooter.shape.direction) * this.constantRecoil;
            shooter.y = shooter.y - Math.sin(shooter.shape.direction) * this.constantRecoil;
            
            let x1 = curRoom.boundary.x + shooter.shape.size;
            let x2 = curRoom.boundary.width + curRoom.boundary.x - shooter.shape.size;
            let y1 = curRoom.boundary.y + shooter.shape.size;
            let y2 = curRoom.boundary.height + curRoom.boundary.y - shooter.shape.size;
            
            shooter.x = Math.min(x2, Math.max(x1, shooter.x));
            shooter.y = Math.min(y2, Math.max(y1, shooter.y));
        }
        
        this.timer = Math.min(this.timer, (this.chargeTime + this.chargeDelayTime) * slowness / 1.5);
    }
    
    static calculateRarity(gun) {
        let totalDamage = 0;
        let totalTime = gun.chargeDelayTime + gun.chargeTime;
        for (let i in gun.reloadTime) {
            let bullet = new gun.reloadTime[i][1](0, 0, [], [], {power: null, classification: ""});
            totalDamage += bullet.calculateDamage(gun.chargeTime);
            totalTime += gun.reloadTime[i][0];
        }
        
        return Math.round((totalDamage/totalTime) * 100 * gun.rarityModifier) + gun.rarityBias;
    }
}

class AdminGun extends Gun {
    constructor() {
        super(AdminBullet, [1], new Triangle(10, border), -9998);
        this.name = "Admin Gun";
    }
}

class NoGun extends Gun {
    constructor() {
        super(NothingBullet, [1], new Triangle(10, border));
    }
}

class Pistol extends Gun {
    constructor() {
        super(PistolBullet, [30], new Triangle(10, "#ff0000"));
        this.name = "Pistol";
    }
}

class AssaultRifle extends Gun {
    constructor() {
        super(PistolBullet, [7], new Square(10, "#ff0000"));
        this.rarityBias = -4;
        this.name = "Assault Rifle";
    }
}

class Minigun extends Gun {
    constructor() {
        super(MinigunBullet, [7, 0, 0, 0], new Pentagon(10, "#ff0000"), 0.5, "assault");
        this.rarityBias = -37;
        this.constantRecoil = 1;
        
        this.name = "Minigun";
    }
}

class ExplosiveMinigun extends Gun {
    constructor() {
        super(MinigunMissile, [7, 0, 0, 0, 0], new Hexagon(10, "#ff0000"), 0.5, "assault");
        this.rarityBias = -99;
        this.constantRecoil = 2;
        
        this.name = "Explosive Minigun";
    }
}

class RainbowMinigun extends Gun {
    constructor() {
        super(NothingBullet, [7, 0, 0, 0, 0], new Heptagon(10, "#ff0000"), 0.5, "assault",
              (x, y, targets, direction, power) => {
            const bullets = [MinigunBurnBullet, MinigunPoisonBullet, MinigunFreezeBullet, MinigunBullet];
            let bulletConstructor = bullets[~~(Math.random() * bullets.length)];
            curRoom.misc.push(new bulletConstructor(x, y, targets, direction, power));
        });
        this.constantRecoil = 2;
        this.rarityBias = 60;

        this.bulletSpeed = new MinigunBullet(0, 0, [], 0, new NoPower()).speed;
        
        this.name = "RGB Minigun";
    }
}

class Shotgun extends Gun {
    constructor() {
        super(ShotgunBullet, [40, 0, 0, 0], new Triangle(10, "#0000ff"), 1);
        
        this.name = "Shotgun";
    }
}

class AssaultShotgun extends Gun {
    constructor() {
        super(ShotgunBullet, [40, 0, 0, 0, 10, 0, 0, 0], new Square(10, "#0000ff"), 2);
        this.rarityBias = -12;
        
        this.name = "Assault Shotgun";
    }
}

class HomingShotgun extends Gun {
    constructor() {
        super(HomingShotgunBullet, [40, 0, 0, 0], new Pentagon(10, "#0000ff"), 2);
        this.recoil = 2;
        this.rarityBias = -10;
        
        this.name = "Homing Shotgun";
    }
}

class RocketShotgun extends Gun {
    constructor() {
        super(ShotgunMissile, [70, 0, 0, 0, 0, 0, 0], new Hexagon(10, "#0000ff"));
        this.rarityBias = -30;
        this.recoil = 3;
        
        this.name = "Rocket Shotgun";
    }
}

class SplitterShotgun extends Gun {
    constructor() {
        super(SplitterBullet, [50], new Heptagon(10, "#0000ff"), 0, "shotgun");
        this.recoil = 10;
        this.rarityBias = 24;
        
        this.name = "Splitter Gun";
    }
}

class Sniper extends Gun {
    constructor() {
        super(SniperBullet, [70], new Triangle(10, "#00ff00"), 1);
        
        this.name = "Sniper";
    }
}

class AssaultSniper extends Gun {
    constructor() {
        super(SniperBullet, [35], new Square(10, "#00ff00"), 1);
        this.rarityBias = 3;
        
        this.name = "Assault Sniper";
    }
}

class PowerfulSniper extends Gun {
    constructor() {
        super(PowerfulSniperBullet, [60], new Pentagon(10, "#00ff00"), 10);
        this.recoil = 10;
        
        this.name = "Railgun";
    }
}

class TriplePowerfulSniper extends Gun {
    constructor() {
        super(PowerfulSniperBullet, [70], new Hexagon(10, "#00ff00"), 0, "shotgun",
              (x, y, targets, direction, power) => {
            curRoom.misc.push(new PowerfulSniperBullet(x, y, targets, direction + Math.PI/16, power));
            curRoom.misc.push(new PowerfulSniperBullet(x, y, targets, direction - Math.PI/16, power));
        });
        this.rarityBias = 24;
        this.recoil = 20;
        
        this.name = "Triple Railgun";
    }
}

class PiercingSniper extends Gun {
    constructor() {
        super(PiercingSniperBullet, [70, 20], new Heptagon(10, "#00ff00"), 0, "sniper");
        this.rarityBias = 16;
        this.recoil = 20;
        
        this.name = "Piercing Railgun";
    }
}

class RocketLauncher extends Gun {
    constructor() {
        super(Missile, [70], new Triangle(10, "#ffff00"));
        this.recoil = 3;
        
        this.name = "Rocket Launcher";
    }
}

class MissileLauncher extends Gun {
    constructor() {
        super(Missile, [70, 10, 10, 10], new Square(10, "#ffff00"));
        this.recoil = 1;
        
        this.name = "Missile Battery";
    }
}

class MissileSniper extends Gun {
    constructor() {
        super(SniperMissile, [70, 20], new Pentagon(10, "#ffff00"), 0, "launcher");
        this.recoil = 10;
        
        this.name = "Explosive Railgun"; // TODO
    }
}

class ClusterBombLauncher extends Gun {
    constructor() {
        super(ClusterBomb, [70], new Hexagon(10, "#ffff00"));
        this.rarityBias = 30;
        this.recoil = 30;
        
        this.name = "Cluster Bomb Launcher";
    }
}

class ClusterBombBattery extends Gun {
    constructor() {
        super(ClusterBomb, [70, 10, 10, 10], new Heptagon(10, "#ffff00"), 0, "launcher");
        this.rarityBias = 20;
        this.recoil = 3;
        
        this.name = "Cluster Bomb Battery";
    }
}

class LaserPistol extends Gun {
    constructor() {
        super(LaserPistolBullet, [30], new Triangle(10, "#00ffff"));
        
        this.name = "Laser Pistol";
    }
}

class LaserShotgun extends Gun {
    constructor() {
        super(LaserShotgunBullet, [60, 0, 0, 0], new Square(10, "#00ffff"));
        this.rarityBias = 4;
        
        this.name = "Laser Shotgun";
    }
}

class LaserContinuous extends Gun {
    constructor() {
        super(LaserContinuousBullet, [1], new Pentagon(10, "#00ffff"), 0, "sniper", 
              (x, y, targets, direction, power, player) => {
            setTimeout((_ => {
                if (!keys[player.shootButton])
                    curRoom.misc.push(new LaserPistolBullet(x, y, [], direction, power));
            }).bind(this), 20);
        });
        this.rarityBias = -64;
        
        this.name = "Laser Beam";
    }
}

class LightShow extends Gun {
    constructor() {
        super(StrongLaserPistolBullet, [50], new Hexagon(10, "#00ffff"), -90, "shotgun",
              (x, y, targets, direction, power) => {
            for (let i = 1; i < 16; i++) {
                let dir = (i/16) * Math.PI * 2 + direction;
                curRoom.misc.push(new StrongLaserPistolBullet(x, y, targets, dir, power));
            }
        });
        this.rarityBias = 24;
        
        this.name = "Light Show";
    }
}

class ExplosiveLaserPistol extends Gun {
    constructor() {
        super(VeryStrongLaserPistolBullet, [50], new Heptagon(10, "#00ffff"), 0, "shotgun",
              (x, y, targets, direction, power) => {
            curRoom.misc.push(new VeryStrongLaserPistolBullet(x, y, targets, direction + 0.1, power));
            curRoom.misc.push(new VeryStrongLaserPistolBullet(x, y, targets, direction - 0.1, power));
        });
        
        this.name = "Laser Annihilation";
        this.rarityBias = 40;
    }
}

class ChargePistol extends ChargeGun {
    constructor() {
        super(ChargePistolEffect, 60, 30, [[0, ChargePistolBullet]], new Triangle(10, "#bd00ff"));
        this.name = "Plasma Pistol";
        this.rarityBias = -4;
        this.costBias = 30;
    }
}

class ChargeLaserPistol extends ChargeGun {
    constructor() {
        super(ChargePistolEffect, 60, 30, [[0, ChargeLaserBullet]], new Square(10, "#bd00ff"));
        this.name = "Plasma Laser";
    }
}

class ChargeLaserShotgun extends ChargeGun {
    constructor() {
        super(ChargeLaserShotgunEffect, 120, 40, [[0, ChargeLaserBulletShotgun], [0, ChargeLaserBulletShotgun], [0, ChargeLaserBulletShotgun], [0, ChargeLaserBulletShotgun]], new Pentagon(10, "#bd00ff"), null, "shotgun");
        this.name = "Plasma Shotgun"
    }
}

class ChargeStatusPistol extends ChargeGun {
    constructor() {
        super(ChargeStatusPistolEffect, 30, 10, [[0, ChargeStatusBullet]], new Hexagon(10, "#bd00ff"));
        this.rarityBias = 41;
        this.name = "Toxic Plasma Pistol";
    }
}

class ChargeNuke extends ChargeGun {
    constructor() {
        super(ChargeNukeEffect, 180, 70, [[0, ChargeNukeBullet]], new Heptagon(10, "#bd00ff"));
        this.rarityBias = 60;
        this.name = "Nuke Generator";
    }
}

class LandmineShooter extends Gun {
    constructor() {
        super(Landmine, [70], new Triangle(10, border), 0, "misc");
        this.rarityBias = -7;
        
        this.name = "Landminer";
    }
}