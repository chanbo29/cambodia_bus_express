import { useState } from "react";
import { Save, User, Mail, Phone } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
const { t } = useLanguage();

export default function ProfileSettings() {
  const savedUser = JSON.parse(localStorage.getItem("user"));

  const [form, setForm] = useState({
    username: savedUser?.username || "",
    email: savedUser?.email || "",
    phone: savedUser?.phone || "",
  });

  const saveProfile = (e) => {
    e.preventDefault();

    localStorage.setItem("user", JSON.stringify(form));

    alert("Profile Updated");
    window.location.href = "/profile";
  };

  return (
    <main className="profile-page">
      <form className="settings-card" onSubmit={saveProfile}>
        <h1>Profile Settings</h1>
        <p>Update your personal information.</p>

        <label>Username</label>
        <div className="settings-input">
          <User size={18} />
          <input
            value={form.username}
            onChange={(e) =>
              setForm({ ...form, username: e.target.value })
            }
          />
        </div>

        <label>Email</label>
        <div className="settings-input">
          <Mail size={18} />
          <input
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
          />
        </div>

        <label>Phone</label>
        <div className="settings-input">
          <Phone size={18} />
          <input
            value={form.phone}
            onChange={(e) =>
              setForm({ ...form, phone: e.target.value })
            }
          />
        </div>

        <button className="mainBtn">
          <Save size={18} />
          Save Changes
        </button>
      </form>
    </main>
  );
}