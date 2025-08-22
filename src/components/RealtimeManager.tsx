import { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";
import { useEffect, useRef } from "react";
import type { Participant, ShapeData } from "@/types";
import { useAppContext, type AppAction, type AppState } from "@/context";
import { PARTICIPANT_COLORS } from "@/const";

const yDoc = new Y.Doc();
const yShapes = yDoc.getArray<ShapeData>("shapes");
const yShapesSelectedByClientId = yDoc.getMap<ShapeData["id"][]>(
  "shapesSelectedByClientId"
);

export function RealtimeManager() {
  const {
    state: { roomId, clientId },
    dispatch,
  } = useAppContext();

  const wsProviderRef = useRef<WebsocketProvider | null>(null);

  useEffect(() => {
    if (!roomId) return;

    wsProviderRef.current = new WebsocketProvider(
      "ws://localhost:1234",
      roomId,
      yDoc
    );
    wsProviderRef.current.on("status", (event) => {
      console.log("Websocket status:", event.status);
    });

    wsProviderRef.current.awareness.setLocalState({
      clientId,
      joinedAt: Date.now(),
    });

    const awarenessObserver = () => {
      if (!wsProviderRef.current) return;

      const participants = Array.from(
        Array.from(wsProviderRef.current.awareness.getStates().values())
      ) as Participant[];

      const participantsWithColor = participants
        .toSorted((a, b) => a.joinedAt - b.joinedAt)
        .map((participant, i) => ({
          ...participant,
          color: PARTICIPANT_COLORS[i],
        }));

      dispatch({
        type: "SYNC_PARTICIPANTS",
        participants: participantsWithColor,
      });
    };
    const shapesObserver = (e: Y.YArrayEvent<ShapeData>) => {
      if (e.transaction.origin !== clientId) {
        dispatch({ type: "SYNC_SHAPES", shapes: e.target.toArray() });
      }
    };
    const shapesSelectedByClientIdObserver = (
      e: Y.YMapEvent<ShapeData["id"][]>
    ) => {
      if (e.transaction.origin !== clientId) {
        dispatch({
          type: "SYNC_SELECTED_SHAPES",
          shapesSelectedByClientId: e.target.toJSON(),
        });
      }
    };

    wsProviderRef.current.awareness.on("change", awarenessObserver);
    yShapes.observe(shapesObserver);
    yShapesSelectedByClientId.observe(shapesSelectedByClientIdObserver);

    return () => {
      wsProviderRef.current?.awareness.off("change", awarenessObserver);
      yShapes.unobserve(shapesObserver);
      wsProviderRef.current?.destroy();
      yShapesSelectedByClientId.unobserve(shapesSelectedByClientIdObserver);
    };
  }, [roomId]);

  return null;
}

export function handleRealtime(state: AppState, action: AppAction) {
  const transact = (callback: () => void) => {
    yDoc.transact(callback, state.clientId);
  };

  const selectedShapes = state.shapesSelectedByClientId[state.clientId] || [];

  switch (action.type) {
    case "START_CREATING_SHAPE":
      transact(() => {
        yShapes.push([action.newShape]);
        yShapesSelectedByClientId.set(state.clientId, [action.newShape.id]);
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
          if (selectedShapes.includes(shape.id)) {
            yShapes.delete(i);
            yShapes.insert(i, [{ ...shape, fill: action.color }]);
          }
        });
      });
      break;
    case "CHANGE_STROKE":
      transact(() => {
        yShapes.forEach((shape, i) => {
          if (selectedShapes.includes(shape.id)) {
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
          if (selectedShapes.includes(shape.id)) {
            yShapes.delete(i);
            yShapes.insert(i, [
              { ...shape, x: action.x || shape.x, y: action.y || shape.y },
            ]);
          }
        });
      });
      break;
    case "TOGGLE_SELECT":
      transact(() => {
        if (action.multiSelectEnabled) {
          if (selectedShapes.includes(action.shapeId)) {
            yShapesSelectedByClientId.set(
              state.clientId,
              selectedShapes.filter((id) => id !== action.shapeId)
            );
          } else {
            yShapesSelectedByClientId.set(state.clientId, [
              ...selectedShapes,
              action.shapeId,
            ]);
          }
        } else {
          yShapesSelectedByClientId.set(state.clientId, [action.shapeId]);
        }
      });
      break;
    case "UNSELECT_ALL":
      transact(() => {
        yShapesSelectedByClientId.set(state.clientId, []);
      });
      break;
    default:
      break;
  }
}
