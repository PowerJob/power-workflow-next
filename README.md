# power-workflow-next

基于 React Flow 的 PowerJob 工作流可视化组件，用于替代基于 @antv/g6 的旧版工作流编辑器。

## 特性

- **三种节点类型**：任务节点（JOB）、判断节点（DECISION）、嵌套工作流节点（NESTED_WORKFLOW）
- **画布能力**：拖拽节点、连线、编辑/查看模式切换、缩放限制（25%–200%）
- **连线样式**：基础灰色连线、分支线（true/false 绿色/红色 + Y/N 标签）、选中高亮
- **编辑面板**：右侧滑入面板、表单校验、保存确认
- **自动布局**：Dagre 层次布局，支持横向/纵向
- **撤销重做**：支持 50 步历史记录
- **右键菜单**：添加节点、复制粘贴
- **快捷键**：Delete、Ctrl+Z/Y、Ctrl+C/V、Ctrl+A、Ctrl+D、Escape
- **视图模式**：节点状态展示、运行动画、执行详情 Tooltip
- **增强功能**：小地图导航、节点搜索筛选
- **国际化**：中英文（zh-CN / en-US），默认中文
- **技术栈**：React 18、TypeScript 5、Vite 7、@xyflow/react 12、Tailwind CSS 3

## 安装

```bash
npm install power-workflow-next
```

## 快速开始

```tsx
import {
  WorkflowCanvas,
  Toolbar,
  EditorPanel,
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

| 属性               | 类型                 | 默认值    | 说明             |
| ------------------ | -------------------- | --------- | ---------------- |
| `nodes`            | `WorkflowNode[]`     | `[]`      | 节点数据         |
| `edges`            | `WorkflowEdge[]`     | `[]`      | 连线数据         |
| `mode`             | `'edit' \| 'view'`   | `'edit'`  | 编辑/视图模式    |
| `defaultLocale`    | `'zh-CN' \| 'en-US'` | `'zh-CN'` | 默认语言         |
| `onNodesChange`    | `function`           | -         | 节点变化回调     |
| `onEdgesChange`    | `function`           | -         | 连线变化回调     |
| `onConnect`        | `function`           | -         | 连线连接回调     |
| `onNodeDataChange` | `function`           | -         | 节点数据变化回调 |

### 数据结构

#### WorkflowNode

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
  STOPPED = 10,
}
```

### 工具函数

```typescript
import {
  layoutNodes, // Dagre 自动布局
  detectCycle, // 循环依赖检测
  exportToJSON, // 导出为 JSON
  importFromJSON, // 从 JSON 导入
  generateNodeId, // 生成节点 ID
} from 'power-workflow-next';

// 自动布局
const newNodes = layoutNodes(nodes, edges, { direction: 'horizontal' });

// 循环检测
const cycleError = detectCycle(nodes, edges);

// 导出
const json = exportToJSON(nodes, edges);

// 导入
const { success, data, error } = importFromJSON(jsonString);
```

### 校验器

```typescript
import {
  required,
  minLength,
  maxLength,
  range,
  json,
  condition,
  nodeName,
} from 'power-workflow-next';
```

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建库
npm run build:lib

# 运行测试
npm run test

# 类型检查
npm run typecheck
```

## 项目结构

```
power-workflow-next/
├── src/
│   ├── components/
│   │   ├── WorkflowCanvas/    # 画布主组件
│   │   ├── nodes/             # 节点组件
│   │   ├── edges/             # 连线组件
│   │   ├── panels/            # 编辑面板
│   │   ├── toolbar/           # 工具栏
│   │   └── common/            # 通用组件
│   ├── hooks/                 # 自定义 Hooks
│   ├── stores/                # Zustand 状态管理
│   ├── utils/                 # 工具函数
│   ├── types/                 # TypeScript 类型
│   ├── locales/               # 国际化
│   └── styles/                # 样式文件
├── docs/                      # 文档
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## License

MIT

---

作者：Echo009
