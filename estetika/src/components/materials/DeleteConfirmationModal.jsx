import { FiAlertTriangle, FiX } from "react-icons/fi";

const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
  materialName = "this material",
  materialCompany = "",
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-full p-2">
              <FiAlertTriangle className="text-white" size={20} />
            </div>
            <h2 className="text-xl font-bold text-white">Confirm Deletion</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors disabled:opacity-50"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="bg-red-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <FiAlertTriangle className="text-red-500" size={32} />
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Delete Material?
            </h3>

            <div className="text-gray-600 space-y-2">
              <p>
                Are you sure you want to delete{" "}
                <span className="font-semibold text-gray-900">
                  "{materialName}"
                </span>
                {materialCompany && (
                  <>
                    {" "}
                    from{" "}
                    <span className="font-semibold text-gray-900">
                      {materialCompany}
                    </span>
                  </>
                )}
                ?
              </p>
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                <strong>Warning:</strong> This action cannot be undone. The
                material will be permanently removed from the system.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Deleting...
                </>
              ) : (
                "Delete Material"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
