import { motion } from 'framer-motion';

/**
 * ValleyCurve — animated Valley of Death diagram (Arabic, RTL)
 * Custom SVG, dark theme, ember accent on the funding gap.
 */

const stages = [
  { key: 'pre',    label: 'ما قبل التأسيس', en: 'PRE-SEED' },
  { key: 'seed',   label: 'التأسيس',         en: 'SEED' },
  { key: 'gap',    label: 'فجوة التمويل',    en: 'FUNDING GAP', danger: true },
  { key: 'early',  label: 'النمو المبكر',    en: 'EARLY' },
  { key: 'growth', label: 'التوسع',          en: 'GROWTH' },
];

const milestones = [
  { x: 110, y: 250, label: 'بحث',            en: 'Research' },
  { x: 230, y: 320, label: 'تطوير',          en: 'Development' },
  { x: 360, y: 395, label: 'إطلاق المنتج',   en: 'Product launch' },
  { x: 555, y: 320, label: 'نجاح كمنتج',     en: 'Success as product' },
  { x: 820, y: 145, label: 'نجاح كشركة',     en: 'Success as business' },
];

// Curve path — dip then climb
const CURVE = 'M 60 215 C 180 235, 280 410, 430 420 S 680 320, 900 90';

export function ValleyCurve() {
  return (
    <section
      dir="rtl"
      className="relative border-y border-white/5 bg-black py-24 md:py-32 px-6 lg:px-12 overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_60%,hsl(18_92%_55%/0.10),transparent_65%)]" />
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
           style={{ backgroundImage:
             'repeating-linear-gradient(0deg, white 0, white 1px, transparent 1px, transparent 60px)' }} />

      <div className="relative max-w-6xl mx-auto">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.9 }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="h-px w-10 bg-ember" />
            <span className="text-[10px] tracking-[0.4em] uppercase text-ember font-medium">
              The Curve · المنحنى
            </span>
            <span className="h-px w-10 bg-ember" />
          </div>
          <h2 className="font-arabic text-4xl md:text-6xl leading-[1.15] tracking-tight">
            وادي <span className="text-ember italic">الموت</span>
          </h2>
          <p className="font-arabic text-white/55 mt-6 max-w-2xl mx-auto text-base md:text-lg leading-relaxed font-light">
            كل شركة بتمشى على نفس المنحنى. الفرق الوحيد هو: مين بيوصل للجهة التانية،
            ومين بيختفى فى القاع.
          </p>
        </motion.div>

        {/* Diagram */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 1.1, delay: 0.15 }}
          className="relative bg-gradient-to-b from-white/[0.02] to-transparent border border-white/10 p-6 md:p-10"
        >
          <svg viewBox="0 0 960 480" className="w-full h-auto" role="img" aria-label="Valley of Death curve">
            {/* Stage bands */}
            {stages.map((s, i) => {
              const w = 960 / stages.length;
              const x = i * w;
              const isDanger = s.danger;
              return (
                <g key={s.key}>
                  <rect
                    x={x + 4}
                    y={20}
                    width={w - 8}
                    height={26}
                    fill={isDanger ? 'hsl(18 92% 55%)' : 'rgba(255,255,255,0.06)'}
                    stroke={isDanger ? 'none' : 'rgba(255,255,255,0.12)'}
                  />
                  <text
                    x={x + w / 2}
                    y={37}
                    textAnchor="middle"
                    fontSize="10"
                    letterSpacing="2"
                    fill={isDanger ? '#000' : 'rgba(255,255,255,0.65)'}
                    fontFamily="ui-sans-serif, system-ui"
                  >
                    {s.en}
                  </text>
                </g>
              );
            })}

            {/* Axes */}
            <line x1="40" y1="60" x2="40" y2="450" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
            <line x1="40" y1="450" x2="940" y2="450" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />

            {/* Axis labels (English to avoid SVG RTL quirks) */}
            <text x="44" y="72" fontSize="10" fill="rgba(255,255,255,0.45)"
                  fontFamily="ui-sans-serif, system-ui" letterSpacing="1.5">
              CUMULATIVE P/L
            </text>
            <text x="900" y="468" fontSize="10" fill="rgba(255,255,255,0.45)"
                  fontFamily="ui-sans-serif, system-ui" letterSpacing="1.5">
              TIME →
            </text>

            {/* Danger band shading behind the dip */}
            <rect
              x={(960 / stages.length) * 2 + 4}
              y={60}
              width={(960 / stages.length) - 8}
              height={390}
              fill="hsl(18 92% 55%)"
              opacity="0.06"
            />

            {/* Animated curve */}
            <motion.path
              d={CURVE}
              fill="none"
              stroke="hsl(18 92% 55%)"
              strokeWidth="3.5"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 2.4, ease: [0.16, 1, 0.3, 1] }}
            />
            {/* Soft glow under curve */}
            <motion.path
              d={CURVE}
              fill="none"
              stroke="hsl(18 92% 55%)"
              strokeWidth="10"
              strokeLinecap="round"
              opacity="0.18"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 2.4, ease: [0.16, 1, 0.3, 1] }}
            />

            {/* Milestone diamonds */}
            {milestones.map((m, i) => (
              <motion.g
                key={m.en}
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.6 + i * 0.2 }}
              >
                <rect
                  x={m.x - 6}
                  y={m.y - 6}
                  width="12"
                  height="12"
                  transform={`rotate(45 ${m.x} ${m.y})`}
                  fill="black"
                  stroke="hsl(18 92% 55%)"
                  strokeWidth="1.5"
                />
                <text
                  x={m.x}
                  y={m.y - 14}
                  textAnchor="middle"
                  fontSize="11"
                  fill="rgba(255,255,255,0.75)"
                  fontFamily="ui-sans-serif, system-ui"
                >
                  {m.en}
                </text>
              </motion.g>
            ))}

            {/* "Valley of Death" callout at the bottom */}
            <motion.g
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 1.6 }}
            >
              <line x1="430" y1="420" x2="430" y2="455"
                    stroke="hsl(18 92% 55%)" strokeWidth="1" strokeDasharray="3 3" />
              <text x="430" y="475" textAnchor="middle"
                    fontSize="12" fontWeight="700"
                    fill="hsl(18 92% 55%)"
                    fontFamily="ui-sans-serif, system-ui"
                    letterSpacing="2">
                VALLEY OF DEATH
              </text>
            </motion.g>
          </svg>

          {/* Arabic stage legend below the SVG */}
          <div className="mt-8 grid grid-cols-5 gap-2 text-center">
            {stages.map((s) => (
              <div key={s.key} className="space-y-1">
                <div className={`font-arabic text-xs md:text-sm ${
                  s.danger ? 'text-ember font-bold' : 'text-white/70'
                }`}>
                  {s.label}
                </div>
                <div className="text-[9px] tracking-[0.2em] uppercase text-white/30">
                  {s.en}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Caption cards */}
        <div className="grid md:grid-cols-3 gap-px bg-white/5 border border-white/5 mt-10">
          {[
            {
              t: 'النزول',
              b: 'بتحرق فلوس قبل ما المنتج يبيع. كل شهر بيقربك من القاع.',
            },
            {
              t: 'القاع',
              b: 'هنا بتموت أغلب الشركات. لا تمويل، لا إيرادات كافية، لا وقت.',
            },
            {
              t: 'الخروج',
              b: 'لو وصلت هنا، الإيرادات بدأت تغطى الحرق. الشركة أصبحت حقيقة.',
            },
          ].map((c) => (
            <div key={c.t} className="bg-black p-8">
              <div className="font-arabic text-xl md:text-2xl text-ember mb-3">{c.t}</div>
              <p className="font-arabic text-sm md:text-base text-white/55 leading-relaxed">
                {c.b}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
