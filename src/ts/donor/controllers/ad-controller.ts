// DESKTOP: No-op ad controller stub — no ads in local app
export function init(): void {}
export function renderResult(): void {}
export function renderOn(_page: string): void {}
export function renderOff(_page: string): void {}
export function destroy(): void {}
export function destroyResult(): void {}
export function updateTestPageAds(_visible: boolean): void {}
export function reinstate(): void {}
export function updateFooterAndVerticalAds(_visible: boolean): void {}

export default {
  init,
  renderResult,
  renderOn,
  renderOff,
  destroy,
  destroyResult,
  updateTestPageAds,
  reinstate,
};
