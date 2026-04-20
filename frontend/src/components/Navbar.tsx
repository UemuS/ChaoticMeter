import { Link } from "react-router-dom";

type NavbarProps = {
  onNewPostClick?: () => void;
};

export default function Navbar({ onNewPostClick }: NavbarProps) {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          ChaoticMeter
        </Link>

        <button type="button" className="navbar-button" onClick={onNewPostClick}>
          New post
        </button>
      </div>
    </header>
  );
}