import { ChevronDownIcon, PlusIcon, Trash2Icon } from "lucide-react";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarShortcut,
  MenubarTrigger,
} from "./components/ui/menubar";
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
} from "./components/ui/sidebar";
import { useAppContext } from "./context";
import {
  DEFAULT_COLOR,
  DEFAULT_STROKE_COLOR,
  DEFAULT_STROKE_WIDTH,
  ZOOM_FACTOR,
} from "./const";
import { Button } from "./components/ui/button";
import type { ShapeData } from "./types";
import { ColorInput } from "./ColorInput";
import { NumberInput } from "./NumberInput";

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
  const {
    state: { scale, selectedShapes, shapes, pendingShape },
    dispatch,
  } = useAppContext();

  const formattedScale = (100 * scale).toFixed(0);

  const getTitle = () => {
    if (pendingShape) {
      return getShapeLabel(pendingShape.type);
    }

    const selectedShapesData = shapes.filter((shape) =>
      selectedShapes.includes(shape.id)
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
        <SidebarHeader className="py-5">
          <Menubar className="w-max ml-auto bg-transparent border-none">
            <MenubarMenu>
              <MenubarTrigger asChild>
                <Button variant="ghost" className="text-xs">
                  {formattedScale}% <ChevronDownIcon className="size-3" />
                </Button>
              </MenubarTrigger>

              <MenubarContent>
                {ZOOM_OPTIONS.map((option) => (
                  <MenubarItem
                    onClick={() =>
                      dispatch({
                        type: "CHANGE_SCALE",
                        scale: option.handler(scale),
                      })
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
  const {
    state: { shapes, selectedShapes, pendingShape },
    dispatch,
  } = useAppContext();

  const getCurrentFill = () => {
    if (pendingShape) {
      return pendingShape.fill;
    }

    const selectedShapesData = shapes.filter((shape) =>
      selectedShapes.includes(shape.id)
    );

    if (selectedShapesData.length === 0) return undefined;

    if (
      selectedShapesData.every(
        (shape) => shape.fill === selectedShapesData[0].fill
      )
    ) {
      return selectedShapesData[0].fill;
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
              dispatch({ type: "CHANGE_COLOR", color: DEFAULT_COLOR })
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
                  dispatch({ type: "CHANGE_COLOR", color: newColor })
                }
              />

              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  dispatch({ type: "CHANGE_COLOR", color: undefined })
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
  const {
    state: { shapes, selectedShapes, pendingShape },
    dispatch,
  } = useAppContext();

  const getCurrentStroke = () => {
    if (pendingShape && pendingShape.stroke) {
      return { color: pendingShape.stroke, width: pendingShape.strokeWidth };
    }

    const selectedShapesData = shapes.filter((shape) =>
      selectedShapes.includes(shape.id)
    );

    if (selectedShapesData.length === 0) return undefined;

    if (selectedShapesData.length === 1) {
      const selectedShape = selectedShapesData[0];

      if (!selectedShape.stroke) return undefined;

      return {
        color: selectedShape.stroke,
        width: selectedShape.strokeWidth,
      };
    }

    const firstSelectedShape = selectedShapesData[0];

    if (
      firstSelectedShape.stroke &&
      selectedShapesData.every(
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

    if (selectedShapesData.some((shape) => shape.stroke !== undefined)) {
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
              dispatch({
                type: "CHANGE_STROKE",
                color: DEFAULT_STROKE_COLOR,
                width: DEFAULT_STROKE_WIDTH,
              })
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
                  dispatch({
                    type: "CHANGE_STROKE",
                    color: newColor,
                    width: currentStroke.width,
                  })
                }
              />

              <NumberInput
                min={1}
                value={currentStroke.width}
                className="border-none flex-1/2"
                onValueChange={(newValue) =>
                  dispatch({
                    type: "CHANGE_STROKE",
                    color: currentStroke.color,
                    width: Number(newValue),
                  })
                }
              />

              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  dispatch({
                    type: "CHANGE_STROKE",
                    color: undefined,
                    width: undefined,
                  })
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
  const {
    state: { shapes, selectedShapes, pendingShape },
    dispatch,
  } = useAppContext();

  const getCurrentWidth = () => {
    if (pendingShape) {
      return getShapeDimensions(pendingShape).width;
    }

    const selectedShapesData = shapes.filter((shape) =>
      selectedShapes.includes(shape.id)
    );

    if (selectedShapesData.length === 0) return undefined;

    if (selectedShapesData.length === 1) {
      return getShapeDimensions(selectedShapesData[0]).width;
    }

    const firstSelectedShape = selectedShapesData[0];
    const firstSelectedShapeDimensions = getShapeDimensions(firstSelectedShape);

    if (
      selectedShapesData.every((shape) => {
        const shapeDimensions = getShapeDimensions(shape);
        return shapeDimensions.width === firstSelectedShapeDimensions.width;
      })
    ) {
      return firstSelectedShapeDimensions.width;
    }

    return "mixed";
  };

  const getCurrentHeight = () => {
    if (pendingShape) {
      return getShapeDimensions(pendingShape).height;
    }

    const selectedShapesData = shapes.filter((shape) =>
      selectedShapes.includes(shape.id)
    );

    if (selectedShapesData.length === 0) return undefined;

    if (selectedShapesData.length === 1) {
      return getShapeDimensions(selectedShapesData[0]).height;
    }

    const firstSelectedShape = selectedShapesData[0];
    const firstSelectedShapeDimensions = getShapeDimensions(firstSelectedShape);

    if (
      selectedShapesData.every((shape) => {
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
              dispatch({
                type: "RESIZE",
                width: newValue,
              })
            }
            placeholder="Width"
          />
          <NumberInput
            value={getCurrentHeight()}
            min={0}
            onValueChange={(newValue) =>
              dispatch({
                type: "RESIZE",
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
  const {
    state: { shapes, selectedShapes, pendingShape },
    dispatch,
  } = useAppContext();

  const getCurrentX = () => {
    if (pendingShape) {
      return pendingShape.x;
    }

    const selectedShapesData = shapes.filter((shape) =>
      selectedShapes.includes(shape.id)
    );

    if (selectedShapesData.length === 0) return undefined;

    if (selectedShapesData.length === 1) {
      return selectedShapesData[0].x;
    }

    const firstSelectedShape = selectedShapesData[0];

    if (selectedShapesData.every((shape) => shape.x === firstSelectedShape.x)) {
      return firstSelectedShape.x;
    }

    return "mixed";
  };

  const getCurrentY = () => {
    if (pendingShape) {
      return pendingShape.y;
    }

    const selectedShapesData = shapes.filter((shape) =>
      selectedShapes.includes(shape.id)
    );

    if (selectedShapesData.length === 0) return undefined;

    if (selectedShapesData.length === 1) {
      return selectedShapesData[0].y;
    }

    const firstSelectedShape = selectedShapesData[0];

    if (selectedShapesData.every((shape) => shape.y === firstSelectedShape.y)) {
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
              dispatch({
                type: "MOVE",
                x: newValue,
              })
            }
            placeholder="Width"
          />
          <NumberInput
            value={getCurrentY()}
            onValueChange={(newValue) =>
              dispatch({
                type: "MOVE",
                y: newValue,
              })
            }
            placeholder="Height"
          />
        </div>
      </SidebarGroupContent>
    </SidebarGroup>
  );
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
