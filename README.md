# Nono

A fun JSX-based web server framework for Bun. Define your routes declaratively using JSX, just like React Router but for the server side.

## Installation

```bash
bun install
```

## Quick Start

```tsx
import { Server, Route, Prefix, GET, POST, Middleware, listen } from "nono";

const app = (
  <Server port={3000}>
    <Route path="/">
      <GET handler={() => Response.json({ message: "Hello, Nono!" })} />
    </Route>

    <Prefix path="/api">
      <Route path="/users">
        <GET handler={() => Response.json({ users: [] })} />
        <POST handler={async (req) => {
          const body = await req.json();
          return Response.json(body, { status: 201 });
        }} />
      </Route>
    </Prefix>
  </Server>
);

listen(app);
```

## Features

- **JSX Routing** - Define routes declaratively with JSX components
- **Nested Routes** - Use `<Prefix>` to group routes under a common path
- **HTTP Methods** - `<GET>` and `<POST>` components for method-specific handlers
- **Middleware** - `<Middleware>` component with proper chaining support
- **Built for Bun** - Compiles to Bun's native route format

## Components

### `<Server>`
Root component that holds server configuration.

```tsx
<Server port={3000}>
  {/* routes */}
</Server>
```

### `<Route>`
Defines a route at a specific path.

```tsx
<Route path="/users">
  <GET handler={getUsers} />
  <POST handler={createUser} />
</Route>
```

### `<Prefix>`
Groups routes under a common path prefix.

```tsx
<Prefix path="/api">
  <Route path="/users">{/* ... */}</Route>
  <Route path="/posts">{/* ... */}</Route>
</Prefix>
```

### `<GET>` / `<POST>`
HTTP method handlers. Handlers receive a standard `Request` and return a `Response`.

```tsx
<GET handler={(req) => Response.json({ ok: true })} />
<POST handler={async (req) => {
  const body = await req.json();
  return Response.json(body, { status: 201 });
}} />
```

### `<Middleware>`
Wraps routes with middleware functions.

```tsx
const logger: MiddlewareFn = async (req, next) => {
  console.log(`${req.method} ${req.url}`);
  return next();
};

<Middleware use={logger}>
  <Route path="/">{/* ... */}</Route>
</Middleware>
```

## Running the Example

```bash
cd examples/basic
bun run app.tsx
```

Then test with:
```bash
curl http://localhost:3000/
curl http://localhost:3000/health
curl http://localhost:3000/api/users -H "Authorization: Bearer token"
```

## How It Works

Nono uses JSX as a DSL (domain-specific language) for defining routes. Under the hood:

1. JSX compiles to function calls via a custom JSX runtime
2. Each component returns a config node object
3. The node tree is walked to build Bun's native `routes` object
4. `listen()` calls `Bun.serve()` with the compiled routes

## License

MIT
