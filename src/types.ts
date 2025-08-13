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
} & (
  | {
      type: "rectangle";
      width: number;
      height: number;
    }
  | {
      type: "ellipse";
      width: number;
      height: number;
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
