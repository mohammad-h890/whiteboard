export type ModuleId =
  | 'mod-1-canvas'
  | 'mod-2-pdf-test'
  | 'mod-3-math'
  | 'mod-4-physics'
  | 'mod-5-chemistry'
  | 'mod-6-bio-lit'
  | 'mod-7-recorder'
  | 'mod-8-editor'
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
  | 'konkur-test'
  | 'video-studio'
  | 'full-suite';

export interface TeachingProfile {
  id: TeachingProfileId;
  title: string;
  subtitle: string;
  targetAudience: string;
  enabledSubFeatureIds: string[];
  recommendedBackground: CanvasBackgroundId;
  recommendedLabTab?: 'math' | 'physics' | 'chemistry' | 'humanities' | 'konkur';
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
    description: 'بوم بی‌نهایت و صفحه‌بندی شده، لایه‌بندی فتوشاپی، تثبیت‌کننده دستخط، قلم لیزری و تشخیص شکل',
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
        title: 'تشخیص هوشمند شکل (Hold to Snap) و کانکتورها',
        description: 'نگه داشتن قلم در انتهای ترسیم برای تبدیل به اشکال هندسی صاف و فلش کشسان',
        enabled: true,
        ramMb: 22,
        cpuPct: 2,
      },
      {
        id: 'split-screen-minimap',
        moduleId: 'mod-1-canvas',
        title: 'تقسیم صفحه (Split Screen) و نقشه کوچک (Minimap)',
        description: 'نمایش همزمان PDF و تخته در کنار هم به همراه رادار جابه‌جایی سریع',
        enabled: false,
        ramMb: 35,
        cpuPct: 3,
      },
      {
        id: 'desktop-overlay-mode',
        moduleId: 'mod-1-canvas',
        title: 'حالت نوشتن روی دسکتاپ (Desktop Overlay Mode)',
        description: 'شفاف شدن پس‌زمینه برنامه برای خط کشیدن مستقیم روی ویندوز و مرورگر',
        enabled: false,
        ramMb: 30,
        cpuPct: 2.5,
      },
    ],
  },
  {
    id: 'mod-2-pdf-test',
    number: 2,
    title: 'ماژول ۲: مدیریت فایل، اسکنر PDF و استودیوی حل تست',
    shortTitle: 'استودیوی کنکور و PDF',
    category: 'core',
    description: 'برشگر هوشمند سوال از PDF، تمیزکننده اسکن موبایل، ابزار رد گزینه، پرده مخفی‌کننده و تایمر تست',
    enabled: true,
    baseRamMb: 45,
    subFeatures: [
      {
        id: 'smart-question-clipper',
        moduleId: 'mod-2-pdf-test',
        title: 'برشگر هوشمند سوال (Smart Question Clipper)',
        description: 'کادر کشیدن دور سوال در PDF و انتقال فوری به وسط تخته با فضای حل',
        enabled: true,
        ramMb: 32,
        cpuPct: 2,
      },
      {
        id: 'document-cleaner',
        moduleId: 'mod-2-pdf-test',
        title: 'تمیزکننده پس‌زمینه اسکن (Document Cleaner)',
        description: 'حذف سایه و تاریکی عکس‌های موبایل از برگه‌های امتحانی و سفیدسازی پس‌زمینه',
        enabled: false,
        ramMb: 40,
        cpuPct: 3.5,
      },
      {
        id: 'option-elimination-tool',
        moduleId: 'mod-2-pdf-test',
        title: 'ابزار رد گزینه و تایید گزینه کنکور',
        description: 'ضربدر قرمز استاندارد و کمرنگ‌سازی گزینه غلط + کادر سبز گزینه صحیح با یک کلیک',
        enabled: true,
        ramMb: 14,
        cpuPct: 1,
      },
      {
        id: 'screen-shade-reveal',
        moduleId: 'mod-2-pdf-test',
        title: 'پرده مخفی‌کننده پاسخ (Screen Shade / Reveal Box)',
        description: 'کادر پوشاننده روی پاسخ تشریحی با قابلیت کشیدن مرحله‌به‌مرحله به پایین',
        enabled: true,
        ramMb: 15,
        cpuPct: 1,
      },
      {
        id: 'visual-exam-timer',
        moduleId: 'mod-2-pdf-test',
        title: 'تایمر و کرنومتر تصویری حل تست',
        description: 'تایمر معکوس دایره‌ای و ساعت شنی روی تخته برای مدیریت زمان کنکور',
        enabled: true,
        ramMb: 10,
        cpuPct: 0.8,
      },
    ],
  },
  {
    id: 'mod-3-math',
    number: 3,
    title: 'ماژول ۳: فرمول‌نویس بصری، ریاضیات، هندسه و آمار',
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
    number: 4,
    title: 'ماژول ۴: آزمایشگاه جامع فیزیک (پوشش ۱۰۰٪)',
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
    number: 5,
    title: 'ماژول ۵: آزمایشگاه جامع شیمی (پوشش ۱۰۰٪)',
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
    number: 6,
    title: 'ماژول ۶: زیست‌شناسی، ادبیات، عربی، زبان و دروس عمومی',
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
    id: 'mod-7-recorder',
    number: 7,
    title: 'ماژول ۷: استودیوی ضبط چندکاناله پیشرفته',
    shortTitle: 'استودیوی ضبط ۴ کاناله',
    category: 'media-studio',
    description: 'ضبط مجزای ۴ کانال (تخته، وب‌کم هوشمند، میکروفون، صدای سیستم)، ضبط نامرئی رابط کاربری و تله‌پرامپتر مخفی',
    enabled: true,
    baseRamMb: 85,
    subFeatures: [
      {
        id: 'four-channel-iso-recorder',
        moduleId: 'mod-7-recorder',
        title: 'ضبط ۴ کانال ایزوله (بوم، وب‌کم، میکروفون با حذف نویز، صدای سیستم)',
        description: 'ضبط همزمان در ۴ ترک مستقل برای ویرایش جداگانه سایز وب‌کم و صدا پس از ضبط',
        enabled: true,
        ramMb: 55,
        cpuPct: 6,
      },
      {
        id: 'invisible-ui-recording',
        moduleId: 'mod-7-recorder',
        title: 'ضبط نامرئی رابط کاربری (Invisible UI Recording)',
        description: 'نوار ابزارها و منوها برای مدرس قابل مشاهده است اما در ویدیوی خروجی دانش‌آموز ثبت نمی‌شود',
        enabled: true,
        ramMb: 24,
        cpuPct: 2,
      },
      {
        id: 'invisible-teleprompter',
        moduleId: 'mod-7-recorder',
        title: 'تله‌پرامپتر مخفی (Invisible Teleprompter)',
        description: 'نمایش متن سناریو و نکات جلسه روی مانیتور استاد بدون افتادن در ویدیوی ضبط‌شده',
        enabled: false,
        ramMb: 16,
        cpuPct: 1,
      },
      {
        id: 'spotlight-cinematic-zoom',
        moduleId: 'mod-7-recorder',
        title: 'نورافکن تمرکز (Spotlight) و زوم سینمایی خودکار',
        description: 'تاریک شدن ملایم صفحه به جز دایره روشن دور نوک قلم + نمایش کلیدهای میانبر',
        enabled: false,
        ramMb: 20,
        cpuPct: 2,
      },
    ],
  },
  {
    id: 'mod-8-editor',
    number: 8,
    title: 'ماژول ۸: ویرایشگر ویدیو و ساخت کلیپ داخلی',
    shortTitle: 'ویرایشگر ویدیو چندلایه',
    category: 'media-studio',
    description: 'تایم‌لاین ۴ کاناله، حذف خودکار سکوت‌ها، تند کردن هوشمند نوشتن، زیرنویس خودکار و افکت‌های کنکوری',
    enabled: true,
    baseRamMb: 90,
    subFeatures: [
      {
        id: 'multitrack-timeline-editor',
        moduleId: 'mod-8-editor',
        title: 'تایم‌لاین چندلایه حرفه‌ای (Multi-Track Timeline & Standalone)',
        description: 'برش، جابه‌جایی لایه وب‌کم در ثانیه‌های مختلف، کنترل سرعت و ایمپورت ویدیوی خارجی',
        enabled: true,
        ramMb: 60,
        cpuPct: 5,
      },
      {
        id: 'auto-cut-silence-speedup',
        moduleId: 'mod-8-editor',
        title: 'حذف خودکار سکوت‌ها و تند کردن هوشمند نوشتن (۲× و ۴×)',
        description: 'تشخیص سکوت از روی موج صدا و افزایش سرعت بخش‌های نوشتن طولانی بدون تغییر زیر و بمی صدا',
        enabled: true,
        ramMb: 35,
        cpuPct: 4,
      },
      {
        id: 'auto-captions-persian',
        moduleId: 'mod-8-editor',
        title: 'تولید زیرنویس خودکار فارسی و انگلیسی (Auto-Captions)',
        description: 'تبدیل گفتار مدرس به زیرنویس استایل‌دار قابل ویرایش روی تایم‌لاین',
        enabled: false,
        ramMb: 45,
        cpuPct: 4.5,
      },
      {
        id: 'educational-sfx-callouts',
        moduleId: 'mod-8-editor',
        title: 'کتابخانه مهرهای متحرک کنکوری، افکت صوتی (SFX) و Audio Ducking',
        description: 'مهرهای «نکته کنکوری!»، «دام آموزشی!»، صدای دینگ/تیک‌تاک و کم شدن خودکار موزیک هنگام صحبت',
        enabled: true,
        ramMb: 28,
        cpuPct: 2,
      },
    ],
  },
  {
    id: 'mod-9-export',
    number: 9,
    title: 'ماژول ۹: خروجی‌های هوشمند، تبدیل فرمت و امنیت محتوا',
    shortTitle: 'خروجی PDF، ریلز و امنیت',
    category: 'media-studio',
    description: 'خروجی خودکار جزوه PDF جلسه همراه با ویدیو، تبدیل ۱۶:۹ به ۹:۱۶ (ریلز و شورتس) و واترمارک شناور ضد سرقت',
    enabled: true,
    baseRamMb: 40,
    subFeatures: [
      {
        id: 'one-click-class-notes-pdf',
        moduleId: 'mod-9-export',
        title: 'خروجی خودکار «جزوه PDF جلسه» (One-Click Class Notes PDF)',
        description: 'تولید جزوه PDF استاندارد حاوی هدر، نام استاد، تاریخ، موضوع و شماره صفحه همزمان با رندر ویدیو',
        enabled: true,
        ramMb: 22,
        cpuPct: 1.5,
      },
      {
        id: 'reels-shorts-converter',
        moduleId: 'mod-9-export',
        title: 'تبدیل هوشمند افقی به عمودی (Reels & Shorts 9:16 Converter)',
        description: 'قرارگیری خودکار وب‌کم استاد در یک‌سوم بالایی و بخش فعال تخته در دوسوم پایینی صفحه',
        enabled: false,
        ramMb: 35,
        cpuPct: 3.5,
      },
      {
        id: 'anti-piracy-floating-watermark',
        moduleId: 'mod-9-export',
        title: 'واترمارک امنیتی و پویا ضد سرقت (Floating Watermark)',
        description: 'حرکت آرام و زمان‌بندی‌شده کد اختصاصی و آیدی مدرس روی ویدیو برای جلوگیری از برش یا سرقت',
        enabled: true,
        ramMb: 15,
        cpuPct: 1,
      },
    ],
  },
  {
    id: 'mod-10-ai',
    number: 10,
    title: 'ماژول ۱۰: دستیار هوش مصنوعی (کاملاً قابل خاموش/روشن)',
    shortTitle: 'دستیار هوش مصنوعی (OCR)',
    category: 'intelligence',
    description: 'تبدیل دستخط فارسی و فرمول ریاضی به تایپ استاندارد، مرتب‌سازی لحظه‌ای دستخط و تولید فلوچارت از متن',
    enabled: false,
    baseRamMb: 110,
    subFeatures: [
      {
        id: 'handwriting-math-ocr',
        moduleId: 'mod-10-ai',
        title: 'تبدیل دستخط به متن و فرمول استاندارد (OCR & Math OCR)',
        description: 'تشخیص دستخط فارسی، انگلیسی و معادلات ریاضی و تبدیل به LaTeX و فونت استاندارد',
        enabled: false,
        ramMb: 65,
        cpuPct: 5.5,
      },
      {
        id: 'handwriting-beautifier',
        moduleId: 'mod-10-ai',
        title: 'مرتب‌سازی هوشمند دستخط (Handwriting Beautifier)',
        description: 'صاف و خوش‌فرم کردن دستخط مدرس در لحظه با حفظ استایل نوشتاری شخصی',
        enabled: false,
        ramMb: 45,
        cpuPct: 4,
      },
      {
        id: 'text-to-diagram',
        moduleId: 'mod-10-ai',
        title: 'تولید دیاگرام و فلوچارت قابل ویرایش از متن',
        description: 'تبدیل دستور متنی مدرس به نمودار درختی و فلوچارت وکتور روی تخته سفید',
        enabled: false,
        ramMb: 40,
        cpuPct: 3,
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
    subtitle: 'کسر پیتزایی، محور اعداد، مکعب ارزش مکانی و خط تحریری',
    targetAudience: 'آموزگاران دوره ابتدایی',
    enabledSubFeatureIds: [
      'infinite-paginated-canvas',
      'stroke-stabilizer',
      'hold-to-snap-shapes',
      'persian-math-builder',
      'interactive-fraction-widget',
      'smart-number-line',
      'elementary-base10-blocks',
      'persian-prosody-syntax',
      'four-channel-iso-recorder',
      'invisible-ui-recording',
    ],
    recommendedBackground: 'lined',
    recommendedLabTab: 'math',
  },
  {
    id: 'math-geometry',
    title: 'ریاضی، هندسه و حسابان',
    subtitle: 'فرمول‌ساز، محور و مختصات، هندسه سه‌بعدی و نمودار مشتق/انتگرال',
    targetAudience: 'دبیران ریاضی متوسطه و اساتید دانشگاه',
    enabledSubFeatureIds: [
      'infinite-paginated-canvas',
      'photoshop-layers',
      'stroke-stabilizer',
      'hold-to-snap-shapes',
      'persian-math-builder',
      'interactive-fraction-widget',
      'smart-number-line',
      'dynamic-geometry-3dnets',
      'calculus-plotter-riemann',
      'four-channel-iso-recorder',
      'invisible-ui-recording',
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
      'persian-math-builder',
      'inclined-plane-fbd',
      'wave-harmonic-oscillator',
      'circuit-electromagnetism',
      'fluid-manometer-pv',
      'optics-bench-bohr',
      'four-channel-iso-recorder',
      'invisible-ui-recording',
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
      'periodic-table-hund',
      'lewis-vsepr-3d',
      'organic-iupac-kit',
      'galvanic-stoichiometry-titration',
      'four-channel-iso-recorder',
      'invisible-ui-recording',
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
      'biology-atlas-punnett',
      'persian-prosody-syntax',
      'arabic-harakat-conjugation',
      'english-geography-accounting',
      'four-channel-iso-recorder',
      'one-click-class-notes-pdf',
    ],
    recommendedBackground: 'sepia',
    recommendedLabTab: 'humanities',
  },
  {
    id: 'konkur-test',
    title: 'استودیوی حل تست و کنکور',
    subtitle: 'برشگر PDF، رد گزینه، پرده مخفی‌کننده پاسخ، تایمر و مهر کنکوری',
    targetAudience: 'اساتید کنکور و برگزارکنندگان همایش‌های جمع‌بندی',
    enabledSubFeatureIds: [
      'infinite-paginated-canvas',
      'photoshop-layers',
      'stroke-stabilizer',
      'laser-vanishing-pen',
      'split-screen-minimap',
      'smart-question-clipper',
      'option-elimination-tool',
      'screen-shade-reveal',
      'visual-exam-timer',
      'four-channel-iso-recorder',
      'invisible-ui-recording',
      'educational-sfx-callouts',
      'one-click-class-notes-pdf',
      'anti-piracy-floating-watermark',
    ],
    recommendedBackground: 'blackboard',
    recommendedLabTab: 'konkur',
  },
  {
    id: 'video-studio',
    title: 'فقط ضبط و ویرایشگر ویدیو',
    subtitle: 'استودیوی ۴ کاناله، حذف سکوت، زیرنویس خودکار و تبدیل ریلز ۹:۱۶',
    targetAudience: 'تدوین‌گران آموزشی و تولیدکنندگان محتوای اینستاگرام/یوتیوب',
    enabledSubFeatureIds: [
      'four-channel-iso-recorder',
      'invisible-ui-recording',
      'invisible-teleprompter',
      'spotlight-cinematic-zoom',
      'multitrack-timeline-editor',
      'auto-cut-silence-speedup',
      'auto-captions-persian',
      'educational-sfx-callouts',
      'reels-shorts-converter',
      'anti-piracy-floating-watermark',
    ],
    recommendedBackground: 'blackboard',
  },
  {
    id: 'full-suite',
    title: 'حالت کامل (تمام ۱۰ ماژول روشن)',
    subtitle: 'فعال‌سازی ۱۰۰٪ ابزارها، آزمایشگاه‌ها، استودیو و هوش مصنوعی',
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
  subFeatureId: string
): AppModule[] {
  return modules.map((mod) => {
    if (mod.id !== moduleId) return mod;
    const updatedSubs = mod.subFeatures.map((sf) =>
      sf.id === subFeatureId ? { ...sf, enabled: !sf.enabled } : sf
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
  const safeDenom = Math.max(1, Math.min(24, Math.round(denominator)));
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
  electrons: 0 | 1 | 2; // 1 = ↑, 2 = ↑↓
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

    // Apply Hund's rule: first place 1 spin-up electron in each orbital, then pair spin-down
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
