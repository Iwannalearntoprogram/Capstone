import {
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaHome,
  FaUsers,
  FaDollarSign,
  FaRulerCombined,
  FaCheckCircle,
  FaLightbulb,
  FaTags,
  FaHeart,
  FaBuilding,
  FaBullseye,
  FaLayerGroup,
  FaPalette,
  FaBoxOpen,
} from "react-icons/fa";
import { useOutletContext } from "react-router-dom";
import defaultProfile from "../../assets/images/user.png";

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
  const recommendedMaterial = project.recommendedMaterial?.material || null;
  const recommendationAnalysis = project.recommendedMaterial?.analysis || null;
  const recommendationScore = project.recommendedMaterial?.score || null;

  const formatCurrency = (value) =>
    typeof value === "number"
      ? new Intl.NumberFormat("en-PH", {
          style: "currency",
          currency: "PHP",
          maximumFractionDigits: 0,
        }).format(value)
      : null;

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
      className={`rounded-lg border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md ${className}`}
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
    <div className="mx-auto rounded-lg bg-gray-50 p-3 sm:p-4 lg:p-6">
      <div
        className="mb-6 rounded-lg bg-gradient-to-r from-emerald-700 to-green-800 p-5 text-white sm:mb-8 sm:p-8"
        style={{ background: "linear-gradient(to right, #1D3C34, #15803d)" }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="mb-2 break-words text-2xl font-bold sm:text-3xl">
              {project.title || "Untitled Project"}
            </h1>
            <p className="max-w-2xl break-words text-base text-green-100 sm:text-lg">
              {project.description || "No description available"}
            </p>
          </div>
          <div
            className={`w-full rounded-lg border px-4 py-2 sm:w-auto ${getStatusColor(
              project.status
            )} bg-white shrink-0`}
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

      <div className="mb-8 rounded-lg border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center space-x-3">
          <div
            className="rounded-lg p-2"
            style={{ backgroundColor: "#ecfdf5" }}
          >
            <FaBoxOpen className="h-6 w-6" style={{ color: "#1D3C34" }} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Recommended Material
            </h2>
            <p className="text-sm text-gray-500">
              One automatic recommendation based on priority, preferences,
              description, and budget.
            </p>
          </div>
        </div>

        {recommendedMaterial ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="min-w-0">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h3 className="text-xl font-bold text-gray-900">
                    {recommendedMaterial.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {recommendedMaterial.company || "Unknown supplier"}
                  </p>
                </div>
                <div className="shrink-0 rounded-lg bg-emerald-50 px-3 py-2 text-right">
                  <div className="text-xs font-medium uppercase tracking-wide text-emerald-700">
                    Material Price
                  </div>
                  <div className="text-lg font-bold text-emerald-900">
                    {formatCurrency(recommendedMaterial.price) || "N/A"}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {recommendedMaterial.category && (
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                    {recommendedMaterial.category}
                  </span>
                )}
                {recommendedMaterial.subCategory && (
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                    {recommendedMaterial.subCategory}
                  </span>
                )}
                {recommendationAnalysis?.priority && (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
                    Priority: {recommendationAnalysis.priority}
                  </span>
                )}
              </div>

              <p className="mt-4 text-sm leading-7 text-gray-700">
                {recommendedMaterial.description ||
                  "No material description available."}
              </p>

              {Array.isArray(recommendationAnalysis?.reasons) &&
                recommendationAnalysis.reasons.length > 0 && (
                  <div className="mt-5 space-y-2">
                    {recommendationAnalysis.reasons.map((reason, index) => (
                      <div
                        key={index}
                        className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
                      >
                        {reason}
                      </div>
                    ))}
                  </div>
                )}
            </div>

            <div className="space-y-4">
              {Array.isArray(recommendedMaterial.image) &&
              recommendedMaterial.image.length > 0 ? (
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                  <img
                    src={recommendedMaterial.image[0]}
                    alt={recommendedMaterial.name}
                    className="h-64 w-full object-cover"
                  />
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                  <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Style Fit
                  </div>
                  <div className="mt-1 text-lg font-bold text-gray-900">
                    {recommendationScore
                      ? `${Math.round(recommendationScore.keywordFit * 100)}%`
                      : "N/A"}
                  </div>
                </div>
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                  <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Budget Fit
                  </div>
                  <div className="mt-1 text-lg font-bold text-gray-900">
                    {recommendationScore
                      ? `${Math.round(recommendationScore.budgetFit * 100)}%`
                      : "N/A"}
                  </div>
                </div>
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                  <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Room Fit
                  </div>
                  <div className="mt-1 text-lg font-bold text-gray-900">
                    {recommendationScore
                      ? `${Math.round(recommendationScore.roomFit * 100)}%`
                      : "N/A"}
                  </div>
                </div>
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                  <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Overall Match
                  </div>
                  <div className="mt-1 text-lg font-bold text-gray-900">
                    {recommendationScore
                      ? `${Math.round(recommendationScore.total * 100)}%`
                      : "N/A"}
                  </div>
                </div>
              </div>

              {recommendationAnalysis?.estimatedCeiling ? (
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm text-gray-700">
                  Recommended ceiling:{" "}
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(recommendationAnalysis.estimatedCeiling)}
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-500">
            No material recommendation is available yet. Add catalog materials or
            update the project details to generate a better match.
          </div>
        )}
      </div>

      {/* Design Recommendation Section */}
      {project.designRecommendation && (
        <div className="mb-8 rounded-lg border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: "#fef3c7" }}
            >
              <FaLightbulb className="h-6 w-6" style={{ color: "#f59e0b" }} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Design Recommendation
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Design Image */}
            {project.designRecommendation.imageLink && (
              <div className="lg:col-span-1">
                <div className="bg-gray-100 rounded-lg overflow-hidden aspect-square">
                  <img
                    src={project.designRecommendation.imageLink}
                    alt={
                      project.designRecommendation.title ||
                      "Design Recommendation"
                    }
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </div>
            )}

            {/* Design Details */}
            <div
              className={`${
                project.designRecommendation.imageLink
                  ? "lg:col-span-2"
                  : "lg:col-span-3"
              }`}
            >
              <div className="space-y-4">
                {/* Title and Type */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {project.designRecommendation.title || "Recommended Design"}
                  </h3>
                  {project.designRecommendation.type && (
                    <span className="inline-block bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-lg">
                      {project.designRecommendation.type}
                    </span>
                  )}
                </div>

                {/* Specification */}
                {project.designRecommendation.specification && (
                  <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg p-4 border-l-4 border-amber-400">
                    <p className="text-gray-800 leading-relaxed">
                      {project.designRecommendation.specification}
                    </p>
                  </div>
                )}

                {/* Budget Range */}
                {project.designRecommendation.budgetRange && (
                  <div className="flex flex-wrap items-center gap-2">
                    <FaDollarSign className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-gray-600">
                      Budget Range:
                    </span>
                    <span className="text-green-700 font-semibold">
                      ₱
                      {project.designRecommendation.budgetRange.min?.toLocaleString()}{" "}
                      - ₱
                      {project.designRecommendation.budgetRange.max?.toLocaleString()}
                    </span>
                  </div>
                )}

                {/* Popularity */}
                {project.designRecommendation.popularity !== undefined && (
                  <div className="flex flex-wrap items-center gap-2">
                    <FaHeart className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium text-gray-600">
                      Popularity:
                    </span>
                    <span className="text-gray-900 font-semibold">
                      {project.designRecommendation.popularity} likes
                    </span>
                  </div>
                )}

                {/* Design Preferences */}
                {project.designRecommendation.designPreferences &&
                  project.designRecommendation.designPreferences.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-600 mb-2">
                        Design Preferences:
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {project.designRecommendation.designPreferences.map(
                          (preference, index) => (
                            <span
                              key={index}
                              className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-lg"
                            >
                              {preference
                                .replace("-", " ")
                                .replace(/\b\w/g, (l) => l.toUpperCase())}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {/* Tags */}
                {project.designRecommendation.tags &&
                  project.designRecommendation.tags.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-600 mb-2 flex items-center">
                        <FaTags className="h-3 w-3 mr-1" />
                        Tags:
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {project.designRecommendation.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="bg-gray-100 text-gray-700 text-xs font-medium px-2 py-1 rounded-lg"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}

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
        <InfoCard
          icon={FaBuilding}
          label="Project Type"
          value={project.projectType}
        />
        <InfoCard
          icon={FaBullseye}
          label="Priority"
          value={project.priority}
        />
        <InfoCard
          icon={FaPalette}
          label="Design Preference"
          value={project.designPreference}
        />
        <InfoCard
          icon={FaLayerGroup}
          label="Matched Keywords"
          value={recommendationAnalysis?.matchedKeywords?.slice(0, 3).join(", ")}
        />
      </div>

      {/* Designers Section */}
      <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
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
                className="rounded-lg border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4 transition-all duration-300 hover:shadow-lg sm:p-6"
                style={{
                  "--tw-border-opacity": "1",
                  borderColor: "rgb(229 231 235 / var(--tw-border-opacity))",
                }}
                onMouseEnter={(e) => (e.target.style.borderColor = "#86efac")}
                onMouseLeave={(e) =>
                  (e.target.style.borderColor = "rgb(229 231 235)")
                }
              >
                <div className="mb-4 flex items-center space-x-3 sm:space-x-4">
                  <img
                    src={designer.profileImage || defaultProfile}
                    alt={designer.fullName || designer.username || "Designer"}
                    className="w-12 h-12 rounded-lg object-cover bg-gray-100"
                  />
                  <div className="min-w-0">
                    <h3 className="truncate font-bold text-lg text-gray-900">
                      {designer.fullName || designer.username || "Unknown"}
                    </h3>
                    <p className="truncate text-sm text-gray-500">
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
