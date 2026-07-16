module.exports = function handler(req, res) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
  };

  Object.entries(headers).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  const url = new URL(
    req.url || "/",
    `https://${req.headers.host || "localhost"}`,
  );
  const pathname = url.pathname;

  if (pathname === "/" || pathname === "/health") {
    res.status(200).json({
      status: "OK",
      message: "Pet Adoption API is running",
    });
    return;
  }

  if (pathname === "/api/health") {
    res.status(200).json({
      status: "OK",
      message: "Pet Adoption API is running",
    });
    return;
  }

  if (pathname === "/api/pets") {
    res.status(200).json({
      message: "Pet listing endpoint is ready",
      note: "This deployment uses a Vercel serverless entrypoint.",
    });
    return;
  }

  if (pathname === "/favicon.ico" || pathname === "/favicon.png") {
    res.status(204).end();
    return;
  }

  res.status(404).json({ error: "Not found" });
};
