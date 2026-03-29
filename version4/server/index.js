/**
 * @module Medical ML Backend Server
 * @description Express server handling ML model training, certificate generation,
 * and health checks for the HEALTH-AI Learning Tool.
 * @requires express
 * @requires cors
 * @requires express-rate-limit
 */
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { runMLTraining } = require('./mlEngine');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── CORS — restrict to known frontend origin ────────────────────
const ALLOWED_ORIGINS = [
    process.env.ALLOWED_ORIGIN,          // Set in render.yaml env vars
    'http://localhost:5173',             // Vite dev
    'http://localhost:4173',             // Vite preview
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Allow server-to-server (no origin) and listed origins
        if (!origin || ALLOWED_ORIGINS.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`CORS: origin ${origin} not allowed`));
        }
    },
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
}));

// ─── Body parser (cap at 10MB — enough for any reasonable CSV) ───
app.use(express.json({ limit: '10mb' }));

// ─── Rate limiting — max 30 training requests per minute ─────────
const trainLimiter = rateLimit({
    windowMs: 60 * 1000,   // 1 minute
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many training requests — please slow down.' },
});

// ─── Global crash recovery ────────────────────────────────────────
process.on('uncaughtException', (err) => {
    console.error('[FATAL] Uncaught Exception:', err.message, err.stack);
    // Don't exit — log and continue serving
});
process.on('unhandledRejection', (reason) => {
    console.error('[FATAL] Unhandled Rejection:', reason);
});

// ─── Health Check ───────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * @route POST /api/train
 * @description Trains a selected ML model on the provided dataset and returns performance metrics.
 * @param {string} req.body.modelId - Model identifier (knn, dt, rf, nb, lr, svm)
 * @param {Object} req.body.params - Model hyper-parameters
 * @param {Array} req.body.dataset - Array of row objects (max 10,000 rows)
 * @param {Array} req.body.datasetSchema - Column schema array
 * @param {string} req.body.targetColumn - Name of the target column
 * @returns {Object} { success: boolean, metrics: Object, meta: Object }
 */
app.post('/api/train', trainLimiter, async (req, res) => {
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

    // C3 — Hard cap on dataset size to prevent OOM on free-tier
    if (dataset.length > 10000) {
        return res.status(400).json({
            error: `Dataset too large (${dataset.length} rows). Maximum supported is 10,000 rows.`
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

/**
 * @route POST /api/generate-certificate
 * @description Generates a printable HTML certificate summarising the completed ML exercise.
 * @param {string} req.body.domain - Specialty domain name
 * @param {string} req.body.modelName - Name of the trained model
 * @param {Object} [req.body.metrics] - 6 performance metrics (accuracy, sensitivity, etc.)
 * @param {Array} [req.body.biasFindings] - Subgroup bias results
 * @param {Object} [req.body.checklist] - EU AI Act checklist status
 * @returns {Object} { success: boolean, html: string, meta: Object }
 */
app.post('/api/generate-certificate', (req, res) => {
    const startTime = Date.now();
    const { domain, modelName, metrics, biasFindings, checklist } = req.body;

    if (!domain || !modelName) {
        return res.status(400).json({ error: 'Missing required fields: domain, modelName' });
    }

    const dateStr = new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
    const m = metrics || {};
    const bias = biasFindings || [];
    const check = checklist || { items: [], checked: [] };

    const badgeClass = (v, t) => (v >= t ? 'green' : v >= 0.50 ? 'amber' : 'red');
    const badgeLabel = (v, t) => (v >= t ? 'Acceptable' : v >= 0.50 ? 'Review' : 'Below Threshold');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>HEALTH-AI Summary Certificate — ${domain}</title>
<style>
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 40px; background: #f8fafc; color: #1e293b; }
  .cert { max-width: 760px; margin: auto; background: white; border-radius: 16px; padding: 48px; box-shadow: 0 4px 40px rgba(0,0,0,0.08); border: 2px solid #6366f1; }
  h1 { color: #6366f1; font-size: 28px; margin: 0 0 4px; }
  .sub { color: #64748b; font-size: 14px; margin-bottom: 32px; }
  h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #6366f1; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin: 28px 0 12px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { background: #f1f5f9; padding: 8px 12px; text-align: left; font-weight: 600; }
  td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700; }
  .green { background: #dcfce7; color: #166534; }
  .red   { background: #fee2e2; color: #991b1b; }
  .amber { background: #fef3c7; color: #92400e; }
  .footer { margin-top: 40px; font-size: 11px; color: #94a3b8; text-align: center; }
  .stamp { text-align:center; margin-bottom:24px; }
  .stamp span { font-size: 48px; }
</style>
</head>
<body>
<div class="cert">
  <div class="stamp"><span>🎓</span></div>
  <h1>HEALTH-AI Learning Tool</h1>
  <p class="sub">Summary Certificate — Erasmus+ KA220-HED · Generated ${dateStr}</p>

  <h2>Exercise Summary</h2>
  <table>
    <tr><th>Specialty / Domain</th><td>${domain}</td></tr>
    <tr><th>Model Used</th><td>${modelName}</td></tr>
    <tr><th>Steps Completed</th><td>7 of 7</td></tr>
    <tr><th>EU AI Act Items</th><td>${(check.checked || []).length} / ${(check.items || []).length} confirmed</td></tr>
  </table>

  <h2>Model Performance (6 Metrics)</h2>
  <table>
    <tr><th>Metric</th><th>Value</th><th>Status</th></tr>
    <tr><td>Accuracy</td><td>${m.accuracy != null ? Math.round(m.accuracy * 100) + '%' : 'N/A'}</td><td><span class="badge ${badgeClass(m.accuracy || 0, 0.65)}">${badgeLabel(m.accuracy || 0, 0.65)}</span></td></tr>
    <tr><td>Sensitivity ⭐</td><td>${m.sensitivity != null ? Math.round(m.sensitivity * 100) + '%' : 'N/A'}</td><td><span class="badge ${badgeClass(m.sensitivity || 0, 0.65)}">${badgeLabel(m.sensitivity || 0, 0.65)}</span></td></tr>
    <tr><td>Specificity</td><td>${m.specificity != null ? Math.round(m.specificity * 100) + '%' : 'N/A'}</td><td><span class="badge ${badgeClass(m.specificity || 0, 0.65)}">${badgeLabel(m.specificity || 0, 0.65)}</span></td></tr>
    <tr><td>Precision</td><td>${m.precision != null ? Math.round(m.precision * 100) + '%' : 'N/A'}</td><td><span class="badge ${badgeClass(m.precision || 0, 0.60)}">${badgeLabel(m.precision || 0, 0.60)}</span></td></tr>
    <tr><td>F1 Score</td><td>${m.f1Score != null ? Math.round(m.f1Score * 100) + '%' : 'N/A'}</td><td><span class="badge ${badgeClass(m.f1Score || 0, 0.60)}">${badgeLabel(m.f1Score || 0, 0.60)}</span></td></tr>
    <tr><td>AUC-ROC</td><td>${m.auc != null ? Math.round(m.auc * 100) + '%' : 'N/A'}</td><td><span class="badge ${badgeClass(m.auc || 0, 0.65)}">${badgeLabel(m.auc || 0, 0.65)}</span></td></tr>
  </table>

  <h2>Bias Findings</h2>
  <table>
    <tr><th>Patient Group</th><th>Sensitivity</th><th>Status</th></tr>
    ${bias.map(r => `<tr><td>${r.group}</td><td>${Math.round(r.sens * 100)}%</td><td><span class="badge ${r.sens >= 0.65 ? 'green' : r.sens >= 0.50 ? 'amber' : 'red'}">${r.sens >= 0.65 ? 'OK' : r.sens >= 0.50 ? 'Review' : 'Action Needed'}</span></td></tr>`).join('')}
    ${bias.length === 0 ? '<tr><td colspan="3">No subgroup data available</td></tr>' : ''}
  </table>

  <h2>EU AI Act Compliance Checklist</h2>
  <table>
    <tr><th>Item</th><th>Status</th></tr>
    ${(check.items || []).map(item => `<tr><td>${item}</td><td><span class="badge ${(check.checked || []).includes(item) ? 'green' : 'red'}">${(check.checked || []).includes(item) ? '✓ Confirmed' : 'Pending'}</span></td></tr>`).join('')}
  </table>

  <div class="footer">
    This certificate confirms completion of the HEALTH-AI educational exercise.<br>
    This is not a professional accreditation. All patient data used was simulated.
  </div>
</div>
</body>
</html>`;

    const duration = Date.now() - startTime;
    console.log(`[Certificate] Generated for domain="${domain}" model="${modelName}" in ${duration}ms`);

    res.json({
        success: true,
        html,
        meta: { generationTimeMs: duration }
    });
});

// ─── Start Server ───────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`\n🧠 Medical ML Backend Server`);
    console.log(`   Running on http://localhost:${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/api/health`);
    console.log(`   Training endpoint: POST http://localhost:${PORT}/api/train`);
    console.log(`   Certificate endpoint: POST http://localhost:${PORT}/api/generate-certificate`);
    console.log(`   Allowed origins: ${ALLOWED_ORIGINS.join(', ')}\n`);
});
