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
import type { ShapeData } from "@/types";
import { useStore } from "@/store";
import { useShallow } from "zustand/react/shallow";

const fallbackSelectedShapeIds: ShapeData["id"][] = [];

export function LayersSidebar() {
  const state = useStore(
    useShallow((state) => ({
      shapes: state.shapes,
      selectedShapeIds:
        state.currentParticipantId &&
        state.currentParticipantId in state.selectedShapeIds
          ? state.selectedShapeIds[state.currentParticipantId]
          : fallbackSelectedShapeIds,
      toggleSelectShape: state.toggleSelectShape,
      deleteShapes: state.deleteShapes,
    }))
  );

  return (
    <Sidebar side="left" className="w-[15rem]">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupTitle>Layers</SidebarGroupTitle>

          <ul className="flex flex-col mt-2 gap-2 ml-2">
            {state.shapes.toReversed().map((shape) => (
              <li className="text-xs" key={shape.id}>
                <LayerButton
                  shape={shape}
                  active={state.selectedShapeIds.includes(shape.id)}
                  onClick={(e) =>
                    state.toggleSelectShape(shape.id, {
                      isMultiSelect: e.shiftKey,
                    })
                  }
                  onDelete={() => {
                    if (state.selectedShapeIds.includes(shape.id)) {
                      state.deleteShapes(state.selectedShapeIds);
                    } else {
                      state.deleteShapes([shape.id]);
                    }
                  }}
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
