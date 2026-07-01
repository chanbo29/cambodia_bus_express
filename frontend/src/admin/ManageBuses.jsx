import { Bus, Edit, Trash2, Plus } from "lucide-react";

export default function ManageBuses() {
  const buses = [
    {
      id: 1,
      name: "VIP Minibus",
      plate: "PP-1234",
      seats: 18,
      route: "Phnom Penh → Siem Reap",
      status: "Active",
    },
    {
      id: 2,
      name: "Express Bus",
      plate: "PP-5678",
      seats: 35,
      route: "Phnom Penh → Sihanoukville",
      status: "Active",
    },
    {
      id: 3,
      name: "Night Sleeper",
      plate: "PP-9999",
      seats: 28,
      route: "Phnom Penh → Battambang",
      status: "Maintenance",
    },
  ];

  return (
    <div className="page">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h1>Manage Buses</h1>

        <button className="mainBtn">
          <Plus size={18} />
          Add New Bus
        </button>
      </div>

      <div className="admin-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Bus Name</th>
              <th>Plate Number</th>
              <th>Seats</th>
              <th>Route</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {buses.map((bus) => (
              <tr key={bus.id}>
                <td>{bus.id}</td>

                <td>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <Bus size={18} />
                    {bus.name}
                  </div>
                </td>

                <td>{bus.plate}</td>
                <td>{bus.seats}</td>
                <td>{bus.route}</td>

                <td>
                  <span
                    style={{
                      background:
                        bus.status === "Active"
                          ? "#dcfce7"
                          : "#fee2e2",
                      color:
                        bus.status === "Active"
                          ? "#166534"
                          : "#991b1b",
                      padding: "6px 12px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: "bold",
                    }}
                  >
                    {bus.status}
                  </span>
                </td>

                <td>
                  <button className="editBtn">
                    <Edit size={16} />
                  </button>

                  <button className="deleteBtn">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}