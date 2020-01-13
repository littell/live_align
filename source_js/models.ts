import { RASObject, RASProperty } from "./objects";

const WHITESPACE_CHARACTERS: string[] = [" ", "\t", ",", ".", ";", ":", "(", ")", '"', "'" ];

export class RASModel extends RASObject {

}

export class RASCharacterModel extends RASModel {

    protected _text: string;

    protected _previousCharacter: RASCharacterModel | null = null;
    protected _nextCharacter: RASCharacterModel | null = null;

    public get previousCharacter(): RASCharacterModel | null { return this._previousCharacter; }
    public get nextCharacter(): RASCharacterModel | null { return this._nextCharacter; }
    public set previousCharacter(other: RASCharacterModel | null) { this._previousCharacter = other; }
    public set nextCharacter(other: RASCharacterModel | null) { this._nextCharacter = other; }


    constructor(text: string) {
        super();
        this._text = text;
    }

    public get text(): string { return this._text; }

    public isWhitespace(): boolean {
        for (let char of this._text) {  // usually RASCharacterModel should represent a single character
                                        // but just in case
            if (WHITESPACE_CHARACTERS.indexOf(this._text) == -1) {
                return false;
            }
        }
        return true;
    }
}

export class RASTokenModel extends RASModel {

    protected _previousToken: RASTokenModel | null = null;
    protected _nextToken: RASTokenModel | null = null;

    public get previousToken(): RASTokenModel | null { return this._previousToken; }
    public get nextToken(): RASTokenModel | null { return this._nextToken; }
    public set previousToken(other: RASTokenModel | null) { this._previousToken = other; }
    public set nextToken(other: RASTokenModel | null) { this._nextToken = other; }
    
    constructor(text: string) {
        super()
        for (let i = 0; i < text.length; i++) {
            const newChar = new RASCharacterModel(text.charAt(i));
            this.addCharacter(newChar);
        }
    }

    public get text(): string { 
        var results = "";
        for (let char of this._children as RASCharacterModel[]) {
            results += char.text;
        }
        return results;
    }

    public addCharacter(char: RASCharacterModel) {
        char.nextCharacter = null;
        char.previousCharacter = null;
        if (this.numChildren > 0) {
            const lastChar = this._children[this.numChildren-1] as RASCharacterModel;
            lastChar.nextCharacter = char;
            char.previousCharacter = lastChar;
        }
        this.addChild(char);

    }

    public hasCharacter(target: RASCharacterModel) {
        for (let char of this.characters) {
            if (char == target) {
                return true;
            }
        }
        return false;
    }

    public splitBefore(target: RASCharacterModel): RASTokenModel[] {

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
            } else {
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
    
    public get characters(): RASCharacterModel[] {
        return this._children as RASCharacterModel[];
    }
    
    public isWhitespace(): boolean {
        for (let child of this._children as RASCharacterModel[]) {
            if (!(child.isWhitespace())) {
                return false;
            }
        }
        return true;
    }
}

export class RASTextModel extends RASModel {

    constructor(text: string) {
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

    public splitAtCharacter(target: RASCharacterModel | null): void {

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

    public static mergeTokens(tokens: RASTokenModel[]): RASTokenModel {
        if (tokens.length == 0) {
            throw Error("Trying to merge zero tokens into one")
        }

        for (let token of tokens.slice(1)) {
            for (let char of token.characters) {
                tokens[0].addCharacter(char);
            }
        }

        return tokens[0];
    }
    
    public mergeCharacters(target1: RASCharacterModel | null, 
                            target2: RASCharacterModel | null): void {

        var target1pos = 1000000000000;
        var target2pos = 1000000000000;                        
        var tokensBefore : RASTokenModel[] = [];
        var tokensBetween : RASTokenModel[] = [];
        var tokensAfter : RASTokenModel[] = [];

        this.splitAtCharacter(target1);
        this.splitAtCharacter(target2);

        if (target1 != null) {
            target1pos = this.tokens.findIndex((token) => 
                    token.hasCharacter(target1));
        }
        if (target2 != null) {
            target2pos = this.tokens.findIndex((token) =>
                    token.hasCharacter(target2));
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

    protected static _tokenize(str: string): RASTokenModel[] {

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

    public replaceCharacters(text: string, target1: RASCharacterModel | null, 
                             target2: RASCharacterModel | null): RASCharacterModel | null {

                                
        var target1pos = 1000000000000;
        var target2pos = 1000000000000;                        
        var tokensBefore : RASTokenModel[] = [];
        var tokensAfter : RASTokenModel[] = [];

        // split first, because the characters we'll be removing
        // need to be split off from the tokens they may be a part of

        this.splitAtCharacter(target1);
        this.splitAtCharacter(target2);

        if (target1 != null) {
            target1pos = this.tokens.findIndex((token) => 
                    token.hasCharacter(target1));
        }
        if (target2 != null) {
            target2pos = this.tokens.findIndex((token) =>
                    token.hasCharacter(target2));
        }
        
        const firstTargetPos = Math.min(target1pos, target2pos);
        const secondTargetPos = Math.max(target1pos, target2pos);
        tokensBefore = this.tokens.slice(0, firstTargetPos);
        tokensAfter = this.tokens.slice(secondTargetPos);

        console.log(firstTargetPos, secondTargetPos);
        
        var result : RASCharacterModel | null = null;  // the charcter model to put the cursor at after this
        if (tokensAfter.length > 0 && tokensAfter[0].numChildren > 0) {
            result = tokensAfter[0].characters[0];
        } 

        var newChildren = RASTextModel._tokenize(text);

        // now merge on both sides of the new content.
        if (newChildren.length > 0 && tokensAfter.length > 0 &&
            !newChildren[newChildren.length-1].isWhitespace() &&
            !tokensAfter[0].isWhitespace()) {
            var prevToken = newChildren[newChildren.length-1];
            var nextToken = tokensAfter[0];
            tokensAfter = tokensAfter.slice(1);
            newChildren[newChildren.length-1] = 
                    RASTextModel.mergeTokens([prevToken, nextToken]);
        }

        if (tokensBefore.length > 0 && 
                newChildren.length > 0 &&
                !tokensBefore[tokensBefore.length-1].isWhitespace() &&
                !newChildren[0].isWhitespace()) {
            var prevToken = tokensBefore[tokensBefore.length-1];
            var nextToken = newChildren[0];
            newChildren = newChildren.slice(1);
            tokensBefore[tokensBefore.length-1] = 
                    RASTextModel.mergeTokens([prevToken, nextToken]);
        }
        
        this._children = [];
        for (let token of [...tokensBefore, ...newChildren, ...tokensAfter]) {
            this.addChild(token);
        }

        return result;

    }

    public addToken(token: RASTokenModel) {
        token.nextToken = null;  // in case it's an old token with existing links
        token.previousToken = null;
        if (this.numChildren > 0) {
            const lastToken = this._children[this.numChildren-1] as RASTokenModel;
            lastToken.nextToken = token;
            token.previousToken = lastToken
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

    public addTokenAtBeginning(token: RASTokenModel): void {
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

    public getNextCharacter(char: RASCharacterModel): RASCharacterModel | null {
        var found = false;
        for (let child of this._children as RASTokenModel[]) {
            for (let grandchild of child.children as RASCharacterModel[]) {
                if (grandchild == char) {
                    found = true;
                } else if (found) {
                    return grandchild;
                }
            }
        }
        return null;
    }


    public get tokens(): RASTokenModel[] {
        return this._children as RASTokenModel[];
    }

}
