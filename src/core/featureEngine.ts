export type ModuleId =
  | 'mod-1-canvas'
  | 'mod-3-math'
  | 'mod-4-physics'
  | 'mod-5-chemistry'
  | 'mod-6-bio-lit'
  | 'mod-9-export'
  | 'mod-10-ai';

export interface SubFeature {
  id: string;
  moduleId: ModuleId;
  title: string;
  description: string;
  enabled: boolean;
  ramMb: number;
  cpuPct: number;
  badge?: string;
}

export interface AppModule {
  id: ModuleId;
  number: number;
  title: string;
  shortTitle: string;
  category: 'core' | 'stem-labs' | 'humanities' | 'media-studio' | 'intelligence';
  description: string;
  enabled: boolean;
  baseRamMb: number;
  subFeatures: SubFeature[];
}

export type TeachingProfileId =
  | 'simple'
  | 'elementary'
  | 'math-geometry'
  | 'physics-lab'
  | 'chemistry-lab'
  | 'bio-humanities'
  | 'full-suite';

export interface TeachingProfile {
  id: TeachingProfileId;
  title: string;
  subtitle: string;
  targetAudience: string;
  enabledSubFeatureIds: string[];
  recommendedBackground: CanvasBackgroundId;
  recommendedLabTab?: 'math' | 'physics' | 'chemistry' | 'humanities';
}

export type CanvasBackgroundId =
  | 'white'
  | 'blackboard'
  | 'greenboard'
  | 'sepia'
  | 'lined'
  | 'grid'
  | 'dots'
  | 'isometric'
  | 'music';

export const INITIAL_MODULES: AppModule[] = [
  {
    id: 'mod-1-canvas',
    number: 1,
    title: 'ماژول ۱: بوم، فضای کار و موتور نوشتاری',
    shortTitle: 'بوم و قلم هوشمند',
    category: 'core',
    description: 'بوم بی‌نهایت و صفحه‌بندی شده، لایه‌بندی فتوشاپی، تثبیت‌کننده دستخط، قلم لیزری، تشخیص اشکال چندضلعی و نوشتن روی دسکتاپ',
    enabled: true,
    baseRamMb: 65,
    subFeatures: [
      {
        id: 'infinite-paginated-canvas',
        moduleId: 'mod-1-canvas',
        title: 'بوم دوگانه (بی‌نهایت / صفحه‌بندی A4 و 16:9)',
        description: 'سوئیچ آنی بین نقشه ذهنی بی‌نهایت و صفحات استاندارد جزوه‌نویسی',
        enabled: true,
        ramMb: 28,
        cpuPct: 2,
      },
      {
        id: 'photoshop-layers',
        moduleId: 'mod-1-canvas',
        title: 'سیستم لایه‌بندی پیشرفته (Photoshop-style Layers)',
        description: 'قفل لایه سوالات، نوشتن در لایه حل، و آشکارسازی لایه پاسخ با یک کلیک',
        enabled: true,
        ramMb: 24,
        cpuPct: 1.5,
      },
      {
        id: 'stroke-stabilizer',
        moduleId: 'mod-1-canvas',
        title: 'تثبیت‌کننده دستخط و حساسیت فشار قلم (Wacom)',
        description: 'حذف لرزش دست و موس در لحظه (Real-time Smoothing) + هایلایتر زیر متن',
        enabled: true,
        ramMb: 18,
        cpuPct: 2.5,
      },
      {
        id: 'laser-vanishing-pen',
        moduleId: 'mod-1-canvas',
        title: 'قلم لیزری و ماژیک محوشونده (Vanishing Pen)',
        description: 'کشیدن خط تاکید که پس از ۲.۵ ثانیه به آرامی محو می‌شود',
        enabled: true,
        ramMb: 12,
        cpuPct: 1,
      },
      {
        id: 'hold-to-snap-shapes',
        moduleId: 'mod-1-canvas',
        title: 'تشخیص خودکار اشکال هندسی و چندضلعی‌ها (۵، ۶ و ۸ ضلعی)',
        description: 'تبدیل خودکار ترسیم دست‌آزاد به خط، مثلث، مربع، مستطیل، لوزی، ذوزنقه، پنج‌ضلعی، شش‌ضلعی، هشت‌ضلعی، دایره و بیضی',
        enabled: true,
        ramMb: 22,
        cpuPct: 2,
      },
      {
        id: 'split-screen-minimap',
        moduleId: 'mod-1-canvas',
        title: 'نمایش PDF تمام‌صفحه روی وایت‌برد و تقسیم صفحه کنار تخته',
        description: 'وارد کردن PDF مستقیم روی تخته در حالت تمام‌صفحه یا نمایش همزمان کنار تخته',
        enabled: true,
        ramMb: 35,
        cpuPct: 3,
      },
      {
        id: 'desktop-overlay-mode',
        moduleId: 'mod-1-canvas',
        title: 'حالت نوشتن روی دسکتاپ (Desktop Overlay Mode)',
        description: 'شفاف شدن شیشه‌ای پس‌زمینه تخته برای خط کشیدن و تدریس روی نمای دسکتاپ',
        enabled: true,
        ramMb: 30,
        cpuPct: 2.5,
      },
    ],
  },
  {
    id: 'mod-3-math',
    number: 2,
    title: 'ماژول ۲: فرمول‌نویس بصری، ریاضیات، هندسه و آمار',
    shortTitle: 'آزمایشگاه ریاضی و هندسه',
    category: 'stem-labs',
    description: 'اعداد فارسی، کسر پیتزایی تعاملی، محور اعداد، مکعب‌های ارزش مکانی دبستان، تقسیم چکشی و رسم نمودار مشتق/انتگرال',
    enabled: true,
    baseRamMb: 55,
    subFeatures: [
      {
        id: 'persian-math-builder',
        moduleId: 'mod-3-math',
        title: 'فرمول‌ساز بصری، تقسیم چکشی ایرانی و اعداد فارسی',
        description: 'ساختار کسر، رادیکال، انتگرال، ماتریس و تقسیم چکشی کتاب درسی ایران با اعداد فارسی',
        enabled: true,
        ramMb: 25,
        cpuPct: 1.5,
      },
      {
        id: 'interactive-fraction-widget',
        moduleId: 'mod-3-math',
        title: 'ابزارک هوشمند کسر، درصد و اعشار (پیتزایی و نواری)',
        description: 'تقسیم شکل به N بخش مساوی، رنگ‌آمیزی تعاملی و نمایش زنده کسر + اعشار + درصد',
        enabled: true,
        ramMb: 28,
        cpuPct: 2,
      },
      {
        id: 'smart-number-line',
        moduleId: 'mod-3-math',
        title: 'محور اعداد هوشمند با کمان‌های پرش و دستگاه مختصات',
        description: 'ترسیم محور با گام دلخواه، تقسیمات کسری و رسم خودکار کمان جمع/تفریق بالای محور',
        enabled: true,
        ramMb: 22,
        cpuPct: 1.5,
      },
      {
        id: 'elementary-base10-blocks',
        moduleId: 'mod-3-math',
        title: 'ابزارک‌های ویژه دبستان (مکعب ارزش مکانی، چرتکه، تخته میخی)',
        description: 'ادغام ۱۰ یکی به ۱ ده‌تایی و شکستن ده‌تایی برای آموزش قرض گرفتن + چوب‌خط',
        enabled: false,
        ramMb: 34,
        cpuPct: 2.5,
      },
      {
        id: 'dynamic-geometry-3dnets',
        moduleId: 'mod-3-math',
        title: 'هندسه پویا، گسترده اشکال سه‌بعدی (3D Nets) و خط تقارن زنده',
        description: 'باز شدن مکعب و هرم سه‌بعدی با اسلایدر، نمایش زنده زوایا و ترسیم آینه‌ای',
        enabled: false,
        ramMb: 48,
        cpuPct: 4,
      },
      {
        id: 'calculus-plotter-riemann',
        moduleId: 'mod-3-math',
        title: 'حسابان بصری، خط مماس مشتق و مستطیل‌های ریمان (انتگرال)',
        description: 'رسم فوری تابع (مشابه Desmos)، ترازوی معادلات و نمودار ون مجموعه‌ها',
        enabled: true,
        ramMb: 38,
        cpuPct: 3,
      },
    ],
  },
  {
    id: 'mod-4-physics',
    number: 3,
    title: 'ماژول ۳: آزمایشگاه جامع فیزیک (پوشش ۱۰۰٪)',
    shortTitle: 'آزمایشگاه تعاملی فیزیک',
    category: 'stem-labs',
    description: 'دیاگرام جسم آزاد و سطح شیب‌دار، نوسانگر و موج، مدار الکتریکی، مانومتر لوله U شکل و میز اپتیک و عدسی‌ها',
    enabled: true,
    baseRamMb: 70,
    subFeatures: [
      {
        id: 'inclined-plane-fbd',
        moduleId: 'mod-4-physics',
        title: 'مکانیک: سطح شیب‌دار هوشمند و دیاگرام جسم آزاد (FBD)',
        description: 'تجزیه خودکار بردار وزن به mg sinθ و mg cosθ، نیروی عمودی سطح و اصطکاک با تغییر زاویه',
        enabled: true,
        ramMb: 36,
        cpuPct: 3.5,
      },
      {
        id: 'wave-harmonic-oscillator',
        moduleId: 'mod-4-physics',
        title: 'نوسان و موج: مولد موج زنده و هماهنگ‌ساز وزنه-فنر با نمودار x-t',
        description: 'کنترل دامنه A و بسامد f، موج ایستاده (گره و شکم) و نوسان سینوسی همزمان',
        enabled: false,
        ramMb: 32,
        cpuPct: 3,
      },
      {
        id: 'circuit-electromagnetism',
        moduleId: 'mod-4-physics',
        title: 'الکتریسیته و مغناطیس: شبیه‌ساز مدار سری/موازی و قانون دست راست',
        description: 'اتصال باتری، مقاومت، لامپ، ولت‌سنج و آمپرسنج + خطوط میدان الکتریکی و مغناطیسی',
        enabled: false,
        ramMb: 45,
        cpuPct: 4,
      },
      {
        id: 'fluid-manometer-pv',
        moduleId: 'mod-4-physics',
        title: 'فشار و ترمودینامیک: لوله U شکل (مانومتر) و نمودار P-V گازها',
        description: 'ریختن چند مایع با چگالی متفاوت، رسم خط تراز هم‌فشار و پیستون هم‌دما/بی‌دررو',
        enabled: false,
        ramMb: 30,
        cpuPct: 2.5,
      },
      {
        id: 'optics-bench-bohr',
        moduleId: 'mod-4-physics',
        title: 'نور و اتمی: میز اپتیک هوشمند (آینه/عدسی)، منشور و ترازهای بور',
        description: 'رسم خودکار پرتوهای تابش/بازتاب، تشکیل تصویر حقیقی/مجازی و جهش الکترون در اتم بور',
        enabled: true,
        ramMb: 38,
        cpuPct: 3.5,
      },
    ],
  },
  {
    id: 'mod-5-chemistry',
    number: 4,
    title: 'ماژول ۴: آزمایشگاه جامع شیمی (پوشش ۱۰۰٪)',
    shortTitle: 'آزمایشگاه تعاملی شیمی',
    category: 'stem-labs',
    description: 'جدول تناوبی و آرایش الکترونی اوربیتالی (قاعده هوند)، ساختار لوویس و VSEPR، شیمی آلی، سلول گالوانی و تیتراسیون',
    enabled: false,
    baseRamMb: 60,
    subFeatures: [
      {
        id: 'periodic-table-hund',
        moduleId: 'mod-5-chemistry',
        title: 'جدول تناوبی تعاملی و آرایش الکترونی مربعی (قاعده هوند)',
        description: 'کارت اطلاعات عنصر و پر شدن خودکار فلش‌های اسپین (↑↓) در اوربیتال‌های s, p, d',
        enabled: false,
        ramMb: 30,
        cpuPct: 2,
      },
      {
        id: 'lewis-vsepr-3d',
        moduleId: 'mod-5-chemistry',
        title: 'ساختار لوویس و مدل‌های فضایی سه‌بعدی VSEPR',
        description: 'چیدمان جفت‌الکترون‌های ناپیوندی و چرخش سه‌بعدی مولکول با نمایش زاویه پیوندی',
        enabled: false,
        ramMb: 42,
        cpuPct: 3.5,
      },
      {
        id: 'organic-iupac-kit',
        moduleId: 'mod-5-chemistry',
        title: 'کیت شیمی آلی و شماره‌گذاری زنجیره کربنی (IUPAC)',
        description: 'رسم سریع فرمول اسکلتی، حلقه بنزن، گروه‌های عاملی و شماره‌گذاری رنگی کربن‌ها',
        enabled: false,
        ramMb: 28,
        cpuPct: 2,
      },
      {
        id: 'galvanic-stoichiometry-titration',
        moduleId: 'mod-5-chemistry',
        title: 'سلول گالوانی، کسرهای تبدیل استوکیومتری و ظروف تیتراسیون',
        description: 'شبیه‌ساز آند و کاتد و پل نمکی، خط زدن رنگی واحدهای استوکیومتری و نمودار انرژی فعال‌سازی Ea',
        enabled: false,
        ramMb: 36,
        cpuPct: 3,
      },
    ],
  },
  {
    id: 'mod-6-bio-lit',
    number: 5,
    title: 'ماژول ۵: زیست‌شناسی، ادبیات، عربی، زبان و دروس عمومی',
    shortTitle: 'زیست، ادبیات و علوم انسانی',
    category: 'humanities',
    description: 'اطلس لایه‌ای زیست و مربع پانت، تقطیع عروضی شعر، حرکت‌گذاری رنگی عربی، کیبورد فونتیک و نقشه لال جغرافیا',
    enabled: false,
    baseRamMb: 50,
    subFeatures: [
      {
        id: 'biology-atlas-punnett',
        moduleId: 'mod-6-bio-lit',
        title: 'اطلس لایه‌ای زیست‌شناسی (قلب، کلیه، سلول، DNA) و مربع پانت',
        description: 'مخفی/آشکارسازی برچسب‌های آناتومی با یک کلیک و شجره‌نامه ژنتیک استاندارد',
        enabled: false,
        ramMb: 38,
        cpuPct: 2.5,
      },
      {
        id: 'persian-prosody-syntax',
        moduleId: 'mod-6-bio-lit',
        title: 'ادبیات فارسی: کیبورد تقطیع عروضی (∪ / −) و نمودار درختی جمله',
        description: 'درج هجای کوتاه، بلند و کشیده زیر ابیات شعر، خط تحریری و تجزیه گروه اسمی/فعلی',
        enabled: false,
        ramMb: 20,
        cpuPct: 1,
      },
      {
        id: 'arabic-harakat-conjugation',
        moduleId: 'mod-6-bio-lit',
        title: 'عربی و قرآن: حرکت‌گذاری درشت و رنگی و جدول ۱۴ صیغه فعل',
        description: 'درج فتحه، کسره، ضمه، تنوین و تشدید با رنگ متمایز روی کلمات برای آموزش اعراب',
        enabled: false,
        ramMb: 18,
        cpuPct: 1,
      },
      {
        id: 'english-geography-accounting',
        moduleId: 'mod-6-bio-lit',
        title: 'زبان انگلیسی (IPA)، نقشه لال استان‌های ایران و حساب T حسابداری',
        description: 'چهارخطه انگلیسی، فلش‌کارت دوطرفه، رنگ‌آمیزی نقشه ایران و نمودار عرضه و تقاضا',
        enabled: false,
        ramMb: 26,
        cpuPct: 1.5,
      },
    ],
  },
  {
    id: 'mod-9-export',
    number: 6,
    title: 'ماژول ۶: خروجی جزوه PDF، چاپ استاندارد و امنیت محتوا',
    shortTitle: 'خروجی جزوه PDF و امنیت',
    category: 'media-studio',
    description: 'خروجی خودکار جزوه PDF جلسه، قالب‌های چاپی A4 و واترمارک شناور ضد سرقت',
    enabled: true,
    baseRamMb: 40,
    subFeatures: [
      {
        id: 'one-click-class-notes-pdf',
        moduleId: 'mod-9-export',
        title: 'خروجی خودکار «جزوه PDF جلسه» (One-Click Class Notes PDF)',
        description: 'تولید جزوه استاندارد حاوی هدر، نام استاد، تاریخ، موضوع و شماره صفحه با یک کلیک',
        enabled: true,
        ramMb: 22,
        cpuPct: 1.5,
      },
      {
        id: 'anti-piracy-floating-watermark',
        moduleId: 'mod-9-export',
        title: 'واترمارک امنیتی و پویا ضد سرقت (Floating Watermark)',
        description: 'نمایش کد اختصاصی و شناسه مدرس روی تخته و جزوه برای جلوگیری از کپی غیرمجاز',
        enabled: true,
        ramMb: 15,
        cpuPct: 1,
      },
    ],
  },
  {
    id: 'mod-10-ai',
    number: 7,
    title: 'ماژول ۷: دست‌نویس آفلاین (سبک کیبورد گوگل) و فلوچارت‌ساز',
    shortTitle: 'دست‌نویس آفلاین و فلوچارت',
    category: 'intelligence',
    description: 'تشخیص آفلاین اعداد، حروف و کلمات فارسی و انگلیسی و علائم با الگوگیری از صفحه‌کلید گوگل (Gboard) + فلوچارت از متن',
    enabled: true,
    baseRamMb: 85,
    subFeatures: [
      {
        id: 'handwriting-math-ocr',
        moduleId: 'mod-10-ai',
        title: 'پد دست‌نویس آفلاین (سبک صفحه‌کلید گوگل): اعداد، حروف و کلمات فارسی/انگلیسی',
        description: 'تشخیص ۱۰۰٪ آفلاین اعداد فارسی (۰-۹) و انگلیسی (0-9)، حروف، نشانه‌ها و نوشتار فارسی و انگلیسی با بالاترین دقت',
        enabled: true,
        ramMb: 45,
        cpuPct: 3.5,
      },
      {
        id: 'handwriting-beautifier',
        moduleId: 'mod-10-ai',
        title: 'مرتب‌سازی هوشمند دستخط (Handwriting Beautifier)',
        description: 'صاف و خوش‌فرم کردن دستخط مدرس در لحظه روی تخته سفید با حفظ استایل نوشتاری شخصی',
        enabled: true,
        ramMb: 30,
        cpuPct: 2.5,
      },
      {
        id: 'text-to-diagram',
        moduleId: 'mod-10-ai',
        title: 'تولید دیاگرام و فلوچارت قابل ویرایش از متن',
        description: 'تبدیل دستور متنی مدرس به نمودار مرحله‌ای و فلوچارت روی تخته سفید با یک کلیک',
        enabled: true,
        ramMb: 28,
        cpuPct: 2,
      },
    ],
  },
];

export const TEACHING_PROFILES: TeachingProfile[] = [
  {
    id: 'simple',
    title: 'حالت ساده و فوق‌سبک',
    subtitle: 'فقط تخته و قلم پایه (حداقل مصرف منابع)',
    targetAudience: 'لپ‌تاپ‌های اقتصادی و تدریس سریع روزمره',
    enabledSubFeatureIds: [
      'infinite-paginated-canvas',
      'stroke-stabilizer',
      'laser-vanishing-pen',
      'one-click-class-notes-pdf',
    ],
    recommendedBackground: 'white',
  },
  {
    id: 'elementary',
    title: 'دبستان (اول تا ششم)',
    subtitle: 'کسر پیتزایی، محور اعداد، مکعب ارزش مکانی و دست‌نویس آفلاین',
    targetAudience: 'آموزگاران دوره ابتدایی',
    enabledSubFeatureIds: [
      'infinite-paginated-canvas',
      'stroke-stabilizer',
      'hold-to-snap-shapes',
      'handwriting-math-ocr',
      'persian-math-builder',
      'interactive-fraction-widget',
      'smart-number-line',
      'elementary-base10-blocks',
      'persian-prosody-syntax',
      'one-click-class-notes-pdf',
    ],
    recommendedBackground: 'lined',
    recommendedLabTab: 'math',
  },
  {
    id: 'math-geometry',
    title: 'ریاضی، هندسه و حسابان',
    subtitle: 'تشخیص چندضلعی‌ها، دست‌نویس، فرمول‌ساز، محور و نمودار مشتق/انتگرال',
    targetAudience: 'دبیران ریاضی متوسطه و اساتید دانشگاه',
    enabledSubFeatureIds: [
      'infinite-paginated-canvas',
      'photoshop-layers',
      'stroke-stabilizer',
      'hold-to-snap-shapes',
      'handwriting-math-ocr',
      'persian-math-builder',
      'interactive-fraction-widget',
      'smart-number-line',
      'dynamic-geometry-3dnets',
      'calculus-plotter-riemann',
      'one-click-class-notes-pdf',
    ],
    recommendedBackground: 'grid',
    recommendedLabTab: 'math',
  },
  {
    id: 'physics-lab',
    title: 'آزمایشگاه جامع فیزیک',
    subtitle: 'سطح شیب‌دار و FBD، نوسان و موج، مدار الکتریکی، مانومتر و اپتیک',
    targetAudience: 'اساتید فیزیک دبیرستان، کنکور و دانشگاه',
    enabledSubFeatureIds: [
      'infinite-paginated-canvas',
      'photoshop-layers',
      'stroke-stabilizer',
      'hold-to-snap-shapes',
      'handwriting-math-ocr',
      'persian-math-builder',
      'inclined-plane-fbd',
      'wave-harmonic-oscillator',
      'circuit-electromagnetism',
      'fluid-manometer-pv',
      'optics-bench-bohr',
      'one-click-class-notes-pdf',
    ],
    recommendedBackground: 'dots',
    recommendedLabTab: 'physics',
  },
  {
    id: 'chemistry-lab',
    title: 'آزمایشگاه جامع شیمی',
    subtitle: 'جدول تناوبی، آرایش اوربیتالی هوند، لوویس، شیمی آلی و گالوانی',
    targetAudience: 'اساتید شیمی دبیرستان و کنکور',
    enabledSubFeatureIds: [
      'infinite-paginated-canvas',
      'photoshop-layers',
      'stroke-stabilizer',
      'handwriting-math-ocr',
      'periodic-table-hund',
      'lewis-vsepr-3d',
      'organic-iupac-kit',
      'galvanic-stoichiometry-titration',
      'one-click-class-notes-pdf',
    ],
    recommendedBackground: 'sepia',
    recommendedLabTab: 'chemistry',
  },
  {
    id: 'bio-humanities',
    title: 'زیست، ادبیات و عربی',
    subtitle: 'اطلس آناتومی، مربع پانت، تقطیع عروضی شعر و اعراب‌گذاری رنگی',
    targetAudience: 'اساتید زیست‌شناسی، ادبیات فارسی، عربی و علوم انسانی',
    enabledSubFeatureIds: [
      'infinite-paginated-canvas',
      'photoshop-layers',
      'stroke-stabilizer',
      'laser-vanishing-pen',
      'handwriting-math-ocr',
      'biology-atlas-punnett',
      'persian-prosody-syntax',
      'arabic-harakat-conjugation',
      'english-geography-accounting',
      'one-click-class-notes-pdf',
    ],
    recommendedBackground: 'sepia',
    recommendedLabTab: 'humanities',
  },
  {
    id: 'full-suite',
    title: 'حالت کامل (تمام ۷ ماژول روشن)',
    subtitle: 'فعال‌سازی ۱۰۰٪ ابزارهای تخته، دست‌نویس آفلاین، آزمایشگاه‌ها و خروجی جزوه',
    targetAudience: 'سیستم‌های دسکتاپ قدرتمند و بررسی کامل امکانات',
    enabledSubFeatureIds: INITIAL_MODULES.flatMap((m) => m.subFeatures.map((sf) => sf.id)),
    recommendedBackground: 'grid',
    recommendedLabTab: 'physics',
  },
];

export function applyTeachingProfile(
  profileId: TeachingProfileId,
  modules: AppModule[]
): AppModule[] {
  const profile = TEACHING_PROFILES.find((p) => p.id === profileId);
  if (!profile) return modules;
  const enabledSet = new Set(profile.enabledSubFeatureIds);

  return modules.map((mod) => {
    const updatedSubs = mod.subFeatures.map((sf) => ({
      ...sf,
      enabled: enabledSet.has(sf.id),
    }));
    const anySubEnabled = updatedSubs.some((sf) => sf.enabled);
    return {
      ...mod,
      enabled: anySubEnabled,
      subFeatures: updatedSubs,
    };
  });
}

export function toggleModuleMaster(
  modules: AppModule[],
  moduleId: ModuleId,
  forceState?: boolean
): AppModule[] {
  return modules.map((mod) => {
    if (mod.id !== moduleId) return mod;
    const nextEnabled = forceState !== undefined ? forceState : !mod.enabled;
    return {
      ...mod,
      enabled: nextEnabled,
      subFeatures: mod.subFeatures.map((sf) => ({
        ...sf,
        enabled: nextEnabled,
      })),
    };
  });
}

export function toggleSubFeature(
  modules: AppModule[],
  moduleId: ModuleId,
  subFeatureId: string,
  forceState?: boolean
): AppModule[] {
  return modules.map((mod) => {
    if (mod.id !== moduleId) return mod;
    const updatedSubs = mod.subFeatures.map((sf) =>
      sf.id === subFeatureId
        ? { ...sf, enabled: forceState !== undefined ? forceState : !sf.enabled }
        : sf
    );
    const anyEnabled = updatedSubs.some((sf) => sf.enabled);
    return {
      ...mod,
      enabled: anyEnabled,
      subFeatures: updatedSubs,
    };
  });
}

export interface ResourceMetrics {
  activeModulesCount: number;
  totalModulesCount: number;
  activeSubFeaturesCount: number;
  totalSubFeaturesCount: number;
  usedRamMb: number;
  maxRamMb: number;
  savedRamMb: number;
  usedCpuPct: number;
  maxCpuPct: number;
  ramSavingsPercent: number;
}

export function calculateResourceUsage(modules: AppModule[]): ResourceMetrics {
  const BASE_SHELL_RAM_MB = 95;
  const BASE_SHELL_CPU_PCT = 1.5;

  let activeModulesCount = 0;
  let activeSubFeaturesCount = 0;
  let totalSubFeaturesCount = 0;
  let usedRamMb = BASE_SHELL_RAM_MB;
  let maxRamMb = BASE_SHELL_RAM_MB;
  let usedCpuPct = BASE_SHELL_CPU_PCT;
  let maxCpuPct = BASE_SHELL_CPU_PCT;

  for (const mod of modules) {
    maxRamMb += mod.baseRamMb;
    const hasEnabledSub = mod.subFeatures.some((s) => s.enabled);
    if (mod.enabled && hasEnabledSub) {
      activeModulesCount += 1;
      usedRamMb += mod.baseRamMb;
    }
    for (const sf of mod.subFeatures) {
      totalSubFeaturesCount += 1;
      maxRamMb += sf.ramMb;
      maxCpuPct += sf.cpuPct;
      if (mod.enabled && sf.enabled) {
        activeSubFeaturesCount += 1;
        usedRamMb += sf.ramMb;
        usedCpuPct += sf.cpuPct;
      }
    }
  }

  const savedRamMb = Math.max(0, maxRamMb - usedRamMb);
  const ramSavingsPercent =
    maxRamMb > BASE_SHELL_RAM_MB
      ? Math.round((savedRamMb / (maxRamMb - BASE_SHELL_RAM_MB)) * 100)
      : 0;

  return {
    activeModulesCount,
    totalModulesCount: modules.length,
    activeSubFeaturesCount,
    totalSubFeaturesCount,
    usedRamMb: Math.round(usedRamMb),
    maxRamMb: Math.round(maxRamMb),
    savedRamMb: Math.round(savedRamMb),
    usedCpuPct: Number(usedCpuPct.toFixed(1)),
    maxCpuPct: Number(maxCpuPct.toFixed(1)),
    ramSavingsPercent,
  };
}

export function isSubFeatureActive(modules: AppModule[], subFeatureId: string): boolean {
  for (const mod of modules) {
    if (!mod.enabled) continue;
    for (const sf of mod.subFeatures) {
      if (sf.id === subFeatureId) return sf.enabled;
    }
  }
  return false;
}

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export function toPersianDigits(input: string | number, usePersian = true): string {
  const str = String(input);
  if (!usePersian) return str;
  return str.replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)] ?? d);
}

export interface FractionMetrics {
  numerator: number;
  denominator: number;
  decimal: number;
  percentage: number;
  unitFractionText: string;
  simplifiedNumerator: number;
  simplifiedDenominator: number;
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

export function calculateFractionMetrics(
  numerator: number,
  denominator: number
): FractionMetrics {
  const safeDenom = Math.max(1, Math.min(36, Math.round(denominator)));
  const safeNum = Math.max(0, Math.min(safeDenom, Math.round(numerator)));
  const decimal = Number((safeNum / safeDenom).toFixed(3));
  const percentage = Number(((safeNum / safeDenom) * 100).toFixed(1));
  const divisor = gcd(safeNum, safeDenom);

  return {
    numerator: safeNum,
    denominator: safeDenom,
    decimal,
    percentage,
    unitFractionText: `${safeDenom} تا ۱/${safeDenom}`,
    simplifiedNumerator: safeNum / divisor,
    simplifiedDenominator: safeDenom / divisor,
  };
}

export interface InclinedPlaneMetrics {
  massKg: number;
  angleDeg: number;
  frictionMu: number;
  weightN: number;
  mgSinTheta: number;
  mgCosTheta: number;
  normalForceN: number;
  frictionForceN: number;
  netForceN: number;
  accelerationMs2: number;
  isSliding: boolean;
}

export function calculateInclinedPlanePhysics(
  massKg: number,
  angleDeg: number,
  frictionMu: number,
  g = 9.8
): InclinedPlaneMetrics {
  const rad = (angleDeg * Math.PI) / 180;
  const weightN = Number((massKg * g).toFixed(2));
  const mgSinTheta = Number((weightN * Math.sin(rad)).toFixed(2));
  const mgCosTheta = Number((weightN * Math.cos(rad)).toFixed(2));
  const normalForceN = mgCosTheta;
  const maxFriction = Number((frictionMu * normalForceN).toFixed(2));
  const isSliding = mgSinTheta > maxFriction;
  const frictionForceN = isSliding ? maxFriction : mgSinTheta;
  const netForceN = isSliding ? Number((mgSinTheta - maxFriction).toFixed(2)) : 0;
  const accelerationMs2 = isSliding ? Number((netForceN / massKg).toFixed(2)) : 0;

  return {
    massKg,
    angleDeg,
    frictionMu,
    weightN,
    mgSinTheta,
    mgCosTheta,
    normalForceN,
    frictionForceN,
    netForceN,
    accelerationMs2,
    isSliding,
  };
}

export interface OrbitalBox {
  subshell: string;
  orbitalIndex: number;
  electrons: 0 | 1 | 2;
}

export interface ElectronConfigResult {
  atomicNumber: number;
  notation: string;
  orbitals: OrbitalBox[];
}

const SUBSHELL_ORDER: Array<{ name: string; orbitalsCount: number }> = [
  { name: '1s', orbitalsCount: 1 },
  { name: '2s', orbitalsCount: 1 },
  { name: '2p', orbitalsCount: 3 },
  { name: '3s', orbitalsCount: 1 },
  { name: '3p', orbitalsCount: 3 },
  { name: '4s', orbitalsCount: 1 },
  { name: '3d', orbitalsCount: 5 },
];

export function generateElectronConfig(atomicNumber: number): ElectronConfigResult {
  let remaining = Math.max(1, Math.min(30, Math.round(atomicNumber)));
  const notationParts: string[] = [];
  const orbitals: OrbitalBox[] = [];

  for (const sub of SUBSHELL_ORDER) {
    if (remaining <= 0) break;
    const maxCap = sub.orbitalsCount * 2;
    const fill = Math.min(remaining, maxCap);
    remaining -= fill;
    notationParts.push(`${sub.name}${fill}`);

    const boxes: Array<0 | 1 | 2> = new Array(sub.orbitalsCount).fill(0);
    let toPlace = fill;
    for (let i = 0; i < sub.orbitalsCount && toPlace > 0; i++) {
      boxes[i] = 1;
      toPlace--;
    }
    for (let i = 0; i < sub.orbitalsCount && toPlace > 0; i++) {
      boxes[i] = 2;
      toPlace--;
    }
    boxes.forEach((el, idx) => {
      orbitals.push({
        subshell: sub.name,
        orbitalIndex: idx + 1,
        electrons: el,
      });
    });
  }

  return {
    atomicNumber,
    notation: notationParts.join(' '),
    orbitals,
  };
}
