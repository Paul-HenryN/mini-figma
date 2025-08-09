import { Button } from "./components/ui/button";
import { APP_TOOLS, ZOOM_FACTOR } from "./const";
import { useAppContext } from "./context";
import { cn } from "./lib/utils";
import {
  ChevronDownIcon,
  CircleIcon,
  MoveIcon,
  SquareIcon,
  TypeIcon,
  type LucideIcon,
} from "lucide-react";
import type { Tool } from "./types";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarShortcut,
  MenubarTrigger,
} from "./components/ui/menubar";

const toolIcons: Record<Tool["id"], LucideIcon> = {
  move: MoveIcon,
  ellipse: CircleIcon,
  rectangle: SquareIcon,
  text: TypeIcon,
};

const ZOOM_OPTIONS: {
  label: string;
  shortcut?: string;
  handler: (scale: number) => number;
}[] = [
  {
    label: "Zoom in",
    shortcut: "⌘+",
    handler: (scale) => scale * ZOOM_FACTOR,
  },
  {
    label: "Zoom out",
    shortcut: "⌘-",
    handler: (scale) => scale / ZOOM_FACTOR,
  },
  {
    label: "Zoom to 50%",
    handler: () => 0.5,
  },
  {
    label: "Zoom to 100%",
    shortcut: "⌘0",
    handler: () => 1,
  },
  {
    label: "Zoom to 200%",
    handler: () => 2,
  },
] as const;

export function Toolbar() {
  const { currentTool, setCurrentTool, scale, setScale } = useAppContext();

  const formattedScale = (100 * scale).toFixed(0);

  return (
    <>
      <ul className="absolute bottom-15 left-1/2 -translate-x-1/2">
        {Object.values(APP_TOOLS).map((tool, i) => {
          const Icon = toolIcons[tool.id];

          return (
            <Button
              key={tool.id}
              variant={currentTool.id === tool.id ? "default" : "outline"}
              onMouseDown={() => setCurrentTool(tool)}
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

      <Menubar className="absolute bottom-15 right-0">
        <MenubarMenu>
          <MenubarTrigger>
            {formattedScale}% <ChevronDownIcon className="size-3 ml-1" />
          </MenubarTrigger>

          <MenubarContent>
            {Object.values(ZOOM_OPTIONS).map((option) => (
              <MenubarItem onMouseDown={() => setScale(option.handler(scale))}>
                {option.label}
                {option.shortcut && (
                  <MenubarShortcut>{option.shortcut}</MenubarShortcut>
                )}
              </MenubarItem>
            ))}
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </>
  );
}
