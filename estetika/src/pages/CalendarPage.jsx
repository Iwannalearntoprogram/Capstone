
// import React, { useState, useEffect } from 'react';
// import Modal from 'react-modal';
// import { Calendar, Views, dateFnsLocalizer } from 'react-big-calendar';
// import { format, parse, startOfWeek, getDay } from 'date-fns';
// import enUS from 'date-fns/locale/en-US';
// import 'react-big-calendar/lib/css/react-big-calendar.css';
// import '../styles/Calendar.css';

// const locales = { 'en-US': enUS };

// const localizer = dateFnsLocalizer({
//   format,
//   parse,
//   startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
//   getDay,
//   locales,
// });

// Modal.setAppElement('#root'); // For accessibility

// const CalendarPage = () => {
//   const [events, setEvents] = useState([]);
//   const [view, setView] = useState(Views.MONTH);
//   const [date, setDate] = useState(new Date());

//   const [modalOpen, setModalOpen] = useState(false);
//   const [newEvent, setNewEvent] = useState({
//     title: '',
//     start: null,
//     end: null,
//     location: '',
//     notes: '',
//     alarm: '',
//     repeat: false,
//     attachment: null,
//     id: null,
//   });

//   // Open modal for adding new event
//   const handleSelectSlot = ({ start, end }) => {
//     setNewEvent({ ...newEvent, start, end });
//     setModalOpen(true);
//   };

//   // Open modal for editing an existing event
//   const handleEventClick = (event) => {
//     setNewEvent(event);
//     setModalOpen(true);
//   };

//   // Add or update event
//   const handleSaveEvent = () => {
//     if (!newEvent.title) return alert('Please enter a title!');

//     if (newEvent.id) {
//       // If the event has an ID, it's an edit operation
//       const updatedEvents = events.map((event) =>
//         event.id === newEvent.id ? newEvent : event
//       );
//       setEvents(updatedEvents);
//     } else {
//       // Otherwise, it's a new event
//       const eventWithId = { ...newEvent, id: Date.now() };
//       setEvents([...events, eventWithId]);
//     }

//     setModalOpen(false);
//     setNewEvent({
//       title: '',
//       start: null,
//       end: null,
//       location: '',
//       notes: '',
//       alarm: '',
//       repeat: false,
//       attachment: null,
//       id: null,
//     });
//   };

//   // Delete event
//   const handleDeleteEvent = () => {
//     setEvents(events.filter((event) => event.id !== newEvent.id));
//     setModalOpen(false);
//     setNewEvent({
//       title: '',
//       start: null,
//       end: null,
//       location: '',
//       notes: '',
//       alarm: '',
//       repeat: false,
//       attachment: null,
//       id: null,
//     });
//   };

//   // Handle the alarm (trigger when the event time arrives)
//   useEffect(() => {
//     if (newEvent.alarm) {
//       const alarmTime = new Date(newEvent.alarm).getTime();
//       const currentTime = new Date().getTime();

//       const timeUntilAlarm = alarmTime - currentTime;

//       if (timeUntilAlarm > 0) {
//         setTimeout(() => {
//           alert(`Reminder: ${newEvent.title} is due now!`);
//         }, timeUntilAlarm);
//       }
//     }
//   }, [newEvent]);

//   return (
//     <div className="calendar-container">
//       <h2 className="calendar-title">📅 Project Calendar</h2>

//       <Calendar
//         localizer={localizer}
//         events={events}
//         views={[Views.MONTH, Views.WEEK, Views.DAY]}
//         selectable={true}
//         onSelectSlot={handleSelectSlot}
//         onSelectEvent={handleEventClick} // Allows you to click on an event to edit
//         defaultView={view}
//         view={view}
//         date={date}
//         onView={setView}
//         onNavigate={setDate}
//         style={{ height: 500 }}
//       />

//       {/* Modal Overlay */}
//       {modalOpen && <div className="event-overlay" onClick={() => setModalOpen(false)} />}

//       {/* Modal */}
//       <Modal
//         isOpen={modalOpen}
//         onRequestClose={() => setModalOpen(false)}
//         shouldCloseOnOverlayClick={false}
//         className="event-modal"
//         overlayClassName="event-overlay"
//       >
//         <h2>{newEvent.id ? 'Edit Event' : 'Add Event'}</h2>

//         <input
//           type="text"
//           placeholder="Title"
//           value={newEvent.title}
//           onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
//         />

//         <label>Alarm</label>
//         <input
//           type="datetime-local"
//           value={newEvent.alarm}
//           onChange={(e) => setNewEvent({ ...newEvent, alarm: e.target.value })}
//         />

//         <label>From</label>
//         <input
//           type="datetime-local"
//           value={newEvent.start ? format(newEvent.start, 'yyyy-MM-dd\'T\'HH:mm') : ''}
//           onChange={(e) => setNewEvent({ ...newEvent, start: new Date(e.target.value) })}
//         />

//         <label>To</label>
//         <input
//           type="datetime-local"
//           value={newEvent.end ? format(newEvent.end, 'yyyy-MM-dd\'T\'HH:mm') : ''}
//           onChange={(e) => setNewEvent({ ...newEvent, end: new Date(e.target.value) })}
//         />

//         <input
//           type="text"
//           placeholder="Location"
//           value={newEvent.location}
//           onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
//         />

//         <label>Repeat</label>
//         <input
//           type="checkbox"
//           checked={newEvent.repeat}
//           onChange={(e) => setNewEvent({ ...newEvent, repeat: e.target.checked })}
//         />

//         <label>Attachment</label>
//         <input
//           type="file"
//           onChange={(e) => setNewEvent({ ...newEvent, attachment: e.target.files[0] })}
//         />

//         <textarea
//           placeholder="Notes"
//           value={newEvent.notes}
//           onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })}
//         />

//         <div className="modal-buttons">
//           <button onClick={handleSaveEvent}>
//             {newEvent.id ? 'Save Changes' : 'Add Event'}
//           </button>
//           <button onClick={() => setModalOpen(false)}>Cancel</button>
//           {newEvent.id && (
//             <button onClick={handleDeleteEvent} style={{ backgroundColor: 'red' }}>
//               Delete Event
//             </button>
//           )}
//         </div>
//       </Modal>
//     </div>
//   );
// };

// export default CalendarPage;
import React, { useState } from 'react';
import Modal from 'react-modal';
import { Calendar, Views, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../styles/Calendar.css';

const locales = { 'en-US': enUS };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

Modal.setAppElement('#root'); // For accessibility

const CalendarPage = () => {
  const [events, setEvents] = useState([]);
  const [view, setView] = useState(Views.MONTH);
  const [date, setDate] = useState(new Date());

  const [modalOpen, setModalOpen] = useState(false);
  const [closing, setClosing] = useState(false); // <-- Animation state

  const [newEvent, setNewEvent] = useState({
    title: '',
    start: null,
    end: null,
    location: '',
    notes: '',
    alarm: null,
    repeat: false,
    attachment: null,
    id: null,
  });

  // Helper function to format date for datetime-local input
  const formatToDateTimeLocal = (date) => {
    if (!date) return '';
    const localDate = new Date(date);
    localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset());
    return localDate.toISOString().slice(0, 16); // Format as YYYY-MM-DDTHH:MM
  };

  // Handle slot selection (clicking on an empty space)
  const handleSelectSlot = ({ start, end }) => {
    const localStart = new Date(start);
    const localEnd = new Date(end);

    setNewEvent({ ...newEvent, start: localStart, end: localEnd });
    setModalOpen(true);
  };

  // Handle event click
  const handleEventClick = (event) => {
    setNewEvent(event);
    setModalOpen(true);
  };

  // Save event
  const handleSaveEvent = () => {
    if (!newEvent.title) return alert('Please enter a title!');

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

  // Delete event
  const handleDeleteEvent = () => {
    setEvents(events.filter((event) => event.id !== newEvent.id));
    closeModal();
  };

  // Close modal and reset form
  const closeModal = () => {
    setClosing(true);
    setTimeout(() => {
      setModalOpen(false);
      setClosing(false);
      setNewEvent({
        title: '',
        start: null,
        end: null,
        location: '',
        notes: '',
        alarm: null,
        repeat: false,
        attachment: null,
        id: null,
      });
    }, 300); // match with fade duration
  };

  return (
    <div className="calendar-container">
      <h2 className="calendar-title">📅 Project Calendar</h2>

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
      />

      {modalOpen && <div className={`event-overlay ${closing ? 'overlay-closing' : ''}`} onClick={closeModal} />}

      <Modal
        isOpen={modalOpen || closing}
        onRequestClose={closeModal}
        className={`event-modal${closing ? ' closed' : ''}`}
        overlayClassName="event-overlay"
        shouldCloseOnOverlayClick={false}
      >
        <h2>{newEvent.id ? 'Edit Event' : 'Add Event'}</h2>

        <input
          type="text"
          placeholder="Title"
          value={newEvent.title}
          onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
        />

        <label>
          Alarm:
          <input
            type="datetime-local"
            value={newEvent.alarm || ''}
            onChange={(e) => setNewEvent({ ...newEvent, alarm: e.target.value })}
          />
        </label>

        <label>
          From:
          <input
            type="datetime-local"
            value={formatToDateTimeLocal(newEvent.start)}
            onChange={(e) => setNewEvent({ ...newEvent, start: new Date(e.target.value) })}
          />
        </label>

        <label>
          To:
          <input
            type="datetime-local"
            value={newEvent.end ? new Date(newEvent.end).toISOString().slice(0, 16) : ''}
            onChange={(e) => setNewEvent({ ...newEvent, end: new Date(e.target.value) })}
          />
        </label>

        <input
          type="text"
          placeholder="Location"
          value={newEvent.location}
          onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
        />

        <label>
          Repeat:
          <input
            type="checkbox"
            checked={newEvent.repeat}
            onChange={(e) => setNewEvent({ ...newEvent, repeat: e.target.checked })}
          />
        </label>

        <input
          type="file"
          onChange={(e) => setNewEvent({ ...newEvent, attachment: e.target.files[0] })}
        />

        <textarea
          placeholder="Notes"
          value={newEvent.notes}
          onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })}
        />

        <div className="modal-buttons">
          <button onClick={handleSaveEvent}>
            {newEvent.id ? 'Save Changes' : 'Add Event'}
          </button>
          <button onClick={closeModal}>Cancel</button>
          {newEvent.id && (
            <button onClick={handleDeleteEvent} style={{ backgroundColor: 'red' }}>
              Delete Event
            </button>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default CalendarPage;
