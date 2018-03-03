var keywords = ["break", "do", "instanceof", "typeof", "case", "else", "new", "var", "catch", "finally", "return", "void", "continue", "for", "switch", "while", "debugger", "function", "this", "with", "default", "if", "throw", "delete", "in", "try", "abstract", "export", "interface", "static", "boolean", "extends", "long", "super", "byte", "final", "native", "synchronized", "char", "float", "package", "throws", "class", "goto", "private", "transient", "const", "implements", "protected", "volatile", "double", "import", "public", "enum", "int", "short"];
var reserved = ["console", "null", "true", "false", "this"];
var declarations = ["var", "const", "class", "enum", "type", "interface", "function", "let"];

import * as EventEmitter from 'events';

export interface Token {
    type: string;
    text: string;
    startLine: number;
}

class Stream {
    private _iterator = 0;
    constructor(private _stream) { }
    eat() {
        return this._stream.charAt(++this._iterator);
    }
    peek() {
        return this._stream.charAt(this._iterator + 1);
    }
    last() {
        return this._stream.charAt(this._iterator - 1);
    }
    get(index?: number) {
        if (index) {
            return this._stream.charAt(index);
        } else {
            return this._stream.charAt(this._iterator);
        }
    }
    get iterator() {
        return this._iterator;
    }
    set iterator(number) {
        this._iterator = number;
    }
    eatWhile(parameter: RegExp | ((character: string) => boolean)): string {
        var ret = this.get();
        if (parameter instanceof RegExp) {
            while (parameter.test(this.peek()) && this.notEnd()) {
                ret += this.eat();
            }
            return ret;
        } else {
            while (parameter(this.peek()) && this.notEnd()) {
                ret += this.eat();
            }
            return ret;
        }
    }
    notEnd() {
        return this._iterator < this._stream.length;
    }
}

export class Tokenizer extends EventEmitter {
    private _lines: string[];
    // private _blocks;
    private _commentStart: number = -1;
    private _stringStart: number = -1;

    constructor(src: string) {
        super();
        this._lines = src.split('\n').map((line) => {
            return line.replace('\n', '');
        });
    }

    get lines() {
        return this._lines;
    }

    parseLine(line: number) {
        return this.tokenize(this._lines[line], line);
    }

    getLineCount() {
        return this._lines.length;
    }

    static getLastRealToken(tokens: Token[]): number {
        for (var i = tokens.length - 1; i > -1; i--) {
            if (tokens[i].type !== 'whitespace') {
                return i;
            }
        }
        return -1;
    }

    getLine(lineNumber: number) {
        return this._lines[lineNumber];
    }

    setLine(lineNumber: number, contents: string) {
        this._lines[lineNumber] = contents;
        this.emit('updateLine', lineNumber, contents);
    }

    insertLine(lineNumber: number, text: string = "") {
        this._lines.splice(lineNumber, 0, text);
        this.emit('insertLine', lineNumber, text);
    }

    deleteLine(lineNumber: number) {
        this._lines.splice(lineNumber, 1);
        this.emit('deleteLine', lineNumber);
    }
    tokenize(line: string, lineNumber: number): Token[] {
        var s = new Stream(line);
        var tokens = [];
        if(this._commentStart > -1) {
            var finished = false;
            var commentLine = s.eatWhile((char) => {
                if(s.get() == '*' && s.peek() == '/') {
                    finished = true;
                    return false;
                } else {
                    return true;
                }
            });
            if(finished) {
                tokens.push({
                    text: commentLine + s.eat(),
                    type: 'multiline-comment',
                    startLine: this._commentStart
                });
                s.iterator+=1;
                this._commentStart = -1;
            } else {
                tokens.push({
                    text: line,
                    type: 'multiline-comment',
                    startLine: this._commentStart
                });
                s.iterator = line.length;
            }
        }
        if(this._stringStart > -1) {
            var finished = false;
            var stringLine = s.eatWhile((char) => {
                if(s.get() == '`' && s.last() !== '\\') {
                    finished = true;
                    this._stringStart = -1;
                    return false;
                } else {
                    return true;
                }
            });
            if(finished) {
                tokens.push({
                    text: stringLine + s.eat(),
                    type: 'string'
                });
                s.iterator+=1;
            } else {
                tokens.push({
                    text: line,
                    type: 'string'
                });
                s.iterator = line.length;
            }
        }
        while (s.notEnd()) {
            if (s.get() == '/') {
                if (s.peek() == '/') {
                    var comment = line.slice(s.iterator, line.length);
                    s.iterator = line.length;
                    tokens.push({
                        text: comment,
                        type: 'comment'
                    });
                } else if(s.peek() == '*') {
                    this._commentStart = lineNumber;
                    var iterator = s.iterator;
                    var checkForInline = s.eatWhile(() => {
                        return !(s.get() == "*" && s.peek() == "/");
                    }) + s.peek();
                    if(checkForInline.slice(checkForInline.length - 2, checkForInline.length) == '*/') {
                        tokens.push({
                            text: line.slice(iterator, s.iterator + 1),
                            type: 'comment'
                        });
                    } else {
                        tokens.push({
                            text: line.slice(iterator, line.length),
                            type: 'multiline-comment',
                            startLine: this._commentStart
                        });
                        s.iterator = line.length;
                    }
                } else if (/[\s\[\]\(\)\{\}a-zA-Z0-9+\\\-*&%=<>!?|~^@$]/.test(s.peek())) {
                    var old = s.iterator;
                    var regex = "";
                    regex += s.eatWhile((char) => {
                        if (char == '/' && s.get() != '\\') {
                            return false;
                        } else {
                            return true;
                        }
                    }) + s.eat();
                    if (s.get() == '/') {
                        while (s.notEnd() && /[gimuy]/.test(s.peek())) {
                            regex += s.eat();
                        }
                        tokens.push({
                            text: regex,
                            type: 'regex'
                        })
                    } else {
                        s.iterator = old;
                        tokens.push({
                            text: s.get(),
                            type: 'operator'
                        });
                    }
                    s.eat();
                } else {
                    tokens.push({
                        text: s.get(),
                        type: 'operator'
                    })
                }
            } else if(s.get() == '`') {
                this._stringStart = lineNumber;
                var iterator = s.iterator;
                var checkForInline = s.eatWhile(() => {
                    return !(s.get() == "`" && s.last() != "\\");
                }) + s.peek();
                if(checkForInline.slice(-1) == '`' && checkForInline.slice(-2) != '\\') {
                    tokens.push({
                        text: line.slice(iterator, s.iterator + 1),
                        type: 'string'
                    });
                } else {
                    tokens.push({
                        text: line.slice(iterator, line.length),
                        type: 'string'
                    });
                    s.iterator = line.length;
                }
            }
            else if (/[+\-*&%=<>!?|~^@]/.test(s.get())) {
                tokens.push({
                    text: s.get(),
                    type: 'operator'
                });
            } else if (/[a-zA-Z_$]/.test(s.get())) {
                var str = s.get();
                while (/[a-zA-Z0-9_$]/.test(s.peek())) {
                    str += s.eat();
                }
                var isKeyword = ~keywords.indexOf(str);
                var isReserved = ~reserved.indexOf(str);
                var token = Tokenizer.getLastRealToken(tokens);
                if (!isKeyword && !isReserved && ~token) {
                    if (tokens[token].type == 'keyword' && ~declarations.indexOf(tokens[token].text)) {
                        tokens.push({
                            text: str,
                            type: 'definition'
                        });
                    } else {
                        if (s.peek() == ':') {
                            tokens.push({
                                text: str,
                                type: 'definition'
                            });
                        } else {
                            tokens.push({
                                text: str,
                                type: 'word'
                            });
                        }
                    }
                } else {
                    if (s.peek() == ':') {
                        tokens.push({
                            text: str,
                            type: 'definition'
                        });
                    } else {
                        tokens.push({
                            text: str,
                            type: isKeyword ? 'keyword' : (isReserved ? 'reserved' : 'word')
                        });
                    }
                }
            }
            else if (/[0-9]/.test(s.get())) {
                var number = s.get();
                while (/[0-9xa-fA-F]/.test(s.peek())) {
                    number += s.eat();
                }
                tokens.push({
                    text: number,
                    type: 'number'
                })
            }
            else if (/\s/.test(s.get())) {
                tokens.push({
                    text: s.get(),
                    type: 'whitespace'
                })
            } else if (/["']/.test(s.get())) {
                var open: string;
                var str: any;
                str = open = s.get();

                while (s.peek() !== open && s.notEnd()) {
                    str += s.eat();
                }
                if (s.peek() == open) {
                    str += open;
                    s.eat();
                }
                tokens.push({
                    text: str,
                    type: 'string'
                })
            } else if (s.get() == '(') {
                var token = Tokenizer.getLastRealToken(tokens);
                if (~token && (tokens[token].type == 'word' || tokens[token].type == 'definition')) {
                    tokens[token].type = "function";
                }
                tokens.push({
                    text: '(',
                    type: 'bracket'
                })
            } else if (/[\(\)\[\]\{\}]/.test(s.get())) {
                tokens.push({
                    text: s.get(),
                    type: 'bracket'
                })
            } else {
                tokens.push({
                    text: s.get(),
                    type: 'other'
                })
            }
            s.eat();
        }
        return tokens;
    }
}