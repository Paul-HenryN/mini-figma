import { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";
import { useEffect } from "react";
import type { Participant, ShapeData } from "@/types";
import { PARTICIPANT_COLORS } from "@/const";
import * as awarenessProtocol from "y-protocols/awareness";
import { useStore } from "@/store";
import { useShallow } from "zustand/react/shallow";
import { shallow } from "zustand/shallow";
import type { Vector2d } from "konva/lib/types";
import { deepEqual } from "fast-equals";

const yDoc = new Y.Doc();
const yShapes = yDoc.getMap<ShapeData>("shapes");

let wsProvider: WebsocketProvider | null = null;
let awareness: awarenessProtocol.Awareness | null = null;

export function RealtimeManager() {
  const state = useStore(
    useShallow((state) => ({
      roomId: state.roomId,
      currentParticipantId: state.currentParticipantId,
    }))
  );

  useEffect(() => {
    if (!state.roomId) return;

    const websocketUrl = import.meta.env.VITE_WEBSOCKET_URL;

    if (!websocketUrl) throw new Error("WEBSOCKET_URL is not set");

    wsProvider = new WebsocketProvider(websocketUrl, state.roomId, yDoc);
    wsProvider.on("status", (event) => {
      console.log("Websocket status:", event.status);
    });

    awareness = wsProvider.awareness;

    const currentParticipants = Array.from(awareness.getStates().values());

    const awarenessObserver = () => {
      if (!awareness) return;

      const awarenessStates = Array.from(awareness.getStates().values());

      useStore.setState((state) => {
        for (const item of awarenessStates) {
          const updatedParticipant = {
            id: item.id,
            color: item.color,
            joinedAt: item.joinedAt,
          };
          const updatedCursorPosition = item.cursorPosition;
          const updatedSelectedShapeIds = item.selectedShapeIds;

          const localParticipant = state.participants.find(
            (p) => p.id === updatedParticipant.id
          );
          const localCursorPosition =
            state.cursorPositions[updatedParticipant.id];

          const localSelectedShapeIds =
            state.selectedShapeIds[updatedParticipant.id];

          if (!localParticipant) {
            state.participants.push(updatedParticipant);
          } else {
            if (!deepEqual(localParticipant, updatedParticipant)) {
              Object.assign(localParticipant, updatedParticipant);
            }
          }

          if (!deepEqual(localCursorPosition, updatedCursorPosition)) {
            state.cursorPositions[updatedParticipant.id] =
              updatedCursorPosition;
          }

          if (!deepEqual(localSelectedShapeIds, updatedSelectedShapeIds)) {
            state.selectedShapeIds[updatedParticipant.id] =
              updatedSelectedShapeIds;
          }
        }
      });
    };

    const shapesObserver = (e: Y.YMapEvent<ShapeData>) => {
      if (e.transaction.origin === state.currentParticipantId) return;

      useStore.setState((state) => {
        for (const yShape of Array.from(e.target.values())) {
          const localShape = state.shapes.find((s) => s.id === yShape.id);

          if (localShape) {
            if (!deepEqual(localShape, yShape))
              Object.assign(localShape, yShape);
          } else {
            state.shapes.push(yShape);
          }
        }

        for (let i = 0; i < state.shapes.length; i++) {
          const localShape = state.shapes[i];

          if (!e.target.has(localShape.id)) {
            state.shapes.splice(i, 1);
          }
        }
      });
    };

    awareness.on("change", awarenessObserver);
    yShapes.observe(shapesObserver);

    awareness.setLocalState({
      id: state.currentParticipantId,
      color: PARTICIPANT_COLORS[currentParticipants.length],
      joinedAt: Date.now(),
      cursorPosition: null,
      selectedShapeIds: [],
    });

    return () => {
      awareness?.off("change", awarenessObserver);
      yShapes.unobserve(shapesObserver);
      awareness?.destroy();
      wsProvider?.destroy();
    };
  }, [state.roomId, state.currentParticipantId]);

  return null;
}

useStore.subscribe(
  (state) => ({
    shapes: state.shapes,
    currentParticipantId: state.currentParticipantId,
  }),
  ({
    shapes,
    currentParticipantId,
  }: {
    shapes: ShapeData[];
    currentParticipantId: Participant["id"] | null;
  }) => {
    if (!currentParticipantId) return;

    yDoc.transact(() => {
      for (const shape of shapes) {
        if (Array.from(yShapes.keys()).includes(shape.id)) {
          const yShape = yShapes.get(shape.id);

          if (!deepEqual(shape, yShape)) yShapes.set(shape.id, shape);
        } else {
          yShapes.set(shape.id, shape);
        }
      }

      for (const shapeId of yShapes.keys()) {
        if (!shapes.find((shape) => shape.id === shapeId)) {
          yShapes.delete(shapeId);
        }
      }
    }, currentParticipantId);
  },
  { equalityFn: shallow }
);

useStore.subscribe(
  (state) => {
    if (!state.currentParticipantId) return null;

    return state.cursorPositions[state.currentParticipantId];
  },
  (cursorPosition: Vector2d | null) => {
    awareness?.setLocalStateField("cursorPosition", cursorPosition);
  }
);

useStore.subscribe(
  (state) => {
    if (!state.currentParticipantId) return null;

    return state.selectedShapeIds[state.currentParticipantId];
  },
  (selectedShapeIds: ShapeData["id"][] | null) => {
    if (!selectedShapeIds) return;

    awareness?.setLocalStateField("selectedShapeIds", selectedShapeIds);
  }
);
