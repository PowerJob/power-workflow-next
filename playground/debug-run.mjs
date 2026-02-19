/**
 * 临时脚本：用 Playwright 打开 playground 并检查控制台错误与画布节点
 * 使用: node playground/debug-run.mjs（需先 npm run dev）
 */
import { chromium } from 'playwright';

const BASE = 'http://127.0.0.1:5173';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleLogs = [];
  const consoleErrors = [];
  page.on('console', (msg) => {
    const text = msg.text();
    const type = msg.type();
    if (type === 'error') consoleErrors.push(text);
    consoleLogs.push(`[${type}] ${text}`);
  });

  const pageErrors = [];
  page.on('pageerror', (err) => pageErrors.push(err.message));

  try {
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 15000 });
  } catch (e) {
    console.error('打开页面失败:', e.message);
    await browser.close();
    process.exit(1);
  }

  // 等待 React 和画布渲染
  await page.waitForTimeout(1500);

  const hasCanvas = await page.locator('.react-flow').count() > 0;
  const nodeCountDefault = await page.locator('.react-flow__node').count();
  const emptyHintVisible = await page.locator('text=右键点击添加节点').count() > 0;

  console.log('\n=== 默认场景 (基础工作流) ===');
  console.log('React Flow 画布存在:', hasCanvas);
  console.log('节点数:', nodeCountDefault);
  console.log('空画布提示(应不显示):', emptyHintVisible);

  // 切换到「空画布」场景
  await page.selectOption('select', 'emptyCanvas');
  await page.waitForTimeout(800);
  const nodeCountEmpty = await page.locator('.react-flow__node').count();
  const emptyHintAfter = await page.locator('text=右键点击添加节点').count() > 0;
  console.log('\n=== 切换为「空画布」后 ===');
  console.log('节点数:', nodeCountEmpty, '(应为 0)');
  console.log('空画布提示显示:', emptyHintAfter, '(应为 true)');

  // 再切换到「复杂工作流」
  await page.selectOption('select', 'complexWorkflow');
  await page.waitForTimeout(800);
  const nodeCountComplex = await page.locator('.react-flow__node').count();
  console.log('\n=== 切换为「复杂工作流」后 ===');
  console.log('节点数:', nodeCountComplex);

  if (consoleErrors.length) {
    console.log('\n=== 控制台错误 ===');
    consoleErrors.forEach((e) => console.log(e));
  }
  if (pageErrors.length) {
    console.log('\n=== 页面异常 ===');
    pageErrors.forEach((e) => console.log(e));
  }

  const ok =
    !pageErrors.length &&
    hasCanvas &&
    nodeCountDefault >= 3 &&
    nodeCountEmpty === 0 &&
    emptyHintAfter &&
    nodeCountComplex >= 5;
  await browser.close();
  process.exit(ok ? 0 : 1);
}

main();
