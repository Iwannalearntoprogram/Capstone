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

const isValidDate = (value) => {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
};

const TimelineTab = () => {
  const { project } = useOutletContext();
  const phases = Array.isArray(project?.timeline) ? project.timeline : [];
  const tasks = Array.isArray(project?.tasks) ? project.tasks : [];

  const getPhaseTasks = (phase) => {
    const embeddedTasks = Array.isArray(phase.tasks) ? phase.tasks : [];

    if (embeddedTasks.length > 0) {
      return embeddedTasks;
    }

    if (!phase?._id || !Array.isArray(tasks)) {
      return [];
    }

    return tasks.filter((task) => {
      const phaseId =
        typeof task.phaseId === "string" ? task.phaseId : task.phaseId?._id;
      return phaseId === phase._id;
    });
  };

  const allScheduledItems = [];
  phases.forEach((phase) => {
    if (isValidDate(phase.startDate)) {
      allScheduledItems.push(new Date(phase.startDate));
    }
    if (isValidDate(phase.endDate)) {
      allScheduledItems.push(new Date(phase.endDate));
    }

    getPhaseTasks(phase).forEach((task) => {
      if (isValidDate(task.startDate)) {
        allScheduledItems.push(new Date(task.startDate));
      }
      if (isValidDate(task.endDate)) {
        allScheduledItems.push(new Date(task.endDate));
      }
    });
  });

  tasks.forEach((task) => {
    if (isValidDate(task.startDate)) {
      allScheduledItems.push(new Date(task.startDate));
    }
    if (isValidDate(task.endDate)) {
      allScheduledItems.push(new Date(task.endDate));
    }
  });

  let startDate = new Date();
  let endDate = new Date();
  if (allScheduledItems.length > 0) {
    startDate = new Date(
      Math.min(...allScheduledItems.map((date) => date.getTime()))
    );
    endDate = new Date(
      Math.max(...allScheduledItems.map((date) => date.getTime()))
    );
  }
  startDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  endDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
  const monthsDiff =
    (endDate.getFullYear() - startDate.getFullYear()) * 12 +
    (endDate.getMonth() - startDate.getMonth()) +
    1;
  const monthsToShow = Math.max(12, monthsDiff);
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

  const timelineWidth = `${Math.max(920, 200 + months.length * 96)}px`;

  return (
    <div className="relative rounded-xl bg-white p-3 shadow-md sm:p-4">
      <div className="overflow-x-auto pb-2">
        <div style={{ minWidth: timelineWidth }}>
          <div className="mb-4 text-sm font-medium" style={gridStyle}>
            <div className="border-b pb-2">Task</div>
            {months.map((month, index) => (
              <div key={index} className="border-b pb-2 text-center">
                {format(month, "MMM yyyy")}
              </div>
            ))}
          </div>
          {phases.map((phase, phaseIndex) => {
            const phaseTasks = getPhaseTasks(phase);
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
        </div>
      </div>
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
