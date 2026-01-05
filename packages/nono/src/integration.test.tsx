import { test, expect, describe, beforeAll, afterAll } from "bun:test";
import { Server, Route, GET, POST, Middleware, listen } from "./index.ts";
import type { MiddlewareFn } from "./components.ts";

describe("integration", () => {
  const PORT = 54321;
  const BASE = `http://localhost:${PORT}`;
  let server: ReturnType<typeof Bun.serve>;

  // Middleware for testing
  const addHeader: MiddlewareFn = async (_req, next) => {
    const res = await next();
    res.headers.set("X-Custom", "added");
    return res;
  };

  const auth: MiddlewareFn = async (req, next) => {
    if (!req.headers.get("Authorization")) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    return next();
  };

  beforeAll(() => {
    const app = (
      <Server port={PORT}>
        {/* Basic GET */}
        <Route path="/">
          <GET handler={() => Response.json({ hello: "world" })} />
        </Route>

        {/* POST with body */}
        <Route path="/echo">
          <POST
            handler={async (req) => {
              const body = await req.json();
              return Response.json({ received: body });
            }}
          />
        </Route>

        {/* Nested routes */}
        <Route path="/api">
          <Route path="/users">
            <GET handler={() => Response.json({ users: ["alice", "bob"] })} />
          </Route>
        </Route>

        {/* Middleware that modifies response */}
        <Route path="/with-header">
          <Middleware use={addHeader}>
            <Route path="">
              <GET handler={() => new Response("ok")} />
            </Route>
          </Middleware>
        </Route>

        {/* Auth middleware */}
        <Middleware use={auth}>
          <Route path="/protected">
            <GET handler={() => Response.json({ secret: "data" })} />
          </Route>
        </Middleware>
      </Server>
    );

    server = listen(app);
  });

  afterAll(() => {
    server?.stop();
  });

  test("serves GET request", async () => {
    const res = await fetch(BASE + "/");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ hello: "world" });
  });

  test("serves POST request with body", async () => {
    const res = await fetch(BASE + "/echo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "test" }),
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: { message: "test" } });
  });

  test("nested routes work correctly", async () => {
    const res = await fetch(BASE + "/api/users");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ users: ["alice", "bob"] });
  });

  test("middleware modifies response", async () => {
    const res = await fetch(BASE + "/with-header");
    expect(res.headers.get("X-Custom")).toBe("added");
  });

  test("auth middleware blocks unauthorized requests", async () => {
    const res = await fetch(BASE + "/protected");
    expect(res.status).toBe(401);
  });

  test("auth middleware allows authorized requests", async () => {
    const res = await fetch(BASE + "/protected", {
      headers: { Authorization: "Bearer token" },
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ secret: "data" });
  });

  test("404 for unknown routes", async () => {
    const res = await fetch(BASE + "/nonexistent");
    expect(res.status).toBe(404);
  });
});
