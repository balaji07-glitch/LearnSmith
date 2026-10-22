import React from 'react';
import { AssetStatus, UnitStatus } from '../types/index.ts';
import { CheckCircle2, AlertTriangle, XCircle, Clock, Sparkles } from 'lucide-react';

interface Props {
  status: AssetStatus | UnitStatus | 'passed' | 'warning' | 'failed' | 'easy' | 'medium' | 'hard';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<Props> = ({ status, size = 'sm', showIcon = true }) => {
  let bg = 'bg-slate-100 text-slate-700 border-slate-200';
  let icon = <Clock className="w-3.5 h-3.5" />;
  let label = String(status);

  switch (status) {
    case 'APPROVED':
    case 'passed':
    case 'READY':
    case 'PUBLISHED':
      bg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      icon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
      label = status === 'APPROVED' ? 'Approved' : status === 'passed' ? 'Passed' : status === 'READY' ? 'Ready' : 'Published';
      break;
    case 'NEEDS_REVISION':
    case 'warning':
    case 'REVIEW':
      bg = 'bg-amber-50 text-amber-700 border-amber-200';
      icon = <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />;
      label = status === 'NEEDS_REVISION' ? 'Needs Revision' : status === 'warning' ? 'Warning' : 'In Review';
      break;
    case 'REJECTED':
    case 'failed':
      bg = 'bg-rose-50 text-rose-700 border-rose-200';
      icon = <XCircle className="w-3.5 h-3.5 text-rose-600" />;
      label = status === 'REJECTED' ? 'Rejected' : 'Failed';
      break;
    case 'DRAFT':
      bg = 'bg-blue-50 text-blue-700 border-blue-200';
      icon = <Clock className="w-3.5 h-3.5 text-blue-600" />;
      label = 'Draft';
      break;
    case 'GENERATING':
      bg = 'bg-indigo-50 text-indigo-700 border-indigo-200 animate-pulse';
      icon = <Sparkles className="w-3.5 h-3.5 text-indigo-600" />;
      label = 'Generating';
      break;
    case 'easy':
      bg = 'bg-teal-50 text-teal-700 border-teal-200';
      label = 'Easy';
      break;
    case 'medium':
      bg = 'bg-sky-50 text-sky-700 border-sky-200';
      label = 'Medium';
      break;
    case 'hard':
      bg = 'bg-purple-50 text-purple-700 border-purple-200';
      label = 'Hard';
      break;
  }

  const sizeClasses =
    size === 'sm'
      ? 'text-xs px-2.5 py-0.5'
      : size === 'md'
      ? 'text-xs px-3 py-1 font-medium'
      : 'text-sm px-3.5 py-1.5 font-semibold';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${bg} ${sizeClasses}`}
    >
      {showIcon && icon}
      <span>{label}</span>
    </span>
  );
};
