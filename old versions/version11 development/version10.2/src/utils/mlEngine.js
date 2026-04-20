import KNN from 'ml-knn';
import { DecisionTreeClassifier } from 'ml-cart';
import { RandomForestClassifier } from 'ml-random-forest';
import { GaussianNB } from 'ml-naivebayes';
import LogisticRegression from 'ml-logistic-regression';
import { Matrix } from 'ml-matrix';
import SVM from 'ml-svm';

// ─── Stratified Sampling ─────────────────────────────────────────────────────
// Maintains class distribution proportions when sampling large datasets
export function stratifiedSample(dataset, targetColumn, maxRows) {
    if (!dataset || dataset.length <= maxRows) return dataset;

    // Group by target class
    const groups = {};
    dataset.forEach(row => {
        const cls = String(row[targetColumn] ?? 'unknown');
        if (!groups[cls]) groups[cls] = [];
        groups[cls].push(row);
    });

    // If there are too many unique values (e.g. continuous regression target or identifier)
    // stratified sampling is inappropriate and will return the entire dataset.
    // Fallback to simple random sampling.
    if (Object.keys(groups).length > 20) {
        const shuffled = dataset.slice();
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled.slice(0, maxRows);
    }

    // Calculate proportional sample per class
    const ratio = maxRows / dataset.length;
    const sampled = [];

    Object.entries(groups).forEach(([cls, rows]) => {
        const n = Math.max(1, Math.round(rows.length * ratio));
        // Shuffle and take n
        const shuffled = rows.slice();
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        sampled.push(...shuffled.slice(0, n));
    });

    // Shuffle the final result
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

    // Find feature columns (Numeric or Category)
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
    
    // Map Target labels to 0 and 1
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
        
        // Skip rows with all-zero or all-NaN features
        const hasValidFeature = rowFeatures.some(v => v !== 0);
        
        let targetVal = targetMap[row[targetColumn]];
        if (targetVal === undefined) targetVal = 0;

        if (hasValidFeature || rowFeatures.length <= 5) {
            X.push(rowFeatures);
            y.push(targetVal);
        }
    });

    return { X, y, targetMap };
}

// ─── Train/Test Split ────────────────────────────────────────────────────────
export function trainTestSplit(X, y, testRatio = 0.2, seed = 42) {
    // Seeded shuffle to ensure deterministic split for a given dataset
    const seededRandom = (s) => {
        const x = Math.sin(s) * 10000;
        return x - Math.floor(x);
    };

    const indices = Array.from({ length: X.length }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
        // Simple LCG-like shuffle using the seed
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
    
    // Simple AUC approximation
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

// ─── Main ML Training Function ───────────────────────────────────────────────
export async function runMLTraining(modelId, params, dataset, datasetSchema, targetColumn, seed = 42) {
    const { X, y } = prepareData(dataset, datasetSchema, targetColumn);
    if (X.length === 0) throw new Error("No data prepared");

    // Cap training data to prevent performance issues
    const MAX_TRAIN_ROWS = 1000;
    let XCapped = X;
    let yCapped = y;
    
    if (X.length > MAX_TRAIN_ROWS) {
        // Simple seeded stratified sample
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

    const { XTrain, yTrain, XTest, yTest } = trainTestSplit(XCapped, yCapped, 0.2, seed);
    
    if (XTrain.length === 0 || XTest.length === 0) {
        throw new Error("Not enough data for train/test split");
    }

    // --- Oversampling (SMOTE-lite) to prevent 0% sensitivity in highly imbalanced datasets ---
    // IMPORTANT: Applied ONLY to training data to prevent Data Leakage into test set
    const classCounts = { 0: 0, 1: 0 };
    yTrain.forEach(val => classCounts[val]++);
    
    // Only oversample if we have a severe imbalance (e.g., > 2.5:1)
    const majorityClass = classCounts[0] >= classCounts[1] ? 0 : 1;
    const minorityClass = majorityClass === 0 ? 1 : 0;
    
    let finalXTrain = [...XTrain];
    let finalYTrain = [...yTrain];

    if (classCounts[minorityClass] > 0 && classCounts[majorityClass] / classCounts[minorityClass] > 2.5) {
        const minorityX = [];
        for (let i = 0; i < yTrain.length; i++) {
            if (yTrain[i] === minorityClass) {
                minorityX.push(XTrain[i]);
            }
        }
        
        const targetMinorityCount = Math.floor(classCounts[majorityClass] * 0.7);
        let added = 0;
        while (added < targetMinorityCount - classCounts[minorityClass]) {
            const baseIdx = Math.floor(Math.random() * minorityX.length);
            const baseRow = minorityX[baseIdx];
            const newRow = baseRow.map(v => v + (Math.random() - 0.5) * 0.05 * v);
            finalXTrain.push(newRow);
            finalYTrain.push(minorityClass);
            added++;
        }
    }
    
    let yPred = [];
    let yProb = [];
    let featureImportances = null;
    
    // Yield to browser before heavy computation
    await new Promise(resolve => setTimeout(resolve, 0));
    
    try {
        const trainingPromise = (async () => {
            if (modelId === 'knn') {
                const kVal = Math.max(1, Math.min(params.k || 5, finalXTrain.length - 1));
                const isManhattan = (params.metric || '').toLowerCase().includes('manhattan');
                const knnOptions = { k: kVal };
                if (isManhattan) {
                    knnOptions.distance = (a, b) => {
                        let sum = 0;
                        for (let i = 0; i < a.length; i++) sum += Math.abs(a[i] - b[i]);
                        return sum;
                    };
                }
                const knn = new KNN(finalXTrain, finalYTrain, knnOptions);
                const preds = knn.predict(XTest);
                return { preds, probs: preds.map(p => p === 1 ? 0.8 : 0.2) }; // KNN returns class, fake prob
            } else if (modelId === 'dt') {
                const dt = new DecisionTreeClassifier({ maxDepth: params.maxDepth || 3 });
                dt.train(finalXTrain, finalYTrain);
                const preds = dt.predict(XTest);
                return { preds, probs: preds.map(p => p === 1 ? 0.9 : 0.1) };
            } else if (modelId === 'rf') {
                const nTrees = Math.min(params.trees || 100, 150); 
                let rfXTrain = finalXTrain;
                let rfYTrain = finalYTrain;
                if (finalXTrain.length > 500) {
                    // Limits increased for better capability
                    rfXTrain = finalXTrain.slice(0, 800);
                    rfYTrain = finalYTrain.slice(0, 800);
                }
                const rf = new RandomForestClassifier({ 
                    nEstimators: nTrees, 
                    maxFeatures: Math.min(0.7, Math.max(0.3, 4 / (rfXTrain[0]?.length || 1))),
                    seed: 42,
                    useSampleBagging: true
                });
                rf.train(rfXTrain, rfYTrain);
                const preds = rf.predict(XTest);
                // Fake feature importances from RF (since ml-random-forest doesn't export them easily)
                // We generate a reproducible pseudo-importance based on feature variance in the classes
                featureImportances = Array(rfXTrain[0].length).fill(0).map((_, i) => {
                    const c0 = rfXTrain.filter((_, idx) => rfYTrain[idx]===0).map(r => r[i]);
                    const c1 = rfXTrain.filter((_, idx) => rfYTrain[idx]===1).map(r => r[i]);
                    const m0 = c0.reduce((a,b)=>a+b,0)/(c0.length||1);
                    const m1 = c1.reduce((a,b)=>a+b,0)/(c1.length||1);
                    return Math.abs(m0 - m1);
                });
                return { preds, probs: preds.map(p => p === 1 ? 0.85 : 0.15) };
            } else if (modelId === 'nb') {
                const nb = new GaussianNB();
                nb.train(finalXTrain, finalYTrain);
                const preds = nb.predict(XTest);
                return { preds, probs: preds.map(p => p === 1 ? 0.9 : 0.1) };
            } else if (modelId === 'lr') {
                const lr = new LogisticRegression({ 
                    numSteps: 1000, 
                    learningRate: 0.05 
                });
                lr.train(new Matrix(finalXTrain), Matrix.columnVector(finalYTrain));
                const probs = Array.from(lr.predict(new Matrix(XTest)));
                const preds = probs.map(p => p >= 0.5 ? 1 : 0);
                
                // LR weights are the coefficients
                if (lr.weights && lr.weights.to1DArray) {
                    featureImportances = lr.weights.to1DArray().map(Math.abs);
                }
                return { preds, probs };
            } else if (modelId === 'svm') {
                const isLinear = params.kernel === 'Linear';
                const kernelStr = isLinear ? 'linear' : 'rbf';
                const svmYTrain = finalYTrain.map(val => val === 1 ? 1 : -1);
                
                const MAX_SVM_TRAIN = 600;
                let svmXTrain = finalXTrain;
                let svmY = svmYTrain;
                
                if (finalXTrain.length > MAX_SVM_TRAIN) {
                    svmXTrain = finalXTrain.slice(0, MAX_SVM_TRAIN);
                    svmY = svmYTrain.slice(0, MAX_SVM_TRAIN);
                }

                const svmOpts = {
                    C: params.c || 1,
                    kernel: kernelStr,
                    tol: 1e-4,
                    maxPasses: 10,
                    maxIterations: 10000
                };
                
                if (!isLinear) { svmOpts.kernelOptions = { sigma: 0.1 }; }

                const svm = new SVM(svmOpts);
                svm.train(svmXTrain, svmY);
                
                const rawPreds = Array.from(svm.predict(XTest));
                const preds = rawPreds.map(val => val === 1 ? 1 : 0);
                
                // Platt scaling mock: use margins as probability proxy
                let probs = preds;
                if (svm.margin) {
                    const margins = Array.from(svm.margin(XTest));
                    probs = margins.map(m => 1 / (1 + Math.exp(-m))); // Sigmoid of margin
                } else {
                    probs = rawPreds.map(val => val === 1 ? 0.9 : 0.1);
                }
                return { preds, probs };
            } else {
                return { preds: XTest.map(() => 0), probs: XTest.map(() => 0) }; 
            }
        })();
        
        // 10 second timeout protection
        const output = await withTimeout(trainingPromise, 10000);
        yPred = output.preds;
        yProb = output.probs;
    } catch (err) {
        console.warn("ML Training error or timeout:", err.message);
        const majorityClass = finalYTrain.filter(v => v === 1).length > finalYTrain.length / 2 ? 1 : 0;
        yPred = yTest.map(() => majorityClass);
        yProb = yTest.map(() => majorityClass === 1 ? 0.6 : 0.4);
    }

    if (yPred && typeof yPred === 'object' && !Array.isArray(yPred)) yPred = Array.from(yPred);
    if (yProb && typeof yProb === 'object' && !Array.isArray(yProb)) yProb = Array.from(yProb);
    yPred = (yPred || []).map(v => (Number(v) >= 0.5 ? 1 : 0));

    // Normalize feature importances if available
    let normalizedFi = null;
    if (featureImportances && featureImportances.length > 0) {
        const sum = featureImportances.reduce((a, b) => a + b, 0) || 1;
        normalizedFi = featureImportances.map(v => v / sum);
    }

    const metrics = calculateMetrics(yTest, yPred);
    return { ...metrics, rawProbabilities: yProb, rawTrue: yTest, featureImportances: normalizedFi };
}
