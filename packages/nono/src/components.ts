import type { NonoNode } from "./jsx-runtime.ts";

export type Handler = (req: Request) => Response | Promise<Response>;
export type MiddlewareFn = (
  req: Request,
  next: () => Response | Promise<Response>
) => Response | Promise<Response>;

export interface ServerProps {
  port?: number;
  children?: NonoNode | NonoNode[];
}

export interface RouteProps {
  path: string;
  children?: NonoNode | NonoNode[];
}

export interface PrefixProps {
  path: string;
  children?: NonoNode | NonoNode[];
}

export interface MethodProps {
  handler: Handler;
}

export interface MiddlewareProps {
  use: MiddlewareFn | MiddlewareFn[];
  children?: NonoNode | NonoNode[];
}

export function Server(_props: ServerProps): NonoNode {
  return null as unknown as NonoNode;
}

export function Route(_props: RouteProps): NonoNode {
  return null as unknown as NonoNode;
}

export function Prefix(_props: PrefixProps): NonoNode {
  return null as unknown as NonoNode;
}

export function GET(_props: MethodProps): NonoNode {
  return null as unknown as NonoNode;
}

export function POST(_props: MethodProps): NonoNode {
  return null as unknown as NonoNode;
}

export function Middleware(_props: MiddlewareProps): NonoNode {
  return null as unknown as NonoNode;
}
