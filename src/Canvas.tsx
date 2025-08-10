import { useEffect, useReducer, useRef } from "react";
import { Stage, Layer, Transformer } from "react-konva";
import { useAppContext } from "./context";
import type Konva from "konva";
import { cx } from "class-variance-authority";
import type { ShapeData, Tool } from "./types";
import { APP_TOOLS } from "./const";
import { Shape } from "./Shape";
import { PendingTextArea } from "./PendingTextArea";

const fill = "lightgray";
const fontSize = 24;
const fontFamily = "Arial";
const fontStyle = "normal";
const lineHeight = 1;
const letterSpacing = 0;
const textDecoration = "";

type CanvasState = {
  pendingShape: ShapeData | null;
  shapes: ShapeData[];
  isPanning: boolean;
  selectedShapes: ShapeData["id"][];
};
type CanvasAction =
  | {
      type: "CREATE_PENDING_SHAPE";
      tool: Tool["id"];
      x: number;
      y: number;
    }
  | {
      type: "SCALE_PENDING_SHAPE";
      dx: number;
      dy: number;
    }
  | { type: "CONFIRM_PENDING_SHAPE" }
  | { type: "ENABLE_PANNING" }
  | { type: "DISABLE_PANNING" }
  | { type: "INPUT_PENDING_TEXT"; text: string }
  | {
      type: "SELECT_SHAPE";
      shape: ShapeData;
      multiSelectEnabled: boolean;
    }
  | { type: "UNSELECT_ALL" };

export function Canvas() {
  const { currentTool, setCurrentTool, scale, onZoom } = useAppContext();

  const [{ pendingShape, shapes, isPanning, selectedShapes }, dispatch] =
    useReducer(reducer, {
      pendingShape: null,
      shapes: [],
      isPanning: false,
      selectedShapes: [],
    });
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const layerRef = useRef<Konva.Layer>(null);

  const handleMouseDown = () => {
    if (!stageRef.current) return;

    if (pendingShape?.type === "text") {
      dispatch({ type: "CONFIRM_PENDING_SHAPE" });
      setCurrentTool(APP_TOOLS.MOVE);
      return;
    }

    dispatch({ type: "UNSELECT_ALL" });

    const pointerPos = stageRef.current.getPointerPosition();
    if (!pointerPos) return;

    const transform = stageRef.current.getAbsoluteTransform().copy().invert();
    const pos = transform.point(pointerPos);

    dispatch({
      type: "CREATE_PENDING_SHAPE",
      tool: currentTool.id,
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

    dispatch({ type: "SCALE_PENDING_SHAPE", dx, dy });
  };
  const handleMouseUp = () => {
    if (pendingShape && pendingShape?.type !== "text") {
      dispatch({ type: "CONFIRM_PENDING_SHAPE" });
      setCurrentTool(APP_TOOLS.MOVE);
    }
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
          {pendingShape && pendingShape?.type !== "text" && (
            <Shape data={pendingShape} />
          )}

          {shapes.map((shape) => (
            <Shape
              key={shape.id}
              data={shape}
              onClick={({ multiSelectEnabled }) => {
                if (!transformerRef.current) return;

                dispatch({
                  type: "SELECT_SHAPE",
                  shape,
                  multiSelectEnabled,
                });
              }}
              isSelected={selectedShapes.includes(shape.id)}
            />
          ))}

          <Transformer
            ref={transformerRef}
            onMouseDown={(e) => (e.cancelBubble = true)}
          />
        </Layer>
      </Stage>
    </>
  );
}

function reducer(state: CanvasState, action: CanvasAction): CanvasState {
  if (action.type === "CREATE_PENDING_SHAPE") {
    if (state.isPanning) return state;

    const { tool, x, y } = action;
    let newShape: ShapeData | null = null;

    const id = crypto.randomUUID();

    switch (tool) {
      case "rectangle":
        newShape = { type: "rectangle", id, x, y, fill, width: 0, height: 0 };
        break;
      case "ellipse":
        newShape = { type: "ellipse", id, x, y, fill, radiusX: 0, radiusY: 0 };
        break;
      case "text":
        newShape = {
          type: "text",
          id,
          x,
          y,
          fill,
          text: "",
          fontSize,
          fontFamily,
          fontStyle,
          letterSpacing,
          lineHeight,
          textDecoration,
        };
        break;
      default:
        break;
    }

    return {
      ...state,
      pendingShape: newShape,
      selectedShapes: newShape ? [id] : state.selectedShapes,
    };
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
      case "text":
        scaledPendingShape = state.pendingShape;
        break;
      default:
        break;
    }

    return { ...state, pendingShape: scaledPendingShape };
  }

  if (action.type === "CONFIRM_PENDING_SHAPE") {
    if (!state.pendingShape) return state;

    // Generate a new ID for the confirmed shape
    const id = crypto.randomUUID();

    if (state.pendingShape.type === "text") {
      const text = state.pendingShape.text.trim();

      if (text) {
        return {
          ...state,
          pendingShape: null,
          shapes: [{ ...state.pendingShape, text, id }, ...state.shapes],
          selectedShapes: [id],
        };
      }

      return {
        ...state,
        pendingShape: null,
      };
    }

    return {
      ...state,
      pendingShape: null,
      shapes: [{ ...state.pendingShape, id }, ...state.shapes],
      selectedShapes: [id],
    };
  }

  if (action.type === "ENABLE_PANNING") {
    return { ...state, isPanning: !state.pendingShape };
  }

  if (action.type === "DISABLE_PANNING") {
    return { ...state, isPanning: false };
  }

  if (action.type === "INPUT_PENDING_TEXT") {
    if (state.pendingShape?.type !== "text") return state;

    const updatedShape = {
      ...state.pendingShape,
      text: action.text,
    };

    return { ...state, pendingShape: updatedShape };
  }

  if (action.type === "SELECT_SHAPE") {
    const { multiSelectEnabled, shape } = action;

    if (multiSelectEnabled) {
      return { ...state, selectedShapes: [...state.selectedShapes, shape.id] };
    }

    return { ...state, selectedShapes: [shape.id] };
  }

  if (action.type === "UNSELECT_ALL") {
    return { ...state, selectedShapes: [] };
  }

  throw new Error(`Unknown Action Type`);
}
