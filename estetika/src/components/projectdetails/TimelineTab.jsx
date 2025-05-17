import React from "react";
import { format, addMonths, eachMonthOfInterval } from "date-fns";

// Example: Marketing Campaign Project
const phases = [
  {
    name: "Phase 1",
    label: "Planning & Design",
    tasks: [
      {
        name: "Requirement Gathering",
        startMonth: 0,
        endMonth: 1,
        progress: 100,
      },
      { name: "Wireframing", startMonth: 1, endMonth: 2, progress: 60 },
      { name: "UI Design", startMonth: 2, endMonth: 3, progress: 40 },
      {
        name: "Technical Specification",
        startMonth: 3,
        endMonth: 3,
        progress: 0,
      },
    ],
  },
  {
    name: "Phase 2",
    label: "Development",
    tasks: [
      {
        name: "Frontend Development",
        startMonth: 4,
        endMonth: 6,
        progress: 30,
      },
      { name: "Backend Development", startMonth: 4, endMonth: 7, progress: 10 },
      { name: "API Integration", startMonth: 6, endMonth: 8, progress: 0 },
      { name: "Unit Testing", startMonth: 7, endMonth: 8, progress: 0 },
    ],
  },
  {
    name: "Phase 3",
    label: "Testing & QA",
    tasks: [
      { name: "System Testing", startMonth: 8, endMonth: 9, progress: 0 },
      {
        name: "User Acceptance Testing",
        startMonth: 9,
        endMonth: 10,
        progress: 0,
      },
      { name: "Bug Fixing", startMonth: 9, endMonth: 10, progress: 0 },
    ],
  },
  {
    name: "Phase 4",
    label: "Deployment",
    tasks: [
      { name: "Staging Deployment", startMonth: 10, endMonth: 10, progress: 0 },
      {
        name: "Production Deployment",
        startMonth: 11,
        endMonth: 11,
        progress: 0,
      },
    ],
  },
  {
    name: "Phase 5",
    label: "Maintenance & Support",
    tasks: [
      { name: "Monitoring", startMonth: 11, endMonth: 11, progress: 0 },
      { name: "Support", startMonth: 11, endMonth: 11, progress: 0 },
    ],
  },
];

const startDate = new Date(); // current month
const monthsToShow = 12; // or any number you want
const months = eachMonthOfInterval({
  start: startDate,
  end: addMonths(startDate, monthsToShow - 1),
});

const phaseRowColor = "bg-blue-200";
const taskRowColor = "bg-blue-50";

const TimelineTab = () => {
  return (
    <div className="p-4 bg-white rounded-xl shadow-md">
      <div
        className={`grid grid-cols-[200px_repeat(${months.length},1fr)] text-sm font-medium mb-4`}
      >
        <div className="border-b pb-2">Task</div>
        {months.map((month, index) => (
          <div key={index} className="text-center border-b pb-2">
            {format(month, "MMM")}
          </div>
        ))}
      </div>
      {phases.map((phase, phaseIndex) => {
        const phaseStart = Math.min(...phase.tasks.map((t) => t.startMonth));
        const phaseEnd = Math.max(...phase.tasks.map((t) => t.endMonth));
        const phaseProgress =
          phase.tasks.reduce((sum, t) => sum + (t.progress || 0), 0) /
          phase.tasks.length;

        return (
          <React.Fragment key={phaseIndex}>
            <div
              className={`grid grid-cols-[200px_repeat(${months.length},1fr)] items-center h-16 ${phaseRowColor}`}
            >
              <div className="p-2">
                <h1 className="font-bold">{phase.name}</h1>
                <p className="font-bold text-xs">{phase.label}</p>
              </div>
              {months.map((_, i) => {
                const isStart = i === phaseStart;
                const isEnd = i === phaseEnd;
                const isSingle = phaseStart === phaseEnd;
                let rounded = "";
                if (isSingle) {
                  rounded = "rounded-full";
                } else if (isStart) {
                  rounded = "rounded-l-full";
                } else if (isEnd) {
                  rounded = "rounded-r-full";
                }
                if (i >= phaseStart && i <= phaseEnd) {
                  const totalPhaseMonths = phaseEnd - phaseStart + 1;
                  const progressPerMonth = 100 / totalPhaseMonths;
                  const chipProgress =
                    Math.min(
                      Math.max(
                        phaseProgress - progressPerMonth * (i - phaseStart),
                        0
                      ),
                      progressPerMonth
                    ) / progressPerMonth;

                  return (
                    <div key={i} className="h-full flex items-center">
                      <div
                        className={`w-full h-3 bg-blue-100 relative overflow-hidden ${rounded}`}
                      >
                        <div
                          className="absolute left-0 top-0 h-3 bg-blue-500 transition-all"
                          style={{
                            width: `${chipProgress * 100}%`,
                            borderTopLeftRadius: isStart ? "9999px" : 0,
                            borderBottomLeftRadius: isStart ? "9999px" : 0,
                            borderTopRightRadius: isEnd ? "9999px" : 0,
                            borderBottomRightRadius: isEnd ? "9999px" : 0,
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                }
                return <div key={i} className="h-full flex items-center"></div>;
              })}
            </div>
            {/* Subtasks */}
            {phase.tasks.map((task, taskIndex) => (
              <div
                key={taskIndex}
                className={`grid grid-cols-[200px_repeat(${months.length},1fr)] items-center h-8 ${taskRowColor}`}
              >
                <div className="text-sm p-2">{task.name}</div>
                {months.map((_, i) => {
                  const isStart = i === task.startMonth;
                  const isEnd = i === task.endMonth;
                  const isSingle = task.startMonth === task.endMonth;
                  let rounded = "";
                  if (isSingle) {
                    rounded = "rounded-full";
                  } else if (isStart) {
                    rounded = "rounded-l-full";
                  } else if (isEnd) {
                    rounded = "rounded-r-full";
                  }
                  if (i >= task.startMonth && i <= task.endMonth) {
                    const totalTaskMonths = task.endMonth - task.startMonth + 1;
                    const progressPerMonth = 100 / totalTaskMonths;
                    const chipProgress =
                      Math.min(
                        Math.max(
                          (task.progress || 0) -
                            progressPerMonth * (i - task.startMonth),
                          0
                        ),
                        progressPerMonth
                      ) / progressPerMonth;
                    return (
                      <div key={i} className="h-full flex items-center">
                        <div
                          className={`w-full h-3 bg-purple-200 relative overflow-hidden ${rounded}`}
                        >
                          <div
                            className="absolute left-0 top-0 h-3 bg-purple-500 transition-all"
                            style={{
                              width: `${chipProgress * 100}%`,
                              borderTopLeftRadius: isStart ? "9999px" : 0,
                              borderBottomLeftRadius: isStart ? "9999px" : 0,
                              borderTopRightRadius: isEnd ? "9999px" : 0,
                              borderBottomRightRadius: isEnd ? "9999px" : 0,
                            }}
                          ></div>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={i} className="h-full flex items-center"></div>
                  );
                })}
              </div>
            ))}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default TimelineTab;
