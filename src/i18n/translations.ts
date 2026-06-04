/**
 * Bilingual translations — English + Arabic
 * Arabic is written to feel native, cinematic, and psychologically sharp.
 * Not literal machine translation.
 */

export type Lang = 'en' | 'ar';
export type Dir  = 'ltr' | 'rtl';

export interface CaseFileEntry {
  id: string;
  industry: string;
  stage: string;
  year: string;
  failureMode: string;
  tags: string[];
  keyMistake: string;
  lessons: string[];
  outcome: string;
  redactedSection?: string;
}

export interface Question {
  id: string;
  chapter: string;
  prompt: string;
  sub?: string;
  type: 'scale' | 'choice';
  options?: { label: string; weight: number; tag?: string }[];
  scaleLabels?: [string, string];
  blindSpot?: string;
}

interface LangStrings {
  dir: Dir;
  fontBody: string;  // Tailwind class
  fontDisplay: string;

  nav: {
    home: string;
    caseFile: string;
    valley: string;
    session: string;
    langToggle: string; // "AR" or "EN"
    methodology: string;
    caseFiles: string;
  };

  home: {
    metaTitle: string;
    metaDesc: string;
    stripLeft: string;
    stripCenter: string;
    stripRight: string;
    tagline: string;
    heroLine1: string;
    heroLine2: string;
    heroLine3: string;
    heroLine4: string;
    heroLine5: string;
    heroPitch: string;
    ctaPrimary: string;
    ctaSecondary: string;
    scrollLabel: string;
    scrollSubject: string;
    manifestoLoop: string;
    thesisLabel: string;
    thesisQuote1: string;
    thesisQuote2: string;
    thesisPara1: string;
    thesisPara2: string;
    patternLabel: string;
    patternHeading1: string;
    patternHeading2: string;
    patternSub: string;
    patterns: { n: string; title: string; body: string }[];
    pullQuote1: string;
    pullQuote2: string;
    pullQuote3: string;
    fieldNote: string;
    stats: { k: string; v: string; i?: string }[];
    ctaLabel: string;
    ctaHeading1: string;
    ctaHeading2: string;
    ctaHeading3: string;
    ctaBody: string;
    ctaButton: string;
  };

  about: {
    metaTitle: string;
    metaDesc: string;
    eyebrow: string;
    heroLine1: string;
    heroLine2: string;
    heroLine3: string;
    heroLine4: string;
    heroBio: string;
    scrollLabel: string;
    chapters: { eyebrow: string; title: string; body: string }[];
    quoteOpen: string;
    quoteBody1: string;
    quoteBody2: string;
    quoteAttr: string;
    pillarsLabel: string;
    pillars: { n: string; k: string; v: string }[];
    closingBody: string;
    closingSub: string;
    ctaButton: string;
    caseSnippets: { id: string; sector: string; stage: string; pattern: string }[];
    caseSnippetsLabel: string;
  };

  valley: {
    metaTitle: string;
    metaDesc: string;
    eyebrow: string;
    heroHeading1: string;
    heroHeading2: string;
    heroSub: string;
    lore: {
      eyebrow: string;
      heading1: string;
      heading2: string;
      p1: string;
      p2: string;
      p3: string;
    };
    narrative: {
      eyebrow: string;
      intro: string;
      heading: string;
      p1: string;
      p2: string;
      p3: string;
      p4: string;
    };
    diagnosisCta: {
      intro: string;
      timeNote: string;
      privacyNote: string;
      button: string;
    };
    curve: {
      eyebrow: string;
      heading1: string;
      heading2: string;
      sub: string;
      stages: { label: string; danger?: boolean }[];
      milestones: string[];
      axisY: string;
      axisX: string;
      valleyLabel: string;
      captions: { t: string; b: string }[];
    };
    testimonialsEyebrow: string;
    testimonialsHeading: string;
  };

  contact: {
    metaTitle: string;
    metaDesc: string;
    eyebrow: string;
    heroHeading1: string;
    heroHeading2: string;
    heroSub: string;
    heroArabicSub: string;
    pillars: { k: string; v: string }[];
    formLabel: string;
    formHeading: string;
    fieldName: string;
    fieldNamePlaceholder: string;
    fieldEmail: string;
    fieldEmailPlaceholder: string;
    fieldCompany: string;
    fieldCompanyPlaceholder: string;
    fieldStage: string;
    fieldStageDefault: string;
    stages: { v: string; label: string }[];
    fieldContext: string;
    fieldContextPlaceholder: string;
    fieldContextHint: string;
    submitLabel: string;
    submittingLabel: string;
    submitDisclaimer: string;
    successHeading: string;
    successBody: string;
    closingQuote: string;
    sessionInfo: string;
    situationTagsLabel: string;
    situationTags: string[];
    successHeadingFull: string;
    successBodyFull: string;
  };

  assessment: {
    diagnosticLabel: string;
    introHeading1: string;
    introHeading2: string;
    introDesc: string;
    introBullets: string[];
    beginButton: string;

    leadLabel: string;
    leadHeading1: string;
    leadHeading2: string;
    fieldName: string;
    fieldEmail: string;
    fieldCompany: string;
    fieldStage: string;
    fieldStageDefault: string;
    stages: string[];
    fieldSector: string;
    fieldCountry: string;
    enterButton: string;
    confidentialNote: string;

    diagnosticProgress: string;
    backButton: string;
    pressHint: string;
    restartButton: string;
    descentLabel: string;
    emotionalStates: string[]; // 5: stable, exposed, slipping, panic, collapse

    analyzingLabel: string;
    analyzingHeading: string;

    errorLabel: string;
    retryButton: string;

    diagnosisLabel: string;
    shockEyebrow: string;
    verdicts: Record<string, { title: string; insight: string }>;
    consequences: Record<string, string>;
    recoveryPaths: Record<string, string>;
    riskLevelLabel: string;
    riskScoreLabel: string;
    blindSpotsLabel: string;
    blindSpotsSection: string;
    insightSection: string;
    consequencesSection: string;
    recoverySection: string;
    nextMoveSection: string;
    ctas: { title: string; desc: string }[];
    dynamicCtas: Record<'low' | 'medium' | 'high', { title: string; desc: string; intent: string; urgent?: boolean }[]>;
    continueLabel: string;
    restartDiagnosticLabel: string;

    questions: Question[];
  };

  testimonials: {
    defaultEyebrow: string;
    defaultHeading: string;
    verifiedLabel: string;
  };

  notFound: {
    metaTitle: string;
    metaDesc: string;
    heading: string;
    body: string;
    ctaButton: string;
  };

  footer: {
    pullQuote1: string;
    pullQuote2: string;
    pullCta: string;
    navLabel: string;
    navLinks: { label: string; path: string }[];
    directLabel: string;
    socialLabel: string;
    copyright: string;
  };

  caseFiles: {
    metaTitle: string;
    metaDesc: string;
    eyebrow: string;
    heading: string;
    subheading: string;
    filterLabel: string;
    filters: { id: string; label: string }[];
    allLabel: string;
    classificationBadge: string;
    redactedLabel: string;
    caseIdLabel: string;
    industryLabel: string;
    stageLabel: string;
    failureModeLabel: string;
    mistakeLabel: string;
    lessonsLabel: string;
    outcomeLabel: string;
    confidentialNote: string;
    cases: CaseFileEntry[];
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ENGLISH
// ─────────────────────────────────────────────────────────────────────────────

const en: LangStrings = {
  dir: 'ltr',
  fontBody: 'font-sans-ui',
  fontDisplay: 'font-serif-display',

  nav: {
    home: 'Home',
    caseFile: 'Case File',
    valley: 'Valley of Death',
    session: 'Session',
    langToggle: 'AR',
    methodology: 'Methodology',
    caseFiles: 'Case Files',
  },

  home: {
    metaTitle: 'خبير الفشل — Startup Failure Intelligence',
    metaDesc:
      'A forensic study of why startups die. No coaching. No clichés. Founder psychology, decision autopsies, and pattern intelligence from hundreds of post-mortems.',
    stripLeft: '',
    stripCenter: '',
    stripRight: '',
    tagline: 'Startup Failure Intelligence',
    heroLine1: "We don't teach",
    heroLine2: 'you how to',
    heroLine3: 'win.',
    heroLine4: 'We show you',
    heroLine5: 'why',
    heroPitch:
      'خبير الفشل — a forensic practice studying the psychology, decisions, and blind spots that kill companies long before the funding runs out.',
    ctaPrimary: 'Book a Risk Session',
    ctaSecondary: 'The Case File',
    scrollLabel: 'Scroll · انزل',
    scrollSubject: 'Subject: The Founder',
    manifestoLoop:
      'No fake gurus. · No motivational theater. · Only what the data refuses to soften. ·',
    thesisLabel: 'Thesis · الفرضية',
    thesisQuote1: 'The company didn\'t fail.',
    thesisQuote2: 'The founder stopped seeing.',
    thesisPara1:
      'Markets are blamed. Timing is blamed. Investors are blamed. But underneath almost every collapse is a founder running a quiet, private cognitive failure — months before anyone names it out loud.',
    thesisPara2:
      'خبير الفشل is a discipline built on the autopsies of hundreds of dead companies. We map the decisions, the denial, the distortions — and we name them before they repeat inside you.',
    patternLabel: 'Pattern Library · Excerpt',
    patternHeading1: 'The collapse always',
    patternHeading2: 'rhymes.',
    patternSub:
      'Four of twelve recurring patterns we trace inside founders we study. The full library is for private sessions.',
    patterns: [
      {
        n: '01',
        title: 'Founder Denial Loop',
        body: 'The story you tell investors becomes the story you tell yourself. Eighteen months later, the spreadsheet finally disagrees.',
      },
      {
        n: '02',
        title: 'Green Dashboard Collapse',
        body: 'Every metric is up and to the right while the company is already dying underneath. The signal was never in the dashboard.',
      },
      {
        n: '03',
        title: 'Co-founder Drift',
        body: 'You stopped having the hard conversation in month four. By month sixteen the company is paying for a silence neither of you owns.',
      },
      {
        n: '04',
        title: 'Premature Scaling',
        body: 'You hired ahead of clarity. The org chart is now defending a strategy nobody believes in but everyone is paid to execute.',
      },
    ],
    pullQuote1: 'By the time the numbers',
    pullQuote2: 'tell the truth,',
    pullQuote3: 'the company is already gone.',
    fieldNote: '',
    stats: [
      { k: '317', v: 'Post-mortems studied', i: 'An archive of 317 structured startup post-mortems, analyzed for decision patterns and failure triggers across 12 years.' },
      { k: '12',  v: 'Recurring failure patterns', i: 'Twelve behavioral patterns that appear in over 80% of documented collapses — long before the financials confirm it.' },
      { k: '6mo', v: 'Average warning window ignored', i: 'The average founder ignores the first clear warning signals for six months before the company enters crisis.' },
      { k: '01',  v: 'Honest conversation required', i: 'One honest conversation — with the right person, at the right moment — changes the trajectory more than any strategy document.' },
    ],
    ctaLabel:   'Intake Open · Limited Cases',
    ctaHeading1: 'Something already',
    ctaHeading2: 'feels off.',
    ctaHeading3: "Let's name it.",
    ctaBody:
      'One conversation. Private. Direct. No fake optimism. No startup clichés. Just the truth your team is too close to tell you.',
    ctaButton: 'Request the Session',
  },

  about: {
    metaTitle: 'About — خبير الفشل',
    metaDesc:
      'The founder behind خبير الفشل. A study of startup collapse, founder psychology, and the blind spots that kill companies long before they shut down.',
    eyebrow: 'Case File · 001',
    heroLine1: 'Some startups die',
    heroLine2: 'long before',
    heroLine3: 'they officially',
    heroLine4: 'shut down.',
    heroBio:
      'I\'m Mohamed Khalil. I study the death of companies — not to mourn them, but to understand the founder who didn\'t see it coming. Usually, that founder was me.',
    scrollLabel: 'Scroll · شاهد',
    chapters: [
      {
        eyebrow: 'I',
        title: 'The Collapse',
        body: 'I built something I believed in. Then I watched it die — slowly, quietly, while every dashboard still looked green. By the time the numbers told the truth, the company was already gone. The autopsy started long before the funeral.',
      },
      {
        eyebrow: 'II',
        title: 'The Realization',
        body: "Most startups don't fail because of the market. They fail because the founder stopped seeing clearly. I stopped seeing clearly. The blind spots were not in the spreadsheet — they were in me.",
      },
      {
        eyebrow: 'III',
        title: 'Birth of خبير الفشل',
        body: 'I went back to every collapse — mine, and hundreds of others. I read the post-mortems. I sat with the founders. I mapped the patterns nobody wanted to name. خبير الفشل is what came out of that obsession: a discipline, not a brand.',
      },
      {
        eyebrow: 'IV',
        title: 'The Work',
        body: 'I study the psychology of founders who broke. The cognitive distortions. The denial loops. The decisions that looked rational at the time and detonated eighteen months later. This is not coaching. This is forensic analysis of the human inside the company.',
      },
    ],
    quoteOpen: '"',
    quoteBody1: 'I am not here to motivate you.',
    quoteBody2: 'I am here to tell you what you refuse to see.',
    quoteAttr: '— Mohamed Khalil · مؤسس خبير الفشل',
    pillarsLabel: '',
    pillars: [
      {
        n: '01',
        k: 'No fake gurus',
        v: 'No motivational theater. No LinkedIn philosophy. The data is brutal enough on its own.',
      },
      {
        n: '02',
        k: 'Founder psychology',
        v: 'Every collapse has a human signature. We trace the decision back to the cognitive state that produced it.',
      },
      {
        n: '03',
        k: 'Pattern intelligence',
        v: 'Hundreds of post-mortems. Cross-referenced. The patterns repeat. We name them before they repeat in you.',
      },
    ],
    closingBody: 'If you\'ve read this far, something already feels off inside your company.',
    closingSub: 'Trust that feeling. Most founders meet me six months too late.',
    ctaButton: 'Request an Autopsy',
    caseSnippets: [
      { id: '#042', sector: 'Fintech', stage: 'Seed', pattern: 'Founder Misalignment · Cash Burn' },
      { id: '#117', sector: 'SaaS', stage: 'Series A', pattern: 'Green Dashboard Collapse · Leadership Isolation' },
    ],
    caseSnippetsLabel: 'From the case files',
  },

  valley: {
    metaTitle: 'Valley of Death — The Founder Test',
    metaDesc:
      'A psychological descent diagnostic for founders. No motivation. Just the truth about how close your company is to the edge.',
    eyebrow: 'The Founder Test',
    heroHeading1: 'Valley',
    heroHeading2: 'of Death.',
    heroSub:
      'No motivation. No coaching. Answer honestly — the only person you can lie to here is yourself.',
    lore: {
      eyebrow: 'Before you descend',
      heading1: 'Most founders never see',
      heading2: 'the valley until they are inside it.',
      p1: 'The Valley of Death is the silent window between burning the last of your conviction and earning the first dollar of real revenue. It is where the cash is shrinking, the team is reading your face, and the spreadsheet has stopped lying.',
      p2: 'Most companies do not die from the market. They die in the valley — because the founder kept performing certainty while the ground gave way underneath.',
      p3: 'This diagnostic was built from analyzing hundreds of startup failure post-mortems and the cognitive patterns founders show in the months before collapse. There is no right answer. There is only what you finally admit.',
    },
    narrative: {
      eyebrow: 'What is the Valley of Death?',
      intro: 'Investors and entrepreneurs coined "Valley of Death" to describe the gap between building a product and reaching sustainable revenue — the stage where most startups disappear.',
      heading: 'Most founders never see the valley until they are already inside it.',
      p1: 'The Valley of Death is the silent gap between burning the last ember of your conviction and the first dollar of real revenue. This is where cash is shrinking, the team is reading your face, and the spreadsheets have stopped lying.',
      p2: 'Companies rarely die from the market. They die inside the valley — because the founder kept performing certainty while the ground gave way beneath him.',
      p3: 'This diagnostic was built from analyzing hundreds of failure cases, and from the cognitive patterns founders display in the months before collapse.',
      p4: 'There is no right answer here.\nThere is only what you will finally admit.',
    },
    diagnosisCta: {
      intro: 'This is not a survey. It is a disciplined psychological diagnostic designed to extract what most founders cannot say out loud — about their companies, their teams, and themselves.',
      timeNote: 'Takes about 4 minutes.',
      privacyNote: 'Your results are private. Only you see the diagnosis.',
      button: 'Begin Diagnosis',
    },
    curve: {
      eyebrow: 'The Curve',
      heading1: 'Every company walks',
      heading2: 'the same descent.',
      sub: 'The only difference is who reaches the other side, and who disappears at the bottom.',
      stages: [
        { label: 'PRE-SEED' },
        { label: 'SEED' },
        { label: 'FUNDING GAP', danger: true },
        { label: 'EARLY' },
        { label: 'GROWTH' },
      ],
      milestones: ['Research', 'Development', 'Product launch', 'Product success', 'Business success'],
      axisY: 'CUMULATIVE P/L',
      axisX: 'TIME',
      valleyLabel: 'VALLEY OF DEATH',
      captions: [
        { t: 'The descent', b: 'You burn cash before the product earns. Every month brings you closer to the floor.' },
        { t: 'The floor', b: 'Most companies die here. No capital, no traction, no time, no honest mirror.' },
        { t: 'The climb', b: 'If you make it here, revenue starts covering burn. The company finally exists.' },
      ],
    },
    testimonialsEyebrow: 'After the Session',
    testimonialsHeading: "What they said\nwhen the room got quiet.",
  },

  contact: {
    metaTitle: 'Book a Risk Session — خبير الفشل',
    metaDesc:
      'A private, honest conversation about your company, your decisions, and the risks ahead. No coaching. No clichés.',
    eyebrow: 'Private Session · جلسة مغلقة',
    heroHeading1: 'Book a',
    heroHeading2: 'Risk Session.',
    heroSub:
      'No fake optimism. No startup clichés. Just an honest conversation about your company, your decisions, and the risks already moving underneath them.',
    heroArabicSub: 'خطوة واحدة قد تغير مسار شركتك.',
    pillars: [
      { k: 'Private', v: 'Nothing leaves the room. No notes shared.' },
      { k: 'Direct',  v: 'I will tell you what your team will not.' },
      { k: 'Honest',  v: 'No clichés. No theater. Just the truth on the table.' },
    ],
    formLabel: 'Intake · استمارة',
    formHeading: 'Tell me what\'s actually happening.',
    fieldName: 'Your name',
    fieldNamePlaceholder: 'Mohamed K.',
    fieldEmail: 'Email',
    fieldEmailPlaceholder: 'you@company.com',
    fieldCompany: 'Company / Project (optional)',
    fieldCompanyPlaceholder: 'Name or stealth',
    fieldStage: 'Stage',
    fieldStageDefault: '',
    stages: [
      { v: 'idea',         label: 'Idea / Pre-build' },
      { v: 'pre-seed',     label: 'Pre-seed' },
      { v: 'seed',         label: 'Seed' },
      { v: 'series-a',     label: 'Series A+' },
      { v: 'post-failure', label: 'Post-failure / Pivot' },
    ],
    fieldContext: "What's the situation?",
    fieldContextPlaceholder:
      'The numbers say one thing. My gut says another. We\'re...',
    fieldContextHint:
      'Be direct. The more honest the intake, the sharper the session.',
    submitLabel: 'Request the Session',
    submittingLabel: 'Submitting…',
    submitDisclaimer:
      'Submitting does not guarantee a session. I take a limited number of cases each month based on fit.',
    successHeading: 'Request received.',
    successBody:
      'I read every submission personally. If your case fits, you\'ll hear from me directly.',
    closingQuote: '"Save it before it becomes another case study."',
    sessionInfo: 'Private diagnostic session · 60 minutes · focused on your highest-risk failure patterns',
    situationTagsLabel: 'Quick situation (optional — select all that apply)',
    situationTags: [
      'Co-founder Dispute',
      'Severe Cash Burn',
      'Product-Market Fit Problem',
      'Funding Risk',
      'Team Breakdown',
      'Growth Without Revenue',
      'Other',
    ],
    successHeadingFull: 'Your request has been secured.',
    successBodyFull: 'We will review the case file and return with the next step. This may take 24–48 hours.',
  },

  assessment: {
    diagnosticLabel: 'The Founder Diagnostic',
    introHeading1: 'Ten questions.',
    introHeading2: 'No comfortable answers.',
    introDesc:
      'This is not a survey. It\'s a controlled, psychological diagnostic designed to surface what most founders cannot say out loud — about their company, their team, and themselves.',
    introBullets: [
      'Takes about 4 minutes.',
      'One question at a time. No going back through chapters.',
      'Your results are private. Only you see the diagnosis.',
    ],
    beginButton: 'Begin Diagnostic',

    leadLabel:   'Step 01 · Identification',
    leadHeading1: 'Before we begin —',
    leadHeading2: 'who are we diagnosing?',
    fieldName:    'Full name *',
    fieldEmail:   'Email *',
    fieldCompany: 'Company',
    fieldStage:   'Stage',
    fieldStageDefault: 'Select stage',
    stages: ['Idea', 'MVP', 'Pre-Seed', 'Seed', 'Early Revenue', 'Growth', 'Survival mode'],
    fieldSector:  'Sector',
    fieldCountry: 'Country',
    enterButton:  'Enter the Diagnostic',
    confidentialNote:
      'Your answers are confidential. We only use them to prepare your session if you choose to book one.',

    diagnosticProgress: 'Descent',
    backButton:    'Back',
    pressHint:     'Press 1–{n} to answer',
    restartButton: 'Restart',
    descentLabel: 'Founder state',
    emotionalStates: ['Stable', 'Exposed', 'Slipping', 'Panic', 'Collapse risk'],

    analyzingLabel:   'Analyzing responses',
    analyzingHeading: 'Compiling your diagnosis…',

    errorLabel:   'Submission failed',
    retryButton:  'Retry',

    diagnosisLabel: 'Diagnosis ·',
    shockEyebrow: 'The truth, said plainly',
    verdicts: {
      STABLE: {
        title: 'You are outside the valley — for now.',
        insight:
          'You are still operating with clarity. The danger at your stage isn\'t collapse — it\'s complacency. The founders who fall hardest are the ones who stopped looking down.',
      },
      EXPOSED: {
        title: 'You are at the edge of the valley.',
        insight:
          'You can still see the road, but the ground beneath you is moving. You are not ignoring the risks. You are emotionally negotiating with them.',
      },
      'INSIDE THE VALLEY': {
        title: 'You are inside the Valley of Death.',
        insight:
          'You already know. The signals have been there for weeks. What you don\'t need is more motivation — you need someone to sit across from you and refuse to look away.',
      },
      'COLLAPSE PROXIMITY': {
        title: 'You are closer to collapse than you\'re admitting.',
        insight:
          'This is not a coaching moment. It\'s a triage moment. The runway, the team, and your nervous system are all running on credit. Stop performing. Start cutting.',
      },
    },
    consequences: {
      STABLE:
        'If you stop looking down, this is exactly the moment a quiet blind spot becomes the story of how the company died.',
      EXPOSED:
        'Ignored for another two quarters, the negotiation ends. The market stops asking. The team stops believing. You stop sleeping.',
      'INSIDE THE VALLEY':
        'Without intervention, you have weeks — not months. The next "small" decision you defer is the one that takes the company.',
      'COLLAPSE PROXIMITY':
        'The runway, the team, and your nervous system are all running on credit. Without triage now, this becomes a post-mortem someone else writes.',
    },
    recoveryPaths: {
      STABLE:
        'Audit your blind spots quarterly. Build a private mirror — one person who is allowed to tell you the truth out loud, with no consequences.',
      EXPOSED:
        'Name the risk to one trusted outsider this week. Cut one optimistic assumption from your forecast. Stop selling certainty internally.',
      'INSIDE THE VALLEY':
        'Triage runway, team, and the postponed decision — in that order. Choose what you will protect and what you will let go before the choice is taken from you.',
      'COLLAPSE PROXIMITY':
        'Stop performing. Stop hiring. Stop launching. Sit with one person who has seen this before and rebuild the next 30 days from honest math.',
    },
    riskLevelLabel:    'Founder Risk Level',
    riskScoreLabel:    'Valley Risk Score',
    blindSpotsLabel:   'Blind Spots Detected',
    blindSpotsSection: 'Blind Spot Indicators',
    insightSection:    'Psychological Insight',
    consequencesSection: 'If you ignore this',
    recoverySection:   'Recovery path',
    nextMoveSection:   'Your next move',
    ctas: [
      { title: 'Book Emergency Session', desc: '60 minutes. We triage runway, team, and the decision you\'ve been postponing.' },
      { title: 'Request Startup Autopsy', desc: 'A full forensic review of where the company is bleeding — and why.' },
      { title: 'Book Founder Call', desc: 'Private 1:1 with Mohamed Khalil. Strategic, candid, off the record.' },
    ],
    dynamicCtas: {
      low: [
        { title: 'Request a detailed report', desc: 'A written read-out of your diagnostic with the patterns we noticed.', intent: 'report' },
        { title: 'Monitor your indicators', desc: 'Light-touch quarterly check-ins to catch drift before it becomes denial.', intent: 'monitor' },
      ],
      medium: [
        { title: 'Request a Startup Autopsy', desc: 'A forensic review of where the company is quietly bleeding — and why.', intent: 'autopsy' },
        { title: 'Build a recovery plan', desc: 'A 30-day plan to cut, protect, and rebuild on honest numbers.', intent: 'recovery' },
        { title: 'Founder diagnosis session', desc: 'Private 1:1 with Mohamed Khalil to name what your team won\'t.', intent: 'founder-call' },
      ],
      high: [
        { title: 'Emergency Founder Session', desc: 'This week. We triage runway, team, and the decision you\'ve been postponing. Limited intake.', intent: 'emergency', urgent: true },
      ],
    },
    continueLabel:          'Continue',
    restartDiagnosticLabel: 'Restart diagnostic',

    questions: [
      {
        id: 'cash_runway',
        chapter: 'CHAPTER 01 · THE NUMBERS YOU AVOID',
        prompt: 'When did you last open your real cash runway sheet?',
        type: 'choice',
        options: [
          { label: 'This morning. I know it cold.', weight: 1 },
          { label: 'Sometime this week.', weight: 2 },
          { label: 'A few weeks ago. I\'m not sure of the number.', weight: 4, tag: 'Financial denial' },
          { label: 'I avoid opening it. I\'m afraid of what I\'ll see.', weight: 5, tag: 'Financial denial' },
        ],
      },
      {
        id: 'truth_team',
        chapter: 'CHAPTER 02 · WHAT YOUR TEAM WON\'T SAY',
        prompt: 'If your team could speak without fear, what would they tell you?',
        sub: 'Answer for yourself before you choose.',
        type: 'choice',
        options: [
          { label: '"You\'re on the right track — keep going."', weight: 1 },
          { label: '"We need clearer direction."', weight: 3 },
          { label: '"You\'re not listening anymore."', weight: 5, tag: 'Leadership isolation' },
          { label: '"We\'ve already lost faith in the plan."', weight: 5, tag: 'Leadership isolation' },
        ],
      },
      {
        id: 'denial',
        chapter: 'CHAPTER 03 · DENIAL INDEX',
        prompt: 'A close friend tells you the company is in trouble. Your first reaction?',
        type: 'choice',
        options: [
          { label: 'I ask them to be more specific. I want the data.', weight: 1 },
          { label: 'I defend the vision and explain the upside.', weight: 4, tag: 'Founder denial' },
          { label: 'I get quietly angry. They don\'t understand.', weight: 5, tag: 'Founder denial' },
          { label: 'I agree out loud, then change nothing.', weight: 5, tag: 'Founder denial' },
        ],
      },
      {
        id: 'customer_pull',
        chapter: 'CHAPTER 04 · MARKET SIGNAL',
        prompt: 'How strong is real, unprompted pull from customers right now?',
        type: 'scale',
        scaleLabels: ['Strong, organic pull', 'Silence. I\'m pushing.'],
        blindSpot: 'No market pull',
      },
      {
        id: 'concentration',
        chapter: 'CHAPTER 05 · THE SINGLE THREAD',
        prompt: 'How exposed are you to losing one customer, one channel, or one investor?',
        type: 'scale',
        scaleLabels: ['Diversified', 'One loss = collapse'],
        blindSpot: 'Concentration risk',
      },
      {
        id: 'identity_fusion',
        chapter: 'CHAPTER 06 · IDENTITY FUSION',
        prompt: 'Where does "the company" end and "you" begin?',
        sub: 'Be honest. Founders rarely answer this one truthfully.',
        type: 'choice',
        options: [
          { label: 'They are clearly separate. I have a life outside it.', weight: 1 },
          { label: 'They overlap, but I can step back.', weight: 2 },
          { label: 'The company is most of my identity now.', weight: 4, tag: 'Identity fusion' },
          { label: 'If the company dies, I don\'t know who I am.', weight: 5, tag: 'Identity fusion' },
        ],
      },
      {
        id: 'decision_delay',
        chapter: 'CHAPTER 07 · THE DELAYED DECISION',
        prompt: 'There is a hard decision you\'ve been postponing. How long have you postponed it?',
        type: 'scale',
        scaleLabels: ['No, I move fast', 'Months. I keep gathering data.'],
        blindSpot: 'Decision paralysis',
      },
      {
        id: 'sleep',
        chapter: 'CHAPTER 08 · THE BODY KEEPS THE SCORE',
        prompt: 'How is your sleep this last month?',
        type: 'scale',
        scaleLabels: ['Solid, restored', 'Broken. I wake up calculating.'],
        blindSpot: 'Burnout proximity',
      },
      {
        id: 'plan_b',
        chapter: 'CHAPTER 09 · THE EXIT YOU DON\'T TALK ABOUT',
        prompt: 'Do you have a real Plan B — written, not imagined?',
        type: 'choice',
        options: [
          { label: 'Yes. Documented. I\'ve walked through it.', weight: 1 },
          { label: 'A rough idea, nothing concrete.', weight: 3 },
          { label: 'No. Thinking about it feels like betrayal.', weight: 5, tag: 'No exit plan' },
          { label: 'No. There is no Plan B. There is only this.', weight: 5, tag: 'No exit plan' },
        ],
      },
      {
        id: 'last_honest',
        chapter: 'CHAPTER 10 · THE LAST HONEST CONVERSATION',
        prompt: 'When did you last have a brutally honest conversation about the company — with anyone?',
        type: 'choice',
        options: [
          { label: 'This week.', weight: 1 },
          { label: 'Within the last month.', weight: 2 },
          { label: 'Months ago.', weight: 4, tag: 'Leadership isolation' },
          { label: 'I can\'t remember the last one.', weight: 5, tag: 'Leadership isolation' },
        ],
      },
    ],
  },

  testimonials: {
    defaultEyebrow: 'Founder Field Notes',
    defaultHeading: 'What founders said\nafter the session.',
    verifiedLabel: 'Verified founder',
  },

  notFound: {
    metaTitle: 'Page Not Found',
    metaDesc: "The page you're looking for doesn't exist. Return to the homepage to continue browsing.",
    heading: 'Page Not Found',
    body: "The page you're looking for doesn't exist or has been moved. Let's get you back on track.",
    ctaButton: 'Return to Home',
  },

  footer: {
    pullQuote1: 'Most founders meet me',
    pullQuote2: 'six months',
    pullCta: 'Don\'t be one of them →',
    navLabel: 'Navigate',
    navLinks: [
      { label: 'Home',               path: '' },
      { label: 'Case File',          path: '/about' },
      { label: 'Book a Session',     path: '/contact' },
      { label: 'Runway Simulator',   path: '/tools/runway-simulator' },
    ],
    directLabel: 'Direct',
    socialLabel: 'Social',
    copyright: '© {year} · Case Files · All Rights Reserved',
  },

  caseFiles: {
    metaTitle: 'Case Files — Khabeer Al Fashal',
    metaDesc: 'Anonymized intelligence reports from documented startup failures. Confidential. Pattern-based.',
    eyebrow: 'Intelligence Archive',
    heading: 'Startup Failure\nCase Files',
    subheading: 'Anonymized records from documented failure events. Each case is a pattern, not a story.',
    filterLabel: 'Filter by failure mode',
    allLabel: 'All Cases',
    filters: [
      { id: 'funding', label: 'Funding' },
      { id: 'cofounder', label: 'Co-founder' },
      { id: 'pmf', label: 'Product-Market Fit' },
      { id: 'burnrate', label: 'Burn Rate' },
      { id: 'sales', label: 'Sales Failure' },
      { id: 'scaling', label: 'Scaling' },
    ],
    classificationBadge: 'CONFIDENTIAL · REDACTED',
    redactedLabel: 'REDACTED',
    caseIdLabel: 'Case ID',
    industryLabel: 'Industry',
    stageLabel: 'Stage',
    failureModeLabel: 'Failure Mode',
    mistakeLabel: 'Key Mistake',
    lessonsLabel: 'Lessons',
    outcomeLabel: 'Outcome',
    confidentialNote: 'All identifying information has been removed. Case IDs are not traceable to specific companies.',
    cases: [
      {
        id: 'KF-0041',
        industry: 'Fintech',
        stage: 'Seed',
        year: '2022',
        failureMode: 'Co-founder Misalignment',
        tags: ['cofounder', 'burnrate'],
        keyMistake: 'The founding team operated with two opposing visions for 14 months without a resolution mechanism. By the time the split became public, the company had burned through 73% of its seed round in misaligned product directions.',
        lessons: [
          'Vision alignment must be documented and revisited quarterly — not assumed.',
          'When co-founders stop sharing the same war room, the company is already splitting.',
          'A cap table dispute at Series A is almost always a symptom of an unresolved founding-team conflict from 18 months earlier.',
        ],
        outcome: 'Company dissolved following lead investor withdrawal. Team split across two competing ventures.',
        redactedSection: 'The founding team previously worked at [REDACTED] and had built [REDACTED] before this venture.',
      },
      {
        id: 'KF-0088',
        industry: 'SaaS',
        stage: 'Series A',
        year: '2023',
        failureMode: 'Green Dashboard Collapse',
        tags: ['sales', 'scaling'],
        keyMistake: 'Metrics were optimized for investor optics rather than business health. Monthly Active Users were counted as any login event, including internal accounts. When the Series B data room opened, actual paying customer count was 11% of reported MAU.',
        lessons: [
          'Vanity metrics are not a strategy — they are a delay mechanism.',
          'Investors doing Series B due diligence will see what Series A investors did not.',
          'Dashboard hygiene is a governance issue, not a data issue.',
        ],
        outcome: 'Series B rejected after due diligence. CEO replaced. Company pivoted to services model with 40% headcount reduction.',
        redactedSection: 'The company had raised from [REDACTED] at a valuation of [REDACTED].',
      },
      {
        id: 'KF-0113',
        industry: 'E-commerce',
        stage: 'Growth',
        year: '2021',
        failureMode: 'Runway Miscalculation',
        tags: ['burnrate', 'funding'],
        keyMistake: 'The CFO modeled runway assuming a June fundraising close. The round closed in November. Five months of operating expenses — approximately $1.4M — were not stress-tested against a delayed close scenario. The company ran out of cash in September.',
        lessons: [
          'Fundraising timelines should never appear in an operating model as a hard assumption.',
          'A board that does not stress-test the burn rate against scenario delays is not doing its job.',
          'The most dangerous number in a startup is the one everyone assumes will be resolved by an upcoming event.',
        ],
        outcome: 'Emergency bridge from existing investors at punishing dilution. Two of five board members resigned.',
        redactedSection: undefined,
      },
      {
        id: 'KF-0157',
        industry: 'Healthcare Tech',
        stage: 'Pre-Seed',
        year: '2023',
        failureMode: 'Product-Market Fit Illusion',
        tags: ['pmf', 'sales'],
        keyMistake: 'Early traction was driven entirely by the founders personal network. When the company attempted to scale beyond warm referrals, the product failed to convert a single cold prospect in 90 days of outbound effort. The market validation had never included a stranger.',
        lessons: [
          'Network-driven traction is not product-market fit. It is founder-market relationship.',
          'The first sale to a stranger is a more important signal than the first 50 sales to friends.',
          'Pivot decisions delayed by 6 months beyond clear signal failure cost double the time to recover.',
        ],
        outcome: 'Pivoted product focus after 8 months. Two of three co-founders left. Company still operating at reduced capacity.',
        redactedSection: 'The founding team had previously raised [REDACTED] in grant funding from [REDACTED].',
      },
      {
        id: 'KF-0199',
        industry: 'Logistics',
        stage: 'Series A',
        year: '2022',
        failureMode: 'Leadership Isolation',
        tags: ['cofounder', 'scaling'],
        keyMistake: 'The CEO stopped attending the weekly operations review in month 8 of Series A deployment. By month 14, the leadership team had developed a parallel reality — one that protected the CEO from bad news. When the board requested a Q3 operational audit, the gap between reported performance and actual performance was exposed.',
        lessons: [
          'When a founder stops hearing bad news, it is not because things are going well.',
          'The distance between a CEO and the operational floor is inversely proportional to the quality of decisions made.',
          'A board that only receives curated updates is not governing — it is being managed.',
        ],
        outcome: 'CEO replaced by board after failed Series B. Company restructured under new leadership. Current status: operational with 60% of original team.',
        redactedSection: 'The board included partners from [REDACTED] and [REDACTED].',
      },
      {
        id: 'KF-0234',
        industry: 'EdTech',
        stage: 'Seed',
        year: '2023',
        failureMode: 'Sales Execution Failure',
        tags: ['sales', 'burnrate'],
        keyMistake: 'The company hired a VP of Sales from a Fortune 500 enterprise background to sell a $99/month SaaS product to SMBs. The mismatch between enterprise sales methodology and the actual sales cycle created an 11-month void in revenue generation while burn rate remained constant.',
        lessons: [
          'Sales hiring at the wrong level destroys burn rate without producing revenue.',
          'Enterprise sales professionals rarely succeed in SMB velocity environments without significant retraining.',
          'The first VP of Sales hire is the highest-risk hire in a seed-stage company.',
        ],
        outcome: 'VP Sales departed after 11 months. Company resumed founder-led sales. Revenue recovered but runway was permanently shortened.',
        redactedSection: undefined,
      },
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// ARABIC  عربي
// Written to feel native, cinematic, and psychologically sharp.
// ─────────────────────────────────────────────────────────────────────────────

const ar: LangStrings = {
  dir: 'rtl',
  fontBody: 'font-arabic',
  fontDisplay: 'font-arabic',

  nav: {
    home: 'الرئيسية',
    caseFile: 'الملف',
    valley: 'وادي الموت',
    session: 'الجلسة',
    langToggle: 'EN',
    methodology: 'المنهجية',
    caseFiles: 'ملفات الحالات',
  },

  home: {
    metaTitle: 'خبير الفشل — ذكاء فشل الشركات الناشئة',
    metaDesc:
      'دراسة تشريحية في أسباب موت الشركات. لا تدريب. لا كليشيهات. سيكولوجية المؤسس، وتشريح القرارات، وذكاء الأنماط من مئات حالات الانهيار.',
    stripLeft: '',
    stripCenter: '',
    stripRight: '',
    tagline: 'ذكاء فشل الشركات الناشئة',
    heroLine1: 'لا نعلّمك',
    heroLine2: 'كيف',
    heroLine3: 'تنجح.',
    heroLine4: 'نريك لماذا',
    heroLine5: 'تخسر.',
    heroPitch:
      'خبير الفشل — ممارسة تشريحية تدرس سيكولوجية المؤسس وقراراته ونقاط عماه قبل أن ينفد التمويل بأشهر.',
    ctaPrimary: 'احجز جلسة المخاطر',
    ctaSecondary: 'الملف التفصيلي',
    scrollLabel: 'انزل',
    scrollSubject: 'الموضوع: المؤسس',
    manifestoLoop:
      'لا مشايخ مصطنعون. · لا مسرح تحفيزي. · فقط ما يأبى الواقع تجميله. ·',
    thesisLabel: 'الفرضية',
    thesisQuote1: 'لم تفشل الشركة.',
    thesisQuote2: 'بل فَقَدَ المؤسس بصيرته الاستراتيجية.',
    thesisPara1:
      'تُلام الأسواق. ويُلام التوقيت. ويُلام المستثمرون. لكن تحت كل انهيار تقريباً مؤسسٌ يعيش فشلاً معرفياً صامتاً — قبل أشهر من اعتراف أي أحد به.',
    thesisPara2:
      'خبير الفشل منهجية مبنية على تشريح مئات الشركات الميتة. نرسم القرارات والإنكار والتشوهات — ونسمّيها قبل أن تتكرر فيك.',
    patternLabel: 'مكتبة الأنماط · مقتطف',
    patternHeading1: 'الانهيار دائماً',
    patternHeading2: 'يتشابه.',
    patternSub:
      'أربعة من اثني عشر نمطاً متكرراً نتتبّعها في المؤسسين الذين ندرسهم. المكتبة الكاملة للجلسات الخاصة.',
    patterns: [
      {
        n: '01',
        title: 'حلقة الإنكار عند المؤسس',
        body: 'القصة التي ترويها للمستثمرين تصبح القصة التي تحكيها لنفسك. بعد ثمانية عشر شهراً، تختلف معك جداول البيانات أخيراً.',
      },
      {
        n: '02',
        title: 'انهيار اللوحة الخضراء',
        body: 'كل مؤشر يصعد وتتحسن وتيرته، والشركة تحته تنزف فعلاً. الإشارة لم تكن يوماً في لوحة التحكم.',
      },
      {
        n: '03',
        title: 'تباعد الشركاء المؤسسين',
        body: 'توقّفتم عن خوض المحادثة الصعبة في الشهر الرابع. في الشهر السادس عشر، تدفع الشركة ثمن صمت لا يملكه أحدٌ منكم.',
      },
      {
        n: '04',
        title: 'التوسع المبكر',
        body: 'وظّفتَ قبل أن تتضح الاستراتيجية. المخطط التنظيمي الآن يدافع عن توجّه لا يؤمن به أحد، لكن الجميع يتقاضى أجره لتنفيذه.',
      },
    ],
    pullQuote1: 'حين تُفصح الأرقام',
    pullQuote2: 'أخيراً عن الحقيقة،',
    pullQuote3: 'تكون الشركة قد رحلت.',
    fieldNote: '',
    stats: [
      { k: '317', v: 'تشريح دُرس', i: 'أرشيف من 317 تشريحاً منظماً للشركات الناشئة، حُلِّلت للكشف عن أنماط القرار ومحفّزات الفشل عبر 12 عاماً.' },
      { k: '12',  v: 'نمط فشل متكرر', i: 'اثنا عشر نمطاً سلوكياً تظهر في أكثر من 80% من حالات الانهيار الموثقة — قبل وقت طويل من تأكيد الأرقام المالية ذلك.' },
      { k: '٦ أشهر', v: 'متوسط مدة تجاهل التحذير', i: 'يتجاهل المؤسس في المتوسط أولى الإشارات التحذيرية الواضحة لستة أشهر قبل أن تدخل الشركة في أزمة.' },
      { k: '01',  v: 'محادثة صادقة واحدة كافية', i: 'محادثة صادقة واحدة — مع الشخص المناسب، في اللحظة المناسبة — تغيّر المسار أكثر من أي وثيقة استراتيجية.' },
    ],
    ctaLabel:   'مقاعد مفتوحة · حالات محدودة',
    ctaHeading1: 'شيء ما',
    ctaHeading2: 'لا يبدو صحيحاً.',
    ctaHeading3: 'دعنا نسمّيه.',
    ctaBody:
      'محادثة واحدة. خاصة. مباشرة. لا تفاؤل مصطنع. لا كليشيهات. فقط الحقيقة التي يعجز فريقك القريب منك عن قولها.',
    ctaButton: 'اطلب الجلسة',
  },

  about: {
    metaTitle: 'عن خبير الفشل',
    metaDesc:
      'المؤسس خلف خبير الفشل. دراسة في انهيار الشركات وسيكولوجية المؤسس ونقاط العمى التي تقتل الشركات قبل إغلاقها بكثير.',
    eyebrow: 'ملف القضية · 001',
    heroLine1: 'بعض الشركات تموت',
    heroLine2: 'قبل أن',
    heroLine3: 'تُغلق',
    heroLine4: 'رسمياً.',
    heroBio:
      'أنا محمد خليل. أدرس موت الشركات — لا لأرثيها، بل لأفهم المؤسس الذي لم يرَ ما قادم. في الغالب، كان ذلك المؤسس أنا.',
    scrollLabel: 'انزل · شاهد',
    chapters: [
      {
        eyebrow: 'I',
        title: 'الانهيار',
        body: 'بنيتُ شيئاً آمنتُ به. ثم رأيتُه يموت — ببطء، في صمت، بينما كل المؤشرات ما زالت خضراء. حين أفصحت الأرقام أخيراً، كانت الشركة قد رحلت. بدأ التشريح قبل الجنازة بوقت طويل.',
      },
      {
        eyebrow: 'II',
        title: 'الإدراك',
        body: 'معظم الشركات لا تفشل بسبب السوق. تفشل لأن المؤسس توقّف عن الرؤية بوضوح. أنا توقّفتُ. نقاط العمى لم تكن في الجداول — كانت فيّ.',
      },
      {
        eyebrow: 'III',
        title: 'ميلاد خبير الفشل',
        body: 'عدتُ إلى كل انهيار — انهياري وانهيارات مئات غيري. قرأتُ التشريحات. جلستُ مع المؤسسين. رسمتُ الأنماط التي لم يُرِد أحد تسميتها. خبير الفشل هو ما خرج من تلك الهواجس: منهجية، لا علامة تجارية.',
      },
      {
        eyebrow: 'IV',
        title: 'العمل',
        body: 'أدرس سيكولوجية المؤسسين الذين انكسروا. التشوهات المعرفية. حلقات الإنكار. القرارات التي بدت منطقية في حينها وانفجرت بعد ثمانية عشر شهراً. هذا ليس تدريباً. هذا تحليل جنائي للإنسان داخل الشركة.',
      },
    ],
    quoteOpen: '"',
    quoteBody1: 'لستُ هنا لأحفّزك.',
    quoteBody2: 'أنا هنا لأخبرك بما ترفض رؤيته.',
    quoteAttr: '— محمد خليل · مؤسس خبير الفشل',
    pillarsLabel: '',
    pillars: [
      {
        n: '01',
        k: 'لا مشايخ مصطنعون',
        v: 'لا مسرح تحفيزي. لا فلسفة LinkedIn. البيانات وحدها قاسية بما يكفي.',
      },
      {
        n: '02',
        k: 'سيكولوجية المؤسس',
        v: 'لكل انهيار توقيعه البشري. نتتبّع القرار حتى نصل إلى الحالة المعرفية التي أنتجته.',
      },
      {
        n: '03',
        k: 'ذكاء الأنماط',
        v: 'مئات التشريحات. مُترابطة ومُقارنة. الأنماط تتكرر. نسمّيها قبل أن تتكرر فيك.',
      },
    ],
    closingBody: 'إن وصلتَ إلى هنا، فشيء ما لا يبدو صحيحاً في شركتك بالفعل.',
    closingSub: 'ثق بهذا الإحساس. معظم المؤسسين يلتقونني متأخرين ستة أشهر.',
    ctaButton: 'اطلب تشريحاً',
    caseSnippets: [
      { id: '#042', sector: 'تقنية مالية', stage: 'Seed', pattern: 'خلاف الشركاء · حرق السيولة' },
      { id: '#117', sector: 'SaaS', stage: 'Series A', pattern: 'انهيار المؤشرات الخضراء · عزلة القيادة' },
    ],
    caseSnippetsLabel: 'من ملفات القضايا',
  },

  valley: {
    metaTitle: 'وادي الموت — اختبار المؤسس',
    metaDesc:
      'تشخيص نفسي للنزول الذي يمرّ به كل مؤسس. لا تحفيز، لا تدريب — فقط الحقيقة عن مدى قربك من الحافة.',
    eyebrow: '',
    heroHeading1: 'وادي',
    heroHeading2: 'الموت',
    heroSub:
      'لا تحفيز. لا تدريب. أجب بصدق — الشخص الوحيد الذي تستطيع الكذب عليه هنا هو أنت.',
    lore: {
      eyebrow: '',
      heading1: 'معظم المؤسسين',
      heading2: 'لا يرون الوادي إلا حين يصبحون داخله.',
      p1: 'وادي الموت هو الفجوة الصامتة بين احتراق آخر شعلة من قناعتك، وأول دولار حقيقي من الإيراد. هنا يتقلّص النقد، ويقرأ الفريق وجهك، وتكفّ الجداول عن الكذب.',
      p2: 'الشركات لا تموت من السوق غالباً. تموت داخل الوادي — لأن المؤسس استمر في تمثيل الثقة بينما الأرض تنهار تحته.',
      p3: 'بُني هذا التشخيص من تحليل مئات حالات الفشل، ومن الأنماط الإدراكية التي يظهرها المؤسسون في الأشهر السابقة على الانهيار. لا توجد إجابة صحيحة هنا. هناك فقط ما ستعترف به أخيراً.',
    },
    narrative: {
      eyebrow: 'ما هو وادي الموت؟',
      intro: 'استخدم المستثمرون ورواد الأعمال مصطلح "وادي الموت" لوصف الفجوة بين بناء المنتج وتحقيق الإيراد المستدام — وهي المرحلة التي تختفي فيها معظم الشركات الناشئة.',
      heading: 'معظم المؤسسين لا يرون الوادي إلا حين يصبحون داخله.',
      p1: 'وادي الموت هو الفجوة الصامتة بين احتراق آخر شعلة من قناعتك، وأول دولار حقيقي من الإيراد. هنا يتقلّص النقد، ويقرأ الفريق وجهك، وتكفّ الجداول عن الكذب.',
      p2: 'الشركات لا تموت من السوق غالباً. تموت داخل الوادي — لأن المؤسس استمر في تمثيل الثقة بينما الأرض تنهار تحته.',
      p3: 'بُني هذا التشخيص من تحليل مئات حالات الفشل، ومن الأنماط الإدراكية التي يظهرها المؤسسون في الأشهر السابقة على الانهيار.',
      p4: 'لا توجد إجابة صحيحة هنا.\nهناك فقط ما ستعترف به أخيراً.',
    },
    diagnosisCta: {
      intro: 'هذا ليس استبياناً. إنه تشخيص نفسي منضبط مصمَّم لاستخراج ما لا يستطيع معظم المؤسسين قوله بصوت عالٍ — عن شركاتهم وفرقهم وأنفسهم.',
      timeNote: 'يستغرق نحو 4 دقائق.',
      privacyNote: 'نتائجك خاصة. أنت وحدك ترى التشخيص.',
      button: 'ابدأ التشخيص',
    },
    curve: {
      eyebrow: '',
      heading1: 'كل شركة تسير',
      heading2: 'على المنحنى نفسه',
      sub: 'الفرق الوحيد: من يصل إلى الجهة الأخرى، ومن يختفي في القاع.',
      stages: [
        { label: 'ما قبل التأسيس' },
        { label: 'التأسيس' },
        { label: 'فجوة التمويل', danger: true },
        { label: 'النمو المبكر' },
        { label: 'التوسع' },
      ],
      milestones: ['بحث', 'تطوير', 'إطلاق المنتج', 'نجاح المنتج', 'نجاح الشركة'],
      axisY: 'الأرباح/الخسائر التراكمية',
      axisX: 'الزمن',
      valleyLabel: 'وادي الموت',
      captions: [
        { t: 'النزول', b: 'تحرق النقد قبل أن يبيع المنتج. كل شهر يقرّبك من القاع.' },
        { t: 'القاع', b: 'هنا تموت معظم الشركات. لا تمويل، لا إيرادات كافية، لا وقت، ولا مرآة صادقة.' },
        { t: 'الصعود', b: 'إن وصلت إلى هنا، الإيراد بدأ يغطي الحرق. الشركة أصبحت حقيقة.' },
      ],
    },
    testimonialsEyebrow: 'بعد الجلسة',
    testimonialsHeading: 'ما قالوه\nحين هدأت الغرفة.',
  },

  contact: {
    metaTitle: 'احجز جلسة المخاطر — خبير الفشل',
    metaDesc:
      'محادثة خاصة وصادقة عن شركتك وقراراتك والمخاطر القادمة. لا تدريب. لا كليشيهات.',
    eyebrow: 'جلسة مغلقة',
    heroHeading1: 'احجز',
    heroHeading2: 'جلسة المخاطر.',
    heroSub:
      'لا تفاؤل مصطنع. لا كليشيهات. محادثة صادقة فحسب عن شركتك وقراراتك والمخاطر التي تتحرك تحتها.',
    heroArabicSub: 'خطوة واحدة قد تغير مسار شركتك.',
    pillars: [
      { k: 'سرية',   v: 'لا شيء يخرج من الغرفة. لا ملاحظات مشتركة.' },
      { k: 'مباشرة', v: 'سأخبرك بما لن يقوله لك فريقك.' },
      { k: 'صادقة',  v: 'لا كليشيهات. لا مسرح. فقط الحقيقة على الطاولة.' },
    ],
    formLabel:   'استمارة',
    formHeading: 'أخبرني بما يحدث فعلاً.',
    fieldName:   'اسمك',
    fieldNamePlaceholder: 'محمد خليل',
    fieldEmail:  'البريد الإلكتروني',
    fieldEmailPlaceholder: 'you@company.com',
    fieldCompany: 'الشركة / المشروع (اختياري)',
    fieldCompanyPlaceholder: 'الاسم أو سري',
    fieldStage:  'المرحلة',
    fieldStageDefault: '',
    stages: [
      { v: 'idea',         label: 'فكرة / ما قبل البناء' },
      { v: 'pre-seed',     label: 'ما قبل التمويل الأولي' },
      { v: 'seed',         label: 'التمويل الأولي' },
      { v: 'series-a',     label: 'جولة A وما بعدها' },
      { v: 'post-failure', label: 'ما بعد الفشل / محور' },
    ],
    fieldContext: 'ما الوضع؟',
    fieldContextPlaceholder:
      'الأرقام تقول شيئاً. حدسي يقول شيئاً آخر. نحن...',
    fieldContextHint: 'كن مباشراً. كلما كان الإدخال أصدق، كانت الجلسة أحدّ.',
    submitLabel:    'اطلب الجلسة',
    submittingLabel: 'جاري الإرسال…',
    submitDisclaimer:
      'الإرسال لا يضمن الحصول على جلسة. أقبل عدداً محدوداً من الحالات كل شهر بناءً على التوافق.',
    successHeading: 'تم استلام طلبك.',
    successBody:
      'أقرأ كل طلب بنفسي. إن ناسبتك الجلسة، ستسمع مني مباشرة.',
    closingQuote: '"أنقذها قبل أن تصبح دراسة حالة أخرى."',
    sessionInfo: 'جلسة تشخيص خاصة · 60 دقيقة · تركّز على أخطر أنماط الفشل في شركتك',
    situationTagsLabel: 'وصف سريع للوضع (اختياري — اختر ما ينطبق)',
    situationTags: [
      'خلاف بين الشركاء المؤسسين',
      'حرق نقدي حاد',
      'مشكلة التوافق مع السوق',
      'مخاطر التمويل',
      'انهيار الفريق',
      'نمو بلا إيرادات حقيقية',
      'أخرى',
    ],
    successHeadingFull: 'تم تأمين طلبك.',
    successBodyFull: 'سنراجع ملف الحالة ونعود إليك بالخطوة التالية خلال 24–48 ساعة.',
  },

  assessment: {
    diagnosticLabel: '',
    introHeading1: '',
    introHeading2: '',
    introDesc:
      'هذا ليس استبياناً. إنه تشخيص نفسي منضبط مصمَّم لاستخراج ما لا يستطيع معظم المؤسسين قوله بصوت عالٍ — عن شركاتهم وفرقهم وأنفسهم.',
    introBullets: [
      'يستغرق نحو 4 دقائق.',
      'سؤال واحد في كل مرة. لا عودة للفصول السابقة.',
      'نتائجك خاصة. أنت وحدك ترى التشخيص.',
    ],
    beginButton: 'ابدأ التشخيص',

    leadLabel:    'الخطوة 01 · التعريف',
    leadHeading1: 'قبل أن نبدأ —',
    leadHeading2: 'من نقوم بتشخيصه؟',
    fieldName:   'الاسم الكامل *',
    fieldEmail:  'البريد الإلكتروني *',
    fieldCompany: 'الشركة',
    fieldStage:   'المرحلة',
    fieldStageDefault: 'اختر المرحلة',
    stages: ['فكرة', 'MVP', 'ما قبل التمويل الأولي', 'التمويل الأولي', 'إيرادات مبكرة', 'نمو', 'وضع البقاء'],
    fieldSector:  'القطاع',
    fieldCountry: 'الدولة',
    enterButton:  'ادخل التشخيص',
    confidentialNote:
      'إجاباتك سرية. نستخدمها فقط للتحضير لجلستك إن اخترتَ حجزها.',

    diagnosticProgress: 'النزول',
    backButton:    'رجوع',
    pressHint:     'اضغط 1–{n} للإجابة',
    restartButton: 'إعادة البدء',
    descentLabel:  'حالة المؤسس',
    emotionalStates: ['مستقر', 'مكشوف', 'ينزلق', 'في ذعر صامت', 'على حافة الانهيار'],

    analyzingLabel:   'تحليل الإجابات',
    analyzingHeading: 'جاري تجميع تشخيصك…',

    errorLabel:   'فشل الإرسال',
    retryButton:  'إعادة المحاولة',

    diagnosisLabel: 'التشخيص ·',
    shockEyebrow: 'الحقيقة، دون تجميل',
    verdicts: {
      STABLE: {
        title: 'أنتَ خارج الوادي — في الوقت الحالي.',
        insight:
          'لا تزال تعمل بوضوح. الخطر في مرحلتك ليس الانهيار، بل الاطمئنان. المؤسسون الذين يسقطون بأشدّ الطرق وجعاً هم من توقّفوا عن النظر إلى الأسفل.',
      },
      EXPOSED: {
        title: 'أنتَ على حافة الوادي.',
        insight:
          'لا تزال ترى الطريق، لكنّ الأرض تحتك تتحرك. لستَ تتجاهل المخاطر. أنتَ تتفاوض معها عاطفياً.',
      },
      'INSIDE THE VALLEY': {
        title: 'أنتَ داخل وادي الموت.',
        insight:
          'أنتَ تعرف بالفعل. الإشارات كانت موجودة منذ أسابيع. ما تحتاجه ليس مزيداً من التحفيز، بل شخصاً يجلس في مواجهتك ويرفض إغماض عينيه.',
      },
      'COLLAPSE PROXIMITY': {
        title: 'أنتَ أقرب للانهيار ممّا تعترف به.',
        insight:
          'هذه ليست لحظة تدريب. إنها لحظة إسعاف. التدفق النقدي والفريق وجهازك العصبي كلها تعمل بالدَّيْن. توقّف عن التمثيل. ابدأ بالتقليص.',
      },
    },
    consequences: {
      STABLE:
        'إن توقّفتَ عن النظر إلى الأسفل، فهذه بالضبط اللحظة التي تتحول فيها نقطة عمى صغيرة إلى قصة موت الشركة.',
      EXPOSED:
        'إن تجاهلتَ الإشارات لربعين آخرين، تنتهي المفاوضة. السوق يكفّ عن السؤال. الفريق يكفّ عن الإيمان. وأنتَ تكفّ عن النوم.',
      'INSIDE THE VALLEY':
        'دون تدخّل، أمامك أسابيع لا أشهر. القرار "الصغير" التالي الذي تؤجّله هو الذي سيأخذ الشركة.',
      'COLLAPSE PROXIMITY':
        'التدفق النقدي والفريق وجهازك العصبي كلها تعمل بالدَّيْن. دون إسعاف الآن، يصبح هذا تشريحاً يكتبه شخص آخر عنك.',
    },
    recoveryPaths: {
      STABLE:
        'افحص نقاط عماك كل ربع. ابنِ مرآة خاصة — شخص واحد مسموح له أن يقول لك الحقيقة بصوت عالٍ، دون عواقب.',
      EXPOSED:
        'سَمِّ الخطر لشخص واحد موثوق من خارج الفريق هذا الأسبوع. اقطع افتراضاً متفائلاً من خطتك. توقّف عن بيع اليقين داخلياً.',
      'INSIDE THE VALLEY':
        'حدّد الأولويات: التدفق، الفريق، القرار المؤجَّل — بهذا الترتيب. اختر ما ستحميه وما ستتركه قبل أن يُفرض الاختيار عليك.',
      'COLLAPSE PROXIMITY':
        'توقّف عن التمثيل. توقّف عن التوظيف. توقّف عن الإطلاق. اجلس مع شخص رأى هذا من قبل، وأعِد بناء الثلاثين يوماً القادمة بأرقام صادقة.',
    },
    riskLevelLabel:    'مستوى مخاطر المؤسس',
    riskScoreLabel:    'درجة مخاطر الوادي',
    blindSpotsLabel:   'مؤشرات الخطر المتجاهلة',
    blindSpotsSection: 'مؤشرات الخطر المتجاهلة',
    insightSection:    'الرؤية النفسية',
    consequencesSection: 'إن تجاهلتَ هذا',
    recoverySection:   'مسار التعافي',
    nextMoveSection:   'خطوتك التالية',
    ctas: [
      { title: 'احجز جلسة طارئة', desc: '٦٠ دقيقة. نحدّد التدفق والفريق والقرار الذي أجّلتَه.' },
      { title: 'اطلب تشريح شركتك', desc: 'مراجعة جنائية شاملة لمكان نزف الشركة — ولماذا.' },
      { title: 'احجز مكالمة المؤسس', desc: 'جلسة خاصة 1:1 مع محمد خليل. استراتيجية، صريحة، سرية.' },
    ],
    dynamicCtas: {
      low: [
        { title: 'اطلب تقريراً مفصّلاً', desc: 'قراءة مكتوبة لتشخيصك مع الأنماط التي رصدناها.', intent: 'report' },
        { title: 'راقِب مؤشّراتك', desc: 'فحص ربع سنوي خفيف لرصد الانزلاق قبل أن يصبح إنكاراً.', intent: 'monitor' },
      ],
      medium: [
        { title: 'اطلب تشريح شركتك', desc: 'مراجعة جنائية لمكان النزف الصامت — ولماذا يحدث الآن.', intent: 'autopsy' },
        { title: 'ابنِ خطة تعافٍ', desc: 'خطة ٣٠ يوماً لقطع، وحماية، وإعادة البناء على أرقام صادقة.', intent: 'recovery' },
        { title: 'جلسة تشخيص للمؤسس', desc: 'جلسة خاصة 1:1 مع محمد خليل لتسمية ما لن يقوله فريقك.', intent: 'founder-call' },
      ],
      high: [
        { title: 'جلسة طوق النجاة', desc: 'هذا الأسبوع. نحدّد الأولويات: التدفق، الفريق، القرار الذي تؤجّله. المقاعد محدودة.', intent: 'emergency', urgent: true },
      ],
    },
    continueLabel:          'متابعة',
    restartDiagnosticLabel: 'إعادة التشخيص',

    questions: [
      {
        id: 'cash_runway',
        chapter: 'الفصل 01 · الأرقام التي تتجنّبها',
        prompt: 'متى كانت آخر مرة فتحتَ فيها جدول التدفق النقدي الحقيقي؟',
        type: 'choice',
        options: [
          { label: 'الصباح. أعرفه عن ظهر قلب.', weight: 1 },
          { label: 'في وقت ما هذا الأسبوع.', weight: 2 },
          { label: 'منذ أسابيع. لستُ متأكداً من الرقم.', weight: 4, tag: 'Financial denial' },
          { label: 'أتجنّب فتحه. أخشى ما سأراه.', weight: 5, tag: 'Financial denial' },
        ],
      },
      {
        id: 'truth_team',
        chapter: 'الفصل 02 · ما لن يقوله فريقك',
        prompt: 'لو استطاع فريقك التحدث دون خوف، ماذا سيقولون لك؟',
        sub: 'أجب بينك وبين نفسك قبل أن تختار.',
        type: 'choice',
        options: [
          { label: '"أنتَ على المسار الصحيح — استمر."', weight: 1 },
          { label: '"نحتاج توجيهاً أوضح."', weight: 3 },
          { label: '"لم تعد تصغي إلينا."', weight: 5, tag: 'Leadership isolation' },
          { label: '"لقد فقدنا إيماننا بالخطة."', weight: 5, tag: 'Leadership isolation' },
        ],
      },
      {
        id: 'denial',
        chapter: 'الفصل 03 · مؤشر الإنكار',
        prompt: 'يخبرك صديق مقرّب أن الشركة في ورطة. ما ردة فعلك الأولى؟',
        type: 'choice',
        options: [
          { label: 'أطلب منه تفاصيل أكثر. أريد البيانات.', weight: 1 },
          { label: 'أدافع عن الرؤية وأشرح الإمكانيات.', weight: 4, tag: 'Founder denial' },
          { label: 'أشعر بغضب خفي. هو لا يفهم.', weight: 5, tag: 'Founder denial' },
          { label: 'أوافقه علناً، ثم لا أغيّر شيئاً.', weight: 5, tag: 'Founder denial' },
        ],
      },
      {
        id: 'customer_pull',
        chapter: 'الفصل 04 · إشارة السوق',
        prompt: 'كم قوة الجذب الحقيقي غير المتكلَّف من العملاء الآن؟',
        type: 'scale',
        scaleLabels: ['جذب عضوي قوي', 'صمت. أنا من يدفع.'],
        blindSpot: 'No market pull',
      },
      {
        id: 'concentration',
        chapter: 'الفصل 05 · الخيط الوحيد',
        prompt: 'كم أنتَ عرضة لفقدان عميل واحد، أو قناة واحدة، أو مستثمر واحد؟',
        type: 'scale',
        scaleLabels: ['متنوّع', 'خسارة واحدة = انهيار'],
        blindSpot: 'Concentration risk',
      },
      {
        id: 'identity_fusion',
        chapter: 'الفصل 06 · الاندماج مع الهوية',
        prompt: 'أين تنتهي "الشركة" وتبدأ "أنت"؟',
        sub: 'كن صادقاً. المؤسسون نادراً ما يجيبون على هذا بصدق.',
        type: 'choice',
        options: [
          { label: 'واضح الفصل بينهما. لديّ حياة خارجها.', weight: 1 },
          { label: 'تتداخلان، لكنني قادر على التراجع.', weight: 2 },
          { label: 'الشركة هي معظم هويتي الآن.', weight: 4, tag: 'Identity fusion' },
          { label: 'إن ماتت الشركة، لا أعرف من أنا.', weight: 5, tag: 'Identity fusion' },
        ],
      },
      {
        id: 'decision_delay',
        chapter: 'الفصل 07 · القرار المؤجَّل',
        prompt: 'هناك قرار صعب أجّلتَه. كم من الوقت أجّلتَه؟',
        type: 'scale',
        scaleLabels: ['لا، أتحرك بسرعة', 'أشهر. ما زلتُ أجمع بيانات.'],
        blindSpot: 'Decision paralysis',
      },
      {
        id: 'sleep',
        chapter: 'الفصل 08 · الجسد يحفظ الحساب',
        prompt: 'كيف كان نومك الشهر الماضي؟',
        type: 'scale',
        scaleLabels: ['جيد ومُستَعَاد', 'متقطّع. أستيقظ وأنا أحسب.'],
        blindSpot: 'Burnout proximity',
      },
      {
        id: 'plan_b',
        chapter: 'الفصل 09 · الخروج الذي لا تتحدث عنه',
        prompt: 'هل لديك خطة بديلة حقيقية — مكتوبة، لا متخيَّلة؟',
        type: 'choice',
        options: [
          { label: 'نعم. موثّقة. مررتُ بها.', weight: 1 },
          { label: 'فكرة تقريبية، لا شيء ملموس.', weight: 3 },
          { label: 'لا. التفكير فيها يبدو خيانة.', weight: 5, tag: 'No exit plan' },
          { label: 'لا. لا توجد خطة بديلة. هذا كل ما هو موجود.', weight: 5, tag: 'No exit plan' },
        ],
      },
      {
        id: 'last_honest',
        chapter: 'الفصل 10 · آخر محادثة صادقة',
        prompt: 'متى كانت آخر مرة أجريتَ فيها محادثة صريحة حقاً عن الشركة — مع أيٍّ كان؟',
        type: 'choice',
        options: [
          { label: 'هذا الأسبوع.', weight: 1 },
          { label: 'خلال الشهر الماضي.', weight: 2 },
          { label: 'منذ أشهر.', weight: 4, tag: 'Leadership isolation' },
          { label: 'لا أتذكر متى كانت آخر مرة.', weight: 5, tag: 'Leadership isolation' },
        ],
      },
    ],
  },

  testimonials: {
    defaultEyebrow: 'ملاحظات ميدانية من المؤسسين',
    defaultHeading: 'ما قاله المؤسسون\nبعد الجلسة.',
    verifiedLabel: 'مؤسس موثَّق',
  },

  notFound: {
    metaTitle: 'الصفحة غير موجودة',
    metaDesc: 'الصفحة التي تبحث عنها غير موجودة. عد إلى الرئيسية.',
    heading: 'الصفحة غير موجودة',
    body: 'الصفحة التي تبحث عنها غير موجودة أو تم نقلها. دعنا نعيدك للمسار.',
    ctaButton: 'العودة إلى الرئيسية',
  },

  footer: {
    pullQuote1: 'معظم المؤسسين يلتقونني',
    pullQuote2: 'متأخرين ستة أشهر',
    pullCta: 'لا تكن منهم ←',
    navLabel: 'التنقل',
    navLinks: [
      { label: 'الرئيسية',      path: '' },
      { label: 'الملف',         path: '/about' },
      { label: 'احجز جلسة',    path: '/contact' },
      { label: 'محاكي الرصيد', path: '/tools/runway-simulator' },
    ],
    directLabel: 'تواصل مباشر',
    socialLabel: 'تابعنا',
    copyright: '© {year} · ملفات القضايا · جميع الحقوق محفوظة',
  },

  caseFiles: {
    metaTitle: 'ملفات الحالات — خبير الفشل',
    metaDesc: 'تقارير استخباراتية مجهولة المصدر من حالات فشل الشركات الموثقة. سرية. قائمة على الأنماط.',
    eyebrow: 'الأرشيف الاستخباراتي',
    heading: 'ملفات\nفشل الشركات',
    subheading: 'سجلات مجهولة المصدر من أحداث الفشل الموثقة. كل حالة هي نمط، وليست مجرد قصة.',
    filterLabel: 'تصفية حسب نمط الفشل',
    allLabel: 'جميع الحالات',
    filters: [
      { id: 'funding', label: 'التمويل' },
      { id: 'cofounder', label: 'المؤسس المشارك' },
      { id: 'pmf', label: 'الملاءمة السوقية' },
      { id: 'burnrate', label: 'معدل الإنفاق' },
      { id: 'sales', label: 'فشل المبيعات' },
      { id: 'scaling', label: 'التوسع' },
    ],
    classificationBadge: 'سري · محجوب',
    redactedLabel: 'محجوب',
    caseIdLabel: 'رقم الحالة',
    industryLabel: 'القطاع',
    stageLabel: 'المرحلة',
    failureModeLabel: 'نمط الفشل',
    mistakeLabel: 'الخطأ الجوهري',
    lessonsLabel: 'الدروس المستخلصة',
    outcomeLabel: 'النتيجة',
    confidentialNote: 'تمت إزالة جميع المعلومات التعريفية. أرقام الحالات غير قابلة للتتبع إلى شركات بعينها.',
    cases: [
      {
        id: 'KF-0041',
        industry: 'التكنولوجيا المالية',
        stage: 'التمويل الأولي',
        year: '٢٠٢٢',
        failureMode: 'تباين رؤية الفريق التأسيسي',
        tags: ['cofounder', 'burnrate'],
        keyMistake: 'عمل الفريق التأسيسي برؤيتين متعارضتين لمدة 14 شهراً دون آلية حل. وبحلول وقت الإعلان عن الانفصال، كانت الشركة قد أنفقت 73% من جولة التمويل الأولي في اتجاهات منتجات متضاربة.',
        lessons: [
          'يجب توثيق توافق الرؤية ومراجعتها فصلياً — لا افتراضها.',
          'حين يتوقف المؤسسون عن مشاركة غرفة العمل ذاتها، تكون الشركة قد انقسمت فعلاً.',
          'النزاع على الحصص في جولة السلسلة A يكاد يكون دائماً عرضاً لصراع قديم من 18 شهراً مضت.',
        ],
        outcome: 'انهارت الشركة بعد انسحاب المستثمر الرئيسي. انفصل الفريق في مشروعين متنافسين.',
        redactedSection: 'سبق للفريق التأسيسي العمل في [محجوب] وبناء [محجوب] قبل هذا المشروع.',
      },
      {
        id: 'KF-0088',
        industry: 'برمجيات كخدمة',
        stage: 'السلسلة A',
        year: '٢٠٢٣',
        failureMode: 'انهيار لوحة القياسات الخضراء',
        tags: ['sales', 'scaling'],
        keyMistake: 'جرى تحسين مؤشرات الأداء لاستعراضها أمام المستثمرين لا لانعكاسها على صحة الأعمال. كانت المستخدمون النشطون شهرياً تُحتسب من أي حدث تسجيل دخول بما فيها الحسابات الداخلية. حين فُتح الغرفة الإلكترونية للسلسلة B، كان عدد العملاء الفعليين المدفوعين 11% فقط من المستخدمين المُبلَّغ عنهم.',
        lessons: [
          'المؤشرات الوهمية ليست استراتيجية — إنها آلية تأجيل.',
          'مستثمرو السلسلة B سيرون ما لم يره مستثمرو السلسلة A.',
          'نظافة لوحة القياسات مسألة حوكمة لا بيانات.',
        ],
        outcome: 'رُفضت السلسلة B بعد التحقق المعمق. أُقيل الرئيس التنفيذي. تحولت الشركة لنموذج خدمات مع خفض 40% من الكوادر.',
        redactedSection: 'جمعت الشركة تمويلاً من [محجوب] بتقييم [محجوب].',
      },
      {
        id: 'KF-0113',
        industry: 'التجارة الإلكترونية',
        stage: 'النمو',
        year: '٢٠٢١',
        failureMode: 'خطأ في حساب الرصيد التشغيلي',
        tags: ['burnrate', 'funding'],
        keyMistake: 'صمّم المدير المالي النموذج التشغيلي على افتراض إغلاق جولة التمويل في يونيو. أُغلقت الجولة في نوفمبر. لم تخضع خمسة أشهر من مصاريف التشغيل — نحو 1.4 مليون دولار — لأي اختبار ضغط في سيناريو التأخير. نفد السيولة في سبتمبر.',
        lessons: [
          'جداول التمويل لا يجب أن تظهر في النموذج التشغيلي كافتراض ثابت.',
          'مجلس إدارة لا يختبر معدل الإنفاق أمام سيناريوهات التأخير لا يؤدي دوره.',
          'أخطر رقم في الشركة الناشئة هو الرقم الذي يفترض الجميع حله بحدث قادم.',
        ],
        outcome: 'جولة طارئة من المستثمرين الحاليين بتخفيف حصة مؤلم. استقال اثنان من أعضاء مجلس الإدارة الخمسة.',
        redactedSection: undefined,
      },
      {
        id: 'KF-0157',
        industry: 'تكنولوجيا الرعاية الصحية',
        stage: 'ما قبل التمويل الأولي',
        year: '٢٠٢٣',
        failureMode: 'وهم الملاءمة السوقية',
        tags: ['pmf', 'sales'],
        keyMistake: 'قامت قاعدة العملاء الأولى بالكامل على شبكة علاقات شخصية للمؤسسين. حين حاولت الشركة التوسع خارج الإحالات الدافئة، أخفق المنتج في تحويل أي عميل بارد في 90 يوماً من الاتصال الصادر. لم يشمل التحقق من السوق يوماً شخصاً لا يعرف المؤسسين.',
        lessons: [
          'التجربة المبنية على العلاقات ليست ملاءمة سوقية — إنها علاقة المؤسس بالسوق.',
          'أول عملية بيع لشخص لا تربطه بك علاقة إشارة أهم من أول خمسين عملية بيع للأصدقاء.',
          'قرارات التحول المتأخرة ستة أشهر بعد الإشارة الواضحة تكلف ضعف وقت التعافي.',
        ],
        outcome: 'تحول المنتج بعد ثمانية أشهر. غادر اثنان من ثلاثة مؤسسين. الشركة لا تزال تعمل بطاقة محدودة.',
        redactedSection: 'سبق للفريق التأسيسي جمع [محجوب] من منح [محجوب].',
      },
      {
        id: 'KF-0199',
        industry: 'اللوجستيات',
        stage: 'السلسلة A',
        year: '٢٠٢٢',
        failureMode: 'عزلة القيادة',
        tags: ['cofounder', 'scaling'],
        keyMistake: 'توقف الرئيس التنفيذي عن حضور مراجعة العمليات الأسبوعية في الشهر الثامن من نشر السلسلة A. وبحلول الشهر 14، طوّر فريق القيادة واقعاً موازياً يحمي الرئيس التنفيذي من الأخبار السيئة. حين طلب المجلس مراجعة تشغيلية للربع الثالث، انكشفت الفجوة بين الأداء المُبلَّغ والأداء الفعلي.',
        lessons: [
          'حين يتوقف المؤسس عن سماع الأخبار السيئة، ليس لأن الأمور تسير بخير.',
          'المسافة بين الرئيس التنفيذي وأرض العمليات تتناسب عكسياً مع جودة القرارات.',
          'مجلس إدارة يتلقى تقارير منقحة فقط لا يمارس رقابة — بل يُدار.',
        ],
        outcome: 'أُقيل الرئيس التنفيذي بقرار من المجلس بعد فشل السلسلة B. أُعيد هيكلة الشركة. الوضع الحالي: تعمل بـ60% من الفريق الأصلي.',
        redactedSection: 'ضم المجلس شركاء من [محجوب] و[محجوب].',
      },
      {
        id: 'KF-0234',
        industry: 'تكنولوجيا التعليم',
        stage: 'التمويل الأولي',
        year: '٢٠٢٣',
        failureMode: 'فشل تنفيذ المبيعات',
        tags: ['sales', 'burnrate'],
        keyMistake: 'استأجرت الشركة نائب رئيس للمبيعات من خلفية مؤسسية كبيرة لبيع منتج SaaS بـ99 دولاراً شهرياً للشركات الصغيرة. أوجد التباين بين منهجية المبيعات المؤسسية والدورة الفعلية للبيع فراغاً مدته 11 شهراً في توليد الإيرادات بينما ظل معدل الإنفاق ثابتاً.',
        lessons: [
          'توظيف فريق مبيعات على المستوى الخطأ يدمر معدل الإنفاق دون توليد إيرادات.',
          'نادراً ما ينجح محترفو المبيعات المؤسسية في بيئات الشركات الصغيرة دون إعادة تدريب جوهرية.',
          'أول نائب رئيس للمبيعات هو أعلى خطورة في شركة ناشئة بمرحلة التمويل الأولي.',
        ],
        outcome: 'غادر نائب الرئيس للمبيعات بعد 11 شهراً. استُؤنفت المبيعات بقيادة المؤسسين. تعافت الإيرادات لكن الرصيد التشغيلي تقلص بصورة دائمة.',
        redactedSection: undefined,
      },
    ],
  },
};

export const translations: Record<Lang, LangStrings> = { en, ar };
