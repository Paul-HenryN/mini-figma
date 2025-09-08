import type Konva from "konva";
import { cx } from "class-variance-authority";
import { useRef, useEffect, useState } from "react";
import type { ShapeData } from "@/types";
import { useStore } from "@/store";
import { useShallow } from "zustand/shallow";

export function PendingTextInput({
  textShape,
  stage,
}: {
  textShape: Extract<ShapeData, { type: "text" }>;
  stage: Konva.Stage;
}) {
  const state = useStore(
    useShallow((state) => ({
      syncShapeData: state.syncShapeData,
      confirmPendingShape: state.confirmPendingShape,
    }))
  );

  const [cols, setCols] = useState(0);
  const [rows, setRows] = useState(0);

  const { x, y } = stage
    .getAbsoluteTransform()
    .point({ x: textShape.x, y: textShape.y });

  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const onTextChange = (text: string) => {
    const splittedText = text.split("\n");
    const lineLengths = splittedText.map((l) => l.length);

    const newCols = Math.max(...lineLengths);
    const newRows = splittedText.length;

    setCols(newCols);
    setRows(newRows);

    const node = stage.findOne(`#${textShape.id}`) as Konva.Text | undefined;

    const newWidth = node?.getTextWidth();
    const newHeight = node?.getTextHeight();

    state.syncShapeData(textShape.id, {
      text,
      name: text,
      width: newWidth ? Math.round(newWidth) : undefined,
      height: newHeight ? Math.round(newHeight) : undefined,
    });
  };

  const onBlur = () => {
    state.confirmPendingShape();
  };

  useEffect(() => {
    const id = setTimeout(() => {
      textAreaRef.current?.focus();
      textAreaRef.current?.select();
    }, 0);
    return () => clearTimeout(id);
  }, []);

  return (
    <textarea
      ref={textAreaRef}
      value={textShape.text}
      cols={cols}
      rows={rows}
      className={cx("resize-none overflow-hidden outline-0 border-none")}
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
      onBlur={onBlur}
    />
  );
}
