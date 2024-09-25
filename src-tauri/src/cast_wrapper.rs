use alloy_primitives::{eip191_hash_message, hex, Address, B256};
use alloy_rpc_types::{BlockId, BlockNumberOrTag};
use eyre::Result;
use foundry_cast::SimpleCast;
use foundry_common::{
    abi::get_event,
    ens::{namehash, ProviderEnsExt},
    fmt::format_tokens_raw,
    selectors::{
        decode_calldata, decode_event_topic, decode_function_selector, decode_selectors,
        import_selectors, parse_signatures, pretty_calldata, ParsedSignatures, SelectorImportData,
        SelectorType,
    },
};
use serde_json;
use std::str::FromStr;

pub struct CastWrapper;

impl CastWrapper {
    // Constants
    pub fn max_int(r#type: &str) -> Result<String> {
        SimpleCast::max_int(r#type)
    }

    pub fn min_int(r#type: &str) -> Result<String> {
        SimpleCast::min_int(r#type)
    }

    pub fn max_uint(r#type: &str) -> Result<String> {
        SimpleCast::max_int(r#type)
    }

    pub fn address_zero() -> String {
        format!("{:?}", Address::ZERO)
    }

    pub fn hash_zero() -> String {
        format!("{:?}", B256::ZERO)
    }

    // Conversions & transformations
    pub fn from_utf8(text: &str) -> String {
        SimpleCast::from_utf8(text)
    }

    pub fn to_ascii(hexdata: &str) -> Result<String> {
        SimpleCast::to_ascii(hexdata)
    }

    pub fn to_utf8(hexdata: &str) -> Result<String> {
        SimpleCast::to_utf8(hexdata)
    }

    pub fn from_fixed_point(value: &str, decimals: &str) -> Result<String> {
        SimpleCast::from_fixed_point(value, decimals)
    }

    pub fn to_fixed_point(value: &str, decimals: &str) -> Result<String> {
        SimpleCast::to_fixed_point(value, decimals)
    }

    pub fn concat_hex(data: Vec<String>) -> String {
        SimpleCast::concat_hex(data)
    }

    pub fn from_bin(data: &[u8]) -> String {
        hex::encode_prefixed(data)
    }

    pub fn to_hex_data(input: &str) -> Result<String> {
        let bytes = hex::decode(input.strip_prefix("0x").unwrap_or(input))?;
        Ok(format!("0x{}", hex::encode(bytes)))
    }

    pub fn to_checksum_address(address: &str) -> Result<String> {
        let addr = Address::from_str(address)?;
        Ok(addr.to_checksum(None))
    }

    pub fn to_uint256(value: &str) -> Result<String> {
        SimpleCast::to_uint256(value)
    }

    pub fn to_int256(value: &str) -> Result<String> {
        SimpleCast::to_int256(value)
    }

    pub fn to_unit(value: &str, unit: &str) -> Result<String> {
        SimpleCast::to_unit(value, unit)
    }

    pub fn from_wei(value: &str, unit: &str) -> Result<String> {
        SimpleCast::from_wei(value, unit)
    }

    pub fn to_wei(value: &str, unit: &str) -> Result<String> {
        SimpleCast::to_wei(value, unit)
    }

    pub fn from_rlp(value: &str) -> Result<String> {
        SimpleCast::from_rlp(value)
    }

    pub fn to_rlp(value: &str) -> Result<String> {
        SimpleCast::to_rlp(value)
    }

    pub fn to_hex(value: &str, base_in: Option<&str>) -> Result<String> {
        SimpleCast::to_base(value, base_in, "hex")
    }

    pub fn to_dec(value: &str, base_in: Option<&str>) -> Result<String> {
        SimpleCast::to_base(value, base_in, "dec")
    }

    pub fn to_base(value: &str, base_in: Option<&str>, base_out: &str) -> Result<String> {
        SimpleCast::to_base(value, base_in, base_out)
    }

    pub fn to_bytes32(bytes: &str) -> Result<String> {
        SimpleCast::to_bytes32(bytes)
    }

    pub fn format_bytes32_string(string: &str) -> Result<String> {
        SimpleCast::format_bytes32_string(string)
    }

    pub fn parse_bytes32_string(bytes: &str) -> Result<String> {
        SimpleCast::parse_bytes32_string(bytes)
    }

    pub fn parse_bytes32_address(bytes: &str) -> Result<String> {
        SimpleCast::parse_bytes32_address(bytes)
    }

    // ABI encoding & decoding
    pub fn abi_decode(sig: &str, calldata: &str, input: bool) -> Result<String> {
        let tokens = SimpleCast::abi_decode(sig, calldata, input)?;
        Ok(serde_json::to_string(
            &format_tokens_raw(&tokens).collect::<Vec<_>>(),
        )?)
    }

    pub fn abi_encode(sig: &str, packed: bool, args: &[String]) -> Result<String> {
        if packed {
            SimpleCast::abi_encode_packed(sig, args)
        } else {
            SimpleCast::abi_encode(sig, args)
        }
    }

    pub fn calldata_decode(sig: &str, calldata: &str) -> Result<String> {
        let tokens = SimpleCast::calldata_decode(sig, calldata, true)?;
        Ok(serde_json::to_string(
            &format_tokens_raw(&tokens).collect::<Vec<_>>(),
        )?)
    }

    pub fn calldata_encode(sig: &str, args: &[String]) -> Result<String> {
        SimpleCast::calldata_encode(sig, args)
    }

    // Blockchain & RPC queries
    // Note: These methods would typically require a provider, which we don't have in this wrapper.

    // Misc
    pub fn keccak(data: &str) -> Result<String> {
        SimpleCast::keccak(data)
    }

    pub fn hash_message(message: &str) -> String {
        let message = if let Some(hex_str) = message.strip_prefix("0x") {
            hex::decode(hex_str).unwrap_or_else(|_| message.as_bytes().to_vec())
        } else {
            message.as_bytes().to_vec()
        };
        format!("{:?}", eip191_hash_message(message))
    }

    pub fn sig_event(event_string: &str) -> Result<String> {
        let parsed_event = get_event(event_string)?;
        Ok(format!("{:?}", parsed_event.selector()))
    }

    pub fn left_shift(
        value: &str,
        bits: &str,
        base_in: Option<&str>,
        base_out: &str,
    ) -> Result<String> {
        SimpleCast::left_shift(value, bits, base_in, base_out)
    }

    pub fn right_shift(
        value: &str,
        bits: &str,
        base_in: Option<&str>,
        base_out: &str,
    ) -> Result<String> {
        SimpleCast::right_shift(value, bits, base_in, base_out)
    }

    pub fn disassemble(bytecode: &str) -> Result<String> {
        SimpleCast::disassemble(bytecode)
    }

    pub async fn selectors(bytecode: &str, resolve: bool) -> Result<String> {
        let functions = SimpleCast::extract_functions(bytecode)?;
        let max_args_len = functions.iter().map(|r| r.1.len()).max().unwrap_or(0);
        let max_mutability_len = functions.iter().map(|r| r.2.len()).max().unwrap_or(0);

        let resolve_results = if resolve {
            let selectors_it = functions.iter().map(|r| &r.0);
            let ds = decode_selectors(SelectorType::Function, selectors_it).await?;
            ds.into_iter()
                .map(|v| v.unwrap_or_default().join("|"))
                .collect()
        } else {
            vec![]
        };
        let mut result = String::new();
        for (pos, (selector, arguments, state_mutability)) in functions.into_iter().enumerate() {
            if resolve {
                let resolved = &resolve_results[pos];
                result.push_str(&format!("{selector}\t{arguments:max_args_len$}\t{state_mutability:max_mutability_len$}\t{resolved}\n"));
            } else {
                result.push_str(&format!(
                    "{selector}\t{arguments:max_args_len$}\t{state_mutability}\n"
                ));
            }
        }
        Ok(result)
    }

    pub fn index(key_type: &str, key: &str, slot_number: &str) -> Result<String> {
        SimpleCast::index(key_type, key, slot_number)
    }

    pub fn index_erc7201(id: &str) -> Result<String> {
        Ok(format!("0x{}", hex::encode(foundry_common::erc7201(id))))
    }

    pub fn decode_transaction(tx: &str) -> Result<String> {
        let tx = SimpleCast::decode_raw_transaction(tx)?;
        Ok(serde_json::to_string_pretty(&tx)?)
    }

    pub fn decode_eof(eof: &str) -> Result<String> {
        SimpleCast::decode_eof(eof)
    }
}
