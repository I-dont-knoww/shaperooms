class PowerHolder {
    constructor(x, y, power, forever=false) {
        this.x = x;
        this.y = y;
        
        this.timer = 0;
        this.forever = forever;
        
        this.power = power;
        this.power.shape.direction = Math.random() * Math.PI * 2;
    }
    
    update() {
        // delete myself
        if (curRoom.enemies.length == 0 && curRoom.waves.length == 0) this.timer++;
        if (this.forever) this.timer = 0;
        if (this.timer >= itemStayTime) {
            this.delete = true;
            return;
        }
        
        this.power.shape.direction += 0.05;
        this.draw();
        
        if ((mouse.x - this.x) ** 2 + (mouse.y - this.y) ** 2 <= pickupDistance ** 2) {
            this.showText();
        }
    }
    
    showText() {
        drawer.ctx.fillStyle = border;
        drawer.ctx.textAlign = "center";
        drawer.ctx.textBaseline = "middle";
        drawer.ctx.font = "20px Raleway";
        drawer.fillText(this.power.name, this.x, this.y - 40);
        drawer.ctx.font = "15px Raleway";
        drawer.fillText("Classification: " + (this.power.classification == " " ? "anything" : this.power.classification), this.x, this.y - 20);
    }
    
    draw() {
        drawer.ctx.shadowBlur = 10;
        drawer.ctx.shadowColor = this.power.shape.color;
        drawer.fill(this.power.shape.draw(this.x, this.y));
        drawer.ctx.shadowBlur = 0;
    }
}

class Power {
    constructor(timerSpeed, damage, bulletSpeed, lifespan, classification, shape) {
        this.timerSpeed = timerSpeed;
        
        this.damage = damage;
        this.bulletSpeed = bulletSpeed;
        this.lifespan = lifespan;
        
        this.classification = classification;
        this.shape = shape;
        
        this.isPower = true;
        this.oneTime = false;
        
        this.name = "";
    }
    
    gotPowerup(player) {
        
    }
    
    dropPowerup(player) {
        
    }
    
    bulletGotPowerup(bullet) {
        
    }
}

class NoPower extends Power {
    constructor() {
        super(1, 0, 0, 0, "None", new Triangle(10, "#ff00ff"));
        this.name = "No Power";
    }
}

class Health extends Power {
    constructor() {
        super(1, 0, 0, 0, "None", new Square(10, "#ff00ff"));
        this.name = "Max Health Increase";
        this.oneTime = true;
    }
    
    gotPowerup(player) {
        curRoom.misc.push(new MaxHealthIncrease(player.x, player.y));
        
        playerMaxHealth += 1;
        curRoom.players.forEach(v => v.health++);
        this.doneYet = true;
    }
}

class MoveSpeed extends Power {
    constructor() {
        super(1, 0, 0, 0, "None", new Pentagon(10, "#ff00ff"));
        this.name = "Move Speed Increase";
    }
    
    gotPowerup(player) {
        player.defaultMoveSpeed = 1.5 / slowness;
    }
    
    dropPowerup(player) {
        player.defaultMoveSpeed = 1 / slowness;
    }
}

class HomingPowerup extends Power {
    constructor() {
        super(1, 0, 0, 0, " ", new Hexagon(10, "#ff00ff"));
        this.name = "Homing Powerup";
    }
    
    bulletGotPowerup(bullet) {
        bullet.ai = new HomingBullets(bullet.targets, 800);
    }
}

class BouncingPowerup extends Power {
    constructor() {
        super(1, 0, 0, 0, " ", new Polygon(7, 10, "#ff00ff"));
        this.name = "Bouncing Powerup";
    }
    
    bulletGotPowerup(bullet) {
        bullet.ai = new BouncingBullets();
    }
}

class AssaultBulletSpeed extends Power {
    constructor() {
        super(1, 0, 5, 0, "assault", new Square(10, "#ff0000"));
        this.name = "Bullet Speed Buff";
    }
}

class AssaultBulletLifespan extends Power {
    constructor() {
        super(1, 0, 0, 5, "assault", new Triangle(10, "#ff0000"));
        this.name = "Bullet Lifespan Buff";
    }
}

class AssaultBulletDamage extends Power {
    constructor() {
        super(1, 2, 0, 0, "assault", new Pentagon(10, "#ff0000"));
        this.name = "Bullet Damage Buff";
    }
}

class AssaultReloadSpeed extends Power {
    constructor() {
        super(2, 0, 0, 0, "assault", new Hexagon(10, "#ff0000"));
        this.name = "Reload Speed Buff";
    }
}

class ShotgunBulletSpeed extends Power {
    constructor() {
        super(1, 0, 5, 0, "shotgun", new Square(10, "#0000ff"));
        this.name = "Bullet Speed Buff";
    }
}

class ShotgunBulletLifespan extends Power {
    constructor() {
        super(1, 0, 0, 5, "shotgun", new Triangle(10, "#0000ff"));
        this.name = "Bullet Lifespan Buff";
    }
}

class ShotgunBulletDamage extends Power {
    constructor() {
        super(1, 2, 0, 0, "shotgun", new Pentagon(10, "#0000ff"));
        this.name = "Bullet Damage Buff";
    }
}

class ShotgunReloadSpeed extends Power {
    constructor() {
        super(2, 0, 0, 0, "shotgun", new Hexagon(10, "#0000ff"));
        this.name = "Reload Speed Buff";
    }
}

class LauncherBulletSpeed extends Power {
    constructor() {
        super(1, 0, 5, 0, "launcher", new Square(10, "#ffff00"));
        this.name = "Bullet Speed Buff";
    }
}

class LauncherBulletLifespan extends Power {
    constructor() {
        super(1, 0, 0, 5, "launcher", new Triangle(10, "#ffff00"));
        this.name = "Bullet Lifespan Buff";
    }
}

class LauncherBulletDamage extends Power {
    constructor() {
        super(1, 2, 0, 0, "launcher", new Pentagon(10, "#ffff00"));
        this.name = "Bullet Damage Buff";
    }
}

class LauncherReloadSpeed extends Power {
    constructor() {
        super(2, 0, 0, 0, "launcher", new Hexagon(10, "#ffff00"));
        this.name = "Reload Speed Buff";
    }
}

class SniperBulletSpeed extends Power {
    constructor() {
        super(1, 0, 5, 0, "sniper", new Square(10, "#00ff00"));
        this.name = "Bullet Speed Buff";
    }
}

class SniperBulletLifespan extends Power {
    constructor() {
        super(1, 0, 0, 5, "sniper", new Triangle(10, "#00ff00"));
        this.name = "Bullet Lifespan Buff";
    }
}

class SniperBulletDamage extends Power {
    constructor() {
        super(1, 2, 0, 0, "sniper", new Pentagon(10, "#00ff00"));
        this.name = "Bullet Damage Buff";
    }
}

class SniperReloadSpeed extends Power {
    constructor() {
        super(2, 0, 0, 0, "sniper", new Hexagon(10, "#00ff00"));
        this.name = "Reload Speed Buff";
    }
}

class MiscBulletSpeed extends Power {
    constructor() {
        super(1, 0, 5, 0, "misc", new Square(10, border));
        this.name = "Bullet Speed Buff";
    }
}

class MiscBulletLifespan extends Power {
    constructor() {
        super(1, 0, 0, 5, "misc", new Triangle(10, border));
        this.name = "Bullet Lifespan Buff";
    }
}

class MiscBulletDamage extends Power {
    constructor() {
        super(1, 2, 0, 0, "misc", new Pentagon(10, border));
        this.name = "Bullet Damage Buff";
    }
}

class MiscReloadSpeed extends Power {
    constructor() {
        super(2, 0, 0, 0, "misc", new Hexagon(10, border));
        this.name = "Reload Speed Buff";
    }
}

const powers = {
    assault: [AssaultBulletDamage, AssaultBulletLifespan, AssaultBulletSpeed, AssaultReloadSpeed],
    shotgun: [ShotgunBulletDamage, ShotgunBulletLifespan, ShotgunBulletSpeed, ShotgunReloadSpeed],
    launcher: [LauncherBulletDamage, LauncherBulletLifespan, LauncherBulletSpeed, LauncherReloadSpeed],
    sniper: [SniperBulletDamage, SniperBulletLifespan, SniperBulletSpeed, SniperReloadSpeed],
    misc: [MiscBulletDamage, MiscBulletLifespan, MiscBulletSpeed, MiscReloadSpeed]
};