import type { JSXElement } from "solid-js";

import { CustomTestDurationModal } from "../../components/modals/CustomTestDurationModal";
import { CustomTextModal } from "../../components/modals/CustomTextModal";
import { CustomWordAmountModal } from "../../components/modals/CustomWordAmountModal";
import { EditResultTagsModal } from "../../components/modals/EditResultTagsModal";
import { MobileTestConfigModal } from "../../components/modals/MobileTestConfigModal";
import { PbTablesModal } from "../../components/modals/PbTablesModal";
import { AddPresetModal } from "../../components/modals/preset/AddPresetModal";
import { EditPresetModal } from "../../components/modals/preset/EditPresetModal";
import { QuoteSearchModal } from "../../components/modals/QuoteSearchModal";
import { SimpleModal } from "../../components/modals/SimpleModal";

export function DesktopModals(): JSXElement {
  return (
    <>
      <SimpleModal />
      <AddPresetModal />
      <EditPresetModal />
      <EditResultTagsModal />
      <CustomTextModal />
      <CustomTestDurationModal />
      <CustomWordAmountModal />
      <MobileTestConfigModal />
      <PbTablesModal />
      <QuoteSearchModal />
    </>
  );
}
