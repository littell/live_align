import { SimpleRectangle, isPointNearBorder, IRectangular, drawRoundRectangle } from "./geometry";
import { IRASProperty, RASComponent } from "./objects";
import { RASAnimationFrame } from "./animation";
import { RASView, 
    RASCharacterView,
    RASLineView,
    RASTextView, 
    SELECTION_TYPE_NONE, 
    SELECTION_TYPE_DEFAULT, 
    SELECTION_TYPE_TEXT,
    TOKEN_PADDING_LEFT,
    TOKEN_PADDING_TOP,
    TOKEN_PADDING_RIGHT,
    TOKEN_PADDING_BOTTOM,
    TOKEN_ROUNDING_RADIUS } from "./views";
import { RASCharacterModel } from "./models";


const DRAG_LINE_WIDTH : number = 15;
const CURSOR_MARGIN: number = 0.1; // how much extra above and below
   // the selected character the cursor line goes, as a proportion of the
   // character's height.

const HIGHLIGHT_COLOR : string = "#FFFF6670";
const CURSOR_COLOR : string = "#0000AA";


export const SPECIAL_KEY_BACKSPACE = "BACKSPACE";
export const SPECIAL_KEY_CTRL_M = "CTRL_M";
export const SPECIAL_KEY_CTRL_B = "CTRL_B";

export class RASTool extends RASComponent {

    protected _parent: RASTool | null;
    public _attachedPropertiesHorizontal: IRASProperty[] = [];
    public _attachedPropertiesVertical: IRASProperty[] = [];

    constructor(parent: RASTool | null) {
        super();
        this._parent = parent;
    }

    public set parent(parent: RASTool) {
        this._parent = parent;
    }

    public requestDeletion(toolToDelete: RASTool) {
        this._children = this._children.filter(child => child != toolToDelete);
    }

    public requestMyDelection() {
        if (this._parent == null) {
            return; // can't delete the highest tool in the tree
        }
        this._parent.requestDeletion(this);
        for (let child of this._children as RASTool[]) {
            this._parent.addChild(child);
            child.parent = this._parent;
        }
    }

    protected fireMoveHorizontal(delta: number) {
        for (let property of this._attachedPropertiesHorizontal) {
            property.value = property.value + delta;
        }
    }

    protected fireMoveVertical(delta: number) {
        for (let property of this._attachedPropertiesVertical) {
            property.value = property.value + delta;
        }
    }

    public handleClick(x: number, y: number, ctx: CanvasRenderingContext2D): boolean {
        return false;
    }

    public handleClickAll(x: number, y: number, ctx: CanvasRenderingContext2D): boolean {
        for (let child of this._children as RASTool[]) {
            if (child.handleClickAll(x, y, ctx)) {
                return true;
            }
        }
        return this.handleClick(x, y, ctx);
    }
    
    public handleMouseDown(x: number, y: number, ctx: CanvasRenderingContext2D): boolean {
        return false;
    }

    public handleMouseDownAll(x: number, y: number, ctx: CanvasRenderingContext2D): boolean {
        for (let child of this._children as RASTool[]) {
            if (child.handleMouseDownAll(x, y, ctx)) {
                return true;
            }
        }
        return this.handleMouseDown(x, y, ctx);
    }
    
    public handleMouseMove(x: number, y: number, ctx: CanvasRenderingContext2D): boolean {
        return false;
    }

    public handleMouseMoveAll(x: number, y: number, ctx: CanvasRenderingContext2D): boolean {
        for (let child of this._children as RASTool[]) {
            if (child.handleMouseMoveAll(x, y, ctx)) {
                return true;
            }
        }
        return this.handleMouseMove(x, y, ctx);
    }

    public handleMouseUp(x: number, y: number, ctx: CanvasRenderingContext2D): boolean {
        return false;
    }

    public handleMouseUpAll(x: number, y: number, ctx: CanvasRenderingContext2D): boolean {
        for (let child of this._children as RASTool[]) {
            if (child.handleMouseUpAll(x, y, ctx)) {
                return true;
            }
        }
        return this.handleMouseUp(x, y, ctx);
    }

    public handleKeyPress(char: string, ctx: CanvasRenderingContext2D): boolean { 
        return false;
    }

    public handleKeyPressAll(char: string, ctx: CanvasRenderingContext2D): boolean {
        for (let child of this._children as RASTool[]) {
            if (child.handleKeyPressAll(char, ctx)) {
                return true;
            }
        }
        return this.handleKeyPress(char, ctx);
    }

    
    public handleSpecialKey(char: string, ctx: CanvasRenderingContext2D): boolean { 
        return false;
    }

    public handleSpecialKeyAll(char: string, ctx: CanvasRenderingContext2D): boolean {
        for (let child of this._children as RASTool[]) {
            if (child.handleSpecialKeyAll(char, ctx)) {
                return true;
            }
        }
        return this.handleSpecialKey(char, ctx);
    }


}

/**
 * The RASDefaultTool always exists, and creates and removes
 * child tools (like selectors, drag handles, etc.) in response to
 * user input.
 */

export class RASDefaultTool extends RASTool {
    protected _app: RASView;
    protected _selectionMode: string = SELECTION_TYPE_NONE;

    constructor(app: RASView) {
        super(null);
        this._app = app;
    }

    public getHoveringType(x: number, y: number) {
        var hoveringType = this._app.getHoveringType(x, y);
        if (hoveringType == "") {
            hoveringType = SELECTION_TYPE_DEFAULT;
        }
        return hoveringType;
    }

    public handleMouseDown(x: number, y: number, ctx: CanvasRenderingContext2D): boolean {
        this._children = [];
        var hoveringType = this.getHoveringType(x, y);
        if (hoveringType == SELECTION_TYPE_DEFAULT) {
            const newSelector = new RASAreaSelectorTool(this._app, x, y, this);
            this.addChild(newSelector);
        }
        else if (hoveringType == SELECTION_TYPE_TEXT) {
            const newSelector = new RASTextSelectorTool(this._app, x, y, this);
            this.addChild(newSelector);
        }
        return true;
    }

    public handleMouseMove(x: number, y: number, ctx: CanvasRenderingContext2D): boolean {
        this.canvas.style.cursor = this.getHoveringType(x, y);
        return false;
    }
}

class RASAreaSelectorTool extends RASTool {

    private _startX: number = 0;
    private _startY: number = 0;
    private _currentX: number = 0;
    private _currentY: number = 0;
    private _app: RASView;
    private _selection: RASView[] = [];

    constructor(app: RASView, x: number, y: number, parent: RASTool) {
        super(parent);
        this._app = app;
        this._startX = x;
        this._startY = y;
        this._currentX = x;
        this._currentY = y;
    }

    public handleMouseMove(x: number, y: number, ctx: CanvasRenderingContext2D): boolean {
        this._currentX = x;
        this._currentY = y;
        return true;
    }

    public handleMouseUp(x: number, y: number, ctx: CanvasRenderingContext2D): boolean {
        this._children = [];
        var bounds = this.getBounds();
        this._selection = this._app.getSelected(bounds);
        if (this._selection.length != 0) {
            var dragger = new RASDragTool(this._parent);
            for (let selection of this._selection) {
                dragger.addComponent(selection);
                dragger.addChild(new RASDragCornerTool(selection, "x1", "y1", dragger));
                dragger.addChild(new RASDragCornerTool(selection, "x1", "y2", dragger));
                dragger.addChild(new RASDragCornerTool(selection, "x2", "y1", dragger));
                dragger.addChild(new RASDragCornerTool(selection, "x2", "y2", dragger));
            }
            if (this._parent != null) {
                this._parent.addChild(dragger);
            }
        }
        this.requestMyDelection();
        return true;
    }

    private getBounds(): SimpleRectangle {
        return new SimpleRectangle(this._startX, this._startY, this._currentX - this._startX, this._currentY - this._startY);
        // the rectangle constructor will
        // properly handle negative widths/heights
    }

    public render(ctx: CanvasRenderingContext2D, aframe: RASAnimationFrame): void {
        var bounds = this.getBounds();
        ctx.beginPath();
        ctx.strokeStyle = "#000000C0";
        ctx.lineWidth = 2;
        ctx.setLineDash([2, 2]);
        ctx.rect(bounds.x, bounds.y, bounds.width, bounds.height);
        ctx.stroke();
        ctx.setLineDash([]);
    }
}

class RASTextSelectorTool extends RASTool {
    private _startX: number = 0;
    private _startY: number = 0;
    private _currentX: number = 0;
    private _currentY: number = 0;
    private _app: RASView;
    private _selection: RASTextView;
    private _characterModel1: RASCharacterModel | null = null;
    private _characterModel2: RASCharacterModel | null = null;
    private _startLeft: boolean = true;
    protected _selecting: boolean = true;

    constructor(app: RASView, x: number, y: number, parent: RASTool) {
        super(parent);
        this._app = app;

        var bounds = new SimpleRectangle(x, y, 0, 0);

        const charView = this._app.getTextSelection(x, y);
        
        if (charView == null) {
            throw Error("Text selection yet no character is selected");
        }

        this._selection = charView.getTextView();
  
        var dragger = new RASDragTool(this);
        dragger.addComponent(this._selection);
        dragger.addChild(new RASDragCornerTool(this._selection, "x1", "y1", dragger));
        dragger.addChild(new RASDragCornerTool(this._selection, "x1", "y2", dragger));
        dragger.addChild(new RASDragCornerTool(this._selection, "x2", "y1", dragger));
        dragger.addChild(new RASDragCornerTool(this._selection, "x2", "y2", dragger));
        this.addChild(dragger);

        this._characterModel1 = charView.model;
        this._characterModel2 = charView.model;

        if (x >= charView.midpointX) {
            // if we clicked more than halfway through the character, our selection
            // is actually the next character, or (at the end of a text) null.
            const nextChar = this._selection.model.getNextCharacter(this._characterModel1);
            this._characterModel1 = nextChar;
            this._characterModel2 = nextChar;
        } 
    }

    
    public handleMouseMove(x: number, y: number, ctx: CanvasRenderingContext2D): boolean {
        if (!this._selecting) {
            return false;
        }

        const charView = this._app.getTextSelection(x, y);

        if (charView == null || charView.getTextView() != this._selection) {
            this._characterModel2 = this._characterModel1;
        } else {
            this._characterModel2 = charView.model;
            if (x >= charView.midpointX) {
                this._characterModel2  = this._selection.model.getNextCharacter(this._characterModel2);
            } 
        }
        return true;
    }

    
    public handleMouseUp(x: number, y: number, ctx: CanvasRenderingContext2D): boolean {
        this._selecting = false;
        return true;
    }

    public handleKeyPress(char: string, ctx: CanvasRenderingContext2D): boolean { 
        this._characterModel1 = this._selection.model.replaceCharacters(char, this._characterModel1, this._characterModel2);
        this._characterModel2 = this._characterModel1;
        return true; 
    }

    
    public handleSpecialKey(key: string, ctx: CanvasRenderingContext2D): boolean { 
        /*
        const textField = this._selection as RASTextView;
        if (this._characterModel != null) {
            textField.model.removeTextBefore(char, this._characterModel);
        } else {
            textField.model.removeTextBefore(char);
        }
        return true; */
        if (key == SPECIAL_KEY_BACKSPACE) {
            this._characterModel1 = this._selection.model.replaceCharacters("", this._characterModel1, this._characterModel2);
            this._characterModel2 = this._characterModel1;
            return true; 
        } else if (key == SPECIAL_KEY_CTRL_M) {
            console.log("ctrl m");
            this._selection.model.mergeCharacters(this._characterModel1, this._characterModel2);
            return true;
        }

        return false;
    }

    
    public renderHighlights(ctx: CanvasRenderingContext2D, aframe: RASAnimationFrame): void {

        if (this._characterModel1 == this._characterModel2) {
            return;
        }

        var highlightRects : IRectangular[] = [];
        var foundStart: false;
        var foundTrue: false;

        var rect1 = this._selection.getEndCursorPosition();
        if (this._characterModel1 != null) {
            const char1view = this._selection.getViewForModel(this._characterModel1);
            if (char1view != null) {
                rect1 = char1view;
            }
        }

        var rect2 = this._selection.getEndCursorPosition();
        if (this._characterModel2 != null) {
            const char2view = this._selection.getViewForModel(this._characterModel2);
            if (char2view != null) {
                rect2 = char2view;
            }
        }

        if (rect1 == null || rect2 == null) {
            return;
        }

        if (rect1.y == rect2.y) {
            // they're on the same line
            const x = Math.min(rect1.left, rect2.left);
            const width = Math.max(rect1.left, rect2.left) - x;
            firstView = rect1;
            secondView = rect2;
            ctx.beginPath();
            ctx.fillStyle = HIGHLIGHT_COLOR;
            ctx.lineWidth = 0;

            const paddedRect = new SimpleRectangle(x - TOKEN_PADDING_LEFT,
                rect1.y - TOKEN_PADDING_TOP,
                width + TOKEN_PADDING_LEFT + TOKEN_PADDING_RIGHT,
                rect1.height + TOKEN_PADDING_TOP + TOKEN_PADDING_BOTTOM);
            drawRoundRectangle(ctx, paddedRect, TOKEN_ROUNDING_RADIUS, TOKEN_ROUNDING_RADIUS);

            ctx.fill();
            return;
        } 
        
        // they're not on the same line
        var firstView = null;
        var secondView = null;
        
        if (rect1.y < rect2.y) {
            firstView = rect1;
            secondView = rect2;
        } else {
            firstView = rect2;
            secondView = rect1;
        } 

        
        var highlightRects : IRectangular[] = [];
        var foundBeginning = false;

        for (let line of this._selection.children as RASLineView[]) {
            if (line.y == firstView.y) {
                // we're in the first line
                foundBeginning = true;
                highlightRects.push(new SimpleRectangle(firstView.x, 
                                                        line.y, 
                                                        line.widthWithoutWhitespace - (firstView.x - line.x),
                                                        line.height));
            } else if (foundBeginning && line.top < secondView.top) {
                highlightRects.push(new SimpleRectangle(line.x, 
                                                        line.y, 
                                                        line.widthWithoutWhitespace, 
                                                        line.height));
            } else if (foundBeginning) {
                highlightRects.push(new SimpleRectangle(line.x, 
                                                        line.y, 
                                                        secondView.x - line.x,
                                                        line.height));
                break;
            }
        }

        for (let rect of highlightRects) {  
            ctx.beginPath();
            ctx.fillStyle = HIGHLIGHT_COLOR;
            ctx.lineWidth = 0;
            const paddedRect = new SimpleRectangle(rect.x - TOKEN_PADDING_LEFT,
                rect.y - TOKEN_PADDING_TOP,
                rect.width + TOKEN_PADDING_LEFT + TOKEN_PADDING_RIGHT,
                rect.height + TOKEN_PADDING_TOP + TOKEN_PADDING_BOTTOM);
            drawRoundRectangle(ctx, paddedRect, TOKEN_ROUNDING_RADIUS, TOKEN_ROUNDING_RADIUS);
            ctx.fill();
        }
    }

    public renderCursorBar(ctx: CanvasRenderingContext2D, aframe: RASAnimationFrame): void {

        // only render this if the selection area is trivial, and we're not currently selecting
        /*
        if (this._characterModel1 != this._characterModel2) {
            return;
        }
        */

        var bounds : IRectangular;
        if (this._characterModel2 != null) {
            const view = this._selection.getViewForModel(this._characterModel2);
            if (view != null) {
                bounds = view;
            } else {
                bounds = this._selection.getEndCursorPosition();
            }
        } else {
            bounds = this._selection.getEndCursorPosition();
        }

        ctx.beginPath();
        ctx.strokeStyle = CURSOR_COLOR;
        ctx.lineWidth = 3;

        // draw the top bar of the "I"
        ctx.moveTo(bounds.left - bounds.height * CURSOR_MARGIN, 
            bounds.top - bounds.height * CURSOR_MARGIN);
        ctx.lineTo(bounds.left + bounds.height * CURSOR_MARGIN
            , bounds.top - bounds.height * CURSOR_MARGIN);
        // draw the vertical line down the middle
        ctx.moveTo(bounds.left,
            bounds.top - bounds.height * CURSOR_MARGIN);
        ctx.lineTo(bounds.left,  
            bounds.bottom + bounds.height * CURSOR_MARGIN);
        // draw the bottom bar of the "I"
        ctx.moveTo(bounds.left - bounds.height * CURSOR_MARGIN,
             bounds.bottom + bounds.height * CURSOR_MARGIN);
        ctx.lineTo(bounds.left + bounds.height * CURSOR_MARGIN
            , bounds.bottom + bounds.height * CURSOR_MARGIN);
        ctx.stroke();
        
    }

    public render(ctx: CanvasRenderingContext2D, aframe: RASAnimationFrame): void {
    
        this.renderCursorBar(ctx, aframe);
        this.renderHighlights(ctx, aframe);

    }
}

class RASDragTool extends RASTool {
    private _selectedComponents: RASView[] = [];
    private _dragging: boolean = false;
    public _dragX: number = 0; // when dragging, the previous x position
    public _dragY: number = 0; // when dragging, the previous y position
    public addComponent(component: RASView) {
        this._selectedComponents.push(component);
        this._attachedPropertiesHorizontal.push(component.getProperty("x1"));
        this._attachedPropertiesHorizontal.push(component.getProperty("x2"));
        this._attachedPropertiesVertical.push(component.getProperty("y1"));
        this._attachedPropertiesVertical.push(component.getProperty("y2"));
    }
    public handleMouseDown(x: number, y: number, ctx: CanvasRenderingContext2D): boolean {
        for (let component of this._selectedComponents as RASTextView[]) {
            if (isPointNearBorder(component, x, y, DRAG_LINE_WIDTH / 2, DRAG_LINE_WIDTH / 2)) {
                this._dragging = true;
                break;
            }
        }
        if (!this._dragging) {
            return false;
        }
        this._dragX = x;
        this._dragY = y;
        return true;
    }
    public handleMouseMove(x: number, y: number, ctx: CanvasRenderingContext2D): boolean {
        if (!this._dragging) {
            return false;
        }
        const deltaX = x - this._dragX;
        const deltaY = y - this._dragY;
        this._dragX = x;
        this._dragY = y;
        this.fireMoveHorizontal(deltaX);
        this.fireMoveVertical(deltaY);
        /*
        for (let component of this._selectedComponents) {
            component.layout(ctx);
        } */
        return true;
    }
    public handleMouseUp(x: number, y: number, ctx: CanvasRenderingContext2D): boolean {
        if (!this._dragging) {
            return false;
        }
        this._dragging = false;
        //this.gridVisible = false;
        //this.x = Math.round(this.x / GRID_SIZE) * GRID_SIZE;
        //this.y = Math.round(this.y / GRID_SIZE) * GRID_SIZE;
        return true;
    }

    public render(ctx: CanvasRenderingContext2D, aframe: RASAnimationFrame): void {
        for (let component of this._selectedComponents) {
            ctx.beginPath();
            ctx.strokeStyle = "#00000040";
            ctx.lineWidth = 10;
            ctx.setLineDash([2, 2]);
            ctx.rect(component.x, component.y, component.width, component.height);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }
}

class RASDragCornerTool extends RASTool {
    private _selectedComponent: RASView;
    private _dragging: boolean = false;
    protected _propertyX: IRASProperty; // the properties of the attached component that this is controlling 
    protected _propertyY: IRASProperty;
    public _dragX: number = 0; // when dragging, the previous x position
    public _dragY: number = 0; // when dragging, the previous y position
    constructor(component: RASView, propertyNameX: string, propertyNameY: string, parent: RASTool) {
        super(parent);
        this._selectedComponent = component;
        this._propertyX = component.getProperty(propertyNameX);
        this._propertyY = component.getProperty(propertyNameY);
        this._attachedPropertiesHorizontal.push(this._propertyX);
        this._attachedPropertiesVertical.push(this._propertyY);
    }
    public handleMouseDown(x: number, y: number, ctx: CanvasRenderingContext2D): boolean {
        if (Math.abs(this._propertyX.value - x) < DRAG_LINE_WIDTH / 2 &&
            Math.abs(this._propertyY.value - y) < DRAG_LINE_WIDTH / 2) {
            this._dragging = true;
        }
        if (!this._dragging) {
            return false;
        }
        this._dragX = x;
        this._dragY = y;
        return true;
    }

    public handleMouseMove(x: number, y: number, ctx: CanvasRenderingContext2D): boolean {
        if (!this._dragging) {
            return false;
        }
        const deltaX = x - this._dragX;
        const deltaY = y - this._dragY;
        this._dragX = x;
        this._dragY = y;
        this.fireMoveHorizontal(deltaX);
        this.fireMoveVertical(deltaY);
        //this._selectedComponent.layout(ctx);
        return true;
    }
    public handleMouseUp(x: number, y: number, ctx: CanvasRenderingContext2D): boolean {
        if (!this._dragging) {
            return false;
        }
        this._dragging = false;
        return true;
    }
    public render(ctx: CanvasRenderingContext2D, aframe: RASAnimationFrame): void {
        ctx.beginPath();
        ctx.fillStyle = "#6699CC";
        ctx.strokeStyle = "#333333";
        ctx.lineWidth = 2;
        ctx.rect(this._propertyX.value - DRAG_LINE_WIDTH / 2, this._propertyY.value - DRAG_LINE_WIDTH / 2, DRAG_LINE_WIDTH, DRAG_LINE_WIDTH);
        ctx.fill();
        ctx.stroke();
    }
}
