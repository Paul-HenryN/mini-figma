import type { KonvaEventObject } from "konva/lib/Node";
import { useRef } from "react";
import { Rect, Ellipse, Text } from "react-konva";
import type { ShapeData } from "@/types";
import { useStore } from "@/store";
import type Konva from "konva";
import { useShallow } from "zustand/shallow";

export function Shape({
  data,
  onDragMove,
}: {
  data: ShapeData;
  onDragMove?: (e: KonvaEventObject<DragEvent>) => void;
}) {
  const state = useStore(
    useShallow((state) => ({
      pendingShapeId: state.pendingShapeId,
      selectedShapeIds: state.currentParticipantId
        ? state.selectedShapeIds[state.currentParticipantId]
        : null,
      isPanning: state.isPanning,
      currentTool: state.currentTool,
      syncShapeData: state.syncShapeData,
      updateLocalCursorPosition: state.updateLocalCursorPosition,
      toggleSelectShape: state.toggleSelectShape,
    }))
  );

  const shapeRef = useRef(null);
  const isSelected = !!state.selectedShapeIds?.includes(data.id);

  const handleTransform = (e: Konva.KonvaEventObject<Event>) => {
    const node = e.target;
    if (!node) return;

    const updatedWith = Math.round(node.width() * node.scaleX());
    const updatedHeight = Math.round(node.height() * node.scaleY());
    const updatedX = Math.round(node.x());
    const updatedY = Math.round(node.y());

    node.scale({ x: 1, y: 1 });
    node.x(updatedX);
    node.y(updatedY);
    node.width(updatedWith);
    node.height(updatedHeight);

    if (node.getAttrs().type === "ellipse") {
      node.offsetX(-updatedWith / 2);
      node.offsetY(-updatedHeight / 2);

      state.syncShapeData(node.id(), {
        x: updatedX,
        y: updatedY,
        width: updatedWith,
        height: updatedHeight,
        offsetX: -updatedWith / 2,
        offsetY: -updatedHeight / 2,
      });

      return;
    }

    state.syncShapeData(node.id(), {
      x: updatedX,
      y: updatedY,
      width: updatedWith,
      height: updatedHeight,
    });
  };

  const commonProps = {
    ref: shapeRef,
    onClick: (e: KonvaEventObject<MouseEvent>) => {
      e.cancelBubble = true;
      if (state.currentTool.id === "move" && !state.isPanning) {
        state.toggleSelectShape(data.id, {
          isMultiSelect: e.evt.shiftKey,
        });
      }
    },
    onTransform: handleTransform,
    onDragMove,
    onMouseDown: (e: KonvaEventObject<MouseEvent>) => {
      e.cancelBubble = true;
    },
    onMouseUp: (e: KonvaEventObject<MouseEvent>) => {
      e.cancelBubble = true;
    },
    draggable: isSelected && state.currentTool.id === "move",
  };

  if (data.type === "rectangle") {
    return <Rect {...data} {...commonProps} />;
  }

  if (data.type === "ellipse") {
    return (
      <Ellipse
        {...data}
        {...commonProps}
        radiusX={Math.abs(data.width) / 2}
        radiusY={Math.abs(data.height) / 2}
      />
    );
  }

  if (data.type === "text" && data.id !== state.pendingShapeId) {
    return <Text {...data} {...commonProps} />;
  }

  return null;
}
