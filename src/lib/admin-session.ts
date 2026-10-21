import type { QueryClient } from "@tanstack/react-query";

export async function endAdminSession(queryClient: QueryClient, logout: () => Promise<unknown>) {
  // Stop an earlier status request from restoring the unlocked UI after logout.
  await queryClient.cancelQueries({ queryKey: ["admin"] });
  await logout();
  // Keep the mounted status observer attached and notify it immediately.
  queryClient.setQueryData(["admin", "status"], { unlocked: false });
  queryClient.removeQueries({
    predicate: (query) => query.queryKey[0] === "admin" && query.queryKey[1] !== "status",
  });
}
