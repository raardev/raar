// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

use alloy::node_bindings::anvil::{Anvil, AnvilInstance};
use std::sync::Arc;
use tokio::sync::Mutex;

struct DevnetState {
    instance: Option<AnvilInstance>,
}

#[tauri::command]
async fn start_devnet(state: tauri::State<'_, Arc<Mutex<DevnetState>>>) -> Result<(), String> {
    let mut state = state.lock().await;
    if state.instance.is_some() {
        return Err("Devnet is already running".to_string());
    }

    let anvil = Anvil::new().spawn();
    state.instance = Some(anvil);
    Ok(())
}

#[tauri::command]
async fn stop_devnet(state: tauri::State<'_, Arc<Mutex<DevnetState>>>) -> Result<(), String> {
    let mut state = state.lock().await;
    if let Some(instance) = state.instance.take() {
        // AnvilInstance doesn't have a `kill` method, so we'll just drop it
        drop(instance);
    }
    Ok(())
}

#[tauri::command]
async fn get_devnet_status(
    state: tauri::State<'_, Arc<Mutex<DevnetState>>>,
) -> Result<bool, String> {
    let devnet_state = state.lock().await;
    Ok(devnet_state.instance.is_some())
}

#[tauri::command]
async fn get_devnet_logs(
    state: tauri::State<'_, Arc<Mutex<DevnetState>>>,
) -> Result<Vec<String>, String> {
    let state = state.lock().await;
    if state.instance.is_some() {
        // AnvilInstance doesn't provide direct access to logs
        // You might need to implement a custom logging solution
        Ok(vec![
            "Logs are not available through AnvilInstance".to_string()
        ])
    } else {
        Err("Devnet is not running".to_string())
    }
}

#[tauri::command]
async fn get_devnet_wallets(
    state: tauri::State<'_, Arc<Mutex<DevnetState>>>,
) -> Result<Vec<serde_json::Value>, String> {
    let state = state.lock().await;
    if let Some(instance) = &state.instance {
        let accounts = instance.addresses();
        let private_keys = instance.private_keys();

        Ok(accounts
            .into_iter()
            .zip(private_keys)
            .map(|(address, private_key)| {
                serde_json::json!({
                    "address": format!("{:?}", address),
                    "privateKey": format!("0x{}", hex::encode(private_key.to_bytes())),
                })
            })
            .collect())
    } else {
        Err("Devnet is not running".to_string())
    }
}

#[tauri::command]
async fn fork_network(
    url: String,
    state: tauri::State<'_, Arc<Mutex<DevnetState>>>,
) -> Result<(), String> {
    let mut state = state.lock().await;
    if state.instance.is_some() {
        return Err("Devnet is already running".to_string());
    }

    let anvil = Anvil::new().fork(url).spawn();
    state.instance = Some(anvil);
    Ok(())
}

fn main() {
    let devnet_state = Arc::new(Mutex::new(DevnetState { instance: None }));

    tauri::Builder::default()
        .manage(devnet_state)
        .invoke_handler(tauri::generate_handler![
            start_devnet,
            stop_devnet,
            get_devnet_status,
            get_devnet_logs,
            get_devnet_wallets,
            fork_network,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
