/**
 * Mock 数据文件 - 包含各种测试场景
 * 与源码完全隔离
 */
import { NodeType, NodeStatus, WorkflowNode, WorkflowEdge } from '../../src/types/workflow';

/**
 * 场景1: 基础工作流 - 简单的 JOB 节点流程
 */
export const basicWorkflow = {
  nodes: [
    {
      id: 'job-1',
      type: NodeType.JOB,
      position: { x: 100, y: 100 },
      data: {
        label: '数据采集',
        type: NodeType.JOB,
        jobId: 1001,
        enable: true,
        timeout: 300,
        params: '{"source": "mysql", "table": "users"}',
      },
    },
    {
      id: 'job-2',
      type: NodeType.JOB,
      position: { x: 350, y: 100 },
      data: {
        label: '数据清洗',
        type: NodeType.JOB,
        jobId: 1002,
        enable: true,
        skip: false,
        timeout: 600,
      },
    },
    {
      id: 'job-3',
      type: NodeType.JOB,
      position: { x: 600, y: 100 },
      data: {
        label: '数据导出',
        type: NodeType.JOB,
        jobId: 1003,
        enable: true,
      },
    },
  ] as WorkflowNode[],
  edges: [
    { id: 'e1', source: 'job-1', target: 'job-2', type: 'custom' },
    { id: 'e2', source: 'job-2', target: 'job-3', type: 'custom' },
  ] as WorkflowEdge[],
};

/**
 * 场景2: 带判断节点的分支流程
 */
export const decisionWorkflow = {
  nodes: [
    {
      id: 'start',
      type: NodeType.JOB,
      position: { x: 100, y: 150 },
      data: {
        label: '开始任务',
        type: NodeType.JOB,
        jobId: 2001,
        enable: true,
      },
    },
    {
      id: 'decision-1',
      type: NodeType.DECISION,
      position: { x: 300, y: 150 },
      data: {
        label: '检查结果',
        type: NodeType.DECISION,
        condition: '${result} > 100',
      },
    },
    {
      id: 'branch-true',
      type: NodeType.JOB,
      position: { x: 500, y: 50 },
      data: {
        label: '大于100处理',
        type: NodeType.JOB,
        jobId: 2002,
        enable: true,
      },
    },
    {
      id: 'branch-false',
      type: NodeType.JOB,
      position: { x: 500, y: 250 },
      data: {
        label: '小于等于100处理',
        type: NodeType.JOB,
        jobId: 2003,
        enable: true,
      },
    },
    {
      id: 'end',
      type: NodeType.JOB,
      position: { x: 700, y: 150 },
      data: {
        label: '结束任务',
        type: NodeType.JOB,
        jobId: 2004,
        enable: true,
      },
    },
  ] as WorkflowNode[],
  edges: [
    { id: 'e1', source: 'start', target: 'decision-1', type: 'custom' },
    {
      id: 'e2',
      source: 'decision-1',
      target: 'branch-true',
      type: 'custom',
      data: { property: 'true' },
    },
    {
      id: 'e3',
      source: 'decision-1',
      target: 'branch-false',
      type: 'custom',
      data: { property: 'false' },
    },
    { id: 'e4', source: 'branch-true', target: 'end', type: 'custom' },
    { id: 'e5', source: 'branch-false', target: 'end', type: 'custom' },
  ] as WorkflowEdge[],
};

/**
 * 场景3: 嵌套工作流
 */
export const nestedWorkflow = {
  nodes: [
    {
      id: 'parent-1',
      type: NodeType.JOB,
      position: { x: 100, y: 150 },
      data: {
        label: '预处理',
        type: NodeType.JOB,
        jobId: 3001,
        enable: true,
      },
    },
    {
      id: 'nested-1',
      type: NodeType.NESTED_WORKFLOW,
      position: { x: 300, y: 150 },
      data: {
        label: '子流程-数据处理',
        type: NodeType.NESTED_WORKFLOW,
        targetWorkflowId: 'wf-001',
      },
    },
    {
      id: 'nested-2',
      type: NodeType.NESTED_WORKFLOW,
      position: { x: 500, y: 150 },
      data: {
        label: '子流程-报表生成',
        type: NodeType.NESTED_WORKFLOW,
        targetWorkflowId: 'wf-002',
      },
    },
    {
      id: 'parent-2',
      type: NodeType.JOB,
      position: { x: 700, y: 150 },
      data: {
        label: '通知发送',
        type: NodeType.JOB,
        jobId: 3002,
        enable: true,
      },
    },
  ] as WorkflowNode[],
  edges: [
    { id: 'e1', source: 'parent-1', target: 'nested-1', type: 'custom' },
    { id: 'e2', source: 'nested-1', target: 'nested-2', type: 'custom' },
    { id: 'e3', source: 'nested-2', target: 'parent-2', type: 'custom' },
  ] as WorkflowEdge[],
};

/**
 * 场景4: 视图模式 - 运行状态展示
 * 含 JOB、判断节点、嵌套工作流。
 * 实例 id：未运行的节点无 instanceId；运行中、已结束的节点有 instanceId（判断节点不生成任务实例，始终无 instanceId）。
 * 判断节点：执行后 status=SUCCESS、result="true"|"false"，带 startTime/endTime；
 * 与 result 一致的出边 enable 为 true，不一致的边 enable=false；仅能通过禁用边到达的节点为 CANCELED、enable=false、disableByControlNode=true。
 */
export const viewModeWithStatus = {
  nodes: [
    {
      id: 'v1',
      type: NodeType.JOB,
      position: { x: 100, y: 100 },
      data: {
        label: '任务A',
        type: NodeType.JOB,
        jobId: 4001,
        status: NodeStatus.SUCCESS,
        instanceId: 'inst-001',
        execution: {
          duration: 1234,
          startTime: '2024-01-15 10:00:00',
          endTime: '2024-01-15 10:00:01',
        },
      },
    },
    {
      id: 'v2',
      type: NodeType.JOB,
      position: { x: 280, y: 100 },
      data: {
        label: '任务B',
        type: NodeType.JOB,
        jobId: 4002,
        status: NodeStatus.SUCCESS,
        instanceId: 'inst-002',
        execution: {
          duration: 800,
          startTime: '2024-01-15 10:00:01',
          endTime: '2024-01-15 10:00:02',
        },
      },
    },
    {
      id: 'v-decision',
      type: NodeType.DECISION,
      position: { x: 460, y: 100 },
      data: {
        label: '检查结果',
        type: NodeType.DECISION,
        condition: '${result} > 0',
        status: NodeStatus.SUCCESS,
        result: 'true',
        execution: {
          startTime: '2024-01-15 10:00:02',
          endTime: '2024-01-15 10:00:02',
        },
      },
    },
    {
      id: 'v-nested1',
      type: NodeType.NESTED_WORKFLOW,
      position: { x: 640, y: 40 },
      data: {
        label: '子流程-数据处理',
        type: NodeType.NESTED_WORKFLOW,
        targetWorkflowId: 'wf-001',
        status: NodeStatus.RUNNING,
        instanceId: 'inst-nested1',
        execution: {
          startTime: '2024-01-15 10:00:02',
        },
      },
    },
    {
      id: 'v-nested2',
      type: NodeType.NESTED_WORKFLOW,
      position: { x: 820, y: 40 },
      data: {
        label: '子流程-报表生成',
        type: NodeType.NESTED_WORKFLOW,
        targetWorkflowId: 'wf-002',
        status: NodeStatus.WAITING,
      },
    },
    {
      id: 'v3',
      type: NodeType.JOB,
      position: { x: 640, y: 160 },
      data: {
        label: '任务C',
        type: NodeType.JOB,
        jobId: 4003,
        enable: false,
        disableByControlNode: true,
        status: NodeStatus.CANCELED,
      },
    },
    {
      id: 'v4',
      type: NodeType.JOB,
      position: { x: 1000, y: 100 },
      data: {
        label: '任务D',
        type: NodeType.JOB,
        jobId: 4004,
        status: NodeStatus.WAITING,
      },
    },
    {
      id: 'v5',
      type: NodeType.JOB,
      position: { x: 1180, y: 100 },
      data: {
        label: '任务E',
        type: NodeType.JOB,
        jobId: 4005,
        status: NodeStatus.WAITING,
      },
    },
  ] as WorkflowNode[],
  edges: [
    { id: 've1', source: 'v1', target: 'v2', type: 'custom' },
    { id: 've2', source: 'v2', target: 'v-decision', type: 'custom' },
    {
      id: 've-decision-true',
      source: 'v-decision',
      target: 'v-nested1',
      type: 'custom',
      data: { property: 'true', enable: true },
    },
    {
      id: 've-decision-false',
      source: 'v-decision',
      target: 'v3',
      type: 'custom',
      data: { property: 'false', enable: false },
    },
    { id: 've-nested1', source: 'v-nested1', target: 'v-nested2', type: 'custom' },
    { id: 've-nested2', source: 'v-nested2', target: 'v4', type: 'custom' },
    { id: 've3', source: 'v3', target: 'v4', type: 'custom', data: { enable: false } },
    { id: 've4', source: 'v4', target: 'v5', type: 'custom' },
  ] as WorkflowEdge[],
};

/**
 * 场景5: 复杂工作流 - 混合所有节点类型
 */
export const complexWorkflow = {
  nodes: [
    // 第一层
    {
      id: 'c1',
      type: NodeType.JOB,
      position: { x: 100, y: 200 },
      data: {
        label: '数据源采集',
        type: NodeType.JOB,
        jobId: 5001,
        enable: true,
        timeout: 900,
        params: '{"type": "api", "endpoint": "/data"}',
      },
    },
    // 第二层 - 分支
    {
      id: 'c2',
      type: NodeType.DECISION,
      position: { x: 300, y: 200 },
      data: {
        label: '数据量判断',
        type: NodeType.DECISION,
        condition: '${dataCount} > 10000',
      },
    },
    // 分支 A - 大数据量
    {
      id: 'c3',
      type: NodeType.NESTED_WORKFLOW,
      position: { x: 500, y: 80 },
      data: {
        label: '大数据处理流程',
        type: NodeType.NESTED_WORKFLOW,
        targetWorkflowId: 'big-data-wf',
      },
    },
    // 分支 B - 小数据量
    {
      id: 'c4',
      type: NodeType.NESTED_WORKFLOW,
      position: { x: 500, y: 200 },
      data: {
        label: '小数据处理流程',
        type: NodeType.NESTED_WORKFLOW,
        targetWorkflowId: 'small-data-wf',
      },
    },
    // 汇聚层
    {
      id: 'c6',
      type: NodeType.DECISION,
      position: { x: 750, y: 200 },
      data: {
        label: '结果校验',
        type: NodeType.DECISION,
        condition: '${validation} == "pass"',
      },
    },
    // 最终处理
    {
      id: 'c7',
      type: NodeType.JOB,
      position: { x: 950, y: 140 },
      data: {
        label: '数据入库',
        type: NodeType.JOB,
        jobId: 5003,
        enable: true,
      },
    },
    {
      id: 'c8',
      type: NodeType.JOB,
      position: { x: 950, y: 260 },
      data: {
        label: '通知告警',
        type: NodeType.JOB,
        jobId: 5004,
        enable: true,
      },
    },
  ] as WorkflowNode[],
  edges: [
    { id: 'ce1', source: 'c1', target: 'c2', type: 'custom' },
    { id: 'ce2', source: 'c2', target: 'c3', type: 'custom', data: { property: 'true' } },
    { id: 'ce3', source: 'c2', target: 'c4', type: 'custom', data: { property: 'false' } },
    { id: 'ce5', source: 'c3', target: 'c6', type: 'custom' },
    { id: 'ce6', source: 'c4', target: 'c6', type: 'custom' },
    { id: 'ce8', source: 'c6', target: 'c7', type: 'custom', data: { property: 'true' } },
    { id: 'ce9', source: 'c6', target: 'c8', type: 'custom', data: { property: 'false' } },
  ] as WorkflowEdge[],
};

/**
 * 场景6: 空画布
 */
export const emptyCanvas = {
  nodes: [] as WorkflowNode[],
  edges: [] as WorkflowEdge[],
};

export const singleNodes: Record<string, { nodes: WorkflowNode[]; edges: WorkflowEdge[] }> = {
  jobNode: {
    nodes: [
      {
        id: 'single-job',
        type: NodeType.JOB,
        position: { x: 200, y: 150 },
        data: {
          label: '单个任务节点',
          type: NodeType.JOB,
          jobId: 9001,
          enable: true,
          skip: false,
          timeout: 300,
          params: '{"key": "value"}',
        },
      },
    ] as WorkflowNode[],
    edges: [] as WorkflowEdge[],
  },
  decisionNode: {
    nodes: [
      {
        id: 'single-decision',
        type: NodeType.DECISION,
        position: { x: 200, y: 150 },
        data: {
          label: '单个判断节点',
          type: NodeType.DECISION,
          condition: '${value} > 0',
        },
      },
    ] as WorkflowNode[],
    edges: [] as WorkflowEdge[],
  },
  nestedNode: {
    nodes: [
      {
        id: 'single-nested',
        type: NodeType.NESTED_WORKFLOW,
        position: { x: 200, y: 150 },
        data: {
          label: '单个嵌套节点',
          type: NodeType.NESTED_WORKFLOW,
          targetWorkflowId: 'sub-workflow-001',
        },
      },
    ] as WorkflowNode[],
    edges: [] as WorkflowEdge[],
  },
};

/**
 * 场景8: 禁用/跳过状态的节点
 */
export const disabledNodes = {
  nodes: [
    {
      id: 'd1',
      type: NodeType.JOB,
      position: { x: 100, y: 100 },
      data: {
        label: '正常节点',
        type: NodeType.JOB,
        jobId: 6001,
        enable: true,
      },
    },
    {
      id: 'd2',
      type: NodeType.JOB,
      position: { x: 300, y: 100 },
      data: {
        label: '禁用节点',
        type: NodeType.JOB,
        jobId: 6002,
        enable: false,
      },
    },
    {
      id: 'd3',
      type: NodeType.JOB,
      position: { x: 500, y: 100 },
      data: {
        label: '跳过节点',
        type: NodeType.JOB,
        jobId: 6003,
        enable: true,
        skip: true,
      },
    },
    {
      id: 'd4',
      type: NodeType.JOB,
      position: { x: 700, y: 100 },
      data: {
        label: '禁用+跳过',
        type: NodeType.JOB,
        jobId: 6004,
        enable: false,
        skip: true,
      },
    },
  ] as WorkflowNode[],
  edges: [
    { id: 'de1', source: 'd1', target: 'd2', type: 'custom' },
    { id: 'de2', source: 'd2', target: 'd3', type: 'custom' },
    { id: 'de3', source: 'd3', target: 'd4', type: 'custom' },
  ] as WorkflowEdge[],
};

/**
 * 所有场景导出（不含 singleNodes，单节点场景通过 singleNodes 单独获取）
 */
export const scenarios = {
  basicWorkflow,
  decisionWorkflow,
  nestedWorkflow,
  viewModeWithStatus,
  complexWorkflow,
  emptyCanvas,
  disabledNodes,
};

export type ScenarioName = keyof typeof scenarios;
