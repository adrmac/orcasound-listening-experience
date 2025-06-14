import { Box, Stack, Theme, useMediaQuery } from "@mui/material";
import React from "react";

import { Feed } from "@/graphql/generated";

import CandidatesList from "./CandidatesList";
import { CandidatesResults } from "./CandidatesResults";
import ReportsBarChart from "./ReportsBarChart";

export const CandidatesStack = ({
  feed,
  showChart = false,
}: {
  feed?: Feed;
  showChart?: boolean;
}) => {
  const mdDown = useMediaQuery((theme: Theme) => theme.breakpoints.down("md"));
  return (
    <Stack
      className={"candidates-stack"}
      sx={{
        overflowY: "auto",
        flex: 1,
        pb: "100px",
      }}
    >
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
      <Box sx={{ overflow: mdDown ? "auto" : "initial" }}>
        <CandidatesResults viewType="list" feed={feed} />
        <Box sx={{ paddingTop: "1.5rem" }}></Box>
        <CandidatesList feed={feed} />
      </Box>
    </Stack>
  );
};
