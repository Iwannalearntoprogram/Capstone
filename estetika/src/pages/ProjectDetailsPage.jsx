import { useParams, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { FiArrowLeft } from "react-icons/fi";

import EditProjectModal from "../components/project/EditProjectModal";
import {
  trimValue,
  validateDateOrder,
  validatePositiveNumber,
  validateRequiredText,
} from "../utils/validation";

const statusStyles = {
  ongoing: {
    badge: "border border-emerald-200 bg-emerald-50 text-emerald-900",
    accent: "bg-emerald-500",
  },
  completed: {
    badge: "border border-slate-200 bg-slate-100 text-slate-800",
    accent: "bg-slate-500",
  },
  pending: {
    badge: "border border-amber-200 bg-amber-50 text-amber-900",
    accent: "bg-amber-500",
  },
  delayed: {
    badge: "border border-orange-200 bg-orange-50 text-orange-900",
    accent: "bg-orange-500",
  },
  cancelled: {
    badge: "border border-rose-200 bg-rose-50 text-rose-900",
    accent: "bg-rose-500",
  },
  default: {
    badge: "border border-slate-200 bg-white text-slate-700",
    accent: "bg-slate-400",
  },
};

const formatCurrency = (value) =>
  typeof value === "number"
    ? new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        maximumFractionDigits: 0,
      }).format(value)
    : "Budget pending";

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date(value))
    : "To be scheduled";

function ProjectDetailsPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [project, setProject] = useState(location.state?.project || null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editData, setEditData] = useState({
    title: "",
    description: "",
    budget: "",
    priority: "",
    designPreference: "",
    startDate: "",
    endDate: "",
  });
  const [editErrors, setEditErrors] = useState({});
  const [editMessage, setEditMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const serverUrl = import.meta.env.VITE_SERVER_URL;

  const openEditModal = () => {
    if (project) {
      setEditData({
        title: project.title || "",
        description: project.description || "",
        budget: project.budget || "",
        priority: project.priority || "",
        designPreference: project.designPreference || "",
        startDate: project.startDate ? project.startDate.slice(0, 10) : "",
        endDate: project.endDate ? project.endDate.slice(0, 10) : "",
      });
      setEditErrors({});
      setEditMessage("");
      setIsEditOpen(true);
    }
  };

  const closeEditModal = () => setIsEditOpen(false);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
    setEditMessage("");
    setEditErrors((prev) => ({
      ...prev,
      [name]:
        name === "title"
          ? validateRequiredText(value, "Title")
          : name === "description"
            ? validateRequiredText(value, "Description")
            : name === "budget"
              ? validatePositiveNumber(value, "Budget")
              : name === "priority"
                ? validateRequiredText(value, "Priority")
                : "",
      ...(name === "startDate" || name === "endDate"
        ? {
            dates: validateDateOrder(
              name === "startDate" ? value : editData.startDate,
              name === "endDate" ? value : editData.endDate
            ),
          }
        : {}),
    }));
  };

  const fetchProject = async () => {
    try {
      const token = Cookies.get("token");
      const response = await axios.get(`${serverUrl}/api/project?id=${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setProject(
        Array.isArray(response.data.project)
          ? response.data.project[0]
          : response.data.project
      );
    } catch {
      // handle error
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = {
      title: validateRequiredText(editData.title, "Title"),
      description: validateRequiredText(editData.description, "Description"),
      budget: validatePositiveNumber(editData.budget, "Budget"),
      priority: validateRequiredText(editData.priority, "Priority"),
      dates: validateDateOrder(editData.startDate, editData.endDate),
    };
    setEditErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      setEditMessage("Please fix the highlighted fields.");
      return;
    }
    setIsSaving(true);
    try {
      const token = Cookies.get("token");
      await axios.put(
        `${serverUrl}/api/project?id=${id}`,
        {
          title: trimValue(editData.title),
          description: trimValue(editData.description),
          budget: editData.budget,
          priority: trimValue(editData.priority),
          designPreference: trimValue(editData.designPreference),
          startDate: editData.startDate,
          endDate: editData.endDate,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      closeEditModal();
      fetchProject();
    } catch (err) {
      setEditMessage("Failed to update project.");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchProject();
    }
  }, [id]);

  const tabs = [
    { label: "Overview", path: "overview" },
    { label: "Tasks", path: "tasks" },
    { label: "Progress", path: "progress" },
    { label: "Timeline", path: "timeline" },
    { label: "Files", path: "files" },
    { label: "Updates", path: "update" },
  ];

  const handleBack = () => {
    navigate("/dashboard/projects");
  };

  const designersCount = Array.isArray(project?.members)
    ? project.members.filter((member) => member.role === "designer").length
    : 0;
  const statusKey = project?.status?.toLowerCase() || "default";
  const activeStatusStyle = statusStyles[statusKey] || statusStyles.default;
  const summaryItems = [
    {
      label: "Budget",
      value: formatCurrency(project?.budget),
      helper: project?.priority ? `Priority: ${project.priority}` : "Not prioritized yet",
    },
    {
      label: "Timeline",
      value: formatDate(project?.startDate),
      helper: project?.endDate ? `Ends ${formatDate(project.endDate)}` : "End date pending",
    },
    {
      label: "Space",
      value: project?.projectType || project?.roomType || "Project type pending",
      helper: project?.projectSize ? `${project.projectSize} sq ft` : "Size not set",
    },
    {
      label: "Team",
      value: designersCount ? `${designersCount} designer${designersCount > 1 ? "s" : ""}` : "No designers assigned",
      helper: project?.projectLocation || "Location to be confirmed",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-3 py-4 sm:px-4 sm:py-6 lg:px-0">
      <div className="flex justify-start">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-[#1d3c34]/20 hover:text-[#1d3c34]"
        >
          <FiArrowLeft size={16} />
          Back to projects
        </button>
      </div>

      <section className="overflow-hidden rounded-[28px] border border-black/5 bg-[#fcfbf8] shadow-[0_30px_70px_-45px_rgba(15,23,42,0.35)]">
        <div className="border-b border-black/5 bg-[radial-gradient(circle_at_top_left,_rgba(29,60,52,0.12),_transparent_40%),linear-gradient(180deg,_rgba(255,255,255,0.96),_rgba(252,251,248,0.96))] px-5 py-6 sm:px-8 sm:py-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-black/10 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#1d3c34]">
                  Project Detail
                </span>
                <span
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold capitalize ${activeStatusStyle.badge}`}
                >
                  <span className={`h-2.5 w-2.5 rounded-full ${activeStatusStyle.accent}`} />
                  {project?.status || "Unknown"}
                </span>
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl font-semibold tracking-[-0.03em] text-slate-900 sm:text-4xl">
                  {project?.title || "Project Not Found"}
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                  {project?.description ||
                    "A refined project workspace for planning deliverables, materials, files, and team activity."}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {project?.projectType ? (
                  <span className="rounded-full bg-[#1d3c34]/10 px-3 py-1 text-sm font-medium text-[#1d3c34]">
                    {project.projectType}
                  </span>
                ) : null}
                {project?.roomType ? (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                    {project.roomType}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col items-stretch gap-3 xl:min-w-[210px] xl:items-end">
              {project && project.status !== "pending" ? (
                <button
                  className="inline-flex items-center justify-center rounded-full bg-[#1d3c34] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#163029]"
                  onClick={openEditModal}
                >
                  Edit Project
                </button>
              ) : null}
              <p className="text-right text-xs leading-6 text-slate-500">
                Keep the project brief, schedule, and budget aligned in one place.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-px bg-black/5 sm:grid-cols-2 xl:grid-cols-4">
          {summaryItems.map((item) => (
            <div key={item.label} className="bg-white px-5 py-5 sm:px-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                {item.label}
              </p>
              <p className="mt-3 text-lg font-semibold text-slate-900">{item.value}</p>
              <p className="mt-1 text-sm text-slate-500">{item.helper}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[24px] border border-black/5 bg-white/80 p-2 shadow-sm backdrop-blur">
        <nav className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <NavLink
              key={tab.path}
              to={`/dashboard/projects/${id}/${tab.path}`}
              className={({ isActive }) =>
                `rounded-full px-4 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-[#1d3c34] text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </section>

      <div className="min-h-[240px] rounded-[28px] border border-black/5 bg-[#fcfbf8] p-4 shadow-[0_30px_70px_-45px_rgba(15,23,42,0.35)] sm:p-6 lg:p-8">
        <Outlet context={{ project, refreshProject: fetchProject }} />
      </div>

      <EditProjectModal
        isOpen={isEditOpen}
        onClose={closeEditModal}
        onSubmit={handleEditSubmit}
        isSaving={isSaving}
        editData={editData}
        onChange={handleEditChange}
        errors={editErrors}
        message={editMessage}
      />
    </div>
  );
}

export default ProjectDetailsPage;
