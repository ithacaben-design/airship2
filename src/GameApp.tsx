import {useEffect, useMemo, useRef, useState} from 'react';
import airshipImageSrc from '../airship.png';
import loop2Src from '../loop2.png';
import loop3Src from '../loop3.png';
import loop4Src from '../loop4.png';
import loop5Src from '../loop5.png';
import loop6Src from '../loop6.png';
import loop7Src from '../loop7.png';

const LIFT_ACCELERATION = -980;
const GRAVITY = 620;
const CRUISE_SPEED = 170;
const BOOST_SPEED = 310;

type LayerConfig = {
  image: string;
  bottom: number;
  height: number;
  speed: number;
  size: string;
};

const LOOP_SEQUENCE: LayerConfig[] = [
  {image: loop7Src, bottom: 240, height: 320, speed: 0.12, size: 'auto 100%'},
  {image: loop6Src, bottom: 210, height: 340, speed: 0.16, size: 'auto 100%'},
  {image: loop5Src, bottom: 180, height: 360, speed: 0.2, size: 'auto 100%'},
  {image: loop4Src, bottom: 145, height: 380, speed: 0.24, size: 'auto 100%'},
  {image: loop3Src, bottom: 110, height: 400, speed: 0.28, size: 'auto 100%'},
  {image: loop2Src, bottom: 60, height: 270, speed: 0.34, size: 'auto 100%'},
];

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

function Layer({
  image,
  bottom,
  height,
  speed,
  size,
  scroll,
}: LayerConfig & {scroll: number}) {
  return (
    <div
      className="pointer-events-none absolute left-[-20vw] right-[-20vw] bg-repeat-x"
      style={{
        bottom,
        height,
        backgroundImage: `url(${image})`,
        backgroundRepeat: 'repeat-x',
        backgroundPositionX: `${-scroll * speed}px`,
        backgroundPositionY: 'bottom',
        backgroundSize: size,
      }}
    />
  );
}

export default function GameApp() {
  const [started, setStarted] = useState(false);
  const [viewport, setViewport] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [shipY, setShipY] = useState(window.innerHeight * 0.52);
  const [worldScroll, setWorldScroll] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [altitude, setAltitude] = useState(0);
  const [liftActive, setLiftActive] = useState(false);
  const [boostActive, setBoostActive] = useState(false);

  const shipYRef = useRef(shipY);
  const velocityRef = useRef(0);
  const scrollRef = useRef(worldScroll);
  const speedRef = useRef(speed);
  const startedRef = useRef(started);
  const liftRef = useRef(liftActive);
  const boostRef = useRef(boostActive);

  useEffect(() => {
    shipYRef.current = shipY;
  }, [shipY]);

  useEffect(() => {
    scrollRef.current = worldScroll;
  }, [worldScroll]);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    startedRef.current = started;
  }, [started]);

  useEffect(() => {
    liftRef.current = liftActive;
  }, [liftActive]);

  useEffect(() => {
    boostRef.current = boostActive;
  }, [boostActive]);

  useEffect(() => {
    const handleResize = () => {
      setViewport({width: window.innerWidth, height: window.innerHeight});
      setShipY((prev) =>
        clamp(prev, 110, window.innerHeight - 170),
      );
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const activateLift = () => setLiftActive(true);
    const deactivateLift = () => setLiftActive(false);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault();
        setBoostActive(true);
      }
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        setBoostActive(false);
      }
    };

    window.addEventListener('pointerdown', activateLift);
    window.addEventListener('pointerup', deactivateLift);
    window.addEventListener('pointercancel', deactivateLift);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('pointerdown', activateLift);
      window.removeEventListener('pointerup', deactivateLift);
      window.removeEventListener('pointercancel', deactivateLift);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    let frameId = 0;
    let lastTime = 0;

    const tick = (time: number) => {
      if (lastTime === 0) {
        lastTime = time;
      }

      const dt = Math.min(0.05, (time - lastTime) / 1000);
      lastTime = time;

      if (startedRef.current) {
        const acceleration = liftRef.current ? LIFT_ACCELERATION : GRAVITY;
        velocityRef.current += acceleration * dt;
        velocityRef.current *= liftRef.current ? 0.99 : 0.985;

        const nextShipY = clamp(
          shipYRef.current + velocityRef.current * dt,
          110,
          viewport.height - 170,
        );

        if (nextShipY === 110 || nextShipY === viewport.height - 170) {
          velocityRef.current = 0;
        }

        shipYRef.current = nextShipY;
        setShipY(nextShipY);

        const targetSpeed = boostRef.current ? BOOST_SPEED : CRUISE_SPEED;
        const nextSpeed =
          speedRef.current +
          (targetSpeed - speedRef.current) * Math.min(1, dt * 4);
        const nextScroll = scrollRef.current + nextSpeed * dt;

        speedRef.current = nextSpeed;
        scrollRef.current = nextScroll;
        setWorldScroll(nextScroll);
        setSpeed(nextSpeed);

        const normalizedHeight = 1 - (nextShipY - 110) / Math.max(1, viewport.height - 280);
        setAltitude(Math.round(normalizedHeight * 5800));
      } else {
        if (speedRef.current !== 0) {
          speedRef.current = 0;
          setSpeed(0);
        }
      }

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [viewport.height]);

  const shipAngle = clamp(velocityRef.current * 0.03, -18, 18);
  const shipX = viewport.width * 0.24 + Math.min(70, speed * 0.12);
  const activeLoop = LOOP_SEQUENCE[Math.floor(worldScroll / 900) % LOOP_SEQUENCE.length];
  const shipShadow = useMemo(
    () => `drop-shadow(0 24px 28px rgba(36, 48, 43, 0.28)) drop-shadow(0 0 22px rgba(238, 197, 122, ${liftActive ? 0.36 : 0.12}))`,
    [liftActive],
  );

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#eef2e5] text-[#102018]">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at top, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.32) 28%, transparent 58%), linear-gradient(180deg, #f5efe0 0%, #dce7d7 52%, #bed0c1 100%)',
        }}
      />

      <div
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            'linear-gradient(90deg, rgba(255,255,255,0.18) 0 1px, transparent 1px), linear-gradient(180deg, rgba(255,255,255,0.08) 0 1px, transparent 1px)',
          backgroundSize: '160px 160px',
          transform: `translateX(${-worldScroll * 0.08}px)`,
        }}
      />

      <div className="absolute inset-x-0 bottom-0 h-[72vh]">
        <Layer {...activeLoop} scroll={worldScroll} />
      </div>

      <div
        className="absolute left-0 right-0 bottom-24 h-8"
        style={{
          background:
            'repeating-linear-gradient(90deg, rgba(61,88,66,0.12) 0 40px, rgba(255,255,255,0) 40px 120px)',
          transform: `translateX(${-worldScroll * 1.15}px)`,
        }}
      />

      <div
        className="absolute rounded-full bg-[#274635]/15 blur-2xl"
        style={{
          left: shipX - 50,
          top: shipY + 70,
          width: 180,
          height: 46,
          transform: `scale(${0.9 + speed / 500})`,
        }}
      />

      <img
        src={airshipImageSrc}
        alt="Airship"
        className="pointer-events-none absolute select-none"
        draggable={false}
        style={{
          left: shipX - 82,
          top: shipY - 52,
          width: 170,
          transform: `rotate(${shipAngle}deg)`,
          filter: shipShadow,
        }}
      />

      <div className="absolute left-6 right-6 top-6 flex items-start justify-between">
        <div className="rounded-[28px] border border-white/50 bg-[#f7f2e7]/85 px-5 py-4 shadow-[0_20px_60px_rgba(17,34,26,0.16)] backdrop-blur">
          <div className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#5c6f60]">
            Acorn Airship
          </div>
          <div className="mt-2 text-3xl font-semibold italic tracking-tight text-[#153120]">
            Flight deck
          </div>
          <div className="mt-3 text-sm text-[#3f5848]">
            Hold press to lift. Tap or press space to boost the scroll.
          </div>
        </div>

        <div className="flex gap-3">
          <div className="rounded-[24px] border border-white/50 bg-[#f7f2e7]/85 px-4 py-3 text-right shadow-[0_20px_60px_rgba(17,34,26,0.16)] backdrop-blur">
            <div className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#758674]">
              Speed
            </div>
            <div className="mt-1 text-2xl font-semibold text-[#183424]">
              {Math.round(speed)}
            </div>
          </div>
          <div className="rounded-[24px] border border-white/50 bg-[#f7f2e7]/85 px-4 py-3 text-right shadow-[0_20px_60px_rgba(17,34,26,0.16)] backdrop-blur">
            <div className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#758674]">
              Altitude
            </div>
            <div className="mt-1 text-2xl font-semibold text-[#183424]">
              {altitude}
            </div>
          </div>
        </div>
      </div>

      {!started && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#102018]/58 px-6 backdrop-blur-sm">
          <div className="max-w-2xl rounded-[40px] border border-white/20 bg-[#163423]/82 px-8 py-10 text-center shadow-[0_30px_120px_rgba(6,18,12,0.45)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.42em] text-[#c6d9bf]">
              Landing Page
            </div>
            <h1 className="mt-4 text-5xl font-semibold italic tracking-tight text-[#f7f2e7] md:text-7xl">
              Launch Flight
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-[#d6e2d1]">
              Your airship is ready. Launch into a moving mountain run with lift controls and visible world scroll.
            </p>
            <button
              type="button"
              onClick={() => setStarted(true)}
              className="mt-8 rounded-full bg-[#f1bf74] px-8 py-4 text-sm font-semibold uppercase tracking-[0.35em] text-[#213826] shadow-[0_20px_40px_rgba(241,191,116,0.28)] transition hover:scale-[1.02] hover:bg-[#f5ca8b] active:scale-[0.98]"
            >
              Launch Flight
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
