use duckdb::polars::prelude as duckdb_polars;
use duckdb::{Connection, Result};
use log::info;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct QueryResult {
    json: String,
}

pub fn execute_query(query: &str) -> Result<QueryResult> {
    info!("Executing query: {}", query);

    let conn = Connection::open_in_memory()?;
    let mut stmt = conn.prepare(query)?;

    let df: Vec<duckdb_polars::DataFrame> = stmt.query_polars([])?.collect::<Vec<_>>();

    info!("DataFrame: {:?}", df);

    // Convert DataFrame to JSON string
    let json_result = df
        .iter()
        .map(|frame| {
            let columns: Vec<(&str, Vec<String>)> = frame
                .get_columns()
                .iter()
                .map(|series| {
                    (
                        series.name(),
                        series.iter().map(|value| value.to_string()).collect(),
                    )
                })
                .collect();

            serde_json::to_string(&columns).unwrap()
        })
        .collect::<Vec<String>>()
        .join(",");

    let result = format!("[{}]", json_result);

    info!("JSON result: {}", result);

    Ok(QueryResult { json: result })
}
