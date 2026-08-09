import { Station, StudentProfile } from '../types';

export const adventureStudentProfile: StudentProfile = {
  id: '',
  fullName: '',
  classNumber: 0,
  className: '',
  teacherName: '',
  avatar: '',
  currentPoints: 0,
  totalTargetPoints: 2000,
  journeyType: 'tree',
  currentLevelTitle: 'المستوى الأول',
  rankInClass: 0,
};

export const adventureLandmarks: Station[] = [
  {
    id: 'lm-1',
    stationNumber: 1,
    name: 'روضة الصدق',
    arabicSub: 'أول أنوار الرحلة، حيث يُثمر الصدق طمأنينة ورفعة في القول والعمل',
    ayah: 'يَا أَيُّهَا الَّذِينَ آمَنُوا اتَّقُوا اللَّهَ وَكُونُوا مَعَ الصَّادِقِينَ',
    landmarkType: 'garden',
    requiredPoints: 100,
    status: 'completed',
    progressPercentage: 100,
    description: 'غرس النوايا الصافية والتزام القول الطيب والتلاوة الخالصة لوجه الله الكريم.',
    requirements: [
      'حفظ سورة النبأ والنازعات بإتقان وتجويد',
      'الانضباط بالصدق التام في الحضور والتسميع',
      'الالتزام بالآداب والأخلاق داخل الحلقة لمدة شهر'
    ],
    reward: {
      title: 'وسام شتلة الصدق 🌿',
      description: 'شهادة تقدير الكترونية خاصة + 100 نقطة إنجاز أولية',
      icon: 'Sprout'
    },
    badgeName: 'الصادق المخلص',
    coordinates: { x: 18, y: 78 },
    colorTheme: 'emerald'
  },
  {
    id: 'lm-2',
    stationNumber: 2,
    name: 'وادي الرحمة',
    arabicSub: 'منبع اللين وحسن الخلق تجاه الوالدين والمعلمين والزملاء',
    ayah: 'وَاخْفِضْ لَهُمَا جَنَاحَ الذُّلِّ مِنَ الرَّحْمَةِ وَقُل رَّبِّ ارْحَمْهُمَا',
    landmarkType: 'valley',
    requiredPoints: 350,
    status: 'completed',
    progressPercentage: 100,
    description: 'تطبيق قيمة الرحمة والبر، وإفشاء السلام والمساعدة بين طلاب الحلقة.',
    requirements: [
      'إتقان حفظ جزء عم كاملاً مع التطبيق الصوتي',
      'شهادة بر الوالدين والمساعدة المنزلية من الأهل',
      'مساعدة زميل في مراجعة آيات القرآن أسبوعياً'
    ],
    reward: {
      title: 'مصحف مذهب أنيق + قلادة الرحمة 📖',
      description: 'مصحف فاخر مع تكريم إيماني أمام الجمع',
      icon: 'Heart'
    },
    badgeName: 'رحيم الجانب',
    coordinates: { x: 38, y: 58 },
    colorTheme: 'teal'
  },
  {
    id: 'lm-3',
    stationNumber: 3,
    name: 'جبل الصبر',
    arabicSub: 'الثبات على مراجعة القرآن والإصرار على القمة رغم عوائق الطريق',
    ayah: 'وَاصْبِرْ لِحُكْمِ رَبِّكَ فَإِنَّكَ بِأَعْيُنِنَا',
    landmarkType: 'mountain',
    requiredPoints: 900,
    status: 'current',
    progressPercentage: 85,
    description: 'موقفك الحالي! هنا تصنع الهمم العالية بالمواظبة اليومية وعدم الاستسلام للكسل.',
    requirements: [
      'إتمام حفظ جزء تبارك والبدء في جزء قد سمع (850 / 900 نقطة)',
      'الاستمرار بدون أي انقطاع لمدة 45 يوما متتاليا',
      'المشاركة في مسابقة المراجعة المكثفة'
    ],
    reward: {
      title: 'درع الصابرين الذهبي 🛡️ + رحلة القمة',
      description: 'درع تذكاري فاخر ورحلة استكشافية ممتعة مع المعلم',
      icon: 'Shield'
    },
    badgeName: 'فارس الصبر',
    coordinates: { x: 55, y: 38 },
    colorTheme: 'amber'
  },
  {
    id: 'lm-4',
    stationNumber: 4,
    name: 'نهر الثقة',
    arabicSub: 'تدفق اليقين بالله والتوكل عليه في كل خطوة ومسعى',
    ayah: 'وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ',
    landmarkType: 'river',
    requiredPoints: 1300,
    status: 'locked',
    progressPercentage: 0,
    description: 'عبور نهر الثقة والسكينة، والانطلاق بثبات نحو ختم الأجزاء المتقدمة.',
    requirements: [
      'حفظ 4 أجزاء كاملة بإسناد وتلاوة خاشعة',
      'إلقاء كلمة توعوية قصيرة أمام طلاب الحلقة',
      'وصول مجموع النقاط إلى 1300 نقطة'
    ],
    reward: {
      title: 'ساعة ذكية متابعة للإنجاز ⌚',
      description: 'ساعة رقمية متطورة لتتبع أوقات الصلاة والمراجعة',
      icon: 'Watch'
    },
    badgeName: 'الواثق بالله',
    coordinates: { x: 72, y: 25 },
    colorTheme: 'cyan'
  },
  {
    id: 'lm-5',
    stationNumber: 5,
    name: 'قمة القيادة',
    arabicSub: 'أن تكون قدوة ملهمة يقتدي بك زُملاؤك في الخير والأخلاق',
    ayah: 'وَجَعَلْنَاهُمْ أَئِمَّةً يَهْدُونَ بِأَمْرِنَا لَمَّا صَبَرُوا',
    landmarkType: 'peak',
    requiredPoints: 1700,
    status: 'locked',
    progressPercentage: 0,
    description: 'ارتقاء القمة وقيادة المبادرات التحفيزية والأنشطة القرآنية.',
    requirements: [
      'حفظ 6 أجزاء مع إتقان متون التجويد',
      'تولي قيادة مجموعة المراجعة الطلابية',
      'تحقيق تقييم امتياز من الموجه الإداري'
    ],
    reward: {
      title: 'وسام القائد القدوة 👑 + لوح ذكي',
      description: 'جهاز لوحي متطور للدراسة والقرآن الكريم',
      icon: 'Crown'
    },
    badgeName: 'قائد الأثر',
    coordinates: { x: 84, y: 15 },
    colorTheme: 'indigo'
  },
  {
    id: 'lm-6',
    stationNumber: 6,
    name: 'أفق الأثر الخالد',
    arabicSub: 'غرس يمتد، ونور يضيء الآفاق، وبصمة خير لا تزول مع الأيام',
    ayah: 'إِنَّا نَحْنُ نُحْيِي الْمَوْتَىٰ وَنَكْتُبُ مَا قَدَّمُوا وَآثَارَهُمْ',
    landmarkType: 'summit',
    requiredPoints: 2000,
    status: 'locked',
    progressPercentage: 0,
    description: 'أعلى مقامات الرحلة! التتويج النهائي بالسفير الداعية والماهر بالمصحف الشريف.',
    requirements: [
      'إتمام حفظ الأجزاء المقررة بمرتبة الشرف',
      'ترك بصمة مبادرة خيرية مستدامة بالمسجد أو المركز',
      'تحقيق الهدف الأسمى بـ 2000 نقطة كاملة'
    ],
    reward: {
      title: 'كأس أفق الأثر الخالد 🏆 + رحلة العمرة',
      description: 'كأس التتويج الذهبي + رحلة أداء العمرة المباركة برفقة الأهل',
      icon: 'Trophy'
    },
    badgeName: 'الداعية الملهم',
    coordinates: { x: 92, y: 6 },
    colorTheme: 'rose'
  }
];
