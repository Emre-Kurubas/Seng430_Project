import KNN from 'ml-knn';
import { DecisionTreeClassifier } from 'ml-cart';
import { RandomForestClassifier } from 'ml-random-forest';
import LogisticRegression from 'ml-logistic-regression';
import { Matrix } from 'ml-matrix';
import SVM from 'ml-svm';

// ─────────────────────────────────────────────────────────────────────────────
// Inline Gaussian Naive Bayes
// ml-naivebayes v4's src/index.js has a broken internal import path, so the
// package cannot be used. This self-contained implementation is mathematically
// identical: it computes per-class Gaussian (mean, variance) for each feature,
// then classifies via log-sum of log-likelihoods + log-prior.
// ─────────────────────────────────────────────────────────────────────────────
class GaussianNBClassifier {
    constructor(smoothing = 1e-9) {
        this.classes = [];
        this.priors = {};
        this.means = {};
        this.vars = {};
        this.smoothing = smoothing;
    }

    train(X, y) {
        const classSet = [...new Set(y)];
        this.classes = classSet;
        const n = X.length;
        const nFeatures = X[0].length;

        // Phase 1: Compute raw means and variances per class per feature
        const rawVars = {};
        classSet.forEach(c => {
            const rows = X.filter((_, i) => y[i] === c);
            this.priors[c] = Math.log(rows.length / n);
            this.means[c] = [];
            rawVars[c] = [];
            for (let f = 0; f < nFeatures; f++) {
                const vals = rows.map(r => r[f]);
                const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
                const variance = vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length;
                this.means[c].push(mean);
                rawVars[c].push(variance);
            }
        });

        // Phase 2: Find maximum variance across all classes & features (scikit-learn style)
        let maxVar = 0;
        classSet.forEach(c => {
            rawVars[c].forEach(v => { if (v > maxVar) maxVar = v; });
        });

        // Phase 3: Add smoothing * maxVar to all variances
        // This makes the smoothing parameter scale-relative to the data
        const epsilon = this.smoothing * maxVar;
        classSet.forEach(c => {
            this.vars[c] = rawVars[c].map(v => v + Math.max(epsilon, 1e-12));
        });
    }

    _logLikelihood(x, c) {
        let ll = this.priors[c];
        const means = this.means[c];
        const vars = this.vars[c];
        for (let f = 0; f < x.length; f++) {
            const diff = x[f] - means[f];
            ll += -0.5 * Math.log(2 * Math.PI * vars[f]) - (diff * diff) / (2 * vars[f]);
        }
        return ll;
    }

    predict(X) {
        return X.map(x => {
            let bestClass = this.classes[0];
            let bestLL = -Infinity;
            for (const c of this.classes) {
                const ll = this._logLikelihood(x, c);
                if (ll > bestLL) { bestLL = ll; bestClass = c; }
            }
            return bestClass;
        });
    }

    // Return per-class Gaussian params for visualization
    getDistributions() {
        return this.classes.map(c => ({
            classLabel: c,
            means: this.means[c],
            vars: this.vars[c],
        }));
    }
}

// ─── Stratified Sampling ─────────────────────────────────────────────────────
export function stratifiedSample(dataset, targetColumn, maxRows) {
    if (!dataset || dataset.length <= maxRows) return dataset;

    const groups = {};
    dataset.forEach(row => {
        const cls = String(row[targetColumn] ?? 'unknown');
        if (!groups[cls]) groups[cls] = [];
        groups[cls].push(row);
    });

    if (Object.keys(groups).length > 20) {
        const shuffled = dataset.slice();
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled.slice(0, maxRows);
    }

    const ratio = maxRows / dataset.length;
    const sampled = [];

    Object.entries(groups).forEach(([, rows]) => {
        const n = Math.max(1, Math.round(rows.length * ratio));
        const shuffled = rows.slice();
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        sampled.push(...shuffled.slice(0, n));
    });

    for (let i = sampled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [sampled[i], sampled[j]] = [sampled[j], sampled[i]];
    }

    return sampled;
}

// ─── Prepare Data ────────────────────────────────────────────────────────────
export function prepareData(dataset, datasetSchema, targetColumn) {
    console.log('[DEBUG mlEngine] prepareData called with:', {
        datasetLength: dataset?.length,
        schemaLength: datasetSchema?.length,
        targetColumn,
        schemaRoles: datasetSchema?.map(c => ({ name: c.name, role: c.role })),
    });
    if (!dataset || dataset.length === 0 || !datasetSchema || datasetSchema.length === 0) {
        console.warn('mlEngine: Missing data or schema for preparation');
        return { X: [], y: [] };
    }

    const featureCols = datasetSchema
        .filter(c => c && (c.role === 'Number (measurement)' || c.role === 'Category'))
        .map(c => c.name);

    console.log('[DEBUG mlEngine] featureCols:', featureCols);
    if (featureCols.length === 0) {
        console.warn('mlEngine: No feature columns identified');
        return { X: [], y: [] };
    }

    const X = [];
    const y = [];

    const targetValues = [...new Set(dataset.map(row => row[targetColumn]).filter(v => v !== undefined && v !== ''))];
    console.log('[DEBUG mlEngine] targetValues:', targetValues, 'sample row keys:', dataset[0] ? Object.keys(dataset[0]) : 'no rows');
    const targetMap = {};
    if (targetValues.length >= 2) {
        targetMap[targetValues[0]] = 0;
        targetMap[targetValues[1]] = 1;
    } else {
        targetMap[targetValues[0] || '1'] = 1;
    }

    dataset.forEach(row => {
        const rowFeatures = featureCols.map(col => {
            const val = Number(row[col]);
            return isNaN(val) ? 0 : val;
        });

        // BUG FIX: Removed the over-aggressive zero-value filter that dropped
        // legitimate rows where all features happened to be zero (e.g. binary flags).
        // The isNaN guard above is sufficient to handle missing/non-numeric values.
        let targetVal = targetMap[row[targetColumn]];
        if (targetVal === undefined) targetVal = 0;

        X.push(rowFeatures);
        y.push(targetVal);
    });

    return { X, y, targetMap };
}

// ─── Train/Test Split ────────────────────────────────────────────────────────
export function trainTestSplit(X, y, testRatio = 0.2, seed = 42) {
    const seededRandom = (s) => {
        const x = Math.sin(s) * 10000;
        return x - Math.floor(x);
    };

    const indices = Array.from({ length: X.length }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(seededRandom(seed + i) * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    const splitIndex = Math.floor(indices.length * (1 - testRatio));
    const trainIdx = indices.slice(0, splitIndex);
    const testIdx = indices.slice(splitIndex);

    return {
        XTrain: trainIdx.map(i => X[i]),
        yTrain: trainIdx.map(i => y[i]),
        XTest: testIdx.map(i => X[i]),
        yTest: testIdx.map(i => y[i])
    };
}

// ─── Calculate Metrics ───────────────────────────────────────────────────────
export function calculateMetrics(yTrue, yPred) {
    let tp = 0, tn = 0, fp = 0, fn = 0;
    for (let i = 0; i < yTrue.length; i++) {
        if (yTrue[i] === 1 && yPred[i] === 1) tp++;
        else if (yTrue[i] === 0 && yPred[i] === 0) tn++;
        else if (yTrue[i] === 0 && yPred[i] === 1) fp++;
        else if (yTrue[i] === 1 && yPred[i] === 0) fn++;
    }

    const accuracy = (tp + tn) / (yTrue.length || 1);
    const sensitivity = tp / ((tp + fn) || 1);
    const specificity = tn / ((tn + fp) || 1);
    const precision = tp / ((tp + fp) || 1);
    const precisionValue = (tp + fp === 0) ? 0 : precision;
    const f1Score = (sensitivity + precisionValue === 0) ? 0 : 2 * ((sensitivity * precisionValue) / (sensitivity + precisionValue));
    const auc = (sensitivity + specificity) / 2;

    return {
        accuracy: parseFloat(accuracy.toFixed(3)),
        sensitivity: parseFloat(sensitivity.toFixed(3)),
        specificity: parseFloat(specificity.toFixed(3)),
        precision: parseFloat(precisionValue.toFixed(3)),
        f1Score: parseFloat(f1Score.toFixed(3)),
        auc: parseFloat(auc.toFixed(3)),
        tp, tn, fp, fn,
        totalTest: yTrue.length
    };
}

// ─── Training with timeout protection ────────────────────────────────────────
function withTimeout(promise, ms) {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Training timeout')), ms))
    ]);
}

// ─── SVM Feature Selection ────────────────────────────────────────────────────
// Selects top-N features with the highest class-separation score.
// This prevents the SVM SMO solver from hanging on high-dimensional datasets.
function selectTopFeaturesBySeparation(XTrain, yTrain, maxFeatures = 4) {
    const nFeatures = XTrain[0]?.length || 0;
    if (nFeatures <= maxFeatures) return { selectedX: XTrain, selectedIndices: Array.from({ length: nFeatures }, (_, i) => i) };

    const class0 = XTrain.filter((_, i) => yTrain[i] === 0);
    const class1 = XTrain.filter((_, i) => yTrain[i] === 1);

    const scores = [];
    for (let f = 0; f < nFeatures; f++) {
        const vals0 = class0.map(r => r[f]);
        const vals1 = class1.map(r => r[f]);
        const mean0 = vals0.length ? vals0.reduce((a, b) => a + b, 0) / vals0.length : 0;
        const mean1 = vals1.length ? vals1.reduce((a, b) => a + b, 0) / vals1.length : 0;
        const allVals = [...vals0, ...vals1];
        const globalMean = allVals.reduce((a, b) => a + b, 0) / (allVals.length || 1);
        const stdev = Math.sqrt(allVals.reduce((s, v) => s + (v - globalMean) ** 2, 0) / (allVals.length || 1)) || 1;
        scores.push({ index: f, score: Math.abs(mean1 - mean0) / stdev });
    }
    scores.sort((a, b) => b.score - a.score);
    const selectedIndices = scores.slice(0, maxFeatures).map(s => s.index);

    const selectedX = XTrain.map(row => selectedIndices.map(fi => row[fi]));
    return { selectedX, selectedIndices };
}

// ─── Main ML Training Function ───────────────────────────────────────────────
export async function runMLTraining(modelId, params, dataset, datasetSchema, targetColumn, seed = 42) {
    const { X, y } = prepareData(dataset, datasetSchema, targetColumn);
    if (X.length === 0) throw new Error("No data prepared");

    const MAX_TRAIN_ROWS = 1000;
    let XCapped = X;
    let yCapped = y;

    if (X.length > MAX_TRAIN_ROWS) {
        const seededRandom = (s) => {
            const x = Math.sin(s) * 10000;
            return x - Math.floor(x);
        };

        const indices = Array.from({ length: X.length }, (_, i) => i);
        const class0 = indices.filter(i => y[i] === 0);
        const class1 = indices.filter(i => y[i] === 1);

        const ratio = MAX_TRAIN_ROWS / X.length;
        const n0 = Math.max(1, Math.round(class0.length * ratio));
        const n1 = Math.max(1, Math.round(class1.length * ratio));

        for (let i = class0.length - 1; i > 0; i--) {
            const j = Math.floor(seededRandom(seed + i) * (i + 1));
            [class0[i], class0[j]] = [class0[j], class0[i]];
        }
        for (let i = class1.length - 1; i > 0; i--) {
            const j = Math.floor(seededRandom(seed + i + 100) * (i + 1));
            [class1[i], class1[j]] = [class1[j], class1[i]];
        }

        const sampledIdx = [...class0.slice(0, n0), ...class1.slice(0, n1)];
        for (let i = sampledIdx.length - 1; i > 0; i--) {
            const j = Math.floor(seededRandom(seed + i + 200) * (i + 1));
            [sampledIdx[i], sampledIdx[j]] = [sampledIdx[j], sampledIdx[i]];
        }

        XCapped = sampledIdx.map(i => X[i]);
        yCapped = sampledIdx.map(i => y[i]);
    }

    // SMOTE-lite oversampling for class imbalance
    const classCounts = { 0: 0, 1: 0 };
    yCapped.forEach(val => classCounts[val]++);

    const majorityClass = classCounts[0] >= classCounts[1] ? 0 : 1;
    const minorityClass = majorityClass === 0 ? 1 : 0;

    if (classCounts[minorityClass] > 0 && classCounts[majorityClass] / classCounts[minorityClass] > 2.5) {
        const minorityX = [];
        for (let i = 0; i < yCapped.length; i++) {
            if (yCapped[i] === minorityClass) minorityX.push(XCapped[i]);
        }

        const targetMinorityCount = Math.floor(classCounts[majorityClass] * 0.7);
        let added = 0;
        while (added < targetMinorityCount - classCounts[minorityClass]) {
            const baseIdx = Math.floor(Math.random() * minorityX.length);
            const baseRow = minorityX[baseIdx];
            const newRow = baseRow.map(v => v + (Math.random() - 0.5) * 0.05 * v);
            XCapped.push(newRow);
            yCapped.push(minorityClass);
            added++;
        }
    }

    const { XTrain, yTrain, XTest, yTest } = trainTestSplit(XCapped, yCapped, 0.2, seed);

    if (XTrain.length === 0 || XTest.length === 0) {
        throw new Error("Not enough data for train/test split");
    }

    let yPred = [];
    let trainedModel = null;
    let predictFn = null;
    // Extra data exported for visualizations
    let modelMeta = {};

    await new Promise(resolve => setTimeout(resolve, 0));

    try {
        const trainingPromise = (async () => {
            if (modelId === 'knn') {
                const kVal = Math.max(1, Math.min(params.k || 5, XTrain.length - 1));
                const isManhattan = (params.metric || '').toLowerCase().includes('manhattan');
                const knnOptions = { k: kVal };
                if (isManhattan) {
                    knnOptions.distance = (a, b) => {
                        let sum = 0;
                        for (let i = 0; i < a.length; i++) sum += Math.abs(a[i] - b[i]);
                        return sum;
                    };
                }
                trainedModel = new KNN(XTrain, yTrain, knnOptions);
                predictFn = (X) => trainedModel.predict(X);
                return predictFn(XTest);

            } else if (modelId === 'dt') {
                trainedModel = new DecisionTreeClassifier({ maxDepth: params.maxDepth || 3 });
                trainedModel.train(XTrain, yTrain);
                predictFn = (X) => trainedModel.predict(X);
                return predictFn(XTest);

            } else if (modelId === 'rf') {
                const nTrees = Math.min(params.trees || 100, 150);
                let rfXTrain = XTrain;
                let rfYTrain = yTrain;
                if (XTrain.length > 500) {
                    rfXTrain = XTrain.slice(0, 500);
                    rfYTrain = yTrain.slice(0, 500);
                }
                trainedModel = new RandomForestClassifier({
                    nEstimators: nTrees,
                    maxFeatures: Math.min(0.7, Math.max(0.3, 4 / (rfXTrain[0]?.length || 1))),
                    maxDepth: params.maxDepth || 10,
                    seed: 42,
                    useSampleBagging: true
                });
                trainedModel.train(rfXTrain, rfYTrain);
                predictFn = (X) => trainedModel.predict(X);

                // Export per-estimator vote matrix for visualization
                // predictionValues() returns a MatrixTransposeView: rows=samples, cols=estimators
                try {
                    const pvMatrix = trainedModel.predictionValues(XTest);
                    const nRows = pvMatrix.rows;
                    const nCols = pvMatrix.columns;
                    const perEstimatorVotes = [];
                    for (let i = 0; i < nCols; i++) {
                        const treeVotes = [];
                        for (let j = 0; j < nRows; j++) {
                            treeVotes.push(pvMatrix.get(j, i));
                        }
                        perEstimatorVotes.push(treeVotes);
                    }
                    modelMeta.perEstimatorVotes = perEstimatorVotes; // [estimatorIdx][sampleIdx] -> label
                } catch (e) {
                    console.warn('Could not extract RF estimator votes:', e.message);
                }

                return predictFn(XTest);

            } else if (modelId === 'nb') {
                // Using our inline GaussianNBClassifier (ml-naivebayes package is broken)
                trainedModel = new GaussianNBClassifier(params.smoothing || 1e-9);
                trainedModel.train(XTrain, yTrain);
                predictFn = (X) => trainedModel.predict(X);

                // Export class distributions for visualization
                modelMeta.nbDistributions = trainedModel.getDistributions();

                return predictFn(XTest);

            } else if (modelId === 'lr') {
                trainedModel = new LogisticRegression({
                    numSteps: 1000,
                    learningRate: 0.05
                });
                trainedModel.train(new Matrix(XTrain), Matrix.columnVector(yTrain));
                predictFn = (X) => Array.from(trainedModel.predict(new Matrix(X)));

                // Export trained weights for sigmoid visualization
                // ml-logistic-regression stores weights in trainedModel.theta
                try {
                    const theta = trainedModel.theta;
                    if (theta) {
                        const weights = typeof theta.to1DArray === 'function'
                            ? theta.to1DArray()
                            : Array.from(theta);
                        modelMeta.lrWeights = weights; // [bias, w0, w1, ...]
                    }
                } catch (e) {
                    console.warn('Could not extract LR weights:', e.message);
                }

                return predictFn(XTest);

            } else if (modelId === 'svm') {
                const isLinear = params.kernel === 'Linear';
                const kernelStr = isLinear ? 'linear' : 'rbf';

                // FIX: Select top-4 features by class-separation score before SVM
                // training to prevent the SMO solver from hanging on high-dim data
                const MAX_SVM_TRAIN = 400;
                let svmXTrain = XTrain.length > MAX_SVM_TRAIN ? XTrain.slice(0, MAX_SVM_TRAIN) : XTrain;
                let svmYTrain = yTrain.length > MAX_SVM_TRAIN ? yTrain.slice(0, MAX_SVM_TRAIN) : yTrain;

                const { selectedX: reducedTrain, selectedIndices } = selectTopFeaturesBySeparation(svmXTrain, svmYTrain, 4);
                const reducedTest = XTest.map(row => selectedIndices.map(fi => row[fi]));

                const svmLabelTrain = svmYTrain.map(val => val === 1 ? 1 : -1);

                const svmOpts = {
                    C: params.c || 1,
                    kernel: kernelStr,
                    tol: 1e-4,
                    maxPasses: 10,
                    maxIterations: 10000
                };
                if (!isLinear) svmOpts.kernelOptions = { sigma: 0.1 };

                trainedModel = new SVM(svmOpts);
                trainedModel.train(reducedTrain, svmLabelTrain);

                // Predict on reduced-dimension test set; wrap to use full feature rows
                const svmPredictFn = (X) => {
                    const reduced = X.map(row => selectedIndices.map(fi => row[fi]));
                    return Array.from(trainedModel.predict(reduced)).map(val => val === 1 ? 1 : 0);
                };
                predictFn = svmPredictFn;
                modelMeta.svmFeatureIndices = selectedIndices;

                return predictFn(XTest);

            } else {
                return XTest.map(() => 0);
            }
        })();

        yPred = await withTimeout(trainingPromise, 15000);
    } catch (err) {
        console.warn("ML Training error or timeout:", err.message);
        // FIX: Always set a valid predictFn in the fallback path so Steps 5 & 6
        // never receive null (which would crash feature importance / SHAP calculation)
        const majorityLabel = yTrain.filter(v => v === 1).length > yTrain.length / 2 ? 1 : 0;
        yPred = yTest.map(() => majorityLabel);
        predictFn = (X) => X.map(() => majorityLabel);
    }

    // Ensure yPred is a flat array of numbers
    if (yPred && typeof yPred === 'object' && !Array.isArray(yPred)) {
        yPred = Array.from(yPred);
    }
    yPred = (yPred || []).map(v => (Number(v) >= 0.5 ? 1 : 0));

    const featureCols = datasetSchema
        .filter(c => c && (c.role === 'Number (measurement)' || c.role === 'Category'))
        .map(c => c.name);

    return {
        ...calculateMetrics(yTest, yPred),
        modelInstance: trainedModel,
        predictFn,
        XTest,
        yTest,
        XTrain,
        featureCols,
        // Extra visualization data
        ...modelMeta,
    };
}

// ─── Real Explainability Functions ───────────────────────────────────────────

export function calculateGlobalFeatureImportance(predictFn, XTest, yTest, featureCols) {
    if (!predictFn || !XTest || XTest.length === 0) return featureCols.map(f => ({ id: f, importance: 0 }));

    const baselinePreds = predictFn(XTest).map(v => Number(v) >= 0.5 ? 1 : 0);
    const baselineMetrics = calculateMetrics(yTest, baselinePreds);
    const baselineAcc = baselineMetrics.accuracy;

    const importanceScores = [];

    for (let fIdx = 0; fIdx < featureCols.length; fIdx++) {
        const XShuffled = XTest.map(row => [...row]);
        const colVals = XShuffled.map(row => row[fIdx]);
        for (let i = colVals.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [colVals[i], colVals[j]] = [colVals[j], colVals[i]];
        }
        for (let i = 0; i < XShuffled.length; i++) {
            XShuffled[i][fIdx] = colVals[i];
        }

        const newPreds = predictFn(XShuffled).map(v => Number(v) >= 0.5 ? 1 : 0);
        const newAcc = calculateMetrics(yTest, newPreds).accuracy;
        const drop = Math.max(0, baselineAcc - newAcc);
        importanceScores.push({ id: featureCols[fIdx], importance: drop });
    }

    const totalDrop = importanceScores.reduce((sum, s) => sum + s.importance, 0);
    if (totalDrop > 0) {
        importanceScores.forEach(s => { s.importance = s.importance / totalDrop; });
    } else {
        const eq = 1 / importanceScores.length;
        importanceScores.forEach(s => { s.importance = eq; });
    }

    return importanceScores;
}

export function calculateLocalSHAP(predictFn, patientRow, XTrain, featureCols) {
    if (!predictFn || !patientRow || !XTrain || XTrain.length === 0) return featureCols.map(f => ({ id: f, contribution: 0 }));

    const bgPreds = predictFn(XTrain).map(v => Number(v) >= 0.5 ? 1 : 0);
    const baselineRisk = bgPreds.reduce((a, b) => a + b, 0) / bgPreds.length;

    const patientPreds = predictFn([patientRow]).map(v => Number(v) >= 0.5 ? 1 : 0);
    const patientRisk = patientPreds[0];

    const contributions = [];

    for (let fIdx = 0; fIdx < featureCols.length; fIdx++) {
        const xPerturbed = XTrain.map(row => {
            const newRow = [...row];
            newRow[fIdx] = patientRow[fIdx];
            return newRow;
        });

        const newPreds = predictFn(xPerturbed).map(v => Number(v) >= 0.5 ? 1 : 0);
        const expectedRiskWithFeature = newPreds.reduce((a, b) => a + b, 0) / newPreds.length;
        const marginalEffect = expectedRiskWithFeature - baselineRisk;
        contributions.push({ id: featureCols[fIdx], contribution: marginalEffect });
    }

    const totalDiff = patientRisk - baselineRisk;
    const sumContribs = contributions.reduce((sum, c) => sum + c.contribution, 0);

    if (Math.abs(sumContribs) > 0.001) {
        const scale = totalDiff / sumContribs;
        contributions.forEach(c => c.contribution *= scale);
    }

    return { baselineRisk, patientRisk, contributions };
}
