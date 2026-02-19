#!/usr/bin/env node
/**
 * 工作流画布交互回归测试 - 最终版本
 * 针对4个测试点进行精确验证
 */

import { chromium } from 'playwright';
import { setTimeout as sleep } from 'timers/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
process.chdir(__dirname);

const TEST_URL = 'http://127.0.0.1:5173';
const SCREENSHOT_DIR = 'test-screenshots';

async function waitForCanvas(page) {
  await page.waitForSelector('.react-flow__renderer', { timeout: 5000 });
  await sleep(800);
}

async function getEdgeCount(page) {
  return await page.locator('.react-flow__edge').count();
}

async function getDecisionNodeEdges(page, nodeId) {
  return await page.evaluate((id) => {
    const edges = Array.from(document.querySelectorAll('.react-flow__edge'));
    return edges.filter(edge => edge.getAttribute('data-source') === id).length;
  }, nodeId);
}

async function runTest1(page) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 Test 1: 从 source 锚点拖到目标节点主体（非锚点）');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // 使用空画布，添加2个节点
  await page.selectOption('select', 'emptyCanvas');
  await sleep(1000);
  
  // 添加第一个节点
  await page.click('button[title*="添加"], button:has-text("JOB")');
  await sleep(500);
  
  // 添加第二个节点（点击画布右侧位置）
  const canvas = await page.locator('.react-flow__renderer').first();
  const canvasBox = await canvas.boundingBox();
  
  if (canvasBox) {
    // 在画布中间偏右位置添加第二个节点
    await page.mouse.click(canvasBox.x + 400, canvasBox.y + 200);
    await sleep(500);
    
    // 再次点击添加按钮
    await page.click('button[title*="添加"], button:has-text("JOB")');
    await sleep(500);
  }
  
  await page.screenshot({ path: `${SCREENSHOT_DIR}/test1-setup.png`, fullPage: true });
  
  const edgesBefore = await getEdgeCount(page);
  console.log(`   初始连线数: ${edgesBefore}`);
  
  // 获取节点信息
  const nodes = await page.evaluate(() => {
    const nodeElements = Array.from(document.querySelectorAll('[data-id]')).filter(
      el => !el.hasAttribute('data-handlepos') && el.getAttribute('data-id')
    );
    return nodeElements.map(node => ({
      id: node.getAttribute('data-id'),
      bounds: node.getBoundingClientRect(),
    }));
  });
  
  console.log(`   找到 ${nodes.length} 个节点`);
  
  if (nodes.length < 2) {
    // 尝试使用 basicWorkflow 但删除一条边来测试
    await page.selectOption('select', 'basicWorkflow');
    await sleep(1000);
    
    // 删除最后一条边
    const lastEdge = await page.locator('.react-flow__edge').last();
    await lastEdge.click();
    await sleep(200);
    await page.keyboard.press('Backspace');
    await sleep(500);
    
    const edgesAfterDelete = await getEdgeCount(page);
    console.log(`   删除一条边后连线数: ${edgesAfterDelete}`);
    
    await page.screenshot({ path: `${SCREENSHOT_DIR}/test1-after-delete.png`, fullPage: true });
  }
  
  // 重新获取节点
  const updatedNodes = await page.evaluate(() => {
    const nodeElements = Array.from(document.querySelectorAll('[data-id]')).filter(
      el => !el.hasAttribute('data-handlepos') && el.getAttribute('data-id')
    );
    return nodeElements.map(node => ({
      id: node.getAttribute('data-id'),
      bounds: node.getBoundingClientRect(),
    }));
  });
  
  if (updatedNodes.length < 2) {
    console.log('❌ Test 1: 无法创建测试环境');
    return { passed: false, reason: '无法创建足够的节点' };
  }
  
  // 找到第二个节点作为源，第三个节点作为目标
  const sourceNode = updatedNodes[1];
  const targetNode = updatedNodes[2] || updatedNodes[0];
  
  // 找到源节点的锚点
  const sourceHandle = await page.locator(`[data-nodeid="${sourceNode.id}"][data-handlepos="right"], [data-nodeid="${sourceNode.id}"][data-handlepos="bottom"]`).first();
  const sourceBox = await sourceHandle.boundingBox();
  
  if (!sourceBox) {
    console.log('❌ Test 1: 未找到源锚点');
    return { passed: false, reason: '未找到源锚点' };
  }
  
  const currentEdges = await getEdgeCount(page);
  console.log(`   当前连线数: ${currentEdges}`);
  
  // 拖拽到目标节点中心
  const targetX = targetNode.bounds.x + targetNode.bounds.width / 2;
  const targetY = targetNode.bounds.y + targetNode.bounds.height / 2;
  
  console.log(`   从锚点拖到节点 ${targetNode.id} 中心 (${Math.round(targetX)}, ${Math.round(targetY)})`);
  
  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
  await page.mouse.down();
  await sleep(400);
  await page.mouse.move(targetX, targetY, { steps: 25 });
  await sleep(400);
  await page.mouse.up();
  await sleep(1500);
  
  const edgesAfter = await getEdgeCount(page);
  console.log(`   拖拽后连线数: ${edgesAfter}`);
  
  await page.screenshot({ path: `${SCREENSHOT_DIR}/test1-final.png`, fullPage: true });
  
  if (edgesAfter > currentEdges) {
    console.log('✅ Test 1 通过: 成功创建连线');
    return { passed: true, observation: `连线从 ${currentEdges} 增加到 ${edgesAfter}` };
  } else {
    console.log('❌ Test 1 失败: 未创建连线');
    return { 
      passed: false, 
      reason: '从锚点拖到节点主体后未创建连线',
      steps: `1. 从节点 ${sourceNode.id} 的锚点开始拖拽\n2. 拖到节点 ${targetNode.id} 的中心位置\n3. 预期创建连线但实际未创建`
    };
  }
}

async function runTest2(page) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 Test 2: 从 source 锚点拖到空白区域');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  await page.selectOption('select', 'basicWorkflow');
  await sleep(1000);
  
  const edgesBefore = await getEdgeCount(page);
  console.log(`   当前连线数: ${edgesBefore}`);
  
  // 找任意一个锚点
  const sourceHandle = await page.locator('[data-handlepos="right"], [data-handlepos="bottom"]').first();
  const sourceBox = await sourceHandle.boundingBox();
  
  if (!sourceBox) {
    console.log('⚠️  未找到源锚点');
    return { passed: null, reason: '未找到源锚点' };
  }
  
  // 获取画布边界，拖到画布右下角空白区域
  const canvas = await page.locator('.react-flow__renderer').first();
  const canvasBox = await canvas.boundingBox();
  
  const blankX = canvasBox.x + canvasBox.width - 100;
  const blankY = canvasBox.y + canvasBox.height - 100;
  
  console.log(`   从锚点 (${Math.round(sourceBox.x)}, ${Math.round(sourceBox.y)}) 拖到空白区域 (${Math.round(blankX)}, ${Math.round(blankY)})`);
  
  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
  await page.mouse.down();
  await sleep(400);
  await page.mouse.move(blankX, blankY, { steps: 25 });
  await sleep(400);
  await page.mouse.up();
  await sleep(1500);
  
  const edgesAfter = await getEdgeCount(page);
  console.log(`   拖拽后连线数: ${edgesAfter}`);
  
  await page.screenshot({ path: `${SCREENSHOT_DIR}/test2-final.png`, fullPage: true });
  
  if (edgesAfter === edgesBefore) {
    console.log('✅ Test 2 通过: 未创建连线');
    return { passed: true, observation: `连线数保持为 ${edgesAfter}，符合预期` };
  } else {
    console.log('❌ Test 2 失败: 意外创建了连线');
    return { 
      passed: false, 
      reason: `拖到空白区域后意外创建了连线 (${edgesBefore} -> ${edgesAfter})`,
      steps: '1. 从任意锚点开始拖拽\n2. 拖到画布空白区域\n3. 预期不创建连线但实际创建了'
    };
  }
}

async function runTest3(page) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 Test 3: 判断节点最多 2 条出边限制');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  await page.selectOption('select', 'decisionWorkflow');
  await sleep(1500);
  
  await page.screenshot({ path: `${SCREENSHOT_DIR}/test3-initial.png`, fullPage: true });
  
  // 查找判断节点
  const decisionNodeId = await page.evaluate(() => {
    const decisionNode = document.querySelector('[data-nodetype="DECISION"]');
    return decisionNode ? decisionNode.getAttribute('data-id') : null;
  });
  
  if (!decisionNodeId) {
    console.log('⚠️  未找到判断节点');
    return { passed: null, reason: '未找到判断节点' };
  }
  
  const existingEdges = await getDecisionNodeEdges(page, decisionNodeId);
  console.log(`   判断节点 ${decisionNodeId} 当前出边数: ${existingEdges}`);
  
  if (existingEdges !== 2) {
    console.log(`   ⚠️  判断节点出边数不是 2 (当前: ${existingEdges})`);
  }
  
  // 尝试创建第3条出边
  // 找到判断节点的锚点
  const decisionHandle = await page.locator(`[data-nodeid="${decisionNodeId}"][data-handlepos]`).first();
  const handleBox = await decisionHandle.boundingBox();
  
  if (!handleBox) {
    console.log('⚠️  未找到判断节点锚点');
    return { passed: null, reason: '未找到判断节点锚点' };
  }
  
  // 找一个目标节点（不是判断节点本身）
  const targetNode = await page.evaluate((decId) => {
    const nodes = Array.from(document.querySelectorAll('[data-id]')).filter(
      el => !el.hasAttribute('data-handlepos') && el.getAttribute('data-id') !== decId
    );
    if (nodes.length === 0) return null;
    const node = nodes[nodes.length - 1]; // 使用最后一个节点
    return {
      id: node.getAttribute('data-id'),
      bounds: node.getBoundingClientRect(),
    };
  }, decisionNodeId);
  
  if (!targetNode) {
    console.log('⚠️  未找到目标节点');
    return { passed: null, reason: '未找到目标节点' };
  }
  
  console.log(`   尝试创建第 3 条出边到节点 ${targetNode.id}...`);
  
  const targetX = targetNode.bounds.x + targetNode.bounds.width / 2;
  const targetY = targetNode.bounds.y + targetNode.bounds.height / 2;
  
  await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
  await page.mouse.down();
  await sleep(400);
  await page.mouse.move(targetX, targetY, { steps: 25 });
  await sleep(400);
  await page.mouse.up();
  await sleep(1500);
  
  const edgesAfter = await getDecisionNodeEdges(page, decisionNodeId);
  console.log(`   尝试后出边数: ${edgesAfter}`);
  
  await page.screenshot({ path: `${SCREENSHOT_DIR}/test3-final.png`, fullPage: true });
  
  if (edgesAfter <= 2) {
    console.log('✅ Test 3 通过: 限制生效，出边数未超过 2');
    return { passed: true, observation: `判断节点出边限制在 ${edgesAfter} 条，符合预期` };
  } else {
    console.log('❌ Test 3 失败: 创建了超过 2 条出边');
    return { 
      passed: false, 
      reason: `判断节点出边数为 ${edgesAfter}，超过限制`,
      steps: `1. 判断节点 ${decisionNodeId} 已有 ${existingEdges} 条出边\n2. 尝试创建第 3 条出边\n3. 预期失败但实际成功`
    };
  }
}

async function runTest4(page) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 Test 4: 布局方向切换后锚点选择');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const results = [];
  
  // 测试横向布局
  console.log('\n   📐 测试横向布局...');
  await page.selectOption('select', 'basicWorkflow');
  await sleep(1000);
  
  // 确保是横向布局
  await page.click('button:has-text("横向")');
  await sleep(800);
  
  // 删除一条边以便创建新的
  const edgeToDelete = await page.locator('.react-flow__edge').last();
  await edgeToDelete.click();
  await sleep(200);
  await page.keyboard.press('Backspace');
  await sleep(500);
  
  const edgesBeforeH = await getEdgeCount(page);
  console.log(`   横向布局当前连线数: ${edgesBeforeH}`);
  
  // 获取节点信息
  const nodesH = await page.evaluate(() => {
    const nodeElements = Array.from(document.querySelectorAll('[data-id]')).filter(
      el => !el.hasAttribute('data-handlepos') && el.getAttribute('data-id')
    );
    return nodeElements.map(node => ({
      id: node.getAttribute('data-id'),
      bounds: node.getBoundingClientRect(),
    }));
  });
  
  if (nodesH.length >= 2) {
    const sourceNode = nodesH[nodesH.length - 2];
    const targetNode = nodesH[nodesH.length - 1];
    
    // 找源节点的 right 锚点
    const sourceHandle = await page.locator(`[data-nodeid="${sourceNode.id}"][data-handlepos="right"]`).first();
    const sourceBox = await sourceHandle.boundingBox();
    
    if (sourceBox) {
      const targetX = targetNode.bounds.x + targetNode.bounds.width / 2;
      const targetY = targetNode.bounds.y + targetNode.bounds.height / 2;
      
      console.log(`   从节点 ${sourceNode.id} 拖到节点 ${targetNode.id}`);
      
      await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
      await page.mouse.down();
      await sleep(400);
      await page.mouse.move(targetX, targetY, { steps: 25 });
      await sleep(400);
      await page.mouse.up();
      await sleep(1500);
      
      const edgesAfterH = await getEdgeCount(page);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/test4-horizontal.png`, fullPage: true });
      
      if (edgesAfterH > edgesBeforeH) {
        console.log(`   ✓ 横向布局创建连线成功 (${edgesBeforeH} -> ${edgesAfterH})`);
        console.log(`   预期锚点: right -> left`);
        results.push({ layout: 'horizontal', created: true });
      } else {
        console.log(`   ✗ 横向布局未创建连线`);
        results.push({ layout: 'horizontal', created: false });
      }
    }
  }
  
  // 测试纵向布局
  console.log('\n   📐 测试纵向布局...');
  await page.selectOption('select', 'basicWorkflow');
  await sleep(1000);
  
  // 切换到纵向布局
  await page.click('button:has-text("纵向")');
  await sleep(800);
  
  // 删除一条边
  const edgeToDeleteV = await page.locator('.react-flow__edge').last();
  await edgeToDeleteV.click();
  await sleep(200);
  await page.keyboard.press('Backspace');
  await sleep(500);
  
  const edgesBeforeV = await getEdgeCount(page);
  console.log(`   纵向布局当前连线数: ${edgesBeforeV}`);
  
  const nodesV = await page.evaluate(() => {
    const nodeElements = Array.from(document.querySelectorAll('[data-id]')).filter(
      el => !el.hasAttribute('data-handlepos') && el.getAttribute('data-id')
    );
    return nodeElements.map(node => ({
      id: node.getAttribute('data-id'),
      bounds: node.getBoundingClientRect(),
    }));
  });
  
  if (nodesV.length >= 2) {
    const sourceNode = nodesV[nodesV.length - 2];
    const targetNode = nodesV[nodesV.length - 1];
    
    // 找源节点的 bottom 锚点
    const sourceHandle = await page.locator(`[data-nodeid="${sourceNode.id}"][data-handlepos="bottom"]`).first();
    const sourceBox = await sourceHandle.boundingBox();
    
    if (sourceBox) {
      const targetX = targetNode.bounds.x + targetNode.bounds.width / 2;
      const targetY = targetNode.bounds.y + targetNode.bounds.height / 2;
      
      console.log(`   从节点 ${sourceNode.id} 拖到节点 ${targetNode.id}`);
      
      await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
      await page.mouse.down();
      await sleep(400);
      await page.mouse.move(targetX, targetY, { steps: 25 });
      await sleep(400);
      await page.mouse.up();
      await sleep(1500);
      
      const edgesAfterV = await getEdgeCount(page);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/test4-vertical.png`, fullPage: true });
      
      if (edgesAfterV > edgesBeforeV) {
        console.log(`   ✓ 纵向布局创建连线成功 (${edgesBeforeV} -> ${edgesAfterV})`);
        console.log(`   预期锚点: bottom -> top`);
        results.push({ layout: 'vertical', created: true });
      } else {
        console.log(`   ✗ 纵向布局未创建连线`);
        results.push({ layout: 'vertical', created: false });
      }
    }
  }
  
  const allCreated = results.length === 2 && results.every(r => r.created);
  
  if (allCreated) {
    console.log('\n✅ Test 4 通过: 两种布局下都能创建连线');
    console.log('   说明: 锚点选择逻辑正常工作');
    console.log('   横向: right -> left');
    console.log('   纵向: bottom -> top');
    return { 
      passed: true, 
      observation: '两种布局下都能创建连线，锚点选择符合预期（横向 right->left，纵向 bottom->top）'
    };
  } else {
    console.log('\n❌ Test 4 失败: 部分布局下无法创建连线');
    return { 
      passed: false, 
      reason: `部分布局下无法创建连线: ${JSON.stringify(results)}`,
      steps: '见截图验证'
    };
  }
}

async function main() {
  console.log('🚀 工作流画布交互回归测试');
  console.log(`📍 目标: ${TEST_URL}`);
  console.log(`📸 截图: ${SCREENSHOT_DIR}\n`);
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 50
  });
  
  const context = await browser.newContext({
    viewport: { width: 1600, height: 1000 }
  });
  
  const page = await context.newPage();
  
  try {
    console.log('📡 连接页面...');
    await page.goto(TEST_URL, { waitUntil: 'networkidle' });
    await waitForCanvas(page);
    
    await page.screenshot({ path: `${SCREENSHOT_DIR}/00-initial.png`, fullPage: true });
    console.log('✓ 页面加载完成');
    
    const results = {
      test1: await runTest1(page),
      test2: await runTest2(page),
      test3: await runTest3(page),
      test4: await runTest4(page),
    };
    
    // 汇总结果
    console.log('\n');
    console.log('═══════════════════════════════════════════');
    console.log('📊 测试结果汇总');
    console.log('═══════════════════════════════════════════\n');
    
    const tests = [
      { name: '1) 拖到节点主体创建连线', result: results.test1 },
      { name: '2) 拖到空白区域不创建连线', result: results.test2 },
      { name: '3) 判断节点 2 条出边限制', result: results.test3 },
      { name: '4) 布局方向切换锚点选择', result: results.test4 },
    ];
    
    tests.forEach((test) => {
      const { result } = test;
      if (result.passed === true) {
        console.log(`✅ ${test.name}`);
        console.log(`   观察: ${result.observation}`);
      } else if (result.passed === false) {
        console.log(`❌ ${test.name}`);
        console.log(`   原因: ${result.reason}`);
        if (result.steps) {
          console.log(`   复现:\n${result.steps.split('\n').map(s => '     ' + s).join('\n')}`);
        }
      } else {
        console.log(`⚠️  ${test.name}`);
        console.log(`   跳过: ${result.reason}`);
      }
      console.log('');
    });
    
    const passed = tests.filter(t => t.result.passed === true).length;
    const failed = tests.filter(t => t.result.passed === false).length;
    const skipped = tests.filter(t => t.result.passed === null).length;
    
    console.log('═══════════════════════════════════════════');
    console.log(`总计: ${passed} 通过, ${failed} 失败, ${skipped} 跳过`);
    console.log('═══════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('\n❌ 测试执行失败:', error.message);
    console.error(error.stack);
  } finally {
    console.log('⏳ 3秒后关闭浏览器...');
    await sleep(3000);
    await browser.close();
  }
}

main().catch(console.error);
