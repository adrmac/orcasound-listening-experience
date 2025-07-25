import "videojs-offset";

import {
  MutableRefObject,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { type PlayerStatus } from "@/components/Player/Player";
import { type VideoJSPlayer } from "@/components/Player/VideoJS";
import { useData } from "@/context/DataContext";
import { useNowPlaying } from "@/context/NowPlayingContext";
// import { useData } from "@/context/DataContext";
import { Feed } from "@/graphql/generated";
import { useAudioAnalyser } from "@/hooks/beta/useAudioAnalyzer";
import { getHlsURI } from "@/hooks/useTimestampFetcher";
import { colormapOptions, generateColorScale } from "@/utils/colorMaps";

import AudioVisualizer from "./AudioVisualizer";
import { PlayerBase } from "./PlayerBase";
import SpectrogramCanvas from "./SpectrogramCanvas";
import WaveformCanvas from "./WaveformCanvas";

// // dynamically import VideoJS to speed up initial page load
// const VideoJS = dynamic(() => import("../Player/VideoJS"));

export function CandidatePlayer({
  clipDateTime,
  clipNode,
  feed,
  image,
  marks,
  playlistTimestamp,
  startOffset,
  endOffset,
  duration,
  onAudioPlay,
  onPlay,
  masterPlayerTimeRef,
}: {
  clipDateTime?: string;
  clipNode?: string;
  feed: Feed;
  image: string | undefined;
  marks?: { label: string | ReactNode; value: number }[];
  playlistTimestamp: number;
  startOffset: number;
  endOffset: number;
  duration?: string;
  onAudioPlay?: () => void;
  onPlayerInit?: (player: VideoJSPlayer) => void;
  onPlay?: () => void;
  masterPlayerTimeRef?: MutableRefObject<number>;
}) {
  const {
    masterPlayerRef,
    masterPlayerStatus,
    setMasterPlayerStatus,
    onPlayerEnd,
  } = useNowPlaying();
  const { autoPlayOnReady } = useData();
  const [playerStatus, setPlayerStatus] = useState<PlayerStatus>("idle");
  const playerRef = useRef<VideoJSPlayer | null>(null);
  const [playerTime, setPlayerTime] = useState(startOffset);

  const hlsURI = getHlsURI(feed.bucket, feed.nodeName, playlistTimestamp);

  const playerOptions = useMemo(
    () => ({
      autoplay: false,
      flash: {
        hls: {
          overrideNative: true,
        },
      },
      html5: {
        hls: {
          overrideNative: true,
        },
      },
      sources: [
        {
          // If hlsURI isn't set, use a dummy URI to trigger an error
          // The dummy URI doesn't actually exist, it should return 404
          // This is the only way to get videojs to throw an error, otherwise
          // it just won't initialize (if src is undefined/null/empty))
          src: hlsURI ?? `${feed.nodeName}/404`,
          type: "application/x-mpegurl",
        },
      ],
    }),
    [hlsURI, feed?.nodeName],
  );

  const handleReady = useCallback(
    (player: VideoJSPlayer) => {
      playerRef.current = player;
      // auto-play the player when it mounts -- mounting is triggered in Playbar based on nowPlaying
      if (playerRef.current) {
        masterPlayerRef.current = playerRef.current;
        if (autoPlayOnReady.current) player.play();
      }
      player.on("playing", () => {
        setPlayerStatus("playing");
        setMasterPlayerStatus("playing");
        autoPlayOnReady.current = true;
        const currentTime = player.currentTime() ?? 0;
        if (currentTime < startOffset || currentTime > endOffset) {
          player.currentTime(startOffset);
        }
        if (onPlay) onPlay();
      });
      player.on("pause", () => {
        setPlayerStatus("paused");
        setMasterPlayerStatus("paused");
      });
      player.on("waiting", () => {
        setPlayerStatus("loading");
        setMasterPlayerStatus("loading");
      });
      player.on("error", () => {
        setPlayerStatus("error");
        setMasterPlayerStatus("error");
      });

      player.on("timeupdate", () => {
        const currentTime = player.currentTime() ?? 0;
        if (currentTime > endOffset) {
          player.currentTime(startOffset);
          if (masterPlayerTimeRef) masterPlayerTimeRef.current = startOffset;
          setPlayerTime(startOffset);
          player.pause();
          if (onPlayerEnd) onPlayerEnd();
        } else {
          setPlayerTime(currentTime);
          if (masterPlayerTimeRef) masterPlayerTimeRef.current = currentTime;
        }
      });
      player.on("loadedmetadata", () => {
        // On initial load, set player time to startOffset
        player.currentTime(startOffset);
      });
    },
    [
      startOffset,
      endOffset,
      onPlay,
      onPlayerEnd,
      masterPlayerRef,
      setMasterPlayerStatus,
      masterPlayerTimeRef,
      autoPlayOnReady,
    ],
  );

  const handlePlayPauseClick = () => {
    const player = playerRef.current;

    if (playerStatus === "error") {
      setPlayerStatus("idle");
      setMasterPlayerStatus("idle");
      return;
    }

    if (!player) {
      setPlayerStatus("error");
      setMasterPlayerStatus("error");
      return;
    }

    try {
      if (playerStatus === "loading" || playerStatus === "playing") {
        player.pause();
      } else {
        player.play();
        onAudioPlay?.();
      }
    } catch (e) {
      console.error(e);
      // AbortError is thrown if pause() is called while play() is still loading (e.g. if segments are 404ing)
      // It's not important, so don't show this error to the user
      if (e instanceof DOMException && e.name === "AbortError") return;
      setPlayerStatus("error");
      setMasterPlayerStatus("error");
    }
  };

  useEffect(() => {
    if (process.env.NODE_ENV === "development" && hlsURI) {
      console.log(`New stream instance: ${hlsURI}`);
    }
    return () => {
      setPlayerStatus("idle");
      setMasterPlayerStatus("error");
    };
  }, [hlsURI, feed.nodeName, setMasterPlayerStatus, setPlayerStatus]);

  useEffect(() => {
    console.log("playerStatus: " + playerStatus);
    console.log("masterPlayerStatus: " + masterPlayerStatus);
  }, [playerStatus, masterPlayerStatus]);

  const el = playerRef.current?.el(); // from video.js
  const videoEl = el?.querySelector("video") as HTMLMediaElement | null;
  const { analyser, getFrequencyData, getWaveformData, getCurrentTime } =
    useAudioAnalyser(videoEl);
  const [selectedMap, setSelectedMap] = useState("magma");
  const [selectedScale, setSelectedScale] = useState<"linear" | "log">("log");

  const colorMap = useMemo(
    () => generateColorScale(selectedMap),
    [selectedMap],
  );

  return (
    <div className="playerbase">
      <PlayerBase
        type="candidate"
        playerOptions={playerOptions}
        startOffset={startOffset}
        endOffset={endOffset}
        duration={duration}
        handleReady={handleReady}
        playerStatus={playerStatus}
        feed={feed}
        image={image}
        playerTitle={clipDateTime}
        playerSubtitle={clipNode}
        marks={marks}
        playerRef={playerRef}
        playerTime={playerTime}
        onAudioPlay={onAudioPlay}
        handlePlayPauseClickCandidate={handlePlayPauseClick}
      />
      {videoEl && analyser && <WaveformCanvas analyser={analyser} />}
      {videoEl && analyser && <SpectrogramCanvas analyser={analyser} />}
      {videoEl && (
        <>
          {" "}
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
          <AudioVisualizer
            getFrequencyData={getFrequencyData}
            getWaveformData={getWaveformData}
            getCurrentTime={getCurrentTime}
            colorMap={colorMap}
            scale={selectedScale}
          />
        </>
      )}
    </div>
  );
}
