import { describe, expect, test } from "bun:test";
import { QueryClient, QueryObserver } from "@tanstack/react-query";
import { endAdminSession } from "../src/lib/admin-session";

describe("admin logout", () => {
  test("updates the mounted session observer and clears only private admin data", async () => {
    const client = new QueryClient();
    client.setQueryData(["admin", "status"], { unlocked: true });
    client.setQueryData(["admin", "products"], [{ id: "private" }]);
    client.setQueryData(["products"], [{ id: "public" }]);
    const observer = new QueryObserver(client, { queryKey: ["admin", "status"], enabled: false });
    const unsubscribe = observer.subscribe(() => {});
    await endAdminSession(client, async () => {});
    expect(observer.getCurrentResult().data).toEqual({ unlocked: false });
    expect(client.getQueryData(["admin", "products"])).toBeUndefined();
    expect(client.getQueryData(["products"])).toEqual([{ id: "public" }]);
    unsubscribe();
    client.clear();
  });
  test("does not show a successful lock when the server rejects logout", async () => {
    const client = new QueryClient();
    client.setQueryData(["admin", "status"], { unlocked: true });
    await expect(
      endAdminSession(client, async () => {
        throw new Error("Offline");
      }),
    ).rejects.toThrow("Offline");
    expect(client.getQueryData(["admin", "status"])).toEqual({ unlocked: true });
    client.clear();
  });
  test("an earlier status response cannot unlock the UI after logout", async () => {
    const client = new QueryClient();
    client.setQueryData(["admin", "status"], { unlocked: true });
    let finish!: (value: { unlocked: boolean }) => void;
    const request = client
      .fetchQuery({
        queryKey: ["admin", "status"],
        queryFn: () =>
          new Promise<{ unlocked: boolean }>((resolve) => {
            finish = resolve;
          }),
      })
      .catch(() => {});
    await endAdminSession(client, async () => {});
    finish({ unlocked: true });
    await request;
    expect(client.getQueryData(["admin", "status"])).toEqual({ unlocked: false });
    client.clear();
  });
});
