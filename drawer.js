const shakeDiffuse = 0.9;
let screenShakeMultiplier = localStorage.screenShakeMultiplier ? localStorage.screenShakeMultiplier : 1;

class Drawer {
    constructor(ctx) {
        this.ctx = ctx;
        
        this.x = 0;
        this.y = 0;
        this.zoom = 0.8;
        
        this.vX = 0;
        this.vY = 0;
        
        this.shake = 0;
    }
    
    update() {
        this.shake *= shakeDiffuse;
        this.shake = Math.min(this.shake, 15);
        
        this.vX = this.x + (Math.random() * this.shake * 2 - this.shake) * screenShakeMultiplier;
        this.vY = this.y + (Math.random() * this.shake * 2 - this.shake) * screenShakeMultiplier;
    }
    
    rect(x, y, width, height) {
        this.ctx.scale(this.zoom, this.zoom);
        this.ctx.rect(x - this.vX, y - this.vY, width, height);
        this.ctx.scale(1/this.zoom, 1/this.zoom);
    }
    
    fillRect(x, y, width, height) {
        this.ctx.beginPath();
        this.rect(x, y, width, height);
        this.ctx.fill();
    }
    
    strokeRect(x, y, width, height) {
        this.ctx.beginPath();
        this.rect(x, y, width, height);
        this.ctx.stroke();
    }
    
    arc(x, y, radius, startAngle, endAngle) {
        this.ctx.scale(this.zoom, this.zoom);
        this.ctx.arc(x - this.vX, y - this.vY, radius, startAngle, endAngle);
        this.ctx.scale(1/this.zoom, 1/this.zoom);
    }
    
    moveTo(x, y) {
        this.ctx.moveTo(x - this.vX, y - this.vY);
    }
    
    lineTo(x, y) {
        this.ctx.lineTo(x - this.vX, y - this.vY);
    }
    
    fillText(text, x, y) {
        this.ctx.scale(this.zoom, this.zoom);
        this.ctx.translate(-this.vX, -this.vY);
        this.ctx.fillText(text, x, y);
        this.ctx.translate(this.vX, this.vY);
        this.ctx.scale(1/this.zoom, 1/this.zoom);
    }
    
    fill(path) {
        this.ctx.scale(this.zoom, this.zoom);
        this.ctx.translate(-this.vX, -this.vY);
        this.ctx.fill(path);
        this.ctx.translate(this.vX, this.vY);
        this.ctx.scale(1/this.zoom, 1/this.zoom);
    }
    
    stroke(path) {
        this.ctx.scale(this.zoom, this.zoom);
        this.ctx.translate(-this.vX, -this.vY);
        this.ctx.stroke(path);
        this.ctx.translate(this.vX, this.vY);
        this.ctx.scale(1/this.zoom, 1/this.zoom);
    }
}