import { Mail, MapPin, Phone, ArrowRight } from "lucide-react";
import {
  FaFacebookF,
  FaTelegramPlane,
  FaTiktok,
  FaInstagram,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="new-footer">
      <div className="footer-top">
        <div className="footer-brand-box">
          <div className="footer-logo">
            <img
              src="/logo-bus.png"
              alt="Cambodia Bus Express"
              className="footer-logo-img"
            />
            <div>
              <h2>CAMBODIA</h2>
              <p>BUS EXPRESS</p>
            </div>
          </div>

          <p className="footer-desc">
            Book bus tickets online, choose your seats, and travel safely
            across Cambodia with Cambodia Bus Express.
          </p>

          <div className="footer-socials">
            <a href="https://www.facebook.com/share/14hj91dcDpr/?mibextid=wwXIfr" target="_blank" rel="noreferrer">
              <FaFacebookF />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer">
              <FaInstagram />
            </a>
            <a href="https://t.me/Hao_chhorng" target="_blank" rel="noreferrer">
              <FaTelegramPlane />
            </a>
            <a href="https://www.tiktok.com/@gar?is_from_webapp=1&sender_device=pc" target="_blank" rel="noreferrer">
              <FaTiktok />
            </a>
          </div>
        </div>

        <div className="footer-col">
          <h3>Company</h3>
          <Link to="/"><ArrowRight size={13} /> Home</Link>
          <Link to="/booking"><ArrowRight size={13} /> Booking</Link>
          <Link to="/branch"><ArrowRight size={13} /> Branch</Link>
          <Link to="/about"><ArrowRight size={13} /> About Us</Link>
          <Link to="/faq"><ArrowRight size={13} /> FAQ</Link>
        </div>

        <div className="footer-col">
          <h3>Popular Routes</h3>
          <p>Phnom Penh → Siem Reap</p>
          <p>Phnom Penh → Sihanoukville</p>
          <p>Phnom Penh → Battambang</p>
          <p>Siem Reap → Phnom Penh</p>
        </div>

        <div className="footer-col">
          <h3>Contact Us</h3>
          <p><Phone size={14} /> 089 737 861</p>
          <p><Mail size={14} /> cambodiabus168@booking.com</p>
          <p><MapPin size={14} /> Main Branch In Phnom Penh, Cambodia</p>
          <Link to="/branch" className="footer-branch-btn">Find Branch</Link>
        </div>
      </div>

      <div className="footer-bottom-new">
        <p>© 2026 Cambodia Bus Express. All Rights Reserved.</p>
        <div>
          <Link to="/faq">Privacy Policy</Link>
          <Link to="/faq">Terms &amp; Conditions</Link>
        </div>
      </div>
    </footer>
  );
}