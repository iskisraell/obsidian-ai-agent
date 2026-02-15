#[derive(Debug, Clone)]
pub struct GeminiClient;

impl GeminiClient {
  pub fn new() -> Self {
    Self
  }

  pub fn model_health(&self) -> &'static str {
    "stubbed"
  }
}
