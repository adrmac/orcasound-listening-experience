import { Box, Stack, Theme, useMediaQuery } from "@mui/material";
import { useRouter } from "next/router";
import React, { useEffect, useRef, useState } from "react";

import DetailTabs from "@/components/CandidateList/DetailTabs";
import { HalfMapLayout } from "@/components/layouts/HalfMapLayout/HalfMapLayout";
import { MasterDataLayout } from "@/components/layouts/MasterDataLayout";
import AudioVisualizer from "@/components/PlayBar/AudioVisualizer";
import LivePlayer from "@/components/PlayBar/LivePlayer";
import { useData } from "@/context/DataContext";
import { useLayout } from "@/context/LayoutContext";
import { useNowPlaying } from "@/context/NowPlayingContext";

function HydrophonePage() {
  const { setPlaybarExpanded } = useLayout();
  setPlaybarExpanded(false);
  return null;
}

export const FeedRightDetail = () => {
  const router = useRouter();
  const feedSlug = router.query.feedSlug;
  // const mdDown = useMediaQuery((theme: Theme) => theme.breakpoints.down("md"));

  const { feeds } = useData();
  const feed = feeds.find((feed) => feed.slug === feedSlug);

  const tabs = [
    { title: "About", slug: "" },
    { title: "Images", slug: "#" },
  ];

  return (
    <>
      {feedSlug && (
        <DetailTabs showHeading={true} tabs={tabs} key={feedSlug.toString()}>
          <Box sx={{ px: 3, py: 1 }}>
            {feed?.introHtml ? (
              <div
                className="intro"
                dangerouslySetInnerHTML={{ __html: feed?.introHtml }}
              />
            ) : (
              JSON.stringify(feed, null, 2)
            )}
          </Box>
        </DetailTabs>
      )}
    </>
  );
};

const OuterDrawerDetail = ({
  audioVisualizer,
}: {
  audioVisualizer: React.ReactElement;
}) => {
  const router = useRouter();
  const feedSlug = router.query.feedSlug;
  // const mdDown = useMediaQuery((theme: Theme) => theme.breakpoints.down("md"));

  const { feeds } = useData();
  const feed = feeds.find((feed) => feed.slug === feedSlug);

  const tabs = [
    { title: "About", slug: "" },
    { title: "Images", slug: "#" },
  ];

  const { liveSpectrogram } = useLayout();

  return (
    <Stack
      sx={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        paddingBottom: "100%",
      }}
    >
      {/* <AudioVisualizer /> */}
      {/* {audioVisualizer && (
        <Box
          sx={{
            height: liveSpectrogram ? "unset" : 0,
            overflow: "hidden",
            transition: "all .66s ease",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {audioVisualizer}
        </Box>
      )} */}
      {feedSlug && (
        <DetailTabs showHeading={true} tabs={tabs} key={feedSlug.toString()}>
          <Box sx={{ px: 3, py: 1 }}>
            {feed?.introHtml ? (
              <div
                className="intro"
                dangerouslySetInnerHTML={{ __html: feed?.introHtml }}
              />
            ) : (
              JSON.stringify(feed, null, 2)
            )}
          </Box>
        </DetailTabs>
      )}
    </Stack>
  );
};

const CenterDetail = ({
  audioVisualizer,
}: {
  audioVisualizer?: React.ReactElement;
}) => {
  const mdDown = useMediaQuery((theme: Theme) => theme.breakpoints.down("md"));
  const router = useRouter();
  const feedSlug = router.query.feedSlug;
  console.log("rendering AudioVisualizer in CenterDetail");

  return <>{feedSlug && audioVisualizer}</>;
};

const FeedSlugLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const mdDown = useMediaQuery((theme: Theme) => theme.breakpoints.down("md"));
  const { feeds, autoPlayOnReady } = useData();
  const { feedSlug } = router.query;
  const feed = feeds.find((feed) => feed.slug === feedSlug);
  const { setNowPlayingCandidate, setNowPlayingFeed, nowPlayingFeed } =
    useNowPlaying();

  // load a new feed into nowPlaying on page load
  useEffect(() => {
    if (!feedSlug || !feeds.length) return;

    const newFeed = feeds.find((feed) => feed.slug === feedSlug);
    if (newFeed && newFeed !== nowPlayingFeed) {
      setNowPlayingFeed(newFeed);
      setNowPlayingCandidate(null);
      autoPlayOnReady.current = false;
    }
  }, [feedSlug, feeds, nowPlayingFeed]);

  const audioVisualizer = (
    <AudioVisualizer key={`${router.query.feedSlug}-cd-${mdDown}`} />
  );

  const {
    setPlaybarExpanded,
    setInnerDrawerHeight,
    innerDrawerHeights,
    outerDrawerHeight,
    setOuterDrawerHeight,
    outerDrawerHeights,
  } = useLayout();

  // Collapse then expand playbar
  const [feedSlugState, setFeedSlugState] = useState<
    string | string[] | undefined
  >(undefined);

  const previousFeedSlugRef = useRef<string | string[] | undefined>();

  // necessary to ensure the next useEffect runs
  useEffect(() => {
    console.log("nowPlayingFeed", nowPlayingFeed);
    setFeedSlugState(router.query.feedSlug);
    console.log("setting feedSlugState to: ", router.query.feedSlug);
  }, [router.query.feedSlug, setFeedSlugState]);

  // Playbar open/close logic on route change
  useEffect(() => {
    // Don't do anything if there's no candidateId
    if (!feedSlugState) return;

    // Skip if same as previous
    if (previousFeedSlugRef.current === feedSlugState) return;

    // Save new value
    previousFeedSlugRef.current = feedSlugState;

    if (mdDown) {
      // Collapse then expand playbar
      setInnerDrawerHeight(innerDrawerHeights.min);
      setOuterDrawerHeight(outerDrawerHeights.min);
      const timeout = setTimeout(() => {
        setOuterDrawerHeight(outerDrawerHeights.low);
      }, 700);

      return () => clearTimeout(timeout);
    }
  }, [
    feedSlugState,
    setInnerDrawerHeight,
    setOuterDrawerHeight,
    innerDrawerHeights,
    outerDrawerHeights,
  ]);

  return (
    <HalfMapLayout
      // leftSlot={<CandidatesStack />}
      centerDrawer={
        <>
          <div id="test">
            HELLO{feed ? "feed" : "no feed"}
            {feed && mdDown && <LivePlayer currentFeed={feed} />}
          </div>
          <CenterDetail audioVisualizer={audioVisualizer} />
        </>
      }
      rightSlot={!mdDown && <FeedRightDetail />}
      outerDrawer={
        mdDown && (
          <>
            <OuterDrawerDetail audioVisualizer={audioVisualizer} />
          </>
        )
      }
    />
  );
};

HydrophonePage.getLayout = function getLayout(page: React.ReactElement) {
  return (
    <MasterDataLayout>
      <FeedSlugLayout>{page}</FeedSlugLayout>
    </MasterDataLayout>
  );
};

export default HydrophonePage;
