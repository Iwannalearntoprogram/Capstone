// import React, { useState } from 'react';
// import '../styles/Layout.css';
// import React, { useState } from 'react';
// import '../styles/inbox.css';



// const Inbox = () => {
//   const contacts = ['Alice', 'Bob', 'Charlie', 'Dana'];
//   const [selectedContact, setSelectedContact] = useState(contacts[0]);
//   const [messages, setMessages] = useState([
//     { sender: 'Alice', text: 'Hi there!' },
//     { sender: 'me', text: 'Hello!' },
//   ]);
//   const [input, setInput] = useState('');

//   const handleSend = () => {
//     if (input.trim()) {
//       setMessages([...messages, { sender: 'me', text: input }]);
//       setInput('');
//       // TODO: Send message to backend here
//     }
//   };

//   return (
//     <div className="inbox-page">
//       <div className="inbox-container">
//         <aside className="contact-list">
//           {contacts.map((contact) => (
//             <div
//               key={contact}
//               className={`contact-item ${
//                 contact === selectedContact ? 'active' : ''
//               }`}
//               onClick={() => setSelectedContact(contact)}
//             >
//               {contact}
//             </div>
//           ))}
//         </aside>

//         <section className="chat-panel">
//           <div className="chat-header">{selectedContact}</div>

//           <div className="chat-body">
//             <div className="chat-messages">
//               {messages.map((msg, i) => (
//                 <div
//                   key={i}
//                   className={`chat-message ${
//                     msg.sender === 'me' ? 'sent' : 'received'
//                   }`}
//                 >
//                   {msg.text}
//                 </div>
//               ))}
//             </div>

//             <div className="chat-input-bar">
//               <input
//                 type="text"
//                 placeholder="Type a message..."
//                 value={input}
//                 onChange={(e) => setInput(e.target.value)}
//                 onKeyDown={(e) => e.key === 'Enter' && handleSend()}
//               />
//               <button onClick={handleSend}>Send</button>
//             </div>
//           </div>
//         </section>
//       </div>
//     </div>
//   );
// };

// export default Inbox;
