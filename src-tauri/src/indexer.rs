use cryo_cli::{run, Args};
use log::{debug, error, info};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Arc;
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
    pub rpc: String,
    pub blocks: String,
    pub align: bool,
    pub reorg_buffer: u64,
    pub include_columns: String,
    pub exclude_columns: String,
    pub sort: String,
    pub exclude_failed: bool,
    pub requests_per_second: u32,
    pub max_retries: u32,
    pub chunk_size: u64,
    pub output_dir: String,
    pub overwrite: bool,
    pub format: String,
    pub compression: Option<Vec<String>>,
    pub initial_backoff: Option<u64>,
    pub no_stats: Option<bool>,
    pub inner_request_size: Option<u64>,
}

pub struct IndexerTool {
    state: Arc<Mutex<IndexerState>>,
}

impl IndexerTool {
    pub fn new() -> Self {
        IndexerTool {
            state: Arc::new(Mutex::new(IndexerState {
                indexing_progress: 0.0,
                log_messages: Vec::new(),
                available_datasets: vec![
                    "blocks".to_string(),
                    "transactions".to_string(),
                    "traces".to_string(),
                    "logs".to_string(),
                    "contracts".to_string(),
                ],
                selected_dataset: None,
                summary: None,
                indexed_dirs: Vec::new(),
                indexed_files: Vec::new(),
            })),
        }
    }

    pub async fn start_indexing(
        &self,
        path: PathBuf,
        dataset: String,
        options: IndexerOptions,
    ) -> Result<(), String> {
        info!(
            "Starting indexing for dataset: {} at path: {:?}",
            dataset, path
        );
        let mut state = self.state.lock().await;
        state.selected_dataset = Some(dataset.clone());
        state.indexing_progress = 0.0;
        state
            .log_messages
            .push(format!("Starting indexing for dataset: {}", dataset));
        state.indexed_dirs.push(path.to_string_lossy().into_owned());
        drop(state);

        let args = self.create_args(&path, &dataset, &options)?;
        debug!("Created args: {:?}", args);

        // Run the indexing process
        info!("Running indexing process");
        let result = run(args).await.map_err(|e| {
            error!("Indexing error: {}", e);
            e.to_string()
        })?;

        let mut state = self.state.lock().await;
        state.summary = result.map(|summary| {
            let summary_str = format!("{:?}", summary);
            info!("Indexing completed. Summary: {}", summary_str);
            summary_str
        });
        state.indexing_progress = 100.0;
        state.log_messages.push("Indexing completed.".to_string());

        Ok(())
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
        args.rpc = Some(options.rpc.clone());
        args.blocks = Some(vec![options.blocks.clone()]);
        args.align = options.align;
        args.reorg_buffer = options.reorg_buffer;
        args.include_columns = if options.include_columns.is_empty() {
            None
        } else {
            Some(
                options
                    .include_columns
                    .split(',')
                    .map(String::from)
                    .collect(),
            )
        };
        args.exclude_columns = if options.exclude_columns.is_empty() {
            None
        } else {
            Some(
                options
                    .exclude_columns
                    .split(',')
                    .map(String::from)
                    .collect(),
            )
        };
        args.sort = if options.sort.is_empty() {
            None
        } else {
            Some(options.sort.split(',').map(String::from).collect())
        };
        args.exclude_failed = options.exclude_failed;
        args.requests_per_second = Some(options.requests_per_second);
        args.max_retries = options.max_retries;
        args.chunk_size = options.chunk_size;
        args.overwrite = options.overwrite;
        args.csv = options.format == "csv";
        args.json = options.format == "json";
        args.verbose = true;

        // 设置默认值
        args.compression = vec!["lz4".to_string()];
        args.initial_backoff = 500;
        args.no_stats = false;
        args.inner_request_size = 1;

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
}
