import {
  FaTrash,
  FaEye,
  FaUsers,
  FaMapMarkerAlt,
  FaRulerCombined,
} from "react-icons/fa";

const CustomMaterial = ({ status = "Pending" }) => {
  // Status color mapping
  const statusStyles = {
    Pending: "bg-yellow-100 text-yellow-800",
    Ongoing: "bg-blue-100 text-blue-800",
    Completed: "bg-green-100 text-green-800",
    Cancelled: "bg-red-100 text-red-800",
  };
  return (
    <div
      className="bg-white rounded-xl shadow p-5 border flex flex-col gap-2 relative w-[350px] max-w-full"
      style={{ borderColor: "#d1d5db" }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="font-bold text-lg text-[#21413A] truncate">Kitchen</div>
        <div className="flex gap-2 items-center">
          {/* Status at top right */}
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
              statusStyles[status] || statusStyles["Pending"]
            }`}
          >
            {status}
          </span>
          <button className="bg-[#21413A] text-white px-3 py-1 rounded font-semibold text-sm flex items-center gap-1">
            <FaEye /> View
          </button>
          <button className="bg-gray-100 text-gray-600 p-2 rounded hover:bg-gray-200">
            <FaTrash />
          </button>
        </div>
      </div>
      <div className="flex gap-2 mb-2">
        {/* Status chip also in tags for demo, can remove if redundant */}
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
            statusStyles[status] || statusStyles["Pending"]
          }`}
        >
          {status}
        </span>
        <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs font-semibold">
          Kitchen
        </span>
      </div>
      <div className="text-gray-800 mb-1">Modern Kitchen</div>
      <div className="text-green-700 font-bold text-lg mb-1">₱50,000</div>
      <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
        <FaMapMarkerAlt className="inline mr-1" /> Emus, Cavite
      </div>
      <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
        <FaRulerCombined className="inline mr-1" /> 20 sq ft
      </div>
      <hr className="my-2" />
      <div className="flex justify-between items-center text-xs text-gray-500">
        <span>Start: Sep 19, 2025</span>
        <span className="text-red-500">End: Oct 20, 2025</span>
      </div>
      <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
        <span className="flex items-center gap-1">
          <FaUsers /> 0 members
        </span>
        <span className="flex items-center gap-1">
          Progress:{" "}
          <span className="bg-gray-200 rounded-full px-2">
            <span className="inline-block align-middle w-16 h-2 bg-gray-300 rounded-full mr-2">
              <span
                className="inline-block align-middle h-2 bg-[#21413A] rounded-full"
                style={{ width: "0%" }}
              ></span>
            </span>
            0%
          </span>
        </span>
      </div>
    </div>
  );
};

export default CustomMaterial;
