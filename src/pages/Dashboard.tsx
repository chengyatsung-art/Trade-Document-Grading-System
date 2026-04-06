import React, { useState } from 'react';
import { Users, FileCheck, AlertCircle, Clock } from 'lucide-react';

export function Dashboard({ setCurrentTab }: { setCurrentTab: (t: string) => void }) {
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">欢迎回来，李老师</h2>
          <p className="text-slate-500 mt-1">这里是您的外贸单证批改工作台</p>
        </div>
        <button 
          onClick={() => setCurrentTab('new-task')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
        >
          + 新建批改任务
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: '本周批改份数', value: '156', icon: FileCheck, color: 'text-green-600', bg: 'bg-green-100' },
          { label: '待复核异常', value: '12', icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-100' },
          { label: '覆盖班级', value: '4', icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
          { label: '节省时间 (小时)', value: '24.5', icon: Clock, color: 'text-purple-600', bg: 'bg-purple-100' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${stat.bg}`}>
                <stat.icon className={stat.color} size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h3 className="font-semibold text-slate-800">最近批改任务</h3>
        </div>
        <div className="divide-y divide-slate-200">
          {[
            { name: '2025届国贸1班-信用证审核作业', date: '2026-04-05', total: 45, status: '已完成' },
            { name: '2025届国贸2班-商业发票填制', date: '2026-04-03', total: 42, status: '已完成' },
            { name: '商务英语-提单翻译练习', date: '2026-04-01', total: 38, status: '已完成' },
          ].map((task, i) => (
            <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div>
                <p className="font-medium text-slate-900">{task.name}</p>
                <p className="text-sm text-slate-500 mt-1">{task.date} · 共 {task.total} 份</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {task.status}
                </span>
                <button onClick={() => showToast('原型演示：报告详情页正在开发中...')} className="text-blue-600 hover:text-blue-800 text-sm font-medium">查看报告</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 bg-slate-800 text-white px-6 py-3 rounded-lg shadow-xl z-50 animate-in fade-in slide-in-from-bottom-4">
          {toast}
        </div>
      )}
    </div>
  );
}
