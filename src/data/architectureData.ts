export interface TechStackLayer {
  id: string;
  layerName: string;
  techChoice: string;
  alternativeCompared: string;
  whyChosen: string;
  coveredModules: string[];
  codeSnippet: string;
}

export interface FolderNode {
  name: string;
  type: 'folder' | 'file';
  badge?: string;
  description: string;
  children?: FolderNode[];
}

export const TECH_STACK_LAYERS: TechStackLayer[] = [
  {
    id: 'core-runtime',
    layerName: 'هسته سیستم‌عامل و دسکتاپ (Desktop Core Runtime)',
    techChoice: 'Tauri v2 (Rust Core) + Native OS Window APIs',
    alternativeCompared: 'در مقایسه با Electron (صرفه‌جویی ۶۵٪ در مصرف RAM و حجم نصبی ۱۵ مگابایت به جای ۲۰۰ مگابایت)',
    whyChosen:
      'دسترسی مستقیم به APIهای سطح پایین ویندوز (Win32 Dwmapi / SetWindowDisplayAffinity) و مک برای اجرای «ضبط نامرئی رابط کاربری (Invisible UI Recording)»، «تله‌پرامپتر مخفی» و «حالت نوشتن شفاف روی دسکتاپ (Desktop Overlay)» بدون افت فریم.',
    coveredModules: ['ماژول ۱ (نوشتن روی دسکتاپ)', 'ماژول ۷ (ضبط نامرئی منوها و تله‌پرامپتر)'],
    codeSnippet: `// src-tauri/src/window_capture_shield.rs
// مخفی‌سازی نوار ابزارها و تله‌پرامپتر از خروجی ضبط ویدیو در سطح کرنل ویندوز/مک
#[tauri::command]
pub fn set_invisible_to_capture(window: tauri::Window, invisible: bool) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        use windows::Win32::UI::WindowsAndMessaging::{
            SetWindowDisplayAffinity, WDA_EXCLUDEFROMCAPTURE, WDA_NONE
        };
        let hwnd = window.hwnd().map_err(|e| e.to_string())?;
        let affinity = if invisible { WDA_EXCLUDEFROMCAPTURE } else { WDA_NONE };
        unsafe { SetWindowDisplayAffinity(hwnd, affinity).ok().map_err(|e| e.to_string())? };
    }
    Ok(())
}`,
  },
  {
    id: 'canvas-ink',
    layerName: 'موتور گرافیکی بوم و قلم (Canvas & 120Hz Ink Engine)',
    techChoice: 'WebGL2 / CanvasKit (Skia Wasm) + PointerEvents API (Tilt/Pressure)',
    alternativeCompared: 'در مقایسه با SVG/DOM معمولی (حفظ ۶۰ تا ۱۲۰ فریم بر ثانیه با بیش از ۵۰,۰۰۰ خط و شکل)',
    whyChosen:
      'رندر سخت‌افزاری با تاخیر زیر ۴ میلی‌ثانیه برای قلم‌های نوری (Wacom / Surface Pen)، الگوریتم تثبیت‌کننده دستخط (One-Euro Filter + Catmull-Rom Spline)، هایلایتر زیر متن با Blend Mode اختصاصی و Spatial R-Tree برای پاک‌کن خطی فوری.',
    coveredModules: ['ماژول ۱ (بوم بی‌نهایت، لایه‌های فتوشاپی و قلم‌ها)', 'ماژول ۳ و ۴ (رسم بردارها و هندسه پویا)'],
    codeSnippet: `// src/modules/canvas-engine/ink/OneEuroStabilizer.ts
// فیلتر تطبیقی حذف لرزش دست و موس در لحظه بدون ایجاد تاخیر مصنوعی
export class StrokeStabilizer {
  public smoothPoint(rawX: number, rawY: number, pressure: number, level: number) {
    const alpha = Math.max(0.08, 1 - level * 0.085);
    this.lastX = this.lastX + alpha * (rawX - this.lastX);
    this.lastY = this.lastY + alpha * (rawY - this.lastY);
    return { x: this.lastX, y: this.lastY, pressure };
  }
}`,
  },
  {
    id: 'media-pipeline',
    layerName: 'موتور ضبط ۴ کاناله و تدوین ویدیو (Media & NLE Engine)',
    techChoice: 'FFmpeg Native Sidecar (Rust) + WebCodecs + RNNoise (Wasm/Rust)',
    alternativeCompared: 'در مقایسه با MediaRecorder مرورگر (پشتیبانی از ۴ ترک ایزوله MKV/MP4 با کدک سخت‌افزاری NVENC/QSV)',
    whyChosen:
      'ضبط همزمان ۴ جریان مستقل (۱. بوم تخته بدون رابط کاربری، ۲. وب‌کم با حذف پس‌زمینه MediaPipe، ۳. میکروفون با حذف نویز عصبی RNNoise، ۴. صدای سیستم از طریق WASAPI Loopback) + تشخیص سکوت و تبدیل هوشمند ۱۶:۹ به ۹:۱۶.',
    coveredModules: ['ماژول ۷ (استودیوی ضبط ۴ کاناله)', 'ماژول ۸ (ویرایشگر ویدیو)', 'ماژول ۹ (تبدیل ریلز و واترمارک)'],
    codeSnippet: `// src-tauri/src/recorder/multitrack_pipeline.rs
// ضبط ۴ کانال کاملاً مجزا در کانتینر چندترکه برای ویرایش مستقل در تایم‌لاین
pub struct MultiTrackSession {
    pub track_1_canvas_clean: VideoStreamConfig, // 60fps Canvas Only (No UI)
    pub track_2_webcam_alpha: VideoStreamConfig, // Webcam + Alpha Mask
    pub track_3_mic_denoised: AudioStreamConfig, // RNNoise + Compressor
    pub track_4_sys_loopback: AudioStreamConfig, // WASAPI System Audio
}`,
  },
  {
    id: 'stem-labs-engine',
    layerName: 'موتور آزمایشگاه‌های تعاملی دروس (STEM & Humanities Sandbox)',
    techChoice: 'React 19 + Custom Physics/Math Solver + Three.js (On-Demand) + KaTeX RTL',
    alternativeCompared: 'ماژول‌های Lazy-Loaded با قابلیت Unmount کامل از حافظه در صورت خاموش بودن',
    whyChosen:
      'هر آزمایشگاه (کسر، سطح شیب‌دار، مدار الکتریکی، جدول تناوبی، تقطیع عروضی) یک بسته مستقل است که فقط در صورت روشن شدن توسط «مدیریت ویژگی‌ها» در حافظه بارگذاری (Dynamic Import) می‌شود.',
    coveredModules: ['ماژول ۳ (ریاضی)', 'ماژول ۴ (فیزیک)', 'ماژول ۵ (شیمی)', 'ماژول ۶ (زیست و ادبیات)'],
    codeSnippet: `// src/core/pluginRegistry.ts
// بارگذاری تنبل (Lazy Loading) ماژول‌ها فقط در صورت روشن بودن کلید ماژول
export const loadLabModule = async (moduleId: ModuleId) => {
  if (!featureStore.getState().isModuleEnabled(moduleId)) return null;
  switch (moduleId) {
    case 'mod-4-physics': return import('../modules/labs-physics/PhysicsLabBundle');
    case 'mod-5-chemistry': return import('../modules/labs-chemistry/ChemistryLabBundle');
  }
};`,
  },
  {
    id: 'local-ai-pdf',
    layerName: 'موتور PDF، جزوه خودکار و هوش مصنوعی آفلاین/آنلاین',
    techChoice: 'PDFium / PDF.js + Typst/PDF-Lib + ONNX Runtime (Math/Persian OCR)',
    alternativeCompared: 'پردازش هیبریدی (مدل سبک آفلاین ONNX + اتصال اختیاری ابری)',
    whyChosen:
      'تمیزکاری عکس‌های موبایل از برگه‌های امتحانی با Adaptive Thresholding، برش فوری سوال به بوم، خروجی یک‌کلیکی جزوه PDF جلسه با هدر استاندارد و تشخیص دستخط فارسی و فرمول.',
    coveredModules: ['ماژول ۲ (اسکنر PDF و حل تست)', 'ماژول ۹ (خروجی جزوه PDF)', 'ماژول ۱۰ (دستیار هوش مصنوعی)'],
    codeSnippet: `// تولید خودکار جزوه PDF استاندارد در پایان جلسه ضبط
export async function exportClassNotesPdf(boardPages: BoardPage[], meta: ClassMeta) {
  // رندر وکتور تمام صفحات تخته + هدر نام استاد، تاریخ و شماره صفحه
}`,
  },
];

export const PROJECT_FOLDER_TREE: FolderNode[] = [
  {
    name: 'daneshboard-studio/',
    type: 'folder',
    badge: 'Root Monorepo',
    description: 'ریشه پروژه دسکتاپ هیبریدی (Tauri v2 + React 19 + TypeScript)',
    children: [
      {
        name: 'src-tauri/ (هسته سیستم‌عامل و چندرسانه‌ای با زبان Rust)',
        type: 'folder',
        badge: 'Rust Backend',
        description: 'مدیریت پنجره شفاف، ضبط ۴ کاناله، FFmpeg، دیتابیس SQLite و شتاب‌دهنده سخت‌افزاری',
        children: [
          {
            name: 'src/window_manager/',
            type: 'folder',
            description: 'مدیریت پنجره‌های دسکتاپ، شفافیت Desktop Overlay و سپر ضبط نامرئی (Invisible UI)',
          },
          {
            name: 'src/recorder_engine/',
            type: 'folder',
            description: 'ضبط همزمان ۴ ترک ایزوله (Canvas, Webcam, Mic RNNoise, System Audio Loopback)',
          },
          {
            name: 'src/video_editor_ffmpeg/',
            type: 'folder',
            description: 'برش خودکار سکوت‌ها، تغییر سرعت هوشمند نوشتن، تبدیل ۱۶:۹ به ۹:۱۶ و واترمارک پویا',
          },
          {
            name: 'src/db_sqlite/',
            type: 'folder',
            description: 'ذخیره آنی جلسات، پروفایل‌های تدریس، تاریخچه تخته و کش فایل‌های PDF',
          },
        ],
      },
      {
        name: 'src/ (رابط کاربری، موتور بوم و آزمایشگاه‌های ماژولار با React + TS)',
        type: 'folder',
        badge: 'Frontend UI',
        description: 'معماری مبتنی بر Feature-Sliced Design با قابلیت خاموش/روشن شدن آنی هر ماژول',
        children: [
          {
            name: 'core/',
            type: 'folder',
            badge: 'Feature Manager',
            description: 'هسته مدیریت ماژول‌ها (Feature Toggle Engine)، پروفایل‌های تدریس، مدیریت حافظه و شورتکات‌ها',
          },
          {
            name: 'shell/',
            type: 'folder',
            badge: 'UI Shell',
            description: 'پوسته اصلی Fluent/Glassmorphism، داک‌های جمع‌شونده، منوی دایره‌ای (Radial Menu) و نوار وضعیت',
          },
          {
            name: 'modules/',
            type: 'folder',
            badge: '10 Isolated Modules',
            description: '۱۰ ماژول کاملاً مستقل که فقط در صورت روشن بودن کلیدشان در RAM بارگذاری می‌شوند',
            children: [
              {
                name: 'mod-01-canvas-ink/',
                type: 'folder',
                description: 'بوم بی‌نهایت/صفحه‌بندی، لایه‌های فتوشاپی، قلم‌ها، تثبیت‌کننده دستخط و تشخیص شکل',
              },
              {
                name: 'mod-02-pdf-konkur/',
                type: 'folder',
                description: 'ایمپورت PDF، برشگر هوشمند سوال، تمیزکننده اسکن موبایل، رد گزینه، پرده پاسخ و تایمر',
              },
              {
                name: 'mod-03-math-geometry/',
                type: 'folder',
                description: 'فرمول‌ساز بصری، کسر پیتزایی، محور اعداد، مکعب ارزش مکانی، تقسیم چکشی و نمودار مشتق/انتگرال',
              },
              {
                name: 'mod-04-physics-lab/',
                type: 'folder',
                description: 'سطح شیب‌دار و FBD، مولد موج، مدار الکتریکی، مانومتر لوله U شکل و میز اپتیک/بور',
              },
              {
                name: 'mod-05-chemistry-lab/',
                type: 'folder',
                description: 'جدول تناوبی، آرایش الکترونی هوند، لوویس و VSEPR، شیمی آلی IUPAC و سلول گالوانی',
              },
              {
                name: 'mod-06-bio-humanities/',
                type: 'folder',
                description: 'اطلس لایه‌ای زیست و مربع پانت، تقطیع عروضی شعر، حرکت‌گذاری رنگی عربی و نقشه لال',
              },
              {
                name: 'mod-07-recording-studio/',
                type: 'folder',
                description: 'پنل ضبط ۴ کاناله، وب‌کم شناور هوشمند، تله‌پرامپتر مخفی و نورافکن تمرکز (Spotlight)',
              },
              {
                name: 'mod-08-video-editor/',
                type: 'folder',
                description: 'تایم‌لاین چندلایه، حذف خودکار سکوت، زیرنویس خودکار و مهرهای متحرک کنکوری',
              },
              {
                name: 'mod-09-smart-export/',
                type: 'folder',
                description: 'موتور خروجی یک‌کلیکی جزوه PDF جلسه، تبدیل ریلز ۹:۱۶ و واترمارک شناور ضد سرقت',
              },
              {
                name: 'mod-10-ai-assistant/',
                type: 'folder',
                description: 'تبدیل دستخط فارسی/ریاضی به متن، مرتب‌سازی دستخط و تولید فلوچارت از متن',
              },
            ],
          },
          {
            name: 'store/',
            type: 'folder',
            badge: 'Zustand + SQLite',
            description: 'مدیریت وضعیت چندلایه: وضعیت سریع رندر (Transient) + وضعیت پایدار (Persisted)',
          },
        ],
      },
    ],
  },
];

export const DATABASE_AND_STATE_SPEC = {
  sqliteSchema: `-- پایگاه داده محلی SQLite (با فعال‌سازی WAL Mode برای ذخیره‌سازی بدون وقفه حین تدریس)
PRAGMA journal_mode = WAL;

-- ۱. جدول پروفایل‌های تدریس و وضعیت کلیدهای خاموش/روشن (Feature Flags)
CREATE TABLE teaching_profiles (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    is_custom INTEGER DEFAULT 0,
    enabled_subfeatures_json TEXT NOT NULL, -- آرایه JSON از کلیدهای روشن
    canvas_bg_preset TEXT DEFAULT 'grid',
    persian_numerals INTEGER DEFAULT 1,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ۲. جدول جلسات تدریس و تخته هوشمند (Sessions & Boards)
CREATE TABLE study_sessions (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    teacher_name TEXT,
    subject_tag TEXT,
    canvas_mode TEXT CHECK(canvas_mode IN ('infinite', 'a4', '16:9', '9:16')),
    active_profile_id TEXT REFERENCES teaching_profiles(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ۳. جدول صفحات و لایه‌های فتوشاپی تخته (Pages & Layers)
CREATE TABLE board_layers (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
    page_index INTEGER NOT NULL DEFAULT 1,
    layer_order INTEGER NOT NULL,
    layer_name TEXT NOT NULL,      -- مثلاً: "لایه سوالات (قفل)"، "لایه حل"، "لایه پاسخ تشریحی"
    is_locked INTEGER DEFAULT 0,
    is_visible INTEGER DEFAULT 1,
    strokes_blob BLOB,             -- داده‌های فشرده باینری خطوط و اشکال (FlatBuffers)
    widgets_json TEXT              -- وضعیت ابزارک‌های فعال (کسر، سطح شیب‌دار، جدول تناوبی و...)
);

-- ۴. جدول پروژه‌های ضبط ۴ کاناله و تایم‌لاین ویدیو (Multi-Track Recording & NLE)
CREATE TABLE recording_projects (
    id TEXT PRIMARY KEY,
    session_id TEXT REFERENCES study_sessions(id),
    track_canvas_path TEXT,        -- مسیر فایل ویدیوی تمیز تخته (بدون UI)
    track_webcam_path TEXT,        -- مسیر فایل ویدیوی مستقل وب‌کم
    track_mic_path TEXT,           -- مسیر فایل صوتی میکروفون (نویزگیری شده)
    track_sys_audio_path TEXT,     -- مسیر فایل صدای سیستم
    timeline_edits_json TEXT,      -- برش‌ها، حذف سکوت‌ها، مهرهای کنکوری و کی‌فریم‌های وب‌کم
    watermark_config_json TEXT     -- تنظیمات واترمارک پویا ضد سرقت
);`,
  zustandArchitecture: `// معماری مدیریت وضعیت سه لایه‌ای (Three-Tier State Architecture)
// ۱. Transient 120Hz Ref State: مختصات لحظه‌ای نوک قلم، لیزر و نورافکن بدون رندر مجدد React
// ۲. Modular Feature Store (Zustand): وضعیت کلیدهای خاموش/روشن ۱۰ ماژول، پروفایل تدریس و لایه‌ها
// ۳. Garbage-Collected Lazy Registry: آزادسازی فوری RAM به محض خاموش کردن هر ماژول

export interface AppShellState {
  activeProfile: TeachingProfileId;
  modules: AppModule[];              // وضعیت روشن/خاموش ۱۰ ماژول و ۴۸ زیرماژول
  usePersianNumerals: boolean;       // سوئیچ سراسری اعداد فارسی (۰-۹) و انگلیسی (0-9)
  canvasMode: 'infinite' | 'a4' | '16:9' | '9:16';
  backgroundPattern: CanvasBackgroundId;
  desktopOverlayActive: boolean;     // حالت نوشتن شفاف روی ویندوز
  invisibleUiRecording: boolean;     // مخفی شدن منوها در ویدیوی ضبط‌شده
  layers: BoardLayer[];              // لایه‌های فتوشاپی (سوال، حل، پاسخ مخفی)
}`,
};
