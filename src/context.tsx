import React, {
  createContext,
  useContext,
  useReducer,
  type ActionDispatch,
} from "react";
import type { ShapeData, Tool } from "./types";
import { APP_TOOLS, DEFAULT_COLOR, MAX_ZOOM, MIN_ZOOM } from "./const";

const fill = DEFAULT_COLOR;
const fontSize = 24;
const fontFamily = "Arial";
const fontStyle = "normal";
const lineHeight = 1;
const letterSpacing = 0;
const textDecoration = "";

type AppState = {
  currentTool: Tool;
  scale: number;
  shapes: ShapeData[];
  pendingShape: ShapeData | null;
  selectedShapes: ShapeData["id"][];
  isPanning: boolean;
};
type AppAction =
  | {
      type: "CHANGE_TOOL";
      tool: Tool;
    }
  | {
      type: "START_CREATING_SHAPE";
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
  | { type: "UNSELECT_ALL" }
  | { type: "CHANGE_SCALE"; scale: number }
  | { type: "MOVE_SHAPE"; shapeId: ShapeData["id"]; x: number; y: number }
  | { type: "CHANGE_COLOR"; color: string | undefined }
  | {
      type: "CHANGE_STROKE";
      color: string | undefined;
      width: number | undefined;
    }
  | {
      type: "RESIZE";
      width?: number;
      height?: number;
    }
  | {
      type: "UPDATE_SHAPE";
      shapeId: ShapeData["id"];
      data: Record<string, number | string>;
    };

type AppContextType = {
  state: AppState;
  dispatch: ActionDispatch<[action: AppAction]>;
};

const DEFAULT_STATE = {
  currentTool: APP_TOOLS.MOVE,
  scale: 1,
  shapes: [],
  pendingShape: null,
  selectedShapes: [],
  isPanning: false,
};

const AppContext = createContext<AppContextType>({
  state: DEFAULT_STATE,
  dispatch: () => {},
});

export function AppContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, dispatch] = useReducer(reducer, DEFAULT_STATE);

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}

function reducer(state: AppState, action: AppAction): AppState {
  if (action.type === "CHANGE_TOOL") {
    return { ...state, currentTool: action.tool };
  }

  if (action.type === "START_CREATING_SHAPE") {
    const { x, y } = action;
    let newShape: ShapeData | null = null;

    const id = crypto.randomUUID();

    switch (state.currentTool.id) {
      case "rectangle":
        newShape = { type: "rectangle", id, x, y, fill, width: 0, height: 0 };
        break;
      case "ellipse":
        newShape = { type: "ellipse", id, x, y, fill, width: 0, height: 0 };
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
          width: Math.abs(dx),
          height: Math.abs(dy),
          offsetX: -dx / 2,
          offsetY: -dy / 2,
        };
        break;
      default:
        scaledPendingShape = state.pendingShape;
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
          currentTool: APP_TOOLS.MOVE,
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
      shapes: [...state.shapes, { ...state.pendingShape, id }],
      selectedShapes: [id],
      currentTool: APP_TOOLS.MOVE,
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

  if (action.type === "CHANGE_SCALE") {
    return {
      ...state,
      scale: Math.max(MIN_ZOOM, Math.min(action.scale, MAX_ZOOM)),
    };
  }

  if (action.type === "MOVE_SHAPE") {
    return {
      ...state,
      shapes: state.shapes.map((shape) => {
        if (shape.id === action.shapeId) {
          return { ...shape, x: action.x, y: action.y };
        }

        return shape;
      }),
    };
  }

  if (action.type === "CHANGE_COLOR") {
    if (state.selectedShapes.length === 0) return state;

    return {
      ...state,
      shapes: state.shapes.map((shape) => {
        if (state.selectedShapes.includes(shape.id)) {
          return { ...shape, fill: action.color };
        }

        return shape;
      }),
    };
  }

  if (action.type === "CHANGE_STROKE") {
    if (state.selectedShapes.length === 0) return state;

    return {
      ...state,
      shapes: state.shapes.map((shape) => {
        if (state.selectedShapes.includes(shape.id)) {
          return { ...shape, stroke: action.color, strokeWidth: action.width };
        }

        return shape;
      }),
    };
  }

  if (action.type === "UPDATE_SHAPE") {
    return {
      ...state,
      shapes: state.shapes.map((shape) => {
        if (shape.id === action.shapeId) {
          return { ...shape, ...action.data };
        }

        return shape;
      }),
    };
  }

  if (action.type === "RESIZE") {
    return {
      ...state,
      shapes: state.shapes.map((shape) => {
        if (state.selectedShapes.includes(shape.id)) {
          switch (shape.type) {
            case "rectangle":
              return {
                ...shape,
                width: action.width || shape.width,
                height: action.height || shape.height,
              };
            case "ellipse":
              return {
                ...shape,
                width: action.width || shape.width,
                height: action.height || shape.height,
                offsetX: action.width ? -action.width / 2 : shape.offsetX,
                offsetY: action.height ? -action.height / 2 : shape.offsetY,
              };
            default:
              return shape;
          }
        }

        return shape;
      }),
    };
  }

  throw new Error(`Unknown Action Type`);
}
