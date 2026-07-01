import {
  MapPin,
  Phone,
  Clock,
  Navigation,
  Building2,
  Search,
} from "lucide-react";
import "./Branch.css";

export default function Branch() {
  const branches = [
    {
      id: 1,
      city: "Phnom Penh Branch",
      address: "21 France St. (47), Phnom Penh 120210",
      phone: "089 737 861",
      hours: "24/7 Hours",
      mapLink: "https://maps.app.goo.gl/FZaCbndubA5WpsVw7",
      image: "https://media.istockphoto.com/id/519306346/photo/sunset-over-phnom-penh.jpg?s=612x612&w=0&k=20&c=gMD5CoIjR-x-grpcO-ejvy3U8gp9K_qsY14LxAzdDRk=",
    },
    {
      id: 2,
      city: "Siem Reap Branch",
      address: "Chong Kao Sou, 752 NR6, Krong Siem Reap",
      phone: "063 888 999",
      hours: "24/7 Hours",
      mapLink: "https://maps.app.goo.gl/dCMyRbdnQdRs3Wjz9",
      image: "https://www.geckoroutes.com/_next/image/?url=%2Fimages%2Fwp-uploads%2F2020%2F06%2Fsiem-reap-cambodia.jpg&w=3840&q=75",
    },
    {
      id: 3,
      city: "Battambang Branch",
      address: "Sangkat, Phum Prek Mohatep, Krong Battambang",
      phone: "053 888 999",
      hours: "24/7 Hours",
      mapLink: "https://maps.app.goo.gl/ijPT7nGr6ww3dAqk9",
      image: "https://www.asiakingtravel.com/images/thumbs/2025/05/20099/484485091-954347766728937-8962258597941090426-n_1296x730xcrop.webp",
    },
    {
      id: 4,
      city: "Sihanoukville Branch",
      address: "No 644, Street Kamakor St, Preah Sihanouk",
      phone: "034 888 999",
      hours: "24/7 Hours",
      mapLink: "https://maps.app.goo.gl/G5qCCw5A6Upngr7bA",
      image: "https://www.greeneratravel.com/userfiles/850x450-sihanoukville.jpg",
    },
  ];

  return (
    <main className="branch-page">
      <section className="branch-hero">
        <span>
          <Building2 size={16} />
          OUR BRANCHES
        </span>

        <h1>Find Cambodia Bus Express Near You</h1>
        <p>
          Visit our branches for ticket support, booking information, and travel
          assistance across Cambodia.
        </p>

        <div className="branch-search">
          <Search size={20} />
          <input placeholder="Search branch by city..." />
          <button>Search</button>
        </div>
      </section>

      <section className="branch-grid">
        {branches.map((branch) => (
          <div className="branch-card" key={branch.id}>
            <img src={branch.image} alt={branch.city} />

            <div className="branch-body">
              <div className="branch-title">
                <div className="branch-icon">
                  <MapPin size={22} />
                </div>
                <div>
                  <h2>{branch.city}</h2>
                  <p>Cambodia Bus Express Branch</p>
                </div>
              </div>

              <div className="branch-info">
                <p><MapPin size={17} />{branch.address}</p>
                <p><Phone size={17} />{branch.phone}</p>
                <p><Clock size={17} />{branch.hours}</p>
              </div>

              <a href={branch.mapLink} target="_blank" rel="noopener noreferrer" className="branch-btn">
                <Navigation size={18} />
                Get Direction
              </a>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}