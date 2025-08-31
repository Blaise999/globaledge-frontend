// src/pages/NotFound.jsx
import { Link } from "react-router-dom";
import Logo from "../assets/globaledge.png";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="h-14 border-b border-gray-100 flex items-center px-6">
        <Link to="/" className="flex items-center">
          <img src={Logo} alt="GlobalEdge" className="h-9 w-auto object-contain" />
        </Link>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        <h1 className="text-7xl font-black text-red-600">404</h1>
        <p className="mt-4 text-xl font-semibold text-gray-800">
          Oops! Page not found
        </p>
        <p className="mt-2 text-gray-600 max-w-md">
          The page you’re looking for doesn’t exist or was moved.  
          Please check the URL or go back home.
        </p>
        <div className="mt-6 flex gap-3">
          <Link
            to="/"
            className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 active:scale-[0.98]"
          >
            Back to Home
          </Link>
          <Link
            to="/track"
            className="px-5 py-2.5 rounded-xl bg-black text-white font-semibold hover:bg-gray-900 active:scale-[0.98]"
          >
            Track Shipment
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-gray-400 border-t">
        © {new Date().getFullYear()} GlobalEdge Logistics Ltd. All rights reserved.
      </footer>
    </div>
  );
}
