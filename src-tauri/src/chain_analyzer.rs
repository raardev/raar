use duckdb::{Connection, Result};
use hex;
use log::info;
use polars_core::prelude::*;
use polars_core::utils::accumulate_dataframes_vertical_unchecked;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct DataFrameResult {
    schema: Vec<(String, String)>, // (column_name, data_type)
    data: Vec<Vec<String>>,
}

pub fn execute_query(query: &str) -> Result<DataFrameResult> {
    info!("Executing query: {}", query);

    let conn = Connection::open_in_memory()?;
    let mut stmt = conn.prepare(query)?;

    // Use query_polars to get a Polars DataFrame
    let pl = stmt.query_polars([])?;

    // Check if the query result is empty
    let df_vec: Vec<DataFrame> = pl.collect();
    if df_vec.is_empty() {
        // Return an empty result instead of panicking
        return Ok(DataFrameResult {
            schema: vec![],
            data: vec![],
        });
    }

    let df = accumulate_dataframes_vertical_unchecked(df_vec);

    info!("DataFrame: {:?}", df);

    // Convert DataFrame to our DataFrameResult structure
    let schema: Vec<(String, String)> = df
        .schema()
        .iter()
        .map(|(name, dtype)| (name.to_string(), dtype.to_string()))
        .collect();

    let data: Vec<Vec<String>> = df
        .iter()
        .map(|s| {
            s.iter()
                .map(|av| match av {
                    AnyValue::Binary(bytes) => format!("0x{}", hex::encode(bytes)),
                    _ => av.to_string(),
                })
                .collect()
        })
        .collect();

    // Transpose the data matrix
    let transposed_data: Vec<Vec<String>> = (0..data[0].len())
        .map(|i| data.iter().map(|row| row[i].clone()).collect())
        .collect();

    info!("Transposed data: {:?}", transposed_data);

    Ok(DataFrameResult {
        schema,
        data: transposed_data,
    })
}
