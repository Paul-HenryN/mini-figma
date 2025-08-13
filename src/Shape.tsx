import type { KonvaEventObject } from "konva/lib/Node";
import { useRef } from "react";
import { Rect, Ellipse, Text } from "react-konva";
import type { ShapeData } from "./types";

export function Shape({
  data,
  onClick,
  onTransform,
  onDragMove,
  draggable = false,
  stopPropagation = false,
}: {
  data: ShapeData;
  onClick?: (e: KonvaEventObject<MouseEvent>) => void;
  onTransform?: (e: KonvaEventObject<Event>) => void;
  onDragMove?: (e: KonvaEventObject<DragEvent>) => void;
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
    onTransform: onTransform,
    onDragMove,
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
    return (
      <Ellipse
        {...data}
        {...otherProps}
        radiusX={Math.abs(data.width) / 2}
        radiusY={Math.abs(data.height) / 2}
      />
    );
  }
  if (data.type === "text") {
    return <Text {...data} {...otherProps} />;
  }

  return null;
}
