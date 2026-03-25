/**
 * ML Engine — Frontend API Client
 *
 * All heavy ML training happens on the backend server.
 * This module sends the dataset + parameters via fetch()
 * and returns the computed metrics.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// How long to wait before giving up on a training request (ms).
// Covers Render free-tier cold-start (~30–50 s).
const FETCH_TIMEOUT_MS = 25000;

/**
 * Sends training request to the backend server.
 * Automatically cancels the request after FETCH_TIMEOUT_MS.
 *
 * @param {string}  modelId        - Model identifier (knn, dt, rf, nb, lr, svm)
 * @param {object}  params         - Model hyperparameters
 * @param {Array}   dataset        - Parsed CSV data rows
 * @param {Array}   datasetSchema  - Column schema from ColumnMapper
 * @param {string}  targetColumn   - Name of the target column
 * @param {AbortSignal} [signal]   - Optional external AbortSignal for request cancellation
 * @returns {Promise<object>}      - Evaluation metrics
 */
export async function runMLTraining(modelId, params, dataset, datasetSchema, targetColumn, signal) {
    // C1 — timeout controller
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), FETCH_TIMEOUT_MS);

    // H4 — merge caller's abort signal with our timeout signal
    const combinedSignal = signal
        ? anySignal([signal, timeoutController.signal])
        : timeoutController.signal;

    try {
        const response = await fetch(`${API_BASE_URL}/api/train`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ modelId, params, dataset, datasetSchema, targetColumn }),
            signal: combinedSignal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Server error (${response.status})`);
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Training failed');
        }

        return result.metrics;
    } catch (err) {
        clearTimeout(timeoutId);

        if (err.name === 'AbortError') {
            throw new Error(
                'The request timed out. The server may be starting up — please wait a moment and try again.'
            );
        }

        throw err;
    }
}

/**
 * Combines multiple AbortSignals — aborts as soon as any one fires.
 * Polyfill for AbortSignal.any() which isn't universally available yet.
 */
function anySignal(signals) {
    const controller = new AbortController();
    for (const signal of signals) {
        if (signal.aborted) {
            controller.abort();
            return controller.signal;
        }
        signal.addEventListener('abort', () => controller.abort(), { once: true });
    }
    return controller.signal;
}
