import { useEffect, useState } from "react";
import { Bus, MapPin, Save, Trash2, Calendar } from "lucide-react";
import API from "../services/api";
import "./ManageWeeklySchedule.css";

const DAYS = [
  { value: 0, label: "Monday" },
  { value: 1, label: "Tuesday" },
  { value: 2, label: "Wednesday" },
  { value: 3, label: "Thursday" },
  { value: 4, label: "Friday" },
  { value: 5, label: "Saturday" },
  { value: 6, label: "Sunday" },
];

export default function ManageWeeklySchedule() {
  const [schedules, setSchedules] = useState([]);
  const [fromCity, setFromCity] = useState("Phnom Penh");
  const [toCity, setToCity] = useState("Siem Reap");
  const [vehicleType, setVehicleType] = useState("Bus");
  const [departureTime, setDepartureTime] = useState("");
  const [price, setPrice] = useState("");

  // bus_count per day, keyed by day value (0-6)
  const [dayCounts, setDayCounts] = useState({
    0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0,
  });

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = () => {
    API.get("/weekly-schedules/")
      .then((res) => setSchedules(Array.isArray(res.data) ? res.data : []))
      .catch((err) => console.log(err));
  };

  const handleDayChange = (day, value) => {
    setDayCounts((prev) => ({ ...prev, [day]: Number(value) || 0 }));
  };

  const handleSave = async () => {
    if (!fromCity || !toCity) {
      alert("Please enter From and To city");
      return;
    }

    const requests = [];

    Object.entries(dayCounts).forEach(([day, count]) => {
      if (Number(count) > 0) {
        requests.push(
          API.post("/weekly-schedules/", {
            from_city: fromCity,
            to_city: toCity,
            day_of_week: Number(day),
            bus_count: Number(count),
            vehicle_type: vehicleType,
            departure_time: departureTime,
            price: price || 0,
          })
        );
      }
    });

    if (requests.length === 0) {
      alert("Set at least one day's bus count above 0");
      return;
    }

    try {
      await Promise.all(requests);
      alert("Weekly schedule saved");
      setDayCounts({ 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 });
      setDepartureTime("");
      setPrice("");
      fetchSchedules();
    } catch (err) {
      alert(
        "Failed to save: " +
          (err.response?.data ? JSON.stringify(err.response.data) : "Unknown error")
      );
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this departure entry?")) return;
    try {
      await API.delete(`/weekly-schedules/${id}/`);
      fetchSchedules();
    } catch (err) {
      console.log(err);
    }
  };

  // Group existing schedules by route, for the table below the form
  const grouped = schedules.reduce((acc, item) => {
    const key = `${item.from_city} → ${item.to_city}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <div className="weekly-page">
      <header className="weekly-header">
        <div>
          <h1>
            <Calendar size={22} />
            Weekly Departure Schedule
          </h1>
          <p>
            Set how many buses depart each day of the week for a route. This
            repeats automatically every week.
          </p>
        </div>
      </header>

      <section className="weekly-form-card">
        <div className="weekly-route-fields">
          <div>
            <label>From City</label>
            <div className="weekly-input">
              <MapPin size={16} />
              <input
                value={fromCity}
                onChange={(e) => setFromCity(e.target.value)}
                placeholder="Phnom Penh"
              />
            </div>
          </div>

          <div>
            <label>To City</label>
            <div className="weekly-input">
              <MapPin size={16} />
              <input
                value={toCity}
                onChange={(e) => setToCity(e.target.value)}
                placeholder="Siem Reap"
              />
            </div>
          </div>

          <div>
            <label>Vehicle Type</label>
            <div className="weekly-input">
              <Bus size={16} />
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
              >
                <option>VIP Van</option>
                <option>Night Bus</option>
              </select>
            </div>
          </div>

          <div>
            <label>Departure Time (optional)</label>
            <div className="weekly-input">
              <input
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                placeholder="07:30 AM"
              />
            </div>
          </div>

          <div>
            <label>Price per Seat</label>
            <div className="weekly-input">
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="12"
              />
            </div>
          </div>
        </div>

        <div className="weekly-days-grid">
          {DAYS.map((day) => (
            <div key={day.value} className="weekly-day-box">
              <label>{day.label}</label>
              <input
                type="number"
                min="0"
                value={dayCounts[day.value]}
                onChange={(e) => handleDayChange(day.value, e.target.value)}
                placeholder="0"
              />
              <span>bus(es)</span>
            </div>
          ))}
        </div>

        <button className="weekly-save-btn" onClick={handleSave}>
          <Save size={18} />
          Save Weekly Schedule
        </button>
      </section>

      <section className="weekly-list">
        <h2>Existing Weekly Schedules</h2>

        {Object.keys(grouped).length === 0 && (
          <p className="weekly-empty">No weekly schedules set yet.</p>
        )}

        {Object.entries(grouped).map(([route, items]) => (
          <div key={route} className="weekly-route-block">
            <h3>{route}</h3>

            <table className="weekly-table">
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Buses</th>
                  <th>Vehicle</th>
                  <th>Departure</th>
                  <th>Price</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items
                  .sort((a, b) => a.day_of_week - b.day_of_week)
                  .map((item) => (
                    <tr key={item.id}>
                      <td>{item.day_name}</td>
                      <td>{item.bus_count}</td>
                      <td>{item.vehicle_type}</td>
                      <td>{item.departure_time || "-"}</td>
                      <td>${item.price}</td>
                      <td>
                        <button
                          className="weekly-delete-btn"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ))}
      </section>
    </div>
  );
}