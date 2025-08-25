import { UI_COLOR } from "@/const";
import { useStore } from "@/store";
import type { Participant } from "@/types";
import type Konva from "konva";
import { HandGrabIcon, HandIcon, MousePointer2Icon } from "lucide-react";
import { useEffect, useState } from "react";
import { useShallow } from "zustand/react/shallow";

export function ParticipantCursor({
  participant,
  stage,
  isCurrentParticipant = false,
}: {
  participant: Participant;
  stage: Konva.Stage;
  isCurrentParticipant?: boolean;
}) {
  const state = useStore(
    useShallow((state) => ({
      cursorPosition: state.cursorPositions[participant.id],
      isPanning: state.isPanning,
    }))
  );

  const [isMouseDown, setMouseDown] = useState(false);

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

  if (!state.cursorPosition) return null;

  const stageTransform = stage.getAbsoluteTransform().copy();
  const { x, y } = stageTransform.point(state.cursorPosition);

  const color = isCurrentParticipant ? UI_COLOR : participant.color;

  const getCursorIcon = () => {
    if (!isCurrentParticipant) return MousePointer2Icon;
    if (isMouseDown && state.isPanning) return HandGrabIcon;
    if (state.isPanning) return HandIcon;

    return MousePointer2Icon;
  };

  const CursorIcon = getCursorIcon();

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
          {participant.id}
        </div>
      )}
    </div>
  );
}
