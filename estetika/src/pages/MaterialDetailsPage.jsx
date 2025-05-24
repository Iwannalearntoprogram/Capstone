import { useParams } from "react-router-dom";
import sofaImg from "../assets/images/sofa.jpg";

function Button({ children, className = "", ...props }) {
  return (
    <button className={`transition ${className}`} {...props}>
      {children}
    </button>
  );
}

export default function MaterialDetailsPage() {
  const { id } = useParams();
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-10 py-10">
      <div className="flex gap-4">
        <div className="flex flex-col gap-4">
          <img
            src={sofaImg}
            alt="thumb1"
            className="w-20 h-20 border rounded"
          />
          <img
            src={sofaImg}
            alt="thumb2"
            className="w-20 h-20 border rounded"
          />
          <img
            src={sofaImg}
            alt="thumb3"
            className="w-20 h-20 border rounded"
          />
        </div>
        <div className="flex-1">
          <img
            src={sofaImg}
            alt="main"
            className="w-full h-full rounded-lg shadow-md object-contain bg-white"
          />
        </div>
      </div>

      {/* Product Details */}
      <div>
        <h2 className="text-2xl font-bold">Leather Black Couch</h2>
        <p className="text-sm text-gray-600">COMPANY: ESTETIKA</p>
        <p className="text-2xl font-semibold mt-4">$260</p>
        <p className="text-gray-600 mt-2 text-sm">
          Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque
          faucibus ex sapien vitae pellentesque sem placerat.
        </p>

        {/* Size Options */}
        <div className="mt-6">
          <p className="text-sm font-medium mb-2">Choose Size</p>
          <div className="flex gap-2">
            {["Small", "Medium", "Large", "X-Large"].map((size) => (
              <Button
                key={size}
                className={`px-3 py-1 rounded-full border ${
                  size === "Large" ? "bg-black text-white" : "bg-white"
                }`}
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
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow p-4">
              <img
                src={sofaImg}
                alt={`similar${i}`}
                className="w-full h-40 object-contain mb-2"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
