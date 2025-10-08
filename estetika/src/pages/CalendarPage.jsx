import React, { useState, useEffect } from "react";
import Modal from "react-modal";
import { Calendar, Views, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import enUS from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { FiPlus, FiEdit2 } from "react-icons/fi";
import { FaTrash } from "react-icons/fa";
import axios from "axios";
import Cookies from "js-cookie";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../styles/datepicker-custom.css";

const locales = { "en-US": enUS };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

Modal.setAppElement("#root"); // For accessibility

const CalendarPage = () => {
  const [events, setEvents] = useState([]);
  const [view, setView] = useState(Views.MONTH);
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
    if (!newEvent.title) return alert("Please enter a title!");

    const body = {
      title: newEvent.title,
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
      const savedEvent = response.data.event || {
        ...newEvent,
        id: Date.now(),
      };
      setEvents([...events, savedEvent]);
      closeAddModal();
    } catch (err) {
      alert("Failed to add event.");
      console.error(err);
    }
  };

  const handleUpdateEvent = async () => {
    if (!newEvent.title) return alert("Please enter a title!");

    const body = {
      title: newEvent.title,
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
      const updatedEvent = response.data.event || {
        ...selectedEvent,
        ...body,
        start: new Date(body.startDate),
        end: new Date(body.endDate),
      };
      setEvents(
        events.map((event) =>
          event._id === selectedEvent._id ? updatedEvent : event
        )
      );
      closeEditModal();
    } catch (err) {
      alert("Failed to update event.");
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
  };

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
        const mappedEvents = (response.data.event || []).map((ev) => ({
          ...ev,
          start: new Date(ev.startDate),
          end: new Date(ev.endDate),
        }));
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

  return (
    <div className="rounded-[15px] mt-[50px] p-[30px] bg-white min-h-screen shadow-[0_2px_8px_0_rgba(99,99,99,0.2)]">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-2xl font-semibold text-[#1D3C34] font-avenir">
          Project Calendar
        </h2>
        <div className="flex items-center gap-4">
          <button
            onClick={handleAddEventButton}
            className="bg-[#1D3C34] text-white px-4 py-2 rounded-lg hover:bg-[#145c4b] transition flex items-center gap-2"
          >
            <FiPlus size={20} />
            Add Event
          </button>
          <button
            onClick={() => setShowAllEvents((prev) => !prev)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition font-semibold border ${
              showAllEvents
                ? "bg-[#1D3C34] text-white border-[#1D3C34]"
                : "bg-white text-[#1D3C34] border-[#1D3C34] hover:bg-gray-100"
            }`}
            aria-pressed={showAllEvents}
          >
            {showAllEvents ? "Showing All Events" : "Show All Events"}
          </button>
        </div>
      </div>

      <Calendar
        localizer={localizer}
        events={events}
        views={[Views.MONTH, Views.WEEK, Views.DAY]}
        selectable={false}
        onSelectEvent={handleEventClick}
        defaultView={view}
        view={view}
        date={date}
        onView={setView}
        onNavigate={setDate}
        style={{ height: 500 }}
        eventPropGetter={() => ({
          style: {
            backgroundColor: "#1D3C34",
            color: "#fff",
            borderRadius: "6px",
            border: "none",
          },
        })}
        className="rbc-calendar"
      />

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
          onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
          className="w-full p-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1D3C34]"
        />
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
            setNewEvent({
              ...newEvent,
              start: date,
              // Adjust end time if it's before the new start time
              end:
                newEvent.end && date && newEvent.end < date
                  ? date
                  : newEvent.end,
            });
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
          onChange={(date) => setNewEvent({ ...newEvent, end: date })}
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

        <label className="block mb-2">Location:</label>
        <input
          type="text"
          placeholder="Location"
          value={newEvent.location}
          onChange={(e) =>
            setNewEvent({ ...newEvent, location: e.target.value })
          }
          className="w-full p-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1D3C34]"
        />

        <label className="block mb-2">Alarm:</label>
        <DatePicker
          selected={newEvent.alarm ? new Date(newEvent.alarm) : null}
          onChange={(date) =>
            setNewEvent({
              ...newEvent,
              alarm: date ? date.toISOString() : null,
            })
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

        <textarea
          placeholder="Notes"
          value={newEvent.notes}
          onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })}
          className="w-full p-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1D3C34]"
        />

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
          onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
          className="w-full p-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1D3C34]"
        />
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
            setNewEvent({
              ...newEvent,
              start: date,
              // Adjust end time if it's before the new start time
              end:
                newEvent.end && date && newEvent.end < date
                  ? date
                  : newEvent.end,
            });
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
          onChange={(date) => setNewEvent({ ...newEvent, end: date })}
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

        <label className="block mb-2">Location:</label>
        <input
          type="text"
          placeholder="Location"
          value={newEvent.location}
          onChange={(e) =>
            setNewEvent({ ...newEvent, location: e.target.value })
          }
          className="w-full p-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1D3C34]"
        />

        <label className="block mb-2">Alarm:</label>
        <DatePicker
          selected={newEvent.alarm ? new Date(newEvent.alarm) : null}
          onChange={(date) =>
            setNewEvent({
              ...newEvent,
              alarm: date ? date.toISOString() : null,
            })
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

        <textarea
          placeholder="Notes"
          value={newEvent.notes}
          onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })}
          className="w-full p-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1D3C34]"
        />

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
