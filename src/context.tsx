import React, {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { Tool } from "./types";
import { APP_TOOLS, MAX_ZOOM, MIN_ZOOM, ZOOM_FACTOR } from "./const";

type AppContextType = {
  currentTool: Tool;
  setCurrentTool: Dispatch<SetStateAction<Tool>>;
  scale: number;
  setScale: Dispatch<SetStateAction<number>>;
  onZoom: ({ isZoomIn }: { isZoomIn: boolean }) => void;
};

const AppContext = createContext<AppContextType>({
  currentTool: APP_TOOLS.MOVE,
  setCurrentTool: () => {},
  scale: 1,
  setScale: () => {},
  onZoom: () => {},
});

export function AppContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currentTool, setCurrentTool] = useState<Tool>({ id: "move" });
  const [scale, setScale] = useState<number>(1);

  const onZoom = ({ isZoomIn }: { isZoomIn: boolean }) => {
    const newScale = isZoomIn ? scale * ZOOM_FACTOR : scale / ZOOM_FACTOR;
    setScale(Math.max(MIN_ZOOM, Math.min(newScale, MAX_ZOOM)));
  };

  return (
    <AppContext.Provider
      value={{ currentTool, setCurrentTool, scale, setScale, onZoom }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
