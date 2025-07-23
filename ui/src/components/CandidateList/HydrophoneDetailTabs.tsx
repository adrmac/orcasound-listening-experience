import { ArrowBackIos } from "@mui/icons-material";
import {
  Box,
  Stack,
  Theme,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { ReactNode } from "react";

import { useData } from "@/context/DataContext";
import { useLayout } from "@/context/LayoutContext";
import { useNowPlaying } from "@/context/NowPlayingContext";
import { Feed } from "@/graphql/generated";
import darkTheme from "@/styles/darkTheme";

const HydrophoneDetailTabs = ({
  children,
  feed,
  drawer = false,
  showHeading = true,
  showTabs = true,
}: {
  children: ReactNode;
  feed?: Feed;
  drawer?: boolean;
  showHeading?: boolean;
  showTabs?: boolean;
}) => {
  const router = useRouter();
  const { feedSlug } = router.query;
  const smDown = useMediaQuery((theme: Theme) => theme.breakpoints.down("sm"));

  // const mdDown = useMediaQuery((theme: Theme) => theme.breakpoints.down("md"));
  const theme = useTheme();
  const { setNowPlayingCandidate, setNowPlayingFeed } = useNowPlaying();
  const { setPlaybarExpanded } = useLayout();
  const { feeds } = useData();

  if (!feed && feedSlug) {
    feed = feeds.find((feed) => feed.slug === feedSlug);
  }

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

  type Tab = {
    title: string;
    slug: string;
  };

  const tabs = [
    { title: "About", slug: "" },
    { title: "Images", slug: "#" },
  ];

  const tabRow = (tabs: Tab[]) => (
    <Stack
      direction="row"
      gap="40px"
      sx={{
        borderBottom: "1px solid rgba(255,255,255,.33)",
        px: 3,
      }}
    >
      {tabs.map((tab) => {
        const tabSlug = tab.slug;
        const active = drawer
          ? tabSlug === "candidates"
          : isIndexPage
            ? tabSlug === ""
            : isCandidatePage
              ? tabSlug === "candidates"
              : tabPage === tabSlug;
        return (
          <Link
            key={tab.title}
            href={feed ? `/beta/${feed.slug}/${tabSlug}` : "#"}
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
            background: `center / cover no-repeat url(${feed?.imageUrl})`,
            p: 2,
            minHeight: smDown ? " 160px" : "260px",
          }}
        >
          {/* Gradient overlay */}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to top, rgba(0,0,0,0.33), rgba(0,0,0,0))",
              zIndex: 0,
            }}
          />
          {!drawer ? (
            <Link
              href={smDown ? "#" : href}
              onClick={(e) => {
                if (smDown) {
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
          ) : (
            <Box></Box>
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
      {showTabs && tabRow(tabs)}
      <Box>{children}</Box>
    </div>
  );
};

export default HydrophoneDetailTabs;
