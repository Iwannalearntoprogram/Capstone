function ProjectCard({ project, onClick }) {
    return (
      <div
        className="p-4 border rounded shadow cursor-pointer hover:bg-gray-100"
        onClick={onClick}
      >
        <h2 className="text-xl font-semibold">{project.name}</h2>
        <button className="mt-2 text-sm text-blue-600 underline">View Details</button>
      </div>
    );
  }
  
  export default ProjectCard;
  