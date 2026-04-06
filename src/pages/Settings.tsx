import React, { useState, useEffect } from 'react';
import { Save, Key, Sliders, Database, Shield, Globe } from 'lucide-react';

export function Settings() {
  const [engineType, setEngineType] = useState<'builtin' | 'custom'>('builtin');
  const [customBaseUrl, setCustomBaseUrl] = useState('https://api.deepseek.com/v1');
  const [customApiKey, setCustomApiKey] = useState('');
  const [customModel, setCustomModel] = useState('deepseek-chat');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedEngine = localStorage.getItem('ai_engine_type') as 'builtin' | 'custom';
    if (savedEngine) setEngineType(savedEngine);
    
    const savedBaseUrl = localStorage.getItem('ai_custom_base_url');
    if (savedBaseUrl) setCustomBaseUrl(savedBaseUrl);
    
    const savedApiKey = localStorage.getItem('ai_custom_api_key');
    if (savedApiKey) setCustomApiKey(savedApiKey);
    
    const savedModel = localStorage.getItem('ai_custom_model');
    if (savedModel) setCustomModel(savedModel);
  }, []);

  const handleSave = () => {
    localStorage.setItem('ai_engine_type', engineType);
    localStorage.setItem('ai_custom_base_url', customBaseUrl);
    localStorage.setItem('ai_custom_api_key', customApiKey);
    localStorage.setItem('ai_custom_model', customModel);
    
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-900 mb-8">系统设置</h2>

      <div className="space-y-6">
        {/* AI Engine Settings */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
            <Sliders className="text-blue-600" size={20} />
            <h3 className="font-semibold text-slate-800">AI 批改引擎配置</h3>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                批改引擎服务商
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${engineType === 'builtin' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-200'}`}
                  onClick={() => setEngineType('builtin')}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-3 h-3 rounded-full ${engineType === 'builtin' ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                    <p className="font-medium text-slate-800">AI Studio 内置引擎</p>
                  </div>
                  <p className="text-sm text-slate-500 ml-5">使用当前环境默认的 Gemini 大模型，无需配置 API Key。</p>
                </div>
                
                <div 
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${engineType === 'custom' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-200'}`}
                  onClick={() => setEngineType('custom')}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-3 h-3 rounded-full ${engineType === 'custom' ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                    <p className="font-medium text-slate-800">自定义国内模型 (OpenAI 兼容)</p>
                  </div>
                  <p className="text-sm text-slate-500 ml-5">支持 DeepSeek、智谱 GLM、通义千问等国内大模型接口。</p>
                </div>
              </div>
            </div>

            {engineType === 'custom' && (
              <div className="space-y-4 p-5 bg-slate-50 border border-slate-200 rounded-lg animate-in fade-in slide-in-from-top-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                    <Globe size={16} className="text-slate-400" />
                    接口地址 (Base URL)
                  </label>
                  <input 
                    type="text" 
                    value={customBaseUrl}
                    onChange={(e) => setCustomBaseUrl(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="例如：https://api.deepseek.com/v1"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    常用地址：DeepSeek (https://api.deepseek.com/v1) | 智谱 (https://open.bigmodel.cn/api/paas/v4)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                    <Key size={16} className="text-slate-400" />
                    API Key
                  </label>
                  <input 
                    type="password" 
                    value={customApiKey}
                    onChange={(e) => setCustomApiKey(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="sk-..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    模型名称 (Model)
                  </label>
                  <input 
                    type="text" 
                    value={customModel}
                    onChange={(e) => setCustomModel(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="例如：deepseek-chat"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    常用模型：deepseek-chat, glm-4-flash, qwen-plus
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Local Storage Settings */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
            <Database className="text-blue-600" size={20} />
            <h3 className="font-semibold text-slate-800">本地数据与隐私</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Shield className="text-green-600 mt-0.5" size={20} />
                <div>
                  <p className="font-medium text-slate-800">纯前端模式 (Serverless)</p>
                  <p className="text-sm text-slate-500 mt-1">
                    当前系统运行在纯前端模式，所有学生文件均在本地浏览器解析，不会上传到任何第三方服务器（除了将文本发送给 Google Gemini API 进行批改）。
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
              <div>
                <p className="font-medium text-slate-800">保留历史记录</p>
                <p className="text-sm text-slate-500 mt-1">在浏览器本地存储 (LocalStorage) 中保留最近的批改任务记录</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button 
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Save size={18} />
            {saved ? '已保存' : '保存设置'}
          </button>
        </div>
      </div>
    </div>
  );
}
