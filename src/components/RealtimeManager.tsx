import { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";
import { useEffect } from "react";
import type { ShapeData } from "@/types";
import { useAppContext, type AppAction, type AppState } from "@/context";

const yDoc = new Y.Doc();
const yShapes = yDoc.getArray<ShapeData>("shapes");

export function RealtimeManager() {
  const {
    state: { roomId, clientId },
    dispatch,
  } = useAppContext();

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

    const shapesObserver = (e: Y.YArrayEvent<ShapeData>) => {
      if (e.transaction.origin !== clientId) {
        console.log(e.target.toArray());
        dispatch({ type: "SYNC_SHAPES", shapes: e.target.toArray() });
      }
    };

    yShapes.observe(shapesObserver);

    return () => {
      wsProvider.destroy();
      yShapes.unobserve(shapesObserver);
    };
  }, [roomId]);

  return null;
}

export function handleRealtime(state: AppState, action: AppAction) {
  const transact = (callback: () => void) => {
    yDoc.transact(callback, state.clientId);
  };

  switch (action.type) {
    case "START_CREATING_SHAPE":
      transact(() => {
        yShapes.push([action.newShape]);
      });
      break;
    case "UPDATE_SHAPE":
      transact(() => {
        yShapes.forEach((shape, i) => {
          if (shape.id === action.shapeId) {
            yShapes.delete(i);
            yShapes.insert(i, [{ ...shape, ...action.data }]);
          }
        });
      });
      break;
    case "DELETE":
      transact(() => {
        yShapes.forEach((shape, i) => {
          if (shape.id === action.shapeId) {
            yShapes.delete(i);
          }
        });
      });
      break;
    case "CHANGE_COLOR":
      transact(() => {
        yShapes.forEach((shape, i) => {
          if (state.selectedShapes.includes(shape.id)) {
            yShapes.delete(i);
            yShapes.insert(i, [{ ...shape, fill: action.color }]);
          }
        });
      });
      break;
    case "CHANGE_STROKE":
      transact(() => {
        yShapes.forEach((shape, i) => {
          if (state.selectedShapes.includes(shape.id)) {
            yShapes.delete(i);
            yShapes.insert(i, [
              { ...shape, stroke: action.color, strokeWidth: action.width },
            ]);
          }
        });
      });
      break;
    case "MOVE":
      transact(() => {
        yShapes.forEach((shape, i) => {
          if (state.selectedShapes.includes(shape.id)) {
            yShapes.delete(i);
            yShapes.insert(i, [
              { ...shape, x: action.x || shape.x, y: action.y || shape.y },
            ]);
          }
        });
      });
      break;
    default:
      break;
  }
}
