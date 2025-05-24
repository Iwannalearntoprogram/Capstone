import { useState } from "react";
import { Outlet } from "react-router-dom";
import MaterialList from "../components/materials/MaterialList";
import { FiSearch } from "react-icons/fi"; // <-- Add this import

const materialsData = [
  { id: 1, title: "Material 1", company: "Company A", price: 100 },
  { id: 2, title: "Material 2", company: "Company B", price: 200 },
  { id: 3, title: "Material 3", company: "Company C", price: 300 },
  { id: 4, title: "Material 4", company: "Company D", price: 400 },
  { id: 5, title: "Material 5", company: "Company E", price: 500 },
  { id: 6, title: "Material 6", company: "Company F", price: 600 },
  { id: 7, title: "Material 7", company: "Company G", price: 700 },
  { id: 8, title: "Material 8", company: "Company H", price: 800 },
  { id: 9, title: "Material 9", company: "Company I", price: 900 },
  { id: 10, title: "Material 10", company: "Company J", price: 1000 },
  { id: 11, title: "Material 11", company: "Company K", price: 1100 },
  { id: 12, title: "Material 12", company: "Company L", price: 1200 },
];

const MaterialsPage = () => {
  return (
    <div className="flex flex-col items-center">
      <div className="mb-8 w-full flex ">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="Search materials..."
            className="w-full p-2 pl-10 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#1D3C34]"
          />
          <FiSearch
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />
        </div>
      </div>
      <Outlet context={{ materialsData }} />
    </div>
  );
};

export default MaterialsPage;
