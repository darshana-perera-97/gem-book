<?php
/**
 * Database credentials — EDIT THESE after creating your MySQL database in cPanel.
 *
 * In cPanel → "MySQL Databases": create a database and a user, add the user to
 * the database with ALL PRIVILEGES, then paste the names below. On shared hosting
 * the host is almost always 'localhost'.
 */

define('DB_HOST', 'localhost');
define('DB_NAME', 'CHANGE_ME_dbname');   // e.g. cpaneluser_gembook
define('DB_USER', 'CHANGE_ME_dbuser');   // e.g. cpaneluser_gem
define('DB_PASS', 'CHANGE_ME_password');

// Absolute URL prefix where uploaded images are served from. Leave as '/uploads'
// if the app runs at the domain root; change if you host it in a subfolder.
define('UPLOAD_URL_BASE', '/uploads');
