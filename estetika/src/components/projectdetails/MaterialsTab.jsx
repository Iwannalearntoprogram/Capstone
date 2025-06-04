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
  FaInfoCircle,
} from "react-icons/fa";
import Papa from "papaparse"; // Make sure papaparse is installed

export default function MaterialsTab() {
  const { project } = useOutletContext();
  const [showModal, setShowModal] = useState(false);
  const [selectedMaterials, setSelectedMaterials] = useState([""]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  const [bestMatch, setBestMatch] = useState(null);
  const [showAddToSheetModal, setShowAddToSheetModal] = useState(false);
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isAddingToSheet, setIsAddingToSheet] = useState(false);

  const [selectedMaterialOptions, setSelectedMaterialOptions] = useState({});

  const serverUrl = import.meta.env.VITE_SERVER_URL;

  // Get user role from localStorage
  useEffect(() => {
    const role = localStorage.getItem("role");
    setUserRole(role);
  }, []);

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
  const formatPrice = (material) => {
    // Handle new structure where material is an object with price and minPrice
    if (
      typeof material === "object" &&
      material !== null &&
      !Array.isArray(material)
    ) {
      if (material.minPrice !== undefined && material.price !== undefined) {
        if (material.minPrice === material.price) {
          return `₱${material.price.toLocaleString()}`;
        }
        return `₱${material.minPrice.toLocaleString()} - ₱${material.price.toLocaleString()}`;
      }
      if (material.price !== undefined) {
        return `₱${material.price.toLocaleString()}`;
      }
    }

    // Handle single number price
    if (typeof material === "number") {
      return `₱${material.toLocaleString()}`;
    }

    // Handle old structure (array of prices)
    if (Array.isArray(material)) {
      if (!material.length) return "-";
      if (material.length > 1) {
        return `₱${material[0].toLocaleString()} - ₱${material[
          material.length - 1
        ].toLocaleString()}`;
      }
      return `₱${material[0].toLocaleString()}`;
    }

    return "-";
  };

  // Helper to get options display text
  const getOptionsDisplay = (options) => {
    if (!options || !options.length) return "Standard";

    // Handle new structure where options are objects with 'option' property
    if (typeof options[0] === "object" && options[0].option) {
      return options.map((opt) => opt.option).join(" • ");
    }

    // Handle old structure where options are objects with size/name/type
    if (typeof options[0] === "object") {
      return options
        .map((opt) => opt.size || opt.name || opt.type || "Option")
        .join(" • ");
    }

    // Handle very old structure where options are strings
    if (typeof options[0] === "string") {
      return options.join(" • ");
    }

    return "Standard";
  };

  // Helper to get option price
  const getOptionPrice = (material, selectedOption = null) => {
    if (!material) return 0;

    let basePrice = material.price || 0;

    if (selectedOption && material.options) {
      const option = material.options.find(
        (opt) =>
          opt.option === selectedOption ||
          opt.size === selectedOption ||
          opt.name === selectedOption ||
          opt.type === selectedOption
      );

      if (option && option.addToPrice !== undefined) {
        return basePrice + option.addToPrice;
      }
    }

    return basePrice;
  };

  const groupOptionsByType = (options) => {
    if (!options || !Array.isArray(options)) return {};
    return options.reduce((acc, opt) => {
      const type = opt.type || "Option";
      if (!acc[type]) acc[type] = [];
      acc[type].push(opt);
      return acc;
    }, {});
  };

  const getMaterialTotalPrice = (mat, idx) => {
    if (!mat || !mat.options || !mat.options.length) return mat?.price || 0;
    let total = mat.price || 0;
    const grouped = groupOptionsByType(mat.options);
    Object.keys(grouped).forEach((type) => {
      const selectedLabel = selectedMaterialOptions[`${idx}_${type}`];
      if (selectedLabel) {
        const opt = grouped[type].find(
          (o) =>
            o.option === selectedLabel ||
            o.size === selectedLabel ||
            o.name === selectedLabel ||
            o.type === selectedLabel
        );
        if (opt && opt.addToPrice) {
          total += opt.addToPrice;
        }
      }
    });
    return total;
  };

  // Sidebar state for selected material
  const [selectedSidebar, setSelectedSidebar] = useState(
    storedMaterials.length > 0 ? storedMaterials[0].name : ""
  );

  // Update sidebar selection if materials change
  useEffect(() => {
    if (
      storedMaterials.length > 0 &&
      !storedMaterials.find((m) => m.name === selectedSidebar)
    ) {
      setSelectedSidebar(storedMaterials[0].name);
    }
    if (storedMaterials.length === 0) setSelectedSidebar("");
  }, [storedMaterials]);

  // Fetch best match when sidebar selection changes
  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;
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
          }
        );
        console.log("Best match response:", res.data);
        if (isMounted && res.data?.result?.bestMatch) {
          setBestMatch({
            ...res.data.result.bestMatch,
            cheaper: res.data.result.cheaper,
            moreExpensive: res.data.result.moreExpensive,
          });
        } else if (isMounted) {
          setBestMatch(null);
        }
      } catch {
        if (isMounted) setBestMatch(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchBestMatch();
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [selectedSidebar, serverUrl]);

  const addMaterialToProj = async (e) => {
    e.preventDefault();
    if (!project || !project._id) return;
    const selectedId = selectedMaterials[0];
    const mat = materials.find((m) => m._id === selectedId);
    if (!mat) return alert("Please select a material.");

    // Gather all selected options by type
    let selectedOptions = [];
    if (mat.options && mat.options.length > 0) {
      const grouped = groupOptionsByType(mat.options);
      selectedOptions = Object.keys(grouped).map(
        (type) => selectedMaterialOptions[`0_${type}`] || ""
      );
      if (selectedOptions.some((opt) => !opt)) {
        return alert("Please select all options.");
      }
    }

    if (quantity < 1) return alert("Quantity must be at least 1.");
    try {
      const token = Cookies.get("token");
      const body = {
        materialId: mat._id,
        option: selectedOptions,
        quantity,
      };
      await axios.post(
        `${serverUrl}/api/project/material?projectId=${project._id}`,
        body,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      alert("Material added to project!");
      setShowModal(false);
      setSelectedMaterials([""]);
      setSelectedMaterialOptions({});
      setQuantity(1);
    } catch (err) {
      console.error(err);
      alert(
        err?.response?.data?.message || "Failed to add material to project."
      );
    }
  };

  const getFileName = (url) => {
    try {
      return url.split("/").pop().split("?")[0];
    } catch {
      return "";
    }
  };

  const handleAddClick = () => {
    if (userRole === "admin") {
      alert(
        "Admins cannot add materials. Only designers can manage materials."
      );
      return;
    }
    setShowModal(true);
  };

  const handleAddToSheetClick = () => {
    if (userRole === "admin") {
      alert(
        "Admins cannot add materials to project. Only designers can manage materials."
      );
      return;
    }
    setShowAddToSheetModal(true);
  };

  const handleAddToSheet = async () => {
    // Prevent admin from adding materials to project
    if (userRole === "admin") {
      alert(
        "Admins cannot add materials to project. Only designers can manage materials."
      );
      return;
    }

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
      // Calculate unit price based on new structure
      let unitPrice = getOptionPrice(bestMatch, selectedSize);

      const newRow = [
        bestMatch.name,
        bestMatch.company,
        selectedSize ||
          getOptionsDisplay(bestMatch.options).split(" • ")[0] ||
          "Standard",
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
      setShowAddToSheetModal(false);
      setSelectedSize("");
      setQuantity(1);
    } catch (err) {
      alert("Failed to add material to sheet");
    } finally {
      setIsAddingToSheet(false);
    }
  };

  const handleRemoveMaterial = (itemId) => {
    if (userRole === "admin") {
      alert(
        "Admins cannot remove materials. Only designers can manage materials."
      );
      return;
    }

    // Remove from localStorage
    if (project && project._id) {
      const updated = storedMaterials.filter((mat) => mat._id !== itemId);
      localStorage.setItem(project._id, JSON.stringify(updated));
      window.location.reload();
    }
  };

  useEffect(() => {
    if (!showModal) return;
    const fetchMaterials = async () => {
      setLoading(true);
      try {
        const token = Cookies.get("token");
        const res = await axios.get(`${serverUrl}/api/material`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMaterials(res.data.material || []);
      } catch {
        setMaterials([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMaterials();
  }, [showModal, serverUrl]);

  const isAdmin = userRole === "admin";

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

      {/* Show admin message if admin */}
      {isAdmin && (
        <div className="mx-6 my-4 flex items-center gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <FaInfoCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <span className="text-sm text-blue-800">
            View only mode - Only designers can add and manage materials
          </span>
        </div>
      )}

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
              {/* Only show Add button if not admin */}
              {!isAdmin && (
                <button
                  className="group bg-gradient-to-r from-[#1D3C34] to-[#145c4b] text-white px-4 py-3 rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
                  onClick={handleAddClick}
                  title="Add Material"
                >
                  <FaPlus className="text-sm group-hover:rotate-90 transition-transform duration-300" />
                  <span className="text-sm font-semibold">Add</span>
                </button>
              )}
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
                    {/* Absolute Trash Button - Only show if not admin */}
                    {selectedSidebar === item.name && !isAdmin && (
                      <button
                        type="button"
                        className="absolute top-2 right-2 z-10 flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-300"
                        title="Remove Material"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveMaterial(item._id);
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
                              {getOptionsDisplay(item.options)}
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
                    {isAdmin
                      ? "Only designers can add materials"
                      : "Add materials to get started"}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 overflow-y-auto ">
          <div className="p-8">
            {loading && selectedSidebar ? (
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
              <div className="max-w-7xl mx-auto">
                {/* Best Match Heading */}
                <h2 className="text-xl font-bold text-[#1D3C34] mb-6 text-center">
                  Best Match for: {selectedSidebar}
                </h2>

                {/* Side-by-Side Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Cheaper Alternative */}
                  {bestMatch.cheaper && (
                    <div className="order-2 lg:order-1">
                      <div className="text-center mb-3">
                        <span className="text-xs text-green-700 font-bold uppercase bg-green-50 px-2 py-1 rounded-full">
                          Cheaper Alternative
                        </span>
                      </div>
                      <div className="bg-white rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 border-2 border-green-200 transform hover:scale-[1.02] h-full">
                        {/* Product Image */}
                        <div className="relative overflow-hidden bg-gradient-to-br from-green-50 to-green-100">
                          <img
                            src={
                              Array.isArray(bestMatch.cheaper.image)
                                ? bestMatch.cheaper.image[0]
                                : bestMatch.cheaper.image
                            }
                            alt={bestMatch.cheaper.name}
                            className="w-full h-48 object-cover hover:scale-110 transition-transform duration-700"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                        </div>
                        {/* Product Info */}
                        <div className="p-4">
                          <h3 className="font-bold text-xl text-gray-900 mb-3 tracking-tight">
                            {bestMatch.cheaper.name}
                          </h3>
                          <p className="text-gray-600 leading-relaxed font-medium mb-4">
                            {bestMatch.cheaper.description}
                          </p>

                          <div className="mb-6">
                            <div className="flex items-baseline space-x-2">
                              <span className="text-3xl font-bold text-green-700 tracking-tight">
                                {formatPrice(bestMatch.cheaper.price)}
                              </span>
                              <span className="text-sm text-gray-500 font-medium">
                                per unit
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-3 mb-6">
                            <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                              <div className="w-6 h-6 bg-green-600 rounded-lg flex items-center justify-center">
                                <FaIndustry className="h-3 w-3 text-white" />
                              </div>
                              <div>
                                <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                                  Company
                                </span>
                                <div className="text-sm font-bold text-gray-800">
                                  {bestMatch.cheaper.company}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                              <div className="w-6 h-6 bg-green-600 rounded-lg flex items-center justify-center">
                                <FaTags className="h-3 w-3 text-white" />
                              </div>
                              <div>
                                <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                                  Category
                                </span>
                                <div className="text-sm font-bold text-gray-800">
                                  {bestMatch.cheaper.category}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                              <div className="w-6 h-6 bg-green-600 rounded-lg flex items-center justify-center">
                                <FaBox className="h-3 w-3 text-white" />
                              </div>
                              <div>
                                <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                                  Options
                                </span>
                                <div className="text-sm font-bold text-gray-800">
                                  {getOptionsDisplay(bestMatch.options)}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Only show Add to Project button if not admin */}
                          {!isAdmin ? (
                            <button
                              className="w-full px-6 py-3 bg-[#1D3C34] text-white rounded-xl font-semibold hover:bg-[#145c4b] transition flex items-center justify-center gap-2 shadow-lg"
                              onClick={handleAddToSheetClick}
                              disabled={!project || !project._id}
                            >
                              <FaShoppingCart />
                              Add to Project
                            </button>
                          ) : (
                            <div className="w-full text-center text-sm text-gray-500 py-3">
                              Only designers can add materials to project
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Best Match - Main Card */}
                  <div className="order-1 lg:order-2">
                    <div className="text-center mb-3">
                      <span className="text-xs text-[#1D3C34] font-bold uppercase bg-[#f0fdf4] px-2 py-1 rounded-full">
                        Best Match
                      </span>
                    </div>
                    <div className="bg-white rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 border-2 border-[#1D3C34] transform hover:scale-[1.02] h-full">
                      {/* Product Image */}
                      <div className="relative overflow-hidden bg-gradient-to-br from-[#f0fdf4] to-[#ecfdf5]">
                        <img
                          src={
                            Array.isArray(bestMatch.image)
                              ? bestMatch.image[0]
                              : bestMatch.image
                          }
                          alt={bestMatch.name}
                          className="w-full h-48 object-cover hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                      </div>
                      {/* Product Info */}
                      <div className="p-4">
                        <h3 className="font-bold text-xl text-gray-900 mb-3 tracking-tight">
                          {bestMatch.name}
                        </h3>
                        <p className="text-gray-600 leading-relaxed font-medium mb-4">
                          {bestMatch.description}
                        </p>

                        <div className="mb-6">
                          <div className="flex items-baseline space-x-2">
                            <span className="text-3xl font-bold text-[#1D3C34] tracking-tight">
                              {formatPrice(bestMatch.price)}
                            </span>
                            <span className="text-sm text-gray-500 font-medium">
                              per unit
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 mb-6">
                          <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                            <div className="w-6 h-6 bg-[#1D3C34] rounded-lg flex items-center justify-center">
                              <FaIndustry className="h-3 w-3 text-white" />
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

                          <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                            <div className="w-6 h-6 bg-[#1D3C34] rounded-lg flex items-center justify-center">
                              <FaTags className="h-3 w-3 text-white" />
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

                          <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                            <div className="w-6 h-6 bg-[#1D3C34] rounded-lg flex items-center justify-center">
                              <FaBox className="h-3 w-3 text-white" />
                            </div>
                            <div>
                              <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                                Options
                              </span>
                              <div className="text-sm font-bold text-gray-800">
                                {getOptionsDisplay(bestMatch.options)}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Only show Add to Project button if not admin */}
                        {!isAdmin ? (
                          <button
                            className="w-full px-6 py-3 bg-[#1D3C34] text-white rounded-xl font-semibold hover:bg-[#145c4b] transition flex items-center justify-center gap-2 shadow-lg"
                            onClick={handleAddToSheetClick}
                            disabled={!project || !project._id || !bestMatch}
                          >
                            <FaShoppingCart />
                            Add to Project
                          </button>
                        ) : (
                          <div className="w-full text-center text-sm text-gray-500 py-3">
                            Only designers can add materials to project
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* More Expensive Alternative */}
                  {bestMatch.moreExpensive && (
                    <div className="order-3">
                      <div className="text-center mb-3">
                        <span className="text-xs text-red-700 font-bold uppercase bg-red-50 px-2 py-1 rounded-full">
                          Expensive Alternative
                        </span>
                      </div>
                      <div className="bg-white rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 border-2 border-red-200 transform hover:scale-[1.02] h-full">
                        {/* Product Image */}
                        <div className="relative overflow-hidden bg-gradient-to-br from-red-50 to-red-100">
                          <img
                            src={
                              Array.isArray(bestMatch.moreExpensive.image)
                                ? bestMatch.moreExpensive.image[0]
                                : bestMatch.moreExpensive.image
                            }
                            alt={bestMatch.moreExpensive.name}
                            className="w-full h-48 object-cover hover:scale-110 transition-transform duration-700"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                        </div>
                        {/* Product Info */}
                        <div className="p-4">
                          <h3 className="font-bold text-xl text-gray-900 mb-3 tracking-tight">
                            {bestMatch.moreExpensive.name}
                          </h3>
                          <p className="text-gray-600 leading-relaxed font-medium mb-4">
                            {bestMatch.moreExpensive.description}
                          </p>

                          <div className="mb-6">
                            <div className="flex items-baseline space-x-2">
                              <span className="text-3xl font-bold text-red-700 tracking-tight">
                                {formatPrice(bestMatch.moreExpensive.price)}
                              </span>
                              <span className="text-sm text-gray-500 font-medium">
                                per unit
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-3 mb-6">
                            <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                              <div className="w-6 h-6 bg-red-600 rounded-lg flex items-center justify-center">
                                <FaIndustry className="h-3 w-3 text-white" />
                              </div>
                              <div>
                                <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                                  Company
                                </span>
                                <div className="text-sm font-bold text-gray-800">
                                  {bestMatch.moreExpensive.company}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                              <div className="w-6 h-6 bg-red-600 rounded-lg flex items-center justify-center">
                                <FaTags className="h-3 w-3 text-white" />
                              </div>
                              <div>
                                <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                                  Category
                                </span>
                                <div className="text-sm font-bold text-gray-800">
                                  {bestMatch.moreExpensive.category}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                              <div className="w-6 h-6 bg-red-600 rounded-lg flex items-center justify-center">
                                <FaBox className="h-3 w-3 text-white" />
                              </div>
                              <div>
                                <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                                  Options
                                </span>
                                <div className="text-sm font-bold text-gray-800">
                                  {getOptionsDisplay(
                                    bestMatch.moreExpensive?.options
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Only show Add to Project button if not admin */}
                          {!isAdmin ? (
                            <button
                              className="w-full px-6 py-3 bg-[#1D3C34] text-white rounded-xl font-semibold hover:bg-[#145c4b] transition flex items-center justify-center gap-2 shadow-lg"
                              onClick={handleAddToSheetClick}
                              disabled={!project || !project._id}
                            >
                              <FaShoppingCart />
                              Add to Project
                            </button>
                          ) : (
                            <div className="w-full text-center text-sm text-gray-500 py-3">
                              Only designers can add materials to project
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
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
                  {isAdmin
                    ? "Select a material from the sidebar to view its details."
                    : "Choose a material from the sidebar to view its details and add it to your project."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal - Only show if not admin */}
      {showModal && !isAdmin && (
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
            <form onSubmit={addMaterialToProj}>
              <label className="block mb-2 font-medium">Select Material:</label>
              <div className="flex flex-col mb-2 gap-2">
                <select
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none"
                  value={selectedMaterials[0] || ""}
                  onChange={(e) => {
                    setSelectedMaterials([e.target.value]);
                    setSelectedMaterialOptions({});
                  }}
                  required
                  disabled={loading}
                >
                  <option value="">
                    {loading ? "Loading materials..." : "-- Select Material --"}
                  </option>
                  {materials.map((mat) => (
                    <option key={mat._id} value={mat._id}>
                      {mat.name}
                    </option>
                  ))}
                </select>
              </div>
              {/* Option selectors */}
              {(() => {
                const mat = materials.find(
                  (m) => m._id === selectedMaterials[0]
                );
                if (mat && mat.options && mat.options.length > 0) {
                  return Object.entries(groupOptionsByType(mat.options)).map(
                    ([type, opts]) => (
                      <div key={type} className="mb-2">
                        <label className="block mb-1 font-medium capitalize">
                          Choose {type}
                        </label>
                        <div className="flex gap-2 flex-wrap">
                          {opts.map((opt, i) => {
                            const label =
                              opt.option ||
                              opt.size ||
                              opt.name ||
                              opt.type ||
                              `Option ${i + 1}`;
                            const value = label;
                            const addPrice =
                              opt.addToPrice && opt.addToPrice > 0
                                ? ` (+₱${opt.addToPrice.toLocaleString()})`
                                : "";
                            const isSelected =
                              selectedMaterialOptions[`0_${type}`] === value;
                            return (
                              <button
                                type="button"
                                key={opt._id || i}
                                className={`px-4 py-1 rounded-full border transition font-semibold ${
                                  isSelected
                                    ? "bg-[#1D3C34] text-white"
                                    : "bg-white text-[#1D3C34] border-[#1D3C34]"
                                }`}
                                onClick={() =>
                                  setSelectedMaterialOptions((prev) => ({
                                    ...prev,
                                    [`0_${type}`]: value,
                                  }))
                                }
                              >
                                {label}
                                {addPrice}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )
                  );
                }
                return null;
              })()}
              {/* Quantity */}
              <div className="mb-4">
                <label className="block mb-1 font-medium">Quantity:</label>
                <input
                  type="number"
                  min={1}
                  className="w-full p-2 border border-gray-300 rounded"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  required
                />
              </div>
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

      {/* Add to Sheet Modal - Only show if not admin */}
      {showAddToSheetModal && !isAdmin && (
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
              Add "{bestMatch?.name}" to Project Sheet
            </h3>
            {bestMatch?.options && bestMatch.options.length > 0 && (
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
                  {bestMatch.options.map((opt, index) => {
                    const optionLabel =
                      opt.option ||
                      opt.size ||
                      opt.name ||
                      opt.type ||
                      `Option ${index + 1}`;
                    const optionPrice = getOptionPrice(bestMatch, optionLabel);
                    return (
                      <option key={opt._id || index} value={optionLabel}>
                        {optionLabel} - ₱{optionPrice.toLocaleString()}
                      </option>
                    );
                  })}
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
                  (bestMatch?.options?.length > 0 && !selectedSize)
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
