import React from "react";
interface CursorProps {
    position: { row: number, column: number } | null;
    textWidth: number;
}
export function Cursor({ position, textWidth }: CursorProps) {
    if (!position) return "";
    let line = document.querySelector(`[data-line="${position.row}"]`);
    if (!line) return <span />;

    let { left, top } = line.getBoundingClientRect();
    return <span className="cursor" style={{ left: ((left + textWidth * position.column) - 1) + "px", top }} />
}