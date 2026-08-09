/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import YouthMainApp from './components/YouthMainApp';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { LandingPage } from './components/LandingPage';

export default function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'student' | 'teacher'>('landing');

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
        <TeacherDashboard onLogout={() => setCurrentView('landing')} />
      )}
    </div>
  );
}
