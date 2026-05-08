import './style.css'
import planck from 'planck-js'

const Vec2 = planck.Vec2;

const GRID_SIZE = 20;
const WIDTH = 440;
const HEIGHT = 840;
const PLAY_ZONE_BOTTOM = 720;
const PSCALE = 30; // 30 pixels = 1 metro

// Helpers de Conversão
const pxToM = (px: number) => px / PSCALE;
const mToPx = (m: number) => m * PSCALE;

const getBezierPoint = (c: any, t: number) => {
    if (c.p3 && c.p4) {
        // Curva Bezier de 4º Grau (5 Pontos: p0, p1, p2, p3, p4) para máxima flexibilidade
        const x = (1 - t)**4 * c.p0.x + 4 * (1 - t)**3 * t * c.p1.x + 6 * (1 - t)**2 * t**2 * c.p2.x + 4 * (1 - t) * t**3 * c.p3.x + t**4 * c.p4.x;
        const y = (1 - t)**4 * c.p0.y + 4 * (1 - t)**3 * t * c.p1.y + 6 * (1 - t)**2 * t**2 * c.p2.y + 4 * (1 - t) * t**3 * c.p3.y + t**4 * c.p4.y;
        return { x, y };
    } else {
        // Curva Bezier Quadrática (3 Pontos: p0, p1, p2)
        // Calculamos o ponto de controlo matemático mp1 de forma a que o pico físico da curva passe EXACTAMENTE por p1 (t=0.5)
        const mp1x = 2 * c.p1.x - 0.5 * (c.p0.x + c.p2.x);
        const mp1y = 2 * c.p1.y - 0.5 * (c.p0.y + c.p2.y);
        const x = (1 - t)**2 * c.p0.x + 2 * (1 - t) * t * mp1x + t**2 * c.p2.x;
        const y = (1 - t)**2 * c.p0.y + 2 * (1 - t) * t * mp1y + t**2 * c.p2.y;
        return { x, y };
    }
};

let isSoundEnabled = true;

class SoundEffects {
    private ctx: AudioContext | null = null;
    private lastSpinnerTime = 0;

    constructor() {}

    private init() {
        if (!isSoundEnabled) return;
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playBumper() {
        this.init();
        if (!this.ctx || !isSoundEnabled) return;
        const now = this.ctx.currentTime;
        
        if (activeTheme === 'retro') {
            // Sino/Chime mecânico clássico ("PIN!") de alta fidelidade
            const notes = [987.77, 1318.51, 1975.53]; // B5, E6, B6 (harmónicos metálicos puros e ressonantes)
            notes.forEach((freq, idx) => {
                const osc = this.ctx!.createOscillator();
                const gain = this.ctx!.createGain();
                
                osc.type = 'sine'; // Sinos de pinball são ondas sinusoidais puras de ressonância mecânica
                osc.frequency.setValueAtTime(freq, now);
                
                // Diminuir ligeiramente o volume nos harmónicos superiores
                const vol = idx === 0 ? 0.16 : 0.08;
                gain.gain.setValueAtTime(vol, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32); // Ressonância longa de metal polido
                
                osc.connect(gain);
                gain.connect(this.ctx!.destination);
                
                osc.start(now);
                osc.stop(now + 0.35);
            });
        } else {
            // Oscilador principal (Bumper de alta frequência metálico)
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.exponentialRampToValueAtTime(1200, now + 0.08);
            
            // Filtro passa-banda para dar o tom ressonante de bumper
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(1000, now);
            filter.Q.setValueAtTime(3.0, now);
            
            gain.gain.setValueAtTime(0.22, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
            
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc.start(now);
            osc.stop(now + 0.18);
        }
    }

    playTarget() {
        this.init();
        if (!this.ctx || !isSoundEnabled) return;
        const now = this.ctx.currentTime;
        
        if (activeTheme === 'retro') {
            // Sino metálico de alvo (Tom de chime duplo harmonioso)
            const notes = [783.99, 1174.66]; // G5, D6 (Chime mecânico)
            notes.forEach((freq, idx) => {
                const osc = this.ctx!.createOscillator();
                const gain = this.ctx!.createGain();
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now);
                
                const vol = idx === 0 ? 0.14 : 0.07;
                gain.gain.setValueAtTime(vol, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
                
                osc.connect(gain);
                gain.connect(this.ctx!.destination);
                
                osc.start(now);
                osc.stop(now + 0.28);
            });
        } else {
            // Dois osciladores em harmonia (Chime duplo de alvo)
            const osc1 = this.ctx.createOscillator();
            const osc2 = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(880, now); // Nota Lá (A5)
            
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(1100, now); // Nota Dó# (C#6) - Harmonia maior
            
            gain.gain.setValueAtTime(0.18, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
            
            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc1.start(now);
            osc2.start(now);
            osc1.stop(now + 0.22);
            osc2.stop(now + 0.22);
        }
    }

    playFlipper() {
        this.init();
        if (!this.ctx || !isSoundEnabled) return;
        const now = this.ctx.currentTime;
        
        // Pancada mecânica: onda quadrada grave + frequência descendente rápida
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(60, now + 0.05);
        
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start(now);
        osc.stop(now + 0.06);
    }

    playLaunch() {
        this.init();
        if (!this.ctx || !isSoundEnabled) return;
        const now = this.ctx.currentTime;
        
        // Laser de arranque clássico: dente-de-serra ascendente rápido
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.4);
        
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start(now);
        osc.stop(now + 0.4);
    }

    playSpinner(speedFactor: number = 5) {
        this.init();
        if (!this.ctx || !isSoundEnabled) return;
        const now = this.ctx.currentTime;
        
        // Evitar sobreposição excessiva de sons de rotação (debounce de 150ms)
        if (now - this.lastSpinnerTime < 0.15) {
            return;
        }
        this.lastSpinnerTime = now;
        
        // Simular a corrente de bicicleta: uma série de cliques rápidos ("ticks")
        // O número de cliques e velocidade dependem da velocidade de rotação
        const clickCount = Math.min(8, Math.round(speedFactor * 1.5));
        const interval = 0.04; // 40ms entre cliques para um som contínuo e mecânico de catraca
        
        for (let i = 0; i < clickCount; i++) {
            const clickTime = now + i * interval;
            const clickOsc = this.ctx.createOscillator();
            const clickGain = this.ctx.createGain();
            
            // Usar onda triangular para cliques percussivos mecânicos e agradáveis (sem agudos estridentes)
            clickOsc.type = 'triangle';
            clickOsc.frequency.setValueAtTime(1400 - (i * 50), clickTime); // Ligeira descida de tom simulando abrandamento
            clickOsc.frequency.exponentialRampToValueAtTime(180, clickTime + 0.02);
            
            clickGain.gain.setValueAtTime(0.05, clickTime);
            clickGain.gain.exponentialRampToValueAtTime(0.001, clickTime + 0.02);
            
            clickOsc.connect(clickGain);
            clickGain.connect(this.ctx.destination);
            
            clickOsc.start(clickTime);
            clickOsc.stop(clickTime + 0.025);
        }
    }

    playHole() {
        this.init();
        if (!this.ctx || !isSoundEnabled) return;
        const now = this.ctx.currentTime;
        
        // Efeito "Bubbling" de captura: Arpejo rápido ascendente
        const notes = [330, 440, 550, 660]; // Notas E4, A4, C#5, E5
        notes.forEach((freq, idx) => {
            const timeOffset = now + idx * 0.06;
            const osc = this.ctx!.createOscillator();
            const gain = this.ctx!.createGain();
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, timeOffset);
            
            gain.gain.setValueAtTime(0.14, timeOffset);
            gain.gain.exponentialRampToValueAtTime(0.001, timeOffset + 0.12);
            
            osc.connect(gain);
            gain.connect(this.ctx!.destination);
            
            osc.start(timeOffset);
            osc.stop(timeOffset + 0.12);
        });
    }

    playGameOver() {
        this.init();
        if (!this.ctx || !isSoundEnabled) return;
        const now = this.ctx.currentTime;
        
        // Melodia triste descendente clássica
        const notes = [523.25, 466.16, 415.30, 349.23, 261.63]; // C5, Bb4, Ab4, F4, C4
        notes.forEach((freq, idx) => {
            const timeOffset = now + idx * 0.18;
            const osc = this.ctx!.createOscillator();
            const gain = this.ctx!.createGain();
            
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, timeOffset);
            osc.frequency.linearRampToValueAtTime(freq - 50, timeOffset + 0.16);
            
            gain.gain.setValueAtTime(0.12, timeOffset);
            gain.gain.exponentialRampToValueAtTime(0.001, timeOffset + 0.16);
            
            osc.connect(gain);
            gain.connect(this.ctx!.destination);
            
            osc.start(timeOffset);
            osc.stop(timeOffset + 0.16);
        });
    }

    playScoreMilestone() {
        this.init();
        if (!this.ctx || !isSoundEnabled) return;
        const now = this.ctx.currentTime;
        
        // Fanfarra eletrónica vitoriosa (Jackpot/Portal de viagem)
        const chords = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6
        chords.forEach((freq, idx) => {
            const timeOffset = now + idx * 0.08;
            const osc = this.ctx!.createOscillator();
            const gain = this.ctx!.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, timeOffset);
            
            gain.gain.setValueAtTime(0.15, timeOffset);
            gain.gain.exponentialRampToValueAtTime(0.001, timeOffset + 0.35);
            
            osc.connect(gain);
            gain.connect(this.ctx!.destination);
            
            osc.start(timeOffset);
            osc.stop(timeOffset + 0.35);
        });
    }
}

const sounds = new SoundEffects();
const NEON_COLORS = ['#ff00ff', '#00ffff', '#00ff00', '#ffeb3b'];

type Tool = 'pin' | 'prego' | 'wall' | 'wall-b' | 'bumper-s' | 'bumper-l' | 'bumper-t' | 'bumper-t-l' | 'flipper-l' | 'flipper-r' | 'flipper-s-l' | 'flipper-s-r' | 'hole' | 'hole-g' | 'hole-r' | 'hole-b' | 'hole-y' | 'target' | 'target-p' | 'spinner' | 'roleta' | 'light' | 'light-g' | 'light-r' | 'light-b' | 'light-y' | 'light-g3-line' | 'light-g3-tri' | 'light-g4-line' | 'light-g4-square' | 'trash' | 'plunger' | 'spawn';
let activeTheme: 'neon' | 'retro' = 'neon';
let currentTool: Tool = 'pin';
let isPlaying = false;
let components: any[] = [];
let gravityVal = 1.0;
let wallStart: { x: number, y: number } | null = null;
let score = 0;
let ballsLeft = 3;
let extraBallThreshold = 250000;
let keysPressed = new Set<string>();
let isLaunched = false;
let ghostPos = { x: 0, y: 0 };

// Variáveis do Portal de Viagem Inter-Mesas (Warp Portal System)
let warpActive = false;
let parentTableName = '';
let parentTableComponents: any[] = [];
let parentScore = 0;
let parentBallsLeft = 0;
let sourcePortalHoleOriginal: any = null;
let pregoActiveTimer = 0;
let extraBallsAwardedCount = 0;
let hasWarpedInThisRun = false;
let hasCompletedHolesMissionInThisRun = false;
let hasSuperJackpotInThisRun = false;

const getNextExtraBallThreshold = (awardedCount: number) => {
    if (awardedCount === 0) return 250000;
    if (awardedCount === 1) return 750000;
    if (awardedCount === 2) return 1500000;
    return 1500000 + (awardedCount - 2) * 1000000;
};

// Estado do Jogo Planck
let world: any = null;
let marbleBody: any = null;
let plungerBody: any = null;
let flipperJoints: any[] = [];
let animationId: number | null = null;

// Sistema de Mensagens
let displayMessage = '';
let displayMessageTimer = 0;
let displayMessageColor = '#00ffff';

const showDisplayMessage = (msg: string, color = '#00ffff', duration = 2000) => {
    displayMessage = msg;
    displayMessageColor = color;
    displayMessageTimer = Date.now() + duration;
};

const updateBallsDisplay = () => {
    const ballsEl = document.getElementById('canvas-balls');
    if (ballsEl) ballsEl.innerText = `BOLAS: ${ballsLeft}`;
};

const formatScore = (num: number) => {
    const val = num % 1000000000;
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const updateScore = (points: number) => {
    score = (score + points) % 1000000000; // Limitado a 9 dígitos (999.999.999)
    const scoreEl = document.getElementById('canvas-score');
    if (scoreEl) {
        const scoreStr = score.toString().padStart(9, '0');
        const previousDigits = Array.from(scoreEl.querySelectorAll('.reel-digit')).map(el => el.textContent);
        
        let html = '';
        for (let i = 0; i < 9; i++) {
            const digit = scoreStr[i];
            const hasChanged = previousDigits.length > 0 && previousDigits[i] !== digit;
            const animClass = hasChanged ? 'spin-reel' : '';
            html += `<div class="reel-digit ${animClass}">${digit}</div>`;
            if (i === 2 || i === 5) {
                html += `<div class="reel-separator">.</div>`;
            }
        }
        scoreEl.innerHTML = html;
        
        // Limpar a classe de rotação para permitir nova animação no próximo clique
        setTimeout(() => {
            scoreEl.querySelectorAll('.spin-reel').forEach(el => el.classList.remove('spin-reel'));
        }, 120);
    }
    
    const nextThreshold = getNextExtraBallThreshold(extraBallsAwardedCount);
    if (score >= nextThreshold) {
        ballsLeft++;
        extraBallsAwardedCount++;
        sounds.playScoreMilestone();
        updateBallsDisplay();
        showDisplayMessage(`🏆 BOLA EXTRA CONCEDIDA! 🏆\nPRÓXIMA AOS ${formatScore(getNextExtraBallThreshold(extraBallsAwardedCount))} PTS!`, "#00ff00", 3500);
    }
};

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

// SINCRONIZAÇÃO DE RESOLUÇÃO
canvas.width = WIDTH;
canvas.height = HEIGHT;

const updateToolSelection = () => {
    document.querySelectorAll('.tool').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-tool') === currentTool);
    });
};

document.querySelectorAll('.tool').forEach(btn => {
    btn.addEventListener('click', () => {
        currentTool = btn.getAttribute('data-tool') as Tool;
        wallStart = null; updateToolSelection();
    });
});

// Listeners das Abas Mobile
document.getElementById('btn-goto-workshop')?.addEventListener('click', () => switchTab('workshop'));
document.getElementById('btn-goto-game')?.addEventListener('click', () => switchTab('game'));

const getGridPos = (e: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = Math.round(((e.clientX - rect.left) * scaleX) / GRID_SIZE) * GRID_SIZE;
    const y = Math.round(((e.clientY - rect.top) * scaleY) / GRID_SIZE) * GRID_SIZE;
    return { x, y };
};

const snapToNearest = (x: number, y: number, ignoreComponent: any = null) => {
    let snapX = x;
    let snapY = y;
    let minDistance = 25; // Distância limite de snapping de 25px para colar perfeitamente!

    for (let c of components) {
        if (c === ignoreComponent) continue;

        // 1. Verificar o centro do objeto
        const distCenter = Math.sqrt((x - c.x)**2 + (y - c.y)**2);
        if (distCenter < minDistance) {
            snapX = c.x;
            snapY = c.y;
            minDistance = distCenter;
        }

        // Se for um flipper, adicionar pontos de ligação na parte de cima (ombro) e baixo da parte mais gorda (raio r1 = 14px)
        if (c.type && c.type.startsWith('flipper')) {
            const topX = c.x;
            const topY = c.y - 14;
            const distTop = Math.sqrt((x - topX)**2 + (y - topY)**2);
            if (distTop < minDistance) {
                snapX = topX;
                snapY = topY;
                minDistance = distTop;
            }

            const bottomX = c.x;
            const bottomY = c.y + 14;
            const distBottom = Math.sqrt((x - bottomX)**2 + (y - bottomY)**2);
            if (distBottom < minDistance) {
                snapX = bottomX;
                snapY = bottomY;
                minDistance = distBottom;
            }
        }

        // 2. Verificar extremidades de paredes p0, p2, p4
        if (c.p0) {
            const distP0 = Math.sqrt((x - c.p0.x)**2 + (y - c.p0.y)**2);
            if (distP0 < minDistance) {
                snapX = c.p0.x;
                snapY = c.p0.y;
                minDistance = distP0;
            }
            const endPt = c.p4 || c.p2;
            if (endPt) {
                const distEnd = Math.sqrt((x - endPt.x)**2 + (y - endPt.y)**2);
                if (distEnd < minDistance) {
                    snapX = endPt.x;
                    snapY = endPt.y;
                    minDistance = distEnd;
                }
            }
        }
    }
    return { x: snapX, y: snapY };
};


const isPointInComponent = (px: number, py: number, c: any) => {
    const dx = px - c.x;
    const dy = py - c.y;

    if (c.type === 'wall' || c.type === 'wall-b') {
        if (c.p0 && (c.p4 || c.p2)) {
            // Verificar proximidade ao longo da curva Bezier de forma contínua (25 pontos para garantir que não há falhas em curvas longas!)
            for (let i = 0; i <= 25; i++) {
                const pt = getBezierPoint(c, i / 25);
                const dist = Math.sqrt((px - pt.x)**2 + (py - pt.y)**2);
                if (dist <= 24) return true; // Área de clique mais generosa de 24px para deteção perfeita e facilidade de remoção/borracha!
            }
            return false;
        }
        const angle = c.angle || 0;
        const localX = dx * Math.cos(-angle) - dy * Math.sin(-angle);
        const localY = dx * Math.sin(-angle) + dy * Math.cos(-angle);
        return Math.abs(localX) <= (c.w / 2) + 5 && Math.abs(localY) <= 15;
    }
    
    if (c.type.startsWith('bumper')) {
        const isLarge = c.type === 'bumper-l' || c.type === 'bumper-t-l';
        const radius = c.type === 'bumper-s' ? 20 : (c.type === 'bumper-l' ? 35 : (isLarge ? 50 : 30));
        return Math.sqrt(dx*dx + dy*dy) <= radius;
    }

    if (c.type.startsWith('flipper')) {
        const isSmall = c.type.includes('-s-');
        const length = isSmall ? 75 : 100;
        return Math.sqrt(dx*dx + dy*dy) <= length * 0.8; // Simplificado para a área do braço
    }

    if (c.type.startsWith('target') || c.type === 'plunger') {
        return Math.abs(dx) <= 20 && Math.abs(dy) <= 20;
    }

    if (c.type === 'hole') return Math.sqrt(dx*dx + dy*dy) <= 25;
    if (c.type.startsWith('hole-')) return Math.abs(dx) <= 28 && Math.abs(dy) <= 28;
    if (c.type === 'spinner') return Math.abs(dx) <= 40 && Math.abs(dy) <= 15;
    if (c.type === 'roleta') return Math.abs(dx) <= 40 && Math.abs(dy) <= 15;
    if (c.type.startsWith('light-g')) {
        if (c.type === 'light-g3-line') return Math.abs(dx) <= 32 && Math.abs(dy) <= 10;
        if (c.type === 'light-g3-tri') return Math.abs(dx) <= 20 && Math.abs(dy) <= 18;
        if (c.type === 'light-g4-line') return Math.abs(dx) <= 46 && Math.abs(dy) <= 10;
        if (c.type === 'light-g4-square') return Math.abs(dx) <= 20 && Math.abs(dy) <= 20;
    }
    if (c.type.startsWith('light')) return Math.sqrt(dx*dx + dy*dy) <= 14;
    if (c.type === 'spawn') return Math.sqrt(dx*dx + dy*dy) <= 15;
    if (c.type === 'prego') return Math.sqrt(dx*dx + dy*dy) <= 15;

    return Math.sqrt(dx*dx + dy*dy) <= 15;
};

let draggedComponent: any = null;
let draggedWall: any = null;
let draggedPointKey: 'p0' | 'p1' | 'p2' | 'p3' | 'p4' | null = null;
let isMoving = false;

canvas.addEventListener('mousedown', (e) => {
    if (isPlaying) return;
    const pos = getGridPos(e);
    
    // Verificar primeiro se o utilizador clicou perto de um ponto de controlo de uma parede curva (apenas se não estiver com a ferramenta apagar ativa!)
    if (currentTool !== 'trash') {
        for (let c of components) {
            if (c.p0 && c.p1 && c.p2) {
                const d0 = Math.sqrt((pos.x - c.p0.x)**2 + (pos.y - c.p0.y)**2);
                const d1 = Math.sqrt((pos.x - c.p1.x)**2 + (pos.y - c.p1.y)**2);
                const d2 = Math.sqrt((pos.x - c.p2.x)**2 + (pos.y - c.p2.y)**2);
                if (d0 <= 15) { draggedWall = c; draggedPointKey = 'p0'; isMoving = true; return; }
                if (d1 <= 15) { draggedWall = c; draggedPointKey = 'p1'; isMoving = true; return; }
                if (d2 <= 15) { draggedWall = c; draggedPointKey = 'p2'; isMoving = true; return; }

                if (c.p3 && c.p4) {
                    const d3 = Math.sqrt((pos.x - c.p3.x)**2 + (pos.y - c.p3.y)**2);
                    const d4 = Math.sqrt((pos.x - c.p4.x)**2 + (pos.y - c.p4.y)**2);
                    if (d3 <= 15) { draggedWall = c; draggedPointKey = 'p3'; isMoving = true; return; }
                    if (d4 <= 15) { draggedWall = c; draggedPointKey = 'p4'; isMoving = true; return; }
                }
            }
        }
    }
    
    const index = components.findIndex(c => isPointInComponent(pos.x, pos.y, c));
    if (index !== -1 && currentTool !== 'wall' && currentTool !== 'wall-b') {
        draggedComponent = components[index]; isMoving = false;
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (isPlaying) return;
    const pos = getGridPos(e);
    
    if (draggedWall && draggedPointKey) {
        const snapped = snapToNearest(pos.x, pos.y, draggedWall);
        draggedWall[draggedPointKey] = { x: snapped.x, y: snapped.y };
        // Atualizar o centro virtual para movimentação global segura
        const endPt = draggedWall.p4 || draggedWall.p2;
        draggedWall.x = Math.round((draggedWall.p0.x + endPt.x) / 2);
        draggedWall.y = Math.round((draggedWall.p0.y + endPt.y) / 2);
        isMoving = true;
        ghostPos = snapped;
        drawEditor();
        return;
    }
    
    const snappedPos = snapToNearest(pos.x, pos.y, draggedComponent);
    ghostPos = snappedPos;
    
    if (!draggedComponent) {
        drawEditor();
        return;
    }
    
    if (draggedComponent.x !== snappedPos.x || draggedComponent.y !== snappedPos.y) {
        if (draggedComponent.p0 && draggedComponent.p1 && draggedComponent.p2) {
            const dx = snappedPos.x - draggedComponent.x;
            const dy = snappedPos.y - draggedComponent.y;
            draggedComponent.p0.x += dx; draggedComponent.p0.y += dy;
            draggedComponent.p1.x += dx; draggedComponent.p1.y += dy;
            draggedComponent.p2.x += dx; draggedComponent.p2.y += dy;
            if (draggedComponent.p3 && draggedComponent.p4) {
                draggedComponent.p3.x += dx; draggedComponent.p3.y += dy;
                draggedComponent.p4.x += dx; draggedComponent.p4.y += dy;
            }
        }
        draggedComponent.x = snappedPos.x; draggedComponent.y = snappedPos.y;
        isMoving = true; drawEditor();
    }
});

canvas.addEventListener('mouseup', () => { 
    draggedComponent = null; 
    draggedWall = null; 
    draggedPointKey = null; 
});

canvas.addEventListener('wheel', (e) => {
    if (isPlaying) return;
    const pos = getGridPos(e);
    const index = components.findIndex(c => isPointInComponent(pos.x, pos.y, c));
    if (index !== -1 && components[index].type !== 'wall' && components[index].type !== 'wall-b') {
        e.preventDefault();
        const direction = e.deltaY > 0 ? 1 : -1;
        components[index].angle = (components[index].angle || 0) + (10 * Math.PI / 180) * direction;
        drawEditor();
    }
});

canvas.addEventListener('click', async (e) => {
    if (isPlaying) return;
    if (isMoving) { isMoving = false; return; }
    const pos = getGridPos(e);
    
    // BLOQUEIO TOTAL: Painel de Comando é sagrado
    if (pos.y >= PLAY_ZONE_BOTTOM) {
        showDisplayMessage("ÁREA RESERVADA AOS CONTROLOS 🚫", "#ff00ff", 1000);
        return;
    }

    // 1. Intercetar se o utilizador clicou exatamente no botão 🔗 (Portal) de qualquer buraco protegido colocado
    for (let c of components) {
        if (c.type.startsWith('hole-')) {
            const btnX = c.x + 24;
            const btnY = c.y - 24;
            const dist = Math.sqrt((pos.x - btnX)**2 + (pos.y - btnY)**2);
            if (dist <= 12) {
                // Obter mesas unificadas do servidor (API/Disco) e do localStorage
                let availableTables: string[] = [];
                try {
                    const res = await fetch('/api/tables');
                    if (res.ok) {
                        availableTables = await res.json();
                    }
                } catch (err) {}
                
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key?.startsWith('pinball_table_')) {
                        const name = key.replace('pinball_table_', '');
                        if (!availableTables.includes(name)) {
                            availableTables.push(name);
                        }
                    }
                }
                
                let promptMsg = `🌀 CONFIGURAR WARP PORTAL INTER-MESAS 🌀\n\n`;
                if (availableTables.length === 0) {
                    promptMsg += `⚠️ Não tens outras mesas gravadas neste PC!\nCria e grava outras mesas primeiro no editor.\n\n`;
                } else {
                    promptMsg += `Mesas disponíveis no teu PC:\n`;
                    availableTables.forEach((t, idx) => {
                        promptMsg += `👉 [${idx + 1}] ${t}\n`;
                    });
                    promptMsg += `\n`;
                }
                promptMsg += `Digita o NÚMERO ou o NOME exato da mesa de destino para onde esta bola vai viajar:\n(Deixa em branco ou digita 0 para desativar o portal e fazê-lo trabalhar como buraco normal)`;
                
                const currentPortal = c.portalTable || '';
                const ans = prompt(promptMsg, currentPortal);
                if (ans !== null) {
                    const cleaned = ans.trim();
                    const num = parseInt(cleaned);
                    if (cleaned === '' || cleaned === '0' || num === 0) {
                        c.portalTable = undefined;
                        alert("❌ Portal removido! Este buraco vai agora trabalhar como um buraco normal (apanha a bola e depois ejeta-a).");
                    } else if (!isNaN(num) && num > 0 && num <= availableTables.length) {
                        c.portalTable = availableTables[num - 1];
                        alert(`🔗 PORTAL CONECTADO COM SUCESSO!\nEste buraco irá agora viajar para a mesa "${c.portalTable}"!`);
                    } else if (availableTables.includes(cleaned)) {
                        c.portalTable = cleaned;
                        alert(`🔗 PORTAL CONECTADO COM SUCESSO!\nEste buraco irá agora viajar para a mesa "${c.portalTable}"!`);
                    } else {
                        alert("🛑 Nome ou número inválido. O portal não foi alterado.");
                    }
                }
                drawEditor();
                return;
            }
        }
    }

    if (currentTool === 'trash') {
        const index = components.findIndex(c => isPointInComponent(pos.x, pos.y, c));
        if (index !== -1) components.splice(index, 1);
    } else if (currentTool === 'wall' || currentTool === 'wall-b') {
        const snapped = snapToNearest(pos.x, pos.y);
        if (!wallStart) { wallStart = snapped; } else {
            const clampedEnd = { x: snapped.x, y: Math.min(snapped.y, PLAY_ZONE_BOTTOM - 10) };
            const p0 = { x: wallStart.x, y: wallStart.y };
            const p4 = { x: clampedEnd.x, y: clampedEnd.y };
            const p1 = { x: Math.round(p0.x + 0.25 * (p4.x - p0.x)), y: Math.round(p0.y + 0.25 * (p4.y - p0.y)) };
            const p2 = { x: Math.round(p0.x + 0.50 * (p4.x - p0.x)), y: Math.round(p0.y + 0.50 * (p4.y - p0.y)) };
            const p3 = { x: Math.round(p0.x + 0.75 * (p4.x - p0.x)), y: Math.round(p0.y + 0.75 * (p4.y - p0.y)) };
            
            components.push({ 
                x: p2.x, 
                y: p2.y, 
                type: currentTool, 
                p0: p0,
                p1: p1,
                p2: p2,
                p3: p3,
                p4: p4
            });
            wallStart = null;
        }
    } else {
        const snapped = snapToNearest(pos.x, pos.y);
        const existingIndex = components.findIndex(c => isPointInComponent(snapped.x, snapped.y, c));
        if (existingIndex !== -1) {
            const comp = components[existingIndex];
            if (comp.type === currentTool) {
                comp.angle = (comp.angle + (10 * Math.PI / 180)) % (Math.PI * 2);
            } else {
                comp.type = currentTool; comp.angle = 0;
            }
        } else {
            components.push({ x: snapped.x, y: snapped.y, type: currentTool, angle: 0 });
        }
    }
    drawEditor();
});

const drawBackground = () => {
    if (activeTheme === 'retro') {
        // Fundo de madeira envernizada clara (Bétula/Faia natural) - Super leve e polida como a foto!
        ctx.fillStyle = '#f4d5b7'; 
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        
        // Fundo do Painel (Madeira de faia envernizada média, harmoniosa)
        ctx.fillStyle = '#dbb18a'; 
        ctx.fillRect(0, PLAY_ZONE_BOTTOM, WIDTH, HEIGHT - PLAY_ZONE_BOTTOM);
        
        // Molduras clássicas de madeira de carvalho escuro (Castanho escuro) e latão dourado polido
        ctx.strokeStyle = '#3e2723'; ctx.lineWidth = 8;
        ctx.strokeRect(4, 4, WIDTH - 8, HEIGHT - 8);
        ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 2; // Latão dourado
        ctx.strokeRect(8, 8, WIDTH - 16, HEIGHT - 16);
        
        // Divisória de latão
        ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(0, PLAY_ZONE_BOTTOM); ctx.lineTo(WIDTH, PLAY_ZONE_BOTTOM); ctx.stroke();
    } else {
        ctx.clearRect(0, 0, WIDTH, HEIGHT);
        
        // Moldura Neon Ciano
        ctx.save();
        ctx.strokeStyle = '#00ffff'; ctx.lineWidth = 4; ctx.shadowBlur = 15; ctx.shadowColor = '#00ffff';
        ctx.strokeRect(2, 2, WIDTH - 4, HEIGHT - 4);
        ctx.restore();
        
        // Divisória Neon
        ctx.save();
        ctx.strokeStyle = '#00ffff'; ctx.lineWidth = 2; ctx.shadowBlur = 10; ctx.shadowColor = '#00ffff';
        ctx.beginPath(); ctx.moveTo(0, PLAY_ZONE_BOTTOM); ctx.lineTo(WIDTH, PLAY_ZONE_BOTTOM); ctx.stroke();
        ctx.restore();
        
        // Fundo do Painel Cyber
        ctx.fillStyle = 'rgba(5, 2, 10, 0.95)';
        ctx.fillRect(2, PLAY_ZONE_BOTTOM, WIDTH - 4, HEIGHT - PLAY_ZONE_BOTTOM - 4);
    }
};

const drawEditor = () => {
    drawBackground();
    
    // Visualização dos Botões de Flipper (Mobile/Editor)
    if (activeTheme === 'retro') {
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(139, 90, 43, 0.15)';
        ctx.strokeStyle = 'rgba(139, 90, 43, 0.4)';
    } else {
        ctx.shadowBlur = 15; ctx.shadowColor = '#ff00ff';
        ctx.fillStyle = 'rgba(255, 0, 255, 0.15)';
        ctx.strokeStyle = 'rgba(255, 0, 255, 0.4)';
    }
    ctx.lineWidth = 2;
    // Botão Esq
    ctx.beginPath(); ctx.arc(65, PLAY_ZONE_BOTTOM + 60, 40, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    // Botão Dir
    ctx.beginPath(); ctx.arc(WIDTH - 65, PLAY_ZONE_BOTTOM + 60, 40, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    
    // Espaço para Mensagens (Caixa central)
    if (activeTheme === 'retro') {
        ctx.strokeStyle = 'rgba(62, 39, 35, 0.25)';
    } else {
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
    }
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(WIDTH / 2 - 80, PLAY_ZONE_BOTTOM + 25, 160, 70);
    
    ctx.shadowBlur = 0; ctx.setLineDash([]);
    if (activeTheme === 'retro') {
        ctx.fillStyle = '#3e2723';
    } else {
        ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
    }
    ctx.font = 'bold 10px Orbitron'; ctx.textAlign = 'center';
    ctx.fillText('MENSAGENS DO SISTEMA', WIDTH / 2, PLAY_ZONE_BOTTOM + 20);
    ctx.fillText('BOTÃO ESQ', 65, PLAY_ZONE_BOTTOM + 112);
    ctx.fillText('BOTÃO DIR', WIDTH - 65, PLAY_ZONE_BOTTOM + 112);
    ctx.restore();

    // Limites de Segurança da Bola (Invisíveis no jogo, visíveis no editor)
    const BALL_R = 13;
    ctx.save();
    ctx.setLineDash([6, 5]); ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255, 80, 80, 0.3)';
    ctx.beginPath(); ctx.moveTo(BALL_R, 0); ctx.lineTo(BALL_R, PLAY_ZONE_BOTTOM); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(WIDTH - BALL_R, 0); ctx.lineTo(WIDTH - BALL_R, PLAY_ZONE_BOTTOM); ctx.stroke();
    ctx.restore();

    components.forEach(c => {
        if (c.p0 && (c.p4 || c.p2)) {
            ctx.save();
            if (activeTheme === 'retro') {
                ctx.strokeStyle = c.type === 'wall-b' ? '#1976d2' : '#d32f2f'; // Elásticos vermelhos (ou azul para wall-b) sólidos sem brilho!
                ctx.lineWidth = 6;
                ctx.lineCap = 'round';
                ctx.shadowBlur = 0;
                
                ctx.beginPath();
                const startPt = getBezierPoint(c, 0);
                ctx.moveTo(startPt.x, startPt.y);
                for (let i = 1; i <= 20; i++) {
                    const pt = getBezierPoint(c, i / 20);
                    ctx.lineTo(pt.x, pt.y);
                }
                ctx.stroke();
            } else {
                ctx.strokeStyle = c.type === 'wall-b' ? '#00ffff' : '#ff00ff';
                ctx.lineWidth = 6;
                ctx.lineCap = 'round';
                ctx.shadowBlur = c.type === 'wall-b' ? 15 : 10;
                ctx.shadowColor = ctx.strokeStyle;
                
                // Desenhar Curva Segmentada de Alta Precisão (Compatível com 3 e 5 pontos!)
                ctx.beginPath();
                const startPt = getBezierPoint(c, 0);
                ctx.moveTo(startPt.x, startPt.y);
                for (let i = 1; i <= 20; i++) {
                    const pt = getBezierPoint(c, i / 20);
                    ctx.lineTo(pt.x, pt.y);
                }
                ctx.stroke();
                
                // Linha interna de brilho
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(startPt.x, startPt.y);
                for (let i = 1; i <= 20; i++) {
                    const pt = getBezierPoint(c, i / 20);
                    ctx.lineTo(pt.x, pt.y);
                }
                ctx.stroke();
            }
            
            // PONTOS DE CONTROLO (Apenas no Editor)
            if (!isPlaying) {
                ctx.shadowBlur = 8;
                // Pontos Extremos (Início e Fim) - Ciano
                ctx.fillStyle = '#00ffff'; ctx.shadowColor = '#00ffff';
                ctx.beginPath(); ctx.arc(c.p0.x, c.p0.y, 5, 0, Math.PI * 2); ctx.fill();
                const endPt = c.p4 || c.p2;
                ctx.beginPath(); ctx.arc(endPt.x, endPt.y, 5, 0, Math.PI * 2); ctx.fill();
                
                // Pontos de Controlo Intermédios - Magenta
                ctx.fillStyle = '#ff00ff'; ctx.shadowColor = '#ff00ff';
                ctx.beginPath(); ctx.arc(c.p1.x, c.p1.y, 6, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(c.p2.x, c.p2.y, 6, 0, Math.PI * 2); ctx.fill();
                if (c.p3) {
                    ctx.beginPath(); ctx.arc(c.p3.x, c.p3.y, 6, 0, Math.PI * 2); ctx.fill();
                }
                
                // Linha pontilhada de ligação de controlos
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
                ctx.lineWidth = 1;
                ctx.setLineDash([3, 3]);
                ctx.beginPath();
                ctx.moveTo(c.p0.x, c.p0.y);
                ctx.lineTo(c.p1.x, c.p1.y);
                ctx.lineTo(c.p2.x, c.p2.y);
                if (c.p3 && c.p4) {
                    ctx.lineTo(c.p3.x, c.p3.y);
                    ctx.lineTo(c.p4.x, c.p4.y);
                }
                ctx.stroke();
            }
            ctx.restore();
        } else {
            ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.angle || 0);
            drawComponent(c, false);
            ctx.restore();
            
            // Desenhar botão interativo de Portal 🔗 ao lado do buraco (apenas no editor)
            if (!isPlaying && c.type.startsWith('hole-')) {
                ctx.save();
                const btnX = c.x + 24;
                const btnY = c.y - 24;
                
                ctx.fillStyle = c.portalTable ? '#00e5ff' : '#222';
                ctx.strokeStyle = c.portalTable ? '#fff' : '#666';
                ctx.lineWidth = 1.5;
                ctx.shadowBlur = c.portalTable ? 8 : 0;
                ctx.shadowColor = '#00e5ff';
                
                ctx.beginPath();
                ctx.arc(btnX, btnY, 10, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 9px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.shadowBlur = 0;
                ctx.fillText("🔗", btnX, btnY + 0.5);
                ctx.restore();
            }
        }
    });
    
    if (wallStart) {
        ctx.save();
        ctx.fillStyle = '#00e5ff'; ctx.beginPath(); ctx.arc(wallStart.x, wallStart.y, 4, 0, Math.PI*2); ctx.fill();
        if (ghostPos) {
            ctx.strokeStyle = currentTool === 'wall-b' ? 'rgba(0, 255, 255, 0.5)' : 'rgba(255, 0, 255, 0.5)';
            ctx.lineWidth = 4;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(wallStart.x, wallStart.y);
            ctx.lineTo(ghostPos.x, ghostPos.y);
            ctx.stroke();
        }
        ctx.restore();
    }
    
    // Desenhar Ghost Preview (Sombra Magnética)
    if (!isPlaying && ghostPos) {
        ctx.save();
        ctx.globalAlpha = 0.4;
        ctx.translate(ghostPos.x, ghostPos.y);
        drawComponent({ type: currentTool, x: 0, y: 0, w: 100, h: 20 }, false, { isGhost: true });
        ctx.restore();

        // Desenhar mira de interseção
        ctx.save();
        ctx.strokeStyle = '#00ffff'; ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(ghostPos.x - 10, ghostPos.y); ctx.lineTo(ghostPos.x + 10, ghostPos.y);
        ctx.moveTo(ghostPos.x, ghostPos.y - 10); ctx.lineTo(ghostPos.x, ghostPos.y + 10);
        ctx.stroke();
        ctx.restore();
    }
};

const drawComponent = (c: any, isPlaying: boolean, extraData: any = {}) => {
    if (c.type === 'pin') {
        if (activeTheme === 'retro') {
            // Prego clássico de bronze/latão dourado com aro escuro
            ctx.fillStyle = '#d4af37'; 
            ctx.strokeStyle = '#3e2723'; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        } else {
            ctx.fillStyle = '#fff'; 
            ctx.strokeStyle = '#00ffff'; ctx.lineWidth = 2;
            ctx.shadowBlur = 8; ctx.shadowColor = '#00ffff';
            ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        }
    } else if (c.type === 'prego') {
        const isActive = isPlaying ? (pregoActiveTimer > Date.now()) : true;
        if (isActive) {
            ctx.save();
            const pulse = 1 + 0.15 * Math.sin(Date.now() * 0.008);
            ctx.strokeStyle = activeTheme === 'retro' ? '#d4af37' : '#ffa500';
            ctx.lineWidth = 2;
            ctx.shadowBlur = activeTheme === 'retro' ? 0 : 15;
            ctx.shadowColor = '#ffa500';
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.arc(0, 0, 15 * pulse, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            
            ctx.fillStyle = activeTheme === 'retro' ? '#ffca28' : '#ffeb3b';
            ctx.beginPath();
            ctx.arc(0, 0, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(-2, -2, 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        } else if (!isPlaying) {
            ctx.save();
            ctx.strokeStyle = activeTheme === 'retro' ? 'rgba(212, 175, 55, 0.4)' : 'rgba(255, 165, 0, 0.4)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.arc(0, 0, 15, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.fillStyle = activeTheme === 'retro' ? 'rgba(255, 202, 40, 0.3)' : 'rgba(255, 235, 59, 0.3)';
            ctx.beginPath();
            ctx.arc(0, 0, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    } else if (c.type.startsWith('bumper')) {
        const isLarge = c.type === 'bumper-l' || c.type === 'bumper-t-l';
        const isTri = c.type.startsWith('bumper-t');
        const radius = c.type === 'bumper-s' ? 20 : (c.type === 'bumper-l' ? 35 : (isLarge ? 50 : 30));
        
        if (activeTheme === 'retro') {
            // Tampa de bumper retro clássico (Williams/Gottlieb) - Brilha em amarelo/laranja incandescente quando batida!
            ctx.fillStyle = extraData.hit ? '#ffe082' : '#ffffff'; 
            ctx.strokeStyle = '#3e2723'; ctx.lineWidth = 2.5;
            if (extraData.hit) {
                ctx.shadowBlur = 18;
                ctx.shadowColor = '#ffb300'; // Brilho de lâmpada vintage
            }
            ctx.beginPath();
            if (isTri) {
                const w = isLarge ? 43.3 : 26; const h = isLarge ? 25 : 15;
                ctx.moveTo(0, -radius); ctx.lineTo(w, h); ctx.lineTo(-w, h); ctx.closePath();
            } else {
                ctx.arc(0, 0, radius, 0, Math.PI*2);
            }
            ctx.fill(); ctx.stroke();
            ctx.shadowBlur = 0; // repor para o resto do bumper
            
            // Anel dourado/metalizado interior de impacto
            ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 2;
            ctx.beginPath();
            if (isTri) {
                const w = isLarge ? 30 : 18; const h = isLarge ? 17 : 10;
                ctx.moveTo(0, -radius * 0.7); ctx.lineTo(w, h); ctx.lineTo(-w, h); ctx.closePath();
            } else {
                ctx.arc(0, 0, radius * 0.7, 0, Math.PI*2);
            }
            ctx.stroke();
            
            // Estrela central vermelha retro de alta definição
            ctx.fillStyle = extraData.hit ? '#ff3d00' : '#b71c1c';
            ctx.beginPath();
            const pointsCount = 5;
            for (let i = 0; i < pointsCount; i++) {
                const angle = (i * 2 * Math.PI) / pointsCount - Math.PI / 2;
                const rOuter = radius * 0.38;
                const rInner = radius * 0.16;
                ctx.lineTo(Math.cos(angle) * rOuter, Math.sin(angle) * rOuter);
                const nextAngle = angle + Math.PI / pointsCount;
                ctx.lineTo(Math.cos(nextAngle) * rInner, Math.sin(nextAngle) * rInner);
            }
            ctx.closePath(); ctx.fill();
        } else {
            // No tema néon: o bumper só emite luz própria (shadowBlur e tom branco) quando é batido!
            ctx.fillStyle = extraData.hit ? '#ffffff' : 'rgba(0, 255, 255, 0.35)';
            ctx.strokeStyle = '#00ffff'; ctx.lineWidth = 2.5;
            if (extraData.hit) {
                ctx.shadowBlur = 25; ctx.shadowColor = '#00ffff';
            } else {
                ctx.shadowBlur = 0;
            }
            
            if (isTri) {
                const w = isLarge ? 43.3 : 26; const h = isLarge ? 25 : 15;
                ctx.beginPath(); ctx.moveTo(0, -radius); ctx.lineTo(w, h); ctx.lineTo(-w, h); ctx.closePath(); ctx.fill(); ctx.stroke();
            } else {
                ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI*2); ctx.fill(); ctx.stroke();
            }
            ctx.fillStyle = extraData.hit ? '#fff' : 'rgba(0, 255, 255, 0.15)'; 
            ctx.shadowBlur = 0; 
            ctx.beginPath(); ctx.arc(0, 0, radius * 0.4, 0, Math.PI*2); ctx.fill();
        }
    } else if (c.type.startsWith('flipper')) {
        const isSmall = c.type.includes('-s-');
        const length = isSmall ? 75 : 100;
        const isRight = c.type.endsWith('-r') || (c.type === 'flipper' && Math.cos(c.angle || 0) < 0);
        
        if (activeTheme === 'retro') {
            // Corpo do flipper clássico em plástico amarelo brilhante
            ctx.fillStyle = '#ffca28'; ctx.strokeStyle = '#d32f2f'; ctx.lineWidth = 4.5; // Borracha vermelha retro espessa!
        } else {
            ctx.fillStyle = extraData.hit ? '#fff' : '#ff00ff'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
            ctx.shadowBlur = 15; ctx.shadowColor = '#ff00ff';
        }
        
        const r1 = 14; // Raio na base
        const r2 = 7;  // Raio na ponta
        
        ctx.beginPath();
        if (!isRight) {
            // Flipper Esquerdo (estende para a direita)
            ctx.arc(0, 0, r1, Math.PI/2, -Math.PI/2);
            ctx.lineTo(length - r2, -r2);
            ctx.arc(length - r2, 0, r2, -Math.PI/2, Math.PI/2);
            ctx.lineTo(0, r1);
        } else {
            // Flipper Direito (estende para a esquerda)
            ctx.arc(0, 0, r1, -Math.PI/2, Math.PI/2);
            ctx.lineTo(-(length - r2), r2);
            ctx.arc(-(length - r2), 0, r2, Math.PI/2, -Math.PI/2);
            ctx.lineTo(0, -r1);
        }
        ctx.closePath(); ctx.fill(); ctx.stroke();
        
        if (activeTheme === 'retro') {
            // Adicionar tampa metálica clássica central sobre o eixo de rotação
            ctx.fillStyle = '#cfd8dc'; ctx.strokeStyle = '#37474f'; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        }
    } else if (c.type === 'wall' || c.type === 'wall-b') {
        if (activeTheme === 'retro') {
            // Calha de madeira de carvalho escuro com friso metálico dourado
            ctx.fillStyle = '#3e2723'; 
            ctx.beginPath(); ctx.roundRect(-(c.w/2), -3, c.w, 6, 2); ctx.fill();
            ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 1.5; ctx.stroke();
        } else {
            ctx.fillStyle = c.type === 'wall-b' ? '#00ffff' : '#110520';
            ctx.shadowBlur = c.type === 'wall-b' ? 15 : 10; ctx.shadowColor = c.type === 'wall-b' ? '#00ffff' : '#ff00ff';
            ctx.beginPath(); ctx.roundRect(-(c.w/2), -3, c.w, 6, 2); ctx.fill();
            ctx.strokeStyle = c.type === 'wall-b' ? '#fff' : '#ff00ff'; ctx.lineWidth = 2; ctx.stroke();
        }
    } else if (c.type === 'target' || c.type === 'target-p') {
        const isPerm = c.type === 'target-p';
        if (activeTheme === 'retro') {
            // Alvo mecânico clássico (Drop target retangular branco/amarelo com bullseye de círculos concêntricos vermelhos!)
            ctx.fillStyle = isPerm ? '#ffca28' : '#ffffff'; 
            ctx.strokeStyle = '#3e2723'; ctx.lineWidth = 2.5;
            ctx.beginPath(); ctx.roundRect(-15, -15, 30, 30, 4); ctx.fill(); ctx.stroke();
            
            // Desenhar os Círculos Concêntricos de Tiro ao Alvo (Bullseye Vermelho Retro)
            ctx.strokeStyle = '#b71c1c'; ctx.lineWidth = 2.5;
            ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI*2); ctx.stroke();
            
            ctx.fillStyle = '#b71c1c';
            ctx.beginPath(); ctx.arc(0, 0, 4.5, 0, Math.PI*2); ctx.fill();
        } else {
            ctx.fillStyle = isPerm ? '#ffeb3b' : '#ff00ff'; ctx.strokeStyle = isPerm ? '#e91e63' : '#00ffff'; ctx.lineWidth = 2;
            ctx.shadowBlur = 15; ctx.shadowColor = ctx.fillStyle;
            ctx.beginPath(); ctx.roundRect(-15, -15, 30, 30, 6); ctx.fill(); ctx.stroke();
        }
        if (isPlaying && extraData.label !== undefined) {
            ctx.fillStyle = activeTheme === 'retro' ? '#ffffff' : (isPerm ? '#110520' : '#fff'); ctx.font = 'bold 16px Orbitron'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.shadowBlur = 0; ctx.fillText(extraData.label.toString(), 0, 0);
        }
    } else if (c.type === 'spinner') {
        // Placa rotativa 2D (Mesmo tamanho 60x16 da roleta, rodando sobre si mesma)
        if (activeTheme === 'retro') {
            ctx.fillStyle = '#cfd8dc'; ctx.strokeStyle = '#37474f'; ctx.lineWidth = 2.5; // Placa de aço sólida
        } else {
            ctx.fillStyle = extraData.color || '#ffeb3b'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
            ctx.shadowBlur = 15; ctx.shadowColor = ctx.fillStyle;
        }
        ctx.beginPath(); ctx.roundRect(-30, -8, 60, 16, 3); ctx.fill(); ctx.stroke();
        
        // Ponto central de pivot (Eixo único de rotação no meio)
        ctx.fillStyle = '#fff'; ctx.shadowBlur = 0;
        ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#222'; ctx.lineWidth = 1; ctx.stroke();
    } else if (c.type === 'roleta') {
        // Dois suportes nas pontas (Círculos) - Alargados para 34px de cada lado
        ctx.fillStyle = '#888';
        ctx.beginPath(); ctx.arc(-34, 0, 4, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(34, 0, 4, 0, Math.PI*2); ctx.fill();
        
        // Eixo de rotação
        ctx.strokeStyle = '#444'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-34, 0); ctx.lineTo(34, 0); ctx.stroke();
        
        // Placa rotativa 3D vertical (Largura aumentada de 44 para 60px)
        const simAngle = extraData.simAngle || 0;
        const scaleY = Math.cos(simAngle);
        
        ctx.save();
        ctx.scale(1, scaleY);
        if (activeTheme === 'retro') {
            ctx.fillStyle = '#cfd8dc'; ctx.strokeStyle = '#37474f'; ctx.lineWidth = 2.5; // Chapa de metal
        } else {
            ctx.fillStyle = extraData.color || '#00ff00'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
            ctx.shadowBlur = 15; ctx.shadowColor = ctx.fillStyle;
        }
        ctx.beginPath(); ctx.roundRect(-30, -8, 60, 16, 3); ctx.fill(); ctx.stroke();
        ctx.restore();
    } else if (c.type.startsWith('light-g3-') || c.type.startsWith('light-g4-')) {
        let offsets: {x: number, y: number}[] = [];
        if (c.type === 'light-g3-line') {
            offsets = [{x: -24, y: 0}, {x: 0, y: 0}, {x: 24, y: 0}];
        } else if (c.type === 'light-g3-tri') {
            offsets = [{x: -16, y: 10}, {x: 16, y: 10}, {x: 0, y: -14}];
        } else if (c.type === 'light-g4-line') {
            offsets = [{x: -36, y: 0}, {x: -12, y: 0}, {x: 12, y: 0}, {x: 36, y: 0}];
        } else if (c.type === 'light-g4-square') {
            offsets = [{x: -14, y: -14}, {x: 14, y: -14}, {x: -14, y: 14}, {x: 14, y: 14}];
        }
 
        const colorsIdx = isPlaying && extraData.colors ? extraData.colors : [0, 1, 2, 3];
        const isSpinning = isPlaying && extraData.isSpinning;
 
        offsets.forEach((offset, idx) => {
            const colIdx = colorsIdx[idx % colorsIdx.length];
            const color = NEON_COLORS[colIdx];
            
            ctx.save();
            ctx.translate(offset.x, offset.y);
            
            const isOn = isPlaying ? !isSpinning : true;
            
            if (activeTheme === 'retro') {
                const isRedGroup = colIdx === 0;
                const isBlueGroup = colIdx === 1;
                const isGreenGroup = colIdx === 2;
                
                if (isOn) {
                    ctx.fillStyle = isRedGroup ? '#ff1744' : (isBlueGroup ? '#29b6f6' : (isGreenGroup ? '#66bb6a' : '#ffca28'));
                    ctx.strokeStyle = isRedGroup ? '#b71c1c' : (isBlueGroup ? '#0288d1' : (isGreenGroup ? '#2e7d32' : '#f57f17'));
                    ctx.lineWidth = 2;
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = ctx.fillStyle;
                } else {
                    ctx.fillStyle = isRedGroup ? '#ff8a80' : (isBlueGroup ? '#b3e5fc' : (isGreenGroup ? '#c8e6c9' : '#fff9c4'));
                    ctx.strokeStyle = isRedGroup ? '#b71c1c' : (isBlueGroup ? '#0288d1' : (isGreenGroup ? '#2e7d32' : '#f57f17'));
                    ctx.lineWidth = 1.5;
                    ctx.shadowBlur = 0;
                }
                ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI*2); ctx.fill(); ctx.stroke();
                ctx.fillStyle = isOn ? '#fff' : 'rgba(255,255,255,0.4)';
                ctx.shadowBlur = 0;
                ctx.beginPath(); ctx.arc(0, 0, 2.5, 0, Math.PI*2); ctx.fill();
            } else {
                ctx.fillStyle = isOn ? color + 'e6' : color + '44';
                ctx.strokeStyle = isOn ? '#fff' : color;
                ctx.lineWidth = 2;
                ctx.shadowBlur = isOn ? 15 : 0;
                ctx.shadowColor = color;
                ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI*2); ctx.fill(); ctx.stroke();
                ctx.fillStyle = isOn ? '#fff' : color + '33';
                ctx.shadowBlur = 0;
                ctx.beginPath(); ctx.arc(0, 0, 2.5, 0, Math.PI*2); ctx.fill();
            }
            ctx.restore();
        });
    } else if (c.type.startsWith('light')) {
        const isOn = isPlaying ? extraData.active : false;
        
        if (activeTheme === 'retro') {
            const isRed = c.type === 'light-r';
            const isBlue = c.type === 'light-b';
            const isYellow = c.type === 'light-y';
            
            if (isOn) {
                ctx.fillStyle = isRed ? '#ff1744' : (isBlue ? '#29b6f6' : (isYellow ? '#ffca28' : '#66bb6a'));
                ctx.strokeStyle = isRed ? '#b71c1c' : (isBlue ? '#0288d1' : (isYellow ? '#f57f17' : '#2e7d32'));
                ctx.lineWidth = 2.5;
                ctx.shadowBlur = 12;
                ctx.shadowColor = ctx.fillStyle;
            } else {
                ctx.fillStyle = isRed ? '#ff8a80' : (isBlue ? '#b3e5fc' : (isYellow ? '#fff9c4' : '#c8e6c9'));
                ctx.strokeStyle = isRed ? '#b71c1c' : (isBlue ? '#0288d1' : (isYellow ? '#f57f17' : '#2e7d32'));
                ctx.lineWidth = 2;
                ctx.shadowBlur = 0;
            }
            ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI*2); ctx.fill(); ctx.stroke();
            
            // Filamento interno da lâmpada
            ctx.fillStyle = isOn ? '#fff' : 'rgba(255,255,255,0.4)'; ctx.shadowBlur = 0;
            ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI*2); ctx.fill();
        } else {
            const isGreen = c.type === 'light' || c.type === 'light-g';
            const color = c.type === 'light-r' ? '#ff0055' : (c.type === 'light-b' ? '#00ffff' : (c.type === 'light-y' ? '#ffeb3b' : '#00ff00'));
            const dimColor = c.type === 'light-r' ? 'rgba(255, 0, 85, 0.2)' : (c.type === 'light-b' ? 'rgba(0, 255, 255, 0.2)' : (c.type === 'light-y' ? 'rgba(255, 235, 59, 0.2)' : 'rgba(0, 50, 0, 0.4)'));
            const onColor = c.type === 'light-r' ? 'rgba(255, 0, 85, 0.9)' : (c.type === 'light-b' ? 'rgba(0, 255, 255, 0.9)' : (c.type === 'light-y' ? 'rgba(255, 235, 59, 0.9)' : 'rgba(0, 255, 0, 0.9)'));
            const strokeColor = c.type === 'light-r' ? '#ff0055' : (c.type === 'light-b' ? '#00ffff' : (c.type === 'light-y' ? '#ffeb3b' : '#00a000'));
            
            ctx.fillStyle = isOn ? onColor : dimColor;
            ctx.strokeStyle = isOn ? '#fff' : strokeColor;
            ctx.lineWidth = 2;
            ctx.shadowBlur = isOn ? 20 : 0;
            ctx.shadowColor = color;
            ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI*2); ctx.fill(); ctx.stroke();
            
            ctx.fillStyle = isOn ? '#fff' : (isGreen ? 'rgba(0, 255, 0, 0.2)' : color + '33');
            ctx.shadowBlur = 0;
            ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI*2); ctx.fill();
        }
    } else if (c.type === 'spawn') {
        ctx.fillStyle = activeTheme === 'retro' ? '#8bc34a' : '#4caf50'; ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = "bold 14px Arial"; ctx.textAlign = 'center'; ctx.fillText("S", 0, 5);
    } else if (c.type === 'plunger') {
        if (activeTheme === 'retro') {
            ctx.fillStyle = '#8b5a2b'; ctx.fillRect(-15, -10, 30, 20); // Gatilho de madeira
            ctx.strokeStyle = '#757575'; ctx.strokeRect(-15, -30, 30, 40);
        } else {
            ctx.fillStyle = '#ff00ff'; ctx.fillRect(-15, -10, 30, 20);
            ctx.strokeStyle = '#fff'; ctx.strokeRect(-15, -30, 30, 40);
        }
    } else if (c.type === 'hole') {
        if (activeTheme === 'retro') {
            ctx.fillStyle = '#1c0d02'; ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = '#3e2723'; ctx.lineWidth = 3; ctx.stroke();
        } else {
            ctx.fillStyle = '#110520'; ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = extraData.active ? '#00ff00' : '#ff00ff'; ctx.lineWidth = 3; ctx.stroke();
        }
    } else if (c.type.startsWith('hole-')) {
        const isGateOpen = isPlaying ? extraData.active : false;
        
        if (activeTheme === 'retro') {
            // Pintar o fundo dentro da caixa com a cor correspondente em mate (sem neon/brilhos)
            const mateColor = c.type === 'hole-g' ? '#388e3c' : (c.type === 'hole-r' ? '#d32f2f' : (c.type === 'hole-b' ? '#1976d2' : '#fbc02d'));
            ctx.fillStyle = mateColor;
            ctx.beginPath();
            ctx.roundRect(-24, -24, 48, 48, 4);
            ctx.fill();

            // Desenhar caixa U protetora em madeira sólida clássica (Nogueira escura)
            ctx.strokeStyle = '#3e2723';
            ctx.lineWidth = 5;
            ctx.shadowBlur = 0;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(-26, 26);
            ctx.lineTo(-26, -26);
            ctx.lineTo(26, -26);
            ctx.lineTo(26, 26);
            ctx.stroke();
            
            // Porta/Portão de ripa de madeira fechado ou aberto
            if (!isGateOpen) {
                ctx.strokeStyle = '#8b5a2b'; // Ripa de madeira de carvalho fecha o portão
                ctx.lineWidth = 6;
                ctx.beginPath();
                ctx.moveTo(-26, 26);
                ctx.lineTo(26, 26);
                ctx.stroke();
            }
            
            // Buraco interior centrado em (0, 0) - Fica a preto puro!
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(0, 0, 14, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#3e2723';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 14, 0, Math.PI * 2);
            ctx.stroke();
        } else {
            const color = c.type === 'hole-g' ? '#00ff00' : (c.type === 'hole-r' ? '#ff0055' : (c.type === 'hole-b' ? '#00ffff' : '#ffeb3b'));
            
            // Desenhar a caixa U protetora - Quadrado Perfeito Simétrico (52x52 de lado a lado)
            ctx.strokeStyle = color;
            ctx.lineWidth = 4;
            ctx.shadowBlur = 10;
            ctx.shadowColor = color;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(-26, 26);
            ctx.lineTo(-26, -26);
            ctx.lineTo(26, -26);
            ctx.lineTo(26, 26);
            ctx.stroke();
            
            // Desenhar o portão/porta
            if (!isGateOpen) {
                // Desenhar laser de segurança fechado (linha brilhante espessa)
                ctx.strokeStyle = color;
                ctx.lineWidth = 6;
                ctx.shadowBlur = 15;
                ctx.beginPath();
                ctx.moveTo(-26, 26);
                ctx.lineTo(26, 26);
                ctx.stroke();
                
                // Padrão de laser interno
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(-26, 26);
                ctx.lineTo(26, 26);
                ctx.stroke();
            } else {
                // Desenhar laser aberto ou desativado (linha pontilhada muito ténue)
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.lineWidth = 2;
                ctx.setLineDash([4, 4]);
                ctx.beginPath();
                ctx.moveTo(-26, 26);
                ctx.lineTo(26, 26);
                ctx.stroke();
                ctx.setLineDash([]);
            }
            
            // Desenhar o buraco interior centrado em (0, 0)
            ctx.fillStyle = '#110520';
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.arc(0, 0, 14, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 14, 0, Math.PI * 2);
            ctx.stroke();
            
            // Desenhar centro brilhante do buraco centrado em (0, 0)
            ctx.fillStyle = isGateOpen ? color : 'rgba(255,255,255,0.1)';
            ctx.beginPath();
            ctx.arc(0, 0, 4, 0, Math.PI * 2);
            ctx.fill();
        }
 
        // Desenhar indicador visual se o buraco for um portal de mesa associado
        if (c.portalTable) {
            ctx.save();
            ctx.strokeStyle = activeTheme === 'retro' ? '#d4af37' : '#00ffff'; ctx.lineWidth = 1.5; ctx.setLineDash([2, 2]);
            ctx.shadowBlur = activeTheme === 'retro' ? 0 : 8; ctx.shadowColor = '#00ffff';
            ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.stroke();
            ctx.setLineDash([]); ctx.shadowBlur = 0;
            
            ctx.fillStyle = activeTheme === 'retro' ? '#3e2723' : '#00ffff'; ctx.font = 'bold 9px Orbitron'; ctx.textAlign = 'center';
            ctx.fillText("PORTAL", 0, -16);
            ctx.restore();
        }
    }
};

const getHighscores = () => {
    const modalSelect = document.getElementById('modal-table-select') as HTMLSelectElement;
    const tableName = (modalSelect && modalSelect.value) || (document.getElementById('table-name-input') as HTMLInputElement)?.value || 'Mesa Sem Nome';
    const stored = localStorage.getItem(`highscores_${tableName}`);
    return stored ? JSON.parse(stored) : [];
};

canvas.addEventListener('mousemove', (e) => {
    if (isPlaying) return;
    ghostPos = getGridPos(e);
    drawEditor();
});

const showHighscoreModal = async (title: string) => {
    const modal = document.getElementById('highscore-modal');
    if (!modal) return;
    
    // Actualizar lista de mesas do servidor e localStorage antes de mostrar
    await loadTableList();
    
    document.getElementById('modal-title')!.innerText = title;
    
    const scores = getHighscores();
    const list = document.getElementById('highscores-list')!;
    if (scores.length === 0) {
        list.innerHTML = '<div class="empty-msg" style="color: #888; text-align: center; margin: 15px 0;">Sem recordes nesta mesa.</div>';
    } else {
        list.innerHTML = scores.map((s: any, i: number) => `
            <div class="score-row"><span>${i + 1}. ${s.name}</span><span>${formatScore(s.score)} pts</span></div>
        `).join('');
    }
    
    // Validar se há mesas para jogar
    const tableSelect = document.getElementById('modal-table-select') as HTMLSelectElement;
    const playBtn = document.getElementById('modal-btn-play') as HTMLButtonElement;
    
    // Se não houver mesas ou a opção selecionada for vazia
    if (!tableSelect || tableSelect.options.length === 0 || tableSelect.value === "" || tableSelect.options[0].text.includes("Sem mesas")) {
        playBtn.disabled = true;
        playBtn.style.opacity = "0.5";
        playBtn.style.cursor = "not-allowed";
        playBtn.innerText = "JOGAR 🚀";
    } else {
        playBtn.disabled = false;
        playBtn.style.opacity = "1";
        playBtn.style.cursor = "pointer";
        playBtn.innerText = "JOGAR 🚀";
    }

    // Garantir que os botões de ação estão visíveis por defeito
    document.querySelector('.modal-actions')?.classList.remove('hidden');

    modal.classList.remove('hidden');
};

const checkAndSaveHighscore = (name: string, score: number) => {
    const tableName = (document.getElementById('modal-table-select') as HTMLSelectElement)?.value || 'Mesa Sem Nome';
    const scores = getHighscoresForTable(tableName);
    scores.push({ name: name.toUpperCase(), score: score, date: new Date().toISOString() });
    scores.sort((a: any, b: any) => b.score - a.score);
    const topScores = scores.slice(0, 10);
    localStorage.setItem(`highscores_${tableName}`, JSON.stringify(topScores));
    return topScores;
};

const getHighscoresForTable = (tableName: string) => {
    const stored = localStorage.getItem(`highscores_${tableName}`);
    return stored ? JSON.parse(stored) : [];
};

const createBall = () => {
    if (!world || marbleBody) return;
    const spawnObj = components.find(c => c.type === 'spawn');
    const sX = spawnObj ? spawnObj.x : WIDTH - 30;
    const sY = spawnObj ? spawnObj.y : PLAY_ZONE_BOTTOM - 60;

    isLaunched = false;
    marbleBody = world.createBody({ 
        position: Vec2(pxToM(sX), pxToM(sY)), 
        type: 'static', 
        bullet: true 
    });
    marbleBody.createFixture(planck.Circle(pxToM(13)), { density: 1.5, restitution: 0.5, friction: 0.02 });
    marbleBody.setUserData({ type: 'ball' });
    document.getElementById('launch-hint')?.classList.remove('hidden');
};

const launchBall = () => {
    if (!marbleBody || isLaunched) return;
    sounds.playLaunch();
    isLaunched = true;
    marbleBody.setDynamic();
    // Um pequeno impulso inicial para a bola não ficar colada no spawn
    marbleBody.applyLinearImpulse(Vec2(0, -5), marbleBody.getWorldCenter());
    document.getElementById('launch-hint')?.classList.add('hidden');
    showDisplayMessage(`BOLA EM JOGO!`, '#00ff00', 1000);
};

const runGameSimulation = (isWarping = false) => {
    if (animationId) cancelAnimationFrame(animationId);
    if (matrixInterval) {
        clearInterval(matrixInterval);
        matrixInterval = null;
    }
    isPlaying = true;
    keysPressed.clear(); // Limpar teclas fantasmas
    switchTab('game');
    if (!isWarping) {
        score = 0; ballsLeft = 3; extraBallThreshold = 250000;
        extraBallsAwardedCount = 0;
        hasWarpedInThisRun = false;
        hasCompletedHolesMissionInThisRun = false;
        hasSuperJackpotInThisRun = false;
        warpActive = false;
        pregoActiveTimer = 0;
        
        // RESET TOTAL DA MÁQUINA (Luzes, Portas e Níveis voltam ao estado inicial a 0)
        components.forEach(c => {
            if (c.active !== undefined) c.active = false;
            if (c.gateOpen !== undefined) c.gateOpen = false;
            if (c.hadBall !== undefined) c.hadBall = false;
            if (c.trapped !== undefined) c.trapped = false;
            if (c.level !== undefined) c.level = 0;
        });
    }
    updateScore(0); updateBallsDisplay();
    
    document.getElementById('grid-overlay')?.classList.add('hidden');
    document.getElementById('score-display')?.classList.remove('hidden');
    document.getElementById('mobile-flipper-buttons')?.classList.remove('hidden');
    document.getElementById('launch-hint')?.classList.remove('hidden');
    
    // Gestão de botões
    document.getElementById('btn-play')?.classList.add('hidden');
    document.getElementById('btn-edit')?.classList.remove('hidden');
    document.getElementById('btn-clear')?.classList.remove('hidden');

    // Inicializar Planck World (Gravidade aumentada para 25 para sentir o peso)
    world = planck.World(Vec2(0, 25 * gravityVal));
    flipperJoints = []; marbleBody = null; plungerBody = null;

    // Paredes Invisíveis do Sistema
    // Paredes Invisíveis do Sistema (Usando Box para evitar saltinhos nas quinas)
    const ground = world.createBody();
    // Esquerda
    ground.createFixture(planck.Box(pxToM(10), pxToM(HEIGHT), Vec2(pxToM(-10), pxToM(HEIGHT/2))), { friction: 0.02, restitution: 0.5 });
    // Direita
    ground.createFixture(planck.Box(pxToM(10), pxToM(HEIGHT), Vec2(pxToM(WIDTH + 10), pxToM(HEIGHT/2))), { friction: 0.02, restitution: 0.5 });
    // Topo
    ground.createFixture(planck.Box(pxToM(WIDTH), pxToM(10), Vec2(pxToM(WIDTH/2), pxToM(-10))), { friction: 0.02, restitution: 0.5 });
    
    // Sensor de Dreno (Linha de Morte)
    const drain = world.createBody();
    drain.createFixture(planck.Edge(Vec2(pxToM(0), pxToM(PLAY_ZONE_BOTTOM)), Vec2(pxToM(WIDTH), pxToM(PLAY_ZONE_BOTTOM))), { isSensor: true });
    drain.setUserData({ type: 'drain' });

    let targets: any[] = [];
    let targetLevel = 1;

    components.forEach(c => {
        const pos = Vec2(pxToM(c.x), pxToM(c.y));
        const angle = c.angle || 0;

        if (c.type.startsWith('bumper')) {
            const isLarge = c.type.endsWith('-l');
            const isTri = c.type.includes('-t');
            const radius = c.type === 'bumper-s' ? 20 : (c.type === 'bumper-l' ? 35 : (isLarge ? 50 : 30));
            const b = world.createBody(pos);
            b.setAngle(angle);
            let shape;
            if (isTri) {
                const w = pxToM(isLarge ? 43.3 : 26); const h = pxToM(isLarge ? 25 : 15); const r = pxToM(radius);
                shape = planck.Polygon([Vec2(0, -r), Vec2(w, h), Vec2(-w, h)]);
            } else {
                shape = planck.Circle(pxToM(radius));
            }
            b.createFixture(shape, { restitution: 0.5 });
            b.setUserData({ type: 'bumper', original: c, hitTimer: 0, speed: isLarge ? 35 : 25 });
        } else if (c.type.startsWith('flipper')) {
            createPlanckFlipper(c);
        } else if (c.type === 'wall' || c.type === 'wall-b') {
            if (c.p0 && (c.p4 || c.p2)) {
                const segments = 12; // Aumentado para 12 segmentos para curvas ainda mais suaves fisicamente!
                for (let i = 0; i < segments; i++) {
                    const ptA = getBezierPoint(c, i / segments);
                    const ptB = getBezierPoint(c, (i + 1) / segments);
                    const midX = (ptA.x + ptB.x) / 2;
                    const midY = (ptA.y + ptB.y) / 2;
                    const dx = ptB.x - ptA.x;
                    const dy = ptB.y - ptA.y;
                    const len = Math.sqrt(dx*dx + dy*dy);
                    const ang = Math.atan2(dy, dx);
                    
                    const segmentBody = world.createBody({ position: Vec2(pxToM(midX), pxToM(midY)), angle: ang });
                    segmentBody.createFixture(planck.Box(pxToM(len / 2), pxToM(3)), { 
                        restitution: c.type === 'wall-b' ? 0.6 : 0.5, 
                        friction: 0.02,
                        filterGroupIndex: -1
                    });
                    segmentBody.setUserData({ type: c.type === 'wall-b' ? 'bumper' : 'wall', original: c, hitTimer: 0, speed: 30 });
                }
            } else {
                const b = world.createBody({ position: pos, angle: angle });
                b.createFixture(planck.Box(pxToM(c.w / 2), pxToM(3)), { 
                    restitution: c.type === 'wall-b' ? 0.6 : 0.5, 
                    friction: 0.02,
                    filterGroupIndex: -1
                });
                b.setUserData({ type: c.type === 'wall-b' ? 'bumper' : 'wall', original: c, hitTimer: 0, speed: 30 });
            }
        } else if (c.type === 'target' || c.type === 'target-p') {
            const b = world.createBody({ position: pos, angle: angle });
            b.createFixture(planck.Box(pxToM(15), pxToM(15)), { restitution: 0.1 });
            b.setUserData({ type: c.type, original: c, level: c.type === 'target-p' ? (c.level !== undefined ? c.level : 0) : 1, active: true });
            if (c.type === 'target') targets.push(b);
        } else if (c.type === 'spinner') {
            const b = world.createDynamicBody({ position: pos, angularDamping: 1.5 });
            b.setAngle(angle);
            b.createFixture(planck.Box(pxToM(30), pxToM(8)), { density: 1, friction: 0.1 });
            world.createJoint(planck.RevoluteJoint({}, ground, b, pos));
            b.setUserData({ 
                type: 'spinner', 
                original: c, 
                colorIndex: components.indexOf(c) % 4,
                prevColorIndex: components.indexOf(c) % 4,
                hitTimer: 0 
            });
        } else if (c.type === 'roleta') {
            const b = world.createBody({ position: pos, angle: angle, type: 'static' });
            // Os dois postes de suporte das pontas (sólidos, ressalto elástico) - Alargados para 34px
            b.createFixture(planck.Circle(Vec2(pxToM(-34), 0), pxToM(4)), { restitution: 0.5, friction: 0.05 });
            b.createFixture(planck.Circle(Vec2(pxToM(34), 0), pxToM(4)), { restitution: 0.5, friction: 0.05 });
            // Sensor intermédio (onde a placa roda) - Alargado para 30px
            b.createFixture(planck.Box(pxToM(30), pxToM(6), Vec2(0, 0), 0), { isSensor: true });
            b.setUserData({ 
                type: 'roleta', 
                original: c, 
                colorIndex: components.indexOf(c) % 4,
                prevColorIndex: components.indexOf(c) % 4,
                hitTimer: 0,
                verticalAngle: 0,
                verticalVelocity: 0
            });
        } else if (c.type.startsWith('light-g3-') || c.type.startsWith('light-g4-')) {
            const b = world.createBody(pos);
            b.createFixture(planck.Circle(pxToM(6)), { isSensor: true }); // Pequeno sensor inofensivo
            const numLights = c.type.includes('g3') ? 3 : 4;
            b.setUserData({
                type: 'light-group',
                original: c,
                numLights: numLights,
                colors: Array.from({ length: numLights }, () => Math.floor(Math.random() * 4)),
                isSpinning: false,
                spinDuration: 0
            });
        } else if (c.type.startsWith('light')) {
            const b = world.createBody(pos);
            b.createFixture(planck.Circle(pxToM(12)), { isSensor: true });
            b.setUserData({ type: 'light', original: c, active: c.active !== undefined ? c.active : false });
        } else if (c.type === 'plunger') {
            plungerBody = world.createDynamicBody(pos);
            plungerBody.createFixture(planck.Box(pxToM(17.5), pxToM(10)), { density: 20 });
            world.createJoint(planck.PrismaticJoint({ lowerTranslation: 0, upperTranslation: pxToM(60), enableLimit: true }, ground, plungerBody, pos, Vec2(0, 1)));
            plungerBody.setUserData({ type: 'plunger', original: c });
        } else if (c.type === 'hole') {
            const b = world.createBody(pos);
            b.createFixture(planck.Circle(pxToM(20)), { isSensor: true });
            b.setUserData({ type: 'hole', original: c, active: false }); // Começa desligado
        } else if (c.type.startsWith('hole-')) {
            const b = world.createBody({ position: pos, angle: angle, type: 'static' });
            // U-shaped walls (esquerda, direita, topo) - Quadrado Perfeito Simétrico (56x56 exterior de lado a lado)
            b.createFixture(planck.Box(pxToM(2), pxToM(26), Vec2(pxToM(-26), pxToM(0)), 0), { restitution: 0.2 });
            b.createFixture(planck.Box(pxToM(2), pxToM(26), Vec2(pxToM(26), pxToM(0)), 0), { restitution: 0.2 });
            b.createFixture(planck.Box(pxToM(26), pxToM(2), Vec2(0, pxToM(-26)), 0), { restitution: 0.2 });
            
            // Hole Sensor inside the chamber - Centrado perfeitamente em (0, 0)
            b.createFixture(planck.Circle(Vec2(0, 0), pxToM(16)), { isSensor: true });
            
            // Portão/Gate fixture: começa fechado (barreira sólida na base) - Centrado em (0, 26)
            const startOpen = false; // Começa sempre FECHADO para forçar o jogador a acender as luzes!
            const gateFixture = startOpen ? null : b.createFixture(planck.Box(pxToM(26), pxToM(2), Vec2(0, pxToM(26)), 0), { restitution: 0.2 });
            
            b.setUserData({
                type: 'protected-hole',
                colorType: c.type, // 'hole-g', 'hole-r', etc.
                original: c,
                gateOpen: startOpen,
                gateFixture: gateFixture,
                trapped: false,
                active: startOpen,
                hadBall: false
            });
        } else if (c.type === 'pin') {
            const b = world.createBody({ position: pos, type: 'static' });
            b.createFixture(planck.Circle(pxToM(4)), { restitution: 0.5 });
            b.setUserData({ type: 'pin', original: c });
        } else if (c.type === 'prego') {
            const b = world.createBody({ position: pos, type: 'static' });
            b.createFixture(planck.Circle(pxToM(8)), { restitution: 0.65 });
            b.setUserData({ type: 'prego', original: c });
            const isActive = pregoActiveTimer > Date.now();
            b.setActive(isActive);
        }
    });

    let isLostTriggered = false;
    const handleLostBall = () => {
        if (isLostTriggered) return;
        isLostTriggered = true;
        
        if (warpActive) {
            // Retornar da sub-mesa para a mesa principal sem perder bola!
            showDisplayMessage("🌀 PORTAL DE RETORNO! 🌀\nREGRESSO À MESA PRINCIPAL!", "#00ffff", 2500);
            sounds.playScoreMilestone();
            
            setTimeout(() => {
                // Restaurar estado do pai
                components = parentTableComponents;
                score = parentScore;
                ballsLeft = parentBallsLeft;
                warpActive = false;
                
                // Restaurar nome da mesa principal no input
                const nameInput = document.getElementById('table-name-input') as HTMLInputElement;
                if (nameInput) nameInput.value = parentTableName;
                
                // Reiniciar simulação sem limpar score/bolas
                runGameSimulation(true);
                score = parentScore;
                ballsLeft = parentBallsLeft;
                updateScore(0); updateBallsDisplay();
                
                // Encontrar o buraco de portal original para re-ejetar a bola
                let originalHoleBody = null;
                for (let b = world.getBodyList(); b; b = b.getNext()) {
                    const d = b.getUserData();
                    if (d?.original === sourcePortalHoleOriginal) {
                        originalHoleBody = b; break;
                    }
                }
                
                if (originalHoleBody && marbleBody) {
                    const hPos = originalHoleBody.getPosition();
                    const hAngle = originalHoleBody.getAngle();
                    const dHole = originalHoleBody.getUserData();
                    dHole.trapped = true;
                    dHole.hadBall = true;
                    dHole.gateOpen = true;
                    
                    const offsetWorld = Vec2(-Math.sin(hAngle) * pxToM(-5), Math.cos(hAngle) * pxToM(-5));
                    marbleBody.setPosition(Vec2.add(hPos, offsetWorld));
                    marbleBody.setStatic();
                    
                    setTimeout(() => {
                        if (marbleBody) {
                            marbleBody.setDynamic();
                            const dir = Vec2(-Math.sin(hAngle), Math.cos(hAngle));
                            marbleBody.applyLinearImpulse(dir.mul(55), marbleBody.getWorldCenter());
                        }
                        dHole.trapped = false;
                        
                        // Atrasar o fecho físico da porta por 250ms para que a bola tenha tempo de sair da caixa!
                        setTimeout(() => {
                            dHole.gateOpen = false;
                            dHole.active = false;
                            dHole.hadBall = false;
                            if (!dHole.gateFixture) {
                                dHole.gateFixture = originalHoleBody.createFixture(planck.Box(pxToM(26), pxToM(2), Vec2(0, pxToM(26)), 0), { restitution: 0.2 });
                            }
                        }, 250);
                    }, 1200);
                }
                
                isLostTriggered = false;
            }, 2000);
            return;
        }

        ballsLeft--;
        updateBallsDisplay();
        
        if (ballsLeft <= 0) {
            isPlaying = false;
            sounds.playGameOver();
            showDisplayMessage("GAME OVER", "#ff0000", 3000);
            
            const currentTableName = (document.getElementById('modal-table-select') as HTMLSelectElement)?.value || 'Mesa Sem Nome';
            const scores = getHighscoresForTable(currentTableName);
            const isRecord = scores.length < 10 || score > (scores[scores.length - 1]?.score || 0);
            
            setTimeout(async () => {
                await showHighscoreModal("FIM DE JOGO");
                if (isRecord && score > 0) {
                    document.getElementById('new-record-form')?.classList.remove('hidden');
                    document.querySelector('.modal-actions')?.classList.add('hidden');
                    const nameInput = document.getElementById('player-name') as HTMLInputElement;
                    if (nameInput) {
                        const savedName = localStorage.getItem('arcade_hub_player_name') || '';
                        nameInput.value = savedName;
                        nameInput.focus();
                        nameInput.select(); // Deixa o texto selecionado para aceitar direto ou alterar digitando!
                    }
                }
            }, 3000);
        } else {
            sounds.playHole(); // Som de buraco para dreno/perda de bola
            showDisplayMessage("BOLA PERDIDA!", "#ff0000", 1500);
            setTimeout(() => {
                if (marbleBody) world.destroyBody(marbleBody);
                marbleBody = null;
                isLostTriggered = false;
                setTimeout(createBall, 500);
            }, 10);
        }
    };

    createBall();

    if (isWarping) {
        // Encontrar um buraco de destino livre (normal) na sub-mesa para ejetar a bola diretamente,
        // mantendo os buracos protegidos tapados/fechados no início do mapa como manda a regra!
        let targetHoleBody = null;
        for (let b = world.getBodyList(); b; b = b.getNext()) {
            const d = b.getUserData();
            if (d?.type === 'hole') {
                targetHoleBody = b;
                break;
            }
        }

        if (targetHoleBody && marbleBody) {
            const hPos = targetHoleBody.getPosition();
            const hAngle = targetHoleBody.getAngle();
            const dHole = targetHoleBody.getUserData();
            dHole.trapped = true;
            dHole.hadBall = true;
            
            // Posicionar a bola no buraco
            const offsetWorld = Vec2(-Math.sin(hAngle) * pxToM(-5), Math.cos(hAngle) * pxToM(-5));
            marbleBody.setPosition(Vec2.add(hPos, offsetWorld));
            marbleBody.setStatic();
            isLaunched = true; // Marcar já como lançada!
            document.getElementById('launch-hint')?.classList.add('hidden');
            
            setTimeout(() => {
                if (marbleBody) {
                    marbleBody.setDynamic();
                    const dir = Vec2(-Math.sin(hAngle), Math.cos(hAngle));
                    marbleBody.applyLinearImpulse(dir.mul(45), marbleBody.getWorldCenter());
                }
                dHole.trapped = false;
            }, 1200);
        } else {
            // Se não houver buracos livres, disparar automaticamente a mola spawn após 1 segundo!
            setTimeout(() => {
                if (marbleBody && !isLaunched) {
                    launchBall();
                }
            }, 1000);
        }
    }

    // Contact Listener para Mecânicas
    world.on('begin-contact', (contact: any) => {
        const fixtureA = contact.getFixtureA();
        const fixtureB = contact.getFixtureB();
        const bodyA = fixtureA.getBody();
        const bodyB = fixtureB.getBody();
        const dataA = bodyA.getUserData();
        const dataB = bodyB.getUserData();
        
        const process = (ball: any, other: any, data: any) => {
            if (data?.type === 'prego') {
                data.hitTimer = Date.now() + 100;
                if (data.original) data.original.hitTimer = Date.now() + 100;
                sounds.playBumper();
                const bPos = ball.getPosition();
                const oPos = other.getPosition();
                let normal = Vec2(bPos.x - oPos.x, bPos.y - oPos.y);
                normal.normalize();
                
                const impulseMag = 12 * ball.getMass();
                ball.applyLinearImpulse(Vec2(normal.x * impulseMag, normal.y * impulseMag), ball.getWorldCenter());
                updateScore(150);
                showDisplayMessage("SALVO! 🛡️", '#ffa500', 500);
            } else if (data?.type === 'bumper') {
                data.hitTimer = Date.now() + 100;
                if (data.original) data.original.hitTimer = Date.now() + 100;
                sounds.playBumper();
                let normal;
                if (data.original?.type === 'wall-b') {
                    // Normal perpendicular para paredes elásticas
                    const angle = other.getAngle();
                    normal = Vec2(-Math.sin(angle), Math.cos(angle));
                } else {
                    // Normal radial para bumpers redondos/triangulares
                    const bPos = ball.getPosition();
                    const oPos = other.getPosition();
                    normal = Vec2(bPos.x - oPos.x, bPos.y - oPos.y);
                    normal.normalize();
                }
                
                const impulseMag = ((data.speed || 25) * 1.28) * ball.getMass();
                ball.applyLinearImpulse(Vec2(normal.x * impulseMag, normal.y * impulseMag), ball.getWorldCenter());
                updateScore((data.speed || 10) * 10);
                showDisplayMessage(data.original?.type === 'wall-b' ? "BOOST!" : "BUMPER!", '#ff00ff', 500);
            } else if (data?.type === 'wall') {
                // Paredes passivas não dão impulso, apenas mudam o hitTimer para feedback visual
                data.hitTimer = Date.now() + 100;
                if (data.original) data.original.hitTimer = Date.now() + 100;
                sounds.playBumper();
            } else if (data?.type === 'target') {
                if (data.active) {
                    sounds.playTarget();
                    const pts = 100 * targetLevel;
                    updateScore(pts);
                    showDisplayMessage(`TARGET +${pts}`, '#ff00ff');
                    data.active = false;
                    setTimeout(() => world.destroyBody(other), 0);
                    targets = targets.filter(t => t !== other);
                    if (targets.length === 0) {
                        targetLevel++;
                        showDisplayMessage(`JACKPOT NÍVEL ${targetLevel}!\nALVOS REPOSTOS!`, '#ffff00', 3000);
                        sounds.playScoreMilestone();
                        updateScore(2000 * (targetLevel - 1));
                        
                        setTimeout(() => {
                            // Repor alvos de forma segura (fora do step de física bloqueado)
                            components.forEach(c => {
                                if (c.type === 'target') {
                                    const pos = Vec2(pxToM(c.x), pxToM(c.y));
                                    const angle = c.angle || 0;
                                    const b = world.createBody({ position: pos, angle: angle });
                                    b.createFixture(planck.Box(pxToM(15), pxToM(15)), { restitution: 0.1 });
                                    b.setUserData({ type: c.type, original: c, level: targetLevel, active: true });
                                    targets.push(b);
                                }
                            });
                        }, 0);
                    }
                }
            } else if (data?.type === 'target-p') {
                sounds.playTarget();
                data.level++;
                if (data.level === 9) {
                    sounds.playScoreMilestone();
                    updateScore(1000);
                    data.level = 0;
                    if (pregoActiveTimer > Date.now()) {
                        pregoActiveTimer += 30000;
                        const remainingSecs = Math.round((pregoActiveTimer - Date.now()) / 1000);
                        showDisplayMessage(`ESCUDO PROLONGADO! +30s 🛡️\nTOTAL: ${remainingSecs} SEGUNDOS!`, "#ffa500", 3000);
                    } else {
                        pregoActiveTimer = Date.now() + 30000;
                        showDisplayMessage("ESCUDO PREGO ATIVADO! 🛡️\n30 SEGUNDOS DE PROTEÇÃO!", "#ffa500", 3000);
                    }
                } else {
                    const pts = 100;
                    updateScore(pts);
                    showDisplayMessage(`ALVO CONTINUO: ${data.level}/9`, "#ffeb3b", 1000);
                }
                data.hitTimer = Date.now() + 100;
            } else if (data?.type === 'spinner' || data?.type === 'roleta') {
                const speed = ball.getLinearVelocity().length();
                sounds.playSpinner(speed);
                updateScore(10);
                
                if (data.type === 'roleta') {
                    data.verticalVelocity = Math.max(data.verticalVelocity || 0, speed * 2.5 + 10);
                }

                // Ativar o modo de rotação (slot-machine) para todos os grupos de luzes especiais
                for (let bLight = world.getBodyList(); bLight; bLight = bLight.getNext()) {
                    const dLight = bLight.getUserData();
                    if (dLight?.type === 'light-group' && !dLight.isSpinning) {
                        dLight.isSpinning = true;
                        dLight.spinDuration = 100; // ~1.6 segundos a rodar (100 frames a 60fps)
                        showDisplayMessage("🎰 ROLETA DA SORTE! 🎰", "#00ffff", 1000);
                    }
                }
                
                // Mudar de cor ao ser atingida
                if (data.colorIndex !== undefined) {
                    data.prevColorIndex = data.colorIndex;
                    data.colorIndex = (data.colorIndex + 1) % NEON_COLORS.length;
                    
                    // Verificar se todos os spinners e roletas partilham a mesma cor para o JACKPOT!
                    let allGateBodies: any[] = [];
                    for (let b = world.getBodyList(); b; b = b.getNext()) {
                        const d = b.getUserData();
                        if (d?.type === 'spinner' || d?.type === 'roleta') {
                            allGateBodies.push(d);
                        }
                    }
                    if (allGateBodies.length > 1) {
                        const firstColor = allGateBodies[0].colorIndex;
                        const allMatch = allGateBodies.every(d => d.colorIndex === firstColor);
                        if (allMatch) {
                            const matchColorStr = NEON_COLORS[firstColor];
                            showDisplayMessage("JACKPOT DE CORES! 🌈\n+5.000 PTS!", matchColorStr, 3000);
                            sounds.playScoreMilestone();
                            updateScore(5000);
                            // Misturar cores novamente para o próximo desafio
                            allGateBodies.forEach((d, idx) => {
                                d.colorIndex = idx % NEON_COLORS.length;
                            });
                        }
                    }
                }
            } else if (data?.type === 'light') {
                if (!data.active) {
                    data.active = true;
                    sounds.playTarget();
                    updateScore(200);
                    
                    const lightGroup = data.original?.type || 'light';
                    const isGreenGroup = lightGroup === 'light' || lightGroup === 'light-g';
                    const groupColorHex = isGreenGroup ? '#00ff00' : (lightGroup === 'light-r' ? '#ff0055' : (lightGroup === 'light-b' ? '#00ffff' : '#ffeb3b'));
                    const groupColorName = isGreenGroup ? 'VERDE' : (lightGroup === 'light-r' ? 'VERMELHA' : (lightGroup === 'light-b' ? 'AZUL' : 'AMARELA'));
                    
                    showDisplayMessage(`LUZ ${groupColorName} LIGADA! 💡`, groupColorHex, 800);
                    
                    // Verificar se todas as luzes deste grupo específico estão ligadas
                    let groupLights: any[] = [];
                    for (let b = world.getBodyList(); b; b = b.getNext()) {
                        const d = b.getUserData();
                        if (d?.type === 'light') {
                            const isThisGreen = d.original?.type === 'light' || d.original?.type === 'light-g';
                            if ((isGreenGroup && isThisGreen) || (!isGreenGroup && d.original?.type === lightGroup)) {
                                groupLights.push(d);
                            }
                        }
                    }
                    
                    if (groupLights.length > 0) {
                        const allActive = groupLights.every(d => d.active);
                        if (allActive) {
                            // Encontrar o buraco protegido correspondente
                            const targetHoleType = isGreenGroup ? 'hole-g' : (lightGroup === 'light-r' ? 'hole-r' : (lightGroup === 'light-b' ? 'hole-b' : 'hole-y'));
                            let foundProtectedHole = false;
                            
                            for (let bHole = world.getBodyList(); bHole; bHole = bHole.getNext()) {
                                const dHole = bHole.getUserData();
                                if (dHole?.type === 'protected-hole' && dHole.colorType === targetHoleType) {
                                    foundProtectedHole = true;
                                    if (!dHole.gateOpen) {
                                        // Abrir a porta do buraco protegido!
                                        dHole.gateOpen = true;
                                        dHole.active = true; // No desenho, active representa se a porta está aberta
                                        if (dHole.gateFixture) {
                                            const fxToDestroy = dHole.gateFixture;
                                            dHole.gateFixture = null;
                                            setTimeout(() => {
                                                bHole.destroyFixture(fxToDestroy);
                                            }, 0);
                                        }
                                        showDisplayMessage(`PORTA DO BURACO ${groupColorName} ABERTA! 🔓`, groupColorHex, 2500);
                                        sounds.playScoreMilestone();
                                    }
                                }
                            }
                            
                            if (!foundProtectedHole) {
                                // Se não houver o buraco protegido na mesa, comportamento clássico (Jackpot de Luzes)
                                showDisplayMessage(`JACKPOT DE LUZES ${groupColorName}! 💡🔥\n+5.000 PTS!`, groupColorHex, 3000);
                                sounds.playScoreMilestone();
                                updateScore(5000);
                                
                                // Resetar as luzes deste grupo de forma segura após 1.5s
                                setTimeout(() => {
                                    for (let bLight = world.getBodyList(); bLight; bLight = bLight.getNext()) {
                                        const dLight = bLight.getUserData();
                                        if (dLight?.type === 'light') {
                                            const isThisGreen = dLight.original?.type === 'light' || dLight.original?.type === 'light-g';
                                            if ((isGreenGroup && isThisGreen) || (!isGreenGroup && dLight.original?.type === lightGroup)) {
                                                dLight.active = false;
                                            }
                                        }
                                    }
                                }, 1500);
                            }
                        }
                    }
                }
            } else if (data?.type === 'hole') {
                // Buraco: Iniciar processo de captura (sem teleport)
                if (ball === marbleBody && !data.trapped) {
                    // Apenas marcar que a bola está em contacto
                    data.contacting = true;
                }
            } else if (data?.type === 'protected-hole') {
                if (ball === marbleBody && !data.trapped && data.gateOpen) {
                    data.contacting = true;
                }
            } else if (data?.type === 'drain') {
                if (ball === marbleBody && isLaunched) {
                    handleLostBall();
                }
            }
        };

        if (dataA?.type === 'ball') process(bodyA, bodyB, dataB);
        else if (dataB?.type === 'ball') process(bodyB, bodyA, dataA);
    });

    const step = () => {
        if (!isPlaying) return;
        
        // Sincronização contínua de inputs (Garante que A+D dispara sempre)
        syncInputs();

        if (!isLaunched) {
            document.getElementById('launch-hint')?.classList.remove('hidden');
        } else {
            document.getElementById('launch-hint')?.classList.add('hidden');
        }
        
        world.step(1/60, 8, 3);

        // Sincronizar o estado físico (ativo/inativo) de todos os pregos temporários
        const isPregoActiveNow = pregoActiveTimer > Date.now();
        for (let b = world.getBodyList(); b; b = b.getNext()) {
            const d = b.getUserData();
            if (d?.type === 'prego') {
                if (b.isActive() !== isPregoActiveNow) {
                    b.setActive(isPregoActiveNow);
                }
            }
        }

        // Atualizar rotação vertical de todas as roletas na simulação
        for (let b = world.getBodyList(); b; b = b.getNext()) {
            const d = b.getUserData();
            if (d?.type === 'roleta') {
                d.verticalAngle = (d.verticalAngle || 0) + (d.verticalVelocity || 0) * (1/60);
                d.verticalVelocity = (d.verticalVelocity || 0) * 0.982; // Amortecimento de fricção vertical
                if (Math.abs(d.verticalVelocity) < 0.05) d.verticalVelocity = 0;
            } else if (d?.type === 'light-group') {
                if (d.isSpinning) {
                    d.spinDuration--;
                    
                    // Baralhar as cores apenas a cada 6 frames (10 vezes por segundo) para uma transição visível e agradável (estilo casino)
                    if (d.spinDuration % 6 === 0) {
                        d.colors = d.colors.map(() => Math.floor(Math.random() * 4));
                    }
                    
                    if (d.spinDuration <= 0) {
                        d.isSpinning = false;
                        
                        // Verificar se deu Jackpot (todas as luzes com a mesma cor) - Puro Acaso!
                        const allSame = d.colors.every((c: any) => c === d.colors[0]);
                        if (allSame) {
                            const colorHex = NEON_COLORS[d.colors[0]];
                            if (d.numLights === 3) {
                                // Jackpot Triplo!
                                updateScore(2500);
                                sounds.playScoreMilestone();
                                showDisplayMessage("🎰 JACKPOT TRIPLO! 🎰🌈\n+2.500 PTS!", colorHex, 3000);
                            } else {
                                // Super Jackpot / Bola Extra!
                                sounds.playScoreMilestone();
                                if (!hasSuperJackpotInThisRun) {
                                    hasSuperJackpotInThisRun = true;
                                    ballsLeft++;
                                    updateBallsDisplay();
                                    showDisplayMessage("🎰 SUPER JACKPOT! 🎰\nBOLA EXTRA +5.000 PTS!", colorHex, 3500);
                                    updateScore(5000);
                                } else {
                                    showDisplayMessage("🎰 SUPER JACKPOT REPETIDO! 🎰\nMEGA BÓNUS +15.000 PTS!", colorHex, 3500);
                                    updateScore(15000);
                                }
                            }
                        } else {
                            sounds.playBumper();
                            showDisplayMessage("TENTE OUTRA VEZ! 🎰", "#888888", 800);
                        }
                    }
                }
            }
        }
        
        // Anti-Stuck Micro-Nudge: se a bola estiver lançada e quase sem movimento (perfeitamente equilibrada), dar um micro-impulso para desequilibrar
        if (marbleBody && isLaunched) {
            const vel = marbleBody.getLinearVelocity();
            if (Math.abs(vel.x) < 0.05 && Math.abs(vel.y) < 0.05) {
                marbleBody.applyLinearImpulse(Vec2(Math.random() > 0.5 ? 0.015 : -0.015, 0), marbleBody.getWorldCenter());
            }

            // Failsafe Out-Of-Bounds Recovery: se a bola escapar por tunneling ou ressaltar fora da zona de jogo por falha do sensor
            const pos = marbleBody.getPosition();
            const px = mToPx(pos.x);
            const py = mToPx(pos.y);
            if (py > PLAY_ZONE_BOTTOM + 40 || py < -60 || px < -40 || px > WIDTH + 40) {
                handleLostBall();
            }
        }
        
        // Desenhar
        drawBackground();
        
        // Desenhar botões (feedback visual no jogo)
        if (activeTheme === 'retro') {
            ctx.shadowBlur = 0;
            ctx.fillStyle = keysPressed.has('a') || keysPressed.has('arrowleft') ? 'rgba(139, 90, 43, 0.4)' : 'rgba(139, 90, 43, 0.15)';
            ctx.beginPath(); ctx.arc(65, PLAY_ZONE_BOTTOM + 60, 40, 0, Math.PI*2); ctx.fill();
            
            ctx.fillStyle = keysPressed.has('d') || keysPressed.has('arrowright') ? 'rgba(139, 90, 43, 0.4)' : 'rgba(139, 90, 43, 0.15)';
            ctx.beginPath(); ctx.arc(WIDTH - 65, PLAY_ZONE_BOTTOM + 60, 40, 0, Math.PI*2); ctx.fill();
        } else {
            ctx.shadowBlur = 10; ctx.shadowColor = '#ff00ff';
            ctx.fillStyle = keysPressed.has('a') || keysPressed.has('arrowleft') ? 'rgba(255,0,255,0.4)' : 'rgba(255,0,255,0.1)';
            ctx.beginPath(); ctx.arc(65, PLAY_ZONE_BOTTOM + 60, 40, 0, Math.PI*2); ctx.fill();
            
            ctx.fillStyle = keysPressed.has('d') || keysPressed.has('arrowright') ? 'rgba(255,0,255,0.4)' : 'rgba(255,0,255,0.1)';
            ctx.beginPath(); ctx.arc(WIDTH - 65, PLAY_ZONE_BOTTOM + 60, 40, 0, Math.PI*2); ctx.fill();
        }

        const now = Date.now();
        if (displayMessage && now < displayMessageTimer) {
            ctx.font = 'bold 18px Orbitron'; ctx.textAlign = 'center'; ctx.fillStyle = displayMessageColor;
            ctx.shadowBlur = 10; ctx.shadowColor = displayMessageColor;
            
            // Suporte para 2 linhas (se houver '\n' ou se for longa)
            const parts = displayMessage.split('\n');
            if (parts.length > 1) {
                ctx.fillText(parts[0], WIDTH / 2, PLAY_ZONE_BOTTOM + 50);
                ctx.fillText(parts[1], WIDTH / 2, PLAY_ZONE_BOTTOM + 80);
            } else {
                ctx.fillText(displayMessage, WIDTH / 2, PLAY_ZONE_BOTTOM + 65);
            }
        }
        ctx.restore();

        // Desenhar Paredes Curvas ativas do jogo de forma global e com brilho
        components.forEach(c => {
            if (c.p0 && (c.p4 || c.p2)) {
                ctx.save();
                if (activeTheme === 'retro') {
                    ctx.strokeStyle = c.type === 'wall-b' ? '#1976d2' : '#d32f2f'; // Elásticos vermelhos (ou azul para wall-b) sólidos sem brilho!
                    if (now < (c.hitTimer || 0)) {
                        ctx.strokeStyle = '#ff8a80'; // Feedback suave ao bater
                    }
                    ctx.lineWidth = 6;
                    ctx.lineCap = 'round';
                    ctx.shadowBlur = 0;
                    
                    ctx.beginPath();
                    const startPt = getBezierPoint(c, 0);
                    ctx.moveTo(startPt.x, startPt.y);
                    for (let i = 1; i <= 20; i++) {
                        const pt = getBezierPoint(c, i / 20);
                        ctx.lineTo(pt.x, pt.y);
                    }
                    ctx.stroke();
                } else {
                    ctx.strokeStyle = c.type === 'wall-b' ? '#00ffff' : '#ff00ff';
                    if (now < (c.hitTimer || 0)) {
                        ctx.strokeStyle = '#fff';
                    }
                    ctx.lineWidth = 6;
                    ctx.lineCap = 'round';
                    ctx.shadowBlur = c.type === 'wall-b' ? 15 : 10;
                    ctx.shadowColor = ctx.strokeStyle;
                    
                    ctx.beginPath();
                    const startPt = getBezierPoint(c, 0);
                    ctx.moveTo(startPt.x, startPt.y);
                    for (let i = 1; i <= 20; i++) {
                        const pt = getBezierPoint(c, i / 20);
                        ctx.lineTo(pt.x, pt.y);
                    }
                    ctx.stroke();
                    
                    // Linha interna de brilho
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(startPt.x, startPt.y);
                    for (let i = 1; i <= 20; i++) {
                        const pt = getBezierPoint(c, i / 20);
                        ctx.lineTo(pt.x, pt.y);
                    }
                    ctx.stroke();
                }
                ctx.restore();
            }
        });

        // Corpos Planck e Lógica de Buracos (Sução e Missão)
        for (let b = world.getBodyList(); b; b = b.getNext()) {
            const pos = b.getPosition();
            const data = b.getUserData();

            // Lógica de Sução de Buracos
            if (data?.type === 'hole' && marbleBody && !data.trapped) {
                const bPos = marbleBody.getPosition();
                const dist = Vec2.distance(pos, bPos);
                if (dist < pxToM(30)) {
                    // Aplicar força de atracção (íman mais forte)
                    const force = Vec2.sub(pos, bPos);
                    force.normalize();
                    marbleBody.applyForce(force.mul(45), marbleBody.getWorldCenter());

                    // Captura definitiva se estiver perto do centro (margem maior)
                    if (dist < pxToM(12)) {
                        data.trapped = true;
                        data.active = true; 
                        sounds.playHole();
                        marbleBody.setLinearVelocity(Vec2(0, 0)); // Travar para garantir captura
                        marbleBody.setStatic();
                        marbleBody.setPosition(pos);
                        showDisplayMessage("BURACO CAPTURADO!", "#00ff00", 1000);
                        updateScore(1000);

                        // Lógica de Missão (Verificar todos os buracos)
                        let allHolesActive = true;
                        for (let h = world.getBodyList(); h; h = h.getNext()) {
                            const hd = h.getUserData();
                            if (hd?.type === 'hole' && !hd.active) {
                                allHolesActive = false; break;
                            }
                        }

                        if (allHolesActive) {
                            sounds.playScoreMilestone();
                            if (!hasCompletedHolesMissionInThisRun) {
                                hasCompletedHolesMissionInThisRun = true;
                                ballsLeft++;
                                updateBallsDisplay();
                                showDisplayMessage("🎰 MISSÃO COMPLETA! 🎰\nBOLA EXTRA +5.000 PTS!", "#ffff00", 3500);
                                updateScore(5000);
                            } else {
                                showDisplayMessage("🎰 MISSÃO REPETIDA! 🎰\nSUPER JACKPOT +10.000 PTS!", "#ffff00", 3500);
                                updateScore(10000);
                            }
                            // Resetar todos os buracos após 1.5s
                            setTimeout(() => {
                                for (let h = world.getBodyList(); h; h = h.getNext()) {
                                    const hd = h.getUserData();
                                    if (hd?.type === 'hole') hd.active = false;
                                }
                            }, 1500);
                        }

                        setTimeout(() => {
                            if (marbleBody) {
                                marbleBody.setDynamic();
                                const kForce = 45; // Força de expulsão aumentada
                                const kAngle = Math.random() * Math.PI * 2; // Expulsão em qualquer direção (360º)
                                marbleBody.applyLinearImpulse(Vec2(Math.cos(kAngle)*kForce, Math.sin(kAngle)*kForce), marbleBody.getWorldCenter());
                            }
                            data.trapped = false;
                        }, 1200);
                    }
                }
            }

            // Lógica de Sução de Buracos Protegidos
            if (data?.type === 'protected-hole' && marbleBody) {
                const bPos = marbleBody.getPosition();
                
                if (data.gateOpen) {
                    if (data.trapped) {
                        // A bola está presa no buraco, não faz nada
                    } else {
                        const dist = Vec2.distance(pos, bPos);
                        
                        // Se a bola acabou de entrar e ser expulsa, e agora afastou-se, fechar a porta
                        if (data.hadBall && dist > pxToM(35)) {
                            data.gateOpen = false;
                            data.active = false;
                            data.hadBall = false;
                            if (!data.gateFixture) {
                                data.gateFixture = b.createFixture(planck.Box(pxToM(26), pxToM(2), Vec2(0, pxToM(20)), 0), { restitution: 0.2 });
                            }
                            const colorHex = data.colorType === 'hole-g' ? '#00ff00' : 
                                             data.colorType === 'hole-r' ? '#ff0055' : 
                                             data.colorType === 'hole-b' ? '#00ffff' : '#ffeb3b';
                            showDisplayMessage("PORTA FECHADA! 🔒", colorHex, 1000);
                        } else if (dist < pxToM(45)) {
                            // Obter posição da bola no sistema de coordenadas local do buraco protegido
                            const localBallPos = b.getLocalPoint(bPos);
                            const localX = mToPx(localBallPos.x);
                            const localY = mToPx(localBallPos.y);
                            
                            // A força de atração só atua se a bola estiver alinhada com a abertura do buraco ou dentro dele (localX entre -26 e 26, localY >= -30)
                            if (Math.abs(localX) <= 26 && localY >= -30) {
                                const force = Vec2.sub(pos, bPos);
                                force.normalize();
                                marbleBody.applyForce(force.mul(65), marbleBody.getWorldCenter());
                            }
                            
                            // Capturar se estiver muito perto
                            if (dist < pxToM(18)) {
                                data.trapped = true;
                                data.hadBall = true; // Registar que a bola entrou
                                sounds.playHole();
                                marbleBody.setLinearVelocity(Vec2(0, 0));
                                marbleBody.setStatic();
                                // Trava a bola ligeiramente recuada para o centro do buraco (offset de -5px local em y)
                                const angle = b.getAngle();
                                const offsetWorld = Vec2(-Math.sin(angle) * pxToM(-5), Math.cos(angle) * pxToM(-5));
                                marbleBody.setPosition(Vec2.add(pos, offsetWorld));
                                
                                const colorName = data.colorType === 'hole-g' ? 'VERDE' : 
                                                  data.colorType === 'hole-r' ? 'VERMELHA' : 
                                                  data.colorType === 'hole-b' ? 'AZUL' : 'AMARELA';
                                const colorHex = data.colorType === 'hole-g' ? '#00ff00' : 
                                                 data.colorType === 'hole-r' ? '#ff0055' : 
                                                 data.colorType === 'hole-b' ? '#00ffff' : '#ffeb3b';
                                                 
                                showDisplayMessage(`BURACO ${colorName} CAPTURADO! 🎯\n+3.000 PTS!`, colorHex, 2000);
                                updateScore(3000);
                                
                                // Resetar as luzes da mesma cor para que o jogador possa abri-lo de novo
                                const targetLightType = data.colorType === 'hole-g' ? 'light-g' : 
                                                        data.colorType === 'hole-r' ? 'light-r' : 
                                                        data.colorType === 'hole-b' ? 'light-b' : 'light-y';
                                                        
                                for (let bLight = world.getBodyList(); bLight; bLight = bLight.getNext()) {
                                    const dLight = bLight.getUserData();
                                    if (dLight?.type === 'light') {
                                        const isThisGreen = dLight.original?.type === 'light' || dLight.original?.type === 'light-g';
                                        if ((targetLightType === 'light-g' && isThisGreen) || (dLight.original?.type === targetLightType)) {
                                            dLight.active = false;
                                        }
                                    }
                                }
                                
                                if (data.original && data.original.portalTable) {
                                    const targetTable = data.original.portalTable;
                                    showDisplayMessage(`🌀 PORTAL ACTIVADO! 🌀\nA TELETRANSPORTAR PARA:\n${targetTable.toUpperCase()}`, '#00ffff', 2500);
                                    sounds.playScoreMilestone();
                                    
                                    setTimeout(async () => {
                                        if (!warpActive) {
                                            // Guardar o estado dinâmico dos corpos da simulação atual antes de saltar!
                                            for (let b = world.getBodyList(); b; b = b.getNext()) {
                                                const d = b.getUserData();
                                                if (d?.original) {
                                                    if (d.level !== undefined) d.original.level = d.level;
                                                    if (d.active !== undefined) d.original.active = d.active;
                                                    if (d.gateOpen !== undefined) d.original.gateOpen = d.gateOpen;
                                                }
                                            }
                                            
                                            // Guardar estado da mesa pai antes de saltar
                                            warpActive = true;
                                            if (!hasWarpedInThisRun) {
                                                hasWarpedInThisRun = true;
                                                ballsLeft++;
                                                updateBallsDisplay();
                                                showDisplayMessage("🌀 PORTAL DIMENSIONAL ACTIVO! 🌀\nBOLA EXTRA POR EXPLORAÇÃO! 🎒", "#00ffff", 3000);
                                            }
                                            parentTableName = (document.getElementById('table-name-input') as HTMLInputElement)?.value || 'Mesa Principal';
                                            parentTableComponents = JSON.parse(JSON.stringify(components));
                                            parentScore = score;
                                            parentBallsLeft = ballsLeft;
                                            sourcePortalHoleOriginal = data.original;
                                        }
                                        
                                        // Tentar carregar os componentes da sub-mesa
                                        let subLoaded = false;
                                        try {
                                            const res = await fetch(`/api/tables/${encodeURIComponent(targetTable)}`);
                                            if (res.ok) {
                                                components = await res.json();
                                                subLoaded = true;
                                            }
                                        } catch (err) {}
                                        
                                        if (!subLoaded) {
                                            const stored = localStorage.getItem(`pinball_table_${targetTable}`);
                                            if (stored) {
                                                components = JSON.parse(stored);
                                                subLoaded = true;
                                            }
                                        }
                                        
                                        if (subLoaded) {
                                            // Atualizar nome da sub-mesa nos inputs de controlo
                                            const nameInput = document.getElementById('table-name-input') as HTMLInputElement;
                                            if (nameInput) nameInput.value = targetTable;
                                            
                                            // Iniciar simulação no modo warp (preservando score e bolas)
                                            runGameSimulation(true);
                                            score = parentScore;
                                            ballsLeft = parentBallsLeft;
                                            updateScore(0); updateBallsDisplay();
                                        } else {
                                            // Se falhar a carregar a mesa por algum motivo, ejetar bola normalmente
                                            showDisplayMessage("ERRO: MESA DE DESTINO NÃO ENCONTRADA! 🛑", "#ff0055", 2000);
                                            if (marbleBody) {
                                                marbleBody.setDynamic();
                                                const ang = b.getAngle();
                                                const dir = Vec2(-Math.sin(ang), Math.cos(ang));
                                                marbleBody.applyLinearImpulse(dir.mul(55), marbleBody.getWorldCenter());
                                            }
                                            data.trapped = false;
                                        }
                                    }, 1500);
                                } else {
                                    setTimeout(() => {
                                        if (marbleBody) {
                                            marbleBody.setDynamic();
                                            // Expulsa na direção da abertura (para baixo do U local, ou seja, local Vec2(0, 1))
                                            const ang = b.getAngle();
                                            const dir = Vec2(-Math.sin(ang), Math.cos(ang)); // Vetor local (0, 1) transformado para mundo
                                            marbleBody.applyLinearImpulse(dir.mul(55), marbleBody.getWorldCenter());
                                        }
                                        data.trapped = false;
                                        
                                        // Atrasar o fecho físico da porta por 250ms para que a bola tenha tempo de sair da caixa!
                                        setTimeout(() => {
                                            data.gateOpen = false;
                                            data.active = false;
                                            data.hadBall = false;
                                            if (!data.gateFixture) {
                                                data.gateFixture = b.createFixture(planck.Box(pxToM(26), pxToM(2), Vec2(0, pxToM(26)), 0), { restitution: 0.2 });
                                            }
                                            showDisplayMessage("PORTA FECHADA! 🔒", colorHex, 1000);
                                        }, 250);
                                    }, 1200);
                                }
                            }
                        }
                    }
                }
            }

            if (data?.original && data.original.p0 && data.original.p2) {
                // Pular desenho individual de segmentos da parede curva pois já foi desenhada globalmente com brilho acima!
                continue;
            }

            ctx.save();
            ctx.translate(mToPx(pos.x), mToPx(pos.y));
            ctx.rotate(b.getAngle());
            
            if (data?.original) {
                let drawColor = undefined;
                if (data.colorIndex !== undefined) {
                    const simAngle = data.type === 'roleta' ? (data.verticalAngle || 0) : b.getAngle();
                    const isSpinning = data.type === 'roleta' ? ((data.verticalVelocity || 0) > 0.5) : (Math.abs(b.getAngularVelocity()) > 0.5);
                    if (isSpinning && Math.sin(simAngle) < 0 && data.prevColorIndex !== undefined) {
                        drawColor = NEON_COLORS[data.prevColorIndex];
                    } else {
                        drawColor = NEON_COLORS[data.colorIndex];
                    }
                }
                drawComponent(data.original, true, { 
                    hit: now < (data.hitTimer || 0), 
                    label: data.level !== undefined ? data.level : targetLevel,
                    active: data.active,
                    color: drawColor,
                    simAngle: data.type === 'roleta' ? data.verticalAngle : b.getAngle(),
                    colors: data.colors,
                    isSpinning: data.isSpinning
                });
            } else if (data?.type === 'ball') {
                // Saltar desenho no loop para desenhar por cima de tudo no final
            } else if (b.getType() === 'dynamic' && !data) {
                // Outros corpos dinâmicos sem data (ex: flippers partes se houver)
            }
            ctx.restore();
        }

        // Desenhar a bola sempre por cima de tudo (incluindo buracos)
        if (marbleBody) {
            const pos = marbleBody.getPosition();
            ctx.save();
            ctx.translate(mToPx(pos.x), mToPx(pos.y));
            ctx.fillStyle = '#fff'; ctx.shadowBlur = 10; ctx.shadowColor = '#00ffff';
            ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }

        // Condição de Morte removida (Agora feita por Sensor)
        
        animationId = requestAnimationFrame(step);
    };
    step();
};

const createPlanckFlipper = (c: any) => {
    const isSmall = c.type.includes('-s-');
    const length = isSmall ? 75 : 100;
    const isRight = c.type.endsWith('-r') || (c.type === 'flipper' && Math.cos(c.angle || 0) < 0);
    const baseAngle = c.angle || 0;
    const flipperPos = Vec2(pxToM(c.x), pxToM(c.y));
    
    const flipperBody = world.createDynamicBody({
        position: flipperPos,
        angle: baseAngle,
        bullet: true,
        angularDamping: 8.0 // Voltar ao padrão
    });

    const r1 = pxToM(14); const r2 = pxToM(7); const l = pxToM(length);
    const vertices = isRight ? [
        Vec2(0, -r1), Vec2(-l + r2, -r2), Vec2(-l + r2, r2), Vec2(0, r1)
    ] : [
        Vec2(0, -r1), Vec2(l - r2, -r2), Vec2(l - r2, r2), Vec2(0, r1)
    ];

    flipperBody.createFixture(planck.Polygon(vertices), { density: 5, friction: 0.02, restitution: 0.05, filterGroupIndex: -1 });
    flipperBody.createFixture(planck.Circle(r1), { density: 5, friction: 0.02, restitution: 0.05, filterGroupIndex: -1 });
    flipperBody.createFixture(planck.Circle(Vec2(isRight ? -l+r2 : l-r2, 0), r2), { density: 5, friction: 0.02, restitution: 0.05, filterGroupIndex: -1 });

    // Encontrar o GROUND central para a junta (o primeiro corpo estático criado na runGameSimulation)
    let ground;
    for (let b = world.getBodyList(); b; b = b.getNext()) {
        if (b.getType() === 'static' && b.getUserData() === null) { ground = b; break; }
    }

    const joint = world.createJoint(planck.RevoluteJoint({
        enableMotor: true,
        maxMotorTorque: isSmall ? 20000 : 40000, // Torque reduzido proporcionalmente nos flippers pequenos para estabilidade perfeita!
        enableLimit: true,
        lowerAngle: isRight ? -0.1 : -0.8,
        upperAngle: isRight ? 0.8 : 0.1,
        collideConnected: false
    }, ground || world.createBody(), flipperBody, flipperPos));

    flipperJoints.push({ joint, isRight });
    flipperBody.setUserData({ type: 'flipper', original: c });
};

const syncInputs = () => {
    if (!isPlaying) return;
    const leftDown = keysPressed.has('a') || keysPressed.has('arrowleft') || keysPressed.has('mobile-l');
    const rightDown = keysPressed.has('d') || keysPressed.has('arrowright') || keysPressed.has('mobile-r');
    const isSpace = keysPressed.has(' ') || keysPressed.has('arrowdown') || keysPressed.has('arrowup');

    if (!isLaunched && (isSpace || (leftDown && rightDown))) {
        launchBall();
    }

    flipperJoints.forEach(f => {
        if (f.isRight) {
            f.joint.setMotorSpeed(rightDown ? 60 : -35);
        } else {
            f.joint.setMotorSpeed(leftDown ? -60 : 35);
        }
    });

    if (isSpace && plungerBody) {
        plungerBody.applyLinearImpulse(Vec2(0, 150), plungerBody.getWorldCenter());
    }
};

const resetBall = () => {
    if (!isPlaying || !marbleBody) return;
    
    let spawnX = 415;
    let spawnY = 800;
    const spawnComp = components.find(c => c.type === 'spawn');
    if (spawnComp) {
        spawnX = spawnComp.x;
        spawnY = spawnComp.y;
    }
    
    marbleBody.setPosition(Vec2(spawnX / SCALE, spawnY / SCALE));
    marbleBody.setLinearVelocity(Vec2(0, 0));
    marbleBody.setAngularVelocity(0);
    marbleBody.setDynamic();
    isLaunched = false;
    
    showDisplayMessage("🔄 BOLA REPOSICIONADA!", "#00ffff", 1000);
    sounds.playLaunch();
};

const nudgeTable = () => {
    if (!isPlaying || !marbleBody) return;
    sounds.playFlipper();
    
    // Aplicar força física aleatória e para cima à bola para a libertar de qualquer canto
    const impulseX = (Math.random() - 0.5) * 4;
    const impulseY = -5 - Math.random() * 3;
    marbleBody.applyLinearImpulse(Vec2(impulseX, impulseY), marbleBody.getWorldCenter());
    
    showDisplayMessage("⚠️ MESA SACUDIDA! (NUDGE) 📳", "#ff9800", 1200);
    
    // Efeito visual fantástico de vibração/abalo do canvas de jogo
    const canvasEl = document.getElementById('canvas');
    if (canvasEl) {
        canvasEl.style.transition = 'none';
        canvasEl.style.transform = `translate(${(Math.random() - 0.5) * 14}px, ${(Math.random() - 0.5) * 14}px) rotate(${(Math.random() - 0.5) * 2}deg)`;
        setTimeout(() => {
            canvasEl.style.transform = `translate(${(Math.random() - 0.5) * 6}px, ${(Math.random() - 0.5) * 6}px)`;
            setTimeout(() => {
                canvasEl.style.transform = '';
            }, 70);
        }, 70);
    }
};

window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === 'Esc') {
        stopSimulation();
        showHighscoreModal("BEM-VINDO");
        return;
    }
    const key = e.key.toLowerCase();
    if (key === 'n' && isPlaying) {
        nudgeTable();
        return;
    }
    if (!keysPressed.has(key) && isPlaying) {
        if (['a', 'arrowleft', 'd', 'arrowright'].includes(key)) {
            sounds.playFlipper();
        } else if ([' ', 'arrowdown', 'arrowup'].includes(key)) {
            sounds.playFlipper(); // Som mecânico de ativação do plunger
        }
    }
    keysPressed.add(key);
    syncInputs();
});

window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    keysPressed.delete(key);
    syncInputs();
});

// Mobile Button Listeners (Sync with the global keysPressed set)
const btnL = document.getElementById('mobile-btn-left');
const btnR = document.getElementById('mobile-btn-right');

if (btnL && btnR) {
    const onLDown = (e: Event) => { 
        if (e.type === 'touchstart') e.preventDefault(); 
        if (!keysPressed.has('mobile-l') && isPlaying) sounds.playFlipper();
        keysPressed.add('mobile-l'); 
        syncInputs(); 
    };
    const onLUp = (e: Event) => { if (e.type === 'touchend') e.preventDefault(); keysPressed.delete('mobile-l'); syncInputs(); };
    const onRDown = (e: Event) => { 
        if (e.type === 'touchstart') e.preventDefault(); 
        if (!keysPressed.has('mobile-r') && isPlaying) sounds.playFlipper();
        keysPressed.add('mobile-r'); 
        syncInputs(); 
    };
    const onRUp = (e: Event) => { if (e.type === 'touchend') e.preventDefault(); keysPressed.delete('mobile-r'); syncInputs(); };

    btnL.addEventListener('mousedown', onLDown);
    btnL.addEventListener('mouseup', onLUp);
    btnL.addEventListener('touchstart', onLDown, { passive: false });
    btnL.addEventListener('touchend', onLUp, { passive: false });

    btnR.addEventListener('mousedown', onRDown);
    btnR.addEventListener('mouseup', onRUp);
    btnR.addEventListener('touchstart', onRDown, { passive: false });
    btnR.addEventListener('touchend', onRUp, { passive: false });
}

const switchTab = (tab: 'workshop' | 'game') => {
    const sidebar = document.getElementById('sidebar');
    const editorContainer = document.getElementById('editor-container');
    if (tab === 'workshop') {
        sidebar?.classList.remove('hidden-mobile'); editorContainer?.classList.add('hidden-mobile');
    } else {
        sidebar?.classList.add('hidden-mobile'); editorContainer?.classList.remove('hidden-mobile');
    }
};

const updateHighscoreTableList = () => {
    const tableSelect = document.getElementById('modal-table-select') as HTMLSelectElement;
    if (!tableSelect) return;
    
    // Obter todas as chaves do localStorage que começam com 'pinball_table_'
    const tables = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('pinball_table_')) {
            tables.push(key.replace('pinball_table_', ''));
        }
    }
    
    if (tables.length === 0) {
        tableSelect.innerHTML = '<option value="">Sem mesas gravadas</option>';
    } else {
        tableSelect.innerHTML = tables.map(t => `<option value="${t}">${t}</option>`).join('');
    }
};

document.getElementById('btn-save-score')?.addEventListener('click', () => {
    const nameInput = document.getElementById('player-name') as HTMLInputElement;
    const name = nameInput.value.trim().toUpperCase() || 'ANÓNIMO';
    
    // Guardar o nome no localStorage para lembrar na próxima sessão!
    if (name && name !== 'ANÓNIMO') {
        localStorage.setItem('arcade_hub_player_name', name);
    }
    
    checkAndSaveHighscore(name, score);
    document.getElementById('new-record-form')?.classList.add('hidden');
    showHighscoreModal("RECORDES");
});

document.getElementById('modal-btn-play')?.addEventListener('click', async () => {
    const tableSelect = document.getElementById('modal-table-select') as HTMLSelectElement;
    const tableName = tableSelect.value;
    if (tableName && !tableName.includes("Sem mesas")) {
        try {
            const res = await fetch(`/api/tables/${encodeURIComponent(tableName)}`);
            if (res.ok) {
                components = await res.json();
                document.getElementById('highscore-modal')?.classList.add('hidden');
                runGameSimulation();
                return;
            }
        } catch (e) {}

        const stored = localStorage.getItem(`pinball_table_${tableName}`);
        if (stored) {
            components = JSON.parse(stored);
        }
        document.getElementById('highscore-modal')?.classList.add('hidden');
        runGameSimulation();
    }
});

document.getElementById('modal-btn-exit')?.addEventListener('click', () => {
    document.getElementById('highscore-modal')?.classList.add('hidden');
    switchTab('workshop');
});

document.getElementById('modal-btn-hub')?.addEventListener('click', () => {
    document.getElementById('highscore-modal')?.classList.add('hidden');
    document.getElementById('app')?.classList.add('hidden');
    document.getElementById('hub-screen')?.classList.remove('hidden');
});

// Inicialização
window.addEventListener('load', () => {
    updateHighscoreTableList();
    showHighscoreModal("BEM-VINDO");
});

const stopSimulation = () => {
    isPlaying = false;
    if (animationId) cancelAnimationFrame(animationId);
    document.getElementById('grid-overlay')?.classList.remove('hidden');
    document.getElementById('btn-play')?.classList.remove('hidden');
    document.getElementById('btn-edit')?.classList.add('hidden');
    document.getElementById('score-display')?.classList.add('hidden');
    document.getElementById('launch-hint')?.classList.add('hidden');
    drawEditor();
};

document.getElementById('btn-play')?.addEventListener('click', () => {
    updateHighscoreTableList();
    showHighscoreModal("PREPARAR JOGO");
});
document.getElementById('btn-edit')?.addEventListener('click', stopSimulation);
document.getElementById('btn-clear')?.addEventListener('click', () => { if(confirm("Limpar tudo?")) { components = []; drawEditor(); } });

document.getElementById('btn-settings-toggle')?.addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('settings-dropdown')?.classList.toggle('hidden');
});

document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('settings-dropdown');
    const toggle = document.getElementById('btn-settings-toggle');
    if (dropdown && !dropdown.classList.contains('hidden')) {
        const target = e.target as HTMLElement;
        if (!dropdown.contains(target) && target !== toggle) {
            dropdown.classList.add('hidden');
        }
    }
});

document.getElementById('btn-sound-toggle')?.addEventListener('click', () => {
    isSoundEnabled = !isSoundEnabled;
    const btn = document.getElementById('btn-sound-toggle');
    if (btn) {
        btn.innerText = isSoundEnabled ? "🔊 SOM" : "🔇 SOM";
        btn.title = isSoundEnabled ? "Desligar Som" : "Ligar Som";
    }
    showDisplayMessage(isSoundEnabled ? "🔊 SOM ATIVADO" : "🔇 SOM DESATIVADO", "#00ffff", 1000);
});

document.getElementById('btn-theme-toggle')?.addEventListener('click', () => {
    activeTheme = activeTheme === 'neon' ? 'retro' : 'neon';
    document.body.classList.toggle('retro-theme', activeTheme === 'retro');
    const btn = document.getElementById('btn-theme-toggle');
    if (btn) {
        btn.innerText = activeTheme === 'neon' ? "💎 NÉON" : "🪵 CLÁSSICO";
    }
    sounds.playFlipper();
    showDisplayMessage(activeTheme === 'neon' ? "💎 TEMA NÉON ACTIVADO" : "🪵 TEMA CLÁSSICO ACTIVADO", activeTheme === 'neon' ? "#00ffff" : "#d4af37", 1200);
    
    // Forçar redesenho imediato do editor ou da simulação ativa
    if (!isPlaying) {
        drawEditor();
    }
});

document.getElementById('btn-nudge')?.addEventListener('click', () => {
    nudgeTable();
    document.getElementById('settings-dropdown')?.classList.add('hidden'); // auto-close
});

document.getElementById('btn-fullscreen')?.addEventListener('click', () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const appEl = document.getElementById('app');
    const btn = document.getElementById('btn-fullscreen');
    
    // Se for iOS ou se requestFullscreen não for suportado, usamos a simulação de CSS!
    if (isIOS || !document.documentElement.requestFullscreen) {
        if (appEl) {
            const isActive = appEl.classList.toggle('ios-fullscreen');
            if (btn) {
                btn.innerText = isActive ? "📺 ECRÃ" : "📱 ECRÃ";
                btn.title = isActive ? "Sair de Ecrã Inteiro" : "Ecrã Inteiro";
            }
            window.dispatchEvent(new Event('resize'));
        }
        return;
    }

    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch((err) => {
            if (appEl) {
                const isActive = appEl.classList.toggle('ios-fullscreen');
                if (btn) {
                    btn.innerText = isActive ? "📺 ECRÃ" : "📱 ECRÃ";
                }
            }
        });
    } else {
        document.exitFullscreen();
    }
});

document.addEventListener('fullscreenchange', () => {
    const btn = document.getElementById('btn-fullscreen');
    const appEl = document.getElementById('app');
    if (btn) {
        btn.innerText = document.fullscreenElement ? "📺 ECRÃ" : "📱 ECRÃ";
        btn.title = document.fullscreenElement ? "Sair de Ecrã Inteiro" : "Ecrã Inteiro";
    }
    if (!document.fullscreenElement) {
        appEl?.classList.remove('ios-fullscreen');
    }
});

document.getElementById('btn-reset-ball')?.addEventListener('click', () => {
    stopSimulation();
    showHighscoreModal("BEM-VINDO");
    document.getElementById('settings-dropdown')?.classList.add('hidden'); // auto-close
});

document.getElementById('modal-table-select')?.addEventListener('change', async (e) => {
    const val = (e.target as HTMLSelectElement).value;
    if (!val || val.includes("Sem mesas")) return;
    
    const input = document.getElementById('table-name-input') as HTMLInputElement;
    if (input) input.value = val;
    const select = document.getElementById('table-select') as HTMLSelectElement;
    if (select) select.value = val;

    try {
        const res = await fetch(`/api/tables/${encodeURIComponent(val)}`);
        if (res.ok) {
            components = await res.json();
            drawEditor();
            showHighscoreModal("BEM-VINDO");
            return;
        }
    } catch (err) {}

    // Fallback para localStorage se não existir no disco/servidor
    const stored = localStorage.getItem(`pinball_table_${val}`);
    if (stored) {
        components = JSON.parse(stored);
        drawEditor();
        showHighscoreModal("BEM-VINDO");
    }
});

document.getElementById('btn-save-score')?.addEventListener('click', () => {
    const nameInput = document.getElementById('player-name') as HTMLInputElement;
});

document.getElementById('btn-save-api')?.addEventListener('click', async () => {
    const nameInput = document.getElementById('table-name-input') as HTMLInputElement;
    const name = nameInput.value.trim();
    if (!name) { alert("Dá um nome à mesa!"); return; }
    
    try {
        const res = await fetch('/api/tables', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, components })
        });
        if (res.ok) {
            alert(`Mesa "${name}" gravada com sucesso no disco! 💾`);
            loadTableList();
        } else {
            alert("Erro ao gravar no disco. A gravar localmente no browser...");
            localStorage.setItem(`pinball_table_${name}`, JSON.stringify(components));
            loadTableList();
        }
    } catch (e) {
        localStorage.setItem(`pinball_table_${name}`, JSON.stringify(components));
        loadTableList();
    }
});

document.getElementById('btn-load-api')?.addEventListener('click', async () => {
    const select = document.getElementById('table-select') as HTMLSelectElement;
    const name = select.value;
    if (!name) return;
    
    try {
        const res = await fetch(`/api/tables/${encodeURIComponent(name)}`);
        if (res.ok) {
            const data = await res.json();
            // Suporte para o formato da API (array direto ou objeto)
            components = Array.isArray(data) ? data : (data.components || []);
            drawEditor();
            const nameInput = document.getElementById('table-name-input') as HTMLInputElement;
            if (nameInput) nameInput.value = name;
            alert(`Mesa "${name}" carregada do disco!`);
        } else {
            // Tentar localStorage se falhar a API
            const stored = localStorage.getItem(`pinball_table_${name}`);
            if (stored) {
                components = JSON.parse(stored);
                drawEditor();
            }
        }
    } catch (e) {}
});

document.getElementById('btn-delete-api')?.addEventListener('click', async () => {
    const select = document.getElementById('table-select') as HTMLSelectElement;
    const name = select.value;
    if (!name) {
        alert("Por favor, selecione uma mesa para apagar.");
        return;
    }
    
    // Confirmação dupla de segurança
    const confirmDel = confirm(`Tem a certeza absoluta de que deseja apagar a mesa "${name}" da VPS?\n\nEsta ação é irreversível!`);
    if (!confirmDel) return;
    
    const pwd = prompt("Digite a Palavra-Chave de Administrador para autorizar a remoção:");
    if (!pwd) return;
    
    // Apenas permitir a palavra-chave exclusiva ADMIN2026 em maiúsculas!
    if (pwd !== 'ADMIN2026') {
        alert("Palavra-Chave de Administrador incorreta! Acesso negado.");
        return;
    }
    
    try {
        const res = await fetch(`/api/tables/${encodeURIComponent(name)}`, {
            method: 'DELETE'
        });
        if (res.ok) {
            alert(`Sucesso! A mesa "${name}" foi permanentemente apagada do disco da VPS! 🗑️`);
            // Limpar do localStorage local também para total sincronia
            localStorage.removeItem(`pinball_table_${name}`);
            // Limpar o editor se a mesa ativa for a apagada
            const nameInput = document.getElementById('table-name-input') as HTMLInputElement;
            if (nameInput && nameInput.value === name) {
                components = [];
                nameInput.value = '';
                drawEditor();
            }
            // Recarregar a lista de mesas
            loadTableList();
        } else {
            alert("Erro ao apagar a mesa da VPS.");
        }
    } catch (e) {
        alert("Erro na ligação ao servidor VPS.");
    }
});

// Carregar lista de mesas do servidor
document.getElementById('btn-import-file')?.addEventListener('click', () => {
    document.getElementById('file-input')?.click();
});

document.getElementById('file-input')?.addEventListener('change', (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event: any) => {
        try {
            const imported = JSON.parse(event.target.result);
            // Suporte para diferentes formatos (se for array direto ou objeto com property components)
            components = Array.isArray(imported) ? imported : (imported.components || []);
            drawEditor();
            
            const fileName = file.name.split('.')[0];
            const nameInput = document.getElementById('table-name-input') as HTMLInputElement;
            if (nameInput) nameInput.value = fileName;
            
            // Gravar logo no localStorage para ficar disponível no menu de recordes
            localStorage.setItem(`pinball_table_${fileName}`, JSON.stringify(components));
            loadTableList();
            updateHighscoreTableList();
            
            alert(`Mesa "${fileName}" importada com sucesso! 🚀`);
        } catch (err) {
            alert("Erro ao ler o ficheiro. Certifica-te que é um JSON de mesa válido.");
        }
    };
    reader.readAsText(file);
});

const loadTableList = async () => {
    const select = document.getElementById('table-select') as HTMLSelectElement;
    const modalSelect = document.getElementById('modal-table-select') as HTMLSelectElement;
    
    const prevSelectVal = select ? select.value : '';
    const prevModalSelectVal = modalSelect ? modalSelect.value : '';
    
    let names: string[] = [];
    try {
        const res = await fetch('/api/tables');
        if (res.ok) {
            names = await res.json();
        }
    } catch (e) {}

    // Adicionar também as do localStorage (Unificação)
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('pinball_table_')) {
            const name = key.replace('pinball_table_', '');
            if (!names.includes(name)) names.push(name);
        }
    }
    
    const populate = (s: HTMLSelectElement) => {
        if (!s) return;
        if (names.length === 0) {
            s.innerHTML = '<option value="">Sem mesas guardadas 🛠️</option>';
        } else {
            s.innerHTML = names.map(t => `<option value="${t}">${t}</option>`).join('');
        }
    };

    populate(select);
    populate(modalSelect);
    
    if (select && prevSelectVal) select.value = prevSelectVal;
    if (modalSelect && prevModalSelectVal) modalSelect.value = prevModalSelectVal;
};

// Sincronização Final
loadTableList();
drawEditor(); updateToolSelection();

// Listener de Gravidade em Tempo Real
document.getElementById('gravity-slider')?.addEventListener('input', (e) => {
    gravityVal = parseFloat((e.target as HTMLInputElement).value);
    const valDisplay = document.getElementById('grav-val');
    if (valDisplay) valDisplay.innerText = gravityVal.toFixed(1);
    
    // Actualizar o mundo em tempo real se o jogo estiver a correr
    if (world) {
        world.setGravity(Vec2(0, 25 * gravityVal));
    }
});

// MATRIX DIGITAL RAIN & PASSWORD SYSTEM
let matrixInterval: any = null;

const initMatrixRain = () => {
    const canvas = document.getElementById('matrix-canvas') as HTMLCanvasElement;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d')!;
    
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    
    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });
    
    const katakana = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const alphabet = katakana.split("");
    
    const fontSize = 16;
    const columns = Math.floor(width / fontSize) + 1;
    
    const rainDrops: number[] = [];
    for (let x = 0; x < columns; x++) {
        rainDrops[x] = Math.random() * -100;
    }
    
    const draw = () => {
        ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
        ctx.fillRect(0, 0, width, height);
        
        ctx.fillStyle = "#0f0";
        ctx.font = fontSize + "px monospace";
        
        for (let i = 0; i < rainDrops.length; i++) {
            const text = alphabet[Math.floor(Math.random() * alphabet.length)];
            const x = i * fontSize;
            const y = rainDrops[i] * fontSize;
            
            ctx.fillText(text, x, y);
            
            if (y > height && Math.random() > 0.975) {
                rainDrops[i] = 0;
            }
            rainDrops[i]++;
        }
    };
    
    matrixInterval = setInterval(draw, 33);
    return matrixInterval;
};

const PASSWORD_SECRET = "PINBALL2026";

const initPasswordGate = () => {
    const loginScreen = document.getElementById('login-screen');
    const hubScreen = document.getElementById('hub-screen');
    const passwordInput = document.getElementById('login-password') as HTMLInputElement;
    const submitBtn = document.getElementById('btn-login-submit');
    const loginError = document.getElementById('login-error');
    
    const token = localStorage.getItem('arcade_hub_token');
    
    const showHub = () => {
        loginScreen?.classList.add('hidden');
        hubScreen?.classList.remove('hidden');
        if (matrixInterval) {
            clearInterval(matrixInterval);
            matrixInterval = null;
        }
    };
    
    if (token === PASSWORD_SECRET) {
        showHub();
    }
    
    const attemptLogin = () => {
        if (passwordInput && passwordInput.value === PASSWORD_SECRET) {
            localStorage.setItem('arcade_hub_token', PASSWORD_SECRET);
            loginError?.classList.add('hidden');
            
            sounds.playScoreMilestone();
            
            if (loginScreen) loginScreen.style.opacity = '0';
            setTimeout(() => {
                showHub();
            }, 500);
        } else {
            loginError?.classList.remove('hidden');
            if (passwordInput) {
                passwordInput.value = "";
                passwordInput.focus();
            }
        }
    };
    
    submitBtn?.addEventListener('click', attemptLogin);
    passwordInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') attemptLogin();
    });
};

const initArcadeHubNavigation = () => {
    const hubScreen = document.getElementById('hub-screen');
    const appEl = document.getElementById('app');
    
    document.getElementById('hub-btn-play-pinball')?.addEventListener('click', () => {
        hubScreen?.classList.add('hidden');
        appEl?.classList.remove('hidden');
        
        if (matrixInterval) {
            clearInterval(matrixInterval);
            matrixInterval = null;
        }
        
        sounds.playScoreMilestone();
        // Mostrar o menu de boas-vindas para selecionar a mesa e ver recordes!
        showHighscoreModal("BEM-VINDO");
        document.getElementById('sidebar')?.classList.add('hidden-mobile');
    });
    
    document.getElementById('hub-btn-open-workshop')?.addEventListener('click', () => {
        hubScreen?.classList.add('hidden');
        appEl?.classList.remove('hidden');
        
        if (matrixInterval) {
            clearInterval(matrixInterval);
            matrixInterval = null;
        }
        
        sounds.playTarget();
        document.getElementById('sidebar')?.classList.remove('hidden-mobile');
        switchTab('workshop');
    });
    
    document.getElementById('hub-btn-play-f1')?.addEventListener('click', (e) => {
        // Detetar se o ecrã é de telemóvel para bloquear o acesso ao F1
        if (window.innerWidth <= 768) {
            e.preventDefault();
            e.stopPropagation();
            sounds.playBumper();
            showDisplayMessage("🏎️ JOGO EXIGE TECLADO E ECRÃ LARGO DE PC! 💻", "#ff0055", 3500);
            return;
        }
        
        showDisplayMessage("🏎️ A INICIAR MINI F1 RACING...", "#ff0055", 3000);
        sounds.playScoreMilestone();
        setTimeout(() => {
            window.location.href = 'https://minif12026.online';
        }, 1500);
    });
    
    document.getElementById('hub-logout-btn')?.addEventListener('click', () => {
        localStorage.removeItem('arcade_hub_token');
        location.reload();
    });
};

// Inicialização Final e Splash Screen
window.addEventListener('load', () => {
    updateHighscoreTableList();
    initMatrixRain();
    initPasswordGate();
    initArcadeHubNavigation();
    
    // Garantir que os botões estão no estado correto
    document.getElementById('btn-play')?.classList.remove('hidden');
    document.getElementById('btn-edit')?.classList.add('hidden');
});

