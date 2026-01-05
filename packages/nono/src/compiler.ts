import type { NonoNode } from "./jsx-runtime.ts";
import type { Handler, MiddlewareFn } from "./components.ts";

type HttpMethod = "GET" | "POST";
type RouteHandler = Handler | { [method in HttpMethod]?: Handler };
type BunRoutes = Record<string, RouteHandler>;

interface CompileContext {
  pathPrefix: string;
  middlewares: MiddlewareFn[];
}

function wrapWithMiddleware(
  handler: Handler,
  middlewares: MiddlewareFn[]
): Handler {
  if (middlewares.length === 0) return handler;

  return (req: Request) => {
    let index = 0;
    const next = (): Response | Promise<Response> => {
      if (index < middlewares.length) {
        const middleware = middlewares[index++]!;
        return middleware(req, next);
      }
      return handler(req);
    };
    return next();
  };
}

function compileNode(
  node: NonoNode,
  context: CompileContext,
  routes: BunRoutes
): void {
  const { type, props, children } = node;

  switch (type) {
    case "Server": {
      for (const child of children) {
        compileNode(child, context, routes);
      }
      break;
    }

    case "Route": {
      const path = props.path as string;
      const fullPath = context.pathPrefix + path;
      const methodHandlers: Record<string, Handler> = {};
      const nestedContext: CompileContext = {
        pathPrefix: fullPath,
        middlewares: [...context.middlewares],
      };

      for (const child of children) {
        if (child.type === "GET" || child.type === "POST") {
          const handler = child.props.handler as Handler;
          methodHandlers[child.type] = wrapWithMiddleware(
            handler,
            context.middlewares
          );
        } else if (child.type === "Route" || child.type === "Middleware") {
          compileNode(child, nestedContext, routes);
        }
      }

      if (Object.keys(methodHandlers).length > 0) {
        routes[fullPath] = methodHandlers;
      }
      break;
    }

    case "Middleware": {
      const use = props.use as MiddlewareFn | MiddlewareFn[];
      const middlewareList = Array.isArray(use) ? use : [use];
      const newContext: CompileContext = {
        pathPrefix: context.pathPrefix,
        middlewares: [...context.middlewares, ...middlewareList],
      };

      for (const child of children) {
        compileNode(child, newContext, routes);
      }
      break;
    }

    case "Fragment": {
      for (const child of children) {
        compileNode(child, context, routes);
      }
      break;
    }
  }
}

export function compile(root: NonoNode): BunRoutes {
  const routes: BunRoutes = {};
  const context: CompileContext = {
    pathPrefix: "",
    middlewares: [],
  };

  compileNode(root, context, routes);
  return routes;
}
