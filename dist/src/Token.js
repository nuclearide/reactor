import * as React from 'react';
export default class Token extends React.Component {
    render() {
        return (React.createElement("span", { className: 'reactor-' + this.props.type }, this.props.text));
    }
}
