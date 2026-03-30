/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wind, Map, Info, Compass, ChevronRight, ChevronLeft, Volume2, VolumeX, Music, BookOpen } from 'lucide-react';
import { ADIRONDACK_46, BIRDS, Bird, Peak } from './constants';

// --- Types ---
interface Point {
  x: number;
  y: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
}

interface MountainLayer {
  peaks: Point[][];
  scrollFactor: number;
  color: string;
  opacity: number;
  imageIndex: number;
}

interface BirdNote {
  x: number;
  y: number;
  note: string;
  collected: boolean;
}

interface Kite {
  x: number;
  y: number;
  color: string;
  angle: number;
  phase: number;
}

interface Balloon {
  x: number;
  y: number;
  color: string;
  size: number;
  phase: number;
}

const SHIP_SIZE = 40;
const MOUNTAIN_COLOR = '#2d3a3a'; // Charcoal paper
const MIDGROUND_COLOR = '#4a5d5d';
const BACKGROUND_COLOR = '#7a8d8d';
const FAR_BACKGROUND_COLOR = '#a8b5ad';
const FOREGROUND_COLOR = '#1a2424';
const SKY_COLOR = '#f5f2ed'; // Vellum/Parchment
const ACCENT_COLOR = '#d4a373'; // Gold/Twine

const StartScreen = ({ onStart }: { onStart: () => void }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0a0a0a]"
    >
      {/* Background Image */}
      <div 
        className="absolute inset-0 opacity-40 bg-cover bg-center"
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=2070)' }}
      />
      
      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-2xl flex flex-col items-center">
        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-5xl md:text-7xl font-black uppercase tracking-[0.2em] text-[#f5f2ed] mb-8 leading-none"
        >
          Acorn airship
        </motion.h1>
        
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, type: 'spring' }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onStart}
          className="group relative flex flex-col items-center gap-4 focus:outline-none"
        >
          {/* Golden Acorn Icon */}
          <div className="text-[#d4a373] drop-shadow-[0_0_20px_rgba(212,163,115,0.4)] group-hover:text-[#e9c46a] transition-colors">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C16 22 19 19 19 14C19 10 16 7 12 7C8 7 5 10 5 14C5 19 8 22 12 22Z" fill="currentColor"/>
              <path d="M19 12C19 10 16 8 12 8C8 8 5 10 5 12V14H19V12Z" fill="#000" fillOpacity="0.2"/>
              <path d="M12 7V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          
          <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-2xl font-black uppercase tracking-[0.5em] text-[#d4a373] group-hover:text-[#e9c46a] transition-colors"
          >
            go
          </motion.span>
        </motion.button>
      </div>
      
      {/* Bottom Text */}
      <div className="absolute bottom-12 left-0 w-full text-center">
        <span className="text-[10px] uppercase tracking-[0.3em] text-[#f5f2ed]/20 font-black">
          Hold click to lift • Space to dash
        </span>
      </div>
    </motion.div>
  );
};

export default function App() {
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  
  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const CANVAS_WIDTH = dimensions.width;
  const CANVAS_HEIGHT = dimensions.height;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shipImage = useRef<HTMLImageElement | null>(null);
  const bgImages = useRef<(HTMLImageElement | null)[]>([]);
  const parallaxAtlas = useRef<HTMLImageElement | null>(null);
  
  // Load Photography Assets
  useEffect(() => {
    const ship = new Image();
    ship.src = "https://ais-pre-r3h3772brmmongz2ce6ii5-119227467043.us-east1.run.app/airship.png"; // Assuming the uploaded asset is served here
    ship.referrerPolicy = "no-referrer";
    ship.onload = () => { shipImage.current = ship; };

    const bgUrls = [
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2560&q=80", // Cloudy/Moody
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=2560&q=80", // Dawn/Dusk
      "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?auto=format&fit=crop&w=2560&q=80", // Bright Blue
      "https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?auto=format&fit=crop&w=2560&q=80", // Hazy Blue
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=2560&q=80", // Morning
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=2560&q=80", // High Contrast
    ];

    bgUrls.forEach((url, i) => {
      const img = new Image();
      img.src = url;
      img.referrerPolicy = "no-referrer";
      img.onload = () => { bgImages.current[i] = img; };
    });

    const atlas = new Image();
    // Using the provided parallax strips image URL (placeholder for the uploaded asset)
    atlas.src = "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2560&q=80"; // Fallback
    atlas.referrerPolicy = "no-referrer";
    atlas.onload = () => { parallaxAtlas.current = atlas; };
  }, []);
  
  // Game State
  const [currentPeakIndex, setCurrentPeakIndex] = useState(0);
  const [distanceToNext, setDistanceToNext] = useState(1000);
  const [isJournalOpen, setIsJournalOpen] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  // Handle Mouse Movement for Parallax
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  const [isMuted, setIsMuted] = useState(false);
  const [altitude, setAltitude] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  
  // Birdsong Banner State
  const [currentBirdIndex, setCurrentBirdIndex] = useState(0);
  const [collectedBirdNotes, setCollectedBirdNotes] = useState<boolean[]>([]);
  const [activeAbility, setActiveAbility] = useState<string | null>(null);
  const [abilityTimer, setAbilityTimer] = useState(0);
  const currentBird = BIRDS[currentBirdIndex];

  useEffect(() => {
    setCollectedBirdNotes(new Array(currentBird.song.length).fill(false));
  }, [currentBirdIndex]);

  useEffect(() => {
    const peakName = ADIRONDACK_46[currentPeakIndex].name;
    const birdIdx = BIRDS.findIndex(b => b.unlockedAt === peakName);
    if (birdIdx !== -1 && birdIdx !== currentBirdIndex) {
      setCurrentBirdIndex(birdIdx);
    }
  }, [currentPeakIndex, currentBirdIndex]);

  useEffect(() => {
    if (collectedBirdNotes.length > 0 && collectedBirdNotes.every(v => v)) {
      setActiveAbility(currentBird.ability);
      setAbilityTimer(10); // 10 seconds of superpower
      
      // Dawn Chorus: Acorn Burst
      if (currentBird.ability === 'Dawn Chorus') {
        setAcorns(prev => prev + 200);
      }

      const timer = setTimeout(() => {
        setCollectedBirdNotes(new Array(currentBird.song.length).fill(false));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [collectedBirdNotes, currentBird.song.length, currentBird.ability]);

  // Ability Timer
  useEffect(() => {
    if (abilityTimer > 0) {
      const timer = setInterval(() => {
        setAbilityTimer(prev => Math.max(0, prev - 0.1));
      }, 100);
      return () => clearInterval(timer);
    } else {
      setActiveAbility(null);
    }
  }, [abilityTimer]);

  // Acorn Economy
  const [acorns, setAcorns] = useState(100);
  const [isLifting, setIsLifting] = useState(false);
  const [isDashing, setIsDashing] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  const [iceHealth, setIceHealth] = useState(0);
  
  // Game State Refs
  const gameState = useRef({
    scrollX: 0,
    shipY: CANVAS_HEIGHT / 2,
    shipVY: 0,
    targetY: CANVAS_HEIGHT / 2,
    particles: [] as Particle[],
    mountainLayers: [] as MountainLayer[],
    birdNotes: [] as BirdNote[],
    kites: [] as Kite[],
    balloons: [] as Balloon[],
    lastTime: 0,
    peakPositions: [] as number[],
    driftPhase: 0,
    currentBgIdx: 0,
    prevBgIdx: 0,
    bgTransition: 1,
  });

  // Initialize Game World
  useEffect(() => {
    const generateLayer = (count: number, heightFactor: number, widthBase: number, scrollFactor: number, color: string, opacity: number, imageIndex: number, isMain: boolean = false) => {
      const peaks = [];
      const positions = [];
      let currentX = 0;
      
      for (let i = 0; i < count; i++) {
        const peak = isMain ? ADIRONDACK_46[i] : null;
        const width = widthBase + Math.random() * 400;
        const elevation = peak ? peak.elevation : (1500 + Math.random() * 2500);
        const height = (elevation / 5344) * (CANVAS_HEIGHT * heightFactor);
        
        const points: Point[] = [
          { x: currentX, y: CANVAS_HEIGHT },
          { x: currentX + width * 0.3, y: CANVAS_HEIGHT - height * 0.4 },
          { x: currentX + width * 0.5, y: CANVAS_HEIGHT - height },
          { x: currentX + width * 0.7, y: CANVAS_HEIGHT - height * 0.4 },
          { x: currentX + width, y: CANVAS_HEIGHT },
        ];
        
        peaks.push(points);
        if (isMain) positions.push(currentX + width * 0.5);
        currentX += width + (isMain ? 400 : 100) + Math.random() * (isMain ? 600 : 200);
      }
      
      return { peaks, positions, layer: { peaks, scrollFactor, color, opacity, imageIndex } };
    };
    
    // 5-layer Parallax (Indices: 0: Foreground, 1: Main, 2: Mid, 3: Back, 4: Far Back)
    // Atlas Strips: 0: Cloudy Peaks, 1: Sunset Forest, 2: Dense Forest, 3: Distant Blue
    const layer5 = generateLayer(80, 0.2, 1500, 1.0, FAR_BACKGROUND_COLOR, 0.3, 3); // Far Background (Distant Blue)
    const layer4 = generateLayer(60, 0.3, 1200, 1.0, BACKGROUND_COLOR, 0.5, 0); // Background (Cloudy Peaks)
    const layer3 = generateLayer(50, 0.45, 1000, 1.0, MIDGROUND_COLOR, 0.8, 1); // Midground (Sunset Forest)
    const layer2 = generateLayer(ADIRONDACK_46.length, 0.65, 800, 1.0, MOUNTAIN_COLOR, 1.0, 2, true); // Main Peaks (Dense Forest)
    const layer1 = generateLayer(40, 0.8, 600, 1.0, FOREGROUND_COLOR, 0.9, 2); // Foreground (Dense Forest)
    
    gameState.current.mountainLayers = [layer5.layer, layer4.layer, layer3.layer, layer2.layer, layer1.layer];
    gameState.current.peakPositions = layer2.positions;

    // Generate Bird Notes
    const birdNotes: BirdNote[] = [];
    for (let i = 0; i < 400; i++) {
      birdNotes.push({
        x: 1000 + i * 300 + Math.random() * 150,
        y: 200 + Math.random() * (CANVAS_HEIGHT - 400),
        note: ['♪', '♫', '♩', '♬'][Math.floor(Math.random() * 4)],
        collected: false,
      });
    }
    gameState.current.birdNotes = birdNotes;

    // Generate Kites
    const kites: Kite[] = [];
    const kiteColors = ['#e63946', '#f1faee', '#a8dadc', '#457b9d', '#1d3557'];
    for (let i = 0; i < 50; i++) {
      kites.push({
        x: 2000 + i * 1500 + Math.random() * 1000,
        y: 100 + Math.random() * 300,
        color: kiteColors[Math.floor(Math.random() * kiteColors.length)],
        angle: 0,
        phase: Math.random() * Math.PI * 2,
      });
    }
    gameState.current.kites = kites;

    // Generate Balloons
    const balloons: Balloon[] = [];
    const balloonColors = ['#ffadad', '#ffd6a5', '#fdffb6', '#caffbf', '#9bf6ff'];
    for (let i = 0; i < 40; i++) {
      balloons.push({
        x: 3000 + i * 2000 + Math.random() * 1500,
        y: 200 + Math.random() * (CANVAS_HEIGHT - 400),
        color: balloonColors[Math.floor(Math.random() * balloonColors.length)],
        size: 20 + Math.random() * 15,
        phase: Math.random() * Math.PI * 2,
      });
    }
    gameState.current.balloons = balloons;

  }, [CANVAS_HEIGHT]);

  // Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleMouseDown = () => setIsLifting(true);
    const handleMouseUp = () => setIsLifting(false);
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') setIsDashing(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') setIsDashing(false);
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const loop = (time: number) => {
      const dt = (time - gameState.current.lastTime) / 1000;
      gameState.current.lastTime = time;

      const currentPeak = ADIRONDACK_46[currentPeakIndex];
      const tier = currentPeak.tier;
      let driftY = 0;
      
      if (gameStarted) {
        // Update Ship Physics
        let liftForce = 0;
        if (isLifting && acorns > 0 && !isFrozen) {
          liftForce = -800;
          setAcorns(prev => Math.max(0, prev - 5 * dt));
        } else {
          liftForce = 400; // Gravity
        }

        // Drift (Sine Wave)
        gameState.current.driftPhase += dt * 2;
        driftY = Math.sin(gameState.current.driftPhase) * 20;

        gameState.current.shipVY += liftForce * dt;
        gameState.current.shipVY *= 0.98; // Air resistance
        gameState.current.shipY += gameState.current.shipVY * dt;

        // Clamp Ship
        if (gameState.current.shipY < 50) {
          gameState.current.shipY = 50;
          gameState.current.shipVY = 0;
        }
        if (gameState.current.shipY > CANVAS_HEIGHT - 100) {
          gameState.current.shipY = CANVAS_HEIGHT - 100;
          gameState.current.shipVY = 0;
        }
        
        // Update Scroll
        let baseSpeed = 40;
        if (activeAbility === 'The Alarm') baseSpeed = 300; // Superpower speed
        else if (isDashing && acorns > 0 && !isFrozen) {
          baseSpeed = 250;
          setAcorns(prev => Math.max(0, prev - 10 * dt));
        }
        
        // Tier 2: Pushback
        if (tier === 2 && activeAbility !== 'The Alarm') baseSpeed -= 30;
        
        gameState.current.scrollX += baseSpeed * (activeAbility === 'The Memory' ? dt * 0.5 : dt);
        setSpeed(Math.round(baseSpeed / 10));

        // Alarm Shockwave: Clear Ice
        if (activeAbility === 'Alarm Shockwave' && isFrozen) {
          setIsFrozen(false);
          setIceHealth(0);
        }

        // Tier 4: Freeze
        if (tier === 4 && !isFrozen && Math.random() < 0.001) {
          setIsFrozen(true);
          setIceHealth(10);
        }

        // Update Particles (Wind/Snow)
        const particleCount = tier === 4 ? 0.5 : 0.1;
        if (Math.random() < particleCount) {
          gameState.current.particles.push({
            x: CANVAS_WIDTH,
            y: Math.random() * CANVAS_HEIGHT,
            vx: -baseSpeed - 100 - Math.random() * 100,
            vy: (Math.random() - 0.5) * 50,
            size: tier === 4 ? 2 + Math.random() * 3 : 1 + Math.random() * 2,
            opacity: 0.2 + Math.random() * 0.3,
          });
        }
        
        gameState.current.particles = gameState.current.particles.filter(p => {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          return p.x > -10;
        });

        // Find Current Peak
        const scrollX = gameState.current.scrollX + CANVAS_WIDTH * 0.2;
        let closestIdx = 0;
        let minDiff = Infinity;
        
        gameState.current.peakPositions.forEach((pos, idx) => {
          const diff = pos - scrollX;
          if (diff > 0 && diff < minDiff) {
            minDiff = diff;
            closestIdx = idx;
          }
        });
        
        if (closestIdx !== currentPeakIndex) {
          setCurrentPeakIndex(closestIdx);
        }
        setDistanceToNext(Math.max(0, Math.round(minDiff / 10)));
        
        // Calculate Altitude
        const currentAlt = Math.round((1 - (gameState.current.shipY / CANVAS_HEIGHT)) * 6000);
        setAltitude(currentAlt);
      } else {
        setSpeed(0);
      }

      // Update Background Transition
      const targetBgIdx = Math.min(tier - 1, bgImages.current.length - 1);
      if (gameState.current.currentBgIdx !== targetBgIdx) {
        gameState.current.prevBgIdx = gameState.current.currentBgIdx;
        gameState.current.currentBgIdx = targetBgIdx;
        gameState.current.bgTransition = 0;
      }

      if (gameState.current.bgTransition < 1) {
        gameState.current.bgTransition += 0.005; // Slow, smooth transition
      }

      // Render
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      // Draw Background Photography with Cross-Fade
      const drawBg = (idx: number, alpha: number) => {
        const img = bgImages.current[idx];
        if (img) {
          const scrollFactor = 1.0;
          const imgWidth = img.width * (CANVAS_HEIGHT / img.height);
          const x = -(gameState.current.scrollX * scrollFactor) % imgWidth;
          ctx.globalAlpha = alpha * 0.8;
          ctx.drawImage(img, x, 0, imgWidth, CANVAS_HEIGHT);
          ctx.drawImage(img, x + imgWidth, 0, imgWidth, CANVAS_HEIGHT);
          ctx.globalAlpha = 1;
        } else {
          // Draw Sky Fallback
          ctx.globalAlpha = alpha;
          ctx.fillStyle = idx === 2 ? '#1a1a2e' : SKY_COLOR; // Tier 3 (idx 2) is dark
          ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
          ctx.globalAlpha = 1;
        }
      };

      if (gameState.current.bgTransition < 1) {
        drawBg(gameState.current.prevBgIdx, 1 - gameState.current.bgTransition);
        drawBg(gameState.current.currentBgIdx, gameState.current.bgTransition);
      } else {
        drawBg(gameState.current.currentBgIdx, 1);
      }
      
      // Tier 3: Overlay for Deep Dark Woods
      if (tier === 3) {
        ctx.fillStyle = 'rgba(26, 26, 46, 0.4)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      }

      // Draw Parallax Layers
      gameState.current.mountainLayers.forEach((layer, layerIdx) => {
        const layerScroll = gameState.current.scrollX * layer.scrollFactor;
        const atlas = parallaxAtlas.current;
        
        ctx.globalAlpha = layer.opacity;
        
        layer.peaks.forEach((points, idx) => {
          const x = points[0].x - layerScroll;
          const width = points[4].x - points[0].x;
          const height = CANVAS_HEIGHT - points[2].y;
          const y = points[2].y;

          if (x + width > 0 && x < CANVAS_WIDTH) {
            if (atlas) {
              ctx.save();
              // Create clipping path from the mountain polygon
              ctx.beginPath();
              ctx.moveTo(points[0].x - layerScroll, points[0].y);
              for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x - layerScroll, points[i].y);
              }
              ctx.closePath();
              ctx.clip();

              // Draw the mountain photo within the clip
              // Slice the atlas into 4 strips (y-offset: 0, 0.25, 0.5, 0.75)
              const stripY = (layer.imageIndex % 4) * (atlas.height / 4);
              const stripH = atlas.height / 4;
              
              ctx.drawImage(atlas, 0, stripY, atlas.width, stripH, x, y, width, height);
              
              // Apply a tint based on the layer's color
              ctx.globalCompositeOperation = 'multiply';
              ctx.fillStyle = layer.color;
              ctx.globalAlpha = 0.4;
              ctx.fillRect(x, y, width, height);
              ctx.restore();
              
              ctx.globalAlpha = layer.opacity;
            } else {
              // Fallback to polygon if image not loaded
              ctx.fillStyle = layer.color;
              ctx.beginPath();
              ctx.moveTo(points[0].x - layerScroll, points[0].y);
              for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x - layerScroll, points[i].y);
              }
              ctx.fill();
            }
          
              // Summit Pins (only for the main peak layer)
            if (layerIdx === 3 && idx === currentPeakIndex) {
              const pinX = points[2].x - layerScroll;
              const pinY = points[2].y - 120;
              
              ctx.save();
              ctx.globalAlpha = 1;
              
              // Pin Head (Wooden Bead)
              ctx.fillStyle = '#d4a373'; // Wooden color
              ctx.shadowBlur = 4;
              ctx.shadowColor = 'rgba(0,0,0,0.2)';
              ctx.beginPath();
              ctx.arc(pinX, pinY, 6, 0, Math.PI * 2);
              ctx.fill();
              
              // Pin Needle (Twine/Metal)
              ctx.shadowBlur = 0;
              ctx.strokeStyle = '#795548';
              ctx.lineWidth = 1.5;
              ctx.setLineDash([4, 2]);
              ctx.beginPath();
              ctx.moveTo(pinX, pinY);
              ctx.lineTo(pinX, points[2].y);
              ctx.stroke();
              ctx.setLineDash([]);
              
              // Vellum Label Background
              const labelWidth = 140;
              const labelHeight = 45;
              ctx.fillStyle = 'rgba(245, 242, 237, 0.95)'; // Vellum color
              ctx.shadowBlur = 10;
              ctx.shadowColor = 'rgba(0,0,0,0.1)';
              ctx.beginPath();
              ctx.roundRect(pinX - labelWidth / 2, pinY - labelHeight - 15, labelWidth, labelHeight, 4);
              ctx.fill();
              
              // Label Border (Twine-like)
              ctx.strokeStyle = 'rgba(212, 163, 115, 0.4)';
              ctx.lineWidth = 1;
              ctx.stroke();
              
              // Handwritten Label Text
              ctx.fillStyle = '#2d3a3a';
              ctx.font = 'italic 18px Cormorant Garamond';
              ctx.textAlign = 'center';
              ctx.fillText(`${ADIRONDACK_46[idx].name}`, pinX, pinY - 42);
              ctx.font = '600 9px Inter';
              ctx.fillStyle = '#8b9d83';
              ctx.letterSpacing = '1px';
              ctx.fillText(`${ADIRONDACK_46[idx].elevation} FT`, pinX, pinY - 25);
              ctx.restore();
            }
          }
        });
      });
      ctx.globalAlpha = 1;

    // Draw Kites
    gameState.current.kites.forEach(k => {
      const kx = k.x - gameState.current.scrollX;
      if (kx > -100 && kx < CANVAS_WIDTH + 100) {
        k.phase += dt * 2;
        const sway = Math.sin(k.phase) * 30;
        const ky = k.y + Math.cos(k.phase * 0.5) * 20;
        
        ctx.save();
        ctx.translate(kx + sway, ky);
        ctx.rotate(Math.sin(k.phase) * 0.2);
        
        // Kite Body (Diamond)
        ctx.fillStyle = k.color;
        ctx.beginPath();
        ctx.moveTo(0, -25);
        ctx.lineTo(15, 0);
        ctx.lineTo(0, 35);
        ctx.lineTo(-15, 0);
        ctx.closePath();
        ctx.fill();
        
        // Kite Crossbars
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -25); ctx.lineTo(0, 35);
        ctx.moveTo(-15, 0); ctx.lineTo(15, 0);
        ctx.stroke();
        
        // Kite Tail
        ctx.beginPath();
        ctx.moveTo(0, 35);
        for (let i = 0; i < 5; i++) {
          const tx = Math.sin(k.phase + i) * 10;
          const ty = 35 + i * 15;
          ctx.lineTo(tx, ty);
          
          // Ribbon on tail
          ctx.save();
          ctx.translate(tx, ty);
          ctx.rotate(Math.sin(k.phase + i) * 0.5);
          ctx.fillStyle = k.color;
          ctx.fillRect(-4, -2, 8, 4);
          ctx.restore();
        }
        ctx.strokeStyle = '#795548';
        ctx.stroke();
        
        ctx.restore();
      }
    });

    // Draw Balloons
    gameState.current.balloons.forEach(b => {
      const bx = b.x - gameState.current.scrollX;
      if (bx > -100 && bx < CANVAS_WIDTH + 100) {
        b.phase += dt;
        const by = b.y + Math.sin(b.phase) * 30;
        
        ctx.save();
        ctx.translate(bx, by);
        
        // Balloon Envelope
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(0, -b.size, b.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Shading
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.arc(-b.size * 0.3, -b.size * 1.3, b.size * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        // Strings
        ctx.strokeStyle = '#795548';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(-b.size * 0.5, -b.size * 0.2);
        ctx.lineTo(-b.size * 0.3, b.size * 0.5);
        ctx.moveTo(b.size * 0.5, -b.size * 0.2);
        ctx.lineTo(b.size * 0.3, b.size * 0.5);
        ctx.stroke();
        
        // Basket (Vellum)
        ctx.fillStyle = '#f5f2ed';
        ctx.fillRect(-b.size * 0.4, b.size * 0.5, b.size * 0.8, b.size * 0.6);
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.strokeRect(-b.size * 0.4, b.size * 0.5, b.size * 0.8, b.size * 0.6);
        
        ctx.restore();
      }
    });

    // Draw Bird Notes
      gameState.current.birdNotes.forEach(n => {
        if (!n.collected) {
          const nx = n.x - gameState.current.scrollX;
          if (nx > 0 && nx < CANVAS_WIDTH) {
            ctx.save();
            ctx.translate(nx, n.y);
            ctx.rotate(Math.sin(gameState.current.lastTime * 0.005 + n.x) * 0.2);
            
            // Hand-drawn circle/note head
            ctx.strokeStyle = ACCENT_COLOR;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(0, 0, 8, 6, Math.PI / 4, 0, Math.PI * 2);
            ctx.stroke();
            
            // Note stem
            ctx.beginPath();
            ctx.moveTo(6, -4);
            ctx.lineTo(6, -25);
            ctx.stroke();
            
            // Note flag
            ctx.beginPath();
            ctx.moveTo(6, -25);
            ctx.bezierCurveTo(10, -20, 15, -22, 12, -15);
            ctx.stroke();
            
            ctx.restore();
            
            // Collision detection (Trailing String)
            const shipX = CANVAS_WIDTH * 0.2;
            const shipY = gameState.current.shipY;
            
            // Check along the string (12 segments)
            let isCaught = false;
            for (let i = 0; i < 12; i++) {
              const sx = shipX - 15 - i * 15;
              const sy = shipY + 35 + Math.sin(gameState.current.lastTime * 0.005 + i) * 15;
              const dist = Math.hypot(nx - sx, n.y - sy);
              if (dist < 25) {
                isCaught = true;
                break;
              }
            }

            if (isCaught) {
              n.collected = true;
              setAcorns(prev => prev + 5);
              
              // Add to Birdsong Banner
              setCollectedBirdNotes(prev => {
                const next = [...prev];
                const firstEmpty = next.indexOf(false);
                if (firstEmpty !== -1) {
                  next[firstEmpty] = true;
                }
                return next;
              });
            }
          }
        }
      });

      // Draw Particles (Vellum Flakes / Snow)
      gameState.current.particles.forEach(p => {
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = tier === 4 ? '#fff' : '#d4a373';
        
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(gameState.current.lastTime * 0.002 + p.x);
        
        // Rectangular "flake" shape
        ctx.beginPath();
        ctx.rect(-p.size, -p.size, p.size * 2, p.size * 1.5);
        ctx.fill();
        
        // Subtle crease line on flake
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.lineTo(0, p.size);
        ctx.stroke();
        
        ctx.restore();
      });
      ctx.globalAlpha = 1;

      // Draw Ship (Photographic Airship)
      const shipX = CANVAS_WIDTH * 0.2;
      const shipY = gameState.current.shipY + driftY;
      
      ctx.save();
      ctx.translate(shipX, shipY);
      ctx.rotate(gameState.current.shipVY * 0.001);
      
      if (shipImage.current) {
        const img = shipImage.current;
        const shipWidth = 180;
        const shipHeight = shipWidth * (img.height / img.width);
        
        // Effects
        if (activeAbility === 'Night Vision') {
          ctx.shadowBlur = 50;
          ctx.shadowColor = 'rgba(139, 157, 131, 0.6)';
        } else if (isLifting) {
          ctx.shadowBlur = 25;
          ctx.shadowColor = 'rgba(255, 152, 0, 0.4)';
        }
        
        ctx.drawImage(img, -shipWidth / 2, -shipHeight / 2, shipWidth, shipHeight);
      } else {
        // Fallback to Origami if image not loaded
        ctx.fillStyle = isLifting ? '#fff9c4' : '#ffffff';
        ctx.beginPath();
        ctx.moveTo(-45, -25); ctx.lineTo(-15, -5); ctx.lineTo(15, -5); ctx.lineTo(45, -35);
        ctx.lineTo(15, -45); ctx.lineTo(-15, -45); ctx.closePath();
        ctx.fill();
      }
      
      // Trailing Twine String (for catching notes)
      ctx.strokeStyle = '#795548';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 3]);
      ctx.beginPath();
      ctx.moveTo(-45, 20); 
      for (let i = 0; i < 12; i++) {
        const tx = -45 - i * 15;
        const ty = 20 + Math.sin(gameState.current.lastTime * 0.005 + i) * 15;
        ctx.lineTo(tx, ty);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Acorns in basket (Visual representation)
      ctx.fillStyle = '#d4a373';
      for (let i = 0; i < Math.min(8, acorns / 10); i++) {
        ctx.beginPath();
        ctx.arc(-10 + (i % 4) * 6, 25 + Math.floor(i / 4) * 5, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Ice if frozen (Crystalline Vellum)
      if (isFrozen) {
        ctx.fillStyle = 'rgba(225, 245, 254, 0.7)';
        ctx.beginPath();
        ctx.moveTo(-20, 15);
        ctx.lineTo(20, 15);
        ctx.lineTo(25, 55);
        ctx.lineTo(-25, 55);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.stroke();
      }
      
      ctx.restore();

      requestAnimationFrame(loop);
    };

    const animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [currentPeakIndex, acorns, isLifting, isDashing, isFrozen, iceHealth]);

  const handleIceTap = () => {
    if (isFrozen) {
      setIceHealth(prev => {
        if (prev <= 1) {
          setIsFrozen(false);
          return 0;
        }
        return prev - 1;
      });
    }
  };

  const currentPeak = ADIRONDACK_46[currentPeakIndex];

  return (
    <div 
      className="relative w-screen h-screen select-none overflow-hidden bg-[#f5f2ed]"
      onClick={handleIceTap}
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="absolute inset-0 cursor-none"
      />

      {/* --- Birdsong Banner --- */}
      <div className="absolute top-24 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
        <AnimatePresence>
          {activeAbility && (
            <motion.div 
              initial={{ y: -50, opacity: 0, scale: 0.8 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -50, opacity: 0, scale: 0.8 }}
              className="mb-8 flex flex-col items-center"
            >
              <div className="bg-[#d4a373] px-8 py-3 rounded-full shadow-2xl border-2 border-white/20 flex items-center gap-4">
                <Music size={24} className="text-[#f5f2ed] animate-bounce" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-[#f5f2ed]/60 uppercase tracking-[0.3em]">Superpower Active</span>
                  <span className="serif text-2xl italic text-[#f5f2ed]">{activeAbility}</span>
                </div>
                <div className="ml-4 w-12 h-12 rounded-full border-4 border-white/20 flex items-center justify-center relative overflow-hidden">
                  <motion.div 
                    className="absolute inset-0 bg-white/20"
                    animate={{ height: `${(abilityTimer / 10) * 100}%` }}
                    transition={{ duration: 0.1 }}
                  />
                  <span className="font-mono text-xs text-white font-bold z-10">{Math.ceil(abilityTimer)}s</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Removed: Songbird Book moved to Journal */}
      </div>

      {/* --- HUD: Top Left (Navigation) --- */}
      {/* Removed: All HUD elements moved to Journal */}

      {/* --- Wildlife Spotted Notification Removed --- */}

      <div className="absolute top-8 right-8 flex flex-col items-end gap-4">
        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
            className="p-2 rounded-full border border-[#2d3a3a]/10 hover:bg-[#2d3a3a]/5 transition-colors bg-[#f5f2ed]/80 backdrop-blur-sm shadow-sm"
          >
            {isMuted ? <VolumeX size={18} className="text-[#2d3a3a]/60" /> : <Volume2 size={18} className="text-[#2d3a3a]/60" />}
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); setIsJournalOpen(true); }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-sm bg-[#2d3a3a] text-[#f5f2ed] hover:bg-[#3d4a4a] transition-all shadow-[0_4px_15px_rgba(0,0,0,0.2)] border-b-2 border-black/20"
          >
            <BookOpen size={16} />
          </button>
        </div>
      </div>

      {/* --- Frozen Overlay --- */}
      <AnimatePresence>
        {isFrozen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 bg-blue-100/20 backdrop-blur-[2px] flex flex-col items-center justify-center pointer-events-none"
          >
            <div className="bg-white/60 p-6 rounded-2xl border border-white/40 shadow-xl text-center">
              <div className="mt-4 h-1 w-32 bg-blue-200 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-blue-500"
                  animate={{ width: `${(iceHealth / 10) * 100}%` }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- HUD: Bottom (Progress) --- */}
      {/* Removed: All HUD elements moved to Journal */}

      {/* --- Parallax Scrapbook (Journal) --- */}
      <AnimatePresence>
        {isJournalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-[#2d3a3a]/70 backdrop-blur-xl p-4 md:p-12"
            onClick={() => setIsJournalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.8, y: 100, rotate: -5 }}
              animate={{ scale: 1, y: 0, rotate: 0 }}
              exit={{ scale: 0.8, y: 100, rotate: 5 }}
              className="bg-[#f5f2ed] w-full max-w-4xl h-[85vh] rounded-sm shadow-[0_30px_90px_rgba(0,0,0,0.4)] flex flex-col md:flex-row relative overflow-hidden"
              onClick={e => e.stopPropagation()}
              style={{ 
                backgroundImage: 'url("https://www.transparenttextures.com/patterns/parchment.png")',
                boxShadow: 'inset 0 0 150px rgba(0,0,0,0.1), 0 30px 90px rgba(0,0,0,0.4)'
              }}
            >
              {/* Scrapbook Binding (Twine) */}
              <div className="absolute left-0 top-0 bottom-0 w-6 bg-[#d4a373]/30 flex flex-col items-center justify-around py-8 border-r border-black/10 z-30">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="w-3 h-3 rounded-full bg-[#2d3a3a]/60 shadow-inner border border-black/20" />
                ))}
              </div>

              {/* Left Page: The Naturalist's Cover */}
              <div className="w-full md:w-2/5 bg-[#2d3a3a] p-12 text-[#f5f2ed] flex flex-col justify-between relative overflow-hidden">
                {/* Parallax Background Layer */}
                <motion.div 
                  className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay scale-110"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.1 }}
                >
                   <div className="w-full h-full" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/handmade-paper.png")' }} />
                </motion.div>

                <div className="relative z-10">
                  <motion.div>
                    <span className="text-[10px] tracking-[0.4em] uppercase font-black text-[#d4a373] mb-4 block">Field Journal</span>
                    <h2 className="serif text-5xl italic mb-8 leading-tight">The 46 High Peaks</h2>
                    <div className="w-16 h-1 bg-[#d4a373] mb-8" />
                  </motion.div>
                  
                  <motion.p 
                    className="text-sm leading-relaxed opacity-80 font-light tracking-wide max-w-xs"
                  >
                    A collection of observations, songs, and sightings from the heart of the Adirondack wilderness.
                  </motion.p>
                </div>

                {/* Bird Stamp (Parallax Layer) */}
                <motion.div 
                  className="absolute bottom-12 right-[-20px] w-48 h-48 bg-[#f5f2ed] p-2 shadow-2xl border border-black/5 rotate-[-15deg] z-20"
                >
                  <div className="w-full h-full bg-[#2d3a3a]/5 flex flex-col items-center justify-center p-4 border border-[#d4a373]/20 relative">
                    <div className="absolute top-2 left-2 text-[8px] uppercase tracking-tighter text-[#8b9d83] font-bold">Specimen #{currentBirdIndex + 1}</div>
                    <div className="text-4xl mb-2">🐦</div>
                    <span className="serif text-lg italic text-[#2d3a3a]">{currentBird.name}</span>
                    <div className="mt-2 flex flex-wrap justify-center gap-2">
                      {currentBird.song.map((syllable, i) => (
                        <div key={i} className="flex flex-col items-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#d4a373] mb-1" />
                          <span className="text-[6px] uppercase tracking-tighter font-black text-[#2d3a3a]/40">{syllable}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>

                <div className="flex items-center gap-4 opacity-40 relative z-10">
                  <Wind size={18} />
                  <span className="text-[11px] tracking-[0.3em] uppercase font-black">Adirondack Park</span>
                </div>
              </div>
              
              {/* Right Page: Observations */}
              <div className="w-full md:w-3/5 p-16 overflow-y-auto relative bg-[#f5f2ed]">
                {/* Parallax Background Layer */}
                <motion.div 
                  style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/parchment.png")' }}
                  className="absolute inset-0 opacity-5 pointer-events-none"
                />

                <div className="relative z-10">
                  <motion.div 
                    className="mb-12"
                  >
                    <span className="text-[10px] uppercase tracking-[0.4em] text-[#d4a373] font-black">Current Ascent</span>
                    <h3 className="serif text-6xl mt-4 mb-8 text-[#2d3a3a] tracking-tighter">{currentPeak.name}</h3>
                    
                    <div className="relative p-8 bg-[#2d3a3a]/5 rounded-sm border-l-8 border-[#d4a373]/40 shadow-inner">
                      <p className="text-lg leading-relaxed text-[#2d3a3a]/90 italic font-medium">
                        "{currentPeak.description}"
                      </p>
                      {/* Ink Blot Decoration */}
                      <div className="absolute bottom-[-10px] right-[-10px] w-12 h-12 bg-[#2d3a3a]/10 rounded-full blur-xl" />
                    </div>
                  </motion.div>
                  
                  <div className="grid grid-cols-2 gap-12 pt-10 border-t border-[#2d3a3a]/10 mb-12">
                    <motion.div 
                      className="flex flex-col gap-2"
                    >
                      <span className="text-[10px] uppercase tracking-[0.3em] text-[#8b9d83] font-black">Elevation</span>
                      <p className="font-mono text-4xl text-[#2d3a3a] font-bold">{currentPeak.elevation} <span className="text-sm opacity-30 font-light">FT</span></p>
                    </motion.div>
                    <motion.div 
                      className="flex flex-col gap-2"
                    >
                      <span className="text-[10px] uppercase tracking-[0.3em] text-[#8b9d83] font-black">Rank</span>
                      <p className="font-mono text-4xl text-[#2d3a3a] font-bold">#{currentPeakIndex + 1} <span className="text-sm opacity-30 font-light">OF 46</span></p>
                    </motion.div>
                  </div>

                  {/* Flight Log Section */}
                  <div className="space-y-6 mb-12 bg-[#2d3a3a]/5 p-8 rounded-sm">
                    <h4 className="text-[10px] uppercase tracking-[0.4em] text-[#8b9d83] font-black border-b border-[#8b9d83]/20 pb-2">Flight Log</h4>
                    <div className="grid grid-cols-3 gap-8">
                      <div className="flex flex-col">
                        <span className="text-[8px] uppercase tracking-widest text-[#2d3a3a]/40 mb-1">Altitude</span>
                        <span className="font-mono text-xl text-[#2d3a3a]">{altitude}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] uppercase tracking-widest text-[#2d3a3a]/40 mb-1">Speed</span>
                        <span className="font-mono text-xl text-[#2d3a3a]">{speed}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] uppercase tracking-widest text-[#2d3a3a]/40 mb-1">Acorns</span>
                        <span className="font-mono text-xl text-[#2d3a3a]">{Math.floor(acorns)}</span>
                      </div>
                    </div>
                    
                    {/* Birdsong Progress in Journal (Songbird Book) */}
                    <div className="mt-8">
                      <span className="text-[8px] uppercase tracking-widest text-[#2d3a3a]/40 mb-3 block">Birdsong Collection</span>
                      <div className="flex gap-3 bg-[#2d3a3a]/5 p-4 rounded-sm relative overflow-hidden">
                        {/* Vellum Texture Overlay */}
                        <div className="absolute inset-0 pointer-events-none opacity-5" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/parchment.png")' }} />
                        
                        {currentBird.song.map((syllable, idx) => (
                          <div key={idx} className="flex flex-col items-center gap-1.5 relative z-10">
                            <motion.div 
                              animate={{ 
                                scale: collectedBirdNotes[idx] ? 1 : 0.95,
                                backgroundColor: collectedBirdNotes[idx] ? '#d4a373' : 'rgba(212, 163, 115, 0.05)',
                                borderColor: collectedBirdNotes[idx] ? '#d4a373' : 'rgba(212, 163, 115, 0.2)'
                              }}
                              className="w-10 h-14 border rounded-sm flex items-center justify-center transition-all relative shadow-sm"
                              style={{ 
                                backgroundImage: 'linear-gradient(rgba(212, 163, 115, 0.05) 1px, transparent 1px)',
                                backgroundSize: '100% 8px'
                              }}
                            >
                              {collectedBirdNotes[idx] ? (
                                <span className="text-white text-xl">♪</span>
                              ) : (
                                <span className="text-[8px] uppercase tracking-tighter font-black text-[#2d3a3a]/20">{syllable}</span>
                              )}
                              {/* Subtle Crease Line */}
                              <div className="absolute inset-0 border-r border-black/5 pointer-events-none" />
                            </motion.div>
                            <span className="text-[6px] uppercase tracking-tighter font-black text-[#2d3a3a]/40">{syllable}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Progress Bar in Journal */}
                    <div className="mt-8">
                      <span className="text-[8px] uppercase tracking-widest text-[#2d3a3a]/40 mb-2 block">Journey Progress</span>
                      <div className="h-1 w-full bg-[#2d3a3a]/10 relative rounded-full overflow-hidden">
                        <motion.div 
                          className="absolute top-0 left-0 h-full bg-[#d4a373]"
                          style={{ width: `${(currentPeakIndex / 46) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Peak Stamp (Parallax Layer) */}
                  <motion.div 
                    className="absolute top-[-40px] right-[-20px] w-32 h-32 border-4 border-[#d4a373]/40 rounded-full flex flex-col items-center justify-center rotate-[10deg] opacity-60 pointer-events-none"
                  >
                    <span className="text-[8px] font-black uppercase tracking-widest text-[#d4a373]">Summited</span>
                    <div className="w-16 h-[1px] bg-[#d4a373]/40 my-1" />
                    <span className="serif text-xs italic text-[#d4a373]">{new Date().toLocaleDateString()}</span>
                  </motion.div>

                  {/* Wildlife Observations Removed */}

                  <button 
                    onClick={() => setIsJournalOpen(false)}
                    className="mt-16 w-full py-5 bg-[#2d3a3a] text-[#f5f2ed] rounded-sm text-[11px] font-black uppercase tracking-[0.5em] hover:bg-[#3d4a4a] transition-all shadow-[0_10px_30px_rgba(0,0,0,0.3)] border-b-4 border-black/30 active:translate-y-1 active:border-b-0"
                  >
                    Return to Flight
                  </button>
                </div>
              </div>

              {/* Page Edge Highlight */}
              <div className="absolute inset-0 pointer-events-none border-[20px] border-transparent shadow-[inset_0_0_100px_rgba(0,0,0,0.05)]" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Start Screen --- */}
      <AnimatePresence>
        {!gameStarted && (
          <StartScreen onStart={() => setGameStarted(true)} />
        )}
      </AnimatePresence>

      {/* --- Subtle Vignette --- */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.05)]" />
    </div>
  );
}
