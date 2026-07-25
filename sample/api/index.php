<?php
/**
 * GemBook API — single-file PHP + MySQL backend for cPanel shared hosting.
 * All requests are routed here by api/.htaccess as ?path=<resource>/<id>.
 */

require __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET,POST,PATCH,PUT,DELETE,OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

// ---- helpers ---------------------------------------------------------------
function pdo() {
  static $pdo = null;
  if ($pdo === null) {
    $pdo = new PDO(
      'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
      DB_USER, DB_PASS,
      [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
    );
  }
  return $pdo;
}
function out($data, $code = 200) { http_response_code($code); echo json_encode($data); exit; }
function body() { $b = json_decode(file_get_contents('php://input'), true); return is_array($b) ? $b : []; }
function gen_id() { return bin2hex(random_bytes(12)); }
function now_ms() { return round(microtime(true) * 1000); }

$JSON_COLS = [
  'users' => ['following'],
  'vendors' => [],
  'listings' => ['images'],
  'posts' => ['media', 'likes'],
  'comments' => [],
  'reviews' => [],
  'conversations' => ['participants', 'participantNames', 'participantAvatars', 'unreadCount'],
  'messages' => ['readBy'],
];
$INT_COLS = ['followersCount','followingCount','reviewCount','likesCount','ratingsCount','commentsCount','sharesCount','seeded','featured','verified'];
$FLOAT_COLS = ['price','rating','averageRating'];
$TIME_COLS = ['createdAt','lastActive','lastUpdatedAt'];
$COLUMNS = [
  'users' => ['uid','displayName','contactNumber','phone','email','photoURL','role','bio','followersCount','followingCount','following','vendorStatus','seeded','createdAt','lastActive'],
  'vendors' => ['id','userId','companyName','logo','coverImage','description','location','rating','reviewCount','followersCount','verified','verificationLevel','contactEmail','phone','website','seeded','createdAt'],
  'listings' => ['id','vendorId','title','description','price','currency','images','status','featured','seeded','createdAt'],
  'posts' => ['id','authorId','authorName','authorAvatar','authorType','content','media','likesCount','likes','ratingsCount','averageRating','commentsCount','sharesCount','type','category','seeded','createdAt'],
  'comments' => ['id','postId','authorId','authorName','authorAvatar','content','createdAt'],
  'reviews' => ['id','targetId','authorId','authorName','authorAvatar','rating','content','createdAt'],
  'conversations' => ['id','participants','participantNames','participantAvatars','lastMessage','lastSenderId','lastUpdatedAt','unreadCount'],
  'messages' => ['id','conversationId','senderId','senderName','text','readBy','createdAt'],
];
$PK = ['users'=>'uid','vendors'=>'id','listings'=>'id','posts'=>'id','comments'=>'id','reviews'=>'id','conversations'=>'id','messages'=>'id'];

function decode_row($table, $row) {
  global $JSON_COLS, $INT_COLS, $FLOAT_COLS, $TIME_COLS;
  if (!$row) return $row;
  foreach ($JSON_COLS[$table] as $c) { if (isset($row[$c])) $row[$c] = json_decode($row[$c], true); }
  foreach ($INT_COLS as $c) { if (isset($row[$c])) $row[$c] = intval($row[$c]); }
  foreach ($FLOAT_COLS as $c) { if (isset($row[$c])) $row[$c] = floatval($row[$c]); }
  foreach (['verified','featured','seeded'] as $c) { if (isset($row[$c])) $row[$c] = (bool)$row[$c]; }
  foreach ($TIME_COLS as $c) { if (isset($row[$c]) && is_numeric($row[$c])) $row[$c] = gmdate('c', intval($row[$c] / 1000)); }
  return $row;
}
function prep_write($table, $data, $isSeed = false) {
  global $JSON_COLS, $COLUMNS;
  $cols = $COLUMNS[$table];
  $row = [];
  foreach ($cols as $c) {
    if (!array_key_exists($c, $data)) continue;
    $v = $data[$c];
    if (in_array($c, $JSON_COLS[$table]) && (is_array($v) || is_null($v))) $v = json_encode($v);
    if (in_array($c, ['createdAt','lastActive','lastUpdatedAt']) && !is_numeric($v)) $v = $v ? strtotime($v) * 1000 : now_ms();
    $row[$c] = $v;
  }
  return $row;
}
function insert_row($table, $data) {
  global $PK;
  $pk = $PK[$table];
  if (empty($data[$pk])) $data[$pk] = gen_id();
  if (!isset($data['createdAt'])) $data['createdAt'] = now_ms();
  $row = prep_write($table, $data);
  $keys = array_keys($row);
  $ph = array_map(fn($k) => ':' . $k, $keys);
  $sql = "INSERT INTO `$table` (`" . implode('`,`', $keys) . "`) VALUES (" . implode(',', $ph) . ")";
  $stmt = pdo()->prepare($sql);
  foreach ($row as $k => $v) $stmt->bindValue(':' . $k, $v);
  $stmt->execute();
  return get_one($table, $data[$pk]);
}
function update_row($table, $id, $data) {
  global $PK;
  $row = prep_write($table, $data);
  unset($row[$PK[$table]]);
  if (!$row) return get_one($table, $id);
  $sets = implode(',', array_map(fn($k) => "`$k`=:$k", array_keys($row)));
  $stmt = pdo()->prepare("UPDATE `$table` SET $sets WHERE `{$PK[$table]}`=:_id");
  foreach ($row as $k => $v) $stmt->bindValue(':' . $k, $v);
  $stmt->bindValue(':_id', $id);
  $stmt->execute();
  return get_one($table, $id);
}
function upsert_row($table, $data) {
  global $PK;
  $pk = $PK[$table];
  if (!empty($data[$pk]) && get_one($table, $data[$pk])) return update_row($table, $data[$pk], $data);
  return insert_row($table, $data);
}
function get_one($table, $id) {
  global $PK;
  $stmt = pdo()->prepare("SELECT * FROM `$table` WHERE `{$PK[$table]}`=? LIMIT 1");
  $stmt->execute([$id]);
  $r = $stmt->fetch();
  return $r ? decode_row($table, $r) : null;
}
function delete_row($table, $id) {
  global $PK;
  pdo()->prepare("DELETE FROM `$table` WHERE `{$PK[$table]}`=?")->execute([$id]);
}
function list_rows($table, $where = '', $params = [], $order = 'createdAt DESC', $limit = 20, $offset = 0) {
  $sql = "SELECT * FROM `$table`" . ($where ? " WHERE $where" : '') . " ORDER BY $order LIMIT " . intval($limit) . " OFFSET " . intval($offset);
  $stmt = pdo()->prepare($sql);
  $stmt->execute($params);
  return array_map(fn($r) => decode_row($table, $r), $stmt->fetchAll());
}

// ---- routing ---------------------------------------------------------------
$path = trim($_GET['path'] ?? '', '/');
$parts = $path === '' ? [] : explode('/', $path);
$resource = $parts[0] ?? '';
$id = isset($parts[1]) ? urldecode($parts[1]) : null;
$method = $_SERVER['REQUEST_METHOD'];
$q = $_GET;

try {
  switch ($resource) {
    case '': out(['ok' => true, 'service' => 'gembook-api']);

    case 'upload': handle_upload(); break;
    case 'seed': handle_seed(); break;
    case 'follow': handle_follow(); break;
    case 'like': handle_like(); break;
    case 'stats': handle_stats(); break;

    case 'users': route_users($method, $id, $q); break;
    case 'vendors': route_generic('vendors', $method, $id, $q); break;
    case 'listings': route_generic('listings', $method, $id, $q); break;
    case 'posts': route_generic('posts', $method, $id, $q); break;
    case 'reviews': route_generic('reviews', $method, $id, $q); break;
    case 'comments': route_comments($method, $id, $q); break;
    case 'conversations': route_conversations($method, $id, $q); break;
    case 'messages': route_messages($method, $id, $q); break;

    default: out(['error' => 'unknown resource'], 404);
  }
} catch (Throwable $e) {
  out(['error' => $e->getMessage()], 500);
}

// ---- generic resource ------------------------------------------------------
function route_generic($table, $method, $id, $q) {
  $limit = intval($q['limit'] ?? 20);
  $offset = intval($q['offset'] ?? 0);
  if ($method === 'GET' && $id) out(get_one($table, $id) ?: ['error' => 'not found']);
  if ($method === 'GET') {
    // Batch by ids (used by the vendor cache).
    if (!empty($q['ids'])) {
      $ids = array_filter(explode(',', $q['ids']));
      if (!$ids) out([]);
      $ph = implode(',', array_fill(0, count($ids), '?'));
      $pk = ['vendors'=>'id','users'=>'uid','listings'=>'id','posts'=>'id','reviews'=>'id'][$table] ?? 'id';
      out(list_rows($table, "`$pk` IN ($ph)", array_values($ids), 'createdAt DESC', 100, 0));
    }
    $where = ''; $params = [];
    foreach (['vendorId','authorId','targetId','status'] as $f) {
      if (isset($q[$f])) { $where = "`$f`=?"; $params[] = $q[$f]; break; }
    }
    out(list_rows($table, $where, $params, 'createdAt DESC', $limit, $offset));
  }
  // POST upserts: the client uses it both to create records and to save edits
  // (profile updates, vendor storefronts), so a plain INSERT would collide on
  // the primary key. Must stay in sync with the dev server in server.ts.
  if ($method === 'POST') out(upsert_row($table, body()), 201);
  if ($method === 'PATCH' || $method === 'PUT') out(update_row($table, $id, body()));
  if ($method === 'DELETE') { delete_row($table, $id); out(['ok' => true]); }
  out(['error' => 'method not allowed'], 405);
}

function route_users($method, $id, $q) {
  if ($method === 'GET' && $id) out(get_one('users', $id) ?: ['error' => 'not found']);
  if ($method === 'GET' && !empty($q['contact'])) {
    $rows = list_rows('users', '`contactNumber`=?', [$q['contact']], 'createdAt DESC', 1, 0);
    out($rows[0] ?? null);
  }
  route_generic('users', $method, $id, $q);
}

function route_comments($method, $id, $q) {
  if ($method === 'GET') {
    $where = isset($q['postId']) ? '`postId`=?' : '';
    $params = isset($q['postId']) ? [$q['postId']] : [];
    out(list_rows('comments', $where, $params, 'createdAt DESC', intval($q['limit'] ?? 20), 0));
  }
  if ($method === 'POST') {
    $c = insert_row('comments', body());
    if (!empty($c['postId'])) pdo()->prepare("UPDATE `posts` SET `commentsCount`=`commentsCount`+1 WHERE `id`=?")->execute([$c['postId']]);
    out($c, 201);
  }
  if ($method === 'DELETE') { delete_row('comments', $id); out(['ok' => true]); }
  out(['error' => 'method not allowed'], 405);
}

function route_conversations($method, $id, $q) {
  if ($method === 'GET' && !empty($q['userId'])) {
    $stmt = pdo()->prepare("SELECT * FROM `conversations` WHERE `participants` LIKE ? ORDER BY `lastUpdatedAt` DESC LIMIT 100");
    $stmt->execute(['%"' . $q['userId'] . '"%']);
    out(array_map(fn($r) => decode_row('conversations', $r), $stmt->fetchAll()));
  }
  if ($method === 'GET' && $id) out(get_one('conversations', $id) ?: ['error' => 'not found']);
  if ($method === 'POST') {
    // Start or reuse a 1:1 conversation.
    $b = body();
    $me = $b['currentUser']; $other = $b['otherUser'];
    if ($me['uid'] === $other['uid']) out(['error' => 'cannot message yourself'], 400);
    $stmt = pdo()->prepare("SELECT * FROM `conversations` WHERE `participants` LIKE ? AND `participants` LIKE ? LIMIT 1");
    $stmt->execute(['%"' . $me['uid'] . '"%', '%"' . $other['uid'] . '"%']);
    $existing = $stmt->fetch();
    if ($existing) out(['id' => $existing['id']]);
    $conv = insert_row('conversations', [
      'participants' => [$me['uid'], $other['uid']],
      'participantNames' => [$me['uid'] => $me['displayName'], $other['uid'] => $other['displayName']],
      'participantAvatars' => [$me['uid'] => $me['photoURL'] ?? '', $other['uid'] => $other['photoURL'] ?? ''],
      'lastMessage' => '', 'lastSenderId' => '', 'lastUpdatedAt' => now_ms(),
      'unreadCount' => [$me['uid'] => 0, $other['uid'] => 0],
    ]);
    out(['id' => $conv['id']]);
  }
  out(['error' => 'method not allowed'], 405);
}

function route_messages($method, $id, $q) {
  if ($method === 'GET') {
    if (empty($q['conversationId'])) out([]);
    out(list_rows('messages', '`conversationId`=?', [$q['conversationId']], 'createdAt ASC', 200, 0));
  }
  if ($method === 'POST') {
    $b = body();
    $b['readBy'] = [$b['senderId']];
    $msg = insert_row('messages', $b);
    // Update the parent conversation summary + unread counter for the recipient.
    $conv = get_one('conversations', $b['conversationId']);
    if ($conv) {
      $unread = $conv['unreadCount'] ?: [];
      foreach ($conv['participants'] as $p) {
        if ($p !== $b['senderId']) $unread[$p] = ($unread[$p] ?? 0) + 1;
      }
      update_row('conversations', $conv['id'], [
        'lastMessage' => $b['text'], 'lastSenderId' => $b['senderId'],
        'lastUpdatedAt' => now_ms(), 'unreadCount' => $unread,
      ]);
    }
    out($msg, 201);
  }
  if ($method === 'PATCH' && $id) {
    // Mark read: reset this user's unread counter.
    $b = body();
    $conv = get_one('conversations', $id);
    if ($conv && !empty($b['uid'])) {
      $unread = $conv['unreadCount'] ?: [];
      $unread[$b['uid']] = 0;
      update_row('conversations', $id, ['unreadCount' => $unread]);
    }
    out(['ok' => true]);
  }
  out(['error' => 'method not allowed'], 405);
}

// ---- special actions -------------------------------------------------------
function handle_like() {
  $b = body();
  $post = get_one('posts', $b['postId']);
  if (!$post) out(['error' => 'not found'], 404);
  $likes = $post['likes'] ?: [];
  $likes = array_values(array_filter($likes, fn($u) => $u !== $b['uid']));
  if (!empty($b['liked'])) $likes[] = $b['uid'];
  update_row('posts', $post['id'], ['likes' => $likes, 'likesCount' => count($likes)]);
  out(['likesCount' => count($likes)]);
}

function handle_follow() {
  $b = body();
  $user = get_one('users', $b['uid']);
  if (!$user) out(['error' => 'not found'], 404);
  $following = $user['following'] ?: [];
  $following = array_values(array_filter($following, fn($v) => $v !== $b['vendorId']));
  if (!empty($b['following'])) $following[] = $b['vendorId'];
  update_row('users', $user['uid'], ['following' => $following, 'followingCount' => count($following)]);
  $delta = !empty($b['following']) ? 1 : -1;
  pdo()->prepare("UPDATE `vendors` SET `followersCount`=GREATEST(0,`followersCount`+?) WHERE `id`=?")->execute([$delta, $b['vendorId']]);
  out(['ok' => true, 'following' => $following]);
}

function handle_upload() {
  if (empty($_FILES['file'])) out(['error' => 'no file'], 400);
  $f = $_FILES['file'];
  if ($f['error'] !== UPLOAD_ERR_OK) out(['error' => 'upload failed'], 400);
  if ($f['size'] > 10 * 1024 * 1024) out(['error' => 'file too large'], 400);
  $info = @getimagesize($f['tmp_name']);
  if (!$info) out(['error' => 'not an image'], 400);
  $ext = ['image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp','image/gif'=>'gif'][$info['mime']] ?? 'jpg';
  $dir = __DIR__ . '/../uploads';
  if (!is_dir($dir)) @mkdir($dir, 0755, true);
  $name = date('Ymd') . '-' . gen_id() . '.' . $ext;
  if (!move_uploaded_file($f['tmp_name'], "$dir/$name")) out(['error' => 'could not save'], 500);
  out(['url' => rtrim(UPLOAD_URL_BASE, '/') . '/' . $name], 201);
}

function handle_stats() {
  $tables = ['users','vendors','listings','posts','comments','reviews','conversations'];
  $counts = [];
  foreach ($tables as $t) $counts[$t] = intval(pdo()->query("SELECT COUNT(*) FROM `$t`")->fetchColumn());
  out($counts);
}

function handle_seed() {
  $b = body();
  // Wipe everything, then bulk-insert the provided dataset.
  foreach (['messages','conversations','reviews','comments','posts','listings','vendors','users'] as $t) {
    pdo()->exec("DELETE FROM `$t`");
  }
  $counts = [];
  foreach (['users','vendors','listings','posts'] as $t) {
    $rows = $b[$t] ?? [];
    foreach ($rows as $row) insert_row($t, $row);
    $counts[$t] = count($rows);
  }
  out(['ok' => true, 'inserted' => $counts]);
}
