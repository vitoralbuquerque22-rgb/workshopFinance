import fs from 'fs';
import path from 'path';

const projectRoot = 'c:/Users/Oficinas Master/Desktop/VITOR/financeiroRafa';

function walk(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist' && file !== '.git') {
        walk(path.join(dir, file), fileList);
      }
    } else {
      fileList.push(path.join(dir, file));
    }
  }
  return fileList;
}

const allFiles = walk(projectRoot);

const data = {
  pages: [],
  components: [],
  entities: [],
  functions: [],
  workflows: []
};

allFiles.forEach(f => {
  const relPath = path.relative(projectRoot, f).replace(/\\/g, '/');
  
  if (relPath.startsWith('src/pages/') && relPath.endsWith('.jsx')) {
    const content = fs.readFileSync(f, 'utf8');
    data.pages.push({ path: relPath, content: content });
  } else if (relPath.startsWith('src/components/') && relPath.endsWith('.jsx')) {
    const content = fs.readFileSync(f, 'utf8');
    data.components.push({ path: relPath, content: content });
  } else if (relPath.startsWith('base44/entities/') && relPath.endsWith('.jsonc')) {
    const content = fs.readFileSync(f, 'utf8');
    data.entities.push({ path: relPath, content: content });
  } else if (relPath.startsWith('base44/functions/') && relPath.endsWith('.ts')) {
    const content = fs.readFileSync(f, 'utf8');
    data.functions.push({ path: relPath, content: content });
  } else if (relPath.startsWith('base44/workflows/') && relPath.endsWith('.jsonc')) {
    const content = fs.readFileSync(f, 'utf8');
    data.workflows.push({ path: relPath, content: content });
  }
});

fs.writeFileSync('C:\\Users\\Oficinas Master\\.gemini\\antigravity-ide\\brain\\3aa0eb5e-912e-47cc-89cf-a49f9a641dca\\scratch\\dump.json', JSON.stringify(data, null, 2));
console.log('Dump completed. Length: ' + JSON.stringify(data).length);
