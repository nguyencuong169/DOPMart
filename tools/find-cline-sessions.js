#!/usr/bin/env node
'use strict';

/**
 * find-cline-sessions.js — rà toàn bộ lịch sử generate của Cline để tìm phiên
 * có chứa code bạn cần (ví dụ DOP Mart).
 *
 * Cách dùng:
 *   node tools/find-cline-sessions.js                 # tự dò các thư mục mặc định
 *   node tools/find-cline-sessions.js <thư-mục-1> ... # chỉ định thư mục cần rà
 *
 * Sau khi tìm ra tệp transcript phù hợp, dựng lại code bằng:
 *   node tools/recover-cline-code.js "<đường-dẫn-transcript>" ./recovered
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const CANDIDATE_NAMES = new Set(['ui_messages.json', 'api_conversation_history.json']);
const isTranscriptName = (name) => CANDIDATE_NAMES.has(name) || name.endsWith('.messages.json');

function defaultRoots() {
  const home = os.homedir();
  const appData = process.env.APPDATA || '';
  const list = [
    path.join(home, '.cline', 'data', 'sessions'),
    path.join(home, '.config', 'Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'tasks'),
    path.join(home, '.config', 'Code', 'User', 'globalStorage', 'cline.cline', 'tasks'),
    path.join(home, 'Library', 'Application Support', 'Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'tasks'),
    path.join(home, 'Library', 'Application Support', 'Cursor', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'tasks'),
  ];
  if (appData) {
    list.push(path.join(appData, 'Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'tasks'));
    list.push(path.join(appData, 'Code', 'User', 'globalStorage', 'cline.cline', 'tasks'));
    list.push(path.join(appData, 'Cursor', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'tasks'));
  }
  return list;
}

function walk(dir, out) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (error) {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
    } else if (entry.isFile() && isTranscriptName(entry.name)) {
      out.push(full);
    }
  }
}

const roots = process.argv.slice(2).length ? process.argv.slice(2) : defaultRoots();
const transcripts = [];
for (const root of roots) {
  if (!fs.existsSync(root)) continue;
  walk(path.resolve(root), transcripts);
}

if (!transcripts.length) {
  console.log('Không tìm thấy transcript Cline nào. Đã dò:');
  for (const root of roots) console.log(`  - ${root}`);
  console.log('\nHãy chỉ định đúng thư mục, ví dụ:');
  console.log('  node tools/find-cline-sessions.js "%USERPROFILE%\\.cline\\data\\sessions"');
  process.exit(1);
}

const rows = [];
for (const file of transcripts) {
  let content;
  let stat;
  try {
    stat = fs.statSync(file);
    if (stat.size > 100 * 1024 * 1024) continue;
    content = fs.readFileSync(file, 'utf8');
  } catch (error) {
    continue;
  }

  const count = (pattern) => (content.match(pattern) || []).length;
  const writes = count(/\\?"write_to_file\\?"/g);
  const edits = count(/\\?"replace_in_file\\?"|\\?"edit_file\\?"/g);
  const patches = count(/\\?"apply_patch\\?"/g);
  const dopMentions = count(/dop\s?mart|dopmart/gi);

  const seen = new Set();
  for (const match of content.matchAll(/\\?"path\\?"\s*:\s*\\?"([^"\\]+)\\?"/g)) {
    const value = match[1];
    if (!/\.(js|jsx|ts|tsx|html|css|json|md|vue|svelte|php|py)$/i.test(value)) continue;
    seen.add(value);
    if (seen.size >= 60) break;
  }

  if (!writes && !edits && !patches) continue;

  rows.push({
    file,
    writes,
    edits,
    patches,
    dopMentions,
    files: [...seen],
    updated: stat.mtime,
    score: dopMentions * 3 + writes * 2 + edits,
  });
}

rows.sort((a, b) => b.score - a.score);

if (!rows.length) {
  console.log(`Đã rà ${transcripts.length} tệp nhưng không thấy lần ghi file nào.`);
  process.exit(2);
}

const stamp = (date) =>
  new Date(date).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });

console.log(`Đã rà ${transcripts.length} tệp transcript, ${rows.length} phiên có ghi file.\n`);

rows.slice(0, 15).forEach((row, index) => {
  console.log(`[${index + 1}] ${row.file}`);
  console.log(
    `    ghi file: ${row.writes} · sửa file: ${row.edits} · apply_patch: ${row.patches} · nhắc "DOP": ${row.dopMentions} · cập nhật: ${stamp(row.updated)}`,
  );
  if (row.files.length) {
    const sample = row.files
      .slice(0, 8)
      .map((item) => path.basename(item))
      .join(', ');
    console.log(`    tệp đã ghi (${row.files.length}): ${sample}${row.files.length > 8 ? ', …' : ''}`);
  }
  console.log('');
});

const best = rows[0];
console.log('Phiên khả nghi nhất (ưu tiên nhắc tới DOP Mart):');
console.log(`  node tools/recover-cline-code.js "${best.file}" ./recovered`);
