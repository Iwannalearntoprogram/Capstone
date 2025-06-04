import { useState, useEffect } from "react";
import CustomerSatisfactionChart from "../components/dashboard/CustomerSatisfactionChart";
import ProjectCompletionChart from "../components/dashboard/ProjectCompletionChart";
import Cookies from "js-cookie";
import axios from "axios";

// Separated Top Materials Data
const topMaterials = [
  {
    name: "Wall Art",
    popularity: 85,
    sales: 80, // percent
    supplier: "Artify Home",
  },
  {
    name: "Throw Pillows",
    popularity: 75,
    sales: 70, // percent
    supplier: "CozyNest",
  },
  {
    name: "Curtains",
    popularity: 90,
    sales: 85, // percent
    supplier: "DrapeDesigns",
  },
  {
    name: "Rugs",
    popularity: 65,
    sales: 60, // percent
    supplier: "SoftStep",
  },
];

const HomePage = () => {
  const id = localStorage.getItem("id");
  const role = localStorage.getItem("role");
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [completionLoading, setCompletionLoading] = useState(true);

  const [projectsData, setProjectsData] = useState([]);
  const [projectStates, setProjectStates] = useState({});
  const [projectCompletion, setProjectCompletion] = useState({});

  const serverUrl = import.meta.env.VITE_SERVER_URL;

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const token = Cookies.get("token");
        const res = await axios.get(
          `${serverUrl}/api/project?${
            role === "admin" ? "index=true" : `member=${id}`
          }`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setProjectsData(res.data.project);
      } catch (err) {
        setProjectsData([]);
      }
    };
    fetchMaterials();
  }, []);

  useEffect(() => {
    checkProjectsState(projectsData);
    checkProjectCompletion(projectsData);
  }, [projectsData]);

  const checkProjectsState = (projects) => {
    const safeProjects = Array.isArray(projects) ? projects : [];
    const activeProjects = safeProjects.filter(
      (project) => project.status === "ongoing"
    ).length;
    const completedProjects = safeProjects.filter(
      (project) => project.status === "completed"
    ).length;
    const delayedProjects = safeProjects.filter(
      (project) => project.status === "delayed"
    ).length;
    const cancelledProjects = safeProjects.filter(
      (project) => project.status === "cancelled"
    ).length;

    setProjectStates({
      active: activeProjects,
      completed: completedProjects,
      delayed: delayedProjects,
      cancelled: cancelledProjects,
    });

    setOverviewLoading(false);
  };

  const checkProjectCompletion = (projects) => {
    const safeProjects = Array.isArray(projects) ? projects : [];
    const years = [2022, 2023, 2024, 2025, 2026, 2027, 2028];
    const completionData = years.map((year) => ({
      year: year.toString(),
      sales: safeProjects.filter(
        (project) =>
          project.status === "completed" &&
          project.endDate &&
          new Date(project.endDate).getFullYear() === year
      ).length,
    }));

    setProjectCompletion(completionData);

    setCompletionLoading(false);
  };

  return (
    <div className="w-full min-h-screen grid grid-rows-3 grid-cols-8 gap-4 grid-auto-rows-[minmax(0, 1fr)]">
      {/* project overview */}
      <div className="col-span-5 row-span-1 bg-white rounded-xl p-4 shadow-md">
        <div className="mb-8">
          <h2 className="font-bold">Projects Overview</h2>
          <p className="text-sm">Projects Summary</p>
        </div>
        <div className="flex gap-4 justify-center">
          <div className="h-40 w-40 bg-green-100 rounded-xl relative">
            <p className="absolute font-bold text-5xl top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2">
              {`${overviewLoading ? "0" : projectStates.active}`}
            </p>
            <p className="w-full text-center absolute bottom-4 ">
              Active Projects
            </p>
          </div>
          <div className="h-40 w-40 bg-amber-100 rounded-xl relative">
            <p className="absolute font-bold text-5xl top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2">
              {`${overviewLoading ? "0" : projectStates.completed}`}
            </p>
            <p className="w-full text-center absolute bottom-4 ">
              Completed Projects
            </p>
          </div>
          <div className="h-40 w-40 bg-red-100 rounded-xl relative">
            <p className="absolute font-bold text-5xl top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2">
              {`${overviewLoading ? "0" : projectStates.delayed}`}
            </p>
            <p className="w-full text-center absolute bottom-4 ">Delayed</p>
          </div>
          <div className="h-40 w-40 bg-purple-100 rounded-xl relative">
            <p className="absolute font-bold text-5xl top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2">
              {`${overviewLoading ? "0" : projectStates.cancelled}`}
            </p>
            <p className="w-full text-center absolute bottom-4 ">Cancelled</p>
          </div>
        </div>
      </div>
      {/* customer satisfaction */}
      <div className="col-span-3 bg-white rounded-xl p-4 shadow-md">
        <h2 className="font-bold mb-4">Customer Satisfaction</h2>
        <div className="h-52 w-full">
          <CustomerSatisfactionChart />
        </div>
      </div>
      {/* project completion */}
      <div className="col-span-4 bg-white rounded-xl p-8 shadow-md">
        <h2 className="font-bold mb-4">Project Completion</h2>
        <div className="h-52 w-full">
          {completionLoading ? (
            <ProjectCompletionChart />
          ) : (
            <ProjectCompletionChart data={projectCompletion} />
          )}
        </div>
      </div>
      {/* project top materials */}
      <div className="col-span-4 bg-white rounded-xl p-4 shadow-md">
        <h2 className="font-bold mb-4">Top Materials</h2>
        <div className="flex gap-4">
          <table className="min-w-full text-sm table-fixed">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left font-semibold w-[10%]">#</th>
                <th className="px-4 py-2 text-left font-semibold w-[20%]">
                  Name
                </th>
                <th className="px-4 py-2 text-left font-semibold w-[55%]">
                  Popularity
                </th>
                <th className="px-4 py-2 text-left font-semibold w-[15%]">
                  Sales
                </th>
              </tr>
            </thead>
            <tbody className="overflow-y-auto">
              {topMaterials.map((item, idx) => (
                <tr key={item.name} className="border-b border-gray-200 h-12">
                  <td className="px-4 py-2 w-[10%]">{idx + 1}</td>
                  <td className="px-4 py-2 w-[20%]">{item.name}</td>
                  <td className="px-4 py-2 w-[55%] pr-12">
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`bg-purple-400 h-2 rounded-full`}
                          style={{ width: `${item.popularity}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-semibold">
                        {item.popularity}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2 w-[15%] ">
                    <div
                      className={`text-xs font-semibold bg-purple-400/20 bg-opacity-30 border-2 border-purple-400 leading-8 text-center rounded-md w-16`}
                    >
                      {item.sales}%
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* projects */}
      <div className="col-span-8 bg-white rounded-xl p-4 shadow-md"></div>
    </div>
  );
};

export default HomePage;
