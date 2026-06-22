import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthGateway } from "@/features/auth/AuthGateway";
import ViewerPage from "@/pages/Viewer";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthGateway />} />
        <Route path="/viewer/:documentId" element={<ViewerPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
