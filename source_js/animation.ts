declare function require(path: string): any;
import { IRASProperty, RASProperty, RASDelegatedProperty} from "./objects";

const ANIMATION_FRAMES_PER_SECOND = 60;

export class RASAnimation {

    protected _startTime : DOMHighResTimeStamp = 0;
    protected _startPosition : number = 0;
    protected _frames : RASAnimationFrame[] = [];

    constructor() {
    }

    public get numFrames(): number { return this._frames.length; }

    public addFrame(frame: RASAnimationFrame): void {
        this._frames.push(frame);
    }

    public startAnimation(time: DOMHighResTimeStamp): void {
        this._startTime = time;
        this._startPosition = 0;
    }

    public getFrame(time: DOMHighResTimeStamp): RASAnimationFrame {
        const timeElapsed = time - this._startTime
        const frameOffset = timeElapsed / (1000 / ANIMATION_FRAMES_PER_SECOND);
        const currentPosition = Math.floor(this._startPosition + frameOffset);
        if (currentPosition >= this._frames.length) {
            throw RangeError("Animation finished");
        }
        return this._frames[currentPosition];
    }

}

export class RASAnimationFrame {

    protected _lookup : any = {};

    public addPropertyInterpolation(unitName: string, propertyValue: number) {
        this._lookup[unitName] = propertyValue;
    }

    public getPropertyInterpolation(unitName: string): number {
        if (unitName in this._lookup) {      
            return this._lookup[unitName];
        } 
        return 0;
    }
}