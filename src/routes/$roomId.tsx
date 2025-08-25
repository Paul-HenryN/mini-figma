import { useAuth } from "@/auth-context";
import { Canvas } from "@/components/Canvas";
import { LayersSidebar } from "@/components/LayersSidebar";
import { PropsSidebar } from "@/components/PropsSidebar";
import { Toolbar } from "@/components/Toolbar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useStore } from "@/store";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";

export const Route = createFileRoute("/$roomId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { user } = useAuth();
  const state = useStore(
    useShallow((state) => ({
      setCurrentParticipantId: state.setCurrentParticipantId,
      addParticipant: state.addParticipant,
      setRoomId: state.setRoomId,
      participants: state.participants,
    }))
  );

  const roomId = Route.useParams().roomId;

  useEffect(() => {
    if (!user) return;

    state.setRoomId(roomId);
    state.setCurrentParticipantId(user.id);
  }, [user, roomId]);

  return (
    <SidebarProvider>
      <LayersSidebar />
      <PropsSidebar />
      <Canvas />
      <Toolbar />
    </SidebarProvider>
  );
}
