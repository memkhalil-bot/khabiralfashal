/**
 * failKitTranslations — bilingual copy for the public Fail Kit request flow
 * (CTA on the Valley result, the request page, mini assessment, payment
 * placeholder, and success state). Kept separate from the large
 * translations.ts so this Sprint 3B addition stays self-contained.
 */

export const failKitT = {
  en: {
    cta: {
      heading: 'Get My Fail Kit',
      body: 'Your diagnosis suggests that a customized Fail Kit can help you understand the root causes and next recovery steps.',
      price: '$19',
    },
    page: {
      metaTitle: 'Get Your Fail Kit — Khabeer Al Fashal',
      metaDesc:  'Request a customized Fail Kit based on your Valley of Death diagnosis.',
      eyebrow: 'Fail Kit Request',
      heading: 'Your Customized Fail Kit.',
      sub: 'A few short questions, then your request goes to manual review by our team.',
      contextLabel: 'Based on your diagnosis',
      categoryLabel: 'Focus area',
      riskLabel: 'Risk score',
      stepLabel: 'Step',
      of: 'of',
      back: 'Back',
      next: 'Continue',
    },
    miniAssessment: {
      heading: 'A few questions about your situation',
      sub: 'This helps our team prepare a kit that actually fits your case — not a generic template.',
    },
    payment: {
      heading: 'Confirm your request',
      priceLabel: 'Price',
      price: '$19',
      notice: 'Payment integration is not active yet. For this beta version, your request will be submitted for manual review.',
      promoLabel: 'Promo Code (optional)',
      promoPlaceholder: 'FAIL01',
      promoValidating: 'Validating…',
      promoApplied: 'Code applied',
      promoInvalid: 'Invalid or expired code',
      freeNotice: 'This code makes your Fail Kit free.',
      originalPrice: 'Original price',
      discount: 'Discount',
      finalPrice: 'Total due',
      free: 'Free',
      submit: 'Submit Request',
      submitting: 'Submitting…',
      errorGeneric: 'Something went wrong. Please try again.',
    },
    contact: {
      fullName: 'Full Name',
      email: 'Email',
      country: 'Country',
      fullNamePlaceholder: 'Mohamed K.',
      emailPlaceholder: 'you@company.com',
      countryPlaceholder: 'Saudi Arabia',
      fullNameRequired: 'Name is required',
      emailRequired: 'Email is required',
      emailInvalid: 'Invalid email',
      countryRequired: 'Country is required',
    },
    success: {
      heading: 'Your Fail Kit request has been received.',
      body: 'We will review your case before preparing your customized kit.',
      requestNumber: 'Reference',
      backHome: 'Back to home',
    },
  },
  ar: {
    cta: {
      heading: 'احصل على حقيبة الفشل الخاصة بي',
      body: 'يشير تشخيصك إلى أن حقيبة فشل مخصصة قد تساعدك على فهم الأسباب الجذرية وخطوات التعافي التالية.',
      price: '19 دولاراً',
    },
    page: {
      metaTitle: 'احصل على حقيبة الفشل — خبير الفشل',
      metaDesc:  'اطلب حقيبة فشل مخصصة بناءً على تشخيص وادي الموت الخاص بك.',
      eyebrow: 'طلب حقيبة الفشل',
      heading: 'حقيبة الفشل المخصصة لك.',
      sub: 'بضعة أسئلة قصيرة، ثم يُرسل طلبك لمراجعة يدوية من فريقنا.',
      contextLabel: 'بناءً على تشخيصك',
      categoryLabel: 'مجال التركيز',
      riskLabel: 'درجة الخطورة',
      stepLabel: 'خطوة',
      of: 'من',
      back: 'رجوع',
      next: 'متابعة',
    },
    miniAssessment: {
      heading: 'بضعة أسئلة حول وضعك',
      sub: 'هذا يساعد فريقنا على تجهيز حقيبة تناسب حالتك فعلاً — لا قالباً عاماً.',
    },
    payment: {
      heading: 'تأكيد طلبك',
      priceLabel: 'السعر',
      price: '19 دولاراً',
      notice: 'الدفع الإلكتروني غير مفعّل حالياً. في هذه النسخة التجريبية سيتم إرسال طلبك للمراجعة اليدوية.',
      promoLabel: 'كود الخصم (اختياري)',
      promoPlaceholder: 'FAIL01',
      promoValidating: 'جارٍ التحقق…',
      promoApplied: 'تم تطبيق الكود',
      promoInvalid: 'كود غير صالح أو منتهي الصلاحية',
      freeNotice: 'هذا الكود يجعل حقيبة الفشل مجانية.',
      originalPrice: 'السعر الأصلي',
      discount: 'الخصم',
      finalPrice: 'المبلغ المستحق',
      free: 'مجاناً',
      submit: 'إرسال الطلب',
      submitting: 'جارٍ الإرسال…',
      errorGeneric: 'حدث خطأ ما. حاول مرة أخرى.',
    },
    contact: {
      fullName: 'الاسم الكامل',
      email: 'البريد الإلكتروني',
      country: 'الدولة',
      fullNamePlaceholder: 'محمد ك.',
      emailPlaceholder: 'you@company.com',
      countryPlaceholder: 'المملكة العربية السعودية',
      fullNameRequired: 'الاسم مطلوب',
      emailRequired: 'البريد الإلكتروني مطلوب',
      emailInvalid: 'بريد إلكتروني غير صالح',
      countryRequired: 'الدولة مطلوبة',
    },
    success: {
      heading: 'تم استلام طلب حقيبة الفشل.',
      body: 'سنراجع حالتك قبل تجهيز الحقيبة المخصصة لك.',
      requestNumber: 'الرقم المرجعي',
      backHome: 'العودة إلى الرئيسية',
    },
  },
} as const;

// Bilingual labels for the six approved Fail Kit categories — used to show
// the founder which "focus area" their kit will address.
export const FAIL_KIT_CATEGORY_LABELS: Record<string, { en: string; ar: string }> = {
  'Founder Conflict':   { en: 'Founder Conflict',    ar: 'خلاف بين المؤسسين' },
  'Cash Burn':          { en: 'Cash Burn',           ar: 'استنزاف السيولة' },
  'Product Market Fit': { en: 'Product–Market Fit',  ar: 'ملاءمة المنتج للسوق' },
  'Fundraising':        { en: 'Fundraising',         ar: 'جمع التمويل' },
  'Team Issues':        { en: 'Team Issues',         ar: 'مشكلات الفريق' },
  'Operations':         { en: 'Operations',          ar: 'العمليات التشغيلية' },
};
