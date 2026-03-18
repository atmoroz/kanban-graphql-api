import 'dotenv/config';
import { createServer } from 'node:http';
import { createYoga } from 'graphql-yoga';
import type { IncomingMessage } from 'node:http';
import { execute, subscribe } from 'graphql';
import { WebSocketServer, type WebSocket } from 'ws';
import { useServer } from 'graphql-ws/use/ws';
import { schema } from './graphql/schema';
import { createContext } from './graphql/context';

const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_URL ?? '',
].filter(Boolean);

const yoga = createYoga({
  schema,
  graphqlEndpoint: '/graphql',
  context: createContext,
  landingPage: false,
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

const server = createServer((req, res) => {
  if (req.url === '/') {
    res.statusCode = 302;
    res.setHeader('Location', '/graphql');
    res.end();
    return;
  }

  yoga(req, res);
});

function toFetchRequest(req: IncomingMessage): Request {
  const host = req.headers.host ?? 'localhost';
  const url = new URL(req.url ?? '/graphql', `http://${host}`);

  // Node's IncomingMessage headers are compatible with fetch HeadersInit
  return new Request(url, {
    method: req.method,
    headers: req.headers as unknown as HeadersInit,
  });
}

// WebSocket server for GraphQL subscriptions (graphql-ws) on /graphql
const wsServer = new WebSocketServer({ noServer: true });

useServer(
  {
    schema,
    execute,
    subscribe,
    context: async (ctx: { extra: { request: IncomingMessage } }) => {
      // ctx.extra.request is the initial upgrade request (IncomingMessage)
      const request = toFetchRequest(ctx.extra.request);
      return createContext({ request });
    },
  },
  wsServer,
);

server.on('upgrade', (req, socket, head) => {
  // Accept WS upgrades only for the GraphQL endpoint
  const pathname = req.url ? new URL(req.url, 'http://localhost').pathname : '';
  if (pathname !== '/graphql') {
    socket.destroy();
    return;
  }

  wsServer.handleUpgrade(req, socket, head, (ws: WebSocket) => {
    wsServer.emit('connection', ws, req);
  });
});

const PORT = Number(process.env.PORT ?? 4001);

server.listen(PORT, () => {
  console.log(`🚀 GraphQL Yoga running at http://localhost:${PORT}/graphql`);
});
