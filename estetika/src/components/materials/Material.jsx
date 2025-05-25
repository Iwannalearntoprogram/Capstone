import { useNavigate } from "react-router-dom";

export default function Material({ materialDetails }) {
  const { _id, name, company, price, image } = materialDetails;
  const navigate = useNavigate();

  // Use the first image from the material's image array, or a fallback
  const displayImage =
    image && image.length > 0
      ? image[0]
      : "https://via.placeholder.com/300x300?text=No+Image";

  return (
    <div
      className="min-w-60 lg:mb-8 cursor-pointer"
      onClick={() => navigate(`/materials/${_id}`)}
    >
      {/* image here */}
      <div className="min-w-60 h-60 bg-white rounded-xl mb-4 flex items-center justify-center overflow-hidden">
        <img
          src={displayImage}
          alt={name}
          className="object-contain w-full h-full rounded-xl"
          onError={(e) => {
            e.target.src =
              "https://via.placeholder.com/300x300?text=Image+Not+Found";
          }}
        />
      </div>
      {/* info here */}
      <div>
        <h2 className="font-bold">{name}</h2>
        <p className="text-sm">{company}</p>
        <p className="font-bold text-lg">
          {Array.isArray(price)
            ? `₱${price[0]} - ₱${price[price.length - 1]}`
            : `₱${price}`}
        </p>
      </div>
    </div>
  );
}
