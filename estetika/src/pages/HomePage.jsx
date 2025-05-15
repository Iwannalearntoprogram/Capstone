import { useState } from "react";

const HomePage = () => {
  return (
    <div className="bg-white w-full min-h-screen grid grid-rows-3 grid-cols-8 gap-4 ">
      {/* project overview */}
      <div className="col-span-5  bg-blue-50"></div>
      {/* customer satisfaction */}
      <div className="col-span-3  bg-blue-50"></div>
      {/* project completion */}
      <div className="col-span-4  bg-blue-50"></div>
      {/* project top materials */}
      <div className="col-span-4  bg-blue-50"></div>
      {/* projects */}
      <div className="col-span-8 bg-blue-50"></div>
      {/* project progress */}
    </div>
  );
};

export default HomePage;
