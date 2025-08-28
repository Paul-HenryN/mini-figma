import { APP_TOOLS } from "@/const";
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
import { useStore } from "@/store";
import { useShallow } from "zustand/react/shallow";

const toolIcons: Record<Tool["id"], LucideIcon> = {
  move: MoveIcon,
  ellipse: CircleIcon,
  rectangle: SquareIcon,
  text: TypeIcon,
};

export function Toolbar() {
  const state = useStore(
    useShallow((state) => ({
      currentTool: state.currentTool,
      changeTool: state.changeTool,
    }))
  );

  return (
    <ul className="absolute bottom-15 left-1/2 -translate-x-1/2">
      {Object.values(APP_TOOLS).map((tool, i) => {
        const Icon = toolIcons[tool.id];

        return (
          <Button
            key={tool.id}
            variant={state.currentTool.id === tool.id ? "default" : "outline"}
            onMouseDown={() => state.changeTool(tool)}
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
  );
}
