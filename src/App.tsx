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

        <motion.p
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opaacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-10 max-w-xl text-sm md:text-base leading-relaxed text-[#f5f2ed]/80"
        >
          Drift above the Adirondack High Peaks, gather birdsong, and launch into the range when you are ready.
        </motion.p>
        
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, type: 'spring' }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.9 }}
          onClick={onStart}
          className="group relative inline-flex items-center gap-4 rounded-full border border-[#d4a373]/60 bg-[#d4a373] px-8 py-4 text-left shadow-[0_20px_50px_rgba(0,0,0,0.35)] transition-colors focus:outline-none"
        >
          <div className="text-[#2d3a3a] drop-shadow-[0_0_20px_rgba(212,163,115,0.25)] transition-transform group-hover:translate-x-1">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C16 22 19 19 19 14C19 10 16 7 12 7C8 7 5 10 5 14C5 19 8 22 12 22Z" fill="currentColor"/>
              <path d="M19 12C19 10 16 8 12 8C8 8 5 10 5 12V14H19V12Z" fill="#000" fillOpacity="0.2"/>
              <path d="M12 7V3" stroke="currentColor" strokeWidth="2" strokeLineCap="round"/>
            </svg>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col items-start"
          >
            <span className="text-[10px] font-black uppercase tracking-[0.35em] text-[#2d3a3a]/60">
              After Landing
            </span>
            <span className="text-xl font-black uppercase tracking-[0.22em] text-[#2d3a3a]">
              Launch Flight
            </span>
          </motion.div>
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
          { x: currentX, y: CANVAS_HEIGHt },
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
    const layer4 = generateLayer(60, 0.3, 1200, 1.0, BACKGROUND_COLOR