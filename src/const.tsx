import type { Tool } from "./types";

export const APP_TOOLS: Record<string, Tool> = {
  MOVE: { id: "move", shortcut: "v" },
  RECTANGLE: { id: "rectangle", shortcut: "r" },
  ELLIPSE: { id: "ellipse", shortcut: "o" },
  TEXT: { id: "text", shortcut: "t" },
} as const;

export const ZOOM_FACTOR = 1.05;
export const MAX_ZOOM = 25;
export const MIN_ZOOM = 0.02;
export const DEFAULT_COLOR = "#DDDDDD";
