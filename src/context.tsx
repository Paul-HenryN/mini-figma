import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  type ActionDispatch,
} from "react";
import type { ShapeData, Tool } from "./types";
import { APP_TOOLS, MAX_ZOOM, MIN_ZOOM } from "./const";
import { WebsocketProvider } from "y-websocket";
import { useY } from "react-yjs";
import { deepEqual } from "fast-equals";
import * as Y from "yjs";

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
      newShape: ShapeData;
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

const yDoc = new Y.Doc();
const yShapes = yDoc.getArray<ShapeData>("shapes");

export function AppContextProvider({
  children,
  roomId,
}: {
  children: React.ReactNode;
  roomId: string;
}) {
  const [state, dispatchBase] = useReducer(reducer, DEFAULT_STATE);
  const shapes = useY(yShapes);

  const dispatch = useCallback(
    (action: AppAction) => {
      if (action.type === "START_CREATING_SHAPE") {
        yShapes.push([action.newShape]);
      } else if (action.type === "UPDATE_SHAPE") {
        yShapes.forEach((shape, i) => {
          if (shape.id === action.shapeId) {
            yDoc.transact(() => {
              yShapes.delete(i);
              yShapes.insert(i, [{ ...shape, ...action.data }]);
            });
          }
        });
      } else if (action.type === "DELETE") {
        yShapes.forEach((shape, i) => {
          if (shape.id === action.shapeId) {
            yShapes.delete(i);
          }
        });
      } else if (action.type === "CHANGE_COLOR") {
        yDoc.transact(() => {
          yShapes.forEach((shape, i) => {
            if (state.selectedShapes.includes(shape.id)) {
              yShapes.delete(i);
              yShapes.insert(i, [{ ...shape, fill: action.color }]);
            }
          });
        });
      } else if (action.type === "CHANGE_STROKE") {
        yDoc.transact(() => {
          yShapes.forEach((shape, i) => {
            if (state.selectedShapes.includes(shape.id)) {
              yShapes.delete(i);
              yShapes.insert(i, [
                { ...shape, stroke: action.color, strokeWidth: action.width },
              ]);
            }
          });
        });
      } else if (action.type === "MOVE") {
        yDoc.transact(() => {
          yShapes.forEach((shape, i) => {
            if (state.selectedShapes.includes(shape.id)) {
              yShapes.delete(i);
              yShapes.insert(i, [
                { ...shape, x: action.x || shape.x, y: action.y || shape.y },
              ]);
            }
          });
        });
      }

      dispatchBase(action);
    },
    [state, dispatchBase]
  );

  useEffect(() => {
    if (!roomId) return;

    const wsProvider = new WebsocketProvider(
      "ws://localhost:1234",
      roomId,
      yDoc
    );
    wsProvider.on("status", (event) => {
      console.log("Websocket status:", event.status);
    });

    return () => {
      wsProvider.destroy();
    };
  }, [roomId]);

  useEffect(() => {
    if (!deepEqual(shapes, state.shapes)) {
      dispatch({ type: "SYNC_SHAPES", shapes });
    }
  }, [shapes]);

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
    return {
      ...state,
      pendingShapeId: action.newShape.id,
      shapes: [...state.shapes, action.newShape],
      selectedShapes: [action.newShape.id],
    };
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

  if (action.type === "RESIZE") {
    return {
      ...state,
      shapes: state.shapes.map((shape) => {
        if (state.selectedShapes.includes(shape.id) && shape.type !== "text") {
          return {
            ...shape,
            width: action.width || shape.width,
            height: action.height || shape.height,
          };
        }

        return shape;
      }),
    };
  }

  throw new Error(`Unknown Action Type`);
}
