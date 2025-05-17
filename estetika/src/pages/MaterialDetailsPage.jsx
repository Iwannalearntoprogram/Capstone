import { useParams } from "react-router-dom";

export default function MaterialDetailsPage() {
  const { id } = useParams();
  return <div>Material {id}</div>;
}
