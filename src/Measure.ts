interface Position {
    ch: number;
    line: number;
}

class Measure {
    static is(a: Position, b: Position) {
        return a.line == b.line && a.ch == b.ch;
    }
    static gt(a: Position, b: Position) {
        if (a.line == b.line) {
            return a.ch > b.ch;
        } else {
            return a.line > b.line;
        }
    }
}

export {
    Position,
    Measure
}