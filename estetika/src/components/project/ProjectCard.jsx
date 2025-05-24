import React from "react";
import { FaEdit, FaUsers, FaRegCalendarAlt, FaTrash } from "react-icons/fa";

const ProjectCard = ({ project, onView, onDelete }) => {
  let formattedEndDate = "";
  if (project.endDate) {
    const date = new Date(project.endDate);
    formattedEndDate = date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  return (
    <div className="bg-white border rounded-xl p-4 shadow-md flex flex-col justify-between">
      <div className="flex items-start justify-between border-b pb-2 mb-2">
        <h3 className="text-md font-bold flex items-center gap-2">
          {project.title}
          <FaEdit className="text-gray-400 text-sm" />
        </h3>
        <div className="flex gap-2">
          <button
            className="bg-red-100 text-red-600 text-sm px-3 py-1 rounded hover:bg-red-200"
            onClick={() => onView(project._id)}
          >
            View
          </button>
          <button
            className="bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded hover:bg-red-500 hover:text-white flex items-center gap-1"
            onClick={() => onDelete && onDelete(project._id)}
            title="Delete Project"
          >
            <FaTrash />
          </button>
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-4">{project.description}</p>
      <div className="flex justify-between items-center text-sm text-gray-500">
        <div className="flex items-center gap-1">
          <FaRegCalendarAlt className="text-red-500" />
          <span className="text-red-500 text-xs font-semibold">
            {formattedEndDate}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <FaUsers />
          <span>{project.members?.length || 0}</span>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
