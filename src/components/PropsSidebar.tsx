import { ChevronDownIcon, PlusIcon, Trash2Icon } from "lucide-react";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarShortcut,
  MenubarTrigger,
} from "./ui/menubar";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarGroupTitle,
  SidebarHeader,
  SidebarSeparator,
  SidebarSubGroupTitle,
} from "./ui/sidebar";
import {
  DEFAULT_COLOR,
  DEFAULT_STROKE_COLOR,
  DEFAULT_STROKE_WIDTH,
  UI_COLOR,
  ZOOM_FACTOR,
} from "../const";
import { Button } from "./ui/button";
import type { Participant, ShapeData } from "../types";
import { ColorInput } from "./ColorInput";
import { NumberInput } from "./NumberInput";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { cn } from "@/lib/utils";
import { useStore } from "@/store";
import { useShallow } from "zustand/react/shallow";

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

const fallbackSelectedShapeIds: ShapeData["id"][] = [];

export function PropsSidebar() {
  const state = useStore(
    useShallow((state) => ({
      shapes: state.shapes,
      selectedShapeIds:
        state.currentParticipantId &&
        state.currentParticipantId in state.selectedShapeIds
          ? state.selectedShapeIds[state.currentParticipantId]
          : fallbackSelectedShapeIds,
      scale: state.scale,
      participants: state.participants,
      currentParticipantId: state.currentParticipantId,
      changeScale: state.changeScale,
    }))
  );

  const formattedScale = (100 * state.scale).toFixed(0);
  const currentParticipant = state.participants.find(
    (p) => p.id === state.currentParticipantId
  );
  const selectedShapes = state.shapes.filter((shape) =>
    state.selectedShapeIds.includes(shape.id)
  );

  const getTitle = () => {
    const selectedShapesData = state.shapes.filter((shape) =>
      state.selectedShapeIds.includes(shape.id)
    );

    if (selectedShapesData.length === 0) {
      return "No selected shape";
    }

    if (selectedShapesData.length === 1) {
      return getShapeLabel(selectedShapesData[0].type);
    }

    return `${selectedShapesData.length} selected`;
  };

  return (
    <Sidebar side="right">
      <SidebarContent>
        <SidebarHeader className="py-5 flex-row gap-2 items-center">
          <ul className="flex flex-wrap gap-1 group/participants">
            {currentParticipant && (
              <li>
                <ParticipantAvatar
                  participant={currentParticipant}
                  isCurrentParticipant
                />
              </li>
            )}

            {state.participants
              .filter((p) => p.id !== state.currentParticipantId)
              .map((participant) => (
                <li key={participant.id}>
                  <ParticipantAvatar participant={participant} />
                </li>
              ))}
          </ul>

          <Menubar className="w-max ml-auto bg-transparent border-none">
            <MenubarMenu>
              <MenubarTrigger asChild>
                <Button variant="ghost" className="text-xs">
                  {formattedScale}% <ChevronDownIcon className="size-3" />
                </Button>
              </MenubarTrigger>

              <MenubarContent className="z-200">
                {ZOOM_OPTIONS.map((option) => (
                  <MenubarItem
                    onClick={() =>
                      state.changeScale(option.handler(state.scale))
                    }
                  >
                    {option.label}
                    {option.shortcut && (
                      <MenubarShortcut>{option.shortcut}</MenubarShortcut>
                    )}
                  </MenubarItem>
                ))}
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
        </SidebarHeader>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel className="text-md first-letter:uppercase text-white">
            {getTitle()}
          </SidebarGroupLabel>
        </SidebarGroup>

        <SidebarSeparator />

        {selectedShapes.length > 0 && (
          <>
            <PositionPropsGroup />
            <SidebarSeparator />
            <LayoutPropsGroup />
            <SidebarSeparator />
            <FillPropsGroup />
            <SidebarSeparator />
            <StrokePropsGroup />
            <SidebarSeparator />
          </>
        )}
      </SidebarContent>
    </Sidebar>
  );
}

function FillPropsGroup() {
  const state = useStore(
    useShallow((state) => ({
      shapes: state.shapes,
      selectedShapeIds:
        state.currentParticipantId &&
        state.currentParticipantId in state.selectedShapeIds
          ? state.selectedShapeIds[state.currentParticipantId]
          : fallbackSelectedShapeIds,
      changeShapesColor: state.changeShapesColor,
    }))
  );

  const selectedShapes = state.shapes.filter((shape) =>
    state.selectedShapeIds.includes(shape.id)
  );

  const getCurrentFill = () => {
    if (selectedShapes.length === 0) return undefined;

    if (
      selectedShapes.every((shape) => shape.fill === selectedShapes[0].fill)
    ) {
      return selectedShapes[0].fill;
    }

    return "mixed";
  };

  const currentFill = getCurrentFill();

  return (
    <SidebarGroup>
      <div className="flex items-center justify-between gap-2">
        <SidebarGroupTitle>Fill</SidebarGroupTitle>

        {(!currentFill || currentFill === "mixed") && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              state.changeShapesColor(state.selectedShapeIds, DEFAULT_COLOR)
            }
          >
            <PlusIcon className="size-4" />
          </Button>
        )}
      </div>

      {currentFill && (
        <SidebarGroupContent className="mt-1">
          {currentFill === "mixed" ? (
            <SidebarGroupLabel>
              Click + to replace the mixed content
            </SidebarGroupLabel>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <ColorInput
                color={currentFill}
                onColorChange={(newColor) =>
                  state.changeShapesColor(state.selectedShapeIds, newColor)
                }
              />

              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  state.changeShapesColor(state.selectedShapeIds, undefined)
                }
              >
                <Trash2Icon className="size-4" />
              </Button>
            </div>
          )}
        </SidebarGroupContent>
      )}
    </SidebarGroup>
  );
}

function StrokePropsGroup() {
  const state = useStore(
    useShallow((state) => ({
      shapes: state.shapes,
      selectedShapeIds:
        state.currentParticipantId &&
        state.currentParticipantId in state.selectedShapeIds
          ? state.selectedShapeIds[state.currentParticipantId]
          : fallbackSelectedShapeIds,
      changeShapesStroke: state.changeShapesStroke,
    }))
  );

  const selectedShapes = state.shapes.filter((shape) =>
    state.selectedShapeIds.includes(shape.id)
  );

  const getCurrentStroke = () => {
    if (selectedShapes.length === 0) return undefined;

    if (selectedShapes.length === 1) {
      const selectedShape = selectedShapes[0];

      if (!selectedShape.stroke) return undefined;

      return {
        color: selectedShape.stroke,
        width: selectedShape.strokeWidth,
      };
    }

    const firstSelectedShape = selectedShapes[0];

    if (
      firstSelectedShape.stroke &&
      selectedShapes.every(
        (shape) =>
          shape.stroke === firstSelectedShape.stroke &&
          shape.strokeWidth === firstSelectedShape.strokeWidth
      )
    ) {
      return {
        color: firstSelectedShape.stroke,
        width: firstSelectedShape.strokeWidth,
      };
    }

    if (selectedShapes.some((shape) => shape.stroke !== undefined)) {
      return "mixed";
    }
  };

  const currentStroke = getCurrentStroke();

  return (
    <SidebarGroup>
      <div className="flex items-center justify-between gap-2">
        <SidebarGroupTitle>Stroke</SidebarGroupTitle>

        {(!currentStroke || currentStroke === "mixed") && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              state.changeShapesStroke(
                state.selectedShapeIds,
                DEFAULT_STROKE_COLOR,
                DEFAULT_STROKE_WIDTH
              )
            }
          >
            <PlusIcon className="size-4" />
          </Button>
        )}
      </div>

      {currentStroke && (
        <SidebarGroupContent className="mt-1">
          {currentStroke === "mixed" ? (
            <SidebarGroupLabel>
              Click + to replace the mixed content
            </SidebarGroupLabel>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <ColorInput
                color={currentStroke.color}
                onColorChange={(newColor) =>
                  state.changeShapesStroke(
                    state.selectedShapeIds,
                    newColor,
                    currentStroke.width
                  )
                }
              />

              <NumberInput
                min={1}
                value={currentStroke.width}
                className="border-none flex-1/2"
                onValueChange={(newValue) =>
                  state.changeShapesStroke(
                    state.selectedShapeIds,
                    currentStroke.color,
                    Number(newValue)
                  )
                }
              />

              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  state.changeShapesStroke(
                    state.selectedShapeIds,
                    undefined,
                    undefined
                  )
                }
              >
                <Trash2Icon className="size-4" />
              </Button>
            </div>
          )}
        </SidebarGroupContent>
      )}
    </SidebarGroup>
  );
}

function LayoutPropsGroup() {
  const state = useStore(
    useShallow((state) => ({
      shapes: state.shapes,
      selectedShapeIds:
        state.currentParticipantId &&
        state.currentParticipantId in state.selectedShapeIds
          ? state.selectedShapeIds[state.currentParticipantId]
          : fallbackSelectedShapeIds,
      currentParticipantId: state.currentParticipantId,
      resizeShapes: state.resizeShapes,
    }))
  );

  const selectedShapes = state.shapes.filter((shape) =>
    state.selectedShapeIds.includes(shape.id)
  );

  const getCurrentWidth = () => {
    if (selectedShapes.length === 0) return undefined;

    if (selectedShapes.length === 1) {
      return getShapeDimensions(selectedShapes[0]).width;
    }

    const firstSelectedShape = selectedShapes[0];
    const firstSelectedShapeDimensions = getShapeDimensions(firstSelectedShape);

    if (
      selectedShapes.every((shape) => {
        const shapeDimensions = getShapeDimensions(shape);
        return shapeDimensions.width === firstSelectedShapeDimensions.width;
      })
    ) {
      return firstSelectedShapeDimensions.width;
    }

    return "mixed";
  };

  const getCurrentHeight = () => {
    if (selectedShapes.length === 0) return undefined;

    if (selectedShapes.length === 1) {
      return getShapeDimensions(selectedShapes[0]).height;
    }

    const firstSelectedShape = selectedShapes[0];
    const firstSelectedShapeDimensions = getShapeDimensions(firstSelectedShape);

    if (
      selectedShapes.every((shape) => {
        const shapeDimensions = getShapeDimensions(shape);
        return shapeDimensions.height === firstSelectedShapeDimensions.height;
      })
    ) {
      return firstSelectedShapeDimensions.height;
    }

    return "mixed";
  };

  return (
    <SidebarGroup>
      <SidebarGroupTitle>Layout</SidebarGroupTitle>

      <SidebarGroupContent>
        <SidebarSubGroupTitle>Dimensions</SidebarSubGroupTitle>

        <div className="flex gap-2">
          <NumberInput
            value={getCurrentWidth()}
            min={0}
            onValueChange={(newValue) =>
              state.resizeShapes(state.selectedShapeIds, {
                width: newValue,
              })
            }
            placeholder="Width"
          />
          <NumberInput
            value={getCurrentHeight()}
            min={0}
            onValueChange={(newValue) =>
              state.resizeShapes(state.selectedShapeIds, {
                height: newValue,
              })
            }
            placeholder="Height"
          />
        </div>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function PositionPropsGroup() {
  const state = useStore(
    useShallow((state) => ({
      shapes: state.shapes,
      selectedShapeIds:
        state.currentParticipantId &&
        state.currentParticipantId in state.selectedShapeIds
          ? state.selectedShapeIds[state.currentParticipantId]
          : fallbackSelectedShapeIds,
      moveShapes: state.moveShapes,
    }))
  );

  const selectedShapes = state.shapes.filter((shape) =>
    state.selectedShapeIds.includes(shape.id)
  );

  const getCurrentX = () => {
    if (selectedShapes.length === 0) return undefined;

    if (selectedShapes.length === 1) {
      return selectedShapes[0].x;
    }

    const firstSelectedShape = selectedShapes[0];

    if (selectedShapes.every((shape) => shape.x === firstSelectedShape.x)) {
      return firstSelectedShape.x;
    }

    return "mixed";
  };

  const getCurrentY = () => {
    if (selectedShapes.length === 0) return undefined;

    if (selectedShapes.length === 1) {
      return selectedShapes[0].y;
    }

    const firstSelectedShape = selectedShapes[0];

    if (selectedShapes.every((shape) => shape.y === firstSelectedShape.y)) {
      return firstSelectedShape.y;
    }

    return "mixed";
  };

  return (
    <SidebarGroup>
      <SidebarGroupTitle>Position</SidebarGroupTitle>

      <SidebarGroupContent>
        <SidebarSubGroupTitle>Position</SidebarSubGroupTitle>

        <div className="flex gap-2">
          <NumberInput
            value={getCurrentX()}
            onValueChange={(newValue) =>
              state.moveShapes(state.selectedShapeIds, { x: newValue })
            }
            placeholder="X"
          />
          <NumberInput
            value={getCurrentY()}
            onValueChange={(newValue) =>
              state.moveShapes(state.selectedShapeIds, { y: newValue })
            }
            placeholder="Y"
          />
        </div>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function ParticipantAvatar({
  participant,
  className,
  style,
  isCurrentParticipant = false,
}: {
  participant: Participant;
  className?: string;
  style?: React.CSSProperties;
  isCurrentParticipant?: boolean;
}) {
  return (
    <Avatar
      className={cn("size-6 text-white font-bold", className)}
      style={style}
    >
      <AvatarFallback
        style={{
          backgroundColor: isCurrentParticipant ? UI_COLOR : participant.color,
        }}
      >
        {participant.id.at(0)}
      </AvatarFallback>
    </Avatar>
  );
}

function getShapeLabel(shapeType: ShapeData["type"]) {
  switch (shapeType) {
    case "ellipse":
      return "Ellipse";
    case "rectangle":
      return "Rectangle";
    case "text":
      return "Text";
  }
}

function getShapeDimensions(shape: ShapeData) {
  switch (shape.type) {
    case "ellipse":
    case "rectangle":
      return { width: Math.abs(shape.width), height: Math.abs(shape.height) };
    case "text":
      return {
        width: shape.fontSize * shape.text.length,
        height: shape.fontSize,
      };
  }
}
