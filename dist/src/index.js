import * as React from "react";
import Line from "./Line";
import { Tokenizer } from "./tokenizer";
import Cursors from "./Cursors";
// var file = new Tokenizer(readFileSync('../node_modules/acorn/dist/acorn.js', 'utf8'));
// var file = new Tokenizer(readFileSync('../node_modules/less/lib/less/contexts.js', 'utf8'));
var file = new Tokenizer(`
if(true) {
    alert("do something");
} else {
    console.log("test");
}
`);
function parseLines() {
    var ret = [];
    for (var i = 0; i < file.getLineCount(); i++) {
        ret.push(file.parseLine(i));
    }
    return ret;
}
export default class Editor extends React.Component {
    constructor(props) {
        super(props);
        this.onChange = (e) => {
            let cursor = this.state.cursor;
            if (e.key == 'ArrowLeft') {
                if (cursor.ch - 1 > -1) {
                    cursor.ch--;
                    this.setState({ cursor });
                }
            }
            else if (e.key == 'ArrowRight') {
                if (cursor.ch < file.getLine(cursor.line).length) {
                    cursor.ch++;
                    this.setState({ cursor });
                }
            }
            else if (e.key == 'ArrowDown') {
                if (cursor.line + 1 < file.getLineCount()) {
                    cursor.line++;
                    // console.log(file.getLine(cursor.line).length, cursor.ch)
                    if (file.getLine(cursor.line).length < cursor.ch) {
                        cursor.ch = file.getLine(cursor.line).length;
                    }
                    this.setState({ cursor });
                }
            }
            else if (e.key == 'ArrowUp') {
                if (cursor.line > 0) {
                    cursor.line--;
                    if (file.getLine(cursor.line).length < cursor.ch) {
                        cursor.ch = file.getLine(cursor.line).length;
                    }
                    this.setState({ cursor });
                }
            }
            else if (e.key.length == 1) {
                var { line, ch } = cursor;
                var fileContents = file.getLine(line);
                file.setLine(line, fileContents.slice(0, ch) + e.key + fileContents.slice(ch, fileContents.length));
                this.setState({ cursor: { line, ch: ch + 1 } });
            }
            else if (e.key == 'Backspace') {
                var { line, ch } = cursor;
                var { lines } = this.state;
                var fileContents = file.getLine(line);
                if (ch == 0 && line !== 0) {
                    this.setState({ cursor: { line: line - 1, ch: file.getLine(line - 1).length } }, () => {
                        if (fileContents.length > 0) {
                            file.setLine(line - 1, file.getLine(line - 1) + fileContents);
                            lines[line - 1] = file.parseLine(line - 1);
                        }
                        file.deleteLine(line);
                    });
                }
                else {
                    file.setLine(line, fileContents.slice(0, ch - 1) + fileContents.slice(ch, fileContents.length));
                    this.setState({ cursor: { line, ch: (ch > 0) ? ch - 1 : ch } });
                }
            }
            else if (e.key == 'Tab') {
                e.preventDefault();
                var { line, ch } = cursor;
                var fileContents = file.getLine(line);
                file.setLine(line, fileContents.slice(0, ch) + "    " + fileContents.slice(ch, fileContents.length));
                this.setState({ cursor: { line, ch: ch + 4 } });
            }
            else if (e.key == 'Enter') {
                var { lines } = this.state;
                var { line, ch } = cursor;
                if (ch == 0) {
                    file.insertLine(line, '');
                }
                else if (ch == file.getLine(line).length) {
                    file.insertLine(line + 1, '');
                }
                else {
                    var currentLine = file.getLine(line);
                    file.insertLine(line + 1, currentLine.slice(ch, currentLine.length));
                    file.setLine(line, currentLine.slice(0, ch));
                }
                this.setState({ cursor: { line: line + 1, ch: 0 } });
            }
            // console.log(e.keyCode, e.key);
        };
        this.onClick = (e) => {
            this._input.focus();
            this.setState({ focused: true });
        };
        this.onLineClick = (line, ch) => {
            this.setState({ cursor: { line, ch } });
        };
        this.state = {
            cursor: {
                ch: 0,
                line: 0
            },
            lines: [],
            focused: false
        };
    }
    render() {
        return (React.createElement("div", null,
            React.createElement("button", { onClick: () => eval(file.lines.join('\n')) }, "Run!"),
            React.createElement("div", { className: "reactor", onClick: this.onClick },
                React.createElement(Cursors, { cursorPositions: [this.state.cursor], visible: this.state.focused }),
                React.createElement("input", { ref: input => this._input = input, className: "reactor-textbox", value: "", onKeyDown: this.onChange, onBlur: () => this.setState({ focused: false }) }),
                this.state.lines.map((tokens, i) => React.createElement(Line, { tokens: tokens, key: i, lineNumber: i + 1, text: file.getLine(i), onClick: this.onLineClick })))));
    }
    componentDidMount() {
        this.setState({ lines: parseLines() });
        file.on('insertLine', (line) => {
            var { lines } = this.state;
            lines.splice(line, 0, []);
            lines[line] = file.parseLine(line);
            this.setState({ lines });
        });
        file.on('updateLine', (line) => {
            var { lines } = this.state;
            // console.log(lines[line].find(({ text, type }) => {
            //     return type == 'multiline-comment' && text.slice(0, 2) == '/*';
            // }));
            lines[line] = file.parseLine(line);
            this.setState({ lines });
        });
        file.on('deleteLine', (line) => {
            var { lines } = this.state;
            // var multiline = lines[line].find(({text, type}) => {
            //     return type == 'multiline-comment';
            // });
            // console.log(multiline);
            // if(multiline && multiline.startLine) {
            //     var i = multiline.startLine;
            //     while(i < file.getLineCount() - 1) {
            //         // console.log(!!lines[i].find(({text, type}) => {
            //         //     return type == 'multiline-comment';
            //         // }) || lines[i].length == 0);
            //         console.log(file.parseLine(i));
            //         if(!!lines[i]) {
            //             lines[i] = file.parseLine(i);
            //             i++;
            //         } else {
            //             break;
            //         }
            //     }
            // }
            // console.log(file.parseLine(line - 1));
            // lines[line - 1] = file.parseLine(line - 1);
            lines.splice(line, 1);
            this.setState({ lines });
        });
    }
}
