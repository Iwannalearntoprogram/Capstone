import React from "react";

const TimelineTaskRow = ({
  task,
  phase,
  months,
  startDate,
  gridStyle,
  handleMouseMove,
  handleMouseLeave,
  format,
  taskRowColor,
}) => {
  const parseTimelineDate = (value) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const taskStartDate = parseTimelineDate(task.startDate);
  const taskEndDate = parseTimelineDate(task.endDate) || taskStartDate;

  const taskStart = (() => {
    if (!taskStartDate) return -1;
    const d = taskStartDate;
    return (
      d.getFullYear() * 12 +
      d.getMonth() -
      (startDate.getFullYear() * 12 + startDate.getMonth())
    );
  })();
  const taskEnd = (() => {
    if (!taskEndDate) return -1;
    const d = taskEndDate;
    return (
      d.getFullYear() * 12 +
      d.getMonth() -
      (startDate.getFullYear() * 12 + startDate.getMonth())
    );
  })();
  const isSingle = taskStart === taskEnd;

  return (
    <div
      className={`items-center h-8 ${taskRowColor} cursor-pointer`}
      style={gridStyle}
      onMouseMove={(e) =>
        handleMouseMove(e, {
          type: "task",
          name: task.name || task.title,
          phase: phase.name || phase.title,
          start: taskStartDate ? format(taskStartDate, "MMM yyyy") : "",
          end: taskEndDate ? format(taskEndDate, "MMM yyyy") : "",
        })
      }
      onMouseLeave={handleMouseLeave}
    >
      <div className="text-sm p-2">{task.name || task.title}</div>
      {months.map((_, i) => {
        const isStart = i === taskStart;
        const isEnd = i === taskEnd;
        let rounded = "";
        if (isSingle) {
          rounded = "rounded-full";
        } else if (isStart) {
          rounded = "rounded-l-full";
        } else if (isEnd) {
          rounded = "rounded-r-full";
        }
        if (taskStart >= 0 && taskEnd >= taskStart && i >= taskStart && i <= taskEnd) {
          const isDone = task.status === "completed" || task.status === "done";
          return (
            <div key={i} className="h-full flex items-center">
              <div
                className={`w-full h-3 relative overflow-hidden ${rounded} bg-purple-200`}
              >
                {isDone && (
                  <div
                    className="absolute left-0 top-0 h-3 bg-purple-500 transition-all"
                    style={{
                      width: "100%",
                      borderTopLeftRadius: isStart ? "9999px" : 0,
                      borderBottomLeftRadius: isStart ? "9999px" : 0,
                      borderTopRightRadius: isEnd ? "9999px" : 0,
                      borderBottomRightRadius: isEnd ? "9999px" : 0,
                    }}
                  ></div>
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

export default TimelineTaskRow;
