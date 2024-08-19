const closestDistanceToTarget = 20;
const searchRange = 200;

class RangeBasedAI {
    constructor(minDistance) {
        this.minDistance = minDistance;
        this.targetPos = {x: undefined, y: undefined};
    }
    
    update(player, me) {
        let correction = curRoom.checkBoundaries({x: me.x, y: me.y, shape: {size: 100}});
        if (correction.x == -1 || correction.y == -1) {
            this.targetPos.x = Math.max(this.targetPos.x, curRoom.boundary.x + 10);
            this.targetPos.y = Math.max(this.targetPos.y, curRoom.boundary.y + 10);
            
            this.targetPos.x = Math.min(this.targetPos.x, curRoom.boundary.x + curRoom.boundary.width - 10);
            this.targetPos.y = Math.min(this.targetPos.y, curRoom.boundary.y + curRoom.boundary.height - 10);
        }
        
        if (!this.targetPos.x) {
            if (player) {
                let direction = Math.atan2(me.y - player.y, me.x - player.x);
                
                this.targetPos.x = player.x + Math.cos(direction) * this.minDistance;
                this.targetPos.y = player.y + Math.sin(direction) * this.minDistance;
            } else {
                this.targetPos.x = me.x + Math.random() * searchRange * 2 - searchRange;
                this.targetPos.y = me.y + Math.random() * searchRange * 2 - searchRange;
                
                this.targetPos.x = Math.max(curRoom.boundary.x + 100, Math.min(this.targetPos.x, curRoom.boundary.x + curRoom.boundary.width - 100));
                this.targetPos.y = Math.max(curRoom.boundary.y + 100, Math.min(this.targetPos.y, curRoom.boundary.y + curRoom.boundary.height - 100));
            }
        }
        
        if ((me.x - this.targetPos.x) ** 2 + (me.y - this.targetPos.y) ** 2 <= closestDistanceToTarget ** 2) {
            this.targetPos.x = undefined;
            this.targetPos.y = undefined;
            return {};
        }
        
        let keys = {};
        if (me.x > this.targetPos.x) keys.a = true;
        if (me.x < this.targetPos.x) keys.d = true;
        if (me.y > this.targetPos.y) keys.w = true;
        if (me.y < this.targetPos.y) keys.s = true;
        
        return keys;
    }
}

class ModeBasedAI {
    // health overrides random
    constructor(randomModes, healthModes) {
        this.randomModes = randomModes;
        this.healthModes = healthModes;
        this.prevRandomMode = -1;
        
        this.attacking = false;
        
        this.targetPos = {x: undefined, y: undefined};
    }
    
    update(player, me) {
        // make sure boss doesn't glitch out
        let correction = curRoom.checkBoundaries({x: me.x, y: me.y, shape: {size: 200}});
        if (correction.x == -1 || correction.y == -1) {
            this.targetPos.x = Math.max(this.targetPos.x, curRoom.boundary.x + 10);
            this.targetPos.y = Math.max(this.targetPos.y, curRoom.boundary.y + 10);
            
            this.targetPos.x = Math.min(this.targetPos.x, curRoom.boundary.x + curRoom.boundary.width - 10);
            this.targetPos.y = Math.min(this.targetPos.y, curRoom.boundary.y + curRoom.boundary.height - 10);
        }
        
        // move to target
        if ((me.x - this.targetPos.x) ** 2 + (me.y - this.targetPos.y) ** 2 <= closestDistanceToTarget ** 2) {
            this.targetPos.x = undefined;
            this.targetPos.y = undefined;
            return {};
        }
        
        let keys = {};
        if (me.x > this.targetPos.x) keys.a = true;
        if (me.x < this.targetPos.x) keys.d = true;
        if (me.y > this.targetPos.y) keys.w = true;
        if (me.y < this.targetPos.y) keys.s = true;
        
        if (this.attacking) return keys;
        
        for (let i in this.healthModes.length) {
            if (me.health <= this.healthModes[i][0]) {
                this.attacking = true;
                this.healthModes[i][1].bind(me)(this);
                return;
            }
        }
        
        this.attacking = true;
        let randomMode = ~~(Math.random() * this.randomModes.length);
        if (randomMode == this.prevRandomMode) randomMode += this.randomModes.length - 2;
        this.randomModes[randomMode % this.randomModes.length].bind(me)(this);
        this.prevRandomMode = randomMode;
        
        return keys;
    }
}

class HomingBullets {
    constructor(targets, searchRange) {
        this.targets = targets;
        this.searchRange = searchRange;
    }
    
    delete() {}
    
    update(bullet) {
        // find closest
        let closestEnemy;
        if (this.targets.length > 0) {
            let closestDistance = 0;
            for (let i in this.targets) {
                let enemy = this.targets[i];
                let distance1 = (bullet.x - enemy.x) ** 2 + (bullet.y - enemy.y) ** 2;
                let distance2 = (bullet.x - this.targets[closestDistance].x) ** 2 + (bullet.y - this.targets[closestDistance].y) ** 2;
                if (distance1 <= this.searchRange ** 2 && distance1 < distance2) closestDistance = i;
            }
            
            closestEnemy = this.targets[closestDistance];

            if (!((bullet.x - closestEnemy.x) ** 2 + (bullet.y - closestEnemy.y) ** 2 <= this.searchRange ** 2))
                return {left: false, right: false};
        }
        else return {left: false, right: false};
        
        let directionToTarget = Math.atan2(closestEnemy.y - bullet.y, closestEnemy.x - bullet.x);
        
        let dir1 = Math.abs((directionToTarget - bullet.direction) % (Math.PI * 2));
        let dir2 = Math.abs((directionToTarget - bullet.direction - Math.PI * 2) % (Math.PI * 2));
        let trueDirection1 = (directionToTarget - bullet.direction) % (Math.PI * 2);
        let trueDirection2 = (directionToTarget - bullet.direction - Math.PI * 2) % (Math.PI * 2);

        let trueDirection;
        if (dir1 < dir2) trueDirection = trueDirection1;
        if (dir1 > dir2) trueDirection = trueDirection2;
        
        
        let placeToGo = {left: false, right: false};
        
        if (Math.abs(trueDirection) < 0.05) placeToGo = {left: false, right: false};
        else if (trueDirection < 0) placeToGo = {left: false, right: true};
        else if (trueDirection > 0) placeToGo = {left: true, right: false};
        
        if (placeToGo.left) bullet.direction += bullet.speed / 200;
        if (placeToGo.right) bullet.direction -= bullet.speed / 200;
    }
}

class BouncingBullets {
    constructor() {
        this.room = curRoom;
        this.bounces = 5;
    }
    
    update(bullet) {}
    
    delete(bullet) {
        if (bullet.timer < bullet.lifespan && !bullet.thingKilled && this.room == curRoom) {
            this.bounces--;
            if (this.bounces <= 0) {
                bullet.delete = true;
                return;
            }
            
            let dx = Math.cos(bullet.direction) * bullet.speed;
            let dy = Math.sin(bullet.direction) * bullet.speed;
            
            if (bullet.x <= curRoom.boundary.x || bullet.x >= curRoom.boundary.x + curRoom.boundary.width) dx = -dx;
            if (bullet.y <= curRoom.boundary.y || bullet.y >= curRoom.boundary.y + curRoom.boundary.height) dy = -dy;
            
            let direction = Math.atan2(dy, dx);
            
            let x = Math.max(curRoom.boundary.x + 1, Math.min(curRoom.boundary.x + curRoom.boundary.width - 1, bullet.x));
            let y = Math.max(curRoom.boundary.y + 1, Math.min(curRoom.boundary.y + curRoom.boundary.height - 1, bullet.y));
            
            let newBullet = new bullet.constructor(x, y, bullet.targets, direction, bullet.powerItems);
            newBullet.charge = bullet.charge;
            newBullet.lifespan = bullet.lifespan - bullet.timer;
            newBullet.ai = this;
            
            curRoom.misc.push(newBullet);
        }
    }
}