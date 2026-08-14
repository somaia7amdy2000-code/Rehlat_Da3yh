/**
 * Safe backup utility for Rihlat Da'eyah application localStorage data.
 * Exports exact current values of:
 * - rihlat_teacher_db_v3
 * - rihlat_system_settings_v1
 * - rihlat_logged_student_code_v1
 */

export interface RihlatLocalStorageBackup {
  exportTimestamp: string;
  appVersion: string;
  keys: {
    rihlat_teacher_db_v3: Record<string, unknown> | null;
    rihlat_system_settings_v1: Record<string, unknown> | null;
    rihlat_logged_student_code_v1: string | null;
  };
  raw: {
    rihlat_teacher_db_v3: string | null;
    rihlat_system_settings_v1: string | null;
    rihlat_logged_student_code_v1: string | null;
  };
}

export function getRihlatLocalStorageBackup(): RihlatLocalStorageBackup {
  const getStorageItem = (key: string): string | null => {
    if (typeof localStorage !== 'undefined') {
      try { return localStorage.getItem(key); } catch { return null; }
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      try { return window.localStorage.getItem(key); } catch { return null; }
    }
    return null;
  };

  const rawDb = getStorageItem('rihlat_teacher_db_v3');
  const rawSettings = getStorageItem('rihlat_system_settings_v1');
  const rawStudentCode = getStorageItem('rihlat_logged_student_code_v1');

  let parsedDb: Record<string, unknown> | null = null;
  if (rawDb) {
    try {
      parsedDb = JSON.parse(rawDb);
    } catch {
      parsedDb = null;
    }
  }

  let parsedSettings: Record<string, unknown> | null = null;
  if (rawSettings) {
    try {
      parsedSettings = JSON.parse(rawSettings);
    } catch {
      parsedSettings = null;
    }
  }

  return {
    exportTimestamp: new Date().toISOString(),
    appVersion: 'v3',
    keys: {
      rihlat_teacher_db_v3: parsedDb,
      rihlat_system_settings_v1: parsedSettings,
      rihlat_logged_student_code_v1: rawStudentCode,
    },
    raw: {
      rihlat_teacher_db_v3: rawDb,
      rihlat_system_settings_v1: rawSettings,
      rihlat_logged_student_code_v1: rawStudentCode,
    },
  };
}

export function downloadRihlatLocalStorageBackup(): void {
  if (typeof window === 'undefined') {
    console.error('Cannot download backup outside browser environment.');
    return;
  }

  const backupData = getRihlatLocalStorageBackup();
  const jsonString = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = `rihlat_localstorage_backup_${dateStr}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  console.log(`[Backup] Downloaded Rihlat localStorage backup: ${fileName}`);
}

// Global attachment for DevTools access
if (typeof window !== 'undefined') {
  (window as unknown as { exportRihlatBackup: typeof downloadRihlatLocalStorageBackup }).exportRihlatBackup =
    downloadRihlatLocalStorageBackup;
  (window as unknown as { getRihlatBackup: typeof getRihlatLocalStorageBackup }).getRihlatBackup =
    getRihlatLocalStorageBackup;
}
