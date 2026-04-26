import React, { useState, useEffect, useRef, useCallback } from 'react';
import { worlds } from './data/gameConfig';
import CodeEditor from './CodeEditor';
import TaskHandler from './TaskHandler';
import MobDisplay from './MobDisplay';
import Intro from './Intro';

// 📦 Імпорти констант та утиліт
import {
  GAME_CONSTANTS,
  GAME_STATES,
  KEYBOARD_KEYS,
  FINAL_RECOVERY_LOGS,
  WORLD_TRANSITION_LOGS
} from './constants/gameConfig';

import {
  updateHorizontalVelocity,
  applyGravity,
  checkWallCollision,
  checkLandingOnBlock,
  canJump,
  handleJump,
  applyBoundaries,
  isNearMob,
  hasReachedPortal
} from './utils/physicsEngine';

// 🔊 Аудіо
import ambientBgUrl from './assets/sounds/ambient_bg.mp3';

// ========================================================
// 🎯 ДОПОМІЖНІ КОМПОНЕНТИ
// ========================================================

/**
 * Компонент для відображення бінарних частинок при видаленні мобу
 */
const BinaryParticles = ({ x, y, onComplete }) => {
  const [parts, setParts] = useState([]);

  useEffect(() => {
    const particles = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      char: Math.random() > 0.5 ? '1' : '0',
      vX: (Math.random() - 0.5) * 15,
      vY: (Math.random() - 1) * 15,
    }));
    setParts(particles);

    const timer = setTimeout(onComplete, GAME_CONSTANTS.PARTICLES_DURATION);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div style={{ position: 'absolute', left: x, bottom: y, pointerEvents: 'none', zIndex: 10 }}>
      {parts.map(p => (
        <span key={p.id} className="binary-particle" style={{
          position: 'absolute',
          color: '#00ff41',
          fontFamily: 'monospace',
          fontWeight: 'bold',
          left: p.id * 2,
          animation: 'particle-fade 1s forwards'
        }}>
          {p.char}
        </span>
      ))}
    </div>
  );
};

/**
 * Компонент для переходу між світами
 */
const WorldTransition = ({ nextWorldName, onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, GAME_CONSTANTS.WORLD_TRANSITION_DURATION);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="transition-screen">
      <div className="glitch-wrapper">
        {WORLD_TRANSITION_LOGS.map((log, i) => (
          <div key={i} className="log-line">{log}</div>
        ))}
        <h1 className="next-world-title">ВХІД У: {nextWorldName}</h1>
        <div className="loading-bar-container">
          <div className="loading-bar-fill"></div>
        </div>
      </div>
    </div>
  );
};

/**
 * Компонент для фінальної сцени відновлення системи
 */
const FinalRecoveryScreen = () => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    FINAL_RECOVERY_LOGS.forEach((line, i) => {
      setTimeout(() => setLogs(prev => [...prev, line]), i * GAME_CONSTANTS.BOSS_LOG_DELAY);
    });
  }, []);

  return (
    <div className="intro-container crt-overlay">
      <div className="terminal-border" style={{ padding: '40px', borderColor: '#00ff41' }}>
        <h1 className="glitch-text" style={{ color: '#00ff41', fontSize: '40px' }}>SYSTEM RECOVERY</h1>
        <div className="final-logs">
          {logs.map((log, i) => (
            <p key={i}>{`>> ${log}`}</p>
          ))}
        </div>
        {logs.length === FINAL_RECOVERY_LOGS.length && (
          <button className="start-btn animate-fadeIn" onClick={() => window.location.reload()}>
            REBOOT TO MAIN MENU
          </button>
        )}
      </div>
    </div>
  );
};

// ========================================================
// 🎮 ОСНОВНИЙ КОМПОНЕНТ ГРИ
// ========================================================

const Game = () => {
  // 📊 Стан гри
  const [gameState, setGameState] = useState(GAME_STATES.INTRO);
  const [currentWorld, setCurrentWorld] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(0);

  // 🎯 Розташування об'єктів
  const [obstacles, setObstacles] = useState([]);
  const [renderPos, setRenderPos] = useState({ x: GAME_CONSTANTS.SPAWN_X, y: GAME_CONSTANTS.SPAWN_Y });

  // 📈 Прогрес гравця
  const [score, setScore] = useState(0);
  const [hp, setHp] = useState(100);
  const [timeLeft, setTimeLeft] = useState(0);

  // 🎭 Стани гравця
  const [isNearMobState, setIsNearMobState] = useState(false);
  const [showPortal, setShowPortal] = useState(false);
  const [showTitle, setShowTitle] = useState(false);
  const [particles, setParticles] = useState(null);
  const [bossDialogue, setBossDialogue] = useState(null);

  // 🔧 Реф'ерени (не перерендерюють компонент)
  const playerRef = useRef({ x: GAME_CONSTANTS.SPAWN_X, y: GAME_CONSTANTS.SPAWN_Y });
  const velocity = useRef({ x: 0, y: 0 });
  const keys = useRef({});
  const timerInterval = useRef(null);
  const bgAudioRef = useRef(new Audio(ambientBgUrl));

  // 📍 Дані світу та рівня
  const worldData = worlds[currentWorld];
  const levelData = worldData.levels[currentLevel];

  // ========================================================
  // 🔊 УПРАВЛІННЯ АУДІО
  // ========================================================

  useEffect(() => {
    if (gameState === GAME_STATES.PLAYING) {
      bgAudioRef.current.loop = true;
      bgAudioRef.current.volume = GAME_CONSTANTS.BG_AUDIO_VOLUME;
      bgAudioRef.current.play().catch(() => console.log("Audio play deferred"));
    } else {
      bgAudioRef.current.pause();
    }
    return () => bgAudioRef.current.pause();
  }, [gameState]);

  // ========================================================
  // 🗣️ ДІАЛОГ БОСА
  // ========================================================

  useEffect(() => {
    const isBoss = currentWorld === worlds.length - 1 && currentLevel === worldData.levels.length - 1;
    if (isNearMobState && isBoss) {
      setBossDialogue(">> ChaosCompiler: Твій код застарів. Видаляю твій доступ до пам'яті...");
      setTimeout(() => setBossDialogue(null), GAME_CONSTANTS.BOSS_DIALOGUE_DURATION);
    }
  }, [isNearMobState, currentWorld, currentLevel, worldData.levels.length]);

  // ========================================================
  // 🧱 ГЕНЕРАЦІЯ ПЕРЕШКОД
  // ========================================================

  const generateObstacles = useCallback(() => {
    const obs = [];
    let lastX = 800;

    for (let i = 0; i < worldData.config.obstacleCount; i++) {
      const gap = Math.floor(Math.random() * (worldData.config.maxGap - worldData.config.minGap)) + worldData.config.minGap;
      lastX += gap;

      if (lastX < GAME_CONSTANTS.MOB_X - 300) {
        obs.push(lastX);
      }
    }

    setObstacles(obs);
  }, [worldData.config]);

  // ========================================================
  // 🔄 СКИДАННЯ РІВНЯ
  // ========================================================

  const resetLevel = useCallback(() => {
    playerRef.current = { x: GAME_CONSTANTS.SPAWN_X, y: GAME_CONSTANTS.SPAWN_Y };
    velocity.current = { x: 0, y: 0 };
    setIsNearMobState(false);
    setShowPortal(false);
    setParticles(null);
    setBossDialogue(null);
    setTimeLeft(levelData?.time || GAME_CONSTANTS.DEFAULT_LEVEL_TIME);
    generateObstacles();
    setShowTitle(true);

    const titleTimer = setTimeout(() => setShowTitle(false), GAME_CONSTANTS.TITLE_SHOW_DURATION);
    return () => clearTimeout(titleTimer);
  }, [levelData, generateObstacles]);

  useEffect(() => {
    if (gameState === GAME_STATES.PLAYING) {
      resetLevel();
    }
  }, [currentWorld, currentLevel, gameState, resetLevel]);

  // ========================================================
  // ➡️ ПЕРЕХІД НА НАСТУПНИЙ РІВЕНЬ/ЛІВ
  // ========================================================

  const handleNextAction = useCallback(() => {
    const isLastLevelInWorld = currentLevel >= worldData.levels.length - 1;
    const isLastWorld = currentWorld >= worlds.length - 1;

    if (isLastLevelInWorld && !isLastWorld) {
      setGameState(GAME_STATES.TRANSITIONING);
    } else if (!isLastLevelInWorld) {
      setCurrentLevel(prev => prev + 1);
    } else {
      setGameState(GAME_STATES.FINAL);
    }
  }, [currentLevel, currentWorld, worldData.levels.length]);

  // ========================================================
  // ⚙️ ОСНОВНИЙ ФІЗИЧНИЙ ЦИКЛ (requestAnimationFrame)
  // ========================================================

  useEffect(() => {
    if (gameState !== GAME_STATES.PLAYING || isNearMobState) return;

    let frameId;

    const update = () => {
      const p = playerRef.current;
      const v = velocity.current;

      // Горизонтальна швидкість
      updateHorizontalVelocity(v, keys.current);

      // Гравітація
      applyGravity(v);

      // Перевірка колізії з блоками (горизонтально)
      const nextX = p.x + v.x;
      if (!checkWallCollision(p, obstacles, nextX)) {
        p.x = nextX;
      } else {
        v.x = 0;
      }

      // Приземлення на блоки
      if (checkLandingOnBlock(p, v, obstacles)) {
        p.y = GAME_CONSTANTS.BLOCK_HEIGHT;
        v.y = 0;
      } else {
        p.y += v.y;
      }

      // Граничні умови
      applyBoundaries(p, v);

      // Стрибок
      handleJump(p, v, keys.current);

      // Перевірка, чи біля мобу
      if (isNearMob(p.x) && !showPortal) {
        setIsNearMobState(true);
        v.x = 0;
      }

      // Перевірка досягнення порталу
      if (showPortal && hasReachedPortal(p.x)) {
        handleNextAction();
        return;
      }

      // Оновлення позиції для рендеру
      setRenderPos({ x: p.x, y: p.y });
      frameId = requestAnimationFrame(update);
    };

    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, [gameState, isNearMobState, obstacles, showPortal, handleNextAction]);

  // ========================================================
  // ❤️ ПЕРЕВІРКА HP
  // ========================================================

  useEffect(() => {
    if (hp <= 0) {
      setGameState(GAME_STATES.DEAD);
    }
  }, [hp]);

  // ========================================================
  // ⏱️ ТАЙМЕР (КОЛИ БІЛЯ МОБУ)
  // ========================================================

  useEffect(() => {
    if (isNearMobState && timeLeft > 0) {
      timerInterval.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            setGameState(GAME_STATES.DEAD);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerInterval.current);
  }, [isNearMobState]);

  // ========================================================
  // ⌨️ ОБРОБКА КЛАВІАТУРИ
  // ========================================================

  useEffect(() => {
    const handleKeyDown = (e) => {
      keys.current[e.key.toLowerCase()] = true;
    };

    const handleKeyUp = (e) => {
      keys.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // ========================================================
  // 🎭 РЕНДЕР - ВИБІР СЦЕНИ
  // ========================================================

  if (gameState === GAME_STATES.INTRO) {
    return <Intro onStart={() => setGameState(GAME_STATES.PLAYING)} />;
  }

  if (gameState === GAME_STATES.FINAL) {
    return <FinalRecoveryScreen />;
  }

  if (gameState === GAME_STATES.TRANSITIONING) {
    return (
      <WorldTransition
        nextWorldName={worlds[currentWorld + 1]?.name}
        onComplete={() => {
          setCurrentWorld(w => w + 1);
          setCurrentLevel(0);
          setGameState(GAME_STATES.PLAYING);
        }}
      />
    );
  }

  if (gameState === GAME_STATES.DEAD) {
    return (
      <div className="death-screen">
        <h1 className="glitch-text">SYSTEM FAILURE</h1>
        <button className="start-btn" onClick={() => window.location.reload()}>
          REBOOT SYSTEM
        </button>
      </div>
    );
  }

  // ========================================================
  // 🎮 ОСНОВНА ІГРОВА СЦЕНА
  // ========================================================

  return (
    <div className={`game-screen ${isNearMobState ? 'animate-shake' : ''}`} style={{ background: worldData.theme.bg }}>
      {/* 🗣️ Діалог боса */}
      {bossDialogue && (
        <div className="boss-dialogue-box">
          <p className="typing-text">{bossDialogue}</p>
        </div>
      )}

      {/* 📊 HUD */}
      <div className="game-hud">
        <div className="hud-item">{worldData.name} | СЕКТОР {currentWorld + 1}-{currentLevel + 1}</div>
        <div className="hp-container">
          <span className="hp-label">INTEGRITY:</span>
          <div className="hp-bar-bg">
            <div className="hp-bar-fill" style={{ width: `${hp}%` }}></div>
          </div>
        </div>
        <div className="hud-item">score: <span style={{ color: worldData.theme.accent }}>{score}</span></div>
        {isNearMobState && <div className="hud-timer">ВІРУС: {timeLeft}s</div>}
      </div>

      {/* 📝 Назва світу */}
      <div className={`world-title-overlay ${showTitle ? 'active' : ''}`}>
        <h1 style={{ color: worldData.theme.accent }}>{worldData.name}</h1>
      </div>

      {/* 🌍 Світ та об'єкти */}
      <div className="world-layer" style={{ transform: `translateX(-${Math.max(0, renderPos.x - GAME_CONSTANTS.VIEWPORT_OFFSET)}px)`, transition: 'none' }}>
        {/* ⬜ Земля */}
        <div className="ground-line" style={{ borderColor: worldData.theme.ground }} />

        {/* 🧱 Блоки */}
        {obstacles.map((pos, i) => (
          <div key={i} className="brick" style={{ left: pos, bottom: '40px' }}>🧱</div>
        ))}

        {/* ✨ Частинки при перемозі */}
        {particles && <BinaryParticles x={particles.x} y={particles.y} onComplete={() => setParticles(null)} />}

        {/* 👾 Моб або портал */}
        {!showPortal ? (
          <div style={{ position: 'absolute', left: GAME_CONSTANTS.MOB_X, bottom: '40px' }}>
            <MobDisplay image={levelData.enemy} />
          </div>
        ) : (
          <div className="portal-wrapper" style={{ left: GAME_CONSTANTS.PORTAL_X, bottom: '40px' }}>
            <div className="portal-ring" style={{ borderColor: worldData.theme.accent }} />
            <div className="interact-hint" style={{ color: worldData.theme.accent }}>ПОРТАЛ ВІДКРИТО</div>
          </div>
        )}

        {/* 🤖 Гравець */}
        <div className="player-hero" style={{ left: renderPos.x, bottom: `${40 + renderPos.y}px`, transition: 'none' }}>🤖</div>
      </div>

      {/* 💻 Термінал дебагу */}
      <div className={`bottom-terminal ${isNearMobState ? 'open' : ''}`}>
        {isNearMobState && levelData && (
          <TaskHandler
            key={`${currentWorld}-${currentLevel}`}
            type={levelData.type || 'code'}
            task={levelData.task}
            initialCode={levelData.code}
            blocks={levelData.blocks}
            solution={levelData.fix}
            onSuccess={() => {
              setParticles({ x: GAME_CONSTANTS.MOB_X, y: 80 });
              setIsNearMobState(false);
              setShowPortal(true);
              setScore(s => s + (timeLeft * GAME_CONSTANTS.SCORE_MULTIPLIER));
              clearInterval(timerInterval.current);
            }}
            onWrong={() => setHp(h => h - GAME_CONSTANTS.HP_DAMAGE_ON_WRONG)}
          />
        )}
      </div>
    </div>
  );
};

export default Game;
