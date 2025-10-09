import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaSearch } from "react-icons/fa";
import Cookies from "js-cookie";
import axios from "axios";
import Toast from "../components/common/Toast";
import MaterialModal from "../components/materials/MaterialModal";

const CustomMaterialsPage = () => {
  const [userRole, setUserRole] = useState(null);
  const [requests, setRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
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

  // Reusable fetch for requests
  const fetchRequests = async () => {
    setLoading(true);
    try {
      const token = Cookies.get("token");
      const res = await axios.get(`${serverUrl}/api/material-request`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(res.data.requests || res.data.data || []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverUrl]);

  const handleSearch = (e) => setSearchTerm(e.target.value);

  const filteredRequests = requests.filter((req) => {
    const q = searchTerm.toLowerCase();
    const cat = (req.category || "").toLowerCase();
    const notes = (req.notes || "").toLowerCase();
    const proj = (req.projectId?.title || "").toLowerCase();
    return cat.includes(q) || notes.includes(q) || proj.includes(q);
  });
  const groupedRequests = {
    pending: filteredRequests.filter(
      (r) => (r.status || "pending") === "pending"
    ),
    approved: filteredRequests.filter((r) => r.status === "approved"),
    declined: filteredRequests.filter((r) => r.status === "declined"),
  };

  const showToast = (message, type = "success") => {
    setToast({ isVisible: true, message, type });
    // Use functional updater to avoid stale state capture
    setTimeout(() => setToast((prev) => ({ ...prev, isVisible: false })), 3000);
  };
  // No create/edit/delete on storage admin requests page
  // Approve & Create Material from Request flow
  const [createFromReqOpen, setCreateFromReqOpen] = useState(false);
  const [createFromReqSaving, setCreateFromReqSaving] = useState(false);
  const [prefillMaterial, setPrefillMaterial] = useState({
    name: "",
    company: "",
    category: "",
    price: 0,
    description: "",
    options: [],
    attributes: [],
  });
  const [prefillContext, setPrefillContext] = useState(null); // { requestId, projectId }

  const handleApproveCreate = (reqItem) => {
    setPrefillMaterial({
      name: "",
      company: "",
      category: reqItem.category || "",
      price: reqItem.budgetMax || 0,
      description: reqItem.notes || "",
      options: [],
      attributes: Array.isArray(reqItem.attributes) ? reqItem.attributes : [],
    });
    setPrefillContext({
      requestId: reqItem._id,
      projectId: reqItem.projectId?._id || reqItem.projectId,
    });
    setCreateFromReqOpen(true);
  };

  const handlePrefillChange = (field, value) => {
    setPrefillMaterial((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveCreateFromReq = async () => {
    try {
      setCreateFromReqSaving(true);
      const token = Cookies.get("token");
      // 1) create material
      const createRes = await axios.post(
        `${serverUrl}/api/material`,
        prefillMaterial,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const newMaterialId =
        createRes?.data?.material?._id || createRes?.data?._id;

      // 2) add to project (basic add with qty 1, no options)
      if (prefillContext?.projectId && newMaterialId) {
        await axios.post(
          `${serverUrl}/api/project/material`,
          { materialId: newMaterialId, options: [], quantity: 1 },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            params: { projectId: prefillContext.projectId },
          }
        );
      }

      // 3) approve request + link materialId
      if (prefillContext?.requestId) {
        await axios.put(
          `${serverUrl}/api/material-request`,
          { status: "approved", materialId: newMaterialId },
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { id: prefillContext.requestId },
          }
        );
      }

      // 4) refresh & reset
      await fetchRequests();
      setCreateFromReqOpen(false);
      setPrefillContext(null);
      setPrefillMaterial({
        name: "",
        company: "",
        category: "",
        price: 0,
        description: "",
        options: [],
        attributes: [],
      });
      showToast("Created material, added to project, request approved.");
    } catch (e) {
      showToast(
        e?.response?.data?.message || "Failed to create from request",
        "error"
      );
    } finally {
      setCreateFromReqSaving(false);
    }
  };

  const updateRequestStatus = async (id, status) => {
    try {
      setUpdatingId(id);
      const token = Cookies.get("token");
      await axios.put(
        `${serverUrl}/api/material-request`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          params: { id },
        }
      );
      setRequests((prev) =>
        prev.map((r) => (r._id === id ? { ...r, status } : r))
      );
      showToast(`Request ${status}.`, "success");
    } catch (e) {
      showToast(
        e?.response?.data?.message || `Failed to ${status} request`,
        "error"
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // Collapsible section state for grouped requests
  const [expandedSections, setExpandedSections] = useState({
    pending: true,
    approved: false,
    declined: false,
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerReq, setDrawerReq] = useState(null);

  const toggleSection = (sectionKey) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  return (
    <>
      <div className="px-4 py-8 mx-auto">
        <div className="flex justify-between items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold text-[#21413A]">
            Material Requests
          </h1>
          {/* Storage admin: no create button here */}
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
          { key: "approved", label: "Approved Material Requests" },
          { key: "declined", label: "Declined Material Requests" },
        ].map((section) => (
          <div className="mb-4" key={section.key}>
            <div
              className="flex items-center justify-between p-3 rounded-lg cursor-pointer bg-gray-50 transition border"
              onClick={() => toggleSection(section.key)}
            >
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-800">
                  {section.label} ({groupedRequests[section.key].length})
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
                  {groupedRequests[section.key].length > 0 ? (
                    groupedRequests[section.key].map((req) => (
                      <div
                        key={req._id || req.id}
                        className="bg-white rounded-xl shadow p-5 border flex flex-col gap-2 relative"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div
                            className="font-bold text-lg text-[#21413A] truncate"
                            title={req.category || "Material Request"}
                          >
                            {req.category || "Material Request"}
                          </div>
                          {/* No edit/delete; could add a View link later */}
                        </div>
                        <div
                          className="text-gray-700 text-sm mb-1 truncate"
                          title={req.notes || ""}
                        >
                          <span className="font-semibold">Notes:</span>{" "}
                          {req.notes || "—"}
                        </div>
                        <div className="text-gray-700 text-sm mb-1">
                          <span className="font-semibold">Requested By:</span>{" "}
                          {req.requestedBy?.fullName ||
                            (req.requestedBy?.firstName ||
                            req.requestedBy?.lastName
                              ? `${req.requestedBy?.firstName ?? ""} ${
                                  req.requestedBy?.lastName ?? ""
                                }`.trim()
                              : "—")}
                        </div>
                        <div className="text-gray-700 text-sm mb-1">
                          <span className="font-semibold">Project:</span>{" "}
                          {req.projectId?.title || "—"}
                        </div>
                        <div className="text-gray-700 text-sm mb-1">
                          <span className="font-semibold">Budget:</span> ₱
                          {req.budgetMax != null
                            ? Number(req.budgetMax).toLocaleString()
                            : "—"}
                        </div>
                        {/* Attribute chips */}
                        {Array.isArray(req.attributes) &&
                          req.attributes.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-2">
                              {req.attributes.slice(0, 6).map((a, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 border"
                                  title={`${a.key}: ${a.value}`}
                                >
                                  <span className="font-semibold mr-1">
                                    {a.key}:
                                  </span>{" "}
                                  {a.value}
                                </span>
                              ))}
                              {req.attributes.length > 6 && (
                                <span className="text-xs text-gray-500">
                                  +{req.attributes.length - 6} more
                                </span>
                              )}
                            </div>
                          )}
                        {/* Removed 'View details' button per request */}
                        {req.status === "pending" && (
                          <div className="mt-3 flex gap-3">
                            <button
                              className="px-4 py-2 rounded-lg border border-red-300 text-red-700 bg-white hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                              disabled={updatingId === req._id}
                              onClick={() =>
                                updateRequestStatus(req._id, "declined")
                              }
                            >
                              {updatingId === req._id
                                ? "Declining..."
                                : "Decline"}
                            </button>
                            <button
                              className="px-4 py-2 rounded-lg border border-[#21413A] text-[#21413A] bg-white hover:bg-[#21413A]/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                              disabled={updatingId === req._id}
                              onClick={() => handleApproveCreate(req)}
                            >
                              Approve & Create
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-500 col-span-full">
                      No requests found.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
        {/* Create Material from Request Modal */}
        <MaterialModal
          isOpen={createFromReqOpen}
          isEditMode={false}
          isSaving={createFromReqSaving}
          material={prefillMaterial}
          selectedImages={[]}
          selectedImagePreviews={[]}
          existingImageUrls={[]}
          onClose={() => setCreateFromReqOpen(false)}
          onSave={handleSaveCreateFromReq}
          onImageSelection={() => {}}
          onRemoveImage={() => {}}
          onRemoveExistingImage={() => {}}
          onMaterialChange={handlePrefillChange}
          onAddOption={() =>
            setPrefillMaterial((p) => ({
              ...p,
              options: [...p.options, { type: "", option: "", addToPrice: 0 }],
            }))
          }
          onUpdateOption={(idx, field, val) =>
            setPrefillMaterial((p) => {
              const next = [...p.options];
              next[idx] = { ...next[idx], [field]: val };
              return { ...p, options: next };
            })
          }
          onRemoveOption={(idx) =>
            setPrefillMaterial((p) => {
              const next = [...p.options];
              next.splice(idx, 1);
              return { ...p, options: next };
            })
          }
        />
        <Toast
          isVisible={toast.isVisible}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, isVisible: false })}
        />
      </div>
      {/* Drawer */}
      {drawerOpen && drawerReq && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-full sm:w-[420px] bg-white shadow-2xl border-l p-5 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-[#21413A]">
                Request Details
              </h3>
              <button
                className="px-3 py-1 rounded border"
                onClick={() => setDrawerOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-semibold">Category:</span>{" "}
                {drawerReq.category}
              </div>
              <div>
                <span className="font-semibold">Project:</span>{" "}
                {drawerReq.projectId?.title || "—"}
              </div>
              <div>
                <span className="font-semibold">Requested By:</span>{" "}
                {drawerReq.requestedBy?.fullName ||
                  drawerReq.requestedBy?.firstName ||
                  "—"}
              </div>
              <div>
                <span className="font-semibold">Budget:</span> ₱
                {drawerReq.budgetMax != null
                  ? Number(drawerReq.budgetMax).toLocaleString()
                  : "—"}
              </div>
              {drawerReq.notes && (
                <div>
                  <div className="font-semibold">Notes</div>
                  <div className="whitespace-pre-wrap text-gray-700 border rounded p-2 bg-gray-50">
                    {drawerReq.notes}
                  </div>
                </div>
              )}
              {Array.isArray(drawerReq.attributes) &&
                drawerReq.attributes.length > 0 && (
                  <div>
                    <div className="font-semibold">Attributes</div>
                    <div className="mt-1 grid grid-cols-1 gap-2">
                      {drawerReq.attributes.map((a, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center border rounded px-2 py-1 text-gray-700"
                        >
                          <span className="font-semibold">{a.key}</span>
                          <span>{a.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>

            {drawerReq.status === "pending" && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  className="px-3 py-2 rounded border border-red-300 text-red-700 bg-white hover:bg-red-50"
                  onClick={() => updateRequestStatus(drawerReq._id, "declined")}
                >
                  Decline
                </button>
                <button
                  className="px-3 py-2 rounded border border-[#21413A] text-[#21413A] bg-white hover:bg-[#21413A]/10"
                  onClick={() => {
                    handleApproveCreate(drawerReq);
                  }}
                >
                  Approve & Create
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default CustomMaterialsPage;
