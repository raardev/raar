// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use alloy::{
    hex,
    node_bindings::anvil::{Anvil, AnvilInstance},
};
use env_logger::Builder;
use log::{info, LevelFilter};
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

mod indexer;

use indexer::{CompactFreezeSummary, IndexerOptions, IndexerState, IndexerTool};

#[tauri::command]
async fn start_indexing(
    path: String,
    dataset: String,
    options: IndexerOptions,
    indexer: tauri::State<'_, Arc<IndexerTool>>,
) -> Result<CompactFreezeSummary, String> {
    indexer.start_indexing(path.into(), dataset, options).await
}

#[tauri::command]
async fn get_indexer_state(
    indexer: tauri::State<'_, Arc<IndexerTool>>,
) -> Result<IndexerState, String> {
    Ok(indexer.get_state().await)
}

#[tauri::command]
async fn set_selected_dataset(
    dataset: String,
    indexer: tauri::State<'_, Arc<IndexerTool>>,
) -> Result<(), String> {
    indexer.set_selected_dataset(dataset).await
}

#[tauri::command]
async fn get_available_datasets(
    indexer: tauri::State<'_, Arc<IndexerTool>>,
) -> Result<Vec<String>, String> {
    Ok(indexer.get_available_datasets().await)
}

#[tauri::command]
async fn subscribe_to_indexer_logs(
    indexer: tauri::State<'_, Arc<IndexerTool>>,
    window: tauri::Window,
) -> Result<(), String> {
    let mut rx = indexer.subscribe_to_logs();
    tokio::spawn(async move {
        while let Ok(log) = rx.recv().await {
            let _ = window.emit("indexer-log", log);
        }
    });
    Ok(())
}

mod chain_analyzer;

use chain_analyzer::{execute_query, QueryResult};

#[tauri::command]
fn execute_query_command(query: &str) -> Result<QueryResult, String> {
    execute_query(query).map_err(|e| e.to_string())
}

mod cast_wrapper; // Add this line to import the cast_wrapper module

use cast_wrapper::CastWrapper;

#[derive(Debug, Deserialize)]
struct CastCommand {
    cmd: String,
    args: Vec<String>,
}

#[derive(Debug, Serialize)]
struct CommandResult {
    output: String,
}

#[tauri::command]
async fn run_cast_command(command: CastCommand) -> Result<CommandResult, String> {
    let result = match command.cmd.as_str() {
        // Constants
        "max-int" => CastWrapper::max_int(&command.args[0]).map_err(|e| e.to_string())?,
        "min-int" => CastWrapper::min_int(&command.args[0]).map_err(|e| e.to_string())?,
        "max-uint" => CastWrapper::max_uint(&command.args[0]).map_err(|e| e.to_string())?,
        "address-zero" => CastWrapper::address_zero(),
        "hash-zero" => CastWrapper::hash_zero(),

        // Conversions & transformations
        "from-utf8" => CastWrapper::from_utf8(&command.args[0]),
        "to-ascii" => CastWrapper::to_ascii(&command.args[0]).map_err(|e| e.to_string())?,
        "to-utf8" => CastWrapper::to_utf8(&command.args[0]).map_err(|e| e.to_string())?,
        "from-fixed-point" => CastWrapper::from_fixed_point(&command.args[0], &command.args[1])
            .map_err(|e| e.to_string())?,
        "to-fixed-point" => CastWrapper::to_fixed_point(&command.args[0], &command.args[1])
            .map_err(|e| e.to_string())?,
        "concat-hex" => CastWrapper::concat_hex(command.args.clone()),
        "from-bin" => CastWrapper::from_bin(&command.args[0].as_bytes()),
        "to-hex-data" => CastWrapper::to_hex_data(&command.args[0]).map_err(|e| e.to_string())?,
        "to-checksum-address" => {
            CastWrapper::to_checksum_address(&command.args[0]).map_err(|e| e.to_string())?
        }
        "to-uint256" => CastWrapper::to_uint256(&command.args[0]).map_err(|e| e.to_string())?,
        "to-int256" => CastWrapper::to_int256(&command.args[0]).map_err(|e| e.to_string())?,
        "to-unit" => {
            CastWrapper::to_unit(&command.args[0], &command.args[1]).map_err(|e| e.to_string())?
        }
        "from-wei" => {
            CastWrapper::from_wei(&command.args[0], &command.args[1]).map_err(|e| e.to_string())?
        }
        "to-wei" => {
            CastWrapper::to_wei(&command.args[0], &command.args[1]).map_err(|e| e.to_string())?
        }
        "from-rlp" => CastWrapper::from_rlp(&command.args[0]).map_err(|e| e.to_string())?,
        "to-rlp" => CastWrapper::to_rlp(&command.args[0]).map_err(|e| e.to_string())?,
        "to-hex" => CastWrapper::to_hex(&command.args[0], command.args.get(1).map(|s| s.as_str()))
            .map_err(|e| e.to_string())?,
        "to-dec" => CastWrapper::to_dec(&command.args[0], command.args.get(1).map(|s| s.as_str()))
            .map_err(|e| e.to_string())?,
        "to-base" => CastWrapper::to_base(
            &command.args[0],
            command.args.get(1).map(|s| s.as_str()),
            &command.args[2],
        )
        .map_err(|e| e.to_string())?,
        "to-bytes32" => CastWrapper::to_bytes32(&command.args[0]).map_err(|e| e.to_string())?,
        "format-bytes32-string" => {
            CastWrapper::format_bytes32_string(&command.args[0]).map_err(|e| e.to_string())?
        }
        "parse-bytes32-string" => {
            CastWrapper::parse_bytes32_string(&command.args[0]).map_err(|e| e.to_string())?
        }
        "parse-bytes32-address" => {
            CastWrapper::parse_bytes32_address(&command.args[0]).map_err(|e| e.to_string())?
        }

        // ABI encoding & decoding
        "abi-decode" => CastWrapper::abi_decode(
            &command.args[0],
            &command.args[1],
            command.args.get(2).map_or(false, |s| s == "true"),
        )
        .map_err(|e| e.to_string())?,
        "abi-encode" => CastWrapper::abi_encode(
            &command.args[0],
            command.args.get(1).map_or(false, |s| s == "true"),
            &command.args[2..],
        )
        .map_err(|e| e.to_string())?,
        "calldata-decode" => CastWrapper::calldata_decode(&command.args[0], &command.args[1])
            .map_err(|e| e.to_string())?,
        "calldata-encode" => CastWrapper::calldata_encode(&command.args[0], &command.args[1..])
            .map_err(|e| e.to_string())?,

        // Misc
        "keccak" => CastWrapper::keccak(&command.args[0]).map_err(|e| e.to_string())?,
        "hash-message" => CastWrapper::hash_message(&command.args[0]),
        "sig-event" => CastWrapper::sig_event(&command.args[0]).map_err(|e| e.to_string())?,
        "left-shift" => CastWrapper::left_shift(
            &command.args[0],
            &command.args[1],
            command.args.get(2).map(|s| s.as_str()),
            &command.args[3],
        )
        .map_err(|e| e.to_string())?,
        "right-shift" => CastWrapper::right_shift(
            &command.args[0],
            &command.args[1],
            command.args.get(2).map(|s| s.as_str()),
            &command.args[3],
        )
        .map_err(|e| e.to_string())?,
        "disassemble" => CastWrapper::disassemble(&command.args[0]).map_err(|e| e.to_string())?,
        "index" => CastWrapper::index(&command.args[0], &command.args[1], &command.args[2])
            .map_err(|e| e.to_string())?,
        "index-erc7201" => {
            CastWrapper::index_erc7201(&command.args[0]).map_err(|e| e.to_string())?
        }
        "decode-transaction" => {
            CastWrapper::decode_transaction(&command.args[0]).map_err(|e| e.to_string())?
        }
        "decode-eof" => CastWrapper::decode_eof(&command.args[0]).map_err(|e| e.to_string())?,

        _ => return Err(format!("Unknown command: {}", command.cmd)),
    };

    Ok(CommandResult { output: result })
}

fn main() {
    Builder::new()
        .filter_level(LevelFilter::Debug)
        .format_timestamp(None)
        .init();

    info!("Starting application");

    let devnet_state = Arc::new(Mutex::new(DevnetState {
        instance: None,
        logs: Arc::new(Mutex::new(Vec::new())),
    }));

    let indexer = Arc::new(IndexerTool::new());

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
        .manage(indexer)
        .invoke_handler(tauri::generate_handler![
            start_devnet,
            stop_devnet,
            get_devnet_status,
            get_devnet_logs,
            get_devnet_wallets,
            fork_network,
            get_devnet_info,
            start_indexing,
            get_indexer_state,
            set_selected_dataset,
            get_available_datasets,
            subscribe_to_indexer_logs,
            execute_query_command,
            run_cast_command,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
