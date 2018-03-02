import * as React from 'react';

export default class Token extends React.Component<{type: string, text: string}, any> {
    render() {
        return (
            <span className={'reactor-'+this.props.type}>{this.props.text}</span>
        );
    }
}