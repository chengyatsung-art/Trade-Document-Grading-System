export const systemDocsMarkdown = `
# 外贸单证批量批改程序 - 纯前端架构与设计文档

## 1. 系统架构演进

本系统已从传统的“前后端分离”架构升级为**纯前端 (Serverless) 架构**。所有文件解析、数据处理和 AI 批改均直接在用户的浏览器中完成，无需部署任何后端服务器。

### 1.1 核心优势
- **零部署成本**：无需配置 Python 环境或后端服务器，开箱即用。
- **数据隐私安全**：学生作业文件不会被上传到任何第三方服务器，仅在本地浏览器和 AI 引擎之间流转。
- **极致性能**：省去了文件上传和下载的网络传输时间。

### 1.2 核心技术栈
- **前端框架**：React 18 + Vite + Tailwind CSS
- **文档解析**：
  - \`mammoth\`: 用于在浏览器中解析 \`.docx\` 文件的纯文本。
  - \`FileReader API\`: 用于读取 \`.txt\`, \`.json\` 以及旧版 \`.doc\` 的二进制文本。
- **双 AI 批改引擎**：
  - **内置引擎**：基于 \`@google/genai\` 直接调用 Gemini 3.1 Pro / Gemini 3.5 Flash 模型，支持多模态视觉能力（直接处理 PDF 和图片）。
  - **自定义引擎**：基于原生 \`fetch\` API 实现的 OpenAI 兼容 REST 接口，支持接入 DeepSeek 等第三方大模型（彻底移除了 \`openai\` 官方 SDK 以解决浏览器环境兼容性报错问题）。
- **本地持久化**：
  - \`localStorage\`: 用于存储用户设置（API Key、模型选择）和真实的批改历史记录。
- **报告生成**：
  - \`jszip\`: 在浏览器内存中打包生成 ZIP 压缩包。
  - \`file-saver\`: 触发本地文件下载。

---

## 2. 核心工作流

1. **本地文件读取**：用户通过 \`<input webkitdirectory>\` 选择本地文件夹，浏览器获取文件句柄。
2. **格式预处理**：
   - \`.docx\` -> 使用 mammoth 提取文本。
   - \`.doc\` -> 使用自定义二进制解码器提取中英文文本。
   - \`.pdf\` / 图片 -> 转换为 Base64 格式。
3. **学生信息精准提取**：
   - 使用正则表达式从文件名中提取学号（6-14位数字）和姓名（2-4个中文字符，自动过滤“作业”等干扰词）。
4. **AI 批改调度**：
   - 根据用户设置选择“内置引擎”或“自定义引擎”。
   - 组装包含“标准答案”、“评分规则”和“学生作业”的 Prompt。
   - 串行处理文件，并在文件之间加入 **5秒冷却延迟**，避免触发 API 的 429 频率限制。
   - 强制开启 \`responseSchema\` (JSON Mode) 或 \`response_format: { type: 'json_object' }\`，确保 AI 返回结构化的批改数据。
5. **数据合并与持久化**：
   - 将正则提取的学生信息与 AI 返回的 JSON 数据进行合并（正则提取优先级更高）。
   - 批改完成后，将任务统计和完整结果存入 \`localStorage\` 的 \`grading_history\` 中。
6. **报告生成与导出**：
   - 将批改结果汇总为 CSV 表格。
   - 为每个学生生成详细的 Markdown 批改报告（文件名与学生原文件名保持一致）。
   - 将原始 JSON 数据、CSV 和 Markdown 打包为 ZIP 并触发下载。

---

## 3. 数据结构设计

### 3.1 评分明细 (GradingDetail)
\`\`\`typescript
interface GradingDetail {
  question: string;        // 题目或字段名称
  studentAnswer: string;   // 学生填写的答案
  isCorrect: boolean;      // 是否完全正确
  score: number;           // 该项得分
  feedback: string;        // 错误分析与修改建议
}
\`\`\`

### 3.2 批改结果 (GradingResult)
\`\`\`typescript
interface GradingResult {
  fileName: string;        // 原始文件名
  studentName: string;     // 提取的学生姓名
  studentId: string;       // 提取的学号
  totalScore: number;      // 总得分
  evaluation: string;      // 总体评价
  details: GradingDetail[];// 逐题批改明细
  error?: string;          // 异常信息（如果批改失败）
}
\`\`\`

### 3.3 本地存储 (LocalStorage)
- \`ai_engine_type\`: 当前使用的引擎 (\`builtin\` | \`custom\`)
- \`ai_builtin_model\`: 内置模型代号 (\`gemini-3.1-pro-preview\` | \`gemini-3.5-flash\`)
- \`ai_custom_api_key\`: 自定义引擎 API Key
- \`grading_history\`: 历史批改任务数组，包含任务 ID、时间、文件数、成功率及完整的 \`GradingResult[]\`。

---

## 4. 异常处理与容错机制

1. **API 频率限制 (Rate Limiting)**：在批量处理多个文件时，通过 \`sleep(5000)\` 强制加入冷却时间，有效防止免费 API 额度耗尽或触发 429 报错。
2. **学生信息提取兜底**：AI 在长文本中提取姓名学号容易产生幻觉。系统采用“文件名正则提取优先，AI 提取兜底”的策略，大幅提升了身份识别的准确率。
3. **自定义引擎浏览器兼容性**：第三方 SDK（如 \`openai\`）在浏览器环境中常会重写全局 \`fetch\` 导致 \`Cannot set property fetch of #<Window> which has only a getter\` 报错。系统改用原生 \`fetch\` API 构建请求，彻底消除了该隐患。
4. **旧版 .doc 乱码问题**：由于 \`.doc\` 是闭源二进制格式，纯前端解析会产生乱码。系统通过正则过滤保留有效的中英文字符，并提示大模型“结合上下文理解”。
5. **大文件内存溢出**：采用 \`for\` 循环串行处理文件，避免同时将大量 PDF 转换为 Base64 导致浏览器内存溢出 (OOM)。

---

## 5. 未来演进方向

- **本地大模型支持**：接入 WebGPU 和 WebLLM，实现在浏览器中运行本地开源模型（如 Qwen），实现完全断网环境下的批改。
- **富文本报告导出**：引入 \`docx\` 库，在前端直接生成排版精美的 Word 批改报告，替代目前的 Markdown 格式。
- **人工复核工作台**：开发专门的 UI 界面，左右分栏展示学生原卷和 AI 批改结果，允许教师手动微调分数和评语后再导出。
`;
