import { FiCheck, FiPlus, FiSearch, FiTrash2, FiX, FiUpload } from "react-icons/fi";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { normalizeAttributeTags } from "../../utils/validation";

const ROOM_TYPE_OPTIONS = [
  "Living Room",
  "Bedroom",
  "Kitchen",
  "Bathroom",
  "Home Office",
  "Dining Room",
  "Whole House",
  "Commercial Space",
];

const normalizeLookup = (value) =>
  String(value || "").trim().replace(/\s+/g, " ").toLowerCase();

const uniqueOptions = (values = []) => {
  const seen = new Set();
  const out = [];

  values.forEach((value) => {
    const label = String(value || "").trim().replace(/\s+/g, " ");
    const key = normalizeLookup(label);
    if (!label || seen.has(key)) return;
    seen.add(key);
    out.push(label);
  });

  return out.sort((a, b) => a.localeCompare(b));
};

const normalizeRoomTypes = (value) => {
  const values = Array.isArray(value) ? value : value ? [value] : [];
  const validRoomTypes = values.filter((roomType) =>
    ROOM_TYPE_OPTIONS.includes(roomType)
  );
  const uniqueRoomTypes = [...new Set(validRoomTypes)];

  return uniqueRoomTypes.includes("Whole House")
    ? ["Whole House"]
    : uniqueRoomTypes;
};

const RoomTypeChipSelector = ({ value = [], onChange, error }) => {
  const selectedRoomTypes = normalizeRoomTypes(value);

  const toggleRoomType = (roomType) => {
    if (roomType === "Whole House") {
      onChange(selectedRoomTypes.includes("Whole House") ? [] : ["Whole House"]);
      return;
    }

    const withoutWholeHouse = selectedRoomTypes.filter(
      (selected) => selected !== "Whole House"
    );
    const nextRoomTypes = withoutWholeHouse.includes(roomType)
      ? withoutWholeHouse.filter((selected) => selected !== roomType)
      : [...withoutWholeHouse, roomType];

    onChange(nextRoomTypes);
  };

  return (
    <div className="space-y-3 md:col-span-2">
      <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
        Room Type <span className="text-red-500">*</span>
      </label>
      <div className="flex flex-wrap gap-2">
        {ROOM_TYPE_OPTIONS.map((roomType) => {
          const isSelected = selectedRoomTypes.includes(roomType);
          return (
            <button
              key={roomType}
              type="button"
              onClick={() => toggleRoomType(roomType)}
              className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                isSelected
                  ? "border-[#1D3C34] bg-[#1D3C34] text-white shadow-sm"
                  : "border-[#1D3C34]/20 bg-[#f8fffe] text-[#1D3C34] hover:border-[#1D3C34]/45 hover:bg-[#1D3C34]/10"
              }`}
              aria-pressed={isSelected}
            >
              {roomType}
              {isSelected ? <FiCheck size={15} /> : <FiPlus size={15} />}
            </button>
          );
        })}
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
};

const SearchableField = ({
  label,
  value,
  onChange,
  options = [],
  placeholder,
  error,
  required = false,
  loading = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const canonicalOptions = useMemo(() => uniqueOptions(options), [options]);
  const query = normalizeLookup(value);
  const filteredOptions = query
    ? canonicalOptions.filter((option) => normalizeLookup(option).includes(query))
    : canonicalOptions;

  const applyCanonicalValue = () => {
    const exact = canonicalOptions.find(
      (option) => normalizeLookup(option) === normalizeLookup(value)
    );
    if (exact && exact !== value) onChange(exact);
  };

  return (
    <div className="space-y-2 relative">
      <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onFocus={() => setIsOpen(true)}
          onBlur={() => {
            window.setTimeout(() => {
              applyCanonicalValue();
              setIsOpen(false);
            }, 120);
          }}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          className="w-full p-3 pr-11 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D3C34] focus:border-[#1D3C34] transition-all bg-white"
          required={required}
          role="combobox"
          aria-expanded={isOpen}
        />
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => setIsOpen((open) => !open)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-[#1D3C34]"
          title={`Search ${label.toLowerCase()}`}
          aria-label={`Search ${label.toLowerCase()}`}
        >
          <FiSearch size={18} />
        </button>
      </div>
      {isOpen && (
        <div className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {loading ? (
            <div className="px-3 py-2 text-sm text-gray-500">Loading...</div>
          ) : filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <button
                key={option}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
                className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-[#1D3C34]/10"
              >
                {option}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500">
              No match. This will be added as new.
            </div>
          )}
        </div>
      )}
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
};

const AttributeTagInput = ({ value = [], onChange, error }) => {
  const [draft, setDraft] = useState("");
  const tags = useMemo(() => normalizeAttributeTags(value), [value]);

  const addTags = (rawValue) => {
    const nextTags = normalizeAttributeTags([
      ...tags,
      ...String(rawValue || "").split(","),
    ]);
    onChange(nextTags);
    setDraft("");
  };

  const removeTag = (index) => {
    onChange(tags.filter((_, tagIndex) => tagIndex !== index));
  };

  return (
    <div className="bg-gradient-to-br from-[#f8fffe] to-white rounded-xl p-6 border border-gray-200 shadow-sm mt-6">
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <div className="w-2 h-6 bg-gradient-to-b from-[#1D3C34] to-[#2a5a47] rounded-full"></div>
          Attributes
        </h3>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addTags(draft);
            }
          }}
          placeholder="Type a tag, then press Enter"
          className="flex-1 p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D3C34] focus:border-[#1D3C34] bg-white"
        />
        <button
          type="button"
          onClick={() => addTags(draft)}
          disabled={!draft.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#1D3C34] px-4 py-3 text-sm font-medium text-[#1D3C34] hover:bg-[#1D3C34]/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FiPlus size={16} />
          Add
        </button>
      </div>
      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <span
              key={`${tag}-${index}`}
              className="inline-flex items-center gap-2 rounded-full border border-[#1D3C34]/20 bg-[#1D3C34]/10 px-3 py-1.5 text-sm font-medium text-[#1D3C34]"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(index)}
                className="rounded-full p-0.5 hover:bg-[#1D3C34]/15"
                title={`Remove ${tag}`}
                aria-label={`Remove ${tag}`}
              >
                <FiX size={14} />
              </button>
            </span>
          ))}
        </div>
      )}
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
};

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
  errors = {},
}) => {
  const serverUrl = import.meta.env.VITE_SERVER_URL;

  const [fieldOptions, setFieldOptions] = useState({
    companies: [],
    categories: [],
  });
  const [loadingFieldOptions, setLoadingFieldOptions] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const run = async () => {
      setLoadingFieldOptions(true);
      try {
        const token = Cookies.get("token");
        const res = await axios.get(`${serverUrl}/api/material/field-options`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFieldOptions({
          companies: res.data.companies || [],
          categories: res.data.categories || [],
        });
      } catch {
        setFieldOptions({ companies: [], categories: [] });
      } finally {
        setLoadingFieldOptions(false);
      }
    };
    run();
  }, [isOpen, serverUrl]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave();
  };

  if (!isOpen) return null;

  return (
    <>
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
              <div className="bg-gradient-to-br from-[#f8fffe] to-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <div className="w-2 h-6 bg-gradient-to-b from-[#1D3C34] to-[#2a5a47] rounded-full"></div>
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                      Material Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Oak Wood Planks"
                      value={material.name}
                      onChange={(e) => onMaterialChange("name", e.target.value)}
                      className="w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D3C34] focus:border-[#1D3C34] transition-all bg-white"
                      required
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm">{errors.name}</p>
                    )}
                  </div>

                  <SearchableField
                    label="Company"
                    value={material.company || ""}
                    onChange={(value) => onMaterialChange("company", value)}
                    options={fieldOptions.companies}
                    placeholder="e.g., ABC Supplies Inc."
                    error={errors.company}
                    required
                    loading={loadingFieldOptions}
                  />

                  <SearchableField
                    label="Category"
                    value={material.category || ""}
                    onChange={(value) => onMaterialChange("category", value)}
                    options={fieldOptions.categories}
                    placeholder="e.g., Sofa"
                    error={errors.category}
                    required
                    loading={loadingFieldOptions}
                  />

                  <RoomTypeChipSelector
                    value={material.roomTypes || material.roomType || []}
                    onChange={(value) => onMaterialChange("roomTypes", value)}
                    error={errors.roomTypes}
                  />

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                      Base Price (₱) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                        ₱
                      </span>
                      <input
                        type="number"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        value={material.price}
                        onChange={(e) =>
                          onMaterialChange("price", e.target.value)
                        }
                        className="w-full p-3 pl-8 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D3C34] focus:border-[#1D3C34] transition-all bg-white"
                        required
                      />
                    </div>
                    {errors.price && (
                      <p className="text-red-500 text-sm">{errors.price}</p>
                    )}
                  </div>
                </div>

                <div className="mt-5 space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    placeholder="Provide detailed information about the material, its specifications, and usage..."
                    value={material.description}
                    onChange={(e) =>
                      onMaterialChange("description", e.target.value)
                    }
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D3C34] focus:border-[#1D3C34] resize-none transition-all bg-white"
                    rows={4}
                    required
                  />
                  {errors.description && (
                    <p className="text-red-500 text-sm">{errors.description}</p>
                  )}
                </div>
              </div>

              <AttributeTagInput
                value={material.attributes || []}
                onChange={(tags) => onMaterialChange("attributes", tags)}
                error={errors.attributes}
              />

              {/* Options Section */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <div className="w-2 h-6 bg-gradient-to-b from-[#1D3C34] to-[#2a5a47] rounded-full"></div>
                      Material Options
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 ml-5">
                      Add variations like size, color, or type
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onAddOption}
                    className="bg-gradient-to-r from-[#1D3C34] to-[#2a5a47] text-white px-4 py-2.5 rounded-lg text-sm hover:from-[#145c4b] hover:to-[#1e4638] transition-all flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    <FiPlus size={18} />
                    Add Option
                  </button>
                </div>

                {material.options.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-xl bg-white">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FiPlus size={36} className="text-gray-400" />
                    </div>
                    <p className="text-gray-600 font-medium mb-1">
                      No options added yet
                    </p>
                    <p className="text-gray-500 text-sm">
                      Click "Add Option" to create material variations
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {material.options.map((option, index) => (
                      <div
                        key={index}
                        className="bg-white p-5 rounded-xl border-2 border-gray-200 shadow-sm hover:shadow-md hover:border-[#1D3C34]/30 transition-all"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-sm font-bold text-[#1D3C34] bg-[#1D3C34]/10 px-4 py-1.5 rounded-full">
                            Option {index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => onRemoveOption(index)}
                            className="text-red-500 hover:text-white hover:bg-red-500 rounded-full p-2 transition-all"
                            title="Remove option"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                              Type <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={option.type}
                              onChange={(e) =>
                                onUpdateOption(index, "type", e.target.value)
                              }
                              className="w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D3C34] focus:border-[#1D3C34] transition-all bg-white"
                            >
                              <option value="">Select Type</option>
                              <option value="size">📏 Size</option>
                              <option value="color">🎨 Color</option>
                              <option value="type">✨ Type</option>
                            </select>
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                              Option Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              placeholder="e.g., Large, Red, Premium"
                              value={option.option}
                              onChange={(e) =>
                                onUpdateOption(index, "option", e.target.value)
                              }
                              className="w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D3C34] focus:border-[#1D3C34] transition-all bg-white"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                              Price Addition (₱) <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                                +₱
                              </span>
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
                                className="w-full p-3 pl-10 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D3C34] focus:border-[#1D3C34] transition-all bg-white"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {errors.options && (
                  <p className="text-red-500 text-sm mt-4">{errors.options}</p>
                )}
              </div>

              {/* Images Section */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <div className="w-2 h-6 bg-[#1D3C34] rounded-full"></div>
                  Images{" "}
                  <span className="text-sm font-normal text-gray-500">
                    (Optional)
                  </span>
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                  Upload product images to showcase your material
                </p>

                {/* Upload New Images */}
                <div className="space-y-4">
                  <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-8 bg-white hover:border-[#1D3C34] hover:bg-[#f8fffe] transition-all duration-200 group">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-[#1D3C34] to-[#2a5a47] rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                        <FiUpload size={28} className="text-white" />
                      </div>
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        Click to upload or drag and drop
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

                  {/* Combined Images Preview (Existing + New) */}
                  {(existingImageUrls.length > 0 ||
                    selectedImages.length > 0) && (
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-semibold text-gray-800">
                          Uploaded Images (
                          {existingImageUrls.length + selectedImages.length})
                        </p>
                        <div className="text-xs text-gray-500">
                          {existingImageUrls.length > 0 && (
                            <span className="mr-2">
                              ✓ {existingImageUrls.length} saved
                            </span>
                          )}
                          {selectedImages.length > 0 && (
                            <span className="text-[#1D3C34]">
                              + {selectedImages.length} new
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {/* Existing Images */}
                        {existingImageUrls.map((url, index) => (
                          <div
                            key={`existing-${index}`}
                            className="relative group"
                          >
                            <div className="aspect-square rounded-lg overflow-hidden border-2 border-green-200 bg-white shadow-sm">
                              <img
                                src={url}
                                alt={`Image ${index + 1}`}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                              />
                            </div>
                            <div className="absolute top-1 left-1 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full font-medium">
                              Saved
                            </div>
                            <button
                              type="button"
                              onClick={() => onRemoveExistingImage(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600 hover:scale-110"
                              title="Remove image"
                            >
                              <FiX size={14} />
                            </button>
                          </div>
                        ))}

                        {/* New Images */}
                        {selectedImages.map((image, index) => (
                          <div key={`new-${index}`} className="relative group">
                            <div className="aspect-square rounded-lg overflow-hidden border-2 border-[#1D3C34] bg-white shadow-sm">
                              <img
                                src={selectedImagePreviews[index]}
                                alt={`New ${index + 1}`}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                              />
                            </div>
                            <div className="absolute top-1 left-1 bg-[#1D3C34] text-white text-xs px-1.5 py-0.5 rounded-full font-medium">
                              New
                            </div>
                            <div className="absolute bottom-1 left-1 right-1 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded truncate">
                              {image.name}
                            </div>
                            <button
                              type="button"
                              onClick={() => onRemoveImage(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600 hover:scale-110"
                              title="Remove image"
                            >
                              <FiX size={14} />
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

    </>
  );
};

export default MaterialModal;
