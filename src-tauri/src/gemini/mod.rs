use reqwest::blocking::Client;
use serde::Deserialize;
use serde_json::json;

#[derive(Debug, Clone)]
pub struct GeminiClient {
  http: Client,
}

#[derive(Debug, Deserialize)]
struct GeminiPart {
  text: Option<String>,
}

#[derive(Debug, Deserialize)]
struct GeminiContent {
  parts: Vec<GeminiPart>,
}

#[derive(Debug, Deserialize)]
struct GeminiCandidate {
  content: Option<GeminiContent>,
}

#[derive(Debug, Deserialize)]
struct GeminiResponse {
  candidates: Option<Vec<GeminiCandidate>>,
}

impl GeminiClient {
  pub fn new() -> Self {
    Self {
      http: Client::new(),
    }
  }

  pub fn model_health(&self) -> &'static str {
    "configured"
  }

  pub fn generate_job_summary(
    &self,
    api_key: &str,
    model: &str,
    source_files: &[String],
  ) -> Result<String, String> {
    if api_key.trim().is_empty() {
      return Err("missing Gemini API key".to_string());
    }

    let prompt = format!(
      "Summarize this ingestion batch for an Obsidian note.\n\
       Return exactly 3 concise bullet points (Portuguese).\n\
       Source files:\n{}",
      source_files
        .iter()
        .map(|item| format!("- {item}"))
        .collect::<Vec<_>>()
        .join("\n")
    );

    let url = format!(
      "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent?key={}",
      model.trim(),
      api_key.trim()
    );

    let response = self
      .http
      .post(&url)
      .json(&json!({
        "contents": [
          {
            "parts": [{ "text": prompt }]
          }
        ],
        "generationConfig": {
          "temperature": 0.2
        }
      }))
      .send()
      .map_err(|error| format!("failed to call Gemini API: {error}"))?;

    if !response.status().is_success() {
      let status = response.status();
      let body = response
        .text()
        .unwrap_or_else(|_| "unable to read response body".to_string());
      return Err(format!("Gemini API returned {status}: {body}"));
    }

    let payload: GeminiResponse = response
      .json()
      .map_err(|error| format!("failed to parse Gemini API response: {error}"))?;

    let text = payload
      .candidates
      .and_then(|mut candidates| candidates.pop())
      .and_then(|candidate| candidate.content)
      .and_then(|content| content.parts.into_iter().find_map(|part| part.text))
      .ok_or_else(|| "Gemini API response did not contain text output".to_string())?;

    Ok(text.trim().to_string())
  }
}
