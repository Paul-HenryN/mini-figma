import { useEffect, useRef } from "react";
import { Stage, Layer, Transformer } from "react-konva";
import { useAppContext } from "./context";
import type Konva from "konva";
import { cx } from "class-variance-authority";
import { Shape } from "./Shape";
import { PendingTextArea } from "./PendingTextArea";
import { ZOOM_FACTOR } from "./const";

export function Canvas() {
  const {
    state: {
      shapes,
      selectedShapes,
      pendingShape,
      scale,
      isPanning,
      currentTool,
    },
    dispatch,
  } = useAppContext();

  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const layerRef = useRef<Konva.Layer>(null);

  const handleMouseDown = () => {
    if (!stageRef.current) return;

    if (pendingShape?.type === "text") {
      dispatch({ type: "CONFIRM_PENDING_SHAPE" });
      return;
    }

    const pointerPos = stageRef.current.getPointerPosition();
    if (!pointerPos) return;

    const transform = stageRef.current.getAbsoluteTransform().copy().invert();
    const pos = transform.point(pointerPos);

    if (!isPanning) {
      dispatch({ type: "UNSELECT_ALL" });
      dispatch({
        type: "START_CREATING_SHAPE",
        x: pos.x,
        y: pos.y,
      });
    }
  };
  const handleMouseMove = () => {
    if (!pendingShape) return;
    if (!stageRef.current) return;

    const pointerPos = stageRef.current.getPointerPosition();
    if (!pointerPos) return;

    const transform = stageRef.current.getAbsoluteTransform().copy().invert();
    const pos = transform.point(pointerPos);

    const dx = pos.x - pendingShape.x;
    const dy = pos.y - pendingShape.y;

    dispatch({ type: "SCALE_PENDING_SHAPE", dx, dy });
  };
  const handleMouseUp = () => {
    if (pendingShape && pendingShape?.type !== "text") {
      dispatch({ type: "CONFIRM_PENDING_SHAPE" });
    }
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
      if (e.key === " " && !pendingShape) dispatch({ type: "ENABLE_PANNING" });
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
  }, [pendingShape]);

  useEffect(() => {
    if (!layerRef.current || !transformerRef.current) return;

    const selectedNodes = layerRef.current.children.filter((child) => {
      const id = child.getAttrs().id;
      return id && selectedShapes.includes(id);
    });

    transformerRef.current.nodes(selectedNodes);
  }, [selectedShapes]);

  return (
    <>
      {pendingShape?.type === "text" && stageRef.current && (
        <PendingTextArea
          textShape={pendingShape}
          stage={stageRef.current}
          onTextChange={(text) =>
            dispatch({ type: "INPUT_PENDING_TEXT", text })
          }
        />
      )}

      <Stage
        width={window.innerWidth}
        height={window.innerHeight}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        draggable={isPanning}
        ref={stageRef}
        className={cx(isPanning && "cursor-grab")}
      >
        <Layer ref={layerRef}>
          {shapes.map((shape) => (
            <Shape
              key={shape.id}
              data={shape}
              onClick={(e) => {
                if (currentTool.id === "move") {
                  dispatch({
                    type: "SELECT_SHAPE",
                    shape,
                    multiSelectEnabled: e.evt.shiftKey,
                  });
                }
              }}
              onTransform={handleTransform}
              draggable={
                selectedShapes.includes(shape.id) && currentTool.id === "move"
              }
              stopPropagation={currentTool.id === "move"}
              onDragMove={(e) =>
                dispatch({
                  type: "MOVE_SHAPE",
                  shapeId: shape.id,
                  x: e.target.x(),
                  y: e.target.y(),
                })
              }
            />
          ))}

          {pendingShape && pendingShape?.type !== "text" && (
            <Shape data={pendingShape} />
          )}

          <Transformer
            ref={transformerRef}
            onMouseDown={(e) => (e.cancelBubble = true)}
          />
        </Layer>
      </Stage>
    </>
  );
}
