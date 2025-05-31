import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import Cookies from "js-cookie";
import axios from "axios";
import {
  FaArrowLeft,
  FaPlus,
  FaShoppingCart,
  FaBox,
  FaIndustry,
  FaTags,
  FaTrash,
} from "react-icons/fa";
import Papa from "papaparse"; // Make sure papaparse is installed

export default function MaterialsTab() {
  const { project } = useOutletContext();
  const [showModal, setShowModal] = useState(false);
  const [selectedMaterials, setSelectedMaterials] = useState([""]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  const [bestMatch, setBestMatch] = useState(null);
  const [showAddToSheetModal, setShowAddToSheetModal] = useState(false);
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isAddingToSheet, setIsAddingToSheet] = useState(false);

  const serverUrl = import.meta.env.VITE_SERVER_URL;

  // Get materials from localStorage for this project
  const storedMaterials = (() => {
    if (project && project._id) {
      try {
        const data = localStorage.getItem(project._id);
        return data ? JSON.parse(data) : [];
      } catch {
        return [];
      }
    }
    return [];
  })();

  // Helper for price formatting
  const formatPrice = (priceArr) => {
    if (!priceArr || !priceArr.length) return "-";
    if (priceArr.length > 1) {
      return `₱${priceArr[0].toLocaleString()} - ₱${priceArr[
        priceArr.length - 1
      ].toLocaleString()}`;
    }
    return `₱${priceArr[0].toLocaleString()}`;
  };

  // Sidebar state for selected material
  const [selectedSidebar, setSelectedSidebar] = useState(
    storedMaterials.length > 0 ? storedMaterials[0].name : ""
  );

  useEffect(() => {
    const controller = new AbortController();
    const fetchBestMatch = async () => {
      if (!selectedSidebar) {
        setBestMatch(null);
        return;
      }
      setLoading(true);
      try {
        const token = Cookies.get("token");
        const res = await axios.get(
          `${serverUrl}/api/material/match?query=${selectedSidebar}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        );
        console.log("response:", res.data);
        setBestMatch(res.data?.result?.bestMatch || null);
      } catch (err) {
        if (axios.isCancel(err)) {
          // Request was cancelled
        } else {
          setBestMatch(null);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchBestMatch();
    return () => {
      controller.abort();
    };
  }, [selectedSidebar, serverUrl]);

  // Update sidebar selection if materials change
  useEffect(() => {
    setLoading(true);
    if (
      storedMaterials.length > 0 &&
      !storedMaterials.find((m) => m.name === selectedSidebar)
    ) {
      setSelectedSidebar(storedMaterials[0].name);
    }
    if (storedMaterials.length === 0) setSelectedSidebar("");
  }, [storedMaterials]);

  // Helper to get file name from URL
  const getFileName = (url) => {
    try {
      return url.split("/").pop().split("?")[0];
    } catch {
      return "";
    }
  };

  const handleAddToSheet = async () => {
    if (!project || !project._id) {
      alert("Please select a project");
      return;
    }
    if (!bestMatch) return;
    setIsAddingToSheet(true);
    try {
      const token = Cookies.get("token");
      // 1. Fetch the selected project to get its files
      const projectRes = await axios.get(
        `${serverUrl}/api/project?id=${project._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const proj = projectRes.data.project;
      const files = Array.isArray(proj.files) ? proj.files : [];
      // 2. Find index.csv in files
      const indexCsvUrl = files.find((url) => getFileName(url) === "index.csv");
      let csvContent = "";
      let rows = [];
      const unitPrice = Array.isArray(bestMatch.price)
        ? bestMatch.price[bestMatch.options?.indexOf(selectedSize) ?? 0] ??
          bestMatch.price[0]
        : bestMatch.price;
      const newRow = [
        bestMatch.name,
        bestMatch.company,
        selectedSize || (bestMatch.options?.[0] ?? "Standard"),
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
          `${serverUrl}/api/upload/document?projectId=${project._id}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
      } catch (uploadErr) {
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
      try {
        await axios.put(
          `${serverUrl}/api/project?id=${project._id}`,
          { files: newFiles },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } catch (updateErr) {
        alert(
          "Failed to update project files: " +
            (updateErr.response?.data?.message || updateErr.message)
        );
        setIsAddingToSheet(false);
        return;
      }
      alert("Material added to project sheet successfully!");
      location.reload();
      setShowAddToSheetModal(false);
      setSelectedSize("");
      setQuantity(1);
    } catch (err) {
      alert("Failed to add material to sheet");
    } finally {
      setIsAddingToSheet(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center space-x-4 px-6 py-5">
          <button className="group p-3 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:shadow-md">
            <FaArrowLeft className="h-5 w-5 text-gray-600 group-hover:text-[#1D3C34] transition-colors" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 capitalize tracking-tight">
              {selectedSidebar || "Materials"}
            </h1>
            <p className="text-sm text-gray-500 mt-1 font-medium">
              Browse and select premium materials
            </p>
          </div>
        </div>
      </div>

      <div className="flex h-screen">
        {/* Left Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-6">
            {/* Sidebar Header */}
            <div className="mb-8 flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2 tracking-tight">
                  {project?.title || "Project Materials"}
                </h2>
                <p className="text-sm text-gray-500 font-medium">
                  Material Breakdown
                </p>
                <div className="mt-3 flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-[#1D3C34]"></div>
                  <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                    {storedMaterials.length} Items Available
                  </span>
                </div>
              </div>
              <button
                className="group bg-gradient-to-r from-[#1D3C34] to-[#145c4b] text-white px-4 py-3 rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
                onClick={() => setShowModal(true)}
                title="Add Material"
              >
                <FaPlus className="text-sm group-hover:rotate-90 transition-transform duration-300" />
                <span className="text-sm font-semibold">Add</span>
              </button>
            </div>

            {/* Materials List */}
            <div className="space-y-3">
              {storedMaterials.length > 0 ? (
                storedMaterials.map((item, index) => (
                  <div
                    key={item._id}
                    onClick={() => setSelectedSidebar(item.name)}
                    className={`group w-full text-left p-5 rounded-2xl transition-all duration-300 border-2 transform hover:scale-[1.02] relative ${
                      selectedSidebar === item.name
                        ? " border-[#1D3C34] shadow-lg shadow-[#1D3C34]/10"
                        : "bg-gradient-to-r from-gray-50 to-gray-100 border-transparent hover:border-[#1D3C34]/30 hover:shadow-md"
                    }`}
                  >
                    {/* Absolute Trash Button */}
                    {selectedSidebar === item.name && (
                      <button
                        type="button"
                        className="absolute top-2 right-2 z-10  flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-300"
                        title="Remove Material"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Remove from localStorage
                          if (project && project._id) {
                            const updated = storedMaterials.filter(
                              (mat) => mat._id !== item._id
                            );
                            localStorage.setItem(
                              project._id,
                              JSON.stringify(updated)
                            );
                            window.location.reload();
                          }
                        }}
                      >
                        <FaTrash className="h-3 w-3 text-gray-400 cursor-pointer hover:text-red-400" />
                      </button>
                    )}
                    {/* Card Content */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <div
                            className={`w-3 h-3 rounded-full transition-all duration-300 ${
                              selectedSidebar === item.name
                                ? "bg-[#1D3C34] shadow-lg shadow-[#1D3C34]/30"
                                : "bg-gray-300 group-hover:bg-[#1D3C34]/50"
                            }`}
                          ></div>
                          {selectedSidebar === item.name && (
                            <div className="absolute -inset-1 bg-[#1D3C34]/20 rounded-full animate-pulse"></div>
                          )}
                        </div>
                        <div>
                          <span
                            className={`font-bold text-sm tracking-wide ${
                              selectedSidebar === item.name
                                ? "text-[#1D3C34]"
                                : "text-gray-700 group-hover:text-[#1D3C34]"
                            }`}
                          >
                            {item.name}
                          </span>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-gray-500 font-medium">
                              {item.options && item.options.length > 0
                                ? item.options.join(" • ")
                                : "Standard"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span
                          className={`text-sm font-bold ${
                            selectedSidebar === item.name
                              ? "text-[#1D3C34]"
                              : "text-gray-600"
                          }`}
                        >
                          {formatPrice(item.price)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 px-4">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl flex items-center justify-center">
                    <FaShoppingCart className="h-8 w-8 text-gray-400" />
                  </div>
                  <div className="text-gray-500 font-medium">
                    No materials yet
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Add materials to get started
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-br from-[#f8fffe] via-white to-[#f0fdf4]">
          <div className="p-8">
            {loading ? (
              <div className="text-center py-20">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-200 to-gray-300 rounded-3xl flex items-center justify-center animate-pulse">
                  <FaShoppingCart className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-600 mb-3 tracking-tight">
                  Finding best match for{" "}
                  <span className="text-[#1D3C34]">{selectedSidebar}</span>...
                </h3>
                <p className="text-gray-500 font-medium max-w-md mx-auto leading-relaxed">
                  Please wait while we search for the best material match.
                </p>
              </div>
            ) : bestMatch ? (
              <div className="max-w-lg mx-auto">
                {/* Best Match Heading */}
                <h2 className="text-xl font-bold text-[#1D3C34] mb-4 text-center">
                  Best Match for: {selectedSidebar}
                </h2>
                {/* Material Card */}
                <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 transform hover:scale-[1.02]">
                  {/* Product Image */}
                  <div className="relative overflow-hidden bg-gradient-to-br from-[#f0fdf4] to-[#ecfdf5]">
                    <img
                      src={
                        Array.isArray(bestMatch.image)
                          ? bestMatch.image[0]
                          : bestMatch.image
                      }
                      alt={bestMatch.name}
                      className="w-full h-80 object-cover hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    {/* Title and Description */}
                    <div className="mb-4">
                      <h3 className="font-bold text-2xl text-gray-900 mb-3 tracking-tight">
                        {bestMatch.name}
                      </h3>
                      <p className="text-gray-600 leading-relaxed font-medium">
                        {bestMatch.description}
                      </p>
                    </div>

                    {/* Price */}
                    <div className="mb-8">
                      <div className="flex items-baseline space-x-2">
                        <span className="text-4xl font-bold text-[#1D3C34] tracking-tight">
                          {formatPrice(bestMatch.price)}
                        </span>
                        <span className="text-sm text-gray-500 font-medium">
                          per unit
                        </span>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 gap-4 mb-8">
                      <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                        <div className="w-8 h-8 bg-[#1D3C34] rounded-lg flex items-center justify-center">
                          <FaIndustry className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                            Company
                          </span>
                          <div className="text-sm font-bold text-gray-800">
                            {bestMatch.company}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                        <div className="w-8 h-8 bg-[#1D3C34] rounded-lg flex items-center justify-center">
                          <FaTags className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                            Category
                          </span>
                          <div className="text-sm font-bold text-gray-800">
                            {bestMatch.category}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                        <div className="w-8 h-8 bg-[#1D3C34] rounded-lg flex items-center justify-center">
                          <FaBox className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                            Options
                          </span>
                          <div className="text-sm font-bold text-gray-800">
                            {bestMatch.options && bestMatch.options.length > 0
                              ? bestMatch.options.join(" • ")
                              : "Standard"}
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Add to Project Button */}
                    <div className="flex justify-center">
                      <button
                        className="px-6 py-3 bg-[#1D3C34] text-white rounded-xl font-semibold hover:bg-[#145c4b] transition flex items-center gap-2 shadow-lg"
                        onClick={() => setShowAddToSheetModal(true)}
                        disabled={!project || !project._id || !bestMatch}
                      >
                        <FaShoppingCart />
                        Add to Project
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-200 to-gray-300 rounded-3xl flex items-center justify-center">
                  <FaShoppingCart className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-600 mb-3 tracking-tight">
                  No materials selected
                </h3>
                <p className="text-gray-500 font-medium max-w-md mx-auto leading-relaxed">
                  Choose a material from the sidebar to view its details and add
                  it to your project.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div
            className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full max-h-[80vh] overflow-y-auto overflow-x-hidden relative"
            style={{ scrollbarWidth: "thin" }}
          >
            <button
              className="absolute top-2 right-4 text-gray-500 text-2xl"
              onClick={() => setShowModal(false)}
            >
              &times;
            </button>
            <h3 className="text-2xl font-bold mb-4 text-center">
              Add Material
            </h3>
            {/* Show current items in localStorage */}
            {storedMaterials.length > 0 && (
              <div className="mb-4">
                <div className="font-semibold text-gray-700 mb-1 text-sm">
                  Current Materials:
                </div>
                <ul className="mb-2 max-h-32 overflow-y-auto text-xs">
                  {storedMaterials.map((mat) => (
                    <li
                      key={mat._id}
                      className="flex items-center justify-between py-1 border-b border-gray-100 last:border-b-0"
                    >
                      <span>
                        <span className="font-bold">{mat.name}</span>
                        {mat.options && mat.options.length > 0 && (
                          <span className="text-gray-500">
                            {" "}
                            ({mat.options.join(", ")})
                          </span>
                        )}
                      </span>
                      <span className="text-gray-600 font-medium">
                        {formatPrice(mat.price)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (project && project._id) {
                  // Get selected material objects that are not already in storedMaterials
                  const selectedMaterialObjects = selectedMaterials
                    .map((id) => materials.find((mat) => mat._id === id))
                    .filter(
                      (mat) =>
                        mat &&
                        !storedMaterials.some(
                          (stored) => stored._id === mat._id
                        )
                    );
                  // Append to existing storedMaterials
                  const updated = [
                    ...storedMaterials,
                    ...selectedMaterialObjects,
                  ];
                  localStorage.setItem(project._id, JSON.stringify(updated));
                }
                setShowModal(false);
                setSelectedMaterials([""]);
              }}
            >
              <label className="block mb-2 font-medium">
                Select Materials:
              </label>
              {selectedMaterials.map((selected, idx) => (
                <div key={idx} className="flex items-center mb-2 gap-2">
                  <select
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none"
                    value={selected}
                    onChange={(e) => {
                      const updated = [...selectedMaterials];
                      updated[idx] = e.target.value;
                      setSelectedMaterials(updated);
                    }}
                    required
                    disabled={loading}
                  >
                    <option value="">
                      {loading
                        ? "Loading materials..."
                        : "-- Select Material --"}
                    </option>
                    {/* Only show materials not already in storedMaterials or already selected in another select */}
                    {materials
                      .filter(
                        (mat) =>
                          !storedMaterials.some(
                            (stored) => stored._id === mat._id
                          ) || selectedMaterials.includes(mat._id)
                      )
                      .map((mat) => (
                        <option key={mat._id} value={mat._id}>
                          {mat.name}
                        </option>
                      ))}
                  </select>
                  {selectedMaterials.length > 1 && (
                    <button
                      type="button"
                      className="text-red-500 px-2 py-1 rounded hover:bg-red-100"
                      onClick={() => {
                        if (selectedMaterials.length === 1) return;
                        setSelectedMaterials(
                          selectedMaterials.filter((_, i) => i !== idx)
                        );
                      }}
                      title="Remove"
                    >
                      &minus;
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="mb-4 px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition flex items-center gap-1"
                onClick={() => setSelectedMaterials([...selectedMaterials, ""])}
              >
                <FaPlus /> Add More
              </button>
              <div className="flex justify-center mt-4">
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1D3C34] text-white rounded hover:bg-[#145c4b] transition flex items-center gap-2"
                  disabled={loading}
                >
                  <FaShoppingCart /> Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add to Sheet Modal */}
      {showAddToSheetModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full relative">
            <button
              className="absolute top-2 right-4 text-gray-500 text-2xl"
              onClick={() => setShowAddToSheetModal(false)}
              disabled={isAddingToSheet}
            >
              &times;
            </button>
            <h3 className="text-xl font-bold mb-4 text-center">
              Add "{bestMatch.name}" to Project Sheet
            </h3>
            {bestMatch.options && bestMatch.options.length > 0 && (
              <div className="mb-4">
                <label className="block mb-1 font-medium">Size/Option:</label>
                <select
                  className="w-full p-2 border border-gray-300 rounded"
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value)}
                  required
                  disabled={isAddingToSheet}
                >
                  <option value="">-- Select --</option>
                  {bestMatch.options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="mb-4">
              <label className="block mb-1 font-medium">Quantity:</label>
              <input
                type="number"
                min={1}
                className="w-full p-2 border border-gray-300 rounded"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                disabled={isAddingToSheet}
                required
              />
            </div>
            <div className="flex justify-center mt-4">
              <button
                className="px-4 py-2 bg-[#1D3C34] text-white rounded hover:bg-[#145c4b] transition flex items-center gap-2"
                onClick={handleAddToSheet}
                disabled={
                  isAddingToSheet ||
                  (bestMatch.options?.length > 0 && !selectedSize)
                }
              >
                {isAddingToSheet ? (
                  "Adding..."
                ) : (
                  <>
                    Add to project <FaShoppingCart />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
