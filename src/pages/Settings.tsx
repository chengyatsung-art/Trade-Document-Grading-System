import React, { useState, useEffect } from 'react';
import { Save, Key, Sliders, Database, Shield, Globe } from 'lucide-react';

export function Settings() {
  const [engineType, setEngineType] = useState<'builtin' | 'custom'>('builtin');
  const [builtinModel, setBuiltinModel] = useState('gemini-3.5-flash');
  const [customBaseUrl, setCustomBaseUrl] = useState('https://api.deepseek.com/v1');
  const [customApiKey, setCustomApiKey] = useState('');
  const [customModel, setCustomModel] = useState('deepseek-chat');
  const [customGeminiKey, setCustomGeminiKey] = useState('');
  const [customGeminiProxy, setCustomGeminiProxy] = useState('');
  const [coolingDelay, setCoolingDelay] = useState<number>(5);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedEngine = localStorage.getItem('ai_engine_type') as 'builtin' | 'custom';
    if (savedEngine) setEngineType(savedEngine);
    
    const savedBuiltinModel = localStorage.getItem('ai_builtin_model');
    if (savedBuiltinModel) setBuiltinModel(savedBuiltinModel);
    
    const savedBaseUrl = localStorage.getItem('ai_custom_base_url');
    if (savedBaseUrl) setCustomBaseUrl(savedBaseUrl);
    
    const savedApiKey = localStorage.getItem('ai_custom_api_key');
    if (savedApiKey) setCustomApiKey(savedApiKey);
    
    const savedModel = localStorage.getItem('ai_custom_model');
    if (savedModel) setCustomModel(savedModel);

    const savedGeminiKey = localStorage.getItem('ai_custom_gemini_key');
    if (savedGeminiKey) setCustomGeminiKey(savedGeminiKey);

    const savedGeminiProxy = localStorage.getItem('ai_custom_gemini_proxy');
    if (savedGeminiProxy) setCustomGeminiProxy(savedGeminiProxy);

    const savedDelay = localStorage.getItem('ai_cooling_delay');
    if (savedDelay) setCoolingDelay(parseInt(savedDelay, 10) || 5);
  }, []);

  const handleSave = () => {
    localStorage.setItem('ai_engine_type', engineType);
    localStorage.setItem('ai_builtin_model', builtinModel);
    localStorage.setItem('ai_custom_base_url', customBaseUrl);
    localStorage.setItem('ai_custom_api_key', customApiKey);
    localStorage.setItem('ai_custom_model', customModel);
    localStorage.setItem('ai_custom_gemini_key', customGeminiKey);
    localStorage.setItem('ai_custom_gemini_proxy', customGeminiProxy);
    localStorage.setItem('ai_cooling_delay', coolingDelay.toString());
    
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

            {engineType === 'builtin' && (
              <div className="space-y-4 p-5 bg-slate-50 border border-slate-200 rounded-lg animate-in fade-in slide-in-from-top-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    默认大模型选择
                  </label>
                  <select 
                    value={builtinModel}
                    onChange={(e) => setBuiltinModel(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="gemini-3.5-flash">Gemini 3.5 Flash (最新最快，速度极快且额度充足 - 推荐)</option>
                    <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (推理能力强，适合极其复杂的单证推理)</option>
                    <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (极速轻量，节省流量和额度，适合高速批量批改)</option>
                  </select>
                  <p className="text-sm text-slate-500 mt-2">
                    Flash 模型是 Google 最新的 3.5 系列大模型，批改速度极快且额度高（限制 15次/分钟）；Lite 模型则是超轻量高速模型，适合大规模批改作业（限制 30次/分钟）；Pro 模型推理能力极强但频控最严格（限制 2次/分钟）。
                  </p>
                </div>

                <div className="mt-4 border-t border-slate-200 pt-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                    <Key size={16} className="text-slate-400" />
                    您专属的 Gemini API Key (可选配置，用于自主额度)
                  </label>
                  <input 
                    type="password" 
                    value={customGeminiKey}
                    onChange={(e) => setCustomGeminiKey(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="AIzaSy... (若留空，则默认使用系统的共享免费免费体验额度)"
                  />
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    🌟 <span>提示：如果连续批改多份大文件触发了系统的共享频次限制 (429) 或提示额度超限，强烈建议前往 </span>
                    <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-medium hover:underline inline-flex items-center">
                      Google AI Studio 官网
                    </a>
                    <span> 免费获取您个人的 API Key 并填入此处。配置后页面将直接通过您的独立账号发起安全连接，彻底告别公共额度排队和限流。</span>
                  </p>
                </div>

                <div className="mt-4 border-t border-slate-200 pt-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                    <Globe size={16} className="text-slate-400" />
                    Gemini API 代理地址 (可选，配置后可绕过网络或特定区域限制)
                  </label>
                  <input 
                    type="text" 
                    value={customGeminiProxy}
                    onChange={(e) => setCustomGeminiProxy(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="例如：https://api.example.com/v1"
                  />
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    ⚙️ 若您所在的网络环境无法直接连接 Google 官方服务器，或者使用了第三方反向代理/转发接口，可在此处指定代理 Base URL。留空则直接连接 Google 官方接口。
                  </p>
                </div>

                <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4 text-xs text-amber-800 leading-relaxed shadow-sm">
                  <span className="font-semibold block mb-1 text-amber-950">💡 常见问题与解答：</span>
                  <p className="mb-2"><strong>问：为什么首页的「今日 API 请求额度 (本地预估)」显示为 0 次，依然会报错“user has exceeded quota”？</strong></p>
                  <p className="mb-2">答：这是一个本地离线计数器，它仅通过您本地浏览器的历史批改记录来<strong>估算</strong>您发送的文档件数，它<strong>并不是</strong>去 Google 服务器查询 API 额度。如果其他的教师正在共用内置的系统额度，或者您虽然使用了个人免费 Key，但因为单次上传作业多、文件大而触发了以下限制，也会导致该报错。</p>
                  <p className="mb-2"><strong>问：我已经配置了两个专属的免费 Gemini API Key，为什么还是会经常报 “exceeded quota / 429 频限” 错误？</strong></p>
                  <p className="mb-1">答：Google 提供的免费 API Key 有非常严格的限制。虽然它的总额度足够大，但在批量使用中：</p>
                  <ul className="list-disc pl-4 mb-2 space-y-0.5">
                    <li><strong>RPM（每分钟请求数）</strong> 限制为 15 次。</li>
                    <li><strong>TPM（每分钟 Token 数量限额）</strong> 被大文件瞬间充盈（批改作业时，尤其是<strong>图片和 PDF 格式大文件</strong>，会包含海量的字节并消耗巨量 Token），在一分钟内发送多份会导致 TPM 额度瞬间超支，立即被 Google 服务器暂停数分钟。</li>
                  </ul>
                  <p className="mb-2 font-medium text-amber-950">🚀 极速解决办法：</p>
                  <ol className="list-decimal pl-4 space-y-1">
                    <li>在下方「常规设置」中，将<strong>「批量批改间隔冷却时间」从默认的 5 秒调大到 15 秒或 20 秒</strong>。这能有效拉开排队间隔，防止短时间内累计的 Token 超过每分钟限制。</li>
                    <li>如果您要追求极高的并发或者极速不间断地批改大批量文件，推荐<strong>切换至上方的「自定义国内模型」</strong>，选用如 <strong>DeepSeek</strong>、智谱、Kimi 等服务，其每百万 Token 的单价极其低廉且完全不设低规格速率限制！</li>
                  </ol>
                </div>
              </div>
            )}

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

            {/* Shared Frequency/Throttle Settings */}
            <div className="border-t border-slate-100 pt-5 mt-5">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                批量批改间隔冷却时间 (秒)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={coolingDelay}
                  onChange={(e) => setCoolingDelay(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-32 border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <span className="text-sm text-slate-600">秒</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                * 默认值为 5 秒。如果在连续批改多份作业时遭遇 429 报错，建议调大该值（如 10 秒或 15 秒）以降低请求频率。
              </p>
            </div>
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
