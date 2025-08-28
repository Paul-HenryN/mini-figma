import { useEffect, useRef } from "react";
import { Stage, Layer, Transformer } from "react-konva";
import type Konva from "konva";
import { DEFAULT_COLOR, UI_COLOR, ZOOM_FACTOR } from "../const";
import { Shape } from "./Shape";
import { PendingTextInput } from "./PendingTextInput";
import type { ShapeData, Tool } from "@/types";
import { ParticipantCursor } from "./ParticipantCursor";
import { useStore } from "@/store";
import { useShallow } from "zustand/react/shallow";

const fill = DEFAULT_COLOR;
const fontSize = 24;
const fontFamily = "Arial";
const fontStyle = "normal";
const lineHeight = 1;
const letterSpacing = 0;
const textDecoration = "";

export function Canvas() {
  const state = useStore(
    useShallow((state) => ({
      shapes: state.shapes,
      pendingShapeId: state.pendingShapeId,
      currentTool: state.currentTool,
      participants: state.participants,
      selectedShapeIds: state.selectedShapeIds,
      currentParticipantId: state.currentParticipantId,
      isPanning: state.isPanning,
      scale: state.scale,
      updateLocalCursorPosition: state.updateLocalCursorPosition,
      changeScale: state.changeScale,
      syncShapeData: state.syncShapeData,
      unselectAll: state.unselectAll,
      toggleSelectShape: state.toggleSelectShape,
      deleteShapes: state.deleteShapes,
      resizeShapes: state.resizeShapes,
      addShape: state.addShape,
      confirmPendingShape: state.confirmPendingShape,
      setPanning: state.setPanning,
    }))
  );

  const stageRef = useRef<Konva.Stage>(null);
  const transformerRefs = useRef<(Konva.Transformer | null)[]>([]);
  const layerRef = useRef<Konva.Layer>(null);

  const pendingShape = state.shapes.find(
    (shape) => shape.id === state.pendingShapeId
  );

  const handleMouseDown = () => {
    if (!stageRef.current) return;
    if (state.isPanning) return;

    const pointerPos = stageRef.current.getRelativePointerPosition();
    if (!pointerPos) return;

    const newShape = initializeShape({
      currentToolId: state.currentTool.id,
      shapes: state.shapes,
      initX: pointerPos.x,
      initY: pointerPos.y,
    });

    if (newShape && !pendingShape) {
      state.addShape(newShape);
    }

    if (state.currentTool.id === "move") {
      state.unselectAll();
    }
  };

  const handleMouseMove = () => {
    if (!stageRef.current) return;

    const pointerPos = stageRef.current.getRelativePointerPosition();

    state.updateLocalCursorPosition(pointerPos);

    if (!pointerPos || !pendingShape) return;

    const dx = pointerPos.x - pendingShape.x;
    const dy = pointerPos.y - pendingShape.y;

    state.resizeShapes([pendingShape.id], {
      width: dx,
      height: dy,
    });
  };

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();

    const newScale =
      e.evt.deltaY < 0 ? state.scale * ZOOM_FACTOR : state.scale / ZOOM_FACTOR;

    state.changeScale(newScale);
  };

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

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;

    const updatedX = Math.round(node.x());
    const updatedY = Math.round(node.y());

    node.x(updatedX);
    node.y(updatedY);

    state.syncShapeData(node.id(), { x: updatedX, y: updatedY });

    const pointerPos = stageRef.current?.getRelativePointerPosition();
    if (!pointerPos) return;

    state.updateLocalCursorPosition(pointerPos);
  };

  const handleMouseUp = () => {
    if (pendingShape && pendingShape.type !== "text") {
      state.confirmPendingShape();
    }
  };

  const handleMouseLeave = () => {
    state.updateLocalCursorPosition(null);
  };

  useEffect(() => {
    if (!stageRef.current) return;

    const oldScale = stageRef.current.scaleX();

    const pointerPos = stageRef.current.getPointerPosition();
    if (!pointerPos) return;

    const mousePointTo = {
      x: (pointerPos.x - stageRef.current.x()) / oldScale,
      y: (pointerPos.y - stageRef.current.y()) / oldScale,
    };

    stageRef.current.scale({ x: state.scale, y: state.scale });

    const newPos = {
      x: pointerPos.x - mousePointTo.x * state.scale,
      y: pointerPos.y - mousePointTo.y * state.scale,
    };

    stageRef.current.position(newPos);
  }, [state.scale]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (state.pendingShapeId) return;

      if (e.key === " ") state.setPanning(true);

      if (e.key === "Backspace") {
        if (!state.currentParticipantId) return;

        const selectedShapeIds =
          state.selectedShapeIds[state.currentParticipantId];

        if (!selectedShapeIds || selectedShapeIds.length === 0) return;

        state.deleteShapes(selectedShapeIds);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === " ") state.setPanning(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [
    state.pendingShapeId,
    state.currentParticipantId,
    state.selectedShapeIds,
  ]);

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

  return (
    <>
      <Stage
        width={window.innerWidth}
        height={window.innerHeight}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
        onMouseUp={handleMouseUp}
        draggable={state.isPanning}
        ref={stageRef}
        className={"cursor-none"}
      >
        <Layer ref={layerRef}>
          {state.shapes.map((shape) => {
            const isSelected =
              state.currentParticipantId !== null &&
              state.selectedShapeIds[state.currentParticipantId]?.includes(
                shape.id
              );

            const isDraggable =
              isSelected && !state.isPanning && state.currentTool.id === "move";

            return (
              <Shape
                key={shape.id}
                data={shape}
                isPending={state.pendingShapeId === shape.id}
                onClick={(e) => {
                  if (state.currentTool.id === "move" && !state.isPanning) {
                    state.toggleSelectShape(shape.id, {
                      isMultiSelect: e.evt.shiftKey,
                    });
                  }
                }}
                onTransform={handleTransform}
                draggable={isDraggable}
                stopPropagation={
                  state.currentTool.id === "move" && !state.isPanning
                }
                onDragMove={handleDragMove}
              />
            );
          })}

          {Object.keys(state.selectedShapeIds).map((selectingclientId, i) => {
            const isCurrentClient =
              state.currentParticipantId !== null &&
              selectingclientId === state.currentParticipantId;

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
                enabledAnchors={isCurrentClient ? undefined : []}
                borderStroke={isCurrentClient ? UI_COLOR : participant?.color}
                anchorStroke={UI_COLOR}
                anchorSize={15}
                onTransform={() => {
                  const pointerPos =
                    stageRef.current?.getRelativePointerPosition();
                  if (!pointerPos) return;

                  state.updateLocalCursorPosition(pointerPos);
                }}
              />
            );
          })}
        </Layer>
      </Stage>

      {state.participants.map(
        (participant) =>
          stageRef.current && (
            <ParticipantCursor
              key={participant.id}
              participant={participant}
              stage={stageRef.current}
              isCurrentParticipant={
                participant.id === state.currentParticipantId
              }
            />
          )
      )}

      {pendingShape && pendingShape?.type === "text" && stageRef.current && (
        <PendingTextInput
          textShape={pendingShape}
          stage={stageRef.current}
          onTextChange={(text) =>
            state.syncShapeData(pendingShape.id, { text, name: text })
          }
          OnBlur={() => state.confirmPendingShape()}
        />
      )}
    </>
  );
}

function initializeShape({
  currentToolId,
  shapes,
  initX,
  initY,
}: {
  currentToolId: Tool["id"];
  shapes: ShapeData[];
  initX: number;
  initY: number;
}): ShapeData | null {
  const id = crypto.randomUUID();

  switch (currentToolId) {
    case "rectangle":
      const rectangleIndex =
        shapes.filter((shape) => shape.type === "rectangle").length + 1;

      return {
        type: "rectangle",
        id,
        name: `Rectangle ${rectangleIndex}`,
        x: initX,
        y: initY,
        fill,
        width: 0,
        height: 0,
      };
    case "ellipse":
      const ellipseIndex =
        shapes.filter((shape) => shape.type === "ellipse").length + 1;

      return {
        type: "ellipse",
        id,
        name: `Ellipse ${ellipseIndex}`,
        x: initX,
        y: initY,
        fill,
        width: 0,
        height: 0,
      };
    case "text":
      return {
        type: "text",
        id,
        name: "",
        x: initX,
        y: initY,
        width: 0,
        height: 0,
        fill,
        text: "",
        fontSize,
        fontFamily,
        fontStyle,
        letterSpacing,
        lineHeight,
        textDecoration,
      };
    default:
      return null;
  }
}
