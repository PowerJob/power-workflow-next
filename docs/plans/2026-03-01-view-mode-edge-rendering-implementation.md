# 视图模式边渲染效果增强实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 增强视图模式中边的渲染效果，根据运行状态而非 property 属性来决定边的颜色。

**Architecture:** 在 CustomEdge 组件中根据 mode 区分渲染逻辑，视图模式下根据 source 节点的终态状态和边的 enable 属性决定颜色。

**Tech Stack:** React, TypeScript, Vitest, @xyflow/react

---

## Task 1: 新增 executed 颜色常量

**Files:**
- Modify: `src/constants/edgeColors.ts`

**Step 1: 添加 executed 常量**

在 `EDGE_STROKE` 对象中添加 `executed` 属性：

```typescript
/**
 * 边线及箭头颜色常量，与 CustomEdge / WorkflowCanvas 中边样式保持一致，便于统一维护。
 * @author Echo009
 */
export const EDGE_STROKE = {
  /** 未执行路径（如判断节点未选中分支）：置灰 */
  disabled: '#9CA3AF',
  /** 选中态 */
  selected: '#3B82F6',
  /** 默认 / 未选中 */
  default: '#94A3B8',
  /** 判断节点分支 property=true（通过） */
  propertyTrue: '#52C41A',
  /** 判断节点分支 property=false（不通过） */
  propertyFalse: '#EF4444',
  /** 已执行路径（视图模式）：绿色 */
  executed: '#52C41A',
} as const;

/** 未执行路径边线虚线样式 */
export const EDGE_STROKE_DASHARRAY_DISABLED = '6 4';
```

**Step 2: 验证修改**

```bash
npx tsc --noEmit
```

Expected: 无错误

**Step 3: Commit**

```bash
git add src/constants/edgeColors.ts
git commit -m "feat: 添加 EDGE_STROKE.executed 颜色常量"
```

---

## Task 2: 编写视图模式边颜色测试用例

**Files:**
- Modify: `tests/unit/components/edges/CustomEdge.test.tsx`

**Step 1: 添加 NodeStatus 导入**

在文件顶部添加 `NodeStatus` 导入：

```typescript
import { NodeType, NodeStatus } from '@/types/workflow';
```

**Step 2: 编写视图模式测试用例**

在 `describe('CustomEdge', () => {...})` 块末尾添加以下测试：

```typescript
describe('view mode edge rendering', () => {
  const viewModeProps = {
    ...defaultProps,
    mode: 'view' as const,
  };

  it('renders green stroke in view mode when source node has terminal status and edge enabled', () => {
    mockGetNodeReturn.current = {
      data: {
        type: NodeType.DECISION,
        status: NodeStatus.SUCCESS,
      },
    };
    const { container } = renderEdge({ ...viewModeProps, data: { property: 'true' } });
    const path = container.querySelector('.react-flow__edge-path');
    expect(path).toHaveStyle({ stroke: EDGE_STROKE.executed });
  });

  it('renders gray stroke in view mode when source node is not terminal status', () => {
    mockGetNodeReturn.current = {
      data: {
        type: NodeType.DECISION,
        status: NodeStatus.RUNNING,
      },
    };
    const { container } = renderEdge({ ...viewModeProps, data: { property: 'true' } });
    const path = container.querySelector('.react-flow__edge-path');
    expect(path).toHaveStyle({ stroke: EDGE_STROKE.disabled });
  });

  it('renders gray stroke in view mode when source node has no status', () => {
    mockGetNodeReturn.current = {
      data: {
        type: NodeType.DECISION,
        status: undefined,
      },
    };
    const { container } = renderEdge({ ...viewModeProps, data: { property: 'true' } });
    const path = container.querySelector('.react-flow__edge-path');
    expect(path).toHaveStyle({ stroke: EDGE_STROKE.disabled });
  });

  it('renders gray stroke with dash in view mode when edge is disabled', () => {
    mockGetNodeReturn.current = {
      data: {
        type: NodeType.DECISION,
        status: NodeStatus.SUCCESS,
      },
    };
    const { container } = renderEdge({ ...viewModeProps, data: { property: 'true', enable: false } });
    const path = container.querySelector('.react-flow__edge-path');
    expect(path).toHaveStyle({ stroke: EDGE_STROKE.disabled });
    expect(path).toHaveStyle({ strokeDasharray: '6 4' });
  });

  it('renders gray stroke in view mode when source node status is WAITING', () => {
    mockGetNodeReturn.current = {
      data: {
        type: NodeType.DECISION,
        status: NodeStatus.WAITING,
      },
    };
    const { container } = renderEdge({ ...viewModeProps, data: { property: 'true' } });
    const path = container.querySelector('.react-flow__edge-path');
    expect(path).toHaveStyle({ stroke: EDGE_STROKE.disabled });
  });

  it('renders green stroke in view mode when source node status is FAILED', () => {
    mockGetNodeReturn.current = {
      data: {
        type: NodeType.DECISION,
        status: NodeStatus.FAILED,
      },
    };
    const { container } = renderEdge({ ...viewModeProps, data: { property: 'true' } });
    const path = container.querySelector('.react-flow__edge-path');
    expect(path).toHaveStyle({ stroke: EDGE_STROKE.executed });
  });

  it('renders green stroke in view mode when source node status is STOPPED', () => {
    mockGetNodeReturn.current = {
      data: {
        type: NodeType.DECISION,
        status: NodeStatus.STOPPED,
      },
    };
    const { container } = renderEdge({ ...viewModeProps, data: { property: 'true' } });
    const path = container.querySelector('.react-flow__edge-path');
    expect(path).toHaveStyle({ stroke: EDGE_STROKE.executed });
  });

  it('renders green stroke in view mode when source node status is CANCELED', () => {
    mockGetNodeReturn.current = {
      data: {
        type: NodeType.DECISION,
        status: NodeStatus.CANCELED,
      },
    };
    const { container } = renderEdge({ ...viewModeProps, data: { property: 'true' } });
    const path = container.querySelector('.react-flow__edge-path');
    expect(path).toHaveStyle({ stroke: EDGE_STROKE.executed });
  });
});
```

**Step 3: 运行测试验证失败**

```bash
npm test -- tests/unit/components/edges/CustomEdge.test.tsx
```

Expected: 新增的视图模式测试失败（尚未实现功能）

**Step 4: Commit**

```bash
git add tests/unit/components/edges/CustomEdge.test.tsx
git commit -m "test: 添加视图模式边颜色测试用例"
```

---

## Task 3: 实现 CustomEdge 视图模式渲染逻辑

**Files:**
- Modify: `src/components/edges/CustomEdge.tsx`

**Step 1: 添加 isTerminalStatus 辅助函数**

在组件外部（`CustomEdge` 函数之前）添加辅助函数：

```typescript
/** 判断节点状态是否为终态（已执行完成） */
const isTerminalStatus = (status?: NodeStatus): boolean => {
  return status === NodeStatus.SUCCESS ||
         status === NodeStatus.FAILED ||
         status === NodeStatus.STOPPED ||
         status === NodeStatus.CANCELED;
};
```

**Step 2: 添加 NodeStatus 导入**

确保在文件顶部导入了 `NodeStatus`：

```typescript
import { WorkflowEdge, WorkflowEdgeData, NodeType, NodeStatus } from '../../types/workflow';
```

**Step 3: 修改边颜色逻辑**

找到 `strokeColor` 的计算逻辑，替换为：

```typescript
  /** 未执行路径（如判断节点未选中分支）：置灰 + 虚线 */
  const isDisabledEdge = data?.enable === false;

  /** 视图模式：根据 source 节点终态判断是否已执行 */
  const sourceNodeData = sourceNode?.data;
  const isExecuted = mode === 'view' &&
                     isTerminalStatus(sourceNodeData?.status) &&
                     !isDisabledEdge;

  const strokeColor = isDisabledEdge
    ? EDGE_STROKE.disabled
    : mode === 'view'
      ? (isExecuted ? EDGE_STROKE.executed : EDGE_STROKE.disabled)
      : !isFromDecisionNode
        ? (selected ? EDGE_STROKE.selected : EDGE_STROKE.default)
        : selected
          ? EDGE_STROKE.selected
          : isTrue
            ? EDGE_STROKE.propertyTrue
            : isFalse
              ? EDGE_STROKE.propertyFalse
              : EDGE_STROKE.default;
```

**Step 4: 运行测试验证通过**

```bash
npm test -- tests/unit/components/edges/CustomEdge.test.tsx
```

Expected: 所有测试通过

**Step 5: Commit**

```bash
git add src/components/edges/CustomEdge.tsx
git commit -m "feat: 实现视图模式边颜色根据运行状态渲染"
```

---

## Task 4: 运行完整测试套件

**Files:**
- None

**Step 1: 运行所有测试**

```bash
npm test
```

Expected: 所有测试通过

**Step 2: 运行类型检查**

```bash
npx tsc --noEmit
```

Expected: 无错误

**Step 3: Commit（如有变更）**

```bash
git status
# 如果有未提交的变更
git add -A
git commit -m "chore: 修复测试和类型问题"
```

---

## 变更总结

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `src/constants/edgeColors.ts` | 修改 | 新增 `executed` 颜色常量 |
| `tests/unit/components/edges/CustomEdge.test.tsx` | 修改 | 新增视图模式测试用例 |
| `src/components/edges/CustomEdge.tsx` | 修改 | 实现视图模式边颜色逻辑 |

## 边样式逻辑表

| mode | isDisabledEdge | source 终态 | 颜色 | 虚线 |
|------|----------------|-------------|------|------|
| view | true | - | 灰色 | 是 |
| view | false | true | 绿色 | 否 |
| view | false | false | 灰色 | 否 |
| edit | true | - | 灰色 | 是 |
| edit | false | - | 现有逻辑 | 否 |
