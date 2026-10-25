import { createServer } from 'vite';

try {
  const server = await createServer({
    server: {
      port: 3000,
      host: '0.0.0.0'
    }
  });
  await server.listen();
  server.printUrls();
} catch (err) {
  console.error(err);
  process.exit(1);
}
