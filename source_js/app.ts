
declare function require(path: string): any;

import { RASAnimation, RASAnimationFrame} from "./animation";
import { RASTextModel } from "./models";
import { RASView, RASSlideView, RASTextView } from "./views";
import { RASTool, RASDefaultTool, SPECIAL_KEY_BACKSPACE, SPECIAL_KEY_CTRL_M, SPECIAL_KEY_CTRL_B } from "./tools";


const VIRTUAL_CANVAS_WIDTH = 1920;
const VIRTUAL_CANVAS_HEIGHT = 1080;

const BACKSPACE_KEY = 8;


export class App extends RASView {
    
    private _selections : RASView[] = [];
    protected _currentTool : RASTool = new RASTool(null);
    protected _animation : RASAnimation = new RASAnimation();

	constructor() {
        super(null);

    }
    
    public set selections(ss : RASView[]) {
        this._selections = ss;
    }

    public handleClick(x : number, y : number, ctx: CanvasRenderingContext2D) {
        var handled = this._currentTool.handleClickAll(x, y, ctx);
        return handled;
    }

    public handleMouseDown(x : number, y : number, ctx: CanvasRenderingContext2D): boolean {
        var handled = this._currentTool.handleMouseDownAll(x, y, ctx);
        return handled;
    }

    public handleMouseMove(x : number, y : number, ctx: CanvasRenderingContext2D): boolean {
        var handled = this._currentTool.handleMouseMoveAll(x, y, ctx);
        return handled;
    }

    public handleMouseUp(x : number, y : number, ctx: CanvasRenderingContext2D): boolean {
        var handled = this._currentTool.handleMouseUpAll(x, y, ctx);
        return handled;
    }

    public handleKeyPress(char: string, ctx: CanvasRenderingContext2D): boolean {
        var handled = this._currentTool.handleKeyPressAll(char, ctx);
        return handled;
    }

    
    protected sendPNG(): void {
        var dataURL = this.canvas.toDataURL();
        var xmlHttpReq = false;
        var ajax : any = null;

        if (window.XMLHttpRequest) {
            ajax = new XMLHttpRequest();
        }
        else if (window.ActiveXObject) {
            ajax = new ActiveXObject("Microsoft.XMLHTTP");
        }

        dataURL = encodeURIComponent(dataURL);

        ajax.open("POST", "testSave", false);
        ajax.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        ajax.onreadystatechange = function() {
            console.log(ajax.responseText);
        }

        
        console.log("png size = " + dataURL.length)
        ajax.send("imgData=" + dataURL); 
          
    }

    protected sendSVG(): void {
        const slide0 = this._children[0] as RASView;
        const svg = slide0.asSVG();
        var ajax : any = null;

        if (window.XMLHttpRequest) {
            ajax = new XMLHttpRequest();
        }
        else if (window.ActiveXObject) {
            ajax = new ActiveXObject("Microsoft.XMLHTTP");
        }

        ajax.open("POST", "svgSave", false);
        ajax.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        ajax.onreadystatechange = function() {
            console.log(ajax.responseText);
        }
        
        console.log("svg size = " + svg.length)
        ajax.send("imgData=" + svg); 
    }

    public handleSpecialKey(char: string, ctx: CanvasRenderingContext2D): boolean {

        if (char == SPECIAL_KEY_CTRL_B) {
            this.sendSVG();
            this.sendPNG();
            return true;
        }

        var handled = this._currentTool.handleSpecialKeyAll(char, ctx);
        return handled;
    }

	public setup(): void {

        const ctx = this.context;

        var slide = new RASSlideView(VIRTUAL_CANVAS_WIDTH, VIRTUAL_CANVAS_HEIGHT, this);
        this.addChild(slide);

        this._currentTool = new RASDefaultTool(this);
        
        var text = new RASTextModel("this is a long string with asjasdlkjfaklsjfalhalhg words");
        var textField = new RASTextView(text, 400, 400, 600, 600, slide);
        slide.addChild(textField);
        
        textField.layoutAll(ctx);

        this._animation = makeDummyAnimation(textField);
        this.animationLoop(0);

	}

	private animationLoop(step: DOMHighResTimeStamp): void {
        // need to bind the current this reference to the callback
		requestAnimationFrame(this.animationLoop.bind(this)); 

        var ctx = this.context;

        if (ctx===null) {
            return;
        }
        

        ctx.fillStyle = "#CCCCCC";
        ctx.fillRect(0, 0, VIRTUAL_CANVAS_WIDTH * 2, VIRTUAL_CANVAS_HEIGHT * 2);
        
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, VIRTUAL_CANVAS_WIDTH, VIRTUAL_CANVAS_HEIGHT);

        var currentAnimationFrame = new RASAnimationFrame(); // dummy frame in case there's no animation

        if (this._animation.numFrames > 0) {
            try {
                var currentAnimationFrame = this._animation.getFrame(step);
            } catch(e) {
                if(e instanceof RangeError) {
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

function makeDummyAnimation(textField: RASTextView): RASAnimation {

    var results = new RASAnimation();

    for (let unit of textField.getTextUnits()) {
        var frame = new RASAnimationFrame();
        frame.addPropertyInterpolation(unit.name, 0.1);
        results.addFrame(frame);
        frame = new RASAnimationFrame();
        frame.addPropertyInterpolation(unit.name, 0.3);
        results.addFrame(frame);
        frame = new RASAnimationFrame();
        frame.addPropertyInterpolation(unit.name, 0.5);
        results.addFrame(frame);
        frame = new RASAnimationFrame();
        frame.addPropertyInterpolation(unit.name, 0.7);
        results.addFrame(frame);
        frame = new RASAnimationFrame();
        frame.addPropertyInterpolation(unit.name, 0.9);
        results.addFrame(frame);
        frame = new RASAnimationFrame();
        frame.addPropertyInterpolation(unit.name, 0.7);
        results.addFrame(frame);
        frame = new RASAnimationFrame();
        frame.addPropertyInterpolation(unit.name, 0.5);
        results.addFrame(frame);
        frame = new RASAnimationFrame();
        frame.addPropertyInterpolation(unit.name, 0.3);
        results.addFrame(frame);
        frame = new RASAnimationFrame();
        frame.addPropertyInterpolation(unit.name, 0.1);
        results.addFrame(frame);
    }

    return results;
}

function rescaleCanvas() {

    var canvas = document.getElementById('canvas') as HTMLCanvasElement;
    if (canvas===null) {
        return 1.0;
    }        
    
    var ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    if (ctx===null) {
        return 1.0;
    }

    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    ctx.restore();
    var canvas_scale_ratio = Math.min(canvas.width / VIRTUAL_CANVAS_WIDTH, 
                            canvas.height / VIRTUAL_CANVAS_HEIGHT);
    ctx.scale(canvas_scale_ratio, canvas_scale_ratio);
    return canvas_scale_ratio;

}


window.onload = () => {
	let app = new App();

    var canvas = document.getElementById('canvas') as HTMLCanvasElement;
    if (canvas===null) {
        return;
    }        
    
    var context = canvas.getContext('2d') as CanvasRenderingContext2D;
    if (context===null) {
        return;
    }
    context.save();

    var canvas_scale_ratio = rescaleCanvas();
    app.setup();
    
    const attributes = {fill: 'red', stroke: 'black'};
    const options = {x: 0, y: 0, fontSize: 72, anchor: 'top', attributes: attributes};
    
    
    //const svg = textToSVG.getSVG('hello', options);
    //console.log(svg);


    canvas.addEventListener('click', function(event: MouseEvent) {

        var x : number = event.pageX - canvas.offsetLeft;
        var y : number = event.pageY - canvas.offsetTop;
        
        x /= canvas_scale_ratio;
        y /= canvas_scale_ratio;
        x = Math.min(x, VIRTUAL_CANVAS_WIDTH);
        y = Math.min(y, VIRTUAL_CANVAS_HEIGHT);
        app.handleClick(x, y, context);

    }, false);

    canvas.addEventListener('mousedown', (event: MouseEvent) => {
        var x : number = event.pageX - canvas.offsetLeft;
        var y : number = event.pageY - canvas.offsetTop;
        x /= canvas_scale_ratio;
        y /= canvas_scale_ratio;
        x = Math.min(x, VIRTUAL_CANVAS_WIDTH);
        y = Math.min(y, VIRTUAL_CANVAS_HEIGHT);
        app.handleMouseDown(x, y, context);
    });

    canvas.addEventListener('mousemove', (event: MouseEvent) => {
        var x : number = event.pageX - canvas.offsetLeft;
        var y : number = event.pageY - canvas.offsetTop;
        x /= canvas_scale_ratio;
        y /= canvas_scale_ratio;
        x = Math.min(x, VIRTUAL_CANVAS_WIDTH);
        y = Math.min(y, VIRTUAL_CANVAS_HEIGHT);
        app.handleMouseMove(x, y, context);
    });

    
    canvas.addEventListener('mouseup', (event: MouseEvent) => {
        var x : number = event.pageX - canvas.offsetLeft;
        var y : number = event.pageY - canvas.offsetTop;
        x /= canvas_scale_ratio;
        y /= canvas_scale_ratio;
        x = Math.min(x, VIRTUAL_CANVAS_WIDTH);
        y = Math.min(y, VIRTUAL_CANVAS_HEIGHT);
        app.handleMouseUp(x, y, context);
    });

    
    window.addEventListener('resize', (event: Event) => {
        canvas_scale_ratio = rescaleCanvas();
    });


    window.addEventListener("keydown", (e: KeyboardEvent) => {
        const charCode = (typeof e.which == "number") ? e.which : e.keyCode;
        const char = String.fromCharCode(charCode);
        if (charCode == BACKSPACE_KEY) {
            app.handleSpecialKey(SPECIAL_KEY_BACKSPACE, context);
        } else if (e.ctrlKey && char == "M") {
            app.handleSpecialKey(SPECIAL_KEY_CTRL_M, context);
        } else if (e.ctrlKey && char == "B") {
            app.handleSpecialKey(SPECIAL_KEY_CTRL_B, context);
        }
    });

    window.addEventListener("keypress", (e: KeyboardEvent) => {
        if (e.ctrlKey) {
            return;
        }
        const charCode = (typeof e.which == "number") ? e.which : e.keyCode;
        const char = String.fromCharCode(charCode);
        app.handleKeyPress(char, context);
    });


}