import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Servir ficheiros estáticos da build do Vite (Front-end)
app.use(express.static(path.join(__dirname, 'dist')));

// Diretório de Tabelas Pinball
const tablesDir = path.resolve(__dirname, 'Pinball_Tables');
if (!fs.existsSync(tablesDir)) {
    fs.mkdirSync(tablesDir);
}

// API: Listar mesas
app.get('/api/tables', (req, res) => {
    try {
        const files = fs.readdirSync(tablesDir).filter(f => f.endsWith('.json'));
        const names = files.map(f => f.replace('.json', ''));
        res.json(names);
    } catch (e) {
        res.status(500).json({ error: 'Falha ao listar tabelas' });
    }
});

// API: Gravar mesa
app.post('/api/tables', (req, res) => {
    try {
        const data = req.body;
        const name = data.name.replace(/[^a-zA-Z0-9_\- ]/g, '').trim() || 'Sem_Nome';
        fs.writeFileSync(path.join(tablesDir, `${name}.json`), JSON.stringify(data.components, null, 2));
        res.json({ success: true, name });
    } catch (e) {
        res.status(500).json({ error: 'Falha ao gravar tabela' });
    }
});

// API: Carregar mesa individual
app.get('/api/tables/:name', (req, res) => {
    try {
        const name = req.params.name;
        const filePath = path.join(tablesDir, `${name}.json`);
        if (fs.existsSync(filePath)) {
            res.sendFile(filePath);
        } else {
            res.status(404).json({ error: 'Ficheiro não encontrado' });
        }
    } catch (e) {
        res.status(500).json({ error: 'Erro ao carregar tabela' });
    }
});

// API: Apagar mesa individual
app.delete('/api/tables/:name', (req, res) => {
    try {
        const name = req.params.name;
        const filePath = path.join(tablesDir, `${name}.json`);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            res.json({ success: true, message: `Mesa ${name} apagada com sucesso` });
        } else {
            res.status(404).json({ error: 'Ficheiro não encontrado' });
        }
    } catch (e) {
        res.status(500).json({ error: 'Erro ao apagar tabela da VPS' });
    }
});

// Suporte para rotas de entrada SPA (redirecionar qualquer outra rota para o index.html)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 ArcadeHub Server is running on port ${PORT}`);
});
