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
    sendPNG() {
        var dataURL = this.canvas.toDataURL();
        var xmlHttpReq = false;
        var ajax = null;
        if (window.XMLHttpRequest) {
            ajax = new XMLHttpRequest();
        }
        else if (window.ActiveXObject) {
            ajax = new ActiveXObject("Microsoft.XMLHTTP");
        }
        dataURL = encodeURIComponent(dataURL);
        ajax.open("POST", "testSave", false);
        ajax.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        ajax.onreadystatechange = function () {
            console.log(ajax.responseText);
        };
        console.log("png size = " + dataURL.length);
        ajax.send("imgData=" + dataURL);
    }
    sendSVG() {
        const slide0 = this._children[0];
        const svg = slide0.asSVG();
        var ajax = null;
        if (window.XMLHttpRequest) {
            ajax = new XMLHttpRequest();
        }
        else if (window.ActiveXObject) {
            ajax = new ActiveXObject("Microsoft.XMLHTTP");
        }
        ajax.open("POST", "svgSave", false);
        ajax.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        ajax.onreadystatechange = function () {
            console.log(ajax.responseText);
        };
        console.log("svg size = " + svg.length);
        ajax.send("imgData=" + svg);
    }
    handleSpecialKey(char, ctx) {
        if (char == tools_1.SPECIAL_KEY_CTRL_B) {
            this.sendSVG();
            this.sendPNG();
            return true;
        }
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
    const attributes = { fill: 'red', stroke: 'black' };
    const options = { x: 0, y: 0, fontSize: 72, anchor: 'top', attributes: attributes };
    //const svg = textToSVG.getSVG('hello', options);
    //console.log(svg);
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
        else if (e.ctrlKey && char == "B") {
            app.handleSpecialKey(tools_1.SPECIAL_KEY_CTRL_B, context);
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
