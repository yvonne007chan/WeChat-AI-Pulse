import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Example API for fetching external content (simplified)
  app.post('/api/fetch-content', async (req, res) => {
    const { url } = req.body;
    try {
      // In a real app, you'd use a robust scraper or proxy here
      // For this MVP, we simulate or handle simple metadata if possible
      res.json({ message: 'Scraping simulated for URL: ' + url });
    } catch (error) {
       res.status(500).json({ error: 'Failed to fetch content' });
    }
  });

  // A/B Testing: Serve Variation (logic to serve different versions to readers)
  app.get('/api/ab-test/:articleId/variation', async (req, res) => {
    const { articleId } = req.params;
    // In production, fetch active test from Firestore and implement weighted random or sticky rollout
    const variationId = Math.random() > 0.5 ? 'var_A' : 'var_B';
    res.json({
      articleId,
      variationId,
      servedAt: new Date().toISOString(),
      trackingToken: `tok_${crypto.randomUUID()}`
    });
  });

  // A/B Testing: Track Performance (Metrics tracking for views/clicks)
  app.post('/api/ab-test/track', async (req, res) => {
    const { testId, variationId, metricType } = req.body;
    // metricType: 'view' | 'click' | 'engagement'
    
    // In production, use increment() in Firestore for atomic metric updates
    // const testRef = db.collection('ab_tests').doc(testId);
    // await testRef.update({ [`variations.${variationId}.metrics.${metricType}s`]: increment(1) });

    console.log(`[AB-TEST] Logging ${metricType} for variation ${variationId} in test ${testId}`);
    res.json({ success: true, status: 'metric_recorded' });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
