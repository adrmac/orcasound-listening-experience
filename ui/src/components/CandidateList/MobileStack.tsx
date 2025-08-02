import { MutableRefObject, useState } from "react";

import { HydrophonesStack } from "@/components/CandidateList/HydrophonesStack";
import { useLayout } from "@/context/LayoutContext";

import { MobileContainer } from "../layouts/HalfMapLayout/MobileContainer";
import { CandidatesStack } from "./CandidatesStack";
import { MobileTabs } from "./MobileTabs";

type Props = {
  masterPlayerTimeRef?: MutableRefObject<number>;
};

export function MobileStack({}: Props) {
  const { innerDrawerHeight, setInnerDrawerHeight } = useLayout();

  // tabValue is the state of the top tabs (Listen Live, Last 7 Days) in <MobileTabs>
  const [tabValue, setTabValue] = useState(0);

  // // mobileTab is the state of the bottom tabs in <MobileBottomNav>
  // const { mobileTab, setMobileTab } = useLayout();

  // const router = useRouter();

  // useEffect(() => {
  //   if (router.route === "/beta/hydrophones") {
  //     setTabValue(0);
  //     setMobileTab(1);
  //   } else if (router.route === "/beta/candidates") {
  //     setTabValue(1);
  //     setMobileTab(1);
  //   } else if (router.route === "/beta") {
  //     setMobileTab(0);
  //   }
  // }, [router, setTabValue, setMobileTab]);

  return (
    <>
      <MobileTabs tabValue={tabValue} setTabValue={setTabValue} />
      {tabValue === 0 && ( // Map
        <MobileContainer>
          <CandidatesStack />
        </MobileContainer>
      )}
      {tabValue === 1 && ( // Hydrophones
        <MobileContainer>
          <HydrophonesStack />
        </MobileContainer>
      )}
    </>
  );
}
