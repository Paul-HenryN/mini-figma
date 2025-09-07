import { Stage as KonvaStage, Layer, Transformer } from "react-konva";
import type Konva from "konva";
import { useStore } from "@/store";
import { UI_COLOR, ZOOM_FACTOR } from "@/const";

import { useEffect, useRef } from "react";
import { useShallow } from "zustand/shallow";
import { Shape } from "../Shape";

export function Stage({ ref }: { ref: React.RefObject<Konva.Stage | null> }) {
  const state = useStore(
    useShallow((state) => ({
      isPanning: state.isPanning,
      shapes: state.shapes,
      pendingShapeId: state.pendingShapeId,
      currentParticipantId: state.currentParticipantId,
      selectedShapeIds: state.selectedShapeIds,
      scale: state.scale,
      participants: state.participants,
      updateLocalCursorPosition: state.updateLocalCursorPosition,
      changeScale: state.changeScale,
      syncShapeData: state.syncShapeData,
      unselectAll: state.unselectAll,
      resizeShapes: state.resizeShapes,
      addShape: state.addShape,
      confirmPendingShape: state.confirmPendingShape,
      toggleSelectShape: state.toggleSelectShape,
    }))
  );

  const layerRef = useRef<Konva.Layer>(null);

  const transformerRefs = useRef<(Konva.Transformer | null)[]>([]);

  const pendingShape = state.shapes.find(
    (shape) => shape.id === state.pendingShapeId
  );

  const handleMouseDown = () => {
    if (!ref.current) return;
    if (state.isPanning) return;

    state.unselectAll();

    const pointerPos = ref.current.getRelativePointerPosition();
    if (!pointerPos) return;

    if (!pendingShape) {
      state.addShape(pointerPos.x, pointerPos.y);
    }
  };

  const handleMouseMove = () => {
    if (!ref.current) return;

    const pointerPos = ref.current.getRelativePointerPosition();

    state.updateLocalCursorPosition(pointerPos);

    if (!pointerPos || !pendingShape || pendingShape.type === "text") return;

    const dx = pointerPos.x - pendingShape.x;
    const dy = pointerPos.y - pendingShape.y;

    state.resizeShapes([pendingShape.id], {
      width: Math.round(dx),
      height: Math.round(dy),
    });
  };

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();

    const newScale =
      e.evt.deltaY < 0 ? state.scale * ZOOM_FACTOR : state.scale / ZOOM_FACTOR;

    state.changeScale(newScale);
  };

  const handleMouseUp = () => {
    if (pendingShape && pendingShape.type !== "text") {
      state.confirmPendingShape();
    }
  };

  const handleMouseLeave = () => {
    state.updateLocalCursorPosition(null);
  };

  const handleShapeDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;

    const updatedX = Math.round(node.x());
    const updatedY = Math.round(node.y());

    node.x(updatedX);
    node.y(updatedY);

    state.syncShapeData(node.id(), { x: updatedX, y: updatedY });

    const pointerPos = ref.current?.getRelativePointerPosition();
    if (!pointerPos) return;

    state.updateLocalCursorPosition(pointerPos);
  };

  const handleStageDragMove = () => {
    const pointerPos = ref.current?.getRelativePointerPosition();
    if (!pointerPos) return;

    state.updateLocalCursorPosition(pointerPos);
  };

  useEffect(() => {
    transformerRefs.current = transformerRefs.current.slice(
      0,
      Object.keys(state.selectedShapeIds).length
    );
  }, [Object.keys(state.selectedShapeIds).length]);

  useEffect(() => {
    if (!layerRef.current) return;

    transformerRefs.current.forEach((transformer, i) => {
      if (!transformer || !layerRef.current) return;

      const selectedShapeIds = Object.values(state.selectedShapeIds)[i];

      const selectedNodes = layerRef.current.children.filter((child) => {
        const id = child.getAttrs().id;
        return id && selectedShapeIds.includes(id);
      });

      transformer.nodes(selectedNodes);
    });
  }, [state.selectedShapeIds]);

  useEffect(() => {
    if (!ref.current) return;

    const oldScale = ref.current.scaleX();

    const pointerPos = ref.current.getPointerPosition();
    if (!pointerPos) return;

    const mousePointTo = {
      x: (pointerPos.x - ref.current.x()) / oldScale,
      y: (pointerPos.y - ref.current.y()) / oldScale,
    };

    ref.current.scale({ x: state.scale, y: state.scale });

    const newPos = {
      x: pointerPos.x - mousePointTo.x * state.scale,
      y: pointerPos.y - mousePointTo.y * state.scale,
    };

    ref.current.position(newPos);
  }, [state.scale]);

  return (
    <KonvaStage
      width={window.innerWidth}
      height={window.innerHeight}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onWheel={handleWheel}
      onMouseUp={handleMouseUp}
      onDragMove={handleStageDragMove}
      draggable={state.isPanning}
      ref={ref}
      className={"cursor-none"}
    >
      <Layer ref={layerRef}>
        {state.shapes.map((shape) => {
          return (
            <Shape
              key={shape.id}
              data={shape}
              onDragMove={handleShapeDragMove}
            />
          );
        })}

        {Object.keys(state.selectedShapeIds).map((selectingclientId, i) => {
          const isCurrentClient =
            state.currentParticipantId !== null &&
            selectingclientId === state.currentParticipantId;

          const currentSelectedShapeIds =
            state.selectedShapeIds[selectingclientId];

          let isText = false;

          if (currentSelectedShapeIds.length === 1) {
            const shape = state.shapes.find(
              (shape) => shape.id === currentSelectedShapeIds[0]
            );
            isText = shape?.type === "text";
          }

          const participant = state.participants.find(
            (p) => p.id === selectingclientId
          );

          return (
            <Transformer
              key={selectingclientId}
              ref={(el) => {
                transformerRefs.current[i] = el;
              }}
              onMouseDown={(e) => (e.cancelBubble = true)}
              rotateEnabled={isCurrentClient}
              resizeEnabled={isCurrentClient && !isText}
              borderStroke={isCurrentClient ? UI_COLOR : participant?.color}
              anchorStroke={UI_COLOR}
              anchorSize={15}
              onTransform={() => {
                const pointerPos = ref.current?.getRelativePointerPosition();
                if (!pointerPos) return;

                state.updateLocalCursorPosition(pointerPos);
              }}
              keepRatio={false}
            />
          );
        })}
      </Layer>
    </KonvaStage>
  );
}
