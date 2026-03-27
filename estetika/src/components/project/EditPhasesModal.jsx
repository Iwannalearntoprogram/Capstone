import { FiEdit2, FiX } from "react-icons/fi";
import React, { useState } from "react";

const EditPhasesModal = ({
  isOpen,
  onClose,
  onSubmit,
  isSaving,
  phases,
  onChangePhase,
  onRemovePhase,
}) => {
  const [validationErrors, setValidationErrors] = useState([]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = phases.map((phase) => {
      if (phase.startDate && phase.endDate && phase.endDate < phase.startDate) {
        return "End date cannot be before start date.";
      }
      if (phase.startDate && phase.endDate && phase.startDate > phase.endDate) {
        return "Start date cannot be after end date.";
      }
      return null;
    });
    setValidationErrors(errors);
    if (errors.some((error) => error)) return;
    onSubmit(e);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-2xl rounded-[18px] border border-black/5 bg-[#fcfbf8] shadow-[0_40px_100px_-45px_rgba(15,23,42,0.5)]">
        <div className="flex items-start justify-between border-b border-black/5 px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-[#1D3C34]/10 p-3 text-[#1D3C34]">
              <FiEdit2 size={18} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Progress
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-slate-900">
                Edit phases
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Update phase names and schedules without changing the overall structure.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="rounded-lg border border-black/5 p-2 text-slate-500 transition hover:text-slate-900 disabled:opacity-50"
            type="button"
          >
            <FiX size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[70vh] overflow-y-auto px-6 py-6">
          <div className="space-y-4">
            {phases.map((phase, idx) => (
              <div
                key={phase._id || idx}
                className="rounded-[16px] border border-[#e3ddd3] bg-white p-4"
              >
                <div className="mb-4">
                  <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Phase title
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={phase.title || ""}
                    onChange={(e) =>
                      onChangePhase(idx, {
                        ...phase,
                        title: e.target.value,
                      })
                    }
                    className="mt-2 w-full rounded-xl border border-[#d8deda] bg-[#fcfcfb] px-4 py-3 text-slate-900 outline-none transition focus:border-[#1d3c34] focus:ring-2 focus:ring-[#1d3c34]/10"
                    placeholder="Untitled phase"
                    required
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Start date
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      value={phase.startDate ? phase.startDate.slice(0, 10) : ""}
                      onChange={(e) =>
                        onChangePhase(idx, {
                          ...phase,
                          startDate: e.target.value,
                        })
                      }
                      className="mt-2 w-full rounded-xl border border-[#d8deda] bg-[#fcfcfb] px-4 py-3 text-slate-900 outline-none transition focus:border-[#1d3c34] focus:ring-2 focus:ring-[#1d3c34]/10"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      End date
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      value={phase.endDate ? phase.endDate.slice(0, 10) : ""}
                      onChange={(e) =>
                        onChangePhase(idx, {
                          ...phase,
                          endDate: e.target.value,
                        })
                      }
                      className="mt-2 w-full rounded-xl border border-[#d8deda] bg-[#fcfcfb] px-4 py-3 text-slate-900 outline-none transition focus:border-[#1d3c34] focus:ring-2 focus:ring-[#1d3c34]/10"
                      required
                    />
                  </div>
                </div>

                {validationErrors[idx] ? (
                  <div className="mt-3 text-sm text-red-600">
                    {validationErrors[idx]}
                  </div>
                ) : null}

                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => onRemovePhase(idx)}
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                    disabled={isSaving}
                  >
                    Remove phase
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-3 border-t border-black/5 pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 rounded-xl border border-black/5 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 rounded-xl bg-[#1D3C34] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#163029] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPhasesModal;
