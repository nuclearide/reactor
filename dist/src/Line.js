import * as React from "react";
import Token from "./Token";
export default class Line extends React.Component {
    constructor() {
        super(...arguments);
        this.onClick = (e) => {
            var charWidth = 10.83;
            var offset = this._line.getBoundingClientRect();
            var realOffset = e.clientX - (offset.left + 5);
            var b = realOffset % charWidth;
            var ch = ((realOffset - b) / charWidth) + (b > (charWidth / 2) ? 1 : 0);
            if (ch > this.props.text.length) {
                ch = this.props.text.length;
            }
            this.props.onClick(this.props.lineNumber - 1, ch);
        };
    }
    render() {
        return (React.createElement("div", { className: "reactor-line", onClick: this.onClick },
            React.createElement("div", { className: "reactor-linenumber" }, this.props.lineNumber),
            React.createElement("div", { className: "reactor-linecontents", ref: div => this._line = div }, this.props.tokens.map(({ text, type }, key) => React.createElement(Token, { type: type, text: text, key: key })))));
    }
}
