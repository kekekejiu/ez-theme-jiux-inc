import { useShepherd } from 'vue-shepherd';
import 'shepherd.js/dist/css/shepherd.css';

const TOUR_STORAGE_KEY = 'ez_onboarding_tour_done_v1';

export function hasSeenTour() {
  try {
    return localStorage.getItem(TOUR_STORAGE_KEY) === '1';
  } catch (e) {
    return false;
  }
}

function markTourSeen() {
  try {
    localStorage.setItem(TOUR_STORAGE_KEY, '1');
  } catch (e) {
    // ignore
  }
}

/**
 * 新手分步引导：依次介绍套餐详情、订阅导入、官方 App / 第三方客户端、商店等。
 * @param {(key:string)=>string} t i18n 翻译函数
 * @param {(path:string)=>void} navigate 路由跳转函数
 */
export function createOnboardingTour(t, navigate) {
  const tour = useShepherd({
    useModalOverlay: true,
    defaultStepOptions: {
      scrollTo: { behavior: 'smooth', block: 'center' },
      cancelIcon: { enabled: true },
      classes: 'ez-tour-step',
      modalOverlayOpeningPadding: 6,
      modalOverlayOpeningRadius: 10
    }
  });

  const btnBack = { text: t('tour.back'), action: () => tour.back(), classes: 'ez-tour-btn-secondary' };
  const btnNext = { text: t('tour.next'), action: () => tour.next() };
  const btnDone = { text: t('tour.done'), action: () => tour.complete() };
  const btnSkip = { text: t('tour.skip'), action: () => tour.cancel(), classes: 'ez-tour-btn-secondary' };

  buildSteps(tour, t, navigate, { btnBack, btnNext, btnDone, btnSkip });

  tour.on('complete', markTourSeen);
  tour.on('cancel', markTourSeen);

  return tour;
}

function buildSteps(tour, t, navigate, btns) {
  // 步骤在下方分段追加
  addStepsPart1(tour, t, btns);
  addStepsPart2(tour, t, navigate, btns);
}

function addStepsPart1(tour, t, btns) {
  tour.addStep({
    id: 'welcome',
    title: t('tour.welcomeTitle'),
    text: t('tour.welcomeText'),
    buttons: [btns.btnSkip, btns.btnNext]
  });

  tour.addStep({
    id: 'plan',
    title: t('tour.planTitle'),
    text: t('tour.planText'),
    attachTo: { element: '.subscription-card', on: 'bottom' },
    buttons: [btns.btnBack, btns.btnNext]
  });

  tour.addStep({
    id: 'import-btn',
    title: t('tour.importBtnTitle'),
    text: t('tour.importBtnText'),
    attachTo: { element: '.subscription-actions', on: 'bottom' },
    buttons: [btns.btnBack, btns.btnNext]
  });
}

function addStepsPart2(tour, t, navigate, btns) {
  const waitFor = (selector, timeout = 1500) => new Promise((resolve) => {
    const start = Date.now();
    const tick = () => {
      if (document.querySelector(selector) || Date.now() - start > timeout) {
        resolve();
        return;
      }
      requestAnimationFrame(tick);
    };
    tick();
  });

  tour.addStep({
    id: 'official-app',
    title: t('tour.officialAppTitle'),
    text: t('tour.officialAppText'),
    attachTo: { element: '.official-app-block, .import-card', on: 'bottom' },
    beforeShowPromise: () => waitFor('.import-card'),
    buttons: [btns.btnBack, btns.btnNext]
  });

  tour.addStep({
    id: 'third-party',
    title: t('tour.thirdPartyTitle'),
    text: t('tour.thirdPartyText'),
    attachTo: { element: '.platform-selector-top', on: 'bottom' },
    beforeShowPromise: () => waitFor('.platform-selector-top'),
    buttons: [btns.btnBack, btns.btnNext]
  });

  tour.addStep({
    id: 'shop',
    title: t('tour.shopTitle'),
    text: t('tour.shopText'),
    attachTo: { element: '[data-tour="nav-Shop"]', on: 'bottom' },
    buttons: [btns.btnBack, btns.btnNext]
  });

  tour.addStep({
    id: 'profile',
    title: t('tour.profileTitle'),
    text: t('tour.profileText'),
    attachTo: { element: '[data-tour="nav-Profile"]', on: 'bottom' },
    buttons: [btns.btnBack, btns.btnNext]
  });

  tour.addStep({
    id: 'support',
    title: t('tour.supportTitle'),
    text: t('tour.supportText'),
    attachTo: { element: '[data-tour="nav-More"], [data-tour="nav-Docs"]', on: 'bottom' },
    buttons: [btns.btnBack, btns.btnDone]
  });
}
