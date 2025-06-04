import React, { useState, useEffect } from "react";
import {
  FaPlus,
  FaUpload,
  FaInfoCircle,
  FaFileExcel,
  FaFileImage,
  FaFilePdf,
  FaFileAlt,
  FaTrash,
} from "react-icons/fa";
import Cookies from "js-cookie";
import axios from "axios";
import { useOutletContext } from "react-router-dom";

export default function FilesTab() {
  const { project, refreshProject } = useOutletContext();
  const [selectedFile, setSelectedFile] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [deletingFiles, setDeletingFiles] = useState(new Set());

  const serverUrl = import.meta.env.VITE_SERVER_URL;

  useEffect(() => {
    const role = localStorage.getItem("role");
    setUserRole(role);
  }, []);

  const getFileIcon = (typeOrUrl) => {
    let ext = "";
    if (typeof typeOrUrl === "string" && typeOrUrl.includes(".")) {
      const url = typeOrUrl.split("?")[0];
      ext = url.split(".").pop().toLowerCase();
    } else if (typeof typeOrUrl === "string") {
      ext = typeOrUrl.toLowerCase();
    }
    switch (ext) {
      case "csv":
      case "xls":
      case "xlsx":
        return <FaFileExcel className="text-green-600 w-5 h-5" />;
      case "pdf":
        return <FaFilePdf className="text-red-600 w-5 h-5" />;
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
      case "bmp":
      case "svg":
      case "webp":
        return <FaFileImage className="text-blue-600 w-5 h-5" />;
      case "doc":
      case "docx":
        return <FaFileAlt className="text-blue-800 w-5 h-5" />;
      case "txt":
      case "rtf":
        return <FaFileAlt className="text-blue-600 w-5 h-5" />;
      case "zip":
      case "rar":
      case "7z":
      case "tar":
      case "gz":
        return <FaFileAlt className="text-yellow-600 w-5 h-5" />;
      case "mp3":
      case "wav":
      case "ogg":
      case "flac":
      case "aac":
        return <FaFileAlt className="text-purple-600 w-5 h-5" />;
      case "mp4":
      case "mov":
      case "avi":
      case "mkv":
      case "webm":
        return <FaFileAlt className="text-pink-600 w-5 h-5" />;
      default:
        return <FaFileAlt className="text-blue-600 w-5 h-5" />;
    }
  };

  const handleNewClick = () => {
    if (userRole === "admin") {
      alert("Admins cannot create new files. Only designers can manage files.");
      return;
    }
    // Add your new file creation logic here
  };

  const handleFileSelect = (e) => {
    if (userRole === "admin") {
      alert("Admins cannot upload files. Only designers can manage files.");
      e.target.value = ""; // Reset the input
      return;
    }

    const file = e.target.files[0];
    if (file) {
      setSelectedFile((prev) => [...prev, file || []]);
    }
  };

  const handleAddFile = async () => {
    // Prevent admin from uploading files
    if (userRole === "admin") {
      alert("Admins cannot upload files. Only designers can manage files.");
      return;
    }

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

  const handleDeleteFile = async (fileUrl) => {
    // Prevent admin from deleting files
    if (userRole === "admin") {
      alert("Admins cannot delete files. Only designers can manage files.");
      return;
    }

    // Confirm deletion
    if (
      !window.confirm(
        "Are you sure you want to delete this file? This action cannot be undone."
      )
    ) {
      return;
    }

    // Add file to deleting set to show loading state
    setDeletingFiles((prev) => new Set(prev).add(fileUrl));
    try {
      const token = Cookies.get("token");

      const res = await axios.delete(
        `${serverUrl}/api/upload/document?projectId=${project?._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          data: {
            fileUrl: fileUrl,
          },
        }
      );

      // Refresh the project data to update the files list
      refreshProject && refreshProject();

      // Show success message
      alert("File deleted successfully!");
    } catch (error) {
      console.error("Error deleting file:", error);

      // Get detailed error message
      let errorMessage = "Error deleting file. Please try again.";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.status === "fail") {
        errorMessage = `Delete failed: ${
          error.response.data.message || "Unknown error"
        }`;
      }

      alert(errorMessage);
    } finally {
      // Remove file from deleting set
      setDeletingFiles((prev) => {
        const newSet = new Set(prev);
        newSet.delete(fileUrl);
        return newSet;
      });
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

  // Use project.files if available, else empty array
  const projectFiles = Array.isArray(project?.files) ? project.files : [];
  const isAdmin = userRole === "admin";

  return (
    <div className="mt-6">
      {/* Action buttons - Only show if not admin */}
      {!isAdmin && (
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={handleNewClick}
            className="bg-[#1D3C34] text-white px-4 py-2 rounded flex items-center text-sm hover:bg-[#16442A] transition"
          >
            <FaPlus className="w-4 h-4 mr-1" /> New
          </button>
          <label className="bg-[#1D3C34] text-white px-4 py-2 rounded flex items-center text-sm hover:bg-[#16442A] transition cursor-pointer">
            <FaUpload className="w-4 h-4 mr-1" /> Upload
            <input
              type="file"
              accept=".csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf,image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
          <FaInfoCircle className="w-4 h-4 text-gray-600" />
        </div>
      )}

      {/* Show admin message if admin */}
      {isAdmin && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <FaInfoCircle className="w-4 h-4 text-blue-600" />
          <span className="text-sm text-blue-800">
            View only mode - Only designers can upload and manage files
          </span>
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden border">
        {" "}
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="w-10 p-3"></th>
              <th className="p-3 font-semibold text-gray-700">Name</th>
              {!isAdmin && (
                <th className="w-20 p-3 font-semibold text-gray-700">
                  Actions
                </th>
              )}
            </tr>
          </thead>{" "}
          <tbody>
            {projectFiles.map((fileUrl, idx) => (
              <tr
                key={fileUrl}
                className="border-t hover:bg-gray-50 transition-colors"
              >
                <td className="p-3">{getFileIcon(fileUrl)}</td>
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
                {!isAdmin && (
                  <td className="p-3">
                    <button
                      onClick={() => handleDeleteFile(fileUrl)}
                      disabled={deletingFiles.has(fileUrl)}
                      className="text-red-600 hover:text-red-800 p-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete file"
                    >
                      {deletingFiles.has(fileUrl) ? (
                        <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <FaTrash className="w-4 h-4" />
                      )}
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty state - different messages for admin vs designer */}
      {projectFiles.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <FaFileAlt className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          {isAdmin ? (
            <>
              <p>No files uploaded yet</p>
              <p className="text-sm">
                Only designers can upload files to this project
              </p>
            </>
          ) : (
            <>
              <p>No files uploaded yet</p>
              <p className="text-sm">
                Click "New" or "Upload" to add files to this project
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
