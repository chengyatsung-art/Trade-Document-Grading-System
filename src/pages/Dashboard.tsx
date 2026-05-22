import React, { useState, useEffect } from 'react';
import { Users, FileCheck, AlertCircle, Clock, Cpu, Activity } from 'lucide-react';

export function Dashboard({ setCurrentTab }: { setCurrentTab: (t: string) => void }) {
  const [toast, setToast] = useState<string | null>(null);
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [engineType, setEngineType] = useState('builtin');
  const [builtinModel, setBuiltinModel] = useState('gemini-3.5-flash');
  const [todayCalls, setTodayCalls] = useState(0);
  const [stats, setStats] = useState({
    totalFiles: 0,
    errorFiles: 0,
    savedHours: 0
  });

  useEffect(() => {
    const savedHistory = JSON.parse(localStorage.getItem('grading_history') || '[]');
    setRecentTasks(savedHistory.slice(0, 3));
    
    // Get engine settings
    setEngineType(localStorage.getItem('ai_engine_type') || 'builtin');
    setBuiltinModel(localStorage.getItem('ai_builtin_model') || 'gemini-3.5-flash');

    let totalFiles = 0;
    let errorFiles = 0;
    
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    let callsToday = 0;

    savedHistory.forEach((task: any) => {
      totalFiles += task.totalFiles || 0;
      errorFiles += task.errorCount || 0;
      
      // Calculate today's API calls based on processed files
      if (task.date.startsWith(todayStr)) {
        callsToday += (task.totalFiles || 0);
      }
    });
    
    setTodayCalls(callsToday);
    
    // Assume 10 minutes (0.16 hours) saved per file
    const savedHours = (totalFiles * 0.16).toFixed(1);
    
    setStats({
      totalFiles,
      errorFiles,
      savedHours: parseFloat(savedHours)
    });
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const limitData = builtinModel === 'gemini-3.1-pro-preview' ? { max: 50, rpm: 2 } : { max: 1500, rpm: 15 };
  const percentUsed = Math.min((todayCalls / limitData.max) * 100, 100);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">欢迎回来，程老师</h2>
          <p className="text-slate-500 mt-1">这里是您的外贸单证批改工作台</p>
        </div>
        <button 
          onClick={() => setCurrentTab('new-task')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
        >
          + 新建批改任务
        </button>
      </div>

      {/* AI Engine Status Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-3 rounded-lg text-white shadow-sm">
            <Cpu size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 text-lg">AI 引擎运行状态</h3>
            <p className="text-sm text-slate-500 mt-1">
              当前使用: {engineType === 'builtin' ? 
                (builtinModel === 'gemini-3.1-pro-preview' ? 'Gemini 3.1 Pro (系统内置)' : 'Gemini 3.5 Flash (系统内置 - 推荐)') 
                : '自定义国内大模型'}
            </p>
          </div>
        </div>

        {engineType === 'builtin' && (
           <div className="flex flex-col items-start md:items-end w-full md:w-auto">
             <div className="flex items-center gap-2 mb-2">
               <Activity size={16} className={todayCalls >= limitData.max ? 'text-red-500' : 'text-green-500'} />
               <span className="text-sm font-medium text-slate-700">今日已批改次数 (本地统计)</span>
             </div>
             <div className="flex items-center gap-4 w-full md:w-auto">
               <div className="w-full md:w-64 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${todayCalls >= limitData.max ? 'bg-red-500' : 'bg-blue-500'}`}
                    style={{ width: `${percentUsed}%` }}
                  ></div>
               </div>
               <span className="text-sm font-bold text-slate-800 whitespace-nowrap">
                 已用 {todayCalls} / 额度 {limitData.max} 次
               </span>
             </div>
             <p className="text-xs text-slate-400 mt-2">
               * {builtinModel.includes('pro') ? 'Pro 模型限制每天 50 次，每分钟 2 次' : 'Flash 模型限制每天 1500 次，每分钟 15 次'}。
              </p>
              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4 text-xs text-amber-800 leading-relaxed shadow-sm max-w-xl text-left">
                <span className="font-semibold block mb-1 text-amber-950 flex items-center gap-1">
                  💡 常见疑惑：为什么已用次数显示为 0，依然会报错 “user has exceeded quota (额度超限/被频控)”？
                </span>
                <p className="mb-2">
                  <strong>1. 本地统计并非实时状态</strong>：这个跑马灯式的统计进度条只是<strong>本地浏览器计数器</strong>，仅根据您个人在本地浏览器中的历史批改任务量进行估算，<strong>不能连入并查询 Google 官方后台的实时总池可用额度。</strong>
                </p>
                <p className="mb-2">
                  <strong>2. 共享额度被其他教师用完</strong>：如果您使用的是系统内置的共享额度，别的老师高频调用或大文件上传，也会导致系统的公共免费资源包耗尽。
                </p>
                <p className="mb-2">
                  <strong>3. 免费 Key 本身具有严格的“每分钟双限制” (RPM & TPM)</strong>：即使您自备了专属的免费 API Key，<strong>也无法进行瞬间高并发的高负荷操作</strong>。免费 Key 每分钟极速调用最高为 15 次，且上传多份带有图片、长文等大规格文档会在几秒内吞噬全部 TPM 额度，导致被 Google 后台暂停后续请求数分钟。
                </p>
                <p className="font-semibold text-amber-950 mt-1">🚀 极速解决办法：</p>
                <p>
                  1. 前往<strong>「系统设置」里，将「批量批改间隔冷却时间」从默认的 5 秒调大至 15 秒或 20 秒</strong>。这给接口提供了足够的喘息机制，彻底由于 RPM/TPM 过载触发的 429 频控报错！<br />
                  2. 若需要极速、不间断地批量校评，推荐在设置中换用极其便宜、高速且完全不设低规格速率限制的<strong>自定义国内大模型（例如 DeepSeek、智谱、Kimi 等）</strong>，体验更稳定的批改服务。
                </p>
              </div>
            </div>
        )}
        
        {engineType === 'custom' && (
           <div className="text-left md:text-right">
             <p className="text-sm font-medium text-slate-700">API调用正常，正在使用第三方自定义接口</p>
             <p className="text-xs text-slate-500 mt-1">频率和额度限制由您的 API 供应商（如 DeepSeek/智谱）决定</p>
           </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: '累计批改份数', value: stats.totalFiles.toString(), icon: FileCheck, color: 'text-green-600', bg: 'bg-green-100' },
          { label: '累计发现异常', value: stats.errorFiles.toString(), icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-100' },
          { label: '历史任务数', value: recentTasks.length > 0 ? JSON.parse(localStorage.getItem('grading_history') || '[]').length.toString() : '0', icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
          { label: '节省时间 (小时)', value: stats.savedHours.toString(), icon: Clock, color: 'text-purple-600', bg: 'bg-purple-100' },
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
          {recentTasks.length > 0 ? recentTasks.map((task, i) => (
            <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div>
                <p className="font-medium text-slate-900">{task.folderName}</p>
                <p className="text-sm text-slate-500 mt-1">{task.date} · 共 {task.totalFiles} 份</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {task.status}
                </span>
                <button onClick={() => setCurrentTab('history')} className="text-blue-600 hover:text-blue-800 text-sm font-medium">查看详情</button>
              </div>
            </div>
          )) : (
            <div className="px-6 py-8 text-center text-slate-500">
              暂无批改任务，去新建一个吧！
            </div>
          )}
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
