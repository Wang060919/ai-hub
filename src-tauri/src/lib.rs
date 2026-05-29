use reqwest::{Client, Url};
use serde::Serialize;
use serde_json::{json, Map, Value};
use std::process::{Child, Command};
use std::sync::Mutex;
use tauri::Manager;

const BACKEND_UNAVAILABLE_MESSAGE: &str = "无法连接后端，请先启动 FastAPI 服务";

struct BackendProcess(Mutex<Option<Child>>);

impl Drop for BackendProcess {
    fn drop(&mut self) {
        if let Ok(mut guard) = self.0.lock() {
            if let Some(mut child) = guard.take() {
                let _ = child.kill();
                let _ = child.wait();
            }
        }
    }
}

fn find_python() -> Option<String> {
    if let Ok(custom) = std::env::var("AI_HUB_PYTHON") {
        if !custom.is_empty() {
            return Some(custom);
        }
    }
    for name in &["python", "python3"] {
        if Command::new(name).arg("--version").output().is_ok() {
            return Some(name.to_string());
        }
    }
    None
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct MetadataProxyResponse {
    ok: bool,
    backend_url: String,
    health: Value,
    version: Value,
    skills: Value,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ChatProxyResponse {
    ok: bool,
    backend_url: String,
    chat: Value,
}

fn normalize_backend_url(raw_value: &str) -> Result<String, String> {
    let trimmed_value = raw_value.trim();
    if trimmed_value.is_empty() {
        return Err("Backend URL cannot be empty".to_string());
    }

    let mut parsed_url = Url::parse(trimmed_value).map_err(|_| {
        "Backend URL is invalid. Use a value like http://127.0.0.1:8000".to_string()
    })?;

    match parsed_url.scheme() {
        "http" | "https" => {}
        _ => {
            return Err("Backend URL must start with http:// or https://".to_string());
        }
    }

    parsed_url.set_path("");
    parsed_url.set_query(None);
    parsed_url.set_fragment(None);

    Ok(parsed_url.to_string().trim_end_matches('/').to_string())
}

async fn fetch_json(client: &Client, base_url: &str, path: &str) -> Result<Value, String> {
    let response = client
        .get(format!("{base_url}{path}"))
        .header("Accept", "application/json")
        .send()
        .await
        .map_err(|error| error.to_string())?;

    if !response.status().is_success() {
        return Err(format!("{path} returned {}", response.status().as_u16()));
    }

    response
        .json::<Value>()
        .await
        .map_err(|_| format!("{path} returned a non-JSON response"))
}

async fn post_json(
    client: &Client,
    base_url: &str,
    path: &str,
    payload: Value,
) -> Result<Value, String> {
    let response = client
        .post(format!("{base_url}{path}"))
        .header("Accept", "application/json")
        .json(&payload)
        .send()
        .await
        .map_err(|error| error.to_string())?;

    let status = response.status();
    let raw_text = response.text().await.map_err(|error| error.to_string())?;

    if !status.is_success() {
        if let Ok(json_payload) = serde_json::from_str::<Value>(&raw_text) {
            if let Some(message) = json_payload
                .get("detail")
                .and_then(Value::as_str)
                .or_else(|| json_payload.get("reply").and_then(Value::as_str))
            {
                return Err(message.to_string());
            }
        }

        return Err(format!("{path} returned {}", status.as_u16()));
    }

    if raw_text.trim().is_empty() {
        return Ok(json!({}));
    }

    serde_json::from_str::<Value>(&raw_text)
        .map_err(|_| format!("{path} returned a non-JSON response"))
}

async fn fetch_json_with_status(
    client: &Client,
    base_url: &str,
    path: &str,
) -> Result<(u16, Value), String> {
    let response = client
        .get(format!("{base_url}{path}"))
        .header("Accept", "application/json")
        .send()
        .await
        .map_err(|error| error.to_string())?;

    parse_json_response(path, response).await
}

async fn post_json_with_status(
    client: &Client,
    base_url: &str,
    path: &str,
    payload: Value,
) -> Result<(u16, Value), String> {
    let response = client
        .post(format!("{base_url}{path}"))
        .header("Accept", "application/json")
        .json(&payload)
        .send()
        .await
        .map_err(|error| error.to_string())?;

    parse_json_response(path, response).await
}

async fn parse_json_response(
    path: &str,
    response: reqwest::Response,
) -> Result<(u16, Value), String> {
    let status = response.status().as_u16();
    let raw_text = response.text().await.map_err(|error| error.to_string())?;

    if raw_text.trim().is_empty() {
        return Ok((status, json!({})));
    }

    let payload = serde_json::from_str::<Value>(&raw_text)
        .map_err(|_| format!("{path} returned a non-JSON response"))?;

    Ok((status, payload))
}

fn client() -> Result<Client, String> {
    Client::builder().build().map_err(|error| error.to_string())
}

fn positive_integer(value: Option<f64>, default_value: Option<u64>) -> Option<u64> {
    match value {
        Some(number) if number.is_finite() && number >= 1.0 => Some(number.floor() as u64),
        _ => default_value,
    }
}

fn normalize_text(value: String) -> String {
    value.trim().to_string()
}

fn normalize_kb_id(value: String) -> String {
    let kb_id = normalize_text(value);
    if kb_id.is_empty() {
        "default".to_string()
    } else {
        kb_id
    }
}

fn proxy_payload(base_url: &str, status: u16, payload: Value) -> Value {
    let mut response = Map::new();
    response.insert("ok".to_string(), json!((200..300).contains(&status)));
    response.insert("backendUrl".to_string(), json!(base_url));

    if let Value::Object(payload_object) = payload {
        response.extend(payload_object);
    } else {
        response.insert("payload".to_string(), payload);
    }

    Value::Object(response)
}

fn build_file_preview_payload(path: String, preview_chars: Option<f64>) -> Value {
    let mut payload = Map::new();
    payload.insert("path".to_string(), json!(normalize_text(path)));

    if let Some(chars) = positive_integer(preview_chars, None) {
        payload.insert("preview_chars".to_string(), json!(chars));
    }

    Value::Object(payload)
}

fn build_file_summary_payload(path: String, max_input_chars: Option<f64>) -> Value {
    let mut payload = Map::new();
    payload.insert("path".to_string(), json!(normalize_text(path)));

    if let Some(chars) = positive_integer(max_input_chars, None) {
        payload.insert("max_input_chars".to_string(), json!(chars));
    }

    Value::Object(payload)
}

fn build_knowledge_index_file_payload(path: String, kb_id: String) -> Value {
    json!({
        "path": normalize_text(path),
        "kb_id": normalize_kb_id(kb_id)
    })
}

fn build_knowledge_index_markdown_directory_payload(
    directory: String,
    kb_id: String,
    recursive: bool,
    force_reindex: bool,
    max_files: Option<f64>,
) -> Value {
    json!({
        "directory": normalize_text(directory),
        "kb_id": normalize_kb_id(kb_id),
        "recursive": recursive,
        "force_reindex": force_reindex,
        "max_files": positive_integer(max_files, Some(50)).unwrap_or(50)
    })
}

fn build_knowledge_search_payload(query: String, kb_id: String, top_k: Option<f64>) -> Value {
    json!({
        "query": normalize_text(query),
        "kb_id": normalize_kb_id(kb_id),
        "top_k": positive_integer(top_k, Some(4)).unwrap_or(4)
    })
}

fn build_knowledge_query_payload(question: String, kb_id: String, top_k: Option<f64>) -> Value {
    json!({
        "question": normalize_text(question),
        "kb_id": normalize_kb_id(kb_id),
        "top_k": positive_integer(top_k, Some(4)).unwrap_or(4)
    })
}

#[tauri::command(rename_all = "camelCase")]
async fn fetch_backend_metadata(backend_url: String) -> Result<MetadataProxyResponse, String> {
    let base_url = normalize_backend_url(&backend_url)?;
    let client = client()?;

    let health = fetch_json(&client, &base_url, "/health")
        .await
        .map_err(|message| {
            if message.contains("Backend URL") {
                message
            } else {
                BACKEND_UNAVAILABLE_MESSAGE.to_string()
            }
        })?;
    let version = fetch_json(&client, &base_url, "/version")
        .await
        .map_err(|message| {
            if message.contains("Backend URL") {
                message
            } else {
                BACKEND_UNAVAILABLE_MESSAGE.to_string()
            }
        })?;
    let skills = fetch_json(&client, &base_url, "/skills")
        .await
        .map_err(|message| {
            if message.contains("Backend URL") {
                message
            } else {
                BACKEND_UNAVAILABLE_MESSAGE.to_string()
            }
        })?;

    Ok(MetadataProxyResponse {
        ok: true,
        backend_url: base_url,
        health,
        version,
        skills,
    })
}

#[tauri::command(rename_all = "camelCase")]
async fn send_chat_message(
    backend_url: String,
    message: String,
) -> Result<ChatProxyResponse, String> {
    let base_url = normalize_backend_url(&backend_url)?;
    let trimmed_message = message.trim();

    if trimmed_message.is_empty() {
        return Err("Message cannot be empty".to_string());
    }

    let client = client()?;
    let chat = post_json(
        &client,
        &base_url,
        "/chat",
        json!({
            "message": trimmed_message,
        }),
    )
    .await
    .map_err(|message| {
        if message.contains("Backend URL") || message.contains("Message cannot be empty") {
            message
        } else {
            BACKEND_UNAVAILABLE_MESSAGE.to_string()
        }
    })?;

    Ok(ChatProxyResponse {
        ok: true,
        backend_url: base_url,
        chat,
    })
}

#[tauri::command(rename_all = "camelCase")]
async fn preview_file(
    backend_url: String,
    path: String,
    preview_chars: Option<f64>,
) -> Result<Value, String> {
    let base_url = normalize_backend_url(&backend_url)?;
    let client = client()?;
    let (status, payload) = post_json_with_status(
        &client,
        &base_url,
        "/files/preview",
        build_file_preview_payload(path, preview_chars),
    )
    .await
    .map_err(|_| BACKEND_UNAVAILABLE_MESSAGE.to_string())?;

    Ok(proxy_payload(&base_url, status, payload))
}

#[tauri::command(rename_all = "camelCase")]
async fn summarize_file(
    backend_url: String,
    path: String,
    max_input_chars: Option<f64>,
) -> Result<Value, String> {
    let base_url = normalize_backend_url(&backend_url)?;
    let client = client()?;
    let (status, payload) = post_json_with_status(
        &client,
        &base_url,
        "/files/summarize",
        build_file_summary_payload(path, max_input_chars),
    )
    .await
    .map_err(|_| BACKEND_UNAVAILABLE_MESSAGE.to_string())?;

    Ok(proxy_payload(&base_url, status, payload))
}

#[tauri::command(rename_all = "camelCase")]
async fn fetch_knowledge_status(backend_url: String) -> Result<Value, String> {
    let base_url = normalize_backend_url(&backend_url)?;
    let client = client()?;
    let (status, payload) = fetch_json_with_status(&client, &base_url, "/knowledge/status")
        .await
        .map_err(|_| BACKEND_UNAVAILABLE_MESSAGE.to_string())?;

    Ok(proxy_payload(&base_url, status, payload))
}

#[tauri::command(rename_all = "camelCase")]
async fn index_knowledge_file(
    backend_url: String,
    path: String,
    kb_id: String,
) -> Result<Value, String> {
    let base_url = normalize_backend_url(&backend_url)?;
    let client = client()?;
    let (status, payload) = post_json_with_status(
        &client,
        &base_url,
        "/knowledge/index-file",
        build_knowledge_index_file_payload(path, kb_id),
    )
    .await
    .map_err(|_| BACKEND_UNAVAILABLE_MESSAGE.to_string())?;

    Ok(proxy_payload(&base_url, status, payload))
}

#[tauri::command(rename_all = "camelCase")]
async fn index_knowledge_markdown_directory(
    backend_url: String,
    directory: String,
    kb_id: String,
    recursive: bool,
    force_reindex: bool,
    max_files: Option<f64>,
) -> Result<Value, String> {
    let base_url = normalize_backend_url(&backend_url)?;
    let client = client()?;
    let (status, payload) = post_json_with_status(
        &client,
        &base_url,
        "/knowledge/index-markdown-directory",
        build_knowledge_index_markdown_directory_payload(
            directory,
            kb_id,
            recursive,
            force_reindex,
            max_files,
        ),
    )
    .await
    .map_err(|_| BACKEND_UNAVAILABLE_MESSAGE.to_string())?;

    Ok(proxy_payload(&base_url, status, payload))
}

#[tauri::command(rename_all = "camelCase")]
async fn search_knowledge(
    backend_url: String,
    query: String,
    kb_id: String,
    top_k: Option<f64>,
) -> Result<Value, String> {
    let base_url = normalize_backend_url(&backend_url)?;
    let client = client()?;
    let (status, payload) = post_json_with_status(
        &client,
        &base_url,
        "/knowledge/search",
        build_knowledge_search_payload(query, kb_id, top_k),
    )
    .await
    .map_err(|_| BACKEND_UNAVAILABLE_MESSAGE.to_string())?;

    Ok(proxy_payload(&base_url, status, payload))
}

#[tauri::command(rename_all = "camelCase")]
async fn query_knowledge(
    backend_url: String,
    question: String,
    kb_id: String,
    top_k: Option<f64>,
) -> Result<Value, String> {
    let base_url = normalize_backend_url(&backend_url)?;
    let client = client()?;
    let (status, payload) = post_json_with_status(
        &client,
        &base_url,
        "/knowledge/query",
        build_knowledge_query_payload(question, kb_id, top_k),
    )
    .await
    .map_err(|_| BACKEND_UNAVAILABLE_MESSAGE.to_string())?;

    Ok(proxy_payload(&base_url, status, payload))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            #[cfg(not(debug_assertions))]
            {
                let port_in_use = std::net::TcpStream::connect("127.0.0.1:8000").is_ok();
                if port_in_use {
                    return Ok(());
                }

                if let Some(python) = find_python() {
                    let mut cmd = Command::new(python);
                    cmd.args([
                        "-m", "uvicorn", "backend.main:app",
                        "--host", "127.0.0.1", "--port", "8000",
                    ]);
                    #[cfg(target_os = "windows")]
                    cmd.creation_flags(0x08000000);
                    let child = cmd.spawn().ok();
                    app.manage(BackendProcess(Mutex::new(child)));
                }
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            fetch_backend_metadata,
            send_chat_message,
            preview_file,
            summarize_file,
            fetch_knowledge_status,
            index_knowledge_file,
            index_knowledge_markdown_directory,
            search_knowledge,
            query_knowledge
        ])
        .run(tauri::generate_context!())
        .expect("error while running Tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn file_preview_payload_omits_invalid_preview_chars() {
        let payload =
            build_file_preview_payload("data/scan_sandbox/a_note.txt".to_string(), Some(0.0));

        assert_eq!(
            payload,
            json!({
                "path": "data/scan_sandbox/a_note.txt"
            })
        );
    }

    #[test]
    fn knowledge_query_payload_defaults_kb_and_top_k() {
        let payload = build_knowledge_query_payload(
            "What did I save?".to_string(),
            "  ".to_string(),
            Some(0.0),
        );

        assert_eq!(
            payload,
            json!({
                "question": "What did I save?",
                "kb_id": "default",
                "top_k": 4
            })
        );
    }
}
