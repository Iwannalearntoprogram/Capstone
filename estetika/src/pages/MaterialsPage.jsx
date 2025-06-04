import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import MaterialList from "../components/materials/MaterialList";
import { FiSearch, FiPlus, FiTrash2 } from "react-icons/fi";
import Cookies from "js-cookie";
import axios from "axios";

const MaterialsPage = () => {
  const [materialsData, setMaterialsData] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [newMaterial, setNewMaterial] = useState({
    name: "",
    company: "",
    price: 0,
    description: "",
    options: [],
    category: "",
    image: [],
  });
  const [selectedImages, setSelectedImages] = useState([]);

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
        console.log("Image upload response:", res);
        imageUrls = res.data.imageLink || [];
      } catch (error) {
        console.error("Error uploading images:", error);
        alert("Error uploading images. Please try again.");
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
      };

      console.log("Material data to be sent:", materialData);

      if (
        !materialData.name ||
        !materialData.company ||
        !materialData.category
      ) {
        alert("Please fill in all required fields (Name, Company, Category).");
        return;
      }

      const res = await axios.post(`${serverUrl}/api/material`, materialData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Material add response:", res);

      setMaterialsData([...materialsData, res.data.material]);
      setShowModal(false);
      resetForm();
    } catch (err) {
      console.error("Error adding material:", err);
      alert("Error adding material. Please try again.");
    }
  };

  const resetForm = () => {
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
  };

  const removeImage = (index) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const filteredMaterials = materialsData.filter((mat) =>
    mat.name?.toLowerCase().includes(search.toLowerCase())
  );

  const canAddMaterial = userRole === "admin";

  return (
    <div className="flex flex-col items-center">
      <div className="mb-8 w-full flex items-center">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="Search materials..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-2 pl-10 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#1D3C34]"
          />
          <FiSearch
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />
        </div>

        {/* Only show Add Material button for admin */}
        {canAddMaterial && (
          <button
            onClick={() => setShowModal(true)}
            className="ml-4 bg-[#1D3C34] text-white px-4 py-2 rounded-full hover:bg-[#145c4b] transition flex items-center gap-2"
          >
            <FiPlus size={20} />
            Add Material
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-gray-400 py-8">Loading materials...</div>
      ) : (
        <Outlet context={{ materialsData: filteredMaterials }} />
      )}

      {/* Only show modal if user can add materials */}
      {showModal && canAddMaterial && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-[90%] max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Add New Material</h2>

            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Material Name *"
                  value={newMaterial.name}
                  onChange={(e) =>
                    setNewMaterial({ ...newMaterial, name: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D3C34] focus:border-transparent"
                />

                <input
                  type="text"
                  placeholder="Company *"
                  value={newMaterial.company}
                  onChange={(e) =>
                    setNewMaterial({ ...newMaterial, company: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D3C34] focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Category *"
                  value={newMaterial.category}
                  onChange={(e) =>
                    setNewMaterial({ ...newMaterial, category: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D3C34] focus:border-transparent"
                />

                <input
                  type="number"
                  placeholder="Base Price *"
                  value={newMaterial.price}
                  onChange={(e) =>
                    setNewMaterial({ ...newMaterial, price: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D3C34] focus:border-transparent"
                />
              </div>

              <textarea
                placeholder="Description"
                value={newMaterial.description}
                onChange={(e) =>
                  setNewMaterial({
                    ...newMaterial,
                    description: e.target.value,
                  })
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D3C34] focus:border-transparent resize-none"
                rows={3}
              />

              {/* Options Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Material Options
                  </label>
                  <button
                    type="button"
                    onClick={addOptionField}
                    className="bg-[#1D3C34] text-white px-3 py-1 rounded-lg text-sm hover:bg-[#145c4b] transition flex items-center gap-1"
                  >
                    <FiPlus size={14} />
                    Add Option
                  </button>
                </div>

                {newMaterial.options.length === 0 ? (
                  <div className="text-gray-500 text-center py-4 border-2 border-dashed border-gray-300 rounded-lg">
                    No options added yet. Click "Add Option" to start.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {newMaterial.options.map((option, index) => (
                      <div
                        key={index}
                        className="p-4 bg-gray-50 rounded-lg border"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-gray-700">
                            Option {index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeOption(index)}
                            className="text-red-500 hover:text-red-700 transition"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <select
                            value={option.type}
                            onChange={(e) =>
                              updateOption(index, "type", e.target.value)
                            }
                            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D3C34] focus:border-transparent"
                          >
                            <option value="">Select Type</option>
                            <option value="size">Size</option>
                            <option value="color">Color</option>
                            <option value="type">Type</option>
                          </select>

                          <input
                            type="text"
                            placeholder="Option name"
                            value={option.option}
                            onChange={(e) =>
                              updateOption(index, "option", e.target.value)
                            }
                            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D3C34] focus:border-transparent"
                          />

                          <input
                            type="number"
                            placeholder="Price addition"
                            value={option.addToPrice}
                            onChange={(e) =>
                              updateOption(index, "addToPrice", e.target.value)
                            }
                            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D3C34] focus:border-transparent"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Images Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Images
                </label>

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelection}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D3C34] focus:border-transparent"
                />

                {selectedImages.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-600 mb-2">
                      Selected Images ({selectedImages.length}):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedImages.map((image, index) => (
                        <div
                          key={index}
                          className="relative bg-gray-100 p-2 rounded-lg"
                        >
                          <span className="text-xs text-gray-600">
                            {image.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="ml-2 text-red-500 hover:text-red-700"
                          >
                            <FiTrash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMaterial}
                className="px-6 py-2 bg-[#1D3C34] text-white rounded-lg hover:bg-[#145c4b] transition"
              >
                Add Material
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialsPage;
