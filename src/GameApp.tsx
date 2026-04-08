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
const SONG_SPEED_BONUS = 120;
const LIFT_COST_PER_SECOND = 2.4;
const BOOST_COST_PER_SECOND = 4.2;
const ACTION_COST = 10;
const SONG_NOTES_REQUIRED = 3;

type AcornPickup = {
  worldX: number;
  y: number;
  value: number;
  phase: number;
  collected: boolean;
};

type NotePickup = {
  worldX: number;
  y: number;
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

const FRUIT_EMOJI: Record<string, string> = {
  apple: '🍎',
  'red apple': '🍎',
  'green apple': '🍏',
  banana: '🍌',
  bananas: '🍌',
  grape: '🍇',
  grapes: '🍇',
  orange: '🍊',
  strawberry: '🍓',
  strawberries: '🍓',
  cherry: '🍒',
  cherries: '🍒',
  peach: '🍑',
  pineapple: '🍍',
  kiwi: '🥝',
  lemon: '🍋',
  pear: '🍐',
  blueberry: '🫐',
  blueberries: '🫐',
  coconut: '🥥',
  mango: '🥭',
};

const getFruitEmoji = (fruit: string) => {
  const normalized = fruit.toLowerCase().trim();
  return FRUIT_EMOJI[normalized] ?? '🎈';
};

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
  const [setupName, setSetupName] = useState('Captain Acorn');
  const [setupFruit, setSetupFruit] = useState('Strawberry');
  const [pilotName, setPilotName] = useState('Captain Acorn');
  const [favoriteFruit, setFavoriteFruit] = useState('Strawberry');
  const [viewport, setViewport] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [shipY, setShipY] = useState(window.innerHeight * 0.52);
  const [worldScroll, setWorldScroll] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [altitude, setAltitude] = useState(0);
  const [acorns, setAcorns] = useState(50);
  const [notes, setNotes] = useState(0);
  const [liftActive, setLiftActive] = useState(false);
  const [boostActive, setBoostActive] = useState(false);
  const [attachedBalloonCount, setAttachedBalloonCount] = useState(1);
  const [attachedKiteCount, setAttachedKiteCount] = useState(1);
  const [songBurstTimer, setSongBurstTimer] = useState(0);
  const [actionCooldown, setActionCooldown] = useState(0);

  const shipYRef = useRef(shipY);
  const velocityRef = useRef(0);
  const scrollRef = useRef(worldScroll);
  const speedRef = useRef(speed);
  const acornsRef = useRef(acorns);
  const notesRef = useRef(notes);
  const startedRef = useRef(started);
  const liftRef = useRef(liftActive);
  const boostRef = useRef(boostActive);
  const balloonCountRef = useRef(attachedBalloonCount);
  const kiteCountRef = useRef(attachedKiteCount);
  const songBurstRef = useRef(songBurstTimer);
  const actionCooldownRef = useRef(actionCooldown);
  const pickupsRef = useRef<AcornPickup[]>([]);
  const notePickupsRef = useRef<NotePickup[]>([]);
  const kitesRef = useRef<Kite[]>([]);
  const balloonsRef = useRef<Balloon[]>([]);
  const fruitEmoji = useMemo(() => getFruitEmoji(favoriteFruit), [favoriteFruit]);

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
    notesRef.current = notes;
  }, [notes]);

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
    balloonCountRef.current = attachedBalloonCount;
  }, [attachedBalloonCount]);

  useEffect(() => {
    kiteCountRef.current = attachedKiteCount;
  }, [attachedKiteCount]);

  useEffect(() => {
    songBurstRef.current = songBurstTimer;
  }, [songBurstTimer]);

  useEffect(() => {
    actionCooldownRef.current = actionCooldown;
  }, [actionCooldown]);

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

    notePickupsRef.current = Array.from({length: 18}, (_, index) => ({
      worldX: 760 + index * 430,
      y: 120 + ((index * 91) % Math.max(150, viewport.height - 390)),
      phase: index * 0.55,
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

  const updateNotes = (updater: (value: number) => number) => {
    setNotes((current) => {
      const next = clamp(updater(current), 0, SONG_NOTES_REQUIRED);
      notesRef.current = next;
      return next;
    });
  };

  const triggerCooldown = () => {
    setActionCooldown(2);
    actionCooldownRef.current = 2;
  };

  const handleLaunch = () => {
    const confirmedPilot = setupName.trim() || 'Captain Acorn';
    const confirmedFruit = setupFruit.trim() || 'Strawberry';

    setPilotName(confirmedPilot);
    setFavoriteFruit(confirmedFruit);
    setAttachedBalloonCount(1);
    balloonCountRef.current = 1;
    setAttachedKiteCount(1);
    kiteCountRef.current = 1;
    setAcorns(50);
    acornsRef.current = 50;
    setNotes(0);
    notesRef.current = 0;
    setSongBurstTimer(0);
    songBurstRef.current = 0;
    setActionCooldown(0);
    actionCooldownRef.current = 0;
    setStarted(true);
    startedRef.current = true;
  };

  const addFruitBalloon = () => {
    if (!started || actionCooldownRef.current > 0 || acornsRef.current < ACTION_COST) {
      return;
    }

    updateAcorns((current) => current - ACTION_COST);
    setAttachedBalloonCount((current) => {
      const next = current + 1;
      balloonCountRef.current = next;
      return next;
    });
    triggerCooldown();
  };

  const addKite = () => {
    if (!started || actionCooldownRef.current > 0 || acornsRef.current < ACTION_COST) {
      return;
    }

    updateAcorns((current) => current - ACTION_COST);
    setAttachedKiteCount((current) => {
      const next = current + 1;
      kiteCountRef.current = next;
      return next;
    });
    triggerCooldown();
  };

  const triggerSong = () => {
    if (!started || actionCooldownRef.current > 0 || notesRef.current < SONG_NOTES_REQUIRED) {
      return;
    }

    updateNotes(() => 0);
    setSongBurstTimer(6);
    songBurstRef.current = 6;
    triggerCooldown();
  };

  useEffect(() => {
    if (songBurstTimer <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setSongBurstTimer((current) => Math.max(0, current - 0.1));
    }, 100);

    return () => window.clearInterval(timer);
  }, [songBurstTimer]);

  useEffect(() => {
    if (actionCooldown <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setActionCooldown((current) => Math.max(0, current - 0.1));
    }, 100);

    return () => window.clearInterval(timer);
  }, [actionCooldown]);

  useEffect(() => {
    const shouldIgnoreTarget = (target: EventTarget | null) =>
      target instanceof Element && !!target.closest('button,input');

    const activateLift = (event: PointerEvent) => {
      if (shouldIgnoreTarget(event.target)) {
        return;
      }
      setLiftActive(true);
    };
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
        const balloonLiftBonus = balloonCountRef.current * 26;
        const kiteSpeedBonus = kiteCountRef.current * 9;
        const songBoost = songBurstRef.current > 0 ? SONG_SPEED_BONUS : 0;
        const canLift = liftRef.current && acornsRef.current > 0;
        const canBoost = boostRef.current && acornsRef.current > 0;
        const acceleration = canLift
          ? LIFT_ACCELERATION - balloonLiftBonus * 2
          : GRAVITY - balloonLiftBonus * 0.65;
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

        const targetSpeed =
          CRUISE_SPEED +
          kiteSpeedBonus +
          songBoost +
          (canBoost ? BOOST_SPEED - CRUISE_SPEED : 0);
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
        const pickupRadius = songBurstRef.current > 0 ? 104 : 64;
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

          if (distance < pickupRadius) {
            pickup.collected = true;
            updateAcorns((current) => current + pickup.value);
          }
        }

        for (const pickup of notePickupsRef.current) {
          if (pickup.collected || notesRef.current >= SONG_NOTES_REQUIRED) {
            continue;
          }

          const pickupScreenX = pickup.worldX - nextScroll;
          if (pickupScreenX < -80 || pickupScreenX > viewport.width + 80) {
            continue;
          }

          const pickupScreenY =
            pickup.y + Math.sin(nextScroll * 0.01 + pickup.phase) * 18;
          const distance = Math.hypot(
            pickupScreenX - nextShipX,
            pickupScreenY - nextShipY,
          );

          if (distance < pickupRadius) {
            pickup.collected = true;
            updateNotes((current) => current + 1);
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
  const visibleNotePickups = notePickupsRef.current.filter((pickup) => {
    if (pickup.collected || notes >= SONG_NOTES_REQUIRED) {
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
  const canUseSong = notes >= SONG_NOTES_REQUIRED && actionCooldown <= 0;
  const canBuyAction = acorns >= ACTION_COST && actionCooldown <= 0;

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

      {songBurstTimer > 0 && (
        <div className="pointer-events-none absolute inset-0 bg-[#fff3d4]/15 backdrop-blur-[1px]" />
      )}

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

      {visibleNotePickups.map((pickup) => {
        const pickupScreenX = pickup.worldX - worldScroll;
        const pickupScreenY =
          pickup.y + Math.sin(worldScroll * 0.01 + pickup.phase) * 18;

        return (
          <div
            key={pickup.worldX}
            className="pointer-events-none absolute"
            style={{
              left: pickupScreenX - 18,
              top: pickupScreenY - 22,
            }}
          >
            <div className="relative h-11 w-9 rounded-md border border-[#d4a373] bg-[#fff8eb]/90 shadow-[0_10px_18px_rgba(17,34,26,0.14)]">
              <div className="absolute inset-0 rounded-md bg-[linear-gradient(180deg,transparent_0,transparent_78%,rgba(212,163,115,0.12)_78%,rgba(212,163,115,0.12)_100%)]" />
              <div className="absolute inset-0 flex items-center justify-center text-xl">🎶</div>
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

      <div
        className="pointer-events-none absolute"
        style={{
          left: shipX - 92,
          top: shipY - 110,
          width: 230,
          height: 210,
        }}
      >
        {Array.from({length: attachedBalloonCount}).map((_, index) => {
          const offsetX = -18 - index * 24;
          const offsetY = -18 - (index % 3) * 22;
          const sway = Math.sin(worldScroll * 0.01 + index) * 10;
          return (
            <div key={`attached-balloon-${index}`} className="absolute" style={{left: 70 + offsetX + sway, top: 34 + offsetY}}>
              <div className="absolute left-[26px] top-[56px] h-16 w-[1.5px] bg-white/70" />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#fff6e4]/55 shadow-[0_10px_20px_rgba(17,34,26,0.14)]">
                <div className="text-3xl">{fruitEmoji}</div>
              </div>
            </div>
          );
        })}

        {Array.from({length: attachedKiteCount}).map((_, index) => {
          const offsetX = 110 + index * 28;
          const offsetY = -10 - (index % 2) * 18;
          const sway = Math.sin(worldScroll * 0.014 + index * 0.8) * 12;
          const rotation = Math.sin(worldScroll * 0.012 + index) * 10;
          return (
            <div
              key={`attached-kite-${index}`}
              className="absolute"
              style={{
                left: offsetX + sway,
                top: 62 + offsetY,
                transform: `rotate(${rotation}deg)`,
              }}
            >
              <div className="absolute -left-16 top-[22px] h-[1.5px] w-16 bg-white/70" />
              <div className="relative h-16 w-16">
                <div
                  className="absolute left-2 top-1 h-12 w-12 bg-[#f7f2e7]"
                  style={{clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)'}}
                />
                <div className="absolute left-8 top-1 h-12 w-[1.5px] bg-[#8b6a49]" />
                <div className="absolute left-2 top-7 h-[1.5px] w-12 bg-[#8b6a49]" />
              </div>
            </div>
          );
        })}
      </div>

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
            {pilotName}
          </div>
          <div className="mt-2 text-3xl font-semibold italic tracking-tight text-[#153120]">
            Acorn Airship
          </div>
          <div className="mt-3 text-sm text-[#3f5848]">
            Fruit balloon: {fruitEmoji} {favoriteFruit}. Collect 3 notes to trigger a song burst.
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
              Notes
            </div>
            <div className="mt-1 text-2xl font-semibold text-[#b56a2f]">
              {notes}/{SONG_NOTES_REQUIRED}
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

      {started && (
        <>
          <div className="pointer-events-none absolute bottom-32 left-1/2 -translate-x-1/2 rounded-full border border-white/35 bg-[#163423]/55 px-5 py-2 text-[12px] font-semibold uppercase tracking-[0.35em] text-[#f7f2e7] shadow-[0_16px_40px_rgba(6,18,12,0.28)] backdrop-blur">
            Hold press to lift. Press space to boost.
          </div>

          <div className="absolute inset-x-0 bottom-0 z-10 px-5 pb-5">
            <div className="mx-auto flex max-w-xl gap-3 rounded-[30px] border border-white/20 bg-[#183424]/72 p-3 shadow-[0_28px_80px_rgba(6,18,12,0.35)] backdrop-blur-xl">
              <button
                type="button"
                onClick={triggerSong}
                disabled={!canUseSong}
                className={`flex-1 rounded-[22px] px-4 py-4 text-sm font-semibold uppercase tracking-[0.26em] transition ${
                  canUseSong
                    ? 'bg-[#fff1cc] text-[#5b3b14] shadow-[0_16px_30px_rgba(255,227,167,0.3)] hover:scale-[1.02]'
                    : 'bg-white/10 text-[#d1d8cf] opacity-60'
                }`}
              >
                🎵 Song
                <div className="mt-1 text-[11px] tracking-[0.18em]">{notes}/{SONG_NOTES_REQUIRED} notes</div>
              </button>
              <button
                type="button"
                onClick={addFruitBalloon}
                disabled={!canBuyAction}
                className={`flex-1 rounded-[22px] px-4 py-4 text-sm font-semibold uppercase tracking-[0.26em] transition ${
                  canBuyAction
                    ? 'bg-[#f7f2e7] text-[#23402d] shadow-[0_16px_30px_rgba(247,242,231,0.18)] hover:scale-[1.02]'
                    : 'bg-white/10 text-[#d1d8cf] opacity-60'
                }`}
              >
                {fruitEmoji} Balloon
                <div className="mt-1 text-[11px] tracking-[0.18em]">-10 acorns</div>
              </button>
                 <button
                type="button"
                onClick={addKite}
                disabled={!canBuyAction}
                className={`flex-1 rounded-[22px] px-4 py-4 text-sm font-semibold uppercase tracking-[0.26em] transition ${
                  canBuyAction
                    ? 'bg-[#f7f2e7] text-[#23402d] shadow-[0_16px_30px_rgba(247,242,231,0.18)] hover:scale-[1.02]'
                    : 'bg-white/10 text-[#d1d8cf] opacity-60'
                }`}
              >
                🪁 Kite
                <div className="mt-1 text-[11px] tracking-[0.18em]">-10 acorns</div>
              </button>
            </div>
          </div>
        </>
      )}

      {!started && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#102018]/58 px-6 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-[40px] border border-white/20 bg-[#163423]/82 px-8 py-10 text-center shadow-[0_30px_120px_rgba(6,18,12,0.45)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.42em] text-[#c6d9bf]">
              Landing Page
            </div>
            <h1 className="mt-4 text-5xl font-semibold italic tracking-tight text-[#f7f2e7] md:text-7xl">
              Launch Flight
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#d6e2d1]">
              Stable scrolling flight, full-scene backgrounds, collectible acorns, song notes, fruit balloons, and kites in one run.
            </p>

            <div className="mx-auto mt-8 grid max-w-2xl gap-4 rounded-[28px] border border-white/15 bg-[#f7f2e7]/10 p-5 text-left md:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#d6e2d1]">
                  Pilot Name
                </span>
                <input
                  value={setupName}
                  onChange={(event) => setSetupName(event.target.value)}
                  maxLength={18}
                  className="rounded-2xl border border-white/20 bg-[#fff9ef] px-4 py-3 text-base text-[#213826] outline-none"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#d6e2d1]">
                  Favorite Fruit
                </span>
                <input
                  value={setupFruit}
                  onChange={(event) => setSetupFruit(event.target.value)}
                  maxLength={18}
                  className="rounded-2xl border border-white/20 bg-[#fff9ef] px-4 py-3 text-base text-[#213826] outline-none"
                />
              </label>
            </div>

            <div className="mt-6 text-sm text-[#d6e2d1]">
              Starting loadout: 50 acorns, 1 fruit balloon, 1 kite
            </div>
            <button
              type="button"
              onClick={handleLaunch}
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
