// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

/// Makes the Windows build portable: WebView2 stores its user-data cache
/// (which is where our localStorage-backed counters actually live) in a
/// folder next to the executable instead of %LOCALAPPDATA%. This must run
/// before `app_lib::run()` creates the webview.
#[cfg(target_os = "windows")]
fn set_portable_webview2_data_folder() {
  if let Ok(exe_path) = std::env::current_exe() {
    if let Some(exe_dir) = exe_path.parent() {
      let data_dir = exe_dir.join("data");
      let _ = std::fs::create_dir_all(&data_dir);
      // Safe: this runs single-threaded, before any other code reads env vars.
      unsafe {
        std::env::set_var("WEBVIEW2_USER_DATA_FOLDER", &data_dir);
      }
    }
  }
}

fn main() {
  #[cfg(target_os = "windows")]
  set_portable_webview2_data_folder();

  app_lib::run();
}
