#!/usr/bin/env node
'use strict';

/**
 * recover-cline-code.js — khôi phục mã nguồn từ transcript phiên làm việc của Cline.
 *
 * Transcript Cline lưu mọi lần model ghi/sửa file, nên có thể dựng lại source code
 * ngay cả khi thư mục dự án trên máy đã bị xoá.
 *
 * Cách dùng:
 *   node tools/recover-cline-code.js <đường-dẫn-*.messages.json> [thư-mục-xuất]
 *
 * Ví dụ (Windows PowerShell):
 *   node tools\recover-cline-code.js "$env:USERPROFILE\.cline\data\sessions\<id>\<id>.messages.json" .\recovered
 *
 * Ví dụ (macOS/Linux):
 *   node tools/recover-cline-code.js ~/.cline/data/sessions/<id>/<id>.messages.json ./recovered
 *
 * Script hỗ trợ các tool: write_to_file, replace_in_file, edit_file (khối SEARCH/REPLACE),
 * new_file/insert_content (nếu có). Với apply_patch, dùng "Restore checkpoint" trong Cline.
 */

const fs = require('node:fs');
const path = require('node:path');

const inputFile = process.argv[2];
const outDirArg = process.argv[3] || 'recovered';

if (!inputFile) {
  console.error('Thiếu đường dẫn transcript. Ví dụ:');
  console.error('  node tools/recover-cline-code.js ~/.cline/data/sessions/<id>/<id>.messages.json ./recovered');
  process.exit(1);
}

if (!fs.existsSync(inputFile)) {
  console.error(`Không tìm thấy tệp: ${inputFile}`);
  process.exit(1);
}

const parsed = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
const messages = Array.isArray(parsed) ? parsed : parsed.messages || [];

const files = new Map(); // path -> nội dung mới nhất
const stats = { write: 0, replace: 0, skipped: 0, failed: 0 };
const skippedTools = new Map();

/** Áp các khối <<<<<<< SEARCH / ======= / >>>>>>> REPLACE vào nội dung hiện tại. */
function applySearchReplace(original, diff) {
  const blocks = [];
  const regex = /<<<<<<< SEARCH\r?\n([\s\S]*?)\r?\n?=======\r?\n([\s\S]*?)\r?\n?>>>>>>> REPLACE/g;
  let match;
  while ((match = regex.exec(diff)) !== null) {
    blocks.push({ search: match[1], replace: match[2] });
  }
  if (!blocks.length) return original;

  let content = original;
  for (const block of blocks) {
    if (content.includes(block.search)) {
      content = content.replace(block.search, block.replace);
    } else {
      stats.failed += 1;
      console.warn('  ! Không khớp khối SEARCH, bỏ qua một thay thế.');
    }
  }
  return content;
}

function recordWrite(filePath, content) {
  files.set(filePath, content);
  stats.write += 1;
}

function recordEdit(filePath, diff) {
  let current = files.has(filePath) ? files.get(filePath) : null;
  if (current === null) {
    try {
      current = fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      current = null;
    }
  }
  if (current === null) {
    console.warn(`  ! Bỏ qua sửa đổi cho ${filePath} (không có nội dung gốc).`);
    stats.skipped += 1;
    return;
  }
  files.set(filePath, applySearchReplace(current, diff));
  stats.replace += 1;
}

for (const message of messages) {
  const blocks = Array.isArray(message && message.content) ? message.content : [];
  for (const block of blocks) {
    if (!block || block.type !== 'tool_use') continue;
    const name = block.name || '';
    const input = block.input || {};
    const filePath = input.path || input.file_path || input.filePath || input.fileName;

    if (name === 'write_to_file' || name === 'new_file') {
      if (!filePath) continue;
      recordWrite(filePath, typeof input.content === 'string' ? input.content : '');
      continue;
    }

    if (name === 'replace_in_file' || name === 'edit_file' || name === 'insert_content') {
      if (!filePath) continue;
      const diff = input.diff || input.patch || input.content || '';
      recordEdit(filePath, diff);
      continue;
    }

    if (['apply_patch', 'apply_diff', 'multi_replace_in_file'].includes(name)) {
      skippedTools.set(name, (skippedTools.get(name) || 0) + 1);
      stats.skipped += 1;
    }
  }
}

if (!files.size) {
  console.error('Không tìm thấy lần ghi tệp nào (write_to_file/replace_in_file) trong transcript này.');
  if (skippedTools.size) {
    console.error('Các tool chưa hỗ trợ:', [...skippedTools.entries()].map(([k, v]) => `${k} ×${v}`).join(', '));
  }
  process.exit(2);
}

/** Xác định thư mục gốc chung để tái tạo đúng cấu trúc thư mục. */
const allPaths = [...files.keys()];
const absolutePaths = allPaths.filter((item) => path.isAbsolute(item));
let baseDir = null;
if (absolutePaths.length) {
  const parts = absolutePaths.map((item) => path.dirname(item).split(path.sep));
  let common = parts[0];
  for (const current of parts.slice(1)) {
    let index = 0;
    while (index < common.length && index < current.length && common[index] === current[index]) index += 1;
    common = common.slice(0, index);
  }
  baseDir = common.join(path.sep) || path.sep;
}

const outDir = path.resolve(outDirArg);
let written = 0;

for (const [originalPath, content] of files.entries()) {
  let relative = originalPath;
  if (baseDir && path.isAbsolute(originalPath)) {
    relative = path.relative(baseDir, originalPath);
  }
  relative = relative.replace(/^([A-Za-z]):[\\/]/, ''); // bỏ ổ đĩa Windows nếu còn
  if (relative.startsWith('..')) relative = path.basename(originalPath);

  const target = path.join(outDir, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
  written += 1;
  console.log(`  + ${relative}`);
}

console.log('');
console.log(`Đã khôi phục ${written} tệp vào: ${outDir}`);
console.log(`Thao tác ghi file: ${stats.write} · sửa file: ${stats.replace} · bỏ qua: ${stats.skipped}`);
if (skippedTools.size) {
  console.log('Lưu ý: transcript có dùng tool chưa hỗ trợ:');
  for (const [tool, count] of skippedTools.entries()) console.log(`  - ${tool} ×${count}`);
  console.log('Với các phần đó, hãy dùng "Restore checkpoint" trong Cline hoặc xem lại hội thoại.');
}
