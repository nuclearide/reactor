export class Selection {
    static in(target, a, b) {
        let min = Math.min(a.line, b.line);
        let max = Math.max(a.line, b.line);
        return target >= min && target <= max;
    }
    static between(target, a, b) {
        let min = Math.min(a.line, b.line);
        let max = Math.max(a.line, b.line);
        return target > min && target < max;
    }
}