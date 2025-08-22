import { UI_COLOR } from "@/const";
import type { Participant } from "@/types";
import type Konva from "konva";
import { MousePointer2 } from "lucide-react";

export function ParticipantCursor({
  participant,
  stage,
  isCurrentParticipant = false,
}: {
  participant: Participant;
  stage: Konva.Stage;
  isCurrentParticipant?: boolean;
}) {
  if (!participant.cursorPosition) return null;

  const stageTransform = stage.getAbsoluteTransform().copy();
  const { x, y } = stageTransform.point(participant.cursorPosition);

  return (
    <MousePointer2
      style={{
        position: "absolute",
        left: x,
        top: y,
        pointerEvents: "none",
        fill: isCurrentParticipant ? UI_COLOR : participant.color,
        zIndex: 10,
      }}
    />
  );
}
