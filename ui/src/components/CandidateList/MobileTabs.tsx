import { Box } from "@mui/material";
import { Dispatch, SetStateAction } from "react";

import { useData } from "@/context/DataContext";
import { useLayout } from "@/context/LayoutContext";
import darkTheme from "@/styles/darkTheme";

import { timeRangeSelect } from "./CandidateListFilters";

type Props = {
  tabValue: number;
  setTabValue: Dispatch<SetStateAction<number>>;
  // masterPlayerTimeRef: MutableRefObject<number>;
};

export function MobileTabs({ tabValue, setTabValue }: Props) {
  const { innerDrawerHeights, innerDrawerHeight, setInnerDrawerHeight } =
    useLayout();

  const handleChange = (event: React.MouseEvent<HTMLDivElement>) => {
    const indexNumber = Number(event.currentTarget.id);
    setTabValue(indexNumber);

    if (innerDrawerHeight === innerDrawerHeights.min) {
      setInnerDrawerHeight(innerDrawerHeights.low);
    } else if (innerDrawerHeight === innerDrawerHeights.low) {
      setInnerDrawerHeight(innerDrawerHeights.max);
    }
  };

  const { filters } = useData();
  const timeRange =
    timeRangeSelect.find((el) => el.value === filters.timeRange)?.label ??
    "Reports";

  type TabsType = {
    title: string;
    slug: string;
  };

  const listenLiveTabs = [
    { title: timeRange, slug: "/beta/candidates" },
    { title: "Listen Live", slug: "/beta/hydrophones" },
  ];

  const makeTabs = (array: TabsType[]) => {
    return (
      <Box
        className={"mobile-tabs"}
        sx={{
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          gap: "1rem",
          borderBottom: "1px solid rgba(255,255,255,.3)",
          minHeight: "48px",
          mt: "24px",
          backgroundColor: darkTheme.palette.background.default,
        }}
      >
        {array.map((tab: TabsType, index: number) => {
          return (
            <Box
              id={index.toString()}
              className={"mobile-tab"}
              key={tab.title}
              onClick={handleChange}
              sx={{
                borderBottom: index === tabValue ? "1.5px solid #fff" : "none",
                flex: 1,
                textAlign: "center",
                pb: 1,
                pt: 0.25,
                fontSize: "1.2rem",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-start",

                color:
                  index === tabValue
                    ? "rgba(255,255,255,1)"
                    : "rgba(255,255,255,.8)",
              }}
            >
              {tab.title}
            </Box>
          );
        })}
      </Box>
    );
  };

  return makeTabs(listenLiveTabs);

  //   return (
  //     <>
  //     <Box
  //       sx={{
  //         display: "flex",
  //         flexDirection: "column",
  //         flex: 1,
  //         height: "100%",
  //         // overflowY: "auto",
  //       }}
  //     >
  //       {menuTab === 0 && (
  //         <Box
  //           sx={{
  //             height: "100%",
  //             display: "flex",
  //             flexDirection: "column"
  //           }}
  //         >
  //           {/* {makeTabs(recordingsTabs)} */}
  //           {tabValue === 0 && (
  //             <>
  //             <MapWrapper masterPlayerTimeRef={masterPlayerTimeRef} />
  //             </>
  //           )}
  //           {tabValue === 1 && (
  //             <MobileContainer>
  //               <CandidatesStack />
  //             </MobileContainer>
  //           )}
  //           {tabValue === 2 && (
  //             <MobileContainer>
  //               <VisualizationsStack />
  //             </MobileContainer>
  //           )}
  //         </Box>
  //       )}
  //       {menuTab === 1 && (
  //         <>
  //           {/* {makeTabs(listenLiveTabs)} */}
  //           {tabValue === 0 && (
  //             <MapWrapper masterPlayerTimeRef={masterPlayerTimeRef} />
  //           )}
  //           {tabValue === 1 && <HydrophonesStack />}
  //         </>
  //       )}
  //     </Box>
  //     </>
  //   );
}
