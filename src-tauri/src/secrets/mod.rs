use keyring::Entry;

const SERVICE_NAME: &str = "com.israeltoledo.obsidianaiagent";
const GEMINI_KEY_ENTRY: &str = "gemini_api_key";

#[derive(Debug, Clone, Copy)]
pub enum GeminiApiKeySource {
  OsKeychain,
  Environment,
  Missing,
}

impl GeminiApiKeySource {
  pub fn as_str(&self) -> &'static str {
    match self {
      GeminiApiKeySource::OsKeychain => "os_keychain",
      GeminiApiKeySource::Environment => "environment",
      GeminiApiKeySource::Missing => "missing",
    }
  }
}

fn gemini_entry() -> Result<Entry, String> {
  Entry::new(SERVICE_NAME, GEMINI_KEY_ENTRY)
    .map_err(|error| format!("failed to initialize keychain entry: {error}"))
}

fn read_from_keychain() -> Result<Option<String>, String> {
  let entry = gemini_entry()?;
  match entry.get_password() {
    Ok(secret) => {
      let trimmed = secret.trim().to_string();
      if trimmed.is_empty() {
        Ok(None)
      } else {
        Ok(Some(trimmed))
      }
    }
    Err(keyring::Error::NoEntry) => Ok(None),
    Err(error) => Err(format!("failed to read Gemini API key from keychain: {error}")),
  }
}

fn read_from_environment() -> Option<String> {
  std::env::var("GEMINI_API_KEY")
    .ok()
    .map(|value| value.trim().to_string())
    .filter(|value| !value.is_empty())
}

pub fn resolve_gemini_api_key() -> Result<Option<String>, String> {
  if let Some(key) = read_from_keychain()? {
    return Ok(Some(key));
  }
  Ok(read_from_environment())
}

pub fn get_gemini_api_key_source() -> Result<GeminiApiKeySource, String> {
  if read_from_keychain()?.is_some() {
    return Ok(GeminiApiKeySource::OsKeychain);
  }

  if read_from_environment().is_some() {
    return Ok(GeminiApiKeySource::Environment);
  }

  Ok(GeminiApiKeySource::Missing)
}

pub fn save_gemini_api_key(value: &str) -> Result<(), String> {
  let trimmed = value.trim();
  if trimmed.is_empty() {
    return Err("Gemini API key cannot be empty".to_string());
  }

  let entry = gemini_entry()?;
  entry
    .set_password(trimmed)
    .map_err(|error| format!("failed to save Gemini API key to keychain: {error}"))
}

pub fn clear_gemini_api_key() -> Result<(), String> {
  let entry = gemini_entry()?;
  match entry.delete_credential() {
    Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
    Err(error) => Err(format!("failed to clear Gemini API key from keychain: {error}")),
  }
}
