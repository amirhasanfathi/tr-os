// ============================================================
// PANONAMA OS — mock data layer
// All data here is fictional sample data for the prototype.
// Replace with API responses later; keep the shapes identical.
// ============================================================

import type {
  CitizenshipPath,
  CommunityOpportunity,
  Document,
  EmergencyOption,
  Guide,
  HousingRiskItem,
  Job,
  Journey,
  Notification,
  Provider,
  ProviderCategory,
  Ticket,
  User,
  UserProfile,
} from '../types'
import { computeTrustScore, priceBand } from '../services/providerTrust'

export const demoUser: User = {
  id: 'u-1',
  fullName: 'علی رضایی',
  email: 'ali.rezaei@example.com',
  city: 'Istanbul',
  country: 'TR',
  createdAt: '2026-09-07',
  onboarded: true,
}

export const demoProfile: UserProfile = {
  userId: 'u-1',
  status: 'tourist_residence',
  daysRemaining: 72,
  residenceProgress: 45,
  citizenshipProgress: 30,
  careerScore: 78,
  cvScore: 78,
  profession: 'Graphic & Web Designer',
  yearsOfExperience: 8,
  skills: [
    { id: 's1', name: 'Branding', category: 'Design', level: 88 },
    { id: 's2', name: 'UI/UX', category: 'Design', level: 92 },
    { id: 's3', name: 'WordPress', category: 'Programming', level: 80 },
    { id: 's4', name: 'Figma', category: 'Design', level: 90 },
    { id: 's5', name: 'Photoshop', category: 'Design', level: 85 },
  ],
  languages: [
    { id: 'l1', name: 'فارسی', level: 'Native' },
    { id: 'l2', name: 'انگلیسی', level: 'Intermediate' },
    { id: 'l3', name: 'ترکی', level: 'Beginner' },
  ],
  addressRegistered: true,
  passportExpiry: '1406/02/10',
  insuranceMonthsLeft: 4,
  rentalContractMonthsLeft: 3,
  journeyDay: 27,
}

// ---------------- Documents ----------------

export const demoDocuments: Document[] = [
  {
    id: 'd1',
    type: 'passport',
    name: 'پاسپورت',
    icon: 'BookUser',
    status: 'ready',
    expiryDate: '1406/02/10',
    lastUpdated: '1405/06/12',
    fileName: 'passport-scan.pdf',
  },
  {
    id: 'd2',
    type: 'residence',
    name: 'اقامت (کیملیک)',
    icon: 'IdCard',
    status: 'pending',
    expiryDate: null,
    lastUpdated: '1405/07/01',
  },
  {
    id: 'd3',
    type: 'insurance',
    name: 'بیمه سلامت',
    icon: 'ShieldCheck',
    status: 'ready',
    expiryDate: '1405/11/20',
    lastUpdated: '1405/05/30',
    fileName: 'insurance-policy.pdf',
  },
  {
    id: 'd4',
    type: 'rental_contract',
    name: 'قرارداد اجاره',
    icon: 'Home',
    status: 'needs_review',
    expiryDate: '1405/10/15',
    lastUpdated: '1405/06/25',
    fileName: 'rental-contract.pdf',
  },
  {
    id: 'd5',
    type: 'tax',
    name: 'مدارک مالیاتی',
    icon: 'Receipt',
    status: 'needs_translation',
    expiryDate: null,
    lastUpdated: '1405/04/18',
  },
  {
    id: 'd6',
    type: 'education',
    name: 'مدرک تحصیلی',
    icon: 'GraduationCap',
    status: 'needs_translation',
    expiryDate: null,
    lastUpdated: '1405/03/02',
  },
  {
    id: 'd7',
    type: 'cv',
    name: 'رزومه (CV)',
    icon: 'FileText',
    status: 'ready',
    expiryDate: null,
    lastUpdated: '1405/07/05',
    fileName: 'ali-rezaei-cv.pdf',
  },
]

// ---------------- Journey (90-day plan) ----------------

export const demoJourney: Journey = {
  totalDays: 90,
  currentDay: 27,
  steps: [
    {
      id: 'j1', key: 'entry', day: 1, title: 'ورود', status: 'done', deadline: 'انجام شد',
      checklist: [
        { id: 'c1', label: 'مهر ورود در پاسپورت', done: true },
        { id: 'c2', label: 'سیم‌کارت موقت', done: true },
      ],
      cta: { label: 'راهنمای ورود', to: '/guides' },
    },
    {
      id: 'j2', key: 'sim_internet', day: 3, title: 'سیم‌کارت و اینترنت', status: 'done', deadline: 'انجام شد',
      checklist: [
        { id: 'c1', label: 'خرید سیم‌کارت دائم', done: true },
        { id: 'c2', label: 'اینترنت خانگی', done: true },
      ],
      cta: { label: 'مشاهده جزئیات', to: '/journey/90-days' },
    },
    {
      id: 'j3', key: 'bank', day: 7, title: 'حساب بانکی', status: 'done', deadline: 'انجام شد',
      checklist: [
        { id: 'c1', label: 'افتتاح حساب', done: true },
        { id: 'c2', label: 'کارت بانکی', done: true },
      ],
      cta: { label: 'راهنمای بانک', to: '/guides' },
    },
    {
      id: 'j4', key: 'house', day: 10, title: 'خانه', status: 'done', deadline: 'انجام شد',
      checklist: [
        { id: 'c1', label: 'بازدید از خانه‌ها', done: true },
        { id: 'c2', label: 'امضای قرارداد اجاره', done: true },
      ],
      cta: { label: 'بررسی قرارداد', to: '/housing' },
    },
    {
      id: 'j5', key: 'address', day: 14, title: 'آدرس', status: 'done', deadline: 'انجام شد',
      checklist: [
        { id: 'c1', label: 'ثبت آدرس (نوفوس)', done: true },
      ],
      cta: { label: 'مشاهده جزئیات', to: '/journey/90-days' },
    },
    {
      id: 'j6', key: 'insurance', day: 20, title: 'بیمه', status: 'done', deadline: 'انجام شد',
      checklist: [
        { id: 'c1', label: 'بیمه سلامت خصوصی', done: true },
      ],
      cta: { label: 'خدمات بیمه', to: '/services' },
    },
    {
      id: 'j7', key: 'residence', day: 30, title: 'اقامت', status: 'in_progress', deadline: '۳ روز دیگر',
      checklist: [
        { id: 'c1', label: 'آماده‌سازی مدارک', done: true },
        { id: 'c2', label: 'رزرو وقت مصاحبه', done: false },
        { id: 'c3', label: 'بیمه معتبر برای اقامت', done: true },
      ],
      cta: { label: 'آماده‌سازی مدارک اقامت', to: '/documents' },
    },
    {
      id: 'j8', key: 'work', day: 45, title: 'کار', status: 'upcoming', deadline: 'روز ۴۵',
      checklist: [
        { id: 'c1', label: 'به‌روزرسانی رزومه', done: false },
        { id: 'c2', label: 'ارسال درخواست برای ۵ فرصت', done: false },
      ],
      cta: { label: 'فرصت‌های شغلی', to: '/career' },
    },
    {
      id: 'j9', key: 'income', day: 60, title: 'درآمد', status: 'upcoming', deadline: 'روز ۶۰',
      checklist: [
        { id: 'c1', label: 'منبع درآمد پایدار', done: false },
        { id: 'c2', label: 'پس‌انداز اضطراری', done: false },
      ],
      cta: { label: 'برنامه درآمد', to: '/career' },
    },
    {
      id: 'j10', key: 'longterm', day: 90, title: 'بررسی مسیر بلندمدت', status: 'long_term', deadline: 'روز ۹۰',
      checklist: [
        { id: 'c1', label: 'تصمیم برای اقامت بلندمدت یا شهروندی', done: false },
      ],
      cta: { label: 'مسیر شهروندی', to: '/citizenship' },
    },
  ],
  todayTasks: [
    { id: 't1', label: 'تکمیل پروفایل', done: false },
    { id: 't2', label: 'آپلود پاسپورت', done: false },
    { id: 't3', label: 'تکمیل مهارت‌ها', done: false },
    { id: 't4', label: 'بررسی فرصت‌های کاری', done: false },
  ],
}

// ---------------- Jobs ----------------

export const demoJobs: Job[] = [
  {
    id: 'job-1', title: 'UI/UX Designer', company: 'TechNova Yazılım', location: 'Istanbul',
    type: 'Remote / Full-time', salary: '₺35,000 – ₺50,000', source: 'LinkedIn',
    sourceUrl: 'https://linkedin.com/jobs', skills: ['UI/UX', 'Figma', 'Branding'],
    languages: ['انگلیسی', 'ترکی'], postedAt: '2 روز پیش', employmentType: 'Full-time',
  },
  {
    id: 'job-2', title: 'Digital Marketing Designer', company: 'Anadolu Media Group', location: 'Istanbul',
    type: 'Hybrid / Full-time', salary: '₺28,000 – ₺40,000', source: 'Kariyer.net',
    sourceUrl: 'https://kariyer.net', skills: ['Branding', 'Photoshop', 'SEO'],
    languages: ['ترکی'], postedAt: '۳ روز پیش', employmentType: 'Full-time',
  },
  {
    id: 'job-3', title: 'WordPress Specialist', company: 'Webistanbul Ajans', location: 'Istanbul',
    type: 'On-site / Full-time', salary: '₺25,000 – ₺35,000', source: 'Elemen',
    sourceUrl: 'https://elemenonline.com', skills: ['WordPress', 'PHP basics'],
    languages: ['ترکی'], postedAt: '۵ روز پیش', employmentType: 'Full-time',
  },
  {
    id: 'job-4', title: 'Graphic Designer', company: 'Kreatif Studio', location: 'Istanbul',
    type: 'On-site / Full-time', salary: '₺22,000 – ₺32,000', source: 'TR Life',
    sourceUrl: '#', skills: ['Photoshop', 'Branding', 'Illustrator'],
    languages: ['فارسی', 'ترکی'], postedAt: '۱ هفته پیش', employmentType: 'Full-time',
  },
  {
    id: 'job-5', title: 'Product Designer (Contract)', company: 'Fintech Partners', location: 'Remote (TR)',
    type: 'Remote / Contract', salary: '₺40,000 – ₺60,000', source: 'Partner',
    sourceUrl: '#', skills: ['UI/UX', 'Figma', 'Design Systems'],
    languages: ['انگلیسی'], postedAt: '۱ روز پیش', employmentType: 'Contract',
  },
  {
    id: 'job-6', title: 'Brand Identity Designer', company: 'Marka Lab', location: 'Istanbul',
    type: 'Hybrid / Full-time', salary: '₺30,000 – ₺45,000', source: 'LinkedIn',
    sourceUrl: 'https://linkedin.com/jobs', skills: ['Branding', 'Figma'],
    languages: ['انگلیسی', 'ترکی'], postedAt: '۴ روز پیش', employmentType: 'Full-time',
  },
  {
    id: 'job-7', title: 'Web Designer (Persian market)', company: 'ParsTrade Export', location: 'Istanbul',
    type: 'On-site / Part-time', salary: '₺15,000 – ₺22,000', source: 'Community',
    sourceUrl: '#', skills: ['UI/UX', 'WordPress'],
    languages: ['فارسی'], postedAt: '۶ روز پیش', employmentType: 'Part-time',
  },
  {
    id: 'job-8', title: 'Motion & Video Editor', company: 'Studio Anatolia', location: 'Istanbul',
    type: 'Remote / Contract', salary: '₺20,000 – ₺35,000', source: 'Kariyer.net',
    sourceUrl: 'https://kariyer.net', skills: ['Video Editing', 'After Effects'],
    languages: ['ترکی'], postedAt: '۱ هفته پیش', employmentType: 'Contract',
  },
  {
    id: 'job-9', title: 'Junior Frontend Designer', company: 'SoftHub', location: 'Istanbul',
    type: 'On-site / Full-time', salary: '₺18,000 – ₺26,000', source: 'Elemen',
    sourceUrl: 'https://elemenonline.com', skills: ['Figma', 'HTML/CSS'],
    languages: ['ترکی'], postedAt: '۲ هفته پیش', employmentType: 'Full-time',
  },
  {
    id: 'job-10', title: 'Freelance Logo Designer', company: 'Global Design Pool', location: 'Remote',
    type: 'Remote / Contract', salary: 'پرداخت پروژه‌ای', source: 'Partner',
    sourceUrl: '#', skills: ['Branding', 'Illustrator'],
    languages: ['انگلیسی'], postedAt: '۳ روز پیش', employmentType: 'Contract',
  },
]

// ---------------- Community opportunities ----------------

export const demoCommunityOpportunities: CommunityOpportunity[] = [
  {
    id: 'co-1', title: 'طراح گرافیک برای همکاری پروژه‌ای',
    source: 'TR Life Community', channel: 'Telegram', date: '1405/07/10',
    category: 'پروژه فریلنس', trustLevel: 'Verified', url: '#',
  },
  {
    id: 'co-2', title: 'استخدام طراح UI برای استارتاپ ایرانی-ترکی',
    source: 'LinkedIn Community', channel: 'LinkedIn', date: '1405/07/08',
    category: 'استخدام', trustLevel: 'Community', url: '#',
  },
  {
    id: 'co-3', title: 'همکاری در پروژه برندینگ رستوران',
    source: 'Facebook Community', channel: 'Facebook', date: '1405/07/05',
    category: 'پروژه فریلنس', trustLevel: 'Community', url: '#',
  },
  {
    id: 'co-4', title: 'فرصت شغلی WordPress در شرکت پارتنر',
    source: 'TR Life Partner', channel: 'Partner Network', date: '1405/07/12',
    category: 'استخدام', trustLevel: 'Verified', url: '#',
  },
  {
    id: 'co-5', title: 'دوره رایگان ترکی استانبولی برای طراحان',
    source: 'Discord Community', channel: 'Discord', date: '1405/07/11',
    category: 'آموزش', trustLevel: 'Community', url: '#',
  },
]

// ---------------- Citizenship ----------------

export const demoCitizenshipPaths: CitizenshipPath[] = [
  {
    id: 'cp-1', goal: 'investment', title: 'سرمایه‌گذاری',
    summary: 'سرمایه‌گذاری طبق مبالغ و شرایط اعلام‌شده توسط مراجع رسمی ترکیه. شرایط ممکن است تغییر کند.',
    minYears: null,
    steps: ['بررسی شرایط فعلی', 'مشاوره با وکیل رسمی', 'انجام سرمایه‌گذاری مستند', 'اقدام رسمی'],
    informational: true,
  },
  {
    id: 'cp-2', goal: 'long_term_residence', title: 'اقامت بلندمدت',
    summary: 'پس از سال‌ها اقامت قانونی پیوسته، ممکن است واجد بررسی برای اقامت بلندمدت و سپس مسیرهای بعدی شوید.',
    minYears: 8,
    steps: ['حفظ اقامت قانونی پیوسته', 'ثبت سابقه بیمه و آدرس', 'بررسی وقفه‌های اقامت', 'اقدام رسمی'],
    informational: true,
  },
  {
    id: 'cp-3', goal: 'marriage', title: 'ازدواج',
    summary: 'ازدواج با شهروند ترکیه می‌تواند مسیر بررسی شهروندی ایجاد کند؛ شرایط دقیق به پرونده شما بستگی دارد.',
    minYears: 3,
    steps: ['ثبت رسمی ازدواج', 'حفظ زندگی مشترک مستند', 'بررسی شرایط قانونی', 'اقدام رسمی'],
    informational: true,
  },
  {
    id: 'cp-4', goal: 'work', title: 'کار و مسیرهای قانونی',
    summary: 'کار قانونی با اجازه کار، سابقه بیمه و مالیات می‌تواند پایه مسیر اقامت بلندمدت باشد.',
    minYears: 5,
    steps: ['دریافت اجازه کار', 'سابقه بیمه پیوسته', 'اقامت قانونی بدون وقفه', 'بررسی مسیرهای بعدی'],
    informational: true,
  },
  {
    id: 'cp-5', goal: 'business', title: 'شرکت / کسب‌وکار',
    summary: 'ثبت شرکت و ایجاد اشتغال می‌تواند مسیرهای اقامتی مشخصی ایجاد کند؛ با مشاور رسمی بررسی کنید.',
    minYears: null,
    steps: ['ثبت شرکت', 'فعالیت واقعی و مالیاتی', 'اشتغال‌زایی طبق شرایط', 'مشاوره تخصصی'],
    informational: true,
  },
  {
    id: 'cp-6', goal: 'other', title: 'سایر مسیرها',
    summary: 'مسیرهای خاص مانند تحصیل، شرایط استثنایی و موارد دیگر. هر پرونده متفاوت است.',
    minYears: null,
    steps: ['بررسی شرایط فردی', 'مشاوره با متخصص', 'جمع‌آوری مدارک', 'اقدام رسمی'],
    informational: true,
  },
]

// ---------------- Providers ----------------

// Trust score is NOT hardcoded: it is derived from `verified` + `ratings` via the
// same engine the server uses (see services/providerTrust.ts). `ratings` are the
// sample review history; priceRange is derived from the numeric price band.
const rawProviders = [
  {
    id: 'p-1', name: 'مؤسسه نمونه «آنادولو حقوق»', category: 'lawyer', specialty: 'حقوق مهاجرت و اقامت',
    languages: ['فارسی', 'ترکی', 'انگلیسی'], location: 'Istanbul — Şişli', priceMin: 15000, priceMax: 40000,
    currency: 'TRY', verified: true, ratings: [5, 5, 5, 4, 5, 5, 4, 5, 5, 5, 4, 5],
  },
  {
    id: 'p-2', name: 'دارالترجمه نمونه «پل»', category: 'translator', specialty: 'ترجمه رسمی اسناد (نوتری)',
    languages: ['فارسی', 'ترکی'], location: 'Istanbul — Fatih', priceMin: 3000, priceMax: 8000,
    currency: 'TRY', verified: true, ratings: [5, 4, 5, 5, 4, 5, 4],
  },
  {
    id: 'p-3', name: 'املاک نمونه «گلدن هوم»', category: 'realestate', specialty: 'اجاره و خرید مسکن، مشاوره قرارداد',
    languages: ['فارسی', 'ترکی'], location: 'Istanbul — Kadıköy', priceMin: 5000, priceMax: 12000,
    currency: 'TRY', verified: true, ratings: [4, 5, 4, 4, 5, 4],
  },
  {
    id: 'p-4', name: 'حسابداری نمونه «مالی‌کار»', category: 'accountant', specialty: 'مالیات شخصی و شرکتی',
    languages: ['ترکی', 'انگلیسی'], location: 'Istanbul — Beşiktaş', priceMin: 4000, priceMax: 9000,
    currency: 'TRY', verified: false, ratings: [4, 3, 4, 5, 3],
  },
  {
    id: 'p-5', name: 'بیمه نمونه «سیگورتا پلاس»', category: 'insurance', specialty: 'بیمه سلامت برای اقامت',
    languages: ['فارسی', 'ترکی'], location: 'Istanbul — Online', priceMin: 500, priceMax: 2000,
    currency: 'TRY', verified: true, ratings: [5, 5, 4, 5, 4, 5, 4, 5],
  },
  {
    id: 'p-6', name: 'ثبت شرکت نمونه «بیزنس رجیستر»', category: 'company_registration', specialty: 'ثبت شرکت و مجوزها',
    languages: ['فارسی', 'ترکی', 'انگلیسی'], location: 'Istanbul — Levent', priceMin: 20000, priceMax: 50000,
    currency: 'TRY', verified: true, ratings: [4, 4, 5, 4, 3, 4],
  },
  {
    id: 'p-7', name: 'مشاور تحصیلی نمونه «آکادمیا»', category: 'education_consultant', specialty: 'پذیرش دانشگاه و اقامت دانشجویی',
    languages: ['فارسی', 'انگلیسی'], location: 'Istanbul — Online', priceMin: 5000, priceMax: 12000,
    currency: 'TRY', verified: false, ratings: [3, 4, 3, 4, 3],
  },
]

export const demoProviders: Provider[] = rawProviders.map((p) => ({
  id: p.id,
  name: p.name,
  category: p.category as ProviderCategory,
  specialty: p.specialty,
  languages: p.languages,
  location: p.location,
  trustScore: computeTrustScore(p.verified, p.ratings),
  verified: p.verified,
  priceRange: priceBand(p.priceMin, p.priceMax, p.currency),
  sample: true,
}))

// ---------------- Tickets ----------------

export const demoTickets: Ticket[] = [
  {
    id: '#PN-1042', subject: 'بررسی قرارداد اجاره', status: 'waiting_response',
    priority: 'medium',
    createdAt: '1405/07/08', updatedAt: '1405/07/11',
  },
  {
    id: '#PN-1038', subject: 'سوال درباره مدارک اقامت', status: 'in_progress',
    priority: 'high',
    createdAt: '1405/07/05', updatedAt: '1405/07/10',
  },
  {
    id: '#PN-1021', subject: 'معرفی مترجم رسمی', status: 'resolved',
    priority: 'low',
    createdAt: '1405/06/20', updatedAt: '1405/06/24',
  },
]

// ---------------- Guides ----------------

export const demoGuides: Guide[] = [
  {
    id: 'g-1', title: 'ورود به ترکیه',
    audience: 'همه ایرانیان تازه‌وارد',
    whenToAct: 'قبل از سفر و روز ورود',
    documents: ['پاسپورت معتبر (حداقل ۶ ماه)', 'بلیت برگشت یا مدارک اقامت'],
    steps: ['بررسی اعتبار پاسپورت', 'ثبت مهر ورود', 'تهیه سیم‌کارت', 'یادداشت مهلت ۹۰ روزه ویزا'],
    warnings: ['عبور از مهلت مجاز اقامت بدون ویزا می‌تواند جریمه داشته باشد.'],
    officialSource: 'وب‌سایت رسمی کنسولگری / e-Devlet (placeholder)',
    lastUpdated: '1405/07/01',
  },
  {
    id: 'g-2', title: 'اجاره خانه',
    audience: 'تازه‌واردها و افراد بدون قرارداد رسمی',
    whenToAct: 'اولین هفته پس از ورود',
    documents: ['پاسپورت', 'ودیعه', 'قرارداد اجاره (ممکن است نوتری لازم باشد)'],
    steps: ['بازدید حضوری', 'بررسی مالکیت', 'تنظیم قرارداد رسمی', 'ثبت آدرس'],
    warnings: ['هرگز قبل از دیدن خانه و بررسی سند، پولی پرداخت نکنید.'],
    officialSource: 'نوتری‌های رسمی (placeholder)',
    lastUpdated: '1405/06/20',
  },
  {
    id: 'g-3', title: 'اقامت',
    audience: 'کسانی که قصد ماندن بیش از ۹۰ روز دارند',
    whenToAct: 'حداقل ۳۰ روز قبل از پایان مهلت',
    documents: ['پاسپورت', 'بیمه سلامت', 'اثبات آدرس', 'عکس بیومتریک', 'اثبات تمکن مالی'],
    steps: ['آماده‌سازی مدارک', 'رزرو وقت آنلاین', 'حضور در مصاحبه', 'دریافت کارت'],
    warnings: ['این راهنما صرفاً اطلاعاتی است و نتیجه را تضمین نمی‌کند.'],
    officialSource: 'اداره مهاجرت رسمی (placeholder)',
    lastUpdated: '1405/07/05',
  },
  {
    id: 'g-4', title: 'بیمه',
    audience: 'متقاضیان اقامت و خانواده‌ها',
    whenToAct: 'همزمان با آماده‌سازی پرونده اقامت',
    documents: ['پاسپورت', 'اطلاعات آدرس'],
    steps: ['مقایسه پوشش بیمه‌ها', 'خرید بیمه معتبر', 'ذخیره پلیسه در مدارک من'],
    warnings: ['پلیسه باید در طول دوره اقامت معتبر بماند.'],
    officialSource: 'شرکت‌های بیمه دارای مجوز (placeholder)',
    lastUpdated: '1405/06/15',
  },
  {
    id: 'g-5', title: 'کار و اجازه کار',
    audience: 'جویایان کار و فریلنسرها',
    whenToAct: 'پس از ثبات اقامتی',
    documents: ['رزومه', 'پاسپورت', 'مجوز کار (در صورت لزوم از طریق کارفرما)'],
    steps: ['به‌روزرسانی رزومه و پورتفولیو', 'یادگیری ترکی پایه', 'ارسال درخواست', 'بررسی شرایط مجوز کار با کارفرما'],
    warnings: ['کار بدون مجوز می‌تواند وضعیت اقامت شما را به خطر بیندازد.'],
    officialSource: 'وزارت کار (placeholder)',
    lastUpdated: '1405/07/03',
  },
  {
    id: 'g-6', title: 'بانک',
    audience: 'همه کاربران',
    whenToAct: 'هفته اول ورود',
    documents: ['پاسپورت', 'شماره مالیاتی', 'اثبات آدرس (در برخی بانک‌ها)'],
    steps: ['دریافت شماره مالیاتی', 'افتتاح حساب', 'فعال‌سازی بانکداری موبایل'],
    warnings: ['شرایط افتتاح حساب بین بانک‌ها متفاوت است.'],
    officialSource: 'بانک‌های رسمی (placeholder)',
    lastUpdated: '1405/05/28',
  },
  {
    id: 'g-7', title: 'نوتری',
    audience: 'کسانی که اسناد رسمی ترجمه‌شده نیاز دارند',
    whenToAct: 'هر زمان نیاز به تأیید رسمی ترجمه است',
    documents: ['اصل سند', 'ترجمه توسط مترجم رسمی'],
    steps: ['ترجمه رسمی', 'تأیید در نوتری', 'در برخی موارد آپوستیل'],
    warnings: ['هزینه نوتری بر اساس تعداد کلمات محاسبه می‌شود.'],
    officialSource: 'نوتری‌های رسمی (placeholder)',
    lastUpdated: '1405/06/10',
  },
  {
    id: 'g-8', title: 'شهروندی',
    audience: 'ساکنان بلندمدت',
    whenToAct: 'پس از چند سال اقامت قانونی',
    documents: ['سوابق اقامت', 'سوابق بیمه و مالیات', 'مدارک هویتی'],
    steps: ['بررسی مسیرهای ممکن', 'مشاوره با وکیل رسمی', 'جمع‌آوری سوابق', 'اقدام رسمی در صورت واجد شرایط بودن'],
    warnings: ['هیچ مسیری تضمینی نیست؛ این راهنما صرفاً برای سازمان‌دهی اطلاعات است.'],
    officialSource: 'مراجع رسمی (placeholder)',
    lastUpdated: '1405/07/01',
  },
]

// ---------------- Notifications ----------------

export const demoNotifications: Notification[] = [
  {
    id: 'n-1', title: 'مهلت اقامت توریستی', body: '۷۲ روز تا پایان مهلت اقامت فعلی باقی مانده است.',
    type: 'warning', read: false, createdAt: 'امروز',
  },
  {
    id: 'n-2', title: 'فرصت شغلی جدید', body: 'یک فرصت UI/UX Designer با تطابق ۸۷٪ برای شما ثبت شد.',
    type: 'info', read: false, createdAt: 'دیروز',
  },
  {
    id: 'n-3', title: 'قرارداد اجاره', body: 'بررسی قرارداد اجاره در تیکت #PN-1042 در انتظار پاسخ شماست.',
    type: 'info', read: true, createdAt: '۲ روز پیش',
  },
]

// ---------------- Housing risk checklist ----------------

export const demoHousingRisks: HousingRiskItem[] = [
  { id: 'h1', label: 'مالکیت', risk: 'low', note: 'سند مالکیت توسط مالک ارائه شد.' },
  { id: 'h2', label: 'قرارداد', risk: 'attention', note: 'قرارداد رسمی است اما نیاز به بررسی بند تمدید دارد.' },
  { id: 'h3', label: 'ودیعه', risk: 'low', note: 'ودیعه معادل ۲ ماه اجاره، در قرارداد ذکر شده.' },
  { id: 'h4', label: 'شرایط فسخ', risk: 'attention', note: 'بند فسخ زودهنگام مبهم است.' },
  { id: 'h5', label: 'قبوض', risk: 'low', note: 'تکلیف آب، برق و گاز مشخص شده.' },
  { id: 'h6', label: 'آدرس', risk: 'low', note: 'آدرس در سامانه ثبت شده ✓.' },
  { id: 'h7', label: 'هزینه‌های جانبی', risk: 'low', note: 'هزینه ساختمان (aidat) مشخص است.' },
]

// ---------------- Emergency resources (placeholders only) ----------------

export const demoEmergencyOptions: EmergencyOption[] = [
  {
    id: 'e1', label: 'گم‌شدن پاسپورت',
    resources: [
      { title: 'کنسولگری جمهوری اسلامی ایران (placeholder)', note: 'برای صدور گذرنامه المثنی با کنسولگری تماس بگیرید.' },
      { title: 'پلیس (placeholder)', note: 'ثبت گزارش مفقودی می‌تواند برای مراحل بعدی لازم باشد.' },
    ],
  },
  {
    id: 'e2', label: 'مشکل اقامت',
    resources: [
      { title: 'اداره مهاجرت رسمی (placeholder)', note: 'منبع رسمی اطلاعات اقامت.' },
      { title: 'مشاوره حقوقی در TR Life OS', note: 'می‌توانید از بخش خدمات، وکیل معرفی‌شده را پیدا کنید.' },
    ],
  },
  {
    id: 'e3', label: 'مشکل پزشکی',
    resources: [
      { title: 'بیمه سلامت شما', note: 'پلیسه بیمه را در بخش «مدارک من» مشاهده کنید.' },
      { title: 'مراکز درمانی (placeholder)', note: 'اطلاعات رسمی از منابع دولتی.' },
    ],
  },
  {
    id: 'e4', label: 'کلاهبرداری',
    resources: [
      { title: 'گزارش به پلیس (placeholder)', note: 'تمام مدارک و رسیدها را نگه دارید.' },
      { title: 'مشاوره حقوقی', note: 'از بخش خدمات یک وکیل معتبر پیدا کنید.' },
    ],
  },
  {
    id: 'e5', label: 'مشکل کاری',
    resources: [
      { title: 'قرارداد کار شما', note: 'نسخه قرارداد را در مدارک من نگه دارید.' },
      { title: 'مشاوره حقوقی کار (placeholder)', note: 'منابع رسمی از وزارت کار.' },
    ],
  },
  {
    id: 'e6', label: 'نیاز به وکیل',
    resources: [
      { title: 'خدمات TR Life OS', note: 'لیست وکلای دارای Trust Score در بخش خدمات.' },
      { title: 'کانون وکلا (placeholder)', note: 'منبع رسمی برای یافتن وکیل.' },
    ],
  },
]
