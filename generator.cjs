const fs = require('fs');
const path = require('path');

const projectRoot = 'c:/Users/Oficinas Master/Desktop/VITOR/financeiroRafa';
const docsDir = path.join(projectRoot, 'docs');
if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir);

const dump = JSON.parse(fs.readFileSync('C:\\Users\\Oficinas Master\\.gemini\\antigravity-ide\\brain\\3aa0eb5e-912e-47cc-89cf-a49f9a641dca\\scratch\\dump.json', 'utf8'));

// Helper function for safe stringifying
const safeStr = (v) => v ? v.toString() : '';

// 1. INVENTÁRIO
function getInventory() {
    let md = '# 1. INVENTÁRIO DOS ARQUIVOS\n\n| Arquivo | Caminho | Tipo |\n| --- | --- | --- |\n';
    dump.pages.forEach(p => md += `| ${path.basename(p.path)} | ${p.path} | frontend-page |\n`);
    dump.components.forEach(c => md += `| ${path.basename(c.path)} | ${c.path} | frontend-component |\n`);
    dump.entities.forEach(e => md += `| ${path.basename(e.path)} | ${e.path} | database-entity |\n`);
    dump.functions.forEach(f => md += `| ${path.basename(f.path)} | ${f.path} | backend-function |\n`);
    dump.workflows.forEach(w => md += `| ${path.basename(w.path)} | ${w.path} | automation-workflow |\n`);
    return md;
}

// 4. ESTRUTURA
function getStructure() {
    return `# 4. ESTRUTURA DO PROJETO\n\n\`\`\`text\nPROJETO\n├── base44\n│   ├── agents\n│   ├── entities\n│   ├── functions\n│   └── workflows\n├── docs\n├── src\n│   ├── api\n│   ├── components\n│   ├── hooks\n│   ├── lib\n│   ├── pages\n│   └── utils\n\`\`\`\n\n`;
}

// 5. STACK
function getStack() {
    const pkg = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
    let md = '# 5. STACK TECNOLÓGICA\n\n| Tecnologia | Versão | Onde utilizada | Finalidade | Dependência Base44 |\n| --- | --- | --- | --- | --- |\n';
    md += `| React | ${pkg.dependencies.react} | Frontend | Framework Principal | Não |\n`;
    md += `| Vite | ${pkg.devDependencies.vite} | Frontend | Bundler | Não |\n`;
    md += `| TailwindCSS | ${pkg.devDependencies.tailwindcss} | Frontend | Estilização | Não |\n`;
    md += `| Base44 SDK | ${pkg.dependencies['@base44/sdk']} | Fullstack | Integração com Backend | SIM |\n`;
    md += `| Radix UI | Várias | Frontend | Componentes de UI | Não |\n`;
    return md;
}

// 7. DATABASE
function getDatabase() {
    let md = '# 7. BANCO DE DADOS\n\n';
    dump.entities.forEach(e => {
        const schema = JSON.parse(e.content);
        md += `### ENTIDADE: ${schema.name}\n\n**Arquivo:** \`${e.path}\`\n\n| Campo | Tipo | Obrigatório | Default | Enum | Relacionamento | Origem |\n| --- | --- | --- | --- | --- | --- | --- |\n`;
        if (schema.properties) {
            for (const [key, val] of Object.entries(schema.properties)) {
                const req = schema.required && schema.required.includes(key) ? 'Sim' : 'Não';
                const def = val.default !== undefined ? val.default : '-';
                const enm = val.enum ? val.enum.join(', ') : '-';
                const rel = val.format === 'uuid' || key.endsWith('_id') ? 'Inferido' : '-';
                md += `| ${key} | ${val.type} | ${req} | ${def} | ${enm} | ${rel} | schema |\n`;
            }
        }
        md += '\n';
    });
    return md;
}

// 6. PÁGINAS E ROTAS
function getPages() {
    let md = '# 6. MAPA DE PÁGINAS E ROTAS\n\n';
    dump.pages.forEach(p => {
        md += `### Página\n**Nome:** ${path.basename(p.path, '.jsx')}\n**Arquivo:** \`${p.path}\`\n**APIs chamadas (inferido):**\n`;
        const usesBase44 = p.content.includes('@base44/sdk');
        md += usesBase44 ? '- Utiliza SDK Base44\n\n' : '- Sem integrações diretas do SDK\n\n';
    });
    return md;
}

// 9. FUNÇÕES
function getFunctions() {
    let md = '# 9. FUNÇÕES\n\n';
    dump.functions.forEach(f => {
        md += `### FUNÇÃO\n**Nome:** ${path.basename(path.dirname(f.path))}\n**Arquivo:** \`${f.path}\`\n**Responsabilidade:** Manipulador backend (Serverless/Base44)\n**Dependências Base44:** SIM (Executa na infra Base44)\n\n`;
    });
    return md;
}

// 16. AUTOMAÇÕES
function getWorkflows() {
    let md = '# 16. AUTOMAÇÕES\n\n';
    dump.workflows.forEach(w => {
        const schema = JSON.parse(w.content);
        md += `### AUTOMATION: ${schema.name}\n**Arquivo:** \`${w.path}\`\n**Trigger:** ${schema.trigger}\n**Dependência Base44:** SIM\n\n`;
    });
    return md;
}

// 18. DEPENDÊNCIAS BASE44
function getBase44Deps() {
    return `# 18. DEPENDÊNCIAS BASE44\n\nEsta seção é CRÍTICA. O sistema é fortemente dependente do ecossistema Base44.\n\n| Recurso Base44 | Onde utilizado | Finalidade | Impacto | Substituição necessária |\n| --- | --- | --- | --- | --- |\n| \`@base44/sdk\` | Frontend (Lib, Hooks, Pages) | Acesso a dados e auth | CRÍTICA | Implementar cliente HTTP próprio |\n| \`base44/entities\` | Backend | Definição de banco de dados e ORM | CRÍTICA | Migrar para PostgreSQL/Prisma |\n| \`base44/functions\` | Backend | Lógica de negócios (Serverless) | CRÍTICA | Reescrever em API REST/GraphQL (ex: Node/NestJS) |\n| \`base44/workflows\` | Backend | Automação e CRON | ALTA | Implementar filas e CRON (ex: BullMQ) |\n\n`;
}

function writePart1() {
    const content = getInventory() + '\n\n' + getStructure() + '\n\n' + getStack();
    fs.writeFileSync(path.join(docsDir, 'REVERSE_ENGINEERING_01.md'), content);
}

function writePart2() {
    const content = getDatabase();
    fs.writeFileSync(path.join(docsDir, 'REVERSE_ENGINEERING_02.md'), content);
}

function writePart3() {
    const content = getPages();
    fs.writeFileSync(path.join(docsDir, 'REVERSE_ENGINEERING_03.md'), content);
}

function writePart4() {
    const content = getFunctions() + '\n\n' + getWorkflows();
    fs.writeFileSync(path.join(docsDir, 'REVERSE_ENGINEERING_04.md'), content);
}

function writePart5() {
    const content = getBase44Deps();
    fs.writeFileSync(path.join(docsDir, 'REVERSE_ENGINEERING_05.md'), content);
}

writePart1();
writePart2();
writePart3();
writePart4();
writePart5();

console.log('Reverse engineering documentation generated successfully in docs/');
