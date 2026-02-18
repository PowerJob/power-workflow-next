# power-workflow-next

基于 React Flow 的 PowerJob 工作流可视化组件，用于替代基于 @antv/g6 的旧版工作流编辑器。

## 特性

- **三种节点类型**：任务节点（JOB）、判断节点（DECISION）、嵌套工作流节点（NESTED_WORKFLOW）
- **画布能力**：拖拽节点、连线、编辑/查看模式切换、缩放限制（25%–200%）
- **连线样式**：基础灰色连线、分支线（true/false 绿色/红色 + Y/N 标签）、选中高亮
- **国际化**：中英文（zh-CN / en-US），默认中文
- **技术栈**：React 18、TypeScript 5、Vite 7、@xyflow/react 12、Tailwind CSS 3

## 环境要求

- Node.js >= 18.0.0
- npm / pnpm / yarn

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建
npm run build

# 预览构建产物
npm run preview
```

## 脚本说明

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动 Vite 开发服务器 |
| `npm run build` | TypeScript 检查 + Vite 生产构建 |
| `npm run preview` | 本地预览 dist 产物 |
| `npm run lint` | 运行 ESLint |
| `npx vitest run` | 运行 Vitest 单元测试 |

## 项目结构

```
power-workflow-next/
├── src/
│   ├── components/       # 组件
│   │   ├── WorkflowCanvas/  # 画布主组件
│   │   ├── nodes/           # 节点（Job / Decision / NestedWorkflow）
│   │   └── edges/            # 自定义连线
│   ├── contexts/         # React Context（如国际化）
│   ├── hooks/             # 自定义 Hooks
│   ├── types/             # TypeScript 类型
│   ├── locales/           # 国际化文案（zh-CN、en-US）
│   ├── App.tsx             # 示例入口
│   └── main.tsx
├── docs/                  # 文档（实现计划、规格说明）
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## 使用示例

在应用中使用画布组件（需自行管理 `nodes` / `edges` 状态）：

```tsx
import { addEdge, useNodesState, useEdgesState } from '@xyflow/react';
import WorkflowCanvas from './components/WorkflowCanvas';
import { NodeType } from './types/workflow';

const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
const onConnect = (params) => setEdges((eds) => addEdge(params, eds));

<WorkflowCanvas
  nodes={nodes}
  edges={edges}
  onNodesChange={onNodesChange}
  onEdgesChange={onEdgesChange}
  onConnect={onConnect}
  mode="edit"
  defaultLocale="zh-CN"
/>
```

## 开发计划

详见 [docs/plan.md](docs/plan.md)。当前已完成 **Phase 1 - 基础框架**；后续阶段包括节点编辑面板、自动布局、撤销重做、视图模式、小地图与发布等。

## License

MIT

---

作者：Echo009
