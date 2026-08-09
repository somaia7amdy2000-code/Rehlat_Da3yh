import { JourneyConfig, StudentProfile, PointTransaction } from '../types';

export const mockStudentProfile: StudentProfile = {
  id: '',
  fullName: '',
  classNumber: 0,
  className: '',
  teacherName: '',
  avatar: '',
  currentPoints: 0,
  totalTargetPoints: 1000,
  journeyType: 'tree',
  currentLevelTitle: 'المستوى الأول',
  rankInClass: 0,
};

export const mockTransactions: PointTransaction[] = [];

export const journeyConfigs: Record<string, JourneyConfig> = {
  tree: {
    id: 'tree',
    title: 'شجرة العطاء والتفوق',
    subtitle: 'انمُ كالشجرة الطيبة، أصلها ثابت وفرعها في السماء',
    iconName: 'Trees',
    bgGradient: 'from-emerald-950 via-teal-900 to-slate-900',
    accentColor: 'emerald',
    pathColor: '#10b981',
    stations: [
      {
        id: 'st-1',
        stationNumber: 1,
        name: 'جذور الإيمان',
        requiredPoints: 100,
        status: 'current',
        progressPercentage: 0,
        description: 'بداية الغرس الطيب والتزام أولى خطوات الحفظ والتلاوة.',
        requirements: [
          'حفظ سورة النبأ والنازعات',
          'التزام الهدوء والآداب داخل الحلقة',
          'حضور 5 جلسات متتالية بدون تأخير'
        ],
        reward: {
          title: 'وسام الغرس الأول 🌿',
          description: 'شهادة تقدير الكترونية + 50 نقطة مكافأة',
          icon: 'Sprout'
        },
        badgeName: 'شتلة الإيمان'
      },
      {
        id: 'st-2',
        stationNumber: 2,
        name: 'ساق العزيمة',
        requiredPoints: 300,
        status: 'locked',
        progressPercentage: 0,
        description: 'ثبات القواعد واشتداد العود من خلال إتقان جزء عم كاملًا.',
        requirements: [
          'إتقان جزء عم مع تطبيق أحكام النون الساكنة',
          'المشاركة في مسابقة السيرة النبوية',
          'جمع 300 نقطة تحفيزية'
        ],
        reward: {
          title: 'مصحف مذهب أنيق 📖',
          description: 'مصحف فاخر مع تكريم أمام طلاب الحلقة',
          icon: 'BookOpen'
        },
        badgeName: 'برعم النور'
      },
      {
        id: 'st-3',
        stationNumber: 3,
        name: 'أغصان الإتقان',
        requiredPoints: 600,
        status: 'locked',
        progressPercentage: 0,
        description: 'امتداد الأغصان وتفتح أزهار الفهم والتدبر في جزء تبارك.',
        requirements: [
          'إتقان جزء تبارك واجتياز الاختبار الشفهي',
          'الالتزام بأخلاق الطالب القدوة',
          'مساعدة زميل في الحفظ مرة واحدة أسبوعياً'
        ],
        reward: {
          title: 'بطاقة مكتبة الشاملة 🎟️',
          description: 'قسيمة شراء كتب وقصص إسلامية بقيمة 150 ريال',
          icon: 'Gift'
        },
        badgeName: 'غصن العطاء'
      },
      {
        id: 'st-4',
        stationNumber: 4,
        name: 'أوراق الضياء',
        requiredPoints: 850,
        status: 'locked',
        progressPercentage: 0,
        description: 'اقتراب الشجرة من إيتاء أُكلها بجمال التلاوة والعمل.',
        requirements: [
          'إتمام حفظ جزء قد سمع (3 أجزاء إجمالاً)',
          'تطبيق أحكام المدود والتجويد المتقدم',
          'الوصول إلى 900 نقطة'
        ],
        reward: {
          title: 'رحلة ترفيهية مع الحلقة 🚌',
          description: 'رحلة خروج للمخيم الربيعي وتكريم رئيسي',
          icon: 'Compass'
        },
        badgeName: 'ورقة الذهب'
      },
      {
        id: 'st-5',
        stationNumber: 5,
        name: 'ثمار الماهر بالقرآن',
        requiredPoints: 1200,
        status: 'locked',
        progressPercentage: 0,
        description: 'قمة الشجرة الطيبة! جني ثمار الجهد والارتقاء إلى درجات الماهرين.',
        requirements: [
          'حفظ 5 أجزاء كاملة بإتقان وتجويد مرتلاً',
          'السلوك القدوة والحصول على تقييم ممتاز من المعلم',
          'إكمال 1200 نقطة بالكامل'
        ],
        reward: {
          title: 'درع الشجرة المباركة 🏆',
          description: 'درع التميز الذهبي + مكافأة قيّمة في الحفل السنوي',
          icon: 'Trophy'
        },
        badgeName: 'الماهر بالقرآن'
      }
    ]
  },
  car: {
    id: 'car',
    title: 'سباق النور والسرعة',
    subtitle: 'انطلق في مسار التسابق نحو الخيرات وبلوغ أعلى المقامات',
    iconName: 'Car',
    bgGradient: 'from-slate-950 via-cyan-950 to-teal-950',
    accentColor: 'cyan',
    pathColor: '#06b6d4',
    stations: [
      {
        id: 'car-1',
        stationNumber: 1,
        name: 'خط الانطلاق',
        requiredPoints: 100,
        status: 'current',
        progressPercentage: 0,
        description: 'تشغيل محرك الهمة وبداية السباق نحو حفظ كتاب الله.',
        requirements: ['حفظ أول 5 صفحات من البقرة', 'الانضباط في المواعيد'],
        reward: { title: 'ميدالية الانطلاق 🏅', description: 'شارة السائق المبتدئ', icon: 'Award' },
        badgeName: 'المُنطلق'
      },
      {
        id: 'car-2',
        stationNumber: 2,
        name: 'منعطف التجويد',
        requiredPoints: 300,
        status: 'locked',
        progressPercentage: 0,
        description: 'التحكم بالسرعة وضبط المخارج والأحكام بمهارة فائقة.',
        requirements: ['تطبيق الإظهار والإدغام', 'حفظ جزء عم'],
        reward: { title: 'ساعة يد رياضية ⌚', description: 'تكريم السائق الماهر', icon: 'Watch' },
        badgeName: 'الماهر بالنطق'
      },
      {
        id: 'car-3',
        stationNumber: 3,
        name: 'مستقيم المراجعة',
        requiredPoints: 600,
        status: 'locked',
        progressPercentage: 0,
        description: 'السرعة القصوى في استظهار السور ومراجعتها دون أخطاء.',
        requirements: ['مراجعة جزئين متتاليين', 'جمع 600 نقطة'],
        reward: { title: 'قسيمة متجر الألعاب 🎮', description: 'قسيمة بقيمة 100 ريال', icon: 'Gamepad2' },
        badgeName: 'السرعة الفائقة'
      },
      {
        id: 'car-4',
        stationNumber: 4,
        name: 'جسر التفوق',
        requiredPoints: 850,
        status: 'locked',
        progressPercentage: 0,
        description: 'عابراً الجسر نحو المرحلة النهائية من مسابقة النور.',
        requirements: ['حفظ 3 أجزاء', 'عدم الغياب طوال الشهر'],
        reward: { title: 'كاميرا تصوير فورية 📷', description: 'جائزة عينية قيّمة', icon: 'Camera' },
        badgeName: 'قائد النور'
      },
      {
        id: 'car-5',
        stationNumber: 5,
        name: 'خط النهاية والمنصة',
        requiredPoints: 1200,
        status: 'locked',
        progressPercentage: 0,
        description: 'رفع كأس المركز الأول والاعتلاء فوق منصة التتويج.',
        requirements: ['حفظ 5 أجزاء', 'المرتبة الأولى بالحلقة'],
        reward: { title: 'كأس البطولة الذهبي 🏆', description: 'رحلة عمرة مع الوالدين', icon: 'Trophy' },
        badgeName: 'بطل السباق'
      }
    ]
  },
  rocket: {
    id: 'rocket',
    title: 'صاروخ الإنجاز والقمة',
    subtitle: 'حلق في سماء المعالي واخترق الآفاق بنور حفظك وفهمك',
    iconName: 'Rocket',
    bgGradient: 'from-slate-950 via-indigo-950 to-blue-950',
    accentColor: 'indigo',
    pathColor: '#6366f1',
    stations: [
      {
        id: 'rkt-1',
        stationNumber: 1,
        name: 'منصة الإطلاق',
        requiredPoints: 100,
        status: 'current',
        progressPercentage: 0,
        description: 'شحن وقود الإرادة والتهيؤ للاختراق.',
        requirements: ['التسجيل والحفظ الأسبوعي المنتظم'],
        reward: { title: 'شارة رائد الفضاء 🚀', description: 'بطاقة عضوية الفضاء', icon: 'Zap' },
        badgeName: 'المستكشف'
      },
      {
        id: 'rkt-2',
        stationNumber: 2,
        name: 'اختراق الغلاف الجوي',
        requiredPoints: 300,
        status: 'locked',
        progressPercentage: 0,
        description: 'تجاوز العقبات الصعبة والتغلب على الكسل.',
        requirements: ['حفظ جزء عم وتصلح التلاوة'],
        reward: { title: 'تليسكوب فلكي 🔭', description: 'هدية الاستكشاف العلمي', icon: 'Eye' },
        badgeName: 'قاهر الجاذبية'
      },
      {
        id: 'rkt-3',
        stationNumber: 3,
        name: 'مدار النجوم',
        requiredPoints: 600,
        status: 'locked',
        progressPercentage: 0,
        description: 'الدوران في مدار المراجعين المتقنين ومجالسة القرآن.',
        requirements: ['إتقان جزئين و30 ساعة مراجعة'],
        reward: { title: 'لوح إلكتروني محمول 📱', description: 'جهاز لوحي للتعلم', icon: 'Tablet' },
        badgeName: 'نجم الحلقة'
      },
      {
        id: 'rkt-4',
        stationNumber: 4,
        name: 'كوكب الحكمة',
        requiredPoints: 850,
        status: 'locked',
        progressPercentage: 0,
        description: 'الهبوط على كوكب الحكمة وفهم معاني وتدبر الآيات.',
        requirements: ['حفظ معاني الكلمات الغريبة لجزء عم وتارك'],
        reward: { title: 'حقيبة الذكاء الاصطناعي 🤖', description: 'روبوت تعليمي برمجي', icon: 'Cpu' },
        badgeName: 'حكيم الآفاق'
      },
      {
        id: 'rkt-5',
        stationNumber: 5,
        name: 'مجرة الفردوس',
        requiredPoints: 1200,
        status: 'locked',
        progressPercentage: 0,
        description: 'الوصول لأعلى نقطة في السماء وقطف أنوار التميز.',
        requirements: ['إتمام 5 أجزاء بإسناد تجويدي عالي'],
        reward: { title: 'وسام المجرة الذهبي 👑', description: 'جائزة مالية وتكريم عام', icon: 'Crown' },
        badgeName: 'فارس المجرة'
      }
    ]
  },
  superhero: {
    id: 'superhero',
    title: 'رحلة البطل حارس القيم',
    subtitle: 'كن بطلاً بأخلاقك وحافظاً بكتاب ربك، تنشر الخير والسلام',
    iconName: 'Shield',
    bgGradient: 'from-slate-950 via-emerald-950 to-teal-950',
    accentColor: 'emerald',
    pathColor: '#059669',
    stations: [
      {
        id: 'shp-1',
        stationNumber: 1,
        name: 'نداء البطولة',
        requiredPoints: 100,
        status: 'current',
        progressPercentage: 0,
        description: 'الاستجابة لنداء الحق وبداية التدرب على أسلحة الأخلاق والحفظ.',
        requirements: ['التزام الصدق والأمانة في الحلقة'],
        reward: { title: 'عباءة البطل 🛡️', description: 'شارة البطل الصغير', icon: 'ShieldCheck' },
        badgeName: 'البطل الواعد'
      },
      {
        id: 'shp-2',
        stationNumber: 2,
        name: 'درع الأخلاق',
        requiredPoints: 300,
        status: 'locked',
        progressPercentage: 0,
        description: 'الحصول على درع الحماية بالأخلاق والبر بالوالدين.',
        requirements: ['تطبيق قيمة بر الوالدين بشهادة ولي الأمر'],
        reward: { title: 'درع التقدير الفضي 🥈', description: 'وسام البار بوالديه', icon: 'Heart' },
        badgeName: 'حارس القيم'
      },
      {
        id: 'shp-3',
        stationNumber: 3,
        name: 'سيف الحفظ',
        requiredPoints: 600,
        status: 'locked',
        progressPercentage: 0,
        description: 'امتلاك سلاح الحفظ القوي والمراجعة الصارمة.',
        requirements: ['حفظ جزء عم وتارك بدون أخطاء'],
        reward: { title: 'مجموعة أدوات البطل 🎒', description: 'حقيبة رياضية مجهزة', icon: 'Briefcase' },
        badgeName: 'فارس القرآن'
      },
      {
        id: 'shp-4',
        stationNumber: 4,
        name: 'قلعة الصمود',
        requiredPoints: 850,
        status: 'locked',
        progressPercentage: 0,
        description: 'الثبات والصمود أمام التحديات مع الاستمرار اليومي.',
        requirements: ['الاستمرار لمدة 3 أشهر دون انقطاع'],
        reward: { title: 'ساعة ذكية متابعة للنشاط ⌚', description: 'ساعة ذكية متطورة', icon: 'Watch' },
        badgeName: 'القائد الصامد'
      },
      {
        id: 'shp-5',
        stationNumber: 5,
        name: 'تاج البطولة العظمى',
        requiredPoints: 1200,
        status: 'locked',
        progressPercentage: 0,
        description: 'تتويج البطل بالتاج الأكبر قدوة لجميع زملائه والمجتمع.',
        requirements: ['إتمام 5 أجزاء وتمثيل الحلقة في المسابقات العامة'],
        reward: { title: 'تاج البطولة العظمى 👑', description: 'مكافأة 1000 ريال + درع البطل', icon: 'Crown' },
        badgeName: 'البطل الأسطوري'
      }
    ]
  }
};
