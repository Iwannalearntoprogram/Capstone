import React from "react";
import { FiX } from "react-icons/fi";

const priorityOptions = ["Budget", "Style"];

const fieldClassName =
  "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#1d3c34]/35 focus:bg-white focus:ring-4 focus:ring-[#1d3c34]/8";

const labelClassName =
  "mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400";

const helperClassName = "mt-2 text-sm text-rose-500";

const EditProjectModal = ({
  isOpen,
  onClose,
  onSubmit,
  isSaving,
  editData,
  onChange,
  errors = {},
  message = "",
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.42)] px-4 py-6 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-[30px] border border-white/50 bg-[#fcfbf8] shadow-[0_40px_120px_-45px_rgba(15,23,42,0.55)]">
        <div className="flex items-start justify-between gap-4 border-b border-black/5 px-6 py-5 sm:px-8 sm:py-6">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              Project
            </p>
            <div>
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-900">
                Edit project details
              </h2>
              <p className="mt-1 text-sm leading-7 text-slate-500">
                Update the project brief, budget, priority, and schedule.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close edit project modal"
          >
            <FiX size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-8 sm:py-8">
            <div className="space-y-8 pb-2">
            {message ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {message}
              </div>
            ) : null}

            <section className="space-y-5">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Overview
                </p>
                <h3 className="text-lg font-semibold text-slate-900">Project brief</h3>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <label className="md:col-span-2">
                  <span className={labelClassName}>Title</span>
                  <input
                    type="text"
                    name="title"
                    value={editData.title}
                    onChange={onChange}
                    className={fieldClassName}
                    required
                  />
                  {errors.title ? <p className={helperClassName}>{errors.title}</p> : null}
                </label>

                <label className="md:col-span-2">
                  <span className={labelClassName}>Description</span>
                  <textarea
                    name="description"
                    value={editData.description}
                    onChange={onChange}
                    className={`${fieldClassName} min-h-[120px] resize-none`}
                  />
                  {errors.description ? (
                    <p className={helperClassName}>{errors.description}</p>
                  ) : null}
                </label>

                <label>
                  <span className={labelClassName}>Budget</span>
                  <input
                    type="number"
                    name="budget"
                    value={editData.budget}
                    onChange={onChange}
                    className={fieldClassName}
                  />
                  {errors.budget ? <p className={helperClassName}>{errors.budget}</p> : null}
                </label>

                <label>
                  <span className={labelClassName}>Priority</span>
                  <select
                    name="priority"
                    value={editData.priority}
                    onChange={onChange}
                    className={`${fieldClassName} appearance-auto`}
                    required
                  >
                    <option value="">Select priority</option>
                    {priorityOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  {errors.priority ? (
                    <p className={helperClassName}>{errors.priority}</p>
                  ) : null}
                </label>

                <label className="md:col-span-2">
                  <span className={labelClassName}>Design preference</span>
                  <textarea
                    name="designPreference"
                    value={editData.designPreference}
                    onChange={onChange}
                    className={`${fieldClassName} min-h-[112px] resize-none`}
                    rows={3}
                    placeholder="Modern, warm, minimalist, natural textures..."
                  />
                </label>
              </div>
            </section>

            <section className="space-y-5">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Timeline
                </p>
                <h3 className="text-lg font-semibold text-slate-900">Schedule</h3>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <label>
                  <span className={labelClassName}>Start date</span>
                  <input
                    type="date"
                    name="startDate"
                    value={editData.startDate}
                    onChange={onChange}
                    className={fieldClassName}
                  />
                </label>

                <label>
                  <span className={labelClassName}>End date</span>
                  <input
                    type="date"
                    name="endDate"
                    value={editData.endDate}
                    onChange={onChange}
                    className={fieldClassName}
                  />
                </label>
              </div>

              {errors.dates ? <p className={helperClassName}>{errors.dates}</p> : null}
            </section>
            </div>
          </div>

          <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-black/5 bg-white/95 px-6 py-4 sm:flex-row sm:justify-end sm:px-8">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-[140px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1d3c34] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#163029] disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-[180px]"
            >
              {isSaving ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProjectModal;
