import { Canvas } from "./Canvas";
import { SidebarProvider } from "./components/ui/sidebar";
import { PropsSidebar } from "./PropsSidebar";
import { Toolbar } from "./Toolbar";

function App() {
  return (
    <SidebarProvider>
      <PropsSidebar />

      <Canvas />
      <Toolbar />
    </SidebarProvider>
  );
}

export default App;
