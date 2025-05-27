import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import TimelinePhaseRow from "./timeline/TimelinePhaseRow";
import TimelineTaskRow from "./timeline/TimelineTaskRow";

// Helper functions to replace date-fns
const format = (date, formatStr) => {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  if (formatStr === "MMM yyyy") {
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  }
  return date.toLocaleDateString();
};

const addMonths = (date, months) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

const eachMonthOfInterval = ({ start, end }) => {
  const months = [];
  const current = new Date(start);
  while (current <= end) {
    months.push(new Date(current));
    current.setMonth(current.getMonth() + 1);
  }
  return months;
};

const phaseRowColor = "bg-blue-100";
const taskRowColor = "bg-gray-50";

const TimelineTab = () => {
  const { project } = useOutletContext();
  const phases = Array.isArray(project?.timeline) ? project.timeline : [];
  const tasks = Array.isArray(project?.tasks) ? project.tasks : [];

  let allTasks = [];
  phases.forEach((phase) => {
    if (Array.isArray(phase.tasks)) {
      allTasks = allTasks.concat(phase.tasks);
    }
  });

  if (allTasks.length === 0 && tasks.length > 0) {
    allTasks = tasks;
  }

  let startDate = new Date();
  let endDate = new Date();
  if (allTasks.length > 0) {
    const allStartDates = allTasks.map((t) => new Date(t.startDate));
    const allEndDates = allTasks.map((t) => new Date(t.endDate));
    startDate = new Date(Math.min(...allStartDates.map((d) => d.getTime())));
    endDate = new Date(Math.max(...allEndDates.map((d) => d.getTime())));
  }
  const monthsToShow = 12;
  const months = eachMonthOfInterval({
    start: startDate,
    end: addMonths(startDate, monthsToShow - 1),
  });

  const [tooltip, setTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
    data: null,
  });

  // Tooltip handlers
  const handleMouseMove = (e, data) => {
    setTooltip({
      visible: true,
      x: e.clientX + 12,
      y: e.clientY + 12,
      data,
    });
  };

  const handleMouseLeave = () => {
    setTooltip({ visible: false, x: 0, y: 0, data: null });
  };

  const gridStyle = {
    display: "grid",
    gridTemplateColumns: `200px repeat(${months.length}, 1fr)`,
  };

  return (
    <div className="p-4 bg-white rounded-xl shadow-md relative">
      <div className="text-sm font-medium mb-4" style={gridStyle}>
        <div className="border-b pb-2">Task</div>
        {months.map((month, index) => (
          <div key={index} className="text-center border-b pb-2">
            {format(month, "MMM yyyy")}
          </div>
        ))}
      </div>
      {phases.map((phase, phaseIndex) => {
        const phaseTasks = Array.isArray(phase.tasks) ? phase.tasks : [];
        return (
          <React.Fragment key={phaseIndex}>
            <TimelinePhaseRow
              phase={phase}
              phaseTasks={phaseTasks}
              months={months}
              startDate={startDate}
              gridStyle={gridStyle}
              handleMouseMove={handleMouseMove}
              handleMouseLeave={handleMouseLeave}
              format={format}
              phaseRowColor={phaseRowColor}
            />
            {phaseTasks.map((task, taskIndex) => (
              <TimelineTaskRow
                key={taskIndex}
                task={task}
                phase={phase}
                months={months}
                startDate={startDate}
                gridStyle={gridStyle}
                handleMouseMove={handleMouseMove}
                handleMouseLeave={handleMouseLeave}
                format={format}
                taskRowColor={taskRowColor}
              />
            ))}
          </React.Fragment>
        );
      })}
      {/* Tooltip */}
      {tooltip.visible && tooltip.data && (
        <div
          className="fixed z-50 bg-white border border-gray-300 rounded shadow-lg px-4 py-2 text-xs min-w-[180px] pointer-events-none"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transition: "left 0.05s, top 0.05s",
          }}
        >
          {tooltip.data.type === "phase" ? (
            <>
              <div className="font-bold mb-1">{tooltip.data.name}</div>
              <div>
                <span className="font-semibold">Label:</span>{" "}
                {tooltip.data.label}
              </div>
              <div>
                <span className="font-semibold">Start:</span>{" "}
                {tooltip.data.start}
              </div>
              <div>
                <span className="font-semibold">End:</span> {tooltip.data.end}
              </div>
            </>
          ) : (
            <>
              <div className="font-bold mb-1">{tooltip.data.name}</div>
              <div>
                <span className="font-semibold">Phase:</span>{" "}
                {tooltip.data.phase}
              </div>
              <div>
                <span className="font-semibold">Start:</span>{" "}
                {tooltip.data.start}
              </div>
              <div>
                <span className="font-semibold">Deadline:</span>{" "}
                {tooltip.data.end}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default TimelineTab;
