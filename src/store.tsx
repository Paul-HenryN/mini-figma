import { immer } from "zustand/middleware/immer";
import { create } from "zustand";
import type { Participant, ShapeData, Tool } from "./types";
import { APP_TOOLS } from "./const";
import type { Vector2d } from "konva/lib/types";
import { subscribeWithSelector } from "zustand/middleware";

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
  addShape: (newShape: ShapeData) => void;
  syncShapeData: (shapeId: ShapeData["id"], data: Record<string, any>) => void;
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
      addShape: (newShape) => {
        set((state) => {
          state.shapes.push(newShape);
          state.pendingShapeId = newShape.id;

          if (state.currentParticipantId) {
            state.selectedShapeIds[state.currentParticipantId] = [newShape.id];
          }
        });
      },
      syncShapeData: (shapeId, data) => {
        set((state) => {
          let shape = state.shapes.find((shape) => shape.id === shapeId);

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
                shape.offsetX = -shape.width / 2;
                shape.offsetY = -shape.height / 2;
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
        });
      },
      confirmPendingShape: () => {
        set((state) => {
          state.pendingShapeId = null;
          state.currentTool = APP_TOOLS.MOVE;
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

          state.selectedShapeIds[state.currentParticipantId] = [];
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
