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

export const yDoc = new Y.Doc();
export const yShapes = yDoc.getMap<ShapeData>("shapes");
export const ySelectedShapeIds =
  yDoc.getMap<ShapeData["id"][]>("selectedShapeIds");

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

      const participantsWithCursorPosition = Array.from(
        awareness.getStates().values()
      );

      useStore.setState((state) => {
        for (const participant of participantsWithCursorPosition) {
          const updatedParticipant = {
            id: participant.id,
            color: participant.color,
            joinedAt: participant.joinedAt,
          };

          const updatedCursorPosition = participant.cursorPosition;

          const localParticipant = state.participants.find(
            (p) => p.id === updatedParticipant.id
          );

          const localCursorPosition =
            state.cursorPositions[updatedParticipant.id];

          if (!localParticipant) {
            state.participants.push(updatedParticipant);
            state.cursorPositions[updatedParticipant.id] =
              updatedCursorPosition;
          } else {
            if (!deepEqual(localParticipant, updatedParticipant)) {
              Object.assign(localParticipant, updatedParticipant);
            }

            if (!deepEqual(localCursorPosition, updatedCursorPosition)) {
              state.cursorPositions[updatedParticipant.id] =
                updatedCursorPosition;
            }
          }
        }
      });
    };
    const shapesObserver = (e: Y.YMapEvent<ShapeData>) => {
      if (e.transaction.origin !== state.currentParticipantId) {
        useStore.setState({ shapes: Array.from(e.target.values()) });
      }
    };
    const selectedShapeIdsObserver = (e: Y.YMapEvent<ShapeData["id"][]>) => {
      if (e.transaction.origin !== state.currentParticipantId) {
        useStore.setState({
          selectedShapeIds: e.target.toJSON(),
        });
      }
    };

    awareness.on("change", awarenessObserver);
    yShapes.observe(shapesObserver);
    ySelectedShapeIds.observe(selectedShapeIdsObserver);

    awareness.setLocalState({
      id: state.currentParticipantId,
      color: PARTICIPANT_COLORS[currentParticipants.length],
      joinedAt: Date.now(),
      cursorPosition: null,
    });

    return () => {
      awareness?.off("change", awarenessObserver);
      yShapes.unobserve(shapesObserver);
      awareness?.destroy();
      ySelectedShapeIds.unobserve(selectedShapeIdsObserver);
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
