import { Canvas } from "./Canvas";
import { SidebarProvider } from "./components/ui/sidebar";
import { LayersSidebar } from "./LayersSidebar";
import { PropsSidebar } from "./PropsSidebar";
import { Toolbar } from "./Toolbar";

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
