<?php
declare(strict_types=1);
require __DIR__ . '/common.php';

$boardFile = DATA_DIR . '/school-board.png';
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (!is_file($boardFile)) { http_response_code(204); exit; }
    header('Content-Type: image/png');
    header('Content-Length: ' . filesize($boardFile));
    header('Cache-Control: no-store');
    readfile($boardFile);
    exit;
}
if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    header('Allow: GET, PUT');
    jsonResponse(['error' => 'Niedozwolona metoda.'], 405);
}
if (stripos((string)($_SERVER['CONTENT_TYPE'] ?? ''), 'image/png') !== 0) jsonResponse(['error' => 'Tablica musi być obrazem PNG.'], 415);
$image = file_get_contents('php://input');
if ($image === false || strlen($image) < 8 || strlen($image) > 5_000_000 || substr($image, 0, 8) !== "\x89PNG\r\n\x1a\n") {
    jsonResponse(['error' => 'Nieprawidłowy obraz tablicy.'], 422);
}
ensureStorage();
$temporary = $boardFile . '.tmp-' . bin2hex(random_bytes(4));
if (file_put_contents($temporary, $image, LOCK_EX) === false || !rename($temporary, $boardFile)) {
    @unlink($temporary);
    jsonResponse(['error' => 'Nie udało się zapisać tablicy.'], 500);
}
jsonResponse(['saved' => true]);
