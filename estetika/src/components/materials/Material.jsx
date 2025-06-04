import { useNavigate } from "react-router-dom";
import sofaImg from "../../assets/images/sofa.jpg";

export default function Material({ materialDetails }) {
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
    <div
      className="min-w-60 lg:mb-8"
      onClick={() => navigate(`/materials/${_id}`)}
    >
      {/* image here */}
      <div className="min-w-60 h-60 bg-white rounded-xl mb-4 flex items-center justify-center overflow-hidden">
        <img
          src={image[0]}
          alt={name}
          className="object-cover w-full h-full rounded-xl"
        />
      </div>
      {/* info here */}
      <div>
        <h2 className="font-bold ">{name}</h2>
        <p className="font-semibold text-sm">{company}</p>
        <p className="font-bold text-lg">{priceDisplay}</p>
      </div>
    </div>
  );
}
