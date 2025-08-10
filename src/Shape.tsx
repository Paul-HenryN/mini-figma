import type { KonvaEventObject } from "konva/lib/Node";
import { useRef } from "react";
import { Rect, Ellipse, Text } from "react-konva";
import type { ShapeData } from "./types";

export function Shape({
  data,
  onClick,
  isSelected = false,
}: {
  data: ShapeData;
  onClick?: ({ multiSelectEnabled }: { multiSelectEnabled: boolean }) => void;
  isSelected?: boolean;
}) {
  const shapeRef = useRef(null);

  const otherProps = {
    ref: shapeRef,
    onClick: (e: KonvaEventObject<MouseEvent>) => {
      if (shapeRef.current) onClick?.({ multiSelectEnabled: e.evt.shiftKey });
    },
    onMouseDown: (e: KonvaEventObject<MouseEvent>) => {
      e.cancelBubble = true;
    },
    onMouseUp: (e: KonvaEventObject<MouseEvent>) => {
      e.cancelBubble = true;
    },
    draggable: isSelected,
  };

  if (data.type === "rectangle") {
    return <Rect {...data} {...otherProps} />;
  }
  if (data.type === "ellipse") {
    return <Ellipse {...data} {...otherProps} />;
  }
  if (data.type === "text") {
    return <Text {...data} {...otherProps} />;
  }

  return null;
}
