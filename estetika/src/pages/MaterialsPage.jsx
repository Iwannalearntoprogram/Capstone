import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import MaterialList from "../components/materials/MaterialList";
import { FiSearch, FiPlus } from "react-icons/fi";
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
    price: [""],
    description: "",
    options: [""],
    category: "",
    image: [""],
  });
  const [selectedImage, setSelectedImage] = useState([]);

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
  }, []);

  const handleAddMaterial = async () => {
    const formData = new FormData();
    const token = Cookies.get("token");

    try {
      selectedImage.forEach((image) => {
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
      newMaterial.image = res.data.imageLink;
    } catch (error) {
      console.error("Error adding material (image upload):", error);
    }

    try {
      const materialData = {
        ...newMaterial,
        price: newMaterial.price.filter((p) => p !== "").map((p) => Number(p)),
        image: newMaterial.image.filter((img) => img !== ""),
        options: newMaterial.options.filter((opt) => opt !== ""),
      };

      console.log("Material data to be sent:", materialData);

      if (materialData.price.length !== materialData.options.length) {
        alert("Price and options must have the same number of items.");
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
      console.error("Error adding material (material post):", err);
    }
  };

  const resetForm = () => {
    setNewMaterial({
      name: "",
      company: "",
      price: [""],
      description: "",
      image: [""],
      options: [""],
      category: "",
    });
  };

  const addPriceField = () => {
    setNewMaterial({
      ...newMaterial,
      price: [...newMaterial.price, ""],
    });
  };

  const addImageField = () => {
    setNewMaterial({
      ...newMaterial,
      image: [...newMaterial.image, ""],
    });
  };

  const addOptionField = () => {
    setNewMaterial({
      ...newMaterial,
      options: [...newMaterial.options, ""],
    });
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

        {/* Only show Add Material button for admin and designer */}
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 ">
          <div className="bg-white p-6 rounded-lg w-[90%] max-w-lg max-h-[85vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Add New Material</h2>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Material Name"
                value={newMaterial.name}
                onChange={(e) =>
                  setNewMaterial({ ...newMaterial, name: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#1D3C34]"
              />

              <input
                type="text"
                placeholder="Company"
                value={newMaterial.company}
                onChange={(e) =>
                  setNewMaterial({ ...newMaterial, company: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#1D3C34]"
              />

              <input
                type="text"
                placeholder="Category"
                value={newMaterial.category}
                onChange={(e) =>
                  setNewMaterial({ ...newMaterial, category: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#1D3C34]"
              />

              <textarea
                placeholder="Description"
                value={newMaterial.description}
                onChange={(e) =>
                  setNewMaterial({
                    ...newMaterial,
                    description: e.target.value,
                  })
                }
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#1D3C34] resize-none"
                rows={3}
              />

              {/* Price Fields */}
              <div>
                <label className="block text-sm font-medium mb-2">Prices</label>
                {newMaterial.price.map((price, index) => (
                  <input
                    key={index}
                    type="number"
                    placeholder={`Price ${index + 1}`}
                    value={price}
                    onChange={(e) => {
                      const newPrices = [...newMaterial.price];
                      newPrices[index] = e.target.value;
                      setNewMaterial({ ...newMaterial, price: newPrices });
                    }}
                    className="w-full p-2 mb-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#1D3C34]"
                  />
                ))}
                <button
                  type="button"
                  onClick={addPriceField}
                  className="text-[#1D3C34] text-sm hover:underline"
                >
                  + Add Price
                </button>
              </div>

              {/* Options Fields */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Options
                </label>
                {newMaterial.options.map((option, index) => (
                  <input
                    key={index}
                    type="text"
                    placeholder={`Option ${
                      index + 1
                    } (e.g., small, medium, large)`}
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...newMaterial.options];
                      newOptions[index] = e.target.value;
                      setNewMaterial({ ...newMaterial, options: newOptions });
                    }}
                    className="w-full p-2 mb-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#1D3C34]"
                  />
                ))}
                <button
                  type="button"
                  onClick={addOptionField}
                  className="text-[#1D3C34] text-sm hover:underline"
                >
                  + Add Option
                </button>
              </div>

              {/* Image Fields */}
              <div>
                <label className="block text-sm font-medium mb-2">Images</label>
                {newMaterial.image.map((image, index) => (
                  <input
                    key={index}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setSelectedImage((prev) => [...prev, file || []]);
                      }
                    }}
                    className="w-full p-2 mb-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#1D3C34]"
                  />
                ))}
                <button
                  type="button"
                  onClick={addImageField}
                  className="text-[#1D3C34] text-sm hover:underline"
                >
                  + Add Image
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMaterial}
                className="px-4 py-2 bg-[#1D3C34] text-white rounded hover:bg-[#145c4b] transition"
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
