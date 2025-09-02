import { useNavigate } from "react-router-dom";
import { FiEdit2, FiTrash2 } from "react-icons/fi";

export default function Material({
  materialDetails,
  canManageMaterials,
  onEdit,
  onDelete,
}) {
  const { _id, name, company, price, image } = materialDetails;
  const navigate = useNavigate();

  // Calculate price range if price is an array
  let priceDisplay;
  if (Array.isArray(price)) {
    const min = Math.min(...price);
    const max = Math.max(...price);
    priceDisplay = min === max ? `$${min}` : `$${min} - $${max}`;
  } else {
    priceDisplay = `₱${price}`;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:scale-105">
      {/* image here */}
      <div
        className="w-full h-48 bg-gray-100 flex items-center justify-center overflow-hidden cursor-pointer relative group"
        onClick={() => navigate(`/materials/${_id}`)}
      >
        {image?.[0] ? (
          <img
            src={image[0]}
            alt={name}
            className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="text-gray-400 text-center">
            <div className="text-4xl mb-2">📦</div>
            <p className="text-sm">No image</p>
          </div>
        )}

        {/* Management buttons overlay */}
        {canManageMaterials && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="flex gap-1">
              <button
                type="button"
                title="Edit Material"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.();
                }}
                className="p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-blue-50 text-blue-600 shadow-sm hover:shadow-md transition-all"
              >
                <FiEdit2 size={14} />
              </button>
              <button
                type="button"
                title="Delete Material"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(materialDetails);
                }}
                className="p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-red-50 text-red-600 shadow-sm hover:shadow-md transition-all"
              >
                <FiTrash2 size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* info here */}
      <div className="p-4">
        <div className="mb-2">
          <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1 line-clamp-2">
            {name}
          </h3>
          <p className="text-sm text-gray-600 font-medium">{company}</p>
        </div>

        <div className="flex items-center justify-between">
          <p className="font-bold text-lg text-[#1D3C34]">{priceDisplay}</p>
          <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            ID: {_id.slice(-6)}
          </div>
        </div>
      </div>
    </div>
  );
}
