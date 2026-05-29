export interface CountryEntry {
  en: string;
  ar: string;
  cities: { en: string; ar: string }[];
}

export const COUNTRIES: CountryEntry[] = [
  // ── MENA ──────────────────────────────────────────────────────────────────
  {
    en: 'Saudi Arabia', ar: 'المملكة العربية السعودية',
    cities: [
      { en: 'Riyadh', ar: 'الرياض' }, { en: 'Jeddah', ar: 'جدة' },
      { en: 'Dammam', ar: 'الدمام' }, { en: 'Mecca', ar: 'مكة المكرمة' },
      { en: 'Medina', ar: 'المدينة المنورة' }, { en: 'Khobar', ar: 'الخبر' },
      { en: 'Tabuk', ar: 'تبوك' }, { en: 'Abha', ar: 'أبها' },
    ],
  },
  {
    en: 'United Arab Emirates', ar: 'الإمارات العربية المتحدة',
    cities: [
      { en: 'Dubai', ar: 'دبي' }, { en: 'Abu Dhabi', ar: 'أبوظبي' },
      { en: 'Sharjah', ar: 'الشارقة' }, { en: 'Ajman', ar: 'عجمان' },
      { en: 'Ras Al Khaimah', ar: 'رأس الخيمة' },
    ],
  },
  {
    en: 'Egypt', ar: 'مصر',
    cities: [
      { en: 'Cairo', ar: 'القاهرة' }, { en: 'Alexandria', ar: 'الإسكندرية' },
      { en: 'Giza', ar: 'الجيزة' }, { en: 'Sharm El Sheikh', ar: 'شرم الشيخ' },
      { en: 'Mansoura', ar: 'المنصورة' },
    ],
  },
  {
    en: 'Kuwait', ar: 'الكويت',
    cities: [
      { en: 'Kuwait City', ar: 'مدينة الكويت' }, { en: 'Hawalli', ar: 'حولي' },
      { en: 'Salmiya', ar: 'السالمية' },
    ],
  },
  {
    en: 'Qatar', ar: 'قطر',
    cities: [
      { en: 'Doha', ar: 'الدوحة' }, { en: 'Al Wakrah', ar: 'الوكرة' },
      { en: 'Al Khor', ar: 'الخور' },
    ],
  },
  {
    en: 'Bahrain', ar: 'البحرين',
    cities: [
      { en: 'Manama', ar: 'المنامة' }, { en: 'Riffa', ar: 'الرفاع' },
      { en: 'Muharraq', ar: 'المحرق' },
    ],
  },
  {
    en: 'Oman', ar: 'عُمان',
    cities: [
      { en: 'Muscat', ar: 'مسقط' }, { en: 'Salalah', ar: 'صلالة' },
      { en: 'Sohar', ar: 'صحار' },
    ],
  },
  {
    en: 'Jordan', ar: 'الأردن',
    cities: [
      { en: 'Amman', ar: 'عمان' }, { en: 'Zarqa', ar: 'الزرقاء' },
      { en: 'Irbid', ar: 'إربد' }, { en: 'Aqaba', ar: 'العقبة' },
    ],
  },
  {
    en: 'Lebanon', ar: 'لبنان',
    cities: [
      { en: 'Beirut', ar: 'بيروت' }, { en: 'Tripoli', ar: 'طرابلس' },
      { en: 'Sidon', ar: 'صيدا' },
    ],
  },
  {
    en: 'Iraq', ar: 'العراق',
    cities: [
      { en: 'Baghdad', ar: 'بغداد' }, { en: 'Erbil', ar: 'أربيل' },
      { en: 'Basra', ar: 'البصرة' }, { en: 'Sulaymaniyah', ar: 'السليمانية' },
    ],
  },
  {
    en: 'Morocco', ar: 'المغرب',
    cities: [
      { en: 'Casablanca', ar: 'الدار البيضاء' }, { en: 'Rabat', ar: 'الرباط' },
      { en: 'Marrakech', ar: 'مراكش' }, { en: 'Fes', ar: 'فاس' },
      { en: 'Tangier', ar: 'طنجة' },
    ],
  },
  {
    en: 'Tunisia', ar: 'تونس',
    cities: [
      { en: 'Tunis', ar: 'تونس العاصمة' }, { en: 'Sfax', ar: 'صفاقس' },
      { en: 'Sousse', ar: 'سوسة' },
    ],
  },
  {
    en: 'Algeria', ar: 'الجزائر',
    cities: [
      { en: 'Algiers', ar: 'الجزائر العاصمة' }, { en: 'Oran', ar: 'وهران' },
      { en: 'Constantine', ar: 'قسنطينة' },
    ],
  },
  {
    en: 'Libya', ar: 'ليبيا',
    cities: [
      { en: 'Tripoli', ar: 'طرابلس' }, { en: 'Benghazi', ar: 'بنغازي' },
      { en: 'Misrata', ar: 'مصراتة' },
    ],
  },
  {
    en: 'Sudan', ar: 'السودان',
    cities: [
      { en: 'Khartoum', ar: 'الخرطوم' }, { en: 'Omdurman', ar: 'أم درمان' },
      { en: 'Port Sudan', ar: 'بورتسودان' },
    ],
  },
  {
    en: 'Palestine', ar: 'فلسطين',
    cities: [
      { en: 'Ramallah', ar: 'رام الله' }, { en: 'Gaza', ar: 'غزة' },
      { en: 'Nablus', ar: 'نابلس' },
    ],
  },
  {
    en: 'Yemen', ar: 'اليمن',
    cities: [
      { en: "Sana'a", ar: 'صنعاء' }, { en: 'Aden', ar: 'عدن' },
      { en: 'Taiz', ar: 'تعز' },
    ],
  },
  {
    en: 'Syria', ar: 'سوريا',
    cities: [
      { en: 'Damascus', ar: 'دمشق' }, { en: 'Aleppo', ar: 'حلب' },
      { en: 'Homs', ar: 'حمص' },
    ],
  },
  // ── SOUTH & SOUTH-EAST ASIA ───────────────────────────────────────────────
  {
    en: 'Pakistan', ar: 'باكستان',
    cities: [
      { en: 'Karachi', ar: 'كراتشي' }, { en: 'Lahore', ar: 'لاهور' },
      { en: 'Islamabad', ar: 'إسلام آباد' }, { en: 'Faisalabad', ar: 'فيصل آباد' },
    ],
  },
  {
    en: 'India', ar: 'الهند',
    cities: [
      { en: 'Mumbai', ar: 'مومباي' }, { en: 'Delhi', ar: 'دلهي' },
      { en: 'Bangalore', ar: 'بنغالور' }, { en: 'Hyderabad', ar: 'حيدر آباد' },
      { en: 'Pune', ar: 'بونه' }, { en: 'Chennai', ar: 'تشيناي' },
    ],
  },
  {
    en: 'Turkey', ar: 'تركيا',
    cities: [
      { en: 'Istanbul', ar: 'إسطنبول' }, { en: 'Ankara', ar: 'أنقرة' },
      { en: 'Izmir', ar: 'إزمير' }, { en: 'Antalya', ar: 'أنطاليا' },
    ],
  },
  {
    en: 'Malaysia', ar: 'ماليزيا',
    cities: [
      { en: 'Kuala Lumpur', ar: 'كوالالمبور' }, { en: 'Penang', ar: 'بينانغ' },
      { en: 'Johor Bahru', ar: 'جوهور باهرو' },
    ],
  },
  {
    en: 'Singapore', ar: 'سنغافورة',
    cities: [{ en: 'Singapore', ar: 'سنغافورة' }],
  },
  {
    en: 'Indonesia', ar: 'إندونيسيا',
    cities: [
      { en: 'Jakarta', ar: 'جاكرتا' }, { en: 'Surabaya', ar: 'سورابايا' },
      { en: 'Bali', ar: 'بالي' },
    ],
  },
  {
    en: 'Bangladesh', ar: 'بنغلاديش',
    cities: [
      { en: 'Dhaka', ar: 'دكا' }, { en: 'Chittagong', ar: 'شيتاغونغ' },
    ],
  },
  // ── EUROPE ───────────────────────────────────────────────────────────────
  {
    en: 'United Kingdom', ar: 'المملكة المتحدة',
    cities: [
      { en: 'London', ar: 'لندن' }, { en: 'Manchester', ar: 'مانشستر' },
      { en: 'Birmingham', ar: 'برمنغهام' }, { en: 'Edinburgh', ar: 'إدنبرة' },
    ],
  },
  {
    en: 'Germany', ar: 'ألمانيا',
    cities: [
      { en: 'Berlin', ar: 'برلين' }, { en: 'Munich', ar: 'ميونيخ' },
      { en: 'Frankfurt', ar: 'فرانكفورت' }, { en: 'Hamburg', ar: 'هامبورغ' },
    ],
  },
  {
    en: 'France', ar: 'فرنسا',
    cities: [
      { en: 'Paris', ar: 'باريس' }, { en: 'Lyon', ar: 'ليون' },
      { en: 'Marseille', ar: 'مرسيليا' },
    ],
  },
  {
    en: 'Netherlands', ar: 'هولندا',
    cities: [
      { en: 'Amsterdam', ar: 'أمستردام' }, { en: 'Rotterdam', ar: 'روتردام' },
      { en: 'The Hague', ar: 'لاهاي' },
    ],
  },
  {
    en: 'Sweden', ar: 'السويد',
    cities: [
      { en: 'Stockholm', ar: 'ستوكهولم' }, { en: 'Gothenburg', ar: 'غوتنبرغ' },
    ],
  },
  {
    en: 'Switzerland', ar: 'سويسرا',
    cities: [
      { en: 'Zurich', ar: 'زيورخ' }, { en: 'Geneva', ar: 'جنيف' },
      { en: 'Basel', ar: 'بازل' },
    ],
  },
  {
    en: 'Spain', ar: 'إسبانيا',
    cities: [
      { en: 'Madrid', ar: 'مدريد' }, { en: 'Barcelona', ar: 'برشلونة' },
      { en: 'Valencia', ar: 'فالنسيا' },
    ],
  },
  {
    en: 'Italy', ar: 'إيطاليا',
    cities: [
      { en: 'Rome', ar: 'روما' }, { en: 'Milan', ar: 'ميلانو' },
      { en: 'Turin', ar: 'تورينو' },
    ],
  },
  {
    en: 'Poland', ar: 'بولندا',
    cities: [
      { en: 'Warsaw', ar: 'وارسو' }, { en: 'Krakow', ar: 'كراكوف' },
    ],
  },
  // ── AMERICAS ─────────────────────────────────────────────────────────────
  {
    en: 'United States', ar: 'الولايات المتحدة',
    cities: [
      { en: 'New York', ar: 'نيويورك' }, { en: 'San Francisco', ar: 'سان فرانسيسكو' },
      { en: 'Los Angeles', ar: 'لوس أنجلوس' }, { en: 'Miami', ar: 'ميامي' },
      { en: 'Austin', ar: 'أوستن' }, { en: 'Chicago', ar: 'شيكاغو' },
      { en: 'Seattle', ar: 'سياتل' }, { en: 'Boston', ar: 'بوسطن' },
    ],
  },
  {
    en: 'Canada', ar: 'كندا',
    cities: [
      { en: 'Toronto', ar: 'تورونتو' }, { en: 'Vancouver', ar: 'فانكوفر' },
      { en: 'Montreal', ar: 'مونتريال' },
    ],
  },
  {
    en: 'Brazil', ar: 'البرازيل',
    cities: [
      { en: 'São Paulo', ar: 'ساو باولو' }, { en: 'Rio de Janeiro', ar: 'ريو دي جانيرو' },
    ],
  },
  // ── AFRICA & OCEANIA ──────────────────────────────────────────────────────
  {
    en: 'Nigeria', ar: 'نيجيريا',
    cities: [
      { en: 'Lagos', ar: 'لاغوس' }, { en: 'Abuja', ar: 'أبوجا' },
    ],
  },
  {
    en: 'Kenya', ar: 'كينيا',
    cities: [
      { en: 'Nairobi', ar: 'نيروبي' }, { en: 'Mombasa', ar: 'مومباسا' },
    ],
  },
  {
    en: 'South Africa', ar: 'جنوب أفريقيا',
    cities: [
      { en: 'Johannesburg', ar: 'جوهانسبرغ' }, { en: 'Cape Town', ar: 'كيب تاون' },
    ],
  },
  {
    en: 'Australia', ar: 'أستراليا',
    cities: [
      { en: 'Sydney', ar: 'سيدني' }, { en: 'Melbourne', ar: 'ملبورن' },
      { en: 'Brisbane', ar: 'بريسبان' },
    ],
  },
];

export const COUNTRIES_SORTED = [...COUNTRIES].sort((a, b) =>
  a.en.localeCompare(b.en)
);
