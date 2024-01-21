<?php

declare(strict_types=1);
header('Content-Type: application/json');

$uploadDir = 'images/';
$maxDirSize = 100 * 1024 * 1024; // 100MB
$maxFileSize = 15 * 1024 * 1024; // 15MB

if (!is_dir($uploadDir)) {
  if (!mkdir($uploadDir, 0755, true)) {
    echo json_encode(['success' => false, 'message' => 'Failed to create upload directory.']);
    exit;
  }
}

function checkDirSize(string $dir, int $maxSize): bool
{
  $size = 0;
  $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir));
  foreach ($iterator as $file) {
    if ($file->isFile()) {
      $size += $file->getSize();
    }
  }
  return $size > $maxSize;
}

function deleteOldFiles(string $dir): void
{
  $files = array();
  $iterator = new DirectoryIterator($dir);
  foreach ($iterator as $fileInfo) {
    if ($fileInfo->isDot() || !$fileInfo->isFile()) {
      continue;
    }
    $files[$fileInfo->getMTime()] = $fileInfo->getRealPath();
  }
  ksort($files);

  foreach ($files as $filePath) {
    if (@unlink($filePath)) {
      clearstatcache();
      if (!checkDirSize($dir, $GLOBALS['maxDirSize'])) {
        break;
      }
    }
  }
}

if (isset($_GET['clear']) && $_GET['clear'] === 'all') {
  array_map('unlink', glob($uploadDir . "*"));
  echo json_encode(['success' => true, 'message' => 'All files have been removed.']);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $image = $_FILES['image'] ?? null;
  if ($image && $image['error'] === UPLOAD_ERR_OK) {
    if ($image['size'] > $maxFileSize) {
      echo json_encode(['success' => false, 'message' => 'File size exceeds the maximum limit of 15MB.']);
      exit;
    }

    $imageInfo = @getimagesize($image['tmp_name']);
    if ($imageInfo === false) {
      echo json_encode(['success' => false, 'message' => 'Invalid file or not an image.']);
      exit;
    }

    $allowedTypes = [IMAGETYPE_JPEG => 'image/jpeg', IMAGETYPE_PNG => 'image/png'];
    $fileType = $allowedTypes[$imageInfo[2]] ?? null;
    if (!in_array($fileType, $allowedTypes)) {
      echo json_encode(['success' => false, 'message' => 'Invalid file type.']);
      exit;
    }

    if (checkDirSize($uploadDir, $maxDirSize)) {
      deleteOldFiles($uploadDir);
    }

    $fileName = time() . '_' . bin2hex(random_bytes(8)) . '.' . pathinfo($image['name'], PATHINFO_EXTENSION);
    $filePath = $uploadDir . $fileName;

    if (move_uploaded_file($image['tmp_name'], $filePath)) {
      echo json_encode(['success' => true, 'name' => $fileName]);
    } else {
      echo json_encode(['success' => false, 'message' => 'There was an error uploading your file.']);
    }
  } else {
    $message = 'No file was uploaded or there was an upload error.';
    if ($image) {
      $message = 'Upload error code: ' . $image['error'];
    }
    echo json_encode(['success' => false, 'message' => $message]);
  }
}
