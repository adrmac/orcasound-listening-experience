import { KeyboardArrowDown } from "@mui/icons-material";
import { Box, Button, Theme, useMediaQuery } from "@mui/material";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";

import { useLayout } from "@/context/LayoutContext";
import { useNowPlaying } from "@/context/NowPlayingContext";
import useFeedPresence from "@/hooks/useFeedPresence";
import { useTimestampFetcher } from "@/hooks/useTimestampFetcher";
import { colormapOptions, generateColorScale } from "@/utils/colorMaps";

import DetectionButton from "../CandidateList/DetectionButtonBeta";
import DetectionDialog from "../CandidateList/DetectionDialogBeta";
import SpectrogramCanvas from "./SpectrogramCanvas";
import WaveformCanvas from "./WaveformCanvas";

const getWaveformData = (analyser: AnalyserNode): Uint8Array | null => {
  if (!analyser) return null;

  const data = new Uint8Array(analyser.fftSize);
  analyser.getByteTimeDomainData(data);
  return data;
};

const getFrequencyData = (analyser: AnalyserNode): Uint8Array | null => {
  if (!analyser) return null;

  const data = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(data);
  return data;
};

function AudioVisualizer() {
  const mdDown = useMediaQuery((theme: Theme) => theme.breakpoints.down("md"));
  const router = useRouter();
  const {
    analyserNodeRef,
    masterPlayerRef,
    masterPlayerStatus,
    nowPlayingFeed,
  } = useNowPlaying();
  const { setPlaybarExpanded } = useLayout();

  const { timestamp } = useTimestampFetcher(
    nowPlayingFeed?.bucket,
    nowPlayingFeed?.nodeName,
  );

  const feedPresence = useFeedPresence(nowPlayingFeed?.slug);
  const listenerCount = feedPresence?.metas.length ?? 0;

  const [selectedMap, setSelectedMap] = useState("magma");
  const [selectedScale, setSelectedScale] = useState<"linear" | "log">("log");

  const colorMap = useMemo(
    () => generateColorScale(selectedMap),
    [selectedMap],
  );

  const spectrogramRef = useRef<HTMLCanvasElement>(null);
  const waveformRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  const width = 1000;
  const heightSpectrogram = 500;
  const heightWaveform = 80;

  const isSilent = (data: Uint8Array) => data.every((val) => val === 0);

  const [readyToDraw, setReadyToDraw] = useState(false);

  useEffect(() => {
    console.log("Visualizer feed update:", nowPlayingFeed?.slug);
  }, [nowPlayingFeed?.slug]);

  useEffect(() => {
    const interval = setInterval(() => {
      const analyser = analyserNodeRef.current;
      const spectrogramCtx = spectrogramRef.current?.getContext("2d");
      const waveformCtx = waveformRef.current?.getContext("2d");

      if (analyser && spectrogramCtx && waveformCtx) {
        console.log("All components ready for drawing");
        setReadyToDraw(true);
        clearInterval(interval);
      }
    }, 100); // Check every 100ms

    return () => clearInterval(interval);
  }, [analyserNodeRef]);

  useEffect(() => {
    const analyser = analyserNodeRef.current;
    console.log("this ran!!!!!!!!!!!!!!!!!!", analyser);
    if (!analyser) return;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let frameId: number;

    const test = () => {
      analyser.getByteTimeDomainData(dataArray);
      const avg =
        dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length;
      console.log("Avg volume", avg); // Should vary if audio is coming through
      frameId = requestAnimationFrame(test);
    };

    test();

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [nowPlayingFeed]);

  useEffect(() => {
    const analyser = analyserNodeRef.current;
    const spectrogramCtx = spectrogramRef.current?.getContext("2d");
    const waveformCtx = waveformRef.current?.getContext("2d");

    if (!spectrogramCtx || !waveformCtx || !analyser || !readyToDraw) {
      return;
    }
    console.log("analyser after feedSlug change", analyser);
    console.log("analyser source count", analyser?.numberOfInputs);

    console.log("🎨 Starting draw loop for feedSlug:", router.query.feedSlug);

    const draw = () => {
      // spectrogramCtx?.clearRect(0, 0, width, heightSpectrogram);
      // waveformCtx?.clearRect(0, 0, width, heightWaveform);

      const freqData = getFrequencyData(analyser);
      const waveData = getWaveformData(analyser);

      const audioActive =
        freqData && waveData && !isSilent(freqData) && !isSilent(waveData);

      if (!audioActive) {
        animationRef.current = requestAnimationFrame(draw);
        return;
      }

      // === SPECTROGRAM ===
      const imageDataSpec = spectrogramCtx.getImageData(
        1,
        0,
        width - 1,
        heightSpectrogram,
      );
      spectrogramCtx.putImageData(imageDataSpec, 0, 0);
      spectrogramCtx.clearRect(width - 1, 0, 1, heightSpectrogram);

      for (let y = 0; y < heightSpectrogram; y++) {
        let index = 0;
        const norm = y / heightSpectrogram;

        if (selectedScale === "log") {
          const logIndex = (Math.pow(10, norm * 1) - 1) / 9;
          index = logIndex * (freqData.length - 1);
        } else {
          index = norm * (freqData.length - 1);
        }

        const i0 = Math.floor(index);
        const i1 = Math.min(i0 + 1, freqData.length - 1);
        const t = index - i0;

        const interpolated = freqData[i0] * (1 - t) + freqData[i1] * t;

        const color = colorMap[Math.round(interpolated)];
        const drawY = heightSpectrogram - 1 - y;

        spectrogramCtx.fillStyle = color;
        spectrogramCtx.fillRect(width - 1, drawY, 1, 1);
      }

      // === WAVEFORM ===
      const imageDataWave = waveformCtx.getImageData(
        1,
        0,
        width - 1,
        heightWaveform,
      );
      waveformCtx.putImageData(imageDataWave, 0, 0);
      waveformCtx.clearRect(width - 1, 0, 1, heightWaveform);

      waveformCtx.beginPath();
      for (let i = 0; i < waveData.length; i++) {
        const v = waveData[i] / 255.0;
        const y = heightWaveform - v * heightWaveform;
        const x = width - 1;
        if (i === 0) {
          waveformCtx.moveTo(x, y);
        } else {
          waveformCtx.lineTo(x, y);
        }
      }

      waveformCtx.strokeStyle = "#00f";
      waveformCtx.stroke();

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
        console.log("🛑 Stopped draw loop on feedSlug change");
        spectrogramCtx?.clearRect(0, 0, width, heightSpectrogram);
        waveformCtx?.clearRect(0, 0, width, heightWaveform);
      }
    };
  }, [colorMap, selectedScale, readyToDraw, router.query.feedSlug]);

  useEffect(() => {
    const spectrogramCtx = spectrogramRef.current?.getContext("2d");
    const waveformCtx = waveformRef.current?.getContext("2d");

    spectrogramCtx?.clearRect(0, 0, width, heightSpectrogram);
    waveformCtx?.clearRect(0, 0, width, heightWaveform);
  }, [router.query.feedSlug]);

  return (
    <div
      className={`playerbase ${nowPlayingFeed?.slug}`}
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        className="drawer-controls"
        sx={{
          minHeight: "36px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          paddingX: "8px",
          borderBottom: "1px solid rgba(255,255,255,.25)",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", gap: "16px" }}>
          <label>
            Color scheme:
            <select
              value={selectedMap}
              onChange={(e) => setSelectedMap(e.target.value)}
            >
              {colormapOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Scale:
            <select
              value={selectedScale}
              onChange={(e) =>
                setSelectedScale(e.target.value as "linear" | "log")
              }
            >
              <option key={1} value={"linear"}>
                Linear
              </option>
              <option key={2} value={"log"}>
                Logarithmic
              </option>
            </select>
          </label>
        </div>
        {!mdDown && (
          <Button
            size="small"
            endIcon={<KeyboardArrowDown />}
            onClick={() => {
              setPlaybarExpanded(false);
            }}
          >
            Close visualizer
          </Button>
        )}
      </Box>
      <canvas
        ref={waveformRef}
        width={width}
        height={heightWaveform}
        style={{ width: "100%" }}
      />
      <canvas
        ref={spectrogramRef}
        width={width}
        height={heightSpectrogram}
        style={{ width: "100%", flex: 1 }}
      />
      <WaveformCanvas
        analyser={analyserNodeRef.current}
        // key={`${nowPlayingFeed?.slug}-wf-${mdDown}`}
      />
      <SpectrogramCanvas
        analyser={analyserNodeRef.current}
        // key={`${nowPlayingFeed?.slug}-sp-${mdDown}`}
      />
      <div
        style={{
          height: mdDown ? "unset" : "150px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px 24px",
          flex: 1,
        }}
      >
        <div
          className="detection-button"
          style={{
            width: mdDown ? "100%" : "66%",
            height: "48px",
          }}
        >
          {(masterPlayerStatus === "playing" ||
            masterPlayerStatus === "loading") &&
            nowPlayingFeed && (
              <DetectionDialog
                isPlaying={masterPlayerStatus === "playing"}
                feed={nowPlayingFeed}
                timestamp={timestamp}
                getPlayerTime={() => masterPlayerRef.current?.currentTime()}
                listenerCount={listenerCount}
              >
                <DetectionButton />
              </DetectionDialog>
            )}
          {masterPlayerStatus !== "playing" && (
            <DetectionButton disabled={true} />
          )}
        </div>
      </div>
    </div>
  );
}

export default AudioVisualizer;
