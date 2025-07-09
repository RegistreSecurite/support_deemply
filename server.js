const express = require('express');
const { createServer: createViteServer } = require('vite');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const fetch = require('node-fetch');

async function createServer() {
  const app = express();
  const PORT = 5175;

  // Servir les fichiers statiques pour l'admin
  app.use('/admin', express.static(path.join(__dirname, 'admin')));

  // Route pour la page d'accueil de l'admin
  app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin/index.html'));
  });

  // Démarrer VitePress en arrière-plan
  const viteProcess = exec('npx vitepress dev docs --port 5176', (error, stdout, stderr) => {
    if (error) {
      console.error(`Erreur lors du démarrage de VitePress: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Erreur VitePress: ${stderr}`);
      return;
    }
    console.log(`VitePress: ${stdout}`);
  });

  // Proxy pour VitePress
  app.use(async (req, res, next) => {
    // Ne pas traiter les requêtes /admin
    if (req.path.startsWith('/admin')) {
      return next();
    }

    try {
      // Proxy vers VitePress
      const response = await fetch(`http://localhost:5176${req.url}`);
      const contentType = response.headers.get('content-type');
      
      // Transférer les headers
      for (const [key, value] of response.headers.entries()) {
        res.setHeader(key, value);
      }
      
      // Transférer le statut
      res.status(response.status);
      
      // Transférer le corps de la réponse
      const body = await response.text();
      res.send(body);
    } catch (error) {
      console.error(`Erreur de proxy: ${error.message}`);
      next(error);
    }
  });

  // Gestion des erreurs
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Erreur serveur');
  });

  // Démarrer le serveur
  app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
    console.log(`Interface d'administration disponible sur http://localhost:${PORT}/admin`);
  });

  // Gestion de l'arrêt du serveur
  process.on('SIGINT', () => {
    console.log('Arrêt du serveur...');
    viteProcess.kill();
    process.exit();
  });
}

createServer();
