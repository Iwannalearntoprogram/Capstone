import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import ProfileImage from "../common/ProfileImage";

const formatCurrency = (value) =>
  typeof value === "number"
    ? new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        maximumFractionDigits: 0,
      }).format(value)
    : "Not set";

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date(value))
    : "Not scheduled";

const formatPercent = (value) =>
  typeof value === "number" ? `${Math.round(value * 100)}%` : "N/A";

const formatBudgetRange = (range) => {
  const hasMin = typeof range?.min === "number";
  const hasMax = typeof range?.max === "number";

  if (!hasMin && !hasMax) {
    return "Not set";
  }

  if (hasMin && hasMax) {
    return `${formatCurrency(range.min)} - ${formatCurrency(range.max)}`;
  }

  if (hasMin) {
    return `From ${formatCurrency(range.min)}`;
  }

  return `Up to ${formatCurrency(range.max)}`;
};

const formatTimeline = (startDate, endDate) => {
  if (startDate && endDate) {
    return `${formatDate(startDate)} to ${formatDate(endDate)}`;
  }

  if (startDate) {
    return `Starts ${formatDate(startDate)}`;
  }

  if (endDate) {
    return `Ends ${formatDate(endDate)}`;
  }

  return "Not scheduled";
};

function SectionPanel({
  eyebrow,
  title,
  description,
  children,
  className = "",
}) {
  return (
    <section
      className={`rounded-[24px] border border-black/5 bg-white p-5 sm:p-6 ${className}`}
    >
      <div className="mb-6 space-y-2">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-900">
          {title}
        </h2>
        {description ? (
          <p className="max-w-2xl text-sm leading-7 text-slate-500">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function DetailItem({ label, value, className = "" }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-4 ${className}`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-900">
        {value || "Not set"}
      </p>
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-900">
        {value}
      </p>
    </div>
  );
}

function TeamMemberCard({ designer }) {
  return (
    <div className="rounded-[22px] border border-slate-200/80 bg-[#fcfbf8] px-4 py-4">
      <div className="flex items-center gap-3">
        <ProfileImage
          src={designer.profileImage}
          alt={designer.fullName || designer.username || "Designer"}
          className="h-12 w-12 rounded-2xl object-cover bg-slate-100"
        />
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-slate-900">
            {designer.fullName || designer.username || "Unknown"}
          </p>
          <p className="truncate text-sm text-slate-500">
            @{designer.username || "N/A"}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Email
          </p>
          <p className="mt-1 truncate font-medium text-slate-900 sm:break-all sm:truncate-none">
            {designer.email || "Not provided"}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Phone
          </p>
          <p className="mt-1 font-medium text-slate-900">
            {designer.phoneNumber || "Not provided"}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ProjectOverviewTab() {
  const { project } = useOutletContext();
  const [materialsPage, setMaterialsPage] = useState(1);

  const designers = Array.isArray(project?.members)
    ? project.members.filter((member) => member.role === "designer")
    : [];
  const recommendedMaterials = Array.isArray(project?.recommendedMaterials)
    ? project.recommendedMaterials
    : [];
  const materialsPerPage = 4;
  const totalMaterialPages = Math.max(
    1,
    Math.ceil(recommendedMaterials.length / materialsPerPage),
  );
  const paginatedMaterials = recommendedMaterials.slice(
    (materialsPage - 1) * materialsPerPage,
    materialsPage * materialsPerPage,
  );

  useEffect(() => {
    setMaterialsPage(1);
  }, [project?._id, recommendedMaterials.length]);

  useEffect(() => {
    if (materialsPage > totalMaterialPages) {
      setMaterialsPage(totalMaterialPages);
    }
  }, [materialsPage, totalMaterialPages]);

  if (!project) {
    return (
      <div className="flex min-h-[280px] items-center justify-center rounded-[24px] border border-dashed border-slate-300 bg-white px-6 text-center">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">
            Project Overview
          </p>
          <p className="text-lg font-semibold text-slate-900">
            No project data available
          </p>
          <p className="text-sm text-slate-500">
            Refresh the page or reopen the project from the list.
          </p>
        </div>
      </div>
    );
  }

  const projectDetails = [
    { label: "Budget", value: formatCurrency(project.budget) },
    {
      label: "Timeline",
      value: formatTimeline(project.startDate, project.endDate),
    },
    { label: "Location", value: project.projectLocation || "Location not set" },
    {
      label: "Project size",
      value: project.projectSize
        ? `${project.projectSize} sq ft`
        : "Size not set",
    },
    { label: "Room type", value: project.roomType || "Room type not set" },
    {
      label: "Project type",
      value: project.projectType || "Project type not set",
    },
    { label: "Priority", value: project.priority || "Not set" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <SectionPanel
          eyebrow="Overview"
          title="Project brief"
          description="A concise summary of the scope, budget, schedule, and context used across planning and recommendations."
        >
          <div className="rounded-[22px] border border-slate-200/80 bg-[#fcfbf8] px-5 py-5">
            <p className="text-sm leading-8 text-slate-600">
              {project.description ||
                "No project description has been added yet. Add a clear brief to improve recommendations and coordination across the team."}
            </p>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {projectDetails.map((item) => (
              <DetailItem
                key={item.label}
                label={item.label}
                value={item.value}
                className={item.label === "Timeline" ? "xl:col-span-2" : ""}
              />
            ))}
          </div>
        </SectionPanel>

        <SectionPanel
          eyebrow="Team"
          title="Design team"
          description="People currently assigned to the project from the design side."
          className="h-full"
        >
          {designers.length > 0 ? (
            <div className="space-y-3">
              {designers.map((designer, index) => (
                <TeamMemberCard
                  key={designer._id || index}
                  designer={designer}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[22px] border border-dashed border-slate-300 bg-slate-50/80 px-5 py-10 text-center">
              <p className="text-lg font-semibold text-slate-900">
                No designers assigned
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-500">
                Designers will appear here once they are added to the project
                team.
              </p>
            </div>
          )}
        </SectionPanel>
      </div>

      {project.designRecommendation ? (
        <SectionPanel
          eyebrow="Concept"
          title="Design recommendation"
          description="A supporting design direction matched to the current brief and stylistic preferences."
        >
          <div
            className={`grid gap-6 ${
              project.designRecommendation.imageLink
                ? "xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]"
                : ""
            }`}
          >
            {project.designRecommendation.imageLink ? (
              <div className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-slate-100">
                <img
                  src={project.designRecommendation.imageLink}
                  alt={
                    project.designRecommendation.title ||
                    "Design recommendation"
                  }
                  className="h-full min-h-[320px] w-full object-cover"
                />
              </div>
            ) : null}

            <div className="space-y-5">
              <div className="rounded-[22px] border border-slate-200/80 bg-[#fcfbf8] px-5 py-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-2xl font-semibold tracking-[-0.03em] text-slate-900">
                      {project.designRecommendation.title ||
                        "Recommended design"}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      {project.designRecommendation.specification ||
                        "No design specification has been provided for this recommendation yet."}
                    </p>
                  </div>

                  {project.designRecommendation.type ? (
                    <span className="rounded-full bg-slate-200/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700">
                      {project.designRecommendation.type}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <DetailItem
                  label="Budget range"
                  value={formatBudgetRange(
                    project.designRecommendation.budgetRange,
                  )}
                />
                <DetailItem
                  label="Popularity"
                  value={
                    project.designRecommendation.popularity !== undefined
                      ? `${project.designRecommendation.popularity} likes`
                      : "No popularity data"
                  }
                />
              </div>

              {Array.isArray(project.designRecommendation.designPreferences) &&
              project.designRecommendation.designPreferences.length > 0 ? (
                <div className="rounded-[22px] border border-slate-200/80 bg-white px-5 py-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Design preferences
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {project.designRecommendation.designPreferences.map(
                      (preference, index) => (
                        <span
                          key={index}
                          className="rounded-full bg-[#1d3c34]/10 px-3 py-1 text-sm font-medium text-[#1d3c34]"
                        >
                          {preference
                            .replace("-", " ")
                            .replace(/\b\w/g, (letter) => letter.toUpperCase())}
                        </span>
                      ),
                    )}
                  </div>
                </div>
              ) : null}

              {Array.isArray(project.designRecommendation.tags) &&
              project.designRecommendation.tags.length > 0 ? (
                <div className="rounded-[22px] border border-slate-200/80 bg-white px-5 py-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Tags
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {project.designRecommendation.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </SectionPanel>
      ) : null}

      <SectionPanel
        eyebrow="Materials"
        title="Recommended materials"
        description="Category-based material recommendations automatically tailored to the priority, preferences, description, and budget."
      >
        {recommendedMaterials.length > 0 ? (
          <div className="flex flex-col gap-4">
            {paginatedMaterials.map((rec, index) => {
              const recommendedMaterial = rec.material;
              const recommendationScore = rec.score;

              return (
                <div 
                  key={`${recommendedMaterial?._id || recommendedMaterial?.name || "material"}-${index}`} 
                  className="group flex flex-col md:flex-row gap-5 rounded-[20px] border border-slate-200/60 bg-white p-4 transition-all hover:shadow-md hover:border-slate-300"
                >
                  {/* Image Column */}
                  <div className="h-32 w-full md:w-36 shrink-0 overflow-hidden rounded-[14px] bg-slate-100">
                    {Array.isArray(recommendedMaterial.image) && recommendedMaterial.image.length > 0 ? (
                      <img
                        src={recommendedMaterial.image[0]}
                        alt={recommendedMaterial.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                        No image
                      </div>
                    )}
                  </div>

                  {/* Info Column */}
                  <div className="flex flex-1 flex-col justify-between min-w-0">
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 border border-emerald-100">
                          {recommendedMaterial.category || "General"}
                        </span>
                        <div className="text-sm font-semibold text-emerald-900 border-b border-emerald-100 pb-0.5">
                          {formatCurrency(recommendedMaterial.price)}
                        </div>
                      </div>
                      
                      <h3 className="truncate text-lg font-bold tracking-tight text-slate-900">
                        {recommendedMaterial.name}
                      </h3>
                      <p className="truncate text-sm text-slate-500">
                        {recommendedMaterial.company || "Unknown supplier"}
                      </p>
                    </div>

                  </div>
                </div>
              );
            })}

            {totalMaterialPages > 1 ? (
              <div className="flex flex-col gap-3 rounded-[20px] border border-slate-200/70 bg-slate-50/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-medium text-slate-600">
                  Showing {(materialsPage - 1) * materialsPerPage + 1}-
                  {Math.min(
                    materialsPage * materialsPerPage,
                    recommendedMaterials.length,
                  )}{" "}
                  of {recommendedMaterials.length} materials
                </p>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() =>
                      setMaterialsPage((currentPage) =>
                        Math.max(1, currentPage - 1),
                      )
                    }
                    disabled={materialsPage === 1}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="min-w-[88px] text-center text-sm font-semibold text-slate-700">
                    Page {materialsPage} of {totalMaterialPages}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setMaterialsPage((currentPage) =>
                        Math.min(totalMaterialPages, currentPage + 1),
                      )
                    }
                    disabled={materialsPage === totalMaterialPages}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="rounded-[22px] border border-dashed border-slate-300 bg-slate-50/80 px-5 py-10 text-center">
            <p className="text-lg font-semibold text-slate-900">
              No material recommendations available yet
            </p>
            <p className="mt-2 text-sm leading-7 text-slate-500">
              Add richer project details or catalog materials to generate more
              relevant category recommendations.
            </p>
          </div>
        )}
      </SectionPanel>
    </div>
  );
}
