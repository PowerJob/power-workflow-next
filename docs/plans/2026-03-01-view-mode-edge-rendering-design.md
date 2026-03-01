# 视图模式边渲染效果增强设计

## 概述

增强视图模式中边的渲染效果，根据运行状态而非 `property` 属性来决定边的颜色，并支持被控制节点失效的边显示虚线。

## 需求

### 边的渲染规则

| 条件 | 颜色 | 线型 |
|------|------|------|
| source 节点终态 且 enable ≠ false | 绿色 | 实线 |
| source 节点非终态 | 灰色 | 实线 |
| enable === false | 灰色 | 虚线 |

### 节点

- 已实现 `disableByControlNode` 时显示虚线边框 + opacity-60
- 无需修改

### 边标签

- 视图模式下保留 Y/N 标签（property 有值时）

### 终态定义

以下状态视为终态：
- `NodeStatus.SUCCESS`
- `NodeStatus.FAILED`
- `NodeStatus.STOPPED`
- `NodeStatus.CANCELED`

非终态：
- `NodeStatus.WAITING`
- `NodeStatus.RUNNING`

## 设计方案

采用方案 A：直接修改 CustomEdge 组件，根据 `mode` 区分渲染逻辑。

### 文件变更

#### 1. `src/constants/edgeColors.ts`

新增 `executed` 颜色常量：

```typescript
export const EDGE_STROKE = {
  disabled: '#9CA3AF',      // 未执行路径（灰色）
  selected: '#3B82F6',      // 选中态
  default: '#94A3B8',       // 默认
  propertyTrue: '#52C41A',  // 判断节点 property=true（编辑模式用）
  propertyFalse: '#EF4444', // 判断节点 property=false（编辑模式用）
  executed: '#52C41A',      // 已执行路径（视图模式用，绿色）
} as const;
```

#### 2. `src/components/edges/CustomEdge.tsx`

**新增辅助函数：**

```typescript
const isTerminalStatus = (status?: NodeStatus): boolean => {
  return status === NodeStatus.SUCCESS ||
         status === NodeStatus.FAILED ||
         status === NodeStatus.STOPPED ||
         status === NodeStatus.CANCELED;
};
```

**修改边颜色逻辑：**

```typescript
const isDisabledEdge = data?.enable === false;
const sourceNode = getNode(source);
const isExecuted = mode === 'view' &&
                   isTerminalStatus(sourceNode?.data?.status) &&
                   !isDisabledEdge;

const strokeColor = isDisabledEdge
  ? EDGE_STROKE.disabled
  : mode === 'view'
    ? (isExecuted ? EDGE_STROKE.executed : EDGE_STROKE.disabled)
    : /* 编辑模式保持现有逻辑 */;
```

### 边样式逻辑表

| mode | isDisabledEdge | source 终态 | 颜色 | 虚线 |
|------|----------------|-------------|------|------|
| view | true | - | 灰色 | 是 |
| view | false | true | 绿色 | 否 |
| view | false | false | 灰色 | 否 |
| edit | true | - | 灰色 | 是 |
| edit | false | - | 现有逻辑 | 否 |

## 影响范围

- 仅影响视图模式下的边渲染
- 编辑模式行为不变
- 节点渲染不变
