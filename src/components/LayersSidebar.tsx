import {
  CircleIcon,
  SquareIcon,
  Trash2Icon,
  TypeIcon,
  type LucideIcon,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupTitle,
} from "./ui/sidebar";
import { useAppContext } from "@/context";
import type { ShapeData } from "@/types";

export function LayersSidebar() {
  const {
    state: { shapes, selectedShapes },
    dispatch,
  } = useAppContext();

  return (
    <Sidebar side="left" className="w-[15rem]">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupTitle>Layers</SidebarGroupTitle>

          <ul className="flex flex-col mt-2 gap-2 ml-2">
            {shapes.toReversed().map((shape) => (
              <li className="text-xs" key={shape.id}>
                <LayerButton
                  shape={shape}
                  active={selectedShapes.includes(shape.id)}
                  onClick={(e) =>
                    dispatch({
                      type: "TOGGLE_SELECT",
                      shapeId: shape.id,
                      multiSelectEnabled: e.shiftKey,
                    })
                  }
                  onDelete={() =>
                    dispatch({ type: "DELETE", shapeId: shape.id })
                  }
                />
              </li>
            ))}
          </ul>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

function LayerButton({
  shape,
  active = false,
  onClick = () => {},
  onDelete = () => {},
}: {
  shape: ShapeData;
  active?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onDelete?: () => void;
}) {
  const shapeIcons: Record<ShapeData["type"], LucideIcon> = {
    rectangle: SquareIcon,
    ellipse: CircleIcon,
    text: TypeIcon,
  };

  const Icon = shapeIcons[shape.type];

  return (
    <div className="relative group/layer">
      <Button
        variant={active ? "default" : "ghost"}
        size="sm"
        className="text-xs w-full justify-start transition-all"
        onClick={onClick}
      >
        <Icon className="mr-1" />
        {shape.name}
      </Button>

      <Button
        variant="ghost"
        className="absolute right-2 top-1/2 -translate-y-1/2 size-6 opacity-0 group-hover/layer:opacity-100"
        onClick={onDelete}
      >
        <Trash2Icon />
      </Button>
    </div>
  );
}
