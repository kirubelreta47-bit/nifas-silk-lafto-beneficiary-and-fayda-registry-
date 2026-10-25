import { preview } from 'vite';

try {
  const previewServer = await preview({
    preview: {
      port: 4173,
      host: '0.0.0.0'
    }
  });
  previewServer.printUrls();
} catch (err) {
  console.error(err);
  process.exit(1);
}
