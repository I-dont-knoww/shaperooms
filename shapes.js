const friction = 0.9;

class Shape {
    constructor(color) {
        this.color = color;
    }
    
    draw(x, y) {
        drawer.ctx.fillStyle = this.color;
        drawer.ctx.strokeStyle = this.color;
    }
}

class Polygon extends Shape {
    constructor(sides, size, color) {
        super(color);
        this.sides = sides;
        this.size = size;
        this.direction = 0;
    }
    
    draw(x, y, override=false) {
        if (!override) super.draw();
        
        if (this.sides >= 100) {
            let path = new Path2D();
            path.arc(x, y, this.size, 0, Math.PI * 2);
            return path;
        }
        
        let path = new Path2D();
        path.moveTo(Math.cos(this.direction) * this.size + x, Math.sin(this.direction) * this.size + y);
        for (let i = 0; i < this.sides; i++) {
            path.lineTo(Math.cos(this.direction + Math.PI * (i + 1) * 2/this.sides) * this.size + x,
                        Math.sin(this.direction + Math.PI * (i + 1) * 2/this.sides) * this.size + y);
        }
        
        return path;
    }
}

class Circle extends Shape {
    constructor(size, color) {
        super(color);
        this.size = size;
    }
    
    draw(x, y, override=false) {
        if (!override) super.draw();
        
        let path = new Path2D();
        path.arc(x, y, this.size, 0, Math.PI * 2);
        
        return path;
    }
}

class ShapeStack {
    // top shapes first
    constructor(shapes) {
        this.shapes = shapes.reverse();
        this.color = this.shapes[0].color;
        
        this.size = shapes.reduce((a, c) => Math.max(c.size, a), 0);
        this.direction = 0;
    }
    
    draw(x, y) {
        this.shapes.forEach((v, i) => {
            v.direction = this.direction;
            drawer.fill(v.draw(x, y));
        });
        return new Path2D();
    }
}

class Hitbox extends ShapeStack {
    constructor(polygon, hitbox) {
        super([polygon]);
        this.size = hitbox;
    }
}

class Button extends Shape {
    constructor(x, y, width, height, text, color, font) {
        super(color);
        this.x = x; this.y = y;
        this.width = width;
        this.height = height;
        
        this.text = text;
        this.font = font;
        
        this.click = false;
    }
    
    update() {
        if (virtualMouse.x >= this.x && virtualMouse.x <= this.x + this.width && virtualMouse.y >= this.y && virtualMouse.y <= this.y + this.height && virtualMouse.click) this.click = true;
        else this.click = false;
        
        this.draw();
    }
    
    draw() {
        drawer.ctx.shadowBlur = 10;
        drawer.ctx.shadowColor = border;
        
        super.draw(this.x, this.y);
        drawer.ctx.fillStyle = this.color;
        drawer.ctx.fillRect(this.x, this.y, this.width, this.height);
        
        drawer.ctx.fillStyle = border;
        drawer.ctx.textAlign = "left";
        drawer.ctx.textBaseline = "middle";
        drawer.ctx.font = this.font;
        drawer.ctx.fillText(this.text, this.x + 10, this.y + this.height/2);
        
        drawer.ctx.shadowBlur = 0;
    }
}

class Bar {
    constructor(x, y, width, height, health, maxHealth) {
        this.x = x;
        this.y = y;
        
        this.width = width;
        this.height = height;
        
        this.health = Math.max(0, health);
        this.maxHealth = maxHealth;
        
        this.color1 = "#ff0000";
        this.color2 = "#00ff00";
    }
    
    draw() {
        drawer.ctx.fillStyle = "#000000";
        drawer.ctx.fillRect(this.x + 1, this.y + 3, this.width - 2, this.height);
        
        drawer.ctx.fillStyle = this.color1;
        drawer.ctx.fillRect(this.x, this.y, this.width, this.height);
        
        drawer.ctx.fillStyle = this.color2;
        drawer.ctx.fillRect(this.x, this.y, this.health/this.maxHealth * this.width, this.height);
    }
    
    drawRelative() {
        drawer.ctx.fillStyle = "#000000";
        drawer.fillRect(this.x, this.y + 3, this.width, this.height);
        
        drawer.ctx.fillStyle = this.color1;
        drawer.fillRect(this.x, this.y, this.width, this.height);
        
        drawer.ctx.fillStyle = this.color2;
        drawer.fillRect(this.x, this.y, this.health/this.maxHealth * this.width, this.height);
    }
}

class Triangle extends Polygon {
    constructor(size, color) {
        super(3, size, color);
    }
}

class Square extends Polygon {
    constructor(size, color) {
        super(4, size, color);
    }
}

class Pentagon extends Polygon {
    constructor(size, color) {
        super(5, size, color);
    }
}

class Hexagon extends Polygon {
    constructor(size, color) {
        super(6, size, color);
    }
}

class Heptagon extends Polygon {
    constructor(size, color) {
        super(7, size, color);
    }
}