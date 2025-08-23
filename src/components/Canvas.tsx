import { useEffect, useRef } from "react";
import { Stage, Layer, Transformer } from "react-konva";
import { useAppContext } from "../context";
import type Konva from "konva";
import { cx } from "class-variance-authority";
import { DEFAULT_COLOR, UI_COLOR, ZOOM_FACTOR } from "../const";
import { Shape } from "./Shape";
import { PendingTextInput } from "./PendingTextInput";
import type { ShapeData, Tool } from "@/types";
import { ParticipantCursor } from "./ParticipantCursor";

const fill = DEFAULT_COLOR;
const fontSize = 24;
const fontFamily = "Arial";
const fontStyle = "normal";
const lineHeight = 1;
const letterSpacing = 0;
const textDecoration = "";

export function Canvas() {
  const {
    state: {
      shapes,
      shapesSelectedByClientId,
      pendingShapeId,
      scale,
      isPanning,
      currentTool,
      clientId,
      participants,
    },
    dispatch,
  } = useAppContext();

  const stageRef = useRef<Konva.Stage>(null);
  const transformerRefs = useRef<(Konva.Transformer | null)[]>([]);
  const layerRef = useRef<Konva.Layer>(null);
  const pendingShape = shapes.find((shape) => shape.id === pendingShapeId);

  const handleMouseDown = () => {
    if (!stageRef.current) return;

    const pointerPos = stageRef.current.getPointerPosition();
    if (!pointerPos) return;

    const transform = stageRef.current.getAbsoluteTransform().copy().invert();
    const pos = transform.point(pointerPos);

    const newShape = initializeShape({
      currentToolId: currentTool.id,
      shapes: shapes,
      initX: pos.x,
      initY: pos.y,
    });

    if (newShape && !isPanning && !pendingShape) {
      dispatch({
        type: "START_CREATING_SHAPE",
        newShape,
      });
    }

    if (currentTool.id === "move") {
      dispatch({
        type: "UNSELECT_ALL",
      });
    }
  };

  const handleMouseMove = () => {
    if (!stageRef.current) return;

    const pointerPos = stageRef.current.getRelativePointerPosition();

    dispatch({
      type: "UPDATE_CURSOR_POSITION",
      cursorPosition: pointerPos,
    });

    if (!pointerPos || !pendingShape) return;

    const transform = stageRef.current.getAbsoluteTransform().copy().invert();
    const pos = transform.point(pointerPos);

    const dx = pos.x - pendingShape.x;
    const dy = pos.y - pendingShape.y;

    const resizedShape = getResizedShape({
      shape: pendingShape,
      newWidth: dx,
      newHeight: dy,
    });

    dispatch({
      type: "UPDATE_SHAPE",
      shapeId: pendingShape.id,
      data: resizedShape,
    });
  };

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const newScale =
      e.evt.deltaY < 0 ? scale * ZOOM_FACTOR : scale / ZOOM_FACTOR;
    dispatch({ type: "CHANGE_SCALE", scale: newScale });
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

      dispatch({
        type: "UPDATE_SHAPE",
        shapeId: node.id(),
        data: {
          x: updatedX,
          y: updatedY,
          width: updatedWith,
          height: updatedHeight,
          offsetX: -updatedWith / 2,
          offsetY: -updatedHeight / 2,
        },
      });

      return;
    }

    dispatch({
      type: "UPDATE_SHAPE",
      shapeId: node.id(),
      data: {
        x: updatedX,
        y: updatedY,
        width: updatedWith,
        height: updatedHeight,
      },
    });
  };

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;

    const updatedX = Math.round(node.x());
    const updatedY = Math.round(node.y());

    node.x(updatedX);
    node.y(updatedY);

    dispatch({
      type: "UPDATE_SHAPE",
      shapeId: node.id(),
      data: { x: updatedX, y: updatedY },
    });
  };

  const handleMouseUp = () => {
    if (pendingShape && pendingShape.type !== "text") {
      dispatch({ type: "CONFIRM_PENDING_SHAPE" });
    }
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

    stageRef.current.scale({ x: scale, y: scale });

    const newPos = {
      x: pointerPos.x - mousePointTo.x * scale,
      y: pointerPos.y - mousePointTo.y * scale,
    };

    stageRef.current.position(newPos);
  }, [scale]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (pendingShapeId) return;

      if (e.key === " ") dispatch({ type: "ENABLE_PANNING" });

      if (e.key === "Backspace") dispatch({ type: "DELETE" });
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === " ") dispatch({ type: "DISABLE_PANNING" });
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [pendingShapeId]);

  useEffect(() => {
    transformerRefs.current = transformerRefs.current.slice(
      0,
      Object.keys(shapesSelectedByClientId).length
    );
  }, [shapesSelectedByClientId]);

  useEffect(() => {
    if (!layerRef.current) return;

    transformerRefs.current.forEach((transformer, i) => {
      if (!transformer || !layerRef.current) return;

      const selectedShapes = Object.values(shapesSelectedByClientId)[i] || [];

      const selectedNodes = layerRef.current.children.filter((child) => {
        const id = child.getAttrs().id;
        return id && selectedShapes.includes(id);
      });

      transformer.nodes(selectedNodes);
    });
  }, [shapesSelectedByClientId]);

  return (
    <>
      <Stage
        width={window.innerWidth}
        height={window.innerHeight}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onWheel={handleWheel}
        onMouseUp={handleMouseUp}
        draggable={isPanning}
        ref={stageRef}
        className={cx("cursor-none")}
      >
        <Layer ref={layerRef}>
          {shapes.map((shape) => (
            <Shape
              key={shape.id}
              data={shape}
              isPending={pendingShapeId === shape.id}
              onClick={(e) => {
                if (currentTool.id === "move") {
                  dispatch({
                    type: "TOGGLE_SELECT",
                    shapeId: shape.id,
                    multiSelectEnabled: e.evt.shiftKey,
                  });
                }
              }}
              onTransform={handleTransform}
              draggable={
                shapesSelectedByClientId[clientId]?.includes(shape.id) &&
                currentTool.id === "move"
              }
              stopPropagation={currentTool.id === "move"}
              onDragMove={handleDragMove}
            />
          ))}

          {Object.keys(shapesSelectedByClientId).map((selectingclientId, i) => {
            const isCurrentClient = selectingclientId === clientId;
            const participant = participants.find(
              (p) => p.clientId === selectingclientId
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
                anchorStroke={isCurrentClient ? UI_COLOR : participant?.color}
                anchorSize={15}
              />
            );
          })}
        </Layer>
      </Stage>

      {participants.map(
        (participant) =>
          stageRef.current && (
            <ParticipantCursor
              key={participant.clientId}
              participant={participant}
              stage={stageRef.current}
              isCurrentParticipant={participant.clientId === clientId}
            />
          )
      )}

      {pendingShape && pendingShape?.type === "text" && stageRef.current && (
        <PendingTextInput
          textShape={pendingShape}
          stage={stageRef.current}
          onTextChange={(text) =>
            dispatch({
              type: "UPDATE_SHAPE",
              shapeId: pendingShape.id,
              data: { text, name: text },
            })
          }
          OnBlur={() => dispatch({ type: "CONFIRM_PENDING_SHAPE" })}
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

function getResizedShape({
  shape,
  newWidth,
  newHeight,
}: {
  shape: ShapeData;
  newWidth: number;
  newHeight: number;
}): ShapeData {
  switch (shape.type) {
    case "rectangle":
      return {
        ...shape,
        width: newWidth,
        height: newHeight,
      };
    case "ellipse":
      return {
        ...shape,
        width: Math.abs(newWidth),
        height: Math.abs(newHeight),
        offsetX: newWidth ? -newWidth / 2 : shape.offsetX,
        offsetY: newHeight ? -newHeight / 2 : shape.offsetY,
      };
    default:
      return shape;
  }
}
