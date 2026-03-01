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
