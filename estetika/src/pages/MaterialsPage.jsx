import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import MaterialList from "../components/materials/MaterialList";
import { FiSearch } from "react-icons/fi";
import Cookies from "js-cookie";
import axios from "axios";

const MaterialsPage = () => {
  const [materialsData, setMaterialsData] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const serverUrl = import.meta.env.VITE_SERVER_URL;

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const token = Cookies.get("token");
        const res = await axios.get(`${serverUrl}/api/material`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setMaterialsData(res.data.material || []);
      } catch (err) {
        setMaterialsData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMaterials();
  }, []);

  // Filter materials by search
  const filteredMaterials = materialsData.filter((mat) =>
    mat.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col items-center">
      <div className="mb-8 w-full flex ">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="Search materials..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-2 pl-10 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#1D3C34]"
          />
          <FiSearch
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />
        </div>
      </div>
      {loading ? (
        <div className="text-gray-400 py-8">Loading materials...</div>
      ) : (
        <Outlet context={{ materialsData: filteredMaterials }} />
      )}
    </div>
  );
};

export default MaterialsPage;
