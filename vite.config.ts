import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  plugins: [
    {
      name: 'pinball-tables-api',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url?.includes('/api/tables')) {
            const tablesDir = path.resolve(__dirname, 'Pinball_Tables');
            if (!fs.existsSync(tablesDir)) {
              fs.mkdirSync(tablesDir);
            }

            // Normalizar o caminho da URL sem a query string
            const requestPath = req.url.split('?')[0];

            // API: Gravar Mesa (POST)
            if (req.method === 'POST') {
              let body = '';
              req.on('data', chunk => { body += chunk.toString(); });
              req.on('end', () => {
                try {
                  const data = JSON.parse(body);
                  const name = data.name.replace(/[^a-zA-Z0-9_\- ]/g, '').trim() || 'Sem_Nome';
                  fs.writeFileSync(path.join(tablesDir, `${name}.json`), JSON.stringify(data.components, null, 2));
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: true, name }));
                } catch (e) {
                  res.statusCode = 500; res.end(JSON.stringify({ error: 'Erro ao gravar' }));
                }
              });
              return;
            }

            // API: Listar Mesas (GET base)
            if (req.method === 'GET' && (requestPath === '/api/tables' || requestPath === '/api/tables/')) {
              const files = fs.readdirSync(tablesDir).filter(f => f.endsWith('.json'));
              const names = files.map(f => f.replace('.json', ''));
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(names));
              return;
            }

            // API: Apagar Mesa da VPS (DELETE)
            if (req.method === 'DELETE') {
              const urlParts = requestPath.split('/');
              const name = decodeURIComponent(urlParts[urlParts.length - 1]);
              if (name && name !== 'tables') {
                const filePath = path.join(tablesDir, `${name}.json`);
                if (fs.existsSync(filePath)) {
                  fs.unlinkSync(filePath);
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: true }));
                  return;
                }
              }
              res.statusCode = 404; res.end(JSON.stringify({ error: 'Não encontrado' }));
              return;
            }

            // API: Carregar Mesa (GET individual)
            if (req.method === 'GET') {
              const urlParts = requestPath.split('/');
              const name = decodeURIComponent(urlParts[urlParts.length - 1]);
              if (name && name !== 'tables') {
                const filePath = path.join(tablesDir, `${name}.json`);
                if (fs.existsSync(filePath)) {
                  res.setHeader('Content-Type', 'application/json');
                  res.end(fs.readFileSync(filePath));
                  return;
                }
              }
              res.statusCode = 404; res.end(JSON.stringify({ error: 'Ficheiro não encontrado' }));
              return;
            }
          }
          next();
        });
      }
    }
  ]
});
