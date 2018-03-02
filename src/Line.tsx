import * as React from "react";
import Token from "./Token";

export default class Line extends React.Component<{tokens: {text: string, type: string}[], lineNumber: number}, any> {
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