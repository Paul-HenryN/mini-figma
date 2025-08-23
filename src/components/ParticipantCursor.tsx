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

  const color = isCurrentParticipant ? UI_COLOR : participant.color;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        zIndex: 10,
        pointerEvents: "none",
      }}
    >
      <MousePointer2
        style={{
          fill: color,
        }}
      />
      {!isCurrentParticipant && (
        <div
          className="rounded-xs px-1 truncate max-w-[100px] mt-1 ml-5 text-sm"
          style={{ backgroundColor: color }}
        >
          {participant.clientId}
        </div>
      )}
    </div>
  );
}
