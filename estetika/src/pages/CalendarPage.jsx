import React, { useState, useEffect } from "react";
import Modal from "react-modal";
import { Calendar, Views, dateFnsLocalizer } from "react-big-calendar";
import {
  addMinutes,
  addDays,
  addMonths,
  addWeeks,
  endOfWeek,
  format,
  getDay,
  parse,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from "date-fns";
import enUS from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { FiPlus, FiEdit2 } from "react-icons/fi";
import { FaTrash } from "react-icons/fa";
import axios from "axios";
import Cookies from "js-cookie";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../styles/Calendar.css";
import "../styles/datepicker-custom.css";
import {
  trimValue,
  validateDateOrder,
  validateRequiredText,
} from "../utils/validation";

const locales = { "en-US": enUS };
const MOBILE_VIEWS = [Views.MONTH, Views.AGENDA, Views.DAY];
const DESKTOP_VIEWS = [Views.MONTH, Views.WEEK, Views.DAY];

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

Modal.setAppElement("#root"); // For accessibility

const CalendarPage = () => {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 640
  );
  const [events, setEvents] = useState([]);
  const [view, setView] = useState(() =>
    typeof window !== "undefined" && window.innerWidth < 640
      ? Views.AGENDA
      : Views.MONTH
  );
  const [date, setDate] = useState(new Date());

  const [showViewModal, setShowViewModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [closing, setClosing] = useState(false);
  const [showAllEvents, setShowAllEvents] = useState(false);

  const serverUrl = import.meta.env.VITE_SERVER_URL;

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [newEvent, setNewEvent] = useState({
    title: "",
    start: null,
    end: null,
    location: "",
    notes: "",
    alarm: null,
    attachment: null,
  });
  const [recipients, setRecipients] = useState([]);
  const [recipientInput, setRecipientInput] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const [recipientOptions, setRecipientOptions] = useState([]);
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [eventErrors, setEventErrors] = useState({});
  const [eventMessage, setEventMessage] = useState("");
  const availableViews = isMobile ? MOBILE_VIEWS : DESKTOP_VIEWS;
  const activeView = availableViews.includes(view) ? view : availableViews[0];

  const normalizeCalendarEvent = (event, index) => {
    if (!event || typeof event !== "object") {
      return null;
    }

    const startValue = event.start ?? event.startDate;
    const endValue = event.end ?? event.endDate ?? startValue;
    const start = new Date(startValue);
    const parsedEnd = new Date(endValue);

    if (Number.isNaN(start.getTime())) {
      return null;
    }

    const end =
      Number.isNaN(parsedEnd.getTime()) || parsedEnd <= start
        ? addMinutes(start, 30)
        : parsedEnd;

    return {
      ...event,
      id: event.id ?? event._id ?? `calendar-event-${index}`,
      title: trimValue(event.title || event.name || event.label || "") || "Untitled event",
      start,
      end,
    };
  };

  const validateEventForm = () => {
    const nextErrors = {
      title: validateRequiredText(newEvent.title, "Title"),
      dates: validateDateOrder(newEvent.start, newEvent.end, {
        startLabel: "From",
        endLabel: "To",
      }),
      alarm:
        newEvent.alarm && newEvent.start && new Date(newEvent.alarm) > new Date(newEvent.start)
          ? "Alarm must be at or before the event start time."
          : "",
    };

    setEventErrors(nextErrors);
    return !Object.values(nextErrors).some(Boolean);
  };

  const handleEventFieldChange = (field, value) => {
    const nextEvent = {
      ...newEvent,
      [field]: value,
    };
    setNewEvent(nextEvent);
    setEventMessage("");
    setEventErrors((prev) => ({
      ...prev,
      [field]: field === "title" ? validateRequiredText(value, "Title") : prev[field],
      ...((field === "start" || field === "end")
        ? {
            dates:
              nextEvent.start && nextEvent.end
                ? validateDateOrder(nextEvent.start, nextEvent.end, {
                    startLabel: "From",
                    endLabel: "To",
                  })
                : "",
            alarm:
              nextEvent.alarm && nextEvent.start && new Date(nextEvent.alarm) > new Date(nextEvent.start)
                ? "Alarm must be at or before the event start time."
                : "",
          }
        : {}),
      ...(field === "alarm"
        ? {
            alarm:
              value && nextEvent.start && new Date(value) > new Date(nextEvent.start)
                ? "Alarm must be at or before the event start time."
                : "",
          }
        : {}),
    }));
  };

  const formatToDateTimeLocal = (date) => {
    if (!date) return "";
    const localDate = new Date(date);
    localDate.setMinutes(
      localDate.getMinutes() - localDate.getTimezoneOffset()
    );
    return localDate.toISOString().slice(0, 16);
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setShowViewModal(true);
  };

  const handleEditClick = () => {
    setNewEvent({
      title: selectedEvent.title,
      start: selectedEvent.start,
      end: selectedEvent.end,
      location: selectedEvent.location || "",
      notes: selectedEvent.notes || "",
      alarm: selectedEvent.alarm || null,
      attachment: null,
    });
    // Pre-fill recipients and selectedRecipients for react-select
    let eventRecipients =
      selectedEvent.recipient || selectedEvent.recipients || [];
    // If eventRecipients are objects (populated), map to IDs
    const recipientIds = eventRecipients.map((r) =>
      typeof r === "object" && r._id ? r._id : r
    );
    setRecipients(recipientIds);
    // Pre-select options for react-select
    const preSelected = recipientOptions.filter((opt) =>
      recipientIds.includes(opt.value)
    );
    setSelectedRecipients(preSelected);
    setShowViewModal(false);
    setShowEditModal(true);
  };

  const handleAddEventButton = () => {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    setNewEvent({
      title: "",
      start: now,
      end: oneHourLater,
      location: "",
      notes: "",
      alarm: null,
      repeat: false,
      attachment: null,
    });
    setRecipients([]);
    setRecipientInput("");
    setEventErrors({});
    setEventMessage("");
    setShowAddModal(true);
  };

  const handleAddRecipient = () => {
    if (recipientInput.trim() && !recipients.includes(recipientInput.trim())) {
      setRecipients([...recipients, recipientInput.trim()]);
      setRecipientInput("");
    }
  };
  const handleRemoveRecipient = (name) => {
    setRecipients(recipients.filter((r) => r !== name));
  };

  const handleAddEvent = async () => {
    if (!validateEventForm()) {
      setEventMessage("Please fix the highlighted fields.");
      return;
    }

    const body = {
      title: trimValue(newEvent.title),
      alarm: newEvent.alarm || "",
      startDate: newEvent.start ? newEvent.start.toISOString() : "",
      endDate: newEvent.end ? newEvent.end.toISOString() : "",
      location: newEvent.location || "",
      repeat: newEvent.repeat || false,
      color: newEvent.color || "#4287f5",
      notes: newEvent.notes || "",
      recipient: recipients,
    };

    try {
      const token = Cookies.get("token");
      const response = await axios.post(`${serverUrl}/api/event`, body, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const savedEvent = normalizeCalendarEvent(
        response.data.event ||
          response.data.newEvent || {
            ...newEvent,
            id: Date.now(),
          },
        events.length
      );

      if (savedEvent) {
        setEvents([...events, savedEvent]);
      }

      closeAddModal();
    } catch (err) {
      setEventMessage("Failed to add event.");
      console.error(err);
    }
  };

  const handleUpdateEvent = async () => {
    if (!validateEventForm()) {
      setEventMessage("Please fix the highlighted fields.");
      return;
    }

    const body = {
      title: trimValue(newEvent.title),
      alarm: newEvent.alarm || "",
      startDate: newEvent.start ? newEvent.start.toISOString() : "",
      endDate: newEvent.end ? newEvent.end.toISOString() : "",
      location: newEvent.location || "",
      color: newEvent.color || "#4287f5",
      notes: newEvent.notes || "",
      recipient: recipients,
    };

    try {
      const token = Cookies.get("token");
      const response = await axios.put(
        `${serverUrl}/api/event?id=${selectedEvent._id}`,
        body,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const updatedEvent = normalizeCalendarEvent(
        response.data.event ||
          response.data.updatedEvent || {
            ...selectedEvent,
            ...body,
            start: new Date(body.startDate),
            end: new Date(body.endDate),
          }
      );

      setEvents(
        events.map((event) =>
          event._id === selectedEvent._id && updatedEvent ? updatedEvent : event
        )
      );
      closeEditModal();
    } catch (err) {
      setEventMessage("Failed to update event.");
      console.error(err);
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;

    try {
      const token = Cookies.get("token");
      await axios.delete(`${serverUrl}/api/event?id=${selectedEvent._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Remove event from local state
      setEvents(events.filter((event) => event._id !== selectedEvent._id));
      closeViewModal();
      alert("Event deleted successfully!");
    } catch (err) {
      alert("Failed to delete event.");
      console.error(err);
    }
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setSelectedEvent(null);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setNewEvent({
      title: "",
      start: null,
      end: null,
      location: "",
      notes: "",
      alarm: null,
      repeat: false,
      attachment: null,
    });
    setRecipients([]);
    setRecipientInput("");
    setSelectedRecipients([]);
    setEventErrors({});
    setEventMessage("");
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedEvent(null);
    setNewEvent({
      title: "",
      start: null,
      end: null,
      location: "",
      notes: "",
      alarm: null,
      repeat: false,
      attachment: null,
    });
    setRecipients([]);
    setRecipientInput("");
    setSelectedRecipients([]);
    setEventErrors({});
    setEventMessage("");
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (view !== activeView) {
      setView(activeView);
    }
  }, [activeView, view]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const token = Cookies.get("token");
        const userId = localStorage.getItem("id");
        let url;
        if (showAllEvents) {
          url = `${serverUrl}/api/event?all=true`;
        } else {
          url = `${serverUrl}/api/event?userId=${userId}`;
        }
        const response = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const mappedEvents = (response.data.event || [])
          .map((ev, index) => normalizeCalendarEvent(ev, index))
          .filter(Boolean);
        setEvents(mappedEvents);
      } catch (err) {
        console.error("Failed to fetch events:", err);
        setEvents([]);
      }
    };
    fetchEvents();
  }, [serverUrl, showAllEvents]);

  useEffect(() => {
    // Fetch all users except client role for recipient dropdown
    const fetchUsers = async () => {
      try {
        const token = Cookies.get("token");
        const response = await axios.get(
          `${serverUrl}/api/user?excludeRole=client`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        // Support both array and object response
        const users = Array.isArray(response.data)
          ? response.data
          : response.data.users || [];
        setAllUsers(users);
        setRecipientOptions(
          users.map((user) => ({
            value: user._id,
            label: user.fullName
              ? `${user.fullName} (${user.email})`
              : user.email,
            email: user.email,
            fullName: user.fullName,
          }))
        );
      } catch (err) {
        setAllUsers([]);
        setRecipientOptions([]);
      }
    };
    fetchUsers();
  }, [serverUrl]);

  const handleCalendarNavigate = (direction) => {
    if (direction === "today") {
      setDate(new Date());
      return;
    }

    const moveDate = {
      [Views.MONTH]:
        direction === "prev"
          ? subMonths(date, 1)
          : addMonths(date, 1),
      [Views.WEEK]:
        direction === "prev"
          ? subWeeks(date, 1)
          : addWeeks(date, 1),
      [Views.DAY]:
        direction === "prev"
          ? subDays(date, 1)
          : addDays(date, 1),
      [Views.AGENDA]:
        direction === "prev"
          ? subWeeks(date, 1)
          : addWeeks(date, 1),
    };

    setDate(moveDate[view] || date);
  };

  const getCalendarLabel = () => {
    if (view === Views.MONTH) {
      return format(date, "MMMM yyyy");
    }

    if (view === Views.WEEK) {
      const start = startOfWeek(date, { weekStartsOn: 1 });
      const end = endOfWeek(date, { weekStartsOn: 1 });
      return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
    }

    return format(date, "MMMM d, yyyy");
  };

  return (
    <div className="min-h-screen rounded-[15px] bg-white p-4 shadow-[0_2px_8px_0_rgba(99,99,99,0.2)] sm:p-6 lg:p-8">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-semibold text-[#1D3C34] font-avenir">
          Project Calendar
        </h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <button
            onClick={handleAddEventButton}
            className="flex items-center justify-center gap-2 rounded-lg bg-[#1D3C34] px-4 py-2 text-white transition hover:bg-[#145c4b]"
          >
            <FiPlus size={20} />
            {isMobile ? "Add" : "Add Event"}
          </button>
          <button
            onClick={() => setShowAllEvents((prev) => !prev)}
            className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-2 font-semibold transition ${
              showAllEvents
                ? "bg-[#1D3C34] text-white border-[#1D3C34]"
                : "bg-white text-[#1D3C34] border-[#1D3C34] hover:bg-gray-100"
            }`}
            aria-pressed={showAllEvents}
          >
            {isMobile
              ? showAllEvents
                ? "All Events"
                : "My Team"
              : showAllEvents
              ? "Showing All Events"
              : "Show All Events"}
          </button>
        </div>
      </div>

      <div className="calendar-shell">
        <div className="mb-4 rounded-2xl border border-[#1D3C34]/10 bg-[#F8F4F1] p-3 sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#1D3C34]">
                {getCalendarLabel()}
              </p>
              <p className="text-xs text-gray-500">
                {isMobile
                  ? "Month, agenda, and day views are enabled on mobile."
                  : "Month, week, and day views are available."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleCalendarNavigate("today")}
                className="rounded-lg border border-[#1D3C34]/20 bg-white px-3 py-2 text-sm font-medium text-[#1D3C34]"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => handleCalendarNavigate("prev")}
                className="rounded-lg border border-[#1D3C34]/20 bg-white px-3 py-2 text-sm font-medium text-[#1D3C34]"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => handleCalendarNavigate("next")}
                className="rounded-lg border border-[#1D3C34]/20 bg-white px-3 py-2 text-sm font-medium text-[#1D3C34]"
              >
                Next
              </button>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {availableViews.map((calendarView) => (
              <button
                key={calendarView}
                type="button"
                onClick={() => setView(calendarView)}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  view === calendarView
                    ? "bg-[#1D3C34] text-white"
                    : "border border-[#1D3C34]/20 bg-white text-[#1D3C34]"
                }`}
              >
                {calendarView.charAt(0).toUpperCase() + calendarView.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white p-2 sm:p-4">
          <Calendar
            localizer={localizer}
            events={events}
            views={availableViews}
            selectable={false}
            onSelectEvent={handleEventClick}
            view={activeView}
            date={date}
            onView={setView}
            onNavigate={setDate}
            toolbar={false}
            titleAccessor={(event) => event?.title || "Untitled event"}
            tooltipAccessor={(event) => event?.title || "Untitled event"}
            style={{ height: isMobile ? 560 : 500 }}
            eventPropGetter={() => ({
              style: {
                backgroundColor: "#1D3C34",
                color: "#fff",
                borderRadius: "6px",
                border: "none",
              },
            })}
            className="rbc-calendar calendar-surface"
          />
        </div>
      </div>

      <Modal
        isOpen={showViewModal}
        onRequestClose={closeViewModal}
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-4 sm:p-6 w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl rounded-lg shadow-lg z-50 max-h-[85vh] overflow-y-auto"
        overlayClassName="fixed top-0 left-0 w-full h-full bg-black/20 z-50 backdrop-blur-xs"
      >
        {selectedEvent && (
          <>
            <h2 className="text-lg font-semibold mb-4">Event Details</h2>
            <div className="mb-2">
              <b>Title:</b> {selectedEvent.title}
            </div>
            <div className="mb-2">
              <b>From:</b> {selectedEvent.start?.toLocaleString()}
            </div>
            <div className="mb-2">
              <b>To:</b> {selectedEvent.end?.toLocaleString()}
            </div>
            {selectedEvent.location && (
              <div className="mb-2">
                <b>Location:</b> {selectedEvent.location}
              </div>
            )}
            {selectedEvent.notes && (
              <div className="mb-2">
                <b>Notes:</b> {selectedEvent.notes}
              </div>
            )}
            {selectedEvent.alarm && (
              <div className="mb-2">
                <b>Alarm:</b> {new Date(selectedEvent.alarm).toLocaleString()}
              </div>
            )}
            <div className="mb-2">
              <b>Recipients:</b>{" "}
              {Array.isArray(selectedEvent.recipient) &&
              selectedEvent.recipient.length > 0
                ? selectedEvent.recipient.map((r) => r.fullName || r).join(", ")
                : typeof selectedEvent.recipient === "object" &&
                  selectedEvent.recipient !== null &&
                  selectedEvent.recipient.fullName
                ? selectedEvent.recipient.fullName
                : "No recipients"}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={handleEditClick}
                className="px-4 py-2 bg-[#1D3C34] text-white rounded-md hover:bg-[#145c4b] transition flex items-center gap-2"
              >
                <FiEdit2 size={16} />
                Edit
              </button>
              <button
                onClick={handleDeleteEvent}
                className="px-4 py-2 text-red-400 border rounded-md hover:text-white hover:bg-red-600 transition flex items-center gap-2"
              >
                <FaTrash size={14} />
              </button>
              <button
                onClick={closeViewModal}
                className="px-4 py-2 bg-gray-300 text-black rounded-md hover:bg-gray-400 transition"
              >
                Close
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* Add Event Modal */}
      <Modal
        isOpen={showAddModal}
        onRequestClose={closeAddModal}
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-4 sm:p-6 w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl rounded-lg shadow-lg z-50 max-h-[85vh] overflow-y-auto"
        overlayClassName="fixed top-0 left-0 w-full h-full bg-black/20 z-50 backdrop-blur-xs"
      >
        <h2 className="text-lg font-semibold mb-4">Add Event</h2>
        <label className="block mb-2">Title:</label>
        <input
          type="text"
          placeholder="Title"
          value={newEvent.title}
          onChange={(e) => handleEventFieldChange("title", e.target.value)}
          className="w-full p-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1D3C34]"
        />
        {eventErrors.title && (
          <p className="text-red-500 text-sm -mt-2 mb-4">{eventErrors.title}</p>
        )}
        <label className="block mb-2">Recipients:</label>
        <Select
          isMulti
          options={recipientOptions}
          value={selectedRecipients}
          onChange={(selected) => {
            setSelectedRecipients(selected);
            setRecipients(selected.map((r) => r.value));
          }}
          placeholder="Search and select recipients..."
          className="mb-4"
          classNamePrefix="react-select"
          filterOption={(option, inputValue) => {
            const label = option.label.toLowerCase();
            return label.includes(inputValue.toLowerCase());
          }}
        />

        <label className="block mb-2">From:</label>
        <DatePicker
          selected={newEvent.start}
          onChange={(date) => {
            handleEventFieldChange("start", date);
            if (newEvent.end && date && newEvent.end < date) {
              handleEventFieldChange("end", date);
            }
          }}
          showTimeSelect
          timeFormat="h:mm aa"
          timeIntervals={15}
          dateFormat="MMMM d, yyyy h:mm aa"
          minDate={new Date()}
          className="w-full p-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1D3C34]"
          placeholderText="Select start date and time"
          wrapperClassName="w-full"
        />

        <label className="block mb-2">To:</label>
        <DatePicker
          selected={newEvent.end}
          onChange={(date) => handleEventFieldChange("end", date)}
          showTimeSelect
          timeFormat="h:mm aa"
          timeIntervals={15}
          dateFormat="MMMM d, yyyy h:mm aa"
          minDate={newEvent.start || new Date()}
          minTime={
            newEvent.start &&
            newEvent.end &&
            newEvent.start.toDateString() === newEvent.end.toDateString()
              ? newEvent.start
              : new Date(new Date().setHours(0, 0, 0, 0))
          }
          maxTime={new Date(new Date().setHours(23, 45, 0, 0))}
          className="w-full p-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1D3C34]"
          placeholderText="Select end date and time"
          wrapperClassName="w-full"
        />
        {eventErrors.dates && (
          <p className="text-red-500 text-sm -mt-2 mb-4">{eventErrors.dates}</p>
        )}

        <label className="block mb-2">Location:</label>
        <input
          type="text"
          placeholder="Location"
          value={newEvent.location}
          onChange={(e) => handleEventFieldChange("location", e.target.value)}
          className="w-full p-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1D3C34]"
        />

        <label className="block mb-2">Alarm:</label>
        <DatePicker
          selected={newEvent.alarm ? new Date(newEvent.alarm) : null}
          onChange={(date) =>
            handleEventFieldChange("alarm", date ? date.toISOString() : null)
          }
          showTimeSelect
          timeFormat="h:mm aa"
          timeIntervals={15}
          dateFormat="MMMM d, yyyy h:mm aa"
          className="w-full p-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1D3C34]"
          placeholderText="Optional: Set a reminder"
          isClearable
          wrapperClassName="w-full"
        />
        {eventErrors.alarm && (
          <p className="text-red-500 text-sm -mt-2 mb-4">{eventErrors.alarm}</p>
        )}

        <textarea
          placeholder="Notes"
          value={newEvent.notes}
          onChange={(e) => handleEventFieldChange("notes", e.target.value)}
          className="w-full p-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1D3C34]"
        />
        {eventMessage && (
          <p className="text-red-500 text-sm mb-4">{eventMessage}</p>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={handleAddEvent}
            className="px-4 py-2 bg-[#1D3C34] text-white rounded-md hover:bg-[#145c4b] transition"
          >
            Add Event
          </button>
          <button
            onClick={closeAddModal}
            className="px-4 py-2 bg-gray-300 text-black rounded-md hover:bg-gray-400 transition"
          >
            Cancel
          </button>
        </div>
      </Modal>

      {/* Edit Event Modal */}
      <Modal
        isOpen={showEditModal}
        onRequestClose={closeEditModal}
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-4 sm:p-6 w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl rounded-lg shadow-lg z-50 max-h-[85vh] overflow-y-auto"
        overlayClassName="fixed top-0 left-0 w-full h-full bg-black/20 z-50 backdrop-blur-xs"
      >
        <h2 className="text-lg font-semibold mb-4">Edit Event</h2>
        <label className="block mb-2">Title:</label>
        <input
          type="text"
          placeholder="Title"
          value={newEvent.title}
          onChange={(e) => handleEventFieldChange("title", e.target.value)}
          className="w-full p-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1D3C34]"
        />
        {eventErrors.title && (
          <p className="text-red-500 text-sm -mt-2 mb-4">{eventErrors.title}</p>
        )}
        <label className="block mb-2">Recipients:</label>
        <Select
          isMulti
          options={recipientOptions}
          value={selectedRecipients}
          onChange={(selected) => {
            setSelectedRecipients(selected);
            setRecipients(selected.map((r) => r.value));
          }}
          placeholder="Search and select recipients..."
          className="mb-4"
          classNamePrefix="react-select"
          filterOption={(option, inputValue) => {
            const label = option.label.toLowerCase();
            return label.includes(inputValue.toLowerCase());
          }}
        />

        <label className="block mb-2">From:</label>
        <DatePicker
          selected={newEvent.start}
          onChange={(date) => {
            handleEventFieldChange("start", date);
            if (newEvent.end && date && newEvent.end < date) {
              handleEventFieldChange("end", date);
            }
          }}
          showTimeSelect
          timeFormat="h:mm aa"
          timeIntervals={15}
          dateFormat="MMMM d, yyyy h:mm aa"
          minDate={new Date()}
          className="w-full p-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1D3C34]"
          placeholderText="Select start date and time"
          wrapperClassName="w-full"
        />

        <label className="block mb-2">To:</label>
        <DatePicker
          selected={newEvent.end}
          onChange={(date) => handleEventFieldChange("end", date)}
          showTimeSelect
          timeFormat="h:mm aa"
          timeIntervals={15}
          dateFormat="MMMM d, yyyy h:mm aa"
          minDate={newEvent.start || new Date()}
          minTime={
            newEvent.start &&
            newEvent.end &&
            newEvent.start.toDateString() === newEvent.end.toDateString()
              ? newEvent.start
              : new Date(new Date().setHours(0, 0, 0, 0))
          }
          maxTime={new Date(new Date().setHours(23, 45, 0, 0))}
          className="w-full p-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1D3C34]"
          placeholderText="Select end date and time"
          wrapperClassName="w-full"
        />
        {eventErrors.dates && (
          <p className="text-red-500 text-sm -mt-2 mb-4">{eventErrors.dates}</p>
        )}

        <label className="block mb-2">Location:</label>
        <input
          type="text"
          placeholder="Location"
          value={newEvent.location}
          onChange={(e) => handleEventFieldChange("location", e.target.value)}
          className="w-full p-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1D3C34]"
        />

        <label className="block mb-2">Alarm:</label>
        <DatePicker
          selected={newEvent.alarm ? new Date(newEvent.alarm) : null}
          onChange={(date) =>
            handleEventFieldChange("alarm", date ? date.toISOString() : null)
          }
          showTimeSelect
          timeFormat="h:mm aa"
          timeIntervals={15}
          dateFormat="MMMM d, yyyy h:mm aa"
          className="w-full p-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1D3C34]"
          placeholderText="Optional: Set a reminder"
          isClearable
          wrapperClassName="w-full"
        />
        {eventErrors.alarm && (
          <p className="text-red-500 text-sm -mt-2 mb-4">{eventErrors.alarm}</p>
        )}

        <textarea
          placeholder="Notes"
          value={newEvent.notes}
          onChange={(e) => handleEventFieldChange("notes", e.target.value)}
          className="w-full p-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1D3C34]"
        />
        {eventMessage && (
          <p className="text-red-500 text-sm mb-4">{eventMessage}</p>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={handleUpdateEvent}
            className="px-4 py-2 bg-[#1D3C34] text-white rounded-md hover:bg-[#145c4b] transition"
          >
            Save Changes
          </button>
          <button
            onClick={closeEditModal}
            className="px-4 py-2 bg-gray-300 text-black rounded-md hover:bg-gray-400 transition"
          >
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default CalendarPage;
