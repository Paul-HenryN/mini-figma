import { UI_COLOR } from "@/const";
import { useAppContext } from "@/context";
import type { Participant } from "@/types";
import type Konva from "konva";
import { HandGrabIcon, HandIcon, MousePointer2Icon } from "lucide-react";
import { useEffect, useState } from "react";

export function ParticipantCursor({
  participant,
  stage,
  isCurrentParticipant = false,
}: {
  participant: Participant;
  stage: Konva.Stage;
  isCurrentParticipant?: boolean;
}) {
  const {
    state: { isPanning },
  } = useAppContext();

  if (!participant.cursorPosition) return null;

  const stageTransform = stage.getAbsoluteTransform().copy();
  const { x, y } = stageTransform.point(participant.cursorPosition);

  const color = isCurrentParticipant ? UI_COLOR : participant.color;

  const [isMouseDown, setMouseDown] = useState(false);

  const getCursorIcon = () => {
    if (!isCurrentParticipant) return MousePointer2Icon;
    if (isMouseDown && isPanning) return HandGrabIcon;
    if (isPanning) return HandIcon;

    return MousePointer2Icon;
  };

  const CursorIcon = getCursorIcon();

  useEffect(() => {
    const handleMouseDown = () => {
      setMouseDown(true);
    };

    const handleMouseUp = () => {
      setMouseDown(false);
    };

    stage.addEventListener("mousedown", handleMouseDown);
    stage.addEventListener("mouseup", handleMouseUp);

    return () => {
      stage.removeEventListener("click");
      stage.removeEventListener("mouseup");
    };
  }, []);

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
      <CursorIcon
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
