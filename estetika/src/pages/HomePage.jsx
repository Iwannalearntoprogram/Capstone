import { useState, useEffect } from "react";
import CustomerSatisfactionChart from "../components/dashboard/CustomerSatisfactionChart";
import ProjectStatesPieChart from "../components/dashboard/ProjectStatesPieChart";
import Cookies from "js-cookie";
import axios from "axios";
import jsPDF from "jspdf";
import { FaCheckCircle, FaPhone, FaBriefcase } from "react-icons/fa";
import defaultProfile from "../assets/images/user.png";
import html2canvas from "html2canvas";

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
  const [materialsLoading, setMaterialsLoading] = useState(true);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [generatingMaterialsPDF, setGeneratingMaterialsPDF] = useState(false);
  const [designersLoading, setDesignersLoading] = useState(true);

  const [projectsData, setProjectsData] = useState([]);
  const [projectStates, setProjectStates] = useState({});
  const [materials, setMaterials] = useState([]);
  const [topMaterialCategories, setTopMaterialCategories] = useState([]);
  const [designers, setDesigners] = useState([]);
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
        console.log(res.data);
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

  const generateProjectPDF = async () => {
    setGeneratingPDF(true);
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;

      pdf.setFillColor(59, 130, 246);
      pdf.rect(0, 0, pageWidth, 50, "F");

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont(undefined, "bold");
      pdf.text("Project Overview Report", pageWidth / 2, 30, {
        align: "center",
      });

      pdf.setTextColor(240, 249, 255);
      pdf.setFontSize(12);
      pdf.setFont(undefined, "normal");
      const currentDate = new Date().toLocaleDateString();
      pdf.text(`Generated on: ${currentDate}`, pageWidth / 2, 42, {
        align: "center",
      });

      pdf.setTextColor(0, 0, 0);
      let yPosition = 70;
      pdf.setFillColor(248, 250, 252);
      pdf.setDrawColor(226, 232, 240);
      pdf.rect(margin, yPosition, pageWidth - 2 * margin, 80, "FD");

      yPosition += 15;
      pdf.setFontSize(18);
      pdf.setFont(undefined, "bold");
      pdf.text("Project Statistics Summary", margin + 10, yPosition);
      yPosition += 20;

      const totalProjects =
        (projectStates.active || 0) +
        (projectStates.completed || 0) +
        (projectStates.delayed || 0) +
        (projectStates.cancelled || 0);

      pdf.setFontSize(12);
      pdf.setFont(undefined, "normal");

      pdf.text(
        `Active Projects: ${projectStates.active || 0}`,
        margin + 15,
        yPosition
      );
      pdf.text(
        `Completed Projects: ${projectStates.completed || 0}`,
        margin + 15,
        yPosition + 15
      );

      pdf.text(
        `Delayed Projects: ${projectStates.delayed || 0}`,
        margin + 100,
        yPosition
      );
      pdf.text(
        `Cancelled Projects: ${projectStates.cancelled || 0}`,
        margin + 100,
        yPosition + 15
      );

      yPosition += 35;
      pdf.setFont(undefined, "bold");
      pdf.setFontSize(14);
      pdf.text(`Total Projects: ${totalProjects}`, margin + 15, yPosition);
      yPosition += 30;
      pdf.setFillColor(34, 197, 94);
      pdf.rect(margin, yPosition, pageWidth - 2 * margin, 25, "F");

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(16);
      pdf.setFont(undefined, "bold");
      pdf.text("Project States Distribution", margin + 10, yPosition + 17);

      pdf.setTextColor(0, 0, 0);
      yPosition += 35;
      const boxWidth = 35;
      const boxHeight = 45;
      const boxSpacing = 10;
      const totalBoxesWidth = boxWidth * 4 + boxSpacing * 3;
      const startX = (pageWidth - totalBoxesWidth) / 2;

      const states = [
        {
          name: "Active Projects",
          value: projectStates.active || 0,
          bgColor: [220, 252, 231],
          textColor: [22, 163, 74],
        },
        {
          name: "Completed Projects",
          value: projectStates.completed || 0,
          bgColor: [254, 243, 199],
          textColor: [180, 83, 9],
        },
        {
          name: "Delayed",
          value: projectStates.delayed || 0,
          bgColor: [254, 226, 226],
          textColor: [220, 38, 38],
        },
        {
          name: "Cancelled",
          value: projectStates.cancelled || 0,
          bgColor: [243, 232, 255],
          textColor: [147, 51, 234],
        },
      ];
      states.forEach((state, index) => {
        const xPos = startX + index * (boxWidth + boxSpacing);

        pdf.setFillColor(...state.bgColor);
        pdf.setDrawColor(229, 231, 235);
        pdf.roundedRect(xPos, yPosition, boxWidth, boxHeight, 3, 3, "FD");

        pdf.setTextColor(...state.textColor);
        pdf.setFontSize(24);
        pdf.setFont(undefined, "bold");
        pdf.text(
          state.value.toString(),
          xPos + boxWidth / 2,
          yPosition + boxHeight / 2 + 2,
          { align: "center" }
        );

        pdf.setTextColor(75, 85, 99);
        pdf.setFontSize(8);
        pdf.setFont(undefined, "normal");
        const labelLines = pdf.splitTextToSize(state.name, boxWidth + 5);
        pdf.text(labelLines, xPos + boxWidth / 2, yPosition + boxHeight + 8, {
          align: "center",
        });
      });
      yPosition += boxHeight + 25;

      if (projectsData && projectsData.length > 0) {
        if (yPosition > pageHeight - 100) {
          pdf.addPage();
          yPosition = 30;
        }

        pdf.setFillColor(147, 51, 234);
        pdf.rect(margin, yPosition, pageWidth - 2 * margin, 25, "F");

        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(16);
        pdf.setFont(undefined, "bold");
        pdf.text("Detailed Project Information", margin + 10, yPosition + 17);

        pdf.setTextColor(0, 0, 0);
        yPosition += 35;
        projectsData.forEach((project, index) => {
          if (yPosition > pageHeight - 80) {
            pdf.addPage();
            yPosition = 30;
          }

          pdf.setFillColor(249, 250, 251);
          pdf.setDrawColor(209, 213, 219);
          pdf.rect(margin, yPosition, pageWidth - 2 * margin, 70, "FD");

          yPosition += 15;
          pdf.setFontSize(14);
          pdf.setFont(undefined, "bold");
          pdf.setTextColor(31, 41, 55);
          pdf.text(
            `${index + 1}. ${project.title || "Untitled Project"}`,
            margin + 10,
            yPosition
          );
          yPosition += 18;

          pdf.setFontSize(10);
          pdf.setFont(undefined, "normal");
          pdf.setTextColor(75, 85, 99);

          if (project.description) {
            const descriptionLines = pdf.splitTextToSize(
              `${project.description}`,
              pageWidth - 2 * margin - 20
            );
            pdf.text(descriptionLines, margin + 10, yPosition);
            yPosition += Math.min(descriptionLines.length * 4, 12) + 5;
          }

          pdf.setFont(undefined, "bold");
          const status = project.status || "Unknown";
          let statusColor = [75, 85, 99];

          if (status === "completed") statusColor = [34, 197, 94];
          else if (status === "ongoing") statusColor = [59, 130, 246];
          else if (status === "delayed") statusColor = [239, 68, 68];
          else if (status === "cancelled") statusColor = [156, 163, 175];

          pdf.setTextColor(...statusColor);
          pdf.text(`Status: ${status.toUpperCase()}`, margin + 10, yPosition);
          pdf.setTextColor(75, 85, 99);
          pdf.setFont(undefined, "normal");

          let leftColumn = margin + 10;
          let rightColumn = margin + (pageWidth - 2 * margin) / 2;
          let detailY = yPosition + 12;

          if (project.budget) {
            pdf.text(
              `Budget: ₱${project.budget.toLocaleString()}`,
              leftColumn,
              detailY
            );
          }

          if (project.roomType) {
            pdf.text(`Room Type: ${project.roomType}`, rightColumn, detailY);
          }

          if (project.startDate || project.endDate) {
            detailY += 10;
            if (project.startDate) {
              pdf.text(
                `Start: ${new Date(project.startDate).toLocaleDateString()}`,
                leftColumn,
                detailY
              );
            }
            if (project.endDate) {
              pdf.text(
                `End: ${new Date(project.endDate).toLocaleDateString()}`,
                rightColumn,
                detailY
              );
            }
          }

          yPosition += 80;
        });
      }

      const footerY = pageHeight - 15;
      pdf.setFontSize(8);
      pdf.setTextColor(156, 163, 175);
      pdf.text(
        `Generated by Estetika Project Management System - ${new Date().toLocaleString()}`,
        pageWidth / 2,
        footerY,
        { align: "center" }
      );

      pdf.save(
        `Project_Overview_Report_${currentDate.replace(/\//g, "-")}.pdf`
      );
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF. Please try again.");
    } finally {
      setGeneratingPDF(false);
    }
  };

  const generateMaterialsPDF = async () => {
    setGeneratingMaterialsPDF(true);
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;

      pdf.setFillColor(34, 197, 94);
      pdf.rect(0, 0, pageWidth, 50, "F");

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont(undefined, "bold");
      pdf.text("Materials Inventory Report", pageWidth / 2, 30, {
        align: "center",
      });

      pdf.setTextColor(240, 255, 240);
      pdf.setFontSize(12);
      pdf.setFont(undefined, "normal");
      const currentDate = new Date().toLocaleDateString();
      pdf.text(`Generated on: ${currentDate}`, pageWidth / 2, 42, {
        align: "center",
      });

      pdf.setTextColor(0, 0, 0);
      let yPosition = 70;

      pdf.setFillColor(248, 250, 252);
      pdf.setDrawColor(226, 232, 240);
      pdf.rect(margin, yPosition, pageWidth - 2 * margin, 80, "FD");

      yPosition += 15;
      pdf.setFontSize(18);
      pdf.setFont(undefined, "bold");
      pdf.text("Materials Statistics Summary", margin + 10, yPosition);
      yPosition += 20;
      pdf.setFontSize(12);
      pdf.setFont(undefined, "normal");
      const totalSales = topMaterialCategories.reduce(
        (sum, item) => sum + item.sales,
        0
      );
      const totalValue = materials.reduce(
        (sum, material) => sum + (material.price || 0),
        0
      );

      pdf.text(`Total Materials: ${materials.length}`, margin + 15, yPosition);
      pdf.text(
        `Total Categories: ${topMaterialCategories.length}`,
        margin + 15,
        yPosition + 15
      );

      const rightColumnX = margin + (pageWidth - 2 * margin) * 0.5;
      pdf.text(`Total Sales: ${totalSales}`, rightColumnX, yPosition);

      yPosition += 30;

      const inventoryValue = `₱${totalValue.toLocaleString()}`;
      const labelText = "Total Inventory Value:";

      const availableWidth = pageWidth - 2 * margin - 10;

      pdf.setFontSize(12);
      pdf.setFont(undefined, "normal");

      const fullText = `${labelText} ${inventoryValue}`;
      const fullTextWidth = pdf.getTextWidth(fullText);

      if (fullTextWidth <= availableWidth) {
        pdf.text(fullText, margin + 15, yPosition);
      } else {
        pdf.text(labelText, margin + 15, yPosition);
        pdf.text(inventoryValue, margin + 15, yPosition + 12);
        yPosition += 12;
      }
      yPosition += 45;

      if (topMaterialCategories.length > 0) {
        pdf.setFillColor(59, 130, 246);
        pdf.rect(margin, yPosition, pageWidth - 2 * margin, 25, "F");

        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(16);
        pdf.setFont(undefined, "bold");
        pdf.text(
          "Top Material Categories Distribution",
          margin + 10,
          yPosition + 17
        );

        pdf.setTextColor(0, 0, 0);
        yPosition += 35;

        const topCategories = topMaterialCategories;
        topCategories.forEach((category, index) => {
          if (yPosition > pageHeight - 40) {
            pdf.addPage();
            yPosition = 30;
          }

          pdf.setFontSize(11);
          pdf.setFont(undefined, "bold");
          pdf.text(
            `${index + 1}. ${category.category}`,
            margin + 10,
            yPosition
          );

          pdf.setFillColor(229, 231, 235);
          pdf.rect(
            margin + 10,
            yPosition + 5,
            pageWidth - 2 * margin - 80,
            8,
            "F"
          );

          const barWidth =
            ((pageWidth - 2 * margin - 80) * category.popularity) / 100;
          const colors = [
            [34, 197, 94],
            [59, 130, 246],
            [251, 191, 36],
            [239, 68, 68],
            [147, 51, 234],
          ];
          pdf.setFillColor(...colors[index % colors.length]);
          pdf.rect(margin + 10, yPosition + 5, barWidth, 8, "F");

          pdf.setFontSize(10);
          pdf.setFont(undefined, "normal");
          pdf.text(
            `${category.popularity}% (${category.sales} sales)`,
            pageWidth - margin - 70,
            yPosition + 11
          );

          yPosition += 25;
        });

        yPosition += 15;
      }

      if (materials && materials.length > 0) {
        if (yPosition > pageHeight - 100) {
          pdf.addPage();
          yPosition = 30;
        }

        pdf.setFillColor(147, 51, 234);
        pdf.rect(margin, yPosition, pageWidth - 2 * margin, 25, "F");

        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(16);
        pdf.setFont(undefined, "bold");
        pdf.text("Complete Materials Inventory", margin + 10, yPosition + 17);

        pdf.setTextColor(0, 0, 0);
        yPosition += 35;

        const materialsByCategory = {};
        materials.forEach((material) => {
          const category = material.category || "Uncategorized";
          if (!materialsByCategory[category]) {
            materialsByCategory[category] = [];
          }
          materialsByCategory[category].push(material);
        });

        const sortedCategories = Object.entries(materialsByCategory).sort(
          ([, a], [, b]) => b.length - a.length
        );
        sortedCategories.forEach(([category, categoryMaterials]) => {
          if (yPosition > pageHeight - 60) {
            pdf.addPage();
            yPosition = 30;
          }

          pdf.setFillColor(249, 250, 251);
          pdf.setDrawColor(209, 213, 219);
          pdf.rect(margin, yPosition, pageWidth - 2 * margin, 30, "FD");

          yPosition += 20;
          pdf.setFontSize(14);
          pdf.setFont(undefined, "bold");
          pdf.setTextColor(31, 41, 55);
          pdf.text(
            `${category} (${categoryMaterials.length} items)`,
            margin + 10,
            yPosition
          );
          yPosition += 20;

          const sortedMaterials = categoryMaterials.sort(
            (a, b) => (b.price || 0) - (a.price || 0)
          );

          sortedMaterials.forEach((material, index) => {
            if (yPosition > pageHeight - 30) {
              pdf.addPage();
              yPosition = 30;
            }

            pdf.setFillColor(255, 255, 255);
            pdf.setDrawColor(229, 231, 235);
            pdf.rect(
              margin + 10,
              yPosition,
              pageWidth - 2 * margin - 20,
              20,
              "FD"
            );

            yPosition += 15;

            pdf.setFontSize(11);
            pdf.setFont(undefined, "normal");
            pdf.setTextColor(75, 85, 99);

            const materialName = material.name || "Unnamed Material";
            const maxNameLength = 35;
            const displayName =
              materialName.length > maxNameLength
                ? materialName.substring(0, maxNameLength) + "..."
                : materialName;

            pdf.setFont(undefined, "bold");
            pdf.text(`${index + 1}. ${displayName}`, margin + 15, yPosition);

            pdf.setFont(undefined, "normal");
            const price = material.price
              ? `₱${material.price.toLocaleString()}`
              : "Price not set";
            pdf.text(price, pageWidth - margin - 70, yPosition);

            if (material.description) {
              yPosition += 8;
              pdf.setFontSize(9);
              pdf.setTextColor(107, 114, 128);
              const description =
                material.description.length > 60
                  ? material.description.substring(0, 60) + "..."
                  : material.description;
              pdf.text(description, margin + 20, yPosition);
              yPosition += 5;
            } else {
              yPosition += 8;
            }
          });

          yPosition += 10;
        });
      }

      const footerY = pageHeight - 15;
      pdf.setFontSize(8);
      pdf.setTextColor(156, 163, 175);
      pdf.text(
        `Generated by Estetika Project Management System - ${new Date().toLocaleString()}`,
        pageWidth / 2,
        footerY,
        { align: "center" }
      );
      pdf.save(
        `Materials_Inventory_Report_${currentDate.replace(/\//g, "-")}.pdf`
      );
    } catch (error) {
      console.error("Error generating materials PDF:", error);
      alert("Error generating materials PDF. Please try again.");
    } finally {
      setGeneratingMaterialsPDF(false);
    }
  };

  useEffect(() => {
    const fetchDesigners = async () => {
      setDesignersLoading(true);
      try {
        const token = Cookies.get("token");
        const response = await axios.get(`${serverUrl}/api/user`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        // Filter users with designer role
        const designerUsers = response.data.filter(
          (user) => user.role === "designer"
        );
        setDesigners(designerUsers);
        console.log("Designers:", designerUsers);
      } catch (err) {
        console.error("Error fetching designers:", err);
        setDesigners([]);
      } finally {
        setDesignersLoading(false);
      }
    };
    fetchDesigners();
  }, [serverUrl]);

  return (
    <div className="w-full min-h-screen grid grid-rows-3 grid-cols-8 gap-4 grid-auto-rows-[minmax(0, 1fr)]">
      {" "}
      {/* project overview */}
      <div className="col-span-5 row-span-1 bg-white rounded-xl p-4 shadow-md">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h2 className="font-bold">Projects Overview</h2>
            <p className="text-sm">Projects Summary</p>
          </div>
          <button
            onClick={generateProjectPDF}
            disabled={generatingPDF}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
          >
            {generatingPDF ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Generating...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Export PDF
              </>
            )}
          </button>
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
      </div>{" "}
      {/* project states distribution */}
      <div
        id="project-completion-chart"
        className="col-span-4 bg-white rounded-xl p-8 shadow-md"
      >
        <h2 className="font-bold mb-4">Project Completion</h2>
        <div className="h-52 w-full">
          <ProjectStatesPieChart data={projectStates} />
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
        {role === "admin" && (
          <div className="mt-4">
            <button
              onClick={generateMaterialsPDF}
              disabled={generatingMaterialsPDF}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
            >
              {generatingMaterialsPDF ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Generating...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Export Materials Report
                </>
              )}
            </button>
          </div>
        )}
      </div>
      {/* Designers Section */}
      <div className="col-span-8 bg-white rounded-xl p-4 shadow-md">
        <div className="mb-4 flex justify-between items-center">
          <div>
            <h2 className="font-bold text-lg">Team Designers</h2>
            <p className="text-sm text-gray-600">
              Active designers in the system
            </p>
          </div>
          <div className="text-sm text-gray-500">
            Total: {designers.length} designers
          </div>
        </div>

        {designersLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
            <span className="ml-2 text-gray-600">Loading designers...</span>
          </div>
        ) : designers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg
              className="w-12 h-12 mx-auto mb-3 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
              />
            </svg>
            <p>No designers found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {designers.map((designer) => {
              // Find projects for this designer
              const designerProjects = projectsData.filter(
                (project) =>
                  project.members && project.members.includes(designer._id)
              );

              // Helper function for status colors
              const getStatusColor = (status) => {
                switch (status) {
                  case "ongoing":
                    return "bg-blue-100 text-blue-800";
                  case "completed":
                    return "bg-green-100 text-green-800";
                  case "delayed":
                    return "bg-red-100 text-red-800";
                  case "pending":
                    return "bg-yellow-100 text-yellow-800";
                  default:
                    return "bg-gray-100 text-gray-800";
                }
              };

              return (
                <div
                  key={designer._id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all duration-300 group"
                >
                  {/* Header with Avatar and Basic Info */}
                  <div className="flex items-center space-x-4 mb-4">
                    {/* Avatar */}
                    <img
                      src={designer.profileImage || defaultProfile}
                      alt="Profile"
                      className="w-12 h-12 rounded-lg object-cover"
                    />

                    {/* Name and Email */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                        {designer?.fullName ||
                          `${designer?.firstName || ""} ${
                            designer?.lastName || ""
                          }`.trim() ||
                          designer?.username ||
                          "Unnamed Designer"}
                      </h3>
                      <p className="text-sm text-gray-600 truncate">
                        {designer?.email}
                      </p>
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                      Designer
                    </span>
                    {designer?.emailVerified && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                        <FaCheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </span>
                    )}
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2 mb-4 text-sm text-gray-600">
                    <div className="flex items-center justify-between">
                      <span>Joined:</span>
                      <span className="font-medium">
                        {designer?.createdAt
                          ? new Date(designer.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                year: "numeric",
                              }
                            )
                          : "N/A"}
                      </span>
                    </div>
                    {designer?.phoneNumber && (
                      <div className="flex items-center">
                        <FaPhone className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="text-xs">{designer.phoneNumber}</span>
                      </div>
                    )}
                  </div>

                  {/* Projects Section */}
                  <div className="border-t border-gray-100 pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <FaBriefcase className="w-4 h-4 mr-2 text-gray-500" />
                        <span className="text-sm font-semibold text-gray-700">
                          Projects ({designerProjects.length})
                        </span>
                      </div>
                    </div>

                    {designerProjects.length > 0 ? (
                      <div className="space-y-2">
                        {designerProjects.slice(0, 2).map((project) => (
                          <div
                            key={project._id}
                            className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100 hover:bg-blue-50 hover:border-blue-200 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-sm text-gray-800 truncate pr-2">
                                {project.title}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                  project.status
                                )}`}
                              >
                                {project.status}
                              </span>
                              {project.budget && (
                                <span className="text-xs text-gray-600 font-semibold">
                                  ₱{project.budget.toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}

                        {designerProjects.length > 2 && (
                          <div className="text-center pt-2">
                            <span className="text-xs text-blue-600 font-medium">
                              +{designerProjects.length - 2} more projects
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-lg px-3 py-4 text-center border-2 border-dashed border-gray-200">
                        <p className="text-xs text-gray-500">No projects yet</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
