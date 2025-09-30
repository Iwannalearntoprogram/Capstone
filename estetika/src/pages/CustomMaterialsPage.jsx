import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaSearch, FaPlus } from "react-icons/fa";
import Cookies from "js-cookie";
import axios from "axios";
// import MaterialList from "../components/materials/MaterialList";
import MaterialModal from "../components/materials/MaterialModal";
import DeleteConfirmationModal from "../components/materials/DeleteConfirmationModal";
import Toast from "../components/common/Toast";
import CustomMaterial from "../components/materials/CustomMaterial";

const CustomMaterialsPage = () => {
  const [userRole, setUserRole] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState({
    isVisible: false,
    message: "",
    type: "success",
  });
  // Filters
  // Removed filters for available materials
  const navigate = useNavigate();
  const serverUrl = import.meta.env.VITE_SERVER_URL;

  useEffect(() => {
    const role = localStorage.getItem("role");
    setUserRole(role);
    if (role !== "storage_admin") {
      navigate("/not-authorized");
    }
  }, [navigate]);

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const token = Cookies.get("token");
        const res = await axios.get(`${serverUrl}/api/material`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMaterials(res.data.material || []);
      } catch {
        setMaterials([]);
      }
    };
    fetchMaterials();
  }, [serverUrl]);

  const handleSearch = (e) => setSearchTerm(e.target.value);

  const filteredMaterials = materials.filter(
    (mat) =>
      mat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mat.company.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const groupedMaterials = {
    pending: filteredMaterials.filter((mat) => mat.status === "pending"),
    ongoing: filteredMaterials.filter((mat) => mat.status === "ongoing"),
    completed: filteredMaterials.filter((mat) => mat.status === "completed"),
    cancelled: filteredMaterials.filter((mat) => mat.status === "cancelled"),
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setEditingMaterial(null);
    setShowModal(true);
  };

  const openEditModal = (material) => {
    setIsEditMode(true);
    setEditingMaterial(material);
    setShowModal(true);
  };

  const openDeleteModal = (material) => {
    setMaterialToDelete(material);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setMaterialToDelete(null);
    setShowDeleteModal(false);
  };

  const showToast = (message, type = "success") => {
    setToast({ isVisible: true, message, type });
    setTimeout(() => setToast({ ...toast, isVisible: false }), 3000);
  };

  // Collapsible section state for grouped requests
  const [expandedSections, setExpandedSections] = useState({
    pending: true,
    ongoing: true,
    completed: false,
    cancelled: false,
  });

  const toggleSection = (sectionKey) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  return (
    <div className="px-4 py-8 mx-auto">
      <div className="flex justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-[#21413A]">Material Requests</h1>
        <button
          onClick={openAddModal}
          className="bg-[#21413A] text-white px-4 py-2 rounded-full font-semibold flex items-center gap-2 hover:bg-[#16302B] transition-colors whitespace-nowrap"
        >
          <FaPlus /> Create Request
        </button>
      </div>
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-2 w-full max-w-sm border rounded-full px-3 py-2 shadow-sm bg-gray-50">
          <FaSearch className="text-gray-400" />
          <input
            type="text"
            placeholder="Search material requests..."
            className="w-full outline-none bg-gray-50"
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
      </div>

      {/* Status Sections */}
      {[
        { key: "pending", label: "Pending Material Requests" },
        { key: "ongoing", label: "Ongoing Material Requests" },
        { key: "completed", label: "Completed Material Requests" },
        { key: "cancelled", label: "Cancelled Material Requests" },
      ].map((section) => (
        <div className="mb-4" key={section.key}>
          <div
            className="flex items-center justify-between p-3 rounded-lg cursor-pointer bg-gray-50 transition border"
            onClick={() => toggleSection(section.key)}
          >
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-800">
                {section.label} ({groupedMaterials[section.key].length})
              </h2>
            </div>
            {expandedSections[section.key] ? (
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 15l7-7 7 7"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            )}
          </div>
          {expandedSections[section.key] && (
            <div className="mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {groupedMaterials[section.key].length > 0 ? (
                  groupedMaterials[section.key].map((material) => (
                    <div
                      key={material._id || material.name}
                      className="bg-white rounded-xl shadow p-5 border flex flex-col gap-2 relative"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div
                          className="font-bold text-lg text-[#21413A] truncate"
                          title={material.name}
                        >
                          {material.name}
                        </div>
                        <div className="flex gap-2">
                          <button
                            className="text-blue-600 hover:text-blue-800 p-1 rounded"
                            onClick={() => openEditModal(material)}
                            title="Edit"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15.232 5.232l3.536 3.536M9 13l6-6m2 2l-6 6m-2 2H7v-2a2 2 0 012-2h2v2a2 2 0 01-2 2z"
                              />
                            </svg>
                          </button>
                          <button
                            className="text-red-600 hover:text-red-800 p-1 rounded"
                            onClick={() => openDeleteModal(material)}
                            title="Delete"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div
                        className="text-gray-700 text-sm mb-1 truncate"
                        title={material.company}
                      >
                        <span className="font-semibold">Company:</span>{" "}
                        {material.company}
                      </div>
                      <div className="text-gray-700 text-sm mb-1">
                        <span className="font-semibold">Type:</span>{" "}
                        {material.type || "-"}
                      </div>
                      <div className="text-gray-700 text-sm mb-1">
                        <span className="font-semibold">Unit:</span>{" "}
                        {material.unit || "-"}
                      </div>
                      <div className="text-gray-700 text-sm mb-1">
                        <span className="font-semibold">Price:</span> ₱
                        {material.price?.toLocaleString() || "-"}
                      </div>
                    </div>
                  ))
                ) : section.key === "pending" ? (
                  <div className="col-span-full flex justify-start">
                    <CustomMaterial status="Pending" />
                  </div>
                ) : (
                  <div className="text-gray-500 col-span-full">
                    No materials found.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
      {/* Modals and Toasts */}
      {showModal && (
        <MaterialModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          isEditMode={isEditMode}
          material={editingMaterial}
          onSuccess={() =>
            showToast(isEditMode ? "Material updated!" : "Material added!")
          }
        />
      )}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={closeDeleteModal}
        onConfirm={() => showToast("Material deleted!")}
        isDeleting={isDeleting}
        materialName={materialToDelete?.name}
        materialCompany={materialToDelete?.company}
      />
      <Toast
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />
    </div>
  );
};

export default CustomMaterialsPage;
