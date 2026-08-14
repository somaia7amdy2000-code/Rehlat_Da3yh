/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import YouthMainApp from './components/YouthMainApp';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { LandingPage } from './components/LandingPage';
import { teacherService } from './services/teacherService';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { migrateBatchesOnlyForAuthenticatedTeacher } from './services/migrationService';

export default function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'student' | 'teacher'>('landing');

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    // Restore existing session on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await teacherService.getCurrentTeacherProfile();
        if (profile) {
          setCurrentView('teacher');
          migrateBatchesOnlyForAuthenticatedTeacher().then((report) => {
            console.log('[Batch Migration Result]', report);
          });
        }
      }
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const profile = await teacherService.getCurrentTeacherProfile();
        if (profile) {
          setCurrentView('teacher');
          migrateBatchesOnlyForAuthenticatedTeacher().then((report) => {
            console.log('[Batch Migration Result]', report);
          });
        }
      } else if (event === 'SIGNED_OUT') {
        setCurrentView((prev) => (prev === 'teacher' ? 'landing' : prev));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleTeacherLogout = async () => {
    await teacherService.logoutTeacher();
    setCurrentView('landing');
  };

  return (
    <div className="relative min-h-screen bg-slate-950 font-sans selection:bg-teal-500 selection:text-white dir-rtl">
      {currentView === 'landing' && (
        <LandingPage
          onSelectStudent={() => setCurrentView('student')}
          onTeacherAuthenticated={() => setCurrentView('teacher')}
        />
      )}

      {currentView === 'student' && (
        <YouthMainApp onLogout={() => setCurrentView('landing')} />
      )}

      {currentView === 'teacher' && (
        <TeacherDashboard onLogout={handleTeacherLogout} />
      )}
    </div>
  );
}
