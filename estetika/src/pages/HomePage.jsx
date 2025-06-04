import { useState, useEffect } from "react";
import CustomerSatisfactionChart from "../components/dashboard/CustomerSatisfactionChart";
import ProjectCompletionChart from "../components/dashboard/ProjectCompletionChart";
import Cookies from "js-cookie";
import axios from "axios";

const calculateCategorySales = (materials = []) => {
  const categorySales = {};

  materials.forEach((material) => {
    const { category, sales = 0 } = material;
    if (!categorySales[category]) {
      categorySales[category] = 0;
    }
    categorySales[category] += sales;
  });

  const totalSales = Object.values(categorySales).reduce(
    (sum, val) => sum + val,
    0
  );

  let result;
  if (totalSales === 0) {
    const categoryCounts = {};
    materials.forEach((material) => {
      const { category } = material;
      if (!categoryCounts[category]) {
        categoryCounts[category] = 0;
      }
      categoryCounts[category] += 1;
    });
    const totalCount = Object.values(categoryCounts).reduce(
      (sum, val) => sum + val,
      0
    );
    result = Object.entries(categoryCounts).map(([category, count]) => ({
      category,
      sales: count,
      popularity: totalCount ? Math.round((count / totalCount) * 100) : 0,
    }));
  } else {
    result = Object.entries(categorySales).map(([category, sales]) => ({
      category,
      sales,
      popularity: totalSales ? Math.round((sales / totalSales) * 100) : 0,
    }));
  }

  result.sort((a, b) => b.sales - a.sales);

  const popularitySum = result.reduce((sum, item) => sum + item.popularity, 0);
  if (popularitySum !== 100 && result.length > 0) {
    const diff = 100 - popularitySum;
    result[0].popularity += diff;
  }

  return result;
};

const HomePage = () => {
  const id = localStorage.getItem("id");
  const role = localStorage.getItem("role");
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [completionLoading, setCompletionLoading] = useState(true);
  const [materialsLoading, setMaterialsLoading] = useState(true);

  const [projectsData, setProjectsData] = useState([]);
  const [projectStates, setProjectStates] = useState({});
  const [projectCompletion, setProjectCompletion] = useState({});
  const [materials, setMaterials] = useState([]);
  const [topMaterialCategories, setTopMaterialCategories] = useState([]);

  const serverUrl = import.meta.env.VITE_SERVER_URL;

  useEffect(() => {
    const fetchProjects = async () => {
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
    fetchProjects();
  }, []);

  useEffect(() => {
    const fetchMaterials = async () => {
      setMaterialsLoading(true);
      try {
        const token = Cookies.get("token");
        const res = await axios.get(`${serverUrl}/api/material`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setMaterials(res.data.material || []);
        setTopMaterialCategories(calculateCategorySales(res.data.material));
        console.log(res.data.material);
      } catch (err) {
        setMaterials([]);
      } finally {
        setMaterialsLoading(false);
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
        {materialsLoading ? (
          <p>Loading materials...</p>
        ) : (
          <div className="flex gap-4">
            <table className="min-w-full text-sm table-fixed">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left font-semibold w-[10%]">
                    #
                  </th>
                  <th className="px-4 py-2 text-left font-semibold w-[40%]">
                    Category
                  </th>
                  <th className="px-4 py-2 text-left font-semibold w-[50%]">
                    Sales
                  </th>
                </tr>
              </thead>
              <tbody className="overflow-y-auto">
                {topMaterialCategories.slice(0, 5).map((item, idx) => (
                  <tr
                    key={item.category}
                    className="border-b border-gray-200 h-12"
                  >
                    <td className="px-4 py-2 w-[10%]">{idx + 1}</td>
                    <td className="px-4 py-2 w-[40%]">{item.category}</td>
                    <td className="px-4 py-2 w-[50%]">
                      <div className="flex qitems-center gap-2">
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="col-span-8 bg-white rounded-xl p-4 shadow-md"></div>
    </div>
  );
};

export default HomePage;
