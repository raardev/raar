use duckdb::{Connection, Result};
use log::info;
use polars::prelude::*;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};

#[derive(Serialize, Deserialize)]
pub struct QueryResult {
    json: String,
}

fn bytes_to_hex(bytes: &[u8]) -> String {
    format!(
        "0x{}",
        bytes
            .iter()
            .map(|b| format!("{:02x}", b))
            .collect::<String>()
    )
}

pub fn execute_query(query: &str) -> Result<QueryResult> {
    info!("Executing query: {}", query);

    let conn = Connection::open_in_memory()?;
    let mut stmt = conn.prepare(query)?;

    let df: DataFrame = stmt
        .query_polars([])?
        .collect::<Vec<DataFrame>>()
        .pop()
        .unwrap_or_default();

    if df.is_empty() {
        return Ok(QueryResult {
            json: "[]".to_string(),
        });
    }

    info!("DataFrame: {:?}", df);

    let json_df = df
        .get_columns()
        .iter()
        .map(|series| {
            let name = series.name();
            let values: Vec<Value> = match series.dtype() {
                DataType::Binary => series
                    .binary()
                    .unwrap()
                    .into_iter()
                    .map(|opt_v| {
                        opt_v
                            .map(|v| json!(bytes_to_hex(&v)))
                            .unwrap_or(Value::Null)
                    })
                    .collect(),
                _ => series.iter().map(|av| json!(av)).collect(),
            };

            json!({
                "name": name,
                "datatype": series.dtype().to_string(),
                "values": values
            })
        })
        .collect::<Vec<Value>>();

    let result = json!({ "columns": json_df });

    info!("JSON result: {}", result);

    Ok(QueryResult {
        json: result.to_string(),
    })
}
