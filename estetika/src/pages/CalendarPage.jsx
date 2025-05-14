import React, { useState } from "react";
import Modal from "react-modal";
import { Calendar, Views, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import enUS from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";

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

  const [modalOpen, setModalOpen] = useState(false);
  const [closing, setClosing] = useState(false);

  const [newEvent, setNewEvent] = useState({
    title: "",
    start: null,
    end: null,
    location: "",
    notes: "",
    alarm: null,
    repeat: false,
    attachment: null,
    id: null,
  });

  const formatToDateTimeLocal = (date) => {
    if (!date) return "";
    const localDate = new Date(date);
    localDate.setMinutes(
      localDate.getMinutes() - localDate.getTimezoneOffset()
    );
    return localDate.toISOString().slice(0, 16);
  };

  const handleSelectSlot = ({ start, end }) => {
    const localStart = new Date(start);
    const localEnd = new Date(end);

    setNewEvent({ ...newEvent, start: localStart, end: localEnd });
    setModalOpen(true);
  };

  const handleEventClick = (event) => {
    setNewEvent(event);
    setModalOpen(true);
  };

  const handleSaveEvent = () => {
    if (!newEvent.title) return alert("Please enter a title!");

    const parsedEvent = {
      ...newEvent,
      start: new Date(newEvent.start),
      end: new Date(newEvent.end),
    };

    let updatedEvents;

    if (newEvent.id) {
      updatedEvents = events.map((event) =>
        event.id === newEvent.id ? parsedEvent : event
      );
    } else {
      const eventWithId = { ...parsedEvent, id: Date.now() };
      updatedEvents = [...events, eventWithId];
    }

    setEvents(updatedEvents);
    closeModal();
  };

  const handleDeleteEvent = () => {
    setEvents(events.filter((event) => event.id !== newEvent.id));
    closeModal();
  };

  const closeModal = () => {
    setClosing(true);
    setTimeout(() => {
      setModalOpen(false);
      setClosing(false);
      setNewEvent({
        title: "",
        start: null,
        end: null,
        location: "",
        notes: "",
        alarm: null,
        repeat: false,
        attachment: null,
        id: null,
      });
    }, 300);
  };

  return (
    <div className="rounded-xl h-full p-8 bg-white  shadow-md">
      <h2 className="text-2xl font-semibold mb-5 text-[#1D3C34] font-avenir">
        📅 Project Calendar
      </h2>

      <Calendar
        localizer={localizer}
        events={events}
        views={[Views.MONTH, Views.WEEK, Views.DAY]}
        selectable={true}
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleEventClick}
        defaultView={view}
        view={view}
        date={date}
        onView={setView}
        onNavigate={setDate}
        style={{ height: 500 }}
        className="rbc-calendar"
      />

      {modalOpen && (
        <div
          className={`fixed top-0 left-0 w-full h-full bg-black/20 z-50 ${
            closing
              ? "opacity-0 transition-opacity duration-300"
              : "opacity-100"
          }`}
          onClick={closeModal}
        />
      )}

      <Modal
        isOpen={modalOpen || closing}
        onRequestClose={closeModal}
        className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 w-[90%] max-w-[400px] rounded-lg shadow-lg z-50 ${
          closing ? "opacity-0 transition-opacity duration-300" : "opacity-100"
        }`}
        overlayClassName="fixed top-0 left-0 w-full h-full bg-black/20 z-50 backdrop-blur-xs"
        shouldCloseOnOverlayClick={false}
      >
        <h2 className="text-lg font-semibold mb-4">
          {newEvent.id ? "Edit Event" : "Add Event"}
        </h2>

        <input
          type="text"
          placeholder="Title"
          value={newEvent.title}
          onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
          className="w-full p-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1D3C34]"
        />

        <label className="block mb-2">Alarm:</label>
        <input
          type="datetime-local"
          value={newEvent.alarm || ""}
          onChange={(e) => setNewEvent({ ...newEvent, alarm: e.target.value })}
          className="w-full p-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1D3C34]"
        />

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

        <input
          type="text"
          placeholder="Location"
          value={newEvent.location}
          onChange={(e) =>
            setNewEvent({ ...newEvent, location: e.target.value })
          }
          className="w-full p-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1D3C34]"
        />

        <label className="block mb-2">Repeat:</label>
        <input
          type="checkbox"
          checked={newEvent.repeat}
          onChange={(e) =>
            setNewEvent({ ...newEvent, repeat: e.target.checked })
          }
          className="mb-4"
        />

        <input
          type="file"
          onChange={(e) =>
            setNewEvent({ ...newEvent, attachment: e.target.files[0] })
          }
          className="mb-4"
        />

        <textarea
          placeholder="Notes"
          value={newEvent.notes}
          onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })}
          className="w-full p-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1D3C34]"
        />

        <div className="flex justify-end gap-2">
          <button
            onClick={handleSaveEvent}
            className="px-4 py-2 bg-[#1D3C34] text-white rounded-md hover:bg-[#145c4b] transition"
          >
            {newEvent.id ? "Save Changes" : "Add Event"}
          </button>
          <button
            onClick={closeModal}
            className="px-4 py-2 bg-gray-300 text-black rounded-md hover:bg-gray-400 transition"
          >
            Cancel
          </button>
          {newEvent.id && (
            <button
              onClick={handleDeleteEvent}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
            >
              Delete Event
            </button>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default CalendarPage;
