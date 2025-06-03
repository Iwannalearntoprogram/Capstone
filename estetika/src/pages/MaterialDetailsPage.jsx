import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import Papa from "papaparse";
import { useNavigate } from "react-router-dom";

function Button({ children, className = "", ...props }) {
  return (
    <button className={`transition ${className}`} {...props}>
      {children}
    </button>
  );
}

export default function MaterialDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
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
        setProjects(response.data.project || []);
      } catch (err) {
        console.error("Error fetching projects:", err);
        setProjects([]);
      }
    };
    if (role === "designer") fetchProjects();
  }, [userRole, serverUrl, token, userId]);

  const [similarProducts, setSimilarProduct] = useState([]);
  const [fetchingSimilarProduct, setFetchingSimilarProduct] = useState(true);

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

  useEffect(() => {
    const fetchSimilar = async () => {
      if (!material || !material.name) {
        setSimilarProduct([]);
        setFetchingSimilarProduct(false);
        return;
      }
      setFetchingSimilarProduct(true);
      try {
        const token = Cookies.get("token");
        const res = await axios.get(
          `${serverUrl}/api/material/search?query=${encodeURIComponent(
            material.name
          )}&max=10`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        console.log(res.data);

        // Use candidates instead of results for more products
        const allProducts = res.data.candidates || res.data.results || [];

        const filtered = allProducts.filter(
          (item) => item._id !== material._id
        );

        const sorted = [...filtered].sort((a, b) => {
          const priceA = Array.isArray(a.price)
            ? Math.min(...a.price)
            : a.price;
          const priceB = Array.isArray(b.price)
            ? Math.min(...b.price)
            : b.price;
          return priceA - priceB;
        });

        // Show more products (up to 8 instead of 4)
        setSimilarProduct(sorted.slice(0, 8));
      } catch (err) {
        setSimilarProduct([]);
      } finally {
        setFetchingSimilarProduct(false);
      }
    };
    fetchSimilar();
  }, [material, serverUrl]);

  const handleQuantityChange = (increment) => {
    setQuantity((prev) => Math.max(1, prev + increment));
  };

  const handleSizeSelect = (size) => {
    setSelectedSize(size);
  };

  const handleProductClick = (productId) => {
    navigate(`/materials/${productId}`);
  };

  const handleAddToSheetClick = () => {
    if (!selectedSize) {
      alert("Please select a size first");
      return;
    }
    setShowAddToSheetModal(true);
  };

  const getFileName = (url) => {
    try {
      const decoded = decodeURIComponent(url);
      const lastSegment = decoded.split("/").pop().split("?")[0];
      return lastSegment.replace(/-\d{10,}-\d+$/, "");
    } catch {
      return url;
    }
  };

  const handleAddToSheet = async () => {
    if (!selectedProject) {
      alert("Please select a project");
      return;
    }

    setIsAddingToSheet(true);
    try {
      // 1. Fetch the selected project to get its files
      const token = Cookies.get("token");
      const projectRes = await axios.get(
        `${serverUrl}/api/project?id=${selectedProject}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const project = projectRes.data.project;
      const files = Array.isArray(project.files) ? project.files : [];
      // 2. Find index.csv in files
      const indexCsvUrl = files.find((url) => getFileName(url) === "index.csv");
      let csvContent = "";
      let rows = [];
      const unitPrice = Array.isArray(material.price)
        ? material.price[material.options.indexOf(selectedSize)] ??
          material.price[0]
        : material.price;
      const newRow = [
        material.name,
        material.company,
        selectedSize,
        quantity,
        unitPrice * quantity,
      ];
      if (indexCsvUrl) {
        // Download and parse existing CSV
        const resp = await axios.get(
          `${serverUrl}/api/upload/fetch-csv?url=${encodeURIComponent(
            indexCsvUrl
          )}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const text = await resp.data;
        const parsed = Papa.parse(text, { skipEmptyLines: true });
        rows = parsed.data;
        rows.push(newRow);
      } else {
        // Create new CSV with headers
        rows = [
          ["Material Name", "Company", "Size", "Quantity", "Price"],
          newRow,
        ];
      }
      // Convert rows to CSV string
      csvContent = Papa.unparse(rows);
      // Upload new CSV to backend
      const blob = new Blob([csvContent], { type: "text/csv" });
      const formData = new FormData();
      formData.append("document", blob, "index.csv");
      let uploadRes;
      try {
        uploadRes = await axios.post(
          `${serverUrl}/api/upload/document?projectId=${selectedProject}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
      } catch (uploadErr) {
        console.error("Upload error:", uploadErr.response?.data || uploadErr);
        alert(
          "Failed to upload CSV: " +
            (uploadErr.response?.data?.message || uploadErr.message)
        );
        setIsAddingToSheet(false);
        return;
      }
      const newCsvUrl = uploadRes.data.documentLink;
      if (!newCsvUrl) {
        alert("Upload failed: No documentLink returned");
        setIsAddingToSheet(false);
        return;
      }
      // Update project.files (replace old index.csv if exists)
      let newFiles = files.filter((url) => getFileName(url) !== "index.csv");
      newFiles.push(newCsvUrl);
      let updateRes;
      try {
        updateRes = await axios.put(
          `${serverUrl}/api/project?id=${selectedProject}`,
          { files: newFiles },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } catch (updateErr) {
        console.error(
          "Project update error:",
          updateErr.response?.data || updateErr
        );
        alert(
          "Failed to update project files: " +
            (updateErr.response?.data?.message || updateErr.message)
        );
        setIsAddingToSheet(false);
        return;
      }
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
              <p className="text-sm text-gray-600">
                Final Price: ₱
                {Array.isArray(material.price)
                  ? (material.price[material.options.indexOf(selectedSize)] ??
                      material.price[0]) * quantity
                  : material.price * quantity}
              </p>
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
              ? selectedSize
                ? `₱${material.price[material.options.indexOf(selectedSize)]}`
                : `₱${material.price[0]} - ₱${
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
          </div>

          {userRole === "designer" && (
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
          )}
        </div>

        <div className="md:col-span-2 mt-10">
          <h3 className="text-xl font-semibold mb-6">
            {Array.isArray(similarProducts) &&
              similarProducts.length > 0 &&
              "Similar Products"}
          </h3>
          {/* Updated grid to show more products */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6 min-h-[180px]">
            {fetchingSimilarProduct ? (
              <div className="col-span-4 flex items-center justify-center text-gray-400 text-lg py-10">
                Loading similar products...
              </div>
            ) : Array.isArray(similarProducts) &&
              similarProducts.length === 0 ? (
              <div className="col-span-4 flex items-center justify-center text-gray-400 text-lg py-10">
                No similar product found.
              </div>
            ) : (
              Array.isArray(similarProducts) &&
              similarProducts.map((product) => (
                <div
                  key={product._id}
                  className="bg-white border rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleProductClick(product._id)}
                >
                  <img
                    src={
                      Array.isArray(product.image)
                        ? product.image[0]
                        : product.image
                    }
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
                      ₱
                      {Array.isArray(product.price)
                        ? product.price[0].toLocaleString()
                        : product.price.toLocaleString()}
                    </p>
                    <div className="flex gap-1 flex-wrap">
                      {Array.isArray(product.options) &&
                        product.options.slice(0, 2).map((option, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                          >
                            {option}
                          </span>
                        ))}
                      {Array.isArray(product.options) &&
                        product.options.length > 2 && (
                          <span className="text-xs text-gray-400">
                            +{product.options.length - 2} more
                          </span>
                        )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
