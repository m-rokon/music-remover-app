import React, { useState, useRef, useEffect } from "react";
import {
	Upload,
	Music,
	Loader2,
	Download,
	Trash2,
	Volume2,
	VolumeX,
	Link,
	Play,
	Pause,
	SkipBack,
	SkipForward,
	Waves,
} from "lucide-react";

export default function MusicRemoverApp() {
	const [file, setFile] = useState(null);
	const [url, setUrl] = useState("");
	const [inputMethod, setInputMethod] = useState("file");
	const [processing, setProcessing] = useState(false);
	const [downloadingUrl, setDownloadingUrl] = useState(false);
	const [progress, setProgress] = useState(0);
	const [outputFiles, setOutputFiles] = useState(null);
	const [error, setError] = useState("");
	const [audioInfo, setAudioInfo] = useState(null);

	// Audio player state
	const [currentTrack, setCurrentTrack] = useState(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);
	const [volume, setVolume] = useState(1);
	const audioRef = useRef(null);

	const tracks = [
		{
			key: "vocals",
			label: "Vocals Only",
			icon: Volume2,
			gradient: "from-teal-500 to-cyan-500",
		},
		{
			key: "no_vocals",
			label: "Instrumental",
			icon: VolumeX,
			gradient: "from-cyan-500 to-blue-500",
		},
		{
			key: "drums",
			label: "Drums Only",
			icon: Music,
			gradient: "from-blue-500 to-indigo-500",
		},
		{
			key: "bass",
			label: "Bass Only",
			icon: Music,
			gradient: "from-indigo-500 to-purple-500",
		},
		{
			key: "other",
			label: "Other Instruments",
			icon: Music,
			gradient: "from-purple-500 to-pink-500",
		},
	];

	useEffect(() => {
		const audio = audioRef.current;
		if (!audio) return;

		const updateTime = () => setCurrentTime(audio.currentTime);
		const updateDuration = () => setDuration(audio.duration);
		const handleEnded = () => {
			setIsPlaying(false);
			setCurrentTime(0);
		};

		audio.addEventListener("timeupdate", updateTime);
		audio.addEventListener("loadedmetadata", updateDuration);
		audio.addEventListener("ended", handleEnded);

		return () => {
			audio.removeEventListener("timeupdate", updateTime);
			audio.removeEventListener("loadedmetadata", updateDuration);
			audio.removeEventListener("ended", handleEnded);
		};
	}, []);

	useEffect(() => {
		if (audioRef.current) {
			audioRef.current.volume = volume;
		}
	}, [volume]);

	const handleFileUpload = (e) => {
		const selectedFile = e.target.files[0];
		if (selectedFile) {
			setFile(selectedFile);
			setError("");
			setOutputFiles(null);
			setInputMethod("file");
			setUrl("");
			stopAudio();
		}
	};

	const handleDrop = (e) => {
		e.preventDefault();
		const droppedFile = e.dataTransfer.files[0];
		if (droppedFile && droppedFile.type.startsWith("audio/")) {
			setFile(droppedFile);
			setError("");
			setOutputFiles(null);
			setInputMethod("file");
			setUrl("");
			stopAudio();
		} else {
			setError("Please drop an audio file");
		}
	};

	const handleDragOver = (e) => {
		e.preventDefault();
	};

	const handleUrlSubmit = async () => {
		if (!url.trim()) {
			setError("Please enter a valid URL");
			return;
		}

		setDownloadingUrl(true);
		setError("");
		setOutputFiles(null);
		stopAudio();

		try {
			await new Promise((resolve) => setTimeout(resolve, 2000));

			setAudioInfo({
				title: "Downloaded Audio",
				duration: "3:45",
				source: new URL(url).hostname,
			});

			setInputMethod("url");
			setFile({ name: "downloaded_audio.mp3", size: 5242880 });
			setDownloadingUrl(false);
		} catch (err) {
			setError("Failed to download audio. Please check the URL and try again.");
			setDownloadingUrl(false);
		}
	};

	const processAudio = async () => {
		if (!file && !url) return;

		setProcessing(true);
		setProgress(0);
		setError("");
		stopAudio();

		try {
			const interval = setInterval(() => {
				setProgress((prev) => {
					if (prev >= 95) {
						clearInterval(interval);
						return 95;
					}
					return prev + 5;
				});
			}, 200);

			await new Promise((resolve) => setTimeout(resolve, 4000));
			clearInterval(interval);
			setProgress(100);

			setOutputFiles({
				vocals: "blob:vocals.wav",
				bass: "blob:bass.wav",
				drums: "blob:drums.wav",
				other: "blob:other.wav",
				no_vocals: "blob:no_vocals.wav",
			});

			setProcessing(false);
		} catch (err) {
			setError("Failed to process audio. Please try again.");
			setProcessing(false);
		}
	};

	const playTrack = (trackKey) => {
		if (currentTrack === trackKey && isPlaying) {
			pauseAudio();
		} else if (currentTrack === trackKey && !isPlaying) {
			resumeAudio();
		} else {
			setCurrentTrack(trackKey);
			setIsPlaying(true);
			if (audioRef.current) {
				audioRef.current.src = outputFiles[trackKey];
				audioRef.current.play();
			}
		}
	};

	const pauseAudio = () => {
		if (audioRef.current) {
			audioRef.current.pause();
			setIsPlaying(false);
		}
	};

	const resumeAudio = () => {
		if (audioRef.current) {
			audioRef.current.play();
			setIsPlaying(true);
		}
	};

	const stopAudio = () => {
		if (audioRef.current) {
			audioRef.current.pause();
			audioRef.current.currentTime = 0;
		}
		setIsPlaying(false);
		setCurrentTrack(null);
		setCurrentTime(0);
	};

	const skipBackward = () => {
		if (audioRef.current) {
			audioRef.current.currentTime = Math.max(0, currentTime - 10);
		}
	};

	const skipForward = () => {
		if (audioRef.current) {
			audioRef.current.currentTime = Math.min(duration, currentTime + 10);
		}
	};

	const handleSeek = (e) => {
		const seekTime = parseFloat(e.target.value);
		setCurrentTime(seekTime);
		if (audioRef.current) {
			audioRef.current.currentTime = seekTime;
		}
	};

	const formatTime = (time) => {
		if (isNaN(time)) return "0:00";
		const minutes = Math.floor(time / 60);
		const seconds = Math.floor(time % 60);
		return `${minutes}:${seconds.toString().padStart(2, "0")}`;
	};

	const handleDownload = (type) => {
		alert(`Downloading ${type} track...`);
	};

	const reset = () => {
		setFile(null);
		setUrl("");
		setOutputFiles(null);
		setProgress(0);
		setError("");
		setAudioInfo(null);
		setInputMethod("file");
		stopAudio();
	};

	const switchToUrl = () => {
		setInputMethod("url");
		setFile(null);
		setError("");
		stopAudio();
	};

	const switchToFile = () => {
		setInputMethod("file");
		setUrl("");
		setError("");
		stopAudio();
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 p-4 sm:p-6 lg:p-8">
			{/* Animated background elements */}
			<div className="fixed inset-0 overflow-hidden pointer-events-none">
				<div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse" />
				<div
					className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"
					style={{ animationDelay: "1s" }}
				/>
			</div>

			<div className="max-w-6xl mx-auto relative z-10">
				<audio ref={audioRef} />

				{/* Header */}
				<div className="text-center mb-8 sm:mb-12">
					<div className="flex items-center justify-center gap-4 mb-4">
						<div className="relative">
							<div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl blur-xl opacity-50" />
							<div className="relative bg-gradient-to-br from-teal-500 to-cyan-500 p-3 rounded-2xl">
								<Waves className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
							</div>
						</div>
						<h1 className="text-3xl sm:text-5xl font-bold bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
							Audio Separator
						</h1>
					</div>
					<p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
						AI-powered music separation • Extract vocals, instruments & more
						with cutting-edge technology
					</p>
				</div>

				{/* Main Card */}
				<div className="bg-slate-900/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-800/50 overflow-hidden">
					<div className="p-6 sm:p-8 lg:p-10">
						{!file && !outputFiles && (
							<>
								{/* Tab Switcher */}
								<div className="flex gap-2 mb-8 bg-slate-800/50 p-1.5 rounded-2xl">
									<button
										onClick={switchToFile}
										className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-all duration-300 ${
											inputMethod === "file"
												? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/25 scale-105"
												: "text-slate-400 hover:text-white hover:bg-slate-800/50"
										}`}
									>
										<Upload className="w-5 h-5 inline mr-2" />
										Upload File
									</button>
									<button
										onClick={switchToUrl}
										className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-all duration-300 ${
											inputMethod === "url"
												? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/25 scale-105"
												: "text-slate-400 hover:text-white hover:bg-slate-800/50"
										}`}
									>
										<Link className="w-5 h-5 inline mr-2" />
										From URL
									</button>
								</div>

								{/* File Upload Section */}
								{inputMethod === "file" && (
									<div
										onDrop={handleDrop}
										onDragOver={handleDragOver}
										className="relative border-2 border-dashed border-teal-500/30 hover:border-teal-500/60 rounded-2xl p-16 text-center transition-all duration-300 cursor-pointer bg-slate-800/30 hover:bg-slate-800/50 group"
									>
										<input
											type="file"
											accept="audio/*"
											onChange={handleFileUpload}
											className="hidden"
											id="fileInput"
										/>
										<label htmlFor="fileInput" className="cursor-pointer">
											<div className="relative inline-block mb-6">
												<div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full blur-2xl opacity-30 group-hover:opacity-50 transition-opacity" />
												<div className="relative bg-gradient-to-br from-teal-500 to-cyan-500 p-6 rounded-full">
													<Upload className="w-12 h-12 text-white" />
												</div>
											</div>
											<p className="text-2xl font-semibold text-white mb-3">
												Drop your audio file here
											</p>
											<p className="text-slate-400 mb-4">or click to browse</p>
											<div className="flex flex-wrap gap-2 justify-center text-sm">
												{["MP3", "WAV", "FLAC", "M4A", "OGG"].map((format) => (
													<span
														key={format}
														className="px-3 py-1 bg-slate-800/80 text-teal-400 rounded-lg border border-slate-700"
													>
														{format}
													</span>
												))}
											</div>
										</label>
									</div>
								)}

								{/* URL Input Section */}
								{inputMethod === "url" && (
									<div className="space-y-6">
										<div className="bg-slate-800/30 rounded-2xl p-8 border border-slate-700/50">
											<div className="flex items-center gap-3 mb-6">
												<div className="p-2 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg">
													<Play className="w-6 h-6 text-white" />
												</div>
												<div>
													<h3 className="text-xl font-semibold text-white">
														Download from URL
													</h3>
													<p className="text-slate-400 text-sm">
														Supports 1000+ platforms
													</p>
												</div>
											</div>

											<div className="space-y-4">
												<input
													type="text"
													value={url}
													onChange={(e) => setUrl(e.target.value)}
													placeholder="https://www.youtube.com/watch?v=..."
													className="w-full px-6 py-4 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
													disabled={downloadingUrl}
												/>
												<button
													onClick={handleUrlSubmit}
													disabled={downloadingUrl}
													className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 disabled:from-slate-700 disabled:to-slate-600 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 disabled:shadow-none flex items-center justify-center gap-3"
												>
													{downloadingUrl ? (
														<>
															<Loader2 className="w-5 h-5 animate-spin" />
															<span>Downloading...</span>
														</>
													) : (
														<>
															<Download className="w-5 h-5" />
															<span>Download Audio</span>
														</>
													)}
												</button>
											</div>

											<div className="mt-6 grid grid-cols-2 gap-3 text-xs">
												{[
													{ name: "YouTube", icon: "📺" },
													{ name: "SoundCloud", icon: "☁️" },
													{ name: "Spotify", icon: "🎵" },
													{ name: "Bandcamp", icon: "🎸" },
												].map((platform) => (
													<div
														key={platform.name}
														className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 rounded-lg text-slate-300"
													>
														<span>{platform.icon}</span>
														<span>{platform.name}</span>
													</div>
												))}
											</div>
										</div>
									</div>
								)}
							</>
						)}

						{file && !outputFiles && (
							<div className="space-y-6">
								<div className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700/50">
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-4 flex-1">
											<div className="p-3 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl">
												<Music className="w-8 h-8 text-white" />
											</div>
											<div className="flex-1 min-w-0">
												<p className="text-white font-semibold text-lg truncate">
													{audioInfo ? audioInfo.title : file.name}
												</p>
												<p className="text-sm text-slate-400">
													{file.size &&
														`${(file.size / 1024 / 1024).toFixed(2)} MB`}
													{audioInfo &&
														` • ${audioInfo.duration} • ${audioInfo.source}`}
												</p>
											</div>
										</div>
										<button
											onClick={reset}
											className="p-3 hover:bg-slate-800/50 rounded-xl transition-colors"
										>
											<Trash2 className="w-5 h-5 text-red-400" />
										</button>
									</div>
								</div>

								{processing && (
									<div className="space-y-4">
										<div className="flex items-center justify-between text-white">
											<span className="font-medium">Processing audio...</span>
											<span className="text-teal-400 font-bold">
												{progress}%
											</span>
										</div>
										<div className="h-3 bg-slate-800/50 rounded-full overflow-hidden">
											<div
												className="h-full bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 transition-all duration-300 ease-out relative"
												style={{ width: `${progress}%` }}
											>
												<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
											</div>
										</div>
										<div className="flex items-center justify-center gap-3 text-slate-400 text-sm bg-slate-800/30 rounded-xl p-4">
											<Loader2 className="w-5 h-5 animate-spin text-teal-400" />
											<span>Using Demucs AI to separate audio tracks...</span>
										</div>
									</div>
								)}

								{!processing && (
									<button
										onClick={processAudio}
										className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-bold py-5 rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 text-lg"
									>
										Start Separation
									</button>
								)}
							</div>
						)}

						{outputFiles && (
							<div className="space-y-6">
								<div className="text-center mb-8">
									<div className="inline-flex items-center gap-3 bg-gradient-to-r from-teal-500/20 to-cyan-500/20 text-teal-400 px-6 py-3 rounded-full border border-teal-500/30">
										<div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" />
										<span className="font-semibold">Separation Complete!</span>
									</div>
								</div>

								{/* Audio Player */}
								{currentTrack && (
									<div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-8 border border-slate-700/50 backdrop-blur-sm">
										<div className="flex items-center gap-4 mb-6">
											<div
												className={`w-16 h-16 bg-gradient-to-br ${
													tracks.find((t) => t.key === currentTrack)?.gradient
												} rounded-2xl flex items-center justify-center shadow-lg`}
											>
												{tracks.find((t) => t.key === currentTrack)?.icon &&
													React.createElement(
														tracks.find((t) => t.key === currentTrack).icon,
														{
															className: "w-8 h-8 text-white",
														}
													)}
											</div>
											<div className="flex-1">
												<p className="text-white font-bold text-lg">
													{tracks.find((t) => t.key === currentTrack)?.label}
												</p>
												<p className="text-teal-400 text-sm font-medium">
													Now Playing
												</p>
											</div>
										</div>

										{/* Progress Bar */}
										<div className="space-y-3 mb-6">
											<input
												type="range"
												min="0"
												max={duration || 100}
												value={currentTime}
												onChange={handleSeek}
												className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer"
												style={{
													background: `linear-gradient(to right, rgb(20 184 166) 0%, rgb(6 182 212) ${
														(currentTime / duration) * 100
													}%, rgb(51 65 85) ${
														(currentTime / duration) * 100
													}%, rgb(51 65 85) 100%)`,
												}}
											/>
											<div className="flex justify-between text-sm font-medium">
												<span className="text-teal-400">
													{formatTime(currentTime)}
												</span>
												<span className="text-slate-400">
													{formatTime(duration)}
												</span>
											</div>
										</div>

										{/* Controls */}
										<div className="flex items-center justify-center gap-4 mb-6">
											<button
												onClick={skipBackward}
												className="p-3 hover:bg-slate-700/50 rounded-xl transition-all"
											>
												<SkipBack className="w-6 h-6 text-white" />
											</button>

											<button
												onClick={() => playTrack(currentTrack)}
												className="p-5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 rounded-full transition-all transform hover:scale-110 shadow-lg shadow-teal-500/50"
											>
												{isPlaying ? (
													<Pause className="w-8 h-8 text-white" />
												) : (
													<Play className="w-8 h-8 text-white ml-1" />
												)}
											</button>

											<button
												onClick={skipForward}
												className="p-3 hover:bg-slate-700/50 rounded-xl transition-all"
											>
												<SkipForward className="w-6 h-6 text-white" />
											</button>
										</div>

										{/* Volume Control */}
										<div className="flex items-center gap-4 px-4">
											<Volume2 className="w-5 h-5 text-teal-400" />
											<input
												type="range"
												min="0"
												max="1"
												step="0.01"
												value={volume}
												onChange={(e) => setVolume(parseFloat(e.target.value))}
												className="flex-1 h-2 bg-slate-700 rounded-full appearance-none cursor-pointer"
											/>
											<span className="text-sm font-medium text-slate-400 w-12 text-right">
												{Math.round(volume * 100)}%
											</span>
										</div>
									</div>
								)}

								{/* Track List */}
								<div className="grid gap-3">
									{tracks.map(({ key, label, icon: Icon, gradient }) => {
										const isCurrentlyPlaying =
											currentTrack === key && isPlaying;
										const isCurrentTrack = currentTrack === key;

										return (
											<div
												key={key}
												className={`flex items-center justify-between rounded-2xl p-4 border transition-all duration-300 ${
													isCurrentTrack
														? "bg-slate-800/50 border-teal-500/50 shadow-lg shadow-teal-500/10"
														: "bg-slate-800/30 hover:bg-slate-800/50 border-slate-700/50"
												}`}
											>
												<div className="flex items-center gap-4 flex-1">
													<button
														onClick={() => playTrack(key)}
														className={`p-3 rounded-xl transition-all duration-300 ${
															isCurrentTrack
																? `bg-gradient-to-br ${gradient} shadow-lg`
																: "bg-slate-700/50 hover:bg-slate-700"
														}`}
													>
														{isCurrentlyPlaying ? (
															<Pause className="w-5 h-5 text-white" />
														) : (
															<Play className="w-5 h-5 text-white" />
														)}
													</button>
													<Icon className="w-6 h-6 text-teal-400" />
													<span className="text-white font-medium">
														{label}
													</span>
													{isCurrentlyPlaying && (
														<div className="flex gap-1 ml-2">
															{[0, 1, 2].map((i) => (
																<div
																	key={i}
																	className="w-1 h-4 bg-teal-400 rounded-full animate-pulse"
																	style={{ animationDelay: `${i * 150}ms` }}
																/>
															))}
														</div>
													)}
												</div>
												<button
													onClick={() => handleDownload(key)}
													className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-all duration-300 shadow-lg shadow-teal-500/25"
												>
													<Download className="w-4 h-4" />
													<span className="hidden sm:inline">Download</span>
												</button>
											</div>
										);
									})}
								</div>

								<button
									onClick={reset}
									className="w-full bg-slate-800/50 hover:bg-slate-800 text-white font-semibold py-4 rounded-xl transition-all duration-300 border border-slate-700/50"
								>
									Process Another File
								</button>
							</div>
						)}

						{error && (
							<div className="bg-red-500/10 border border-red-500/50 text-red-400 px-6 py-4 rounded-xl backdrop-blur-sm">
								{error}
							</div>
						)}
					</div>
				</div>

				{/* Info Section */}
				<div className="mt-8 text-center text-slate-400 text-sm space-y-2">
					<p className="font-medium">
						Powered by <span className="text-teal-400">Demucs AI</span> +{" "}
						<span className="text-cyan-400">yt-dlp</span>
					</p>
					<div className="flex items-center justify-center gap-4 text-xs">
						<span className="px-3 py-1 bg-slate-800/50 rounded-full">
							Linux
						</span>
						<span className="px-3 py-1 bg-slate-800/50 rounded-full">
							macOS
						</span>
						<span className="px-3 py-1 bg-slate-800/50 rounded-full">
							Windows
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}
