import type Konva from "konva";
import type { ShapeData } from "./types";
import { cx } from "class-variance-authority";
import { useRef, useEffect } from "react";

export function PendingTextArea({
  textShape,
  stage,
  onTextChange,
}: {
  textShape: Extract<ShapeData, { type: "text" }>;
  stage: Konva.Stage;
  onTextChange: (value: string) => void;
}) {
  const { x, y } = stage
    .getAbsoluteTransform()
    .point({ x: textShape.x, y: textShape.y });

  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const splittedText = textShape.text.split("\n");
  const lineLengths = splittedText.map((l) => l.length);

  const cols = Math.max(...lineLengths);
  const rows = splittedText.length;

  useEffect(() => {
    const id = setTimeout(() => textAreaRef.current?.focus(), 0);
    return () => clearTimeout(id);
  }, []);

  return (
    <textarea
      ref={textAreaRef}
      value={textShape.text}
      cols={cols || 1}
      rows={rows || 1}
      className={cx(
        "resize-none overflow-hidden outline-0 border-none",
        textShape.text && "outline-1 outline-blue-600"
      )}
      onChange={(e) => onTextChange(e.target.value)}
      style={{
        position: "absolute",
        left: x,
        top: y,
        zIndex: 100,
        fontSize: `${textShape.fontSize * stage.scaleX()}px`,
        fontFamily: textShape.fontFamily,
        lineHeight: textShape.lineHeight,
        letterSpacing: textShape.letterSpacing * stage.scaleX(),
        textDecoration: textShape.textDecoration,
        fontStyle: textShape.fontStyle,
        color: textShape.fill,
      }}
    />
  );
}
