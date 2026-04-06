import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, Settings2, PlayCircle, CheckCircle2, AlertCircle, FileArchive, Download } from 'lucide-react';
import { gradeSubmission, GradingResult } from '../lib/grader';
import { generateAndDownloadReports } from '../lib/reporter';
import { TemplateModal } from '../components/TemplateModal';
import { GradingTemplate } from '../lib/templateManager';

export function NewTask() {
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const [studentFiles, setStudentFiles] = useState<File[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  
  const [answerFile, setAnswerFile] = useState<File | null>(null);
  const [selectedAnswerFile, setSelectedAnswerFile] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<GradingTemplate | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  
  const [logs, setLogs] = useState<string[]>([]);
  const [results, setResults] = useState<GradingResult[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const answerFileInputRef = useRef<HTMLInputElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, msg]);
    setTimeout(() => {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files).filter(f => !f.name.startsWith('.')); // filter hidden files
      setStudentFiles(files);
      const folderPathParts = files[0].webkitRelativePath.split('/');
      const folderName = folderPathParts.length > 0 ? folderPathParts[0] : '已选择文件夹';
      setSelectedFolder(`${folderName} (共 ${files.length} 个文件)`);
    }
  };

  const handleAnswerFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAnswerFile(e.target.files[0]);
      setSelectedAnswerFile(e.target.files[0].name);
    }
  };

  const handleTemplateSelect = () => {
    setIsTemplateModalOpen(true);
  };

  const handleStart = async () => {
    if (studentFiles.length === 0) {
      showToast('请先选择学生答案文件夹');
      return;
    }

    setStep(3);
    setIsProcessing(true);
    setProgress(0);
    setLogs([]);
    setResults([]);

    addLog(`[INFO] 扫描到 ${studentFiles.length} 个学生文件`);

    if (answerFile) {
      addLog(`[INFO] 正在读取标准答案: ${answerFile.name}`);
    }

    const gradingResults: GradingResult[] = [];
    
    // 延迟函数，用于避免触发 API 频率限制
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    for (let i = 0; i < studentFiles.length; i++) {
      // 如果不是第一个文件，等待 5 秒以避免触发 429 频率限制
      if (i > 0) {
        addLog(`[INFO] 正在冷却等待 5 秒，避免触发 AI 频率限制...`);
        await sleep(5000);
      }

      const file = studentFiles[i];
      addLog(`[INFO] 开始处理 (${i + 1}/${studentFiles.length}): ${file.name} ...`);
      
      try {
        const result = await gradeSubmission(file, answerFile, selectedTemplate?.content || '');
        gradingResults.push(result);
        
        if (result.error) {
          addLog(`[ERROR] ${file.name} 批改失败: ${result.error}`);
        } else {
          addLog(`[SUCCESS] ${file.name} 批改完成，得分: ${result.totalScore}`);
        }
      } catch (error: any) {
        addLog(`[ERROR] ${file.name} 发生异常: ${error.message}`);
        gradingResults.push({
          fileName: file.name,
          studentName: '未知',
          studentId: '未知',
          totalScore: 0,
          evaluation: '',
          details: [],
          error: error.message
        });
      }
      
      setProgress(Math.round(((i + 1) / studentFiles.length) * 100));
    }

    setResults(gradingResults);
    setIsProcessing(false);
    setStep(4);
  };

  const handleDownload = async () => {
    showToast('正在生成报告压缩包...');
    try {
      await generateAndDownloadReports(results);
      showToast('下载成功！');
    } catch (e: any) {
      showToast(`下载失败: ${e.message}`);
    }
  };

  const successCount = results.filter(r => !r.error).length;
  const errorCount = results.length - successCount;
  const currentFileIndex = Math.min(Math.floor((progress / 100) * studentFiles.length), studentFiles.length - 1);
  const currentFileName = studentFiles[currentFileIndex]?.name || '';

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-900 mb-8">新建批改任务</h2>

      {/* Stepper */}
      <div className="flex items-center justify-between mb-12 relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 -z-10"></div>
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-600 -z-10 transition-all duration-500" style={{ width: `${(step - 1) * 33.33}%` }}></div>
        
        {[
          { num: 1, label: '导入数据' },
          { num: 2, label: '配置规则' },
          { num: 3, label: '运行批改' },
          { num: 4, label: '完成报告' }
        ].map((s) => (
          <div key={s.num} className="flex flex-col items-center bg-slate-50 px-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 ${
              step >= s.num ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300 text-slate-400'
            }`}>
              {s.num}
            </div>
            <span className={`mt-2 text-sm font-medium ${step >= s.num ? 'text-slate-900' : 'text-slate-400'}`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* Step 1: Import */}
      {step === 1 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <FileArchive className="text-blue-600" size={20} />
              1. 选择学生答案文件夹
            </h3>
            <div 
              className="border-2 border-dashed border-slate-300 rounded-xl p-10 text-center hover:bg-slate-50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFolderSelect} 
                className="hidden" 
                webkitdirectory="" 
                directory="" 
                multiple 
              />
              <UploadCloud className="mx-auto text-slate-400 mb-4" size={48} />
              {selectedFolder ? (
                <div className="text-green-600 font-medium mb-1">
                  <CheckCircle2 className="inline-block mr-2 mb-1" size={20} />
                  {selectedFolder}
                </div>
              ) : (
                <>
                  <p className="text-slate-600 font-medium mb-1">点击选择本地文件夹，或将文件夹拖拽至此</p>
                  <p className="text-sm text-slate-400">支持 .docx, .doc, .pdf, .jpg, .png 格式</p>
                </>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <FileText className="text-blue-600" size={20} />
              2. 导入标准答案与评分规则
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div 
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${selectedAnswerFile ? 'border-green-500 bg-green-50' : 'border-slate-200 hover:border-blue-400'}`}
                onClick={() => answerFileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={answerFileInputRef} 
                  onChange={handleAnswerFileSelect} 
                  className="hidden" 
                  accept=".docx,.doc,.json,.txt,.pdf"
                />
                {selectedAnswerFile ? (
                  <>
                    <p className="font-medium text-green-700 flex items-center gap-2">
                      <CheckCircle2 size={16} />
                      已选择答案文件
                    </p>
                    <p className="text-sm text-green-600 mt-1 truncate">{selectedAnswerFile}</p>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-slate-800">上传标准答案文件</p>
                    <p className="text-sm text-slate-500 mt-1">支持 Word / PDF / JSON / TXT</p>
                  </>
                )}
              </div>
              <div 
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${selectedTemplate ? 'border-green-500 bg-green-50' : 'border-slate-200 hover:border-blue-400'}`}
                onClick={handleTemplateSelect}
              >
                {selectedTemplate ? (
                  <>
                    <p className="font-medium text-green-700 flex items-center gap-2">
                      <CheckCircle2 size={16} />
                      已选择评分模板
                    </p>
                    <p className="text-sm text-green-600 mt-1 truncate">{selectedTemplate.title}</p>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-slate-800">选择历史评分模板</p>
                    <p className="text-sm text-slate-500 mt-1">从系统预设或历史记录中选择</p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={() => setStep(2)} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-lg font-medium transition-colors">
              下一步
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Configure */}
      {step === 2 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
              <Settings2 className="text-blue-600" size={20} />
              批改引擎配置
            </h3>
            
            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                <div>
                  <p className="font-medium text-slate-800">启用 OCR 图像识别</p>
                  <p className="text-sm text-slate-500">自动识别图片和扫描版 PDF 中的文字</p>
                </div>
                <input type="checkbox" className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" defaultChecked />
              </label>

              <label className="flex items-center justify-between p-4 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                <div>
                  <p className="font-medium text-slate-800">启用 AI 详细点评</p>
                  <p className="text-sm text-slate-500">逐字逐句分析错误原因并给出修改建议</p>
                </div>
                <input type="checkbox" className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" defaultChecked />
              </label>

              <label className="flex items-center justify-between p-4 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                <div>
                  <p className="font-medium text-slate-800">生成班级总报告</p>
                  <p className="text-sm text-slate-500">包含成绩汇总表和高频错误统计</p>
                </div>
                <input type="checkbox" className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" defaultChecked />
              </label>
            </div>
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(1)} className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-8 py-2.5 rounded-lg font-medium transition-colors">
              上一步
            </button>
            <button onClick={handleStart} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2">
              <PlayCircle size={20} />
              开始批改
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Processing */}
      {step === 3 && (
        <div className="bg-white p-10 rounded-xl border border-slate-200 shadow-sm text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mb-8 relative w-32 h-32 mx-auto">
            <svg className="animate-spin w-full h-full text-blue-100" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" />
            </svg>
            <svg className="absolute top-0 left-0 w-full h-full text-blue-600" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray="283" strokeDashoffset={283 - (283 * progress) / 100} className="transition-all duration-500 ease-out" />
            </svg>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl font-bold text-slate-800">
              {progress}%
            </div>
          </div>
          
          <h3 className="text-xl font-bold text-slate-900 mb-2">正在批改中...</h3>
          <p className="text-slate-500 mb-8">正在处理: {currentFileName} ({currentFileIndex + 1}/{studentFiles.length})</p>

          <div className="bg-slate-900 rounded-lg p-4 text-left font-mono text-sm text-green-400 h-48 overflow-y-auto">
            {logs.map((log, i) => (
              <p key={i} className={log.includes('[ERROR]') || log.includes('[WARN]') ? 'text-yellow-400' : ''}>
                {log}
              </p>
            ))}
            <p className="animate-pulse">_</p>
            <div ref={logsEndRef} />
          </div>
        </div>
      )}

      {/* Step 4: Results */}
      {step === 4 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white p-10 rounded-xl border border-slate-200 shadow-sm text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="text-green-600" size={40} />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">批改任务已完成！</h3>
            <p className="text-slate-500 mb-8">共处理 {results.length} 份作业，成功 {successCount} 份，异常 {errorCount} 份。</p>

            <div className="flex justify-center gap-4">
              <button onClick={handleDownload} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2">
                <Download size={18} />
                下载批改报告 (ZIP)
              </button>
            </div>
          </div>

          {errorCount > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                <h3 className="font-semibold text-slate-800">异常文件列表</h3>
              </div>
              <div className="p-6 space-y-4">
                {results.filter(r => r.error).map((r, i) => (
                  <div key={i} className="flex items-start gap-3 bg-red-50 text-red-800 p-4 rounded-lg border border-red-100">
                    <AlertCircle className="mt-0.5 shrink-0" size={18} />
                    <div>
                      <p className="font-medium">{r.fileName}</p>
                      <p className="text-sm mt-1 opacity-90">{r.error}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 bg-slate-800 text-white px-6 py-3 rounded-lg shadow-xl z-50 animate-in fade-in slide-in-from-bottom-4">
          {toast}
        </div>
      )}

      <TemplateModal 
        isOpen={isTemplateModalOpen} 
        onClose={() => setIsTemplateModalOpen(false)} 
        onSelect={setSelectedTemplate} 
      />
    </div>
  );
}
