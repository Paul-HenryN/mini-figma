import { useEffect, useReducer, useRef } from "react";
import { Stage, Layer, Rect, Ellipse, Text } from "react-konva";
import { useAppContext } from "./context";
import type Konva from "konva";
import { cx } from "class-variance-authority";
import type { Tool } from "./types";

const fill = "lightgray";
const fontSize = 48;
const fontFamily = "Arial";
const fontStyle = "normal";
const lineHeight = 1;
const letterSpacing = 0;
const textDecoration = "";

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
    }
  | {
      id: string;
      type: "text";
      x: number;
      y: number;
      text: string;
      fill: string;
      fontSize: number;
      fontFamily: string;
      fontStyle: string;
      lineHeight: number;
      letterSpacing: number;
      textDecoration: string;
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
      dx: number;
      dy: number;
    }
  | { type: "CONFIRM_PENDING_SHAPE" }
  | { type: "ENABLE_PANNING" }
  | { type: "DISABLE_PANNING" }
  | { type: "INPUT_PENDING_TEXT"; text: string };

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

    if (pendingShape?.type === "text") {
      dispatch({ type: "CONFIRM_PENDING_SHAPE" });
      return;
    }

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

    dispatch({ type: "SCALE_PENDING_SHAPE", dx, dy });
  };
  const handleMouseUp = () => {
    if (pendingShape?.type !== "text") {
      dispatch({ type: "CONFIRM_PENDING_SHAPE" });
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
        <Layer>
          {pendingShape && pendingShape?.type !== "text" && (
            <Shape data={pendingShape} />
          )}

          {shapes.map((shape) => (
            <Shape key={shape.id} data={shape} />
          ))}
        </Layer>
      </Stage>
    </>
  );
}

function Shape({ data }: { data: ShapeData }) {
  if (data.type === "rectangle") {
    return <Rect {...data} />;
  }
  if (data.type === "ellipse") {
    return <Ellipse {...data} />;
  }
  if (data.type === "text") {
    return <Text {...data} />;
  }
  return null;
}

function PendingTextArea({
  textShape,
  stage,
  onTextChange,
}: {
  textShape: Extract<ShapeData, { type: "text" }>;
  stage: Konva.Stage;
  onTextChange: (value: string) => void;
}) {
  const { x, y } = stage
    .getAbsoluteTransform()
    .point({ x: textShape.x, y: textShape.y });

  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const splittedText = textShape.text.split("\n");
  const lineLengths = splittedText.map((l) => l.length);

  const cols = Math.max(...lineLengths);
  const rows = splittedText.length;

  useEffect(() => {
    const id = setTimeout(() => textAreaRef.current?.focus(), 0);
    return () => clearTimeout(id);
  }, []);

  return (
    <textarea
      ref={textAreaRef}
      value={textShape.text}
      cols={cols || 1}
      rows={rows || 1}
      className={cx(
        "resize-none overflow-hidden outline-0 border-none",
        textShape.text && "outline-1 outline-blue-600"
      )}
      onChange={(e) => onTextChange(e.target.value)}
      style={{
        position: "absolute",
        left: x,
        top: y,
        zIndex: 100,
        fontSize: `${textShape.fontSize * stage.scaleX()}px`,
        fontFamily: textShape.fontFamily,
        lineHeight: textShape.lineHeight,
        letterSpacing: textShape.letterSpacing * stage.scaleX(),
        textDecoration: textShape.textDecoration,
        fontStyle: textShape.fontStyle,
        color: textShape.fill,
      }}
    />
  );
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

    if (state.pendingShape.type === "text") {
      const text = state.pendingShape.text.trim();

      if (text) {
        return {
          ...state,
          pendingShape: null,
          shapes: [{ ...state.pendingShape, text }, ...state.shapes],
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
      shapes: [state.pendingShape, ...state.shapes],
    };
  }

  if (action.type === "ENABLE_PANNING") {
    return { ...state, isPanning: true };
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

  throw new Error(`Unknown Action Type`);
}
