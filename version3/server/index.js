/**
 * Medical ML Backend Server
 * Handles heavy ML training operations offloaded from the browser
 */
const express = require('express');
const cors = require('cors');
const { runMLTraining } = require('./mlEngine');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ──────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '50mb' }));  // Large payload for dataset transfer

// ─── Health Check ───────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── ML Training Endpoint ───────────────────────────────────────
app.post('/api/train', async (req, res) => {
    const { modelId, params, dataset, datasetSchema, targetColumn } = req.body;

    // Validate required fields
    if (!modelId || !dataset || !datasetSchema || !targetColumn) {
        return res.status(400).json({
            error: 'Missing required fields: modelId, dataset, datasetSchema, targetColumn'
        });
    }

    if (!Array.isArray(dataset) || dataset.length === 0) {
        return res.status(400).json({
            error: 'Dataset must be a non-empty array'
        });
    }

    console.log(`[Train] Model: ${modelId} | Dataset rows: ${dataset.length} | Target: ${targetColumn}`);
    const startTime = Date.now();

    try {
        const metrics = await runMLTraining(modelId, params || {}, dataset, datasetSchema, targetColumn);
        const duration = Date.now() - startTime;
        console.log(`[Train] Completed in ${duration}ms | Accuracy: ${metrics.accuracy}`);

        res.json({
            success: true,
            metrics,
            meta: {
                modelId,
                datasetSize: dataset.length,
                trainingTimeMs: duration
            }
        });
    } catch (err) {
        console.error('[Train] Error:', err.message);
        res.status(500).json({
            error: 'Training failed: ' + err.message
        });
    }
});

// ─── Start Server ───────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`\n🧠 Medical ML Backend Server`);
    console.log(`   Running on http://localhost:${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/api/health`);
    console.log(`   Training endpoint: POST http://localhost:${PORT}/api/train\n`);
});
