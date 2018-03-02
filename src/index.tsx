import * as React from "react";
import Line from "./Line";

import { Tokenizer } from "./tokenizer";
import { readFileSync } from "fs";

// var file = new Tokenizer(readFileSync('../node_modules/acorn/dist/acorn.js', 'utf8'));
var file = new Tokenizer(readFileSync('../node_modules/less/lib/less/contexts.js', 'utf8'));
/*var file = new Tokenizer(`
\`
test\`
`);*/

function eachLine(t: Tokenizer, cb: (tokens: {text: string, type: string}[], i: number) => JSX.Element) {
    var ret = [];
    for(var i = 0; i < t.getLineCount(); i++) {
        ret.push(cb(t.parseLine(i), i));
    }
    return ret;
}

export default class Editor extends React.Component {
    render() {
        return (
            <div className="reactor">
                {eachLine(file, (tokens, i) =>
                    <Line tokens={tokens} key={i} lineNumber={i+1}/>
                )}
            </div>
        );
    }
}
