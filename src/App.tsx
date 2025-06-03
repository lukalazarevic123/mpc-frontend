// App.tsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { HomePage } from "./features/home/HomePage";
import { OrganizationPage } from "./features/organization/OrganizationPage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/:orgName" element={<OrganizationPage />} />
      </Routes>
    </Router>
  );
}
