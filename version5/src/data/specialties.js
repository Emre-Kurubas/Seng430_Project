export const specialties = [
    {
        id: 1,
        name: 'Cardiology',
        description: '30-day readmission risk after heart failure discharge',
        source: 'Heart Failure Clinical Records',
        target: 'DEATH_EVENT (binary)',
        clinicalQuestion: 'Will this patient be readmitted to hospital within 30 days of discharge following a heart failure episode?',
        whyMatters: '30% of heart failure patients are readmitted within 30 days. Each readmission costs approximately €15,000. Early identification allows nurses to arrange discharge follow-up calls and medication checks.',
        icon: 'HeartPulse',
        theme: {
            primary: '#F43F5E', // rose-500
            secondary: '#F97316', // orange-500
            bg1: 'bg-rose-500/10',
            bg2: 'bg-orange-500/8',
            gradientFrom: 'from-rose-500',
            gradientTo: 'to-orange-500',
            text: 'text-rose-500',
            border: 'border-rose-500/30'
        },
        topFeaturesClinical: [
            { feature: 'Ejection Fraction', justification: 'Low ejection fraction (below 40%) is a primary indicator of heart failure severity and predicts poor post-discharge outcomes.' },
            { feature: 'Serum Creatinine', justification: 'Elevated creatinine reflects cardio-renal syndrome, where heart failure leads to kidney dysfunction, a major readmission driver.' },
            { feature: 'Age', justification: 'Elderly patients have higher physiological fragility and more complex medication regimens, significantly increasing 30-day risk.' }
        ]
    },
    {
        id: 2,
        name: 'Radiology',
        description: 'Normal vs. pneumonia from clinical features',
        source: 'NIH Chest X-Ray metadata',
        target: 'Finding Label (binary/multi)',
        clinicalQuestion: 'Is there evidence of pneumonia present in the clinical features derived from the chest X-ray?',
        whyMatters: 'Early detection of pneumonia can prevent severe complications and reduce the spread of infection. Automated screening can help prioritize urgent cases for radiologists.',
        icon: 'Webcam',
        theme: {
            primary: '#0EA5E9', // sky-500
            secondary: '#3B82F6', // blue-500
            bg1: 'bg-sky-500/10',
            bg2: 'bg-blue-500/8',
            gradientFrom: 'from-sky-500',
            gradientTo: 'to-blue-500',
            text: 'text-sky-500',
            border: 'border-sky-500/30'
        },
        topFeaturesClinical: [
            { feature: 'Opacity Level', justification: 'Increased focal opacity on imaging is the hallmark of alveolar consolidation in bacterial pneumonia.' },
            { feature: 'Patient Position', justification: 'Positioning affects image quality; supine films often hide subtle infiltrates compared to upright PA views.' },
            { feature: 'Hilar Prominence', justification: 'Prominent hila often indicate lymphatic response or pulmonary congestion associated with infectious processes.' }
        ]
    },
    {
        id: 3,
        name: 'Nephrology',
        description: 'Chronic kidney disease stage from routine lab values',
        source: 'UCI CKD Dataset (400 patients)',
        target: 'classification (CKD / not CKD)',
        clinicalQuestion: 'Does this patient exhibit clinical indicators consistent with Chronic Kidney Disease based on routine lab values?',
        whyMatters: 'Chronic Kidney Disease (CKD) often progresses silently. Early identification from routine blood tests allows for intervention to slow progression and prevent kidney failure.',
        icon: 'Droplets',
        theme: {
            primary: '#14B8A6', // teal-500
            secondary: '#06B6D4', // cyan-500
            bg1: 'bg-teal-500/10',
            bg2: 'bg-cyan-500/8',
            gradientFrom: 'from-teal-500',
            gradientTo: 'to-cyan-500',
            text: 'text-teal-500',
            border: 'border-teal-500/30'
        },
        topFeaturesClinical: [
            { feature: 'eGFR', justification: 'The Estimated Glomerular Filtration Rate is the gold standard for quantifying renal filtration capacity and staging CKD.' },
            { feature: 'Serum Creatinine', justification: 'As a metabolic byproduct filtered by kidneys, its accumulation in blood is a direct sign of reduced clearance.' },
            { feature: 'Haemoglobin', justification: 'Renal erythropoietin production declines in CKD, making anaemia a key secondary clinical indicator of disease stage.' }
        ]
    },
    {
        id: 4,
        name: 'Oncology — Breast',
        description: 'Malignancy of a breast biopsy from cell measurements',
        source: 'Wisconsin Breast Cancer Dataset',
        target: 'diagnosis (M/B)',
        clinicalQuestion: 'Is the breast mass benign or malignant based on cell nuclei measurements from a fine needle aspirate?',
        whyMatters: 'Accurate diagnosis of breast masses determines the course of treatment. Reducing false positives avoids unnecessary anxiety and biopsies, while catching malignancies early saves lives.',
        icon: 'Activity',
        theme: {
            primary: '#EC4899', // pink-500
            secondary: '#D946EF', // fuchsia-500
            bg1: 'bg-pink-500/10',
            bg2: 'bg-fuchsia-500/8',
            gradientFrom: 'from-pink-500',
            gradientTo: 'to-fuchsia-500',
            text: 'text-pink-500',
            border: 'border-pink-500/30'
        },
        topFeaturesClinical: [
            { feature: 'Concave Points', justification: 'The frequency of concavities in cell nuclei suggests irregular growth patterns typical of malignant transformations.' },
            { feature: 'Area Mean', justification: 'Larger average nuclear area is a well-recognised histological marker for rapid cell division in cancerous tissue.' },
            { feature: 'Radius Worst', justification: 'Extreme nuclear size (worst radius) indicates significant cellular atypia, a core feature of high-grade malignancy.' }
        ]
    },
    {
        id: 5,
        name: 'Neurology — Parkinson\'s',
        description: 'Parkinson\'s disease from voice biomarkers',
        source: 'UCI Parkinson\'s Dataset',
        target: 'status (0/1)',
        clinicalQuestion: 'Do the voice biomarkers indicate the presence of Parkinson\'s disease?',
        whyMatters: 'Voice analysis offers a non-invasive, accessible method for early screening of Parkinson\'s disease, potentially identifying patients before severe motor symptoms appear.',
        icon: 'BrainCircuit',
        theme: {
            primary: '#8B5CF6', // violet-500
            secondary: '#A855F7', // purple-500
            bg1: 'bg-violet-500/10',
            bg2: 'bg-purple-500/8',
            gradientFrom: 'from-violet-500',
            gradientTo: 'to-purple-500',
            text: 'text-violet-500',
            border: 'border-violet-500/30'
        },
        topFeaturesClinical: [
            { feature: 'Spread Ratio', justification: 'Changes in fundamental frequency spread reflect loss of motor control over laryngeal muscles in early Parkinsonism.' },
            { feature: 'Harmonicity (HNR)', justification: 'A lower harmonics-to-noise ratio indicates "breathiness" and vocal tremor, common clinical signs of dysarthria.' },
            { feature: 'Shimmer', justification: 'Variations in vocal amplitude (shimmer) quantify the vocal instability produced by basal ganglia dysfunction.' }
        ]
    },
    {
        id: 6,
        name: 'Endocrinology — Diabetes',
        description: 'Diabetes onset within 5 years from metabolic markers',
        source: 'Pima Indians Diabetes Dataset',
        target: 'Outcome (0/1)',
        clinicalQuestion: 'Is this patient likely to develop diabetes within the next 5 years based on current metabolic markers?',
        whyMatters: 'Predicting diabetes onset allows for lifestyle interventions and monitoring that can prevent or delay the disease, significantly improving long-term health outcomes.',
        icon: 'CandyOff',
        theme: {
            primary: '#EAB308', // yellow-500
            secondary: '#F59E0B', // amber-500
            bg1: 'bg-yellow-500/10',
            bg2: 'bg-amber-500/8',
            gradientFrom: 'from-yellow-500',
            gradientTo: 'to-amber-500',
            text: 'text-yellow-600',
            border: 'border-yellow-500/30'
        },
        topFeaturesClinical: [
            { feature: 'Glucose Level', justification: 'Elevated fasting glucose is the primary clinical indicator of insulin resistance and pre-diabetic metabolic states.' },
            { feature: 'BMI', justification: 'High Body Mass Index is strongly associated with chronic inflammation and reduced insulin sensitivity in peripheral tissues.' },
            { feature: 'Age', justification: 'The risk of Type 2 Diabetes increases with age due to progressive decline in beta-cell function and physical activity.' }
        ]
    },
    {
        id: 7,
        name: 'Hepatology — Liver',
        description: 'Liver disease from blood test results',
        source: 'Indian Liver Patient Dataset',
        target: 'Dataset (liver disease y/n)',
        clinicalQuestion: 'Do the patient\'s blood test results indicate the presence of liver disease?',
        whyMatters: 'Liver disease can be asymptomatic in early stages. Screening via routine blood tests can facilitate early diagnosis and treatment, preventing irreversible liver damage.',
        icon: 'Stethoscope',
        theme: {
            primary: '#84CC16', // lime-500
            secondary: '#22C55E', // green-500
            bg1: 'bg-lime-500/10',
            bg2: 'bg-green-500/8',
            gradientFrom: 'from-lime-500',
            gradientTo: 'to-green-500',
            text: 'text-lime-600',
            border: 'border-lime-500/30'
        },
        topFeaturesClinical: [
            { feature: 'Alkaline Phosphatase', justification: 'Elevated ALP levels often suggest bile duct obstruction or active liver tissue regeneration/damage.' },
            { feature: 'Albumin', justification: 'Low albumin synthesis is a hallmark of chronic liver failure, as the liver is the sole producer of this protein.' },
            { feature: 'Total Bilirubin', justification: 'Built-up bilirubin indicates impaired hepatic clearance or biliary flow, leading to visible clinical jaundice.' }
        ]
    },
    {
        id: 8,
        name: 'Cardiology — Stroke',
        description: 'Stroke risk from demographics and comorbidities',
        source: 'Kaggle Stroke Prediction Dataset',
        target: 'stroke (0/1)',
        clinicalQuestion: 'Is this patient at high risk of experiencing a stroke based on their demographic and health profile?',
        whyMatters: 'Stroke is a leading cause of disability and death. Identifying high-risk individuals enables targeted prevention strategies like blood pressure management and lifestyle changes.',
        icon: 'Zap',
        theme: {
            primary: '#EF4444', // red-500
            secondary: '#DC2626', // red-600
            bg1: 'bg-red-500/10',
            bg2: 'bg-red-600/8',
            gradientFrom: 'from-red-500',
            gradientTo: 'to-red-600',
            text: 'text-red-500',
            border: 'border-red-500/30'
        },
        topFeaturesClinical: [
            { feature: 'Age', justification: 'Age is the strongest non-modifiable risk factor for stroke due to cumulative vascular wear and plaque formation.' },
            { feature: 'Hypertension', justification: 'High blood pressure is the leading cause of both ischaemic and haemorrhagic strokes via arterial wall damage.' },
            { feature: 'Avg Glucose', justification: 'Chronic hyperglycaemia promotes atherosclerosis and increases the likelihood of large-vessel occlusive events.' }
        ]
    },
    {
        id: 9,
        name: 'Mental Health',
        description: 'Depression risk prediction from student lifestyle and academic factors',
        source: 'Kaggle Student Depression Dataset',
        target: 'Depression (0/1)',
        clinicalQuestion: 'Is this student at risk of depression based on their academic, lifestyle, and demographic factors?',
        whyMatters: 'Early identification of depression risk in students allows for timely counselling interventions, academic support adjustments, and mental health resource allocation — potentially preventing crises.',
        icon: 'Brain',
        theme: {
            primary: '#6366F1', // indigo-500
            secondary: '#4F46E5', // indigo-600
            bg1: 'bg-indigo-500/10',
            bg2: 'bg-indigo-600/8',
            gradientFrom: 'from-indigo-500',
            gradientTo: 'to-indigo-600',
            text: 'text-indigo-500',
            border: 'border-indigo-500/30'
        },
        topFeaturesClinical: [
            { feature: 'Academic Pressure', justification: 'High perceived pressure correlates with anxiety and burnout, major precursors to depressive episodes in students.' },
            { feature: 'Sleep Duration', justification: 'Chronic sleep deprivation disrupts emotional regulation and neuroplasticity, significantly increasing mood disorder risk.' },
            { feature: 'Financial Stress', justification: 'Economic instability acts as a persistent environmental stressor that compromises mental well-being and coping capacity.' }
        ]
    },
    {
        id: 10,
        name: 'Pulmonology — COPD',
        description: 'COPD exacerbation risk from spirometry data',
        source: 'Kaggle / PhysioNet COPD Dataset',
        target: 'exacerbation (y/n)',
        clinicalQuestion: 'Is this COPD patient at risk of an acute exacerbation based on recent spirometry data?',
        whyMatters: 'COPD exacerbations are dangerous and costly. Predicting them allows for preemptive medication adjustments, potentially avoiding hospitalization and lung function decline.',
        icon: 'Wind',
        theme: {
            primary: '#64748B', // slate-500
            secondary: '#94A3B8', // slate-400
            bg1: 'bg-slate-500/10',
            bg2: 'bg-slate-400/8',
            gradientFrom: 'from-slate-500',
            gradientTo: 'to-slate-400',
            text: 'text-slate-500',
            border: 'border-slate-500/30'
        },
        topFeaturesClinical: [
            { feature: 'FEV1', justification: 'Forced Expiratory Volume in 1 second measures airway obstruction; lower values predict higher risk of lung failure.' },
            { feature: 'Smoking History', justification: 'Continued tobacco exposure drives chronic inflammation, causing the structural lung damage that leads to exacerbations.' },
            { feature: 'Oxygen Saturation', justification: 'Resting hypoxaemia is a critical indicator of severely compromised gas exchange and impending respiratory distress.' }
        ]
    },
    {
        id: 11,
        name: 'Haematology — Anaemia',
        description: 'Type of anaemia from full blood count results',
        source: 'Kaggle Anaemia Classification Dataset',
        target: 'anemia_type (multi-class)',
        clinicalQuestion: 'Which type of anaemia is indicated by the patient\'s complete blood count parameters?',
        whyMatters: 'Different types of anaemia require vastly different treatments (e.g., iron supplements vs. B12 vs. bone marrow investigation). Correct classification ensures appropriate therapy.',
        icon: 'TestTube',
        theme: {
            primary: '#9F1239', // rose-800
            secondary: '#E11D48', // rose-600
            bg1: 'bg-rose-800/10',
            bg2: 'bg-rose-600/8',
            gradientFrom: 'from-rose-800',
            gradientTo: 'to-rose-600',
            text: 'text-rose-700',
            border: 'border-rose-700/30'
        },
        topFeaturesClinical: [
            { feature: 'MCV', justification: 'Mean Corpuscular Volume distinguishes microcytic (iron deficiency) from macrocytic (B12/folate deficiency) anaemias.' },
            { feature: 'Haemoglobin', justification: 'The total amount of oxygen-carrying protein directly quantifies the severity of the patient\'s anaemic state.' },
            { feature: 'Red Cell Width (RDW)', justification: 'High RDW indicates variation in cell sizes, suggesting a nutrient deficiency or recent onset of anaemia.' }
        ]
    },
    {
        id: 12,
        name: 'Dermatology',
        description: 'Benign vs. malignant skin lesion from dermoscopy features',
        source: 'HAM10000 metadata (Kaggle)',
        target: 'dx_type (benign / malignant)',
        clinicalQuestion: 'Is the skin lesion benign or malignant based on its dermoscopic features?',
        whyMatters: 'Early detection of melanoma and other skin cancers significantly improves survival rates. AI support can help general practitioners decide which lesions require urgent specialist referral.',
        icon: 'ScanFace',
        theme: {
            primary: '#D97706', // amber-600
            secondary: '#B45309', // amber-700
            bg1: 'bg-amber-600/10',
            bg2: 'bg-amber-700/8',
            gradientFrom: 'from-amber-600',
            gradientTo: 'to-amber-700',
            text: 'text-amber-600',
            border: 'border-amber-600/30'
        },
        topFeaturesClinical: [
            { feature: 'Pigment Network', justification: 'Atypical or thickened pigment networks are key dermatoscopic indicators of dysplastic or malignant melanocytic growth.' },
            { feature: 'Asymmetry', justification: 'Lack of symmetry in colour and shape suggests non-uniform cell proliferation, a hallmark of malignant lesions.' },
            { feature: 'Border Irregularity', justification: 'Poorly defined or "scalloped" borders reflect infiltrative growth patterns common in basal cell carcinomas.' }
        ]
    },
    {
        id: 13,
        name: 'Ophthalmology',
        description: 'Diabetic retinopathy severity from clinical findings',
        source: 'UCI / Kaggle Retinopathy Dataset',
        target: 'severity grade',
        clinicalQuestion: 'What is the severity grade of diabetic retinopathy based on the clinical findings?',
        whyMatters: 'Diabetic retinopathy is a leading cause of blindness. Regular screening and accurate grading are essential for timely laser treatment or injections to preserve vision.',
        icon: 'Eye',
        theme: {
            primary: '#0D9488', // teal-600
            secondary: '#0F766E', // teal-700
            bg1: 'bg-teal-600/10',
            bg2: 'bg-teal-700/8',
            gradientFrom: 'from-teal-600',
            gradientTo: 'to-teal-700',
            text: 'text-teal-600',
            border: 'border-teal-600/30'
        },
        topFeaturesClinical: [
            { feature: 'Microaneurysms', justification: 'The number of tiny retinal vascular bulges (microaneurysms) is the earliest visible sign of diabetic retinopathy.' },
            { feature: 'Exudates', justification: 'Leakage of fats and proteins (hard exudates) onto the retina suggests chronic vascular leak and macular risk.' },
            { feature: 'Haemorrhages', justification: 'Retinal bleeds indicate advancing damage to the vascular walls, characteristic of proliferative retinopathy states.' }
        ]
    },
    {
        id: 14,
        name: 'Orthopaedics — Spine',
        description: 'Normal vs. disc herniation from biomechanical measures',
        source: 'UCI Vertebral Column Dataset',
        target: 'class (Normal / Abnormal)',
        clinicalQuestion: 'Do the biomechanical measurements of the spine indicate a disc herniation or other abnormality?',
        whyMatters: 'Objective biomechanical analysis can support radiological findings, helping to diagnose the cause of back pain and determine whether surgical or conservative management is appropriate.',
        icon: 'Bone',
        theme: {
            primary: '#65A30D', // lime-600
            secondary: '#4D7C0F', // lime-700
            bg1: 'bg-lime-600/10',
            bg2: 'bg-lime-700/8',
            gradientFrom: 'from-lime-600',
            gradientTo: 'to-lime-700',
            text: 'text-lime-600',
            border: 'border-lime-600/30'
        },
        topFeaturesClinical: [
            { feature: 'Pelvic Incidence', justification: 'This anatomic parameter determines spinal curvature; abnormal values are strongly linked to spondylolisthesis risk.' },
            { feature: 'Lumbar Lordosis', justification: 'The angle of the lower back curve reflects compensatory changes due to disc degenerations or vertebral shifts.' },
            { feature: 'Sacral Slope', justification: 'A key biomechanical marker for lumbar stability; deviations correlate with mechanical stress in the lower spine.' }
        ]
    },
    {
        id: 15,
        name: 'ICU / Sepsis',
        description: 'Sepsis onset from vital signs and lab results',
        source: 'PhysioNet / Kaggle Sepsis Dataset',
        target: 'SepsisLabel (0/1)',
        clinicalQuestion: 'Is the patient developing sepsis based on trends in their vital signs and laboratory results?',
        whyMatters: 'Sepsis is a medical emergency where every hour counts. Early prediction before obvious clinical shock allows for rapid antibiotic administration, drastically reducing mortality.',
        icon: 'ActivitySquare',
        theme: {
            primary: '#DC2626', // red-600
            secondary: '#991B1B', // red-800
            bg1: 'bg-red-600/10',
            bg2: 'bg-red-800/8',
            gradientFrom: 'from-red-600',
            gradientTo: 'to-red-800',
            text: 'text-red-600',
            border: 'border-red-600/30'
        },
        topFeaturesClinical: [
            { feature: 'Lactate Level', justification: 'Elevated blood lactate is a critical clinical marker of tissue hypoperfusion and anaerobic metabolism in sepsis.' },
            { feature: 'Heart Rate', justification: 'Persistent tachycardia is often the earliest physiological response to systemic infection and impending circulatory shock.' },
            { feature: 'Temperature', justification: 'Both fever (hyperthermia) and low temperature (hypothermia) are core criteria for systemic inflammatory response syndrome (SIRS).' }
        ]
    },
    {
        id: 16,
        name: 'Obstetrics — Fetal Health',
        description: 'Fetal cardiotocography classification (normal / suspect / pathological)',
        source: 'UCI Fetal Health Dataset',
        target: 'fetal_health (1/2/3)',
        clinicalQuestion: 'Does the cardiotocogram (CTG) indicate that the fetus is in a normal, suspect, or pathological state?',
        whyMatters: 'Accurate interpretation of fetal heart rate monitoring during pregnancy and labor is crucial to prevent fetal distress and decide when emergency delivery (C-section) is necessary.',
        icon: 'Baby',
        theme: {
            primary: '#F472B6', // pink-400
            secondary: '#FB7185', // rose-400
            bg1: 'bg-pink-400/10',
            bg2: 'bg-rose-400/8',
            gradientFrom: 'from-pink-400',
            gradientTo: 'to-rose-400',
            text: 'text-pink-500',
            border: 'border-pink-500/30'
        },
        topFeaturesClinical: [
            { feature: 'Accelerations', justification: 'The presence of heart rate accelerations is a reassuring clinical sign of fetal well-being and oxygenation.' },
            { feature: 'Decelerations', justification: 'Prolonged or late decelerations suggest fetal distress maybe due to cord compression or placental insufficiency.' },
            { feature: 'Baseline Variability', justification: 'Reduced variability reflects potential CNS depression or fetal hypoxia, requiring immediate clinical review.' }
        ]
    },
    {
        id: 17,
        name: 'Cardiology — Arrhythmia',
        description: 'Cardiac arrhythmia presence from ECG features',
        source: 'UCI Arrhythmia Dataset',
        target: 'arrhythmia (0/1)',
        clinicalQuestion: 'Do the ECG features indicate the presence of a cardiac arrhythmia?',
        whyMatters: 'Detecting arrhythmias, some of which closely mimic normal rhythms, is vital for preventing stroke and sudden cardiac death. AI can assist in analyzing subtle ECG patterns.',
        icon: 'HeartPulse',
        theme: {
            primary: '#F59E0B', // amber-500
            secondary: '#EF4444', // red-500
            bg1: 'bg-amber-500/10',
            bg2: 'bg-red-500/8',
            gradientFrom: 'from-amber-500',
            gradientTo: 'to-red-500',
            text: 'text-amber-500',
            border: 'border-amber-500/30'
        },
        topFeaturesClinical: [
            { feature: 'QRS Duration', justification: 'Prolonged QRS complexes indicate intraventricular conduction delays, core features of many clinical arrhythmias.' },
            { feature: 'QT Interval', justification: 'Abnormal QT lengths are high-risk markers for Torsades de Pointes and other life-threatening ventricular tachycardias.' },
            { feature: 'P-Wave Presence', justification: 'Absence of visible P-waves is the diagnostic hallmark for atrial fibrillation in standard 12-lead ECG analysis.' }
        ]
    },
    {
        id: 18,
        name: 'Oncology — Cervical',
        description: 'Cervical cancer risk from demographic and behavioural data',
        source: 'UCI Cervical Cancer Dataset',
        target: 'Biopsy (0/1)',
        clinicalQuestion: 'Is this patient at high risk for cervical cancer based on demographic and behavioral factors?',
        whyMatters: 'Identifying high-risk women can help target screening resources (Pap smears, HPV testing) more effectively, ensuring those most likely to benefit receive early diagnostic attention.',
        icon: 'Microscope',
        theme: {
            primary: '#C026D3', // fuchsia-600
            secondary: '#9333EA', // purple-600
            bg1: 'bg-fuchsia-600/10',
            bg2: 'bg-purple-600/8',
            gradientFrom: 'from-fuchsia-600',
            gradientTo: 'to-purple-600',
            text: 'text-fuchsia-600',
            border: 'border-fuchsia-600/30'
        },
        topFeaturesClinical: [
            { feature: 'HPV Status', justification: 'Persistent Human Papillomavirus infection is the single most significant clinical risk factor for cervical malignancy.' },
            { feature: 'Age', justification: 'Cancer risk changes with age, reflecting both cumulative exposure to risk factors and the physiological history of screening.' },
            { feature: 'STDs History', justification: 'A history of sexually transmitted diseases often correlates with increased susceptibility to cervical oncogenic viruses.' }
        ]
    },
    {
        id: 19,
        name: 'Thyroid / Endocrinology',
        description: 'Thyroid function classification (hypo / hyper / normal)',
        source: 'UCI Thyroid Disease Dataset',
        target: 'class (3 types)',
        clinicalQuestion: 'What is the functional status of the thyroid gland (hypothyroid, hyperthyroid, or normal) based on clinical data?',
        whyMatters: 'Thyroid disorders affect metabolism, energy, and mood. Correct classification ensures patients receive the right medication (hormone replacement vs. suppression) to restore balance.',
        icon: 'Activity',
        theme: {
            primary: '#2DD4BF', // teal-400
            secondary: '#34D399', // emerald-400
            bg1: 'bg-teal-400/10',
            bg2: 'bg-emerald-400/8',
            gradientFrom: 'from-teal-400',
            gradientTo: 'to-emerald-400',
            text: 'text-emerald-500',
            border: 'border-emerald-500/30'
        },
        topFeaturesClinical: [
            { feature: 'TSH Level', justification: 'Thyroid Stimulating Hormone is the primary marker; high levels typically indicate hypothyroidism while low suggest hyperthyroidism.' },
            { feature: 'FT4 Index', justification: 'Free Thyroxine levels directly measure the gland\'s hormonal output, confirming metabolic over/under-activity.' },
            { feature: 'Pregnant Status', justification: 'Pregnancy-related hormonal shifts drastically change thyroid demand and normal diagnostic reference ranges.' }
        ]
    },
    {
        id: 20,
        name: 'Pharmacy — Readmission',
        description: 'Hospital readmission risk for diabetic patients on medication',
        source: 'UCI Diabetes 130-US Hospitals Dataset',
        target: 'readmitted (<30 / >30 / NO)',
        clinicalQuestion: 'Is this diabetic patient likely to be readmitted to the hospital after discharge?',
        whyMatters: 'Diabetic patients have complex medication needs. Predicting readmission risk helps pharmacists target medication reconciliation and education efforts to prevent adverse drug events.',
        icon: 'Pill',
        theme: {
            primary: '#3B82F6', // blue-500
            secondary: '#8B5CF6', // violet-500
            bg1: 'bg-blue-500/10',
            bg2: 'bg-violet-500/8',
            gradientFrom: 'from-blue-500',
            gradientTo: 'to-violet-500',
            text: 'text-blue-500',
            border: 'border-blue-500/30'
        },
        topFeaturesClinical: [
            { feature: 'Num Meds', justification: 'Polypharmacy (many medications) significantly increases the risk of drug-drug interactions and medication non-adherence.' },
            { feature: 'HbA1c Result', justification: 'Long-term glycemic control reflects the patient\'s underlying metabolic stability and compliance with diabetic therapy.' },
            { feature: 'Prior Diagnoses', justification: 'The number of pre-existing comorbidities indicates medical complexity and higher vulnerability to relapse post-discharge.' }
        ]
    }
];
