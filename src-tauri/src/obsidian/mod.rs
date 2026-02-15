use std::{
  fs,
  io::Write,
  path::{Path, PathBuf},
  process::Command,
};

use serde_json::Value;

use crate::models::{PublishNoteResponse, SettingsPayload};

fn sanitize_file_name(input: &str) -> String {
  input
    .chars()
    .map(|ch| {
      if ch.is_ascii_alphanumeric() || matches!(ch, '-' | '_' | ' ' | '.') {
        ch
      } else {
        '_'
      }
    })
    .collect::<String>()
    .trim()
    .replace(' ', "-")
}

fn detect_vault_from_obsidian_json() -> Option<PathBuf> {
  let app_data = std::env::var("APPDATA").ok()?;
  let obsidian_json = PathBuf::from(app_data).join("obsidian").join("obsidian.json");
  let content = fs::read_to_string(obsidian_json).ok()?;
  let parsed: Value = serde_json::from_str(&content).ok()?;
  let vaults = parsed.get("vaults")?.as_object()?;
  let first = vaults.values().next()?;
  let path = first.get("path")?.as_str()?;
  Some(PathBuf::from(path))
}

fn resolve_vault_path(settings: &SettingsPayload) -> Result<PathBuf, String> {
  if !settings.vault_path.trim().is_empty() {
    return Ok(PathBuf::from(settings.vault_path.trim()));
  }
  detect_vault_from_obsidian_json().ok_or_else(|| "could not detect obsidian vault path".to_string())
}

fn direct_write(vault_path: &Path, title: &str, markdown: &str) -> Result<String, String> {
  let canonical_vault = vault_path
    .canonicalize()
    .map_err(|error| format!("failed to canonicalize vault path: {error}"))?;

  let captures_dir = canonical_vault.join("AI Captures");
  fs::create_dir_all(&captures_dir).map_err(|error| format!("failed to create capture dir: {error}"))?;

  let safe_name = sanitize_file_name(title);
  let final_path = captures_dir.join(format!("{safe_name}.md"));
  let temp_path = captures_dir.join(format!("{safe_name}.tmp"));

  {
    let mut file =
      fs::File::create(&temp_path).map_err(|error| format!("failed to create temp note file: {error}"))?;
    file
      .write_all(markdown.as_bytes())
      .map_err(|error| format!("failed to write note content: {error}"))?;
  }

  fs::rename(&temp_path, &final_path).map_err(|error| format!("failed to atomically write note: {error}"))?;

  let canonical_note = final_path
    .canonicalize()
    .map_err(|error| format!("failed to canonicalize note path: {error}"))?;
  if !canonical_note.starts_with(&canonical_vault) {
    return Err("generated note path escaped vault boundary".to_string());
  }

  Ok(canonical_note.to_string_lossy().to_string())
}

fn try_cli_write(settings: &SettingsPayload, vault_path: &Path, title: &str, markdown: &str) -> Result<(), String> {
  let cli_path = if settings.obsidian_cli_path.trim().is_empty() {
    "obsidian"
  } else {
    settings.obsidian_cli_path.trim()
  };

  let output = Command::new(cli_path)
    .arg("note")
    .arg("create")
    .arg("--vault")
    .arg(vault_path.to_string_lossy().to_string())
    .arg("--name")
    .arg(title)
    .arg("--content")
    .arg(markdown)
    .output();

  match output {
    Ok(result) if result.status.success() => Ok(()),
    Ok(result) => {
      let stderr = String::from_utf8_lossy(&result.stderr);
      Err(format!("obsidian cli exited with error: {stderr}"))
    }
    Err(error) => Err(format!("failed to execute obsidian cli: {error}")),
  }
}

pub fn publish_note(settings: &SettingsPayload, title: &str, markdown: &str) -> Result<PublishNoteResponse, String> {
  let vault_path = resolve_vault_path(settings)?;

  if try_cli_write(settings, &vault_path, title, markdown).is_ok() {
    let note_path = vault_path.join("AI Captures").join(format!("{}.md", sanitize_file_name(title)));
    return Ok(PublishNoteResponse {
      note_path: note_path.to_string_lossy().to_string(),
      method: "cli".to_string(),
    });
  }

  let note_path = direct_write(&vault_path, title, markdown)?;
  Ok(PublishNoteResponse {
    note_path,
    method: "filesystem_fallback".to_string(),
  })
}
