import React from "react";
import {
  FaPlus,
  FaUpload,
  FaInfoCircle,
  FaFileExcel,
  FaFileImage,
  FaFilePdf,
  FaFileAlt,
} from "react-icons/fa";

export default function FilesTab() {
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

  return (
    <div className="mt-6">
      <div className="flex items-center gap-4 mb-4">
        <button className="bg-[#1D3C34] text-white px-4 py-2 rounded flex items-center text-sm hover:bg-[#16442A] transition">
          <FaPlus className="w-4 h-4 mr-1" /> New
        </button>
        <button className="bg-[#1D3C34] text-white px-4 py-2 rounded flex items-center text-sm hover:bg-[#16442A] transition">
          <FaUpload className="w-4 h-4 mr-1" /> Upload
        </button>
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
            {files.map((file) => (
              <tr
                key={file.id}
                className="border-t hover:bg-gray-50 transition-colors"
              >
                <td className="p-3">{getFileIcon(file.type)}</td>
                <td className="p-3">
                  <span className="text-gray-900 hover:text-[#1D3C34] cursor-pointer">
                    {file.name}
                  </span>
                </td>
                <td className="p-3 text-gray-600">{file.modified}</td>
                <td className="p-3">
                  <div className="flex -space-x-2">
                    {file.modifiedBy.slice(0, 3).map((src, idx) => (
                      <img
                        key={idx}
                        src={src}
                        alt="Avatar"
                        className="w-6 h-6 rounded-full border-2 border-white object-cover"
                      />
                    ))}
                    {file.modifiedBy.length > 3 && (
                      <div className="w-6 h-6 rounded-full bg-gray-300 text-xs text-center text-black flex items-center justify-center border-2 border-white">
                        +{file.modifiedBy.length - 3}
                      </div>
                    )}
                  </div>
                </td>
                <td className="p-3 text-gray-600">{file.createdBy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {files.length === 0 && (
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
