import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronDown, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useT } from '@/hooks/useT';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { AssessmentResult } from './AssessmentResult';
import { COUNTRIES_SORTED } from '@/data/valleyCountries';

// ── Types ─────────────────────────────────────────────────────────────────────

type Stage = 'gate' | 'warning' | 'quiz' | 'analyzing' | 'result';

interface BinaryQ {
  id: string;
  en: string;
  ar: string;
  yesRisky: boolean; // true → Yes=5 No=1; false → Yes=1 No=5
  blindSpot?: string;
  blindSpotAr?: string;
}

// ── 12 Bilingual Yes/No Questions ─────────────────────────────────────────────

const QUESTIONS: BinaryQ[] = [
  { id: 'q01', en: 'Is your cash runway less than 3 months?',                               ar: 'هل مدة بقاء نقدك أقل من 3 أشهر؟',                                            yesRisky: true,  blindSpot: 'Financial denial',       blindSpotAr: 'إنكار الوضع المالي' },
  { id: 'q02', en: 'Do you avoid opening your cash flow sheet?',                             ar: 'هل تتجنّب فتح جدول التدفق النقدي؟',                                           yesRisky: true,  blindSpot: 'Financial denial',       blindSpotAr: 'إنكار الوضع المالي' },
  { id: 'q03', en: 'Has your team stopped giving you honest feedback?',                      ar: 'هل توقّف فريقك عن إعطائك تغذية راجعة صادقة؟',                                yesRisky: true,  blindSpot: 'Leadership isolation',   blindSpotAr: 'عزلة القيادة' },
  { id: 'q04', en: 'Is there a hard decision you have been avoiding for months?',            ar: 'هل هناك قرار صعب أجّلتَه لأشهر؟',                                            yesRisky: true,  blindSpot: 'Decision paralysis',     blindSpotAr: 'شلل القرار' },
  { id: 'q05', en: 'Does losing one client or investor mean collapse?',                      ar: 'هل فقدان عميل واحد أو مستثمر يعني الانهيار؟',                                yesRisky: true,  blindSpot: 'Concentration risk',     blindSpotAr: 'مخاطر التركّز' },
  { id: 'q06', en: 'Has your sleep deteriorated significantly in the last month?',           ar: 'هل تدهور نومك بشكل ملحوظ خلال الشهر الماضي؟',                               yesRisky: true,  blindSpot: 'Burnout proximity',      blindSpotAr: 'قرب الاحتراق' },
  { id: 'q07', en: 'Do you feel the company has become your entire identity?',               ar: 'هل تشعر أن الشركة أصبحت هويتك بالكامل؟',                                     yesRisky: true,  blindSpot: 'Identity fusion',        blindSpotAr: 'الاندماج مع الهوية' },
  { id: 'q08', en: 'Is the company burning more than it earns with no break-even in sight?', ar: 'هل تحرق الشركة أكثر مما تكسب دون مسار واضح للتعادل؟',                     yesRisky: true,  blindSpot: 'Financial denial',       blindSpotAr: 'إنكار الوضع المالي' },
  { id: 'q09', en: 'Has a co-founder or key person left in the last 3 months?',              ar: 'هل غادر شريك مؤسس أو عضو فريق أساسي خلال الأشهر الثلاثة الماضية؟',         yesRisky: true,  blindSpot: 'Leadership isolation',   blindSpotAr: 'عزلة القيادة' },
  { id: 'q10', en: 'Have honest conversations about the company\'s problems become rare?',   ar: 'هل أصبحت المحادثات الصادقة حول مشاكل الشركة نادرة؟',                         yesRisky: true,  blindSpot: 'Leadership isolation',   blindSpotAr: 'عزلة القيادة' },
  { id: 'q11', en: 'When someone warns you about the company, do you get defensive?',        ar: 'حين يحذّرك أحد بشأن الشركة، هل تدافع فوراً؟',                                yesRisky: true,  blindSpot: 'Founder denial',         blindSpotAr: 'إنكار المؤسس' },
  { id: 'q12', en: 'Do you have a real written Plan B if the company fails?',                ar: 'هل لديك خطة بديلة مكتوبة حقيقية إن فشلت الشركة؟',                            yesRisky: false, blindSpot: 'No exit plan',           blindSpotAr: 'غياب خطة الخروج' },
];

// ── Dropdown data ─────────────────────────────────────────────────────────────

const SECTORS = {
  en: ['Technology','SaaS','Fintech','E-commerce','Healthcare','Education',
       'Manufacturing','Retail','Food & Beverage','Logistics','Construction',
       'Marketing','Media','Other'],
  ar: ['التكنولوجيا','برمجيات كخدمة (SaaS)','التكنولوجيا المالية',
       'التجارة الإلكترونية','الرعاية الصحية','التعليم','التصنيع',
       'التجزئة','الأغذية والمشروبات','اللوجستيات','البناء والتشييد',
       'التسويق','الإعلام','أخرى'],
};

const STAGES = {
  en: ['Pre-Idea','Idea','MVP','Pre-Seed','Seed','Early Revenue','Growth','Scale'],
  ar: ['ما قبل الفكرة','فكرة','النموذج الأولي','ما قبل التمويل الأولي',
       'التمويل الأولي','إيرادات مبكرة','نمو','توسع'],
};

const EMPLOYEES = {
  en: ['Founder Only','2–5','6–10','11–25','26–50','51+'],
  ar: ['المؤسس فقط','٢–٥','٦–١٠','١١–٢٥','٢٦–٥٠','٥١ فأكثر'],
};

// ── Arabic level display labels ────────────────────────────────────────────────

const LEVEL_LABELS_AR: Record<string, string> = {
  'STABLE':             'مستقر',
  'EXPOSED':            'مكشوف',
  'INSIDE THE VALLEY':  'داخل الوادي',
  'COLLAPSE PROXIMITY': 'على حافة الانهيار',
};

// ── Validation ────────────────────────────────────────────────────────────────

const FAKE_NAMES = new Set(['test','admin','user','name','anon','fake','null',
  'undefined','hello','asdf','qwer','zxcv','abc','xyz','aaa','bbb','xxx','yyy',
  'zzz','123','000','مستخدم','اسم','اختبار','مجهول']);

const DISPOSABLE = new Set(['test.com','example.com','mailinator.com',
  'guerrillamail.com','yopmail.com','tempmail.com','throwaway.email',
  'fakeinbox.com','trashmail.com','10minutemail.com','temp-mail.org',
  'maildrop.cc','spamgourmet.com','dispostable.com']);

function validateName(name: string, ar: boolean): string | null {
  const n = name.trim();
  if (n.length < 2) return ar ? 'أدخل اسمك الحقيقي' : 'Enter your real name';
  if (!/[a-zA-Z؀-ۿ]/.test(n)) return ar ? 'يجب أن يحتوي الاسم على أحرف' : 'Name must contain letters';
  if (/(.)\1{3,}/.test(n.toLowerCase())) return ar ? 'الاسم يبدو غير حقيقي' : 'Name does not look real';
  if (new Set(n.toLowerCase().replace(/\s/g, '')).size < 2) return ar ? 'الاسم يبدو غير حقيقي' : 'Name does not look real';
  if (FAKE_NAMES.has(n.toLowerCase().replace(/\s/g, ''))) return ar ? 'أدخل اسمك الحقيقي' : 'Enter your real name';
  return null;
}

function validateEmail(email: string, ar: boolean): string | null {
  const e = email.trim().toLowerCase();
  if (!e) return ar ? 'البريد الإلكتروني مطلوب' : 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)) return ar ? 'أدخل بريداً إلكترونياً صحيحاً' : 'Enter a valid email';
  const [local, domain] = e.split('@');
  if (DISPOSABLE.has(domain)) return ar ? 'الرجاء استخدام بريد إلكتروني حقيقي' : 'Please use a real email';
  if (local.length < 3) return ar ? 'البريد الإلكتروني يبدو غير صحيح' : 'Email looks invalid';
  if (/(.)\1{4,}/.test(local)) return ar ? 'البريد الإلكتروني يبدو غير حقيقي' : 'Email does not look real';
  return null;
}

// ── Score / Classify ──────────────────────────────────────────────────────────

function classify(score: number, max: number, verdicts: Record<string, { title: string; insight: string }>) {
  const pct = Math.round((score / max) * 100);
  if (pct < 30) return { level: 'STABLE',             title: verdicts['STABLE']?.title ?? '',             tone: 'text-emerald-400', insight: verdicts['STABLE']?.insight ?? '' };
  if (pct < 55) return { level: 'EXPOSED',            title: verdicts['EXPOSED']?.title ?? '',            tone: 'text-amber-400',   insight: verdicts['EXPOSED']?.insight ?? '' };
  if (pct < 78) return { level: 'INSIDE THE VALLEY',  title: verdicts['INSIDE THE VALLEY']?.title ?? '',  tone: 'text-ember',       insight: verdicts['INSIDE THE VALLEY']?.insight ?? '' };
  return          { level: 'COLLAPSE PROXIMITY', title: verdicts['COLLAPSE PROXIMITY']?.title ?? '', tone: 'text-red-500',     insight: verdicts['COLLAPSE PROXIMITY']?.insight ?? '' };
}

// ── Image-calibrated path waypoints (1672×941 coordinate space) ──────────────

interface PathPt { t01: number; cx: number; cy: number }
const PATH_KEYFRAMES: PathPt[] = [
  { t01: 0.00, cx: 161,  cy: 325 },
  { t01: 0.10, cx: 201,  cy: 341 },
  { t01: 0.30, cx: 454,  cy: 436 },
  { t01: 0.45, cx: 649,  cy: 567 },
  { t01: 0.50, cx: 836,  cy: 820 },
  { t01: 0.70, cx: 1097, cy: 517 },
  { t01: 0.90, cx: 1430, cy: 409 },
  { t01: 1.00, cx: 1436, cy: 401 },
];

function pathAt(t01: number): { cx: number; cy: number } {
  const ct = Math.max(0, Math.min(1, t01));
  for (let i = 0; i < PATH_KEYFRAMES.length - 1; i++) {
    const k0 = PATH_KEYFRAMES[i], k1 = PATH_KEYFRAMES[i + 1];
    if (ct <= k1.t01) {
      const raw = (ct - k0.t01) / (k1.t01 - k0.t01);
      const s = raw * raw * (3 - 2 * raw);
      return { cx: k0.cx + (k1.cx - k0.cx) * s, cy: k0.cy + (k1.cy - k0.cy) * s };
    }
  }
  const last = PATH_KEYFRAMES[PATH_KEYFRAMES.length - 1];
  return { cx: last.cx, cy: last.cy };
}

function finalT01(pct: number): number {
  if (pct < 30) return 0.90;
  if (pct < 55) return 0.75;
  return 0.50;
}
function finalSink(pct: number): number {
  return pct >= 78 ? 40 : 0;
}

// Build SVG polyline points along path segment
function pathPoints(fromT: number, toT: number, steps = 16): string {
  const pts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = fromT + (toT - fromT) * (i / steps);
    const { cx, cy } = pathAt(t);
    pts.push(`${cx.toFixed(1)},${cy.toFixed(1)}`);
  }
  return pts.join(' ');
}

// ── Searchable Country Combobox ───────────────────────────────────────────────

function CountryCombobox({ value, onChange, isRTL, error }: {
  value: string;
  onChange: (v: string) => void;
  isRTL: boolean;
  error?: string;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = COUNTRIES_SORTED.find(c => c.en === value);
  const display = selected ? (isRTL ? selected.ar : selected.en) : '';

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return COUNTRIES_SORTED.filter(c =>
      c.en.toLowerCase().includes(q) || c.ar.includes(query)
    );
  }, [query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false); setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div
        className={cn(
          'cinematic-input flex items-center gap-2 cursor-pointer',
          isRTL && 'flex-row-reverse',
        )}
        onClick={() => { setOpen(o => !o); if (!open) { setQuery(''); setTimeout(() => inputRef.current?.focus(), 50); } }}
      >
        <input
          ref={inputRef}
          value={open ? query : display}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          placeholder={isRTL ? 'ابحث عن الدولة…' : 'Search country…'}
          className={cn('flex-1 bg-transparent outline-none text-white/85 placeholder-white/28', isRTL && 'text-right')}
          readOnly={!open}
          onFocus={() => { setQuery(''); setOpen(true); }}
        />
        <ChevronDown className={cn('size-3.5 text-white/30 flex-shrink-0 transition-transform', open && 'rotate-180')} />
      </div>
      {error && <p className={cn('mt-1.5 text-xs text-ember', isRTL && 'font-arabic text-right')}>{error}</p>}
      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute top-full mt-1 left-0 right-0 z-[80] bg-zinc-950 border border-white/10 max-h-52 overflow-y-auto"
          >
            {filtered.length === 0 ? (
              <li className={cn('px-4 py-3 text-white/38 text-sm', isRTL && 'text-right font-arabic')}>
                {isRTL ? 'لا توجد نتائج' : 'No results'}
              </li>
            ) : filtered.map(c => (
              <li
                key={c.en}
                onMouseDown={e => { e.preventDefault(); onChange(c.en); setOpen(false); setQuery(''); }}
                className={cn(
                  'px-4 py-2.5 text-sm text-white/70 hover:bg-white/[0.06] hover:text-white cursor-pointer transition-colors',
                  value === c.en && 'text-ember',
                  isRTL && 'text-right font-arabic',
                )}
              >
                {isRTL ? c.ar : c.en}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── City Dropdown ─────────────────────────────────────────────────────────────

function CitySelect({ countryKey, value, onChange, isRTL, error }: {
  countryKey: string;
  value: string;
  onChange: (v: string) => void;
  isRTL: boolean;
  error?: string;
}) {
  const country = COUNTRIES_SORTED.find(c => c.en === countryKey);
  const cities = country?.cities ?? [];

  useEffect(() => { if (countryKey) onChange(''); }, [countryKey]); // eslint-disable-line

  return (
    <div>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={!countryKey}
          className={cn(
            'cinematic-input appearance-none w-full pr-8 disabled:opacity-35 disabled:cursor-not-allowed',
            isRTL && 'text-right pl-8 pr-4',
            !value && 'text-white/38',
          )}
        >
          <option value="">{isRTL ? 'اختر المدينة' : 'Select city'}</option>
          {cities.map(city => (
            <option key={city.en} value={city.en}>{isRTL ? city.ar : city.en}</option>
          ))}
        </select>
        <ChevronDown className={cn('pointer-events-none absolute top-1/2 -translate-y-1/2 size-3.5 text-white/30', isRTL ? 'left-3' : 'right-3')} />
      </div>
      {error && <p className={cn('mt-1.5 text-xs text-ember', isRTL && 'font-arabic text-right')}>{error}</p>}
    </div>
  );
}

// ── Generic Dropdown ──────────────────────────────────────────────────────────

function DropSelect({ options, value, onChange, placeholder, isRTL, error }: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  isRTL: boolean;
  error?: string;
}) {
  return (
    <div>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className={cn(
            'cinematic-input appearance-none w-full pr-8',
            isRTL && 'text-right pl-8 pr-4',
            !value && 'text-white/38',
          )}
        >
          <option value="">{placeholder}</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown className={cn('pointer-events-none absolute top-1/2 -translate-y-1/2 size-3.5 text-white/30', isRTL ? 'left-3' : 'right-3')} />
      </div>
      {error && <p className={cn('mt-1.5 text-xs text-ember', isRTL && 'font-arabic text-right')}>{error}</p>}
    </div>
  );
}

// ── Form field wrapper ────────────────────────────────────────────────────────

function Field({ label, required, isRTL, children }: {
  label: string; required?: boolean; isRTL: boolean; children: React.ReactNode;
}) {
  return (
    <div>
      <label className={cn(
        'block text-white/38 mb-2',
        isRTL ? 'font-arabic text-sm text-right' : 'text-[10px] uppercase tracking-[0.3em]',
      )}>
        {label}{required && <span className="text-ember ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

// ── Valley Visual — image hero + transparent marker overlay ──────────────────

function ValleyVisual({
  markerY, markerCx, tension, isDanger, markerActive, isRTL,
  nodeFlash, startGlow, dispT01,
}: {
  markerY: number; markerCx: number;
  tension: number; isDanger: boolean;
  markerActive: boolean; isRTL: boolean;
  nodeFlash: 'safe' | 'risky' | null;
  startGlow: boolean;
  dispT01: number;
}) {
  // Marker color driven by flash state → zone
  const markerFill =
    startGlow         ? '#ffffff'
    : nodeFlash === 'safe'  ? 'hsl(142 76% 55%)'
    : nodeFlash === 'risky' ? 'hsl(0 84% 60%)'
    : isDanger              ? 'hsl(0 84% 60%)'
    :                         'hsl(18 92% 55%)';

  const glowColor =
    startGlow         ? '0 0% 100%'
    : nodeFlash === 'safe'  ? '142 76% 55%'
    : nodeFlash === 'risky' ? '0 84% 60%'
    : isDanger              ? '0 84% 60%'
    :                         '18 92% 55%';

  // Zone boundaries for path trail
  const DESCENT_END = 0.45;
  const FLOOR_END   = 0.55;

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ paddingBottom: 'min(56.28%, 52vh)', minHeight: '180px' }}
    >
      <div className="absolute inset-0">
        {/* Hero image */}
        <img
          src={isRTL ? '/valley-bg-ar.png' : '/valley-bg-en.svg'}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />

        {/* SVG overlay — always rendered when image is visible */}
        <svg
          viewBox="0 0 1672 941"
          className="absolute inset-0 w-full h-full"
          style={{ overflow: 'visible' }}
        >
          {/* Watermark — low opacity, bottom-right */}
          <text
            x="1648" y="928"
            textAnchor="end"
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: '20px',
              fill: 'white',
              opacity: 0.07,
              letterSpacing: '0.08em',
            }}
          >
            Khabeer Al Fashal™
          </text>

          {/* Path trail overlay — zone-colored segments (rendered when marker is active) */}
          {markerActive && dispT01 > 0 && (
            <>
              {/* Descent zone: orange */}
              <polyline
                points={pathPoints(0, Math.min(dispT01, DESCENT_END))}
                fill="none"
                stroke="hsl(18 92% 60%)"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.5}
              />
              {/* Floor zone: muted gray */}
              {dispT01 > DESCENT_END && (
                <polyline
                  points={pathPoints(DESCENT_END, Math.min(dispT01, FLOOR_END))}
                  fill="none"
                  stroke="hsl(0 0% 55%)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.45}
                />
              )}
              {/* Ascent zone: green */}
              {dispT01 > FLOOR_END && (
                <polyline
                  points={pathPoints(FLOOR_END, Math.min(dispT01, 1.0))}
                  fill="none"
                  stroke="hsl(107 55% 58%)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.5}
                />
              )}
            </>
          )}

          {/* Marker (only when markerActive) */}
          {markerActive && (
            <>
              <defs>
                <filter id="vaMarkerGlow" x="-150%" y="-150%" width="400%" height="400%">
                  <feGaussianBlur stdDeviation="10" />
                </filter>
              </defs>

              {/* Outer ambient glow */}
              <circle
                cx={markerCx} cy={markerY}
                r={20 + tension * 28}
                fill={`hsl(${glowColor} / ${(startGlow || nodeFlash) ? 0.28 : tension * 0.12})`}
                filter="url(#vaMarkerGlow)"
                style={{ transition: 'cx 0.65s cubic-bezier(0.16,1,0.3,1), cy 0.9s cubic-bezier(0.16,1,0.3,1), r 0.9s ease, fill 0.4s ease' }}
              />
              {/* Inner halo */}
              <circle
                cx={markerCx} cy={markerY}
                r={10 + tension * 14}
                fill={`hsl(${glowColor} / ${(startGlow || nodeFlash) ? 0.35 : 0.16 + tension * 0.22})`}
                style={{ transition: 'cx 0.65s cubic-bezier(0.16,1,0.3,1), cy 0.9s cubic-bezier(0.16,1,0.3,1), r 0.65s ease, fill 0.4s ease' }}
              />
              {/* Main dot — pulsing */}
              <motion.circle
                animate={{ cx: markerCx, cy: markerY, r: [9, 12, 9] }}
                transition={{
                  cx: { duration: 0.65, ease: [0.16, 1, 0.3, 1] },
                  cy: { duration: 0.9,  ease: [0.16, 1, 0.3, 1] },
                  r:  { duration: 2.2, repeat: Infinity, ease: 'easeInOut' },
                }}
                fill={markerFill}
                style={{ transition: 'fill 0.35s ease' }}
              />
            </>
          )}
        </svg>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function ValleyAssessment({ onClose }: { onClose?: () => void }) {
  const t = useT();
  const a = t.assessment;
  const { getPath, lang } = useLanguage();
  const isRTL = lang === 'ar';

  const [stage, setStage] = useState<Stage>('gate');
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [finalAnswers, setFinalAnswers] = useState<Record<string, number>>({});
  const [flashKey, setFlashKey] = useState(0);
  const [nodeFlash, setNodeFlash] = useState<'safe' | 'risky' | null>(null);
  const [startGlow, setStartGlow] = useState(false);

  const nodeFlashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startGlowTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Gate form
  const [form, setForm] = useState({
    name: '', email: '', company: '',
    country: '', city: '', sector: '', stageField: '', employees: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [founderName, setFounderName] = useState<string | null>(null);
  const [founderEmail, setFounderEmail] = useState('');

  const rootRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const total = QUESTIONS.length;
  const MAX = total * 5;

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Clean up flash timers on unmount
  useEffect(() => {
    return () => {
      if (nodeFlashTimer.current) clearTimeout(nodeFlashTimer.current);
      if (startGlowTimer.current) clearTimeout(startGlowTimer.current);
    };
  }, []);

  // Scroll to content top when stage or question changes
  useEffect(() => {
    if (stage === 'quiz' || stage === 'warning') {
      contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [idx, stage]);

  // ── Derived values ─────────────────────────────────────────────────────────

  const answered = Object.keys(answers).length;
  const partialScore = useMemo(() => Object.values(answers).reduce((s, v) => s + v, 0), [answers]);
  const tension = answered === 0 ? 0 : partialScore / (answered * 5);
  const isDanger = tension > 0.62;

  const finalScore = useMemo(() => Object.values(finalAnswers).reduce((s, v) => s + v, 0), [finalAnswers]);
  const finalPct = Math.round((finalScore / MAX) * 100);

  const isDone = stage === 'analyzing' || stage === 'result';
  const quizT01 = total === 0 ? 0 : idx / total;
  const dispT01 = isDone ? finalT01(finalPct) : quizT01;
  const { cx: baseCx, cy: baseCy } = pathAt(dispT01);
  const dispSink = isDone ? finalSink(finalPct) : tension * 70;
  const markerY = Math.min(910, baseCy + dispSink);

  const verdict = useMemo(() => {
    const s = isDone ? finalScore : partialScore;
    return classify(s, MAX, a.verdicts);
  }, [isDone, finalScore, partialScore, MAX, a.verdicts]);

  // Localised level string for display only (keeps internal verdict.level as English key)
  const displayVerdict = useMemo(() => ({
    ...verdict,
    level: isRTL ? (LEVEL_LABELS_AR[verdict.level] ?? verdict.level) : verdict.level,
  }), [verdict, isRTL]);

  const scorePct = isDone ? finalPct : Math.round((partialScore / MAX) * 100);

  const blindSpots = useMemo(() => {
    const src = isDone ? finalAnswers : answers;
    const set = new Set<string>();
    QUESTIONS.forEach(q => {
      if ((src[q.id] ?? 0) >= 4) {
        const label = isRTL ? (q.blindSpotAr ?? q.blindSpot) : q.blindSpot;
        if (label) set.add(label);
      }
    });
    return Array.from(set).slice(0, 4);
  }, [isDone, finalAnswers, answers, isRTL]);

  const riskBucket: 'low' | 'medium' | 'high' =
    verdict.level === 'COLLAPSE PROXIMITY' ? 'high'
    : verdict.level === 'INSIDE THE VALLEY' ? 'medium'
    : 'low';

  // Image visible after gate is passed; marker active only during quiz/analyzing/result
  const showImage   = stage !== 'gate';
  const markerActive = stage === 'quiz' || stage === 'analyzing' || stage === 'result';

  // ── Keyboard Y/N ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (stage !== 'quiz') return;
    const q = QUESTIONS[idx];
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'y' || e.key === 'Y') pickAnswer(true, q);
      if (e.key === 'n' || e.key === 'N') pickAnswer(false, q);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, idx]);

  // ── Gate submit ────────────────────────────────────────────────────────────

  const submitGate = () => {
    const errs: Record<string, string> = {};
    const ar = isRTL;

    const nameErr = validateName(form.name, ar);
    if (nameErr) errs.name = nameErr;

    const emailErr = validateEmail(form.email, ar);
    if (emailErr) errs.email = emailErr;

    if (!form.country)    errs.country   = ar ? 'اختر الدولة'         : 'Select a country';
    if (!form.city)       errs.city      = ar ? 'اختر المدينة'        : 'Select a city';
    if (!form.sector)     errs.sector    = ar ? 'اختر القطاع'         : 'Select a sector';
    if (!form.stageField) errs.stage     = ar ? 'اختر المرحلة'        : 'Select a stage';
    if (!form.employees)  errs.employees = ar ? 'اختر عدد الموظفين'   : 'Select employee count';

    if (Object.keys(errs).length) { setFormErrors(errs); return; }

    setFormErrors({});
    setFounderName(form.name.trim());
    setFounderEmail(form.email.trim());
    // Proceed to warning screen before first question
    setStage('warning');
  };

  // ── Proceed to quiz after warning ─────────────────────────────────────────

  const proceedToQuiz = () => {
    setStage('quiz');
    setIdx(0);
    setAnswers({});
    // Brief white start glow on marker entrance
    setStartGlow(true);
    if (startGlowTimer.current) clearTimeout(startGlowTimer.current);
    startGlowTimer.current = setTimeout(() => setStartGlow(false), 1600);
  };

  // ── Quiz answer ────────────────────────────────────────────────────────────

  const pickAnswer = useCallback((userSaysYes: boolean, q: BinaryQ) => {
    const risky = userSaysYes === q.yesRisky;
    const weight = risky ? 5 : 1;
    if (risky) setFlashKey(k => k + 1);

    // Node flash: green for safe, red for risky
    if (nodeFlashTimer.current) clearTimeout(nodeFlashTimer.current);
    setNodeFlash(risky ? 'risky' : 'safe');
    nodeFlashTimer.current = setTimeout(() => setNodeFlash(null), 900);

    const newAnswers = { ...answers, [q.id]: weight };
    setAnswers(newAnswers);
    setTimeout(() => {
      if (idx + 1 >= total) doFinalize(newAnswers);
      else setIdx(i => i + 1);
    }, 220);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, idx, total]);

  // ── Finalize ───────────────────────────────────────────────────────────────

  const doFinalize = async (fa: Record<string, number>) => {
    setFinalAnswers(fa);
    setStage('analyzing');
    await new Promise(r => setTimeout(r, 3000));
    try {
      const fs = Object.values(fa).reduce((s, v) => s + v, 0);
      const v = classify(fs, MAX, a.verdicts);
      const bs = Array.from(new Set(
        QUESTIONS.filter(q => (fa[q.id] ?? 0) >= 4 && q.blindSpot).map(q => q.blindSpot!),
      ));
      await supabase.from('founder_assessments').insert({
        email: founderEmail,
        name: founderName,
        company: form.company || null,
        country: form.country || null,
        sector: form.sector || null,
        stage: form.stageField || null,
        answers: { responses: fa, city: form.city, employees: form.employees },
        risk_score: fs,
        risk_level: v.level,
        blind_spots: bs,
        insight: v.insight,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      } as never);
    } catch (err) { console.error('submission failed', err); }
    setStage('result');
    rootRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const reset = () => {
    setStage('gate');
    setIdx(0); setAnswers({}); setFinalAnswers({}); setFlashKey(0);
    setNodeFlash(null); setStartGlow(false);
    if (nodeFlashTimer.current) clearTimeout(nodeFlashTimer.current);
    if (startGlowTimer.current) clearTimeout(startGlowTimer.current);
    setForm({ name: '', email: '', company: '', country: '', city: '', sector: '', stageField: '', employees: '' });
    setFounderName(null); setFounderEmail('');
    rootRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Warning copy ───────────────────────────────────────────────────────────

  const warningLines = isRTL ? [
    'أنت الآن على وشك دخول وادي الموت.',
    'هذا التشخيص لا يبحث عن الإجابات المثالية.',
    'بل يبحث عن الحقيقة التي تتجنبها.',
    'كل إجابة غير صادقة ستقود إلى تشخيص أقل دقة.',
    'أجب كما هي الأمور فعلاً، لا كما تتمنى أن تكون.',
  ] : [
    'You are about to enter the Valley of Death.',
    'This diagnostic is not looking for ideal answers.',
    'It is looking for the truth you are avoiding.',
    'Every dishonest answer leads to a less accurate diagnosis.',
    'Answer as things actually are — not as you wish them to be.',
  ];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div ref={rootRef} className="fixed inset-0 z-50 bg-black text-white overflow-y-auto">

      {/* Atmospheric overlays — visible when valley image is shown */}
      {showImage && (
        <>
          <motion.div className="pointer-events-none fixed inset-0"
            style={{ background: 'hsl(0 0% 0%)' }}
            animate={{ opacity: tension * 0.32 }}
            transition={{ duration: 0.9 }} />
          <motion.div className="pointer-events-none fixed inset-0"
            animate={{ background: `radial-gradient(ellipse at 50% 100%, hsl(${isDanger ? '0' : '18'} 100% 35% / ${0.07 + tension * 0.40}), transparent 55%)` }}
            transition={{ duration: 0.9 }} />
          <motion.div className="pointer-events-none fixed inset-0"
            animate={{ boxShadow: `inset 0 0 ${80 + tension * 200}px ${20 + tension * 100}px hsl(0 0% 0% / ${0.38 + tension * 0.40})` }}
            transition={{ duration: 0.9 }} />
          {flashKey > 0 && (
            <motion.div key={`f-${flashKey}`} className="pointer-events-none fixed inset-0 z-10"
              initial={{ opacity: 0.28 }} animate={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              style={{ background: `radial-gradient(ellipse at 50% 55%, hsl(${isDanger ? '0' : '8'} 95% 52% / 0.36), transparent 65%)` }} />
          )}
          {/* Node flash screen tint */}
          <AnimatePresence>
            {nodeFlash && (
              <motion.div key={nodeFlash}
                className="pointer-events-none fixed inset-0 z-10"
                initial={{ opacity: 0.18 }} animate={{ opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.85, ease: 'easeOut' }}
                style={{
                  background: nodeFlash === 'safe'
                    ? 'radial-gradient(ellipse at 50% 55%, hsl(142 76% 35% / 0.25), transparent 60%)'
                    : 'radial-gradient(ellipse at 50% 55%, hsl(0 84% 40% / 0.30), transparent 60%)',
                }}
              />
            )}
          </AnimatePresence>
        </>
      )}

      {/* Close */}
      {onClose && (
        <button onClick={onClose}
          className="fixed top-5 right-5 z-[60] p-2 text-white/22 hover:text-white/55 transition-colors"
          aria-label="Close">
          <X className="size-5" />
        </button>
      )}

      {/* Valley Visual — hidden during gate form */}
      {showImage && (
        <div className="relative z-10 w-full">
          <ValleyVisual
            markerY={markerY}
            markerCx={baseCx}
            tension={tension}
            isDanger={isDanger}
            markerActive={markerActive}
            isRTL={isRTL}
            nodeFlash={nodeFlash}
            startGlow={startGlow}
            dispT01={dispT01}
          />

          {/* Premium single gradient progress bar */}
          {stage === 'quiz' && (
            <div className="px-4 pt-2 pb-0.5">
              <div className="relative h-px w-full overflow-hidden" style={{ backgroundColor: 'hsl(0 0% 100% / 0.07)' }}>
                <motion.div
                  className={cn('absolute inset-y-0 h-full', isRTL ? 'right-0' : 'left-0')}
                  style={{
                    background: isDanger
                      ? `linear-gradient(${isRTL ? '270deg' : '90deg'}, hsl(0 84% 45%), hsl(0 84% 65%))`
                      : `linear-gradient(${isRTL ? '270deg' : '90deg'}, hsl(18 92% 45%), hsl(18 92% 65%))`,
                  }}
                  animate={{ width: `${(idx / total) * 100}%` }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div ref={contentRef} className="relative z-10 max-w-2xl mx-auto px-6 lg:px-10 py-16 md:py-24 min-h-[55vh] flex flex-col justify-center">
        <AnimatePresence mode="wait">

          {/* ─── GATE ────────────────────────────────────────────────── */}
          {stage === 'gate' && (
            <motion.div key="gate"
              initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              className={isRTL ? 'text-right' : undefined}>

              <p className={cn('text-ember mb-5', isRTL ? 'font-arabic text-sm' : 'text-[10px] uppercase tracking-[0.42em]')}>
                {isRTL ? 'قبل أن تبدأ' : 'Before you begin'}
              </p>
              <h2 className={cn('tracking-tight mb-2', isRTL ? 'font-arabic font-bold text-3xl md:text-4xl leading-[1.45]' : 'font-serif-display text-3xl md:text-4xl leading-tight')}>
                {isRTL ? 'من نقوم بتشخيصه؟' : 'Who are we diagnosing?'}
              </h2>
              <p className={cn('text-white/32 mb-10', isRTL ? 'font-arabic text-sm leading-[2]' : 'text-[10px] uppercase tracking-[0.28em]')}>
                {isRTL ? 'إجاباتك سرية تماماً.' : 'Your answers are completely private.'}
              </p>

              <div className="grid md:grid-cols-2 gap-5">
                {/* Name */}
                <Field label={isRTL ? 'الاسم الكامل' : 'Full name'} required isRTL={isRTL}>
                  <input
                    autoFocus
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className={cn('cinematic-input', isRTL && 'text-right')}
                    placeholder={isRTL ? 'محمد خليل' : 'Your full name'}
                  />
                  {formErrors.name && <p className={cn('mt-1.5 text-xs text-ember', isRTL && 'font-arabic text-right')}>{formErrors.name}</p>}
                </Field>

                {/* Email */}
                <Field label={isRTL ? 'البريد الإلكتروني' : 'Email'} required isRTL={isRTL}>
                  <input
                    type="email" dir="ltr"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="cinematic-input"
                    placeholder="founder@company.com"
                  />
                  {formErrors.email && <p className={cn('mt-1.5 text-xs text-ember', isRTL && 'font-arabic text-right')}>{formErrors.email}</p>}
                </Field>

                {/* Company (optional) */}
                <Field label={isRTL ? 'اسم الشركة' : 'Company name'} isRTL={isRTL}>
                  <input
                    value={form.company}
                    onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                    className={cn('cinematic-input', isRTL && 'text-right')}
                    placeholder={isRTL ? 'اختياري' : 'Optional'}
                  />
                </Field>

                {/* Country (searchable) */}
                <Field label={isRTL ? 'الدولة' : 'Country'} required isRTL={isRTL}>
                  <CountryCombobox
                    value={form.country}
                    onChange={v => setForm(f => ({ ...f, country: v, city: '' }))}
                    isRTL={isRTL}
                    error={formErrors.country}
                  />
                </Field>

                {/* City (dynamic) */}
                <Field label={isRTL ? 'المدينة' : 'City'} required isRTL={isRTL}>
                  <CitySelect
                    countryKey={form.country}
                    value={form.city}
                    onChange={v => setForm(f => ({ ...f, city: v }))}
                    isRTL={isRTL}
                    error={formErrors.city}
                  />
                </Field>

                {/* Sector */}
                <Field label={isRTL ? 'القطاع' : 'Sector'} required isRTL={isRTL}>
                  <DropSelect
                    options={isRTL ? SECTORS.ar : SECTORS.en}
                    value={form.sector}
                    onChange={v => setForm(f => ({ ...f, sector: v }))}
                    placeholder={isRTL ? 'اختر القطاع' : 'Select sector'}
                    isRTL={isRTL}
                    error={formErrors.sector}
                  />
                </Field>

                {/* Startup Stage */}
                <Field label={isRTL ? 'مرحلة الشركة' : 'Startup stage'} required isRTL={isRTL}>
                  <DropSelect
                    options={isRTL ? STAGES.ar : STAGES.en}
                    value={form.stageField}
                    onChange={v => setForm(f => ({ ...f, stageField: v }))}
                    placeholder={isRTL ? 'اختر المرحلة' : 'Select stage'}
                    isRTL={isRTL}
                    error={formErrors.stage}
                  />
                </Field>

                {/* Employee Count */}
                <Field label={isRTL ? 'عدد الموظفين' : 'Employee count'} required isRTL={isRTL}>
                  <DropSelect
                    options={isRTL ? EMPLOYEES.ar : EMPLOYEES.en}
                    value={form.employees}
                    onChange={v => setForm(f => ({ ...f, employees: v }))}
                    placeholder={isRTL ? 'اختر العدد' : 'Select count'}
                    isRTL={isRTL}
                    error={formErrors.employees}
                  />
                </Field>
              </div>

              <div className={cn('mt-10 flex items-center gap-5', isRTL && 'flex-row-reverse')}>
                <button
                  onClick={submitGate}
                  className={cn('group inline-flex items-center gap-5 px-8 py-5 bg-ember text-black hover:bg-white transition-all duration-500', isRTL && 'flex-row-reverse')}>
                  <span className={cn('text-sm font-semibold', isRTL ? 'font-arabic' : 'uppercase tracking-[0.25em]')}>
                    {isRTL ? 'ادخل التشخيص' : 'Enter the Diagnostic'}
                  </span>
                  <ArrowRight className={cn('size-4 group-hover:translate-x-1 transition-transform', isRTL && 'rotate-180')} />
                </button>
                <p className={cn('text-white/28', isRTL ? 'font-arabic text-xs leading-[2]' : 'text-[10px] uppercase tracking-[0.22em]')}>
                  {isRTL ? 'إجاباتك سرية.' : 'Your answers are private.'}
                </p>
              </div>
            </motion.div>
          )}

          {/* ─── WARNING ─────────────────────────────────────────────── */}
          {stage === 'warning' && (
            <motion.div key="warning"
              initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              className={cn('max-w-xl', isRTL ? 'text-right' : undefined)}>

              <div className="space-y-7 mb-14">
                {warningLines.map((line, i) => (
                  <motion.p
                    key={i}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.15 + i * 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className={cn(
                      i === 0
                        ? 'text-2xl md:text-3xl text-white/95'
                        : 'text-lg md:text-xl text-white/58',
                      isRTL ? 'font-arabic leading-[1.85]' : 'font-serif-display leading-snug',
                      i === 0 && !isRTL && 'italic',
                    )}
                  >
                    {line}
                  </motion.p>
                ))}
              </div>

              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.3, duration: 0.55 }}
                onClick={proceedToQuiz}
                className={cn(
                  'group inline-flex items-center gap-5 px-8 py-5 border border-white/18 hover:border-white/45 hover:bg-white/[0.03] transition-all duration-500',
                  isRTL && 'flex-row-reverse',
                )}
              >
                <span className={cn('text-sm text-white/70 group-hover:text-white/90 transition-colors', isRTL ? 'font-arabic' : 'uppercase tracking-[0.25em]')}>
                  {isRTL ? 'أنا مستعد' : 'I am ready'}
                </span>
                <ArrowRight className={cn('size-4 text-white/40 group-hover:text-white/70 group-hover:translate-x-1 transition-all', isRTL && 'rotate-180')} />
              </motion.button>
            </motion.div>
          )}

          {/* ─── QUIZ ────────────────────────────────────────────────── */}
          {stage === 'quiz' && (
            <motion.div
              key={`q-${idx}`}
              initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -28 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className={isRTL ? 'text-right' : undefined}>

              <p className={cn('text-ember mb-8', isRTL ? 'font-arabic text-sm' : 'text-[10px] uppercase tracking-[0.4em]')}>
                {isRTL
                  ? `السؤال ${idx + 1} من ${total}`
                  : `Question ${idx + 1} of ${total}`}
              </p>

              <h2 className={cn('tracking-tight mb-14', isRTL ? 'font-arabic font-bold text-2xl md:text-4xl leading-[1.6]' : 'font-serif-display text-3xl md:text-5xl leading-[1.12]')}>
                {isRTL ? QUESTIONS[idx].ar : QUESTIONS[idx].en}
              </h2>

              {/* Yes / No */}
              <div className={cn('flex gap-4', isRTL && 'flex-row-reverse')}>
                <motion.button
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.07, duration: 0.4 }}
                  onClick={() => pickAnswer(true, QUESTIONS[idx])}
                  className="group flex-1 py-7 border border-white/10 hover:border-ember hover:bg-ember/[0.05] transition-all duration-300">
                  <span className={cn('text-white/80 text-xl md:text-2xl group-hover:text-white transition-colors', isRTL ? 'font-arabic' : 'font-serif-display')}>
                    {isRTL ? 'نعم' : 'Yes'}
                  </span>
                </motion.button>
                <motion.button
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.13, duration: 0.4 }}
                  onClick={() => pickAnswer(false, QUESTIONS[idx])}
                  className="group flex-1 py-7 border border-white/10 hover:border-white/35 hover:bg-white/[0.03] transition-all duration-300">
                  <span className={cn('text-white/48 text-xl md:text-2xl group-hover:text-white/78 transition-colors', isRTL ? 'font-arabic' : 'font-serif-display')}>
                    {isRTL ? 'لا' : 'No'}
                  </span>
                </motion.button>
              </div>

              <p className={cn('mt-5 text-white/18', isRTL ? 'font-arabic text-xs' : 'text-[9px] uppercase tracking-[0.32em]')}>
                {isRTL ? 'اضغط Y أو N للإجابة' : 'Press Y or N to answer'}
              </p>
            </motion.div>
          )}

          {/* ─── ANALYZING ───────────────────────────────────────────── */}
          {stage === 'analyzing' && (
            <motion.div key="analyzing"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ duration: 0.55 }}
              className="text-center py-20">
              <motion.p
                animate={{ opacity: [0.38, 1, 0.38] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                className={cn('text-ember mb-6', isRTL ? 'font-arabic text-sm' : 'text-[10px] uppercase tracking-[0.45em]')}>
                {isRTL ? 'تحليل الإجابات' : 'Analyzing responses'}
              </motion.p>
              <p className={cn('text-2xl md:text-4xl text-white/80', isRTL ? 'font-arabic font-bold leading-[1.7]' : 'font-serif-display italic')}>
                {isRTL ? 'جاري تجميع تشخيصك…' : 'Compiling your diagnosis…'}
              </p>
            </motion.div>
          )}

          {/* ─── RESULT ──────────────────────────────────────────────── */}
          {stage === 'result' && (
            <motion.div key="result"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}>
              <AssessmentResult
                verdict={displayVerdict}
                scorePct={scorePct}
                blindSpots={blindSpots}
                founderName={founderName}
                riskBucket={riskBucket}
                consequence={a.consequences[verdict.level] ?? ''}
                recovery={a.recoveryPaths[verdict.level] ?? ''}
                ctas={a.dynamicCtas[riskBucket]}
                isRTL={isRTL}
                contactPath={getPath('/contact')}
                labels={{
                  diagnosisLabel:       a.diagnosisLabel,
                  shockEyebrow:         a.shockEyebrow,
                  riskScoreLabel:       a.riskScoreLabel,
                  riskLevelLabel:       a.riskLevelLabel,
                  blindSpotsSection:    a.blindSpotsSection,
                  consequencesSection:  a.consequencesSection,
                  recoverySection:      a.recoverySection,
                  nextMoveSection:      a.nextMoveSection,
                  restartDiagnosticLabel: a.restartDiagnosticLabel,
                }}
                onReset={reset}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
