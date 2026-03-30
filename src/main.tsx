import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import airshipImageSrc from '../airship.png';
import App from './App.tsx';
import './index.css';

const externalAirshipUrl =
  'https://ais-pre-r3h3772brmmongz2ce6ii5-119227467043.us-east1.run.app/airship.png';
const srcDescriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');

if (srcDescriptor?.set) {
  Object.defineProperty(HTMLImageElement.prototype, 'src', {
    configurable: true,
    enumerable: srcDescriptor.enumerable ?? true,
    get: srcDescriptor.get,
    set(value: string) {
      srcDescriptor.set!.call(
        this,
        value === externalAirshipUrl ? airshipImageSrc : value,
      );
    },
  });
}

const tuneLandingButton = () => {
  const buttons = Array.from(document.querySelectorAll('button'));
  const launchButton = buttons.find(
    (button) => button.textContent?.trim().toLowerCase() === 'go',
  );

  if (!launchButton) {
    return false;
  }

  launchButton.setAttribute('aria-label', 'Launch Flight');

  const label = Array.from(launchButton.querySelectorAll('span')).find(
    (span) => span.textContent?.trim().toLowerCase() === 'go',
  );

  if (label) {
    label.textContent = 'Launch Flight';
    label.style.letterSpacing = '0.22em';
    label.style.fontSize = '1rem';
  }

  return true;
};

const landingObserver = new MutationObserver(() => {
  if (tuneLandingButton()) {
    landingObserver.disconnect();
  }
});

landingObserver.observe(document.documentElement, {
  childList: true,
  subtree: true,
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

requestAnimationFrame(() => {
  if (tuneLandingButton()) {
    landingObserver.disconnect();
  }
});
