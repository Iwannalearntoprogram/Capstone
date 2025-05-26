import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";

function Button({ children, className = "", ...props }) {
  return (
    <button className={`transition ${className}`} {...props}>
      {children}
    </button>
  );
}

export default function MaterialDetailsPage() {
  const { id } = useParams();
  const [material, setMaterial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mainImageIdx, setMainImageIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);

  // Add to Sheet Modal States
  const [showAddToSheetModal, setShowAddToSheetModal] = useState(false);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [userRole, setUserRole] = useState(null);
  const [isAddingToSheet, setIsAddingToSheet] = useState(false);

  const serverUrl = import.meta.env.VITE_SERVER_URL;
  const token = Cookies.get("token");
  const userId = localStorage.getItem("id");

  useEffect(() => {
    const role = localStorage.getItem("role");
    setUserRole(role);
  }, []);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!userRole) return;

      try {
        const response = await axios.get(
          `${serverUrl}/api/project?${
            userRole === "admin" ? "index=true" : `member=${userId}`
          }`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        console.log("Projects fetched:", response.data.project);
        setProjects(response.data.project || []);
      } catch (err) {
        console.error("Error fetching projects:", err);
        setProjects([]);
      }
    };
    fetchProjects();
  }, [userRole, serverUrl, token, userId]);

  const similarProducts = [
    {
      id: "similar-1",
      name: "Premium Oak Flooring",
      company: "WoodCraft Co.",
      price: 1200,
      image:
        "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=300&h=300&fit=crop",
      options: ["12mm", "15mm", "18mm"],
    },
    {
      id: "similar-2",
      name: "Luxury Vinyl Tiles",
      company: "FloorMax",
      price: 850,
      image:
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=300&fit=crop",
      options: ["4mm", "6mm", "8mm"],
    },
    {
      id: "similar-3",
      name: "Ceramic Bathroom Tiles",
      company: "TileWorks",
      price: 650,
      image:
        "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=300&h=300&fit=crop",
      options: ["300x300", "600x600", "400x800"],
    },
    {
      id: "similar-4",
      name: "Natural Stone Tiles",
      company: "StoneHouse",
      price: 1800,
      image:
        "https://images.unsplash.com/photo-1615971677499-5467cbab01c0?w=300&h=300&fit=crop",
      options: ["400x400", "600x600", "800x800"],
    },
    {
      id: "similar-5",
      name: "Bamboo Flooring",
      company: "EcoFloor",
      price: 950,
      image:
        "https://images.unsplash.com/photo-1551298370-9c50423c9748?w=300&h=300&fit=crop",
      options: ["12mm", "14mm", "16mm"],
    },
    {
      id: "similar-6",
      name: "Marble Effect Tiles",
      company: "Luxe Tiles",
      price: 2200,
      image:
        "https://images.unsplash.com/photo-1615464118793-f82ed9f1548a?w=300&h=300&fit=crop",
      options: ["600x600", "800x800", "1200x600"],
    },
  ];

  useEffect(() => {
    const fetchMaterial = async () => {
      try {
        const token = Cookies.get("token");
        const res = await axios.get(`${serverUrl}/api/material?id=${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setMaterial(res.data.material);
        if (res.data.material.options && res.data.material.options.length > 0) {
          setSelectedSize(res.data.material.options[0]);
        }
      } catch (err) {
        setMaterial(null);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchMaterial();
  }, [id, serverUrl]);

  const handleQuantityChange = (increment) => {
    setQuantity((prev) => Math.max(1, prev + increment));
  };

  const handleSizeSelect = (size) => {
    setSelectedSize(size);
  };

  const handleProductClick = (productId) => {
    console.log(`Navigate to product: ${productId}`);
  };

  const handleAddToSheetClick = () => {
    if (!selectedSize) {
      alert("Please select a size first");
      return;
    }
    setShowAddToSheetModal(true);
  };

  const handleAddToSheet = async () => {
    if (!selectedProject) {
      alert("Please select a project");
      return;
    }

    setIsAddingToSheet(true);
    try {
      await axios.post(
        `${serverUrl}/api/`,
        {
          projectId: selectedProject,
          materialId: material._id,
          materialName: material.name,
          company: material.company,
          selectedSize: selectedSize,
          quantity: quantity,
          price: Array.isArray(material.price)
            ? material.price[0]
            : material.price,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Material added to project sheet successfully!");
      setShowAddToSheetModal(false);
      setSelectedProject("");
    } catch (err) {
      console.error("Error adding to sheet:", err);
      alert("Failed to add material to sheet");
    } finally {
      setIsAddingToSheet(false);
    }
  };

  if (loading) {
    return <div className="p-10 text-gray-400">Loading material...</div>;
  }

  if (!material) {
    return <div className="p-10 text-red-400">Material not found.</div>;
  }

  return (
    <>
      {showAddToSheetModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add to Project Sheet</h2>
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-sm mb-2">Material Details:</h3>
              <p className="text-sm text-gray-600">Name: {material.name}</p>
              <p className="text-sm text-gray-600">
                Company: {material.company}
              </p>
              <p className="text-sm text-gray-600">Size: {selectedSize}</p>
              <p className="text-sm text-gray-600">Quantity: {quantity}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Select Project:
              </label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#1D3C34]"
                disabled={isAddingToSheet}
              >
                <option value="">Choose a project...</option>
                {projects.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.title}
                  </option>
                ))}
              </select>
            </div>

            {projects.length === 0 && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-700">
                  No projects found. Create a project first to add materials.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowAddToSheetModal(false);
                  setSelectedProject("");
                }}
                className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400 transition"
                disabled={isAddingToSheet}
              >
                Cancel
              </button>
              <button
                onClick={handleAddToSheet}
                disabled={!selectedProject || isAddingToSheet}
                className="px-4 py-2 bg-[#1D3C34] text-white rounded hover:bg-[#145c4b] transition disabled:opacity-50"
              >
                {isAddingToSheet ? "Adding..." : "Add to Sheet"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 px-10 py-10">
        <div className="flex gap-4">
          <div className="flex flex-col gap-4">
            {material.image?.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`thumb${idx + 1}`}
                className={`w-20 h-20 border rounded object-cover cursor-pointer ${
                  mainImageIdx === idx ? "ring-2 ring-[#1D3C34]" : ""
                }`}
                style={{ height: "80px", width: "80px" }}
                onClick={() => setMainImageIdx(idx)}
              />
            ))}
          </div>
          <div className="flex-1 flex items-center">
            <img
              src={material.image?.[mainImageIdx]}
              alt="main"
              className="w-[45rem] h-[28rem] rounded-lg shadow-md object-contain bg-white"
            />
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold">{material.name}</h2>
          <p className="text-sm text-gray-600">COMPANY: {material.company}</p>
          <p className="text-2xl font-semibold mt-4">
            {Array.isArray(material.price)
              ? `₱${material.price[0]} - ₱${
                  material.price[material.price.length - 1]
                }`
              : `₱${material.price}`}
          </p>
          <p className="text-gray-600 mt-2 text-sm">{material.description}</p>

          <div className="mt-6">
            <p className="text-sm font-medium mb-2">Choose Size</p>
            <div className="flex gap-2">
              {material.options?.map((size) => (
                <Button
                  key={size}
                  className={`px-3 py-1 rounded-full border transition-colors ${
                    selectedSize === size
                      ? "bg-[#1D3C34] text-white border-[#1D3C34]"
                      : "bg-white border-gray-300 hover:border-[#1D3C34]"
                  }`}
                  onClick={() => handleSizeSelect(size)}
                >
                  {size}
                </Button>
              ))}
            </div>
            {selectedSize && (
              <p className="text-sm text-gray-500 mt-1">
                Selected: {selectedSize}
              </p>
            )}
          </div>

          <div className="mt-6 flex items-center gap-4">
            <div className="flex items-center border px-2 rounded">
              <Button
                className="px-2 py-1 hover:bg-gray-100"
                onClick={() => handleQuantityChange(-1)}
              >
                -
              </Button>
              <span className="px-4 py-1">{quantity}</span>
              <Button
                className="px-2 py-1 hover:bg-gray-100"
                onClick={() => handleQuantityChange(1)}
              >
                +
              </Button>
            </div>
            <Button
              className="bg-[#1D3C34] text-white px-6 py-2 rounded-full hover:bg-[#145c4b] transition"
              onClick={handleAddToSheetClick}
            >
              Add to Sheet
            </Button>
          </div>

          {selectedSize && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium">Selected Options:</p>
              <p className="text-sm text-gray-600">Size: {selectedSize}</p>
              <p className="text-sm text-gray-600">Quantity: {quantity}</p>
            </div>
          )}
        </div>

        <div className="md:col-span-2 mt-10">
          <h3 className="text-xl font-semibold mb-6">Similar Products</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {similarProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white border rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleProductClick(product.id)}
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-40 object-cover rounded-t-lg"
                />
                <div className="p-4">
                  <h4 className="font-medium text-sm text-gray-800 mb-1 line-clamp-2">
                    {product.name}
                  </h4>
                  <p className="text-xs text-gray-500 mb-2">
                    {product.company}
                  </p>
                  <p className="font-semibold text-[#1D3C34] mb-2">
                    ₱{product.price.toLocaleString()}
                  </p>
                  <div className="flex gap-1 flex-wrap">
                    {product.options.slice(0, 2).map((option, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                      >
                        {option}
                      </span>
                    ))}
                    {product.options.length > 2 && (
                      <span className="text-xs text-gray-400">
                        +{product.options.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
