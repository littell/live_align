"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const objects_1 = require("./objects");
const WHITESPACE_CHARACTERS = [" ", "\t", ",", ".", ";", ":", "(", ")", '"', "'"];
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
