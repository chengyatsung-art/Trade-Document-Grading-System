import React from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { systemDocsMarkdown } from '../docs';

export function SystemDocs() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-10">
        <div className="prose prose-slate prose-blue max-w-none">
          <Markdown remarkPlugins={[remarkGfm]}>
            {systemDocsMarkdown}
          </Markdown>
        </div>
      </div>
    </div>
  );
}
