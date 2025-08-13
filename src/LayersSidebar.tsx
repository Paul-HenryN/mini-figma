import {
  CircleIcon,
  SquareIcon,
  TypeIcon,
  type LucideIcon,
} from "lucide-react";
import { Button } from "./components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupTitle,
} from "./components/ui/sidebar";
import { useAppContext } from "./context";
import type { ShapeData } from "./types";

export function LayersSidebar() {
  const {
    state: { shapes, selectedShapes, pendingShape },
    dispatch,
  } = useAppContext();

  return (
    <Sidebar side="left" className="w-[15rem]">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupTitle>Layers</SidebarGroupTitle>

          <ul className="flex flex-col mt-2 gap-2 ml-2">
            {pendingShape && (
              <li>
                <LayerButton
                  shape={pendingShape}
                  active={selectedShapes.includes(pendingShape.id)}
                />
              </li>
            )}

            {shapes.toReversed().map((shape) => (
              <li className="text-xs">
                <LayerButton
                  shape={shape}
                  active={selectedShapes.includes(shape.id)}
                  onClick={(e) =>
                    dispatch({
                      type: "SELECT_SHAPE",
                      shapeId: shape.id,
                      multiSelectEnabled: e.shiftKey,
                    })
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
}: {
  shape: ShapeData;
  active?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  const shapeIcons: Record<ShapeData["type"], LucideIcon> = {
    rectangle: SquareIcon,
    ellipse: CircleIcon,
    text: TypeIcon,
  };

  const Icon = shapeIcons[shape.type];

  return (
    <Button
      variant={active ? "default" : "ghost"}
      size="sm"
      className="text-xs w-full justify-start transition-all"
      onClick={onClick}
    >
      <Icon className="mr-1" />
      {shape.name}
    </Button>
  );
}
