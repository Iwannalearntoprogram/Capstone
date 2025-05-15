import { useState } from "react";
import CustomerSatisfactionChart from "../components/dashboard/CustomerSatisfactionChart";
import ProjectCompletionChart from "../components/dashboard/ProjectCompletionChart";

const HomePage = () => {
  return (
    <div className="w-full min-h-screen grid grid-rows-3 grid-cols-8 gap-4 grid-auto-rows-[minmax(0, 1fr)]">
      {/* project overview */}
      <div className="col-span-5 row-span-1 bg-white rounded-xl p-4 shadow-md">
        <div className="mb-8">
          <h2 className="font-bold">Projects Overview</h2>
          <p className="text-sm">Projects Summary</p>
        </div>
        <div className="flex gap-4 justify-center">
          <div className="h-40 w-40 bg-red-100 rounded-xl relative">
            <p className="absolute font-bold text-5xl top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2">
              14
            </p>
            <p className="w-full text-center absolute bottom-4 ">
              Active Projects
            </p>
          </div>
          <div className="h-40 w-40 bg-amber-100 rounded-xl relative">
            <p className="absolute font-bold text-5xl top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2">
              34
            </p>
            <p className="w-full text-center absolute bottom-4 ">
              Completed Projects
            </p>
          </div>
          <div className="h-40 w-40 bg-green-100 rounded-xl relative">
            <p className="absolute font-bold text-5xl top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2">
              5
            </p>
            <p className="w-full text-center absolute bottom-4 ">Delayed</p>
          </div>
          <div className="h-40 w-40 bg-purple-100 rounded-xl relative">
            <p className="absolute font-bold text-5xl top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2">
              7
            </p>
            <p className="w-full text-center absolute bottom-4 ">Cancelled</p>
          </div>
        </div>
      </div>
      {/* customer satisfaction */}
      <div className="col-span-3 bg-white rounded-xl p-4 shadow-md">
        {" "}
        <h2 className="font-bold mb-4">Customer Satisfaction</h2>
        <div className="h-52 w-full">
          <CustomerSatisfactionChart />
        </div>
      </div>
      {/* project completion */}
      <div className="col-span-4 bg-white rounded-xl p-8 shadow-md">
        <h2 className="font-bold mb-4">Project Completion</h2>
        <div className="h-52 w-full">
          <ProjectCompletionChart />
        </div>
      </div>
      {/* project top materials */}
      <div className="col-span-4 bg-white rounded-xl p-4 shadow-md"></div>
      {/* projects */}
      <div className="col-span-8 bg-white rounded-xl p-4 shadow-md"></div>
    </div>
  );
};

export default HomePage;
