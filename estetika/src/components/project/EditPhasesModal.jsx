import { FiEdit, FiX } from "react-icons/fi";
import React from "react";

const EditPhasesModal = ({
  isOpen,
  onClose,
  onSubmit,
  isSaving,
  phases,
  onChangePhase,
  onAddPhase,
  onRemovePhase,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-700 to-green-800 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-full p-2">
              <FiEdit className="text-white" size={20} />
            </div>
            <h2 className="text-xl font-bold text-white">Edit Project Phases</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors disabled:opacity-50"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={onSubmit} className="p-6 flex flex-col gap-6">
          {phases.map((phase, idx) => (
            <div key={phase._id || idx} className="mb-4 p-4 rounded-xl border bg-gray-50 flex flex-col gap-3">
              <div className="mb-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Phase Title</label>
                <div className="px-2 py-1 rounded bg-gray-100 text-gray-600 font-medium border w-full">{phase.title || "Untitled Phase"}</div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-sm text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={phase.startDate ? phase.startDate.slice(0, 10) : ""}
                    onChange={e => onChangePhase(idx, { ...phase, startDate: e.target.value })}
                    className="border rounded px-2 py-1 w-full"
                    required
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    value={phase.endDate ? phase.endDate.slice(0, 10) : ""}
                    onChange={e => onChangePhase(idx, { ...phase, endDate: e.target.value })}
                    className="border rounded px-2 py-1 w-full"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <button
                  type="button"
                  onClick={() => onRemovePhase(idx)}
                  className="text-red-600 hover:text-red-800 font-semibold px-4 py-2 rounded-lg border border-red-200 bg-red-50 transition disabled:opacity-50"
                  disabled={isSaving}
                >
                  Remove Phase
                </button>
              </div>
            </div>
          ))}
          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-green-700 to-green-800 text-white rounded-lg hover:from-green-800 hover:to-green-900 transition-all font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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

export default EditPhasesModal;
