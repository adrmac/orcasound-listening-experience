import { Close } from "@mui/icons-material";
import {
  Box,
  Container,
  Stack,
  Theme,
  Typography,
  useMediaQuery,
} from "@mui/material";
import Head from "next/head";
import { useRouter } from "next/router";
import React, {
  ReactElement,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import CommunityBar from "@/components/CandidateList/CommunityBar";
import DetailTabs from "@/components/CandidateList/DetailTabs";
import { DetectionsList } from "@/components/CandidateList/DetectionsList";
import { HalfMapLayout } from "@/components/layouts/HalfMapLayout/HalfMapLayout";
import { MasterDataLayout } from "@/components/layouts/MasterDataLayout";
import Link from "@/components/Link";
import LoadingSpinner from "@/components/LoadingSpinner";
import WavesurferPlayer from "@/components/PlayBar/WavesurferPlayer";
import { useData } from "@/context/DataContext";
import { useLayout } from "@/context/LayoutContext";
import { useNowPlaying } from "@/context/NowPlayingContext";
import { Feed } from "@/graphql/generated";
import { useComputedPlaybackFields } from "@/hooks/beta/useComputedPlaybackFields";
import useConcatenatedAudio from "@/hooks/beta/useConcatenatedAudio";
import {
  AIData,
  Candidate,
  CombinedData,
  HumanData,
  Sighting,
} from "@/types/DataTypes";
import formatDuration from "@/utils/masterDataHelpers";
import { formatTimestamp } from "@/utils/time";

import { FeedRightDetail } from ".";

function CandidatePage() {
  return null;
}

type DetectionsProps = {
  all: CombinedData[];
  human: HumanData[];
  ai: AIData[];
  sightings: Sighting[];
  hydrophone: string;
  startTime: string;
};

const tabs = [
  { title: "Live reports", slug: "" },
  { title: "Comments", slug: "#" },
];

const RightDetail = ({
  candidate,
  feed,
  detections,
  durationString,
  onClose,
  candidateHeading,
}: {
  candidate: Candidate | null;
  feed?: Feed;
  detections: DetectionsProps;
  durationString: string | undefined | null;
  onClose: () => void;
  candidateHeading: ReactElement;
}) => {
  if (!detections?.startTime) return null;

  return (
    <div>
      <Head>Report {candidate?.id} | Orcasound </Head>
      <Container
        sx={{
          padding: "24px 0px !important",
        }}
      >
        <>
          {candidateHeading}
          <Box className="candidate-detections">
            <DetailTabs showHeading={false} tabs={tabs} showChart={false}>
              {candidate && (
                <div style={{ margin: "0 24px" }}>
                  <DetectionsList candidate={candidate} />
                </div>
              )}
            </DetailTabs>
          </Box>
        </>
      </Container>
    </div>
  );
};

const CenterDetail = ({
  clipId,
  audioUrl,
  spectrogramUrl,
  isProcessing,
  error,
  totalDurationMs,
  droppedSeconds,
  candidateHeading,
  candidate,
}: {
  clipId: string;
  audioUrl: string | undefined;
  spectrogramUrl: string | null;
  isProcessing: boolean;
  error: string | null;
  totalDurationMs: string | null;
  droppedSeconds: number;
  candidateHeading?: ReactElement;
  candidate: Candidate | null;
}) => {
  const mdDown = useMediaQuery((theme: Theme) => theme.breakpoints.down("md"));

  return (
    <Stack
      sx={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
      }}
    >
      {candidateHeading}

      {audioUrl && (
        <Box
          className="drawer-controls"
          sx={{
            minHeight: mdDown ? "none" : "36px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            paddingX: mdDown ? "24px" : "8px",
            borderBottom: "1px solid rgba(255,255,255,.7)",
          }}
        >
          {!mdDown && (
            <a href={audioUrl} download={`clip-${clipId}.mp3`}>
              Download MP3
            </a>
          )}
        </Box>
      )}
      <Box
        className="wavesurfer-container"
        sx={{
          flex: 1,
        }}
      >
        <Box
          sx={{
            margin: "8px",
            height: "100%",
            maxWidth: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: isProcessing ? "center" : "flex-start",
          }}
        >
          {isProcessing ? (
            <Stack gap={3}>
              <LoadingSpinner />
              {"Building audio file..."}
            </Stack>
          ) : error ? (
            <p>Error: {error}</p>
          ) : audioUrl ? (
            <div style={{ width: "100%" }}>
              <WavesurferPlayer audioUrl={audioUrl} />
              {/* <div>{totalDurationMs} ms</div>
              {droppedSeconds > 0 && (
                <div>Dropped {droppedSeconds} seconds from stream reset</div>
              )} */}
            </div>
          ) : (
            <p>No audio available.</p>
          )}
        </Box>
      </Box>
      <Box className="candidate-detections">
        <DetailTabs showHeading={false} tabs={tabs} showChart={false}>
          {candidate && <DetectionsList candidate={candidate} />}
        </DetailTabs>
      </Box>
    </Stack>
  );
};

const CandidateLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const { feeds, sortedCandidates, filteredData, autoPlayOnReady } = useData();
  const {
    setPlaybarExpanded,
    setInnerDrawerHeight,
    setOuterDrawerHeight,
    innerDrawerHeights,
    outerDrawerHeights,
  } = useLayout();
  const { setNowPlayingCandidate, setNowPlayingFeed } = useNowPlaying();
  const mdDown = useMediaQuery((theme: Theme) => theme.breakpoints.down("md"));

  const { candidateId, feedSlug } = router.query;

  const feed = feeds.find((f) => f.slug === feedSlug) ?? undefined;
  const feedId = useMemo(() => {
    return feeds.find((f) => f.slug === feedSlug)?.id ?? "";
  }, [feeds, feedSlug]);
  const candidate = sortedCandidates.find((c) => c.id === candidateId) ?? null;
  const startEnd = useMemo(() => {
    return typeof candidateId === "string" ? candidateId?.split("_") : [];
  }, [candidateId]);
  const startTimeString = startEnd[0];
  const endTimeString = startEnd[startEnd.length - 1];
  const startTimeMs = new Date(startEnd[0]).getTime();
  const endTimeMs = new Date(startEnd[startEnd.length - 1]).getTime();

  const { durationString } = useComputedPlaybackFields(candidate);

  const [detections, setDetections] = useState<DetectionsProps>({
    all: [],
    human: [],
    ai: [],
    sightings: [],
    hydrophone: "",
    startTime: "",
  });

  const [candidateIdState, setCandidateIdState] = useState<
    string | string[] | undefined
  >(undefined);

  const previousCandidateIdRef = useRef<string | string[] | undefined>();

  // necessary to ensure the next useEffect runs
  useEffect(() => {
    setCandidateIdState(candidateId);
  }, [candidateId, setCandidateIdState]);

  // Playbar open/close logic on route change
  useEffect(() => {
    // Don't do anything if there's no candidateId
    if (!candidateIdState) return;

    // Skip if same as previous
    if (previousCandidateIdRef.current === candidateIdState) return;

    // Save new value
    previousCandidateIdRef.current = candidateIdState;

    // Collapse then expand playbar
    setPlaybarExpanded(false);
    setInnerDrawerHeight(innerDrawerHeights.low);
    const timeout = setTimeout(() => {
      if (!mdDown) setPlaybarExpanded(true);
      if (mdDown) setOuterDrawerHeight(outerDrawerHeights.max);
    }, 700);

    return () => clearTimeout(timeout);
  }, [
    candidateIdState,
    setPlaybarExpanded,
    setInnerDrawerHeight,
    setOuterDrawerHeight,
    innerDrawerHeights,
    outerDrawerHeights,
  ]);

  // Now Playing logic
  useEffect(() => {
    setNowPlayingCandidate(candidate);
    setNowPlayingFeed(null);
  }, [candidate, setNowPlayingCandidate, setNowPlayingFeed]);

  // Detections lookup
  useEffect(() => {
    const arr: CombinedData[] = [];
    filteredData.forEach((d) => {
      const time = new Date(d.timestamp.toString()).getTime();
      if (time >= startTimeMs && time <= endTimeMs && d.feedId === feed?.id) {
        arr.push(d);
      }
    });
    const sortedArr = arr.sort(
      (a, b) =>
        Date.parse(a.timestamp.toString()) - Date.parse(b.timestamp.toString()),
    );

    setDetections({
      all: sortedArr,
      human: sortedArr.filter((d) => d.type === "human"),
      ai: sortedArr.filter((d) => d.type === "ai"),
      sightings: sortedArr.filter((d) => d.type === "sightings"),
      hydrophone: sortedArr[0]?.hydrophone,
      startTime: new Date(startTimeString).toLocaleString(),
    });
  }, [filteredData, feed?.id, startTimeMs, endTimeMs, startTimeString]);

  const handleClose = () => {
    setNowPlayingFeed(feed ?? null);
    setNowPlayingCandidate(null);
    autoPlayOnReady.current = false;
    setPlaybarExpanded(false);
    setOuterDrawerHeight(outerDrawerHeights.min);
  };

  const {
    audioBlob,
    spectrogramUrl,
    isProcessing,
    error,
    totalDurationMs,
    droppedSeconds,
  } = useConcatenatedAudio({
    feedId,
    startTime: startTimeString,
    endTime: endTimeString,
  });

  const [audioUrl, setAudioUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    setAudioUrl(undefined);
  }, [router.asPath]);

  useEffect(() => {
    if (!startTimeString || !endTimeString) return;

    let url: string | null = null;

    if (audioBlob) {
      url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
    } else {
      setAudioUrl(undefined);
    }

    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [audioBlob, startTimeString, endTimeString]);

  const { filters } = useData();

  const currentTimeSeconds = new Date().getTime() / 1000;
  const timestampSeconds =
    new Date(candidate?.startTimestamp ?? "").getTime() / 1000;
  const timeAgoString = formatDuration(timestampSeconds, currentTimeSeconds);

  const candidateHeading = (
    <Box className="candidate-heading">
      <Box
        sx={{
          px: 3,
          display: "flex",
          justifyContent: "space-between",
          mt: mdDown ? 0.25 : 0,
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ lineHeight: 1, my: ".5rem" }}>
            {formatTimestamp(detections.startTime)}
          </Typography>

          <Typography
            variant="h6"
            sx={{ lineHeight: 1.2, opacity: 0.75, mb: "4px" }}
          >
            {detections.hydrophone}
          </Typography>

          <Typography variant="body1" sx={{ lineHeight: 1.2, opacity: 0.75 }}>
            {timeAgoString} ago
            {" · "}
            {durationString}
            {" · "}
            Reports within {filters?.timeIncrement} min
          </Typography>
        </Box>
        {!mdDown && (
          <Link href={`/beta/${feed?.slug}`} onClick={handleClose}>
            <Close />
          </Link>
        )}
      </Box>
      <Stack gap={2} direction="column" sx={{ my: 3, px: 3 }}>
        <CommunityBar votes={0} audioUrl={audioUrl} clipId={startTimeString} />
      </Stack>
    </Box>
  );

  return (
    <HalfMapLayout
      // leftSlot={<LeftDetail feed={feed} />}
      centerDrawer={
        <CenterDetail
          clipId={startTimeString}
          audioUrl={audioUrl}
          spectrogramUrl={spectrogramUrl}
          isProcessing={isProcessing}
          error={error}
          totalDurationMs={totalDurationMs}
          droppedSeconds={droppedSeconds}
          candidate={candidate}
        />
      }
      rightSlot={<FeedRightDetail />}
      rightDrawer={
        <RightDetail
          candidate={candidate}
          feed={feed}
          detections={detections}
          durationString={durationString}
          onClose={handleClose}
          candidateHeading={candidateHeading}
        />
      }
      outerDrawer={
        mdDown && (
          <CenterDetail
            clipId={startTimeString}
            audioUrl={audioUrl}
            spectrogramUrl={spectrogramUrl}
            isProcessing={isProcessing}
            error={error}
            totalDurationMs={totalDurationMs}
            droppedSeconds={droppedSeconds}
            candidateHeading={candidateHeading}
            candidate={candidate}
          />
        )
      }
    >
      {children}
    </HalfMapLayout>
  );
};

CandidatePage.getLayout = function getLayout(page: React.ReactElement) {
  return (
    <MasterDataLayout>
      <CandidateLayout>{page}</CandidateLayout>
    </MasterDataLayout>
  );
};

export default CandidatePage;
