import React from 'react';
import { ExclamationTriangleIcon, CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

/**
 * Reusable confirmation dialog for critical HOD actions (Approve, Reject, Delete).
 */
const ConfirmModal = ({
  open = false,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  description = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary', // 'primary' | 'danger' | 'success'
  loading = false,
}) => {
  if (!open) return null;

  const buttonVariants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  };

  const IconComponent = confirmVariant === 'danger' ? ExclamationTriangleIcon : CheckCircleIcon;
  const iconColor = confirmVariant === 'danger' ? 'text-rose-600 bg-rose-50' : 'text-blue-600 bg-blue-50';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
        <div className="flex items-start gap-4">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconColor}`}>
            <IconComponent className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">{description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
            aria-label="Close modal"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 flex justify-end gap-2.5">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-xs font-semibold shadow-xs transition disabled:opacity-50 ${buttonVariants[confirmVariant] || buttonVariants.primary}`}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
