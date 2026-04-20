import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import PostPage from "./pages/PostPage";

function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <>
      <Navbar onNewPostClick={() => navigate("/")} />
      <main className="page-shell">
        <div className="page-container error-state">
          <p className="error-title">Nothing here.</p>
          <p className="error-hint">That page doesn't exist — maybe the link is wrong.</p>
          <button className="primary-button" onClick={() => navigate("/")}>Back to home</button>
        </div>
      </main>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/posts/:slug" element={<PostPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}