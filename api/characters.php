<?php
declare(strict_types=1);
require __DIR__ . '/common.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    jsonResponse(['characters' => array_map('publicCharacter', readCharacters())]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: GET, POST');
    jsonResponse(['error' => 'Niedozwolona metoda.'], 405);
}

if (empty($_POST) && empty($_FILES) && (int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 0) {
    jsonResponse(['error' => 'Zdjęcie przekracza limit wysyłania ustawiony w PHP. Wybierz mniejszy plik.'], 413);
}

$name = trim((string)($_POST['name'] ?? ''));
$color = strtolower((string)($_POST['color'] ?? ''));
$crop = json_decode((string)($_POST['crop'] ?? ''), true);
if ($name === '' || mb_strlen($name) > 40) jsonResponse(['error' => 'Imię musi mieć od 1 do 40 znaków.'], 422);
if (!preg_match('/^#[0-9a-f]{6}$/', $color)) jsonResponse(['error' => 'Nieprawidłowy kolor ubrania.'], 422);
if (!is_array($crop) || !isset($crop['x'], $crop['y'], $crop['width'], $crop['height'])) jsonResponse(['error' => 'Brak parametrów kadru.'], 422);
foreach (['x', 'y', 'width', 'height'] as $key) {
    if (!is_numeric($crop[$key]) || (float)$crop[$key] < 0) jsonResponse(['error' => 'Nieprawidłowe parametry kadru.'], 422);
    $crop[$key] = round((float)$crop[$key], 3);
}
if ($crop['width'] < 1 || $crop['height'] < 1) jsonResponse(['error' => 'Kadr jest zbyt mały.'], 422);

foreach (['photo', 'portrait'] as $field) {
    if (!isset($_FILES[$field])) jsonResponse(['error' => 'Brak pliku: ' . $field . '.'], 422);
    if ($_FILES[$field]['error'] === UPLOAD_ERR_INI_SIZE || $_FILES[$field]['error'] === UPLOAD_ERR_FORM_SIZE) jsonResponse(['error' => 'Zdjęcie przekracza limit wysyłania ustawiony w PHP.'], 413);
    if ($_FILES[$field]['error'] !== UPLOAD_ERR_OK) jsonResponse(['error' => 'Nie udało się odebrać pliku: ' . $field . '.'], 422);
    if ($_FILES[$field]['size'] > 2_000_000) jsonResponse(['error' => 'Plik jest zbyt duży.'], 413);
}

$allowed = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
$photoInfo = @getimagesize($_FILES['photo']['tmp_name']);
$portraitInfo = @getimagesize($_FILES['portrait']['tmp_name']);
if (!$photoInfo || !isset($allowed[$photoInfo['mime']]) || !$portraitInfo || $portraitInfo['mime'] !== 'image/png') {
    jsonResponse(['error' => 'Obsługiwane są zdjęcia JPG, PNG i WebP; portret musi być PNG.'], 415);
}

ensureStorage();
$id = bin2hex(random_bytes(12));
$photoName = $id . '-photo.' . $allowed[$photoInfo['mime']];
$portraitName = $id . '-portrait.png';
$photoPath = CHARACTER_DIR . '/' . $photoName;
$portraitPath = CHARACTER_DIR . '/' . $portraitName;
if (!move_uploaded_file($_FILES['photo']['tmp_name'], $photoPath) || !move_uploaded_file($_FILES['portrait']['tmp_name'], $portraitPath)) {
    @unlink($photoPath); @unlink($portraitPath);
    jsonResponse(['error' => 'Nie udało się zapisać zdjęcia.'], 500);
}

$character = ['id' => $id, 'name' => $name, 'color' => $color, 'crop' => $crop, 'photo' => $photoName, 'portrait' => $portraitName, 'createdAt' => gmdate('c')];
$characters = readCharacters();
$characters[] = $character;
writeCharacters($characters);
jsonResponse(['character' => publicCharacter($character)], 201);
