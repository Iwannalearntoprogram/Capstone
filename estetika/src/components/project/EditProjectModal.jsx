import { FiEdit, FiX } from "react-icons/fi";
import React from "react";

const EditProjectModal = ({
  isOpen,
  onClose,
  onSubmit,
  isSaving,
  editData,
  onChange,
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
            <h2 className="text-xl font-bold text-white">Edit Project Details</h2>
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
        <form onSubmit={onSubmit} className="p-6 flex flex-col gap-4">
          <label>
            <span className="block text-gray-700 font-medium mb-1">Title</span>
            <input
              type="text"
              name="title"
              value={editData.title}
              onChange={onChange}
              className="border rounded px-2 py-1 w-full"
              required
            />
          </label>
          <label>
            <span className="block text-gray-700 font-medium mb-1">Description</span>
            <textarea
              name="description"
              value={editData.description}
              onChange={onChange}
              className="border rounded px-2 py-1 w-full"
            />
          </label>
          <label>
            <span className="block text-gray-700 font-medium mb-1">Budget</span>
            <input
              type="number"
              name="budget"
              value={editData.budget}
              onChange={onChange}
              className="border rounded px-2 py-1 w-full"
            />
          </label>
          <label>
            <span className="block text-gray-700 font-medium mb-1">Start Date</span>
            <input
              type="date"
              name="startDate"
              value={editData.startDate}
              onChange={onChange}
              className="border rounded px-2 py-1 w-full"
            />
          </label>
          <label>
            <span className="block text-gray-700 font-medium mb-1">End Date</span>
            <input
              type="date"
              name="endDate"
              value={editData.endDate}
              onChange={onChange}
              className="border rounded px-2 py-1 w-full"
            />
          </label>
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

export default EditProjectModal;
