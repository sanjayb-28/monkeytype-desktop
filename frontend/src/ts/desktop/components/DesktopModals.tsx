import type { JSXElement } from "solid-js";

import { CustomTestDurationModal } from "../../components/modals/CustomTestDurationModal";
import { CustomTextModal } from "../../components/modals/CustomTextModal";
import { CustomWordAmountModal } from "../../components/modals/CustomWordAmountModal";
import { MobileTestConfigModal } from "../../components/modals/MobileTestConfigModal";
import { PbTablesModal } from "../../components/modals/PbTablesModal";
import { QuoteSearchModal } from "../../components/modals/QuoteSearchModal";
import { SimpleModal } from "../../components/modals/SimpleModal";

export function DesktopModals(): JSXElement {
  return (
    <>
      <SimpleModal />
      <CustomTextModal />
      <CustomTestDurationModal />
      <CustomWordAmountModal />
      <MobileTestConfigModal />
      <PbTablesModal />
      <QuoteSearchModal />
    </>
  );
}
