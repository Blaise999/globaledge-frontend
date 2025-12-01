// src/layouts/AppLayout.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import { ChatWidget } from "./components/support/ChatWidget";

export default function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Page content */}
      <div className="flex-1">
        <Outlet />
      </div>

      {/* Floating Support Chat — shown everywhere */}
      <ChatWidget />
    </div>
  );
}
