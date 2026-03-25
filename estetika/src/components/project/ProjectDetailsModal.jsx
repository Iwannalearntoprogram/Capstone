import React, { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import {
  FiAlertCircle,
  FiArrowRight,
  FiCalendar,
  FiCheck,
  FiClock,
  FiMapPin,
  FiSquare,
  FiUser,
  FiUsers,
  FiX,
} from "react-icons/fi";

const ProjectDetailsModal = ({ project, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [actionMessageType, setActionMessageType] = useState("success");
  const [status, setStatus] = useState(project?.status);
  const [designers, setDesigners] = useState([]);
  const [selectedDesigner, setSelectedDesigner] = useState("");
  const [assignError, setAssignError] = useState("");

  const serverUrl = import.meta.env.VITE_SERVER_URL;

  useEffect(() => {
    setStatus(project?.status);
    setActionMessage("");
    setSelectedDesigner("");
    setAssignError("");
  }, [project]);

  useEffect(() => {
    if (status === "ongoing" || status === "delayed") {
      const fetchDesigners = async () => {
        try {
          const token = Cookies.get("token");
          const res = await axios.get(`${serverUrl}/api/user`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const designerList = res.data.filter((u) => u.role === "designer");
          setDesigners(designerList);
        } catch (err) {
          setDesigners([]);
        }
      };

      fetchDesigners();
    }
  }, [status, serverUrl]);

  if (!project) return null;

  const formatProjectDate = (value) => {
    if (!value) return "N/A";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "N/A";

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatBudget = (value) => {
    if (typeof value === "number") {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "PHP",
        minimumFractionDigits: 0,
      }).format(value);
    }

    return value || "N/A";
  };

  const getClientName = () =>
    project?.projectCreator?.fullName ||
    (project?.projectCreator?.firstName && project?.projectCreator?.lastName
      ? `${project.projectCreator.firstName} ${project.projectCreator.lastName}`
      : project?.projectCreator?.username ||
        project?.projectCreator?.email ||
        "N/A");

  const getStatusBadgeClasses = (value) => {
    switch (value) {
      case "pending":
        return "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200";
      case "ongoing":
        return "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200";
      case "delayed":
        return "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-200";
      case "cancelled":
        return "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200";
      case "completed":
        return "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200";
      default:
        return "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200";
    }
  };

  const handleStatusChange = async (newStatus) => {
    setLoading(true);
    setActionMessage("");
    setActionMessageType("success");

    try {
      const token = Cookies.get("token");
      await axios.put(
        `${serverUrl}/api/project?id=${project._id}`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setStatus(newStatus);
      setActionMessageType("success");
      setActionMessage(
        newStatus === "ongoing"
          ? "Project approved and moved to ongoing."
          : "Project declined and set to cancelled."
      );

      setTimeout(() => {
        setActionMessage("");
        if (newStatus === "cancelled") {
          onClose();
          window.location.reload();
        }
      }, 1200);
    } catch (err) {
      setActionMessageType("error");
      setActionMessage("Failed to update project status.");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignDesigner = async (e) => {
    e.preventDefault();
    if (!selectedDesigner) {
      setAssignError("Please select a designer.");
      return;
    }

    setLoading(true);
    setActionMessage("");
    setActionMessageType("success");
    setAssignError("");

    try {
      const token = Cookies.get("token");
      const prevMembers = Array.isArray(project.members)
        ? project.members.map((member) =>
            typeof member === "string" ? member : member._id
          )
        : [];
      const updatedMembers = prevMembers.includes(selectedDesigner)
        ? prevMembers
        : [...prevMembers, selectedDesigner];

      await axios.put(
        `${serverUrl}/api/project?id=${project._id}`,
        { members: updatedMembers },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setActionMessageType("success");
      setActionMessage("Designer assigned successfully.");
      setTimeout(() => {
        setActionMessage("");
        onClose();
        window.location.reload();
      }, 500);
    } catch (err) {
      setActionMessageType("error");
      setActionMessage("Failed to assign designer.");
    } finally {
      setLoading(false);
    }
  };

  const formattedStartDate = formatProjectDate(project.startDate);
  const formattedEndDate = formatProjectDate(project.endDate);
  const formattedBudget = formatBudget(project.budget);
  const clientName = getClientName();
  const isActiveProject = status !== "pending" && status !== "cancelled";
  const currentDesigners =
    Array.isArray(project.members) && project.members.length > 0
      ? project.members.filter((member) => member.role === "designer")
      : [];

  const availableDesigners = designers.filter(
    (designer) =>
      !currentDesigners.some(
        (currentDesigner) =>
          currentDesigner._id === designer._id ||
          currentDesigner.username === designer.username
      )
  );

  const detailItems = [
    {
      label: "Client",
      value: clientName,
      icon: FiUser,
    },
    {
      label: "Budget",
      value: formattedBudget,
      icon: FiSquare,
    },
    {
      label: "Start Date",
      value: formattedStartDate,
      icon: FiCalendar,
    },
    {
      label: "End Date",
      value: formattedEndDate,
      icon: FiClock,
    },
    {
      label: "Location",
      value: project.projectLocation || "N/A",
      icon: FiMapPin,
    },
    {
      label: "Project Size",
      value: project.projectSize ? `${project.projectSize} sq ft` : "N/A",
      icon: FiSquare,
    },
    {
      label: "Room Type",
      value: project.roomType || "N/A",
      icon: FiSquare,
    },
    {
      label: "Project Type",
      value: project.projectType || "N/A",
      icon: FiSquare,
    },
    {
      label: "Priority",
      value: project.priority || "N/A",
      icon: FiAlertCircle,
    },
  ];

  const actionMessageClasses =
    actionMessageType === "error"
      ? "text-rose-700 bg-rose-50 border-rose-200"
      : "text-emerald-700 bg-emerald-50 border-emerald-200";

  const CloseButton = ({ className = "" }) => (
    <button
      className={`inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-slate-200 bg-white/95 text-slate-500 transition hover:border-slate-300 hover:text-slate-700 sm:h-10 sm:w-10 sm:rounded-[12px] ${className}`}
      onClick={onClose}
      aria-label="Close modal"
    >
      <FiX size={18} />
    </button>
  );

  const ModalShell = ({ children, hideClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f1720]/45 p-3 backdrop-blur-sm sm:p-4">
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[14px] border border-stone-200/90 bg-[#fcfcfa] shadow-[0_24px_80px_rgba(15,23,32,0.18)] sm:rounded-[16px]">
        {!hideClose && (
          <CloseButton className="absolute right-4 top-4 z-20 sm:right-5 sm:top-5" />
        )}
        {children}
      </div>
    </div>
  );

  const SectionCard = ({
    title,
    headerRight = null,
    children,
    className = "",
  }) => (
    <section
      className={`rounded-[12px] border border-slate-200/80 bg-white p-4 shadow-sm sm:rounded-[14px] sm:p-5 ${className}`}
    >
      {title && (
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 sm:text-sm">
            {title}
          </h3>
          {headerRight}
        </div>
      )}
      {children}
    </section>
  );

  if (isActiveProject) {
    return (
      <ModalShell hideClose>
        <div className="min-h-0 overflow-y-auto md:grid md:grid-cols-[1.02fr_0.98fr] md:grid-rows-[1fr]">
          <div className="border-b border-slate-200/80 bg-[linear-gradient(180deg,#f8faf8_0%,#fcfcfa_100%)] p-5 sm:p-6 md:border-b-0 md:border-r md:p-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Team Assignment
            </p>
            <h2 className="max-w-md text-[2rem] font-semibold tracking-tight text-slate-900">
              Add designer to {project.title}
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-6 text-slate-600">
              Assign a designer to continue delivery and keep project ownership
              clear.
            </p>

            <div className="mt-6 space-y-3">
              <SectionCard title="Project Snapshot">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Client
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-800">
                      {clientName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Status
                    </p>
                    <span
                      className={`mt-2 inline-flex rounded-lg px-3 py-1 text-xs font-semibold capitalize ${getStatusBadgeClasses(
                        status
                      )}`}
                    >
                      {status}
                    </span>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Current Designers">
                {currentDesigners.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {currentDesigners.map((designer, index) => (
                      <span
                        key={designer._id || index}
                        className="inline-flex items-center rounded-[10px] bg-[#eef4f0] px-3 py-1.5 text-sm font-medium text-[#244338]"
                      >
                        {designer.fullName ||
                          designer.username ||
                          designer.email}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    No designer is assigned yet.
                  </p>
                )}
              </SectionCard>
            </div>
          </div>

          <div className="flex flex-col p-5 sm:p-6 md:p-6">
            <SectionCard title="Assign Designer" className="flex-1 flex flex-col [&>:last-child]:flex-1" headerRight={<CloseButton />}>
              <form onSubmit={handleAssignDesigner} className="flex h-full flex-col">
                <label className="text-sm font-medium text-slate-700">
                  Designer
                </label>
                <select
                  className="mt-2 w-full rounded-[10px] border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#1D3C34] focus:ring-4 focus:ring-[#1D3C34]/10"
                  value={selectedDesigner}
                  onChange={(e) => {
                    setSelectedDesigner(e.target.value);
                    setAssignError(
                      e.target.value ? "" : "Please select a designer."
                    );
                  }}
                  required
                >
                  <option value="">Select a designer</option>
                  {availableDesigners.map((designer) => (
                    <option key={designer._id} value={designer.username}>
                      {designer.fullName || designer.username}
                    </option>
                  ))}
                </select>

                {assignError && (
                  <p className="mt-2 text-sm text-rose-600">{assignError}</p>
                )}

                {availableDesigners.length === 0 && (
                  <div className="mt-4 rounded-[10px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    All available designers are already assigned.
                  </div>
                )}

                <div className="mt-5 rounded-[10px] border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-[10px] bg-white p-2 text-slate-500 shadow-sm">
                      <FiUsers size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        Assignment note
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        The selected designer will be added to the project team
                        and the client will be notified.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-8">
                  {actionMessage && (
                    <p
                      className={`mb-4 rounded-[10px] border px-4 py-3 text-sm ${actionMessageClasses}`}
                    >
                      {actionMessage}
                    </p>
                  )}

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      className="rounded-[10px] border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                      onClick={onClose}
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 rounded-[10px] bg-[#1D3C34] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#163129] disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={loading || availableDesigners.length === 0}
                    >
                      {loading ? "Assigning..." : "Assign Designer"}
                      {!loading && <FiArrowRight size={16} />}
                    </button>
                  </div>
                </div>
              </form>
            </SectionCard>
          </div>
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell>
      <div className="shrink-0 border-b border-slate-200/80 bg-[linear-gradient(180deg,#f7faf7_0%,#fcfcfa_100%)] px-5 pb-5 pt-6 pr-28 sm:px-6 sm:pb-6 sm:pt-7 sm:pr-32 md:px-7 md:pt-8 md:pr-36">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="max-w-2xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Project Review
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              {project.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Review the project details before approving it for execution or
              declining the request.
            </p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6 md:px-7">
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <SectionCard
              title="Overview"
              headerRight={
                <span
                  className={`inline-flex rounded-lg px-3 py-1 text-[10px] font-semibold capitalize sm:text-xs ${getStatusBadgeClasses(
                    status
                  )}`}
                >
                  {status}
                </span>
              }
            >
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {detailItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.label}
                      className="rounded-[10px] border border-slate-200 bg-slate-50/70 p-3 sm:rounded-[12px] sm:p-4"
                    >
                      <div className="mb-2 flex items-center gap-2 text-slate-400 sm:mb-3">
                        <Icon size={14} />
                        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] sm:text-[11px]">
                          {item.label}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-slate-800">
                        {item.value}
                      </p>
                    </div>
                  );
                })}
              </div>
            </SectionCard>

            <SectionCard title="Description">
              <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                {project.description?.trim()
                  ? project.description
                  : "No description provided."}
              </p>
            </SectionCard>
          </div>

          <div className="space-y-4">
            <SectionCard title="Timeline">
              <div className="space-y-3">
                <div className="flex items-start gap-3 rounded-[10px] border border-slate-200 bg-slate-50/70 p-3 sm:rounded-[12px] sm:p-4">
                  <div className="rounded-[8px] bg-white p-2 text-slate-500 shadow-sm sm:rounded-[10px]">
                    <FiCalendar size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 sm:text-xs">
                      Start
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-800">
                      {formattedStartDate}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-[10px] border border-slate-200 bg-slate-50/70 p-3 sm:rounded-[12px] sm:p-4">
                  <div className="rounded-[8px] bg-white p-2 text-slate-500 shadow-sm sm:rounded-[10px]">
                    <FiClock size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 sm:text-xs">
                      End
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-800">
                      {formattedEndDate}
                    </p>
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Decision">
              <p className="text-sm leading-6 text-slate-600">
                Approving this request moves the project into active delivery.
                Declining keeps the request from progressing.
              </p>

              {actionMessage && (
                <div
                  className={`mt-4 rounded-[10px] border px-4 py-3 text-sm ${actionMessageClasses}`}
                >
                  {actionMessage}
                </div>
              )}
            </SectionCard>
          </div>
        </div>
      </div>

      <div className="shrink-0 flex flex-col gap-4 border-t border-slate-200/80 bg-white px-5 py-4 sm:px-6 sm:py-5 md:px-7">
        <p className="text-sm text-slate-500">
          Confirm the project details before taking action.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
          <button
            type="button"
            className="w-full rounded-[10px] border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:w-auto"
            onClick={onClose}
          >
            Close
          </button>
          <button
            className="inline-flex w-full items-center justify-center gap-2 rounded-[10px] bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            onClick={() => handleStatusChange("cancelled")}
            disabled={loading}
          >
            <FiX size={16} />
            {loading ? "Processing..." : "Decline"}
          </button>
          <button
            className="inline-flex w-full items-center justify-center gap-2 rounded-[10px] bg-[#1D3C34] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#163129] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            onClick={() => handleStatusChange("ongoing")}
            disabled={loading}
          >
            <FiCheck size={16} />
            {loading ? "Processing..." : "Approve Project"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
};

export default ProjectDetailsModal;
