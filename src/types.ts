export type User = {
  id: string;
  name: string;
};

export type Tool = {
  id: "move" | "ellipse" | "rectangle" | "text";
  shortcut?: string;
};

export type TextShape = {
  type: "text";
  text: string;
  fontSize: number;
  fontFamily: string;
  fontStyle: string;
  lineHeight: number;
  letterSpacing: number;
  textDecoration: string;
};

export type ShapeData = {
  id: string;
  name: string;
  x: number;
  y: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  offsetX?: number;
  offsetY?: number;
  width?: number;
  height?: number;
  rotation?: number;
} & (
  | {
      type: "rectangle";
    }
  | {
      type: "ellipse";
    }
  | TextShape
);

export type Participant = {
  id: string;
  name: string;
  color?: string;
  joinedAt: number;
};
