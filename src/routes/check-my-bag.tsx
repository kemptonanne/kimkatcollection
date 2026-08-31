import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/check-my-bag")({
  beforeLoad: () => {
    throw redirect({ to: "/view-bag", statusCode: 301 });
  },
});
