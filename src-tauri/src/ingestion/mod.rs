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

pub fn build_job_title(optional_title: Option<&str>, file_count: usize) -> String {
  if let Some(title) = optional_title {
    if !title.trim().is_empty() {
      return title.trim().to_owned();
    }
  }
  format!("Capture batch ({file_count} files)")
}
