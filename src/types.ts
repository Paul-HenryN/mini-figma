export type Tool = {
  id: "move" | "ellipse" | "rectangle" | "text";
  shortcut?: string;
};

export type ShapeData =
  | {
      id: string;
      type: "rectangle";
      x: number;
      y: number;
      width: number;
      height: number;
      fill: string;
    }
  | {
      id: string;
      type: "ellipse";
      x: number;
      y: number;
      radiusX: number;
      radiusY: number;
      fill: string;
      offsetX?: number;
      offsetY?: number;
    }
  | {
      id: string;
      type: "text";
      x: number;
      y: number;
      text: string;
      fill: string;
      fontSize: number;
      fontFamily: string;
      fontStyle: string;
      lineHeight: number;
      letterSpacing: number;
      textDecoration: string;
    };
