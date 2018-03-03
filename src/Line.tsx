import * as React from "react";
import Token from "./Token";
import {Token as TokenType} from './tokenizer';

export default class Line extends React.Component<{tokens: TokenType[], text: string, lineNumber: number, onClick: (line: number, ch: number) => void}, any> {
    private _line: HTMLDivElement;
    render() {
        return (
            <div className="reactor-line" onClick={this.onClick}>
                <div className="reactor-linenumber">{this.props.lineNumber}</div>
                <div className="reactor-linecontents" ref={div => this._line = div}>
                    {this.props.tokens.map(({text, type}, key) => 
                        <Token type={type} text={text} key={key}/>
                    )}
                </div>
            </div>
        )
    }
    onClick = (e: React.MouseEvent<HTMLDivElement>) => {
        var charWidth = 10.83;
        var offset = this._line.getBoundingClientRect();
        var realOffset = e.clientX - (offset.left+5);
        var b = realOffset % charWidth;
        var ch = ((realOffset - b) / charWidth) + (b > (charWidth/2) ? 1 : 0);
        if(ch > this.props.text.length) {
            ch = this.props.text.length;
        }
        this.props.onClick(this.props.lineNumber - 1, ch);
    }
}