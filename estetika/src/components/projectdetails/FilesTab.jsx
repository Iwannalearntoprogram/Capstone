import React, { useState, useEffect } from "react";
import {
  FaPlus,
  FaUpload,
  FaInfoCircle,
  FaFileExcel,
  FaFileImage,
  FaFilePdf,
  FaFileAlt,
} from "react-icons/fa";
import Cookies from "js-cookie";
import axios from "axios";
import { useOutletContext } from "react-router-dom";

export default function FilesTab() {
  const { project, refreshProject } = useOutletContext();
  const [selectedFile, setSelectedFile] = useState([]);

  const serverUrl = import.meta.env.VITE_SERVER_URL;

  // Sample file data
  const files = [
    {
      id: 1,
      name: "Materials design lists.csv",
      type: "spreadsheet",
      modified: "March 21, 2025",
      modifiedBy: [
        "https://images.unsplash.com/photo-1494790108755-2616b612b547?w=32&h=32&fit=crop&crop=face",
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face",
      ],
      createdBy: "Isabella Dela Cruz",
    },
    {
      id: 2,
      name: "Floor Plan Layout.pdf",
      type: "pdf",
      modified: "March 20, 2025",
      modifiedBy: [
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face",
      ],
      createdBy: "John Smith",
    },
    {
      id: 3,
      name: "Interior Design Mockup.jpg",
      type: "image",
      modified: "March 19, 2025",
      modifiedBy: [
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=face",
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=32&h=32&fit=crop&crop=face",
        "https://images.unsplash.com/photo-1494790108755-2616b612b547?w=32&h=32&fit=crop&crop=face",
      ],
      createdBy: "Sarah Johnson",
    },
    {
      id: 4,
      name: "Project Requirements.docx",
      type: "document",
      modified: "March 18, 2025",
      modifiedBy: [
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face",
      ],
      createdBy: "Mike Wilson",
    },
  ];

  const getFileIcon = (type) => {
    switch (type) {
      case "spreadsheet":
        return <FaFileExcel className="text-green-600 w-5 h-5" />;
      case "pdf":
        return <FaFilePdf className="text-red-600 w-5 h-5" />;
      case "image":
        return <FaFileImage className="text-blue-600 w-5 h-5" />;
      case "document":
        return <FaFileAlt className="text-blue-800 w-5 h-5" />;
      default:
        return <FaFileAlt className="text-gray-600 w-5 h-5" />;
    }
  };

  const handleAddFile = async () => {
    const token = Cookies.get("token");
    const formData = new FormData();
    let fileLink;

    try {
      formData.append("document", selectedFile[0]);

      const res = await axios.post(
        `${serverUrl}/api/upload/document?projectId=${project?._id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      fileLink = res.data.documentLink;
    } catch (error) {
      console.error("Error adding file:", error);
    }

    try {
      const res = await axios.put(
        `${serverUrl}/api/project?id=${project?._id}`,
        {
          files: [...(project?.files || []), fileLink],
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      refreshProject && refreshProject();
      setSelectedFile([]);
    } catch (error) {
      console.error("Error adding file:", error);
    }
  };

  useEffect(() => {
    if (selectedFile.length > 0) {
      handleAddFile();
    }
  }, [selectedFile]);

  // Helper to get file name from URL
  const getFileName = (url) => {
    try {
      const decoded = decodeURIComponent(url);
      const lastSegment = decoded.split("/").pop().split("?")[0];
      return lastSegment.replace(/-\d{10,}-\d+$/, "");
    } catch {
      return url;
    }
  };

  // Helper to guess file type from extension
  const getFileType = (url) => {
    const ext = url.split(".").pop().toLowerCase();
    if (["csv", "xls", "xlsx"].includes(ext)) return "spreadsheet";
    if (["pdf"].includes(ext)) return "pdf";
    if (["doc", "docx", "txt", "rtf"].includes(ext)) return "document";
    return "document";
  };

  // const getFileName = (url) => {
  //   try {
  //     const lastSegment = url.split("/").pop();
  //     const dashIdx = lastSegment.indexOf("-");
  //     return dashIdx !== -1 ? lastSegment.substring(0, dashIdx) : lastSegment;
  //   } catch {
  //     return url;
  //   }
  // };

  // Use project.files if available, else empty array
  const projectFiles = Array.isArray(project?.files) ? project.files : [];

  return (
    <div className="mt-6">
      <div className="flex items-center gap-4 mb-4">
        <button className="bg-[#1D3C34] text-white px-4 py-2 rounded flex items-center text-sm hover:bg-[#16442A] transition">
          <FaPlus className="w-4 h-4 mr-1" /> New
        </button>
        <label className="bg-[#1D3C34] text-white px-4 py-2 rounded flex items-center text-sm hover:bg-[#16442A] transition cursor-pointer">
          <FaUpload className="w-4 h-4 mr-1" /> Upload
          <input
            type="file"
            accept=".csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf,image/*"
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                setSelectedFile((prev) => [...prev, file || []]);
              }
            }}
            className="hidden"
          />
        </label>
        <FaInfoCircle className="w-4 h-4 text-gray-600" />
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="w-10 p-3"></th>
              <th className="p-3 font-semibold text-gray-700">Name</th>
              <th className="p-3 font-semibold text-gray-700">Modified</th>
              <th className="p-3 font-semibold text-gray-700">Modified by</th>
              <th className="p-3 font-semibold text-gray-700">Created by</th>
            </tr>
          </thead>
          <tbody>
            {projectFiles.map((fileUrl, idx) => (
              <tr
                key={fileUrl}
                className="border-t hover:bg-gray-50 transition-colors"
              >
                <td className="p-3">{getFileIcon(getFileType(fileUrl))}</td>
                <td className="p-3">
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-900 hover:text-[#1D3C34] cursor-pointer"
                  >
                    {getFileName(fileUrl)}
                  </a>
                </td>
                <td className="p-3 text-gray-600">—</td>
                <td className="p-3">
                  <div className="flex -space-x-2">
                    {/* Placeholder avatar */}
                    <img
                      src="https://ui-avatars.com/api/?name=User"
                      alt="Avatar"
                      className="w-6 h-6 rounded-full border-2 border-white object-cover"
                    />
                  </div>
                </td>
                <td className="p-3 text-gray-600">—</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {projectFiles.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <FaFileAlt className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No files uploaded yet</p>
          <p className="text-sm">
            Click "New" or "Upload" to add files to this project
          </p>
        </div>
      )}
    </div>
  );
}
