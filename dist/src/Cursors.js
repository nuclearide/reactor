import * as React from "react";
export default class Cursors extends React.Component {
    render() {
        return (React.createElement("div", { className: "reactor-cursors" }, this.props.visible && this.props.cursorPositions.map((cursor, key) => {
            return React.createElement("div", { key: key, className: "reactor-cursor", style: { top: cursor.line * 31, left: 38 + (cursor.ch * 10.83) } });
        })));
    }
    componentWillReceiveProps() {
        document.querySelector('.reactor-cursor') && document.querySelector('.reactor-cursor').scrollIntoViewIfNeeded();
    }
}
