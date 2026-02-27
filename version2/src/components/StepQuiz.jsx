import React, { useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, ChevronRight, Award, RotateCcw } from 'lucide-react';

// Per-step quiz questions
const QUIZ_DATA = {
    1: {
        title: 'Step 1 Check — Clinical Context',
        questions: [
            {
                id: 'q1',
                text: 'What does Sensitivity measure in a clinical AI model?',
                options: [
                    'How many patients were processed by the AI',
                    'Of patients WHO HAD the condition, how many did the AI correctly identify?',
                    'How accurate the model is overall',
                    'How fast the model runs',
                ],
                correct: 1,
                explanation: 'Sensitivity (recall) captures how many true positive cases the model catches. Missing sick patients is usually the most dangerous error in clinical screening.',
            },
            {
                id: 'q2',
                text: 'Why can\'t we trust overall accuracy alone as a performance measure?',
                options: [
                    'Because accuracy is too slow to compute',
                    'Because if 90% of patients are healthy, predicting "healthy" for everyone gives 90% accuracy — but catches no sick patients',
                    'Because accuracy only works with small datasets',
                    'There is no problem with using accuracy alone',
                ],
                correct: 1,
                explanation: 'Class imbalance is a critical issue. A model predicting "no disease" for everyone in a 90/10 dataset gets 90% accuracy but zero clinical value — it catches no one who is actually ill.',
            },
        ],
    },
    2: {
        title: 'Step 2 Check — Data Exploration',
        questions: [
            {
                id: 'q3',
                text: 'What is a "target variable" in a machine learning dataset?',
                options: [
                    'The largest column in the dataset',
                    'The patient ID column',
                    'The outcome the model is trying to predict (e.g., readmission yes/no)',
                    'The first column in the spreadsheet',
                ],
                correct: 2,
                explanation: 'The target variable is what we want the model to learn to predict — in our case, whether a patient will be readmitted, have the disease, or experience the outcome.',
            },
            {
                id: 'q4',
                text: 'Why is it important to check for missing values in patient data?',
                options: [
                    'Missing values make files smaller',
                    'Models may learn incorrect patterns or fail entirely if key measurements are absent for many patients',
                    'Missing values only matter for large datasets',
                    'Missing values improve model speed',
                ],
                correct: 1,
                explanation: 'Missing data is common in clinical datasets (patients who don\'t have all tests done). If not handled, models learn on incomplete information and may perform unreliably on new patients.',
            },
        ],
    },
    3: {
        title: 'Step 3 Check — Data Preparation',
        questions: [
            {
                id: 'q5',
                text: 'What does normalisation do to patient measurements?',
                options: [
                    'Deletes outlier patients',
                    'Rescales all measurements to a common scale so no single measurement dominates due to its units',
                    'Removes missing values',
                    'Adds more patients to the dataset',
                ],
                correct: 1,
                explanation: 'Without normalisation, a measurement like Age (0–100) would be dwarfed by Troponin (0–50,000). Normalisation ensures fair comparison across all features.',
            },
            {
                id: 'q6',
                text: 'SMOTE should only be applied to:',
                options: [
                    'Both training and test data equally',
                    'Only the test data',
                    'Only the training data — never the test patients',
                    'The target variable column only',
                ],
                correct: 2,
                explanation: 'SMOTE creates synthetic patients to balance the training data. Applying it to test data would "contaminate" the evaluation — we must test on real, unseen patients only.',
            },
        ],
    },
    4: {
        title: 'Step 4 Check — Model & Parameters',
        questions: [
            {
                id: 'q7',
                text: 'What happens if a Decision Tree is set to a very high maximum depth?',
                options: [
                    'It becomes faster and more reliable',
                    'It simplifies and generalises better',
                    'It risks overfitting — memorising training patients rather than learning generalisable patterns',
                    'It stops working entirely',
                ],
                correct: 2,
                explanation: 'Overfitting is when a model is so complex it memorises training data and performs poorly on new patients. Like a student who memorises past exam papers but cannot apply the knowledge.',
            },
            {
                id: 'q8',
                text: 'What does the K value in K-Nearest Neighbors control?',
                options: [
                    'The number of features used',
                    'How many similar historical patients the model compares a new patient to',
                    'The training/test split ratio',
                    'The number of decision trees',
                ],
                correct: 1,
                explanation: 'K is the neighbourhood size. Small K = sensitive to individual noisy cases. Large K = smoother but may ignore important local patterns. Clinically, think of it as "ask how many past cases?"',
            },
        ],
    },
    5: {
        title: 'Step 5 Check — Results & Evaluation',
        questions: [
            {
                id: 'q9',
                text: 'A False Negative in a readmission prediction model means:',
                options: [
                    'The model correctly identified a patient who would be readmitted',
                    'The model flagged a healthy patient as high-risk unnecessarily',
                    'A patient who WAS readmitted was incorrectly sent home without extra support',
                    'The model refused to make a prediction',
                ],
                correct: 2,
                explanation: 'False Negatives are the most dangerous clinical error — sick patients classified as safe. In readmission context, this means the patient returns to hospital without having had extra support or intervention.',
            },
            {
                id: 'q10',
                text: 'An AUC-ROC of 0.50 means:',
                options: [
                    'The model is perfect',
                    'The model performs no better than random chance',
                    'The model has 50% accuracy',
                    'The model needs more training data',
                ],
                correct: 1,
                explanation: 'AUC of 0.50 = random guessing (equivalent to flipping a coin). The model has no discriminative ability. AUC above 0.75–0.80 is generally considered clinically useful.',
            },
        ],
    },
    6: {
        title: 'Step 6 Check — Explainability',
        questions: [
            {
                id: 'q11',
                text: 'Feature importance in a clinical AI model shows:',
                options: [
                    'Which patients are the most expensive to treat',
                    'Which patient measurements most strongly influenced the AI\'s predictions across all test patients',
                    'How many patients were in the training set',
                    'Which doctor entered the most data',
                ],
                correct: 1,
                explanation: 'Feature importance helps clinicians verify that the AI is using medically sensible signals (e.g., ejection fraction for heart failure) rather than spurious correlations.',
            },
            {
                id: 'q12',
                text: 'A waterfall chart in explainability (SHAP) shows:',
                options: [
                    'The geographical location of patients',
                    'The hospital admission trend over time',
                    'How each individual measurement pushed the prediction up (toward risk) or down (away from risk) for a specific patient',
                    'How much data was missing from each patient',
                ],
                correct: 2,
                explanation: 'SHAP waterfall charts are patient-level explanations — they answer "why THIS patient was flagged" by showing the direction and magnitude of each feature\'s contribution.',
            },
        ],
    },
    7: {
        title: 'Step 7 Check — Ethics & Bias',
        questions: [
            {
                id: 'q13',
                text: 'A model has 85% overall accuracy but only 30% sensitivity for elderly patients. This means:',
                options: [
                    'The model is ready for clinical deployment',
                    'The model is missing 70% of at-risk elderly patients — it is biased and unsafe for this group',
                    'Elderly patients are healthier in this dataset',
                    'Accuracy of 85% overrides subgroup performance',
                ],
                correct: 1,
                explanation: 'This is a real scenario that has occurred in clinical AI. Overall metrics can mask dangerous subgroup failures. Always check performance separately for vulnerable groups before deployment.',
            },
            {
                id: 'q14',
                text: 'Under EU AI Act, high-risk AI in healthcare requires:',
                options: [
                    'No special oversight — AI is exempt from medical regulations',
                    'Human oversight, transparency, explainability, bias auditing, and incident reporting pathways',
                    'Only that the model achieves accuracy above 90%',
                    'A simple software license',
                ],
                correct: 1,
                explanation: 'The EU AI Act classifies clinical decision support as high-risk AI. It mandates human oversight, risk management, data governance, transparency, and ongoing monitoring — not just performance metrics.',
            },
        ],
    },
};

const StepQuiz = ({ stepNumber, isDarkMode, onComplete }) => {
    const quiz = QUIZ_DATA[stepNumber];
    const [currentQ, setCurrentQ] = useState(0);
    const [selected, setSelected] = useState(null);
    const [answered, setAnswered] = useState(false);
    const [score, setScore] = useState(0);
    const [finished, setFinished] = useState(false);
    const [answers, setAnswers] = useState([]);

    if (!quiz) return null;

    const question = quiz.questions[currentQ];
    const total = quiz.questions.length;

    const handleSelect = (idx) => {
        if (answered) return;
        setSelected(idx);
        setAnswered(true);
        const correct = idx === question.correct;
        if (correct) setScore(s => s + 1);
        setAnswers(prev => [...prev, { correct, selected: idx, correctIdx: question.correct }]);
    };

    const handleNext = () => {
        if (currentQ + 1 >= total) {
            setFinished(true);
        } else {
            setCurrentQ(c => c + 1);
            setSelected(null);
            setAnswered(false);
        }
    };

    const handleRetry = () => {
        setCurrentQ(0);
        setSelected(null);
        setAnswered(false);
        setScore(0);
        setFinished(false);
        setAnswers([]);
    };

    const pct = Math.round((score / total) * 100);

    if (finished) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'} shadow-sm`}
            >
                <div className="text-center">
                    <div className="text-5xl mb-3">
                        {pct === 100 ? '🎉' : pct >= 50 ? '👍' : '📚'}
                    </div>
                    <h3 className={`text-xl font-black mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        {pct === 100 ? 'Perfect Score!' : pct >= 50 ? 'Good Work!' : 'Keep Learning!'}
                    </h3>
                    <p className={`text-sm mb-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        You scored <strong className="text-indigo-500">{score}/{total}</strong> ({pct}%)
                    </p>

                    {/* Answer review */}
                    <div className="space-y-2 mb-5 text-left">
                        {quiz.questions.map((q, i) => {
                            const ans = answers[i];
                            return (
                                <div key={q.id} className={`p-3 rounded-xl border text-xs ${ans?.correct
                                    ? isDarkMode ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'
                                    : isDarkMode ? 'bg-red-900/20 border-red-500/30' : 'bg-red-50 border-red-200'
                                    }`}>
                                    <div className="flex items-start gap-2">
                                        {ans?.correct
                                            ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                            : <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                                        }
                                        <div>
                                            <p className={`font-semibold mb-0.5 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{q.text}</p>
                                            {!ans?.correct && (
                                                <p className={`${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                                                    ✓ Correct: {q.options[q.correct]}
                                                </p>
                                            )}
                                            <p className={`mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                                {q.explanation}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={handleRetry}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${isDarkMode
                                ? 'border-slate-600 text-slate-300 hover:bg-slate-800'
                                : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            <RotateCcw className="w-4 h-4" /> Retry
                        </button>
                        <button
                            onClick={() => onComplete(score, total)}
                            className="flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-lg shadow-emerald-500/20"
                        >
                            Continue <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'} shadow-sm`}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${isDarkMode ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}>
                        🧠 QUIZ — {quiz.title}
                    </span>
                </div>
                <span className={`text-xs font-mono ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    {currentQ + 1} / {total}
                </span>
            </div>

            {/* Progress */}
            <div className={`h-1 rounded-full mb-5 overflow-hidden ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                <motion.div
                    className="h-full rounded-full bg-indigo-500"
                    animate={{ width: `${((currentQ) / total) * 100}%` }}
                    transition={{ duration: 0.3 }}
                />
            </div>

            {/* Question */}
            <p className={`text-sm font-semibold mb-4 leading-relaxed ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                {question.text}
            </p>

            {/* Options */}
            <div className="space-y-2 mb-4">
                {question.options.map((opt, idx) => {
                    let cls = '';
                    if (!answered) {
                        cls = isDarkMode
                            ? 'border-slate-600 hover:border-indigo-400 hover:bg-indigo-500/10 cursor-pointer'
                            : 'border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 cursor-pointer';
                    } else if (idx === question.correct) {
                        cls = isDarkMode
                            ? 'border-emerald-500/60 bg-emerald-900/20'
                            : 'border-emerald-400 bg-emerald-50';
                    } else if (idx === selected && idx !== question.correct) {
                        cls = isDarkMode
                            ? 'border-red-500/60 bg-red-900/20'
                            : 'border-red-400 bg-red-50';
                    } else {
                        cls = isDarkMode ? 'border-slate-700 opacity-50' : 'border-slate-200 opacity-50';
                    }

                    return (
                        <motion.button
                            key={idx}
                            whileHover={!answered ? { scale: 1.01 } : {}}
                            whileTap={!answered ? { scale: 0.99 } : {}}
                            onClick={() => handleSelect(idx)}
                            className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all flex items-start gap-3 ${cls}`}
                        >
                            <span className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-black mt-0.5
                                ${answered && idx === question.correct ? 'border-emerald-500 bg-emerald-500 text-white'
                                    : answered && idx === selected ? 'border-red-500 bg-red-500 text-white'
                                        : isDarkMode ? 'border-slate-600' : 'border-slate-300'}`}>
                                {answered && idx === question.correct ? '✓' : answered && idx === selected ? '✗' : String.fromCharCode(65 + idx)}
                            </span>
                            <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>{opt}</span>
                        </motion.button>
                    );
                })}
            </div>

            {/* Explanation */}
            <AnimatePresence>
                {answered && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className={`mb-4 p-3 rounded-xl border text-xs leading-relaxed ${selected === question.correct
                            ? isDarkMode ? 'bg-emerald-900/20 border-emerald-500/30 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : isDarkMode ? 'bg-amber-900/20 border-amber-500/30 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800'
                            }`}
                    >
                        <strong>{selected === question.correct ? '✅ Correct! ' : '❌ Not quite. '}</strong>
                        {question.explanation}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex justify-end">
                <button
                    onClick={handleNext}
                    disabled={!answered}
                    className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all ${answered
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                        : isDarkMode ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                >
                    {currentQ + 1 >= total ? 'See Results' : 'Next Question'} <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </motion.div>
    );
};

export default StepQuiz;
export { QUIZ_DATA };
