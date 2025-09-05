import { immer } from "zustand/middleware/immer";
import { create } from "zustand";
import type { Participant, ShapeData, Tool } from "./types";
import { APP_TOOLS, DEFAULT_COLOR } from "./const";
import type { Vector2d } from "konva/lib/types";
import { subscribeWithSelector } from "zustand/middleware";

const fill = DEFAULT_COLOR;
const fontSize = 24;
const fontFamily = "Arial";
const fontStyle = "normal";
const lineHeight = 1;
const letterSpacing = 0;
const textDecoration = "";

export type State = {
  shapes: ShapeData[];
  selectedShapeIds: Record<Participant["id"], ShapeData["id"][]>;
  pendingShapeId: ShapeData["id"] | null;
  currentParticipantId: Participant["id"] | null;
  roomId: string | null;
  isPanning: boolean;
  currentTool: Tool;
  scale: number;
  cursorPositions: Record<Participant["id"], Vector2d | null>;
  participants: Participant[];
};

type Actions = {
  addShape: (initX: number, initY: number) => void;
  syncShapeData: (
    shapeId: ShapeData["id"],
    data: Record<string, unknown>
  ) => void;
  resizeShapes: (
    shapeIds: ShapeData["id"][],
    args:
      | { width: number; height?: number }
      | { width?: number; height: number }
  ) => void;
  moveShapes: (
    shapeIds: ShapeData["id"][],
    args: { x: number; y?: number } | { x?: number; y: number }
  ) => void;
  changeShapesColor: (
    shapeIds: ShapeData["id"][],
    color: string | undefined
  ) => void;
  changeShapesStroke: (
    shapeIds: ShapeData["id"][],
    color: string | undefined,
    width: number | undefined
  ) => void;
  deleteShapes: (shapeIds: ShapeData["id"][]) => void;
  confirmPendingShape: () => void;
  setPendingShapeId: (shapeId: ShapeData["id"]) => void;
  toggleSelectShape: (
    shapeId: ShapeData["id"],
    { isMultiSelect }: { isMultiSelect?: boolean }
  ) => void;
  unselectAll: () => void;
  setPanning: (isPanning: boolean) => void;
  changeScale: (newScale: number) => void;
  changeTool: (newTool: Tool) => void;
  updateLocalCursorPosition: (cursorPosition: Vector2d | null) => void;
  addParticipant: (newParticipant: Participant) => void;
  setCurrentParticipantId: (participantId: Participant["id"]) => void;
  setRoomId: (newRoomId: string) => void;
};

export const useStore = create<State & Actions>()(
  subscribeWithSelector(
    immer((set) => ({
      roomId: null,
      participants: [],
      shapes: [],
      selectedShapeIds: {},
      pendingShapeId: null,
      currentParticipantId: null,
      scale: 1,
      isPanning: false,
      currentTool: APP_TOOLS.MOVE,
      cursorPositions: {},
      addShape: (initx, initY) => {
        set((state) => {
          const newShape = initializeShape({
            currentToolId: state.currentTool.id,
            shapes: state.shapes,
            initX: initx,
            initY: initY,
          });

          if (!newShape) return;

          state.shapes.push(newShape);
          state.pendingShapeId = newShape.id;

          if (state.currentParticipantId) {
            state.selectedShapeIds[state.currentParticipantId] = [newShape.id];
          }
        });
      },
      syncShapeData: (shapeId, data) => {
        set((state) => {
          const shape = state.shapes.find((shape) => shape.id === shapeId);

          if (shape) {
            Object.assign(shape, data);
          }
        });
      },
      resizeShapes: (shapeIds, { width, height }) => {
        set((state) => {
          state.shapes
            .filter((shape) => shapeIds.includes(shape.id))
            .forEach((shape) => {
              if (width) shape.width = width;
              if (height) shape.height = height;

              if (shape.type === "ellipse") {
                if (width) shape.offsetX = -width / 2;
                if (height) shape.offsetY = -height / 2;
              }
            });
        });
      },
      moveShapes: (shapeIds, { x, y }) => {
        set((state) => {
          state.shapes
            .filter((shape) => shapeIds.includes(shape.id))
            .forEach((shape) => {
              if (x) shape.x = x;
              if (y) shape.y = y;
            });
        });
      },
      changeShapesColor: (shapeIds, color) => {
        set((state) => {
          state.shapes
            .filter((shape) => shapeIds.includes(shape.id))
            .forEach((shape) => {
              shape.fill = color;
            });
        });
      },
      changeShapesStroke(shapeIds, color, width) {
        set((state) => {
          state.shapes
            .filter((shape) => shapeIds.includes(shape.id))
            .forEach((shape) => {
              shape.stroke = color;
              shape.strokeWidth = width;
            });
        });
      },
      deleteShapes: (shapeIds) => {
        set((state) => {
          state.shapes = state.shapes.filter(
            (shape) => !shapeIds.includes(shape.id)
          );

          for (const participantId in state.selectedShapeIds) {
            const currentSelectedShapeIds =
              state.selectedShapeIds[participantId];

            state.selectedShapeIds[participantId] =
              currentSelectedShapeIds.filter(
                (shapeId) => !shapeIds.includes(shapeId)
              );
          }
        });
      },
      confirmPendingShape: () => {
        set((state) => {
          state.pendingShapeId = null;
          state.currentTool = APP_TOOLS.MOVE;
        });
      },
      setPendingShapeId: (shapeId) => {
        set((state) => {
          state.pendingShapeId = shapeId;
        });
      },
      toggleSelectShape: (shapeId, { isMultiSelect = false }) => {
        set((state) => {
          const currentParticipantId = state.currentParticipantId;

          if (!currentParticipantId) return;

          if (!state.selectedShapeIds[currentParticipantId]) {
            state.selectedShapeIds[currentParticipantId] = [shapeId];
          } else {
            if (isMultiSelect) {
              const shapeIndex = state.selectedShapeIds[
                currentParticipantId
              ].findIndex((id) => id === shapeId);

              if (shapeIndex === -1)
                state.selectedShapeIds[currentParticipantId].push(shapeId);
              else
                state.selectedShapeIds[currentParticipantId].splice(
                  shapeIndex,
                  1
                );
            } else {
              state.selectedShapeIds[currentParticipantId] = [shapeId];
            }
          }
        });
      },
      unselectAll: () => {
        set((state) => {
          if (!state.currentParticipantId) return;

          state.selectedShapeIds[state.currentParticipantId]?.splice(0);
        });
      },
      setPanning: (isPanning) => {
        set((state) => {
          state.isPanning = isPanning;
        });
      },
      changeScale: (newScale) => {
        set((state) => {
          state.scale = newScale;
        });
      },
      changeTool: (newTool) => {
        set((state) => {
          state.currentTool = newTool;
        });
      },
      updateLocalCursorPosition: (cursorPosition) => {
        set((state) => {
          if (!state.currentParticipantId) return;
          state.cursorPositions[state.currentParticipantId] = cursorPosition;
        });
      },
      setCurrentParticipantId: (participantId) => {
        set((state) => {
          state.currentParticipantId = participantId;
        });
      },
      addParticipant: (participant) => {
        set((state) => {
          state.participants.push(participant);
        });
      },
      setRoomId: (newRoomId) => {
        set((state) => {
          state.roomId = newRoomId;
        });
      },
    }))
  )
);

function initializeShape({
  currentToolId,
  shapes,
  initX,
  initY,
}: {
  currentToolId: Tool["id"];
  shapes: ShapeData[];
  initX: number;
  initY: number;
}): ShapeData | null {
  const id = crypto.randomUUID();

  const x = Math.round(initX);
  const y = Math.round(initY);

  switch (currentToolId) {
    case "rectangle":
      const rectangleIndex =
        shapes.filter((shape) => shape.type === "rectangle").length + 1;

      return {
        type: "rectangle",
        id,
        name: `Rectangle ${rectangleIndex}`,
        x,
        y,
        fill,
        width: 0,
        height: 0,
      };
    case "ellipse":
      const ellipseIndex =
        shapes.filter((shape) => shape.type === "ellipse").length + 1;

      return {
        type: "ellipse",
        id,
        name: `Ellipse ${ellipseIndex}`,
        x,
        y,
        fill,
        width: 0,
        height: 0,
      };
    case "text":
      return {
        type: "text",
        id,
        name: "",
        x,
        y,
        fill,
        text: "",
        fontSize,
        fontFamily,
        fontStyle,
        letterSpacing,
        lineHeight,
        textDecoration,
      };
    default:
      return null;
  }
}
