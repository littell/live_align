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
