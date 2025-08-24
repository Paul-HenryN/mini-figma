import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <main>
      <Dialog open={true}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>👋🏿 Hey there ! </DialogTitle>
          </DialogHeader>

          <p className="my-4">
            Start a new room or join an existing one to start designing.
          </p>

          <DialogFooter>
            <Button variant="outline" disabled>
              Join a room
            </Button>

            <Button asChild>
              <Link to="/$roomId" params={{ roomId: crypto.randomUUID() }}>
                Create new room
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
