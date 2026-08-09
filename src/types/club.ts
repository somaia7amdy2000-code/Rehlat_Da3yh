export type ClubFileType = 'pdf' | 'image' | 'video' | 'doc';
export type ClubTaskStatus = 'pending' | 'submitted' | 'approved' | 'rejected';

export interface ClubInfo {
  id: string;
  name: string;
  slogan: string;
  description?: string;
  supervisorName: string;
  supervisorTitle: string;
  memberCount: number;
  gradeLevel: string;
  stage?: string;
  category: string;
  coverImageBg?: string;
}

export interface ClubAnnouncement {
  id: string;
  title: string;
  content: string;
  created_at: string;
  date?: string;
  author: string;
  pinned: boolean;
  isPinned?: boolean;
  priority?: 'normal' | 'urgent';
}

export interface ClubTask {
  id: string;
  title: string;
  description?: string;
  assigned_by?: string;
  assignedTo?: string;
  due_date: string;
  dueDate?: string;
  xp_reward: number;
  rewardXp?: number;
  status: ClubTaskStatus;
  submittedAt?: string;
  approvedAt?: string;
}

export interface ClubMember {
  id: string;
  name: string;
  className: string;
  levelBadge: string;
  levelNumber?: number;
  avatarUrl?: string;
}

export interface ClubAchievement {
  id: string;
  title: string;
  description: string;
  date: string;
  iconName?: string;
  category?: string;
  badgeTag?: string;
}

export interface ClubFile {
  id: string;
  title: string;
  fileType: ClubFileType;
  fileSize: string;
  created_at: string;
  uploadDate?: string;
  downloadUrl?: string;
  category?: string;
}

export interface SupervisorMessage {
  id: string;
  message: string;
  supervisorName: string;
  supervisorTitle: string;
  supervisorAvatar: string;
  created_at: string;
  date?: string;
  pinned: boolean;
}

