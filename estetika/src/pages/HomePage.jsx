import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  const [generatingDesignersPDF, setGeneratingDesignersPDF] = useState(false);
  const [designersLoading, setDesignersLoading] = useState(true);
  const [expandedDesigners, setExpandedDesigners] = useState({});

  // Mobile Home Content states
  const [mobileContent, setMobileContent] = useState(null);
  const [mobileContentLoading, setMobileContentLoading] = useState(true);
  const [editingAboutText, setEditingAboutText] = useState(false);
  const [aboutTextValue, setAboutTextValue] = useState("");
  const [uploadingCarouselImage, setUploadingCarouselImage] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const [projectsData, setProjectsData] = useState([]);
  const [projectStates, setProjectStates] = useState({});
  const [materials, setMaterials] = useState([]);
  const [topMaterialCategories, setTopMaterialCategories] = useState([]);
  const [designers, setDesigners] = useState([]);
  const navigate = useNavigate();
  const serverUrl = import.meta.env.VITE_SERVER_URL;

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = Cookies.get("token");
        const res = await axios.get(
          `${serverUrl}/api/project?${
            role === "admin" || role === "storage_admin"
              ? "index=true"
              : `member=${id}`
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

  // Toggle expansion of designer projects
  const toggleDesignerProjects = (designerId) => {
    setExpandedDesigners((prev) => ({
      ...prev,
      [designerId]: !prev[designerId],
    }));
  };

  // Handle project click navigation
  const handleProjectClick = (projectId) => {
    const project = projectsData.find((p) => p._id === projectId);
    if (project) {
      navigate(`/dashboard/projects/${projectId}/overview`, {
        state: { project },
      });
    }
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

  const generateDesignersPDF = async () => {
    setGeneratingDesignersPDF(true);
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;

      pdf.setFillColor(99, 102, 241);
      pdf.rect(0, 0, pageWidth, 50, "F");

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont(undefined, "bold");
      pdf.text("Team Designers Report", pageWidth / 2, 30, {
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
      pdf.text("Designers Summary", margin + 10, yPosition);

      yPosition += 20;
      pdf.setFontSize(12);
      pdf.setFont(undefined, "normal");

      const totalDesigners = designers.length;
      const verifiedDesigners = designers.filter((d) => d.emailVerified).length;
      const totalProjects = projectsData.length;
      const designersWithProjects = designers.filter((designer) =>
        projectsData.some(
          (project) =>
            project.members &&
            project.members.some((member) =>
              typeof member === "object"
                ? member._id === designer._id
                : member === designer._id
            )
        )
      ).length;

      pdf.text(`Total Designers: ${totalDesigners}`, margin + 15, yPosition);
      pdf.text(
        `Verified Designers: ${verifiedDesigners}`,
        margin + 15,
        yPosition + 15
      );

      const rightColumnX = margin + (pageWidth - 2 * margin) * 0.5;
      pdf.text(
        `Active Designers: ${designersWithProjects}`,
        rightColumnX,
        yPosition
      );
      pdf.text(
        `Total Projects: ${totalProjects}`,
        rightColumnX,
        yPosition + 15
      );

      yPosition += 60;

      if (designers.length > 0) {
        pdf.setFillColor(99, 102, 241);
        pdf.rect(margin, yPosition, pageWidth - 2 * margin, 25, "F");

        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(16);
        pdf.setFont(undefined, "bold");
        pdf.text("Designer Details", margin + 10, yPosition + 17);

        pdf.setTextColor(0, 0, 0);
        yPosition += 35;

        designers.forEach((designer, index) => {
          if (yPosition > pageHeight - 100) {
            pdf.addPage();
            yPosition = 30;
          }

          pdf.setFillColor(249, 250, 251);
          pdf.setDrawColor(209, 213, 219);
          pdf.rect(margin, yPosition, pageWidth - 2 * margin, 60, "FD");

          yPosition += 15;

          pdf.setFontSize(14);
          pdf.setFont(undefined, "bold");
          pdf.setTextColor(31, 41, 55);
          const designerName =
            designer?.fullName ||
            `${designer?.firstName || ""} ${designer?.lastName || ""}`.trim() ||
            designer?.username ||
            "Unnamed Designer";
          pdf.text(designerName, margin + 10, yPosition);

          yPosition += 12;
          pdf.setFontSize(10);
          pdf.setFont(undefined, "normal");
          pdf.setTextColor(107, 114, 128);
          pdf.text(
            `Email: ${designer?.email || "N/A"}`,
            margin + 10,
            yPosition
          );

          if (designer?.emailVerified) {
            pdf.setTextColor(34, 197, 94);
            pdf.text("✓ Verified", margin + 120, yPosition);
          }

          yPosition += 10;
          pdf.setTextColor(107, 114, 128);
          const joinDate = designer?.createdAt
            ? new Date(designer.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "N/A";
          pdf.text(`Joined: ${joinDate}`, margin + 10, yPosition);

          if (designer?.phoneNumber) {
            pdf.text(`Phone: ${designer.phoneNumber}`, margin + 80, yPosition);
          }

          const designerProjects = projectsData.filter(
            (project) =>
              project.members &&
              project.members.some((member) =>
                typeof member === "object"
                  ? member._id === designer._id
                  : member === designer._id
              )
          );
          yPosition += 10;
          pdf.setTextColor(75, 85, 99);
          pdf.text(
            `Projects: ${designerProjects.length}`,
            margin + 10,
            yPosition
          );

          if (designerProjects.length > 0) {
            const statuses = designerProjects.reduce((acc, project) => {
              acc[project.status] = (acc[project.status] || 0) + 1;
              return acc;
            }, {});

            let statusText = Object.entries(statuses)
              .map(([status, count]) => `${status}: ${count}`)
              .join(", ");

            if (statusText.length > 50) {
              statusText = statusText.substring(0, 47) + "...";
            }

            pdf.text(statusText, margin + 60, yPosition);
          }

          yPosition += 25;

          if (designerProjects.length > 0) {
            yPosition += 10;

            pdf.setFillColor(239, 246, 255);
            pdf.setDrawColor(191, 219, 254);
            pdf.rect(
              margin + 5,
              yPosition,
              pageWidth - 2 * margin - 10,
              20,
              "FD"
            );

            yPosition += 15;
            pdf.setFontSize(12);
            pdf.setFont(undefined, "bold");
            pdf.setTextColor(59, 130, 246);
            pdf.text(
              `Project Details (${designerProjects.length} projects)`,
              margin + 10,
              yPosition
            );

            yPosition += 15;

            designerProjects.forEach((project, projectIndex) => {
              if (yPosition > pageHeight - 80) {
                pdf.addPage();
                yPosition = 30;
              }

              pdf.setFillColor(255, 255, 255);
              pdf.setDrawColor(229, 231, 235);
              pdf.rect(
                margin + 10,
                yPosition,
                pageWidth - 2 * margin - 20,
                60,
                "FD"
              );

              yPosition += 15;

              pdf.setFontSize(11);
              pdf.setFont(undefined, "bold");
              pdf.setTextColor(31, 41, 55);
              const projectTitle = project.title || "Untitled Project";
              const maxTitleLength = 45;
              const displayTitle =
                projectTitle.length > maxTitleLength
                  ? projectTitle.substring(0, maxTitleLength) + "..."
                  : projectTitle;
              pdf.text(
                `${projectIndex + 1}. ${displayTitle}`,
                margin + 15,
                yPosition
              );

              const status = project.status || "Unknown";
              let statusColor = [75, 85, 99];

              if (status === "completed") statusColor = [34, 197, 94];
              else if (status === "ongoing") statusColor = [59, 130, 246];
              else if (status === "delayed") statusColor = [239, 68, 68];
              else if (status === "cancelled") statusColor = [156, 163, 175];
              else if (status === "pending") statusColor = [251, 191, 36];

              pdf.setTextColor(...statusColor);
              pdf.setFont(undefined, "normal");
              pdf.setFontSize(9);
              pdf.text(
                `[${status.toUpperCase()}]`,
                pageWidth - margin - 50,
                yPosition
              );

              yPosition += 12;

              pdf.setTextColor(75, 85, 99);
              pdf.setFontSize(9);
              pdf.setFont(undefined, "normal");

              const leftColumn = margin + 15;
              const rightColumn = margin + (pageWidth - 2 * margin) * 0.6;

              if (project.budget) {
                pdf.text(
                  `Budget: ₱${project.budget.toLocaleString()}`,
                  leftColumn,
                  yPosition
                );
              }
              if (project.roomType) {
                pdf.text(`Room: ${project.roomType}`, rightColumn, yPosition);
              }

              yPosition += 10;

              if (project.startDate) {
                const startDate = new Date(
                  project.startDate
                ).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });
                pdf.text(`Start: ${startDate}`, leftColumn, yPosition);
              }
              if (project.endDate) {
                const endDate = new Date(project.endDate).toLocaleDateString(
                  "en-US",
                  {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }
                );
                pdf.text(`End: ${endDate}`, rightColumn, yPosition);
              }

              yPosition += 10;

              if (project.description) {
                const maxDescLength = 80;
                const desc =
                  project.description.length > maxDescLength
                    ? project.description.substring(0, maxDescLength) + "..."
                    : project.description;
                pdf.setFontSize(8);
                pdf.setTextColor(107, 114, 128);
                pdf.text(`Description: ${desc}`, leftColumn, yPosition);
                yPosition += 8;
              }

              if (project.members && project.members.length > 1) {
                pdf.setFontSize(8);
                pdf.setTextColor(107, 114, 128);
                pdf.text(
                  `Team size: ${project.members.length} members`,
                  rightColumn,
                  yPosition - (project.description ? 8 : 0)
                );
              }

              yPosition += 15;
            });

            yPosition += 10;
          }
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

      pdf.save(`Designers_Report_${currentDate.replace(/\//g, "-")}.pdf`);
    } catch (error) {
      console.error("Error generating designers PDF:", error);
      alert("Error generating designers PDF. Please try again.");
    } finally {
      setGeneratingDesignersPDF(false);
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
      } catch (err) {
        console.error("Error fetching designers:", err);
        setDesigners([]);
      } finally {
        setDesignersLoading(false);
      }
    };
    fetchDesigners();
  }, [serverUrl]);

  // Fetch mobile home content for admin
  useEffect(() => {
    if (role === "admin" || role === "storage_admin") {
      const fetchMobileContent = async () => {
        try {
          const response = await axios.get(
            `${serverUrl}/api/mobile-home-content`
          );
          setMobileContent(response.data.data.content);
          setAboutTextValue(response.data.data.content.aboutText);
        } catch (err) {
          console.error("Error fetching mobile content:", err);
          // If no content exists, set default values
          setMobileContent({
            carouselImages: [],
            aboutText:
              "Lorem ipsum dolor sit amet, consectetur adipiscing elit...",
          });
          setAboutTextValue(
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit..."
          );
        } finally {
          setMobileContentLoading(false);
        }
      };
      fetchMobileContent();
    }
  }, [serverUrl, role]);

  // Mobile Content Handlers
  const handleCarouselImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    setUploadingCarouselImage(true);
    try {
      const token = Cookies.get("token");
      const formData = new FormData();
      formData.append("image", file);

      // Upload image to Firebase
      const uploadResponse = await axios.post(
        `${serverUrl}/api/upload/carousel`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Add image to carousel
      const addResponse = await axios.post(
        `${serverUrl}/api/mobile-home-content/carousel/add`,
        {
          imageUrl: uploadResponse.data.imageLink,
          alt: "Interior design image",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMobileContent(addResponse.data.data.content);
      alert("Image added successfully!");
    } catch (err) {
      console.error("Error uploading image:", err);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploadingCarouselImage(false);
      // Reset file input
      event.target.value = "";
    }
  };

  const handleRemoveCarouselImage = async (imageId) => {
    try {
      const token = Cookies.get("token");

      // Find the index of the image being deleted
      const currentImages = mobileContent?.carouselImages || [];
      const deletingIndex = currentImages.findIndex(
        (img) => img._id === imageId
      );

      const response = await axios.delete(
        `${serverUrl}/api/mobile-home-content/carousel/${imageId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMobileContent(response.data.data.content);

      // Adjust current image index if necessary
      const newImagesLength =
        response.data.data.content.carouselImages?.length || 0;
      if (newImagesLength === 0) {
        setCurrentImageIndex(0);
      } else if (deletingIndex <= currentImageIndex) {
        // If we deleted the current image or one before it, adjust the index
        const newIndex = Math.max(0, currentImageIndex - 1);
        setCurrentImageIndex(Math.min(newIndex, newImagesLength - 1));
      }

      alert("Image removed successfully!");
    } catch (err) {
      console.error("Error removing image:", err);
      alert("Failed to remove image. Please try again.");
    }
  };

  const handleSaveAboutText = async () => {
    try {
      const token = Cookies.get("token");
      const response = await axios.patch(
        `${serverUrl}/api/mobile-home-content/about`,
        {
          aboutText: aboutTextValue,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMobileContent(response.data.data.content);
      setEditingAboutText(false);
      alert("About text updated successfully!");
    } catch (err) {
      console.error("Error updating about text:", err);
      alert("Failed to update about text. Please try again.");
    }
  };

  const handleCancelEditAboutText = () => {
    setAboutTextValue(mobileContent?.aboutText || "");
    setEditingAboutText(false);
  };

  // Carousel navigation functions
  const nextImage = () => {
    if (mobileContent?.carouselImages?.length > 0) {
      setCurrentImageIndex((prev) =>
        prev === mobileContent.carouselImages.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (mobileContent?.carouselImages?.length > 0) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? mobileContent.carouselImages.length - 1 : prev - 1
      );
    }
  };

  const goToImage = (index) => {
    setCurrentImageIndex(index);
  };

  // Auto-advance carousel
  useEffect(() => {
    if (mobileContent?.carouselImages?.length > 1) {
      const interval = setInterval(nextImage, 5000); // Change image every 5 seconds
      return () => clearInterval(interval);
    }
  }, [mobileContent?.carouselImages?.length]);

  return (
    <div className="w-full min-h-screen grid grid-cols-8 gap-4 auto-rows-max">
      {" "}
      {/* project overview */}
      <div className="col-span-5 bg-white rounded-xl p-4 shadow-md min-h-[300px]">
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
      </div>{" "}
      {/* customer satisfaction */}
      <div className="col-span-3 bg-white rounded-xl p-4 shadow-md min-h-[300px]">
        <h2 className="font-bold mb-4">Customer Satisfaction</h2>
        <div className="h-52 w-full">
          <CustomerSatisfactionChart />
        </div>
      </div>{" "}
      {/* project states distribution */}
      <div
        id="project-completion-chart"
        className="col-span-4 bg-white rounded-xl p-8 shadow-md min-h-[300px]"
      >
        <h2 className="font-bold mb-4">Project Completion</h2>
        <div className="h-52 w-full">
          <ProjectStatesPieChart data={projectStates} />
        </div>
      </div>{" "}
      {/* project top materials */}
      <div className="col-span-4 bg-white rounded-xl p-4 shadow-md min-h-[300px]">
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
        {role === "admin" ||
          (role === "storage_admin" && (
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
          ))}
      </div>{" "}
      {/* Designers Section */}
      {role === "admin" ||
        (role === "storage_admin" && (
          <div className="col-span-8 bg-white rounded-xl p-4 shadow-md">
            {" "}
            <div className="mb-4 flex justify-between items-center">
              <div>
                <h2 className="font-bold text-lg">Team Designers</h2>
                <p className="text-sm text-gray-600">
                  Active designers in the system
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-500">
                  Total: {designers.length} designers
                </div>
                <button
                  onClick={generateDesignersPDF}
                  disabled={generatingDesignersPDF}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                >
                  {generatingDesignersPDF ? (
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
                      Export Designers Report
                    </>
                  )}
                </button>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 auto-rows-max">
                {" "}
                {designers.map((designer) => {
                  // Find projects for this designer
                  const designerProjects = projectsData.filter(
                    (project) =>
                      project.members &&
                      project.members.some((member) =>
                        typeof member === "object"
                          ? member._id === designer._id
                          : member === designer._id
                      )
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
                      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all duration-300 group flex flex-col h-fit"
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
                            <span className="text-xs">
                              {designer.phoneNumber}
                            </span>
                          </div>
                        )}
                      </div>{" "}
                      {/* Projects Section */}
                      <div className="border-t border-gray-100 pt-4 flex-1">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <FaBriefcase className="w-4 h-4 mr-2 text-gray-500" />
                            <span className="text-sm font-semibold text-gray-700">
                              Projects ({designerProjects.length})
                            </span>
                          </div>
                        </div>{" "}
                        {designerProjects.length > 0 ? (
                          <div className="space-y-2">
                            {(expandedDesigners[designer._id]
                              ? designerProjects
                              : designerProjects.slice(0, 2)
                            ).map((project) => (
                              <div
                                key={project._id}
                                className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100 hover:bg-blue-50 hover:border-blue-200 transition-colors cursor-pointer"
                                onClick={() => handleProjectClick(project._id)}
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
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleDesignerProjects(designer._id);
                                  }}
                                  className="text-xs text-blue-600 font-medium hover:text-blue-800 transition-colors cursor-pointer"
                                >
                                  {expandedDesigners[designer._id]
                                    ? "Show less"
                                    : `+${
                                        designerProjects.length - 2
                                      } more projects`}
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="bg-gray-50 rounded-lg px-3 py-4 text-center border-2 border-dashed border-gray-200">
                            <p className="text-xs text-gray-500">
                              No projects yet
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      {/* Mobile App Home Content Management Section */}
      {role === "admin" ||
        (role === "storage_admin" && (
          <div className="col-span-8 bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-8 shadow-lg border border-slate-200">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h2 className="font-bold text-2xl text-slate-800">
                  Mobile App Content Manager
                </h2>
              </div>
              <p className="text-slate-600 text-lg">
                Real-time preview and management of your mobile application's
                home screen content
              </p>
            </div>

            {mobileContentLoading ? (
              <div className="flex justify-center items-center h-64 bg-white rounded-xl shadow-sm">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
                  <span className="text-slate-600 text-lg">
                    Loading mobile content...
                  </span>
                </div>
              </div>
            ) : (
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Control Panel */}
                <div className="space-y-6">
                  {/* Carousel Management */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h3 className="font-bold text-xl text-slate-800 mb-2">
                          Carousel Images
                        </h3>
                        <p className="text-slate-600">
                          Manage the main showcase images for your mobile app
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCarouselImageUpload}
                          className="hidden"
                          id="carousel-upload"
                          disabled={uploadingCarouselImage}
                        />
                        <label
                          htmlFor="carousel-upload"
                          className={`${
                            uploadingCarouselImage
                              ? "bg-slate-400 cursor-not-allowed"
                              : "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 cursor-pointer shadow-lg hover:shadow-xl"
                          } text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 transform hover:scale-105`}
                        >
                          {uploadingCarouselImage ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                              Uploading...
                            </>
                          ) : (
                            <>
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 4v16m8-8H4"
                                />
                              </svg>
                              Add New Image
                            </>
                          )}
                        </label>
                      </div>
                    </div>

                    {/* Image Count and Stats */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg mb-4">
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-5 h-5 text-slate-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span className="font-semibold text-slate-700">
                          {mobileContent?.carouselImages?.length || 0} Images
                        </span>
                      </div>
                      <span className="text-sm text-slate-500">
                        {mobileContent?.carouselImages?.length > 0
                          ? `Current: ${currentImageIndex + 1} of ${
                              mobileContent.carouselImages.length
                            }`
                          : "No images uploaded"}
                      </span>
                    </div>

                    {/* Image Management Grid */}
                    {mobileContent?.carouselImages?.length > 0 && (
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {mobileContent.carouselImages.map((image, index) => (
                          <div
                            key={image._id || index}
                            className={`flex items-center gap-4 p-3 rounded-lg border-2 transition-all duration-300 ${
                              index === currentImageIndex
                                ? "border-blue-500 bg-blue-50"
                                : "border-slate-200 bg-white hover:border-slate-300"
                            }`}
                          >
                            <div className="flex-shrink-0">
                              <img
                                src={image.url}
                                alt={image.alt || `Image ${index + 1}`}
                                className="w-16 h-16 object-cover rounded-lg border border-slate-200"
                                onError={(e) => {
                                  e.target.style.backgroundColor = "#f3f4f6";
                                  e.target.style.display = "flex";
                                  e.target.style.alignItems = "center";
                                  e.target.style.justifyContent = "center";
                                  e.target.innerHTML =
                                    '<span style="color: #6b7280; font-size: 10px;">Error</span>';
                                }}
                              />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-slate-700">
                                  Image {index + 1}
                                </span>
                                {index === currentImageIndex && (
                                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                                    Current
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-slate-500 truncate">
                                {image.alt || "No description"}
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => goToImage(index)}
                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                title="Preview this image"
                              >
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
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                  />
                                </svg>
                              </button>
                              <button
                                onClick={() => {
                                  const confirmed = window.confirm(
                                    `Are you sure you want to delete Image ${
                                      index + 1
                                    }? This action cannot be undone.`
                                  );
                                  if (confirmed) {
                                    handleRemoveCarouselImage(image._id);
                                  }
                                }}
                                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors group"
                                title="Delete this image"
                              >
                                <svg
                                  className="w-4 h-4 group-hover:scale-110 transition-transform"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* About Text Management */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h3 className="font-bold text-xl text-slate-800 mb-2">
                          About Us Content
                        </h3>
                        <p className="text-slate-600">
                          Edit the introductory text for your mobile app
                        </p>
                      </div>
                      {!editingAboutText && (
                        <button
                          onClick={() => {
                            setEditingAboutText(true);
                            setAboutTextValue(mobileContent?.aboutText || "");
                          }}
                          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                          Edit Content
                        </button>
                      )}
                    </div>

                    {editingAboutText ? (
                      <div className="space-y-4">
                        <div className="relative">
                          <textarea
                            value={aboutTextValue}
                            onChange={(e) => setAboutTextValue(e.target.value)}
                            className="w-full h-40 p-4 border border-slate-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-slate-700"
                            placeholder="Enter compelling about us text that will engage your mobile app users..."
                          />
                          <div className="absolute bottom-3 right-3 text-xs text-slate-400">
                            {aboutTextValue.length} characters
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={handleSaveAboutText}
                            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            Save Changes
                          </button>
                          <button
                            onClick={handleCancelEditAboutText}
                            className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-lg border border-slate-200">
                        <div className="flex items-start gap-3">
                          <svg
                            className="w-6 h-6 text-slate-400 mt-1 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                            />
                          </svg>
                          <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                            {mobileContent?.aboutText || (
                              <span className="text-slate-400 italic">
                                No about text has been set yet. Click 'Edit
                                Content' to add your company's introduction.
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Live Mobile Preview */}
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-[4rem] blur opacity-20"></div>
                    <div className="relative max-w-sm mx-auto bg-slate-900 rounded-[3.5rem] p-3 shadow-2xl">
                      <div className="bg-white rounded-[3rem] overflow-hidden relative">
                        {/* Status Bar - Hidden to match Flutter app */}

                        {/* Navigation buttons - Match Flutter exactly */}
                        <div className="p-6 pb-4 bg-white">
                          <div className="flex justify-center gap-4">
                            <div className="w-36 py-3 bg-[#203B32] rounded-full">
                              <p className="text-white text-center text-sm font-medium">
                                Home
                              </p>
                            </div>
                            <div className="w-36 py-3 bg-white border border-gray-300 rounded-full">
                              <p className="text-black text-center text-sm font-medium">
                                Projects
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Moss In Numbers section - Match Flutter exactly */}
                        <div className="px-6 pb-4">
                          <div className="border border-gray-300 rounded-xl p-4">
                            <h4 className="text-[#203B32] font-bold text-xl text-center mb-3">
                              Moss In Numbers
                            </h4>
                            <div className="flex justify-around">
                              <div className="text-center">
                                <p className="text-[#0a4b39] font-bold text-2xl">
                                  {designers.length}
                                </p>
                                <p className="text-gray-600 text-sm mt-1">
                                  Current Designers
                                </p>
                              </div>
                              <div className="text-center">
                                <p className="text-[#0a4b39] font-bold text-2xl">
                                  {projectStates.completed || 0}
                                </p>
                                <p className="text-gray-600 text-sm mt-1">
                                  Projects Completed
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Carousel Section - Match Flutter height and styling */}
                        <div className="px-6 pb-4">
                          <div className="h-48 relative overflow-hidden rounded-xl">
                            {mobileContent?.carouselImages?.length > 0 ? (
                              <>
                                {mobileContent.carouselImages.map(
                                  (image, index) => (
                                    <div
                                      key={image._id || index}
                                      className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                                        index === currentImageIndex
                                          ? "opacity-100 scale-100"
                                          : "opacity-0 scale-105"
                                      }`}
                                    >
                                      <img
                                        src={image.url}
                                        alt={
                                          image.alt || `Showcase ${index + 1}`
                                        }
                                        className="w-full h-full object-cover rounded-xl"
                                        onError={(e) => {
                                          console.error(
                                            "Failed to load carousel image:",
                                            image.url
                                          );
                                          e.target.style.backgroundColor =
                                            "#f3f4f6";
                                          e.target.style.display = "flex";
                                          e.target.style.alignItems = "center";
                                          e.target.style.justifyContent =
                                            "center";
                                          e.target.innerHTML =
                                            '<span style="color: #6b7280;">Image loading error</span>';
                                        }}
                                      />
                                    </div>
                                  )
                                )}

                                {/* Navigation arrows - Flutter style */}
                                {mobileContent.carouselImages.length > 1 && (
                                  <>
                                    <button
                                      onClick={prevImage}
                                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-all z-10"
                                    >
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
                                          d="M15 19l-7-7 7-7"
                                        />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={nextImage}
                                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-all z-10"
                                    >
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
                                          d="M9 5l7 7-7 7"
                                        />
                                      </svg>
                                    </button>
                                  </>
                                )}

                                {/* Dot indicators - Match Flutter design */}
                                {mobileContent.carouselImages.length > 1 && (
                                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
                                    {mobileContent.carouselImages.map(
                                      (_, index) => (
                                        <button
                                          key={index}
                                          onClick={() => goToImage(index)}
                                          className={`w-2 h-2 rounded-full transition-all ${
                                            index === currentImageIndex
                                              ? "bg-[#0a4b39]"
                                              : "bg-white/60"
                                          }`}
                                        />
                                      )
                                    )}
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-xl border-2 border-dashed border-gray-300">
                                <div className="text-center text-gray-500">
                                  <svg
                                    className="w-12 h-12 mx-auto mb-3 text-gray-300"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={1.5}
                                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                  </svg>
                                  <p className="text-sm font-medium mb-1">
                                    No showcase images
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    Upload images to preview here
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* About section - Match Flutter styling exactly */}
                        <div className="p-6 bg-white">
                          <h5 className="font-medium text-base mb-3">
                            about us :
                          </h5>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {mobileContent?.aboutText || (
                              <span className="text-gray-400 italic">
                                Your company introduction will appear here. Add
                                content using the editor on the left.
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
    </div>
  );
};

export default HomePage;
