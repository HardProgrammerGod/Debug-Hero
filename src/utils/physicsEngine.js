/**
 * 🎮 PHYSICS ENGINE - Утиліти для фізики гри
 * 
 * Всі функції фізики винесені для чистоти коду та тестування.
 * Кожна функція має чітку відповідальність (Single Responsibility Principle)
 */

import { GAME_CONSTANTS, KEYBOARD_KEYS, PHYSICS_CONFIG } from '../constants/gameConfig';

/**
 * Оновлює горизонтальну швидкість гравця на основі введення
 * @param {Object} velocity - Об'єкт швидкості {x, y}
 * @param {Object} keys - Об'єкт з натиснутими клавішами
 */
export const updateHorizontalVelocity = (velocity, keys) => {
  if (keys['d'] || keys['arrowright']) {
    velocity.x = GAME_CONSTANTS.PLAYER_SPEED;
  } else if (keys['a'] || keys['arrowleft']) {
    velocity.x = -GAME_CONSTANTS.PLAYER_SPEED;
  } else {
    velocity.x *= GAME_CONSTANTS.FRICTION;
  }
};

/**
 * Застосовує гравітацію до вертикальної швидкості
 * @param {Object} velocity - Об'єкт швидкості {x, y}
 */
export const applyGravity = (velocity) => {
  velocity.y -= GAME_CONSTANTS.GRAVITY;
};

/**
 * Перевіряє, чи гравець зіткнувся зі стіною (горизонтальна колізія)
 * @param {Object} player - Позиція гравця {x, y}
 * @param {Array} obstacles - Масив позицій блоків
 * @param {number} nextX - Наступна X позиція
 * @returns {boolean} - true якщо є колізія
 */
export const checkWallCollision = (player, obstacles, nextX) => {
  return obstacles.some(blockX => {
    const isXOverlap = PHYSICS_CONFIG.checkHorizontalCollision(
      nextX,
      GAME_CONSTANTS.PLAYER_SIZE,
      blockX,
      GAME_CONSTANTS.BLOCK_SIZE
    );
    const isYOverlap = PHYSICS_CONFIG.checkVerticalCollision(
      player.y,
      GAME_CONSTANTS.BLOCK_HEIGHT
    );
    return isXOverlap && isYOverlap;
  });
};

/**
 * Перевіряє, чи гравець приземлився на блок
 * @param {Object} player - Позиція гравця {x, y}
 * @param {Object} velocity - Об'єкт швидкості
 * @param {Array} obstacles - Масив позицій блоків
 * @returns {boolean} - true якщо гравець на блоці
 */
export const checkLandingOnBlock = (player, velocity, obstacles) => {
  const nextY = player.y + velocity.y;

  return obstacles.some(blockX =>
    PHYSICS_CONFIG.checkLanding(
      player.x,
      GAME_CONSTANTS.PLAYER_SIZE,
      blockX,
      GAME_CONSTANTS.BLOCK_SIZE,
      player.y,
      GAME_CONSTANTS.BLOCK_HEIGHT,
      nextY
    )
  );
};

/**
 * Перевіряє, чи гравець може стрибати (на землі або на блоці)
 * @param {Object} player - Позиція гравця {x, y}
 * @returns {boolean}
 */
export const canJump = (player) => {
  return player.y <= 0 || player.y === GAME_CONSTANTS.BLOCK_HEIGHT;
};

/**
 * Виконує стрибок
 * @param {Object} player - Позиція гравця
 * @param {Object} velocity - Об'єкт швидкості
 * @param {Object} keys - Об'єкт з натиснутими клавішами
 */
export const handleJump = (player, velocity, keys) => {
  const jumpKey = KEYBOARD_KEYS.JUMP.some(key => keys[key]);

  if (jumpKey && canJump(player)) {
    velocity.y = GAME_CONSTANTS.JUMP_FORCE;
    player.y += 1;
  }
};

/**
 * Застосовує граничні умови світу (не дозволити вийти за межі)
 * @param {Object} player - Позиція гравця
 * @param {Object} velocity - Об'єкт швидкості
 */
export const applyBoundaries = (player, velocity) => {
  if (player.y < 0) {
    player.y = 0;
    velocity.y = 0;
  }

  if (player.x < 0) {
    player.x = 0;
  }
};

/**
 * Перевіряє, чи гравець біля мобу
 * @param {number} playerX - X позиція гравця
 * @returns {boolean}
 */
export const isNearMob = (playerX) => {
  return Math.abs(playerX - GAME_CONSTANTS.MOB_X) < GAME_CONSTANTS.DETECTION_RANGE;
};

/**
 * Перевіряє, чи гравець досяг порталу
 * @param {number} playerX - X позиція гравця
 * @returns {boolean}
 */
export const hasReachedPortal = (playerX) => {
  return playerX > GAME_CONSTANTS.PORTAL_X - 50;
};
