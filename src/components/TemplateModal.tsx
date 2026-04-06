import React, { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2, Check, FileText } from 'lucide-react';
import { GradingTemplate, getTemplates, addTemplate, updateTemplate, deleteTemplate } from '../lib/templateManager';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: GradingTemplate) => void;
}

export function TemplateModal({ isOpen, onClose, onSelect }: Props) {
  const [templates, setTemplates] = useState<GradingTemplate[]>([]);
  const [view, setView] = useState<'list' | 'edit'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTemplates(getTemplates());
      setView('list');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!title.trim() || !content.trim()) return;
    if (editingId) {
      updateTemplate(editingId, title, content);
    } else {
      addTemplate(title, content);
    }
    setTemplates(getTemplates());
    setView('list');
  };

  const handleEdit = (t: GradingTemplate) => {
    setEditingId(t.id);
    setTitle(t.title);
    setContent(t.content);
    setView('edit');
  };

  const handleCreateNew = () => {
    setEditingId(null);
    setTitle('');
    setContent('');
    setView('edit');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('确定要删除这个模板吗？')) {
      deleteTemplate(id);
      setTemplates(getTemplates());
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-semibold text-slate-800">
            {view === 'list' ? '选择评分模板' : (editingId ? '编辑模板' : '新建模板')}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {view === 'list' ? (
            <div className="space-y-4">
              <button
                onClick={handleCreateNew}
                className="w-full py-4 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 flex items-center justify-center gap-2 transition-colors"
              >
                <Plus size={20} />
                新建评分模板
              </button>

              {templates.length === 0 ? (
                <p className="text-center text-slate-400 py-8">暂无历史模板，请先新建</p>
              ) : (
                <div className="grid gap-3">
                  {templates.map(t => (
                    <div key={t.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/50 transition-colors group">
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => { onSelect(t); onClose(); }}
                      >
                        <h3 className="font-medium text-slate-800 flex items-center gap-2">
                          <FileText size={16} className="text-blue-500" />
                          {t.title}
                        </h3>
                        <p className="text-sm text-slate-500 mt-1 line-clamp-1">{t.content}</p>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); handleEdit(t); }} className="p-2 text-slate-400 hover:text-blue-600 rounded-md hover:bg-blue-100 transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }} className="p-2 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-100 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">模板名称</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="例如：2025届国贸专业标准评分模板"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">评分规则与要求</label>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none h-64 resize-none"
                  placeholder="请输入详细的评分规则、扣分标准等..."
                />
              </div>
            </div>
          )}
        </div>

        {view === 'edit' && (
          <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-xl">
            <button
              onClick={() => setView('list')}
              className="px-6 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={!title.trim() || !content.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Check size={18} />
              保存
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
