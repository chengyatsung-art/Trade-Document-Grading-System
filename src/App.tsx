/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { NewTask } from './pages/NewTask';
import { SystemDocs } from './pages/SystemDocs';
import { Settings } from './pages/Settings';
import { History } from './pages/History';

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />
      <main className="flex-1 overflow-y-auto">
        {currentTab === 'dashboard' && <Dashboard setCurrentTab={setCurrentTab} />}
        {currentTab === 'new-task' && <NewTask />}
        {currentTab === 'docs' && <SystemDocs />}
        {currentTab === 'history' && <History />}
        {currentTab === 'settings' && <Settings />}
      </main>
    </div>
  );
}
