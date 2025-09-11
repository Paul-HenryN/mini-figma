import { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";
import { useEffect, useState } from "react";
import type { Participant, ShapeData } from "@/types";
import { PARTICIPANT_COLORS } from "@/const";
import * as awarenessProtocol from "y-protocols/awareness";
import { useStore } from "@/store";
import { useShallow } from "zustand/react/shallow";
import { shallow } from "zustand/shallow";
import type { Vector2d } from "konva/lib/types";
import { deepEqual } from "fast-equals";
import { toast } from "sonner";
import { useAuth } from "@/auth-context";

const yDoc = new Y.Doc();
const yShapes = yDoc.getMap<ShapeData>("shapes");

let wsProvider: WebsocketProvider | null = null;
let awareness: awarenessProtocol.Awareness | null = null;

type ConnectionStatus = "connected" | "connecting" | "disconnected";

export function RealtimeManager() {
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("connecting");

  const state = useStore(
    useShallow((state) => ({
      roomId: state.roomId,
      currentParticipantId: state.currentParticipantId,
    }))
  );

  const { user } = useAuth();

  useEffect(() => {
    if (!state.roomId) return;

    const websocketUrl = import.meta.env.VITE_WEBSOCKET_URL;

    if (!websocketUrl) throw new Error("WEBSOCKET_URL is not set");

    wsProvider = new WebsocketProvider(websocketUrl, state.roomId, yDoc);

    const awarenessObserver = () => {
      if (!awareness) return;

      const awarenessStates = Array.from(awareness.getStates().values());

      useStore.setState((state) => {
        for (const item of awarenessStates) {
          const updatedParticipant = {
            id: item.id,
            name: item.name,
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

            if (updatedParticipant.id !== state.currentParticipantId) {
              toast.info(`${updatedParticipant.name} is editing this file`);
            }
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

        for (let i = 0; i < state.participants.length; i++) {
          const localParticipant = state.participants[i];

          const isStillPresent = awarenessStates.find(
            (p) => p.id === localParticipant.id
          );

          if (!isStillPresent) {
            state.participants.splice(i, 1);
            delete state.cursorPositions[localParticipant.id];
            delete state.selectedShapeIds[localParticipant.id];

            if (localParticipant.id !== state.currentParticipantId) {
              toast.warning(`${localParticipant.name} left the session`);
            }
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

    yShapes.observe(shapesObserver);

    wsProvider.on("status", (e) => {
      setConnectionStatus(e.status);
    });

    wsProvider.on("sync", (isSynced: boolean) => {
      if (!isSynced) return;

      awareness = wsProvider!.awareness;

      const currentParticipants = Array.from(awareness.getStates().values());

      awareness.on("change", awarenessObserver);

      const savedParticipantRaw = localStorage.getItem(
        `${state.roomId}-${state.currentParticipantId}`
      );

      if (savedParticipantRaw) {
        const savedParticipant = JSON.parse(savedParticipantRaw);

        awareness.setLocalState(savedParticipant);
      } else {
        const newParticipant = {
          id: state.currentParticipantId,
          name: user?.name || "Anonymous",
          color: PARTICIPANT_COLORS[currentParticipants.length - 1],
          joinedAt: Date.now(),
          cursorPosition: null,
          selectedShapeIds: [],
        };

        localStorage.setItem(
          `${state.roomId}-${state.currentParticipantId}`,
          JSON.stringify(newParticipant)
        );
        awareness.setLocalState(newParticipant);
      }
    });

    return () => {
      awareness?.off("change", awarenessObserver);
      yShapes.unobserve(shapesObserver);
      awareness?.destroy();
      wsProvider?.destroy();
    };
  }, [state.roomId, state.currentParticipantId]);

  if (connectionStatus !== "connected") {
    return (
      <div className="absolute z-[1000] inset-0 bg-black/60 grid place-items-center">
        {connectionStatus === "connecting"
          ? "Connecting..."
          : "OOps Something went wrong"}
      </div>
    );
  }

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
