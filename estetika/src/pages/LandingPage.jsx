import React from "react";
import { Link } from "react-router-dom";
import { FaInstagram, FaYoutube } from "react-icons/fa";
import logo from "../assets/images/logo-moss-2.png";
// Project images
import projectModernResidential from "../assets/images/project-modern-residential.png";
import projectCommercialSpace from "../assets/images/project-commercial-space.png";
import projectElegantWorkspace from "../assets/images/project-elegant-workspace.png";
import projectModernOffice from "../assets/images/project-modern-office.png";
import projectElegantLiving from "../assets/images/transform-space-image.png";
import projectDiningRoom from "../assets/images/about-us-image.png";

function LandingPage() {
  const handleDownloadApp = () => {
    // Direct download link for APK file
    const downloadUrl = "https://your-domain.com/path/to/estetika-app.apk";
    
    // Create a temporary link element and trigger download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = 'Estetika-App.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSmoothScroll = (e, targetId) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <div
      className="min-h-screen bg-gray-50"
      style={{ scrollBehavior: "smooth" }}
    >
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src={logo} alt="Moss Manila" className="h-8 w-auto" />
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <a
                  href="#about"
                  onClick={(e) => handleSmoothScroll(e, "about")}
                  className="text-gray-700 hover:text-[#1D3C34] px-3 py-2 text-sm font-medium transition"
                >
                  About Us
                </a>
                <a
                  href="#projects"
                  onClick={(e) => handleSmoothScroll(e, "projects")}
                  className="text-gray-700 hover:text-[#1D3C34] px-3 py-2 text-sm font-medium transition"
                >
                  Projects
                </a>
                <a
                  href="#work-with-us"
                  onClick={(e) => handleSmoothScroll(e, "work-with-us")}
                  className="text-gray-700 hover:text-[#1D3C34] px-3 py-2 text-sm font-medium transition"
                >
                  Work With Us
                </a>
                <a
                  href="#contact"
                  onClick={(e) => handleSmoothScroll(e, "contact")}
                  className="text-gray-700 hover:text-[#1D3C34] px-3 py-2 text-sm font-medium transition"
                >
                  Contact
                </a>
              </div>
            </div>
            <Link
              to="/login"
              className="bg-[#1D3C34] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#16442A] transition"
            >
              Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-100 to-gray-200 py-20 pt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-sm text-gray-600 uppercase tracking-wide mb-4">
                CREATING STANDOUT INTERIORS AT MOMENTS THAT CALL FOR IT
              </p>
              <h1 className="text-5xl font-light text-gray-900 mb-6">
                Where Vision Meets Sophistication
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                We believe the best partnerships start with a simple step
                forward. Whether you're a potential client, partner, or
                collaborator—our process is streamlined through our innovative
                approach.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleDownloadApp}
                  className="bg-[#1D3C34] text-white px-6 py-3 rounded-md font-medium hover:bg-[#16442A] transition"
                >
                  Download App 📱
                </button>
                <a
                  href="#work-with-us"
                  onClick={(e) => handleSmoothScroll(e, "work-with-us")}
                  className="border border-gray-400 text-gray-700 px-6 py-3 rounded-md font-medium hover:border-[#1D3C34] hover:text-[#1D3C34] transition"
                >
                  Work With Us
                </a>
              </div>
            </div>
            <div className="relative rounded-lg h-96 overflow-hidden">
              <img
                src={projectElegantLiving}
                alt="Elegant living room with gold circular lighting and luxury cream sofa"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40  flex items-center justify-center">
                <p className="text-white text-xl font-medium tracking-wide">
                  Transform Your Space
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-light text-gray-900 mb-8">About Us</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative rounded-lg h-80 overflow-hidden">
              <img
                src={projectDiningRoom}
                alt="Modern dining room with wood slat feature walls and contemporary chandelier"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-lg text-gray-700 mb-6">
                Welcome to our Interior Design Studio in Quezon City, where
                creativity meets functionality. We specialize in creating
                standout interiors that perfectly capture those special moments
                that call for exceptional design.
              </p>
              <p className="text-lg text-gray-700">
                Our team combines innovative thinking with timeless elegance,
                ensuring every space we touch becomes a reflection of our
                clients' unique vision and lifestyle. From residential
                sanctuaries to commercial marvels, we bring dreams to life.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Projects Section */}
      <section id="projects" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-light text-gray-900 mb-8">
              Featured Projects
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="h-64 overflow-hidden">
                <img
                  src={projectModernResidential}
                  alt="Modern Residential Interior with Teal Chairs and Gold Accents"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  Luxurious Living Space
                </h3>
                <p className="text-gray-600">
                  Dark sophistication meets modern comfort with rich coral
                  seating, sleek black cabinetry, and curated art pieces
                  creating an intimate yet grand atmosphere.
                </p>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="h-64 overflow-hidden">
                <img
                  src={projectCommercialSpace}
                  alt="Commercial Space with Coral Seating and Dark Wood"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  Executive Reception Design
                </h3>
                <p className="text-gray-600">
                  Striking wood slat feature walls and contemporary lighting
                  create a professional yet welcoming environment perfect for
                  high-end corporate spaces.
                </p>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="h-64 overflow-hidden">
                <img
                  src={projectElegantWorkspace}
                  alt="Elegant Workspace with Wood Panels and Modern Design"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  Boutique Luxury Lounge
                </h3>
                <p className="text-gray-600">
                  Rich emerald velvet seating with brass accents and geometric
                  shelving create an opulent atmosphere perfect for exclusive
                  hospitality spaces.
                </p>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="h-64 overflow-hidden">
                <img
                  src={projectModernOffice}
                  alt="Modern Office Space with Natural Light and Coral Chairs"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  Contemporary Office Suite
                </h3>
                <p className="text-gray-600">
                  Modern workspace design featuring warm coral seating, natural
                  light optimization, and plants to create a productive yet
                  comfortable environment.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="work-with-us" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-light text-gray-900 mb-8">
              How It Works
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-[#1D3C34] text-white w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                Download Our App
              </h3>
              <p className="text-gray-600">
                Get our mobile app (APK) to streamline your design journey with
                us.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-[#1D3C34] text-white w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                Submit Your Proposal
              </h3>
              <p className="text-gray-600">
                Share your vision and requirements directly through our
                intuitive app interface.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-[#1D3C34] text-white w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                Team Review
              </h3>
              <p className="text-gray-600">
                Our experienced team will review and respond to your proposal
                promptly.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-[#1D3C34] text-white w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                4
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                Collaboration Begins
              </h3>
              <p className="text-gray-600">
                Start your design journey with personalized attention and expert
                guidance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-[#1D3C34] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-medium mb-4">Contact & Info</h3>
              <div className="space-y-2">
                <p className="flex items-center">
                  <span className="mr-2">📍</span>
                  49 N. Domingo, Quezon City, Philippines, 1111
                </p>
                <p className="flex items-center">
                  <span className="mr-2">📧</span>
                  hello@mossmanila.com
                </p>
                <p className="flex items-center">
                  <span className="mr-2">🕒</span>
                  Business Hours & Rating Available
                </p>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-4">Services</h3>
              <ul className="space-y-2">
                <li>Residential Design</li>
                <li>Commercial Spaces</li>
                <li>Interior Consultation</li>
                <li>Project Management</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-4">Follow Us</h3>
              <p className="mb-4">Stay connected for design inspiration</p>
              <div className="flex space-x-4">
                <a
                  href="https://instagram.com/mossdesignhouse"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-gray-300 transition"
                >
                  <FaInstagram className="w-6 h-6" />
                </a>
                <a
                  href="https://youtube.com/@MrMrsBofMossDesign"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-gray-300 transition"
                >
                  <FaYoutube className="w-6 h-6" />
                </a>
              </div>
              <p className="text-sm mt-4">@mossdesignhouse</p>
            </div>
          </div>
          <div className="border-t border-gray-600 mt-8 pt-8 text-center">
            <p className="text-sm">
              © 2025 Moss Manila Interior Design Studio. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
