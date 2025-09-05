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
import { useStoreWithEqualityFn } from "zustand/traditional";
import { deepEqual } from "fast-equals";

const fallbackSelectedShapeIds: ShapeData["id"][] = [];

export function LayersSidebar() {
  const shapes = useStoreWithEqualityFn(
    useStore,
    (state) =>
      state.shapes.map((shape) => ({
        id: shape.id,
        name: shape.name,
        type: shape.type,
      })),
    deepEqual
  );

  const { selectedShapeIds, toggleSelectShape, deleteShapes } = useStore(
    useShallow((state) => ({
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
            {shapes.toReversed().map((shape) => (
              <li className="text-xs" key={shape.id}>
                <LayerButton
                  shape={shape}
                  active={selectedShapeIds.includes(shape.id)}
                  onClick={(e) =>
                    toggleSelectShape(shape.id, {
                      isMultiSelect: e.shiftKey,
                    })
                  }
                  onDelete={() => {
                    if (selectedShapeIds.includes(shape.id)) {
                      deleteShapes(selectedShapeIds);
                    } else {
                      deleteShapes([shape.id]);
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
  shape: Pick<ShapeData, "id" | "name" | "type">;
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

        <span className="truncate max-w-[70%]">{shape.name}</span>
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
