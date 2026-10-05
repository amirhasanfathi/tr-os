// Development seed — replaces mockData as the runtime source of truth for local dev.
//
// Rules honored here:
//   * No human-readable/relative date strings are stored: every deadline/expiry is a
//     real timestamptz. Demo offsets are computed from a single SEED_NOW so the dev
//     dataset stays internally coherent across re-seeds.
//   * No hardcoded matching scores: job_matches are intentionally NOT seeded — the
//     matching service computes them (see P9). careerScoreCache is left null.
//   * No hardcoded trust scores: providers.trustScore is derived via the same pure
//     trust engine the API uses, from verification + the seeded review ratings (P11).
//   * Files are never stored in Postgres: documents carry a storageKey pointing at
//     object storage. Seed keys are placeholders (no real bytes uploaded).
//   * Idempotent: wipes dependent tables in FK order, then re-creates with stable data.
//   * Dev-only sample content, subtly fictional — mirrors the «نمونه داده» prototype.

import { PrismaClient, Prisma } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { computeTrustScore } from '../src/modules/providers/trust.engine.js'

const prisma = new PrismaClient()

// Single reference instant for the whole seed so relative demo offsets are consistent.
const SEED_NOW = new Date()
const daysFrom = (n: number): Date => new Date(SEED_NOW.getTime() + n * 86_400_000)

const DEV_PASSWORD = 'Passw0rd!demo'

// ---------------- helpers ----------------

function parseSalary(raw: string): { min: number | null; max: number | null } {
  const nums = raw.replace(/[^\d–-]/g, '').split(/[–-]/).map((p) => p.trim()).filter(Boolean)
  const toNum = (s: string): number | null => {
    const v = Number(s.replace(/,/g, ''))
    return Number.isFinite(v) && v > 0 ? v : null
  }
  if (nums.length === 0) return { min: null, max: null }
  if (nums.length === 1) return { min: toNum(nums[0]), max: toNum(nums[0]) }
  return { min: toNum(nums[0]), max: toNum(nums[1]) }
}

const EMPLOYMENT_TYPE: Record<string, Prisma.JobCreateInput['employmentType']> = {
  'Full-time': 'FULL_TIME',
  'Part-time': 'PART_TIME',
  Contract: 'CONTRACT',
  Internship: 'INTERNSHIP',
}

const LANGUAGE_CODES: Record<string, string> = {
  فارسی: 'fa',
  انگلیسی: 'en',
  ترکی: 'tr',
}

// ---------------- raw dev dataset (was src/data/mockData.ts) ----------------

const skills: { name: string; category: string; level?: number }[] = [
  { name: 'Branding', category: 'Design', level: 88 },
  { name: 'UI/UX', category: 'Design', level: 92 },
  { name: 'WordPress', category: 'Programming', level: 80 },
  { name: 'Figma', category: 'Design', level: 90 },
  { name: 'Photoshop', category: 'Design', level: 85 },
  // job-only skills (no user level)
  { name: 'SEO', category: 'Marketing' },
  { name: 'PHP basics', category: 'Programming' },
  { name: 'Illustrator', category: 'Design' },
  { name: 'Design Systems', category: 'Design' },
  { name: 'Video Editing', category: 'Media' },
  { name: 'After Effects', category: 'Media' },
  { name: 'HTML/CSS', category: 'Programming' },
]

const rawJobs = [
  { id: 'job-1', title: 'UI/UX Designer', company: 'TechNova Yazılım', location: 'Istanbul', type: 'Remote / Full-time', salary: '₺35,000 – ₺50,000', source: 'LinkedIn', sourceUrl: 'https://linkedin.com/jobs', skills: ['UI/UX', 'Figma', 'Branding'], languages: ['انگلیسی', 'ترکی'], postedDaysAgo: 2, employmentType: 'Full-time' },
  { id: 'job-2', title: 'Digital Marketing Designer', company: 'Anadolu Media Group', location: 'Istanbul', type: 'Hybrid / Full-time', salary: '₺28,000 – ₺40,000', source: 'Kariyer.net', sourceUrl: 'https://kariyer.net', skills: ['Branding', 'Photoshop', 'SEO'], languages: ['ترکی'], postedDaysAgo: 3, employmentType: 'Full-time' },
  { id: 'job-3', title: 'WordPress Specialist', company: 'Webistanbul Ajans', location: 'Istanbul', type: 'On-site / Full-time', salary: '₺25,000 – ₺35,000', source: 'Elemen', sourceUrl: 'https://elemenonline.com', skills: ['WordPress', 'PHP basics'], languages: ['ترکی'], postedDaysAgo: 5, employmentType: 'Full-time' },
  { id: 'job-4', title: 'Graphic Designer', company: 'Kreatif Studio', location: 'Istanbul', type: 'On-site / Full-time', salary: '₺22,000 – ₺32,000', source: 'TR Life', sourceUrl: '#', skills: ['Photoshop', 'Branding', 'Illustrator'], languages: ['فارسی', 'ترکی'], postedDaysAgo: 7, employmentType: 'Full-time' },
  { id: 'job-5', title: 'Product Designer (Contract)', company: 'Fintech Partners', location: 'Remote (TR)', type: 'Remote / Contract', salary: '₺40,000 – ₺60,000', source: 'Partner', sourceUrl: '#', skills: ['UI/UX', 'Figma', 'Design Systems'], languages: ['انگلیسی'], postedDaysAgo: 1, employmentType: 'Contract' },
  { id: 'job-6', title: 'Brand Identity Designer', company: 'Marka Lab', location: 'Istanbul', type: 'Hybrid / Full-time', salary: '₺30,000 – ₺45,000', source: 'LinkedIn', sourceUrl: 'https://linkedin.com/jobs', skills: ['Branding', 'Figma'], languages: ['انگلیسی', 'ترکی'], postedDaysAgo: 4, employmentType: 'Full-time' },
  { id: 'job-7', title: 'Web Designer (Persian market)', company: 'ParsTrade Export', location: 'Istanbul', type: 'On-site / Part-time', salary: '₺15,000 – ₺22,000', source: 'Community', sourceUrl: '#', skills: ['UI/UX', 'WordPress'], languages: ['فارسی'], postedDaysAgo: 6, employmentType: 'Part-time' },
  { id: 'job-8', title: 'Motion & Video Editor', company: 'Studio Anatolia', location: 'Istanbul', type: 'Remote / Contract', salary: '₺20,000 – ₺35,000', source: 'Kariyer.net', sourceUrl: 'https://kariyer.net', skills: ['Video Editing', 'After Effects'], languages: ['ترکی'], postedDaysAgo: 7, employmentType: 'Contract' },
  { id: 'job-9', title: 'Junior Frontend Designer', company: 'SoftHub', location: 'Istanbul', type: 'On-site / Full-time', salary: '₺18,000 – ₺26,000', source: 'Elemen', sourceUrl: 'https://elemenonline.com', skills: ['Figma', 'HTML/CSS'], languages: ['ترکی'], postedDaysAgo: 14, employmentType: 'Full-time' },
  { id: 'job-10', title: 'Freelance Logo Designer', company: 'Global Design Pool', location: 'Remote', type: 'Remote / Contract', salary: 'پرداخت پروژه‌ای', source: 'Partner', sourceUrl: '#', skills: ['Branding', 'Illustrator'], languages: ['انگلیسی'], postedDaysAgo: 3, employmentType: 'Contract' },
]

const jobSources = ['LinkedIn', 'Kariyer.net', 'Elemen', 'Community', 'Partner', 'TR Life']

const rawDocuments = [
  { id: 'd1', type: 'passport', name: 'پاسپورت', status: 'ready', fileName: 'passport-scan.pdf', expiresDaysFromNow: 200, updatedDaysAgo: 45 },
  { id: 'd2', type: 'residence', name: 'اقامت (کیملیک)', status: 'pending', fileName: '', expiresDaysFromNow: null, updatedDaysAgo: 12 },
  { id: 'd3', type: 'insurance', name: 'بیمه سلامت', status: 'ready', fileName: 'insurance-policy.pdf', expiresDaysFromNow: 120, updatedDaysAgo: 60 },
  { id: 'd4', type: 'rental_contract', name: 'قرارداد اجاره', status: 'needs_review', fileName: 'rental-contract.pdf', expiresDaysFromNow: 90, updatedDaysAgo: 30 },
  { id: 'd5', type: 'tax', name: 'مدارک مالیاتی', status: 'needs_translation', fileName: '', expiresDaysFromNow: null, updatedDaysAgo: 90 },
  { id: 'd6', type: 'education', name: 'مدرک تحصیلی', status: 'needs_translation', fileName: '', expiresDaysFromNow: null, updatedDaysAgo: 130 },
  { id: 'd7', type: 'cv', name: 'رزومه (CV)', status: 'ready', fileName: 'ali-rezaei-cv.pdf', expiresDaysFromNow: null, updatedDaysAgo: 8 },
] as const

// Trust score is NOT listed here — it is computed below from `verified` + `ratings`
// via the same pure engine the API uses. `ratings` become real seeded reviews.
const rawProviders = [
  { id: 'p-1', name: 'مؤسسه نمونه «آنادولو حقوق»', category: 'lawyer', specialty: 'حقوق مهاجرت و اقامت', languages: ['فارسی', 'ترکی', 'انگلیسی'], location: 'Istanbul — Şişli', priceMin: 15000, priceMax: 40000, currency: 'TRY', verified: true, ratings: [5, 5, 5, 4, 5, 5, 4, 5, 5, 5, 4, 5] },
  { id: 'p-2', name: 'دارالترجمه نمونه «پل»', category: 'translator', specialty: 'ترجمه رسمی اسناد (نوتری)', languages: ['فارسی', 'ترکی'], location: 'Istanbul — Fatih', priceMin: 3000, priceMax: 8000, currency: 'TRY', verified: true, ratings: [5, 4, 5, 5, 4, 5, 4] },
  { id: 'p-3', name: 'املاک نمونه «گلدن هوم»', category: 'realestate', specialty: 'اجاره و خرید مسکن، مشاوره قرارداد', languages: ['فارسی', 'ترکی'], location: 'Istanbul — Kadıköy', priceMin: 5000, priceMax: 12000, currency: 'TRY', verified: true, ratings: [4, 5, 4, 4, 5, 4] },
  { id: 'p-4', name: 'حسابداری نمونه «مالی‌کار»', category: 'accountant', specialty: 'مالیات شخصی و شرکتی', languages: ['ترکی', 'انگلیسی'], location: 'Istanbul — Beşiktaş', priceMin: 4000, priceMax: 9000, currency: 'TRY', verified: false, ratings: [4, 3, 4, 5, 3] },
  { id: 'p-5', name: 'بیمه نمونه «سیگورتا پلاس»', category: 'insurance', specialty: 'بیمه سلامت برای اقامت', languages: ['فارسی', 'ترکی'], location: 'Istanbul — Online', priceMin: 500, priceMax: 2000, currency: 'TRY', verified: true, ratings: [5, 5, 4, 5, 4, 5, 4, 5] },
  { id: 'p-6', name: 'ثبت شرکت نمونه «بیزنس رجیستر»', category: 'company_registration', specialty: 'ثبت شرکت و مجوزها', languages: ['فارسی', 'ترکی', 'انگلیسی'], location: 'Istanbul — Levent', priceMin: 20000, priceMax: 50000, currency: 'TRY', verified: true, ratings: [4, 4, 5, 4, 3, 4] },
  { id: 'p-7', name: 'مشاور تحصیلی نمونه «آکادمیا»', category: 'education_consultant', specialty: 'پذیرش دانشگاه و اقامت دانشجویی', languages: ['فارسی', 'انگلیسی'], location: 'Istanbul — Online', priceMin: 5000, priceMax: 12000, currency: 'TRY', verified: false, ratings: [3, 4, 3, 4, 3] },
] as const

const rawTickets = [
  { code: '#PN-1042', subject: 'بررسی قرارداد اجاره', status: 'waiting_response', priority: 'medium', body: 'لطفاً نسخه قرارداد اجاره را برای بررسی ارسال کنید.', createdDaysAgo: 15, updatedDaysAgo: 12 },
  { code: '#PN-1038', subject: 'سوال درباره مدارک اقامت', status: 'in_progress', priority: 'high', body: 'در مورد مدارک لازم برای اقامت سوال دارم.', createdDaysAgo: 18, updatedDaysAgo: 13 },
  { code: '#PN-1021', subject: 'معرفی مترجم رسمی', status: 'resolved', priority: 'low', body: 'نیاز به معرفی مترجم رسمی دارم.', createdDaysAgo: 33, updatedDaysAgo: 29 },
] as const

const rawGuides = [
  { id: 'g-1', slug: 'entry-to-turkey', title: 'ورود به ترکیه', audience: 'همه ایرانیان تازه‌وارد', whenToAct: 'قبل از سفر و روز ورود', documents: ['پاسپورت معتبر (حداقل ۶ ماه)', 'بلیت برگشت یا مدارک اقامت'], steps: ['بررسی اعتبار پاسپورت', 'ثبت مهر ورود', 'تهیه سیم‌کارت', 'یادداشت مهلت ۹۰ روزه ویزا'], warnings: ['عبور از مهلت مجاز اقامت بدون ویزا می‌تواند جریمه داشته باشد.'], officialSource: 'وب‌سایت رسمی کنسولگری / e-Devlet (placeholder)', updatedDaysAgo: 12 },
  { id: 'g-2', slug: 'renting-a-home', title: 'اجاره خانه', audience: 'تازه‌واردها و افراد بدون قرارداد رسمی', whenToAct: 'اولین هفته پس از ورود', documents: ['پاسپورت', 'ودیعه', 'قرارداد اجاره (ممکن است نوتری لازم باشد)'], steps: ['بازدید حضوری', 'بررسی مالکیت', 'تنظیم قرارداد رسمی', 'ثبت آدرس'], warnings: ['هرگز قبل از دیدن خانه و بررسی سند، پولی پرداخت نکنید.'], officialSource: 'نوتری‌های رسمی (placeholder)', updatedDaysAgo: 23 },
  { id: 'g-3', slug: 'residence-permit', title: 'اقامت', audience: 'کسانی که قصد ماندن بیش از ۹۰ روز دارند', whenToAct: 'حداقل ۳۰ روز قبل از پایان مهلت', documents: ['پاسپورت', 'بیمه سلامت', 'اثبات آدرس', 'عکس بیومتریک', 'اثبات تمکن مالی'], steps: ['آماده‌سازی مدارک', 'رزرو وقت آنلاین', 'حضور در مصاحبه', 'دریافت کارت'], warnings: ['این راهنما صرفاً اطلاعاتی است و نتیجه را تضمین نمی‌کند.'], officialSource: 'اداره مهاجرت رسمی (placeholder)', updatedDaysAgo: 8 },
  { id: 'g-4', slug: 'health-insurance', title: 'بیمه', audience: 'متقاضیان اقامت و خانواده‌ها', whenToAct: 'همزمان با آماده‌سازی پرونده اقامت', documents: ['پاسپورت', 'اطلاعات آدرس'], steps: ['مقایسه پوشش بیمه‌ها', 'خرید بیمه معتبر', 'ذخیره پلیسه در مدارک من'], warnings: ['پلیسه باید در طول دوره اقامت معتبر بماند.'], officialSource: 'شرکت‌های بیمه دارای مجوز (placeholder)', updatedDaysAgo: 30 },
  { id: 'g-5', slug: 'work-and-permit', title: 'کار و اجازه کار', audience: 'جویایان کار و فریلنسرها', whenToAct: 'پس از ثبات اقامتی', documents: ['رزومه', 'پاسپورت', 'مجوز کار (در صورت لزوم از طریق کارفرما)'], steps: ['به‌روزرسانی رزومه و پورتفولیو', 'یادگیری ترکی پایه', 'ارسال درخواست', 'بررسی شرایط مجوز کار با کارفرما'], warnings: ['کار بدون مجوز می‌تواند وضعیت اقامت شما را به خطر بیندازد.'], officialSource: 'وزارت کار (placeholder)', updatedDaysAgo: 10 },
  { id: 'g-6', slug: 'banking', title: 'بانک', audience: 'همه کاربران', whenToAct: 'هفته اول ورود', documents: ['پاسپورت', 'شماره مالیاتی', 'اثبات آدرس (در برخی بانک‌ها)'], steps: ['دریافت شماره مالیاتی', 'افتتاح حساب', 'فعال‌سازی بانکداری موبایل'], warnings: ['شرایط افتتاح حساب بین بانک‌ها متفاوت است.'], officialSource: 'بانک‌های رسمی (placeholder)', updatedDaysAgo: 25 },
  { id: 'g-7', slug: 'notary', title: 'نوتری', audience: 'کسانی که اسناد رسمی ترجمه‌شده نیاز دارند', whenToAct: 'هر زمان نیاز به تأیید رسمی ترجمه است', documents: ['اصل سند', 'ترجمه توسط مترجم رسمی'], steps: ['ترجمه رسمی', 'تأیید در نوتری', 'در برخی موارد آپوستیل'], warnings: ['هزینه نوتری بر اساس تعداد کلمات محاسبه می‌شود.'], officialSource: 'نوتری‌های رسمی (placeholder)', updatedDaysAgo: 19 },
  { id: 'g-8', slug: 'citizenship', title: 'شهروندی', audience: 'ساکنان بلندمدت', whenToAct: 'پس از چند سال اقامت قانونی', documents: ['سوابق اقامت', 'سوابق بیمه و مالیات', 'مدارک هویتی'], steps: ['بررسی مسیرهای ممکن', 'مشاوره با وکیل رسمی', 'جمع‌آوری سوابق', 'اقدام رسمی در صورت واجد شرایط بودن'], warnings: ['هیچ مسیری تضمینی نیست؛ این راهنما صرفاً برای سازمان‌دهی اطلاعات است.'], officialSource: 'مراجع رسمی (placeholder)', updatedDaysAgo: 12 },
] as const

const DISCLAIMER = 'این محتوا صرفاً برای سازمان‌دهی اطلاعات است و هیچ نتیجه اقامتی، شهروندی، کاری یا حقوقی را تضمین نمی‌کند. برای تصمیم‌های رسمی با مراجع رسمی یا مشاور دارای مجوز مشورت کنید.'

const rawCitizenship = [
  { goal: 'investment', title: 'سرمایه‌گذاری', summary: 'سرمایه‌گذاری طبق مبالغ و شرایط اعلام‌شده توسط مراجع رسمی ترکیه. شرایط ممکن است تغییر کند.', minYears: null, steps: ['بررسی شرایط فعلی', 'مشاوره با وکیل رسمی', 'انجام سرمایه‌گذاری مستند', 'اقدام رسمی'] },
  { goal: 'long_term_residence', title: 'اقامت بلندمدت', summary: 'پس از سال‌ها اقامت قانونی پیوسته، ممکن است واجد بررسی برای اقامت بلندمدت و سپس مسیرهای بعدی شوید.', minYears: 8, steps: ['حفظ اقامت قانونی پیوسته', 'ثبت سابقه بیمه و آدرس', 'بررسی وقفه‌های اقامت', 'اقدام رسمی'] },
  { goal: 'marriage', title: 'ازدواج', summary: 'ازدواج با شهروند ترکیه می‌تواند مسیر بررسی شهروندی ایجاد کند؛ شرایط دقیق به پرونده شما بستگی دارد.', minYears: 3, steps: ['ثبت رسمی ازدواج', 'حفظ زندگی مشترک مستند', 'بررسی شرایط قانونی', 'اقدام رسمی'] },
  { goal: 'work', title: 'کار و مسیرهای قانونی', summary: 'کار قانونی با اجازه کار، سابقه بیمه و مالیات می‌تواند پایه مسیر اقامت بلندمدت باشد.', minYears: 5, steps: ['دریافت اجازه کار', 'سابقه بیمه پیوسته', 'اقامت قانونی بدون وقفه', 'بررسی مسیرهای بعدی'] },
  { goal: 'business', title: 'شرکت / کسب‌وکار', summary: 'ثبت شرکت و ایجاد اشتغال می‌تواند مسیرهای اقامتی مشخصی ایجاد کند؛ با مشاور رسمی بررسی کنید.', minYears: null, steps: ['ثبت شرکت', 'فعالیت واقعی و مالیاتی', 'اشتغال‌زایی طبق شرایط', 'مشاوره تخصصی'] },
  { goal: 'other', title: 'سایر مسیرها', summary: 'مسیرهای خاص مانند تحصیل، شرایط استثنایی و موارد دیگر. هر پرونده متفاوت است.', minYears: null, steps: ['بررسی شرایط فردی', 'مشاوره با متخصص', 'جمع‌آوری مدارک', 'اقدام رسمی'] },
] as const

const rawCommunity = [
  { title: 'طراح گرافیک برای همکاری پروژه‌ای', source: 'TR Life Community', channel: 'Telegram', category: 'پروژه فریلنس', trustLevel: 'Verified', url: '#', postedDaysAgo: 3 },
  { title: 'استخدام طراح UI برای استارتاپ ایرانی-ترکی', source: 'LinkedIn Community', channel: 'LinkedIn', category: 'استخدام', trustLevel: 'Community', url: '#', postedDaysAgo: 5 },
  { title: 'همکاری در پروژه برندینگ رستوران', source: 'Facebook Community', channel: 'Facebook', category: 'پروژه فریلنس', trustLevel: 'Community', url: '#', postedDaysAgo: 8 },
  { title: 'فرصت شغلی WordPress در شرکت پارتنر', source: 'TR Life Partner', channel: 'Partner Network', category: 'استخدام', trustLevel: 'Verified', url: '#', postedDaysAgo: 1 },
  { title: 'دوره رایگان ترکی استانبولی برای طراحان', source: 'Discord Community', channel: 'Discord', category: 'آموزش', trustLevel: 'Community', url: '#', postedDaysAgo: 2 },
] as const

const journeyStepsRaw = [
  { day: 1, key: 'entry', title: 'ورود', status: 'done', ctaLabel: 'راهنمای ورود', ctaTo: '/guides', checklist: ['مهر ورود در پاسپورت', 'سیم‌کارت موقت'] },
  { day: 3, key: 'sim_internet', title: 'سیم‌کارت و اینترنت', status: 'done', ctaLabel: 'مشاهده جزئیات', ctaTo: '/journey/90-days', checklist: ['خرید سیم‌کارت دائم', 'اینترنت خانگی'] },
  { day: 7, key: 'bank', title: 'حساب بانکی', status: 'done', ctaLabel: 'راهنمای بانک', ctaTo: '/guides', checklist: ['افتتاح حساب', 'کارت بانکی'] },
  { day: 10, key: 'house', title: 'خانه', status: 'done', ctaLabel: 'بررسی قرارداد', ctaTo: '/housing', checklist: ['بازدید از خانه‌ها', 'امضای قرارداد اجاره'] },
  { day: 14, key: 'address', title: 'آدرس', status: 'done', ctaLabel: 'مشاهده جزئیات', ctaTo: '/journey/90-days', checklist: ['ثبت آدرس (نوفوس)'] },
  { day: 20, key: 'insurance', title: 'بیمه', status: 'done', ctaLabel: 'خدمات بیمه', ctaTo: '/services', checklist: ['بیمه سلامت خصوصی'] },
  { day: 30, key: 'residence', title: 'اقامت', status: 'in_progress', ctaLabel: 'آماده‌سازی مدارک اقامت', ctaTo: '/documents', checklist: ['آماده‌سازی مدارک', 'رزرو وقت مصاحبه', 'بیمه معتبر برای اقامت'] },
  { day: 45, key: 'work', title: 'کار', status: 'upcoming', ctaLabel: 'فرصت‌های شغلی', ctaTo: '/career', checklist: ['به‌روزرسانی رزومه', 'ارسال درخواست برای ۵ فرصت'] },
  { day: 60, key: 'income', title: 'درآمد', status: 'upcoming', ctaLabel: 'برنامه درآمد', ctaTo: '/career', checklist: ['منبع درآمد پایدار', 'پس‌انداز اضطراری'] },
  { day: 90, key: 'longterm', title: 'بررسی مسیر بلندمدت', status: 'long_term', ctaLabel: 'مسیر شهروندی', ctaTo: '/citizenship', checklist: ['تصمیم برای اقامت بلندمدت یا شهروندی'] },
] as const

const todayTasks = ['تکمیل پروفایل', 'آپلود پاسپورت', 'تکمیل مهارت‌ها', 'بررسی فرصت‌های کاری']

// ---------------- seed ----------------

async function main(): Promise<void> {
  console.log('Seeding TR Life OS dev database…')

  await prisma.$transaction(async (tx) => {
    // Wipe in FK-safe order (children before parents).
    await tx.auditLog.deleteMany()
    await tx.notification.deleteMany()
    await tx.ticketAttachment.deleteMany()
    await tx.ticketMessage.deleteMany()
    await tx.ticket.deleteMany()
    await tx.providerReview.deleteMany()
    await tx.provider.deleteMany()
    await tx.jobMatch.deleteMany()
    await tx.application.deleteMany()
    await tx.savedJob.deleteMany()
    await tx.jobLanguage.deleteMany()
    await tx.jobSkill.deleteMany()
    await tx.job.deleteMany()
    await tx.jobSource.deleteMany()
    await tx.task.deleteMany()
    await tx.userJourneyStep.deleteMany()
    await tx.journeyStep.deleteMany()
    await tx.journeyTemplate.deleteMany()
    await tx.documentVersion.deleteMany()
    await tx.document.deleteMany()
    await tx.userSkill.deleteMany()
    await tx.userLanguage.deleteMany()
    await tx.userProfile.deleteMany()
    await tx.refreshSession.deleteMany()
    await tx.user.deleteMany()
    await tx.skill.deleteMany()
    await tx.language.deleteMany()
    await tx.communityOpportunity.deleteMany()
    await tx.citizenshipPath.deleteMany()
    await tx.guide.deleteMany()

    // ---- reference tables ----
    const skillById = new Map<string, string>()
    for (const s of skills) {
      const row = await tx.skill.create({ data: { name: s.name, category: s.category } })
      skillById.set(s.name, row.id)
    }

    const langById = new Map<string, string>()
    for (const [name, code] of Object.entries(LANGUAGE_CODES)) {
      const row = await tx.language.create({ data: { name, code } })
      langById.set(name, row.id)
    }

    // ---- demo user ----
    const passwordHash = await bcrypt.hash(DEV_PASSWORD, 10)
    const user = await tx.user.create({
      data: {
        email: 'ali.rezaei@example.com',
        fullName: 'علی رضایی',
        passwordHash,
        role: 'USER',
        country: 'TR',
        city: 'Istanbul',
        onboarded: true,
        createdAt: daysFrom(-27),
        profile: {
          create: {
            status: 'tourist_residence',
            profession: 'Graphic & Web Designer',
            yearsOfExperience: 8,
            addressRegistered: true,
            passportExpiresAt: daysFrom(200),
            insuranceExpiresAt: daysFrom(120),
            rentalContractEndsAt: daysFrom(90),
            permitExpiresAt: daysFrom(72),
            residenceStartedAt: daysFrom(-27),
            // careerScoreCache intentionally null — computed by the career service.
          },
        },
      },
    })

    // admin user for the (conceptual) admin surface
    await tx.user.create({
      data: {
        email: 'admin@example.com',
        fullName: 'مدیر نمونه',
        passwordHash,
        role: 'ADMIN',
        country: 'TR',
        city: 'Istanbul',
        onboarded: true,
      },
    })

    // ---- user skills & languages ----
    for (const s of skills) {
      if (s.level == null) continue
      await tx.userSkill.create({
        data: { userId: user.id, skillId: skillById.get(s.name)!, level: s.level },
      })
    }
    const userLanguages: [string, Prisma.UserLanguageCreateInput['level']][] = [
      ['فارسی', 'Native'],
      ['انگلیسی', 'Intermediate'],
      ['ترکی', 'Beginner'],
    ]
    for (const [name, level] of userLanguages) {
      await tx.userLanguage.create({
        data: { userId: user.id, languageId: langById.get(name)!, level },
      })
    }

    // ---- documents (storageKey is a placeholder; no bytes stored in Postgres) ----
    for (const d of rawDocuments) {
      const fileName = d.fileName || `${d.id}.pdf`
      await tx.document.create({
        data: {
          userId: user.id,
          type: d.type,
          originalFilename: fileName,
          storageKey: `seed/documents/${user.id}/${d.id}/${fileName}`,
          mimeType: 'application/pdf',
          sizeBytes: 184_320,
          status: d.status,
          verification: d.status === 'ready' ? 'verified' : 'unverified',
          expiresAt: d.expiresDaysFromNow == null ? null : daysFrom(d.expiresDaysFromNow),
          uploadedAt: daysFrom(-d.updatedDaysAgo),
        },
      })
    }

    // ---- journey template + user progress ----
    const template = await tx.journeyTemplate.create({
      data: {
        key: 'onboarding-90',
        title: 'برنامه ۹۰ روزه استقرار',
        totalDays: 90,
        description: 'مسیر نمونه ۹۰ روزه برای تازه‌واردها.',
      },
    })
    for (let i = 0; i < journeyStepsRaw.length; i++) {
      const raw = journeyStepsRaw[i]
      const step = await tx.journeyStep.create({
        data: {
          templateId: template.id,
          key: raw.key,
          day: raw.day,
          title: raw.title,
          order: i,
          ctaLabel: raw.ctaLabel,
          ctaTo: raw.ctaTo,
        },
      })
      await tx.userJourneyStep.create({
        data: {
          userId: user.id,
          stepId: step.id,
          status: raw.status,
          dueAt: daysFrom(raw.day - 27),
          completedAt: raw.status === 'done' ? daysFrom(raw.day - 27) : null,
        },
      })
      // checklist items become tasks linked to this step, scoped to its due date
      for (const label of raw.checklist) {
        await tx.task.create({
          data: {
            userId: user.id,
            stepId: step.id,
            title: label,
            dueAt: daysFrom(raw.day - 27),
            completedAt: raw.status === 'done' ? daysFrom(raw.day - 27) : null,
          },
        })
      }
    }
    for (const label of todayTasks) {
      await tx.task.create({ data: { userId: user.id, title: label, dueAt: SEED_NOW } })
    }

    // ---- job sources + jobs ----
    const sourceIdByName = new Map<string, string>()
    for (const name of jobSources) {
      const row = await tx.jobSource.create({
        data: {
          name,
          adapterKey: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          enabled: false, // no real integration wired yet
          health: 'unknown',
        },
      })
      sourceIdByName.set(name, row.id)
    }

    for (const j of rawJobs) {
      const { min, max } = parseSalary(j.salary)
      const job = await tx.job.create({
        data: {
          sourceId: sourceIdByName.get(j.source)!,
          externalId: j.id,
          title: j.title,
          company: j.company,
          location: j.location,
          employmentType: EMPLOYMENT_TYPE[j.employmentType] ?? 'FULL_TIME',
          remote: j.type.toLowerCase().includes('remote'),
          salaryMin: min,
          salaryMax: max,
          currency: 'TRY',
          sourceUrl: j.sourceUrl,
          postedAt: daysFrom(-j.postedDaysAgo),
          status: 'active',
        },
      })
      for (const skillName of j.skills) {
        const skillId = skillById.get(skillName)
        if (skillId) await tx.jobSkill.create({ data: { jobId: job.id, skillId } })
      }
      for (const langName of j.languages) {
        const languageId = langById.get(langName)
        if (languageId) await tx.jobLanguage.create({ data: { jobId: job.id, languageId } })
      }
    }
    // NOTE: job_matches are NOT seeded — the matching service computes them (P9).

    // ---- providers (+ their reviews, then a computed trust score) ----
    for (const p of rawProviders) {
      const ratings = [...p.ratings]

      await tx.provider.create({
        data: {
          id: p.id,
          name: p.name,
          category: p.category,
          specialty: p.specialty,
          location: p.location,
          languages: [...p.languages],
          priceMin: p.priceMin,
          priceMax: p.priceMax,
          currency: p.currency,
          trustScore: computeTrustScore(p.verified, ratings),
          verified: p.verified,
          verifiedAt: p.verified ? daysFrom(-40) : null,
          status: 'active',
        },
      })

      // Seed the reviews so trust is derived from real evidence, not a constant.
      // Authorship is null: these are anonymized sample reviews, not the demo user's.
      for (let i = 0; i < ratings.length; i++) {
        await tx.providerReview.create({
          data: {
            providerId: p.id,
            authorId: null,
            rating: ratings[i],
            comment: null,
            createdAt: daysFrom(-(ratings.length - i) * 3 - 2),
          },
        })
      }
    }

    // ---- tickets ----
    for (const t of rawTickets) {
      const ticket = await tx.ticket.create({
        data: {
          code: t.code,
          userId: user.id,
          subject: t.subject,
          status: t.status,
          priority: t.priority,
          createdAt: daysFrom(-t.createdDaysAgo),
          updatedAt: daysFrom(-t.updatedDaysAgo),
        },
      })
      await tx.ticketMessage.create({
        data: {
          ticketId: ticket.id,
          authorId: user.id,
          isStaff: false,
          body: t.body,
          createdAt: daysFrom(-t.createdDaysAgo),
        },
      })
    }

    // ---- guides ----
    for (const g of rawGuides) {
      await tx.guide.create({
        data: {
          slug: g.slug,
          title: g.title,
          audience: g.audience,
          whenToAct: g.whenToAct,
          documents: g.documents as unknown as Prisma.InputJsonValue,
          steps: g.steps as unknown as Prisma.InputJsonValue,
          warnings: g.warnings as unknown as Prisma.InputJsonValue,
          officialSource: g.officialSource,
          jurisdiction: 'TR',
          lastVerifiedAt: daysFrom(-g.updatedDaysAgo),
          updatedAt: daysFrom(-g.updatedDaysAgo),
        },
      })
    }

    // ---- citizenship paths ----
    for (const c of rawCitizenship) {
      await tx.citizenshipPath.create({
        data: {
          goal: c.goal,
          jurisdiction: 'TR',
          title: c.title,
          summary: c.summary,
          minYears: c.minYears,
          steps: c.steps as unknown as Prisma.InputJsonValue,
          disclaimer: DISCLAIMER,
        },
      })
    }

    // ---- community opportunities ----
    for (const c of rawCommunity) {
      await tx.communityOpportunity.create({
        data: {
          title: c.title,
          source: c.source,
          channel: c.channel,
          category: c.category,
          trustLevel: c.trustLevel,
          url: c.url,
          postedAt: daysFrom(-c.postedDaysAgo),
        },
      })
    }

    // ---- notifications ----
    const notifications: { type: Prisma.NotificationCreateInput['type']; event: Prisma.NotificationCreateInput['event']; title: string; body: string; read: boolean; createdDaysAgo: number }[] = [
      { type: 'warning', event: 'DOCUMENT_EXPIRING', title: 'مهلت اقامت توریستی', body: '۷۲ روز تا پایان مهلت اقامت فعلی باقی مانده است.', read: false, createdDaysAgo: 0 },
      { type: 'info', event: 'JOB_MATCHED', title: 'فرصت شغلی جدید', body: 'یک فرصت UI/UX Designer برای شما ثبت شد.', read: false, createdDaysAgo: 1 },
      { type: 'info', event: 'TICKET_REPLIED', title: 'قرارداد اجاره', body: 'بررسی قرارداد اجاره در تیکت #PN-1042 در انتظار پاسخ شماست.', read: true, createdDaysAgo: 2 },
    ]
    for (const n of notifications) {
      await tx.notification.create({
        data: {
          userId: user.id,
          type: n.type,
          event: n.event,
          title: n.title,
          body: n.body,
          read: n.read,
          readAt: n.read ? daysFrom(-n.createdDaysAgo) : null,
          createdAt: daysFrom(-n.createdDaysAgo),
        },
      })
    }
  })

  console.log('Seed complete.')
  console.log(`  demo user : ali.rezaei@example.com / ${DEV_PASSWORD}`)
  console.log(`  admin user: admin@example.com / ${DEV_PASSWORD}`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
