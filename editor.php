<?php
declare(strict_types=1);
session_start([
    'cookie_httponly' => true,
    'cookie_samesite' => 'Strict',
    'use_strict_mode' => true,
]);

const EDITOR_PASSWORD = 'edytor4321';
$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['logout'])) {
    $_SESSION = [];
    session_destroy();
    header('Location: editor.php');
    exit;
}
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['password'])) {
    if (hash_equals(EDITOR_PASSWORD, (string)$_POST['password'])) {
        session_regenerate_id(true);
        $_SESSION['character_editor'] = true;
        $_SESSION['character_editor_csrf'] = bin2hex(random_bytes(24));
        header('Location: editor.php');
        exit;
    }
    $error = 'Nieprawidłowe hasło.';
}
$authorized = ($_SESSION['character_editor'] ?? false) === true;
$csrf = $authorized ? (string)($_SESSION['character_editor_csrf'] ?? '') : '';
?>
<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Edytor postaci · RoadFamily</title><link rel="stylesheet" href="editor.css?v=20261012-1"><?php if ($authorized): ?><meta name="editor-csrf" content="<?= htmlspecialchars($csrf, ENT_QUOTES, 'UTF-8') ?>"><?php endif; ?></head><body>
<?php if (!$authorized): ?>
<main class="login-shell"><section class="login-card"><span class="eyebrow">ROADFAMILY · PANEL PRYWATNY</span><h1>Edytor postaci</h1><p>Podaj hasło, aby zarządzać postaciami zapisanymi na serwerze.</p><form method="post"><label for="password">Hasło</label><input id="password" name="password" type="password" required autofocus autocomplete="current-password"><button type="submit">Otwórz edytor</button><?php if ($error !== ''): ?><p class="error" role="alert"><?= htmlspecialchars($error, ENT_QUOTES, 'UTF-8') ?></p><?php endif; ?></form><a href="./">← Wróć do gry</a></section></main>
<?php else: ?>
<header><a class="brand" href="./">▦ ROAD<span>FAMILY</span></a><div><a href="./">Wróć do gry</a><form method="post"><button name="logout" value="1" type="submit">Wyloguj</button></form></div></header><main class="editor-shell"><div class="title"><div><span class="eyebrow">ZARZĄDZANIE</span><h1>Edytor postaci</h1><p>Zmień imię lub kolor ubrania albo usuń postać z serwera.</p></div><button id="reload" type="button">Odśwież listę</button></div><p id="status" role="status" aria-live="polite"></p><section id="characters" class="character-grid" aria-live="polite"><p class="empty">Wczytywanie postaci…</p></section></main><dialog id="delete-dialog"><form method="dialog"><span class="eyebrow">POTWIERDZENIE</span><h2>Usunąć postać?</h2><p id="delete-question"></p><div><button value="cancel">Anuluj</button><button id="confirm-delete" value="confirm" class="danger">Usuń bezpowrotnie</button></div></form></dialog><script src="editor.js?v=20261012-1"></script>
<?php endif; ?>
</body></html>
