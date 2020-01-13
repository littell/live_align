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
        this._type = "generic";
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
    toXML(indent = 0) {
        var result = " ".repeat(indent) + `<${this._type}`;
        for (let property of this._properties) {
            result += ` ${property.name}="${property.value}"`;
        }
        result += ">\n";
        result += " ".repeat(indent) + "<svg>\n";
        result += this.toSVG(indent + 2);
        result += " ".repeat(indent) + "</svg>\n";
        for (let child of this._children) {
            result += child.toXML(indent + 2);
        }
        result += " ".repeat(indent) + `</${this._type}>`;
        return result;
    }
    toSVG(indent = 0) {
        return "";
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
