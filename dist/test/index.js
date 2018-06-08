import React from 'react';
// import Editor from '../src/index';
import { render } from 'react-dom';
import { Registry } from 'vscode-textmate';
var registry = new Registry();
var grammar = registry.loadGrammarFromPathSync('../syntaxes/TypeScript.tmLanguage');
// https://github.com/Microsoft/TypeScript-TmLanguage/raw/master/TypeScript.tmLanguage
var str = `
var tester = () => {alert()};
function test() {
  console.log("hello world!");
}
test();
`;
var ruleStack = null;
var tokenLines = [];
var lines = str.split("\n");
for (var i = 0; i < lines.length; i++) {
    var r = grammar.tokenizeLine(lines[i], ruleStack);
    tokenLines.push(r.tokens);
    console.log('Line: #' + i + ', tokens: ', r.tokens);
    ruleStack = r.ruleStack;
}
function parseScopes(scopes) {
    console.log(scopes);
    if (scopes.length > 1) {
        return scopes.join(' ').replace(/\./g, '-');
    }
    return "";
}
render(React.createElement("div", null, tokenLines.map((lineTokens, key) => {
    return React.createElement("div", null, lineTokens.map((token) => React.createElement("span", { className: parseScopes(token.scopes) }, lines[key].slice(token.startIndex, token.endIndex))));
})), document.getElementById('root'));
// render(<Editor />, document.getElementById('root'));
