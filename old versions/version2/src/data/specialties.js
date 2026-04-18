export const specialties = [
    {
        id: 1,
        name: 'Cardiology',
        description: '30-day readmission risk after heart failure discharge',
        source: 'Heart Failure Clinical Records',
        target: 'DEATH_EVENT (binary)',
        clinicalQuestion: 'Will this patient be readmitted to hospital within 30 days of discharge following a heart failure episode?',
        whyMatters: '30% of heart failure patients are readmitted within 30 days. Each readmission costs approximately €15,000. Early identification allows nurses to arrange discharge follow-up calls and medication checks.'
    },
    {
        id: 2,
        name: 'Radiology',
        description: 'Normal vs. pneumonia from clinical features',
        source: 'NIH Chest X-Ray metadata',
        target: 'Finding Label (binary/multi)',
        clinicalQuestion: 'Is there evidence of pneumonia present in the clinical features derived from the chest X-ray?',
        whyMatters: 'Early detection of pneumonia can prevent severe complications and reduce the spread of infection. Automated screening can help prioritize urgent cases for radiologists.'
    },
    {
        id: 3,
        name: 'Nephrology',
        description: 'Chronic kidney disease stage from routine lab values',
        source: 'UCI CKD Dataset (400 patients)',
        target: 'classification (CKD / not CKD)',
        clinicalQuestion: 'Does this patient exhibit clinical indicators consistent with Chronic Kidney Disease based on routine lab values?',
        whyMatters: 'Chronic Kidney Disease (CKD) often progresses silently. Early identification from routine blood tests allows for intervention to slow progression and prevent kidney failure.'
    },
    {
        id: 4,
        name: 'Oncology — Breast',
        description: 'Malignancy of a breast biopsy from cell measurements',
        source: 'Wisconsin Breast Cancer Dataset',
        target: 'diagnosis (M/B)',
        clinicalQuestion: 'Is the breast mass benign or malignant based on cell nuclei measurements from a fine needle aspirate?',
        whyMatters: 'Accurate diagnosis of breast masses determines the course of treatment. Reducing false positives avoids unnecessary anxiety and biopsies, while catching malignancies early saves lives.'
    },
    {
        id: 5,
        name: 'Neurology — Parkinson\'s',
        description: 'Parkinson\'s disease from voice biomarkers',
        source: 'UCI Parkinson\'s Dataset',
        target: 'status (0/1)',
        clinicalQuestion: 'Do the voice biomarkers indicate the presence of Parkinson\'s disease?',
        whyMatters: 'Voice analysis offers a non-invasive, accessible method for early screening of Parkinson\'s disease, potentially identifying patients before severe motor symptoms appear.'
    },
    {
        id: 6,
        name: 'Endocrinology — Diabetes',
        description: 'Diabetes onset within 5 years from metabolic markers',
        source: 'Pima Indians Diabetes Dataset',
        target: 'Outcome (0/1)',
        clinicalQuestion: 'Is this patient likely to develop diabetes within the next 5 years based on current metabolic markers?',
        whyMatters: 'Predicting diabetes onset allows for lifestyle interventions and monitoring that can prevent or delay the disease, significantly improving long-term health outcomes.'
    },
    {
        id: 7,
        name: 'Hepatology — Liver',
        description: 'Liver disease from blood test results',
        source: 'Indian Liver Patient Dataset',
        target: 'Dataset (liver disease y/n)',
        clinicalQuestion: 'Do the patient\'s blood test results indicate the presence of liver disease?',
        whyMatters: 'Liver disease can be asymptomatic in early stages. Screening via routine blood tests can facilitate early diagnosis and treatment, preventing irreversible liver damage.'
    },
    {
        id: 8,
        name: 'Cardiology — Stroke',
        description: 'Stroke risk from demographics and comorbidities',
        source: 'Kaggle Stroke Prediction Dataset',
        target: 'stroke (0/1)',
        clinicalQuestion: 'Is this patient at high risk of experiencing a stroke based on their demographic and health profile?',
        whyMatters: 'Stroke is a leading cause of disability and death. Identifying high-risk individuals enables targeted prevention strategies like blood pressure management and lifestyle changes.'
    },
    {
        id: 9,
        name: 'Mental Health',
        description: 'Depression severity from PHQ-9 survey responses',
        source: 'Kaggle Depression/Anxiety Dataset',
        target: 'severity class',
        clinicalQuestion: 'What is the severity level of depression indicated by the patient\'s survey responses?',
        whyMatters: 'Objective severity assessment helps clinicians tailor treatment plans—distinguishing between patients who may need immediate intervention versus those suitable for monitoring.'
    },
    {
        id: 10,
        name: 'Pulmonology — COPD',
        description: 'COPD exacerbation risk from spirometry data',
        source: 'Kaggle / PhysioNet COPD Dataset',
        target: 'exacerbation (y/n)',
        clinicalQuestion: 'Is this COPD patient at risk of an acute exacerbation based on recent spirometry data?',
        whyMatters: 'COPD exacerbations are dangerous and costly. Predicting them allows for preemptive medication adjustments, potentially avoiding hospitalization and lung function decline.'
    },
    {
        id: 11,
        name: 'Haematology — Anaemia',
        description: 'Type of anaemia from full blood count results',
        source: 'Kaggle Anaemia Classification Dataset',
        target: 'anemia_type (multi-class)',
        clinicalQuestion: 'Which type of anaemia is indicated by the patient\'s complete blood count parameters?',
        whyMatters: 'Different types of anaemia require vastly different treatments (e.g., iron supplements vs. B12 vs. bone marrow investigation). Correct classification ensures appropriate therapy.'
    },
    {
        id: 12,
        name: 'Dermatology',
        description: 'Benign vs. malignant skin lesion from dermoscopy features',
        source: 'HAM10000 metadata (Kaggle)',
        target: 'dx_type (benign / malignant)',
        clinicalQuestion: 'Is the skin lesion benign or malignant based on its dermoscopic features?',
        whyMatters: 'Early detection of melanoma and other skin cancers significantly improves survival rates. AI support can help general practitioners decide which lesions require urgent specialist referral.'
    },
    {
        id: 13,
        name: 'Ophthalmology',
        description: 'Diabetic retinopathy severity from clinical findings',
        source: 'UCI / Kaggle Retinopathy Dataset',
        target: 'severity grade',
        clinicalQuestion: 'What is the severity grade of diabetic retinopathy based on the clinical findings?',
        whyMatters: 'Diabetic retinopathy is a leading cause of blindness. Regular screening and accurate grading are essential for timely laser treatment or injections to preserve vision.'
    },
    {
        id: 14,
        name: 'Orthopaedics — Spine',
        description: 'Normal vs. disc herniation from biomechanical measures',
        source: 'UCI Vertebral Column Dataset',
        target: 'class (Normal / Abnormal)',
        clinicalQuestion: 'Do the biomechanical measurements of the spine indicate a disc herniation or other abnormality?',
        whyMatters: 'Objective biomechanical analysis can support radiological findings, helping to diagnose the cause of back pain and determine whether surgical or conservative management is appropriate.'
    },
    {
        id: 15,
        name: 'ICU / Sepsis',
        description: 'Sepsis onset from vital signs and lab results',
        source: 'PhysioNet / Kaggle Sepsis Dataset',
        target: 'SepsisLabel (0/1)',
        clinicalQuestion: 'Is the patient developing sepsis based on trends in their vital signs and laboratory results?',
        whyMatters: 'Sepsis is a medical emergency where every hour counts. Early prediction before obvious clinical shock allows for rapid antibiotic administration, drastically reducing mortality.'
    },
    {
        id: 16,
        name: 'Obstetrics — Fetal Health',
        description: 'Fetal cardiotocography classification (normal / suspect / pathological)',
        source: 'UCI Fetal Health Dataset',
        target: 'fetal_health (1/2/3)',
        clinicalQuestion: 'Does the cardiotocogram (CTG) indicate that the fetus is in a normal, suspect, or pathological state?',
        whyMatters: 'Accurate interpretation of fetal heart rate monitoring during pregnancy and labor is crucial to prevent fetal distress and decide when emergency delivery (C-section) is necessary.'
    },
    {
        id: 17,
        name: 'Cardiology — Arrhythmia',
        description: 'Cardiac arrhythmia presence from ECG features',
        source: 'UCI Arrhythmia Dataset',
        target: 'arrhythmia (0/1)',
        clinicalQuestion: 'Do the ECG features indicate the presence of a cardiac arrhythmia?',
        whyMatters: 'Detecting arrhythmias, some of which closely mimic normal rhythms, is vital for preventing stroke and sudden cardiac death. AI can assist in analyzing subtle ECG patterns.'
    },
    {
        id: 18,
        name: 'Oncology — Cervical',
        description: 'Cervical cancer risk from demographic and behavioural data',
        source: 'UCI Cervical Cancer Dataset',
        target: 'Biopsy (0/1)',
        clinicalQuestion: 'Is this patient at high risk for cervical cancer based on demographic and behavioral factors?',
        whyMatters: 'Identifying high-risk women can help target screening resources (Pap smears, HPV testing) more effectively, ensuring those most likely to benefit receive early diagnostic attention.'
    },
    {
        id: 19,
        name: 'Thyroid / Endocrinology',
        description: 'Thyroid function classification (hypo / hyper / normal)',
        source: 'UCI Thyroid Disease Dataset',
        target: 'class (3 types)',
        clinicalQuestion: 'What is the functional status of the thyroid gland (hypothyroid, hyperthyroid, or normal) based on clinical data?',
        whyMatters: 'Thyroid disorders affect metabolism, energy, and mood. Correct classification ensures patients receive the right medication (hormone replacement vs. suppression) to restore balance.'
    },
    {
        id: 20,
        name: 'Pharmacy — Readmission',
        description: 'Hospital readmission risk for diabetic patients on medication',
        source: 'UCI Diabetes 130-US Hospitals Dataset',
        target: 'readmitted (<30 / >30 / NO)',
        clinicalQuestion: 'Is this diabetic patient likely to be readmitted to the hospital after discharge?',
        whyMatters: 'Diabetic patients have complex medication needs. Predicting readmission risk helps pharmacists target medication reconciliation and education efforts to prevent adverse drug events.'
    }
];
