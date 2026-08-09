use std::fs;

fn valid_suggested_name(name: &str) -> bool {
    !name.is_empty()
        && name.len() <= 255
        && !name.contains('/')
        && !name.contains('\\')
        && name != "."
        && name != ".."
}

#[tauri::command]
async fn save_text_file(suggested_name: String, contents: String) -> Result<bool, String> {
    if !valid_suggested_name(&suggested_name) {
        return Err("Invalid suggested filename".to_owned());
    }

    tauri::async_runtime::spawn_blocking(move || {
        let Some(path) = rfd::FileDialog::new()
            .set_file_name(suggested_name)
            .save_file()
        else {
            return Ok(false);
        };
        fs::write(path, contents).map_err(|error| format!("Failed to save file: {error}"))?;
        Ok(true)
    })
    .await
    .map_err(|error| format!("File dialog failed: {error}"))?
}

#[tauri::command]
async fn open_text_file() -> Result<Option<String>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let Some(path) = rfd::FileDialog::new()
            .add_filter("JSON", &["json"])
            .pick_file()
        else {
            return Ok(None);
        };
        fs::read_to_string(path)
            .map(Some)
            .map_err(|error| format!("Failed to read file: {error}"))
    })
    .await
    .map_err(|error| format!("File dialog failed: {error}"))?
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![save_text_file, open_text_file])
        .run(tauri::generate_context!())
        .expect("failed to run Monkeytype Desktop");
}

#[cfg(test)]
mod tests {
    use super::valid_suggested_name;

    #[test]
    fn accepts_plain_filenames() {
        assert!(valid_suggested_name("monkeytype-results.csv"));
    }

    #[test]
    fn rejects_paths_and_empty_names() {
        assert!(!valid_suggested_name(""));
        assert!(!valid_suggested_name("../backup.json"));
        assert!(!valid_suggested_name("folder/backup.json"));
    }
}
