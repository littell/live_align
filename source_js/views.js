"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const geometry_1 = require("./geometry");
const objects_1 = require("./objects");
exports.SELECTION_TYPE_DEFAULT = "default";
exports.SELECTION_TYPE_POINTER = "pointer";
exports.SELECTION_TYPE_NONE = "";
exports.SELECTION_TYPE_TEXT = "text";
const GRID_SIZE = 20;
const TEXT_FIELD_PADDING_X = 10;
const TEXT_FIELD_PADDING_Y = 10;
exports.TOKEN_PADDING_LEFT = 0;
exports.TOKEN_PADDING_TOP = 5;
exports.TOKEN_PADDING_RIGHT = 0;
exports.TOKEN_PADDING_BOTTOM = 5;
exports.TOKEN_ROUNDING_RADIUS = 15;
const TOKEN_BORDER_COLOR = "#88888880";
const TextToSVG = require('text-to-svg');
var svgTextRenderer = null;
TextToSVG.load('static/Noto_Sans_400.ttf', function (err, textToSVG) {
    svgTextRenderer = textToSVG;
});
function componentToHex(c) {
    var hex = Math.floor(c).toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}
function rgbToHex(r, g, b, a) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b) + componentToHex(a);
}
exports.rgbToHex = rgbToHex;
class RASView extends objects_1.RASComponent {
    constructor(parent) {
        super();
        this._parent = null;
        this._selectable = false;
        this._selectionType = exports.SELECTION_TYPE_NONE;
        this._parent = parent;
        if (parent == null) {
            this._name = "unit";
        }
        else {
            this._name = parent._name + "_" + parent.numChildren.toString();
        }
    }
    get selectionType() {
        return this._selectionType;
    }
    getViewForModel(model) {
        for (let child of this._children) {
            let found = child.getViewForModel(model);
            if (found != null) {
                return found;
            }
        }
        return null;
    }
    get x() { return 0; }
    get y() { return 0; }
    get width() { return 0; }
    get height() { return 0; }
    get left() { return this.x; }
    get right() { return this.x + this.width; }
    get top() { return this.y; }
    get bottom() { return this.y + this.height; }
    set x(x) { }
    set y(y) { }
    get midpointX() {
        return this.x + this.width / 2;
    }
    get midpointY() {
        return this.y + this.height / 2;
    }
    getHoveringType(x, y) {
        for (let child of this._children) {
            const result = child.getHoveringType(x, y);
            if (result != "") {
                return result;
            }
        }
        if (geometry_1.isPointInside(this, x, y)) {
            return this.selectionType;
        }
        return "";
    }
    getTextSelection(x, y) {
        for (let child of this._children) {
            const result = child.getTextSelection(x, y);
            if (result != null) {
                return result;
            }
        }
        return null;
    }
    getSelected(selectionRect) {
        var results = [];
        if (this._selectable && geometry_1.rectanglesIntersect(this, selectionRect)) {
            results.push(this);
        }
        for (let child of this._children) {
            results = results.concat(child.getSelected(selectionRect));
        }
        return results;
    }
    asSVG() {
        var result = "<svg>\n";
        result += `<g id="${this._name}">`;
        for (let child of this.children) {
            result += child.asSVG();
        }
        const borderPath = geometry_1.rectAsPath(this);
        result += `<path d="${borderPath}" stroke="#999999" fill-opacity="0.0"/>`;
        result += `</g>`;
        result += "</svg>";
        return result;
    }
    layout(ctx) { }
    layoutAll(ctx) {
        this.layout(ctx);
        for (let child of this._children) {
            child.layoutAll(ctx);
        }
    }
    setPropertyInterpolation(propertyName, propertyValue) { }
    resetPropertyInterpolation() { }
}
exports.RASView = RASView;
class RASOnePointView extends RASView {
    constructor(x, y, parent) {
        super(parent);
        this.addProperty(new objects_1.RASProperty("x", x));
        this.addProperty(new objects_1.RASProperty("y", y));
    }
    get x() {
        return this.getProperty("x").value;
    }
    get y() {
        return this.getProperty("y").value;
    }
    set x(x) {
        this.setPropertyValue("x", x);
    }
    set y(y) {
        this.setPropertyValue("y", y);
    }
}
class RASAbstractTextView extends RASOnePointView {
    constructor() {
        super(...arguments);
        this._fontSize = 64;
        this._font = '"Noto Sans"';
    }
    get width() {
        const ctx = this.context;
        var result = 0;
        for (let child of this._children) {
            result += child.width;
        }
        return result;
    }
    get height() {
        if (this.numChildren == 0) {
            return 0;
        }
        return this._children[0].height;
        //var ctx = this.context;
        //ctx.font = this._font;
        //return ctx.measureText("M").actualBoundingBoxAscent;
    }
}
class RASCharacterView extends RASAbstractTextView {
    constructor(model, parent) {
        super(0, 0, parent);
        this._selectionType = exports.SELECTION_TYPE_TEXT;
        this._model = model;
    }
    get model() { return this._model; }
    /**
     * Returns the [[RASTextView]] to which this view belongs.
     */
    getTextView() {
        const parent = this._parent;
        return parent.getTextView();
    }
    getViewForModel(model) {
        if (model == this._model) {
            return this;
        }
        return super.getViewForModel(model);
    }
    getLeftAdjustment() {
        return 0;
        var ctx = this.context;
        ctx.font = this._font;
        var text_metrics = ctx.measureText(this._model.text);
        return text_metrics.actualBoundingBoxLeft;
    }
    getTextSelection(x, y) {
        if (geometry_1.isPointInside(this, x, y)) {
            return this;
        }
        return null;
    }
    get width() {
        if (svgTextRenderer == null) {
            return 20;
        }
        const options = {
            fontSize: this._fontSize,
        };
        var metrics = svgTextRenderer.getMetrics(this.model.text, options);
        return metrics.width;
        //var ctx = this.context;
        //ctx.font = this._font;
        //var text_metrics = ctx.measureText(this._model.text);
        //return text_metrics.width;
    }
    get height() {
        if (svgTextRenderer == null) {
            return 20;
        }
        const options = {
            fontSize: this._fontSize,
        };
        var metrics = svgTextRenderer.getMetrics(this.model.text, options);
        return metrics.ascender;
    }
    getPath() {
        const options = {
            x: this.left + 1,
            y: this.bottom + 1,
            fontSize: this._fontSize,
        };
        return svgTextRenderer.getD(this.model.text, options);
    }
    asSVG() {
        var result = "<svg>\n";
        result += `<defs><filter id="${this._name}-blur">
                        <feGaussianBlur result="blurOut" in="offOut" stdDeviation="10" />
                   </filter></defs>\n`;
        const path = this.getPath();
        result += `<path d="${path}" fill="#66CC33" filter="${this._name}-blur" />`;
        result += `<path d="${path}" fill="#333333"/>`;
        result += "</svg>";
        return result;
    }
    render(ctx, aframe) {
        /*
        ctx.font = this._font;
        const line_height = ctx.measureText("M").actualBoundingBoxAscent;
        ctx.fillStyle = "#ff3333";
        ctx.font = this._fontSize.toString() + "px " + this._font;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        const propertyInterpolation = aframe.getPropertyInterpolation(this._name);
        const transparency = rgbToHex(255, 200, 0, propertyInterpolation * 255);
        ctx.shadowColor = transparency;
        ctx.shadowBlur = 10;
        ctx.fillText(this._model.text, this.x, this.y + line_height);
        ctx.shadowBlur = 0; */
        this.renderAsPath(ctx);
    }
    renderAsPath(ctx) {
        ctx.save();
        if (svgTextRenderer == null) {
            return;
        }
        var path = new Path2D(this.getPath());
        ctx.fillStyle = "#66ff33";
        ctx.filter = 'blur(10px)';
        ctx.fill(path);
        ctx.restore();
        ctx.fillStyle = "#333333";
        ctx.fill(path);
    }
}
exports.RASCharacterView = RASCharacterView;
class RASTokenView extends RASAbstractTextView {
    constructor(model, parent) {
        super(0, 0, parent);
        this._model = model;
        for (let characterModel of model.characters) {
            var newCharacterView = new RASCharacterView(characterModel, this);
            this.addChild(newCharacterView);
        }
    }
    get model() { return this._model; }
    getViewForModel(model) {
        if (model == this._model) {
            return this;
        }
        return super.getViewForModel(model);
    }
    /**
     * Returns the [[RASTextView]] to which this view belongs.
     */
    getTextView() {
        const parent = this._parent;
        return parent.getTextView();
    }
    layout(ctx) {
        var starting_x = this.x;
        for (let child of this._children) {
            child.x = starting_x;
            child.y = this.y;
            starting_x += child.width;
        }
    }
    render(ctx, aframe) {
        if (this._model.isWhitespace()) {
            return;
        }
        this.renderSVG(ctx, aframe);
        /*
        ctx.beginPath();
        ctx.strokeStyle = TOKEN_BORDER_COLOR;
        ctx.lineWidth = 2;
        const paddedRect = new SimpleRectangle(this.x - TOKEN_PADDING_LEFT,
            this.y - TOKEN_PADDING_TOP,
            this.width + TOKEN_PADDING_LEFT + TOKEN_PADDING_RIGHT,
            this.height + TOKEN_PADDING_TOP + TOKEN_PADDING_BOTTOM);
        drawRoundRectangle(ctx, paddedRect, TOKEN_ROUNDING_RADIUS, TOKEN_ROUNDING_RADIUS);
        ctx.stroke(); */
    }
    getPath() {
    }
    asSVG() {
        var result = "<svg>\n";
        result += `<g id="${this._name}">`;
        for (let child of this.children) {
            result += child.asSVG();
        }
        const borderPath = geometry_1.rectAsPath(this);
        result += `<path d="${borderPath}" stroke="#999999" />`;
        result += `</g>`;
        result += "</svg>";
        return result;
    }
    renderSVG(ctx, aframe) {
        /*var data = '<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080">' + this.asSVG() + "</svg>"
        var DOMURL = window.URL || window.webkitURL || window;
        var img1 = new Image(1920, 1080);
        var svg = new Blob([data], {type: 'image/svg+xml'});
        var url = DOMURL.createObjectURL(svg);
        img1.src = url;
        console.log(url);
        ctx.beginPath();
        ctx.strokeStyle = TOKEN_BORDER_COLOR;
        ctx.lineWidth = 2;
        ctx.drawImage(img1, 0, 0);
        ctx.stroke(); */
        ctx.strokeStyle = TOKEN_BORDER_COLOR;
        ctx.lineWidth = 2;
        //drawRect(ctx, this);
        //var v = Canvg.fromString(ctx, `<svg width="1920" height="1080"><rect x="10" y="10" width="1920" height="1080" stroke="red" fill="transparent" /><text x="50" y="50">Hello World!</text></svg>`);
        // Start SVG rendering with animations and mouse handling.
        //v.start();
    }
}
class RASLineView extends RASAbstractTextView {
    constructor(x, y, parent) {
        super(x, y, parent);
        this._selectionType = exports.SELECTION_TYPE_TEXT;
    }
    getTextUnits() {
        /*
        var results : RASCharacterView[] = [];
        for (const unit of this._children as RASCharacterView[]) {
            results.push(unit);
        }
        return [results];
        */
        return [];
    }
    get widthWithoutWhitespace() {
        if (this.numChildren == 0) {
            return 0;
        }
        const lastChild = this._children[this.numChildren - 1];
        if (lastChild.model.isWhitespace()) {
            return this.width - lastChild.width;
        }
        return this.width;
    }
    /**
     * Returns the [[RASTextView]] to which this view belongs.
     */
    getTextView() {
        return this._parent;
    }
    layout(ctx) {
        ctx.font = this._font;
        const space_width = 0;
        var starting_x = this.x;
        for (let child of this._children) {
            child.x = starting_x;
            child.y = this.y;
            starting_x += child.width;
        }
    }
}
exports.RASLineView = RASLineView;
/**
 * RASTwoPointView is the ancestor of views whose rectangularity
 * is implemented by having two points (x1,y1) and (x2,x2).  Which
 * of these is x/left, y/top, right, etc. for the IRectangular interface simple
 * calculated by which is minimim/maximum.
 *
 * This is makes the stretch drag behavior of [[RASDragCornerTool]] very
 * simple to implement.
 */
class RASTwoPointView extends RASView {
    constructor(x, y, width, height, parent) {
        super(parent);
        this.addProperty(new objects_1.RASProperty("x1", x));
        this.addProperty(new objects_1.RASProperty("y1", y));
        this.addProperty(new objects_1.RASProperty("x2", x + width));
        this.addProperty(new objects_1.RASProperty("y2", y + height));
    }
    get x() { return this.left; }
    get y() { return this.top; }
    get width() { return this.right - this.left; }
    get height() { return this.bottom - this.top; }
    get left() {
        return Math.min(this.getProperty("x1").value, this.getProperty("x2").value);
    }
    get top() {
        return Math.min(this.getProperty("y1").value, this.getProperty("y2").value);
    }
    get right() {
        return Math.max(this.getProperty("x1").value, this.getProperty("x2").value);
    }
    get bottom() {
        return Math.max(this.getProperty("y1").value, this.getProperty("y2").value);
    }
}
/**
 * RASTextView is the view that the user interacts with most; it is the
 * one that the user is positioning, typing into, etc.  Views inside this
 * like [[RASLineView]], [[RASTokenView]], etc. are mostly ephemeral, being
 * re-created every time this component is re-laid-out, and the user mostly
 * does not interact with them.
 */
class RASTextView extends RASTwoPointView {
    constructor(text, x, y, width, height, parent) {
        super(x, y, width, height, parent);
        this._font = '64px "Noto Sans"';
        this._model = text;
        this._selectable = true;
        var ctx = this.context;
    }
    get model() { return this._model; }
    getViewForModel(model) {
        if (model == this._model) {
            return this;
        }
        return super.getViewForModel(model);
    }
    getEndCursorPosition() {
        if (this.numChildren == 0) {
            const ctx = this.context;
            ctx.font = this._font;
            const line_height = ctx.measureText("M").actualBoundingBoxAscent;
            return new geometry_1.SimpleRectangle(this.x + TEXT_FIELD_PADDING_X, this.y + TEXT_FIELD_PADDING_Y, 0, line_height);
        }
        else {
            const lastLine = this._children[this.numChildren - 1];
            return new geometry_1.SimpleRectangle(lastLine.right, lastLine.top, 0, lastLine.height);
        }
    }
    getTextUnits() {
        return [];
    }
    layout(ctx) {
        ctx.font = this._font;
        const space_width = 0;
        const line_height = ctx.measureText("M").actualBoundingBoxAscent;
        this._children = [];
        var currentY = this.top + TEXT_FIELD_PADDING_Y;
        const x = this.left + TEXT_FIELD_PADDING_X;
        var currentTextLine = new RASLineView(x, currentY, this);
        for (let tokenModel of this.model.tokens) {
            const currentUnitWidth = ctx.measureText(tokenModel.text).width;
            const currentLineWidth = currentTextLine.width;
            const totalWidth = currentLineWidth + currentUnitWidth + space_width;
            if (currentLineWidth != 0 &&
                totalWidth > this.width - TEXT_FIELD_PADDING_X * 2 &&
                tokenModel.isWhitespace()) { // since tokens can be subword units, we dont' want
                // to go to a new line until we find whitespace
                // add the whitespace token to the line
                const newUnit = new RASTokenView(tokenModel, currentTextLine);
                currentTextLine.addChild(newUnit);
                // make a new line
                this.addChild(currentTextLine);
                currentY += (line_height * 1.25);
                currentTextLine = new RASLineView(x, currentY, this);
            }
            else {
                const newUnit = new RASTokenView(tokenModel, currentTextLine);
                currentTextLine.addChild(newUnit);
            }
        }
        this.addChild(currentTextLine);
    }
    renderOutlines(ctx, aframe) {
        ctx.beginPath();
        ctx.strokeStyle = "#00880060";
        ctx.lineWidth = 1;
        ctx.setLineDash([1, 1]);
        ctx.rect(this.x, this.y, this.width, this.height);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    render(ctx, aframe) {
        this.renderOutlines(ctx, aframe);
    }
}
exports.RASTextView = RASTextView;
/**
 * An RASSlideView contains all the components of a single Slide,
 * and also draws the background.  It is always at maximum size and
 * shape; that is, it is a rectangle of dimensions
 * (0,0,VIRTUAL_CANVAS_WIDTH,VIRTUAL_CANVAS_HEIGHT)
 */
class RASSlideView extends RASView {
    constructor(width, height, parent) {
        super(parent);
        this._width = width;
        this._height = height;
    }
    get x() { return 0; }
    get y() { return 0; }
    get width() { return this._width; }
    get height() { return this._height; }
    render(ctx, aframe) {
        ctx.strokeStyle = "#00000040";
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        for (let j = this.top; j <= this.bottom; j += GRID_SIZE) {
            for (let i = this.left; i < this.width; i += GRID_SIZE) {
                ctx.moveTo(i - 3, j);
                ctx.lineTo(i + 3, j);
                ctx.moveTo(i, j - 3);
                ctx.lineTo(i, j + 3);
            }
        }
        ctx.stroke();
    }
    asSVG() {
        var result = '<svg width="1920" height="1080">\n';
        for (let child of this._children) {
            result += child.asSVG();
        }
        result += "</svg>\n";
        return result;
    }
}
exports.RASSlideView = RASSlideView;
