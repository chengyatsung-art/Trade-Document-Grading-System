export interface GradingTemplate {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
}

const STORAGE_KEY = 'grading_templates';

export function getTemplates(): GradingTemplate[] {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

export function saveTemplates(templates: GradingTemplate[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

export function addTemplate(title: string, content: string): GradingTemplate {
  const templates = getTemplates();
  const newTemplate: GradingTemplate = {
    id: Date.now().toString(),
    title,
    content,
    updatedAt: Date.now(),
  };
  templates.push(newTemplate);
  saveTemplates(templates);
  return newTemplate;
}

export function updateTemplate(id: string, title: string, content: string): GradingTemplate | null {
  const templates = getTemplates();
  const index = templates.findIndex(t => t.id === id);
  if (index === -1) return null;
  templates[index] = { ...templates[index], title, content, updatedAt: Date.now() };
  saveTemplates(templates);
  return templates[index];
}

export function deleteTemplate(id: string) {
  const templates = getTemplates();
  const filtered = templates.filter(t => t.id !== id);
  saveTemplates(filtered);
}
