import type { NonoNode } from "./jsx-runtime.ts";
import { compile } from "./compiler.ts";

export interface ListenOptions {
  port?: number;
}

export function listen(app: NonoNode, options?: ListenOptions) {
  const port = options?.port ?? (app.props.port as number | undefined) ?? 3000;
  const routes = compile(app);

  console.log(`Nono server starting on http://localhost:${port}`);
  console.log("Routes:", Object.keys(routes).join(", ") || "(none)");

  return Bun.serve({
    port,
    routes,
    fetch(req) {
      return new Response("Not Found", { status: 404 });
    },
  });
}
