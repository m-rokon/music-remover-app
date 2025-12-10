// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
  tauri::Builder::default()
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::Command;
use std::path::{Path, PathBuf};
use std::fs;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
struct AudioInfo {
    title: String,
    duration: String,
    source: String,
    file_path: String,
}

#[derive(Serialize)]
struct SeparatedFiles {
    vocals: String,
    no_vocals: String,
    drums: String,
    bass: String,
    other: String,
}

#[tauri::command]
async fn get_app_data_dir(app_handle: tauri::AppHandle) -> Result<String, String> {
    app_handle
        .path_resolver()
        .app_data_dir()
        .map(|p| p.to_string_lossy().to_string())
        .ok_or_else(|| "Failed to get app data directory".to_string())
}

#[tauri::command]
async fn download_audio_from_url(url: String, output_dir: String) -> Result<AudioInfo, String> {
    let ytdlp_check = Command::new("yt-dlp").arg("--version").output();
    
    if ytdlp_check.is_err() {
        return Err("yt-dlp not installed. Install: pip install yt-dlp".to_string());
    }

    fs::create_dir_all(&output_dir)
        .map_err(|e| format!("Failed to create directory: {}", e))?;

    let output_template = format!("{}/%(title)s.%(ext)s", output_dir);
    
    let output = Command::new("yt-dlp")
        .arg("-x")
        .arg("--audio-format").arg("mp3")
        .arg("--audio-quality").arg("0")
        .arg("-o").arg(&output_template)
        .arg("--print").arg("after_move:filepath")
        .arg("--print").arg("title")
        .arg("--print").arg("duration_string")
        .arg(&url)
        .output()
        .map_err(|e| format!("yt-dlp execution failed: {}", e))?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        let lines: Vec<&str> = stdout.trim().lines().collect();
        
        if lines.len() >= 3 {
            let source = url::Url::parse(&url)
                .map(|u| u.host_str().unwrap_or("Unknown").to_string())
                .unwrap_or_else(|_| "Unknown".to_string());

            Ok(AudioInfo {
                file_path: lines[0].to_string(),
                title: lines[1].to_string(),
                duration: lines[2].to_string(),
                source,
            })
        } else {
            Err("Failed to parse yt-dlp output".to_string())
        }
    } else {
        Err(format!("yt-dlp failed: {}", String::from_utf8_lossy(&output.stderr)))
    }
}

#[tauri::command]
async fn separate_audio(
    file_path: String,
    output_dir: String,
    model: String
) -> Result<SeparatedFiles, String> {
    let demucs_check = Command::new("demucs").arg("--help").output();
    
    if demucs_check.is_err() {
        return Err("Demucs not installed. Install: pip install demucs".to_string());
    }

    fs::create_dir_all(&output_dir)
        .map_err(|e| format!("Failed to create directory: {}", e))?;

    let output = Command::new("demucs")
        .arg("-n").arg(&model)
        .arg("-o").arg(&output_dir)
        .arg(&file_path)
        .output()
        .map_err(|e| format!("Demucs execution failed: {}", e))?;

    if output.status.success() {
        let file_name = Path::new(&file_path)
            .file_stem()
            .and_then(|s| s.to_str())
            .ok_or("Invalid file path")?;

        let base = PathBuf::from(&output_dir).join(&model).join(file_name);

        Ok(SeparatedFiles {
            vocals: base.join("vocals.wav").to_string_lossy().to_string(),
            no_vocals: base.join("no_vocals.wav").to_string_lossy().to_string(),
            drums: base.join("drums.wav").to_string_lossy().to_string(),
            bass: base.join("bass.wav").to_string_lossy().to_string(),
            other: base.join("other.wav").to_string_lossy().to_string(),
        })
    } else {
        Err(format!("Demucs failed: {}", String::from_utf8_lossy(&output.stderr)))
    }
}

#[tauri::command]
async fn save_audio_file(source_path: String, track_type: String) -> Result<(), String> {
    use tauri::api::dialog::blocking::FileDialogBuilder;
    
    if let Some(destination) = FileDialogBuilder::new()
        .set_file_name(&format!("{}.wav", track_type))
        .save_file()
    {
        fs::copy(&source_path, destination)
            .map_err(|e| format!("Failed to save file: {}", e))?;
        Ok(())
    } else {
        Err("Save cancelled".to_string())
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_app_data_dir,
            download_audio_from_url,
            separate_audio,
            save_audio_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}