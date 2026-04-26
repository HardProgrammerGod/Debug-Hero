/**
 * 🎮 GAME CONSTANTS
 * Централізовані константи для легшого налаштування гри
 */

export const GAME_CONSTANTS = {
  // 🤖 Герой та фізика
  PLAYER_SIZE: 60,
  PLAYER_SPEED: 11,
  JUMP_FORCE: 17,
  GRAVITY: 0.8,
  FRICTION: 0.8,

  // 🧱 Блоки та перешкоди
  BLOCK_SIZE: 70,
  BLOCK_HEIGHT: 70,
  GROUND_HEIGHT: 40,

  // 🎯 Розташування об'єктів на світі
  MOB_X: 4000,
  PORTAL_X: 4600,
  SPAWN_X: 100,
  SPAWN_Y: 0,
  DETECTION_RANGE: 100, // Як далеко гравець повинен бути від мобу

  // 🌍 Світ
  WORLD_WIDTH: 5000,
  VIEWPORT_OFFSET: 400, // Камера слідує за гравцем з цим зміщенням

  // 📊 Гра та таймер
  DEFAULT_LEVEL_TIME: 20,
  HP_DAMAGE_ON_WRONG: 20,
  SCORE_MULTIPLIER: 100,

  // 🎬 Анімації та таймери
  TITLE_SHOW_DURATION: 3000,
  BOSS_DIALOGUE_DURATION: 4500,
  WORLD_TRANSITION_DURATION: 3000,
  PARTICLES_DURATION: 1000,
  BOSS_LOG_DELAY: 700,

  // 🔊 Аудіо
  BG_AUDIO_VOLUME: 0.3,

  // 🎨 Колізії та хітбокси
  COLLISION_OFFSET: 10,
  LAND_DETECTION_OFFSET: 15,
};

/**
 * Констант для колізій та фізики
 */
export const PHYSICS_CONFIG = {
  // Перевірка колізій
  checkHorizontalCollision: (playerX, playerSize, blockX, blockSize, offset = GAME_CONSTANTS.COLLISION_OFFSET) => {
    return playerX + playerSize - offset > blockX && playerX + offset < blockX + blockSize;
  },

  checkVerticalCollision: (playerY, blockHeight) => {
    return playerY < blockHeight - GAME_CONSTANTS.COLLISION_OFFSET;
  },

  checkLanding: (playerX, playerSize, blockX, blockSize, playerY, blockHeight, nextY) => {
    const isXOverlap = playerX + playerSize - GAME_CONSTANTS.LAND_DETECTION_OFFSET > blockX && playerX + GAME_CONSTANTS.LAND_DETECTION_OFFSET < blockX + blockSize;
    return isXOverlap && playerY >= blockHeight && nextY <= blockHeight;
  },
};

/**
 * Стани гри
 */
export const GAME_STATES = {
  INTRO: 'intro',
  PLAYING: 'playing',
  TRANSITIONING: 'transitioning',
  DEAD: 'dead',
  FINAL: 'final',
};

/**
 * Клавіші для керування
 */
export const KEYBOARD_KEYS = {
  RIGHT: ['d', 'arrowright'],
  LEFT: ['a', 'arrowleft'],
  JUMP: ['w', ' ', 'arrowup'],
};

/**
 * Логи для фінальної сцени
 */
export const FINAL_RECOVERY_LOGS = [
  "CLEANING MALWARE RESIDUE...",
  "RECONSTRUCTING DATA STRUCTURES...",
  "RESTORING SYSTEM CORE...",
  "INTEGRITY CHECK: 100%",
  "RECOVERY COMPLETE. SYSTEM SECURE.",
  "THANK YOU, DEBUG HERO."
];

/**
 * Логи для переходу між світами
 */
export const WORLD_TRANSITION_LOGS = [
  "INITIALIZING NEURAL LINK... [OK]",
  "DECRYPTING SECTOR DATA... [OK]",
  "BYPASSING FIREWALL... [DONE]"
];
