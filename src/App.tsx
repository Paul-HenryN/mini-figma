import { Canvas } from "./components/Canvas";
import { SidebarProvider } from "./components/ui/sidebar";
import { PropsSidebar } from "./components/PropsSidebar";
import { LayersSidebar } from "./components/LayersSidebar";
import { Toolbar } from "./components/Toolbar";

function App() {
  return (
    <SidebarProvider>
      <LayersSidebar />
      <PropsSidebar />
      <Canvas />
      <Toolbar />
    </SidebarProvider>
  );
}

export default App;
