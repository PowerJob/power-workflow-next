# Power-Workflow-Next 实现计划

## 第一章：概述与技术选型

### 1.1 项目概述

**项目名称**：power-workflow-next

**项目目标**：基于 React Flow 重构 PowerJob 工作流可视化组件，替代基于 @antv/g6 的旧版组件。

**核心价值**：
- 视觉升级：扁平简约设计风格
- 技术现代化：React 18 + TypeScript + React Flow 12
- 降低维护成本：利用 React Flow 生态，减少自研代码量
- 独立发布：作为独立 npm 包，支持多项目复用

### 1.2 技术选型

| 技术 | 版本 | 用途 | 选型理由 |
|------|------|------|----------|
| React | 18.x | UI 框架 | 主流选择，生态成熟 |
| React Flow | 12.x | 流程图基础库 | 专注于流程图场景，API 友好，社区活跃 |
| TypeScript | 5.x | 类型系统 | 类型安全，开发体验好 |
| Tailwind CSS | 3.x | 样式方案 | 原子化 CSS，开发效率高，与 React Flow 集成良好 |
| Dagre | 最新版 | 自动布局算法 | 层次布局经典方案，支持有向无环图 |
| Zustand | 4.x | 状态管理 | 轻量级，适合撤销重做等复杂状态场景 |

### 1.3 环境要求

- Node.js >= 18.0.0
- React >= 18.0.0
- 构建工具：Vite（开发）+ Rollup（打包）
- 包管理器：pnpm（推荐）/ npm / yarn

### 1.4 项目目录结构

```
power-workflow-next/
├── src/
│   ├── components/          # 组件目录
│   │   ├── WorkflowCanvas/  # 画布主组件
│   │   ├── nodes/           # 节点组件
│   │   ├── edges/           # 连线组件
│   │   ├── panels/          # 编辑面板
│   │   └── toolbar/         # 工具栏
│   ├── hooks/               # 自定义 Hooks
│   ├── stores/              # 状态管理
│   ├── utils/               # 工具函数
│   ├── types/               # TypeScript 类型定义
│   ├── locales/             # 国际化文案
│   └── index.ts             # 入口文件
├── docs/                    # 文档
├── examples/                # 示例代码
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── vite.config.ts
```

### 1.5 开发阶段总览

| 阶段 | 名称 | 预估工作量 | 核心交付物 |
|------|------|-----------|-----------|
| Phase 1 | 基础框架 | 30% | 可渲染的画布 + 三种节点 + 基础连线 |
| Phase 2 | 节点编辑系统 | 25% | 完整的编辑面板 + 表单校验 |
| Phase 3 | 画布交互增强 | 25% | 自动布局 + 撤销重做 + 右键菜单 |
| Phase 4a | 视图模式核心 | 10% | 状态展示 + 运行动画 + Tooltip |
| Phase 4b | 增强功能 | 5% | 小地图 + 节点搜索 |
| Phase 5 | 文档与发布 | 5% | 文档 + 示例 + npm 发布 |

---

## 第二章：Phase 1 - 基础框架

### 2.1 阶段目标

搭建项目基础架构，实现可运行的画布原型，支持三种节点类型的基础渲染和拖拽连线。

**验收标准**：
- ✅ 项目可启动开发服务器
- ✅ 画布可正常渲染节点和连线
- ✅ 三种节点类型（JOB、DECISION、NESTED_WORKFLOW）正确显示
- ✅ 支持基础拖拽连线功能
- ✅ 支持编辑/查看模式切换
- ✅ 国际化支持（中英文）

### 2.2 任务清单

#### 2.2.1 项目初始化

| 任务 | 说明 | 关键技术点 |
|------|------|-----------|
| 创建项目骨架 | 使用 Vite 创建 React + TypeScript 项目 | 配置 `vite.config.ts` 支持库模式打包 |
| 安装依赖 | React Flow、Tailwind CSS、TypeScript 等 | 注意 React Flow 版本锁定 12.x |
| 配置 Tailwind | 初始化 Tailwind 配置，设置设计系统变量 | 在 `tailwind.config.js` 中定义颜色、圆角等设计 token |
| 配置 TypeScript | 设置严格模式，配置路径别名 | `paths` 配置 `@/` 指向 `src/` |
| 配置 ESLint/Prettier | 统一代码风格 | 使用 `@typescript-eslint` 规则集 |

**注意事项**：
- Tailwind 配置中需预定义 spec.md 中的颜色变量（如 `#F9FAFB`、`#3B82F6` 等）
- Vite 库模式配置需正确设置 `external` 排除 React 等依赖

#### 2.2.2 类型定义

| 任务 | 说明 | 关键技术点 |
|------|------|-----------|
| 定义节点类型 | `WorkflowNode` 接口，包含通用字段和各类型专属字段 | 使用联合类型区分不同节点类型的 data |
| 定义连线类型 | `WorkflowEdge` 接口，包含 property 和 enable 字段 | 继承 React Flow 的 `Edge` 类型 |
| 定义状态枚举 | `NodeStatus`、`NodeType` 等枚举 | 状态码与 spec.md 附录 B 保持一致 |
| 定义组件 Props | `WorkflowNextProps` 主组件属性接口 | 明确必填/可选字段，添加 JSDoc 注释 |

**注意事项**：
- 视图模式扩展字段（instanceId、status 等）需单独定义，仅在 view 模式使用
- 连线的 `property` 字段类型为字符串枚举 `'true' | 'false' | ''`

#### 2.2.3 节点组件开发

| 任务 | 说明 | 关键技术点 |
|------|------|-----------|
| JobNode 组件 | 任务节点，矩形，200×56px（编辑）/ 72px（视图） | 使用 `memo` 优化重渲染 |
| DecisionNode 组件 | 判断节点，菱形，80×80px | CSS `transform: rotate(45deg)` 实现菱形 |
| NestedWorkflowNode 组件 | 嵌套工作流节点，矩形，带特殊图标 | 复用 JobNode 结构，仅图标不同 |
| 节点样式实现 | 背景色、边框、阴影、选中/Hover 状态 | 使用 Tailwind 类名 + CSS 变量 |
| 节点图标 | 齿轮、层叠方块图标（可使用 Lucide React） | 图标尺寸 16px，颜色 `#6B7280` |
| 节点名称 Tooltip | 名称超过 14 字符时，hover 显示完整名称 | 使用 `@radix-ui/react-tooltip`，延迟 0.5 秒，最大宽度 300px |

**注意事项**：
- 菱形节点的锚点位置需特殊处理（四角而非四边中点）
- 节点名称超长截断逻辑：14 字符，超出显示 "..."
- 选中状态使用 `box-shadow` 实现蓝色外边框，不改变节点尺寸
- Tooltip 样式与视图模式执行详情 Tooltip 保持一致

#### 2.2.4 连线组件开发

| 任务 | 说明 | 关键技术点 |
|------|------|-----------|
| 基础连线样式 | smoothstep 曲线，2px，灰色 `#94A3B8` | 使用 React Flow 的 `smoothstep` edge type |
| 分支线样式 | true=绿色，false=红色，带 Y/N 标签 | 自定义 `EdgeLabelRenderer` 渲染标签 |
| 选中状态 | 蓝色加粗，2.5px | 监听 `selected` 属性变化 |
| 箭头 | 6px 填充箭头，与线同色 | 配置 `markerEnd` |

**注意事项**：
- 分支线标签位置在连线中点，需计算曲线中点坐标
- 连线标签字体：12px/500，背景白色带圆角

#### 2.2.5 锚点配置

| 任务 | 说明 | 关键技术点 |
|------|------|-----------|
| 矩形节点锚点 | 上、下、左、右边中点，4 个 | 使用 React Flow 的 `Handle` 组件 |
| 菱形节点锚点 | 上、下、左、右顶点，4 个 | 锚点位置需根据菱形旋转偏移计算 |
| 锚点样式 | 6px 圆形，蓝色 `#3B82F6`，白色 2px 边框 | 始终显示，不随 hover 隐藏 |

**注意事项**：
- 锚点 `id` 需要语义化命名（如 `top`、`bottom`、`left`、`right`）
- 确保锚点可连接性：`isConnectable` 属性根据模式控制

#### 2.2.6 主画布组件

| 任务 | 说明 | 关键技术点 |
|------|------|-----------|
| WorkflowCanvas 组件 | 主入口组件，整合 React Flow | 使用 `ReactFlowProvider` 包裹 |
| 模式切换 | edit/view 模式控制可编辑性 | `nodesDraggable`、`edgesUpdatable` 等属性 |
| 缩放限制 | 最小 25%，最大 200%，默认 100% | 配置 `minZoom`、`maxZoom` |
| 空画布提示 | 中央显示"右键点击添加节点" | 条件渲染，有节点时隐藏 |
| 事件代理 | 转发 React Flow 事件到外部回调 | `onNodesChange`、`onConnect` 等 |

**注意事项**：
- 视图模式下需禁用：节点拖拽、连线编辑、右键菜单
- 画布 `fitView` 需在有节点后自动触发一次

#### 2.2.7 国际化支持

| 任务 | 说明 | 关键技术点 |
|------|------|-----------|
| 创建 locale 文件 | `zh-CN.ts`、`en-US.ts` | 按功能模块组织文案 |
| 实现 i18n 工具 | 简单的 key-value 映射，无需第三方库 | 使用 React Context 传递 locale |
| 应用到组件 | 状态文字、提示文案、菜单项等 | 创建 `useLocale` Hook |

**注意事项**：
- 默认语言为 `zh-CN`
- 文案与 spec.md §10.3 保持一致

#### 2.2.8 单元测试

| 任务 | 说明 | 关键技术点 |
|------|------|-----------|
| 节点渲染测试 | 验证三种节点类型正确渲染 | 使用 React Testing Library |
| 连线渲染测试 | 验证基础连线和分支线样式 | 检查 DOM 结构和样式类 |
| 菱形节点锚点测试 | 验证锚点位置计算正确 | 断言坐标值 |
| 国际化测试 | 验证中英文切换正常 | 切换 locale 后检查文案 |

### 2.3 技术风险

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| React Flow API 变更 | 升级时可能破坏兼容性 | 锁定版本号，关注 changelog |
| 菱形节点锚点定位 | CSS 旋转后坐标计算复杂 | 编写单元测试验证锚点位置 |
| Tailwind 与 React Flow 样式冲突 | 可能出现样式覆盖问题 | 使用 CSS 层级或 scoped 类名 |

### 2.4 里程碑检查点

- ✅ **M1.1**：项目可编译运行，空白画布显示
- ✅ **M1.2**：三种节点可正确渲染
- ✅ **M1.3**：节点可拖拽，锚点可连线
- ✅ **M1.4**：模式切换和国际化完成
- ✅ **M1.5**：节点名称超长 Tooltip 正常显示
- ✅ **M1.6**：基础单元测试通过

---

## 第三章：Phase 2 - 节点编辑系统

### 3.1 阶段目标

实现完整的节点编辑面板，支持三种节点类型的参数配置、实时校验和数据持久化。

**验收标准**：
- ✅ 点击节点打开右侧编辑面板
- ✅ 三种节点类型各有对应的表单字段
- ✅ 字段级校验实时生效
- ✅ 保存时完整校验，有错误禁用保存
- ✅ 警告时弹出确认对话框
- ✅ 支持取消保存和关闭面板
- ✅ JSON 参数编辑器支持语法校验

### 3.2 任务清单

#### 3.2.1 编辑面板容器

| 任务 | 说明 | 关键技术点 |
|------|------|-----------|
| EditorPanel 组件 | 右侧滑入面板，宽度 320px | 使用 `transform` 实现滑入动画，`transition 0.2s ease-in-out` |
| 面板头部 | 图标 + 节点名称 + 关闭按钮 | 背景色 `#F9FAFB`，底部边框 1px `#E5E7EB` |
| 面板内容区 | 可滚动区域，包含表单分组 | 设置 `max-height` 和 `overflow-y: auto` |
| 底部操作栏 | 取消/保存按钮，固定在底部 | `position: sticky` 或 `fixed` 定位 |

**注意事项**：
- 面板打开时画布区域自动收缩，不遮挡节点
- 关闭动画与打开动画对称，提升体验
- 面板 z-index 设为 100，确保在节点上方

#### 3.2.2 表单分组与字段

| 任务 | 说明 | 关键技术点 |
|------|------|-----------|
| FormGroup 组件 | 分组容器，标题 + 字段列表 | 标题字号 13px/500，颜色 `#374151` |
| TextInput 组件 | 文本输入框，支持校验状态 | 高度 36px，圆角 6px |
| NumberInput 组件 | 数字输入框，支持范围限制 | 使用 `type="number"` + min/max 属性 |
| Toggle 组件 | 开关组件，启用/禁用状态 | 自定义样式，不使用浏览器默认 |
| CodeEditor 组件 | JSON 编辑器，语法高亮 | 可集成 Monaco Editor 或 CodeMirror（轻量版） |
| ErrorMessage 组件 | 错误/警告提示文字 | 字号 12px，间距 4px |

**注意事项**：
- 所有输入框聚焦时显示蓝色边框 + 浅蓝色阴影
- 必填字段标签后添加 `*` 标记
- 输入框 `placeholder` 使用国际化文案

#### 3.2.3 各节点类型表单配置

**任务节点（JOB）表单字段**：

| 字段 | 组件类型 | 必填 | 校验规则 |
|------|----------|------|----------|
| 节点名称 | TextInput | 是 | 1-50 字符，支持中英文/数字/下划线/中划线 |
| 任务 ID | NumberInput | 否 | 正整数 |
| 启用节点 | Toggle | 否 | 默认 true |
| 失败跳过 | Toggle | 否 | 默认 false |
| 超时时间 | NumberInput | 否 | 1-3600 秒，>300 警告 |
| 节点参数 | CodeEditor | 否 | JSON 格式校验 |

**判断节点（DECISION）表单字段**：

| 字段 | 组件类型 | 必填 | 校验规则 |
|------|----------|------|----------|
| 节点名称 | TextInput | 是 | 1-50 字符 |
| 启用节点 | Toggle | 否 | 默认 true |
| 判断条件 | TextInput | 是 | 必须包含比较操作符 |

**嵌套工作流节点（NESTED_WORKFLOW）表单字段**：

| 字段 | 组件类型 | 必填 | 校验规则 |
|------|----------|------|----------|
| 节点名称 | TextInput | 是 | 1-50 字符 |
| 目标工作流 | NumberInput | 是 | 正整数 |
| 启用节点 | Toggle | 否 | 默认 true |
| 失败跳过 | Toggle | 否 | 默认 false |
| 传递参数 | CodeEditor | 否 | JSON 格式校验 |

**注意事项**：
- 判断条件字段下方显示提示文字："使用 ${变量} 格式引用上游结果"
- JSON 编辑器高度 200px，显示行号，禁用 minimap

#### 3.2.4 校验系统

| 任务 | 说明 | 关键技术点 |
|------|------|-----------|
| 字段级校验 | 离开输入框时触发，即时反馈 | 使用 `onBlur` 事件 |
| 完整校验 | 点击保存时触发，检查所有字段 | 遍历所有字段执行校验函数 |
| 校验状态管理 | 错误/警告/校验中/有效 | 使用状态枚举，对应不同 UI 样式 |
| 错误汇总 | 保存失败时底部显示所有错误 | 红色背景面板，列表展示 |
| 警告确认 | 仅有警告时弹出确认对话框 | Modal 组件，提供"继续保存"和"取消"选项 |

**校验规则实现**：

```typescript
// 校验规则示例
const validators = {
  required: (value) => !!value || '字段不能为空',
  minLength: (min) => (value) => value.length >= min || `至少需要 ${min} 个字符`,
  maxLength: (max) => (value) => value.length <= max || `不能超过 ${max} 个字符`,
  json: (value) => {
    try { JSON.parse(value); return true; }
    catch { return 'JSON 格式错误'; }
  },
  // 判断条件校验：支持变量引用 + 比较操作符
  condition: (value) => {
    // 支持的操作符：==, !=, >=, <=, >, <, contains, startsWith, endsWith
    const pattern = /\$\{[^}]+\}\s*(==|!=|>=|<=|>|<|contains|startsWith|endsWith)/i;
    return pattern.test(value) || '条件表达式格式错误，必须包含变量引用和比较操作符';
  },
};
```

**注意事项**：
- 校验中状态显示蓝色边框，用于异步校验场景
- 错误优先级高于警告，同时存在时只显示错误
- 校验文案支持国际化

#### 3.2.5 保存机制

| 任务 | 说明 | 关键技术点 |
|------|------|-----------|
| 表单状态管理 | 编辑中的数据与节点数据分离 | 使用临时状态，保存时才同步 |
| 保存流程 | 校验 → 有错误阻止 → 有警告确认 → 保存 | Promise 链式调用处理 |
| 取消流程 | 放弃临时修改，关闭面板 | 直接丢弃临时状态 |
| 点击外部关闭 | 点击面板外区域关闭且不保存 | 监听画布点击事件 |

**保存流程图**：

```
点击保存
    ↓
执行完整校验
    ↓
┌─ 有错误 → 显示错误汇总 → 禁用保存按钮
│
├─ 有警告 → 显示确认对话框
│              ├─ 继续保存 → 执行保存
│              └─ 取消 → 返回编辑
│
└─ 无错误无警告 → 执行保存
                      ↓
              触发 onNodeDataChange
                      ↓
                  关闭面板
```

**注意事项**：
- `onBeforeSave` 回调返回 `false` 时阻止保存，面板保持打开
- 保存成功后触发 `onEditorPanelClose` 事件

#### 3.2.6 Ref API 实现

| 方法 | 说明 | 实现要点 |
|------|------|----------|
| `openEditorPanel(nodeId)` | 打开指定节点的编辑面板 | 设置选中节点，触发面板打开 |
| `closeEditorPanel()` | 关闭编辑面板 | 清除选中节点 |
| `getEditingNode()` | 获取当前编辑的节点 | 返回节点对象或 null |
| `validateEditingNode()` | 校验当前编辑节点 | 返回校验结果对象 |
| `scrollToField(fieldName)` | 滚动到指定字段并聚焦 | 使用 `scrollIntoView` + `focus()` |

**注意事项**：
- 使用 `useImperativeHandle` 暴露方法给父组件
- Ref 类型定义需与 spec.md §11.4.6 保持一致

#### 3.2.7 单元测试

| 任务 | 说明 | 关键技术点 |
|------|------|-----------|
| 字段校验测试 | 验证必填、长度、格式校验规则 | 边界值测试 |
| 判断条件校验测试 | 验证条件表达式校验器 | 测试各种操作符 |
| JSON 格式校验测试 | 验证有效/无效 JSON 的识别 | 测试边界情况 |
| 保存流程测试 | 验证校验 → 确认 → 保存流程 | 模拟用户操作 |

### 3.3 组件交互流程

```
用户点击节点
    ↓
触发 onNodeClick
    ↓
选中节点 + 打开编辑面板
    ↓
加载节点数据到表单
    ↓
用户编辑字段
    ↓
离开字段时触发校验（字段级）
    ↓
用户点击保存
    ↓
执行完整校验
    ↓
┌─ 错误 → 显示错误汇总
├─ 警告 → 确认对话框
└─ 通过 → 保存并关闭
```

### 3.4 样式规格参考

编辑面板样式与 spec.md §4.10 保持一致，关键参数：

- 面板宽度：320px（固定）
- 输入框高度：36px
- 输入框圆角：6px
- 聚焦边框：1px `#3B82F6` + `box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1)`
- 错误边框：`#EF4444`
- 警告边框：`#F59E0B`

### 3.5 里程碑检查点

- **M2.1**：编辑面板容器可正常打开/关闭
- **M2.2**：三种节点类型的表单字段渲染正确
- **M2.3**：字段级校验实时生效
- **M2.4**：保存流程（校验 → 确认 → 保存）完整可用
- **M2.5**：Ref API 可正常调用
- **M2.6**：校验规则单元测试通过

---

## 第四章：Phase 3 - 画布交互增强

### 4.1 阶段目标

实现高级画布交互功能，包括自动布局、撤销重做、右键菜单、快捷键系统和复制粘贴，提升编辑体验。

**验收标准**：
- ✅ 自动布局支持横向/纵向两种方向
- ✅ 撤销重做支持 50 步（可配置）
- ✅ 右键菜单在编辑模式可用
- ✅ 快捷键完整实现（Delete、Ctrl+Z、Ctrl+C/V 等）
- ✅ 多选、复制粘贴功能正常
- ✅ 连线 property 可通过点击切换

### 4.2 任务清单

#### 4.2.1 自动布局

| 任务 | 说明 | 关键技术点 |
|------|------|-----------|
| 集成 Dagre | 安装 dagre 库，实现层次布局 | 使用 `dagre.layout()` 计算节点位置 |
| 横向布局 | 从左到右排列节点 | `rankdir: 'LR'` |
| 纵向布局 | 从上到下排列节点 | `rankdir: 'TB'` |
| 间距配置 | 节点间距 60px，层间距 80px | `nodesep: 60`, `ranksep: 80` |
| 布局动画 | 节点平滑移动到新位置 | 使用 React Flow 的 `fitView` 配合动画 |

**布局计算逻辑**：

```typescript
import dagre from 'dagre';

function layoutNodes(nodes, edges, direction = 'horizontal') {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  dagreGraph.setGraph({
    rankdir: direction === 'horizontal' ? 'LR' : 'TB',
    nodesep: 60,
    ranksep: 80,
  });

  // 添加节点和边到 dagre 图
  nodes.forEach(node => dagreGraph.setNode(node.id, { width: 200, height: 72 }));
  edges.forEach(edge => dagreGraph.setEdge(edge.source, edge.target));

  // 执行布局
  dagre.layout(dagreGraph);

  // 返回新位置
  return nodes.map(node => {
    const dagreNode = dagreGraph.node(node.id);
    return {
      ...node,
      position: { x: dagreNode.x, y: dagreNode.y }
    };
  });
}
```

**注意事项**：
- 布局前需隐藏菱形节点的旋转，布局后恢复
- 空画布时点击布局按钮无反应或提示
- 布局操作支持撤销

#### 4.2.2 撤销重做系统

| 任务 | 说明 | 关键技术点 |
|------|------|-----------|
| 状态快照管理 | 记录每次操作后的完整状态 | 使用数组存储历史快照 |
| undo/redo 逻辑 | 指针移动，切换到对应快照 | 维护 `currentIndex` 指针 |
| 步数限制 | 默认 50 步，超出时删除最旧记录 | 循环数组或截断处理 |
| 撤销范围 | 节点位置、增删节点、增删连线、参数修改、连线属性 | 统一拦截所有变更操作 |

**撤销范围对照**：

| 操作类型 | 支持撤销 | 实现方式 |
|----------|----------|----------|
| 节点位置移动 | ✅ | 监听 `onNodesChange` 的 `position` 变化 |
| 添加/删除节点 | ✅ | 记录 nodes 数组变化 |
| 添加/删除连线 | ✅ | 记录 edges 数组变化 |
| 节点参数修改 | ✅ | 编辑面板保存时记录 |
| 连线属性修改 | ✅ | property 切换时记录 |

**状态管理方案**：

推荐使用 Zustand 实现撤销重做：

```typescript
import { create } from 'zustand';

interface HistoryStore {
  past: WorkflowState[];
  future: WorkflowState[];
  undo: () => void;
  redo: () => void;
  pushState: (state: WorkflowState) => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}
```

**注意事项**：
- 视图模式禁用撤销重做
- 快照记录需做深拷贝，避免引用问题
- 连续的小位移可合并为一次撤销记录（防抖处理）

#### 4.2.3 右键菜单

| 任务 | 说明 | 关键技术点 |
|------|------|-----------|
| ContextMenu 组件 | 右键弹出的菜单列表 | `position: fixed`，坐标跟随鼠标 |
| 菜单项配置 | 添加任务/判断/嵌套节点、粘贴 | 根据点击位置（画布/节点）显示不同菜单 |
| 菜单样式 | 白色背景，圆角 6px，阴影 | Hover 背景色 `#F3F4F6` |
| 点击外部关闭 | 点击菜单外区域关闭 | 监听 `mousedown` 事件 |

**画布右键菜单项**：

| 菜单项 | 图标 | 行为 |
|--------|------|------|
| 添加任务节点 | ⚙️ | 在点击位置添加 JOB 节点 |
| 添加判断节点 | ◆ | 在点击位置添加 DECISION 节点 |
| 添加嵌套工作流 | ▣ | 在点击位置添加 NESTED_WORKFLOW 节点 |
| 粘贴 | 📋 | 粘贴剪贴板中的节点（有内容时显示） |

**注意事项**：
- 视图模式下右键菜单禁用
- 菜单项需支持国际化
- 键盘 Escape 可关闭菜单

#### 4.2.4 快捷键系统

| 任务 | 说明 | 关键技术点 |
|------|------|-----------|
| 快捷键注册 | 监听键盘事件，匹配快捷键组合 | 使用 `useEffect` + `keydown` 事件 |
| 快捷键映射 | 配置快捷键与动作的对应关系 | Map 或对象存储映射表 |
| 阻止默认行为 | 阻止浏览器默认行为（如 Ctrl+S 保存页面） | `event.preventDefault()` |
| 作用域控制 | 编辑面板打开时部分快捷键禁用 | 根据状态动态启用/禁用 |

**快捷键映射表**：

| 快捷键 | 功能 | 编辑面板打开时 | 实现要点 |
|--------|------|---------------|----------|
| Delete / Backspace | 删除选中元素 | ✅ | 检查是否有选中元素 |
| Ctrl/Cmd + Z | 撤销 | ✅ | 调用 `undo()` |
| Ctrl/Cmd + Shift + Z | 重做 | ✅ | 调用 `redo()` |
| Ctrl/Cmd + C | 复制节点 | ✅ | 仅节点可复制 |
| Ctrl/Cmd + V | 粘贴节点 | ✅ | 调用粘贴逻辑 |
| Ctrl/Cmd + A | 全选 | ✅ | 选中所有节点和连线 |
| Ctrl/Cmd + D | 快速复制 | ✅ | 复制并粘贴选中节点 |
| Escape | 关闭编辑面板 | ✅ | 调用 `closeEditorPanel()` |

**注意事项**：
- Mac 使用 `metaKey`，Windows 使用 `ctrlKey`
- 输入框聚焦时禁用快捷键（避免与输入冲突）
- 快捷键可配置：提供 `shortcuts` prop 允许覆盖默认配置

#### 4.2.5 多选与复制粘贴

| 任务 | 说明 | 关键技术点 |
|------|------|-----------|
| 多选实现 | Ctrl+点击追加选中 | React Flow 内置支持 `selectionMode` |
| 全选 | Ctrl+A 选中所有元素 | 使用 `setSelectedNodes` + `setSelectedEdges` |
| 复制逻辑 | 复制节点数据到内部剪贴板 | 深拷贝节点数据 |
| 粘贴逻辑 | 在偏移位置 (+20px, +20px) 创建新节点 | 生成新 ID，保持相对位置关系 |
| 连线复制 | 两端节点都被选中时复制连线 | 过滤 edges，仅保留两端都在选中集合中的边 |

**复制粘贴流程**：

```
用户选中节点
    ↓
Ctrl+C
    ↓
深拷贝选中节点到内部状态
同时复制选中节点之间的连线
    ↓
Ctrl+V
    ↓
生成新节点（新 ID，位置偏移 +20px）
生成新连线（关联新节点 ID）
    ↓
选中新节点（方便继续操作）
```

**注意事项**：
- 不支持框选（拖拽选择区域），拖拽空白区域始终为平移画布
- 粘贴后自动选中新节点
- 剪贴板不跨组件实例共享

#### 4.2.6 连线 Property 切换

| 任务 | 说明 | 关键技术点 |
|------|------|-----------|
| 点击选中连线 | 点击连线本身选中，不触发切换 | React Flow 的 `onEdgeClick` 事件 |
| 点击标签切换 | 点击 Y/N 标签或中点交互区域切换 | 自定义 EdgeLabel 组件 |
| 循环切换逻辑 | '' → 'true' → 'false' → '' | 使用状态机或条件判断 |
| 视觉反馈 | 灰色无标签 → 绿色 Y → 红色 N | 同时更新颜色和标签 |

**切换状态机**：

```
     点击                点击                点击
  ┌──────→ 'true' ──────→ 'false' ──────→ ''
  │          (绿色 Y)        (红色 N)       (灰色无标签)
  │                                              │
  └──────────────────────────────────────────────┘
```

**注意事项**：
- 无标签时，连线中点显示可点击的 `+` 或 `○` 图标
- 切换操作支持撤销
- 视图模式下禁用切换

#### 4.2.7 工作流级校验触发

| 任务 | 说明 | 关键技术点 |
|------|------|-----------|
| 循环依赖检测 | 检测工作流中是否存在闭环 | 使用 DFS 或拓扑排序算法 |
| 判断节点出口检测 | 检测判断节点是否缺少出口连线 | 遍历节点检查边的存在性 |
| 触发时机 | `getData()` / `exportToJSON()` 调用时执行 | 在方法返回前执行校验 |
| 校验反馈 | Toast 提示校验失败信息 | 使用 toast 组件展示 |

**循环依赖检测算法**：

```typescript
function detectCycle(nodes: Node[], edges: Edge[]): string | null {
  const graph = new Map<string, string[]>();

  // 构建邻接表
  edges.forEach(edge => {
    if (!graph.has(edge.source)) graph.set(edge.source, []);
    graph.get(edge.source)!.push(edge.target);
  });

  // DFS 检测环
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function dfs(nodeId: string): boolean {
    visited.add(nodeId);
    recursionStack.add(nodeId);

    const neighbors = graph.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) return true;
      } else if (recursionStack.has(neighbor)) {
        return true; // 发现环
      }
    }

    recursionStack.delete(nodeId);
    return false;
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      if (dfs(node.id)) {
        return '工作流中存在循环依赖，请检查连线';
      }
    }
  }

  return null;
}
```

**注意事项**：
- 校验失败时仍返回数据，但同时触发 `onValidationError` 回调
- 孤立节点不校验，允许存在

#### 4.2.8 导入导出错误处理

| 任务 | 说明 | 关键技术点 |
|------|------|-----------|
| 导入格式校验 | 校验 JSON 格式和数据结构 | try-catch + schema 校验 |
| 版本兼容检查 | 检查导入数据的版本兼容性 | 比较 version 字段 |
| 导入确认弹窗 | 导入前显示二次确认 | Modal 组件，提示"将覆盖当前画布" |
| 错误提示 | 导入失败时显示具体错误 | Toast 提示错误原因 |

**导入校验流程**：

```
选择文件
    ↓
读取 JSON 内容
    ↓
┌─ JSON 解析失败 → Toast: "JSON 格式错误：{详情}"
│
├─ 数据结构校验失败 → Toast: "数据格式不兼容"
│
├─ 版本不兼容 → Toast: "数据版本不兼容，当前支持 v{x}"
│
└─ 校验通过 → 显示确认弹窗
                    ↓
              用户确认 → 覆盖当前画布
              用户取消 → 保持不变
```

**注意事项**：
- 导出时自动添加版本号字段：`{ version: '1.0', nodes: [...], edges: [...] }`
- 导入时需校验 nodes 和 edges 数组的基本结构

#### 4.2.9 单元测试

| 任务 | 说明 | 关键技术点 |
|------|------|-----------|
| 撤销重做测试 | 验证 50 步限制、连续操作 | 边界值测试 |
| 循环依赖检测测试 | 验证各种环路的检测 | 单环、多环、自环 |
| 判断节点出口检测测试 | 验证无出口检测 | 各种节点组合 |
| 导入导出测试 | 验证格式校验、版本检查 | 正常/异常数据 |

### 4.3 工具栏实现

| 按钮 | 功能 | 实现要点 |
|------|------|----------|
| 撤销 | 调用 `undo()` | 禁用状态：`canUndo() === false` |
| 重做 | 调用 `redo()` | 禁用状态：`canRedo() === false` |
| 自动布局 | 下拉菜单选择方向 | 菜单：横向布局/纵向布局 |
| 适应视图 | 调用 `fitView()` | 显示所有节点 |
| 缩小 | 调用 `zoomOut()` | 不低于最小缩放 |
| 缩放显示 | 点击重置 100% | 显示当前百分比 |
| 放大 | 调用 `zoomIn()` | 不超过最大缩放 |
| 添加节点 | 下拉菜单选择类型 | 菜单：三种节点类型 |
| 导出 JSON | 下载 `.json` 文件 | 使用 `URL.createObjectURL` |
| 导入 JSON | 文件选择器 + 二次确认 | 使用 `<input type="file">` |

**工具栏样式规格**（与 spec.md §7.4 一致）：

- 工具栏高度：48px
- 按钮高度：32px
- 按钮内边距：0 10px
- 圆角：6px
- 分隔线：1px `#E5E7EB`，高度 20px

### 4.4 事件回调实现

| 事件 | 触发时机 | 参数 |
|------|----------|------|
| `onNodesChange` | 节点变化时 | `(changes, nodes)` |
| `onEdgesChange` | 连线变化时 | `(changes, edges)` |
| `onConnect` | 创建新连线时 | `(connection)` |
| `onEdgeClick` | 点击连线时 | `(event, edge)` |
| `onSelectionChange` | 选中状态变化时 | `({ nodes, edges })` |

**注意事项**：
- 所有事件回调需支持可选配置
- 回调函数参数类型需与 spec.md §11.5 保持一致

### 4.5 里程碑检查点

- **M3.1**：自动布局（横向/纵向）正常工作
- **M3.2**：撤销重做完整可用
- **M3.3**：右键菜单正常显示和操作
- **M3.4**：所有快捷键正常响应
- **M3.5**：复制粘贴（含多选）正常工作
- **M3.6**：连线 property 切换功能完成
- **M3.7**：工具栏所有按钮可用
- **M3.8**：工作流级校验（循环依赖、出口检测）正常触发
- **M3.9**：导入导出错误处理完整
- **M3.10**：Phase 3 单元测试通过

---

## 第五章：Phase 4a - 视图模式核心功能

### 5.1 阶段目标

实现视图模式的核心功能，包括运行状态展示、运行动画和执行详情 Tooltip。

**验收标准**：
- ✅ 视图模式正确展示节点状态（颜色、图标）
- ✅ 运行中节点显示呼吸动画
- ✅ 悬停节点显示执行详情 Tooltip
- ✅ 视图模式工具栏仅显示视图控制按钮

### 5.2 任务清单

#### 5.2.1 视图模式节点状态展示

| 任务 | 说明 | 关键技术点 |
|------|------|-----------|
| 状态颜色映射 | 根据状态码显示不同背景色和边框色 | 使用 CSS 变量或 Tailwind 动态类 |
| 状态图标 | 节点底部显示状态指示点（●） | 颜色与状态一致 |
| 状态文字 | 显示状态文字（等待中/运行中/成功/失败/已停止） | 国际化文案 |
| 实例 ID 显示 | 视图模式节点显示实例 ID | 格式：`实例:10001` |

**状态颜色对照表**：

| 状态 | Code | 背景色 | 边框色 | 文字颜色 |
|------|------|--------|--------|----------|
| 等待中 | 1 | `#FFF7E6` | `#FFA940` | `#FFA940` |
| 运行中 | 3 | `#E6F7FF` | `#1890FF` | `#1890FF` |
| 失败 | 4 | `#FFF1F0` | `#FF4D4F` | `#FF4D4F` |
| 成功 | 5 | `#F6FFED` | `#52C41A` | `#52C41A` |
| 已停止 | 10 | `#F0F0F0` | `#8C8C8C` | `#8C8C8C` |

**视图模式节点布局**（高度 72px）：

```
┌─────────────────────────────┐
│ ⚙️ 数据清洗任务              │  ← 图标 + 节点名称
│ #5001           实例:10001  │  ← 任务ID / 实例ID
│ ● 成功                      │  ← 状态指示
└─────────────────────────────┘
```

**注意事项**：
- 状态码与实例状态码不同，参考 spec.md 附录 B
- 无状态数据时（status 为空），使用默认样式

#### 5.2.2 运行状态动画

| 任务 | 说明 | 关键技术点 |
|------|------|-----------|
| 呼吸动画 | 运行中节点边框颜色渐变 | CSS `@keyframes` + `animation` |
| 颜色变化 | `#3B82F6` ↔ `#93C5FD` | 使用 `from/to` 定义起始和结束颜色 |
| 动画周期 | 2 秒，ease-in-out | `animation: breathing 2s ease-in-out infinite` |
| 动画控制 | 仅 status=3（运行中）时启用 | 条件添加 animation 类名 |

**CSS 动画定义**：

```css
@keyframes breathing {
  0%, 100% {
    border-color: #3B82F6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
  }
  50% {
    border-color: #93C5FD;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5);
  }
}

.node-running {
  animation: breathing 2s ease-in-out infinite;
}
```

**注意事项**：
- 使用 `will-change: border-color, box-shadow` 优化性能
- 节点数量较多时考虑减少动画复杂度
- 用户偏好 `prefers-reduced-motion` 时禁用动画

#### 5.2.3 视图模式 Tooltip

| 任务 | 说明 | 关键技术点 |
|------|------|-----------|
| Tooltip 组件 | 悬停显示执行详情 | 使用 `@radix-ui/react-tooltip` 或自实现 |
| 显示内容 | 时长、开始时间、结束时间、错误信息 | 根据数据动态渲染 |
| 显示延迟 | 0.5 秒后显示 | `delayDuration: 500` |
| 最大宽度 | 300px | 固定宽度，文字换行 |

**Tooltip 内容布局**：

```
┌─────────────────────────────┐
│ 时长: 2分35秒               │
│ 开始: 2024-01-01 02:00:00   │
│ 结束: 2024-01-01 02:02:35   │
│ ❌ 失败: 连接超时            │  ← 仅失败时显示
└─────────────────────────────┘
```

**字段格式化**：

| 字段 | 格式 | 示例 |
|------|------|------|
| 时长 | 毫秒转为 X分X秒 | 155000 → "2分35秒" |
| 开始时间 | YYYY-MM-DD HH:mm:ss | "2024-01-01 02:00:00" |
| 结束时间 | YYYY-MM-DD HH:mm:ss | "2024-01-01 02:02:35" |
| 错误信息 | 原样显示，截断超长 | "连接超时..." |

**注意事项**：
- 无状态数据时不显示 Tooltip
- Tooltip 位置自动调整，避免超出视口
- 错误信息过长时截断并显示省略号

#### 5.2.4 视图模式工具栏

视图模式下工具栏仅保留视图控制按钮：

| 显示 | 隐藏 |
|------|------|
| 适应视图 | 撤销/重做 |
| 缩放控制（- / 100% / +） | 自动布局 |
| 搜索框（Phase 4b） | 添加节点 |
| 小地图开关（可选，Phase 4b） | 导入/导出 |

**条件渲染逻辑**：

```tsx
{mode === 'edit' && (
  <>
    <ToolbarButton icon="↩" onClick={undo} disabled={!canUndo()} />
    <ToolbarButton icon="↪" onClick={redo} disabled={!canRedo()} />
    <ToolbarDivider />
    <LayoutDropdown />
  </>
)}

{/* 两种模式都显示 */}
<ToolbarButton icon="⊡" onClick={fitView} />
<ZoomControl />
```

### 5.3 状态刷新机制

组件不内置轮询，由外部控制刷新：

```tsx
// 外部使用示例
const [nodes, setNodes] = useState(initialNodes);

useEffect(() => {
  if (mode !== 'view') return;

  const timer = setInterval(async () => {
    const latestNodes = await fetchNodeStatuses(instanceId);
    setNodes(latestNodes);
  }, 3000);

  return () => clearInterval(timer);
}, [mode, instanceId]);

<WorkflowNext mode="view" nodes={nodes} edges={edges} />
```

**组件职责**：
- `nodes` prop 更新时自动 diff 并更新节点状态
- 状态变化时更新颜色、动画等视觉效果
- 不提供刷新按钮，由外部实现

### 5.4 视图模式事件

| 事件 | 触发时机 | 参数 |
|------|----------|------|
| `onNodeClick` | 点击节点时 | `(event, node)` |
| `onNodeDoubleClick` | 双击节点时 | `(event, node)` |
| `onSelectionChange` | 选中状态变化时 | `({ nodes, edges })` |

**视图模式点击跳转示例**：

```tsx
// 点击节点跳转到实例详情页
const handleNodeClick = (event: React.MouseEvent, node: Node) => {
  if (mode === 'view' && node.data.instanceId) {
    // 跳转到实例详情页
    navigate(`/instance/${node.data.instanceId}`);
  }
};

<WorkflowNext
  mode="view"
  nodes={nodes}
  edges={edges}
  onNodeClick={handleNodeClick}
/>
```

**注意事项**：
- 视图模式点击节点不打开编辑面板
- 可通过 `onNodeClick` 回调跳转到实例详情页

### 5.5 性能优化

| 优化项 | 方法 |
|--------|------|
| 动画性能 | 使用 `transform` 和 `opacity`，避免 `width`/`height` 动画 |
| 大量节点 | 虚拟化渲染（React Flow 内置支持） |
| 频繁更新 | 使用 `memo` 和 `useMemo` 减少重渲染 |
| 状态 diff | 仅更新变化的节点，避免全量重渲染 |

### 5.6 里程碑检查点

- **M4a.1**：视图模式节点状态正确显示
- **M4a.2**：运行中节点呼吸动画正常
- **M4a.3**：Tooltip 悬停显示正确
- **M4a.4**：视图模式工具栏按钮正确

---

## 第六章：Phase 4b - 增强功能

### 6.1 阶段目标

实现画布增强功能，包括小地图导航和节点搜索筛选。

**验收标准**：
- ✅ 小地图可正常导航
- ✅ 节点搜索/筛选功能可用
- ✅ 搜索结果高亮并支持定位

### 6.2 任务清单

#### 6.2.1 小地图（Minimap）

| 任务 | 说明 | 关键技术点 |
|------|------|-----------|
| 集成 React Flow Minimap | 使用内置 `<MiniMap />` 组件 | 放置在画布右下角 |
| 节点颜色 | 根据节点类型或状态显示不同颜色 | 使用 `nodeColor` 属性 |
| 尺寸配置 | 默认 200×150px | 通过 `style` 属性设置 |
| 交互 | 点击跳转，拖拽视口平移 | React Flow 内置支持 |

**Minimap 配置**：

```tsx
<MiniMap
  nodeColor={(node) => {
    switch (node.data.status) {
      case 5: return '#52C41A'; // 成功 - 绿色
      case 4: return '#FF4D4F'; // 失败 - 红色
      case 3: return '#1890FF'; // 运行中 - 蓝色
      case 1: return '#FFA940'; // 等待中 - 橙色
      default: return '#E5E7EB'; // 默认 - 灰色
    }
  }}
  style={{
    width: 200,
    height: 150,
    backgroundColor: '#F9FAFB',
  }}
  maskColor="rgba(0, 0, 0, 0.1)"
/>
```

**注意事项**：
- 小地图可通过配置项禁用
- 节点少于 3 个时可不显示小地图（优化体验）
- 小地图位置可通过 CSS 调整

#### 6.2.2 节点搜索/筛选

| 任务 | 说明 | 关键技术点 |
|------|------|-----------|
| 搜索输入框 | 工具栏中的搜索框 | 实时搜索，无需按回车 |
| 搜索范围 | 节点名称、任务 ID、实例 ID | 支持模糊匹配 |
| 高亮匹配 | 匹配的节点高亮显示 | 添加高亮边框或背景色 |
| 定位功能 | 点击搜索结果跳转到对应节点 | 调用 `setViewport` 或 `fitView` |
| 筛选面板 | 可选：按状态筛选节点 | 下拉菜单或标签页 |

**搜索实现**：

```typescript
function searchNodes(nodes: Node[], query: string): Node[] {
  const lowerQuery = query.toLowerCase();
  return nodes.filter(node => {
    const name = node.data.nodeName?.toLowerCase() || '';
    const jobId = String(node.data.jobId || '');
    const instanceId = String(node.data.instanceId || '');

    return name.includes(lowerQuery)
      || jobId.includes(lowerQuery)
      || instanceId.includes(lowerQuery);
  });
}
```

**高亮与定位实现**：

```typescript
// 高亮匹配节点
const highlightNodes = (nodes: Node[], matchedIds: Set<string>): Node[] => {
  return nodes.map(node => ({
    ...node,
    className: matchedIds.has(node.id) ? 'node-highlighted' : 'node-dimmed',
  }));
};

// 定位到指定节点
const locateNode = (nodeId: string) => {
  const node = nodes.find(n => n.id === nodeId);
  if (node) {
    setViewport({
      x: -node.position.x + width / 2,
      y: -node.position.y + height / 2,
      zoom: 1,
    });
  }
};
```

**注意事项**：
- 搜索框在工具栏的"缩放控制"右侧
- 无匹配结果时显示提示"未找到匹配节点"
- 清空搜索框恢复所有节点显示
- 高亮样式：边框变为蓝色 `#3B82F6`，非匹配节点降低透明度

### 6.3 里程碑检查点

- **M4b.1**：小地图正常工作
- **M4b.2**：节点搜索/筛选功能完成
- **M4b.3**：搜索结果高亮与定位正常

---

## 第七章：Phase 5 - 文档与发布

### 7.1 阶段目标

完成项目文档、示例代码编写，并通过 npm 发布正式版本。

**验收标准**：
- ✅ README 文档完整清晰
- ✅ API 文档覆盖所有公开接口
- ✅ 至少一个在线可运行的示例
- ✅ TypeScript 类型定义正确导出
- ✅ npm 包可正常安装和使用
- ✅ CHANGELOG 记录版本变更

### 7.2 任务清单

#### 7.2.1 README 文档

| 任务 | 说明 | 关键内容 |
|------|------|----------|
| 项目介绍 | 简介、特性、截图/动图 | 突出与旧版的区别和优势 |
| 快速开始 | 安装、基础用法示例 | 代码块可直接复制运行 |
| API 概览 | 主要 Props、方法、事件 | 表格形式，链接到详细文档 |
| 开发指南 | 本地开发、构建、测试命令 | 贡献者必读 |

**README 结构**：

```markdown
# power-workflow-next

## 简介
一句话介绍 + 特性列表

## 安装
npm install power-workflow-next

## 快速开始
基础示例代码（编辑模式 + 视图模式）

## 截图/演示
GIF 动图展示核心功能

## API 文档
链接到详细 API 文档

## 本地开发
git clone、npm install、npm run dev

## License
MIT
```

**注意事项**：
- 使用中文撰写（主要用户在国内）
- 提供英文版 README.en.md（可选）
- 截图/动图需展示真实效果，避免过度美化

#### 7.2.2 API 文档

| 任务 | 说明 | 关键内容 |
|------|------|----------|
| Props 文档 | 所有配置项的类型、默认值、说明 | 与 spec.md §11.1 保持一致 |
| 节点数据结构 | `WorkflowNode` 字段详解 | 区分通用字段和专属字段 |
| 连线数据结构 | `WorkflowEdge` 字段详解 | 说明 `property` 字段用法 |
| Ref API | 所有方法的签名和用法示例 | 与 spec.md §11.4 保持一致 |
| 事件回调 | 所有事件的触发时机和参数 | 与 spec.md §11.5 保持一致 |
| 类型定义导出 | 导出所有公开类型 | 方便用户 TypeScript 使用 |

**API 文档结构**：

```markdown
# API 文档

## 组件 Props

### 基础配置
| 属性 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|

### 布局配置
...

## 数据结构

### WorkflowNode
...

### WorkflowEdge
...

## Ref API
...

## 事件回调
...

## 类型定义
...
```

**注意事项**：
- 使用 TypeDoc 自动生成类型文档（可选）
- 每个属性提供使用示例
- 复杂类型提供完整 TypeScript 定义

#### 7.2.3 示例代码

| 任务 | 说明 | 关键内容 |
|------|------|----------|
| 基础示例 | 最小化可用示例 | 编辑模式 + 基础节点 |
| 视图模式示例 | 展示状态和动画 | 模拟数据 + 定时刷新 |
| 完整示例 | 所有功能集成 | 工具栏 + 编辑面板 + 撤销重做 |
| 在线演示 | CodeSandbox 或 StackBlitz | 一键运行，无需本地环境 |

**示例目录结构**：

```
examples/
├── basic/                 # 基础示例
│   ├── index.tsx
│   └── README.md
├── view-mode/             # 视图模式示例
│   ├── index.tsx
│   └── README.md
└── full-featured/         # 完整功能示例
    ├── index.tsx
    └── README.md
```

**注意事项**：
- 示例代码需可直接运行
- 使用注释说明关键步骤
- 在线演示需定期维护，确保可用

#### 7.2.4 TypeScript 类型定义

| 任务 | 说明 | 关键技术点 |
|------|------|-----------|
| 类型定义文件 | 生成 `.d.ts` 文件 | `tsc --declaration` |
| 类型导出 | 在 `index.ts` 中导出所有公开类型 | `export type { ... }` |
| 类型测试 | 使用 `tsd` 测试类型正确性 | 确保类型推断准确 |

**需要导出的类型**：

```typescript
// 组件 Props
export type { WorkflowNextProps, EditorPanelConfig };

// 数据类型
export type { WorkflowNode, WorkflowEdge, NodeType, NodeStatus };

// 事件类型
export type {
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  OnNodeClick,
  OnNodeDataChange,
  OnBeforeSave,
  // ...
};

// Ref 类型
export type { WorkflowNextRef };
```

**注意事项**：
- 内部类型（如组件内部状态）不导出
- 类型注释使用 JSDoc 格式
- 确保 `package.json` 中 `types` 字段正确指向类型文件

#### 7.2.5 构建配置

| 任务 | 说明 | 关键配置 |
|------|------|----------|
| 库模式构建 | 使用 Rollup 或 Vite 库模式 | 输出 ESM + CJS 两种格式 |
| 外部化依赖 | React、React Flow 等不打包 | 配置 `external` 选项 |
| CSS 处理 | 打包或提取样式文件 | 考虑用户是否需要导入 CSS |
| 压缩优化 | 生产环境压缩代码 | 去除 console、注释等 |

**Vite 库模式配置示例**：

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'PowerWorkflowNext',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'mjs' : 'js'}`,
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'reactflow'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          reactflow: 'ReactFlow',
        },
      },
    },
  },
});
```

**package.json 关键字段**：

```json
{
  "name": "power-workflow-next",
  "version": "1.0.0",
  "main": "dist/index.js",
  "module": "dist/index.mjs",
  "types": "dist/index.d.ts",
  "files": ["dist"],
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./style.css": "./dist/style.css"
  },
  "peerDependencies": {
    "react": ">=18.0.0",
    "react-dom": ">=18.0.0"
  }
}
```

#### 7.2.6 npm 发布

| 任务 | 说明 | 关键步骤 |
|------|------|----------|
| 版本号管理 | 使用语义化版本 | `npm version major/minor/patch` |
| 发布前检查 | 确保 build 和 test 通过 | `npm run prepublishOnly` |
| npm 发布 | 发布到 npm registry | `npm publish` |
| 发布验证 | 安装测试 | 新项目 `npm install power-workflow-next` |

**发布流程**：

```
1. 更新 CHANGELOG.md
       ↓
2. 更新版本号: npm version patch/minor/major
       ↓
3. 构建: npm run build
       ↓
4. 测试: npm test
       ↓
5. 发布: npm publish
       ↓
6. 验证: 新项目安装测试
       ↓
7. 创建 Git Tag: git tag v1.0.0
```

**注意事项**：
- 首次发布需 `npm login`
- 预发布版本使用 `-beta.1` 等后缀
- 发布后更新 GitHub Release

#### 7.2.7 CHANGELOG

| 任务 | 说明 | 格式要求 |
|------|------|----------|
| 版本记录 | 每个版本的变更记录 | 遵循 [Keep a Changelog](https://keepachangelog.com/) 格式 |
| 变更分类 | Added / Changed / Deprecated / Removed / Fixed / Security | 使用标准分类标签 |

**CHANGELOG 格式**：

```markdown
# Changelog

## [1.0.0] - 2024-01-01

### Added
- 初始版本发布
- 支持三种节点类型（JOB、DECISION、NESTED_WORKFLOW）
- 支持编辑和查看两种模式
- 支持自动布局（横向/纵向）
- 支持撤销/重做（默认 50 步）
- 支持右键菜单和快捷键
- 支持复制/粘贴节点
- 支持国际化（中英文）
- 支持小地图和节点搜索

### Changed
- 从 @antv/g6 迁移到 React Flow

### Notes
- 不兼容旧版 power-workflow API
```

### 7.3 交付物清单

| 交付物 | 文件/位置 | 状态 |
|--------|-----------|------|
| npm 包源码 | `src/` | ⬜ |
| TypeScript 类型定义 | `dist/index.d.ts` | ⬜ |
| README 文档 | `README.md` | ⬜ |
| API 文档 | `docs/api.md` | ⬜ |
| 示例代码 | `examples/` | ⬜ |
| 在线演示 | CodeSandbox 链接 | ⬜ |
| CHANGELOG | `CHANGELOG.md` | ⬜ |

### 7.4 发布后维护

| 任务 | 说明 |
|------|------|
| Issue 跟踪 | GitHub Issues 管理用户反馈 |
| 版本迭代 | 根据反馈发布补丁版本 |
| 文档更新 | 持续完善文档和示例 |
| 依赖更新 | 定期更新依赖版本，修复安全漏洞 |

### 7.5 里程碑检查点

- **M5.1**：README 文档完成
- **M5.2**：API 文档完成
- **M5.3**：示例代码完成
- **M5.4**：类型定义正确导出
- **M5.5**：构建产物测试通过
- **M5.6**：npm 发布成功
- **M5.7**：在线演示可用

---

## 附录

### A. 开发环境配置

```bash
# 克隆项目
git clone https://github.com/xxx/power-workflow-next.git

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 运行测试
pnpm test

# 构建
pnpm build

# 发布
pnpm publish
```

### B. 技术栈版本锁定

| 依赖 | 版本 | 说明 |
|------|------|------|
| react | ^18.2.0 | UI 框架 |
| react-dom | ^18.2.0 | DOM 渲染 |
| reactflow | ^12.0.0 | 流程图基础库 |
| typescript | ^5.0.0 | 类型系统 |
| tailwindcss | ^3.4.0 | 样式方案 |
| dagre | ^0.8.5 | 自动布局 |
| zustand | ^4.5.0 | 状态管理 |
| vite | ^5.0.0 | 构建工具 |

### C. 参考资料

- [React Flow 官方文档](https://reactflow.dev/)
- [React Flow 示例库](https://reactflow.dev/examples/)
- [Dagre 布局算法](https://github.com/dagrejs/dagre)
- [n8n 工作流设计](https://n8n.io/)
- [语义化版本规范](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
