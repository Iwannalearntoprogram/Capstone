import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";

function Button({ children, className = "", ...props }) {
  return (
    <button className={`transition ${className}`} {...props}>
      {children}
    </button>
  );
}

export default function MaterialDetailsPage() {
  const { id } = useParams();
  const [material, setMaterial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mainImageIdx, setMainImageIdx] = useState(0);

  const serverUrl = import.meta.env.VITE_SERVER_URL;

  useEffect(() => {
    const fetchMaterial = async () => {
      try {
        const token = Cookies.get("token");
        const res = await axios.get(`${serverUrl}/api/material?id=${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setMaterial(res.data.material);
      } catch (err) {
        setMaterial(null);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchMaterial();
  }, [id, serverUrl]);

  if (loading) {
    return <div className="p-10 text-gray-400">Loading material...</div>;
  }

  if (!material) {
    return <div className="p-10 text-red-400">Material not found.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 px-10 py-10">
      <div className="flex gap-4">
        <div className="flex flex-col gap-4">
          {material.image?.map((img, idx) => (
            <img
              key={idx}
              src={img}
              alt={`thumb${idx + 1}`}
              className={`w-20 h-20 border rounded object-cover cursor-pointer ${
                mainImageIdx === idx ? "ring-2 ring-[#1D3C34]" : ""
              }`}
              style={{ height: "80px", width: "80px" }}
              onClick={() => setMainImageIdx(idx)}
            />
          ))}
        </div>
        <div className="flex-1 flex items-center">
          <img
            src={material.image?.[mainImageIdx]}
            alt="main"
            className="w-[45rem] h-[28rem] rounded-lg shadow-md object-contain bg-white"
          />
        </div>
      </div>

      {/* Product Details */}
      <div>
        <h2 className="text-2xl font-bold">{material.name}</h2>
        <p className="text-sm text-gray-600">COMPANY: {material.company}</p>
        <p className="text-2xl font-semibold mt-4">
          {Array.isArray(material.price)
            ? `₱${material.price[0]} - ₱${
                material.price[material.price.length - 1]
              }`
            : `₱${material.price}`}
        </p>
        <p className="text-gray-600 mt-2 text-sm">{material.description}</p>

        {/* Size Options */}
        <div className="mt-6">
          <p className="text-sm font-medium mb-2">Choose Size</p>
          <div className="flex gap-2">
            {material.options?.map((size) => (
              <Button
                key={size}
                className="px-3 py-1 rounded-full border bg-white"
              >
                {size}
              </Button>
            ))}
          </div>
        </div>

        {/* Quantity + Add Button */}
        <div className="mt-6 flex items-center gap-4">
          <div className="flex items-center border px-2 rounded">
            <Button className="px-2">-</Button>
            <span className="px-4">1</span>
            <Button className="px-2">+</Button>
          </div>
          <Button className="bg-black text-white px-6 py-2 rounded-full">
            Add to Sheet
          </Button>
        </div>
      </div>

      {/* Similar Products */}
      <div className="md:col-span-2 px-10 pb-10">
        <h3 className="text-xl font-semibold mb-4">Similar Products</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* You can fetch and map similar products here if needed */}
        </div>
      </div>
    </div>
  );
}
