/**
 * GemBook API — Node/Express backend with JSON-file persistence.
 * Port 3399. Data lives in ./data as one JSON array file per collection.
 */
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const express = require("express");
const multer = require("multer");

const PORT = process.env.PORT || 3399;
const DATA_DIR = path.join(__dirname, "data");
const UPLOADS_DIR = path.join(__dirname, "uploads");
const FRONTEND_BUILD = path.join(__dirname, "..", "frontend", "dist");

const COLLECTIONS = [
  "users",
  "vendors",
  "listings",
  "posts",
  "comments",
  "reviews",
  "conversations",
  "messages",
];
const PK = { users: "uid" };
const pk = (col) => PK[col] || "id";
const BOOL_FIELDS = ["verified", "featured", "seeded"];

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

function filePath(col) {
  return path.join(DATA_DIR, `${col}.json`);
}

function readCollection(col) {
  const fp = filePath(col);
  if (!fs.existsSync(fp)) {
    fs.writeFileSync(fp, "[]", "utf8");
    return [];
  }
  try {
    const raw = fs.readFileSync(fp, "utf8") || "[]";
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function writeCollection(col, rows) {
  fs.writeFileSync(filePath(col), JSON.stringify(rows, null, 2), "utf8");
}

function genId() {
  return crypto.randomBytes(12).toString("hex");
}

function nowIso() {
  return new Date().toISOString();
}

function toIso(v) {
  if (typeof v === "number") return new Date(v).toISOString();
  return v || nowIso();
}

function normalise(row) {
  for (const f of BOOL_FIELDS) {
    if (f in row) row[f] = !!row[f];
  }
  return row;
}

function findIndex(rows, col, id) {
  const key = pk(col);
  return rows.findIndex((r) => r[key] === id);
}

function getOne(col, id) {
  const rows = readCollection(col);
  const i = findIndex(rows, col, id);
  return i >= 0 ? rows[i] : null;
}

function insert(col, data) {
  const rows = readCollection(col);
  const key = pk(col);
  const id = data[key] || genId();
  const row = normalise({
    ...data,
    [key]: id,
    createdAt: toIso(data.createdAt),
  });
  if (row.lastActive) row.lastActive = toIso(row.lastActive);
  if (row.lastUpdatedAt) row.lastUpdatedAt = toIso(row.lastUpdatedAt);
  rows.push(row);
  writeCollection(col, rows);
  return row;
}

function upsert(col, data) {
  const key = pk(col);
  if (!data[key]) return insert(col, data);
  const rows = readCollection(col);
  const i = findIndex(rows, col, data[key]);
  if (i >= 0) {
    const merged = normalise({ ...rows[i], ...data });
    rows[i] = merged;
    writeCollection(col, rows);
    return merged;
  }
  return insert(col, data);
}

function update(col, id, data) {
  const rows = readCollection(col);
  const i = findIndex(rows, col, id);
  if (i < 0) return null;
  const merged = normalise({ ...rows[i], ...data, [pk(col)]: id });
  rows[i] = merged;
  writeCollection(col, rows);
  return merged;
}

function remove(col, id) {
  const rows = readCollection(col);
  const next = rows.filter((r) => r[pk(col)] !== id);
  writeCollection(col, next);
}

function phoneKey(raw) {
  let n = String(raw || "").replace(/\D/g, "");
  if (n.startsWith("94")) n = n.slice(2);
  if (n.startsWith("0")) n = n.slice(1);
  return n;
}

function listRows(col, q) {
  let rows = readCollection(col);
  if (q.ids) {
    const ids = String(q.ids).split(",");
    return rows.filter((r) => ids.includes(r[pk(col)]));
  }
  for (const f of ["vendorId", "authorId", "targetId", "postId", "conversationId", "status"]) {
    if (q[f]) rows = rows.filter((r) => r[f] === q[f]);
  }
  if (q.contact) {
    const want = phoneKey(q.contact);
    rows = rows.filter((r) => phoneKey(r.contactNumber || r.phone) === want);
    return rows;
  }
  if (q.userId) {
    rows = rows.filter(
      (r) => Array.isArray(r.participants) && r.participants.includes(q.userId)
    );
  }
  const asc = col === "messages";
  const sortKey = col === "conversations" ? "lastUpdatedAt" : "createdAt";
  rows.sort((a, b) => {
    const cmp = String(a[sortKey] || "") < String(b[sortKey] || "") ? 1 : -1;
    return asc ? -cmp : cmp;
  });
  const offset = parseInt(q.offset, 10) || 0;
  const limit = parseInt(q.limit, 10) || 20;
  return rows.slice(offset, offset + limit);
}

// Ensure empty JSON array files exist on first boot.
for (const col of COLLECTIONS) {
  if (!fs.existsSync(filePath(col))) writeCollection(col, []);
}

const app = express();
app.use(express.json({ limit: "5mb" }));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.use("/uploads", express.static(UPLOADS_DIR));
// Seed images are served from the frontend public folder in prod, and also
// available here so API responses that reference /seed/* resolve when the
// backend alone is serving the built SPA.
const seedPath = path.join(__dirname, "..", "frontend", "public", "seed");
if (fs.existsSync(seedPath)) app.use("/seed", express.static(seedPath));

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOADS_DIR,
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || ".jpg";
      cb(null, `${Date.now()}-${genId()}${ext}`);
    },
  }),
  // Images stay small; short vendor reels may be larger (mp4/webm).
  limits: { fileSize: 50 * 1024 * 1024 },
});

const api = express.Router();

api.get("/", (_req, res) => res.json({ ok: true, service: "gembook-api" }));

api.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "no file" });
  res.status(201).json({ url: `/uploads/${req.file.filename}` });
});

api.post("/seed", (req, res) => {
  for (const col of COLLECTIONS) writeCollection(col, []);
  const inserted = {};
  for (const col of ["users", "vendors", "listings", "posts"]) {
    const rows = req.body[col] || [];
    for (const row of rows) insert(col, row);
    inserted[col] = rows.length;
  }
  res.json({ ok: true, inserted });
});

api.get("/stats", (_req, res) => {
  const counts = {};
  for (const col of COLLECTIONS) counts[col] = readCollection(col).length;
  res.json(counts);
});

api.post("/like", (req, res) => {
  const { postId, uid, liked } = req.body;
  const post = getOne("posts", postId);
  if (!post) return res.status(404).json({ error: "not found" });
  let likes = (post.likes || []).filter((u) => u !== uid);
  if (liked) likes.push(uid);
  update("posts", postId, { likes, likesCount: likes.length });
  res.json({ likesCount: likes.length });
});

api.post("/follow", (req, res) => {
  const { uid, vendorId, following } = req.body;
  const user = getOne("users", uid);
  if (!user) return res.status(404).json({ error: "not found" });
  let list = (user.following || []).filter((v) => v !== vendorId);
  if (following) list.push(vendorId);
  update("users", uid, { following: list, followingCount: list.length });
  const vendor = getOne("vendors", vendorId);
  if (vendor) {
    update("vendors", vendorId, {
      followersCount: Math.max(0, (vendor.followersCount || 0) + (following ? 1 : -1)),
    });
  }
  res.json({ ok: true, following: list });
});

api.post("/comments", (req, res) => {
  const c = insert("comments", req.body);
  const post = getOne("posts", c.postId);
  if (post) update("posts", c.postId, { commentsCount: (post.commentsCount || 0) + 1 });
  res.status(201).json(c);
});

api.post("/conversations", (req, res) => {
  const { currentUser, otherUser } = req.body;
  if (currentUser.uid === otherUser.uid) {
    return res.status(400).json({ error: "cannot message yourself" });
  }
  const existing = readCollection("conversations").find(
    (c) =>
      Array.isArray(c.participants) &&
      c.participants.includes(currentUser.uid) &&
      c.participants.includes(otherUser.uid)
  );
  if (existing) return res.json({ id: existing.id });
  const conv = insert("conversations", {
    participants: [currentUser.uid, otherUser.uid],
    participantNames: {
      [currentUser.uid]: currentUser.displayName,
      [otherUser.uid]: otherUser.displayName,
    },
    participantAvatars: {
      [currentUser.uid]: currentUser.photoURL || "",
      [otherUser.uid]: otherUser.photoURL || "",
    },
    lastMessage: "",
    lastSenderId: "",
    lastUpdatedAt: nowIso(),
    unreadCount: { [currentUser.uid]: 0, [otherUser.uid]: 0 },
  });
  res.json({ id: conv.id });
});

api.post("/messages", (req, res) => {
  const msg = insert("messages", { ...req.body, readBy: [req.body.senderId] });
  const conv = getOne("conversations", req.body.conversationId);
  if (conv) {
    const unread = { ...(conv.unreadCount || {}) };
    for (const p of conv.participants) {
      if (p !== req.body.senderId) unread[p] = (unread[p] || 0) + 1;
    }
    update("conversations", conv.id, {
      lastMessage: req.body.text,
      lastSenderId: req.body.senderId,
      lastUpdatedAt: nowIso(),
      unreadCount: unread,
    });
  }
  res.status(201).json(msg);
});

api.patch("/messages/:id", (req, res) => {
  const conv = getOne("conversations", req.params.id);
  if (conv && req.body.uid) {
    const unread = { ...(conv.unreadCount || {}) };
    unread[req.body.uid] = 0;
    update("conversations", conv.id, { unreadCount: unread });
  }
  res.json({ ok: true });
});

api.get("/:col", (req, res) => {
  const col = req.params.col;
  if (!COLLECTIONS.includes(col)) return res.status(404).json({ error: "unknown resource" });
  const rows = listRows(col, req.query);
  if (req.query.contact) return res.json(rows[0] ?? null);
  res.json(rows);
});

api.get("/:col/:id", (req, res) => {
  const col = req.params.col;
  if (!COLLECTIONS.includes(col)) return res.status(404).json({ error: "unknown resource" });
  res.json(getOne(col, req.params.id) ?? { error: "not found" });
});

api.post("/:col", (req, res) => {
  const col = req.params.col;
  if (!COLLECTIONS.includes(col)) return res.status(404).json({ error: "unknown resource" });
  res.status(201).json(upsert(col, req.body));
});

api.patch("/:col/:id", (req, res) => {
  const col = req.params.col;
  if (!COLLECTIONS.includes(col)) return res.status(404).json({ error: "unknown resource" });
  const updated = update(col, req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: "not found" });
  res.json(updated);
});

api.delete("/:col/:id", (req, res) => {
  const col = req.params.col;
  if (!COLLECTIONS.includes(col)) return res.status(404).json({ error: "unknown resource" });
  remove(col, req.params.id);
  res.json({ ok: true });
});

app.use("/api", api);

if (fs.existsSync(FRONTEND_BUILD)) {
  app.use(express.static(FRONTEND_BUILD));
  app.get("/{*path}", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads") || req.path.startsWith("/seed")) {
      return next();
    }
    res.sendFile(path.join(FRONTEND_BUILD, "index.html"));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`GemBook API running at http://localhost:${PORT}`);
  console.log(`JSON data store: ${DATA_DIR}`);
});
