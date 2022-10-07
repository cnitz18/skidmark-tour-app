const AMS2API =
  process.env.NODE_ENV === "develop"
    ? "https://localhost:5000"
    : "https://skidmarktour.privatedns.org";

export default AMS2API;
