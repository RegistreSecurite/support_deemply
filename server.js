import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { spawn } from 'child_process';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Vérifier si nous sommes en mode production
const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 5175;
const VITEPRESS_PORT = 3000;

async function createServer() {
  const app = express();
  let vitepress;

  // Servir les fichiers statiques pour l'admin
  app.use('/admin', express.static(path.join(__dirname, 'docs/public/admin')));

  // Route pour la page d'accueil de l'admin
  app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'docs/public/admin/index.html'));
  });

  if (isProduction) {
    // En mode production, servir les fichiers statiques générés par VitePress
    const distPath = path.join(__dirname, 'docs/.vitepress/dist');
    
    // Vérifier si le dossier dist existe
    if (!fs.existsSync(distPath)) {
      console.error('Le dossier de build VitePress n\'existe pas. Veuillez exécuter "npm run build" d\'abord.');
      process.exit(1);
    }
    
    // Servir les fichiers statiques de VitePress
    app.use(express.static(distPath));
    
    // Route fallback pour SPA
    app.get('*', (req, res, next) => {
      // Ne pas traiter les requêtes pour /admin
      if (req.path.startsWith('/admin')) {
        return next();
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
    
    console.log('Mode production: Servir les fichiers statiques de VitePress');
  } else {
    // En mode développement, démarrer VitePress et faire un proxy
    vitepress = spawn('npx', ['vitepress', 'dev', 'docs', '--port', VITEPRESS_PORT.toString()], {
      stdio: 'pipe',
      cwd: __dirname
    });

    // Afficher les logs de VitePress
    vitepress.stdout.on('data', (data) => {
      console.log(`[VitePress] ${data}`);
    });

    vitepress.stderr.on('data', (data) => {
      console.error(`[VitePress Error] ${data}`);
    });

    vitepress.on('close', (code) => {
      console.log(`VitePress process exited with code ${code}`);
      process.exit(code);
    });

    // Attendre que VitePress soit prêt (5 secondes)
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Créer un proxy pour VitePress
    app.use(
      '/',
      createProxyMiddleware({
        target: `http://localhost:${VITEPRESS_PORT}`,
        changeOrigin: true,
        ws: true,
        logLevel: 'debug',
        // Ne pas rediriger les requêtes /admin vers VitePress
        filter: (pathname) => !pathname.startsWith('/admin')
      })
    );
    
    console.log('Mode développement: Proxy vers VitePress');
  }

  // Gestion des erreurs
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Erreur serveur');
  });

  // Démarrer le serveur
  app.listen(PORT, () => {
    console.log(`Serveur unifié démarré sur http://localhost:${PORT}`);
    console.log(`Interface d'administration disponible sur http://localhost:${PORT}/admin`);
    console.log(`Documentation disponible sur http://localhost:${PORT}`);
  });

  // Gestion de l'arrêt du serveur
  process.on('SIGINT', () => {
    console.log('Arrêt du serveur...');
    if (vitepress) {
      vitepress.kill();
    }
    process.exit();
  });
}

createServer().catch(err => {
  console.error('Erreur lors du démarrage du serveur:', err);
});
