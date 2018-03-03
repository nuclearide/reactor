import * as React from "react";
import Line from "./Line";

import { Tokenizer } from "./tokenizer";
import { readFileSync } from "fs";
import Cursors from "./Cursors";

// var file = new Tokenizer(readFileSync('../node_modules/acorn/dist/acorn.js', 'utf8'));
var file = new Tokenizer(readFileSync('../node_modules/less/lib/less/contexts.js', 'utf8'));
/*var file = new Tokenizer(`
\`
test\`
`);*/

function parseLines() {
    var ret = [];
    for(var i = 0; i < file.getLineCount(); i++) {
        ret.push(file.parseLine(i));
    }
    return ret;
}

export default class Editor extends React.Component<any, {cursor: {line: number, ch: number}, lines: any[]}> {
    private _input: HTMLInputElement;
    constructor(props) {
        super(props);
        this.state = {
            cursor: {
                ch: 0,
                line: 0
            },
            lines: []
        }
    }
    render() {
        return (
            <div className="reactor" onClick={this.onClick}>
                <Cursors cursorPositions={[this.state.cursor]}/>
                <input ref={input => this._input = input} className="reactor-textbox" value={""} onKeyDown={this.onChange}/>
                {this.state.lines.map((tokens, i) =>
                    <Line tokens={tokens} key={i} lineNumber={i+1}/>
                )}
            </div>
        );
    }

    onChange = (e: React.KeyboardEvent<HTMLInputElement>) => {
        let cursor = this.state.cursor;
        if(e.key == 'ArrowLeft') {
            if(cursor.ch-1 > -1) {
                cursor.ch--;
                this.setState({cursor});
            }
        } else if (e.key == 'ArrowRight') {
            if(cursor.ch < file.getLine(cursor.line).length) {
                cursor.ch++;
                this.setState({cursor});
            }
        } else if (e.key == 'ArrowDown') {
            if(cursor.line + 1 < file.getLineCount()) {
                cursor.line++;
                // console.log(file.getLine(cursor.line).length, cursor.ch)
                if(file.getLine(cursor.line).length < cursor.ch) {
                    cursor.ch = file.getLine(cursor.line).length;
                }
                this.setState({cursor});
            }
        } else if (e.key == 'ArrowUp') {
            if(cursor.line > 0) {
                cursor.line--;
                this.setState({cursor});
            }
        } else if (e.key.length == 1) {
            var {line, ch} = cursor;
            var fileContents = file.getLine(line);
            file.setLine(line, fileContents.slice(0, ch) + e.key + fileContents.slice(ch, fileContents.length));
            var {lines} = this.state;
            lines[cursor.line] = file.parseLine(line);
            this.setState({lines, cursor: {line, ch: ch + 1}});
        } else if(e.key == 'Backspace') {
            var {line, ch} = cursor;
            var {lines} = this.state;
            var fileContents = file.getLine(line);
            if(ch == 0 && line !== 0) {
                this.setState({cursor: {line: line - 1, ch: file.getLine(line - 1).length}}, () => {
                    if(fileContents.length > 0) {
                        file.setLine(line - 1, file.getLine(line - 1) + fileContents);
                        lines[line - 1] = file.parseLine(line - 1);
                    }
                    lines.splice(line, 1);
                    this.setState({lines});
                    file.deleteLine(line);
                });
            } else {
                file.setLine(line, fileContents.slice(0, ch - 1) + fileContents.slice(ch, fileContents.length));
                lines[cursor.line] = file.parseLine(line);
                this.setState({lines, cursor: {line, ch: (ch > 0) ? ch - 1 : ch}});
            }

        } else if(e.key == 'Enter') {
            var {lines} = this.state;
            var {line, ch} = cursor;
            if(ch == 0) {
                lines.splice(line, 0, '');
                file.insertLine(line, '');
            } else if (ch == file.getLine(line).length){
                lines.splice(line + 1, 0, '');
                file.insertLine(line + 1, '');
            } else {
                var currentLine = file.getLine(line);
                lines.splice(line + 1, 0, '');
                file.insertLine(line + 1, currentLine.slice(ch, currentLine.length));
                file.setLine(line, currentLine.slice(0, ch));
            }
            this.setState({lines: parseLines(), cursor: {line: line + 1, ch: 0}});
        }
        // console.log(e.keyCode, e.key);
    }
    onClick = (e) => {
        this._input.focus();
    }
    componentDidMount() {
        this.setState({lines: parseLines()});
    }
}
