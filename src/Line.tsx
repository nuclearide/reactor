import * as React from "react";
import Token from "./Token";
import {Token as TokenType} from './tokenizer';

export default class Line extends React.Component<{tokens: TokenType[], lineNumber: number}, any> {
    render() {
        return (
            <div className="reactor-line">
                <div className="reactor-linenumber">{this.props.lineNumber}</div>
                <div className="reactor-linecontents">
                    {this.props.tokens.map(({text, type}, key) => 
                        <Token type={type} text={text} key={key}/>
                    )}
                </div>
            </div>
        )
    }
}