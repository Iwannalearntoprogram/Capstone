import React from "react";

const ProjectDetailsModal = ({ project, onClose }) => {
  if (!project) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full relative">
        <button
          className="absolute top-2 right-4 text-gray-500 text-2xl"
          onClick={onClose}
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold mb-4">{project.title}</h2>
        <div className="mb-2">
          <span className="font-semibold">Description: </span>
          {project.description}
        </div>
        <div className="mb-2">
          <span className="font-semibold">Budget: </span>
          {project.budget}
        </div>
        <div className="mb-2">
          <span className="font-semibold">Start Date: </span>
          {project.startDate}
        </div>
        <div className="mb-2">
          <span className="font-semibold">End Date: </span>
          {project.endDate}
        </div>
        <div className="mb-2">
          <span className="font-semibold">Project Location: </span>
          {project.projectLocation}
        </div>
        <div className="mb-2">
          <span className="font-semibold">Project Size (sq ft): </span>
          {project.projectSize}
        </div>
        <div className="mb-2">
          <span className="font-semibold">Room Type: </span>
          {project.roomType}
        </div>
        <div className="mb-2">
          <span className="font-semibold">Status: </span>
          {project.status}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailsModal;
