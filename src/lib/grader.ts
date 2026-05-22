import { GoogleGenAI, Type } from '@google/genai';
import mammoth from 'mammoth';

function getGoogleAIClient(): GoogleGenAI {
  const customKey = localStorage.getItem('ai_custom_gemini_key') || '';
  const customProxy = localStorage.getItem('ai_custom_gemini_proxy') || '';
  
  const config: any = {};
  if (customKey.trim()) {
    config.apiKey = customKey.trim();
  } else {
    config.apiKey = process.env.GEMINI_API_KEY;
  }
  
  if (customProxy.trim()) {
    config.baseURL = customProxy.trim();
  }
  
  return new GoogleGenAI(config);
}

export interface GradingDetail {
  question: string;
  studentAnswer: string;
  isCorrect: boolean;
  score: number;
  feedback: string;
}

export interface GradingResult {
  fileName: string;
  studentName: string;
  studentId: string;
  totalScore: number;
  evaluation: string;
  details: GradingDetail[];
  error?: string;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
  });
}

async function extractTextFromDocx(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

async function extractTextFromFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });
}

async function extractTextFromLegacyDoc(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const decoder8 = new TextDecoder('utf-8', { fatal: false });
  const text8 = decoder8.decode(buffer);
  const decoder16 = new TextDecoder('utf-16le', { fatal: false });
  const text16 = decoder16.decode(buffer);

  // Keep Chinese characters, English letters, numbers, and basic punctuation
  const clean = (str: string) => str.replace(/[^\x20-\x7E\u4E00-\u9FA5\u3000-\u303F\uFF00-\uFFEF\n\r]/g, '');

  return `[由于是旧版 .doc 格式，提取的文本可能包含乱码，请结合上下文理解]\n${clean(text8)}\n${clean(text16)}`;
}

async function processFileToPart(file: File, label: string, isCustomEngine: boolean): Promise<any[]> {
  const parts: any[] = [];
  
  if (isCustomEngine) {
    parts.push({ type: 'text', text: `\n\n【${label}】\n` });
  } else {
    parts.push({ text: `\n\n【${label}】\n` });
  }

  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.docx')) {
    const text = await extractTextFromDocx(file);
    parts.push(isCustomEngine ? { type: 'text', text } : { text });
  } else if (fileName.endsWith('.doc')) {
    const text = await extractTextFromLegacyDoc(file);
    parts.push(isCustomEngine ? { type: 'text', text } : { text });
  } else if (fileName.endsWith('.txt') || fileName.endsWith('.json')) {
    const text = await extractTextFromFile(file);
    parts.push(isCustomEngine ? { type: 'text', text } : { text });
  } else if (file.type === 'application/pdf' || fileName.endsWith('.pdf') || file.type.startsWith('image/')) {
    const base64 = await fileToBase64(file);
    const mimeType = fileName.endsWith('.pdf') ? 'application/pdf' : file.type;
    
    if (isCustomEngine) {
      parts.push({ type: 'text', text: `(请参考随附的 ${fileName} 文件内容)` });
      // Note: Not all OpenAI compatible APIs support PDF or images in this format. 
      // We send it as an image_url which works for vision models.
      parts.push({
        type: 'image_url',
        image_url: { url: `data:${mimeType};base64,${base64}` }
      });
    } else {
      parts.push({ text: `(请参考随附的 ${fileName} 文件内容)` });
      parts.push({ inlineData: { data: base64, mimeType } });
    }
  } else {
    throw new Error(`不支持的文件格式: ${file.name}`);
  }
  return parts;
}

function extractStudentInfoFromFilename(filename: string) {
  const baseName = filename.replace(/\.[^/.]+$/, "");
  
  // Match ID: 6 to 14 digits
  const idMatch = baseName.match(/\d{6,14}/);
  const studentId = idMatch ? idMatch[0] : '';

  // Match Name: 2 to 4 Chinese characters (excluding common words)
  let namePart = baseName.replace(/\d{6,14}/, '').replace(/作业|报告|单证|练习|期中|期末/g, '').replace(/[-_()（）\s]/g, '');
  const nameMatch = namePart.match(/[\u4e00-\u9fa5]{2,4}/);
  const studentName = nameMatch ? nameMatch[0] : '';

  return { studentId, studentName };
}

export async function gradeSubmission(
  studentFile: File,
  answerFile: File | null,
  gradingRules: string,
  onStatusChange?: (status: string) => void
): Promise<GradingResult> {
  try {
    const engineType = localStorage.getItem('ai_engine_type') || 'builtin';
    const isCustomEngine = engineType === 'custom';
    let builtinModel = localStorage.getItem('ai_builtin_model') || 'gemini-3.5-flash';
    
    // Auto-correct any legacy or incorrect model names to the latest one
    if (builtinModel === 'gemini-3.1-flash-preview' || builtinModel === 'gemini-3-flash-preview') {
      builtinModel = 'gemini-3.5-flash';
    }

    const promptText = `
你是一名高级外贸单证批改专家。请根据以下标准答案和评分规则，对学生的作业进行详细批改。
你需要提取学生的姓名和学号（如果找不到，请根据文件名推测或留空）。
你需要逐项对比学生的答案与标准答案，指出错误、给出扣分原因和修改建议。

【评分规则】
${gradingRules || '未提供，请按常规逻辑指出错误即可'}

请务必以 JSON 格式输出批改结果，格式如下（不要包含任何 markdown 代码块标记，如 \`\`\`json）：
{
  "studentName": "学生姓名",
  "studentId": "学生学号",
  "totalScore": 85,
  "evaluation": "总体评价与建议",
  "details": [
    {
      "question": "题目或字段名称",
      "studentAnswer": "学生填写的答案",
      "isCorrect": false,
      "score": 0,
      "feedback": "错误分析与修改建议"
    }
  ]
}
`;

    let parts: any[] = [];
    if (isCustomEngine) {
      parts.push({ type: 'text', text: promptText });
    } else {
      parts.push({ text: promptText });
    }

    if (answerFile) {
      if (onStatusChange) onStatusChange(`正在解析标准预设答案: ${answerFile.name}...`);
      const answerParts = await processFileToPart(answerFile, '标准答案', isCustomEngine);
      parts = parts.concat(answerParts);
    } else {
      const emptyText = '\n\n【标准答案】\n未提供，请根据通用外贸单证规范进行批改';
      parts.push(isCustomEngine ? { type: 'text', text: emptyText } : { text: emptyText });
    }

    if (onStatusChange) onStatusChange(`正在提取学生作业内容: ${studentFile.name}...`);
    const studentParts = await processFileToPart(studentFile, '学生作业内容', isCustomEngine);
    parts = parts.concat(studentParts);

    let resultText = '';
    let attempt = 0;
    const maxRetries = 5;

    while (attempt < maxRetries) {
      try {
        if (isCustomEngine) {
          const apiKey = localStorage.getItem('ai_custom_api_key') || '';
          const baseURL = localStorage.getItem('ai_custom_base_url') || 'https://api.deepseek.com/v1';
          const model = localStorage.getItem('ai_custom_model') || 'deepseek-chat';

          if (!apiKey) {
            throw new Error('未配置自定义 API Key，请前往“系统设置”进行配置。');
          }

          if (onStatusChange) {
            onStatusChange(`正在向国内自定义引擎 (${model}) 发送人工智能推理请求 (尝试 ${attempt + 1}/${maxRetries})...`);
          }

          // Ensure baseURL doesn't end with a slash and append the endpoint
          const endpoint = baseURL.endsWith('/') ? `${baseURL}chat/completions` : `${baseURL}/chat/completions`;

          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: 'system', content: '你是一个严格的评分助手，必须只返回合法的 JSON 字符串。' },
                { role: 'user', content: parts }
              ],
              response_format: { type: 'json_object' }
            })
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`API Error: ${response.status} ${errorData.error?.message || response.statusText}`);
          }

          const data = await response.json();
          resultText = data.choices[0]?.message?.content || '{}';
        } else {
          if (onStatusChange) {
            onStatusChange(`正在通过内置引擎安全连接 Google ${builtinModel} 服务器进行深度单证批改 (尝试 ${attempt + 1}/${maxRetries})...`);
          }

          const dynamicAi = getGoogleAIClient();
          const response = await dynamicAi.models.generateContent({
            model: builtinModel,
            contents: { parts },
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  studentName: { type: Type.STRING, description: '学生姓名' },
                  studentId: { type: Type.STRING, description: '学生学号' },
                  totalScore: { type: Type.NUMBER, description: '总得分（百分制）' },
                  evaluation: { type: Type.STRING, description: '总体评价与建议' },
                  details: {
                    type: Type.ARRAY,
                    description: '逐题/逐项批改明细',
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        question: { type: Type.STRING, description: '题目或字段名称' },
                        studentAnswer: { type: Type.STRING, description: '学生填写的答案' },
                        isCorrect: { type: Type.BOOLEAN, description: '是否完全正确' },
                        score: { type: Type.NUMBER, description: '该项得分' },
                        feedback: { type: Type.STRING, description: '错误分析与修改建议' }
                      },
                      required: ['question', 'studentAnswer', 'isCorrect', 'score', 'feedback']
                    }
                  }
                },
                required: ['studentName', 'studentId', 'totalScore', 'evaluation', 'details']
              }
            }
          });
          resultText = response.text || '{}';
        }
        break; // If successful, break the retry loop
      } catch (e: any) {
        attempt++;
        let errMsg = '';
        try {
          if (typeof e === 'object' && e !== null) {
            errMsg = JSON.stringify(e);
          } else {
            errMsg = String(e);
          }
        } catch (_) {
          errMsg = String(e);
        }
        errMsg += ' ' + (e.message || '') + ' ' + (e.status || '') + ' ' + (e.code || '') + ' ' + (e.statusText || '');
        if (e.error) {
          errMsg += ' ' + (e.error.message || '') + ' ' + (e.error.status || '') + ' ' + (e.error.code || '');
        }

        const isRateLimit = errMsg.includes('429') || 
                            errMsg.includes('RESOURCE_EXHAUSTED') || 
                            errMsg.includes('Too Many Requests') || 
                            errMsg.includes('quota') || 
                            errMsg.includes('Limit') ||
                            (e.status === 429) ||
                            (e.code === 429) ||
                            (e.error?.code === 429) ||
                            (e.error?.status === 'RESOURCE_EXHAUSTED');

        if (attempt < maxRetries && isRateLimit) {
          const waitTime = attempt * 12 * 1000; // Linear backoff: 12s, 24s, 36s, 48s
          const msg = `[API 频限/超限自动避让] 第 ${attempt} 次请求重试触发频控。正在静默避让并冷却 ${waitTime / 1000} 秒，请勿刷新页面，系统将在冷却期结束后重连。`;
          console.warn(msg);
          if (onStatusChange) {
            onStatusChange(msg);
          }
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else {
          throw e; // Rethrow if max retries reached or it's not a rate limit error
        }
      }
    }

    // Clean up potential markdown formatting from custom models
    resultText = resultText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(resultText);

    const { studentId: extractedId, studentName: extractedName } = extractStudentInfoFromFilename(studentFile.name);

    return {
      fileName: studentFile.name,
      studentName: extractedName || parsed.studentName || '未知',
      studentId: extractedId || parsed.studentId || '未知',
      totalScore: parsed.totalScore || 0,
      evaluation: parsed.evaluation || '',
      details: parsed.details || [],
    };
  } catch (error: any) {
    console.error(`Error grading ${studentFile.name}:`, error);
    
    let errorMessage = '';
    try {
      if (typeof error === 'object' && error !== null) {
        if (error.message) {
          errorMessage = error.message;
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        } else {
          errorMessage = JSON.stringify(error);
        }
      } else {
        errorMessage = String(error);
      }
    } catch (_) {
      errorMessage = String(error);
    }

    const errStrLow = errorMessage.toLowerCase();
    
    if (errStrLow.includes('429') || errStrLow.includes('resource_exhausted') || errStrLow.includes('too many requests') || errStrLow.includes('limit') || errStrLow.includes('quota')) {
      errorMessage = 'AI 接口请求过于频繁或今日免费额度已耗尽 (429/机能限流)。提示：您可以前往「系统设置」调大「批量批改间隔冷却时间」到 10 秒或 15 秒（可有效规避免费额度高频限制），或在设置中切换使用国内第三方智能大模型渠道以获得高并发不限速的作业批改体验。';
    } else if (errStrLow.includes('api key')) {
      errorMessage = 'API Key 配置错误或未配置。';
    }

    return {
      fileName: studentFile.name,
      studentName: '未知',
      studentId: '未知',
      totalScore: 0,
      evaluation: '',
      details: [],
      error: errorMessage
    };
  }
}
