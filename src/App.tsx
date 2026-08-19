/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import YouthMainApp from './components/YouthMainApp';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { LandingPage } from './components/LandingPage';
import TeacherLogin from './components/TeacherLogin';
import { teacherService } from './services/teacherService';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { migrateBatchesOnlyForAuthenticatedTeacher } from './services/migrationService';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      if (path.startsWith('/student')) return '/student';
      if (path.startsWith('/teacher')) return '/teacher';
    }
    return '/';
  });

  const [authenticatedTeacher, setAuthenticatedTeacher] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);

  const navigateTo = (path: string) => {
    if (typeof window !== 'undefined' && window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    setCurrentPath(path);
  };

  const verifyTeacherAuth = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setAuthenticatedTeacher(false);
      setIsCheckingAuth(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const profile = await teacherService.getCurrentTeacherProfile();
        if (profile) {
          setAuthenticatedTeacher(true);
          migrateBatchesOnlyForAuthenticatedTeacher().then((report) => {
            console.log('[Batch Migration Result]', report);
          });
          return;
        }
      }
      setAuthenticatedTeacher(false);
    } catch {
      setAuthenticatedTeacher(false);
    } finally {
      setIsCheckingAuth(false);
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      if (path.startsWith('/student')) {
        setCurrentPath('/student');
      } else if (path.startsWith('/teacher')) {
        setCurrentPath('/teacher');
      } else {
        setCurrentPath('/');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    verifyTeacherAuth();

    if (!isSupabaseConfigured) return;

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const profile = await teacherService.getCurrentTeacherProfile();
        if (profile) {
          setAuthenticatedTeacher(true);
          migrateBatchesOnlyForAuthenticatedTeacher().then((report) => {
            console.log('[Batch Migration Result]', report);
          });
        } else {
          setAuthenticatedTeacher(false);
        }
      } else if (event === 'SIGNED_OUT') {
        setAuthenticatedTeacher(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [verifyTeacherAuth]);

  const handleTeacherLoginSuccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const profile = await teacherService.getCurrentTeacherProfile();
      if (profile) {
        setAuthenticatedTeacher(true);
        navigateTo('/teacher');
        migrateBatchesOnlyForAuthenticatedTeacher().then((report) => {
          console.log('[Batch Migration Result]', report);
        });
        return;
      }
    }
    setAuthenticatedTeacher(false);
  };

  const handleTeacherLogout = async () => {
    await teacherService.logoutTeacher();
    setAuthenticatedTeacher(false);
    navigateTo('/');
  };

  return (
    <div className="relative min-h-screen bg-slate-950 font-sans selection:bg-teal-500 selection:text-white dir-rtl">
      {currentPath === '/' && (
        <LandingPage
          onSelectStudent={() => navigateTo('/student')}
          onTeacherAuthenticated={handleTeacherLoginSuccess}
        />
      )}

      {currentPath === '/student' && (
        <YouthMainApp onLogout={() => navigateTo('/')} />
      )}

      {currentPath === '/teacher' && (
        <>
          {isCheckingAuth ? (
            <div className="min-h-screen flex items-center justify-center bg-slate-950 text-teal-400">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-bold text-slate-400">جاري التحقق من هوية المعلمة...</span>
              </div>
            </div>
          ) : authenticatedTeacher ? (
            <TeacherDashboard onLogout={handleTeacherLogout} />
          ) : (
            <TeacherLogin onLoginSuccess={handleTeacherLoginSuccess} />
          )}
        </>
      )}
    </div>
  );
}
