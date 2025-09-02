import { FiPlus, FiTrash2, FiX, FiImage, FiUpload } from "react-icons/fi";

const MaterialModal = ({
  isOpen,
  isEditMode,
  isSaving,
  material,
  selectedImages,
  selectedImagePreviews,
  existingImageUrls,
  onClose,
  onSave,
  onImageSelection,
  onRemoveImage,
  onRemoveExistingImage,
  onMaterialChange,
  onAddOption,
  onUpdateOption,
  onRemoveOption,
}) => {
  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1D3C34] to-[#2a5a47] px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">
            {isEditMode ? "Edit Material" : "Add New Material"}
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Content */}
        <form
          onSubmit={handleSubmit}
          className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]"
        >
          <div className="space-y-8">
            {/* Basic Information Section */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <div className="w-2 h-6 bg-[#1D3C34] rounded-full"></div>
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Material Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter material name"
                    value={material.name}
                    onChange={(e) => onMaterialChange("name", e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D3C34] focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Company <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter company name"
                    value={material.company}
                    onChange={(e) =>
                      onMaterialChange("company", e.target.value)
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D3C34] focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter category"
                    value={material.category}
                    onChange={(e) =>
                      onMaterialChange("category", e.target.value)
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D3C34] focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Base Price (₱) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    value={material.price}
                    onChange={(e) => onMaterialChange("price", e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D3C34] focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  placeholder="Enter material description..."
                  value={material.description}
                  onChange={(e) =>
                    onMaterialChange("description", e.target.value)
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D3C34] focus:border-transparent resize-none transition-all"
                  rows={4}
                />
              </div>
            </div>

            {/* Options Section */}
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <div className="w-2 h-6 bg-[#1D3C34] rounded-full"></div>
                  Material Options
                </h3>
                <button
                  type="button"
                  onClick={onAddOption}
                  className="bg-[#1D3C34] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#145c4b] transition-colors flex items-center gap-2 shadow-md"
                >
                  <FiPlus size={16} />
                  Add Option
                </button>
              </div>

              {material.options.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg bg-white">
                  <div className="text-gray-400 mb-2">
                    <FiPlus size={32} className="mx-auto" />
                  </div>
                  <p className="text-gray-500 text-sm">
                    No options added yet. Click "Add Option" to start.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {material.options.map((option, index) => (
                    <div
                      key={index}
                      className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
                          Option {index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => onRemoveOption(index)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full p-2 transition-colors"
                          title="Remove option"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                            Type
                          </label>
                          <select
                            value={option.type}
                            onChange={(e) =>
                              onUpdateOption(index, "type", e.target.value)
                            }
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D3C34] focus:border-transparent transition-all"
                          >
                            <option value="">Select Type</option>
                            <option value="size">Size</option>
                            <option value="color">Color</option>
                            <option value="type">Type</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                            Option Name
                          </label>
                          <input
                            type="text"
                            placeholder="e.g., Large, Red, Premium"
                            value={option.option}
                            onChange={(e) =>
                              onUpdateOption(index, "option", e.target.value)
                            }
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D3C34] focus:border-transparent transition-all"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                            Price Addition (₱)
                          </label>
                          <input
                            type="number"
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            value={option.addToPrice}
                            onChange={(e) =>
                              onUpdateOption(
                                index,
                                "addToPrice",
                                e.target.value
                              )
                            }
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D3C34] focus:border-transparent transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Images Section */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <div className="w-2 h-6 bg-[#1D3C34] rounded-full"></div>
                Images
              </h3>

              {/* Existing Images */}
              {isEditMode && existingImageUrls.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm font-medium text-gray-700 mb-3">
                    Existing Images:
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {existingImageUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Existing image ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => onRemoveExistingImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600"
                          title="Remove image"
                        >
                          <FiX size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload New Images */}
              <div className="space-y-4">
                <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 bg-white hover:border-[#1D3C34] transition-colors">
                  <div className="text-center">
                    <FiUpload
                      size={32}
                      className="mx-auto text-gray-400 mb-2"
                    />
                    <p className="text-sm text-gray-600 mb-2">
                      Click to upload images or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, JPEG up to 10MB each
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={onImageSelection}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>

                {/* Selected Images Preview */}
                {selectedImages.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-3">
                      New Images ({selectedImages.length}):
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {selectedImages.map((image, index) => (
                        <div
                          key={index}
                          className="relative group"
                        >
                          <div className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                            <img
                              src={selectedImagePreviews[index]}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="mt-2 px-2">
                            <p className="text-xs text-gray-600 truncate" title={image.name}>
                              {image.name}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => onRemoveImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600"
                            title="Remove image"
                          >
                            <FiX size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-3 bg-gradient-to-r from-[#1D3C34] to-[#2a5a47] text-white rounded-lg hover:from-[#145c4b] hover:to-[#1e4638] transition-all font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {isEditMode ? "Saving..." : "Creating..."}
                </>
              ) : (
                <>{isEditMode ? "Save Changes" : "Create Material"}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MaterialModal;
