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
} from "react-icons/fa";

export default function MaterialsTab() {
  const { project } = useOutletContext();
  const [showModal, setShowModal] = useState(false);
  const [selectedMaterials, setSelectedMaterials] = useState([""]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  const [bestMatch, setBestMatch] = useState(null);

  const serverUrl = import.meta.env.VITE_SERVER_URL;

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const token = Cookies.get("token");
        const res = await axios.get(`${serverUrl}/api/material`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setMaterials(res.data.material || []);
      } catch (err) {
        setMaterials([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMaterials();
  }, [serverUrl]);

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
    let isMounted = true;
    const fetchBestMatch = async () => {
      if (!selectedSidebar) {
        setBestMatch(null);
        return;
      }
      setLoading(true); // <-- Set loading true when fetching best match
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
        if (isMounted) setBestMatch(res.data?.result?.bestMatch || null);
      } catch {
        if (isMounted) setBestMatch(null);
      } finally {
        if (isMounted) setLoading(false); // <-- Set loading false after fetch
      }
    };
    fetchBestMatch();
    return () => {
      isMounted = false;
    };
  }, [selectedSidebar, serverUrl]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
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
        <div className="w-80 bg-white border-r border-gray-200 shadow-lg overflow-y-auto">
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
                  <button
                    key={item._id}
                    onClick={() => setSelectedSidebar(item.name)}
                    className={`group w-full text-left p-5 rounded-2xl transition-all duration-300 border-2 transform hover:scale-[1.02] ${
                      selectedSidebar === item.name
                        ? "bg-gradient-to-r from-[#f0fdf4] to-[#ecfdf5] border-[#1D3C34] shadow-lg shadow-[#1D3C34]/10"
                        : "bg-gradient-to-r from-gray-50 to-gray-100 border-transparent hover:border-[#1D3C34]/30 hover:shadow-md"
                    }`}
                  >
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
                        {selectedSidebar === item.name && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#1D3C34] to-[#145c4b] flex items-center justify-center shadow-lg transform rotate-0 hover:rotate-90 transition-transform duration-300">
                            <FaPlus className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
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
              <div className="max-w-2xl mx-auto">
                {/* Material Card */}
                <div className="bg-white rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-100 transform hover:scale-[1.02]">
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
                  <div className="p-8">
                    {/* Title and Description */}
                    <div className="mb-6">
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
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (project && project._id) {
                  const selectedMaterialObjects = selectedMaterials
                    .map((id) => materials.find((mat) => mat._id === id))
                    .filter(Boolean);
                  localStorage.setItem(
                    project._id,
                    JSON.stringify(selectedMaterialObjects)
                  );
                }
                setShowModal(false);
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
                    {materials.map((mat) => (
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
    </div>
  );
}
