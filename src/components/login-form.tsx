import logo from "@/assets/logo.png";
import { ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/auth-context";

type FormData = {
  username: string;
  action: "create" | "join";
  roomId?: string;
  roomName?: string;
};

enum FormStep {
  Username = 1,
  Action = 2,
  Room = 3,
}

export function LoginForm({
  onSubmit,
}: {
  onSubmit?: (roomId: string) => void;
}) {
  const { setUser } = useAuth();

  const [formData, setFormData] = useState<FormData>({
    username: "",
    action: "create",
    roomId: "",
    roomName: "",
  });

  const [currentStep, setCurrentStep] = useState<FormStep>(FormStep.Username);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (currentStep === FormStep.Username) {
      setCurrentStep(FormStep.Action);
    }

    if (currentStep === FormStep.Action) {
      setCurrentStep(FormStep.Room);
    }

    if (currentStep === FormStep.Room) {
      setUser({ id: crypto.randomUUID(), name: formData.username });

      if (formData.action === "create") {
        const newRoomId =
          formData.roomName?.toLowerCase().replace(/\s+/g, "-") +
          "-" +
          Math.floor(Math.random() * 10000);

        onSubmit?.(newRoomId);
      } else {
        onSubmit?.(formData.roomId!);
      }
    }
  };

  return (
    <form className="p-6 md:p-8" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-center gap-2">
          <img src={logo} alt="Mosaic logo" className="size-8" />
          <h1 className="text-2xl">Mosaic</h1>
        </div>

        {currentStep === FormStep.Username && (
          <p className="text-muted-foreground text-center text-balance">
            Welcome, how should we call you?
          </p>
        )}

        <div className="input-group">
          <label htmlFor="username">Username</label>

          <Input
            id="username"
            type="text"
            placeholder="Username"
            value={formData.username}
            onChange={(e) =>
              setFormData({ ...formData, username: e.target.value })
            }
            required
          />
        </div>

        {currentStep >= FormStep.Action && (
          <fieldset id="" className="grid grid-cols-2 gap-2">
            <legend className="mb-2">What would you like to do?</legend>

            <input
              type="radio"
              name="action"
              id="create"
              className="sr-only"
              checked={formData.action === "create"}
              onChange={() => setFormData({ ...formData, action: "create" })}
            />

            <Button
              type="button"
              variant={formData.action === "create" ? "default" : "outline"}
              asChild
            >
              <label htmlFor="create">Create room</label>
            </Button>

            <input
              type="radio"
              name="action"
              id="join"
              className="sr-only"
              checked={formData.action === "join"}
              onChange={() => setFormData({ ...formData, action: "join" })}
            />

            <Button
              type="button"
              variant={formData.action === "join" ? "default" : "outline"}
              asChild
            >
              <label htmlFor="join">Join room</label>
            </Button>
          </fieldset>
        )}

        {currentStep === FormStep.Room && (
          <div className="input-group">
            {formData.action === "join" ? (
              <>
                <label htmlFor="roomId">Room ID</label>

                <Input
                  id="roomId"
                  type="text"
                  placeholder="Room ID"
                  required
                  value={formData.roomId}
                  onChange={(e) =>
                    setFormData({ ...formData, roomId: e.target.value })
                  }
                />
              </>
            ) : (
              <>
                {" "}
                <label htmlFor="roomName">Room Name</label>
                <Input
                  id="roomName"
                  type="text"
                  placeholder="Room Name"
                  required
                  value={formData.roomName}
                  onChange={(e) =>
                    setFormData({ ...formData, roomName: e.target.value })
                  }
                />
              </>
            )}
          </div>
        )}

        <Button type="submit" className="w-full">
          {currentStep === FormStep.Room ? "Start" : "Continue"}{" "}
          <ArrowRightIcon />
        </Button>
      </div>
    </form>
  );
}
