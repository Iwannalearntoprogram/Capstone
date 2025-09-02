import { useOutletContext } from "react-router-dom";
import Material from "./Material";

export default function MaterialList() {
  const {
    materialsData,
    canManageMaterials,
    onEditMaterial,
    onDeleteMaterial,
  } = useOutletContext();

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {materialsData.map((material) => (
          <Material
            key={material._id}
            materialDetails={material}
            canManageMaterials={canManageMaterials}
            onEdit={() => onEditMaterial?.(material)}
            onDelete={() => onDeleteMaterial?.(material._id, material)}
          />
        ))}
      </div>
    </div>
  );
}
