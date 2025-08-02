import { ArrowBackIos } from "@mui/icons-material";
import {
  Box,
  Paper,
  Stack,
  Theme,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { ReactElement, ReactNode } from "react";

import { useData } from "@/context/DataContext";
import { useLayout } from "@/context/LayoutContext";
import { useNowPlaying } from "@/context/NowPlayingContext";
import darkTheme from "@/styles/darkTheme";
import { countString } from "@/utils/countString";
import { standardizeFeedName } from "@/utils/masterDataHelpers";

import AudioVisualizer from "../PlayBar/AudioVisualizer";
import LivePlayer from "../PlayBar/LivePlayer";
import ReportsBarChart from "./ReportsBarChart";

const hosts = [
  {
    hydrophone: "orcasound-lab",
    name: "Beam Reach",
    link: "http://www.beamreach.blue/",
  },
  {
    hydrophone: "north-sjc",
    name: "Orca Behavior Institute",
    link: "https://www.orcabehaviorinstitute.org/",
  },
  {
    hydrophone: "sunset-bay",
    name: "Beach Camp at Sunset Bay",
    link: "https://www.sunsetbaywharf.com/",
  },
  {
    hydrophone: "port-townsend",
    name: "Port Townsend Marine Science Center",
    link: "http://www.ptmsc.org/",
  },
  {
    hydrophone: "bush-point",
    name: "Orca Network",
    link: "https://orcanetwork.org/",
  },
];

type Tab = {
  title: string;
  slug: string;
};

const DetailTabs = ({
  children,
  tabs,
  drawer = false,
  showHeading = true,
  showTabs = true,
  showChart = true,
  audioVisualizer,
}: {
  children: ReactNode;
  tabs?: Tab[];
  drawer?: boolean;
  showHeading?: boolean;
  showTabs?: boolean;
  showChart?: boolean;
  audioVisualizer?: ReactElement;
}) => {
  const router = useRouter();
  const { feedSlug } = router.query;
  const mdDown = useMediaQuery((theme: Theme) => theme.breakpoints.down("md"));

  // const mdDown = useMediaQuery((theme: Theme) => theme.breakpoints.down("md"));
  const theme = useTheme();
  const { setNowPlayingCandidate, setNowPlayingFeed, masterPlayerStatus } =
    useNowPlaying();
  const { setPlaybarExpanded, liveSpectrogram } = useLayout();
  const { feeds } = useData();

  const feed = feeds.find((feed) => feed.slug === feedSlug);
  const host = hosts.find((host) => feedSlug === host.hydrophone);

  const { filters, filteredData } = useData();

  // const isCandidateDetail =
  //   !!router.query.feedSlug && !!router.query.candidateId;

  const href =
    // isCandidateDetail
    //   ? `/beta/candidates/${feed?.slug}/${router.query.candidateId}`
    //   :
    `/beta`;

  const route = router.route.split("/");
  const tabPage = route[route.length - 1];
  const isIndexPage = route[route.length - 1] === "[feedSlug]";
  const isCandidatePage = route[route.length - 1] === "[candidateId]";

  const { nowPlayingFeed } = useNowPlaying();

  const detections = feed
    ? filteredData.filter(
        (c) => c.hydrophone === standardizeFeedName(feed?.name),
      )
    : filteredData;

  const tabRow = (tabs: Tab[]) => (
    <Stack
      direction="row"
      gap="40px"
      sx={{
        borderBottom: "1px solid rgba(255,255,255,.33)",
        px: 3,
      }}
    >
      {tabs.map((tab, index) => {
        const active = index === 0;
        return (
          <Link
            key={tab.title}
            href={tab.slug}
            style={{
              color: active
                ? darkTheme.palette.text.primary
                : darkTheme.palette.text.secondary,
              textDecoration: "none",
              height: "100%",
              padding: "16px 0",
              borderBottom: active
                ? "1px solid " + darkTheme.palette.accent3.main
                : "none",
            }}
          >
            {tab.title}
          </Link>
        );
      })}
    </Stack>
  );

  return (
    <div>
      <Head>Report {feedSlug} | Orcasound </Head>
      {showHeading && (
        <Box
          sx={{
            position: "relative",
            // marginTop: 5,
            marginBottom: "2px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: "16px",
            background: mdDown
              ? "none"
              : `center / cover no-repeat url(${feed?.imageUrl})`,
            px: 3,
            py: mdDown ? 1 : 2,
            minHeight: mdDown ? 0 : "260px",
          }}
        >
          {/* Gradient overlay */}
          {!mdDown && (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(to top, rgba(0,0,0,0.33), rgba(0,0,0,0))",
                zIndex: 0,
              }}
            />
          )}
          {/* Back button */}

          {!mdDown && (
            <Link
              href={"/beta"}
              onClick={(e) => {
                if (mdDown) {
                  e.preventDefault();
                  router.back();
                }
                setNowPlayingFeed(null);
                setNowPlayingCandidate(null);
                setPlaybarExpanded(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                textDecoration: "none",
                lineHeight: 1,
                color: theme.palette.common.white,
                zIndex: 1,
                position: "relative",
              }}
            >
              <ArrowBackIos />
            </Link>
          )}
          <Box
            sx={{
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography
              variant="h4"
              component="h1"
              sx={{
                zIndex: 1,
                lineHeight: 1.1,
                position: "relative",
                textShadow: "0 2px 4px rgba(0, 0, 0, 0.5)",
              }}
            >
              {feed?.name}
            </Typography>
          </Box>
        </Box>
      )}
      <Box className="scroll-box">
        {nowPlayingFeed && (
          <Box
            sx={{
              m: 2,
              mt: mdDown ? 1 : 2,
              mb: mdDown ? 3 : 2,
            }}
          >
            <LivePlayer currentFeed={nowPlayingFeed} />
          </Box>
        )}
        <Box
          sx={{
            height: liveSpectrogram ? "unset" : 0,
            overflow: "hidden",
            transition: "all .66s ease",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <AudioVisualizer />
        </Box>
        <Box
          className="feed-chart"
          sx={{
            px: "24px",
          }}
        >
          {showChart && (
            <Stack className="chart-heading" gap={0.5} sx={{ mt: 1 }}>
              {/* <Typography component="h2" variant="h6">
                {
                  timeRangeSelect.find((el) => el.value === filters.timeRange)
                    ?.label
                }
              </Typography> */}
              {countString(detections)}
            </Stack>
          )}
          {showChart && (
            <Box sx={{ py: "1.5rem" }}>
              <ReportsBarChart
                showLegend={false}
                showYAxis={false}
                showXAxis={false}
                feed={feed}
              />
            </Box>
          )}
        </Box>
        {/* host block */}
        {host && !mdDown && (
          <Paper
            elevation={0}
            sx={{
              backgroundColor: "accent1.main",
              p: 2,
              mx: 2,
              my: 1,
              borderRadius: 1,
            }}
          >
            <Typography variant="body2">
              Hosted by <strong>{host.name}</strong>
              <br />
              <Link href={host.link} target="_blank" rel="noopener">
                Learn more or donate
              </Link>{" "}
              to support their work.
            </Typography>
          </Paper>
        )}
        {showTabs && tabs && tabRow(tabs)}
        <Box>{children}</Box>
      </Box>
    </div>
  );
};

export default DetailTabs;
