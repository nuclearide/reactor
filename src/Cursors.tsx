import * as React from "react";

export default class Cursors extends React.Component<{cursorPositions: {line: number, ch: number}[]}, any> {
    render() {
        return (
            <div className="reactor-cursors">
                {this.props.cursorPositions.map((cursor, key) => {
                    return <div key={key} className="reactor-cursor" style={{top: cursor.line * 31, left: 38+ (cursor.ch * 10.83)}}></div>
                })}
            </div>
        );
    }
    componentWillReceiveProps() {
        document.querySelector('.reactor-cursor').scrollIntoViewIfNeeded();
    }
}