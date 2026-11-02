
import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

import Navbar from "./components/Navbar";
import Background from "./components/Background";

import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Tali from "./pages/Tali";
import Calculator from "./pages/Calculator";

import { loginAnonymously } from "./firebaseAuth";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}

function App() {
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [firebaseError, setFirebaseError] = useState("");

  useEffect(() => {
    let active = true;

    loginAnonymously()
      .then(() => {
        if (active) {
          setFirebaseReady(true);
          console.log("Firebase Authentication successful");
        }
      })
      .catch((error) => {
        if (active) {
          setFirebaseError(error.message);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  if (firebaseError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white p-6">
        <div className="max-w-md text-center">
          <h2 className="text-xl font-bold text-red-400 mb-3">
            Firebase Connection Failed
          </h2>
          <p>{firebaseError}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-5 px-5 py-2 rounded-lg bg-lime-400 text-black"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!firebaseReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Connecting to Firebase...
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-transparent">
      <Background />
      <ScrollToTop />
      <Navbar />

      <main className="lg:ml-[230px] p-6 relative z-10">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/tali" element={<Tali />} />
          <Route path="/calculator" element={<Calculator />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
