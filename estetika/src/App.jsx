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

//project detail pages
import DesignerProjectsPage from "./pages/DesignerProjectsPage";
import ProjectDetailsPage from "./pages/ProjectDetailsPage";
import AdminProjectsPage from "./pages/AdminProjectsPage";

//tab content components
import TasksTab from "./components/TasksTab";
import ProgressTab from "./components/ProgressTab";
import FilesTab from "./components/FilesTab";

//materials
import MaterialsPage from "./pages/MaterialsPage";
import MaterialDetailsPage from "./pages/MaterialDetailsPage";
//material list
import MaterialList from "./components/materials/MaterialList";

//utils
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/*  Login and Signup */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* layout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route
            path="home"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route path="inbox" element={<Inbox />} />
          <Route
            path="notification"
            element={
              <ProtectedRoute>
                <NotificationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="calendar"
            element={
              <ProtectedRoute>
                <CalendarPage />
              </ProtectedRoute>
            }
          />

          {/* projects */}
          <Route
            path="projects"
            element={
              <ProtectedRoute>
                <AdminProjectsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="projects/:projectId"
            element={
              <ProtectedRoute>
                <ProjectDetailsPage />
              </ProtectedRoute>
            }
          >
            <Route
              path="tasks"
              element={
                <ProtectedRoute>
                  <TasksTab />
                </ProtectedRoute>
              }
            />
            <Route
              path="progress"
              element={
                <ProtectedRoute>
                  <ProgressTab />
                </ProtectedRoute>
              }
            />
            <Route
              path="files"
              element={
                <ProtectedRoute>
                  <FilesTab />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* materials */}
          <Route
            path="materials"
            element={
              <ProtectedRoute>
                <MaterialsPage />
              </ProtectedRoute>
            }
          >
            <Route
              path="items"
              element={
                <ProtectedRoute>
                  <MaterialList />
                </ProtectedRoute>
              }
            />
            <Route
              path=":id"
              element={
                <ProtectedRoute>
                  <MaterialDetailsPage />
                </ProtectedRoute>
              }
            />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
