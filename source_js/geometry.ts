
export interface IRectangular {

    x: number;
    y: number;
    width: number;
    height: number;
    left: number;
    right: number;
    top: number;
    bottom: number;

}

export class SimpleRectangle implements IRectangular {
    public x : number;
    public y : number;
    public width : number;
    public height : number;

    constructor(x : number = 0, y : number = 0, width : number = 0, height : number = 0) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        if (this.width < 0) {
            this.width = -width;
            this.x += width;
        }

        if (this.height < 0) {
            this.height = -height;
            this.y += height;
        }
    }
            
    public get left(): number   { return this.x; }
    public get right(): number  { return this.x + this.width; }
    public get top(): number    { return this.y; }
    public get bottom(): number { return this.y + this.height; }
}


export function isPointInside(rect: IRectangular, x: number, y: number) {
    return x > rect.left && x < rect.right && y > rect.top && y < rect.bottom;
}

export function rectanglesIntersect(r1: IRectangular, r2: IRectangular) {

    if (r1.left > r2.right || 
        r2.left > r1.right ||
        r1.top > r2.bottom || 
        r2.top > r1.bottom) {
        return false; 
    }
    return true; 
}

export function getOutsideRectangle(rect: IRectangular, marginX: number, marginY: number): IRectangular {
    return new SimpleRectangle(rect.x - marginX, rect.y - marginY, rect.width + marginX * 2, rect.height + marginY * 2);
}

export function getInsideRectangle(rect: IRectangular, marginX: number, marginY: number) {
    return new SimpleRectangle(rect.x + marginX, rect.y + marginY, rect.width - marginX * 2, rect.height - marginY * 2);
}

export function isPointNearBorder(rect: IRectangular, x: number, y: number, marginX: number, marginY: number) {
    const outsideRect = getOutsideRectangle(rect, marginX, marginY);
    const insideRect = getInsideRectangle(rect, marginX, marginY);
    return isPointInside(outsideRect, x, y) && !isPointInside(insideRect, x, y)
} 

/**
 * Draws a rounded rectangle using the current state of the canvas. 
 * Based on code by Futomi Hatano and Juan Mendes.
 * 
 * @param {IRectangular} rectangle The rectangle
 * @param {CanvasRenderingContext2D} ctx The canvas rendering context
 * @param {Number} radiusX The horizonal corner radius.
 * @param {Number} radiusY The vertical corner radius.
  */

export function drawRoundRectangle(ctx: CanvasRenderingContext2D, 
                                    rect: IRectangular, 
                                    radiusX: number = 10, 
                                    radiusY: number = 10): void {
    
    // don't allow radii too large
    radiusX = Math.min(radiusX, rect.width); 
    radiusY = Math.min(radiusY, rect.height);

    ctx.moveTo(rect.x + radiusX, rect.y);
    ctx.lineTo(rect.x + rect.width - radiusX, rect.y);
    ctx.quadraticCurveTo(rect.x + rect.width, 
        rect.y, 
        rect.x + rect.width, 
        rect.y + radiusY);
    ctx.lineTo(rect.x + rect.width, rect.y + rect.height - radiusY);
    ctx.quadraticCurveTo(rect.x + rect.width, 
        rect.y + rect.height, 
        rect.x + rect.width - radiusX, 
        rect.y + rect.height);
    ctx.lineTo(rect.x + radiusX, rect.y + rect.height);
    ctx.quadraticCurveTo(rect.x, 
        rect.y + rect.height, 
        rect.x, 
        rect.y + rect.height - radiusY);
    ctx.lineTo(rect.x, rect.y + radiusY);
    ctx.quadraticCurveTo(rect.x, 
        rect.y, 
        rect.x + radiusX, 
        rect.y); 

}

export interface IRenderer {
    renderRect : (rect: IRectangular) => void;
}


export function rectAsPath(rect: IRectangular): string {
    return `M ${rect.left} ${rect.top} L ${rect.right} ${rect.top} L ${rect.right} ${rect.bottom} L ${rect.left} ${rect.bottom} L ${rect.left} ${rect.top}`;
}

class RASAbstractRenderer {

    protected rectAsPath(rect: IRectangular): string {
        return `M ${rect.left} ${rect.top} L ${rect.right} ${rect.top} L ${rect.right} ${rect.bottom} L ${rect.left} ${rect.bottom} L ${rect.left} ${rect.top}`;
    }
}

export class CanvasRenderer extends RASAbstractRenderer implements IRenderer {
    
    protected _ctx : CanvasRenderingContext2D;

    constructor(ctx: CanvasRenderingContext2D) {
        super();
        this._ctx = ctx;   
    }

    public renderRect(rect: IRectangular): void {
        var path = new Path2D(this.rectAsPath(rect));
        this._ctx.stroke(path);
    }

}


export class SVGRenderer extends RASAbstractRenderer implements IRenderer {
    
    protected _lines : string[] = [];

    constructor(ctx: CanvasRenderingContext2D) {
        super();
    }

    public pathStringToXML(path: string): string {
        return `<path d=${path}>`;
    }

    public renderRect(rect: IRectangular): void {
        var path = rectAsPath(rect);
        var pathXML = this.pathStringToXML(path);
        this._lines.push(pathXML);
    }
}