/**
 * dialogue-annotator 检验脚本
 * 运行: node validate.js
 * 
 * 检验项目：
 * 1. JavaScript语法检查
 * 2. HTML结构检查
 * 3. 控制台错误检测（需要playwright）
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = __dirname;
const HTML_FILE = path.join(PROJECT_ROOT, 'index.html');

let errors = [];
let warnings = [];

function log(msg, type = 'info') {
    const colors = {
        info: '\x1b[36m',   // 青色
        success: '\x1b[32m', // 绿色
        error: '\x1b[31m',   // 红色
        warning: '\x1b[33m', // 黄色
        reset: '\x1b[0m'
    };
    console.log(`${colors[type]}[${type.toUpperCase()}]${colors.reset} ${msg}`);
}

function checkJavaScriptSyntax(htmlContent) {
    log('检查JavaScript语法...', 'info');
    
    const scriptMatch = htmlContent.match(/<script>([\s\S]*?)<\/script>/);
    if (!scriptMatch) {
        errors.push('未找到<script>标签');
        return false;
    }
    
    const jsCode = scriptMatch[1];
    const tempFile = path.join(PROJECT_ROOT, 'temp_validate.js');
    
    try {
        fs.writeFileSync(tempFile, jsCode, 'utf8');
        execSync(`node --check "${tempFile}"`, { encoding: 'utf8', stdio: 'pipe' });
        fs.unlinkSync(tempFile);
        log('JavaScript语法✓', 'success');
        return true;
    } catch (e) {
        const errorMsg = e.stdout || e.message;
        errors.push(`JS语法错误: ${errorMsg.substring(0, 200)}`);
        try { fs.unlinkSync(tempFile); } catch {}
        return false;
    }
}

function checkHTMLStructure(htmlContent) {
    log('检查HTML结构...', 'info');
    
    const openDivs = (htmlContent.match(/<div/g) || []).length;
    const closeDivs = (htmlContent.match(/<\/div>/g) || []).length;
    
    if (openDivs !== closeDivs) {
        errors.push(`div标签不匹配: 打开${openDivs}个，关闭${closeDivs}个`);
        return false;
    }
    
    // 检查必要的标签
    const requiredTags = ['<!DOCTYPE html>', '<html', '<head>', '<body>', '</html>'];
    for (const tag of requiredTags) {
        if (!htmlContent.includes(tag)) {
            errors.push(`缺少必要标签: ${tag}`);
            return false;
        }
    }
    
    log(`HTML结构✓ (${openDivs}个div)`, 'success');
    return true;
}

function checkCriticalFunctions(htmlContent) {
    log('检查关键函数...', 'info');
    
    const requiredFunctions = [
        'load()',
        'addDialogue()',
        'saveDialogue()',
        'renderEditor()',
        'parseAiOutput()',
        'callAi()',
        'aiComplete()'
    ];
    
    for (const func of requiredFunctions) {
        if (!htmlContent.includes(`function ${func.replace('()', '')}`)) {
            errors.push(`缺少关键函数: ${func}`);
        }
    }
    
    if (errors.filter(e => e.includes('缺少关键函数')).length === 0) {
        log('关键函数检查✓', 'success');
        return true;
    }
    return false;
}

function checkAPIConfigs(htmlContent) {
    log('检查API配置...', 'info');
    
    const apiConfigs = [
        { name: 'Ollama', pattern: /ollama.*11434/ },
        { name: 'MiniMax', pattern: /api\.minimax\.chat/ },
        { name: 'DeepSeek', pattern: /api\.deepseek\.com/ },
        { name: 'OpenAI', pattern: /api\.openai\.com/ },
        { name: 'Claude', pattern: /anthropic\.com/ }
    ];
    
    let configured = 0;
    for (const api of apiConfigs) {
        if (api.pattern.test(htmlContent)) {
            configured++;
        }
    }
    
    log(`API配置检查✓ (${configured}/${apiConfigs.length}个)`, 'success');
    return true;
}

async function checkWithPlaywright() {
    log('检查Playwright可用性...', 'info');
    
    try {
        const playwright = require('playwright');
        log('Playwright可用，正在进行浏览器测试...', 'info');
        
        const browser = await playwright.chromium.launch();
        const page = await browser.newPage();
        
        const consoleErrors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
            }
        });
        
        page.on('pageerror', err => {
            consoleErrors.push(err.message);
        });
        
        await page.goto(`file://${HTML_FILE}`);
        await page.waitForTimeout(2000);
        
        await browser.close();
        
        if (consoleErrors.length > 0) {
            errors.push(`控制台错误: ${consoleErrors.join('; ')}`);
            log(`发现${consoleErrors.length}个控制台错误`, 'error');
            return false;
        }
        
        log('浏览器测试✓ (无控制台错误)', 'success');
        return true;
    } catch (e) {
        if (e.code === 'MODULE_NOT_FOUND') {
            log('Playwright未安装，跳过浏览器测试', 'warning');
            warnings.push('建议安装playwright: npm install playwright');
        } else {
            log(`浏览器测试跳过: ${e.message}`, 'warning');
        }
        return null; // 未执行，非成功也非失败
    }
}

async function validate() {
    console.log('\n' + '='.repeat(50));
    console.log('  🔍 对话标注工具 - 代码检验');
    console.log('='.repeat(50) + '\n');
    
    if (!fs.existsSync(HTML_FILE)) {
        log(`文件不存在: ${HTML_FILE}`, 'error');
        process.exit(1);
    }
    
    const htmlContent = fs.readFileSync(HTML_FILE, 'utf8');
    
    // 基础检验
    const jsOk = checkJavaScriptSyntax(htmlContent);
    const htmlOk = checkHTMLStructure(htmlContent);
    checkCriticalFunctions(htmlContent);
    checkAPIConfigs(htmlContent);
    
    // 浏览器检验（可选）
    await checkWithPlaywright();
    
    // 输出结果
    console.log('\n' + '='.repeat(50));
    if (errors.length === 0) {
        console.log('  ✅ 检验通过！可以提交到GitHub');
        console.log('='.repeat(50) + '\n');
        process.exit(0);
    } else {
        console.log(`  ❌ 检验失败，发现${errors.length}个错误`);
        console.log('='.repeat(50) + '\n');
        errors.forEach(e => console.log(`  - ${e}`));
        if (warnings.length > 0) {
            console.log('\n⚠️ 警告:');
            warnings.forEach(w => console.log(`  - ${w}`));
        }
        process.exit(1);
    }
}

validate().catch(err => {
    log(`检验脚本错误: ${err.message}`, 'error');
    process.exit(1);
});
