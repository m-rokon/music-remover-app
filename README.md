# music-remover

AI-powered desktop app to separate audio tracks (vocals, bass, drums, instrumental, etc.) using a Tauri + React (Vite) frontend and a Rust backend that calls external tools like `demucs` and `yt-dlp`.

## Features

- Upload local audio files (MP3, WAV, FLAC, M4A, OGG)
- Download audio from a URL via `yt-dlp`
- Separate audio into stems using `demucs` (vocals, bass, drums, other, instrumental)
- Play and download separated tracks from the UI

## Prerequisites

- Node.js (LTS) and `npm` or `pnpm`/`yarn`
- Rust toolchain (for building the Tauri backend)
- Tauri prerequisites: see https://tauri.app/v1/guides/getting-started/prerequisites
- `demucs` (Python package) — used for source separation
- `yt-dlp` — used to download audio from URLs

Install `demucs` and `yt-dlp` (example using pip):

```bash
python -m pip install --upgrade pip
pip install demucs yt-dlp
```

Ensure `demucs` and `yt-dlp` are available in your `PATH` (i.e., running `demucs --help` and `yt-dlp --version` should work).

## Setup (development)

1. Install Node dependencies:

```bash
npm install
# or: pnpm install, yarn
```

2. Run the web frontend in development mode:

```bash
npm run dev
```

3. In another terminal start the Tauri dev runner (it will open the desktop window and point to the dev server):

```bash
npm run tauri:dev
```

This project uses `vite` as the dev server. The Tauri config (`src-tauri/tauri.conf.json`) is configured with `devPath` pointing to `http://localhost:1420`.

## Build (production)

1. Build the frontend assets:

```bash
npm run build
```

2. Build the Tauri app (creates native bundles):

```bash
npm run tauri:build
```

The `tauri build` step will package the `../dist` directory (see `tauri.conf.json` -> `build.distDir`).

## Usage

- Open the app and either upload a local audio file or provide a URL.
- For URLs the backend uses `yt-dlp` to download and extract audio.
- The Rust backend invokes `demucs` to separate the provided audio into stems. The UI will show resulting tracks and let you play and save them.

Notes about models and output:

- The backend command `separate_audio` expects a `model` parameter and an `output_dir` — ensure you have the model available for `demucs` (see `demucs` docs for available models).

## Troubleshooting

- If `yt-dlp` is not found: install with `pip install yt-dlp` and ensure it is in `PATH`.
- If `demucs` is not found: install with `pip install demucs` and ensure it is in `PATH`.
- If Tauri build fails: verify Rust toolchain and Tauri CLI are installed (`cargo install tauri-cli` or `npm i -D @tauri-apps/cli`) and follow Tauri prerequisites for your OS.

## Contributing

- Bugs, feature requests and PRs are welcome. Please open issues/PRs in the repository.
