import { NodeStatus } from '../../types/workflow';

export interface NodeStatusTone {
  bg: string;
  border: string;
  text: string;
  pill: string;
  iconBg: string;
  iconText: string;
}

const DEFAULT_TONE: NodeStatusTone = {
  bg: 'bg-white',
  border: 'border-gray-200',
  text: 'text-gray-600',
  pill: 'bg-gray-100 text-gray-600 border border-gray-200',
  iconBg: 'bg-gray-100',
  iconText: 'text-gray-600',
};

const STATUS_TONE_MAP: Record<NodeStatus, NodeStatusTone> = {
  [NodeStatus.WAITING]: {
    bg: 'bg-orange-50',
    border: 'border-orange-400',
    text: 'text-orange-600',
    pill: 'bg-orange-100 text-orange-700 border border-orange-200',
    iconBg: 'bg-orange-100',
    iconText: 'text-orange-700',
  },
  [NodeStatus.RUNNING]: {
    bg: 'bg-blue-50',
    border: 'border-blue-500',
    text: 'text-blue-600',
    pill: 'bg-blue-100 text-blue-700 border border-blue-200',
    iconBg: 'bg-blue-100',
    iconText: 'text-blue-700',
  },
  [NodeStatus.FAILED]: {
    bg: 'bg-red-50',
    border: 'border-red-500',
    text: 'text-red-600',
    pill: 'bg-red-100 text-red-700 border border-red-200',
    iconBg: 'bg-red-100',
    iconText: 'text-red-700',
  },
  [NodeStatus.SUCCESS]: {
    bg: 'bg-green-50',
    border: 'border-green-500',
    text: 'text-green-600',
    pill: 'bg-green-100 text-green-700 border border-green-200',
    iconBg: 'bg-green-100',
    iconText: 'text-green-700',
  },
  [NodeStatus.CANCELED]: {
    bg: 'bg-gray-50',
    border: 'border-gray-300',
    text: 'text-gray-500',
    pill: 'bg-gray-100 text-gray-600 border border-gray-200',
    iconBg: 'bg-gray-100',
    iconText: 'text-gray-600',
  },
  [NodeStatus.STOPPED]: {
    bg: 'bg-gray-100',
    border: 'border-gray-400',
    text: 'text-gray-600',
    pill: 'bg-gray-200 text-gray-700 border border-gray-300',
    iconBg: 'bg-gray-200',
    iconText: 'text-gray-700',
  },
};

export const getNodeStatusTone = (status?: NodeStatus): NodeStatusTone => {
  if (!status) return DEFAULT_TONE;
  return STATUS_TONE_MAP[status] ?? DEFAULT_TONE;
};

export const getNodeStatusText = (
  status: NodeStatus | undefined,
  t: (key: string) => string,
): string => {
  switch (status) {
    case NodeStatus.SUCCESS:
      return t('workflow.status.success');
    case NodeStatus.FAILED:
      return t('workflow.status.failed');
    case NodeStatus.RUNNING:
      return t('workflow.status.running');
    case NodeStatus.WAITING:
      return t('workflow.status.waiting');
    case NodeStatus.STOPPED:
      return t('workflow.status.stopped');
    case NodeStatus.CANCELED:
      return t('workflow.status.canceled');
    default:
      return '';
  }
};
