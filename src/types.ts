export type JourneyType = 'tree' | 'car' | 'rocket' | 'superhero';

export interface Station {
  id: string;
  stationNumber: number;
  name: string;
  requiredPoints: number;
  status: 'completed' | 'current' | 'locked';
  progressPercentage: number;
  requirements: string[];
  reward: {
    title: string;
    description: string;
    icon: string;
  };
  badgeName: string;
  description: string;
  arabicSub?: string;
  ayah?: string;
  landmarkType?: 'garden' | 'valley' | 'mountain' | 'river' | 'peak' | 'summit';
  coordinates?: { x: number; y: number }; // Percentage offset in container
  colorTheme?: string;
}

export interface JourneyConfig {
  id: JourneyType;
  title: string;
  subtitle: string;
  iconName: string;
  bgGradient: string;
  accentColor: string;
  pathColor: string;
  stations: Station[];
}

export interface StudentProfile {
  id: string;
  fullName: string;
  classNumber: number;
  className: string;
  teacherName: string;
  avatar: string;
  currentPoints: number;
  totalTargetPoints: number;
  journeyType: JourneyType;
  currentLevelTitle: string;
  rankInClass: number;
}

export interface PointTransaction {
  id: string;
  points: number;
  reason: string;
  date: string;
  category: 'quran' | 'behavior' | 'attendance' | 'reward';
}
