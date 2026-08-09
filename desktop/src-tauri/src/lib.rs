use std::fs;
use tauri::{Manager, PhysicalPosition, PhysicalSize, Runtime, WebviewWindow};

const WINDOW_EDGE_INSET_LOGICAL: f64 = 16.0;
const TITLEBAR_ALLOWANCE_LOGICAL: f64 = 32.0;

fn fitted_window_geometry(
    work_x: i32,
    work_y: i32,
    work_width: u32,
    work_height: u32,
    scale_factor: f64,
) -> (PhysicalPosition<i32>, PhysicalSize<u32>) {
    let edge_inset = (WINDOW_EDGE_INSET_LOGICAL * scale_factor).round() as u32;
    let titlebar_allowance = (TITLEBAR_ALLOWANCE_LOGICAL * scale_factor).round() as u32;
    let horizontal_insets = edge_inset.saturating_mul(2);
    let vertical_insets = horizontal_insets.saturating_add(titlebar_allowance);

    (
        PhysicalPosition::new(
            work_x.saturating_add(edge_inset as i32),
            work_y.saturating_add(edge_inset as i32),
        ),
        PhysicalSize::new(
            work_width.saturating_sub(horizontal_insets),
            work_height.saturating_sub(vertical_insets),
        ),
    )
}

fn fit_main_window<R: Runtime>(window: &WebviewWindow<R>) -> tauri::Result<()> {
    let Some(monitor) = window.current_monitor()?.or(window.primary_monitor()?) else {
        return window.center();
    };

    let work_area = monitor.work_area();
    let (position, size) = fitted_window_geometry(
        work_area.position.x,
        work_area.position.y,
        work_area.size.width,
        work_area.size.height,
        monitor.scale_factor(),
    );

    window.set_size(size)?;
    window.set_position(position)?;

    Ok(())
}

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
        .setup(|app| {
            let window = app.get_webview_window("main").ok_or_else(|| {
                std::io::Error::new(std::io::ErrorKind::NotFound, "main window not found")
            })?;
            fit_main_window(&window)?;
            window.show()?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("failed to run Monkeytype Desktop");
}

#[cfg(test)]
mod tests {
    use super::{fitted_window_geometry, valid_suggested_name};

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

    #[test]
    fn fits_window_inside_retina_work_area() {
        let (position, size) = fitted_window_geometry(0, 48, 2940, 1800, 2.0);

        assert_eq!((position.x, position.y), (32, 80));
        assert_eq!((size.width, size.height), (2876, 1672));
        assert!(position.x + (size.width as i32) < 2940);
        assert!(position.y + (size.height as i32) < 1848);
    }
}
