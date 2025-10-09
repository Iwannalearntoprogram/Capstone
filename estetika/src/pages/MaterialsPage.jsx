import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import MaterialList from "../components/materials/MaterialList";
import MaterialModal from "../components/materials/MaterialModal";
import DeleteConfirmationModal from "../components/materials/DeleteConfirmationModal";
import Toast from "../components/common/Toast";
import { FiSearch, FiPlus } from "react-icons/fi";
import Cookies from "js-cookie";
import axios from "axios";

const MaterialsPage = () => {
  const [materialsData, setMaterialsData] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingMaterialId, setEditingMaterialId] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [newMaterial, setNewMaterial] = useState({
    name: "",
    company: "",
    price: 0,
    description: "",
    options: [],
    category: "",
    image: [],
    attributes: [],
  });
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedImagePreviews, setSelectedImagePreviews] = useState([]);
  const [existingImageUrls, setExistingImageUrls] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState({
    isVisible: false,
    message: "",
    type: "success",
  });

  const showToast = (message, type = "success") => {
    setToast({ isVisible: true, message, type });
  };

  const hideToast = () => {
    setToast({ ...toast, isVisible: false });
  };

  const serverUrl = import.meta.env.VITE_SERVER_URL;

  // Get user role from localStorage
  useEffect(() => {
    const role = localStorage.getItem("role");
    setUserRole(role);
  }, []);

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const token = Cookies.get("token");
        const res = await axios.get(`${serverUrl}/api/material`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setMaterialsData(res.data.material || []);
      } catch (err) {
        setMaterialsData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMaterials();
  }, [serverUrl]);

  const handleAddMaterial = async () => {
    const formData = new FormData();
    const token = Cookies.get("token");

    // Upload images first
    let imageUrls = [];
    if (selectedImages.length > 0) {
      try {
        selectedImages.forEach((image) => {
          formData.append("image", image);
        });
        const res = await axios.post(
          `${serverUrl}/api/upload/material`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
        imageUrls = res.data.imageLink || [];
      } catch (error) {
        console.error("Error uploading images:", error);
        showToast("Error uploading images. Please try again.", "error");
        return;
      }
    }

    // Create material with new data structure
    try {
      const materialData = {
        name: newMaterial.name,
        company: newMaterial.company,
        price: Number(newMaterial.price),
        description: newMaterial.description,
        image: imageUrls,
        options: newMaterial.options.filter((opt) => opt.option.trim() !== ""),
        category: newMaterial.category,
        attributes: Array.isArray(newMaterial.attributes)
          ? newMaterial.attributes
          : [],
      };

      if (
        !materialData.name ||
        !materialData.company ||
        !materialData.category
      ) {
        showToast(
          "Please fill in all required fields (Name, Company, Category).",
          "warning"
        );
        return;
      }

      const res = await axios.post(`${serverUrl}/api/material`, materialData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const created = res.data.newMaterial || res.data.material;
      if (created) {
        setMaterialsData([...materialsData, created]);
        showToast(
          `Material "${created.name}" created successfully!`,
          "success"
        );
      }
      setShowModal(false);
      resetForm();
    } catch (err) {
      console.error("Error adding material:", err);
      showToast("Error adding material. Please try again.", "error");
    }
  };

  const openEditModal = (material) => {
    setIsEditMode(true);
    setEditingMaterialId(material._id);
    setNewMaterial({
      name: material.name || "",
      company: material.company || "",
      price: material.price ?? 0,
      description: material.description || "",
      options: Array.isArray(material.options) ? material.options : [],
      category: material.category || "",
      image: Array.isArray(material.image) ? material.image : [],
      attributes: Array.isArray(material.attributes) ? material.attributes : [],
    });
    setExistingImageUrls(Array.isArray(material.image) ? material.image : []);
    setSelectedImages([]);
    setSelectedImagePreviews([]);
    setShowModal(true);
  };

  const handleUpdateMaterial = async () => {
    if (!editingMaterialId) return;
    setIsSaving(true);
    const token = Cookies.get("token");

    // Optional image upload for any newly selected files
    let uploadedUrls = [];
    if (selectedImages.length > 0) {
      try {
        const formData = new FormData();
        selectedImages.forEach((image) => formData.append("image", image));
        const uploadRes = await axios.post(
          `${serverUrl}/api/upload/material`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
        uploadedUrls = uploadRes.data.imageLink || [];
      } catch (err) {
        console.error("Error uploading images:", err);
        showToast("Error uploading images. Please try again.", "error");
        setIsSaving(false);
        return;
      }
    }

    const payload = {
      name: newMaterial.name,
      company: newMaterial.company,
      price: Number(newMaterial.price),
      description: newMaterial.description,
      options: newMaterial.options,
      category: newMaterial.category,
      image: [...existingImageUrls, ...uploadedUrls],
      attributes: Array.isArray(newMaterial.attributes)
        ? newMaterial.attributes
        : [],
    };

    try {
      const res = await axios.put(
        `${serverUrl}/api/material?id=${editingMaterialId}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const updated = res.data.updatedMaterial || res.data.material;
      if (updated) {
        setMaterialsData((prev) =>
          prev.map((m) => (m._id === updated._id ? updated : m))
        );
        showToast(
          `Material "${updated.name}" updated successfully!`,
          "success"
        );
      }
      setShowModal(false);
      setIsEditMode(false);
      setEditingMaterialId(null);
      resetForm();
    } catch (err) {
      console.error("Error updating material:", err);
      showToast(
        err.response?.data?.message ||
          "Error updating material. Please try again.",
        "error"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMaterial = async (id, materialData) => {
    const material = materialData || materialsData.find((m) => m._id === id);
    if (!material) return;

    setMaterialToDelete(material);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!materialToDelete) return;

    setIsDeleting(true);
    const token = Cookies.get("token");

    try {
      await axios.delete(`${serverUrl}/api/material`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { id: materialToDelete._id },
      });

      setMaterialsData((prev) =>
        prev.filter((m) => m._id !== materialToDelete._id)
      );
      showToast(
        `Material "${materialToDelete.name}" deleted successfully!`,
        "success"
      );
      setShowDeleteModal(false);
      setMaterialToDelete(null);
    } catch (err) {
      console.error("Error deleting material:", err);
      showToast(
        err.response?.data?.message || "Failed to delete material.",
        "error"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setMaterialToDelete(null);
  };

  const handleMaterialChange = (field, value) => {
    setNewMaterial({ ...newMaterial, [field]: value });
  };

  const resetForm = () => {
    // Clean up any existing preview URLs to prevent memory leaks
    selectedImagePreviews.forEach((url) => URL.revokeObjectURL(url));

    setNewMaterial({
      name: "",
      company: "",
      price: 0,
      description: "",
      image: [],
      options: [],
      category: "",
    });
    setSelectedImages([]);
    setSelectedImagePreviews([]);
    setExistingImageUrls([]);
  };

  const addOptionField = () => {
    setNewMaterial({
      ...newMaterial,
      options: [
        ...newMaterial.options,
        {
          type: "",
          option: "",
          addToPrice: 0,
        },
      ],
    });
  };

  const updateOption = (index, field, value) => {
    const updatedOptions = [...newMaterial.options];
    updatedOptions[index] = {
      ...updatedOptions[index],
      [field]: field === "addToPrice" ? Number(value) : value,
    };
    setNewMaterial({ ...newMaterial, options: updatedOptions });
  };

  const removeOption = (index) => {
    const updatedOptions = newMaterial.options.filter((_, i) => i !== index);
    setNewMaterial({ ...newMaterial, options: updatedOptions });
  };

  const handleImageSelection = (e) => {
    const files = Array.from(e.target.files);
    setSelectedImages((prev) => [...prev, ...files]);

    // Create preview URLs for the new files
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setSelectedImagePreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeImage = (index) => {
    // Clean up the preview URL to prevent memory leaks
    const previewUrl = selectedImagePreviews[index];
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    setSelectedImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImageUrl = (index) => {
    setExistingImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  // Filter states
  const [filterCategory, setFilterCategory] = useState("");
  const [filterCompany, setFilterCompany] = useState("");
  const [sortType, setSortType] = useState(null); // 'sales-desc', 'sales-asc', 'price-desc', 'price-asc', null
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");

  // Get unique values for categories (case-insensitive dedupe + Title Case display)
  const toTitleCase = (str) => {
    if (!str || typeof str !== "string") return "";
    return str
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase()
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  const categories = Array.from(
    materialsData.reduce((set, m) => {
      if (m.category) {
        set.add(toTitleCase(m.category));
      }
      return set;
    }, new Set())
  ).sort();
  const companies = Array.from(
    new Set(materialsData.map((m) => m.company).filter(Boolean))
  );

  // Filtered materials with all filters
  let filteredMaterials = materialsData.filter((mat) => {
    const matchesName = mat.name?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filterCategory
      ? toTitleCase(mat.category) === filterCategory
      : true;
    const matchesCompany = filterCompany ? mat.company === filterCompany : true;
    const matchesPriceMin =
      priceMin !== "" ? Number(mat.price) >= Number(priceMin) : true;
    const matchesPriceMax =
      priceMax !== "" ? Number(mat.price) <= Number(priceMax) : true;
    return (
      matchesName &&
      matchesCategory &&
      matchesCompany &&
      matchesPriceMin &&
      matchesPriceMax
    );
  });

  // Cheaper and More Expensive Alternatives (outside price range, with any filters, but only if price range is set)
  let cheaperAlternatives = [];
  let expensiveAlternatives = [];
  if (priceMin !== "" || priceMax !== "") {
    cheaperAlternatives = materialsData.filter(
      (mat) =>
        (filterCategory ? mat.category === filterCategory : true) &&
        (filterCompany ? mat.company === filterCompany : true) &&
        priceMin !== "" &&
        Number(mat.price) < Number(priceMin)
    );
    expensiveAlternatives = materialsData.filter(
      (mat) =>
        (filterCategory ? mat.category === filterCategory : true) &&
        (filterCompany ? mat.company === filterCompany : true) &&
        priceMax !== "" &&
        Number(mat.price) > Number(priceMax)
    );
  }

  // Sorting logic
  if (sortType === "sales-desc") {
    filteredMaterials = [...filteredMaterials].sort(
      (a, b) => (b.sales || 0) - (a.sales || 0)
    );
  } else if (sortType === "sales-asc") {
    filteredMaterials = [...filteredMaterials].sort(
      (a, b) => (a.sales || 0) - (b.sales || 0)
    );
  } else if (sortType === "price-desc") {
    filteredMaterials = [...filteredMaterials].sort(
      (a, b) => (b.price || 0) - (a.price || 0)
    );
  } else if (sortType === "price-asc") {
    filteredMaterials = [...filteredMaterials].sort(
      (a, b) => (a.price || 0) - (b.price || 0)
    );
  }

  const canAddMaterial = userRole === "storage_admin";
  const canManageMaterials = userRole === "storage_admin";

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-50">
      <div className="w-full max-w-7xl mx-auto p-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Materials Management
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your material inventory and catalog
              </p>
            </div>

            {/* Search and Add Button */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search materials..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-64 p-3 pl-10 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1D3C34] focus:border-transparent shadow-sm transition-all"
                />
                <FiSearch
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
              </div>

              {/* Show Add Material button for admin or storage_admin */}
              {(canAddMaterial || canManageMaterials) && (
                <button
                  onClick={() => setShowModal(true)}
                  className="bg-gradient-to-r from-[#1D3C34] to-[#2a5a47] text-white px-6 py-3 rounded-xl hover:from-[#145c4b] hover:to-[#1e4638] transition-all flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <FiPlus size={20} />
                  Add Material
                </button>
              )}
            </div>
          </div>

          {/* Stats Bar */}
          <div className="mt-6 bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#1D3C34]">
                    {materialsData.length}
                  </div>
                  <div className="text-sm text-gray-600">Total Materials</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#1D3C34]">
                    {filteredMaterials.length}
                  </div>
                  <div className="text-sm text-gray-600">Filtered Results</div>
                </div>
              </div>
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Clear search
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filters - always visible */}
        <div className="flex flex-wrap gap-4 mb-4 items-center justify-center bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          {/* Category Filter (dropdown) */}
          <div className="flex flex-col items-start">
            <span className="font-semibold text-gray-700 mb-1">Category</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-300 bg-gray-100 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1D3C34]"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          {/* Company Filter (dropdown) */}
          <div className="flex flex-col items-start">
            <span className="font-semibold text-gray-700 mb-1">Company</span>
            <select
              value={filterCompany}
              onChange={(e) => setFilterCompany(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-300 bg-gray-100 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1D3C34]"
            >
              <option value="">All Companies</option>
              {companies.map((comp) => (
                <option key={comp} value={comp}>
                  {comp}
                </option>
              ))}
            </select>
          </div>
          {/* Price Range Filter */}
          <div className="flex flex-col items-start">
            <span className="font-semibold text-gray-700 mb-1">
              Price Range
            </span>
            <div className="flex gap-2">
              <input
                type="number"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                placeholder="Min"
                className="px-3 py-2 rounded-xl border border-gray-300 bg-gray-100 text-gray-700 w-36 focus:outline-none focus:ring-2 focus:ring-[#1D3C34]"
                min="0"
                max="100000000"
              />
              <span className="mx-1 text-gray-500">-</span>
              <input
                type="number"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                placeholder="Max"
                className="px-3 py-2 rounded-xl border border-gray-300 bg-gray-100 text-gray-700 w-36 focus:outline-none focus:ring-2 focus:ring-[#1D3C34]"
                min="0"
                max="100000000"
              />
            </div>
          </div>
          {/* Sales/Price Sort Toggle */}
          <div className="flex flex-col items-start">
            <span className="font-semibold text-gray-700 mb-1">Sort By</span>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  setSortType(
                    sortType === "sales-desc" ? "sales-asc" : "sales-desc"
                  )
                }
                className={`px-4 py-2 rounded-xl border transition-all font-semibold flex items-center gap-1 ${
                  sortType && sortType.startsWith("sales")
                    ? "bg-[#1D3C34] text-white border-[#1D3C34]"
                    : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-[#e6f2ef]"
                }`}
                aria-label="Sort by Sales"
              >
                Sales {sortType === "sales-desc" ? "↓" : "↑"}
              </button>
              <button
                onClick={() =>
                  setSortType(
                    sortType === "price-desc" ? "price-asc" : "price-desc"
                  )
                }
                className={`px-4 py-2 rounded-xl border transition-all font-semibold flex items-center gap-1 ${
                  sortType && sortType.startsWith("price")
                    ? "bg-[#1D3C34] text-white border-[#1D3C34]"
                    : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-[#e6f2ef]"
                }`}
                aria-label="Sort by Price"
              >
                Price {sortType === "price-desc" ? "↓" : "↑"}
              </button>
            </div>
          </div>
          {/* Clear Filters Button - aligned */}
          <div className="flex flex-col items-start justify-end">
            <span className="invisible mb-1">Clear</span>
            <button
              onClick={() => {
                setFilterCategory("");
                setFilterCompany("");
                setSortType(null);
                setPriceMin("");
                setPriceMax("");
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#1D3C34] to-[#2a5a47] text-white font-semibold shadow hover:from-[#145c4b] hover:to-[#1e4638] transition-all border border-[#1D3C34]"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#1D3C34] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500">Loading materials...</p>
          </div>
        ) : filteredMaterials.length === 0 ? (
          <>
            {/* Filters are always visible above */}
            <div className="text-center py-20">
              <div className="text-gray-400 mb-4">
                <FiSearch size={48} className="mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {search ? "No materials found" : "No materials yet"}
              </h3>
              <p className="text-gray-600 mb-6">
                {search
                  ? `No materials match "${search}". Try adjusting your search.`
                  : "Get started by adding your first material to the catalog."}
              </p>
              {!search && (canAddMaterial || canManageMaterials) && (
                <button
                  onClick={() => setShowModal(true)}
                  className="bg-gradient-to-r from-[#1D3C34] to-[#2a5a47] text-white px-6 py-3 rounded-xl hover:from-[#145c4b] hover:to-[#1e4638] transition-all flex items-center gap-2 shadow-lg mx-auto"
                >
                  <FiPlus size={20} />
                  Add Your First Material
                </button>
              )}
            </div>
            {/* Alternatives sections if price range is set and category is selected */}
            {(priceMin !== "" || priceMax !== "") && (
              <div className="mt-10">
                {cheaperAlternatives.length > 0 && (
                  <div className="mb-8">
                    <h4 className="text-lg font-bold text-[#1D3C34] mb-2">
                      Cheaper Alternatives
                    </h4>
                    <MaterialList
                      materialsData={cheaperAlternatives}
                      canManageMaterials={canManageMaterials}
                      onEditMaterial={openEditModal}
                      onDeleteMaterial={handleDeleteMaterial}
                    />
                  </div>
                )}
                {expensiveAlternatives.length > 0 && (
                  <div>
                    <h4 className="text-lg font-bold text-[#1D3C34] mb-2">
                      More Expensive Alternatives
                    </h4>
                    <MaterialList
                      materialsData={expensiveAlternatives}
                      canManageMaterials={canManageMaterials}
                      onEditMaterial={openEditModal}
                      onDeleteMaterial={handleDeleteMaterial}
                    />
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            <Outlet
              context={{
                materialsData: filteredMaterials,
                canManageMaterials,
                onEditMaterial: openEditModal,
                onDeleteMaterial: handleDeleteMaterial,
              }}
            />
            {/* Alternatives sections if price range is set and category is selected */}
            {(priceMin !== "" || priceMax !== "") && (
              <div className="mt-10">
                {cheaperAlternatives.length > 0 && (
                  <div className="mb-8">
                    <h4 className="text-lg font-bold text-[#1D3C34] mb-2">
                      Cheaper Alternatives
                    </h4>
                    <MaterialList
                      materialsData={cheaperAlternatives}
                      canManageMaterials={canManageMaterials}
                      onEditMaterial={openEditModal}
                      onDeleteMaterial={handleDeleteMaterial}
                    />
                  </div>
                )}
                {expensiveAlternatives.length > 0 && (
                  <div>
                    <h4 className="text-lg font-bold text-[#1D3C34] mb-2">
                      More Expensive Alternatives
                    </h4>
                    <MaterialList
                      materialsData={expensiveAlternatives}
                      canManageMaterials={canManageMaterials}
                      onEditMaterial={openEditModal}
                      onDeleteMaterial={handleDeleteMaterial}
                    />
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Material Modal */}
      {showModal && (canAddMaterial || canManageMaterials) && (
        <MaterialModal
          isOpen={showModal}
          isEditMode={isEditMode}
          isSaving={isSaving}
          material={newMaterial}
          selectedImages={selectedImages}
          selectedImagePreviews={selectedImagePreviews}
          existingImageUrls={existingImageUrls}
          onClose={() => {
            setShowModal(false);
            setIsEditMode(false);
            setEditingMaterialId(null);
            resetForm();
          }}
          onSave={isEditMode ? handleUpdateMaterial : handleAddMaterial}
          onImageSelection={handleImageSelection}
          onRemoveImage={removeImage}
          onRemoveExistingImage={removeExistingImageUrl}
          onMaterialChange={handleMaterialChange}
          onAddOption={addOptionField}
          onUpdateOption={updateOption}
          onRemoveOption={removeOption}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
        materialName={materialToDelete?.name}
        materialCompany={materialToDelete?.company}
      />

      {/* Toast Notifications */}
      <Toast
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
      />
    </div>
  );
};

export default MaterialsPage;
