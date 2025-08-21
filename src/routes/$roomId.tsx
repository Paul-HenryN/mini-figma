import { Canvas } from "@/components/Canvas";
import { LayersSidebar } from "@/components/LayersSidebar";
import { PropsSidebar } from "@/components/PropsSidebar";
import { Toolbar } from "@/components/Toolbar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppContextProvider } from "@/context";
import { RealtimeManager } from "@/components/RealtimeManager";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$roomId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { roomId } = Route.useParams();

  return (
    <AppContextProvider roomId={roomId}>
      <RealtimeManager />

      <SidebarProvider>
        <LayersSidebar />
        <PropsSidebar />
        <Canvas />
        <Toolbar />
      </SidebarProvider>
    </AppContextProvider>
  );
}
