import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import ProjectsPage from "./pages/ProjectsPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ProfilePage from "./pages/ProfilePage";
import Inbox from "./pages/Inbox";
import CalendarPage from "./pages/CalendarPage";
import NotificationPage from "./pages/NotificationPage";

// Import the new project detail pages
import DesignerProjectsPage from "./pages/DesignerProjectsPage";
import ProjectDetailsPage from "./pages/ProjectDetailsPage";
import AdminProjectsPage from "./pages/AdminProjectsPage";

// Import tab content components
import TasksTab from "./components/TasksTab";
import ProgressTab from "./components/ProgressTab";
import FilesTab from "./components/FilesTab";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/*  Login and Signup */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* layout */}
        <Route path="/" element={<Layout />}>
          <Route path="home" element={<HomePage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="inbox" element={<Inbox />} />
          <Route path="notification" element={<NotificationPage />} />
          <Route path="calendar" element={<CalendarPage />} />

          {/* projects */}
          <Route path="projects" element={<AdminProjectsPage />} />
          <Route path="projects/:projectId" element={<ProjectDetailsPage />}>
            <Route path="tasks" element={<TasksTab />} />
            <Route path="progress" element={<ProgressTab />} />
            <Route path="files" element={<FilesTab />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
