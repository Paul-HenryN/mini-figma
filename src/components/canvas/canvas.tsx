import { useEffect, useRef } from "react";
import type Konva from "konva";
import { PendingTextInput } from "../PendingTextInput";
import { ParticipantCursor } from "../ParticipantCursor";
import { useStore } from "@/store";
import { useShallow } from "zustand/react/shallow";
import { Stage } from "./stage";

export function Canvas() {
  const state = useStore(
    useShallow((state) => ({
      shapes: state.shapes,
      pendingShapeId: state.pendingShapeId,
      participants: state.participants,
      selectedShapeIds: state.selectedShapeIds,
      currentParticipantId: state.currentParticipantId,
      syncShapeData: state.syncShapeData,
      deleteShapes: state.deleteShapes,
      confirmPendingShape: state.confirmPendingShape,
      setPanning: state.setPanning,
    }))
  );

  const stageRef = useRef<Konva.Stage>(null);

  const pendingShape = state.shapes.find(
    (shape) => shape.id === state.pendingShapeId
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (state.pendingShapeId) return;

      if (e.key === " ") state.setPanning(true);

      if (e.key === "Backspace") {
        if (!state.currentParticipantId) return;

        const selectedShapeIds =
          state.selectedShapeIds[state.currentParticipantId];

        if (!selectedShapeIds || selectedShapeIds.length === 0) return;

        state.deleteShapes(selectedShapeIds);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === " ") state.setPanning(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [
    state.pendingShapeId,
    state.currentParticipantId,
    state.selectedShapeIds,
  ]);

  return (
    <>
      <Stage ref={stageRef} />

      {state.participants.map(
        (participant) =>
          stageRef.current && (
            <ParticipantCursor
              key={participant.id}
              participant={participant}
              stage={stageRef.current}
              isCurrentParticipant={
                participant.id === state.currentParticipantId
              }
            />
          )
      )}

      {pendingShape && pendingShape.type === "text" && stageRef.current && (
        <PendingTextInput textShape={pendingShape} stage={stageRef.current} />
      )}
    </>
  );
}
