<h1 align="center">power-workflow-next</h1>

<p align="center">
  <img src="https://img.shields.io/npm/v/%40echo009%2Fpower-workflow-next?style=flat-square" alt="npm version" />
  <img src="https://img.shields.io/npm/l/%40echo009%2Fpower-workflow-next?style=flat-square" alt="license" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/Vite-7-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/React%20Flow-12-FF0072?style=flat-square&logo=react&logoColor=white" alt="React Flow" />
  <img src="https://img.shields.io/badge/Tailwind%20CSS-3-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Zustand-5-764ABC?style=flat-square" alt="Zustand" />
  <img src="https://img.shields.io/badge/Dagre-0.8-000000?style=flat-square" alt="Dagre" />
</p>

<p align="center">基于 React Flow 的 PowerJob 工作流可视化组件，用于替代基于 @antv/g6 的旧版工作流编辑器。</p>


## 特性

- **三种节点类型**：任务节点（JOB）、判断节点（DECISION）、嵌套工作流节点（NESTED_WORKFLOW）
- **画布能力**：拖拽节点、连线、编辑/查看模式切换、缩放限制（25%–200%）、连接吸附方向（水平/垂直）
- **连线样式**：基础灰色连线、分支线（true/false 绿色/红色 + Y/N 标签）、选中高亮
- **编辑面板**：右侧滑入面板、表单校验、保存确认
- **自动布局**：Dagre 层次布局，支持横向/纵向
- **撤销重做**：支持可配置步数历史记录（默认 50 步）
- **右键菜单**：添加节点、复制粘贴
- **快捷键**：Delete、Ctrl+Z/Y、Ctrl+C/V、Ctrl+A、Ctrl+D、Escape
- **视图模式**：节点状态展示、运行动画、执行详情 Tooltip
- **增强功能**：小地图导航、节点搜索筛选、可选内嵌工具栏
- **国际化**：中英文（zh-CN / en-US），默认中文

## 安装

```bash
npm install power-workflow-next
```

## 快速开始

```tsx
import {
  WorkflowCanvas,
  useWorkflowStore,
  layoutNodes,
  NodeType,
  NodeStatus,
} from 'power-workflow-next';
import 'power-workflow-next/style.css';

const initialNodes = [
  {
    id: '1',
    type: 'JOB',
    position: { x: 0, y: 0 },
    data: {
      label: '数据清洗任务',
      type: NodeType.JOB,
      jobId: 1001,
      enable: true,
    },
  },
];

const initialEdges = [];

function App() {
  const { nodes, edges, setNodes, setEdges } = useWorkflowStore();

  return (
    <div className="w-full h-screen">
      <WorkflowCanvas nodes={nodes} edges={edges} mode="edit" defaultLocale="zh-CN" />
    </div>
  );
}
```

## API 文档

### WorkflowCanvas Props

组件接受 `WorkflowNextProps`，继承 React Flow 的常用画布能力，主要属性如下：

| 属性                 | 类型                     | 默认值    | 说明                   |
| -------------------- | ------------------------ | --------- | ---------------------- |
| `nodes`              | `WorkflowNode[]`         | `[]`      | 节点数据               |
| `edges`              | `WorkflowEdge[]`         | `[]`      | 连线数据               |
| `mode`               | `'edit' \| 'view'`       | `'edit'`  | 编辑/视图模式          |
| `defaultLocale`      | `'zh-CN' \| 'en-US'`    | `'zh-CN'` | 默认语言               |
| `onNodesChange`      | `function`               | -         | 节点变化回调           |
| `onEdgesChange`      | `function`               | -         | 连线变化回调           |
| `onConnect`          | `function`               | -         | 连线连接回调           |
| `onNodeDataChange`   | `function`               | -         | 节点数据变化回调       |
| `onValidationError`  | `(errors: unknown[]) => void` | -   | 校验失败回调           |
| `connectSnapDirection` | `'horizontal' \| 'vertical'` | -     | 连接吸附方向           |
| `showToolbar`        | `boolean`                | -         | 是否在画布上方显示工具栏 |
| `jobOptions`         | `WorkflowReferenceOption[]` | -      | 任务下拉选项（编辑面板） |
| `workflowOptions`    | `WorkflowReferenceOption[]` | -     | 工作流下拉选项（嵌套节点） |
| `onAutoLayout`       | `function`               | -         | 自动布局回调           |
| `onAddNode`          | `function`               | -         | 添加节点回调           |
| `onExport` / `onImport` | `function`            | -         | 导出/导入回调          |
| `showMinimap` / `onToggleMinimap` | `boolean` / `function` | - | 小地图显示与切换       |
| `undoableActions`    | `number`                 | `50`      | 撤销历史步数上限       |

### 数据结构

#### WorkflowNodeData

```typescript
interface WorkflowNodeData {
  label: string;
  type: NodeType;
  status?: NodeStatus;
  instanceId?: string;
  execution?: ExecutionInfo;

  jobId?: string | number;
  enable?: boolean;
  skip?: boolean;
  timeout?: number;
  params?: string;
  condition?: string;
  targetWorkflowId?: string | number;

  /** 判断节点执行结果，仅 DECISION 节点在运行后存在 */
  result?: 'true' | 'false';
  /** 因控制节点而被禁用，仅视图/运行态 */
  disableByControlNode?: boolean;
}
```

#### NodeType

```typescript
enum NodeType {
  JOB = 'JOB',
  DECISION = 'DECISION',
  NESTED_WORKFLOW = 'NESTED_WORKFLOW',
}
```

#### NodeStatus

```typescript
enum NodeStatus {
  WAITING = 1,
  RUNNING = 3,
  FAILED = 4,
  SUCCESS = 5,
  CANCELED = 6,
  STOPPED = 10,
}
```

### 工具函数

```typescript
import {
  layoutNodes,           // Dagre 自动布局
  detectCycle,           // 循环依赖检测
  checkDecisionNodeExits, // 判断节点出口校验
  exportToJSON,          // 导出为 JSON
  importFromJSON,        // 从 JSON 导入
  generateNodeId,        // 生成节点 ID
  generateEdgeId,        // 生成连线 ID
  createDefaultNodeData, // 创建默认节点数据
  deepClone,             // 深拷贝
} from 'power-workflow-next';

import {
  assignOptimalHandles,   // 分配最优连接把手
  getOptimalHandlesForEdge,
  getSnapHandlesForEdge,
  normalizeConnectionDirection,
} from 'power-workflow-next';

// 自动布局
const newNodes = layoutNodes(nodes, edges, { direction: 'horizontal' });

// 循环检测
const cycleError = detectCycle(nodes, edges);

// 导出 / 导入
const json = exportToJSON(nodes, edges);
const { success, data, error } = importFromJSON(jsonString);
```

### 校验器

```typescript
import {
  required,
  minLength,
  maxLength,
  range,
  pattern,
  json,
  condition,
  positiveInteger,
  nodeName,
  composeValidators,
  useValidators,
} from 'power-workflow-next';
```

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器（运行 playground 演示）
npm run dev

# 构建库
npm run build:lib

# 运行测试
npm run test

# 类型检查
npm run typecheck

# 代码检查
npm run lint
```

## 项目结构

```
power-workflow-next/
├── src/
│   ├── components/
│   │   ├── WorkflowCanvas/   # 画布主组件
│   │   ├── nodes/            # 节点组件（JobNode、DecisionNode、NestedWorkflowNode）
│   │   ├── edges/            # 连线组件
│   │   ├── panels/           # 编辑面板与表单（EditorPanel、*Form、表单控件）
│   │   ├── toolbar/          # 工具栏
│   │   └── common/           # 通用组件（小地图、Tooltip、右键菜单等）
│   ├── contexts/             # React 上下文（LocaleContext）
│   ├── hooks/                # 自定义 Hooks（快捷键、搜索、国际化）
│   ├── stores/               # Zustand 状态管理
│   ├── utils/                # 工具函数（布局、校验、工作流、边把手）
│   ├── types/                # TypeScript 类型
│   ├── locales/              # 国际化
│   └── styles/               # 样式文件
├── tests/
│   ├── setup.ts              # 测试环境配置
│   └── unit/                 # 单元测试
│       ├── components/       # 组件测试（含 nodes、edges）
│       ├── stores/           # 状态管理测试
│       └── utils/            # 工具函数测试
├── playground/               # 本地演示与调试（npm run dev 入口）
├── docs/                     # 文档与设计说明
├── package.json
├── vite.config.ts
└── tsconfig.json
```

