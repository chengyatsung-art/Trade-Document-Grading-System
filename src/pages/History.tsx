import React, { useState, useEffect } from 'react';
import { Clock, FileText, CheckCircle2, AlertCircle, Download, Trash2, Search } from 'lucide-react';
import { generateAndDownloadReports } from '../lib/reporter';

export function History() {
  const [searchTerm, setSearchTerm] = useState('');
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const savedHistory = JSON.parse(localStorage.getItem('grading_history') || '[]');
    setHistory(savedHistory);
  }, []);

  const filteredHistory = history.filter(task => 
    task.folderName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    task.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (id: string) => {
    const newHistory = history.filter(h => h.id !== id);
    setHistory(newHistory);
    localStorage.setItem('grading_history', JSON.stringify(newHistory));
  };

  const handleDownload = async (task: any) => {
    if (!task.results || task.results.length === 0) {
      alert('没有可下载的批改结果');
      return;
    }
    try {
      await generateAndDownloadReports(task.results);
    } catch (e: any) {
      alert(`下载失败: ${e.message}`);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">历史任务</h2>
          <p className="text-slate-500">查看和管理您过去执行的批改任务记录。</p>
        </div>
        
        <div className="relative w-72">
          <input 
            type="text" 
            placeholder="搜索任务ID或文件夹名称..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
                <th className="p-4 font-semibold">任务 ID / 时间</th>
                <th className="p-4 font-semibold">作业文件夹</th>
                <th className="p-4 font-semibold">评分模板</th>
                <th className="p-4 font-semibold">批改结果</th>
                <th className="p-4 font-semibold text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredHistory.length > 0 ? (
                filteredHistory.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-slate-900">{task.id}</div>
                      <div className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                        <Clock size={14} />
                        {task.date}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-slate-800">
                        <FileText size={16} className="text-blue-500" />
                        <span className="font-medium">{task.folderName}</span>
                      </div>
                      <div className="text-sm text-slate-500 mt-1">共 {task.totalFiles} 份文件</div>
                    </td>
                    <td className="p-4 text-slate-600 text-sm">
                      {task.template}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
                          <CheckCircle2 size={16} />
                          {task.successCount} 成功
                        </div>
                        {task.errorCount > 0 && (
                          <div className="flex items-center gap-1.5 text-red-600 text-sm font-medium">
                            <AlertCircle size={16} />
                            {task.errorCount} 异常
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleDownload(task)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors tooltip-trigger"
                          title="重新下载报告"
                        >
                          <Download size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(task.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors tooltip-trigger"
                          title="删除记录"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    没有找到匹配的历史记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
