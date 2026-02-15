use std::{
  fs,
  io::Read,
  path::{Path, PathBuf},
};

use sha2::{Digest, Sha256};

const MAX_FILE_BYTES: u64 = 2 * 1024 * 1024 * 1024;

#[derive(Debug, Clone)]
pub struct PreparedAsset {
  pub original_path: String,
  pub storage_path: String,
  pub media_type: String,
  pub mime_type: String,
  pub size_bytes: i64,
  pub sha256: String,
}

pub fn infer_media_type(file_path: &str) -> &'static str {
  let lower = file_path.to_ascii_lowercase();
  if lower.ends_with(".mp3") || lower.ends_with(".wav") || lower.ends_with(".m4a") {
    "audio"
  } else if lower.ends_with(".mp4") {
    "video"
  } else if lower.ends_with(".jpg")
    || lower.ends_with(".jpeg")
    || lower.ends_with(".png")
    || lower.ends_with(".heif")
  {
    "image"
  } else {
    "unknown"
  }
}

fn sanitize_file_name(input: &str) -> String {
  input
    .chars()
    .map(|ch| {
      if ch.is_ascii_alphanumeric() || matches!(ch, '-' | '_' | '.') {
        ch
      } else {
        '_'
      }
    })
    .collect::<String>()
}

fn detect_mime(path: &Path) -> Result<String, String> {
  let maybe_kind = infer::get_from_path(path).map_err(|error| format!("failed to detect mime: {error}"))?;
  Ok(
    maybe_kind
      .map(|kind| kind.mime_type().to_string())
      .unwrap_or_else(|| "application/octet-stream".to_string()),
  )
}

fn mime_matches_media_type(media_type: &str, mime_type: &str) -> bool {
  if mime_type == "application/octet-stream" {
    return true;
  }
  match media_type {
    "audio" => mime_type.starts_with("audio/"),
    "video" => mime_type.starts_with("video/"),
    "image" => mime_type.starts_with("image/"),
    _ => false,
  }
}

fn hash_sha256(path: &Path) -> Result<String, String> {
  let mut file = fs::File::open(path).map_err(|error| format!("failed to open file for hashing: {error}"))?;
  let mut hasher = Sha256::new();
  let mut buffer = [0_u8; 8192];

  loop {
    let count = file
      .read(&mut buffer)
      .map_err(|error| format!("failed while hashing file: {error}"))?;
    if count == 0 {
      break;
    }
    hasher.update(&buffer[..count]);
  }

  Ok(format!("{:x}", hasher.finalize()))
}

pub fn prepare_assets(file_paths: &[String], media_root: &Path, now: i64) -> Result<Vec<PreparedAsset>, String> {
  if file_paths.is_empty() {
    return Err("at least one file path is required".to_string());
  }

  let timestamp = chrono::DateTime::from_timestamp_millis(now).unwrap_or_else(chrono::Utc::now);
  let destination_dir = media_root
    .join(timestamp.format("%Y").to_string())
    .join(timestamp.format("%m").to_string());
  fs::create_dir_all(&destination_dir)
    .map_err(|error| format!("failed to create media destination directory: {error}"))?;

  file_paths
    .iter()
    .enumerate()
    .map(|(index, input_path)| {
      let source = PathBuf::from(input_path);
      let canonical_source = source
        .canonicalize()
        .map_err(|error| format!("failed to canonicalize source path '{input_path}': {error}"))?;

      let metadata = fs::metadata(&canonical_source)
        .map_err(|error| format!("failed to read file metadata '{input_path}': {error}"))?;
      if !metadata.is_file() {
        return Err(format!("path is not a file: {input_path}"));
      }

      if metadata.len() > MAX_FILE_BYTES {
        return Err(format!("file exceeds 2GB limit: {input_path}"));
      }

      let media_type = infer_media_type(input_path);
      if media_type == "unknown" {
        return Err(format!("unsupported media type for file: {input_path}"));
      }

      let mime_type = detect_mime(&canonical_source)?;
      if !mime_matches_media_type(media_type, &mime_type) {
        return Err(format!(
          "file extension/media mismatch for '{input_path}' (detected mime: {mime_type})"
        ));
      }

      let sha256 = hash_sha256(&canonical_source)?;
      let original_name = canonical_source
        .file_name()
        .and_then(|name| name.to_str())
        .unwrap_or("asset.bin");
      let safe_name = sanitize_file_name(original_name);
      let destination_file = destination_dir.join(format!("{}-{}-{}", now, index, safe_name));

      fs::copy(&canonical_source, &destination_file)
        .map_err(|error| format!("failed to copy file to app storage '{input_path}': {error}"))?;

      Ok(PreparedAsset {
        original_path: canonical_source.to_string_lossy().to_string(),
        storage_path: destination_file.to_string_lossy().to_string(),
        media_type: media_type.to_string(),
        mime_type,
        size_bytes: metadata.len() as i64,
        sha256,
      })
    })
    .collect()
}

pub fn build_job_title(optional_title: Option<&str>, file_count: usize) -> String {
  if let Some(title) = optional_title {
    if !title.trim().is_empty() {
      return title.trim().to_owned();
    }
  }
  format!("Capture batch ({file_count} files)")
}
