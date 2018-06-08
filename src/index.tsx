import * as React from "react";
import { ScopeSelector, Grammar, GrammarRegistry, GrammarRule } from 'first-mate';
import { readFileSync } from "fs";
import { Tokenizer } from "./Tokenizer";
import { Cursor } from './Cursor';
import { Selection } from './Selection';
import { Position, Measure } from './Measure';
import TextBuffer from 'text-buffer';


var tokenizer: Tokenizer;

var toggled = true;

enum IEditorMouseType {
    None = 0,
    Left,
    Middle,
    Right
}

enum ISelectionType {
    None,
    Up,
    Down
}

interface EditorRange {
    from: Position;
    to: Position;
}
interface EditorState {
    cursor: Position;
    lines: any[];
    mouseState: IEditorMouseType;
    selection?: EditorRange;
    selectionAnchor?: Position;
}
let tb = TextBuffer.loadSync("./index.tsx");
let myCursor: TextBuffer.Marker;
export default class Editor extends React.Component<{}, EditorState> {
    textWidth = 0;
    container: HTMLDivElement;
    input = React.createRef<HTMLInputElement>();
    widthChar = React.createRef<HTMLSpanElement>();
    preferredChar = 0;
    constructor(props) {
        super(props);
        tokenizer = new Tokenizer("./index.tsx")
        this.state = {
            cursor: {
                line: 0,
                ch: 0
            },
            lines: [],
            mouseState: 0,
            selection: null,
            selectionAnchor: null
        }
    }
    componentDidMount() {
        this.textWidth = this.widthChar.current.getBoundingClientRect().width;
        this.renderLines();
        this.input.current.focus();
        this.moveCursor(0, 0);
    }
    inSelection(line) {
        if (this.state.selection) {
            let { from, to } = this.state.selection;
            return Selection.in(line, from, to);
        }
        return false;
    }
    getSelection(line): EditorRange | null {
        if (this.state.selection) {
            let { from, to } = this.state.selection;
            if (Selection.in(line, from, to)) {
                if (Selection.between(line, from, to)) {
                    return {
                        from: {
                            line,
                            ch: 0
                        },
                        to: {
                            line,
                            ch: tokenizer.lines[line].length
                        }
                    }
                } else {
                    if (from.line == to.line) {
                        return { from, to };
                    } else {
                        if (line == from.line) {
                            return {
                                from: {
                                    line,
                                    ch: from.ch
                                },
                                to: {
                                    line,
                                    ch: tokenizer.lines[from.line].length
                                }
                            }
                        } else {
                            return {
                                from: {
                                    line,
                                    ch: 0
                                },
                                to: {
                                    line,
                                    ch: to.ch
                                }
                            }
                        }
                    }
                }
            }
        }
        return;
    }
    render() {
        console.log(tb.getMarkers()[0] && tb.getMarkers()[0].getStartPosition());
        let cur = tb.getMarkers()[0] && tb.getMarkers()[0].getStartPosition();
        return (
            <div ref={div => this.container = div} className="editor" onMouseDown={this.onMouseDown} onMouseMove={this.onMouseMove} onMouseUp={this.onMouseUp}>
                <span style={{ position: 'absolute', visibility: 'hidden' }} ref={this.widthChar}>t</span>
                <input type="text" onKeyDown={this.keyDown} ref={this.input} value={""} />
                <Cursor position={cur} textWidth={this.textWidth} />
                {JSON.stringify(this.state.selection)}
                {tb.getLines().map((lineTokens, key) => {
                    let selection = this.getSelection(key);
                    return (
                        <>
                            <div style={{ display: 'flex' }}>
                                {selection && <div style={{ display: 'block', zIndex: -1, position: 'absolute', height: 19, background: 'rgba(255,255,255,.3)', marginLeft: ((selection.from.ch + 1) * this.textWidth) + 30, width: (selection.to.ch - selection.from.ch) * this.textWidth }} />}
                                <div style={{ display: 'inline-block', width: 40, textAlign: 'center', color: "rgba(255, 255, 255, .3)" }}>{key}</div>
                                <div style={{ height: 19, display: 'inline-block', flex: 1 }} key={key} data-line={key}>
                                    {/* {lineTokens.map((token, key2) => <span className={token.className} key={key2}>{token.value}</span>)} */}
                                    {lineTokens}
                                </div>
                            </div>
                        </>
                    )
                })}
            </div>
        )
    }
    onMouseDown = (e) => {
        let button = (e as MouseEvent).button;
        let cursor = this.onLineClick(e);
        if (cursor) {
            this.setState({
                mouseState: button + 1,
                selection: {
                    to: cursor,
                    from: cursor
                },
                selectionAnchor: cursor
            });
        }
        this.input.current.focus();
    }
    setSelection(cursor: Position, anchor?: Position) {
        let a = anchor || this.state.selectionAnchor;
        let { from, to } = this.state.selection;
        if (cursor && !Measure.is(cursor, to)) {
            if (Measure.gt(cursor, a)) {
                this.setState({ selection: { from: a, to: cursor } });
            } else {
                this.setState({ selection: { from: cursor, to: a } });
            }
        }
    }
    onMouseMove = (e) => {
        if (this.state.mouseState == IEditorMouseType.Left) {
            let cursor = this.onLineClick(e);
            this.setSelection(cursor);
            // if (e.target.classList.has('source')) {
            // if (e.target.attributes["data-line"]) {
            //     console.log(e.target.attributes["data-line"].value);
            // } else {
            //     console.log(e.target.parentElement.attributes["data-line"].value);
            // }
            // }
        }
    }
    onMouseUp = (e) => {
        this.input.current.focus();
        if (Measure.is(this.state.selection.from, this.state.selection.to)) {
            this.setState({ mouseState: 0, selection: null, selectionAnchor: null });
        } else {
            this.setState({ mouseState: 0 });
        }
    }
    insertChar(key) {
        // let chars = tokenizer.lines[this.state.cursor.line].split("");
        // chars.splice(this.state.cursor.ch, 0, key);
        // this.moveCursor(this.state.cursor.line, this.state.cursor.ch + 1);
        // tokenizer.setLine(this.state.cursor.line, chars.join(""));
        tb.insert({ column: this.state.cursor.ch + 1, row: this.state.cursor.line }, key);
        myCursor.setRange({ start: { column: this.state.cursor.ch + 1, row: this.state.cursor.line }, end: { column: this.state.cursor.ch + 1, row: this.state.cursor.line } });
    }
    change({ from, to }: EditorRange, insertText?: string) {
        let res = tb.delete({ start: { column: from.ch, row: from.line }, end: { column: to.ch, row: to.line } });
        console.log(tb);
        // p.splice({ row: from.line, column: from.ch }, { row: to.line, column: to.ch }, insertText);
        // console.log(p.getChanges());
        // if (from.line == to.line) {
        //     let chars = tokenizer.lines[this.state.cursor.line].split("");
        //     chars.splice(from.ch, to.ch - from.ch);
        //     if (insertText) {
        //         chars.splice(from.ch, 0, insertText);
        //     }
        //     tokenizer.setLine(this.state.cursor.line, chars.join(""));
        //     this.moveCursor(from.line, from.ch);
        // } else {
        //     let toDelete = [];
        //     for (var i = from.line; i <= to.line; i++) {
        //         console.log(i, from.line, to.line);
        //         if (i == from.line) {
        //             tokenizer.setLine(i, tokenizer.lines[i].slice(0, from.ch));
        //         } else if (i == to.line) {
        //             tokenizer.setLine(i, tokenizer.lines[i].slice(to.ch, tokenizer.lines[i].length));
        //         } else {
        //             toDelete.push(i);
        //         }
        //     }
        //     for (var line of toDelete) {
        //         tokenizer.deleteLine(line);
        //     }
        //     // if(from.line)
        // }
        this.setState({ selection: null, selectionAnchor: null });
    }
    keyDown = (e) => {
        if (e.key.length == 1 && !e.altKey && !e.ctrlKey && !e.metaKey) {
            this.insertChar(e.key);
        } else if (e.key == "Backspace") {
            // if (this.state.cursor.ch == 0 && this.state.cursor.line > 1) {
            //     let newLine = tokenizer.lines[this.state.cursor.line - 1] + tokenizer.lines[this.state.cursor.line];
            //     let { line, ch } = this.state.cursor;
            //     this.moveCursor(line - 1, tokenizer.lines[this.state.cursor.line - 1].length);
            //     tokenizer.setLine(line - 1, newLine);
            //     tokenizer.deleteLine(line);
            //     this.setState({});
            // } else {
            //     let chars = tokenizer.lines[this.state.cursor.line].split("");
            //     chars.splice(this.state.cursor.ch - 1, 1);
            //     this.moveCursor(this.state.cursor.line, this.state.cursor.ch - 1);
            //     tokenizer.setLine(this.state.cursor.line, chars.join(""));
            //     this.setState({});
            // }
            if (this.state.selection) {
                this.change(this.state.selection);
            } else {
                this.change({
                    from: {
                        ch: this.state.cursor.ch - 1,
                        line: this.state.cursor.line
                    },
                    to: this.state.cursor
                });
            }
        } else if (e.key == "Enter") {
            // let currentLine = tokenizer.lines[this.state.cursor.line];
            // if (currentLine.length > this.state.cursor.ch) {
            //     let oldLine = currentLine.slice(0, this.state.cursor.ch);
            //     tokenizer.setLine(this.state.cursor.line, oldLine);
            //     let newLine = currentLine.slice(this.state.cursor.ch, currentLine.length);
            //     tokenizer.insertLine(this.state.cursor.line + 1, newLine);
            //     this.moveCursor(this.state.cursor.line + 1, 0);
            //     this.setState({});
            // } else {
            //     tokenizer.insertLine(this.state.cursor.line + 1, "");
            //     this.moveCursor(this.state.cursor.line + 1, 0);
            //     this.setState({});
            // }
            tb.insert({ column: this.state.cursor.ch, row: this.state.cursor.line }, "\n");
        } else if (e.key.indexOf('Arrow') == 0) {
            let { line, ch } = this.state.cursor;
            let newCursor: Position;
            switch (e.key) {
                case "ArrowLeft":
                    if (!e.shiftKey && this.state.selection) {
                        this.moveCursor(this.state.selection.from.line, this.state.selection.from.ch);
                        this.setState({ selection: null, selectionAnchor: null });
                    } else {
                        newCursor = this.moveHDelta(-1);
                    }
                    break;
                case "ArrowRight":
                    if (!e.shiftKey && this.state.selection) {
                        this.moveCursor(this.state.selection.to.line, this.state.selection.to.ch);
                        this.setState({ selection: null, selectionAnchor: null });
                    } else {
                        newCursor = this.moveHDelta(1);
                    }
                    break;
                case "ArrowDown":
                    newCursor = this.moveVDelta(1);
                    break;
                case "ArrowUp":
                    newCursor = this.moveVDelta(-1);
                    break;
            }
            if (e.shiftKey) {
                if (!this.state.selection) {
                    this.setSelection(newCursor, { line, ch });
                    // this.setState({ selection: { from: { line, ch }, to: this.state.cursor } });
                } else {
                    this.setSelection(newCursor);
                }
            }
        } else if (e.key == "Tab") {
            e.preventDefault();
            let { line, ch } = this.state.cursor;
            let chars = tokenizer.lines[line].split("");
            chars.splice(ch, 0, " ", " ", " ", " ");

            tokenizer.setLine(line, chars.join(""));
            this.moveCursor(line, ch + 4);
        }
        this.renderLines();
    }

    renderLines() {
        let l = tokenizer.getLines();
        var lines = [];
        for (var i = 0; i < l; i++) {
            lines.push(tokenizer.getTokens(i));
        }
        this.setState({ lines });
    }
    moveCursor(line: number, ch: number): Position {
        this.setState({ cursor: { line, ch } });
        if (myCursor) {
            let r = { column: ch, row: line };
            myCursor.setRange({ start: r, end: r });
        } else {
            myCursor = tb.markPosition({ row: line, column: ch });
        }
        return { line, ch };
    }
    onLineClick = (e: React.MouseEvent<HTMLDivElement>) => {
        let target = ((e.target as HTMLElement).nodeName == "SPAN" ? (e.target as HTMLElement).parentElement : (e.target as HTMLElement));
        if (target.attributes["data-line"]) {
            let width = target.innerText.length * this.textWidth;
            var bbox = target.getBoundingClientRect();
            let { clientX, clientY } = e;
            let ch = Math.round((clientX - bbox.left) / this.textWidth);
            let line = parseInt(target.attributes["data-line"].value);
            if (ch > target.innerText.length) {
                ch = target.innerText.length || 0;
            }
            this.preferredChar = ch;
            this.moveCursor(line, ch);
            return { line, ch };
        }
        return;
    }
    moveHDelta(deltaCh) {
        let { line, ch } = this.state.cursor;
        if (deltaCh > 0) {
            if (ch < tokenizer.lines[line].length) {
                this.preferredChar = ch + deltaCh;
                return this.moveCursor(line, ch + deltaCh);
            } else {
                this.preferredChar = 0;
                return this.moveCursor(line + 1, 0);
            }
        } else {
            if (ch + deltaCh == 0) {
                this.preferredChar = tokenizer.lines[line - 1].length;
                return this.moveCursor(line - 1, tokenizer.lines[line - 1].length);
            } else {
                this.preferredChar = ch + deltaCh;
                return this.moveCursor(line, ch + deltaCh);
            }
        }
    }
    moveVDelta(lineDelta) {
        let { line, ch } = this.state.cursor;
        if (lineDelta > 0) {
            if (line + lineDelta == tokenizer.lines.length) {
                return this.moveCursor(line, tokenizer.lines[line].length);
            } else {
                var char = this.preferredChar > tokenizer.lines[line + lineDelta].length ? tokenizer.lines[line + lineDelta].length : this.preferredChar;
                return this.moveCursor(line + lineDelta, char);
            }
        } else {
            if (line == 0) {
                return this.moveCursor(line, 0);
            } else {
                var char = this.preferredChar > tokenizer.lines[line + lineDelta].length ? tokenizer.lines[line + lineDelta].length : this.preferredChar;
                return this.moveCursor(line + lineDelta, char);
            }
        }
    }
}