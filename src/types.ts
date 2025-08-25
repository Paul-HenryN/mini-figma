export type User = {
  id: string;
  name: string;
};

export type Tool = {
  id: "move" | "ellipse" | "rectangle" | "text";
  shortcut?: string;
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
  width: number;
  height: number;
} & (
  | {
      type: "rectangle";
    }
  | {
      type: "ellipse";
    }
  | {
      type: "text";
      text: string;
      fontSize: number;
      fontFamily: string;
      fontStyle: string;
      lineHeight: number;
      letterSpacing: number;
      textDecoration: string;
    }
);

export type Participant = {
  id: string;
  color?: string;
  joinedAt: number;
};
