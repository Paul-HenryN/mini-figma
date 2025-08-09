import { useEffect, useReducer, useRef } from "react";
import { Stage, Layer, Rect, Ellipse } from "react-konva";
import { useAppContext } from "./context";
import React from "react";
import type Konva from "konva";
import { cx } from "class-variance-authority";
import type { Tool } from "./types";

const fill = "lightgray";

type ShapeData =
  | {
      id: string;
      type: "rectangle";
      x: number;
      y: number;
      width: number;
      height: number;
      fill: string;
    }
  | {
      id: string;
      type: "ellipse";
      x: number;
      y: number;
      radiusX: number;
      radiusY: number;
      fill: string;
      offsetX?: number;
      offsetY?: number;
    };

type CanvasState = {
  pendingShape: ShapeData | null;
  shapes: ShapeData[];
  isPanning: boolean;
};
type CanvasAction =
  | {
      type: "CREATE_PENDING_SHAPE";
      tool: Tool["id"];
      id: string;
      x: number;
      y: number;
    }
  | {
      type: "SCALE_PENDING_SHAPE";
      tool: Tool["id"];
      dx: number;
      dy: number;
    }
  | { type: "CONFIRM_PENDING_SHAPE" }
  | { type: "ENABLE_PANNING" }
  | { type: "DISABLE_PANNING" };

export function Canvas() {
  const { currentTool, scale, onZoom } = useAppContext();

  const [{ pendingShape, shapes, isPanning }, dispatch] = useReducer(reducer, {
    pendingShape: null,
    shapes: [],
    isPanning: false,
  });
  const stageRef = useRef<Konva.Stage>(null);

  const handleMouseDown = () => {
    if (!stageRef.current) return;

    const pointerPos = stageRef.current.getPointerPosition();
    if (!pointerPos) return;

    const transform = stageRef.current.getAbsoluteTransform().copy().invert();
    const pos = transform.point(pointerPos);

    const id = crypto.randomUUID();

    dispatch({
      type: "CREATE_PENDING_SHAPE",
      tool: currentTool.id,
      id,
      x: pos.x,
      y: pos.y,
    });
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

    dispatch({ type: "SCALE_PENDING_SHAPE", tool: currentTool.id, dx, dy });
  };
  const handleMouseUp = () => {
    dispatch({ type: "CONFIRM_PENDING_SHAPE" });
  };
  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    onZoom({ isZoomIn: e.evt.deltaY < 0 });
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
      if (e.key === " ") dispatch({ type: "ENABLE_PANNING" });
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
  }, []);

  return (
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
      <Layer>
        {pendingShape && displayShape(pendingShape)}
        {shapes.map((shape) => (
          <React.Fragment key={shape.id}>{displayShape(shape)}</React.Fragment>
        ))}
      </Layer>
    </Stage>
  );
}

function displayShape(shape: ShapeData) {
  if (shape.type === "rectangle") {
    return <Rect {...shape} />;
  }
  if (shape.type === "ellipse") {
    return <Ellipse {...shape} />;
  }
  return null;
}

function reducer(state: CanvasState, action: CanvasAction): CanvasState {
  if (action.type === "CREATE_PENDING_SHAPE") {
    if (state.isPanning) return state;

    const { tool, id, x, y } = action;
    let newShape: ShapeData | null = null;

    switch (tool) {
      case "rectangle":
        newShape = { type: "rectangle", id, x, y, fill, width: 0, height: 0 };
        break;
      case "ellipse":
        newShape = { type: "ellipse", id, x, y, fill, radiusX: 0, radiusY: 0 };
        break;
      default:
        break;
    }

    return { ...state, pendingShape: newShape };
  }

  if (action.type === "SCALE_PENDING_SHAPE") {
    if (!state.pendingShape) return state;

    const { dx, dy } = action;

    let scaledPendingShape = null;

    switch (state.pendingShape.type) {
      case "rectangle":
        scaledPendingShape = { ...state.pendingShape, width: dx, height: dy };
        break;
      case "ellipse":
        scaledPendingShape = {
          ...state.pendingShape,
          radiusX: Math.abs(dx) / 2,
          radiusY: Math.abs(dy) / 2,
          offsetX: -dx / 2,
          offsetY: -dy / 2,
        };
        break;
      default:
        break;
    }

    return { ...state, pendingShape: scaledPendingShape };
  }

  if (action.type === "CONFIRM_PENDING_SHAPE") {
    if (!state.pendingShape) return state;

    return {
      ...state,
      pendingShape: null,
      shapes: [state.pendingShape, ...state.shapes],
    };
  }

  if (action.type === "ENABLE_PANNING") {
    return { ...state, isPanning: true };
  }

  if (action.type === "DISABLE_PANNING") {
    return { ...state, isPanning: false };
  }

  throw new Error(`Unknown Action Type`);
}
