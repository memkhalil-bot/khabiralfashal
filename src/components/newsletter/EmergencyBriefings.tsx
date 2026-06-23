import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Props {
  isRTL: boolean;
}

const EXAMPLE_SUBJECTS = {
  en: [
    'Your co-founder stopped replying. Here is what it means.',
    'Are you burning runway on conferences that do not convert?',
    'The silent warning signs before revenue collapse.',
  ],
  ar: [
    'توقّف شريكك عن الرد؟ إليك ما يعنيه ذلك خلف الكواليس.',
    'حرق الرصيد التشغيلي: هل تهدر سيولتك في مؤتمرات لا تجلب عملاء؟',
    'مؤشرات ما قبل الكارثة: الإشارات الصامتة التي تسبق انهيار الإيرادات المفاجئ.',
  ],
};

export function EmergencyBriefings({ isRTL }: Props) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const subjects = EXAMPLE_SUBJECTS[isRTL ? 'ar' : 'en'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      setStatus('error');
      return;
    }
    setStatus('loading');
    // Integration hook — replace with actual provider call
    // data-integration-ready="mailerlite,convertkit,beehiiv"
    await new Promise(r => setTimeout(r, 800));
    setStatus('success');
  };

  return (
    <section
      className={cn('relative border-t border-white/5 py-24 md:py-32 px-6 lg:px-12 overflow-hidden', isRTL && 'text-right')}
      data-newsletter-section="true"
      data-integration-ready="mailerlite,convertkit,beehiiv"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,hsl(18_92%_55%/0.06),transparent_60%)] pointer-events-none" />
      <div className="relative max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className={cn('flex items-center gap-3 mb-8', isRTL && 'flex-row-reverse')}>
            <span className="h-px w-10 bg-ember" />
            <span className={cn('text-[10px] uppercase text-ember font-medium', isRTL ? 'font-arabic tracking-normal text-sm' : 'tracking-[0.4em]')}>
              {isRTL ? 'النشرة الطارئة' : 'Emergency Briefings'}
            </span>
          </div>

          <h2 className={cn('tracking-tight mb-4', isRTL ? 'font-arabic font-bold text-3xl md:text-5xl leading-[1.4]' : 'font-serif-display text-4xl md:text-5xl')}>
            {isRTL ? 'استخبارات أسبوعية للمؤسس' : 'Weekly founder\nintelligence.'}
          </h2>
          <p className={cn('text-base text-white/45 font-light leading-relaxed mb-10 max-w-xl', isRTL && 'leading-[2]')}>
            {isRTL
              ? 'تحليل صريح لإشارات التحذير الصامتة، ومشاهد الفشل الخفية في شركات تشبه شركتك تماماً.'
              : 'Early warning signals, specific failure scenarios, and what is happening inside companies exactly like yours.'}
          </p>

          {/* Example subjects */}
          <div className="mb-10 space-y-2">
            {subjects.map((s, i) => (
              <div key={i} className={cn('flex items-start gap-3 text-sm text-white/32 font-light', isRTL && 'flex-row-reverse')}>
                <span className={cn('flex-shrink-0 text-ember/40', isRTL ? 'font-arabic' : 'font-serif-display')}>·</span>
                <span className={isRTL ? 'font-arabic leading-[2]' : undefined}>{s}</span>
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {status === 'success' ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5 }}
                className={cn(isRTL && 'text-right')}
              >
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className={cn('h-px w-12 bg-ember mb-6', isRTL && 'mr-auto')}
                  style={{ transformOrigin: isRTL ? 'right' : 'left' }}
                />
                <p className={cn('text-[10px] uppercase text-ember mb-3', isRTL ? 'font-arabic tracking-normal text-sm' : 'tracking-[0.4em]')}>
                  {isRTL ? 'تم التسجيل' : 'You are in'}
                </p>
                <p className={cn('text-lg text-white/65 font-light', isRTL ? 'font-arabic leading-[2]' : undefined)}>
                  {isRTL ? 'ستصلك أول نشرة طارئة قريباً.' : 'Your first emergency briefing is on its way.'}
                </p>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit}
                className={cn('flex flex-col sm:flex-row gap-3', isRTL && 'sm:flex-row-reverse')}
              >
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); if (status === 'error') setStatus('idle'); }}
                  placeholder={isRTL ? 'بريدك الإلكتروني' : 'your@email.com'}
                  dir="ltr"
                  className={cn(
                    'flex-1 bg-transparent border-b border-white/20 focus:border-ember outline-none py-3 text-lg font-light transition-colors placeholder:text-white/25',
                    status === 'error' && 'border-red-400/50',
                  )}
                />
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className={cn(
                    'group inline-flex items-center gap-3 px-8 py-3 border border-white/20 hover:border-ember hover:bg-ember/[0.05] text-white/70 hover:text-white transition-all duration-300 disabled:opacity-50 whitespace-nowrap',
                    isRTL ? 'font-arabic flex-row-reverse' : 'text-xs uppercase tracking-[0.25em]'
                  )}
                >
                  {status === 'loading'
                    ? (isRTL ? 'جاري...' : 'Joining...')
                    : (isRTL ? 'انضم للاستخبارات الأسبوعية' : 'Subscribe')}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {status === 'error' && (
            <p className={cn('mt-2 text-xs text-red-400/70', isRTL ? 'font-arabic text-right' : undefined)}>
              {isRTL ? 'أدخل بريداً إلكترونياً صحيحاً.' : 'Please enter a valid email address.'}
            </p>
          )}

          <p className={cn('mt-6 text-[9px] text-white/18', isRTL ? 'font-arabic tracking-normal text-xs' : 'uppercase tracking-[0.25em]')}>
            {isRTL ? 'بريد محمي بالسرية التامة · إلغاء الاشتراك بنقرة واحدة' : 'No spam · Unsubscribe any time'}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
