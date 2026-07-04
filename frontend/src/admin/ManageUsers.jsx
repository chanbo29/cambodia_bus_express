import { useEffect, useState } from "react";
import {
  Bus,
  MapPin,
  Ticket,
  Users,
  Tag,
  FileBarChart,
  ClipboardCheck,
  Shield,
  ShieldOff,
  Trash2,
  Search,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "./Dashboard.css";
import "./ManageUsers.css";


export default function ManageUsers() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = () => {
    setLoading(true);
    API.get("/users/")
      .then((res) => setUsers(Array.isArray(res.data) ? res.data : []))
      .catch((err) => console.log(err))
      .finally(() => setLoading(false));
  };

  const toggleStaff = async (user) => {
    try {
      await API.patch(`/users/${user.id}/`, { is_staff: !user.is_staff });
      fetchUsers();
    } catch (err) {
      alert("Failed to update user");
    }
  };

  const deleteUser = async (id) => {
    if (!confirm("Delete this user? This cannot be undone.")) return;
    try {
      await API.delete(`/users/${id}/`);
      fetchUsers();
    } catch (err) {
      alert("Failed to delete user");
    }
  };

  const filtered = users.filter(
    (u) =>
      u.username?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const adminCount = users.filter((u) => u.is_staff).length;

  return (
    <div className="admin-page">
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <div>
            <Bus size={32} />
          </div>
          <section>
            <h2>Cambodia Bus</h2>
            <p>Admin Panel</p>
          </section>
        </div>

        <nav>
          <a onClick={() => navigate("/admin-dashboard")}>
            <Bus size={20} /> Dashboard
          </a>
          <a onClick={() => navigate("/admin-dashboard/routes")}>
            <MapPin size={20} /> Routes
          </a>
          <a onClick={() => navigate("/admin-dashboard/bookings")}>
            <Ticket size={20} /> Bookings
          </a>
          <a onClick={() => navigate("/admin-dashboard/checkin")}>
            <ClipboardCheck size={20} /> Check-In
          </a>
          <a className="active">
            <Users size={20} /> Users
          </a>
          <a onClick={() => navigate("/admin-dashboard/promotions")}>
            <Tag size={20} /> Promotions
          </a>
          <a onClick={() => navigate("/admin-dashboard/reports")}>
            <FileBarChart size={20} /> Reports
          </a>
          
        </nav>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <h1>Manage Users</h1>
            <p>View, promote, or remove user accounts.</p>
          </div>
        </header>

        <section className="admin-stats">
          <div>
            <Users />
            <span>Total Users</span>
            <h3>{loading ? "—" : users.length}</h3>
          </div>
          <div>
            <Shield />
            <span>Admins</span>
            <h3>{loading ? "—" : adminCount}</h3>
          </div>
          <div>
            <Users />
            <span>Regular Users</span>
            <h3>{loading ? "—" : users.length - adminCount}</h3>
          </div>
        </section>

        <section className="admin-card">
          <div className="card-title">
            <h2>All Users</h2>
            <p>{loading ? "Loading..." : `${filtered.length} of ${users.length}`}</p>
          </div>

          <div className="users-search">
            <Search size={18} />
            <input
              placeholder="Search by username or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="route-table">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user.id}>
                    <td>{user.username}</td>
                    <td>{user.email || "-"}</td>
                    <td>
                      <span className={`role-badge ${user.is_staff ? "admin" : ""}`}>
                        {user.is_staff ? "Admin" : "User"}
                      </span>
                    </td>
                    <td className="users-actions">
                      <button onClick={() => toggleStaff(user)}>
                        {user.is_staff ? <ShieldOff size={15} /> : <Shield size={15} />}
                        {user.is_staff ? "Revoke Admin" : "Make Admin"}
                      </button>
                      <button className="danger" onClick={() => deleteUser(user.id)}>
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}

                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan="4" className="users-empty">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}