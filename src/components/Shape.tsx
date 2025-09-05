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
      setPendingShapeId: state.setPendingShapeId,
    }))
  );

  const shapeRef = useRef(null);
  const isSelected = !!state.selectedShapeIds?.includes(data.id);

  const handleTransform = (e: Konva.KonvaEventObject<Event>) => {
    const node = e.target;
    if (!node) return;

    const updatedWidth = Math.round(node.width() * node.scaleX());
    const updatedHeight = Math.round(node.height() * node.scaleY());
    const updatedX = Math.round(node.x());
    const updatedY = Math.round(node.y());

    node.scale({ x: 1, y: 1 });
    node.x(updatedX);
    node.y(updatedY);
    node.width(updatedWidth);
    node.height(updatedHeight);

    if (node.getAttrs().type === "ellipse") {
      node.offsetX(-updatedWidth / 2);
      node.offsetY(-updatedHeight / 2);

      state.syncShapeData(node.id(), {
        x: updatedX,
        y: updatedY,
        width: updatedWidth,
        height: updatedHeight,
        offsetX: -updatedWidth / 2,
        offsetY: -updatedHeight / 2,
      });

      return;
    }

    state.syncShapeData(node.id(), {
      x: updatedX,
      y: updatedY,
      width: updatedWidth,
      height: updatedHeight,
    });
  };

  const commonProps = {
    ref: shapeRef,
    onClick: (e: KonvaEventObject<MouseEvent>) => {
      e.cancelBubble = state.currentTool.id !== "move" && !state.isPanning;

      if (state.currentTool.id === "move" && !state.isPanning) {
        state.toggleSelectShape(data.id, {
          isMultiSelect: e.evt.shiftKey,
        });
      }
    },
    onTransform: handleTransform,
    onDragMove: (e: KonvaEventObject<DragEvent>) => {
      e.cancelBubble = state.currentTool.id !== "move" && !state.isPanning;
      onDragMove?.(e);
    },
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
        radiusX={data.width ? Math.abs(data.width) / 2 : 0}
        radiusY={data.height ? Math.abs(data.height) / 2 : 0}
      />
    );
  }

  if (data.type === "text") {
    const isPending = state.pendingShapeId === data.id;

    return (
      <Text
        {...data}
        {...commonProps}
        width={undefined}
        height={undefined}
        opacity={isPending ? 0 : 1}
        onDblClick={() => state.setPendingShapeId(data.id)}
        onDblTap={() => state.setPendingShapeId(data.id)}
      />
    );
  }

  return null;
}
