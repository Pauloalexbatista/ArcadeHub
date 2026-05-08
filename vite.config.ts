import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  plugins: [
    {
      name: 'pinball-tables-api',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url?.startsWith('/api/tables')) {
            const tablesDir = path.resolve(__dirname, 'Pinball_Tables');
            if (!fs.existsSync(tablesDir)) {
              fs.mkdirSync(tablesDir);
            }

            if (req.method === 'POST') {
              let body = '';
              req.on('data', chunk => {
                body += chunk.toString();
              });
              req.on('end', () => {
                try {
                  const data = JSON.parse(body);
                  const name = data.name.replace(/[^a-zA-Z0-9_\- ]/g, '').trim() || 'Sem_Nome';
                  fs.writeFileSync(path.join(tablesDir, `${name}.json`), JSON.stringify(data.components, null, 2));
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: true, name }));
                } catch (e) {
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: 'Falha ao gravar' }));
                }
              });
              return;
            }

            if (req.method === 'GET' && req.url === '/api/tables') {
              const files = fs.readdirSync(tablesDir).filter(f => f.endsWith('.json'));
              const names = files.map(f => f.replace('.json', ''));
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(names));
              return;
            }

            if (req.method === 'GET') {
              const urlParts = req.url.split('/');
              const name = decodeURIComponent(urlParts[urlParts.length - 1]);
              if (name && name !== 'tables') {
                const filePath = path.join(tablesDir, `${name}.json`);
                if (fs.existsSync(filePath)) {
                  res.setHeader('Content-Type', 'application/json');
                  res.end(fs.readFileSync(filePath));
                  return;
                } else {
                  res.statusCode = 404;
                  res.end(JSON.stringify({ error: 'Ficheiro não encontrado' }));
                  return;
                }
              }
            }
          }
          next();
        });
      }
    }
  ]
});
