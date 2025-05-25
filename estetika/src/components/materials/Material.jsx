import { useNavigate } from "react-router-dom";
import sofaImg from "../../assets/images/sofa.jpg";

export default function Material({ materialDetails }) {
  const { _id, title, company, price } = materialDetails;
  const navigate = useNavigate();
  console.log(title);

  

  return (
    <div
      className="min-w-60 lg:mb-8"
      onClick={() => navigate(`/materials/${_id}`)}
    >
      {/* image here */}
      <div className="min-w-60 h-60 bg-white rounded-xl mb-4 flex items-center justify-center overflow-hidden">
        <img
          src={sofaImg}
          alt={title}
          className="object-cover w-full h-full rounded-xl"
        />
      </div>
      {/* info here */}
      <div>
        <h2 className="font-bold ">{title}</h2>
        <p className="font-semibold text-sm">{company}</p>
        <p className="font-bold text-lg">${price}</p>
      </div>
    </div>
  );
}
