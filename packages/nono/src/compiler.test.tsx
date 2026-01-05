import { test, expect, describe } from "bun:test";
import { compile } from "./compiler.ts";
import { Server, Route, GET, POST, Middleware } from "./components.ts";
import type { Handler, MiddlewareFn } from "./components.ts";

describe("compiler", () => {
  describe("simple routes", () => {
    test("compiles single GET route", () => {
      const handler: Handler = () => new Response("ok");
      const app = (
        <Server>
          <Route path="/">
            <GET handler={handler} />
          </Route>
        </Server>
      );
      const routes = compile(app);

      expect(Object.keys(routes)).toEqual(["/"]);
      expect(routes["/"]).toHaveProperty("GET");
    });

    test("compiles single POST route", () => {
      const handler: Handler = () => new Response("created");
      const app = (
        <Server>
          <Route path="/users">
            <POST handler={handler} />
          </Route>
        </Server>
      );
      const routes = compile(app);

      expect(Object.keys(routes)).toEqual(["/users"]);
      expect(routes["/users"]).toHaveProperty("POST");
    });

    test("compiles multiple methods on same route", () => {
      const getHandler: Handler = () => new Response("get");
      const postHandler: Handler = () => new Response("post");
      const app = (
        <Server>
          <Route path="/items">
            <GET handler={getHandler} />
            <POST handler={postHandler} />
          </Route>
        </Server>
      );
      const routes = compile(app);

      expect(routes["/items"]).toHaveProperty("GET");
      expect(routes["/items"]).toHaveProperty("POST");
    });

    test("compiles multiple routes", () => {
      const handler: Handler = () => new Response("ok");
      const app = (
        <Server>
          <Route path="/">
            <GET handler={handler} />
          </Route>
          <Route path="/health">
            <GET handler={handler} />
          </Route>
        </Server>
      );
      const routes = compile(app);

      expect(Object.keys(routes).sort()).toEqual(["/", "/health"]);
    });
  });

  describe("nested routes", () => {
    test("compiles nested routes with correct path", () => {
      const handler: Handler = () => new Response("ok");
      const app = (
        <Server>
          <Route path="/api">
            <Route path="/users">
              <GET handler={handler} />
            </Route>
          </Route>
        </Server>
      );
      const routes = compile(app);

      expect(Object.keys(routes)).toEqual(["/api/users"]);
    });

    test("compiles deeply nested routes", () => {
      const handler: Handler = () => new Response("ok");
      const app = (
        <Server>
          <Route path="/api">
            <Route path="/v1">
              <Route path="/users">
                <GET handler={handler} />
              </Route>
            </Route>
          </Route>
        </Server>
      );
      const routes = compile(app);

      expect(Object.keys(routes)).toEqual(["/api/v1/users"]);
    });

    test("parent route can have handlers alongside nested routes", () => {
      const parentHandler: Handler = () => new Response("parent");
      const childHandler: Handler = () => new Response("child");
      const app = (
        <Server>
          <Route path="/api">
            <GET handler={parentHandler} />
            <Route path="/users">
              <GET handler={childHandler} />
            </Route>
          </Route>
        </Server>
      );
      const routes = compile(app);

      expect(Object.keys(routes).sort()).toEqual(["/api", "/api/users"]);
    });
  });

  describe("middleware", () => {
    test("middleware wraps handler", async () => {
      const calls: string[] = [];

      const middleware: MiddlewareFn = async (req, next) => {
        calls.push("middleware:before");
        const res = await next();
        calls.push("middleware:after");
        return res;
      };

      const handler: Handler = () => {
        calls.push("handler");
        return new Response("ok");
      };

      const app = (
        <Server>
          <Middleware use={middleware}>
            <Route path="/">
              <GET handler={handler} />
            </Route>
          </Middleware>
        </Server>
      );
      const routes = compile(app);

      // Call the compiled handler
      const compiledHandler = (routes["/"] as { GET: Handler }).GET;
      await compiledHandler(new Request("http://localhost/"));

      expect(calls).toEqual(["middleware:before", "handler", "middleware:after"]);
    });

    test("multiple middlewares chain correctly", async () => {
      const calls: string[] = [];

      const outer: MiddlewareFn = async (req, next) => {
        calls.push("outer:before");
        const res = await next();
        calls.push("outer:after");
        return res;
      };

      const inner: MiddlewareFn = async (req, next) => {
        calls.push("inner:before");
        const res = await next();
        calls.push("inner:after");
        return res;
      };

      const handler: Handler = () => {
        calls.push("handler");
        return new Response("ok");
      };

      const app = (
        <Server>
          <Middleware use={outer}>
            <Middleware use={inner}>
              <Route path="/">
                <GET handler={handler} />
              </Route>
            </Middleware>
          </Middleware>
        </Server>
      );
      const routes = compile(app);

      const compiledHandler = (routes["/"] as { GET: Handler }).GET;
      await compiledHandler(new Request("http://localhost/"));

      expect(calls).toEqual([
        "outer:before",
        "inner:before",
        "handler",
        "inner:after",
        "outer:after",
      ]);
    });

    test("middleware array applies in order", async () => {
      const calls: string[] = [];

      const first: MiddlewareFn = async (req, next) => {
        calls.push("first");
        return next();
      };

      const second: MiddlewareFn = async (req, next) => {
        calls.push("second");
        return next();
      };

      const handler: Handler = () => {
        calls.push("handler");
        return new Response("ok");
      };

      const app = (
        <Server>
          <Middleware use={[first, second]}>
            <Route path="/">
              <GET handler={handler} />
            </Route>
          </Middleware>
        </Server>
      );
      const routes = compile(app);

      const compiledHandler = (routes["/"] as { GET: Handler }).GET;
      await compiledHandler(new Request("http://localhost/"));

      expect(calls).toEqual(["first", "second", "handler"]);
    });

    test("middleware can short-circuit", async () => {
      const calls: string[] = [];

      const authMiddleware: MiddlewareFn = async (req, next) => {
        calls.push("auth");
        if (!req.headers.get("Authorization")) {
          return new Response("Unauthorized", { status: 401 });
        }
        return next();
      };

      const handler: Handler = () => {
        calls.push("handler");
        return new Response("ok");
      };

      const app = (
        <Server>
          <Middleware use={authMiddleware}>
            <Route path="/">
              <GET handler={handler} />
            </Route>
          </Middleware>
        </Server>
      );
      const routes = compile(app);

      const compiledHandler = (routes["/"] as { GET: Handler }).GET;

      // Without auth header
      const res1 = await compiledHandler(new Request("http://localhost/"));
      expect(res1.status).toBe(401);
      expect(calls).toEqual(["auth"]);

      // With auth header
      calls.length = 0;
      const res2 = await compiledHandler(
        new Request("http://localhost/", {
          headers: { Authorization: "Bearer token" },
        })
      );
      expect(res2.status).toBe(200);
      expect(calls).toEqual(["auth", "handler"]);
    });
  });

  describe("edge cases", () => {
    test("route without methods produces no entry", () => {
      const app = (
        <Server>
          <Route path="/empty"></Route>
        </Server>
      );
      const routes = compile(app);

      expect(Object.keys(routes)).toEqual([]);
    });

    test("empty server produces no routes", () => {
      const app = <Server></Server>;
      const routes = compile(app);

      expect(routes).toEqual({});
    });
  });
});
