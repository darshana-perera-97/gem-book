const path = require("path");
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3399;
const buildPath = path.join(__dirname, "..", "frontend", "build");

app.use(express.static(buildPath));

app.get("/{*path}", (_req, res) => {
  res.sendFile(path.join(buildPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
