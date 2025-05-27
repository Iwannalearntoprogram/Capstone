import { useOutletContext } from "react-router-dom";
import Material from "./Material";

export default function MaterialList() {
  const { materialsData } = useOutletContext();

  return (
    <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
      {materialsData.map((material) => (
        <Material key={material._id} materialDetails={material} />
      ))}
    </div>
  );
}
