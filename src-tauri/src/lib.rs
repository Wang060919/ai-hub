use reqwest::{Client, Url};
use serde::Serialize;
use serde_json::{json, Value};

const BACKEND_UNAVAILABLE_MESSAGE: &str = "无法连接后端，请先启动 FastAPI 服务";

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

    let mut parsed_url = Url::parse(trimmed_value)
        .map_err(|_| "Backend URL is invalid. Use a value like http://127.0.0.1:8000".to_string())?;

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

async fn post_json(client: &Client, base_url: &str, path: &str, payload: Value) -> Result<Value, String> {
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

    serde_json::from_str::<Value>(&raw_text).map_err(|_| format!("{path} returned a non-JSON response"))
}

fn client() -> Result<Client, String> {
    Client::builder()
        .build()
        .map_err(|error| error.to_string())
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
async fn send_chat_message(backend_url: String, message: String) -> Result<ChatProxyResponse, String> {
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            fetch_backend_metadata,
            send_chat_message
        ])
        .run(tauri::generate_context!())
        .expect("error while running Tauri application");
}
