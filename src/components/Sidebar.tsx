import React from 'react';
import { LayoutDashboard, FileText, History, Settings, BookOpen } from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export function Sidebar({ currentTab, setCurrentTab }: SidebarProps) {
  const navItems = [
    { id: 'dashboard', label: '工作台', icon: LayoutDashboard },
    { id: 'new-task', label: '新建批改', icon: FileText },
    { id: 'history', label: '历史任务', icon: History },
    { id: 'settings', label: '系统设置', icon: Settings },
    { id: 'docs', label: '架构文档', icon: BookOpen },
  ];

  return (
    <div className="w-64 bg-slate-900 text-slate-300 flex flex-col h-full">
      <div className="p-6">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <FileText className="text-blue-400" />
          单证批改系统
        </h1>
        <p className="text-xs text-slate-500 mt-1">AI-Powered Grading</p>
      </div>
      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
        v1.0.0-beta
      </div>
    </div>
  );
}
