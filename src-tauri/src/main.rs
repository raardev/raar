// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use alloy::{
    hex,
    node_bindings::anvil::{Anvil, AnvilInstance},
};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Arc;
use tauri::api::path::home_dir;
use tauri::Manager;
use tokio::sync::Mutex;

struct DevnetState {
    instance: Option<AnvilInstance>,
    logs: Arc<Mutex<Vec<String>>>,
}

#[derive(Serialize, Deserialize, Debug)]
struct DevnetInfo {
    rpc_url: String,
    chain_id: u64,
    client_version: String,
    addresses: Vec<String>,
    private_keys: Vec<String>,
}

fn find_anvil() -> Option<PathBuf> {
    let home = home_dir()?;
    let possible_paths = vec![
        home.join(".foundry/bin/anvil"),
        // PathBuf::from("/usr/local/bin/anvil"),
        // PathBuf::from("/usr/bin/anvil"),
    ];

    for path in possible_paths {
        if path.exists() {
            return Some(path);
        }
    }

    None
}

#[tauri::command]
async fn start_devnet(
    state: tauri::State<'_, Arc<Mutex<DevnetState>>>,
    app: tauri::AppHandle,
) -> Result<DevnetInfo, String> {
    let mut state = state.lock().await;
    if state.instance.is_some() {
        return Err("Devnet is already running".to_string());
    }

    // Find Anvil
    let anvil_path = find_anvil().ok_or_else(|| {
        "Anvil not found. Please ensure Foundry is installed and Anvil is in your PATH.".to_string()
    })?;

    // Spawn Anvil
    let instance = match Anvil::at(anvil_path).try_spawn() {
        Ok(inst) => inst,
        Err(e) => {
            let msg = format!("Failed to spawn Anvil instance: {}", e);
            return Err(msg);
        }
    };

    let devnet_info = DevnetInfo {
        rpc_url: instance.endpoint(),
        chain_id: instance.chain_id(),
        client_version: "Anvil".to_string(),
        addresses: instance
            .addresses()
            .iter()
            .map(|addr| format!("{:?}", addr))
            .collect(),
        private_keys: instance
            .keys()
            .iter()
            .map(|key| format!("0x{}", hex::encode(key.to_bytes())))
            .collect(),
    };

    state.instance = Some(instance);
    Ok(devnet_info)
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
    let logs = state.logs.lock().await;
    Ok(logs.clone())
}

#[tauri::command]
async fn get_devnet_wallets(
    state: tauri::State<'_, Arc<Mutex<DevnetState>>>,
) -> Result<Vec<serde_json::Value>, String> {
    let state = state.lock().await;
    if let Some(instance) = &state.instance {
        let accounts = instance.addresses();
        let private_keys = instance.keys();

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

    // Spawn Anvil with fork
    let instance = Anvil::new().fork(url).spawn();

    state.instance = Some(instance);
    Ok(())
}

#[tauri::command]
async fn get_devnet_info(
    state: tauri::State<'_, Arc<Mutex<DevnetState>>>,
) -> Result<DevnetInfo, String> {
    let state = state.lock().await;
    if let Some(instance) = &state.instance {
        Ok(DevnetInfo {
            rpc_url: instance.endpoint(),
            chain_id: instance.chain_id(),
            client_version: "Anvil".to_string(),
            addresses: instance
                .addresses()
                .iter()
                .map(|addr| format!("{:?}", addr))
                .collect(),
            private_keys: instance
                .keys()
                .iter()
                .map(|key| format!("0x{}", hex::encode(key.to_bytes())))
                .collect(),
        })
    } else {
        Err("Devnet is not running".to_string())
    }
}

fn main() {
    let devnet_state = Arc::new(Mutex::new(DevnetState {
        instance: None,
        logs: Arc::new(Mutex::new(Vec::new())),
    }));

    tauri::Builder::default()
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                let window = app.get_window("main").unwrap();
                window.open_devtools();
            }
            Ok(())
        })
        .manage(devnet_state)
        .invoke_handler(tauri::generate_handler![
            start_devnet,
            stop_devnet,
            get_devnet_status,
            get_devnet_logs,
            get_devnet_wallets,
            fork_network,
            get_devnet_info,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
