# 节点连线自动吸附回归测试说明

本目录用于保存“节点连线自动吸附”功能的专项回归脚本与测试产物。

## 当前目录结构

- `regression-test-final.mjs` — 唯一回归入口脚本（自动执行 4 个关键场景）
- `test-screenshots/` — 回归过程截图（脚本执行时自动生成）

## 使用方式

1. 启动 playground（默认 `http://127.0.0.1:5173`）：

```bash
npm run dev
```

2. 新开终端执行回归脚本（二选一）：

```bash
npm run regression:connection-snap
```

或：

```bash
node playground/regression/connection-snap/regression-test-final.mjs
```

## 验证目标（对应本次改造）

- 从 source 锚点拖到目标节点主体（非锚点）可创建连线
- 拖到空白区域不创建连线
- DECISION 节点最多 2 条出边限制生效
- 横向/纵向布局下锚点吸附符合预期（方向优先，必要时相对位置兜底）

## 备注

- 已移除重复/历史脚本，仅保留一个最终版本。
- 快捷命令：`npm run regression:connection-snap`。
