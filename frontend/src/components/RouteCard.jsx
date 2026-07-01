import { Bus, Clock } from "lucide-react";
import { Link } from "react-router-dom";

export default function RouteCard({ route }) {
  return (
    <div className="routeCard">
      <img src={route.image} alt={route.to} />

      <div className="routeInfo">
        <h3>{route.from}</h3>
        <p>→</p>
        <h3>{route.to}</h3>
        <span><Clock size={15} /> {route.duration}</span>
        <b>From ${route.price}.00</b>
      </div>

      <Link to={`/booking/${route.id}`} className="routeBtn">
        <Bus size={20} />
      </Link>
    </div>
  );
}