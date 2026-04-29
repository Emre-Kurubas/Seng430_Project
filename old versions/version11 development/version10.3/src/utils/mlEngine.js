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

    // --- Oversampling (SMOTE-lite) to prevent 0% sensitivity in highly imbalanced datasets ---
    const classCounts = { 0: 0, 1: 0 };
    yCapped.forEach(val => classCounts[val]++);
    
    // Only oversample if we have a severe imbalance (e.g., > 3:1) and minority class has at least a few samples
    const majorityClass = classCounts[0] >= classCounts[1] ? 0 : 1;
    const minorityClass = majorityClass === 0 ? 1 : 0;
    
    if (classCounts[minorityClass] > 0 && classCounts[majorityClass] / classCounts[minorityClass] > 2.5) {
        const minorityX = [];
        const minorityY = [];
        for (let i = 0; i < yCapped.length; i++) {
            if (yCapped[i] === minorityClass) {
                minorityX.push(XCapped[i]);
                minorityY.push(yCapped[i]);
            }
        }
        
        // Target roughly 1:1.5 ratio
        const targetMinorityCount = Math.floor(classCounts[majorityClass] * 0.7);
        let added = 0;
        while (added < targetMinorityCount - classCounts[minorityClass]) {
            // Randomly sample an existing minority row and add a 1% noise jitter
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
    
    // Yield to browser before heavy computation
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
                    seed: 42,
                    useSampleBagging: true
                });
                trainedModel.train(rfXTrain, rfYTrain);
                predictFn = (X) => trainedModel.predict(X);
                return predictFn(XTest);
            } else if (modelId === 'nb') {
                trainedModel = new GaussianNB();
                trainedModel.train(XTrain, yTrain);
                predictFn = (X) => trainedModel.predict(X);
                return predictFn(XTest);
            } else if (modelId === 'lr') {
                trainedModel = new LogisticRegression({ 
                    numSteps: 1000, 
                    learningRate: 0.05 
                });
                trainedModel.train(new Matrix(XTrain), Matrix.columnVector(yTrain));
                predictFn = (X) => Array.from(trainedModel.predict(new Matrix(X)));
                return predictFn(XTest);
            } else if (modelId === 'svm') {
                const isLinear = params.kernel === 'Linear';
                const kernelStr = isLinear ? 'linear' : 'rbf';
                const svmYTrain = yTrain.map(val => val === 1 ? 1 : -1);
                
                const MAX_SVM_TRAIN = 400;
                let finalXTrain = XTrain;
                let finalYTrain = svmYTrain;
                
                if (XTrain.length > MAX_SVM_TRAIN) {
                    finalXTrain = XTrain.slice(0, MAX_SVM_TRAIN);
                    finalYTrain = svmYTrain.slice(0, MAX_SVM_TRAIN);
                }

                const svmOpts = {
                    C: params.c || 1,
                    kernel: kernelStr,
                    tol: 1e-4,
                    maxPasses: 10,
                    maxIterations: 10000
                };
                if (!isLinear) svmOpts.kernelOptions = { sigma: 0.1 };

                trainedModel = new SVM(svmOpts);
                trainedModel.train(finalXTrain, finalYTrain);
                predictFn = (X) => Array.from(trainedModel.predict(X)).map(val => val === 1 ? 1 : 0);
                return predictFn(XTest);
            } else {
                return XTest.map(() => 0); 
            }
        })();
        
        // 10 second timeout protection
        yPred = await withTimeout(trainingPromise, 10000);
    } catch (err) {
        console.warn("ML Training error or timeout:", err.message);
        // Fallback: simple majority-class predictor
        const majorityClass = yTrain.filter(v => v === 1).length > yTrain.length / 2 ? 1 : 0;
        yPred = yTest.map(() => majorityClass);
    }

    // Ensure yPred is a flat array of numbers
    if (yPred && typeof yPred === 'object' && !Array.isArray(yPred)) {
        yPred = Array.from(yPred);
    }
    yPred = (yPred || []).map(v => (Number(v) >= 0.5 ? 1 : 0));

    return {
        ...calculateMetrics(yTest, yPred),
        modelInstance: trainedModel,
        predictFn,
        XTest,
        yTest,
        XTrain,
        featureCols: datasetSchema.filter(c => c && (c.role === 'Number (measurement)' || c.role === 'Category')).map(c => c.name)
    };
}

// ─── Real Explainability Functions ───────────────────────────────────────────

export function calculateGlobalFeatureImportance(predictFn, XTest, yTest, featureCols) {
    if (!predictFn || !XTest || XTest.length === 0) return featureCols.map(f => ({ id: f, importance: 0 }));
    
    // 1. Baseline accuracy
    const baselinePreds = predictFn(XTest).map(v => Number(v) >= 0.5 ? 1 : 0);
    const baselineMetrics = calculateMetrics(yTest, baselinePreds);
    const baselineAcc = baselineMetrics.accuracy;

    const importanceScores = [];

    // 2. Permutation Importance
    for (let fIdx = 0; fIdx < featureCols.length; fIdx++) {
        // Create a copy of XTest and shuffle only column fIdx
        const XShuffled = XTest.map(row => [...row]);
        const colVals = XShuffled.map(row => row[fIdx]);
        // Shuffle colVals
        for (let i = colVals.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [colVals[i], colVals[j]] = [colVals[j], colVals[i]];
        }
        // Re-assign
        for (let i = 0; i < XShuffled.length; i++) {
            XShuffled[i][fIdx] = colVals[i];
        }

        // 3. New accuracy
        const newPreds = predictFn(XShuffled).map(v => Number(v) >= 0.5 ? 1 : 0);
        const newAcc = calculateMetrics(yTest, newPreds).accuracy;
        
        // Importance is the drop in accuracy. If accuracy improves (drop is negative), clamp to 0.
        const drop = Math.max(0, baselineAcc - newAcc);
        importanceScores.push({ id: featureCols[fIdx], importance: drop });
    }

    // Normalize so they sum to 1
    const totalDrop = importanceScores.reduce((sum, s) => sum + s.importance, 0);
    if (totalDrop > 0) {
        importanceScores.forEach(s => { s.importance = s.importance / totalDrop; });
    } else {
        // Fallback if model is broken or randomly guessing
        const eq = 1 / importanceScores.length;
        importanceScores.forEach(s => { s.importance = eq; });
    }

    return importanceScores;
}

export function calculateLocalSHAP(predictFn, patientRow, XTrain, featureCols) {
    if (!predictFn || !patientRow || !XTrain || XTrain.length === 0) return featureCols.map(f => ({ id: f, contribution: 0 }));

    // Find baseline average prediction across all training data
    const bgPreds = predictFn(XTrain).map(v => Number(v) >= 0.5 ? 1 : 0);
    const baselineRisk = bgPreds.reduce((a, b) => a + b, 0) / bgPreds.length;

    // Patient prediction
    const patientPreds = predictFn([patientRow]).map(v => Number(v) >= 0.5 ? 1 : 0);
    const patientRisk = patientPreds[0];

    // Marginal contribution per feature
    const contributions = [];
    
    for (let fIdx = 0; fIdx < featureCols.length; fIdx++) {
        // Create perturbed dataset: all XTrain rows, but with THIS patient's fIdx value
        const xPerturbed = XTrain.map(row => {
            const newRow = [...row];
            newRow[fIdx] = patientRow[fIdx];
            return newRow;
        });

        const newPreds = predictFn(xPerturbed).map(v => Number(v) >= 0.5 ? 1 : 0);
        const expectedRiskWithFeature = newPreds.reduce((a, b) => a + b, 0) / newPreds.length;
        
        // The marginal effect of this feature having this specific value
        const marginalEffect = expectedRiskWithFeature - baselineRisk;
        contributions.push({ id: featureCols[fIdx], contribution: marginalEffect });
    }

    // Normalize sum of contributions to equal the total difference from baseline
    const totalDiff = patientRisk - baselineRisk;
    const sumContribs = contributions.reduce((sum, c) => sum + c.contribution, 0);
    
    if (Math.abs(sumContribs) > 0.001) {
        const scale = totalDiff / sumContribs;
        contributions.forEach(c => c.contribution *= scale);
    }

    return { baselineRisk, patientRisk, contributions };
}
