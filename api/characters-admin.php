<?php
declare(strict_types=1);
session_start([
    'cookie_httponly' => true,
    'cookie_samesite' => 'Strict',
    'use_strict_mode' => true,
]);
require __DIR__ . '/common.php';

if (($_SESSION['character_editor'] ?? false) !== true) jsonResponse(['error' => 'Brak dostępu. Zaloguj się ponownie.'], 401);
$csrf = (string)($_SERVER['HTTP_X_EDITOR_CSRF'] ?? '');
if ($csrf === '' || !hash_equals((string)($_SESSION['character_editor_csrf'] ?? ''), $csrf)) jsonResponse(['error' => 'Sesja edytora wygasła. Odśwież stronę.'], 403);

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if (!in_array($method, ['PUT', 'DELETE'], true)) {
    header('Allow: PUT, DELETE');
    jsonResponse(['error' => 'Niedozwolona metoda.'], 405);
}
$input = json_decode((string)file_get_contents('php://input'), true);
if (!is_array($input)) jsonResponse(['error' => 'Nieprawidłowe dane.'], 400);
$id = (string)($input['id'] ?? '');
if (!preg_match('/^[a-f0-9]{24}$/', $id)) jsonResponse(['error' => 'Nieprawidłowy identyfikator postaci.'], 422);

$characters = readCharacters();
$index = array_search($id, array_column($characters, 'id'), true);
if ($index === false) jsonResponse(['error' => 'Nie znaleziono postaci.'], 404);

if ($method === 'PUT') {
    $name = trim((string)($input['name'] ?? ''));
    $color = strtolower((string)($input['color'] ?? ''));
    if ($name === '' || mb_strlen($name) > 12) jsonResponse(['error' => 'Imię musi mieć od 1 do 12 znaków.'], 422);
    if (!preg_match('/^#[0-9a-f]{6}$/', $color)) jsonResponse(['error' => 'Nieprawidłowy kolor ubrania.'], 422);
    $characters[$index]['name'] = $name;
    $characters[$index]['color'] = $color;
    $characters[$index]['updatedAt'] = gmdate('c');
    writeCharacters($characters);
    jsonResponse(['character' => publicCharacter($characters[$index])]);
}

$removed = $characters[$index];
array_splice($characters, $index, 1);
writeCharacters($characters);
foreach (['photo', 'portrait'] as $field) {
    $filename = basename((string)($removed[$field] ?? ''));
    if ($filename !== '') @unlink(CHARACTER_DIR . '/' . $filename);
}
jsonResponse(['deleted' => true, 'id' => $id]);
