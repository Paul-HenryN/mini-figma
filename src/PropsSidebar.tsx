import { ChevronDownIcon } from "lucide-react";
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
  SidebarHeader,
  SidebarSeparator,
} from "./components/ui/sidebar";
import { useAppContext } from "./context";
import { DEFAULT_COLOR, ZOOM_FACTOR } from "./const";
import { Button } from "./components/ui/button";
import type { ShapeData } from "./types";
import { ColorInput } from "./ColorInput";

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

  const getCurrentColor = () => {
    if (pendingShape) {
      return pendingShape.fill;
    }

    const selectedShapesData = shapes.filter((shape) =>
      selectedShapes.includes(shape.id)
    );

    if (selectedShapesData.length === 0) {
      return DEFAULT_COLOR;
    }

    if (selectedShapesData.length === 1) {
      return selectedShapesData[0].fill;
    }

    if (
      selectedShapesData.every(
        (shape) => shape.fill === selectedShapesData[0].fill
      )
    ) {
      return selectedShapesData[0].fill;
    }

    return -1;
  };

  const currentColor = getCurrentColor();

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
          <SidebarGroupLabel className="text-md first-letter:uppercase">
            {getTitle()}
          </SidebarGroupLabel>
        </SidebarGroup>

        <SidebarSeparator />
        {selectedShapes.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="font-bold">Fill</SidebarGroupLabel>

            <SidebarGroupContent>
              {currentColor !== -1 ? (
                <ColorInput
                  color={currentColor}
                  onColorChange={(newColor) =>
                    dispatch({ type: "CHANGE_COLOR", color: newColor })
                  }
                />
              ) : (
                <SidebarGroupLabel>
                  Click + to replace the mixed content
                </SidebarGroupLabel>
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
