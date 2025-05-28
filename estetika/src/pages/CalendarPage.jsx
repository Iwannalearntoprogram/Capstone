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
    setRecipients(selectedEvent.recipients || []);
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
    if (recipients.length === 0)
      return alert("Please add at least one recipient!");

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
    if (recipients.length === 0)
      return alert("Please add at least one recipient!");

    const body = {
      title: newEvent.title,
      alarm: newEvent.alarm || "",
      startDate: newEvent.start ? newEvent.start.toISOString() : "",
      endDate: newEvent.end ? newEvent.end.toISOString() : "",
      location: newEvent.location || "",
      color: newEvent.color || "#4287f5",
      notes: newEvent.notes || "",
      recipients,
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
  };

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const token = Cookies.get("token");
        const userId = localStorage.getItem("id");
        const response = await axios.get(
          `${serverUrl}/api/event?userId=${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
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
  }, []);

  return (
    <div className="rounded-[15px] mt-[50px] p-[30px] bg-white min-h-screen shadow-[0_2px_8px_0_rgba(99,99,99,0.2)]">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-2xl font-semibold text-[#1D3C34] font-avenir">
          📅 Project Calendar
        </h2>
        <button
          onClick={handleAddEventButton}
          className="bg-[#1D3C34] text-white px-4 py-2 rounded-lg hover:bg-[#145c4b] transition flex items-center gap-2"
        >
          <FiPlus size={20} />
          Add Event
        </button>
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
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 w-[90%] max-w-[400px] rounded-lg shadow-lg z-50"
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
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 w-[90%] max-w-[400px] rounded-lg shadow-lg z-50"
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
        <div className="flex mb-2 gap-2">
          <input
            type="text"
            placeholder="Add recipient email or username"
            value={recipientInput}
            onChange={(e) => setRecipientInput(e.target.value)}
            className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1D3C34]"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddRecipient();
              }
            }}
          />
          <button
            type="button"
            onClick={handleAddRecipient}
            className="px-3 py-1 bg-[#1D3C34] text-white rounded-md hover:bg-[#145c4b] transition"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {recipients.map((r) => (
            <span
              key={r}
              className="bg-gray-200 px-2 py-1 rounded-full flex items-center gap-1"
            >
              {r}
              <button
                type="button"
                onClick={() => handleRemoveRecipient(r)}
                className="ml-1 text-red-500"
              >
                &times;
              </button>
            </span>
          ))}
        </div>

        <label className="block mb-2">From:</label>
        <input
          type="datetime-local"
          value={formatToDateTimeLocal(newEvent.start)}
          onChange={(e) =>
            setNewEvent({ ...newEvent, start: new Date(e.target.value) })
          }
          className="w-full p-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1D3C34]"
        />

        <label className="block mb-2">To:</label>
        <input
          type="datetime-local"
          value={
            newEvent.end
              ? new Date(newEvent.end).toISOString().slice(0, 16)
              : ""
          }
          onChange={(e) =>
            setNewEvent({ ...newEvent, end: new Date(e.target.value) })
          }
          className="w-full p-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1D3C34]"
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
        <input
          type="datetime-local"
          value={newEvent.alarm || ""}
          onChange={(e) => setNewEvent({ ...newEvent, alarm: e.target.value })}
          className="w-full p-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1D3C34]"
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
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 w-[90%] max-w-[400px] rounded-lg shadow-lg z-50"
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
        <div className="flex mb-2 gap-2">
          <input
            type="text"
            placeholder="Add recipient name"
            value={recipientInput}
            onChange={(e) => setRecipientInput(e.target.value)}
            className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1D3C34]"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddRecipient();
              }
            }}
          />
          <button
            type="button"
            onClick={handleAddRecipient}
            className="px-3 py-1 bg-[#1D3C34] text-white rounded-md hover:bg-[#145c4b] transition"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {recipients.map((r) => (
            <span
              key={r}
              className="bg-gray-200 px-2 py-1 rounded-full flex items-center gap-1"
            >
              {r}
              <button
                type="button"
                onClick={() => handleRemoveRecipient(r)}
                className="ml-1 text-red-500"
              >
                &times;
              </button>
            </span>
          ))}
        </div>

        <label className="block mb-2">From:</label>
        <input
          type="datetime-local"
          value={formatToDateTimeLocal(newEvent.start)}
          onChange={(e) =>
            setNewEvent({ ...newEvent, start: new Date(e.target.value) })
          }
          className="w-full p-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1D3C34]"
        />

        <label className="block mb-2">To:</label>
        <input
          type="datetime-local"
          value={
            newEvent.end
              ? new Date(newEvent.end).toISOString().slice(0, 16)
              : ""
          }
          onChange={(e) =>
            setNewEvent({ ...newEvent, end: new Date(e.target.value) })
          }
          className="w-full p-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1D3C34]"
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
        <input
          type="datetime-local"
          value={newEvent.alarm || ""}
          onChange={(e) => setNewEvent({ ...newEvent, alarm: e.target.value })}
          className="w-full p-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1D3C34]"
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
