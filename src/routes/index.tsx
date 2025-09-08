import { Card, CardContent } from "@/components/ui/card";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import coverImg from "@/assets/cover.png";
import { LoginForm } from "@/components/login-form";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();

  const handleLogin = (roomId: string) => {
    navigate({ to: "/$roomId", params: { roomId } });
  };

  return (
    <main className="grid place-items-center min-h-screen bg-background p-4">
      <div className="flex flex-col gap-6 w-full max-w-3xl">
        <Card className="overflow-hidden p-0 bg-sidebar">
          <CardContent className="grid p-0 md:grid-cols-2">
            <LoginForm onSubmit={handleLogin} />

            <div className="bg-muted relative hidden md:block">
              <img
                src={coverImg}
                alt="Image"
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
          </CardContent>
        </Card>

        <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
          Developed by <b>Paul-Henry Ngounou</b> |{" "}
          <a
            href="https://github.com/Paul-HenryN"
            className="underline underline-offset-4"
          >
            GH
          </a>
          {"  "}
          <a
            href="https://www.linkedin.com/in/paul-henry-ngounou-592194285/"
            className="underline underline-offset-4"
          >
            LKDN
          </a>
        </div>
      </div>
    </main>
  );
}
