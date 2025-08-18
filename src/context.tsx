import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
  type ActionDispatch,
} from "react";
import type { ShapeData, Tool } from "./types";
import { APP_TOOLS, DEFAULT_COLOR, MAX_ZOOM, MIN_ZOOM } from "./const";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

const fill = DEFAULT_COLOR;
const fontSize = 24;
const fontFamily = "Arial";
const fontStyle = "normal";
const lineHeight = 1;
const letterSpacing = 0;
const textDecoration = "";

type AppState = {
  roomId?: string;
  currentTool: Tool;
  scale: number;
  shapes: ShapeData[];
  pendingShapeId: ShapeData["id"] | null;
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
      type: "TOGGLE_SELECT";
      shapeId: ShapeData["id"];
      multiSelectEnabled?: boolean;
    }
  | { type: "UNSELECT_ALL" }
  | { type: "CHANGE_SCALE"; scale: number }
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
      type: "MOVE";
      x?: number;
      y?: number;
    }
  | {
      type: "UPDATE_SHAPE";
      shapeId: ShapeData["id"];
      data: Record<string, number | string>;
    }
  | {
      type: "DELETE";
      shapeId?: ShapeData["id"];
    }
  | { type: "SYNC_SHAPES"; shapes: ShapeData[] };

type AppContextType = {
  state: AppState;
  dispatch: ActionDispatch<[action: AppAction]>;
};

const DEFAULT_STATE: AppState = {
  currentTool: APP_TOOLS.MOVE,
  scale: 1,
  shapes: [],
  pendingShapeId: null,
  selectedShapes: [],
  isPanning: false,
};

const AppContext = createContext<AppContextType>({
  state: DEFAULT_STATE,
  dispatch: () => {},
});

export function AppContextProvider({
  children,
  roomId,
}: {
  children: React.ReactNode;
  roomId: string;
}) {
  const [state, dispatch] = useReducer(reducer, DEFAULT_STATE);
  const yDocRef = useRef<Y.Doc>(new Y.Doc());
  const wsProviderRef = useRef<WebsocketProvider | null>(null);

  useEffect(() => {
    if (!roomId) return;

    wsProviderRef.current = new WebsocketProvider(
      "ws://localhost:1234",
      roomId,
      yDocRef.current
    );

    wsProviderRef.current.on("status", (event) => {
      console.log("Websocket status:", event.status);
    });

    const syncedShapes = yDocRef.current.getArray<ShapeData>("shapes");

    const observer = (e: Y.YArrayEvent<ShapeData>) => {
      console.log(e.target.toArray());
      const hasChanges =
        JSON.stringify(e.target.toArray()) !== JSON.stringify(state.shapes);

      if (hasChanges) {
        dispatch({ type: "SYNC_SHAPES", shapes: e.target.toArray() });
      }
    };

    syncedShapes.observe(observer);

    return () => {
      if (wsProviderRef.current && wsProviderRef.current.wsconnected) {
        wsProviderRef.current.destroy();
      }

      syncedShapes.unobserve(observer);
      yDocRef.current.destroy();
    };
  }, []);

  useEffect(() => {
    const syncedShapes = yDocRef.current.getArray<ShapeData>("shapes");
    const hasChanges =
      JSON.stringify(syncedShapes.toArray()) !== JSON.stringify(state.shapes);

    if (hasChanges) {
      yDocRef.current.transact(() => {
        syncedShapes.delete(0, syncedShapes.length);
        syncedShapes.push(state.shapes);
      });
    }
  }, [state.shapes]);

  return (
    <AppContext.Provider
      value={{
        state: { ...state, roomId },
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
        const rectangleIndex =
          state.shapes.filter((shape) => shape.type === "rectangle").length + 1;

        newShape = {
          type: "rectangle",
          id,
          name: `Rectangle ${rectangleIndex}`,
          x,
          y,
          fill,
          width: 0,
          height: 0,
        };
        break;
      case "ellipse":
        const ellipseIndex =
          state.shapes.filter((shape) => shape.type === "ellipse").length + 1;

        newShape = {
          type: "ellipse",
          id,
          name: `Ellipse ${ellipseIndex}`,
          x,
          y,
          fill,
          width: 0,
          height: 0,
        };
        break;
      case "text":
        newShape = {
          type: "text",
          id,
          name: "",
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
      pendingShapeId: newShape ? newShape.id : null,
      shapes: newShape ? [...state.shapes, newShape] : state.shapes,
      selectedShapes: newShape ? [id] : state.selectedShapes,
    };
  }

  if (action.type === "SCALE_PENDING_SHAPE") {
    if (!state.pendingShapeId) return state;

    const { dx, dy } = action;

    const updatedShapes = state.shapes.map((shape) => {
      if (shape.id === state.pendingShapeId) {
        switch (shape.type) {
          case "rectangle":
            return { ...shape, width: dx, height: dy };
          case "ellipse":
            return { ...shape, width: Math.abs(dx), height: Math.abs(dy) };
          default:
            return shape;
        }
      }

      return shape;
    });

    return { ...state, shapes: updatedShapes };
  }

  if (action.type === "CONFIRM_PENDING_SHAPE") {
    return {
      ...state,
      pendingShapeId: null,
      currentTool: APP_TOOLS.MOVE,
      selectedShapes: state.pendingShapeId ? [state.pendingShapeId] : [],
    };
  }

  if (action.type === "ENABLE_PANNING") {
    return { ...state, isPanning: true };
  }

  if (action.type === "DISABLE_PANNING") {
    return { ...state, isPanning: false };
  }

  if (action.type === "TOGGLE_SELECT") {
    const { multiSelectEnabled, shapeId } = action;

    if (multiSelectEnabled) {
      if (state.selectedShapes.includes(shapeId)) {
        return {
          ...state,
          selectedShapes: state.selectedShapes.filter((id) => id !== shapeId),
        };
      }

      return { ...state, selectedShapes: [...state.selectedShapes, shapeId] };
    }

    return { ...state, selectedShapes: [shapeId] };
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

  if (action.type === "MOVE") {
    return {
      ...state,
      shapes: state.shapes.map((shape) => {
        if (state.selectedShapes.includes(shape.id)) {
          return { ...shape, x: action.x || shape.x, y: action.y || shape.y };
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

  if (action.type === "DELETE") {
    return {
      ...state,
      shapes: state.shapes.filter((shape) =>
        action.shapeId
          ? shape.id !== action.shapeId
          : !state.selectedShapes.includes(shape.id)
      ),
      selectedShapes: [],
    };
  }

  if (action.type === "SYNC_SHAPES") {
    return {
      ...state,
      shapes: action.shapes,
    };
  }

  throw new Error(`Unknown Action Type`);
}
