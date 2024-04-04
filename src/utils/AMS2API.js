const AMS2API =
  process.env.NODE_ENV === "development"
    ? "http://localhost:8000"
    : "https://skidmarktour.privatedns.org";

export default AMS2API;
