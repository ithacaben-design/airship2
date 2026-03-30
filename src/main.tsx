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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
