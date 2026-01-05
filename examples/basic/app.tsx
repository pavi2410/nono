import {
  Server,
  Route,
  Prefix,
  GET,
  POST,
  Middleware,
  listen,
  type MiddlewareFn,
} from "nono";

// Example middleware: simple logger
const logger: MiddlewareFn = async (req, next) => {
  const start = Date.now();
  const res = await next();
  console.log(`${req.method} ${req.url} - ${Date.now() - start}ms`);
  return res;
};

// Example middleware: auth check
const auth: MiddlewareFn = async (req, next) => {
  const token = req.headers.get("Authorization");
  if (!token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return next();
};

// In-memory "database"
const users = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" },
];

const app = (
  <Server port={3000}>
    <Middleware use={logger}>
      {/* Public routes */}
      <Route path="/">
        <GET handler={() => Response.json({ message: "Welcome to Nono!" })} />
      </Route>

      <Route path="/health">
        <GET handler={() => Response.json({ status: "ok" })} />
      </Route>

      {/* API routes with auth */}
      <Prefix path="/api">
        <Middleware use={auth}>
          <Route path="/users">
            <GET handler={() => Response.json({ users })} />
            <POST
              handler={async (req) => {
                const body = await req.json() as { name: string };
                const newUser = { id: users.length + 1, name: body.name };
                users.push(newUser);
                return Response.json(newUser, { status: 201 });
              }}
            />
          </Route>
        </Middleware>
      </Prefix>
    </Middleware>
  </Server>
);

listen(app);
