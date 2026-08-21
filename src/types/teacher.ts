import { JourneyStationSetting } from '../services/systemSettingsService';

export interface TeacherProfile {
  id: string;
  fullName: string;
  email?: string;
  teacherCode?: string;
  avatarUrl?: string;
  schoolOrCenter?: string;
}

export interface Batch {
  id: string;
  name: string;
  code: string;
  studentCount: number;
  classCount: number;
  clubCount: number;
  stage: string;
  description: string;
  createdAt: string;
  supervisorName: string;
  gender: 'female' | 'male' | 'mixed';
  colorGradient: string;
  stations?: JourneyStationSetting[];
}

export interface BatchStudent {
  id: string;
  batchId: string;
  name: string;
  studentCode?: string;
  className: string;
  classId?: string;
  clubName?: string;
  clubId?: string;
  levelBadge: string;
  points: number;
  completedTasks: number;
  completedChallengesCount: number;
  avatarUrl: string;
  attendanceRate?: number;
  status: 'active' | 'inactive';
}

export interface BatchClass {
  id: string;
  batchId: string;
  name: string;
  teacherName: string;
  studentCount: number;
  avgPoints: number;
  challengeCompletionRate: number;
  studentNames: string[];
  schedule: string;
  room: string;
}

export interface ClubMember {
  id: string;
  name: string;
  className: string;
  avatarUrl?: string;
  studentCode?: string;
  points?: number;
  levelBadge?: string;
}

export interface ClubTask {
  id: string;
  title: string;
  dueDate: string;
  rewardXp: number;
  status: 'active' | 'completed';
}

export interface ClubAnnouncement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface BatchClub {
  id: string;
  batchId: string;
  name: string;
  description: string;
  supervisorName: string;
  icon?: string;
  color?: string;
  memberCount: number;
  activeTasksCount?: number;
  category?: string;
  members: ClubMember[];
  tasks?: ClubTask[];
  announcements?: ClubAnnouncement[];
}

export interface BatchChallenge {
  id: string;
  batchId: string;
  title: string;
  description?: string;
  type: string; // 'يومي' | 'أسبوعي' | 'شهري'
  rewardXp: number;
  status: 'active' | 'upcoming' | 'completed';
  participantsCount: number;
  dueDate: string;
  targetType?: 'school' | 'batch' | 'class' | 'club' | 'student' | 'all';
  targetId?: string;
  targetName?: string;
  targetStudentId?: string;
  targetStudentCode?: string;
}

export type LibraryResourceType = 'pdf' | 'video' | 'audio' | 'image' | 'link' | 'doc';
export type LibraryTargetAudience = 'all' | 'batch' | 'class' | 'club' | 'student';

export interface BatchLibraryItem {
  id: string;
  batchId?: string;
  title: string;
  description?: string;
  fileType?: LibraryResourceType;
  type?: string;
  fileSize?: string;
  duration?: string;
  url?: string;
  thumbnailUrl?: string;
  uploadedAt?: string;
  category?: string;
  uploadedBy?: string;
  targetType?: LibraryTargetAudience;
  targetId?: string;
  targetName?: string;
  targetStudentId?: string;
  targetStudentCode?: string;
  fileObject?: File;
  storagePath?: string;
}

export interface StudentLibraryQuery {
  batchId?: string;
  batchName?: string;
  classId?: string;
  className?: string;
  clubId?: string;
  clubName?: string;
  studentId?: string;
  studentCode?: string;
  studentName?: string;
}

export interface PendingSubmission {
  id: string;
  batchId: string;
  batchName?: string;
  studentId?: string;
  studentCode?: string;
  studentName: string;
  studentAvatar?: string;
  className: string;
  clubName?: string;
  taskTitle: string;
  sourceType: 'club' | 'challenge' | 'regular';
  sourceName: string;
  submittedAt: string;
  contentSummary: string;
  rewardXp: number;
  status: 'pending' | 'approved' | 'rejected';
  teacherNotes?: string;
  challengeId?: string;
}

export interface BatchAnnouncement {
  id: string;
  batchId: string;
  title: string;
  content: string;
  createdAt: string;
  author: string;
  pinned: boolean;
  targetType?: 'batch' | 'class' | 'club' | 'student' | 'all';
  targetValue?: string;
  targetName?: string;
  readBy?: string[];
}

export interface BatchDashboardStats {
  totalStudents: number;
  totalClasses: number;
  activeChallenges: number;
  pendingReviews: number;
  activeClubs: number;
  totalAnnouncements: number;
}

export interface ExcelImportFailure {
  name: string;
  studentCode: string;
  reason: string;
}

export interface ExcelImportResult {
  totalRows: number;
  validRows: number;
  savedInSupabase: number;
  failedCount: number;
  successfulStudents: BatchStudent[];
  failures: ExcelImportFailure[];
}
