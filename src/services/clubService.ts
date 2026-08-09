import {
  ClubInfo,
  ClubAnnouncement,
  ClubTask,
  ClubMember,
  ClubAchievement,
  ClubFile,
  SupervisorMessage,
} from '../types/club';

// Initial dynamic state for Club feature (Supabase DB Structure Ready)
const initialClubInfo: ClubInfo = {
  id: '',
  name: '',
  slogan: '',
  description: '',
  supervisorName: '',
  supervisorTitle: '',
  memberCount: 0,
  gradeLevel: '',
  stage: '',
  category: '',
};

const initialAnnouncements: ClubAnnouncement[] = [];

const initialTasks: ClubTask[] = [];

const initialMembers: ClubMember[] = [];

const initialAchievements: ClubAchievement[] = [];

const initialFiles: ClubFile[] = [];

const initialSupervisorMessage: SupervisorMessage = {
  id: 'sup-msg-1',
  message: '',
  supervisorName: '',
  supervisorTitle: '',
  supervisorAvatar: '',
  created_at: '',
  date: '',
  pinned: false,
};

// In-memory store for interactive client updates before Supabase synchronization
let clubTasksStore: ClubTask[] = [...initialTasks];
let clubFilesStore: ClubFile[] = [...initialFiles];

export const clubService = {
  /**
   * Fetch main club details (Supabase query ready)
   */
  async getClubInfo(): Promise<ClubInfo> {
    // Example Supabase snippet:
    // const { data } = await supabase.from('club_info').select('*').single();
    return initialClubInfo;
  },

  /**
   * Fetch club announcements sorted with pinned items first
   */
  async getAnnouncements(): Promise<ClubAnnouncement[]> {
    // Example Supabase snippet:
    // const { data } = await supabase.from('club_announcements').select('*').order('pinned', { ascending: false });
    return [...initialAnnouncements].sort((a, b) => Number(b.pinned || b.isPinned) - Number(a.pinned || a.isPinned));
  },

  /**
   * Fetch club checklist tasks
   */
  async getClubTasks(): Promise<ClubTask[]> {
    // Example Supabase snippet:
    // const { data } = await supabase.from('club_tasks').select('*').order('due_date');
    return clubTasksStore;
  },

  /**
   * Submit a task for teacher approval (Student presses "تم الإنجاز")
   * Status updates from 'pending' -> 'submitted'
   * Note: XP is NOT auto-awarded here; it requires teacher approval in Teacher Dashboard.
   */
  async submitTask(taskId: string): Promise<{ task: ClubTask; message: string }> {
    const existing = clubTasksStore.find((t) => t.id === taskId);
    if (!existing) {
      throw new Error(`Task ${taskId} not found`);
    }

    if (existing.status === 'approved') {
      return { task: existing, message: 'المهمة معتمدة بالفعل من المعلمة' };
    }

    if (existing.status === 'submitted') {
      return { task: existing, message: 'بانتظار مراجعة المعلمة' };
    }

    const updatedTask: ClubTask = {
      ...existing,
      status: 'submitted',
      submittedAt: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    };

    clubTasksStore = clubTasksStore.map((t) => (t.id === taskId ? updatedTask : t));

    // Example Supabase snippet:
    // await supabase.from('club_tasks').update({ status: 'submitted', submitted_at: new Date().toISOString() }).eq('id', taskId);

    return {
      task: updatedTask,
      message: 'بانتظار مراجعة المعلمة',
    };
  },

  /**
   * Fetch club members (Cleaned format: Name, Class, Level)
   */
  async getClubMembers(): Promise<ClubMember[]> {
    // Example Supabase snippet:
    // const { data } = await supabase.from('club_members').select('id, name, class_name, level_badge, avatar_url');
    return initialMembers;
  },

  /**
   * Fetch club achievements timeline
   */
  async getClubAchievements(): Promise<ClubAchievement[]> {
    // Example Supabase snippet:
    // const { data } = await supabase.from('club_achievements').select('*').order('date');
    return initialAchievements;
  },

  /**
   * Fetch club resources/files
   */
  async getClubFiles(): Promise<ClubFile[]> {
    // Example Supabase snippet:
    // const { data } = await supabase.from('club_files').select('*').order('created_at', { ascending: false });
    return clubFilesStore;
  },

  /**
   * Upload a new club file (Prepared for future Supabase storage integration)
   */
  async uploadFile(fileData: Omit<ClubFile, 'id' | 'created_at'>): Promise<ClubFile> {
    const newFile: ClubFile = {
      ...fileData,
      id: `file-${Date.now()}`,
      created_at: 'الآن',
      uploadDate: 'الآن',
    };

    clubFilesStore = [newFile, ...clubFilesStore];

    // Example Supabase snippet:
    // const { data, error } = await supabase.storage.from('club_files').upload(path, file);
    // await supabase.from('club_files').insert(newFile);

    return newFile;
  },

  /**
   * Fetch supervisor's message
   */
  async getSupervisorMessage(): Promise<SupervisorMessage> {
    // Example Supabase snippet:
    // const { data } = await supabase.from('supervisor_messages').select('*').single();
    return initialSupervisorMessage;
  },
};

