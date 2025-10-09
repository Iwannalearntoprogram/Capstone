import { FiPlus, FiTrash2, FiX, FiImage, FiUpload } from "react-icons/fi";
import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Cookies from "js-cookie";

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

  const serverUrl = import.meta.env.VITE_SERVER_URL;

  // Category templates and attribute registries
  const [templates, setTemplates] = useState([]); // [{category, attributes:[{key}]}]
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  // removed per-line attribute keys when creating new category
  const [attrValuesMap, setAttrValuesMap] = useState({}); // key -> values[]
  const [attrInputMap, setAttrInputMap] = useState({}); // key -> currently selected or typed value
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [loadingValues, setLoadingValues] = useState({}); // key -> boolean

  // Local dialogs to replace alert()/prompt()
  const [msgDialog, setMsgDialog] = useState({
    open: false,
    title: "",
    message: "",
  });
  const [valDialog, setValDialog] = useState({
    open: false,
    key: "",
    value: "",
    saving: false,
  });

  // Load templates when modal opens
  useEffect(() => {
    if (!isOpen) return;
    const run = async () => {
      setLoadingTemplates(true);
      try {
        const token = Cookies.get("token");
        const res = await axios.get(`${serverUrl}/api/category-template`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTemplates(res.data.templates || []);
      } catch {
        setTemplates([]);
      } finally {
        setLoadingTemplates(false);
      }
    };
    run();
  }, [isOpen, serverUrl]);

  const selectedCategory = material.category || "";

  // When category changes, fetch template and registries
  useEffect(() => {
    const fetchForCategory = async (cat) => {
      if (!cat) return;
      const token = Cookies.get("token");
      try {
        const tplRes = await axios.get(`${serverUrl}/api/category-template`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { category: cat },
        });
        const template = tplRes.data?.template;
        const keys = Array.isArray(template?.attributes)
          ? template.attributes.map((a) => a.key)
          : [];
        // prefill attr inputs from material.attributes when editing
        if (Array.isArray(material.attributes) && material.attributes.length) {
          const next = {};
          material.attributes.forEach((a) => {
            next[a.key] = a.value;
          });
          setAttrInputMap((prev) => ({ ...prev, ...next }));
        }
        // fetch values per key (dropdown attributes)
        for (const key of keys) {
          if (/^dimensions$/i.test(key)) continue; // text input
          setLoadingValues((p) => ({ ...p, [key]: true }));
          try {
            const valRes = await axios.get(
              `${serverUrl}/api/attribute-registry`,
              {
                headers: { Authorization: `Bearer ${token}` },
                params: { key },
              }
            );
            const vals = valRes.data?.registry?.values || [];
            setAttrValuesMap((p) => ({ ...p, [key]: vals }));
          } catch {
            setAttrValuesMap((p) => ({ ...p, [key]: [] }));
          } finally {
            setLoadingValues((p) => ({ ...p, [key]: false }));
          }
        }
      } catch {
        // no template; allow free typing via Add New flow
      }
    };
    fetchForCategory(selectedCategory);
  }, [selectedCategory]);

  // New grouped attributes state: { key, values: [] }
  const [attrGroups, setAttrGroups] = useState([{ key: "", values: [""] }]);

  // Helper to flatten material.attributes (supports old and new shapes)
  const flattenMaterialAttributes = useMemo(() => {
    const attrs = Array.isArray(material.attributes) ? material.attributes : [];
    const out = [];
    attrs.forEach((a) => {
      const k = (a?.key || "").trim();
      if (!k) return;
      if (Array.isArray(a.values)) {
        a.values
          .filter(Boolean)
          .forEach((v) => out.push({ key: k, value: String(v).trim() }));
      } else if (a.value) {
        out.push({ key: k, value: String(a.value).trim() });
      }
    });
    return out;
  }, [material.attributes]);

  // Initialize grouped attributes once per open, from current material.attributes
  const [attrsInitialized, setAttrsInitialized] = useState(false);
  useEffect(() => {
    if (!isOpen) return;
    if (attrsInitialized) return;
    const map = new Map();
    flattenMaterialAttributes.forEach(({ key, value }) => {
      if (!key) return;
      map.set(key, [...(map.get(key) || []), value]);
    });
    const groups = Array.from(map.entries()).map(([key, vals]) => ({
      key,
      values: Array.from(new Set(vals)).filter(Boolean),
    }));
    setAttrGroups(groups.length ? groups : [{ key: "", values: [""] }]);
    setAttrsInitialized(true);
  }, [isOpen, attrsInitialized, flattenMaterialAttributes]);

  // Reset initializer when modal closes
  useEffect(() => {
    if (!isOpen) setAttrsInitialized(false);
  }, [isOpen]);

  // Push flattened attributes up whenever grouped attributes change
  useEffect(() => {
    const flattened = [];
    attrGroups.forEach((g) => {
      const key = (g.key || "").trim();
      if (!key) return;
      const vals = (Array.isArray(g.values) ? g.values : [])
        .map((v) => String(v || "").trim())
        .filter(Boolean);
      vals.forEach((v) => flattened.push({ key, value: v }));
    });
    // Only push up if different from current material.attributes flattened
    const a = JSON.stringify(flattened);
    const b = JSON.stringify(flattenMaterialAttributes);
    if (a !== b) {
      onMaterialChange && onMaterialChange("attributes", flattened);
    }
  }, [attrGroups, flattenMaterialAttributes, onMaterialChange]);

  // Attribute group helpers
  const addAttrGroup = () =>
    setAttrGroups((prev) => [...prev, { key: "", values: [""] }]);
  const removeAttrGroup = (idx) =>
    setAttrGroups((prev) => prev.filter((_, i) => i !== idx));
  const updateAttrKey = (idx, key) =>
    setAttrGroups((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], key };
      return next;
    });
  const addAttrValue = (gIdx) =>
    setAttrGroups((prev) => {
      const next = [...prev];
      const vals = Array.isArray(next[gIdx].values) ? next[gIdx].values : [""];
      next[gIdx] = { ...next[gIdx], values: [...vals, ""] };
      return next;
    });
  const removeAttrValue = (gIdx, vIdx) =>
    setAttrGroups((prev) => {
      const next = [...prev];
      const vals = (next[gIdx].values || []).filter((_, i) => i !== vIdx);
      next[gIdx] = { ...next[gIdx], values: vals.length ? vals : [""] };
      return next;
    });
  const updateAttrValue = (gIdx, vIdx, value) =>
    setAttrGroups((prev) => {
      const next = [...prev];
      const vals = [...(next[gIdx].values || [""])];
      vals[vIdx] = value;
      next[gIdx] = { ...next[gIdx], values: vals };
      return next;
    });

  const templateCategories = templates.map((t) => t.category);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave();
  };

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
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                      Company <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., ABC Supplies Inc."
                      value={material.company}
                      onChange={(e) =>
                        onMaterialChange("company", e.target.value)
                      }
                      className="w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D3C34] focus:border-[#1D3C34] transition-all bg-white"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Sofa"
                      value={material.category}
                      onChange={(e) =>
                        onMaterialChange("category", e.target.value)
                      }
                      className="w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D3C34] focus:border-[#1D3C34] bg-white"
                      required
                    />
                  </div>

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
                </div>
              </div>

              {/* Attributes Section (free-form groups: Key + multiple Values) */}
              {selectedCategory && (
                <div className="bg-gradient-to-br from-[#f8fffe] to-white rounded-xl p-6 border border-gray-200 shadow-sm mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <div className="w-2 h-6 bg-gradient-to-b from-[#1D3C34] to-[#2a5a47] rounded-full"></div>
                      Attributes
                    </h3>
                    <button
                      type="button"
                      onClick={addAttrGroup}
                      className="text-[#1D3C34] text-sm border px-3 py-1.5 rounded-lg"
                    >
                      + Add Attribute
                    </button>
                  </div>
                  {attrGroups.map((g, gi) => (
                    <div
                      key={`attr-${gi}`}
                      className="mb-4 border border-gray-200 rounded-xl p-4 bg-white"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <input
                          className="flex-1 p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D3C34]"
                          placeholder="Key (e.g., Color)"
                          value={g.key}
                          onChange={(e) => updateAttrKey(gi, e.target.value)}
                        />
                        {attrGroups.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeAttrGroup(gi)}
                            className="text-red-600 border border-red-600 rounded px-3 py-2 text-sm"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <div className="ml-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-gray-600">Values</span>
                          <button
                            type="button"
                            onClick={() => addAttrValue(gi)}
                            className="text-[#1D3C34] text-xs border px-2 py-1 rounded"
                          >
                            + Add Value
                          </button>
                        </div>
                        {(g.values || [""]).map((v, vi) => (
                          <div
                            key={`val-${gi}-${vi}`}
                            className="flex items-center gap-2 mb-2"
                          >
                            <input
                              className="flex-1 p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D3C34]"
                              placeholder="Value (e.g., Deep Green)"
                              value={v}
                              onChange={(e) =>
                                updateAttrValue(gi, vi, e.target.value)
                              }
                            />
                            {g.values && g.values.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeAttrValue(gi, vi)}
                                className="text-red-600 border border-red-600 rounded px-3 py-2 text-sm"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

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
                              Type
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
                              Option Name
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
                              Price Addition (₱)
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

      {/* Message Dialog */}
      {msgDialog.open && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-5 py-3 bg-gradient-to-r from-[#1D3C34] to-[#2a5a47] text-white font-semibold">
              {msgDialog.title || "Notice"}
            </div>
            <div className="p-5 text-gray-700 whitespace-pre-line">
              {msgDialog.message}
            </div>
            <div className="px-5 py-4 border-t flex justify-end">
              <button
                className="px-4 py-2 bg-[#1D3C34] text-white rounded-lg hover:bg-[#1A332E]"
                onClick={() =>
                  setMsgDialog({ open: false, title: "", message: "" })
                }
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Attribute Value Dialog */}
      {valDialog.open && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-5 py-3 bg-gradient-to-r from-[#1D3C34] to-[#2a5a47] text-white font-semibold">
              {`Add new ${valDialog.key} value`}
            </div>
            <div className="p-5 space-y-3">
              <label className="text-sm font-medium text-gray-700">Value</label>
              <input
                type="text"
                autoFocus
                placeholder={`Enter ${valDialog.key} value`}
                value={valDialog.value}
                onChange={(e) =>
                  setValDialog((p) => ({ ...p, value: e.target.value }))
                }
                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D3C34] focus:border-[#1D3C34]"
              />
            </div>
            <div className="px-5 py-4 border-t flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                onClick={() =>
                  setValDialog({
                    open: false,
                    key: "",
                    value: "",
                    saving: false,
                  })
                }
                disabled={valDialog.saving}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-[#1D3C34] text-white rounded-lg hover:bg-[#1A332E] disabled:opacity-50"
                disabled={valDialog.saving || !valDialog.value.trim()}
                onClick={async () => {
                  const value = valDialog.value.trim();
                  if (!value) return;
                  try {
                    setValDialog((p) => ({ ...p, saving: true }));
                    const token = Cookies.get("token");
                    await axios.post(
                      `${serverUrl}/api/attribute-registry`,
                      { key: valDialog.key, value },
                      { headers: { Authorization: `Bearer ${token}` } }
                    );
                    // refresh list
                    const resp = await axios.get(
                      `${serverUrl}/api/attribute-registry`,
                      {
                        headers: { Authorization: `Bearer ${token}` },
                        params: { key: valDialog.key },
                      }
                    );
                    const vals = resp.data?.registry?.values || [];
                    setAttrValuesMap((p) => ({ ...p, [valDialog.key]: vals }));
                    setAttrInputMap((p) => ({ ...p, [valDialog.key]: value }));
                    setValDialog({
                      open: false,
                      key: "",
                      value: "",
                      saving: false,
                    });
                  } catch (e) {
                    setValDialog({
                      open: false,
                      key: "",
                      value: "",
                      saving: false,
                    });
                    setMsgDialog({
                      open: true,
                      title: "Add Value Failed",
                      message:
                        e?.response?.data?.message || "Failed to add value",
                    });
                  }
                }}
              >
                {valDialog.saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MaterialModal;
