import type { Tool } from "./types";

export const UI_COLOR = "#1c9cf0"; // Primary app color

export const APP_TOOLS: Record<string, Tool> = {
  MOVE: { id: "move", shortcut: "v" },
  RECTANGLE: { id: "rectangle", shortcut: "r" },
  ELLIPSE: { id: "ellipse", shortcut: "o" },
  TEXT: { id: "text", shortcut: "t" },
} as const;

export const PARTICIPANT_COLORS: string[] = [
  "#E69F00", // Orange
  "#009E73", // bluish green
  "#F0E442", // yellow
  "#0072B2", // blue
  "#D55E00", // vermillion
  "#CC79A7", // reddish purple
  "#999999", // gray
  "#B2182B", // dark red
  "#2166AC", // deep blue
  "#4DAF4A", // green
  "#984EA3", // purple
  "#FF7F00", // bright orange
  "#A6CEE3", // light blue
  "#FDBF6F", // light orange
];

export const ZOOM_FACTOR = 1.05;
export const MAX_ZOOM = 25;
export const MIN_ZOOM = 0.02;
export const DEFAULT_COLOR = "#DDDDDD";
export const DEFAULT_STROKE_COLOR = "#000000";
export const DEFAULT_STROKE_WIDTH = 1;
export const MAX_STROKE_WIDTH = 1000;
