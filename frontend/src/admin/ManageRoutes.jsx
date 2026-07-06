import { useEffect, useState } from "react";
import {
  Bus, MapPin, Clock, DollarSign, Plus, Pencil, Trash2, Save, X,
  Image as ImageIcon, Ticket, Users, Tag, FileBarChart, Search, ClipboardCheck, Megaphone,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "./Dashboard.css";

const CITIES    = ["Phnom Penh","Siem Reap","Battambang","Sihanoukville","Kampot"];
const BUS_TYPES = ["VIP Van","Night Bus"];
const DAYS      = [{value:1,label:"Mon"},{value:2,label:"Tue"},{value:3,label:"Wed"},{value:4,label:"Thu"},{value:5,label:"Fri"},{value:6,label:"Sat"},{value:0,label:"Sun"}];
const SEATS_BY_TYPE = { "VIP Van": 10, "Night Bus": 30 };
const DEFAULT_IMAGE_BY_TYPE = {
  "VIP Van":   "https://res.cloudinary.com/jvwlddbl/image/upload/v1782981287/4074-outside_tjn5vx.png",
  "Night Bus": "https://res.cloudinary.com/jvwlddbl/image/upload/v1782981286/3477-outside_xnuivm.png",
};

const emptyForm = { from_city:"",to_city:"",bus_type:"",departure_time:"",arrival_time:"",duration:"",price:"",seats:"" };

function calcDuration(departure, arrival) {
  if (!departure || !arrival) return "";
  const [dh, dm] = departure.split(":").map(Number);
  const [ah, am] = arrival.split(":").map(Number);
  let start = dh * 60 + dm, end = ah * 60 + am;
  if (end <= start) end += 24 * 60;
  const diff = end - start;
  return `${Math.floor(diff/60)}h ${String(diff%60).padStart(2,"0")}m`;
}

export default function ManageRoutes() {
  const navigate = useNavigate();
  const [routes, setRoutes]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm]           = useState(emptyForm);
  const [editId, setEditId]       = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [daysOfWeek, setDaysOfWeek] = useState([]);
  const [search, setSearch]       = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const toggleDay = (v) => setDaysOfWeek((p) => p.includes(v) ? p.filter((d) => d !== v) : [...p, v]);

  useEffect(() => { fetchRoutes(); }, []);
  useEffect(() => {
    const duration = calcDuration(form.departure_time, form.arrival_time);
    if (duration !== form.duration) setForm((p) => ({ ...p, duration }));
  }, [form.departure_time, form.arrival_time]);

  const fetchRoutes = () => {
    setLoading(true);
    API.get("/schedules/").then((res) => setRoutes(Array.isArray(res.data) ? res.data : [])).catch(console.log).finally(() => setLoading(false));
  };

  const totalSeats = routes.reduce((sum, i) => sum + Number(i.seats || 0), 0);
  const avgPrice   = routes.length > 0 ? (routes.reduce((sum, i) => sum + Number(i.price || 0), 0) / routes.length).toFixed(2) : 0;

  const filteredRoutes = routes.filter((i) => {
    const matchType = typeFilter === "all" || i.bus_type === typeFilter;
    const text = search.toLowerCase();
    return matchType && (!text || i.from_city?.toLowerCase().includes(text) || i.to_city?.toLowerCase().includes(text));
  });

  const openNewDrawer = () => { setEditId(null); setForm(emptyForm); setImageFile(null); setImagePreview(null); setDaysOfWeek([]); setDrawerOpen(true); };
  const openEditDrawer = (item) => {
    setEditId(item.id);
    setForm({ from_city:item.from_city||"",to_city:item.to_city||"",bus_type:item.bus_type||"",departure_time:item.departure_time||"",arrival_time:item.arrival_time||"",duration:item.duration||"",price:item.price||"",seats:item.seats||"" });
    setImageFile(null); setImagePreview(item.image||null);
    setDaysOfWeek(item.days_of_week ? item.days_of_week.split(",").map(Number).filter((n) => !isNaN(n)) : []);
    setDrawerOpen(true);
  };
  const closeDrawer = () => { setDrawerOpen(false); setEditId(null); setForm(emptyForm); setImageFile(null); setImagePreview(null); setDaysOfWeek([]); };

  const handleBusTypeChange = (type) => {
    setForm((p) => ({ ...p, bus_type: type, seats: SEATS_BY_TYPE[type] || p.seats }));
    if (!imageFile) setImagePreview(DEFAULT_IMAGE_BY_TYPE[type] || null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.from_city||!form.to_city||!form.bus_type||!form.departure_time||!form.arrival_time||!form.price) { alert("Please fill all required fields"); return; }
    if (daysOfWeek.length === 0) { alert("Please select at least one day"); return; }
    const data = new FormData();
    Object.entries({ from_city:form.from_city,to_city:form.to_city,bus_type:form.bus_type,departure_time:form.departure_time,arrival_time:form.arrival_time,duration:form.duration,price:form.price,seats:form.seats||SEATS_BY_TYPE[form.bus_type]||0,days_of_week:daysOfWeek.join(",") }).forEach(([k,v]) => data.append(k,v));
    if (imageFile) data.append("image", imageFile);
    try {
      if (editId) await API.put(`/schedules/${editId}/`, data, { headers: { "Content-Type": "multipart/form-data" } });
      else await API.post("/schedules/", data, { headers: { "Content-Type": "multipart/form-data" } });
      closeDrawer(); fetchRoutes();
    } catch (err) { alert("Failed to save: " + (err.response?.data ? JSON.stringify(err.response.data) : "Unknown error")); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this route?")) return;
    try { await API.delete(`/schedules/${id}/`); fetchRoutes(); }
    catch { alert("Failed to delete route"); }
  };

  return (
    <div className="admin-page">
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <div><Bus size={32} /></div>
          <section><h2>Cambodia Bus</h2><p>Admin Panel</p></section>
        </div>
        <nav>
          <a onClick={() => navigate("/admin-dashboard")}><Bus size={20} /> Dashboard</a>
          <a className="active"><MapPin size={20} /> Routes</a>
          <a onClick={() => navigate("/admin-dashboard/bookings")}><Ticket size={20} /> Bookings</a>
          <a onClick={() => navigate("/admin-dashboard/checkin")}><ClipboardCheck size={20} /> Check-In</a>
          <a onClick={() => navigate("/admin-dashboard/promotions")}><Tag size={20} /> Promotions</a>
          <a onClick={() => navigate("/admin-dashboard/reports")}><FileBarChart size={20} /> Reports</a>
          <a onClick={() => navigate("/admin-dashboard/announcements")}><Megaphone size={20} /> Announcements</a>
        </nav>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div><h1>Manage Routes</h1><p>Add, edit, and remove bus routes and schedules.</p></div>
          <button onClick={openNewDrawer}><Plus size={18} />New Route</button>
        </header>

        <section className="admin-stats">
          <div><MapPin /><span>Total Routes</span><h3>{routes.length}</h3></div>
          <div><Bus /><span>Total Buses</span><h3>{routes.length}</h3></div>
          <div><Clock /><span>Total Seats</span><h3>{totalSeats}</h3></div>
          <div><DollarSign /><span>Average Price</span><h3>${avgPrice}</h3></div>
        </section>

        <section className="admin-card">
          <div className="card-title">
            <h2>Route List</h2>
            <p>{loading ? "Loading..." : `${filteredRoutes.length} of ${routes.length} route(s)`}</p>
          </div>

          <div className="route-filter-bar">
            <div className="route-search-box">
              <Search size={16} />
              <input placeholder="Search by city..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="route-type-filter">
              <button className={typeFilter === "all" ? "active" : ""} onClick={() => setTypeFilter("all")}>All Types</button>
              {BUS_TYPES.map((type) => (
                <button key={type} className={typeFilter === type ? "active" : ""} onClick={() => setTypeFilter(type)}>{type}</button>
              ))}
            </div>
          </div>

          <div className="route-table">
            <table>
              <thead>
                <tr><th>Vehicle</th><th>Route</th><th>Bus Type</th><th>Departure</th><th>Arrival</th><th>Duration</th><th>Seats</th><th>Price</th><th>Action</th></tr>
              </thead>
              <tbody>
                {filteredRoutes.map((item) => (
                  <tr key={item.id}>
                    <td><img src={item.image||DEFAULT_IMAGE_BY_TYPE[item.bus_type]||DEFAULT_IMAGE_BY_TYPE["Night Bus"]} alt={item.bus_type} className="route-thumb" /></td>
                    <td><strong>{item.from_city}</strong><span>→ {item.to_city}</span></td>
                    <td>{item.bus_type}</td><td>{item.departure_time}</td><td>{item.arrival_time}</td><td>{item.duration}</td><td>{item.seats}</td><td>${item.price}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="edit-btn" onClick={() => openEditDrawer(item)}><Pencil size={16} /></button>
                        <button className="delete-btn" onClick={() => handleDelete(item.id)}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && filteredRoutes.length === 0 && (
                  <tr><td colSpan="9" className="empty-table">{routes.length === 0 ? "No routes found" : "No routes match your search/filter"}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {drawerOpen && (
        <div className="drawer-overlay" onClick={closeDrawer}>
          <div className="route-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-head">
              <h2>{editId ? "Update Route" : "Add New Route"}</h2>
              <button className="drawer-close" onClick={closeDrawer}><X size={20} /></button>
            </div>
            <form className="drawer-form" onSubmit={handleSubmit}>
              <div><label>From City *</label><select value={form.from_city} onChange={(e) => setForm({...form,from_city:e.target.value})}><option value="">Select city</option>{CITIES.map((c) => <option key={c}>{c}</option>)}</select></div>
              <div><label>To City *</label><select value={form.to_city} onChange={(e) => setForm({...form,to_city:e.target.value})}><option value="">Select city</option>{CITIES.map((c) => <option key={c}>{c}</option>)}</select></div>
              <div><label>Bus Type *</label><select value={form.bus_type} onChange={(e) => handleBusTypeChange(e.target.value)}><option value="">Select type</option>{BUS_TYPES.map((t) => <option key={t}>{t}</option>)}</select></div>
              <div><label>Vehicle Image</label><label className="image-upload-box">{imagePreview ? <img src={imagePreview} alt="Preview" /> : <div className="image-upload-empty"><ImageIcon size={20} /><span>Click to upload</span></div>}<input type="file" accept="image/*" onChange={handleImageChange} hidden /></label></div>
              <div><label>Departure Time *</label><input type="time" value={form.departure_time} onChange={(e) => setForm({...form,departure_time:e.target.value})} /></div>
              <div><label>Arrival Time *</label><input type="time" value={form.arrival_time} onChange={(e) => setForm({...form,arrival_time:e.target.value})} /></div>
              <div><label>Duration (auto)</label><input value={form.duration} readOnly placeholder="—" /></div>
              <div><label>Price per Seat *</label><input type="number" value={form.price} onChange={(e) => setForm({...form,price:e.target.value})} placeholder="12" /></div>
              <div><label>Seats (auto)</label><input value={form.seats} readOnly placeholder="—" /></div>
              <div>
                <label>Runs On *</label>
                <div className="day-picker-row">
                  {DAYS.map((day) => <button key={day.value} type="button" className={`day-picker-btn ${daysOfWeek.includes(day.value) ? "active" : ""}`} onClick={() => toggleDay(day.value)}>{day.label}</button>)}
                </div>
                <p className="day-picker-hint">This route will automatically repeat every week on the selected days.</p>
              </div>
              <button className="drawer-save-btn" type="submit"><Save size={18} />{editId ? "Update Route" : "Add Route"}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}