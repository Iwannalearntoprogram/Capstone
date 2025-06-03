import {
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaHome,
  FaUsers,
  FaDollarSign,
  FaRulerCombined,
  FaCheckCircle,
} from "react-icons/fa";
import { useOutletContext } from "react-router-dom";

export default function ProjectOverviewTab() {
  const { project } = useOutletContext();

  if (!project) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 text-lg">No project data available</div>
      </div>
    );
  }

  // Filter only designers from members
  const designers = Array.isArray(project.members)
    ? project.members.filter((m) => m.role === "designer")
    : [];

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "ongoing":
        return "bg-green-100 text-green-800 border-green-200";
      case "completed":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const InfoCard = ({ icon: Icon, label, value, className = "" }) => (
    <div
      className={`bg-white rounded-lg p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow ${className}`}
    >
      <div className="flex items-start space-x-3">
        <div className="p-2 rounded-lg" style={{ backgroundColor: "#f0fdf4" }}>
          <Icon className="h-5 w-5" style={{ color: "#1D3C34" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-base font-semibold text-gray-900 mt-1 break-words">
            {value || "—"}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="mx-auto p-6 bg-gray-50 rounded-lg">
      <div
        className="bg-gradient-to-r from-emerald-700 to-green-800 rounded-lg p-8 mb-8 text-white"
        style={{ background: "linear-gradient(to right, #1D3C34, #15803d)" }}
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">
              {project.title || "Untitled Project"}
            </h1>
            <p className="text-green-100 text-lg max-w-2xl">
              {project.description || "No description available"}
            </p>
          </div>
          <div
            className={`px-4 py-2 rounded-lg border ${getStatusColor(
              project.status
            )} bg-white flex-shrink-0`}
          >
            <div className="flex items-center space-x-2">
              <FaCheckCircle className="h-4 w-4" />
              <span className="font-medium capitalize">
                {project.status || "Unknown"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Project Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <InfoCard
          icon={FaDollarSign}
          label="Budget"
          value={project.budget ? `₱${project.budget.toLocaleString()}` : null}
        />
        <InfoCard
          icon={FaCalendarAlt}
          label="Start Date"
          value={
            project.startDate
              ? new Date(project.startDate).toLocaleDateString()
              : null
          }
        />
        <InfoCard
          icon={FaCalendarAlt}
          label="End Date"
          value={
            project.endDate
              ? new Date(project.endDate).toLocaleDateString()
              : null
          }
        />
        <InfoCard
          icon={FaMapMarkerAlt}
          label="Location"
          value={project.projectLocation}
        />
        <InfoCard
          icon={FaRulerCombined}
          label="Project Size"
          value={project.projectSize ? `${project.projectSize} sq ft` : null}
        />
        <InfoCard icon={FaHome} label="Room Type" value={project.roomType} />
      </div>

      {/* Designers Section */}
      <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6 ">
        <div className="flex items-center space-x-3 mb-6">
          <div
            className="p-2 rounded-lg"
            style={{ backgroundColor: "#f0fdf4" }}
          >
            <FaUsers className="h-6 w-6" style={{ color: "#1D3C34" }} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            Design Team
            {designers.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({designers.length}{" "}
                {designers.length === 1 ? "designer" : "designers"})
              </span>
            )}
          </h2>
        </div>

        {designers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {designers.map((designer, i) => (
              <div
                key={designer._id || i}
                className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-300"
                style={{
                  "--tw-border-opacity": "1",
                  borderColor: "rgb(229 231 235 / var(--tw-border-opacity))",
                }}
                onMouseEnter={(e) => (e.target.style.borderColor = "#86efac")}
                onMouseLeave={(e) =>
                  (e.target.style.borderColor = "rgb(229 231 235)")
                }
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                    style={{
                      background: "linear-gradient(135deg, #1D3C34, #22c55e)",
                    }}
                  >
                    {designer.fullName
                      ? designer.fullName.charAt(0).toUpperCase()
                      : designer.username?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">
                      {designer.fullName || designer.username || "Unknown"}
                    </h3>
                    <p className="text-sm text-gray-500">
                      @{designer.username || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start space-x-2 text-sm">
                    <div
                      className="w-2 h-2 rounded-lg mt-2 flex-shrink-0"
                      style={{ backgroundColor: "#22c55e" }}
                    ></div>
                    <div>
                      <span className="text-gray-600 block">Email:</span>
                      <span className="text-gray-900 font-medium break-all">
                        {designer.email || "Not provided"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2 text-sm">
                    <div
                      className="w-2 h-2 rounded-lg mt-2 flex-shrink-0"
                      style={{ backgroundColor: "#16a34a" }}
                    ></div>
                    <div>
                      <span className="text-gray-600 block">Phone:</span>
                      <span className="text-gray-900 font-medium">
                        {designer.phoneNumber || "Not provided"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FaUsers className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              No designers assigned to this project
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Designers will appear here once they're added to the project
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
