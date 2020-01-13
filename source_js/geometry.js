"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class SimpleRectangle {
    constructor(x = 0, y = 0, width = 0, height = 0) {
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
    get left() { return this.x; }
    get right() { return this.x + this.width; }
    get top() { return this.y; }
    get bottom() { return this.y + this.height; }
}
exports.SimpleRectangle = SimpleRectangle;
function isPointInside(rect, x, y) {
    return x > rect.left && x < rect.right && y > rect.top && y < rect.bottom;
}
exports.isPointInside = isPointInside;
function rectanglesIntersect(r1, r2) {
    if (r1.left > r2.right ||
        r2.left > r1.right ||
        r1.top > r2.bottom ||
        r2.top > r1.bottom) {
        return false;
    }
    return true;
}
exports.rectanglesIntersect = rectanglesIntersect;
function getOutsideRectangle(rect, marginX, marginY) {
    return new SimpleRectangle(rect.x - marginX, rect.y - marginY, rect.width + marginX * 2, rect.height + marginY * 2);
}
exports.getOutsideRectangle = getOutsideRectangle;
function getInsideRectangle(rect, marginX, marginY) {
    return new SimpleRectangle(rect.x + marginX, rect.y + marginY, rect.width - marginX * 2, rect.height - marginY * 2);
}
exports.getInsideRectangle = getInsideRectangle;
function isPointNearBorder(rect, x, y, marginX, marginY) {
    const outsideRect = getOutsideRectangle(rect, marginX, marginY);
    const insideRect = getInsideRectangle(rect, marginX, marginY);
    return isPointInside(outsideRect, x, y) && !isPointInside(insideRect, x, y);
}
exports.isPointNearBorder = isPointNearBorder;
/**
 * Draws a rounded rectangle using the current state of the canvas.
 * Based on code by Futomi Hatano and Juan Mendes.
 *
 * @param {IRectangular} rectangle The rectangle
 * @param {CanvasRenderingContext2D} ctx The canvas rendering context
 * @param {Number} radiusX The horizonal corner radius.
 * @param {Number} radiusY The vertical corner radius.
  */
function drawRoundRectangle(ctx, rect, radiusX = 10, radiusY = 10) {
    // don't allow radii too large
    radiusX = Math.min(radiusX, rect.width);
    radiusY = Math.min(radiusY, rect.height);
    ctx.moveTo(rect.x + radiusX, rect.y);
    ctx.lineTo(rect.x + rect.width - radiusX, rect.y);
    ctx.quadraticCurveTo(rect.x + rect.width, rect.y, rect.x + rect.width, rect.y + radiusY);
    ctx.lineTo(rect.x + rect.width, rect.y + rect.height - radiusY);
    ctx.quadraticCurveTo(rect.x + rect.width, rect.y + rect.height, rect.x + rect.width - radiusX, rect.y + rect.height);
    ctx.lineTo(rect.x + radiusX, rect.y + rect.height);
    ctx.quadraticCurveTo(rect.x, rect.y + rect.height, rect.x, rect.y + rect.height - radiusY);
    ctx.lineTo(rect.x, rect.y + radiusY);
    ctx.quadraticCurveTo(rect.x, rect.y, rect.x + radiusX, rect.y);
}
exports.drawRoundRectangle = drawRoundRectangle;
function rectAsPath(rect) {
    return `M ${rect.left} ${rect.top} L ${rect.right} ${rect.top} L ${rect.right} ${rect.bottom} L ${rect.left} ${rect.bottom} L ${rect.left} ${rect.top}`;
}
exports.rectAsPath = rectAsPath;
class RASAbstractRenderer {
    rectAsPath(rect) {
        return `M ${rect.left} ${rect.top} L ${rect.right} ${rect.top} L ${rect.right} ${rect.bottom} L ${rect.left} ${rect.bottom} L ${rect.left} ${rect.top}`;
    }
}
class CanvasRenderer extends RASAbstractRenderer {
    constructor(ctx) {
        super();
        this._ctx = ctx;
    }
    renderRect(rect) {
        var path = new Path2D(this.rectAsPath(rect));
        this._ctx.stroke(path);
    }
}
exports.CanvasRenderer = CanvasRenderer;
class SVGRenderer extends RASAbstractRenderer {
    constructor(ctx) {
        super();
        this._lines = [];
    }
    pathStringToXML(path) {
        return `<path d=${path}>`;
    }
    renderRect(rect) {
        var path = rectAsPath(rect);
        var pathXML = this.pathStringToXML(path);
        this._lines.push(pathXML);
    }
}
exports.SVGRenderer = SVGRenderer;
