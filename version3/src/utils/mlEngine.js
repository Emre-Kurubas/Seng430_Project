/**
 * ML Engine — Frontend API Client
 * 
 * All heavy ML training now happens on the backend server.
 * This module sends the dataset + parameters via fetch()
 * and returns the computed metrics.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Sends training request to the backend server
 * @param {string} modelId - Model identifier (knn, dt, rf, nb, lr, svm)
 * @param {object} params - Model hyperparameters
 * @param {Array} dataset - Parsed CSV data rows
 * @param {Array} datasetSchema - Column schema from ColumnMapper
 * @param {string} targetColumn - Name of the target column
 * @returns {Promise<object>} - Evaluation metrics { accuracy, sensitivity, specificity, precision, f1Score, auc, tp, tn, fp, fn, totalTest }
 */
export async function runMLTraining(modelId, params, dataset, datasetSchema, targetColumn) {
    const response = await fetch(`${API_BASE_URL}/api/train`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId, params, dataset, datasetSchema, targetColumn })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error (${response.status})`);
    }

    const result = await response.json();

    if (!result.success) {
        throw new Error(result.error || 'Training failed');
    }

    return result.metrics;
}
