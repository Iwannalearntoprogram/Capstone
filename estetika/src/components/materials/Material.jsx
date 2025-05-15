import { useNavigate } from "react-router-dom";

export default function Material({ materialDetails }) {
  const { id, title, company, price } = materialDetails;
  const navigate = useNavigate();
  console.log(title);

  return (
    <div
      className="min-w-60 lg:mb-8"
      onClick={() => navigate(`/materials/${id}`)}
    >
      {/* image here */}
      <div className="min-w-60 h-60 bg-white rounded-xl mb-4"></div>
      {/* info here */}
      <div>
        <h2 className="font-bold ">{title}</h2>
        <p className="font-semibold text-sm">{company}</p>
        <p className="font-bold text-lg">${price}</p>
      </div>
    </div>
  );
}
