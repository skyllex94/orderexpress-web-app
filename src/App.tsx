import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Landing from "./pages/Landing";
import LoginPage from "./pages/Login";
import SignupPage from "./pages/Signup.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx";
import AcceptInvite from "./pages/AcceptInvite";

function App() {
  return (
    <div className="oe-content-bg oe-content-text min-h-screen">
      <Navbar />

      <main>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/accept-invite" element={<AcceptInvite />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App;
