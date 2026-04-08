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
const LIFT_COST_PER_SECOND = 2.4;
const BOOST_COST_PER_SECOND = 4.2;

type AcornPickup = {
  worldX: number;
  y: number;
  value: number;
  phase: number;
  collected: boolean;
};

type Kite = {
  worldX: number;
  y: number;
  sway: number;
  color: string;
};

type Balloon = {
  worldX: number;
  y: number;
  size: number;
  phase: number;
  color: string;
};

type LayerConfig = {
  image: string;
  speed: number;
};

const LOOP_SEQUENCE: LayerConfig[] = [
  {image: loop7Src, speed: 0.08},
  {image: loop6Src, speed: 0.11},
  {image: loop5Src, speed: 0.14},
  {image: loop4Src, speed: 0.16},
  {image: loop3Src, speed: 0.19},
  {image: loop2Src, speed: 0.22},
];

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

function Layer({
  image,
  speed,
  scroll,
}: LayerConfig & {scroll: number}) {
  return (
    <div
      className="pointer-events-none absolute inset-0 bg-repeat-x"
      style={{
        backgroundImage: `url(${image})`,
        backgroundRepeat: 'repeat-x',
        backgroundPositionX: `${-scroll * speed}px`,
        backgroundPositionY: 'center',
        backgroundSize: 'auto 100%',
        filter: 'saturate(1.04) contrast(1.02)',
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
  const [acorns, setAcorns] = useState(18);
  const [liftActive, setLiftActive] = useState(false);
  const [boostActive, setBoostActive] = useState(false);

  const shipYRef = useRef(shipY);
  const velocityRef = useRef(0);
  const scrollRef = useRef(worldScroll);
  const speedRef = useRef(speed);
  const acornsRef = useRef(acorns);
  const startedRef = useRef(started);
  const liftRef = useRef(liftActive);
  const boostRef = useRef(boostActive);
  const pickupsRef = useRef<AcornPickup[]>([]);
  const kitesRef = useRef<Kite[]>([]);
  const balloonsRef = useRef<Balloon[]>([]);

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
    acornsRef.current = acorns;
  }, [acorns]);

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
    pickupsRef.current = Array.from({length: 32}, (_, index) => ({
      worldX: 440 + index * 260 + (index % 4) * 28,
      y: 150 + ((index * 67) % Math.max(180, viewport.height - 360)),
      value: index % 6 === 0 ? 3 : 1,
      phase: index * 0.8,
      collected: false,
    }));

    kitesRef.current = Array.from({length: 16}, (_, index) => ({
      worldX: 620 + index * 520,
      y: 110 + ((index * 73) % Math.max(120, viewport.height - 420)),
      sway: index * 0.9,
      color: ['#ef476f', '#ffd166', '#06d6a0', '#118ab2'][index % 4],
    }));

    balloonsRef.current = Array.from({length: 14}, (_, index) => ({
      worldX: 880 + index * 610,
      y: 130 + ((index * 81) % Math.max(140, viewport.height - 430)),
      size: 28 + (index % 3) * 6,
      phase: index * 0.7,
      color: ['#ffadad', '#ffd6a5', '#fdffb6', '#caffbf', '#9bf6ff'][index % 5],
    }));
  }, [viewport.height]);

  const updateAcorns = (updater: (value: number) => number) => {
    setAcorns((current) => {
      const next = Math.max(0, updater(current));
      acornsRef.current = next;
      return next;
    });
  };

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
        const canLift = liftRef.current && acornsRef.current > 0;
        const canBoost = boostRef.current && acornsRef.current > 0;
        const acceleration = canLift ? LIFT_ACCELERATION : GRAVITY;
        velocityRef.current += acceleration * dt;
        velocityRef.current *= canLift ? 0.99 : 0.985;

        if (canLift) {
          updateAcorns((current) => current - LIFT_COST_PER_SECOND * dt);
        }

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

        const targetSpeed = canBoost ? BOOST_SPEED : CRUISE_SPEED;
        const nextSpeed =
          speedRef.current +
          (targetSpeed - speedRef.current) * Math.min(1, dt * 4);
        const nextScroll = scrollRef.current + nextSpeed * dt;

        if (canBoost) {
          updateAcorns((current) => current - BOOST_COST_PER_SECOND * dt);
        }

        speedRef.current = nextSpeed;
        scrollRef.current = nextScroll;
        setWorldScroll(nextScroll);
        setSpeed(nextSpeed);

        const normalizedHeight = 1 - (nextShipY - 110) / Math.max(1, viewport.height - 280);
        setAltitude(Math.round(normalizedHeight * 5800));

        const nextShipX = viewport.width * 0.24 + Math.min(70, nextSpeed * 0.12);
        for (const pickup of pickupsRef.current) {
          if (pickup.collected) {
            continue;
          }

          const pickupScreenX = pickup.worldX - nextScroll;
          if (pickupScreenX < -60 || pickupScreenX > viewport.width + 60) {
            continue;
          }

          const pickupScreenY =
            pickup.y + Math.sin(nextScroll * 0.012 + pickup.phase) * 16;
          const distance = Math.hypot(
            pickupScreenX - nextShipX,
            pickupScreenY - nextShipY,
          );

          if (distance < 64) {
            pickup.collected = true;
            updateAcorns((current) => current + pickup.value);
          }
        }
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
  const visiblePickups = pickupsRef.current.filter((pickup) => {
    if (pickup.collected) {
      return false;
    }

    const pickupScreenX = pickup.worldX - worldScroll;
    return pickupScreenX > -80 && pickupScreenX < viewport.width + 80;
  });
  const visibleKites = kitesRef.current.filter((kite) => {
    const kiteScreenX = kite.worldX - worldScroll * 0.82;
    return kiteScreenX > -120 && kiteScreenX < viewport.width + 120;
  });
  const visibleBalloons = balloonsRef.current.filter((balloon) => {
    const balloonScreenX = balloon.worldX - worldScroll * 0.68;
    return balloonScreenX > -140 && balloonScreenX < viewport.width + 140;
  });
  const shipShadow = useMemo(
    () => `drop-shadow(0 24px 28px rgba(36, 48, 43, 0.28)) drop-shadow(0 0 22px rgba(238, 197, 122, ${liftActive ? 0.36 : 0.12}))`,
    [liftActive],
  );

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#eef2e5] text-[#102018]">
      <Layer {...activeLoop} scroll={worldScroll} />

      <div
        className="absolute inset-0 opacity-55"
        style={{
          backgroundImage:
            'linear-gradient(90deg, rgba(255,255,255,0.18) 0 1px, transparent 1px), linear-gradient(180deg, rgba(255,255,255,0.08) 0 1px, transparent 1px)',
          backgroundSize: '160px 160px',
          transform: `translateX(${-worldScroll * 0.08}px)`,
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(245,239,224,0.2) 0%, rgba(220,231,215,0.08) 40%, rgba(13,30,20,0.22) 100%)',
        }}
      />

      <div
        className="absolute left-0 right-0 bottom-24 h-8"
        style={{
          background:
            'repeating-linear-gradient(90deg, rgba(61,88,66,0.12) 0 40px, rgba(255,255,255,0) 40px 120px)',
          transform: `translateX(${-worldScroll * 1.15}px)`,
        }}
      />

      {visibleKites.map((kite) => {
        const kiteScreenX = kite.worldX - worldScroll * 0.82;
        const kiteScreenY = kite.y + Math.sin(worldScroll * 0.01 + kite.sway) * 24;
        const kiteRotation = Math.sin(worldScroll * 0.008 + kite.sway) * 12;

        return (
          <div
            key={kite.worldX}
            className="pointer-events-none absolute"
            style={{
              left: kiteScreenX - 22,
              top: kiteScreenY - 32,
              transform: `rotate(${kiteRotation}deg)`,
            }}
          >
            <div className="relative h-28 w-20">
              <div
                className="absolute left-3 top-0 h-16 w-16"
                style={{
                  background: kite.color,
                  clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                  boxShadow: '0 12px 24px rgba(17, 34, 26, 0.18)',
                }}
              />
              <div className="absolute left-[34px] top-1 h-15 w-[2px] bg-white/70" />
              <div className="absolute left-6 top-8 h-[2px] w-16 bg-white/70" />
              <div className="absolute left-[34px] top-16 h-12 w-[2px] bg-[#8b6a49]" />
              <div className="absolute left-[35px] top-28 h-10 w-[2px] bg-[#8b6a49]" />
              <div className="absolute left-[28px] top-[74px] h-2 w-5 bg-white/70 rotate-[18deg]" />
              <div className="absolute left-[38px] top-[86px] h-2 w-5 bg-white/70 -rotate-[22deg]" />
            </div>
          </div>
        );
      })}

      {visibleBalloons.map((balloon) => {
        const balloonScreenX = balloon.worldX - worldScroll * 0.68;
        const balloonScreenY = balloon.y + Math.sin(worldScroll * 0.007 + balloon.phase) * 26;

        return (
          <div
            key={balloon.worldX}
            className="pointer-events-none absolute"
            style={{
              left: balloonScreenX - balloon.size,
              top: balloonScreenY - balloon.size * 1.8,
            }}
          >
            <div
              className="relative"
              style={{width: balloon.size * 2, height: balloon.size * 3}}
            >
              <div
                className="absolute left-0 top-0 rounded-full"
                style={{
                  width: balloon.size * 2,
                  height: balloon.size * 2.2,
                  background: balloon.color,
                  boxShadow: '0 16px 28px rgba(17, 34, 26, 0.18)',
                }}
              />
              <div
                className="absolute left-[18%] top-[12%] rounded-full bg-white/35"
                style={{
                  width: balloon.size * 0.55,
                  height: balloon.size * 0.7,
                }}
              />
              <div className="absolute left-[28%] top-[72%] h-7 w-[1.5px] bg-[#8b6a49]" />
              <div className="absolute left-[70%] top-[72%] h-7 w-[1.5px] bg-[#8b6a49]" />
              <div
                className="absolute left-[30%] top-[96%] border border-[#8b6a49]/30 bg-[#f7f2e7]"
                style={{
                  width: balloon.size * 0.8,
                  height: balloon.size * 0.45,
                }}
              />
            </div>
          </div>
        );
      })}

      {visiblePickups.map((pickup) => {
        const pickupScreenX = pickup.worldX - worldScroll;
        const pickupScreenY =
          pickup.y + Math.sin(worldScroll * 0.012 + pickup.phase) * 16;

        return (
          <div
            key={pickup.worldX}
            className="pointer-events-none absolute"
            style={{
              left: pickupScreenX - 16,
              top: pickupScreenY - 20,
            }}
          >
            <div className="relative h-10 w-8 drop-shadow-[0_10px_18px_rgba(58,34,10,0.28)]">
              <div className="absolute left-[6px] top-[1px] h-4 w-5 rounded-t-full rounded-b-[8px] bg-[#6a4221]" />
              <div className="absolute left-[3px] top-[10px] h-6 w-6 rounded-b-[14px] rounded-t-[10px] bg-[#bf7640]" />
              <div className="absolute left-[14px] top-[-3px] h-3 w-[2px] rotate-[25deg] rounded-full bg-[#3d6c39]" />
              {pickup.value > 1 && (
                <div className="absolute -right-3 -top-2 rounded-full bg-[#f7f2e7] px-1.5 py-0.5 text-[10px] font-semibold text-[#6a4221] shadow-sm">
                  +{pickup.value}
                </div>
              )}
            </div>
          </div>
        );
      })}

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
            Hold press to lift. Press space to boost. Both spend acorns, and flying through acorns refills them.
          </div>
        </div>

        <div className="flex gap-3">
          <div className="rounded-[24px] border border-white/50 bg-[#f7f2e7]/85 px-4 py-3 text-right shadow-[0_20px_60px_rgba(17,34,26,0.16)] backdrop-blur">
            <div className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#758674]">
              Acorns
            </div>
            <div className="mt-1 text-2xl font-semibold text-[#8b4e24]">
              {Math.floor(acorns)}
            </div>
          </div>
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
              Your airship is ready. Launch into a moving mountain run, collect acorns in flight, and spend them on lift and boost.
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
