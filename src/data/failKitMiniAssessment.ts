/**
 * failKitMiniAssessment — V1 question bank for the short, category-specific
 * mini assessment shown after a founder requests a Fail Kit.
 *
 * 5 multiple-choice questions per category. Answers are stored verbatim
 * (bilingual question + chosen option) as JSON in
 * `fail_kit_requests.mini_assessment_answers` for the admin team to review —
 * no scoring, no AI, no effect on Valley risk scoring.
 */

import type { FailKitCategory } from '@/lib/failKitMapping';

export interface MiniAssessmentOption {
  en: string;
  ar: string;
}

export interface MiniAssessmentQuestion {
  id: string;
  en: string;
  ar: string;
  options: MiniAssessmentOption[];
}

export const MINI_ASSESSMENT_QUESTIONS: Record<FailKitCategory, MiniAssessmentQuestion[]> = {

  'Founder Conflict': [
    {
      id: 'fc_cofounders',
      en: 'How many co-founders are currently active in the company?',
      ar: 'كم عدد الشركاء المؤسسين النشطين حالياً في الشركة؟',
      options: [
        { en: 'Just me — solo founder',           ar: 'أنا فقط — مؤسس منفرد' },
        { en: 'Two co-founders',                   ar: 'شريكان مؤسسان' },
        { en: 'Three or more co-founders',         ar: 'ثلاثة شركاء مؤسسين أو أكثر' },
        { en: 'A co-founder recently left',        ar: 'غادر أحد الشركاء مؤخراً' },
      ],
    },
    {
      id: 'fc_agreement',
      en: 'Do you have a written partnership / founders agreement?',
      ar: 'هل لديكم اتفاقية شراكة مكتوبة بين المؤسسين؟',
      options: [
        { en: 'Yes, signed and current',           ar: 'نعم، موقعة ومحدّثة' },
        { en: 'Yes, but outdated or informal',     ar: 'نعم، لكنها قديمة أو غير رسمية' },
        { en: 'No written agreement exists',       ar: 'لا توجد اتفاقية مكتوبة' },
        { en: "We've never discussed it",          ar: 'لم نناقش الموضوع من قبل' },
      ],
    },
    {
      id: 'fc_conflict',
      en: 'How would you describe the current level of conflict between founders?',
      ar: 'كيف تصف مستوى الخلاف الحالي بين المؤسسين؟',
      options: [
        { en: 'No real conflict',                  ar: 'لا يوجد خلاف فعلي' },
        { en: 'Occasional friction, manageable',   ar: 'احتكاك أحياناً، لكنه قابل للإدارة' },
        { en: 'Frequent, unresolved disagreements',ar: 'خلافات متكررة دون حل' },
        { en: 'Open conflict — trust has broken down', ar: 'خلاف علني — انعدمت الثقة' },
      ],
    },
    {
      id: 'fc_decisions',
      en: 'When founders disagree, how clear is the final decision-making process?',
      ar: 'عند اختلاف المؤسسين، ما مدى وضوح آلية اتخاذ القرار النهائي؟',
      options: [
        { en: 'Very clear — we have a defined process', ar: 'واضحة جداً — لدينا آلية محددة' },
        { en: 'Somewhat clear, rarely tested',          ar: 'واضحة نوعاً ما، نادراً ما تُختبر' },
        { en: 'Unclear — we improvise each time',       ar: 'غير واضحة — نرتجل في كل مرة' },
        { en: 'Decisions stall completely',             ar: 'القرارات تتوقف تماماً' },
      ],
    },
    {
      id: 'fc_role_tension',
      en: 'Is there tension between technical and business co-founders over direction?',
      ar: 'هل هناك توتر بين الشريك التقني والشريك التجاري حول وجهة الشركة؟',
      options: [
        { en: 'No — roles and direction are aligned', ar: 'لا — الأدوار والتوجه متوافقان' },
        { en: 'Minor disagreements on priorities',    ar: 'خلافات بسيطة حول الأولويات' },
        { en: 'Regular tension over roles or vision',  ar: 'توتر منتظم حول الأدوار أو الرؤية' },
        { en: 'Roles have broken down entirely',      ar: 'انهارت الأدوار بشكل كامل' },
      ],
    },
  ],

  'Cash Burn': [
    {
      id: 'cb_runway',
      en: 'How many months of runway does the company currently have?',
      ar: 'كم شهراً متبقياً من السيولة المالية (Runway) لدى الشركة؟',
      options: [
        { en: 'More than 12 months',  ar: 'أكثر من 12 شهراً' },
        { en: '6–12 months',          ar: '6 إلى 12 شهراً' },
        { en: '3–6 months',           ar: '3 إلى 6 أشهر' },
        { en: 'Less than 3 months',   ar: 'أقل من 3 أشهر' },
      ],
    },
    {
      id: 'cb_burn',
      en: 'How would you describe your monthly burn rate?',
      ar: 'كيف تصف معدل الحرق المالي الشهري لديك؟',
      options: [
        { en: 'Low and predictable',          ar: 'منخفض وقابل للتنبؤ' },
        { en: 'Manageable but rising',        ar: 'يمكن إدارته لكنه في ازدياد' },
        { en: 'High relative to our stage',   ar: 'مرتفع مقارنة بمرحلتنا' },
        { en: "I'm not fully sure what it is",ar: 'لست متأكداً تماماً من قيمته' },
      ],
    },
    {
      id: 'cb_revenue',
      en: 'What best describes your monthly revenue today?',
      ar: 'ما الذي يصف إيراداتك الشهرية الحالية بشكل أفضل؟',
      options: [
        { en: 'Covers most or all expenses',  ar: 'تغطي معظم أو كل المصاريف' },
        { en: 'Covers a small portion',       ar: 'تغطي جزءاً صغيراً منها' },
        { en: 'Little to no revenue yet',     ar: 'لا توجد إيرادات تُذكر حتى الآن' },
        { en: 'Revenue is shrinking',         ar: 'الإيرادات في تراجع' },
      ],
    },
    {
      id: 'cb_funding',
      en: 'What is currently funding the company?',
      ar: 'ما الذي يموّل الشركة حالياً؟',
      options: [
        { en: 'Revenue / self-sustaining',    ar: 'الإيرادات / تمويل ذاتي' },
        { en: 'Existing investor funding',    ar: 'تمويل من مستثمرين حاليين' },
        { en: "Founder's personal savings",   ar: 'مدخرات المؤسس الشخصية' },
        { en: 'Nothing — funds are nearly gone', ar: 'لا شيء — الأموال شارفت على النفاد' },
      ],
    },
    {
      id: 'cb_risk',
      en: 'What is the single largest risk to your cash position right now?',
      ar: 'ما أكبر خطر يهدد وضعك المالي حالياً؟',
      options: [
        { en: 'A large recurring cost',           ar: 'تكلفة كبيرة متكررة' },
        { en: 'Dependence on one client / payer', ar: 'الاعتماد على عميل أو جهة دفع واحدة' },
        { en: 'A stalled fundraise',              ar: 'توقف عملية جمع التمويل' },
        { en: 'Unpredictable / irregular spending',ar: 'إنفاق غير منتظم أو يصعب التنبؤ به' },
      ],
    },
  ],

  'Product Market Fit': [
    {
      id: 'pmf_users',
      en: 'How many active users or paying customers do you have today?',
      ar: 'كم عدد المستخدمين النشطين أو العملاء الذين يدفعون لديك حالياً؟',
      options: [
        { en: 'A strong, growing base',     ar: 'قاعدة قوية ومتنامية' },
        { en: 'A small but steady base',    ar: 'قاعدة صغيرة لكنها ثابتة' },
        { en: 'A handful of early users',   ar: 'عدد قليل من المستخدمين الأوائل' },
        { en: 'Almost none',                ar: 'لا يوجد تقريباً' },
      ],
    },
    {
      id: 'pmf_retention',
      en: 'Do users come back and keep using the product over time?',
      ar: 'هل يعود المستخدمون لاستخدام المنتج بشكل متكرر مع الوقت؟',
      options: [
        { en: 'Yes — strong repeat usage',   ar: 'نعم — استخدام متكرر وقوي' },
        { en: 'Some do, many drop off',      ar: 'البعض يعود، لكن كثيرين يتوقفون' },
        { en: 'Most try it once and leave',  ar: 'معظمهم يجرّبونه مرة واحدة ويغادرون' },
        { en: "We don't track this",         ar: 'لا نتابع هذا المؤشر' },
      ],
    },
    {
      id: 'pmf_feedback',
      en: 'When you talk to customers, how do they describe the problem you solve?',
      ar: 'عندما تتحدث إلى العملاء، كيف يصفون المشكلة التي تحلّونها؟',
      options: [
        { en: 'As a real, urgent problem',         ar: 'كمشكلة حقيقية وملحّة' },
        { en: 'As a "nice to have"',                ar: 'كأمر "إضافي وليس ضرورياً"' },
        { en: 'They struggle to articulate it',     ar: 'يجدون صعوبة في وصفها' },
        { en: "We rarely talk to customers",        ar: 'نادراً ما نتحدث إلى العملاء' },
      ],
    },
    {
      id: 'pmf_paid_demand',
      en: 'How willing are people to actually pay for what you offer?',
      ar: 'إلى أي مدى يبدي الناس استعداداً للدفع مقابل ما تقدّمونه؟',
      options: [
        { en: 'They pay readily and renew',     ar: 'يدفعون بسهولة ويجدّدون' },
        { en: 'They pay, but hesitantly',       ar: 'يدفعون، لكن بتردد' },
        { en: 'Mostly interest, rarely payment',ar: 'اهتمام فقط، نادراً ما يتحول لدفع' },
        { en: "We haven't asked for payment yet",ar: 'لم نطلب الدفع بعد' },
      ],
    },
    {
      id: 'pmf_barrier',
      en: 'What is the single biggest barrier to wider adoption right now?',
      ar: 'ما أكبر عائق أمام انتشار المنتج بشكل أوسع حالياً؟',
      options: [
        { en: 'Awareness — people don\'t know we exist', ar: 'الوعي — لا يعرف الناس بوجودنا' },
        { en: 'Trust — they\'re unsure it will work',     ar: 'الثقة — غير متأكدين من نجاحه' },
        { en: 'Price — it costs more than perceived value',ar: 'السعر — يفوق القيمة المتصوَّرة' },
        { en: 'Fit — the product doesn\'t match the need', ar: 'الملاءمة — المنتج لا يلبي الحاجة فعلياً' },
      ],
    },
  ],

  'Fundraising': [
    {
      id: 'fr_stage',
      en: 'What stage is your current fundraise at?',
      ar: 'في أي مرحلة تقع جولة التمويل الحالية؟',
      options: [
        { en: 'Not raising right now',         ar: 'لا نقوم بجمع تمويل حالياً' },
        { en: 'Early conversations',           ar: 'في مراحل نقاش مبكرة' },
        { en: 'Active pitching, no commitments yet', ar: 'نقدم العروض دون التزامات بعد' },
        { en: 'Close to closing, but stuck',   ar: 'قريبون من الإغلاق لكننا عالقون' },
      ],
    },
    {
      id: 'fr_feedback',
      en: 'What kind of feedback are you hearing from investors?',
      ar: 'ما نوع التعليقات التي تسمعونها من المستثمرين؟',
      options: [
        { en: 'Mostly positive, building momentum', ar: 'إيجابية في الغالب، وتبني زخماً' },
        { en: 'Polite interest, then silence',      ar: 'اهتمام مجامل، ثم صمت' },
        { en: 'Consistent, specific objections',    ar: 'اعتراضات محددة ومتكررة' },
        { en: 'We rarely get past the first call',  ar: 'نادراً ما نتجاوز المكالمة الأولى' },
      ],
    },
    {
      id: 'fr_runway',
      en: 'How much runway do you have left to close this round?',
      ar: 'كم تبقى من الوقت المالي لإغلاق هذه الجولة؟',
      options: [
        { en: 'More than 6 months',   ar: 'أكثر من 6 أشهر' },
        { en: '3–6 months',           ar: '3 إلى 6 أشهر' },
        { en: 'Less than 3 months',   ar: 'أقل من 3 أشهر' },
        { en: 'We are already out',   ar: 'لم يتبق شيء عملياً' },
      ],
    },
    {
      id: 'fr_pitch',
      en: 'How confident are you in your pitch and data room?',
      ar: 'ما مدى ثقتك في عرضك التقديمي وملفاتك الاستثمارية؟',
      options: [
        { en: 'Sharp, tested, and ready',        ar: 'واضح ومُختبر وجاهز' },
        { en: 'Decent, but needs refinement',    ar: 'جيد، لكنه يحتاج إلى تحسين' },
        { en: 'Inconsistent across meetings',    ar: 'غير متّسق بين الاجتماعات' },
        { en: "We don't have one ready",         ar: 'لا نملك عرضاً جاهزاً' },
      ],
    },
    {
      id: 'fr_concern',
      en: 'What is the single biggest concern investors raise about your company?',
      ar: 'ما أكبر مخاوف المستثمرين تجاه شركتك؟',
      options: [
        { en: 'Market size or timing',       ar: 'حجم السوق أو توقيت الدخول' },
        { en: 'The founding team',           ar: 'فريق التأسيس' },
        { en: 'Traction / proof of demand',  ar: 'الزخم / إثبات الطلب' },
        { en: 'Unclear path to revenue',     ar: 'غموض مسار تحقيق الإيرادات' },
      ],
    },
  ],

  'Team Issues': [
    {
      id: 'ti_size',
      en: 'How large is your current team (including founders)?',
      ar: 'ما حجم فريقك الحالي (بما فيهم المؤسسين)؟',
      options: [
        { en: 'Just the founder(s)',     ar: 'المؤسسون فقط' },
        { en: '2–5 people',              ar: '2 إلى 5 أشخاص' },
        { en: '6–15 people',             ar: '6 إلى 15 شخصاً' },
        { en: 'More than 15 people',     ar: 'أكثر من 15 شخصاً' },
      ],
    },
    {
      id: 'ti_key_person',
      en: 'If one key team member left tomorrow, what would happen?',
      ar: 'لو غادر أحد الأعضاء الأساسيين غداً، ماذا سيحدث؟',
      options: [
        { en: 'We would adapt without major issues', ar: 'سنتكيف دون مشاكل كبيرة' },
        { en: 'It would hurt, but we\'d recover',     ar: 'سيؤثر علينا، لكننا سنتعافى' },
        { en: 'It could seriously stall the company', ar: 'قد يوقف الشركة بشكل جدي' },
        { en: 'The company could not function',       ar: 'لن تستطيع الشركة الاستمرار' },
      ],
    },
    {
      id: 'ti_hiring',
      en: 'Where are the biggest gaps in your current team?',
      ar: 'أين تكمن أكبر الثغرات في فريقك الحالي؟',
      options: [
        { en: 'No major gaps right now',        ar: 'لا توجد ثغرات كبيرة حالياً' },
        { en: 'A senior leadership gap',        ar: 'ثغرة في القيادة العليا' },
        { en: 'A core technical / product gap', ar: 'ثغرة في الجانب التقني أو المنتج' },
        { en: 'Sales / growth capability gap',  ar: 'ثغرة في قدرات المبيعات أو النمو' },
      ],
    },
    {
      id: 'ti_accountability',
      en: 'How clear is ownership and accountability across the team?',
      ar: 'ما مدى وضوح الملكية والمسؤولية داخل الفريق؟',
      options: [
        { en: 'Very clear — everyone owns their area', ar: 'واضحة جداً — لكل شخص نطاقه' },
        { en: 'Mostly clear, some overlap',            ar: 'واضحة غالباً، مع بعض التداخل' },
        { en: 'Frequently unclear who owns what',      ar: 'غالباً غير واضح من المسؤول عن ماذا' },
        { en: 'Nobody truly owns outcomes',            ar: 'لا أحد يتحمل النتائج فعلياً' },
      ],
    },
    {
      id: 'ti_morale',
      en: 'How would you describe team morale right now?',
      ar: 'كيف تصف الروح المعنوية للفريق حالياً؟',
      options: [
        { en: 'High — energized and aligned',  ar: 'مرتفعة — متحمسون ومتفقون' },
        { en: 'Mixed — some strain visible',   ar: 'متفاوتة — هناك بعض التوتر الظاهر' },
        { en: 'Low — visible frustration',     ar: 'منخفضة — إحباط واضح' },
        { en: 'People are quietly leaving',    ar: 'البعض يغادر بهدوء' },
      ],
    },
  ],

  'Operations': [
    {
      id: 'op_process',
      en: 'How clear and documented are your core operating processes?',
      ar: 'ما مدى وضوح وتوثيق العمليات التشغيلية الأساسية لديكم؟',
      options: [
        { en: 'Clear and documented',          ar: 'واضحة وموثّقة' },
        { en: 'Mostly informal, in people\'s heads', ar: 'غير رسمية غالباً، في أذهان الناس فقط' },
        { en: 'Inconsistent — depends who you ask',  ar: 'غير متسقة — تختلف حسب من تسأل' },
        { en: "We're figuring it out as we go",      ar: 'نتعلم وننظّم أثناء العمل' },
      ],
    },
    {
      id: 'op_delays',
      en: 'How often do you experience delivery or fulfillment delays?',
      ar: 'كم مرة تواجهون تأخيراً في التسليم أو تنفيذ الخدمة؟',
      options: [
        { en: 'Rarely — we deliver on time',  ar: 'نادراً — نسلّم في الوقت المحدد' },
        { en: 'Occasionally, manageable',     ar: 'أحياناً، ويمكن التعامل معها' },
        { en: 'Frequently — it\'s a pattern',  ar: 'بشكل متكرر — أصبحت نمطاً' },
        { en: 'Constantly — customers notice', ar: 'باستمرار — والعملاء يلاحظون ذلك' },
      ],
    },
    {
      id: 'op_support',
      en: 'How are customer support issues currently handled?',
      ar: 'كيف تُدار مشاكل دعم العملاء حالياً؟',
      options: [
        { en: 'Smoothly, with a clear process', ar: 'بسلاسة وبآلية واضحة' },
        { en: 'Reactively, case by case',       ar: 'بشكل تفاعلي، حالة بحالة' },
        { en: 'Often slips through the cracks', ar: 'كثيراً ما تُهمل أو تُنسى' },
        { en: 'We don\'t have a real process',  ar: 'لا توجد آلية فعلية لذلك' },
      ],
    },
    {
      id: 'op_overload',
      en: 'How much of the day-to-day operation depends directly on the founder?',
      ar: 'إلى أي مدى تعتمد العمليات اليومية على المؤسس بشكل مباشر؟',
      options: [
        { en: 'Little — the team runs it',          ar: 'بشكل محدود — الفريق يديرها' },
        { en: 'Some — founder steps in often',      ar: 'إلى حد ما — المؤسس يتدخل كثيراً' },
        { en: 'Heavily — little moves without them',ar: 'بشكل كبير — لا شيء يتحرك بدونه' },
        { en: 'Entirely — the founder is the bottleneck', ar: 'بالكامل — المؤسس هو عنق الزجاجة' },
      ],
    },
    {
      id: 'op_bottleneck',
      en: 'What is the single biggest operational bottleneck right now?',
      ar: 'ما أكبر عائق تشغيلي يواجهكم حالياً؟',
      options: [
        { en: 'Manual, repetitive work',        ar: 'العمل اليدوي المتكرر' },
        { en: 'Tools that don\'t talk to each other', ar: 'أدوات لا تتكامل مع بعضها' },
        { en: 'Unclear handoffs between people',ar: 'غموض في تسليم المهام بين الأفراد' },
        { en: 'Lack of basic systems entirely',  ar: 'غياب أنظمة أساسية بشكل كامل' },
      ],
    },
  ],
};
