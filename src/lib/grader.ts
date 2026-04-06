import { GoogleGenAI, Type } from '@google/genai';
import OpenAI from 'openai';
import mammoth from 'mammoth';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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

export async function gradeSubmission(
  studentFile: File,
  answerFile: File | null,
  gradingRules: string
): Promise<GradingResult> {
  try {
    const engineType = localStorage.getItem('ai_engine_type') || 'builtin';
    const isCustomEngine = engineType === 'custom';

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
      const answerParts = await processFileToPart(answerFile, '标准答案', isCustomEngine);
      parts = parts.concat(answerParts);
    } else {
      const emptyText = '\n\n【标准答案】\n未提供，请根据通用外贸单证规范进行批改';
      parts.push(isCustomEngine ? { type: 'text', text: emptyText } : { text: emptyText });
    }

    const studentParts = await processFileToPart(studentFile, '学生作业内容', isCustomEngine);
    parts = parts.concat(studentParts);

    let resultText = '';

    if (isCustomEngine) {
      const apiKey = localStorage.getItem('ai_custom_api_key') || '';
      const baseURL = localStorage.getItem('ai_custom_base_url') || 'https://api.deepseek.com/v1';
      const model = localStorage.getItem('ai_custom_model') || 'deepseek-chat';

      if (!apiKey) {
        throw new Error('未配置自定义 API Key，请前往“系统设置”进行配置。');
      }

      const openai = new OpenAI({
        apiKey,
        baseURL,
        dangerouslyAllowBrowser: true
      });

      const response = await openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: '你是一个严格的评分助手，必须只返回合法的 JSON 字符串。' },
          { role: 'user', content: parts }
        ],
        response_format: { type: 'json_object' }
      });

      resultText = response.choices[0]?.message?.content || '{}';
    } else {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
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

    // Clean up potential markdown formatting from custom models
    resultText = resultText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(resultText);

    return {
      fileName: studentFile.name,
      studentName: parsed.studentName || '未知',
      studentId: parsed.studentId || '未知',
      totalScore: parsed.totalScore || 0,
      evaluation: parsed.evaluation || '',
      details: parsed.details || [],
    };
  } catch (error: any) {
    console.error(`Error grading ${studentFile.name}:`, error);
    
    let errorMessage = error.message || '批改过程中发生未知错误';
    if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
      errorMessage = 'AI 接口请求过于频繁或免费额度已耗尽 (429)。请稍后重试。';
    } else if (errorMessage.includes('API Key')) {
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
