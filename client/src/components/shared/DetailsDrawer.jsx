import React, { useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

/**
 * Slide-over Drawer for displaying deep records (OP Request, Faculty Details, Audit Log details).
 */
const DetailsDrawer = ({
  open = false,
  onClose,
  title = 'Details',
  subtitle = '',
  children,
  footer = null,
  width = 'max-w-md',
}) => {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className={`w-screen ${width} transform bg-white shadow-2xl transition-transform duration-300 ease-in-out flex flex-col`}>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">{title}</h2>
              {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              aria-label="Close drawer"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">{children}</div>

          {/* Optional Footer */}
          {footer && (
            <div className="border-t border-slate-200 bg-slate-50/60 px-6 py-4">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetailsDrawer;
