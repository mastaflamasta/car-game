<?php
declare(strict_types=1);

const DATA_DIR = __DIR__ . '/../data';
const CHARACTER_DIR = DATA_DIR . '/characters';
const CHARACTER_FILE = DATA_DIR . '/characters.json';

function jsonResponse(array $payload, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function ensureStorage(): void
{
    foreach ([DATA_DIR, CHARACTER_DIR] as $directory) {
        if (!is_dir($directory) && !mkdir($directory, 0775, true) && !is_dir($directory)) {
            jsonResponse(['error' => 'Nie można utworzyć katalogu danych.'], 500);
        }
    }
}

function readCharacters(): array
{
    ensureStorage();
    if (!is_file(CHARACTER_FILE)) return [];
    $handle = fopen(CHARACTER_FILE, 'rb');
    if (!$handle) return [];
    flock($handle, LOCK_SH);
    $contents = stream_get_contents($handle) ?: '[]';
    flock($handle, LOCK_UN);
    fclose($handle);
    $decoded = json_decode($contents, true);
    return is_array($decoded) ? $decoded : [];
}

function writeCharacters(array $characters): void
{
    ensureStorage();
    $temporary = CHARACTER_FILE . '.tmp-' . bin2hex(random_bytes(4));
    $json = json_encode($characters, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false || file_put_contents($temporary, $json, LOCK_EX) === false || !rename($temporary, CHARACTER_FILE)) {
        @unlink($temporary);
        jsonResponse(['error' => 'Nie udało się zapisać danych postaci.'], 500);
    }
}

function publicCharacter(array $character): array
{
    return [
        'id' => $character['id'],
        'name' => $character['name'],
        'color' => $character['color'],
        'crop' => $character['crop'],
        'photoUrl' => 'data/characters/' . $character['photo'],
        'portraitUrl' => 'data/characters/' . $character['portrait'],
        'createdAt' => $character['createdAt'],
    ];
}
