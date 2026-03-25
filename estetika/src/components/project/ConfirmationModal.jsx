import React from "react";
import { FiAlertTriangle, FiX } from "react-icons/fi";

const ConfirmationModal = ({
  isOpen,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  isProcessing = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-md overflow-hidden rounded-[14px] border border-stone-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.2)]">
        <div className="flex items-start justify-between gap-4 border-b border-stone-200 px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="rounded-[10px] bg-rose-50 p-2 text-rose-600">
              <FiAlertTriangle size={18} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
              <p className="mt-1 text-sm text-slate-500">
                This action needs confirmation.
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="flex h-8 w-8 items-center justify-center rounded-[10px] border border-stone-200 text-slate-400 transition hover:border-stone-300 hover:text-slate-600 disabled:opacity-50"
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-5 px-5 py-5">
          <div className="rounded-[10px] border border-stone-200 bg-stone-50 px-4 py-3 text-sm leading-6 text-slate-700">
            {message}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isProcessing}
              className="flex-1 rounded-[10px] border border-stone-300 px-4 py-2.5 font-medium text-slate-700 transition hover:bg-stone-50 disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isProcessing}
              className="flex flex-1 items-center justify-center gap-2 rounded-[10px] bg-rose-700 px-4 py-2.5 font-medium text-white transition hover:bg-rose-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Processing...
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
