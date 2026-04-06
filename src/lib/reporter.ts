import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { GradingResult } from './grader';

export async function generateAndDownloadReports(results: GradingResult[]) {
  const zip = new JSZip();

  // 1. Generate Summary CSV
  let csvContent = '文件名,学生姓名,学号,总分,状态,总体评价\n';
  results.forEach(r => {
    const status = r.error ? '失败' : '成功';
    const evalText = r.evaluation.replace(/"/g, '""'); // escape quotes for CSV
    csvContent += `"${r.fileName}","${r.studentName}","${r.studentId}",${r.totalScore},"${status}","${evalText}"\n`;
  });
  zip.file('班级总成绩汇总表.csv', new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8' })); // Add BOM for Excel

  // 2. Generate Individual Reports (Markdown)
  const reportsFolder = zip.folder('个人批改报告');
  if (reportsFolder) {
    results.forEach(r => {
      if (r.error) {
        reportsFolder.file(`${r.fileName}_批改失败.txt`, `批改失败原因: ${r.error}`);
        return;
      }

      let mdContent = `# 外贸单证批改报告\n\n`;
      mdContent += `**学生姓名**: ${r.studentName}\n`;
      mdContent += `**学号**: ${r.studentId}\n`;
      mdContent += `**原文件名**: ${r.fileName}\n`;
      mdContent += `**总得分**: ${r.totalScore} 分\n\n`;
      
      mdContent += `## 总体评价\n${r.evaluation}\n\n`;
      
      mdContent += `## 逐项批改明细\n\n`;
      r.details.forEach((d, i) => {
        mdContent += `### ${i + 1}. ${d.question}\n`;
        mdContent += `- **学生答案**: ${d.studentAnswer}\n`;
        mdContent += `- **得分**: ${d.score} 分 (${d.isCorrect ? '正确' : '有误'})\n`;
        if (!d.isCorrect) {
          mdContent += `- **教师点评**: ${d.feedback}\n`;
        }
        mdContent += `\n`;
      });

      reportsFolder.file(`${r.studentName}_${r.studentId}_批改报告.md`, mdContent);
    });
  }

  // 3. Generate JSON Data Backup
  const dataFolder = zip.folder('结构化数据备份');
  if (dataFolder) {
    results.forEach(r => {
      dataFolder.file(`${r.fileName}.json`, JSON.stringify(r, null, 2));
    });
  }

  // Generate and download ZIP
  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, '外贸单证批改结果.zip');
}
