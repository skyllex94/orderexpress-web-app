import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Landing from "./pages/Landing";
import LoginPage from "./pages/Login";
import SignupPage from "./pages/Signup.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx";

function App() {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith("/dashboard");
  return (
    <div className="oe-content-bg oe-content-text min-h-screen">
      {!isDashboard && (
        <>
          <Navbar />
        </>
      )}

      <main className={isDashboard ? "pt-0" : "pt-0"}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
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
      {!isDashboard && (
        <>
          <div className="mt-20" />
          <Footer />
        </>
      )}
    </div>
  );
}

export default App;
