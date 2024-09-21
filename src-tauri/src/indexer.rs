use cryo_cli::{run, Args};
use cryo_freeze::FreezeSummary;
use log::{debug, error, info, Metadata, Record};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::broadcast;
use tokio::sync::Mutex;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct IndexerState {
    indexing_progress: f32,
    log_messages: Vec<String>,
    available_datasets: Vec<String>,
    selected_dataset: Option<String>,
    summary: Option<String>,
    indexed_dirs: Vec<String>,
    indexed_files: Vec<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IndexerOptions {
    // Basic options
    pub datatype: Vec<String>,
    pub rpc: Option<String>,
    pub output_dir: String,

    // Content options
    pub blocks: Option<Vec<String>>,
    pub timestamps: Option<Vec<String>>,
    pub txs: Option<Vec<String>>,
    pub align: bool,
    pub reorg_buffer: u64,
    pub include_columns: Option<Vec<String>>,
    pub exclude_columns: Option<Vec<String>>,
    pub columns: Option<Vec<String>>,
    pub u256_types: Option<Vec<String>>,
    pub hex: bool,
    pub sort: Option<Vec<String>>,
    pub exclude_failed: bool,

    // Source options
    pub network_name: Option<String>,

    // Acquisition options
    pub requests_per_second: Option<u32>,
    pub max_retries: u32,
    pub initial_backoff: u64,
    pub max_concurrent_requests: Option<u64>,
    pub max_concurrent_chunks: Option<u64>,
    pub chunk_order: Option<String>,
    pub dry: bool,

    // Output options
    pub chunk_size: u64,
    pub n_chunks: Option<u64>,
    pub partition_by: Option<Vec<String>>,
    pub subdirs: Vec<String>,
    pub label: Option<String>,
    pub overwrite: bool,
    pub csv: bool,
    pub json: bool,
    pub row_group_size: Option<usize>,
    pub n_row_groups: Option<usize>,
    pub no_stats: bool,
    pub compression: Vec<String>,
    pub report_dir: Option<PathBuf>,
    pub no_report: bool,

    // Dataset-specific options
    pub address: Option<Vec<String>>,
    pub to_address: Option<Vec<String>>,
    pub from_address: Option<Vec<String>>,
    pub call_data: Option<Vec<String>>,
    pub function: Option<Vec<String>>,
    pub inputs: Option<Vec<String>>,
    pub slot: Option<Vec<String>>,
    pub contract: Option<Vec<String>>,
    pub topic0: Option<Vec<String>>,
    pub topic1: Option<Vec<String>>,
    pub topic2: Option<Vec<String>>,
    pub topic3: Option<Vec<String>>,
    pub event_signature: Option<String>,
    pub inner_request_size: u64,
    pub js_tracer: Option<String>,
}

pub struct IndexerTool {
    state: Arc<Mutex<IndexerState>>,
    log_sender: broadcast::Sender<String>,
}

impl IndexerTool {
    pub fn new() -> Self {
        let (log_sender, _) = broadcast::channel(100);

        let state = Arc::new(Mutex::new(IndexerState {
            indexing_progress: 0.0,
            log_messages: Vec::new(),
            available_datasets: vec![
                "address_appearances".to_string(),
                "balance_diffs".to_string(),
                "balance_reads".to_string(),
                "balances".to_string(),
                "blocks".to_string(),
                "code_diffs".to_string(),
                "code_reads".to_string(),
                "codes".to_string(),
                "contracts".to_string(),
                "erc20_balances".to_string(),
                "erc20_metadata".to_string(),
                "erc20_supplies".to_string(),
                "erc20_transfers".to_string(),
                "erc721_metadata".to_string(),
                "erc721_transfers".to_string(),
                "eth_calls".to_string(),
                "four_byte_counts".to_string(),
                "geth_calls".to_string(),
                "geth_code_diffs".to_string(),
                "geth_balance_diffs".to_string(),
                "geth_storage_diffs".to_string(),
                "geth_nonce_diffs".to_string(),
                "geth_opcodes".to_string(),
                "javascript_traces".to_string(),
                "logs".to_string(),
                "native_transfers".to_string(),
                "nonce_diffs".to_string(),
                "nonce_reads".to_string(),
                "nonces".to_string(),
                "slots".to_string(),
                "storage_diffs".to_string(),
                "storage_reads".to_string(),
                "traces".to_string(),
                "trace_calls".to_string(),
                "transactions".to_string(),
                "vm_traces".to_string(),
            ],
            selected_dataset: None,
            summary: None,
            indexed_dirs: Vec::new(),
            indexed_files: Vec::new(),
        }));

        IndexerTool { state, log_sender }
    }

    pub async fn start_indexing(
        &self,
        path: PathBuf,
        dataset: String,
        options: IndexerOptions,
    ) -> Result<CompactFreezeSummary, String> {
        info!(target: "cryo", "Starting indexing for dataset: {} at path: {:?}", dataset, path);

        let mut state = self.state.lock().await;
        state.selected_dataset = Some(dataset.clone());
        state.indexing_progress = 0.0;
        state
            .log_messages
            .push(format!("Starting indexing for dataset: {}", dataset));
        state.indexed_dirs.push(path.to_string_lossy().into_owned());
        drop(state);

        let args = self.create_args(&path, &dataset, &options)?;
        debug!(target: "cryo", "Created args: {:?}", args);

        // Run the indexing process
        info!(target: "cryo", "Running indexing process");
        let result = run(args).await;

        match result {
            Ok(Some(summary)) => {
                let compact_summary = CompactFreezeSummary::from(summary);
                let mut state = self.state.lock().await;
                state.summary = Some(format!("{:?}", compact_summary));
                state.indexing_progress = 100.0;
                state
                    .log_messages
                    .push("Indexing completed successfully.".to_string());
                Ok(compact_summary)
            }
            Ok(None) => {
                let mut state = self.state.lock().await;
                state
                    .log_messages
                    .push("Indexing completed, but no summary was produced.".to_string());
                Err("No summary produced".to_string())
            }
            Err(e) => {
                error!(target: "cryo", "Indexing error: {}", e);
                let mut state = self.state.lock().await;
                state.log_messages.push(format!("Error: {}", e));
                Err(e.to_string())
            }
        }
    }

    fn create_args(
        &self,
        path: &PathBuf,
        dataset: &str,
        options: &IndexerOptions,
    ) -> Result<Args, String> {
        let mut args = Args::default();
        args.output_dir = path.to_str().ok_or("Invalid path")?.to_string();
        args.datatype = vec![dataset.to_string()];
        args.rpc = options.rpc.clone();
        args.blocks = options.blocks.clone();
        args.align = options.align;
        args.reorg_buffer = options.reorg_buffer;
        args.include_columns = options.include_columns.clone();
        args.exclude_columns = options.exclude_columns.clone();
        args.sort = options.sort.clone();
        args.exclude_failed = options.exclude_failed;
        args.requests_per_second = options.requests_per_second;
        args.max_retries = options.max_retries;
        args.chunk_size = options.chunk_size;
        args.overwrite = options.overwrite;
        args.csv = options.csv;
        args.json = options.json;
        args.verbose = true;

        // Set default values
        args.compression = vec!["lz4".to_string()];
        args.initial_backoff = options.initial_backoff;
        args.no_stats = options.no_stats;
        args.inner_request_size = options.inner_request_size;

        // Set new fields
        args.timestamps = options.timestamps.clone();
        args.txs = options.txs.clone();
        args.columns = options.columns.clone();
        args.u256_types = options.u256_types.clone();
        args.hex = options.hex;
        args.network_name = options.network_name.clone();
        args.initial_backoff = options.initial_backoff;
        args.max_concurrent_requests = options.max_concurrent_requests;
        args.max_concurrent_chunks = options.max_concurrent_chunks;
        args.chunk_order = options.chunk_order.clone();
        args.dry = options.dry;
        args.n_chunks = options.n_chunks;
        args.partition_by = options.partition_by.clone();
        args.subdirs = options.subdirs.clone();
        args.label = options.label.clone();
        args.row_group_size = options.row_group_size;
        args.n_row_groups = options.n_row_groups;
        args.compression = options.compression.clone();
        args.report_dir = options.report_dir.clone();
        args.no_report = options.no_report;
        args.address = options.address.clone();
        args.to_address = options.to_address.clone();
        args.from_address = options.from_address.clone();
        args.call_data = options.call_data.clone();
        args.function = options.function.clone();
        args.inputs = options.inputs.clone();
        args.slot = options.slot.clone();
        args.contract = options.contract.clone();
        args.topic0 = options.topic0.clone();
        args.topic1 = options.topic1.clone();
        args.topic2 = options.topic2.clone();
        args.topic3 = options.topic3.clone();
        args.event_signature = options.event_signature.clone();
        args.js_tracer = options.js_tracer.clone();

        Ok(args)
    }

    pub async fn get_state(&self) -> IndexerState {
        self.state.lock().await.clone()
    }

    pub async fn set_selected_dataset(&self, dataset: String) -> Result<(), String> {
        let mut state = self.state.lock().await;
        if state.available_datasets.contains(&dataset) {
            state.selected_dataset = Some(dataset);
            Ok(())
        } else {
            Err("Invalid dataset selected".to_string())
        }
    }

    pub async fn get_available_datasets(&self) -> Vec<String> {
        self.state.lock().await.available_datasets.clone()
    }

    pub fn subscribe_to_logs(&self) -> broadcast::Receiver<String> {
        self.log_sender.subscribe()
    }
}

struct CryoLogger {
    sender: broadcast::Sender<String>,
}

impl log::Log for CryoLogger {
    fn enabled(&self, metadata: &Metadata) -> bool {
        metadata.level() <= log::Level::Info
    }

    fn log(&self, record: &Record) {
        if self.enabled(record.metadata()) {
            let log_message = format!("{}: {}", record.level(), record.args());
            let _ = self.sender.send(log_message);
        }
    }

    fn flush(&self) {}
}

#[derive(Debug, Serialize, Clone)]
pub struct CompactFreezeSummary {
    completed_chunks: usize,
    skipped_chunks: usize,
    errored_chunks: usize,
    total_chunks: usize,
    rows_written: u64,
}

impl From<FreezeSummary> for CompactFreezeSummary {
    fn from(summary: FreezeSummary) -> Self {
        let total_chunks = summary.completed.len() + summary.skipped.len() + summary.errored.len();
        CompactFreezeSummary {
            completed_chunks: summary.completed.len(),
            skipped_chunks: summary.skipped.len(),
            errored_chunks: summary.errored.len(),
            total_chunks,
            rows_written: summary.n_rows,
        }
    }
}
