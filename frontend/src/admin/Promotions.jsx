import { useEffect, useState } from "react";
import {
  Tag, Plus, Trash2, Pencil, X, Save, Percent,
} from "lucide-react";
import API from "../services/api";
import "./Dashboard.css";
import "./Promotions.css";
import AdminSidebar from "../components/AdminSidebar";

const emptyForm = {
  code: "",
  description: "",
  discount_percent: "",
  max_uses: "",
  active: true,
};

export default function Promotions() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [form, setForm]             = useState(emptyForm);
  const [editId, setEditId]         = useState(null);

  useEffect(() => { fetchPromotions(); }, []);

  const fetchPromotions = () => {
    setLoading(true);
    API.get("/promotions/")
      .then((res) => setPromotions(Array.isArray(res.data) ? res.data : []))
      .catch(console.log)
      .finally(() => setLoading(false));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.code || !form.discount_percent) {
      alert("Please fill in code and discount");
      return;
    }
    const payload = {
      code: form.code.toUpperCase(),
      description: form.description,
      discount_percent: Number(form.discount_percent),
      max_uses: form.max_uses ? Number(form.max_uses) : null,
      active: form.active,
    };
    try {
      if (editId) {
        await API.put(`/promotions/${editId}/`, payload);
      } else {
        await API.post("/promotions/", payload);
      }
      setForm(emptyForm);
      setEditId(null);
      fetchPromotions();
    } catch (err) {
      alert("Failed to save: " + (err.response?.data ? JSON.stringify(err.response.data) : "Unknown error"));
    }
  };

  const handleEdit = (promo) => {
    setEditId(promo.id);
    setForm({
      code: promo.code,
      description: promo.description || "",
      discount_percent: promo.discount_percent,
      max_uses: promo.max_uses ?? "",
      active: promo.active,
    });
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this promotion?")) return;
    try {
      await API.delete(`/promotions/${id}/`);
      fetchPromotions();
    } catch { alert("Failed to delete promotion"); }
  };

  const toggleActive = async (promo) => {
    try {
      await API.patch(`/promotions/${promo.id}/`, { active: !promo.active });
      fetchPromotions();
    } catch { alert("Failed to update promotion"); }
  };

  const cancelEdit = () => { setEditId(null); setForm(emptyForm); };

  return (
    <div className="admin-page">
      {/* ── Shared sidebar with Announcements ── */}
      <AdminSidebar />

      <main className="admin-main promo-page">
        <header className="promo-header">
          <h1><Tag size={22} />Promotions & Discount Codes</h1>
          <p>Create and manage discount codes for customers.</p>
        </header>

        <section className="promo-form-card">
          <div className="promo-card-title">
            <h2>{editId ? "Update Promotion" : "Add New Promotion"}</h2>
            {editId && (
              <button className="promo-cancel-btn" onClick={cancelEdit}>
                <X size={15} />Cancel
              </button>
            )}
          </div>

          <form className="promo-form" onSubmit={handleSubmit}>
            <div>
              <label>Promo Code *</label>
              <input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="WELCOME10"
              />
            </div>
            <div>
              <label>Description</label>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="10% off for new customers"
              />
            </div>
            <div>
              <label>Discount (%) *</label>
              <input
                type="number"
                value={form.discount_percent}
                onChange={(e) => setForm({ ...form, discount_percent: e.target.value })}
                placeholder="10"
              />
            </div>
            <div>
              <label>Usage Limit</label>
              <input
                type="number"
                min="1"
                value={form.max_uses}
                onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                placeholder="Leave blank for unlimited"
              />
            </div>
            <button className="promo-save-btn" type="submit">
              <Save size={17} />
              {editId ? "Update" : "Add Promotion"}
            </button>
          </form>
        </section>

        <section className="promo-list-card">
          <div className="promo-card-title">
            <h2>All Promotions</h2>
            <p>{loading ? "Loading..." : `${promotions.length} code(s)`}</p>
          </div>

          <div className="promo-grid">
            {promotions.map((promo) => (
              <div className={`promo-tile ${!promo.active ? "inactive" : ""}`} key={promo.id}>
                <div className="promo-tile-top">
                  <span className="promo-code">{promo.code}</span>
                  <span className="promo-discount">
                    <Percent size={13} />{promo.discount_percent}%
                  </span>
                </div>
                <p className="promo-desc">{promo.description || "No description"}</p>
                <p className="promo-usage-limit">
                  {promo.max_uses ? `Limit: ${promo.max_uses} use(s) total` : "Unlimited uses"}
                </p>
                <div className="promo-tile-actions">
                  <button onClick={() => toggleActive(promo)}>
                    {promo.active ? "Deactivate" : "Activate"}
                  </button>
                  <button onClick={() => handleEdit(promo)}><Pencil size={14} /></button>
                  <button className="danger" onClick={() => handleDelete(promo.id)}><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
            {!loading && promotions.length === 0 && (
              <p className="promo-empty">No promotions created yet.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}