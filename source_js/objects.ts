declare function require(path: string): any;
import { RASAnimation, RASAnimationFrame} from "./animation";


export interface IRASProperty {

    name: string;
    value: number;
}

export class RASProperty implements IRASProperty {

    protected _name : string = "";
    protected _value : number = 0;
    //protected _listeners : RASChangeListener[] = [];

    constructor(name: string, value: number) {
        this._name = name;
        this._value = value;
    }

    public get name(): string { return this._name; }
    public get value(): number { return this._value; }
    public set value(value: number) { this._value = value; }
}


export class RASDelegatedProperty implements IRASProperty {

    protected _name : string = "";
    protected _delegate : IRASProperty;

    constructor(name: string, delegate: IRASProperty) {
        this._name = name;
        this._delegate = delegate;
    }

    public get name(): string { return this._name; }
    public get value(): number { return this._delegate.value; }
    public set value(value: number) { this._delegate.value = value; }

}


export class RASObject {

    protected _properties : IRASProperty[] = [];
    protected _children : RASObject[] = [];

    public get children(): RASObject[] { return this._children; }
    
    public getProperty(name: string): IRASProperty {
        
        for (let property of this._properties) {
            if (property.name == name) {
                return property
            }
        }

        throw RangeError("No property called " + name + " on current object");
    }

    public addProperty(property: IRASProperty): void {
        
        for (let existingProperty of this._properties) {
            if (property.name == existingProperty.name) {
                throw Error("Object already has property with name " +
                    property.name);
            }
        }

        this._properties.push(property);
    }

    
    public setPropertyValue(name: string, value: number): void {
        
        for (let property of this._properties) {
            if (property.name == name) {
                property.value = value;
                return;
            }
        }

        throw RangeError("No property called " + name +  " on current object");
    }

    public delegateProperty(name: string, delegateObject: RASObject, otherName: string = ""): void {
        if (otherName == "") {
            otherName = name;
        }
        const oldProperty = delegateObject.getProperty(otherName);
        const newProperty = new RASDelegatedProperty(name, oldProperty);
        this.addProperty(newProperty);
    }

    public get numChildren(): number { return this._children.length; }
    
    public addChild(child : RASObject): void {
        this._children.push(child);
    }

    
    
    public getChildrenRecursive(): RASObject[] {
        var results : RASObject[] = [];
        for (let child of this._children as RASObject[]) {
            results.push(child);
            results = results.concat(child.getChildrenRecursive());
        }
        return results;
    }

}

export class RASComponent extends RASObject {

    protected _type : string = "generic";
    protected _name : string = "";

    public get name(): string       { return this._name; }


    
    public get canvas(): HTMLCanvasElement {
        var canvas = document.getElementById('canvas') as HTMLCanvasElement;
        if (canvas == null) {
            throw Error("Cannot find canvas");
        }
        return canvas;
    }

    public get context(): CanvasRenderingContext2D {
        return this.canvas.getContext('2d') as CanvasRenderingContext2D;
    }

    public toXML(indent: number = 0): string {
        var result = " ".repeat(indent) + `<${this._type}`;
        for (let property of this._properties) {
            result += ` ${property.name}="${property.value}"`
        }
        result += ">\n";
        result += " ".repeat(indent) + "<svg>\n";
        result += this.toSVG(indent + 2);
        result += " ".repeat(indent) + "</svg>\n";
        for (let child of this._children as RASComponent[]) {
            result += child.toXML(indent + 2);
        }
        result += " ".repeat(indent) + `</${this._type}>`
        return result;
    }

    public toSVG(indent: number = 0): string {
        return "";
    }

    public render(ctx: CanvasRenderingContext2D, aframe: RASAnimationFrame): void { }

    public renderAll(ctx: CanvasRenderingContext2D, aframe: RASAnimationFrame): void {

        this.render(ctx, aframe);

        for (let child of this._children as RASComponent[]) {
            child.renderAll(ctx, aframe);
        }
        

    }

}

