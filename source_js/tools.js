"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const geometry_1 = require("./geometry");
const objects_1 = require("./objects");
const views_1 = require("./views");
const DRAG_LINE_WIDTH = 15;
const CURSOR_MARGIN = 0.1; // how much extra above and below
// the selected character the cursor line goes, as a proportion of the
// character's height.
const HIGHLIGHT_COLOR = "#FFFF6670";
const CURSOR_COLOR = "#0000AA";
exports.SPECIAL_KEY_BACKSPACE = "BACKSPACE";
exports.SPECIAL_KEY_CTRL_M = "CTRL_M";
exports.SPECIAL_KEY_CTRL_B = "CTRL_B";
class RASTool extends objects_1.RASComponent {
    constructor(parent) {
        super();
        this._attachedPropertiesHorizontal = [];
        this._attachedPropertiesVertical = [];
        this._parent = parent;
    }
    set parent(parent) {
        this._parent = parent;
    }
    requestDeletion(toolToDelete) {
        this._children = this._children.filter(child => child != toolToDelete);
    }
    requestMyDelection() {
        if (this._parent == null) {
            return; // can't delete the highest tool in the tree
        }
        this._parent.requestDeletion(this);
        for (let child of this._children) {
            this._parent.addChild(child);
            child.parent = this._parent;
        }
    }
    fireMoveHorizontal(delta) {
        for (let property of this._attachedPropertiesHorizontal) {
            property.value = property.value + delta;
        }
    }
    fireMoveVertical(delta) {
        for (let property of this._attachedPropertiesVertical) {
            property.value = property.value + delta;
        }
    }
    handleClick(x, y, ctx) {
        return false;
    }
    handleClickAll(x, y, ctx) {
        for (let child of this._children) {
            if (child.handleClickAll(x, y, ctx)) {
                return true;
            }
        }
        return this.handleClick(x, y, ctx);
    }
    handleMouseDown(x, y, ctx) {
        return false;
    }
    handleMouseDownAll(x, y, ctx) {
        for (let child of this._children) {
            if (child.handleMouseDownAll(x, y, ctx)) {
                return true;
            }
        }
        return this.handleMouseDown(x, y, ctx);
    }
    handleMouseMove(x, y, ctx) {
        return false;
    }
    handleMouseMoveAll(x, y, ctx) {
        for (let child of this._children) {
            if (child.handleMouseMoveAll(x, y, ctx)) {
                return true;
            }
        }
        return this.handleMouseMove(x, y, ctx);
    }
    handleMouseUp(x, y, ctx) {
        return false;
    }
    handleMouseUpAll(x, y, ctx) {
        for (let child of this._children) {
            if (child.handleMouseUpAll(x, y, ctx)) {
                return true;
            }
        }
        return this.handleMouseUp(x, y, ctx);
    }
    handleKeyPress(char, ctx) {
        return false;
    }
    handleKeyPressAll(char, ctx) {
        for (let child of this._children) {
            if (child.handleKeyPressAll(char, ctx)) {
                return true;
            }
        }
        return this.handleKeyPress(char, ctx);
    }
    handleSpecialKey(char, ctx) {
        return false;
    }
    handleSpecialKeyAll(char, ctx) {
        for (let child of this._children) {
            if (child.handleSpecialKeyAll(char, ctx)) {
                return true;
            }
        }
        return this.handleSpecialKey(char, ctx);
    }
}
exports.RASTool = RASTool;
/**
 * The RASDefaultTool always exists, and creates and removes
 * child tools (like selectors, drag handles, etc.) in response to
 * user input.
 */
class RASDefaultTool extends RASTool {
    constructor(app) {
        super(null);
        this._selectionMode = views_1.SELECTION_TYPE_NONE;
        this._app = app;
    }
    getHoveringType(x, y) {
        var hoveringType = this._app.getHoveringType(x, y);
        if (hoveringType == "") {
            hoveringType = views_1.SELECTION_TYPE_DEFAULT;
        }
        return hoveringType;
    }
    handleMouseDown(x, y, ctx) {
        this._children = [];
        var hoveringType = this.getHoveringType(x, y);
        if (hoveringType == views_1.SELECTION_TYPE_DEFAULT) {
            const newSelector = new RASAreaSelectorTool(this._app, x, y, this);
            this.addChild(newSelector);
        }
        else if (hoveringType == views_1.SELECTION_TYPE_TEXT) {
            const newSelector = new RASTextSelectorTool(this._app, x, y, this);
            this.addChild(newSelector);
        }
        return true;
    }
    handleMouseMove(x, y, ctx) {
        this.canvas.style.cursor = this.getHoveringType(x, y);
        return false;
    }
}
exports.RASDefaultTool = RASDefaultTool;
class RASAreaSelectorTool extends RASTool {
    constructor(app, x, y, parent) {
        super(parent);
        this._startX = 0;
        this._startY = 0;
        this._currentX = 0;
        this._currentY = 0;
        this._selection = [];
        this._app = app;
        this._startX = x;
        this._startY = y;
        this._currentX = x;
        this._currentY = y;
    }
    handleMouseMove(x, y, ctx) {
        this._currentX = x;
        this._currentY = y;
        return true;
    }
    handleMouseUp(x, y, ctx) {
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
    getBounds() {
        return new geometry_1.SimpleRectangle(this._startX, this._startY, this._currentX - this._startX, this._currentY - this._startY);
        // the rectangle constructor will
        // properly handle negative widths/heights
    }
    render(ctx, aframe) {
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
    constructor(app, x, y, parent) {
        super(parent);
        this._startX = 0;
        this._startY = 0;
        this._currentX = 0;
        this._currentY = 0;
        this._characterModel1 = null;
        this._characterModel2 = null;
        this._startLeft = true;
        this._selecting = true;
        this._app = app;
        var bounds = new geometry_1.SimpleRectangle(x, y, 0, 0);
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
    handleMouseMove(x, y, ctx) {
        if (!this._selecting) {
            return false;
        }
        const charView = this._app.getTextSelection(x, y);
        if (charView == null || charView.getTextView() != this._selection) {
            this._characterModel2 = this._characterModel1;
        }
        else {
            this._characterModel2 = charView.model;
            if (x >= charView.midpointX) {
                this._characterModel2 = this._selection.model.getNextCharacter(this._characterModel2);
            }
        }
        return true;
    }
    handleMouseUp(x, y, ctx) {
        this._selecting = false;
        return true;
    }
    handleKeyPress(char, ctx) {
        this._characterModel1 = this._selection.model.replaceCharacters(char, this._characterModel1, this._characterModel2);
        this._characterModel2 = this._characterModel1;
        return true;
    }
    handleSpecialKey(key, ctx) {
        /*
        const textField = this._selection as RASTextView;
        if (this._characterModel != null) {
            textField.model.removeTextBefore(char, this._characterModel);
        } else {
            textField.model.removeTextBefore(char);
        }
        return true; */
        if (key == exports.SPECIAL_KEY_BACKSPACE) {
            this._characterModel1 = this._selection.model.replaceCharacters("", this._characterModel1, this._characterModel2);
            this._characterModel2 = this._characterModel1;
            return true;
        }
        else if (key == exports.SPECIAL_KEY_CTRL_M) {
            console.log("ctrl m");
            this._selection.model.mergeCharacters(this._characterModel1, this._characterModel2);
            return true;
        }
        return false;
    }
    renderHighlights(ctx, aframe) {
        if (this._characterModel1 == this._characterModel2) {
            return;
        }
        var highlightRects = [];
        var foundStart;
        var foundTrue;
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
            const paddedRect = new geometry_1.SimpleRectangle(x - views_1.TOKEN_PADDING_LEFT, rect1.y - views_1.TOKEN_PADDING_TOP, width + views_1.TOKEN_PADDING_LEFT + views_1.TOKEN_PADDING_RIGHT, rect1.height + views_1.TOKEN_PADDING_TOP + views_1.TOKEN_PADDING_BOTTOM);
            geometry_1.drawRoundRectangle(ctx, paddedRect, views_1.TOKEN_ROUNDING_RADIUS, views_1.TOKEN_ROUNDING_RADIUS);
            ctx.fill();
            return;
        }
        // they're not on the same line
        var firstView = null;
        var secondView = null;
        if (rect1.y < rect2.y) {
            firstView = rect1;
            secondView = rect2;
        }
        else {
            firstView = rect2;
            secondView = rect1;
        }
        var highlightRects = [];
        var foundBeginning = false;
        for (let line of this._selection.children) {
            if (line.y == firstView.y) {
                // we're in the first line
                foundBeginning = true;
                highlightRects.push(new geometry_1.SimpleRectangle(firstView.x, line.y, line.widthWithoutWhitespace - (firstView.x - line.x), line.height));
            }
            else if (foundBeginning && line.top < secondView.top) {
                highlightRects.push(new geometry_1.SimpleRectangle(line.x, line.y, line.widthWithoutWhitespace, line.height));
            }
            else if (foundBeginning) {
                highlightRects.push(new geometry_1.SimpleRectangle(line.x, line.y, secondView.x - line.x, line.height));
                break;
            }
        }
        for (let rect of highlightRects) {
            ctx.beginPath();
            ctx.fillStyle = HIGHLIGHT_COLOR;
            ctx.lineWidth = 0;
            const paddedRect = new geometry_1.SimpleRectangle(rect.x - views_1.TOKEN_PADDING_LEFT, rect.y - views_1.TOKEN_PADDING_TOP, rect.width + views_1.TOKEN_PADDING_LEFT + views_1.TOKEN_PADDING_RIGHT, rect.height + views_1.TOKEN_PADDING_TOP + views_1.TOKEN_PADDING_BOTTOM);
            geometry_1.drawRoundRectangle(ctx, paddedRect, views_1.TOKEN_ROUNDING_RADIUS, views_1.TOKEN_ROUNDING_RADIUS);
            ctx.fill();
        }
    }
    renderCursorBar(ctx, aframe) {
        // only render this if the selection area is trivial, and we're not currently selecting
        /*
        if (this._characterModel1 != this._characterModel2) {
            return;
        }
        */
        var bounds;
        if (this._characterModel2 != null) {
            const view = this._selection.getViewForModel(this._characterModel2);
            if (view != null) {
                bounds = view;
            }
            else {
                bounds = this._selection.getEndCursorPosition();
            }
        }
        else {
            bounds = this._selection.getEndCursorPosition();
        }
        ctx.beginPath();
        ctx.strokeStyle = CURSOR_COLOR;
        ctx.lineWidth = 3;
        // draw the top bar of the "I"
        ctx.moveTo(bounds.left - bounds.height * CURSOR_MARGIN, bounds.top - bounds.height * CURSOR_MARGIN);
        ctx.lineTo(bounds.left + bounds.height * CURSOR_MARGIN, bounds.top - bounds.height * CURSOR_MARGIN);
        // draw the vertical line down the middle
        ctx.moveTo(bounds.left, bounds.top - bounds.height * CURSOR_MARGIN);
        ctx.lineTo(bounds.left, bounds.bottom + bounds.height * CURSOR_MARGIN);
        // draw the bottom bar of the "I"
        ctx.moveTo(bounds.left - bounds.height * CURSOR_MARGIN, bounds.bottom + bounds.height * CURSOR_MARGIN);
        ctx.lineTo(bounds.left + bounds.height * CURSOR_MARGIN, bounds.bottom + bounds.height * CURSOR_MARGIN);
        ctx.stroke();
    }
    render(ctx, aframe) {
        this.renderCursorBar(ctx, aframe);
        this.renderHighlights(ctx, aframe);
    }
}
class RASDragTool extends RASTool {
    constructor() {
        super(...arguments);
        this._selectedComponents = [];
        this._dragging = false;
        this._dragX = 0; // when dragging, the previous x position
        this._dragY = 0; // when dragging, the previous y position
    }
    addComponent(component) {
        this._selectedComponents.push(component);
        this._attachedPropertiesHorizontal.push(component.getProperty("x1"));
        this._attachedPropertiesHorizontal.push(component.getProperty("x2"));
        this._attachedPropertiesVertical.push(component.getProperty("y1"));
        this._attachedPropertiesVertical.push(component.getProperty("y2"));
    }
    handleMouseDown(x, y, ctx) {
        for (let component of this._selectedComponents) {
            if (geometry_1.isPointNearBorder(component, x, y, DRAG_LINE_WIDTH / 2, DRAG_LINE_WIDTH / 2)) {
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
    handleMouseMove(x, y, ctx) {
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
    handleMouseUp(x, y, ctx) {
        if (!this._dragging) {
            return false;
        }
        this._dragging = false;
        //this.gridVisible = false;
        //this.x = Math.round(this.x / GRID_SIZE) * GRID_SIZE;
        //this.y = Math.round(this.y / GRID_SIZE) * GRID_SIZE;
        return true;
    }
    render(ctx, aframe) {
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
    constructor(component, propertyNameX, propertyNameY, parent) {
        super(parent);
        this._dragging = false;
        this._dragX = 0; // when dragging, the previous x position
        this._dragY = 0; // when dragging, the previous y position
        this._selectedComponent = component;
        this._propertyX = component.getProperty(propertyNameX);
        this._propertyY = component.getProperty(propertyNameY);
        this._attachedPropertiesHorizontal.push(this._propertyX);
        this._attachedPropertiesVertical.push(this._propertyY);
    }
    handleMouseDown(x, y, ctx) {
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
    handleMouseMove(x, y, ctx) {
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
    handleMouseUp(x, y, ctx) {
        if (!this._dragging) {
            return false;
        }
        this._dragging = false;
        return true;
    }
    render(ctx, aframe) {
        ctx.beginPath();
        ctx.fillStyle = "#6699CC";
        ctx.strokeStyle = "#333333";
        ctx.lineWidth = 2;
        ctx.rect(this._propertyX.value - DRAG_LINE_WIDTH / 2, this._propertyY.value - DRAG_LINE_WIDTH / 2, DRAG_LINE_WIDTH, DRAG_LINE_WIDTH);
        ctx.fill();
        ctx.stroke();
    }
}
