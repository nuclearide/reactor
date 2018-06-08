import React from 'react';
import Editor from '../src/index2';
import { render } from 'react-dom';
import { readFileSync } from 'fs';

render(
    <Editor />,
    document.getElementById('root')
)
// render(<Editor />, document.getElementById('root'));