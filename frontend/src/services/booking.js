import API from "./api";

// GET all bookings belonging to the logged-in user
export const getBookings = async () => {
  const response = await API.get("/bookings/");
  return response.data;
};

// POST a new booking
export const createBooking = async (payload) => {
  const response = await API.post("/bookings/", payload);
  return response.data;
};

// GET all bus schedules/routes set up by the admin
export const getSchedules = async () => {
  const response = await API.get("/schedules/");
  return response.data;
};

// GET seats already booked for a specific route + date + departure time
export const getBookedSeats = async ({ from_city, to_city, date, time }) => {
  const response = await API.get("/booked-seats/", {
    params: { from_city, to_city, date, time },
  });
  return response.data.booked_seats || [];
};

// Validate a promo code without redeeming it yet (preview only)
export const checkPromo = async (code) => {
  const response = await API.post("/check-promo/", { code });
  return response.data;
};

// GET the logged-in user's profile
export const getMyProfile = async () => {
  const response = await API.get("/profile/");
  return response.data;
};

// PUT to update full profile (all fields)
export const updateMyProfile = async (payload) => {
  const response = await API.put("/profile/", payload);
  return response.data;
};

// PATCH to update partial profile (e.g. just profile_image)
export const patchMyProfile = async (payload) => {
  const response = await API.patch("/profile/", payload);
  return response.data;
};