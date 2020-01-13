(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ANIMATION_FRAMES_PER_SECOND = 60;
class RASAnimation {
    constructor() {
        this._startTime = 0;
        this._startPosition = 0;
        this._frames = [];
    }
    get numFrames() { return this._frames.length; }
    addFrame(frame) {
        this._frames.push(frame);
    }
    startAnimation(time) {
        this._startTime = time;
        this._startPosition = 0;
    }
    getFrame(time) {
        const timeElapsed = time - this._startTime;
        const frameOffset = timeElapsed / (1000 / ANIMATION_FRAMES_PER_SECOND);
        const currentPosition = Math.floor(this._startPosition + frameOffset);
        if (currentPosition >= this._frames.length) {
            throw RangeError("Animation finished");
        }
        return this._frames[currentPosition];
    }
}
exports.RASAnimation = RASAnimation;
class RASAnimationFrame {
    constructor() {
        this._lookup = {};
    }
    addPropertyInterpolation(unitName, propertyValue) {
        this._lookup[unitName] = propertyValue;
    }
    getPropertyInterpolation(unitName) {
        if (unitName in this._lookup) {
            return this._lookup[unitName];
        }
        return 0;
    }
}
exports.RASAnimationFrame = RASAnimationFrame;

},{}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const animation_1 = require("./animation");
const models_1 = require("./models");
const views_1 = require("./views");
const tools_1 = require("./tools");
const VIRTUAL_CANVAS_WIDTH = 1920;
const VIRTUAL_CANVAS_HEIGHT = 1080;
const BACKSPACE_KEY = 8;
class App extends views_1.RASView {
    constructor() {
        super(null);
        this._selections = [];
        this._currentTool = new tools_1.RASTool(null);
        this._animation = new animation_1.RASAnimation();
    }
    set selections(ss) {
        this._selections = ss;
    }
    handleClick(x, y, ctx) {
        var handled = this._currentTool.handleClickAll(x, y, ctx);
        return handled;
    }
    handleMouseDown(x, y, ctx) {
        var handled = this._currentTool.handleMouseDownAll(x, y, ctx);
        return handled;
    }
    handleMouseMove(x, y, ctx) {
        var handled = this._currentTool.handleMouseMoveAll(x, y, ctx);
        return handled;
    }
    handleMouseUp(x, y, ctx) {
        var handled = this._currentTool.handleMouseUpAll(x, y, ctx);
        return handled;
    }
    handleKeyPress(char, ctx) {
        var handled = this._currentTool.handleKeyPressAll(char, ctx);
        return handled;
    }
    handleSpecialKey(char, ctx) {
        var handled = this._currentTool.handleSpecialKeyAll(char, ctx);
        return handled;
    }
    setup() {
        const ctx = this.context;
        var slide = new views_1.RASSlideView(VIRTUAL_CANVAS_WIDTH, VIRTUAL_CANVAS_HEIGHT, this);
        this.addChild(slide);
        this._currentTool = new tools_1.RASDefaultTool(this);
        var text = new models_1.RASTextModel("this is a long string with asjasdlkjfaklsjfalhalhg words");
        var textField = new views_1.RASTextView(text, 400, 400, 600, 600, slide);
        slide.addChild(textField);
        textField.layoutAll(ctx);
        this._animation = makeDummyAnimation(textField);
        this.animationLoop(0);
    }
    animationLoop(step) {
        // need to bind the current this reference to the callback
        requestAnimationFrame(this.animationLoop.bind(this));
        var ctx = this.context;
        if (ctx === null) {
            return;
        }
        ctx.fillStyle = "#CCCCCC";
        ctx.fillRect(0, 0, VIRTUAL_CANVAS_WIDTH * 2, VIRTUAL_CANVAS_HEIGHT * 2);
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, VIRTUAL_CANVAS_WIDTH, VIRTUAL_CANVAS_HEIGHT);
        var currentAnimationFrame = new animation_1.RASAnimationFrame(); // dummy frame in case there's no animation
        if (this._animation.numFrames > 0) {
            try {
                var currentAnimationFrame = this._animation.getFrame(step);
            }
            catch (e) {
                if (e instanceof RangeError) {
                    this._animation.startAnimation(step);
                }
                var currentAnimationFrame = this._animation.getFrame(step);
            }
        }
        this.layoutAll(ctx);
        this.renderAll(ctx, currentAnimationFrame);
        this._currentTool.renderAll(ctx, currentAnimationFrame);
    }
}
exports.App = App;
function makeDummyAnimation(textField) {
    var results = new animation_1.RASAnimation();
    for (let unit of textField.getTextUnits()) {
        var frame = new animation_1.RASAnimationFrame();
        frame.addPropertyInterpolation(unit.name, 0.1);
        results.addFrame(frame);
        frame = new animation_1.RASAnimationFrame();
        frame.addPropertyInterpolation(unit.name, 0.3);
        results.addFrame(frame);
        frame = new animation_1.RASAnimationFrame();
        frame.addPropertyInterpolation(unit.name, 0.5);
        results.addFrame(frame);
        frame = new animation_1.RASAnimationFrame();
        frame.addPropertyInterpolation(unit.name, 0.7);
        results.addFrame(frame);
        frame = new animation_1.RASAnimationFrame();
        frame.addPropertyInterpolation(unit.name, 0.9);
        results.addFrame(frame);
        frame = new animation_1.RASAnimationFrame();
        frame.addPropertyInterpolation(unit.name, 0.7);
        results.addFrame(frame);
        frame = new animation_1.RASAnimationFrame();
        frame.addPropertyInterpolation(unit.name, 0.5);
        results.addFrame(frame);
        frame = new animation_1.RASAnimationFrame();
        frame.addPropertyInterpolation(unit.name, 0.3);
        results.addFrame(frame);
        frame = new animation_1.RASAnimationFrame();
        frame.addPropertyInterpolation(unit.name, 0.1);
        results.addFrame(frame);
    }
    return results;
}
function rescaleCanvas() {
    var canvas = document.getElementById('canvas');
    if (canvas === null) {
        return 1.0;
    }
    var ctx = canvas.getContext('2d');
    if (ctx === null) {
        return 1.0;
    }
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.restore();
    var canvas_scale_ratio = Math.min(canvas.width / VIRTUAL_CANVAS_WIDTH, canvas.height / VIRTUAL_CANVAS_HEIGHT);
    ctx.scale(canvas_scale_ratio, canvas_scale_ratio);
    return canvas_scale_ratio;
}
window.onload = () => {
    let app = new App();
    var canvas = document.getElementById('canvas');
    if (canvas === null) {
        return;
    }
    var context = canvas.getContext('2d');
    if (context === null) {
        return;
    }
    context.save();
    var canvas_scale_ratio = rescaleCanvas();
    app.setup();
    canvas.addEventListener('click', function (event) {
        var x = event.pageX - canvas.offsetLeft;
        var y = event.pageY - canvas.offsetTop;
        x /= canvas_scale_ratio;
        y /= canvas_scale_ratio;
        x = Math.min(x, VIRTUAL_CANVAS_WIDTH);
        y = Math.min(y, VIRTUAL_CANVAS_HEIGHT);
        app.handleClick(x, y, context);
    }, false);
    canvas.addEventListener('mousedown', (event) => {
        var x = event.pageX - canvas.offsetLeft;
        var y = event.pageY - canvas.offsetTop;
        x /= canvas_scale_ratio;
        y /= canvas_scale_ratio;
        x = Math.min(x, VIRTUAL_CANVAS_WIDTH);
        y = Math.min(y, VIRTUAL_CANVAS_HEIGHT);
        app.handleMouseDown(x, y, context);
    });
    canvas.addEventListener('mousemove', (event) => {
        var x = event.pageX - canvas.offsetLeft;
        var y = event.pageY - canvas.offsetTop;
        x /= canvas_scale_ratio;
        y /= canvas_scale_ratio;
        x = Math.min(x, VIRTUAL_CANVAS_WIDTH);
        y = Math.min(y, VIRTUAL_CANVAS_HEIGHT);
        app.handleMouseMove(x, y, context);
    });
    canvas.addEventListener('mouseup', (event) => {
        var x = event.pageX - canvas.offsetLeft;
        var y = event.pageY - canvas.offsetTop;
        x /= canvas_scale_ratio;
        y /= canvas_scale_ratio;
        x = Math.min(x, VIRTUAL_CANVAS_WIDTH);
        y = Math.min(y, VIRTUAL_CANVAS_HEIGHT);
        app.handleMouseUp(x, y, context);
    });
    window.addEventListener('resize', (event) => {
        canvas_scale_ratio = rescaleCanvas();
    });
    window.addEventListener("keydown", (e) => {
        const charCode = (typeof e.which == "number") ? e.which : e.keyCode;
        const char = String.fromCharCode(charCode);
        if (charCode == BACKSPACE_KEY) {
            app.handleSpecialKey(tools_1.SPECIAL_KEY_BACKSPACE, context);
        }
        else if (e.ctrlKey && char == "M") {
            app.handleSpecialKey(tools_1.SPECIAL_KEY_CTRL_M, context);
        }
    });
    window.addEventListener("keypress", (e) => {
        if (e.ctrlKey) {
            return;
        }
        const charCode = (typeof e.which == "number") ? e.which : e.keyCode;
        const char = String.fromCharCode(charCode);
        app.handleKeyPress(char, context);
    });
};

},{"./animation":1,"./models":4,"./tools":6,"./views":7}],3:[function(require,module,exports){
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

},{}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const objects_1 = require("./objects");
const WHITESPACE_CHARACTERS = [" ", "\t"];
class RASModel extends objects_1.RASObject {
}
exports.RASModel = RASModel;
class RASCharacterModel extends RASModel {
    constructor(text) {
        super();
        this._previousCharacter = null;
        this._nextCharacter = null;
        this._text = text;
    }
    get previousCharacter() { return this._previousCharacter; }
    get nextCharacter() { return this._nextCharacter; }
    set previousCharacter(other) { this._previousCharacter = other; }
    set nextCharacter(other) { this._nextCharacter = other; }
    get text() { return this._text; }
    isWhitespace() {
        for (let char of this._text) { // usually RASCharacterModel should represent a single character
            // but just in case
            if (WHITESPACE_CHARACTERS.indexOf(this._text) == -1) {
                return false;
            }
        }
        return true;
    }
}
exports.RASCharacterModel = RASCharacterModel;
class RASTokenModel extends RASModel {
    constructor(text) {
        super();
        this._previousToken = null;
        this._nextToken = null;
        for (let i = 0; i < text.length; i++) {
            const newChar = new RASCharacterModel(text.charAt(i));
            this.addCharacter(newChar);
        }
    }
    get previousToken() { return this._previousToken; }
    get nextToken() { return this._nextToken; }
    set previousToken(other) { this._previousToken = other; }
    set nextToken(other) { this._nextToken = other; }
    get text() {
        var results = "";
        for (let char of this._children) {
            results += char.text;
        }
        return results;
    }
    addCharacter(char) {
        char.nextCharacter = null;
        char.previousCharacter = null;
        if (this.numChildren > 0) {
            const lastChar = this._children[this.numChildren - 1];
            lastChar.nextCharacter = char;
            char.previousCharacter = lastChar;
        }
        this.addChild(char);
    }
    hasCharacter(target) {
        for (let char of this.characters) {
            if (char == target) {
                return true;
            }
        }
        return false;
    }
    splitBefore(target) {
        if (!this.hasCharacter(target)) {
            return [this];
        }
        var found = false;
        var newToken1 = new RASTokenModel("");
        var newToken2 = new RASTokenModel("");
        for (let char of this.characters) {
            if (char == target) {
                found = true;
            }
            if (found) {
                newToken2.addCharacter(char);
            }
            else {
                newToken1.addCharacter(char);
            }
        }
        if (newToken1.numChildren == 0) {
            // the target character was at the start of the word
            return [newToken2];
        }
        return [newToken1, newToken2];
    }
    /**
     * Adds a string to the text before or after the target character
     *
     * @param str The string to add
     * @param target The [[RASCharacterView]] that str should be added before or after
     * @param before Whether to add the string before or after the target character
     */
    /*
   public addText(str: string, target: RASCharacterModel) {
       var oldChildren = this.characters.slice(); // shallow copy array with .slice()
                                                   // because we'll be modifying it
       this._children = [];

       for (let char of oldChildren) {
                                                   
           if (char != target) {
               this.addCharacter(char);
               continue;
           }

           for (let i = 0; i < str.length; i++) {
               const newChar = new RASCharacterModel(str.charAt(i));
               
               this.addCharacter(newChar);
           }
           
           this.addCharacter(char);
       }
   }
*/
    /**
     * Add text at the end.
     *
     * @param str String to add
     */
    /*
   public addTextAtEnd(str: string) {
       for (let i = 0; i < str.length; i++) {
           const newChar = new RASCharacterModel(str.charAt(i));
           this.addCharacter(newChar);
       }
   }*/
    get characters() {
        return this._children;
    }
    isWhitespace() {
        for (let child of this._children) {
            if (!(child.isWhitespace())) {
                return false;
            }
        }
        return true;
    }
}
exports.RASTokenModel = RASTokenModel;
class RASTextModel extends RASModel {
    constructor(text) {
        super();
        var currentChars = "";
        for (let i = 0; i < text.length; i++) {
            const char = text.charAt(i);
            if (WHITESPACE_CHARACTERS.indexOf(char) > -1) {
                var newWordModel = new RASTokenModel(currentChars);
                this.addToken(newWordModel);
                newWordModel = new RASTokenModel(char);
                this.addToken(newWordModel);
                currentChars = "";
            }
            else {
                currentChars += char;
            }
        }
        if (currentChars != "") {
            var newWordModel = new RASTokenModel(currentChars);
            this.addToken(newWordModel);
        }
    }
    splitAtCharacter(target) {
        if (target == null) {
            return;
        }
        const oldChildren = this.tokens.slice();
        this._children = [];
        for (let token of oldChildren) {
            for (let newToken of token.splitBefore(target)) {
                this.addChild(newToken);
            }
        }
    }
    static mergeTokens(tokens) {
        if (tokens.length == 0) {
            throw Error("Trying to merge zero tokens into one");
        }
        for (let token of tokens.slice(1)) {
            for (let char of token.characters) {
                tokens[0].addCharacter(char);
            }
        }
        return tokens[0];
    }
    mergeCharacters(target1, target2) {
        var target1pos = 1000000000000;
        var target2pos = 1000000000000;
        var tokensBefore = [];
        var tokensBetween = [];
        var tokensAfter = [];
        this.splitAtCharacter(target1);
        this.splitAtCharacter(target2);
        if (target1 != null) {
            target1pos = this.tokens.findIndex((token) => token.hasCharacter(target1));
        }
        if (target2 != null) {
            target2pos = this.tokens.findIndex((token) => token.hasCharacter(target2));
        }
        if (target1 == target2) {
            // there's nothing to merge, only split
            return;
        }
        const firstTargetPos = Math.min(target1pos, target2pos);
        const secondTargetPos = Math.max(target1pos, target2pos);
        tokensBefore = this.tokens.slice(0, firstTargetPos);
        tokensBetween = this.tokens.slice(firstTargetPos, secondTargetPos);
        tokensAfter = this.tokens.slice(secondTargetPos);
        var newChild = RASTextModel.mergeTokens(tokensBetween);
        this._children = [];
        for (let token of [...tokensBefore, newChild, ...tokensAfter]) {
            this.addChild(token);
        }
    }
    static _tokenize(str) {
        var newTokens = [];
        var currentChars = "";
        for (let i = 0; i < str.length; i++) {
            const char = str.charAt(i);
            if (WHITESPACE_CHARACTERS.indexOf(char) > -1) {
                var newToken = new RASTokenModel(currentChars);
                newTokens.push(newToken);
                newToken = new RASTokenModel(char);
                newTokens.push(newToken);
                currentChars = "";
            }
            else {
                currentChars += char;
            }
        }
        if (currentChars != "") {
            var newToken = new RASTokenModel(currentChars);
            newTokens.push(newToken);
        }
        return newTokens;
    }
    /**
     * Replaces characters in the selection.  This is the fundamental
     * editing operation to strings; it's used even for normal typing.
     *
     * This is a very similar procedure to [[mergeCharacters]].
     *
     * @param text The text to insert
     * @param target1 One boundary character (i.e., the first character
     *                  of the selection, or the character after the last)
     * @param target2 The other boundary character.
     *
     */
    replaceCharacters(text, target1, target2) {
        var target1pos = 1000000000000;
        var target2pos = 1000000000000;
        var tokensBefore = [];
        var tokensAfter = [];
        // split first, because the characters we'll be removing
        // need to be split off from the tokens they may be a part of
        this.splitAtCharacter(target1);
        this.splitAtCharacter(target2);
        if (target1 != null) {
            target1pos = this.tokens.findIndex((token) => token.hasCharacter(target1));
        }
        if (target2 != null) {
            target2pos = this.tokens.findIndex((token) => token.hasCharacter(target2));
        }
        const firstTargetPos = Math.min(target1pos, target2pos);
        const secondTargetPos = Math.max(target1pos, target2pos);
        tokensBefore = this.tokens.slice(0, firstTargetPos);
        tokensAfter = this.tokens.slice(secondTargetPos);
        console.log(firstTargetPos, secondTargetPos);
        var result = null; // the charcter model to put the cursor at after this
        if (tokensAfter.length > 0 && tokensAfter[0].numChildren > 0) {
            result = tokensAfter[0].characters[0];
        }
        var newChildren = RASTextModel._tokenize(text);
        // now merge on both sides of the new content.
        if (newChildren.length > 0 && tokensAfter.length > 0 &&
            !newChildren[newChildren.length - 1].isWhitespace() &&
            !tokensAfter[0].isWhitespace()) {
            var prevToken = newChildren[newChildren.length - 1];
            var nextToken = tokensAfter[0];
            tokensAfter = tokensAfter.slice(1);
            newChildren[newChildren.length - 1] =
                RASTextModel.mergeTokens([prevToken, nextToken]);
        }
        if (tokensBefore.length > 0 &&
            newChildren.length > 0 &&
            !tokensBefore[tokensBefore.length - 1].isWhitespace() &&
            !newChildren[0].isWhitespace()) {
            var prevToken = tokensBefore[tokensBefore.length - 1];
            var nextToken = newChildren[0];
            newChildren = newChildren.slice(1);
            tokensBefore[tokensBefore.length - 1] =
                RASTextModel.mergeTokens([prevToken, nextToken]);
        }
        this._children = [];
        for (let token of [...tokensBefore, ...newChildren, ...tokensAfter]) {
            this.addChild(token);
        }
        return result;
    }
    addToken(token) {
        token.nextToken = null; // in case it's an old token with existing links
        token.previousToken = null;
        if (this.numChildren > 0) {
            const lastToken = this._children[this.numChildren - 1];
            lastToken.nextToken = token;
            token.previousToken = lastToken;
        }
        this.addChild(token);
    }
    /**
     * Adds a string to the text before the target character.  Usually the character
     * will be added to the token that contains the target character, but if that token
     * is whitespace, it will be added to the token before.
     *
     * @param str The string to add
     * @param target The [[RASCharacterView]] that str should be added before or after
     */
    /*

    public addText(str: string, target: RASCharacterModel): void {
        if (str.length == 0) {
            return;
        }

        for (let token of this.tokens) {
            if (!token.hasCharacter(target)) {
                continue;
            } else if (token.isWhitespace()) {
                if (token.previousToken != null) {
                    token.previousToken.addTextAtEnd(str);
                } else {
                    var newToken = new RASTokenModel(str);
                    this.addTokenAtBeginning(newToken);
                }
            } else {
                token.addText(str, target);
            }
        }
    }
    */
    addTokenAtBeginning(token) {
        if (this.numChildren == 0) {
            this.addChild(token);
        }
        var oldChildren = this.tokens.slice();
        this._children = [];
        this.addChild(token);
        for (let child of oldChildren) {
            this.addChild(child);
        }
    }
    /*
    public replaceTextBetween(str: string,
                            beforeTarget: RASCharacterModel | null,
                            afterTarget: RASCharacterModel | null): void {

        
        //var tokensBefore : RASTokenModel[] = [];
       // var tokensAfter : RASTokenModel[] = [];

        // save the old tokens, and start a new list of tokens

        var oldTokens = this.tokens.slice(); // shallow copy array with .slice()
                                                    // because we'll be modifying it
        this._children = [];


        // find in which tokens the target characters are

        var beforeIndex = -1;
        var afterIndex = -1;

        for (let i = 0; i < oldTokens.length; i++) {
            if (beforeTarget != null && oldTokens[i].hasCharacter(beforeTarget)) {
                beforeIndex = i;
            }
            if (afterTarget != null && oldTokens[i].hasCharacter(afterTarget)) {
                afterIndex = i;
            }
        }

        // then, tokenize the new string

        var newTokens: RASTokenModel[] = []
        var currentChars: string = "";
        for (let i = 0; i < str.length; i++) {
            const char = str.charAt(i);
            if (WHITESPACE_CHARACTERS.indexOf(char) > -1) {
                var newToken = new RASTokenModel(currentChars);
                newTokens.push(newToken);
                newToken = new RASTokenModel(char);
                newTokens.push(newToken);
                currentChars = "";
            }
            else {
                currentChars += char;
            }
        }
        if (currentChars != "") {
            var newToken = new RASTokenModel(currentChars);
            newTokens.push(newToken);
        }

        // now add the old tokens up to (but not including) the
        // token containing the begin character

        for (let i = 0; i < beforeIndex; i++) {
            this.addChild(oldTokens[i]);
        }

        // now we're at the old token containing the begin character.  if this old token is
        // whitespace, just add it, we're not going to add anything to it because we
        // never add characters to whitespace.  if the new tokens are empty (it was an empty
        // string), also just add the old character.  if the first token of the new tokens is
        // whitespace, we also just add the old character.  otherwise,
        // we add the string from the first new token to the old token before adding the old
        // token, and remove the first new token from the list of new tokens.

        if (oldTokens[beforeIndex].isWhitespace() ||
            newTokens.length == 0 ||
            newTokens[0].isWhitespace()) {
            this.addChild(oldTokens[beforeIndex]);
        } else

        }

    } */
    /*
    public addTextAtEnd(str: string): void {
        if (str.length == 0) {
            return;
        }

        if (this.numChildren == 0) {
            this.addChild(new RASTokenModel(str));
        } else {
            const lastToken = this._children[this.numChildren-1] as RASTokenModel;
            lastToken.addTextAtEnd(str);
        }
    } */
    /**
     * Finds the character that occurs after the target character.  Useful for
     * cursor manipulation
     *
     * @param char The target character
     */
    getNextCharacter(char) {
        var found = false;
        for (let child of this._children) {
            for (let grandchild of child.children) {
                if (grandchild == char) {
                    found = true;
                }
                else if (found) {
                    return grandchild;
                }
            }
        }
        return null;
    }
    get tokens() {
        return this._children;
    }
}
exports.RASTextModel = RASTextModel;

},{"./objects":5}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class RASProperty {
    //protected _listeners : RASChangeListener[] = [];
    constructor(name, value) {
        this._name = "";
        this._value = 0;
        this._name = name;
        this._value = value;
    }
    get name() { return this._name; }
    get value() { return this._value; }
    set value(value) { this._value = value; }
}
exports.RASProperty = RASProperty;
class RASDelegatedProperty {
    constructor(name, delegate) {
        this._name = "";
        this._name = name;
        this._delegate = delegate;
    }
    get name() { return this._name; }
    get value() { return this._delegate.value; }
    set value(value) { this._delegate.value = value; }
}
exports.RASDelegatedProperty = RASDelegatedProperty;
class RASObject {
    constructor() {
        this._properties = [];
        this._children = [];
    }
    get children() { return this._children; }
    getProperty(name) {
        for (let property of this._properties) {
            if (property.name == name) {
                return property;
            }
        }
        throw RangeError("No property called " + name + " on current object");
    }
    addProperty(property) {
        for (let existingProperty of this._properties) {
            if (property.name == existingProperty.name) {
                throw Error("Object already has property with name " +
                    property.name);
            }
        }
        this._properties.push(property);
    }
    setPropertyValue(name, value) {
        for (let property of this._properties) {
            if (property.name == name) {
                property.value = value;
                return;
            }
        }
        throw RangeError("No property called " + name + " on current object");
    }
    delegateProperty(name, delegateObject, otherName = "") {
        if (otherName == "") {
            otherName = name;
        }
        const oldProperty = delegateObject.getProperty(otherName);
        const newProperty = new RASDelegatedProperty(name, oldProperty);
        this.addProperty(newProperty);
    }
    get numChildren() { return this._children.length; }
    addChild(child) {
        this._children.push(child);
    }
    getChildrenRecursive() {
        var results = [];
        for (let child of this._children) {
            results.push(child);
            results = results.concat(child.getChildrenRecursive());
        }
        return results;
    }
}
exports.RASObject = RASObject;
class RASComponent extends RASObject {
    constructor() {
        super(...arguments);
        this._name = "";
    }
    get name() { return this._name; }
    get canvas() {
        var canvas = document.getElementById('canvas');
        if (canvas == null) {
            throw Error("Cannot find canvas");
        }
        return canvas;
    }
    get context() {
        return this.canvas.getContext('2d');
    }
    render(ctx, aframe) { }
    renderAll(ctx, aframe) {
        this.render(ctx, aframe);
        for (let child of this._children) {
            child.renderAll(ctx, aframe);
        }
    }
}
exports.RASComponent = RASComponent;

},{}],6:[function(require,module,exports){
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

},{"./geometry":3,"./objects":5,"./views":7}],7:[function(require,module,exports){
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
        this._font = "64px Helvetica";
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
        var ctx = this.context;
        ctx.font = this._font;
        return ctx.measureText("M").actualBoundingBoxAscent;
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
        var ctx = this.context;
        ctx.font = this._font;
        var text_metrics = ctx.measureText(this._model.text);
        return text_metrics.width;
    }
    render(ctx, aframe) {
        ctx.font = this._font;
        const line_height = ctx.measureText("M").actualBoundingBoxAscent;
        ctx.fillStyle = "#333333";
        ctx.font = this._font;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        const propertyInterpolation = aframe.getPropertyInterpolation(this._name);
        const transparency = rgbToHex(255, 200, 0, propertyInterpolation * 255);
        ctx.shadowColor = transparency;
        ctx.shadowBlur = 10;
        ctx.fillText(this._model.text, this.x, this.y + line_height);
        ctx.shadowBlur = 0;
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
        ctx.beginPath();
        ctx.strokeStyle = TOKEN_BORDER_COLOR;
        ctx.lineWidth = 2;
        const paddedRect = new geometry_1.SimpleRectangle(this.x - exports.TOKEN_PADDING_LEFT, this.y - exports.TOKEN_PADDING_TOP, this.width + exports.TOKEN_PADDING_LEFT + exports.TOKEN_PADDING_RIGHT, this.height + exports.TOKEN_PADDING_TOP + exports.TOKEN_PADDING_BOTTOM);
        geometry_1.drawRoundRectangle(ctx, paddedRect, exports.TOKEN_ROUNDING_RADIUS, exports.TOKEN_ROUNDING_RADIUS);
        ctx.stroke();
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
        this._font = "64px Helvetica";
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
                !tokenModel.isWhitespace()) {
                // make a new line
                this.addChild(currentTextLine);
                currentY += (line_height * 1.25);
                currentTextLine = new RASLineView(x, currentY, this);
            }
            const newUnit = new RASTokenView(tokenModel, currentTextLine);
            currentTextLine.addChild(newUnit);
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
    get height() { return this._width; }
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
}
exports.RASSlideView = RASSlideView;

},{"./geometry":3,"./objects":5}]},{},[2]);
