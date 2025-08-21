import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ActionDispatch,
} from "react";
import type { ShapeData, Tool } from "./types";
import { APP_TOOLS, MAX_ZOOM, MIN_ZOOM } from "./const";
import { handleRealtime } from "./components/RealtimeManager";

export type AppState = {
  roomId?: string;
  clientId: string;
  currentTool: Tool;
  scale: number;
  shapes: ShapeData[];
  pendingShapeId: ShapeData["id"] | null;
  selectedShapes: ShapeData["id"][];
  isPanning: boolean;
};
export type AppAction =
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
  clientId: crypto.randomUUID(),
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
  const [clientId] = useState(
    localStorage.getItem("clientId") || crypto.randomUUID()
  );
  const [stateBase, dispatchBase] = useReducer(reducer, DEFAULT_STATE);

  const state = useMemo(() => {
    return { ...stateBase, clientId, roomId };
  }, [stateBase, clientId, roomId]);

  const dispatch = useCallback(
    (action: AppAction) => {
      handleRealtime(state, action);
      dispatchBase(action);
    },
    [state, dispatchBase, handleRealtime]
  );

  useEffect(() => {
    if (!localStorage.getItem("clientId")) {
      localStorage.setItem("clientId", crypto.randomUUID());
    }
  }, []);

  return (
    <AppContext.Provider
      value={{
        state: { ...state },
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
