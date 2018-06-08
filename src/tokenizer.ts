import { GrammarRule, GrammarRegistry } from "first-mate";
import { readFileSync } from "fs";

let registry = new GrammarRegistry();
let grammar = registry.loadGrammarSync('../syntaxes/TypeScriptReact.json');

interface Token {
    value: string;
    className: string;
}

export class Tokenizer {
    checkStack(a: GrammarRule[] = [], b: GrammarRule[] = []): boolean {
        if (a.length == b.length) {
            for (var i = 0; i < a.length; i++) {
                if (a[i].scopeName != b[i].scopeName) {
                    return false;
                }
            }
            return true;
        }
        return false;
    }
    lines: string[];
    tokenizedLines: Token[][] = [];
    invalidatedLines: number[] = [];
    ruleStack: GrammarRule[][] = [];
    constructor(file) {
        this.lines = readFileSync(file, 'utf8').split('\n');
        this.invalidatedLines.push(0);
        this.render();
    }

    getScopesAsClassName(scopes) {
        var classes = [];
        scopes.forEach((scope) => {
            for (var className of scope.split(".")) {
                if (!~classes.indexOf(className)) classes.push(className)
            }
        });
        return classes.join(' ');
    }
    render() {
        while (this.invalidatedLines.length != 0) {
            var index = this.invalidatedLines[0];
            var { ruleStack, tokens } = grammar.tokenizeLine(this.lines[index], this.ruleStack[index - 1]);

            if (!this.checkStack(ruleStack, this.ruleStack[index]) && this.lines.length > index + 1) {
                if (!~this.invalidatedLines.indexOf(index + 1)) {
                    this.invalidatedLines.push(index + 1);
                }
            }
            this.ruleStack[index] = ruleStack;
            this.tokenizedLines[index] = tokens.map((token) => {
                return {
                    value: token.value,
                    className: this.getScopesAsClassName(token.scopes)
                };
            });
            this.invalidatedLines.splice(0, 1);
        }
    }

    setLine(i, str) {
        this.lines[i] = str;
        this.invalidatedLines.push(i);
        this.render();
    }
    insertLine(i, str) {
        this.lines.splice(i, 0, str);
        this.tokenizedLines.splice(i, 0, []);
        this.ruleStack.splice(i, 0, []);
        this.invalidatedLines.push(i);
        this.render();
    }
    deleteLine(i) {
        //TODO: Can this be more efficient?
        this.lines.splice(i, 1);
        for (var index = i; index < this.lines.length; index++) {
            this.invalidatedLines.push(index);
        }
        this.render();
    }
    getTokens(line) {
        return this.tokenizedLines[line];
    }
    getLines() {
        return this.lines.length;
    }
}