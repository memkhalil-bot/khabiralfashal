import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Resource {
  titleEn: string;
  titleAr: string;
  whyEn: string;
  whyAr: string;
  immediateEn: string[];
  immediateAr: string[];
  ctaEn: string;
  ctaAr: string;
}

const RESOURCES: Record<string, Resource> = {
  'Financial denial': {
    titleEn: 'Runway Protection Checklist',
    titleAr: 'قائمة حماية الرصيد التشغيلي',
    whyEn: 'Financial denial is the single most common precursor to sudden collapse. Founders who avoid their cash flow spreadsheet are making a decision — even if they pretend they are not.',
    whyAr: 'إنكار الوضع المالي هو الأكثر شيوعاً في سلوك ما قبل الانهيار. المؤسس الذي يتجنب جدول التدفق النقدي يتخذ قراراً — وإن ادّعى غير ذلك.',
    immediateEn: [
      'Open your cash flow spreadsheet right now. Today. Not tomorrow.',
      'Calculate your true runway: current cash ÷ monthly burn = months remaining.',
      'Identify your top 3 expenses. Ask: which of these can be renegotiated in 30 days?',
      'Write down the number. Say it out loud. Share it with one person.',
    ],
    immediateAr: [
      'افتح جدول التدفق النقدي الآن. اليوم. وليس غداً.',
      'احسب رصيدك الفعلي: النقد الحالي ÷ الإنفاق الشهري = الأشهر المتبقية.',
      'حدد أعلى ثلاثة مصاريف. اسأل: أيّها يمكن إعادة التفاوض عليه خلال 30 يوماً؟',
      'اكتب الرقم. قُله بصوت عالٍ. شاركه مع شخص واحد.',
    ],
    ctaEn: 'Download Runway Checklist',
    ctaAr: 'تحميل قائمة الرصيد التشغيلي',
  },
  'Leadership isolation': {
    titleEn: 'Founder Decision Framework',
    titleAr: 'إطار قرارات المؤسس',
    whyEn: 'Leadership isolation means your decisions are being made with incomplete information. Your team has stopped telling you the truth — and you may have stopped creating conditions for them to do so.',
    whyAr: 'عزلة القيادة تعني اتخاذ قراراتك بمعلومات منقوصة. توقف فريقك عن إخبارك بالحقيقة — وربما كنت أنت من أوقف ذلك.',
    immediateEn: [
      'Schedule a 30-minute "honest read" meeting with your most trusted team member this week.',
      'Ask them one question: "What am I not seeing that I should be seeing?"',
      'Do not defend, explain, or interrupt. Only listen and take notes.',
      'Repeat this every two weeks. Make it a system, not a one-time event.',
    ],
    immediateAr: [
      'احجز اجتماعاً مدته 30 دقيقة مع أكثر أعضاء فريقك ثقة هذا الأسبوع.',
      'اطرح عليه سؤالاً واحداً: "ما الذي لا أراه وينبغي أن أراه؟"',
      'لا تدافع ولا تبرر ولا تقاطع. استمع فقط وسجّل.',
      'كرر ذلك كل أسبوعين. حوّله إلى نظام، لا حدثاً مرة واحدة.',
    ],
    ctaEn: 'Download Decision Framework',
    ctaAr: 'تحميل إطار القرارات',
  },
  'Decision paralysis': {
    titleEn: 'Founder Decision Framework',
    titleAr: 'إطار قرارات المؤسس',
    whyEn: 'Delayed decisions compound risk. Every hard decision you have been avoiding is currently accruing interest — in burn rate, team morale, and market position.',
    whyAr: 'القرارات المؤجلة تضاعف المخاطر. كل قرار صعب تتجنبه الآن يتراكم فائدته — في معدل الإنفاق، وروح الفريق، والموقع السوقي.',
    immediateEn: [
      'Write down the one decision you have been avoiding the longest.',
      'Set a decision deadline: 72 hours from now.',
      'Identify what information you actually need vs. what you are using as a delay excuse.',
      'Make the decision. Imperfect action beats perfect inaction.',
    ],
    immediateAr: [
      'اكتب القرار الذي تجنبته أطول مدة.',
      'حدد موعداً نهائياً للقرار: 72 ساعة من الآن.',
      'حدد المعلومات التي تحتاجها فعلاً مقابل ما تستخدمه كعذر للتأجيل.',
      'اتخذ القرار. العمل الناقص أفضل من التقاعس التام.',
    ],
    ctaEn: 'Download Decision Framework',
    ctaAr: 'تحميل إطار القرارات',
  },
  'Concentration risk': {
    titleEn: 'Revenue Recovery Framework',
    titleAr: 'إطار تعافي الإيرادات',
    whyEn: 'Concentration risk means your entire business is one client, investor, or partnership away from collapse. Diversification is not a growth strategy — it is a survival requirement.',
    whyAr: 'مخاطر التركّز تعني أن مشروعك كله يقف على عميل واحد أو مستثمر واحد أو شراكة واحدة. التنويع ليس استراتيجية نمو — إنه شرط بقاء.',
    immediateEn: [
      'Map your revenue: what percentage comes from your top 3 sources?',
      'If any single source is >40% of revenue, you have a concentration problem.',
      'Identify three alternative revenue sources you can activate within 60 days.',
      'Start activating one of them this week — even if it is uncomfortable.',
    ],
    immediateAr: [
      'رسم خريطة إيراداتك: ما نسبة ما تأتي من أعلى 3 مصادر؟',
      'إن كان أي مصدر واحد >40% من الإيرادات، فلديك مشكلة تركّز.',
      'حدد ثلاثة مصادر إيراد بديلة يمكن تفعيلها خلال 60 يوماً.',
      'ابدأ في تفعيل أحدها هذا الأسبوع — حتى لو كان ذلك مزعجاً.',
    ],
    ctaEn: 'Download Revenue Framework',
    ctaAr: 'تحميل إطار الإيرادات',
  },
  'Burnout proximity': {
    titleEn: 'Founder Decision Framework',
    titleAr: 'إطار قرارات المؤسس',
    whyEn: 'Founder burnout is not a personal weakness — it is an organizational risk. When the founder cannot think clearly, the company cannot decide clearly.',
    whyAr: 'احتراق المؤسس ليس ضعفاً شخصياً — إنه خطر تنظيمي. حين لا يفكر المؤسس بوضوح، لا تستطيع الشركة أن تقرر بوضوح.',
    immediateEn: [
      'Identify one thing on your plate that can be delegated or dropped today.',
      'Schedule 4 hours of completely protected thinking time this week.',
      'Have one honest conversation with someone who has seen a company fail.',
      'Your job is to protect your decision-making capacity. Everything else follows.',
    ],
    immediateAr: [
      'حدد شيئاً واحداً في قائمتك يمكن تفويضه أو إلغاؤه اليوم.',
      'احجز 4 ساعات من وقت التفكير المحمي تماماً هذا الأسبوع.',
      'أجرِ محادثة صادقة مع شخص رأى شركة تفشل.',
      'مهمتك هي حماية قدرتك على اتخاذ القرارات. كل شيء آخر يتبع.',
    ],
    ctaEn: 'Download Decision Framework',
    ctaAr: 'تحميل إطار القرارات',
  },
  'Identity fusion': {
    titleEn: 'Founder Decision Framework',
    titleAr: 'إطار قرارات المؤسس',
    whyEn: 'When the company becomes your identity, every business decision becomes a personal threat. You stop being able to see problems clearly because seeing them clearly would mean seeing yourself clearly.',
    whyAr: 'حين تصبح الشركة هويتك، يصبح كل قرار تجاري تهديداً شخصياً. تفقد القدرة على رؤية المشاكل بوضوح لأن رؤيتها بوضوح يعني رؤية نفسك بوضوح.',
    immediateEn: [
      'Write one sentence: "If this company fails, I will still be..."',
      'Complete that sentence with three true things about yourself.',
      'Share that sentence with someone who knew you before this company.',
      'The company is a vehicle. You are the driver.',
    ],
    immediateAr: [
      'اكتب جملة واحدة: "إن فشلت هذه الشركة، سأظل..."',
      'أكملها بثلاثة أشياء حقيقية عن نفسك.',
      'شاركها مع شخص عرفك قبل هذه الشركة.',
      'الشركة وسيلة. أنت من يقودها.',
    ],
    ctaEn: 'Download Decision Framework',
    ctaAr: 'تحميل إطار القرارات',
  },
  'Founder denial': {
    titleEn: 'Crisis Co-Founder Alignment Guide',
    titleAr: 'دليل محاذاة المؤسسين في الأزمات',
    whyEn: 'Founder denial is often the last defense mechanism before a catastrophic decision. The warning signs are clear to everyone around you — and invisible to you.',
    whyAr: 'إنكار المؤسس كثيراً ما يكون آخر آليات الدفاع قبل القرار الكارثي. الإشارات التحذيرية واضحة لمن حولك — وغائبة عنك.',
    immediateEn: [
      'Ask five people who work with you: "What is the one thing about the company you have stopped telling me?"',
      'Listen to every answer without defending yourself.',
      'Identify the pattern across the five answers.',
      'That pattern is the truth you have been avoiding.',
    ],
    immediateAr: [
      'اسأل خمسة أشخاص يعملون معك: "ما الشيء الواحد عن الشركة الذي توقفت عن إخباري به؟"',
      'استمع إلى كل إجابة دون الدفاع عن نفسك.',
      'حدد النمط المشترك في الإجابات الخمس.',
      'ذلك النمط هو الحقيقة التي تجنبتها.',
    ],
    ctaEn: 'Download Alignment Guide',
    ctaAr: 'تحميل دليل المحاذاة',
  },
  'No exit plan': {
    titleEn: 'Revenue Recovery Framework',
    titleAr: 'إطار تعافي الإيرادات',
    whyEn: 'Having no written Plan B is not courage — it is risk management failure. The best time to build an exit plan is before you need one. You are past that point.',
    whyAr: 'غياب خطة بديلة مكتوبة ليس شجاعة — إنه إخفاق في إدارة المخاطر. أفضل وقت لبناء خطة خروج هو قبل الحاجة إليها. لقد تجاوزت ذلك الوقت.',
    immediateEn: [
      'Write down three scenarios: soft pivot, hard pivot, wind-down.',
      'For each scenario: who would you call first? What would you do in the first 48 hours?',
      'Share this document with one trusted person outside the company.',
      'Having a Plan B does not mean you plan to use it. It means you plan to survive.',
    ],
    immediateAr: [
      'اكتب ثلاثة سيناريوهات: تحول ناعم، تحول حاد، إغلاق منظم.',
      'لكل سيناريو: من ستتصل به أولاً؟ ماذا ستفعل في أول 48 ساعة؟',
      'شارك هذا المستند مع شخص موثوق خارج الشركة.',
      'وجود خطة بديلة لا يعني أنك تنوي استخدامها. يعني أنك تنوي البقاء.',
    ],
    ctaEn: 'Download Recovery Framework',
    ctaAr: 'تحميل إطار التعافي',
  },
};

const DEFAULT_RESOURCE: Resource = {
  titleEn: 'Founder Survival Toolkit',
  titleAr: 'أدوات نجاة المؤسس',
  whyEn: 'Multiple risk patterns are active simultaneously. This is a compounded risk scenario. Your next 30 days of decisions will determine whether this becomes manageable or irreversible.',
  whyAr: 'أنماط مخاطر متعددة نشطة في آن واحد. هذا سيناريو مخاطر مركّبة. قرارات الثلاثين يوماً القادمة ستحدد إن كان الأمر قابلاً للإدارة أم لا.',
  immediateEn: [
    'Do not try to fix everything at once. Identify your single highest-risk item.',
    'Allocate 2 focused hours per day to that one item only.',
    'Stop making any new major commitments until the primary risk is stabilized.',
    'Book the diagnostic session. You cannot treat what you have not diagnosed.',
  ],
  immediateAr: [
    'لا تحاول إصلاح كل شيء دفعة واحدة. حدد عنصر المخاطرة الأعلى.',
    'خصص ساعتين مركّزتين يومياً لذلك العنصر فقط.',
    'توقف عن أي التزامات جديدة كبرى حتى يستقر الخطر الأساسي.',
    'احجز جلسة التشخيص. لا يمكنك علاج ما لم تشخّصه.',
  ],
  ctaEn: 'Download Survival Toolkit',
  ctaAr: 'تحميل أدوات النجاة',
};

interface FirstAidKitProps {
  dominantBlindSpot?: string | null;
  isRTL: boolean;
}

export function FirstAidKit({ dominantBlindSpot, isRTL }: FirstAidKitProps) {
  const resource = (dominantBlindSpot && RESOURCES[dominantBlindSpot]) || DEFAULT_RESOURCE;

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-56px' }}
      transition={{ duration: 0.95, ease: [0.16, 1, 0.3, 1] }}
      className={cn('border-t border-white/[0.07] pt-16 pb-20', isRTL && 'text-right')}
    >
      <p className={cn('text-[10px] uppercase text-ember mb-8', isRTL ? 'font-arabic tracking-normal text-sm' : 'tracking-[0.42em]')}>
        {isRTL ? 'إسعافات أولية للمؤسس' : 'Startup First Aid Kit'}
      </p>

      <div className="border border-white/[0.08] bg-white/[0.015] p-8 md:p-10 max-w-2xl">
        <h3 className={cn('text-2xl md:text-3xl tracking-tight mb-6', isRTL ? 'font-arabic font-bold leading-[1.4]' : 'font-serif-display')}>
          {isRTL ? resource.titleAr : resource.titleEn}
        </h3>
        <p className={cn('text-base text-white/60 font-light leading-relaxed mb-8', isRTL ? 'font-arabic leading-[2]' : undefined)}>
          {isRTL ? resource.whyAr : resource.whyEn}
        </p>

        <div className="mb-8">
          <p className={cn('text-[9px] uppercase text-white/28 mb-4', isRTL ? 'font-arabic tracking-normal text-xs' : 'tracking-[0.3em]')}>
            {isRTL ? 'ما يجب فعله الآن' : 'What to do immediately'}
          </p>
          <ul className="space-y-3">
            {(isRTL ? resource.immediateAr : resource.immediateEn).map((step, i) => (
              <li key={i} className={cn('flex items-start gap-4', isRTL && 'flex-row-reverse')}>
                <span className={cn('text-ember/40 flex-shrink-0 tabular-nums text-xs mt-0.5', isRTL ? 'font-arabic' : 'font-serif-display')}>{String(i + 1).padStart(2, '0')}</span>
                <p className={cn('text-sm text-white/65 font-light leading-relaxed', isRTL ? 'font-arabic leading-[2]' : undefined)}>{step}</p>
              </li>
            ))}
          </ul>
        </div>

        <button
          className={cn(
            'inline-flex items-center gap-3 border border-white/15 hover:border-white/30 px-6 py-3 transition-all duration-300 text-sm text-white/40 cursor-not-allowed',
            isRTL ? 'font-arabic flex-row-reverse' : 'uppercase tracking-[0.2em]'
          )}
          disabled
          aria-label={isRTL ? 'قريباً' : 'Coming soon'}
          data-download-key={dominantBlindSpot?.toLowerCase().replace(/\s/g, '-') ?? 'default'}
        >
          {isRTL ? resource.ctaAr : resource.ctaEn}
        </button>
        <p className={cn('mt-3 text-[9px] text-white/20', isRTL ? 'font-arabic text-xs' : 'uppercase tracking-[0.2em]')}>
          {isRTL ? 'سيتوفر قريباً' : 'Available soon'}
        </p>
      </div>
    </motion.section>
  );
}
