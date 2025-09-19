#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Iniciando processo de deploy...');

try {
  // 1. Fazer build
  console.log('📦 Executando build...');
  execSync('npm run build', { stdio: 'inherit' });

  // 2. Verificar se build foi bem sucedido
  if (!fs.existsSync('./dist')) {
    throw new Error('Build falhou - pasta dist não encontrada');
  }

  console.log('✅ Build concluído com sucesso');

  // 3. Salvar branch atual
  const currentBranch = execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
  console.log(`📋 Branch atual: ${currentBranch}`);

  // 4. Verificar se há mudanças não commitadas na branch principal
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf-8' });
    if (status.trim()) {
      console.log('⚠️  Há alterações não commitadas. Fazendo commit...');
      execSync('git add -A', { stdio: 'inherit' });
      execSync(`git commit -m "chore: auto-commit before deploy - ${new Date().toISOString()}"`, { stdio: 'inherit' });
      execSync('git push origin ' + currentBranch, { stdio: 'inherit' });
    }
  } catch (e) {
    console.log('ℹ️  Nenhuma alteração para commitar na branch principal');
  }

  // 5. Mudar para branch gh-pages (criar se não existir)
  console.log('🔄 Mudando para branch gh-pages...');
  try {
    execSync('git checkout gh-pages', { stdio: 'pipe' });
  } catch (e) {
    console.log('🆕 Criando branch gh-pages...');
    execSync('git checkout --orphan gh-pages', { stdio: 'inherit' });
  }

  // 6. Limpar tudo exceto dist e .git
  console.log('🧹 Limpando arquivos antigos...');
  const files = fs.readdirSync('./');
  for (const file of files) {
    if (file !== 'dist' && file !== '.git' && file !== '.gitignore') {
      try {
        execSync(`git rm -rf --ignore-unmatch "${file}"`, { stdio: 'pipe' });
      } catch (_) {
        // not tracked; ignore
      }
      try {
        const stat = fs.statSync(file);
        if (stat.isDirectory()) {
          fs.rmSync(file, { recursive: true, force: true });
        } else {
          fs.unlinkSync(file);
        }
      } catch (_) {
        // already gone
      }
    }
  }

  // 7. Copiar conteúdo do build para o root
  console.log('📂 Copiando arquivos do build...');
  const distFiles = fs.readdirSync('./dist');
  for (const file of distFiles) {
    const src = path.join('./dist', file);
    const dest = path.join('./', file);
    
    if (fs.statSync(src).isDirectory()) {
      fs.cpSync(src, dest, { recursive: true });
    } else {
      // Use explicit UTF-8 encoding for text files to prevent encoding issues
      if (file.endsWith('.html') || file.endsWith('.js') || file.endsWith('.css') || file.endsWith('.json') || file.endsWith('.svg') || file.endsWith('.xml')) {
        const content = fs.readFileSync(src, 'utf8');
        fs.writeFileSync(dest, content, 'utf8');
      } else {
        fs.copyFileSync(src, dest);
      }
    }
  }

  // 8. Adicionar arquivo .nojekyll para GitHub Pages
  fs.writeFileSync('./.nojekyll', '');

  // 9. Commit e push
  console.log('💾 Fazendo commit do deploy...');
  execSync('git add .', { stdio: 'inherit' });
  
  const commitMsg = `deploy: ${new Date().toISOString()} - Audio system fixes and improvements`;
  let hasChanges = false;
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf-8' }).trim();
    hasChanges = status.length > 0;
  } catch (_) {}

  if (hasChanges) {
    try {
      execSync(`git commit -m "${commitMsg}"`, { stdio: 'inherit' });
    } catch (e) {
      console.log('ℹ️  Nenhuma alteração para commitar em gh-pages (commit pulado).');
    }
  } else {
    console.log('ℹ️  Nenhuma alteração detectada em gh-pages. Pulando commit.');
  }
  
  console.log('🌍 Fazendo push para GitHub Pages...');
  try {
    execSync('git push origin gh-pages -f', { stdio: 'inherit' });
  } catch (e) {
    console.log('⚠️  Push falhou ou está atualizado. Prosseguindo.');
  }

  // 10. Voltar para branch original
  console.log(`🔙 Voltando para branch ${currentBranch}...`);
  execSync(`git checkout ${currentBranch}`, { stdio: 'inherit' });

  // 11. Limpar pasta dist
  console.log('🧹 Limpando pasta dist...');
  fs.rmSync('./dist', { recursive: true, force: true });

  console.log('🎉 Deploy concluído com sucesso!');
  console.log('🔗 Site disponível em: https://tauanribeiro.github.io/sitio-do-pica-pau-ia/');

} catch (error) {
  console.error('❌ Erro durante deploy:', error.message);
  // Attempt to switch back gracefully if we're stuck on gh-pages
  try {
    const cur = execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
    if (cur === 'gh-pages') {
      // prefer main if exists, otherwise fallback to master
      let hasMain = false;
      try { execSync('git rev-parse --verify main', { stdio: 'pipe' }); hasMain = true; } catch {}
      const fallback = hasMain ? 'main' : 'master';
      execSync(`git checkout ${fallback}`, { stdio: 'inherit' });
    }
  } catch {}
  
  process.exit(1);
}
