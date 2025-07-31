import { Box, Tab, Tabs, Theme, useMediaQuery } from "@mui/material";
import { useRouter } from "next/router";
import React, { ReactElement, useRef, useState } from "react";

import { CandidatesStack } from "@/components/CandidateList/CandidatesStack";
import { MobileDisplay } from "@/components/CandidateList/MobileDisplay";
import HeaderNew from "@/components/HeaderNew";
import { useLayout } from "@/context/LayoutContext";

import { MasterDataLayout } from "../MasterDataLayout";
import { MapWrapper } from "./MapWrapper";
import { MobileBottomNav } from "./MobileBottomNav";
import { SideList } from "./SideList";

type HalfMapLayoutProps = {
  // leftSlot?: React.ReactNode;
  centerSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
  rightDrawer?: React.ReactNode;
  children?: React.ReactNode;
};

export const innerDrawerHeights = {
  min: "calc(100% - 72px)",
  low: "calc(100% - 267px)",
  high: "72px",
  max: "0px",
};

export function HalfMapLayout({
  // leftSlot,
  centerSlot,
  rightSlot,
  rightDrawer,
  children,
}: HalfMapLayoutProps) {
  const router = useRouter();
  const { playbarExpanded, headerHeight } = useLayout();
  const mdDown = useMediaQuery((theme: Theme) => theme.breakpoints.down("md"));

  const masterPlayerTimeRef = useRef(0);

  const [innerDrawerHeight, setInnerDrawerHeight] = useState(
    innerDrawerHeights.min,
  );

  function a11yProps(index: number) {
    return {
      id: `simple-tab-${index}`,
      "aria-controls": `simple-tabpanel-${index}`,
    };
  }

  const tabSx = {
    padding: "7px 16px !important",
    margin: "0 8px !important",
    minWidth: 0,
    minHeight: "unset",
    lineHeight: 1.2,
    borderRadius: "4px",
    "&.Mui-selected": {
      backgroundColor: "rgba(255,255,255,.15)",
      "&:hover": {
        backgroundColor: "rgba(255,255,255,.18)",
      },
    },
    "&:hover": {
      color: "primary.main",
    },
  };

  const tabsSx = {
    minHeight: "unset", // prevent Tabs from enforcing height on children
    ".MuiTabs-indicator": {
      height: "0px",
      bottom: -1,
      backgroundColor: "accent3.main",
    },
  };

  const tabs = (
    <Tabs
      value={0}
      // onChange={handleChange}
      aria-label="navigation tabs"
      centered={mdDown ? true : false}
      sx={tabsSx}
    >
      <Tab
        className="first-tab"
        sx={tabSx}
        label="Hydrophones"
        onClick={() => {
          router.push(`/beta`);
        }}
        {...a11yProps(0)}
      />
      <Tab sx={tabSx} label="Explore" {...a11yProps(1)} />
      <Tab sx={tabSx} label="Take Action" {...a11yProps(2)} />
    </Tabs>
  );

  return (
    <>
      <Box
        sx={{
          // use `dvh` for dynamic viewport height to handle mobile browser weirdness
          // but fallback to `vh` for browsers that don't support `dvh`
          // `&` is a workaround because sx prop can't have identical keys
          // "&": {
          //   height: "100dvh",
          // },
          // height: "100vh",
          // paddingBottom: mdDown ? "155px" : "86px",
          // paddingTop: "60px", // added this due to making header position: fixed
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          minHeight: 0, // important for mobile scrolling
        }}
      >
        <HeaderNew tabs={tabs} />
        <Box
          component="main"
          sx={{
            display: "flex",
            flexFlow: mdDown ? "column" : "row",
            flex: 1,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* // desktop view */}
          {!mdDown && (
            <SideList position="left">
              <CandidatesStack />
            </SideList>
          )}
          <Box
            className="center-column"
            sx={{
              display: "flex",
              flexGrow: 1,
              position: "relative",
              borderLeft: "1px solid rgba(255,255,255,.5)",
              height: "100%",
            }}
          >
            <MapWrapper />
            <Box
              className="now-playing-drawer"
              sx={{
                px: 0,
                display: "flex",
                flexDirection: "column",
                flex: 1,
                overflowY: "auto",
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                borderRight: "1px solid rgba(255,255,255,.5)",
                height:
                  mdDown && playbarExpanded
                    ? `calc(100vh)` // height calc gets complex on mobile due to browser bar
                    : playbarExpanded
                      ? `calc(100vh - ${headerHeight})`
                      : 0,
                backgroundColor: "background.default",
                zIndex: (theme) => theme.zIndex.drawer + 1,
                transition: "height .66s ease",
              }}
            >
              {playbarExpanded && centerSlot}
            </Box>
          </Box>
          {!mdDown && (
            <SideList position="right">
              {rightSlot}
              <Box
                className="right-slot-drawer"
                sx={{
                  px: 0,
                  display: "flex",
                  flexDirection: "column",
                  flex: 1,
                  overflowY: "auto",
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  borderRight: "1px solid rgba(255,255,255,.5)",
                  height:
                    mdDown && playbarExpanded && router.query.candidateId
                      ? `calc(100vh)` // height calc gets complex on mobile due to browser bar
                      : playbarExpanded && router.query.candidateId
                        ? `calc(100vh - ${headerHeight})`
                        : 0,
                  backgroundColor: "background.default",
                  zIndex: (theme) => theme.zIndex.drawer + 1,
                  transition: "height .66s ease",
                }}
              >
                {rightDrawer}
              </Box>
            </SideList>
          )}
          {/* // mobile view */}
          {mdDown && (
            <Box
              className={"mobile-view"}
              sx={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                overflowY: "auto",
                position: "absolute",
                top: innerDrawerHeight,
                zIndex: 1000,
                backgroundColor: "background.default",
                width: "100%",
                borderRadius:
                  innerDrawerHeight === innerDrawerHeights.max ? 0 : "24px",
                margin: "0 1px",
                height: "100%",
                transition: "all .66s ease",
              }}
            >
              <div
                className="drawer-toggle"
                onClick={() => {
                  if (innerDrawerHeight === innerDrawerHeights.min) {
                    setInnerDrawerHeight(innerDrawerHeights.low);
                  } else if (innerDrawerHeight === innerDrawerHeights.low) {
                    setInnerDrawerHeight(innerDrawerHeights.max);
                  } else if (innerDrawerHeight === innerDrawerHeights.max) {
                    setInnerDrawerHeight(innerDrawerHeights.min);
                  }
                }}
                style={{
                  width: "100%",
                  height: "24px",
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "4px",
                    background: "white",
                    borderRadius: "100px",
                  }}
                ></div>
              </div>
              <MobileDisplay
                masterPlayerTimeRef={masterPlayerTimeRef}
                setInnerDrawerHeight={setInnerDrawerHeight}
                innerDrawerHeight={innerDrawerHeight}
              />
            </Box>
          )}
        </Box>
        {/* <Footer masterPlayerTimeRef={masterPlayerTimeRef} /> */}
        {mdDown && <MobileBottomNav />}
      </Box>
    </>
  );
}

export function getHalfMapLayout(page: ReactElement) {
  return (
    <MasterDataLayout>
      <HalfMapLayout>{page}</HalfMapLayout>
    </MasterDataLayout>
  );
}
