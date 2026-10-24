import { Language } from '../types/football';

export const translations = {
  en: {
    // Brand & Header
    brandName: "RefVision AI",
    tagline: "See the Decision. Understand the Game.",
    hackathonTag: "Inside the Game: Hackathon 2026",
    nonAuthoritativeBadge: "AI Decision Support • Human Referee Has Final Authority",

    // Nav
    navHome: "Home",
    navMatchCenter: "Match Center",
    navReferee: "Referee Intelligence",
    navVideoAnalysis: "Video Analysis",
    navExplainer: "Decision Explainer",
    navFanArena: "Fan Arena",
    navAnalytics: "Tactical Analytics",
    navTransparency: "Data & Transparency",
    navReport: "Post-Match Report",
    navSettings: "System & AI",

    // Match Center Controls
    controlsTitle: "Match Simulation Control Engine",
    live: "LIVE",
    paused: "PAUSED",
    scheduled: "SCHEDULED",
    fullTime: "FULL TIME",
    btnStart: "Start Match",
    btnPause: "Pause",
    btnReset: "Reset (00:00)",
    btnStep15s: "Advance +15s",
    btnStep60s: "Advance +1 min",
    seekSliderLabel: "Timeline Scrub (Minute):",
    eventsFeedTitle: "Verified Match Event Feed",
    pitchViewTitle: "Live Tactical Pitch & Player Coordinates",
    homeTeam: "Apex Vanguard FC",
    awayTeam: "Crown Meridian FC",

    // Referee Intelligence
    refTitle: "Referee Intelligence Workspace",
    refSubtitle: "VAR Decision-Support & Multi-Camera Verification",
    incidentQueue: "Incident Inspection Queue",
    incidentDetails: "Incident Investigation Panel",
    btnCompareAngles: "Compare Available Angles",
    btnOpenIncident: "Inspect Incident",
    btnRecordDecision: "Record Official Decision",
    btnPublishExplainer: "Generate Public Explainer",
    recommendedAngle: "Recommended Angle",
    collinearView: "Collinear Alignment",
    confidenceMetric: "System Confidence",
    uncertaintyNotice: "Evidence Uncertainty & Disclaimers",
    refereeDecisionFormTitle: "Record Human Referee Decision",
    fieldRuling: "Official Ruling",
    fieldDisciplinary: "Disciplinary Action",
    fieldRestart: "Match Restart",
    fieldRationale: "Referee Rationale / Notes",
    submitDecisionBtn: "Submit & Save Official Ruling",

    // Decision Explainer
    explainerTitle: "Why Was This Decision Made?",
    explainerSubtitle: "Transparent, Evidence-Backed Explanations for Fans & Broadcasters",
    modeFan: "Fan Mode",
    modeAnalyst: "Analyst Mode",
    modeBroadcast: "Broadcast Mode",
    modeFanDesc: "Clear, simple explanations without complex officiating jargon.",
    modeAnalystDesc: "Detailed metric coordinates, spatial homography, and IFAB rule citations.",
    modeBroadcastDesc: "Concise summary bullets designed for on-screen TV broadcast lower-thirds.",
    lawsReferenced: "Applicable IFAB Laws of the Game",
    missingEvidenceTitle: "Known Limitations & Missing Telemetry",
    noIncidentSelected: "Please select an incident to review the explanation.",

    // Fan Arena
    fanTitle: "Fan Arena & Prediction Games",
    fanSubtitle: "Real-Time Event Predictions • Non-Monetary Rewards • Verified Outcomes",
    yourProfile: "Fan Profile & Points",
    leaderboard: "Live Leaderboard",
    badgesTitle: "Achievement Badges",
    openPredictions: "Open Prediction Challenges",
    resolvedPredictions: "Resolved Outcomes",
    btnSubmitPrediction: "Lock In Prediction",
    lockedStatus: "Prediction Locked",
    wonStatus: "Won (+{pts} pts)",
    lostStatus: "Unsuccessful",
    ruleNotice: "Rules: All games resolve strictly against the official match event stream. Duplicate entries are blocked.",

    // Analytics
    analyticsTitle: "Tactical Momentum & Advanced Metrics",
    analyticsSubtitle: "Rolling 5-minute momentum curve, possession share, and turning points",
    momentumChartTitle: "Tactical Momentum Flow (-100 to +100)",
    possessionShare: "Possession Share",
    expectedGoals: "Expected Goals (xG)",
    shotsComparison: "Total Shots (On Target)",
    turningPointsTitle: "Match Turning Points",

    // Post Match Report
    reportTitle: "Official Match Summary & Decision Audit",
    reportSubtitle: "Chronological verification trail and key officiating timeline",
    auditLogTitle: "Public Decision Audit Trail",

    // Settings
    settingsTitle: "Architecture & Multi-Agent Telemetry",
    settingsSubtitle: "Microsoft Agent Framework, Foundry Provider & Zero-Cost Status",
    switchLanguage: "Language / اللغة",
    executeMultiAgentBtn: "Trigger 7-Agent Evaluation Pipeline",
    supervisorGateTitle: "Supervisor & Quality Gate Status",
    agentOutputsTitle: "Agent Execution Reports (7 Specialized Agents)"
  },
  ar: {
    // Brand & Header
    brandName: "ريف فيجن ريفيري AI",
    tagline: "شاهد القرار. افهم اللعبة.",
    hackathonTag: "هاكاثون مايكروسوفت والدوري الإنجليزي 2026",
    nonAuthoritativeBadge: "دعم تحكيمي ذكي • الحكم البشري هو صاحب القرار النهائي",

    // Nav
    navHome: "الرئيسية",
    navMatchCenter: "مركز المباراة",
    navReferee: "غرفة التحكيم الذكية",
    navVideoAnalysis: "تحليل الفيديو",
    navExplainer: "مفسر القرارات",
    navFanArena: "ساحة المشجعين",
    navAnalytics: "التحليلات التكتيكية",
    navTransparency: "البيانات والشفافية",
    navReport: "تقرير ما بعد المباراة",
    navSettings: "النظام والذكاء الاصطناعي",

    // Match Center Controls
    controlsTitle: "محرك محاكاة مجريات المباراة",
    live: "مباشر",
    paused: "متوقف مؤقتاً",
    scheduled: "مجدولة",
    fullTime: "نهاية المباراة",
    btnStart: "بدء المباراة",
    btnPause: "إيقاف مؤقت",
    btnReset: "إعادة ضبط (00:00)",
    btnStep15s: "تقدم +15 ثانية",
    btnStep60s: "تقدم +دقيقة",
    seekSliderLabel: "التنقل الزمني (الدقيقة):",
    eventsFeedTitle: "سجل أحداث المباراة المؤكدة",
    pitchViewTitle: "الملعب التكتيكي المباشر وإحداثيات اللاعبين",
    homeTeam: "أبيكس فانغارد",
    awayTeam: "كراون ميريديان",

    // Referee Intelligence
    refTitle: "مساحة عمل التحكيم وتقنية الفيديو (VAR)",
    refSubtitle: "دعم اتخاذ القرار والتحقق متعدد الزوايا",
    incidentQueue: "قائمة الحالات قيد المراجعة",
    incidentDetails: "لوحة الفحص والتدقيق التفصيلي",
    btnCompareAngles: "مقارنة الزوايا المتاحة",
    btnOpenIncident: "فحص الحالة",
    btnRecordDecision: "تسجيل قرار الحكم الرسمي",
    btnPublishExplainer: "توليد الشرح العلني للجمهور",
    recommendedAngle: "الزاوية الموصى بها",
    collinearView: "محاذاة مستقيمة",
    confidenceMetric: "موثوقية النظام",
    uncertaintyNotice: "حدود اليقين والملاحظات القانونية",
    refereeDecisionFormTitle: "تسجيل القرار الرسمي للحكم البشري",
    fieldRuling: "القرار الرسمي",
    fieldDisciplinary: "الإجراء التأديبي",
    fieldRestart: "استئناف اللعب",
    fieldRationale: "حيثيات وأسباب القرار",
    submitDecisionBtn: "حفظ واعتماد القرار الرسمي",

    // Decision Explainer
    explainerTitle: "لماذا تم اتخاذ هذا القرار؟",
    explainerSubtitle: "شروحات شفافة ومدعومة بالأدلة للجماهير والمحللين ومخرجي البث",
    modeFan: "وضع المشجع",
    modeAnalyst: "وضع المحلل",
    modeBroadcast: "وضع البث التلفزيوني",
    modeFanDesc: "شروحات مبسطة ومباشرة بلغة واضحة دون تعقيدات المصطلحات التحكيمية.",
    modeAnalystDesc: "إحداثيات مكانية دقيقة، استنتاجات هندسية ومراجع لقوانين الإيفاب.",
    modeBroadcastDesc: "ملخصات سريعة ونقاط مكثفة مخصصة لشاشات البث التلفزيوني المباشر.",
    lawsReferenced: "مواد قانون كرة القدم المطبقة (IFAB)",
    missingEvidenceTitle: "البيانات المفقودة وحدود التقييم الفني",
    noIncidentSelected: "يرجى تحديد حالة تحكيمية لعرض تفاصيل الشرح.",

    // Fan Arena
    fanTitle: "ساحة المشجعين وألعاب التوقعات",
    fanSubtitle: "توقعات حية • مكافآت معنوية • نتائج موثقة بأحداث المباراة",
    yourProfile: "ملف المشجع والنقاط",
    leaderboard: "لوحة المتصدرين المباشرة",
    badgesTitle: "شارات الإنجاز",
    openPredictions: "تحديات التوقع المتاحة",
    resolvedPredictions: "النتائج المكتملة",
    btnSubmitPrediction: "تثبيت التوقع",
    lockedStatus: "التوقع مغلق",
    wonStatus: "توقع رابح (+{pts} نقطة)",
    lostStatus: "توقع غير موفق",
    ruleNotice: "القواعد: تُحسم النتائج بدقة عبر تدفق أحداث المباراة وتُمنع المشاركات المكررة.",

    // Analytics
    analyticsTitle: "الزخم التكتيكي والمؤشرات المتقدمة",
    analyticsSubtitle: "منحنى الزخم لكل 5 دقائق، نسب الاستحواذ ونقاط التحول الحاسمة",
    momentumChartTitle: "مؤشر تدفق الزخم التكتيكي (-100 إلى +100)",
    possessionShare: "نسبة الاستحواذ",
    expectedGoals: "الأهداف المتوقعة (xG)",
    shotsComparison: "إجمالي التسديدات (على المرمى)",
    turningPointsTitle: "نقاط التحول في المباراة",

    // Post Match Report
    reportTitle: "الملخص الرسمي وسجل التدقيق التحكيمي",
    reportSubtitle: "سجل التحقق الزمني ومسار التدقيق الكامل لقرارات الـ VAR",
    auditLogTitle: "سجل التدقيق العام لقرارات المباراة",

    // Settings
    settingsTitle: "الهندسة وتتبع الوكلاء متعددي المهام",
    settingsSubtitle: "أطر عمل مايكروسوفت وحالة التشغيل المحلي بدون تكلفة",
    switchLanguage: "Language / اللغة",
    executeMultiAgentBtn: "تشغيل دورة تقييم الوكلاء السبعة",
    supervisorGateTitle: "حالة المشرف وبوابة فحص الجودة",
    agentOutputsTitle: "تقارير تشغيل الوكلاء السبعة المتخصصين"
  }
};
