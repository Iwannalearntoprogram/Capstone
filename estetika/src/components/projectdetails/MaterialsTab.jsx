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
  FaEdit,
  FaClipboardList,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
} from "react-icons/fa";
import Papa from "papaparse"; // Make sure papaparse is installed
import { useToast } from "../ToastProvider";

export default function MaterialsTab() {
  const { project, refreshProject } = useOutletContext();
  const { showToast } = useToast();
  const [showModal, setShowModal] = useState(false);
  // Removed legacy loading; using recsLoading for bulk operations
  const [userRole, setUserRole] = useState(null);
  // We prefer per-need recommendations map; remove legacy single recommendation state
  // Map of recommendations keyed by need name: { [needName]: { bestMatch, cheaper, moreExpensive, selected, choice } }
  const [recommendations, setRecommendations] = useState({});
  // Loading state for bulk recommend
  const [recsLoading, setRecsLoading] = useState(false);
  // Planned total cost across all needs using selected picks
  const [plannedTotal, setPlannedTotal] = useState(0);
  const [showAddToSheetModal, setShowAddToSheetModal] = useState(false);
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isAddingToSheet, setIsAddingToSheet] = useState(false);
  // Removed unused selectedMaterialOptions state
  const [editMaterial, setEditMaterial] = useState(null);
  const [editOption, setEditOption] = useState("");
  const [editQuantity, setEditQuantity] = useState(1);
  // Add Material state (new custom material)
  const [materialName, setMaterialName] = useState("");
  const [materialAttributes, setMaterialAttributes] = useState([
    { key: "", values: [""] },
  ]);
  // Request Material state
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [reqCategory, setReqCategory] = useState("");
  const [reqAttributes, setReqAttributes] = useState([
    { key: "", values: [""] },
  ]);
  const [reqBudget, setReqBudget] = useState("");
  const [reqNotes, setReqNotes] = useState("");
  const [isRequesting, setIsRequesting] = useState(false);
  // My Requests state
  const [myRequests, setMyRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [requestStatusFilter, setRequestStatusFilter] = useState("all");
  const serverUrl = import.meta.env.VITE_SERVER_URL;

  // Get user role from localStorage
  useEffect(() => {
    const role = localStorage.getItem("role");
    setUserRole(role);
  }, []);

  // Fetch user's requests when project changes
  useEffect(() => {
    if (project?._id && userRole === "designer") {
      fetchMyRequests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?._id, userRole]);

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

  // Helper to display attributes for designer needs (supports Map or plain object)
  const getNeedAttributesDisplay = (attrs) => {
    if (!attrs) return "—";
    let entries = [];
    try {
      if (typeof attrs?.entries === "function") {
        // Mongoose Map may come across as a Map in some environments
        entries = Array.from(attrs.entries());
      } else {
        entries = Object.entries(attrs);
      }
    } catch {
      return "—";
    }
    if (!entries.length) return "—";
    return entries
      .map(
        ([k, vals]) => `${k}: ${Array.isArray(vals) ? vals.join(", ") : vals}`
      )
      .join(" • ");
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

  // Helper: minimal unit price for a material record from search API
  const getMinUnitPrice = (item) => {
    if (!item || typeof item !== "object") return 0;
    if (typeof item.minPrice === "number") return item.minPrice;
    if (typeof item.price === "number") return item.price;
    return 0;
  };

  // Removed unused groupOptionsByType

  // const getMaterialTotalPrice = (mat, idx) => {
  //   if (!mat || !mat.options || !mat.options.length) return mat?.price || 0;
  //   let total = mat.price || 0;
  //   const grouped = groupOptionsByType(mat.options);
  //   Object.keys(grouped).forEach((type) => {
  //     const selectedLabel = selectedMaterialOptions[`${idx}_${type}`];
  //     if (selectedLabel) {
  //       const opt = grouped[type].find(
  //         (o) =>
  //           o.option === selectedLabel ||
  //           o.size === selectedLabel ||
  //           o.name === selectedLabel ||
  //           o.type === selectedLabel
  //       );
  //       if (opt && opt.addToPrice) {
  //         total += opt.addToPrice;
  //       }
  //     }
  //   });
  //   return total;
  // };

  // Sidebar state for selected material
  const [selectedSidebar, setSelectedSidebar] = useState("");

  // Log project changes
  useEffect(() => {
    console.log(project);
  }, [project]);

  // Fetch best match manually when recommend button is clicked
  // Removed legacy single-item recommend handler (now using bulk recommender)

  // Recommend for ALL designer needs concurrently and compute a budget-aware selection
  const handleRecommendAllMaterials = async () => {
    if (!project || !Array.isArray(project.materialsList)) return;
    const needs = project.materialsList.filter((n) => n && n.name);
    if (needs.length === 0) return;
    setRecsLoading(true);
    try {
      const token = Cookies.get("token");
      const headers = { Authorization: `Bearer ${token}` };

      // Parallel fetch for each need name (augment query with a hint of attributes if present)
      const requests = needs.map((need) => {
        const attrHint = need.attributes
          ? Object.entries(need.attributes)
              .map(([k, v]) => `${k}:${Array.isArray(v) ? v.join("/") : v}`)
              .join(", ")
          : "";
        const q = attrHint ? `${need.name} ${attrHint}` : need.name;
        return axios
          .get(`${serverUrl}/api/material/match`, {
            headers,
            params: { query: q },
          })
          .then((res) => ({ need, data: res.data }))
          .catch(() => ({ need, data: null }));
      });

      const results = await Promise.all(requests);

      // Build base map choosing bestMatch initially
      let map = {};
      for (const { need, data } of results) {
        const payload = data?.result;
        if (payload?.bestMatch) {
          map[need.name] = {
            bestMatch: payload.bestMatch,
            cheaper: payload.cheaper || null,
            moreExpensive: payload.moreExpensive || null,
            selected: payload.bestMatch,
            choice: "best",
          };
        } else {
          // No result
          map[need.name] = null;
        }
      }

      // Apply budget-aware selection if budget exists
      const budget = Number(project?.budget) || 0;
      const withPlan = { ...map };
      if (budget > 0) {
        // Compute initial total using best picks
        let total = 0;
        for (const need of needs) {
          const rec = withPlan[need.name];
          if (!rec) continue;
          const qty = Number(need.quantity) || 1;
          total += getMinUnitPrice(rec.selected) * qty;
        }

        if (total > budget) {
          // Identify candidates where cheaper exists and yields savings
          const candidates = needs
            .map((need) => {
              const rec = withPlan[need.name];
              if (!rec || !rec.cheaper || !rec.bestMatch) return null;
              const qty = Number(need.quantity) || 1;
              const bestPrice = getMinUnitPrice(rec.bestMatch);
              const cheapPrice = getMinUnitPrice(rec.cheaper);
              const savings = (bestPrice - cheapPrice) * qty;
              return savings > 0
                ? { name: need.name, qty, savings, bestPrice, cheapPrice }
                : null;
            })
            .filter(Boolean)
            .sort((a, b) => b.savings - a.savings);

          for (const c of candidates) {
            if (total <= budget) break;
            // Switch this need to cheaper
            const rec = withPlan[c.name];
            if (rec && rec.cheaper) {
              rec.selected = rec.cheaper;
              rec.choice = "cheaper";
              total -= c.savings;
            }
          }
        }

        setPlannedTotal(total);
      } else {
        // No budget provided; compute total anyway
        let total = 0;
        for (const need of needs) {
          const rec = withPlan[need.name];
          if (!rec) continue;
          const qty = Number(need.quantity) || 1;
          total += getMinUnitPrice(rec.selected) * qty;
        }
        setPlannedTotal(total);
      }

      setRecommendations(withPlan);
      // If nothing selected on the left, set first need to preview
      if (!selectedSidebar && needs[0]?.name) {
        setSelectedSidebar(needs[0].name);
      }
    } finally {
      setRecsLoading(false);
    }
  };

  const addMaterialToProj = async (e) => {
    e.preventDefault();
    if (!project || !project._id) return;

    // Validate material name
    if (!materialName.trim()) {
      showToast("Please enter a material name.", { type: "error" });
      return;
    }

    // Validate attributes
    const validAttributes = materialAttributes
      .map((attr) => ({
        key: (attr.key || "").trim(),
        values: (Array.isArray(attr.values) ? attr.values : [""]).map((v) =>
          (v || "").trim()
        ),
      }))
      .filter((attr) => attr.key && attr.values.some((v) => v));

    if (validAttributes.length === 0) {
      showToast("Please add at least one attribute with a value.", { type: "error" });
      return;
    }

    if (quantity < 1) {
      showToast("Quantity must be at least 1.", { type: "error" });
      return;
    }

    try {
      const token = Cookies.get("token");

      // Format attributes as key-value pairs with arrays
      const attributesPayload = validAttributes.reduce((acc, attr) => {
        const vals = attr.values.filter(Boolean);
        if (vals.length) acc[attr.key] = vals;
        return acc;
      }, {});

      const body = {
        name: materialName.trim(),
        attributes: attributesPayload,
        quantity,
        // Mark as custom material for backend
        isCustom: true,
        // Save designer need to materialsList instead of materials array
        saveToList: true,
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
      showToast("Material added to project!", { type: "success" });
      setShowModal(false);
      setMaterialName("");
      setMaterialAttributes([{ key: "", values: [""] }]);
      setQuantity(1);
      if (refreshProject) refreshProject(); // Refresh project data
    } catch (e) {
      console.error(e);
      showToast(e?.response?.data?.message || "Failed to add material to project.", { type: "error" });
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
      showToast(
        "Admins cannot add materials. Only designers can manage materials.",
        { type: "error" }
      );
      return;
    }
    setShowModal(true);
  };

  const handleRequestClick = () => {
    if (userRole === "admin") {
      showToast("Admins cannot recommend materials.", { type: "error" });
      return;
    }
    setShowRequestModal(true);
  };

  const handleAddToSheetClick = () => {
    if (userRole === "admin") {
      showToast(
        "Admins cannot add materials to project. Only designers can manage materials.",
        { type: "error" }
      );
      return;
    }
    setShowAddToSheetModal(true);
  };

  // Add Material helpers (custom materials)
  const addMaterialAttribute = () => {
    setMaterialAttributes((prev) => [...prev, { key: "", values: [""] }]);
  };

  const removeMaterialAttribute = (index) => {
    setMaterialAttributes((prev) => prev.filter((_, i) => i !== index));
  };

  const updateMaterialAttribute = (index, field, value) => {
    setMaterialAttributes((prev) => {
      const next = [...prev];
      next[index][field] = value;
      return next;
    });
  };

  const addMaterialAttributeValue = (attrIndex) => {
    setMaterialAttributes((prev) => {
      const next = prev.map((attr, idx) => {
        if (idx === attrIndex) {
          return {
            ...attr,
            values: [...attr.values, ""],
          };
        }
        return attr;
      });
      return next;
    });
  };

  const removeMaterialAttributeValue = (attrIndex, valueIndex) => {
    setMaterialAttributes((prev) => {
      const next = prev.map((attr, idx) => {
        if (idx === attrIndex) {
          return {
            ...attr,
            values: attr.values.filter((_, i) => i !== valueIndex),
          };
        }
        return attr;
      });
      return next;
    });
  };

  const updateMaterialAttributeValue = (attrIndex, valueIndex, value) => {
    setMaterialAttributes((prev) => {
      const next = prev.map((attr, idx) => {
        if (idx === attrIndex) {
          const newValues = [...attr.values];
          newValues[valueIndex] = value;
          return {
            ...attr,
            values: newValues,
          };
        }
        return attr;
      });
      return next;
    });
  };

  // Recommend Material helpers
  const updateReqAttribute = (index, field, value) => {
    setReqAttributes((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addReqAttribute = () =>
    setReqAttributes((p) => [...p, { key: "", values: [""] }]);

  const removeReqAttribute = (idx) =>
    setReqAttributes((p) => p.filter((_, i) => i !== idx));

  const addReqAttributeValue = (attrIdx) => {
    setReqAttributes((prev) => {
      const next = [...prev];
      next[attrIdx] = {
        ...next[attrIdx],
        values: [...(next[attrIdx].values || []), ""],
      };
      return next;
    });
  };

  const removeReqAttributeValue = (attrIdx, valIdx) => {
    setReqAttributes((prev) => {
      const next = [...prev];
      next[attrIdx] = {
        ...next[attrIdx],
        values: next[attrIdx].values.filter((_, i) => i !== valIdx),
      };
      return next;
    });
  };

  const updateReqAttributeValue = (attrIdx, valIdx, value) => {
    setReqAttributes((prev) => {
      const next = [...prev];
      const vals = [...next[attrIdx].values];
      vals[valIdx] = value;
      next[attrIdx] = { ...next[attrIdx], values: vals };
      return next;
    });
  };

  const fetchMyRequests = async () => {
    if (!project?._id) return;
    setLoadingRequests(true);
    try {
      const token = Cookies.get("token");
      const res = await axios.get(
        `${serverUrl}/api/material-request?projectId=${project._id}&mine=true`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      // Sort by newest first
      const sorted = (res.data.requests || []).sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setMyRequests(sorted);
    } catch (e) {
      console.error("Failed to fetch requests:", e);
      setMyRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  };

  const submitMaterialRequest = async () => {
    if (!project || !project._id) {
      showToast("No project context", { type: "error" });
      return;
    }
    if (!reqCategory.trim()) {
      showToast("Category is required", { type: "error" });
      return;
    }
    setIsRequesting(true);
    try {
      const token = Cookies.get("token");

      // Format attributes with values array
      const validAttributes = reqAttributes
        .map((attr) => ({
          key: (attr.key || "").trim(),
          values: (Array.isArray(attr.values) ? attr.values : [""]).map((v) =>
            (v || "").trim()
          ),
        }))
        .filter((attr) => attr.key && attr.values.some((v) => v));

      const attributesPayload = validAttributes.reduce((acc, attr) => {
        const vals = attr.values.filter(Boolean);
        if (vals.length) acc[attr.key] = vals;
        return acc;
      }, {});

      const payload = {
        projectId: project._id,
        category: reqCategory,
        attributes: attributesPayload,
        budgetMax: reqBudget ? Number(reqBudget) : undefined,
        notes: reqNotes || undefined,
      };
      await axios.post(`${serverUrl}/api/material-request`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      showToast("Recommendation submitted to storage admin.", { type: "success" });
      setShowRequestModal(false);
      setReqCategory("");
      setReqAttributes([{ key: "", values: [""] }]);
      setReqBudget("");
      setReqNotes("");
      // Refresh requests list
      fetchMyRequests();
    } catch (e) {
      showToast(e?.response?.data?.message || "Failed to submit recommendation", { type: "error" });
    } finally {
      setIsRequesting(false);
    }
  };

  const handleAddToSheet = async () => {
    // Prevent admin from adding materials to project
    if (userRole === "admin") {
      showToast(
        "Admins cannot add materials to project. Only designers can manage materials.",
        { type: "error" }
      );
      return;
    }

    if (!project || !project._id) {
      showToast("Please select a project", { type: "error" });
      return;
    }
    // Determine selected recommendation for current sidebar selection
    const current = selectedSidebar ? recommendations[selectedSidebar] : null;
    const selectedRec = current?.selected || current?.bestMatch || null;
    if (!selectedRec) return;
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
      let unitPrice = getOptionPrice(selectedRec, selectedSize);

      const newRow = [
        selectedRec.name,
        selectedRec.company,
        selectedSize ||
          getOptionsDisplay(selectedRec.options).split(" • ")[0] ||
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
        showToast(
          "Failed to upload CSV: " +
            (uploadErr.response?.data?.message || uploadErr.message),
          { type: "error" }
        );
        setIsAddingToSheet(false);
        return;
      }
      const newCsvUrl = uploadRes.data.documentLink;
      if (!newCsvUrl) {
        showToast("Upload failed: No documentLink returned", { type: "error" });
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
        showToast(
          "Failed to update project files: " +
            (updateErr.response?.data?.message || updateErr.message),
          { type: "error" }
        );
        setIsAddingToSheet(false);
        return;
      }
      showToast("Material added to project sheet successfully!", { type: "success" });
      setShowAddToSheetModal(false);
      setSelectedSize("");
      setQuantity(1);

      // Remove the designer's need from materialsList and add the recommended material to materials array
      try {
        // First, remove from materialsList
        await axios.delete(`${serverUrl}/api/project/material/list`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            projectId: project._id,
            name: selectedSidebar, // The name of the designer's need
          },
        });

        // Then, add the recommended material to the materials array
        const need = project.materialsList.find(
          (n) => n.name === selectedSidebar
        );
        const materialQuantity = need ? need.quantity : quantity;

        await axios.post(
          `${serverUrl}/api/project/material?projectId=${project._id}`,
          {
            materialId: selectedRec._id,
            options: selectedSize ? [selectedSize] : [], // Pass selected option if any
            quantity: materialQuantity,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        // Clear the recommendation for this material since it's now resolved
        setRecommendations((prev) => {
          const updated = { ...prev };
          delete updated[selectedSidebar];
          return updated;
        });

        // Clear selection if it was the current one
        if (selectedSidebar === selectedSidebar) {
          setSelectedSidebar("");
        }
      } catch (replaceErr) {
        console.error("Failed to replace material:", replaceErr);
        // Don't show error to user since CSV was already added successfully
      }

      if (refreshProject) refreshProject(); // Refresh project data
    } catch {
      showToast("Failed to add material to sheet", { type: "error" });
    } finally {
      setIsAddingToSheet(false);
    }
  };

  const handleEditMaterialSubmit = async (e) => {
    e.preventDefault();
    if (!editMaterial) return;
    try {
      const token = Cookies.get("token");
      await axios.put(
        `${serverUrl}/api/project/material?projectId=${project._id}`,
        {
          materialId: editMaterial.material._id,
          options: [
            ...(editMaterial.material.options || []).filter((opt) => {
              const label =
                opt.option || opt.size || opt.name || opt.type || "";
              return label === editOption;
            }),
          ],
          quantity: editQuantity,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      showToast("Material updated!", { type: "success" });
      setEditMaterial(null);
      if (refreshProject) refreshProject(); // Refresh project data
    } catch (err) {
      showToast(
        err?.response?.data?.message || "Failed to update material in project.",
        { type: "error" }
      );
    }
  };

  const handleDeleteMaterial = async (materialId, option) => {
    if (userRole === "admin") {
      showToast(
        "Admins cannot remove materials. Only designers can manage materials.",
        { type: "error" }
      );
      return;
    }
    if (!project || !project._id) {
      showToast("No project selected.", { type: "error" });
      return;
    }
    if (!window.confirm("Are you sure you want to remove this material?"))
      return;
    try {
      const token = Cookies.get("token");
      await axios.delete(
        `${serverUrl}/api/project/material?projectId=${project._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          data: {
            materialId,
            option: option || undefined, // if no option, remove all for this materialId
          },
        }
      );
      showToast("Material removed!", { type: "success" });
      if (refreshProject) refreshProject(); // Refresh project data
    } catch (err) {
      showToast(
        err?.response?.data?.message ||
          "Failed to remove material from project.",
        { type: "error" }
      );
    }
  };

  // Removed unused materials fetch effect

  const isAdmin = userRole === "admin";

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500 text-lg">Loading project...</div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center space-x-4 px-6 py-5">
            <button className="group p-3 hover:bg-gray-100 rounded-xl hover:shadow-md">
              <FaArrowLeft className="h-5 w-5 text-gray-600 group-hover:text-[#1D3C34]" />
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
              <div className="mb-8 flex flex-col-reverse gap-4 items-start">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2 tracking-tight">
                    {project?.title || "Project Materials"}
                  </h2>
                  {project.budget && (
                    <p className="text-sm text-gray-500 font-medium">
                      Budget: {Number(project.budget).toLocaleString()}
                    </p>
                  )}
                  {Array.isArray(project.materialsList) &&
                    project.materialsList.length > 0 && (
                      <p className="text-sm font-medium mt-1">
                        Planned Total:{" "}
                        {plannedTotal > 0
                          ? `₱${plannedTotal.toLocaleString()}`
                          : "—"}
                        {project?.budget ? (
                          plannedTotal > 0 ? (
                            plannedTotal <= Number(project.budget) ? (
                              <span className="ml-2 text-green-700">
                                (within budget)
                              </span>
                            ) : (
                              <span className="ml-2 text-red-700">
                                (over budget)
                              </span>
                            )
                          ) : null
                        ) : null}
                      </p>
                    )}
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
                  <div className="flex gap-2">
                    <button
                      className="group bg-gradient-to-r from-[#1D3C34] to-[#145c4b] text-white px-4 py-3 rounded-xl hover:shadow-lg flex items-center gap-2"
                      onClick={handleAddClick}
                      title="Add Material"
                    >
                      <FaPlus className="text-sm" />
                      <span className="text-sm font-semibold">Add</span>
                    </button>
                    <button
                      className="bg-white border border-[#1D3C34] text-[#1D3C34] px-4 py-3 rounded-xl flex items-center gap-2"
                      onClick={handleRequestClick}
                      title="Request Material"
                    >
                      <FaIndustry className="text-sm" />
                      <span className="text-sm font-semibold">Request</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Designer Needs (materialsList) */}
              {Array.isArray(project.materialsList) &&
                project.materialsList.length > 0 && (
                  <div className="space-y-3 mb-6">
                    {project.materialsList.map((need, idx) => (
                      <div
                        key={`need-${idx}-${need.name}`}
                        className={`group w-full text-left p-5 rounded-2xl border-2 relative bg-gradient-to-r from-gray-50 to-gray-100 hover:border-[#1D3C34]/30 hover:shadow-md ${
                          selectedSidebar === need.name
                            ? "border-[#1D3C34] shadow-lg shadow-[#1D3C34]/10"
                            : "border-transparent"
                        }`}
                        onClick={() => setSelectedSidebar(need.name)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-3 h-3 rounded-full bg-[#1D3C34]" />
                            <div>
                              <span className="font-bold text-sm tracking-wide text-gray-700 group-hover:text-[#1D3C34]">
                                {need.name}
                              </span>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="text-xs text-gray-500 font-medium">
                                  {getNeedAttributesDisplay(need.attributes)}
                                </span>
                                <span className="text-xs text-gray-400 font-medium">
                                  × {need.quantity}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              className="text-gray-500 hover:text-red-600"
                              title="Remove"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!project?._id) return;
                                if (
                                  !window.confirm(
                                    "Remove this item from the list?"
                                  )
                                )
                                  return;
                                const token = Cookies.get("token");
                                axios
                                  .delete(
                                    `${serverUrl}/api/project/material/list`,
                                    {
                                      headers: {
                                        Authorization: `Bearer ${token}`,
                                      },
                                      params: {
                                        projectId: project._id,
                                        name: need.name,
                                      },
                                    }
                                  )
                                  .then(() => {
                                    if (refreshProject) refreshProject();
                                    if (selectedSidebar === need.name)
                                      setSelectedSidebar("");
                                  })
                                  .catch((err) => {
                                    showToast(
                                      err?.response?.data?.message ||
                                        "Failed to remove item",
                                      { type: "error" }
                                    );
                                  });
                              }}
                            >
                              <FaTrash />
                            </button>
                            <span
                              className={`text-sm font-bold ${
                                selectedSidebar === need.name
                                  ? "text-[#1D3C34]"
                                  : "text-gray-600"
                              }`}
                            >
                              —
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              {/* Materials List (catalog entries) */}
              <div className="space-y-3 h-full">
                {project.materials && project.materials.length > 0 ? (
                  project.materials.map((item) => (
                    <div
                      key={`${item.material._id}${
                        item.option?.map((o) => o.option).join("-") || ""
                      }`}
                      className={`group w-full text-left p-5 pb-14 rounded-2xl border-2 relative ${
                        selectedSidebar === item.material.name
                          ? " border-[#1D3C34] shadow-lg shadow-[#1D3C34]/10"
                          : "bg-gradient-to-r from-gray-50 to-gray-100 border-transparent hover:border-[#1D3C34]/30 hover:shadow-md"
                      }`}
                      onClick={() => setSelectedSidebar(item.material.name)}
                    >
                      {/* Card Content */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            <div
                              className={`w-3 h-3 rounded-full ${
                                selectedSidebar === item.material.name
                                  ? "bg-[#1D3C34] shadow-lg shadow-[#1D3C34]/30"
                                  : "bg-gray-300 group-hover:bg-[#1D3C34]/50"
                              }`}
                            ></div>
                            {/* removed animated pulse overlay */}
                          </div>
                          <div>
                            <span
                              className={`font-bold text-sm tracking-wide ${
                                selectedSidebar === item.material.name
                                  ? "text-[#1D3C34]"
                                  : "text-gray-700 group-hover:text-[#1D3C34]"
                              }`}
                            >
                              {item.material.name}
                            </span>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-xs text-gray-500 font-medium">
                                {getOptionsDisplay(item.option)}
                              </span>
                              <span className="text-xs text-gray-400 font-medium">
                                × {item.quantity}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-bold ${
                              selectedSidebar === item.material.name
                                ? "text-[#1D3C34]"
                                : "text-gray-600"
                            }`}
                          >
                            {formatPrice(item.totalPrice)}
                          </span>
                        </div>
                      </div>
                      <button
                        className="absolute top-3 right-10 text-gray-500 cursor-pointer hover:text-blue-500"
                        title="Edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditMaterial(item);
                          // Set the label of the first option as selected
                          setEditOption(
                            item.option && item.option.length > 0
                              ? item.option[0].option ||
                                  item.option[0].size ||
                                  item.option[0].name ||
                                  item.option[0].type ||
                                  ""
                              : ""
                          );
                          setEditQuantity(item.quantity || 1);
                        }}
                      >
                        <FaEdit />
                      </button>

                      <button
                        className="absolute top-3 right-3 text-gray-500 cursor-pointer hover:text-red-600"
                        title="Delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteMaterial(
                            item.material._id,
                            // If there are options, pass the first option's value, else undefined
                            item.option && item.option.length > 0
                              ? item.option[0].option ||
                                  item.option[0].size ||
                                  item.option[0].name ||
                                  item.option[0].type
                              : undefined
                          );
                        }}
                      >
                        <FaTrash />
                      </button>
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
            {/* Sticky bottom action: Recommend Materials */}
            <div className="p-4 border-t border-gray-200 bg-white sticky bottom-0">
              <button
                className="w-full bg-white border border-[#1D3C34] text-[#1D3C34] px-4 py-2 rounded-lg hover:bg-[#1D3C34] hover:text-white flex items-center justify-center gap-2 text-sm font-semibold disabled:opacity-50"
                onClick={handleRecommendAllMaterials}
                disabled={
                  recsLoading ||
                  !Array.isArray(project.materialsList) ||
                  project.materialsList.length === 0
                }
                title={
                  Array.isArray(project.materialsList) &&
                  project.materialsList.length > 0
                    ? "Recommend materials for all items"
                    : "Add items to the list first"
                }
              >
                <FaIndustry className="text-sm" />
                {recsLoading ? "Recommending…" : "Recommend Materials"}
              </button>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="flex-1 overflow-y-auto ">
            <div className="p-8">
              {(() => {
                // First check if selectedSidebar matches an actual material in the project
                const actualMaterial = project?.materials?.find(
                  (item) => item.material.name === selectedSidebar
                );
                if (actualMaterial) {
                  // Show details of the actual selected material in the same format as recommendations
                  const material = actualMaterial.material;
                  const options = actualMaterial.option || [];
                  const quantity = actualMaterial.quantity;
                  const totalPrice = actualMaterial.totalPrice;

                  return (
                    <div className="max-w-7xl mx-auto">
                      {/* Selected Material Heading */}
                      <h2 className="text-xl font-bold text-[#1D3C34] mb-6 text-center">
                        Selected Material: {material.name}
                      </h2>

                      {/* Single Card Layout */}
                      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 max-w-2xl mx-auto">
                        <div className="bg-white rounded-xl overflow-hidden shadow-xl border-2 border-[#1D3C34]">
                          {/* Product Image */}
                          <div className="relative overflow-hidden bg-gradient-to-br from-[#f0fdf4] to-[#ecfdf5]">
                            <img
                              src={
                                Array.isArray(material.image)
                                  ? material.image[0]
                                  : material.image
                              }
                              alt={material.name}
                              className="w-full h-48 object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                          </div>
                          {/* Product Info */}
                          <div className="p-4">
                            <h3 className="font-bold text-xl text-gray-900 mb-3 tracking-tight">
                              {material.name}
                            </h3>
                            <p className="text-gray-600 leading-relaxed font-medium mb-4">
                              {material.description}
                            </p>

                            <div className="mb-6">
                              <div className="flex items-baseline space-x-2">
                                <span className="text-3xl font-bold text-[#1D3C34] tracking-tight">
                                  {formatPrice(totalPrice)}
                                </span>
                                <span className="text-sm text-gray-500 font-medium">
                                  total ({quantity} ×{" "}
                                  {formatPrice(material.price)})
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
                                    {material.company}
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
                                    {material.category}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                                <div className="w-6 h-6 bg-[#1D3C34] rounded-lg flex items-center justify-center">
                                  <FaBox className="h-3 w-3 text-white" />
                                </div>
                                <div>
                                  <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                                    Selected Options
                                  </span>
                                  <div className="text-sm font-bold text-gray-800">
                                    {getOptionsDisplay(options)}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Show quantity info */}
                            <div className="w-full text-center text-sm text-gray-500 py-3 bg-gray-50 rounded-lg">
                              Quantity: {quantity} | Unit Price:{" "}
                              {formatPrice(material.price)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Otherwise, show recommendation logic
                const current = selectedSidebar
                  ? recommendations[selectedSidebar]
                  : null;
                const selectedRec =
                  current?.selected || current?.bestMatch || null;
                if (recsLoading && selectedSidebar && !selectedRec) {
                  return (
                    <div className="text-center py-20">
                      <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-200 to-gray-300 rounded-3xl flex items-center justify-center">
                        <FaShoppingCart className="h-12 w-12 text-gray-400" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-600 mb-3 tracking-tight">
                        Finding best match for{" "}
                        <span className="text-[#1D3C34]">
                          {selectedSidebar}
                        </span>
                        ...
                      </h3>
                      <p className="text-gray-500 font-medium max-w-md mx-auto leading-relaxed">
                        Please wait while we search for the best material match.
                      </p>
                    </div>
                  );
                }
                if (selectedRec) {
                  const cheaper = current?.cheaper;
                  const moreExpensive = current?.moreExpensive;
                  return (
                    <div className="max-w-7xl mx-auto">
                      {/* Best Match Heading */}
                      <h2 className="text-xl font-bold text-[#1D3C34] mb-6 text-center">
                        {current?.choice === "cheaper"
                          ? "Selected (Cheaper)"
                          : "Best Match"}{" "}
                        for: {selectedSidebar}
                      </h2>

                      {/* Side-by-Side Layout */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Cheaper Alternative */}
                        {cheaper && (
                          <div className="order-2 lg:order-1">
                            <div className="text-center mb-3">
                              <span className="text-xs text-green-700 font-bold uppercase bg-green-50 px-2 py-1 rounded-full">
                                Cheaper Alternative
                              </span>
                            </div>
                            <div className="bg-white rounded-xl overflow-hidden shadow-xl border-2 border-green-200 h-full">
                              {/* Product Image */}
                              <div className="relative overflow-hidden bg-gradient-to-br from-green-50 to-green-100">
                                <img
                                  src={
                                    Array.isArray(cheaper.image)
                                      ? cheaper.image[0]
                                      : cheaper.image
                                  }
                                  alt={cheaper.name}
                                  className="w-full h-48 object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                              </div>
                              {/* Product Info */}
                              <div className="p-4">
                                <h3 className="font-bold text-xl text-gray-900 mb-3 tracking-tight">
                                  {cheaper.name}
                                </h3>
                                <p className="text-gray-600 leading-relaxed font-medium mb-4">
                                  {cheaper.description}
                                </p>

                                <div className="mb-6">
                                  <div className="flex items-baseline space-x-2">
                                    <span className="text-3xl font-bold text-green-700 tracking-tight">
                                      {formatPrice(cheaper.price)}
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
                                        {cheaper.company}
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
                                        {cheaper.category}
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
                                        {getOptionsDisplay(cheaper.options)}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Only show Add to Project button if not admin */}
                                {!isAdmin ? (
                                  <button
                                    className="w-full px-6 py-3 bg-[#1D3C34] text-white rounded-xl font-semibold hover:bg-[#145c4b] flex items-center justify-center gap-2 shadow-lg"
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
                          <div className="bg-white rounded-xl overflow-hidden shadow-xl border-2 border-[#1D3C34] h-full">
                            {/* Product Image */}
                            <div className="relative overflow-hidden bg-gradient-to-br from-[#f0fdf4] to-[#ecfdf5]">
                              <img
                                src={
                                  Array.isArray(selectedRec.image)
                                    ? selectedRec.image[0]
                                    : selectedRec.image
                                }
                                alt={selectedRec.name}
                                className="w-full h-48 object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                            </div>
                            {/* Product Info */}
                            <div className="p-4">
                              <h3 className="font-bold text-xl text-gray-900 mb-3 tracking-tight">
                                {selectedRec.name}
                              </h3>
                              <p className="text-gray-600 leading-relaxed font-medium mb-4">
                                {selectedRec.description}
                              </p>

                              <div className="mb-6">
                                <div className="flex items-baseline space-x-2">
                                  <span className="text-3xl font-bold text-[#1D3C34] tracking-tight">
                                    {formatPrice(selectedRec.price)}
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
                                      {selectedRec.company}
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
                                      {selectedRec.category}
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
                                      {getOptionsDisplay(selectedRec.options)}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Only show Add to Project button if not admin */}
                              {!isAdmin ? (
                                <button
                                  className="w-full px-6 py-3 bg-[#1D3C34] text-white rounded-xl font-semibold hover:bg-[#145c4b] flex items-center justify-center gap-2 shadow-lg"
                                  onClick={handleAddToSheetClick}
                                  disabled={
                                    !project || !project._id || !selectedRec
                                  }
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
                        {moreExpensive && (
                          <div className="order-3">
                            <div className="text-center mb-3">
                              <span className="text-xs text-red-700 font-bold uppercase bg-red-50 px-2 py-1 rounded-full">
                                Expensive Alternative
                              </span>
                            </div>
                            <div className="bg-white rounded-xl overflow-hidden shadow-xl border-2 border-red-200 h-full">
                              {/* Product Image */}
                              <div className="relative overflow-hidden bg-gradient-to-br from-red-50 to-red-100">
                                <img
                                  src={
                                    Array.isArray(moreExpensive.image)
                                      ? moreExpensive.image[0]
                                      : moreExpensive.image
                                  }
                                  alt={moreExpensive.name}
                                  className="w-full h-48 object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                              </div>
                              {/* Product Info */}
                              <div className="p-4">
                                <h3 className="font-bold text-xl text-gray-900 mb-3 tracking-tight">
                                  {moreExpensive.name}
                                </h3>
                                <p className="text-gray-600 leading-relaxed font-medium mb-4">
                                  {moreExpensive.description}
                                </p>

                                <div className="mb-6">
                                  <div className="flex items-baseline space-x-2">
                                    <span className="text-3xl font-bold text-red-700 tracking-tight">
                                      {formatPrice(moreExpensive.price)}
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
                                        {moreExpensive.company}
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
                                        {moreExpensive.category}
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
                                          moreExpensive?.options
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Only show Add to Project button if not admin */}
                                {!isAdmin ? (
                                  <button
                                    className="w-full px-6 py-3 bg-[#1D3C34] text-white rounded-xl font-semibold hover:bg-[#145c4b] flex items-center justify-center gap-2 shadow-lg"
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
                  );
                }
                return (
                  <div className="text-center py-20">
                    <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-200 to-gray-300 rounded-3xl flex items-center justify-center">
                      <FaIndustry className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-600 mb-3 tracking-tight">
                      {selectedSidebar
                        ? `No recommendations for ${selectedSidebar}`
                        : "No material selected"}
                    </h3>
                    <p className="text-gray-500 font-medium max-w-md mx-auto leading-relaxed">
                      {selectedSidebar
                        ? isAdmin
                          ? "Select a different material on the left."
                          : "Click 'Recommend Materials' to get suggestions for this item."
                        : isAdmin
                        ? "Select a material on the left."
                        : "Click 'Recommend Materials' below to prefetch all options, then select an item on the left."}
                    </p>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* My Requests Section - Below Everything */}
        {!isAdmin && (
          <div className="bg-white border-t border-gray-200 shadow-lg ">
            <div className="max-w-7xl mx-auto px-6 py-8">
              {/* Section Header */}
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3 mb-2">
                  <FaClipboardList className="text-[#1D3C34]" />
                  My Requests
                </h3>
                <p className="text-sm text-gray-500">
                  Track your material request status
                </p>
              </div>

              {/* Status Filter */}
              <div className="flex gap-3 mb-6 flex-wrap">
                <button
                  onClick={() => setRequestStatusFilter("all")}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    requestStatusFilter === "all"
                      ? "bg-[#1D3C34] text-white shadow-md"
                      : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setRequestStatusFilter("pending")}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    requestStatusFilter === "pending"
                      ? "bg-yellow-100 text-yellow-800 border border-yellow-200 shadow-sm"
                      : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setRequestStatusFilter("approved")}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    requestStatusFilter === "approved"
                      ? "bg-green-100 text-green-800 border border-green-200 shadow-sm"
                      : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                  }`}
                >
                  Approved
                </button>
                <button
                  onClick={() => setRequestStatusFilter("declined")}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    requestStatusFilter === "declined"
                      ? "bg-red-100 text-red-800 border border-red-200 shadow-sm"
                      : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                  }`}
                >
                  Declined
                </button>
              </div>

              {/* Requests List */}
              {loadingRequests ? (
                <div className="text-center py-16">
                  <div className="rounded-full h-12 w-12 border-b-2 border-[#1D3C34] mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-4">
                    Loading requests...
                  </p>
                </div>
              ) : (
                (() => {
                  const filtered =
                    requestStatusFilter === "all"
                      ? myRequests
                      : myRequests.filter(
                          (req) => req.status === requestStatusFilter
                        );
                  return filtered.length === 0 ? (
                    <div className="text-center py-16 px-4">
                      <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center shadow-sm">
                        <FaClipboardList className="text-4xl text-gray-300" />
                      </div>
                      <p className="text-base text-gray-600 font-medium">
                        {requestStatusFilter === "all"
                          ? "No requests yet"
                          : `No ${requestStatusFilter} requests`}
                      </p>
                      <p className="text-sm text-gray-400 mt-2">
                        Click "Request" button above to submit a material
                        request
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filtered.map((req) => (
                        <div
                          key={req._id}
                          className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-2xl p-6 hover:shadow-xl"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-bold text-lg text-gray-800 flex-1">
                              {req.category}
                            </h4>
                            {req.status === "approved" && (
                              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                <FaCheckCircle className="mr-1.5 text-sm" />
                                Approved
                              </span>
                            )}
                            {req.status === "declined" && (
                              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                <FaTimesCircle className="mr-1.5 text-sm" />
                                Declined
                              </span>
                            )}
                            {req.status === "pending" && (
                              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                                <FaClock className="mr-1.5 text-sm" />
                                Pending
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mb-4">
                            {new Date(req.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )}
                          </p>
                          {req.budgetMax && (
                            <div className="mb-4 p-3 bg-gradient-to-r from-[#1D3C34]/5 to-[#1D3C34]/10 rounded-xl border border-[#1D3C34]/20">
                              <p className="text-sm text-gray-700">
                                <span className="font-semibold">Budget:</span>{" "}
                                <span className="text-[#1D3C34] font-bold text-lg">
                                  ₱{Number(req.budgetMax).toLocaleString()}
                                </span>
                              </p>
                            </div>
                          )}
                          {Array.isArray(req.attributes) &&
                            req.attributes.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-3">
                                {req.attributes.slice(0, 4).map((attr, idx) => (
                                  <span
                                    key={idx}
                                    className="text-xs px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 font-medium border border-gray-200"
                                  >
                                    {attr.key}:{" "}
                                    {Array.isArray(attr.values)
                                      ? attr.values.join(", ")
                                      : attr.value || ""}
                                  </span>
                                ))}
                                {req.attributes.length > 4 && (
                                  <span className="text-xs text-gray-400 px-3 py-1.5">
                                    +{req.attributes.length - 4} more
                                  </span>
                                )}
                              </div>
                            )}
                          {req.notes && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <p className="text-sm text-gray-600 line-clamp-3">
                                {req.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        )}

        {/* Modal - Only show if not admin */}
        {showModal && !isAdmin && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div
              className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto overflow-x-hidden relative"
              style={{ scrollbarWidth: "thin" }}
            >
              <button
                className="absolute top-2 right-4 text-gray-500 text-2xl"
                onClick={() => {
                  setShowModal(false);
                  setMaterialName("");
                  setMaterialAttributes([{ key: "", values: [""] }]);
                  setQuantity(1);
                }}
              >
                &times;
              </button>
              <h3 className="text-xl font-bold mb-4 text-center">
                Add Material
              </h3>
              <form onSubmit={addMaterialToProj}>
                {/* Material Name */}
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Material Name
                  <input
                    type="text"
                    value={materialName}
                    onChange={(e) => setMaterialName(e.target.value)}
                    placeholder="e.g., Eames Style Lounge Chair"
                    className="mt-1 w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1D3C34]"
                    required
                  />
                </label>

                {/* Attributes */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Attributes
                    </span>
                    <button
                      type="button"
                      onClick={addMaterialAttribute}
                      className="text-[#1D3C34] text-sm hover:underline border border-[#1D3C34] px-3 py-1 rounded"
                    >
                      + Add Attribute
                    </button>
                  </div>
                  {materialAttributes.map((attr, attrIdx) => (
                    <div
                      key={attrIdx}
                      className="mb-4 border border-gray-200 rounded p-3"
                    >
                      {/* Attribute Key */}
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
                          placeholder="Key (e.g., Color)"
                          value={attr.key}
                          onChange={(e) =>
                            updateMaterialAttribute(
                              attrIdx,
                              "key",
                              e.target.value
                            )
                          }
                        />
                        {materialAttributes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeMaterialAttribute(attrIdx)}
                            className="text-red-600 border border-red-600 rounded px-3 py-2 text-sm hover:bg-red-50"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      {/* Attribute Values */}
                      <div className="ml-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-600">Values</span>
                          <button
                            type="button"
                            onClick={() => addMaterialAttributeValue(attrIdx)}
                            className="text-[#1D3C34] text-xs hover:underline"
                          >
                            + Add Value
                          </button>
                        </div>
                        {attr.values.map((val, valIdx) => (
                          <div
                            key={valIdx}
                            className="flex items-center gap-2 mb-2"
                          >
                            <input
                              className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
                              placeholder="Value (e.g., Deep Green)"
                              value={val}
                              onChange={(e) =>
                                updateMaterialAttributeValue(
                                  attrIdx,
                                  valIdx,
                                  e.target.value
                                )
                              }
                            />
                            {attr.values.length > 1 && (
                              <button
                                type="button"
                                onClick={() =>
                                  removeMaterialAttributeValue(attrIdx, valIdx)
                                }
                                className="text-red-600 border border-red-600 rounded px-3 py-2 text-sm hover:bg-red-50"
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

                {/* Quantity */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Quantity
                    <input
                      type="number"
                      min={1}
                      className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      required
                    />
                  </label>
                </div>

                <div className="flex justify-center mt-6">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-[#1D3C34] text-white rounded hover:bg-[#145c4b] transition flex items-center gap-2 disabled:opacity-50"
                    disabled={!materialName.trim()}
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
                {(() => {
                  const current = selectedSidebar
                    ? recommendations[selectedSidebar]
                    : null;
                  const selectedRec =
                    current?.selected || current?.bestMatch || null;
                  return `Add "${
                    selectedRec?.name || "Material"
                  }" to Project Sheet`;
                })()}
              </h3>
              {(() => {
                const current = selectedSidebar
                  ? recommendations[selectedSidebar]
                  : null;
                const selectedRec =
                  current?.selected || current?.bestMatch || null;
                return selectedRec?.options && selectedRec.options.length > 0;
              })() && (
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
                    {(() => {
                      const current = selectedSidebar
                        ? recommendations[selectedSidebar]
                        : null;
                      const selectedRec =
                        current?.selected || current?.bestMatch || null;
                      return selectedRec?.options || [];
                    })().map((opt, index) => {
                      const optionLabel =
                        opt.option ||
                        opt.size ||
                        opt.name ||
                        opt.type ||
                        `Option ${index + 1}`;
                      const current = selectedSidebar
                        ? recommendations[selectedSidebar]
                        : null;
                      const selectedRec =
                        current?.selected || current?.bestMatch || null;
                      const optionPrice = getOptionPrice(
                        selectedRec,
                        optionLabel
                      );
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
                    ((selectedSidebar ? recommendations[selectedSidebar] : null)
                      ?.selected?.options?.length > 0 &&
                      !selectedSize)
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

        {editMaterial && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full relative">
              <button
                className="absolute top-2 right-4 text-gray-500 text-2xl"
                onClick={() => setEditMaterial(null)}
              >
                &times;
              </button>
              <h3 className="text-xl font-bold mb-4 text-center">
                Edit Material Quantity
              </h3>
              <form onSubmit={handleEditMaterialSubmit}>
                <div className="mb-4">
                  <label className="block mb-1 font-medium">Quantity:</label>
                  <input
                    type="number"
                    min={1}
                    className="w-full p-2 border border-gray-300 rounded"
                    value={editQuantity}
                    onChange={(e) => setEditQuantity(Number(e.target.value))}
                    required
                  />
                </div>
                <div className="flex justify-center mt-4">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#1D3C34] text-white rounded hover:bg-[#145c4b] transition flex items-center gap-2"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showRequestModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full relative">
              <button
                className="absolute top-2 right-4 text-gray-500 text-2xl"
                onClick={() => setShowRequestModal(false)}
                disabled={isRequesting}
              >
                &times;
              </button>
              <h3 className="text-xl font-bold mb-4 text-center">
                Request New Material
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block text-sm font-medium text-gray-700">
                  Category
                  <input
                    type="text"
                    value={reqCategory}
                    onChange={(e) => setReqCategory(e.target.value)}
                    placeholder="e.g., Sofa, Lighting, Cabinet"
                    className="mt-1 w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1D3C34]"
                  />
                </label>
                <label className="block text-sm font-medium text-gray-700">
                  Budget Max (optional)
                  <input
                    type="number"
                    value={reqBudget}
                    onChange={(e) => setReqBudget(e.target.value)}
                    min="0"
                    step="1"
                    placeholder="Optional"
                    className="mt-1 w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1D3C34]"
                  />
                </label>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Attributes
                  </span>
                  <button
                    type="button"
                    onClick={addReqAttribute}
                    className="text-[#1D3C34] text-sm hover:underline"
                  >
                    + Add Attribute
                  </button>
                </div>
                {reqAttributes.map((attr, attrIdx) => (
                  <div
                    key={attrIdx}
                    className="mb-4 border border-gray-200 rounded p-3"
                  >
                    {/* Attribute Key */}
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
                        placeholder="Key (e.g., Color)"
                        value={attr.key}
                        onChange={(e) =>
                          updateReqAttribute(attrIdx, "key", e.target.value)
                        }
                      />
                      {reqAttributes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeReqAttribute(attrIdx)}
                          className="text-red-600 border border-red-600 rounded px-3 py-2 text-sm hover:bg-red-50"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    {/* Attribute Values */}
                    <div className="ml-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600">Values</span>
                        <button
                          type="button"
                          onClick={() => addReqAttributeValue(attrIdx)}
                          className="text-[#1D3C34] text-xs hover:underline"
                        >
                          + Add Value
                        </button>
                      </div>
                      {attr.values.map((val, valIdx) => (
                        <div
                          key={valIdx}
                          className="flex items-center gap-2 mb-2"
                        >
                          <input
                            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
                            placeholder="Value (e.g., Deep Green)"
                            value={val}
                            onChange={(e) =>
                              updateReqAttributeValue(
                                attrIdx,
                                valIdx,
                                e.target.value
                              )
                            }
                          />
                          {attr.values.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                removeReqAttributeValue(attrIdx, valIdx)
                              }
                              className="text-red-600 border border-red-600 rounded px-3 py-2 text-sm hover:bg-red-50"
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
              <label className="block text-sm font-medium text-gray-700 mt-2">
                Notes (optional)
                <textarea
                  className="mt-1 w-full border rounded px-3 py-2 text-sm"
                  rows={4}
                  placeholder="Any additional information"
                  value={reqNotes}
                  onChange={(e) => setReqNotes(e.target.value)}
                />
              </label>
              <div className="flex justify-center mt-6">
                <button
                  className="px-4 py-2 bg-[#1D3C34] text-white rounded hover:bg-[#145c4b] transition flex items-center gap-2 disabled:opacity-50"
                  onClick={submitMaterialRequest}
                  disabled={isRequesting || !reqCategory.trim()}
                >
                  {isRequesting ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* put the material request here */}
    </>
  );
}
