import React, { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";

const toValidDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const TimelinePhaseRow = ({
  phase,
  phaseTasks,
  months,
  startDate,
  gridStyle,
  handleMouseMove,
  handleMouseLeave,
  format,
  phaseRowColor,
}) => {
  const [phaseProgress, setPhaseProgress] = useState(0);

  useEffect(() => {
    const fetchPhase = async () => {
      try {
        const token = Cookies.get("token");
        const response = await axios.get(
          `${
            import.meta.env.VITE_SERVER_URL || "http://localhost:3000"
          }/api/phase?id=${phase._id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setPhaseProgress(
          typeof response.data.phase.progress === "number"
            ? response.data.phase.progress
            : 0
        );
      } catch (err) {
        setPhaseProgress(0);
      }
    };
    if (phase._id) fetchPhase();
  }, [phase._id]);

  const taskDates = phaseTasks.flatMap((task) => [
    toValidDate(task.startDate),
    toValidDate(task.endDate),
  ]).filter(Boolean);

  const derivedTaskStartDate =
    taskDates.length > 0
      ? new Date(Math.min(...taskDates.map((date) => date.getTime())))
      : null;
  const derivedTaskEndDate =
    taskDates.length > 0
      ? new Date(Math.max(...taskDates.map((date) => date.getTime())))
      : null;

  const phaseStartDate = toValidDate(phase.startDate) || derivedTaskStartDate;
  const phaseEndDate = toValidDate(phase.endDate) || derivedTaskEndDate;
  const phaseStartMonth = phaseStartDate
    ? phaseStartDate.getFullYear() * 12 +
      phaseStartDate.getMonth() -
      (startDate.getFullYear() * 12 + startDate.getMonth())
    : 0;
  const phaseEndMonth = phaseEndDate
    ? phaseEndDate.getFullYear() * 12 +
      phaseEndDate.getMonth() -
      (startDate.getFullYear() * 12 + startDate.getMonth())
    : 0;

  const totalCells = phaseEndMonth - phaseStartMonth + 1;

  // Calculate how many cells should be filled based on progress
  const progressCells = Math.floor((phaseProgress / 100) * totalCells);
  const partialProgress = ((phaseProgress / 100) * totalCells) % 1;

  return (
    <div
      className={`items-center h-16 ${phaseRowColor} cursor-pointer`}
      style={gridStyle}
      onMouseMove={(e) =>
        handleMouseMove(e, {
          type: "phase",
          name: phase.name || phase.title,
          label: phase.label,
          start: phaseStartDate ? format(phaseStartDate, "MMM yyyy") : "",
          end: phaseEndDate ? format(phaseEndDate, "MMM yyyy") : "",
        })
      }
      onMouseLeave={handleMouseLeave}
    >
      <div className="p-2">
        <h1 className="font-bold">{phase.name || phase.title}</h1>
        <p className="font-bold text-xs">{phase.label}</p>
      </div>
      {months.map((_, i) => {
        const isStart = i === phaseStartMonth;
        const isEnd = i === phaseEndMonth;
        const isSingle = phaseStartMonth === phaseEndMonth;
        const cellIndex = i - phaseStartMonth;

        // Determine if this cell should have progress
        const shouldShowProgress = cellIndex >= 0 && cellIndex < progressCells;
        const shouldShowPartialProgress =
          cellIndex === progressCells && partialProgress > 0;

        let rounded = "";
        if (isSingle) {
          rounded = "rounded-full";
        } else if (isStart) {
          rounded = "rounded-l-full";
        } else if (isEnd) {
          rounded = "rounded-r-full";
        }

        if (
          phaseStartMonth >= 0 &&
          phaseEndMonth >= phaseStartMonth &&
          i >= phaseStartMonth &&
          i <= phaseEndMonth
        ) {
          return (
            <div key={i} className="h-full flex items-center">
              <div
                className={`w-full h-4 bg-blue-200 relative overflow-hidden ${rounded}`}
              >
                {/* Full progress cells */}
                {shouldShowProgress && (
                  <div
                    className={`absolute left-0 top-0 h-4 bg-blue-500 w-full ${rounded}`}
                  />
                )}
                {/* Partial progress cell */}
                {shouldShowPartialProgress && (
                  <div
                    className="absolute left-0 top-0 h-4 bg-blue-500"
                    style={{
                      width: `${partialProgress * 100}%`,
                      borderTopLeftRadius: isStart ? "9999px" : 0,
                      borderBottomLeftRadius: isStart ? "9999px" : 0,
                      borderTopRightRadius:
                        isEnd && partialProgress === 1 ? "9999px" : 0,
                      borderBottomRightRadius:
                        isEnd && partialProgress === 1 ? "9999px" : 0,
                    }}
                  />
                )}
              </div>
            </div>
          );
        }
        return <div key={i} className="h-full flex items-center"></div>;
      })}
    </div>
  );
};

export default TimelinePhaseRow;
