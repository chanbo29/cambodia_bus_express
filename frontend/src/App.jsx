import { useLocation } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import AppRoutes from "./routes/AppRoutes";

export default function App() {
  const location = useLocation();

  const hideLayout =
    location.pathname === "/login" || location.pathname === "/register";

  return (
    <>
      {!hideLayout && <Header />}

      <main>
        <AppRoutes />
      </main>

      {!hideLayout && <Footer />}
    </>
  );
}