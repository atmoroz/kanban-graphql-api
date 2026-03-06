import 'dotenv/config';
import { createServer } from 'node:http';
import { createYoga } from 'graphql-yoga';
import { schema } from './graphql/schema';
import { createContext } from './graphql/context';

const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_URL ?? '',
].filter(Boolean);

const yoga = createYoga({
  schema,
  graphqlEndpoint: '/graphql',
  // Передаємо і request, і responseHeaders в createContext,
  // щоб резолвери могли встановлювати cookies.
  context: initialContext =>
    createContext({
      request: initialContext.request,
      // responseHeaders є в реальному контексті Yoga, але може не бути
      // описаний у типах, тому обгортаємо через any.
      responseHeaders: (initialContext as any).responseHeaders,
    }),
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

const PORT = Number(process.env.PORT ?? 4001);

server.listen(PORT, () => {
  console.log(`🚀 GraphQL Yoga running at http://localhost:${PORT}/graphql`);
});
