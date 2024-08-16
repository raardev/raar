// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use alloy::{
    hex,
    node_bindings::anvil::{Anvil, AnvilInstance},
};
use std::io::{BufRead, BufReader};
use std::sync::Arc;
use tokio::sync::mpsc;
use tokio::sync::Mutex;

struct DevnetState {
    instance: Option<AnvilInstance>,
    logs: Arc<Mutex<Vec<String>>>,
}

#[tauri::command]
async fn start_devnet(state: tauri::State<'_, Arc<Mutex<DevnetState>>>) -> Result<(), String> {
    let mut state = state.lock().await;
    if state.instance.is_some() {
        return Err("Devnet is already running".to_string());
    }

    let (tx, mut rx) = mpsc::channel(100);
    let logs = state.logs.clone();

    // Spawn Anvil without any additional arguments
    let mut anvil = Anvil::new().spawn();

    // Attempt to capture stdout
    match anvil.child_mut().stdout.take() {
        Some(stdout) => {
            tokio::spawn(async move {
                let reader = BufReader::new(stdout);
                for line in reader.lines() {
                    if let Ok(line) = line {
                        tx.send(line).await.expect("Failed to send log line");
                    }
                }
            });

            // Store logs in another task
            tokio::spawn(async move {
                while let Some(line) = rx.recv().await {
                    let mut logs = logs.lock().await;
                    logs.push(line);
                    if logs.len() > 1000 {
                        logs.remove(0);
                    }
                }
            });

            state.instance = Some(anvil);
            Ok(())
        }
        None => {
            // If we can't capture stdout, we'll still start Anvil but won't be able to show logs
            state.instance = Some(anvil);
            Err(
                "Unable to capture Anvil stdout. Devnet started but logs won't be available."
                    .to_string(),
            )
        }
    }
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

    let anvil = Anvil::new().fork(url).spawn();
    state.instance = Some(anvil);
    Ok(())
}

fn main() {
    let devnet_state = Arc::new(Mutex::new(DevnetState {
        instance: None,
        logs: Arc::new(Mutex::new(Vec::new())),
    }));

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
