// import React from 'react';
// import { Link } from 'react-router-dom';
// import '../styles/Navbar.css';
// import logo from '../assets/react.svg';
// import Button from './Button';

// function Navbar() {
//   return (
//     <nav>
//       <div className="logo">
//         <img src={logo} alt="Logo" />
//       </div>
//       <ul className='horizontal-list'>
//         <li>
//           <Link to='/'>Home</Link>
//         </li>
//         <li>
//           <Link to='/about'>About</Link>
//         </li>
//         <li>
//           <Link to='/articles'>Articles</Link>
//         </li>
//       </ul>
//       <Button className='btn'>Login</Button>
//     </nav>
//   );
// }

// export default Navbar;
import React from 'react';
import '../styles/Navbar.css';

const Navbar = ({ toggleSidebar }) => {
  return (
    <div className="navbar">
      <button onClick={toggleSidebar} className="menu-toggle">
        ☰
      </button>
      <h1 className="navbar-title">Estetika</h1>
    </div>
  );
};

export default Navbar;
