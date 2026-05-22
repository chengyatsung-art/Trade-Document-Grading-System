export type TaskStatus = 'idle' | 'running' | 'completed' | 'error';

export interface GradingTask {
  id: string;
  name: string;
  date: string;
  status: TaskStatus;
  totalFiles: number;
  processedFiles: number;
  failedFiles: number;
}

export interface StudentResult {
  studentId: string;
  studentName: string;
  fileName: string;
  score: number;
  status: 'success' | 'failed';
  issues: number;
}

// Support directory selection attributes in elements safely
declare module 'react' {
  interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
    webkitdirectory?: string;
    directory?: string;
  }
}

