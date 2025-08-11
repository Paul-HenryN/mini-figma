import type { KonvaEventObject } from "konva/lib/Node";
import { useRef } from "react";
import { Rect, Ellipse, Text } from "react-konva";
import type { ShapeData } from "./types";

export function Shape({
  data,
  onClick,
  draggable = false,
  stopPropagation = false,
}: {
  data: ShapeData;
  onClick?: (e: KonvaEventObject<MouseEvent>) => void;
  draggable?: boolean;
  stopPropagation?: boolean;
}) {
  const shapeRef = useRef(null);

  const otherProps = {
    ref: shapeRef,
    onClick: (e: KonvaEventObject<MouseEvent>) => {
      e.cancelBubble = stopPropagation;
      onClick?.(e);
    },
    onMouseDown: (e: KonvaEventObject<MouseEvent>) => {
      e.cancelBubble = stopPropagation;
    },
    onMouseUp: (e: KonvaEventObject<MouseEvent>) => {
      e.cancelBubble = stopPropagation;
    },
    draggable,
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
