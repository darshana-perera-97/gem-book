/**
 * DEV SERVER ONLY.
 *
 * Serves the React app through Vite and implements the same REST API contract
 * as the production backend (api/index.php on cPanel), backed by an in-memory
 * store. This lets you run and test the entire app locally with zero setup:
 *
 *   npm run dev  →  http://localhost:3000  (visit /seed to load demo data)
 *
 * Production does NOT use this file — it uses the static dist/ build plus the
 * PHP + MySQL API in /api. Keep the two contracts in sync.
 */
import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import multer from "multer";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

type Row = Record<string, any>;
type Store = Record<string, Map<string, Row>>;

const COLLECTIONS = ["users", "vendors", "listings", "posts", "comments", "reviews", "conversations", "messages"] as const;
const PK: Record<string, string> = { users: "uid" };
const pk = (col: string) => PK[col] || "id";

const store: Store = Object.fromEntries(COLLECTIONS.map((c) => [c, new Map()])) as Store;
const genId = () => crypto.randomBytes(12).toString("hex");
const nowIso = () => new Date().toISOString();
const toIso = (v: any) => (typeof v === "number" ? new Date(v).toISOString() : v || nowIso());

/**
 * Mirrors decode_row() in api/index.php: MySQL returns 0/1 for these flags, so
 * both backends must hand the UI real booleans. (A numeric 0 in JSX renders a
 * literal "0" on the page.)
 */
const BOOL_FIELDS = ["verified", "featured", "seeded"];
function normalise(row: Row): Row {
  for (const f of BOOL_FIELDS) if (f in row) row[f] = !!row[f];
  return row;
}

function insert(col: string, data: Row): Row {
  const key = pk(col);
  const id = data[key] || genId();
  const row = normalise({ ...data, [key]: id, createdAt: toIso(data.createdAt) });
  if (row.lastActive) row.lastActive = toIso(row.lastActive);
  if (row.lastUpdatedAt) row.lastUpdatedAt = toIso(row.lastUpdatedAt);
  store[col].set(id, row);
  return row;
}
function upsert(col: string, data: Row): Row {
  const key = pk(col);
  const existing = data[key] && store[col].get(data[key]);
  if (existing) {
    const merged = normalise({ ...existing, ...data });
    store[col].set(data[key], merged);
    return merged;
  }
  return insert(col, data);
}
function listRows(col: string, q: Row): Row[] {
  let rows = [...store[col].values()];
  if (q.ids) {
    const ids = String(q.ids).split(",");
    return rows.filter((r) => ids.includes(r[pk(col)]));
  }
  for (const f of ["vendorId", "authorId", "targetId", "postId", "conversationId", "status"]) {
    if (q[f]) rows = rows.filter((r) => r[f] === q[f]);
  }
  if (q.contact) rows = rows.filter((r) => r.contactNumber === q.contact);
  if (q.userId) rows = rows.filter((r) => Array.isArray(r.participants) && r.participants.includes(q.userId));
  const asc = col === "messages";
  const sortKey = col === "conversations" ? "lastUpdatedAt" : "createdAt";
  rows.sort((a, b) => (String(a[sortKey] || "") < String(b[sortKey] || "") ? 1 : -1) * (asc ? -1 : 1));
  const offset = parseInt(q.offset) || 0;
  const limit = parseInt(q.limit) || 20;
  return rows.slice(offset, offset + limit);
}

async function startServer() {
  const app = express();
  const PORT = 3000;
  app.use(express.json({ limit: "5mb" }));

  const uploadsDir = path.join(process.cwd(), "uploads");
  fs.mkdirSync(uploadsDir, { recursive: true });
  app.use("/uploads", express.static(uploadsDir));
  const upload = multer({
    storage: multer.diskStorage({
      destination: uploadsDir,
      filename: (_req, file, cb) => cb(null, `${Date.now()}-${genId()}${path.extname(file.originalname) || ".jpg"}`),
    }),
    limits: { fileSize: 10 * 1024 * 1024 },
  });

  const api = express.Router();
  api.get("/", (_req, res) => res.json({ ok: true, service: "gembook-dev-api" }));

  api.post("/upload", upload.single("file"), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "no file" });
    res.status(201).json({ url: `/uploads/${req.file.filename}` });
  });

  api.post("/seed", (req, res) => {
    COLLECTIONS.forEach((c) => store[c].clear());
    const inserted: Row = {};
    for (const col of ["users", "vendors", "listings", "posts"]) {
      (req.body[col] || []).forEach((row: Row) => insert(col, row));
      inserted[col] = (req.body[col] || []).length;
    }
    res.json({ ok: true, inserted });
  });

  api.get("/stats", (_req, res) =>
    res.json(Object.fromEntries(COLLECTIONS.map((c) => [c, store[c].size])))
  );

  api.post("/like", (req, res) => {
    const { postId, uid, liked } = req.body;
    const post = store.posts.get(postId);
    if (!post) return res.status(404).json({ error: "not found" });
    let likes: string[] = (post.likes || []).filter((u: string) => u !== uid);
    if (liked) likes.push(uid);
    Object.assign(post, { likes, likesCount: likes.length });
    res.json({ likesCount: likes.length });
  });

  api.post("/follow", (req, res) => {
    const { uid, vendorId, following } = req.body;
    const user = store.users.get(uid);
    if (!user) return res.status(404).json({ error: "not found" });
    let list: string[] = (user.following || []).filter((v: string) => v !== vendorId);
    if (following) list.push(vendorId);
    Object.assign(user, { following: list, followingCount: list.length });
    const vendor = store.vendors.get(vendorId);
    if (vendor) vendor.followersCount = Math.max(0, (vendor.followersCount || 0) + (following ? 1 : -1));
    res.json({ ok: true, following: list });
  });

  api.post("/comments", (req, res) => {
    const c = insert("comments", req.body);
    const post = store.posts.get(c.postId);
    if (post) post.commentsCount = (post.commentsCount || 0) + 1;
    res.status(201).json(c);
  });

  api.post("/conversations", (req, res) => {
    const { currentUser, otherUser } = req.body;
    if (currentUser.uid === otherUser.uid) return res.status(400).json({ error: "cannot message yourself" });
    const existing = [...store.conversations.values()].find(
      (c) => c.participants.includes(currentUser.uid) && c.participants.includes(otherUser.uid)
    );
    if (existing) return res.json({ id: existing.id });
    const conv = insert("conversations", {
      participants: [currentUser.uid, otherUser.uid],
      participantNames: { [currentUser.uid]: currentUser.displayName, [otherUser.uid]: otherUser.displayName },
      participantAvatars: { [currentUser.uid]: currentUser.photoURL || "", [otherUser.uid]: otherUser.photoURL || "" },
      lastMessage: "", lastSenderId: "", lastUpdatedAt: nowIso(),
      unreadCount: { [currentUser.uid]: 0, [otherUser.uid]: 0 },
    });
    res.json({ id: conv.id });
  });

  api.post("/messages", (req, res) => {
    const msg = insert("messages", { ...req.body, readBy: [req.body.senderId] });
    const conv = store.conversations.get(req.body.conversationId);
    if (conv) {
      conv.lastMessage = req.body.text;
      conv.lastSenderId = req.body.senderId;
      conv.lastUpdatedAt = nowIso();
      for (const p of conv.participants) {
        if (p !== req.body.senderId) conv.unreadCount[p] = (conv.unreadCount[p] || 0) + 1;
      }
    }
    res.status(201).json(msg);
  });

  api.patch("/messages/:id", (req, res) => {
    const conv = store.conversations.get(req.params.id);
    if (conv && req.body.uid) conv.unreadCount[req.body.uid] = 0;
    res.json({ ok: true });
  });

  // Generic collection routes (users/vendors/listings/posts/reviews/comments/conversations/messages).
  api.get("/:col", (req, res) => {
    const col = req.params.col;
    if (!COLLECTIONS.includes(col as any)) return res.status(404).json({ error: "unknown resource" });
    const rows = listRows(col, req.query as Row);
    // Single-row lookups by contact mirror the PHP behaviour.
    if (req.query.contact) return res.json(rows[0] ?? null);
    res.json(rows);
  });
  api.get("/:col/:id", (req, res) => {
    const col = req.params.col;
    if (!COLLECTIONS.includes(col as any)) return res.status(404).json({ error: "unknown resource" });
    res.json(store[col].get(req.params.id) ?? { error: "not found" });
  });
  api.post("/:col", (req, res) => {
    const col = req.params.col;
    if (!COLLECTIONS.includes(col as any)) return res.status(404).json({ error: "unknown resource" });
    res.status(201).json(upsert(col, req.body));
  });
  api.patch("/:col/:id", (req, res) => {
    const col = req.params.col;
    const existing = store[col]?.get(req.params.id);
    if (!existing) return res.status(404).json({ error: "not found" });
    Object.assign(existing, req.body, { [pk(col)]: req.params.id });
    res.json(existing);
  });
  api.delete("/:col/:id", (req, res) => {
    store[req.params.col]?.delete(req.params.id);
    res.json({ ok: true });
  });

  app.use("/api", api);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
