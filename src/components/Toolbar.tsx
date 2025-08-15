import { APP_TOOLS } from "@/const";
import { useAppContext } from "@/context";
import { cn } from "@/lib/utils";
import type { Tool } from "@/types";
import {
  CircleIcon,
  MoveIcon,
  SquareIcon,
  TypeIcon,
  type LucideIcon,
} from "lucide-react";
import { Button } from "./ui/button";

const toolIcons: Record<Tool["id"], LucideIcon> = {
  move: MoveIcon,
  ellipse: CircleIcon,
  rectangle: SquareIcon,
  text: TypeIcon,
};

export function Toolbar() {
  const {
    state: { currentTool },
    dispatch,
  } = useAppContext();

  return (
    <>
      <ul className="absolute bottom-15 left-1/2 -translate-x-1/2">
        {Object.values(APP_TOOLS).map((tool, i) => {
          const Icon = toolIcons[tool.id];

          return (
            <Button
              key={tool.id}
              variant={currentTool.id === tool.id ? "default" : "outline"}
              onMouseDown={() => dispatch({ type: "CHANGE_TOOL", tool })}
              className={cn(
                i !== 0 && "rounded-l-none",
                i !== Object.values(APP_TOOLS).length - 1 && "rounded-r-none"
              )}
            >
              <Icon className="size-4" />
            </Button>
          );
        })}
      </ul>
    </>
  );
}
