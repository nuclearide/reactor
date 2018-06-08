import React from "react";
import TextBuffer from 'text-buffer';

let tb = TextBuffer.loadSync("./index.tsx");
let cursor = tb.markPosition({ column: 0, row: 0 });
let selection = tb.markRange({ start: { column: 0, row: 0 }, end: { row: 0, column: 0 } });
window['tb'] = tb;

// tb.onDidUpdateMarkers(console.log);
let textWidth = (function () {
    let s = document.createElement('span');
    s.innerText = "a";
    document.body.appendChild(s);
    let w = s.getBoundingClientRect().width;
    document.body.removeChild(s);
    return w;
})();
interface EditorState {
    mouse: boolean;
    anchor: TextBuffer.Point
}
export default class Editor extends React.Component<any, EditorState> {
    state: EditorState = {
        mouse: false,
        anchor: null
    }

    render() {
        let pos = cursor.getHeadPosition();
        let sel = selection.getRange();
        return (
            <div style={{ userSelect: 'none' }} onMouseUp={this.onMouseUp}>
                <span style={{ position: 'absolute', top: pos.row * 20, left: (pos.column * textWidth) + 40, display: 'block', width: 4, height: 20, background: 'hotpink' }}></span>
                {tb.getLines().map((str, key) => {
                    let selected = this.getSelection(key);
                    return (
                        <div style={{ position: 'relative' }}>
                            {selected && <div style={{ position: 'absolute', zIndex: -1, left: (selected.start * textWidth) + 40, width: selected.length * textWidth, height: 20, background: 'rgba(255, 255, 255, .5)' }}></div>}
                            <div style={{ display: 'inline-block', width: '40px', textAlign: 'center', color: 'rgba(255, 255, 255, .4)' }}>{key + 1}</div>
                            <div
                                key={key}
                                style={{ display: 'inline-block', height: 20, width: 'calc(100% - 40px)', whiteSpace: "pre" }}
                                onMouseDown={this.onMouseDown}
                                onMouseMove={this.onMouseMove}
                                data-line={key}>
                                {str}
                            </div>
                        </div>
                    );
                })}
            </div >
        );
    }

    getSelection(line) {
        let sel = selection.getRange();
        if (sel.isEmpty()) return;
        if (sel.isSingleLine()) {
            if (line == sel.start.row) {
                return { start: sel.start.column, length: sel.end.column - sel.start.column };
            } else return;
        }
        let str = tb.lineForRow(line);

        let lineRange = { start: { row: line, column: 0 }, end: { row: line, column: str.length } };
        let selected = sel.containsRange(lineRange);
        let ret;
        if (!selected) {
            if (sel.start.row == line) {
                selected = true;
                ret = { start: sel.start.column, length: str.length - sel.start.column };
            } else if (sel.end.row == line) {
                selected = true;
                ret = { start: 0, length: sel.end.column };
            }
        } else {
            ret = { start: 0, length: str.length };
        }
        return ret;
    }

    onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        let relativeX = e.clientX - e.currentTarget.offsetLeft;
        cursor.setHeadPosition({ column: Math.round(relativeX / textWidth), row: parseInt(e.currentTarget.attributes['data-line'].value) })
        selection.setRange({ start: { column: 0, row: 0 }, end: { column: 0, row: 0 } });
        this.setState({ mouse: true, anchor: cursor.getHeadPosition() });
    }
    onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (this.state.mouse) {
            let relativeX = e.clientX - e.currentTarget.offsetLeft;
            cursor.setHeadPosition({ column: Math.round(relativeX / textWidth), row: parseInt(e.currentTarget.attributes['data-line'].value) })
            switch (this.state.anchor.compare(cursor.getHeadPosition())) {
                case -1:
                    selection.setRange({ start: this.state.anchor, end: cursor.getHeadPosition() });
                    break;
                case 1:
                    selection.setRange({ start: cursor.getHeadPosition(), end: this.state.anchor });
                    break;
            }
            this.setState({});
        }
    }
    onMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
        this.setState({ mouse: false });
    }
    componentDidMount() {
        let emptyRange = { start: { row: 0, column: 0 }, end: { row: 0, column: 0 } };
        document.addEventListener('keydown', (e) => {
            if (e.key.length == 1) {
                if (e.metaKey) {
                    switch (e.key) {
                        case "s":
                            tb.save();
                            break;
                        case "z":
                            tb.undo()
                            break;
                        case "Z":
                            tb.redo();
                            break;
                        case "y":
                            tb.deleteRow(cursor.getEndPosition().row);
                            break;
                    }
                } else {
                    let sel = selection.getRange();
                    if (sel.isEmpty()) {
                        let pos = cursor.getHeadPosition();
                        tb.insert(pos, e.key);
                    } else {
                        tb.setTextInRange(sel, e.key);
                        cursor.setHeadPosition({ row: sel.start.row, column: sel.start.column + 1 });
                        selection.setRange(emptyRange);
                    }
                }
            } else if (e.key == "Backspace") {
                let sel = selection.getRange();
                if (sel.isEmpty()) {
                    let pos = cursor.getHeadPosition();
                    if (pos.column == 0 && pos.row > 0) {
                        tb.delete({ start: { row: pos.row - 1, column: tb.lineForRow(pos.row - 1).length }, end: pos });
                    } else {
                        tb.delete({ start: { row: pos.row, column: pos.column - 1 }, end: pos });
                    }
                } else {
                    tb.setTextInRange(sel, "");
                    selection.setRange(emptyRange);
                }
            } else if (e.key == "Enter") {
                let pos = cursor.getHeadPosition();
                tb.insert(pos, "\n");
            } else if (e.key.indexOf('Arrow') > -1) {
                let pos = cursor.getHeadPosition();
                switch (e.key) {
                    case "ArrowLeft":
                        cursor.setHeadPosition({ column: pos.column - 1, row: pos.row });
                        break;
                    case "ArrowRight":
                        cursor.setHeadPosition({ column: pos.column + 1, row: pos.row });
                        break;
                    case 'ArrowUp':
                        cursor.setHeadPosition({ column: pos.column, row: pos.row - 1 });
                        break;
                    case 'ArrowDown':
                        cursor.setHeadPosition({ column: pos.column, row: pos.row + 1 });
                        break;
                }
                if (e.shiftKey) {
                    if (selection.getRange().isEmpty()) {
                        let anchor;
                        let start;
                        switch (cursor.getHeadPosition().compare(pos)) {
                            case -1:
                                anchor = pos;
                                start = cursor.getHeadPosition();
                                break;
                            case 1:
                                anchor = cursor.getHeadPosition();
                                start = pos;
                                break;
                        }
                        selection.setRange({ start, end: anchor });
                        this.setState({ anchor });
                    } else {
                        selection.setRange({ start: cursor.getHeadPosition(), end: this.state.anchor });
                    }
                }
            } else if (e.key == "Tab") {
                if (e.shiftKey) {
                    let row = cursor.getHeadPosition().row;
                    let str = tb.lineForRow(row);
                    let i;
                    for (i = 0; i < str.length; i++) {
                        if (str[i] != ' ') {
                            break;
                        }
                    }
                    var remainder = i % 4;
                    var tabs = (i - remainder) / 4;
                    if (tabs > 0) {
                        tb.delete({ start: { row, column: 0 }, end: { row, column: 4 } });
                    } else if (remainder > 0) {
                        tb.delete({ start: { row, column: 0 }, end: { row, column: remainder } });
                    }
                } else {
                    tb.insert(cursor.getHeadPosition(), "    ");
                }
            }
            this.setState({});
        });
    }
}