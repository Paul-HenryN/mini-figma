import React from "react";
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
  FONT_FAMILIES,
  FONT_STYLES,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

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

export function PropsSidebar() {
  const state = useStore(
    useShallow((state) => ({
      shapes: state.shapes,
      selectedShapeIds: state.currentParticipantId
        ? state.selectedShapeIds[state.currentParticipantId]
        : null,
    }))
  );

  const selectedShapes = state.shapes.filter((shape) =>
    state.selectedShapeIds?.includes(shape.id)
  );

  const getTitle = () => {
    const selectedShapesData = state.shapes.filter((shape) =>
      state.selectedShapeIds?.includes(shape.id)
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
      <SidebarContent className="pb-20">
        <PropsSidebarHeader />

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

        {selectedShapes.some((shape) => shape.type === "text") && (
          <TypographyPropsGroup />
        )}
      </SidebarContent>
    </Sidebar>
  );
}

function PropsSidebarHeader() {
  const state = useStore(
    useShallow((state) => ({
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

  return (
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
                onClick={() => state.changeScale(option.handler(state.scale))}
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
  );
}

function FillPropsGroup() {
  const state = useStore(
    useShallow((state) => ({
      shapes: state.shapes,
      selectedShapeIds: state.currentParticipantId
        ? state.selectedShapeIds[state.currentParticipantId]
        : null,
      changeShapesColor: state.changeShapesColor,
    }))
  );

  const selectedShapes = state.shapes.filter((shape) =>
    state.selectedShapeIds?.includes(shape.id)
  );

  const currentFill = getMixedProperty<string>("fill", selectedShapes);

  return (
    <SidebarGroup>
      <div className="flex items-center justify-between gap-2">
        <SidebarGroupTitle>Fill</SidebarGroupTitle>

        {(!currentFill || currentFill === "mixed") && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (state.selectedShapeIds) {
                state.changeShapesColor(state.selectedShapeIds, DEFAULT_COLOR);
              }
            }}
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
                onColorChange={(newColor) => {
                  if (state.selectedShapeIds) {
                    state.changeShapesColor(state.selectedShapeIds, newColor);
                  }
                }}
              />

              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (state.selectedShapeIds) {
                    state.changeShapesColor(state.selectedShapeIds, undefined);
                  }
                }}
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
      selectedShapeIds: state.currentParticipantId
        ? state.selectedShapeIds[state.currentParticipantId]
        : null,
      changeShapesStroke: state.changeShapesStroke,
    }))
  );

  const selectedShapes = state.shapes.filter((shape) =>
    state.selectedShapeIds?.includes(shape.id)
  );

  const currentStrokeColor = getMixedProperty<string>("stroke", selectedShapes);
  const currentStrokeWidth = getMixedProperty<number>(
    "strokeWidth",
    selectedShapes
  );

  return (
    <SidebarGroup>
      <div className="flex items-center justify-between gap-2">
        <SidebarGroupTitle>Stroke</SidebarGroupTitle>

        {(!currentStrokeColor || currentStrokeColor === "mixed") && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (state.selectedShapeIds) {
                state.changeShapesStroke(state.selectedShapeIds, {
                  color: DEFAULT_STROKE_COLOR,
                  width: DEFAULT_STROKE_WIDTH,
                });
              }
            }}
          >
            <PlusIcon className="size-4" />
          </Button>
        )}
      </div>

      {currentStrokeColor && (
        <SidebarGroupContent className="mt-1">
          {currentStrokeColor === "mixed" ? (
            <SidebarGroupLabel>
              Click + to replace the mixed content
            </SidebarGroupLabel>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <ColorInput
                color={currentStrokeColor}
                onColorChange={(newColor) => {
                  if (state.selectedShapeIds) {
                    state.changeShapesStroke(state.selectedShapeIds, {
                      color: newColor,
                    });
                  }
                }}
              />

              <NumberInput
                min={1}
                value={currentStrokeWidth}
                className="border-none flex-1/2"
                onValueChange={(newValue) => {
                  if (state.selectedShapeIds) {
                    state.changeShapesStroke(state.selectedShapeIds, {
                      width: Number(newValue),
                    });
                  }
                }}
              />

              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (state.selectedShapeIds) {
                    state.changeShapesStroke(state.selectedShapeIds, {
                      color: null,
                      width: null,
                    });
                  }
                }}
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
      selectedShapeIds: state.currentParticipantId
        ? state.selectedShapeIds[state.currentParticipantId]
        : null,
      currentParticipantId: state.currentParticipantId,
      resizeShapes: state.resizeShapes,
    }))
  );

  const selectedShapes = state.shapes.filter((shape) =>
    state.selectedShapeIds?.includes(shape.id)
  );

  const currentWidth = getMixedProperty<number>("width", selectedShapes);
  const currentHeight = getMixedProperty<number>("height", selectedShapes);

  return (
    <SidebarGroup>
      <SidebarGroupTitle>Layout</SidebarGroupTitle>

      <SidebarGroupContent>
        <SidebarSubGroupTitle>Dimensions</SidebarSubGroupTitle>

        <div className="flex gap-2">
          <NumberInput
            value={currentWidth}
            min={0}
            onValueChange={(newValue) => {
              if (state.selectedShapeIds) {
                state.resizeShapes(state.selectedShapeIds, {
                  width: newValue,
                });
              }
            }}
            inputHandle="W"
          />
          <NumberInput
            value={currentHeight}
            min={0}
            onValueChange={(newValue) => {
              if (state.selectedShapeIds) {
                state.resizeShapes(state.selectedShapeIds, {
                  height: newValue,
                });
              }
            }}
            inputHandle="H"
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
      selectedShapeIds: state.currentParticipantId
        ? state.selectedShapeIds[state.currentParticipantId]
        : null,
      moveShapes: state.moveShapes,
    }))
  );

  const selectedShapes = state.shapes.filter((shape) =>
    state.selectedShapeIds?.includes(shape.id)
  );

  const currentX = getMixedProperty<number>("x", selectedShapes);
  const currentY = getMixedProperty<number>("y", selectedShapes);

  return (
    <SidebarGroup>
      <SidebarGroupTitle>Position</SidebarGroupTitle>

      <SidebarGroupContent>
        <SidebarSubGroupTitle>Position</SidebarSubGroupTitle>

        <div className="flex gap-2">
          <NumberInput
            value={currentX}
            onValueChange={(newValue) => {
              if (state.selectedShapeIds) {
                state.moveShapes(state.selectedShapeIds, { x: newValue });
              }
            }}
            inputHandle="X"
          />
          <NumberInput
            value={currentY}
            onValueChange={(newValue) => {
              if (state.selectedShapeIds) {
                state.moveShapes(state.selectedShapeIds, { y: newValue });
              }
            }}
            inputHandle="Y"
          />
        </div>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function TypographyPropsGroup() {
  const state = useStore(
    useShallow((state) => ({
      shapes: state.shapes,
      selectedShapeIds: state.currentParticipantId
        ? state.selectedShapeIds[state.currentParticipantId]
        : null,
      changeTextProps: state.changeTextProps,
    }))
  );

  const selectedTextShapes = state.shapes.filter(
    (shape) =>
      state.selectedShapeIds?.includes(shape.id) && shape.type === "text"
  ) as Extract<ShapeData, { type: "text" }>[];

  const currentFontFamily = getMixedProperty<string>(
    "fontFamily",
    selectedTextShapes
  );
  const currentFontStyle = getMixedProperty<string>(
    "fontStyle",
    selectedTextShapes
  );
  const currentFontSize = getMixedProperty<number>(
    "fontSize",
    selectedTextShapes
  );
  const currentLetterSpacing = getMixedProperty<number>(
    "letterSpacing",
    selectedTextShapes
  );

  const currentLineHeight = getMixedProperty<number>(
    "lineHeight",
    selectedTextShapes
  );

  const handleFontFamilyChange = (newFontFamily: string) => {
    if (state.selectedShapeIds) {
      state.changeTextProps(state.selectedShapeIds, {
        fontFamily: newFontFamily,
      });
    }
  };
  const handleFontStyleChange = (newFontStyle: string) => {
    if (state.selectedShapeIds) {
      state.changeTextProps(state.selectedShapeIds, {
        fontStyle: newFontStyle,
      });
    }
  };
  const handleFontSizeChange = (newFontSize: number) => {
    if (state.selectedShapeIds) {
      state.changeTextProps(state.selectedShapeIds, {
        fontSize: newFontSize,
      });
    }
  };
  const handleLineHeightChange = (newLineHeight: number) => {
    if (state.selectedShapeIds) {
      state.changeTextProps(state.selectedShapeIds, {
        lineHeight: newLineHeight,
      });
    }
  };
  const handleLetterSpacingChange = (newLetterSpacing: number) => {
    if (state.selectedShapeIds) {
      state.changeTextProps(state.selectedShapeIds, {
        letterSpacing: newLetterSpacing,
      });
    }
  };

  return (
    <SidebarGroup>
      <SidebarGroupTitle>Typography</SidebarGroupTitle>
      <SidebarGroupContent>
        <SidebarSubGroupTitle>Font</SidebarSubGroupTitle>

        <Select
          value={currentFontFamily}
          onValueChange={handleFontFamilyChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            {FONT_FAMILIES.map((family) => (
              <SelectItem key={family} value={family}>
                {family}
              </SelectItem>
            ))}

            <SelectItem value="mixed" className="hidden">
              Mixed
            </SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-2 my-5">
          <div className="input-group flex-1">
            <label htmlFor="line-height">Font style</label>

            <Select
              value={currentFontStyle}
              onValueChange={handleFontStyleChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                {FONT_STYLES.map((style) => (
                  <SelectItem key={style} value={style}>
                    {style}
                  </SelectItem>
                ))}

                <SelectItem value="mixed" className="hidden">
                  Mixed
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="input-group flex-1">
            <label htmlFor="font-size">Font size</label>
            <NumberInput
              id="font-size"
              min={0}
              value={currentFontSize}
              onValueChange={handleFontSizeChange}
            />
          </div>
        </div>

        <div className="flex gap-2 my-5">
          <div className="input-group">
            <label htmlFor="line-height">Line height</label>
            <NumberInput
              id="line-height"
              min={0}
              value={currentLineHeight}
              onValueChange={handleLineHeightChange}
            />
          </div>

          <div className="input-group">
            <label htmlFor="letter-spacing">Letter spacing</label>
            <NumberInput
              id="letter-spacing"
              min={0}
              value={currentLetterSpacing}
              onValueChange={handleLetterSpacingChange}
            />
          </div>
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
      className={cn(
        "size-6",
        isCurrentParticipant ? "text-white" : "text-foreground",
        className
      )}
      style={style}
    >
      <AvatarFallback
        style={{
          backgroundColor: isCurrentParticipant
            ? "var(--background)"
            : participant.color,
        }}
      >
        {participant.name.at(0)}
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

function getMixedProperty<T>(
  property: string,
  objects: Record<string, unknown>[]
) {
  if (objects.length === 0) return undefined;

  if (objects.length === 1) {
    return objects[0][property] as T;
  }

  if (objects.every((obj) => obj[property] === objects[0][property])) {
    return objects[0][property] as T;
  }

  return "mixed";
}
