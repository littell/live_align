declare function require(path: string): any;

import { IRectangular, isPointInside, rectanglesIntersect, SimpleRectangle, drawRoundRectangle, rectAsPath } from "./geometry";
import { RASProperty, RASObject, RASComponent } from "./objects";
import { RASAnimationFrame } from "./animation";
import { RASModel, RASTextModel, RASCharacterModel, RASTokenModel } from "./models";


export const SELECTION_TYPE_DEFAULT : string = "default";
export const SELECTION_TYPE_POINTER : string = "pointer";
export const SELECTION_TYPE_NONE : string = "";
export const SELECTION_TYPE_TEXT : string = "text";

const GRID_SIZE : number = 20;
const TEXT_FIELD_PADDING_X : number = 10;
const TEXT_FIELD_PADDING_Y : number = 10;

export const TOKEN_PADDING_LEFT : number = 0;
export const TOKEN_PADDING_TOP : number = 5;
export const TOKEN_PADDING_RIGHT : number = 0;
export const TOKEN_PADDING_BOTTOM : number = 5;

export const TOKEN_ROUNDING_RADIUS : number = 15;
const TOKEN_BORDER_COLOR : string = "#88888880";

const TextToSVG = require('text-to-svg');

var svgTextRenderer : any = null;

TextToSVG.load('static/Noto_Sans_400.ttf', function(err: any, textToSVG: any) {
    svgTextRenderer = textToSVG;
});


function componentToHex(c: number): string {
    var hex = Math.floor(c).toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}
  
export function rgbToHex(r: number, g: number, b: number, a: number): string {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b) + componentToHex(a);
}

export class RASView extends RASComponent implements IRectangular {
    protected _parent: RASView | null = null;
    protected _selectable: boolean = false;
    protected _selectionType = SELECTION_TYPE_NONE;
    public get selectionType(): string {
        return this._selectionType;
    }
    constructor(parent: RASView | null) {
        super();
        this._parent = parent;
        if (parent == null) {
            this._name = "unit";
        }
        else {
            this._name = parent._name + "_" + parent.numChildren.toString();
        }
    }

    
    public getViewForModel(model: RASModel): RASView | null {
        for (let child of this._children as RASView[]) {
            let found = child.getViewForModel(model);
            if (found != null) {
                return found;
            }
        }
        return null;
    }

    public get x(): number { return 0; }
    public get y(): number { return 0; }
    public get width(): number { return 0; }
    public get height(): number { return 0; }
    public get left(): number { return this.x; }
    public get right(): number { return this.x + this.width; }
    public get top(): number { return this.y; }
    public get bottom(): number { return this.y + this.height; }

    public set x(x: number) { }
    public set y(y: number) { }

    public get midpointX(): number {
        return this.x + this.width / 2;
    }

    public get midpointY(): number {
        return this.y + this.height / 2;
    }

    public getHoveringType(x: number, y: number): string {
        for (let child of this._children as RASView[]) {
            const result = child.getHoveringType(x, y);
            if (result != "") {
                return result;
            }
        }
        if (isPointInside(this, x, y)) {
            return this.selectionType;
        }
        return "";
    }

    public getTextSelection(x: number, y: number): RASCharacterView | null {
        for (let child of this._children as RASView[]) {
            const result = child.getTextSelection(x, y);
            if (result != null) {
                return result;
            }
        }
        return null;
    }

    public getSelected(selectionRect: IRectangular): RASView[] {
        var results: RASView[] = [];
        if (this._selectable && rectanglesIntersect(this, selectionRect)) {
            results.push(this);
        }
        for (let child of this._children as RASView[]) {
            results = results.concat(child.getSelected(selectionRect));
        }
        return results;
    }

    public asSVG(): string {

        var result = "<svg>\n";
        result += `<g id="${this._name}">`;
        for (let child of this.children as RASView[]) {
            result += child.asSVG();
        }
        const borderPath = rectAsPath(this);
        result += `<path d="${borderPath}" stroke="#999999" fill-opacity="0.0"/>`;
        result += `</g>`;
        result += "</svg>";
        return result;
    }

    public layout(ctx: CanvasRenderingContext2D): void { }

    public layoutAll(ctx: CanvasRenderingContext2D): void {
        this.layout(ctx);
        for (let child of this._children as RASView[]) {
            child.layoutAll(ctx);
        }
    }

    public setPropertyInterpolation(propertyName: string, propertyValue: number): void { }
    public resetPropertyInterpolation(): void { }
}


class RASOnePointView extends RASView {

    constructor(x: number, y: number, parent: RASView) {
        super(parent);
        this.addProperty(new RASProperty("x", x));
        this.addProperty(new RASProperty("y", y));
    }

    public get x(): number {
        return this.getProperty("x").value;
    }
    public get y(): number {
        return this.getProperty("y").value;
    }
    public set x(x: number) {
        this.setPropertyValue("x", x);
    }
    public set y(y: number) {
        this.setPropertyValue("y", y);
    }

}

class RASAbstractTextView extends RASOnePointView {

    protected _fontSize: number = 64;
    protected _font: string = '"Noto Sans"';

    public get width(): number {
        const ctx = this.context;
        var result: number = 0;
        for (let child of this._children as RASView[]) {
            result += child.width;
        }
        return result;
    }

    public get height(): number {

        if (this.numChildren == 0) {
            return 0;
        }

        return (this._children[0] as RASView).height;

        //var ctx = this.context;
        //ctx.font = this._font;
        //return ctx.measureText("M").actualBoundingBoxAscent;
    }

}

export class RASCharacterView extends RASAbstractTextView {

    protected _model: RASCharacterModel;
    protected _selectionType = SELECTION_TYPE_TEXT;

    constructor(model: RASCharacterModel, parent: RASView) {
        super(0, 0, parent);
        this._model = model;
    }

    public get model(): RASCharacterModel { return this._model; }


    /**
     * Returns the [[RASTextView]] to which this view belongs.
     */

    public getTextView(): RASTextView {
        const parent = this._parent as RASTokenView;
        return parent.getTextView();
    }

    public getViewForModel(model: RASModel): RASView | null {
        if (model == this._model) {
            return this;
        }
        return super.getViewForModel(model);
    }

    public getLeftAdjustment(): number {
        return 0;

        var ctx = this.context;
        ctx.font = this._font;
        var text_metrics = ctx.measureText(this._model.text);
        return text_metrics.actualBoundingBoxLeft;
    }

    public getTextSelection(x: number, y: number): RASCharacterView | null {
        if (isPointInside(this, x, y)) {
            return this;
        }

        return null;
    }

    public get width(): number {

        if (svgTextRenderer == null) {
            return 20;
        }

        const options = {
            fontSize: this._fontSize,
        }

        var metrics = svgTextRenderer.getMetrics(this.model.text, options)
        return metrics.width;

        //var ctx = this.context;
        //ctx.font = this._font;
        //var text_metrics = ctx.measureText(this._model.text);
        //return text_metrics.width;
    }

    public get height(): number {
        
        if (svgTextRenderer == null) {
            return 20;
        }

        const options = {
            fontSize: this._fontSize,
        }

        var metrics = svgTextRenderer.getMetrics(this.model.text, options)
        return metrics.ascender;
    }

    public getPath(): string {
        const options = {
            x: this.left + 1,
            y: this.bottom + 1,
            fontSize: this._fontSize,
        }
        return svgTextRenderer.getD(this.model.text, options);
    }

    public asSVG(): string {

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

    public render(ctx: CanvasRenderingContext2D, aframe: RASAnimationFrame): void {
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

    public renderAsPath(ctx: CanvasRenderingContext2D): void {

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

class RASTokenView extends RASAbstractTextView {

    protected _model: RASTokenModel;

    public get model(): RASTokenModel { return this._model; }

    
    public getViewForModel(model: RASModel): RASView | null {
        if (model == this._model) {
            return this;
        }
        return super.getViewForModel(model);
    }

    constructor(model: RASTokenModel, parent: RASView) {
        super(0, 0, parent);
        this._model = model;

        for (let characterModel of model.characters) {
            var newCharacterView = new RASCharacterView(characterModel, this);
            this.addChild(newCharacterView);
        }
    }

    
    /**
     * Returns the [[RASTextView]] to which this view belongs.
     */

    public getTextView(): RASTextView {
        const parent = this._parent as RASLineView;
        return parent.getTextView();
    }


    public layout(ctx: CanvasRenderingContext2D) {
        var starting_x = this.x;
        for (let child of this._children as RASCharacterView[]) {
            child.x = starting_x;
            child.y = this.y;
            starting_x += child.width;
        }
    }

    public render(ctx: CanvasRenderingContext2D, aframe: RASAnimationFrame): void {
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

    public getPath() {


    }

    
    public asSVG(): string {

        var result = "<svg>\n";
        result += `<g id="${this._name}">`;
        for (let child of this.children as RASView[]) {
            result += child.asSVG();
        }
        const borderPath = rectAsPath(this);
        result += `<path d="${borderPath}" stroke="#999999" />`;
        result += `</g>`;
        result += "</svg>";
        return result;
    }

    public renderSVG(ctx: CanvasRenderingContext2D, aframe: RASAnimationFrame) {
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

export class RASLineView extends RASAbstractTextView {
    protected _selectionType = SELECTION_TYPE_TEXT;

    constructor(x: number, y: number, parent: RASView) {
        super(x, y, parent);
    }

    public getTextUnits(): RASCharacterView[] {
        /*
        var results : RASCharacterView[] = [];
        for (const unit of this._children as RASCharacterView[]) {
            results.push(unit);
        }
        return [results];
        */
        return [];
    }

    public get widthWithoutWhitespace(): number {
        if (this.numChildren == 0) {
            return 0;
        }
        const lastChild = this._children[this.numChildren-1] as RASTokenView;
        if (lastChild.model.isWhitespace()) {
            return this.width - lastChild.width;
        }
        return this.width;
    }

    
    /**
     * Returns the [[RASTextView]] to which this view belongs.
     */

    public getTextView(): RASTextView {
        return this._parent as RASTextView;
    }


    public layout(ctx: CanvasRenderingContext2D) {
        ctx.font = this._font;
        const space_width = 0;
        var starting_x = this.x;
        for (let child of this._children as RASCharacterView[]) {
            child.x = starting_x;
            child.y = this.y;
            starting_x += child.width;
        }
    }
}

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

    constructor(x: number, y: number, width: number, height: number, parent: RASView) {
        super(parent);
        this.addProperty(new RASProperty("x1", x));
        this.addProperty(new RASProperty("y1", y));
        this.addProperty(new RASProperty("x2", x + width));
        this.addProperty(new RASProperty("y2", y + height));
    }

    public get x(): number { return this.left; }
    public get y(): number { return this.top; }
    public get width(): number { return this.right - this.left; }
    public get height(): number { return this.bottom - this.top; }

    public get left(): number {
        return Math.min(this.getProperty("x1").value, this.getProperty("x2").value);
    }
    public get top(): number {
        return Math.min(this.getProperty("y1").value, this.getProperty("y2").value);
    }
    public get right(): number {
        return Math.max(this.getProperty("x1").value, this.getProperty("x2").value);
    }
    public get bottom(): number {
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

export class RASTextView extends RASTwoPointView {

    protected _model: RASTextModel;
    protected _font: string = '64px "Noto Sans"';

    public get model(): RASTextModel { return this._model; }

    constructor(text: RASTextModel, x: number, y: number, width: number, height: number, parent: RASView) {
        super(x, y, width, height, parent);
        this._model = text;
        this._selectable = true;
        var ctx = this.context;
    }

    
    public getViewForModel(model: RASModel): RASView | null {
        if (model == this._model) {
            return this;
        }
        return super.getViewForModel(model);
    }

    public getEndCursorPosition(): IRectangular {
        if (this.numChildren == 0) {        
            const ctx = this.context;
            ctx.font = this._font;
            const line_height = ctx.measureText("M").actualBoundingBoxAscent;
            return new SimpleRectangle(this.x + TEXT_FIELD_PADDING_X,
                                        this.y + TEXT_FIELD_PADDING_Y, 
                                        0,
                                        line_height);
        } else {
            const lastLine = this._children[this.numChildren-1] as RASLineView;
            return new SimpleRectangle(lastLine.right,
                                        lastLine.top,
                                        0,
                                        lastLine.height);
        }
    }


    public getTextUnits(): RASCharacterView[] {
        return [];
    }

    public layout(ctx: CanvasRenderingContext2D): void {
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
            } else {
                const newUnit = new RASTokenView(tokenModel, currentTextLine);
                currentTextLine.addChild(newUnit);
            }
        }
        this.addChild(currentTextLine);
    }

    public renderOutlines(ctx: CanvasRenderingContext2D, aframe: RASAnimationFrame) {
        ctx.beginPath();
        ctx.strokeStyle = "#00880060";
        ctx.lineWidth = 1;
        ctx.setLineDash([1, 1]);
        ctx.rect(this.x, this.y, this.width, this.height);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    public render(ctx: CanvasRenderingContext2D, aframe: RASAnimationFrame): void {
        this.renderOutlines(ctx, aframe);
    }

    


}


/**
 * An RASSlideView contains all the components of a single Slide,
 * and also draws the background.  It is always at maximum size and
 * shape; that is, it is a rectangle of dimensions 
 * (0,0,VIRTUAL_CANVAS_WIDTH,VIRTUAL_CANVAS_HEIGHT)
 */


export class RASSlideView extends RASView {

    protected _width: number;
    protected _height: number;

    constructor(width: number, height: number, parent: RASView) {
        super(parent);
        this._width = width;
        this._height = height;
    }

    public get x(): number { return 0; }
    public get y(): number { return 0; }
    public get width(): number { return this._width; }
    public get height(): number { return this._height; }

    public render(ctx: CanvasRenderingContext2D, aframe: RASAnimationFrame): void {
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

    public asSVG(): string {
        var result = '<svg width="1920" height="1080">\n';
        for (let child of this._children as RASView[]) {
            result += child.asSVG();
        }
        result += "</svg>\n";
        return result;
    }

}
