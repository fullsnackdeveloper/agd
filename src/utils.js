import { MAX_HEIGHT, MAX_WIDTH } from "./settings";

import _ from 'lodash';

export const surroundings = (grid, block) => {
  let directions = [];
  let blocks = [];
  if (!!grid[block.y - 1] && !grid[block.y - 1][block.x].type) {
    directions.push('up');
    if (!!grid[block.y - 1][block.x + 1] && !grid[block.y - 1][block.x + 1].type)
      blocks.push('up-right');
    if (!!grid[block.y - 1][block.x - 1] && !grid[block.y - 1][block.x - 1].type)
      blocks.push('up-left');
  }
  if (!!grid[block.y + 1] && !grid[block.y + 1][block.x].type) {
    directions.push('down');
    if (!!grid[block.y + 1][block.x + 1] && !grid[block.y + 1][block.x + 1].type)
      blocks.push('down-right');
    if (!!grid[block.y + 1][block.x - 1] && !grid[block.y + 1][block.x - 1].type)
      blocks.push('down-left');
  }
  if (!!grid[block.y][block.x - 1] && !grid[block.y][block.x - 1].type) {
    directions.push('left');
    if (!!grid[block.y + 1] && !!grid[block.y + 1][block.x - 1] && !grid[block.y + 1][block.x - 1].type)
      if (!blocks.includes('down-left'))
        blocks.push('down-left');
    if (!!grid[block.y - 1] && !!grid[block.y - 1][block.x - 1] && !grid[block.y - 1][block.x - 1].type)
      if (!blocks.includes('up-left'))
        blocks.push('up-left');
  }
  if (!!grid[block.y][block.x + 1] && !grid[block.y][block.x + 1].type) {
    directions.push('right');
    if (!!grid[block.y + 1] && !!grid[block.y + 1][block.x + 1] && !grid[block.y + 1][block.x + 1].type)
      if (!blocks.includes('down-right'))
        blocks.push('down-right');
    if (!!grid[block.y - 1] && !!grid[block.y - 1][block.x + 1] && !grid[block.y - 1][block.x + 1].type)
      if (!blocks.includes('up-right'))
        blocks.push('up-right');
  }
  blocks = [...blocks, ...directions];
  return { directions, blocks };
}

// export const getStartingBlock = () => {
//   let startingSide = getRandomInt(4);
//   switch (startingSide) {
//     case 0:
//       return { x: getRandomInt(MAX_WIDTH), y: 0 };
//     case 1:
//       return { x: MAX_WIDTH - 1, y: getRandomInt(MAX_HEIGHT) }
//     case 2:
//       return { x: getRandomInt(MAX_WIDTH), y: MAX_HEIGHT - 1 }
//     case 3:
//       return { x: 0, y: getRandomInt(MAX_HEIGHT) }
//     default:
//       return null;
//   }
// }

export const getStartingBlock = () => {
  let randomX = getRandomInt(MAX_WIDTH);
  let randomY = getRandomInt(MAX_HEIGHT);
  return { x: randomX, y: randomY };
}

export const getRandomDirection = (grid, block) => {
  if (!block)
    return null;
  let directions = surroundings(grid, block).directions;
  let randomDirection = directions[getRandomInt(directions.length)];
  return randomDirection;
}

export const getRandomInt = max => {
  return Math.floor(Math.random() * Math.floor(max));
}

export const getNextBlock = (grid, block, direction, order) => {
  if (_.isEmpty(block))
    return;
  let newGrid = _.cloneDeep(grid);
  // newGrid[block.y][block.x] = { ...block, type: 'selected', order };
  let newBlock;
  switch (direction) {
    case 'up':
      newBlock = newGrid[block.y - 1][block.x];
      break;
    case 'down':
      newBlock = newGrid[block.y + 1][block.x];
      break;
    case 'right':
      newBlock = newGrid[block.y][block.x + 1];
      break;
    case 'left':
      newBlock = newGrid[block.y][block.x - 1];
      break;
    default:
      break;
  }
  return newBlock;
}

export const makeRoom = async (g, block, direction, roomNumber, enterance, final) => {
  let newGrid = g;
  let radius = surroundings(newGrid, block).blocks;
  // radius = await directionOfRoom(radius, direction);
  let doorCount = await howManyDoors();
  let roomBlocks = [];
  for (let dir of radius) {
    switch (dir) {
      case 'up-left':
        roomBlocks.push({ ...g[block.y - 1][block.x - 1] });
        break;
      case 'up':
        roomBlocks.push({ ...g[block.y - 1][block.x] });
        break;
      case 'up-right':
        roomBlocks.push({ ...g[block.y - 1][block.x + 1] });
        break;
      case 'right':
        roomBlocks.push({ ...g[block.y][block.x + 1] });
        break;
      case 'down-right':
        roomBlocks.push({ ...g[block.y + 1][block.x + 1] });
        break;
      case 'down':
        roomBlocks.push({ ...g[block.y + 1][block.x] });
        break;
      case 'down-left':
        roomBlocks.push({ ...g[block.y + 1][block.x - 1] });
        break;
      case 'left':
        roomBlocks.push({ ...g[block.y][block.x - 1] });
        break;
      default:
        break;
    }
  }
  let doorDirection = direction;

  switch (direction) {
    case 'up':
      doorDirection = 'down';
      break;
    case 'down':
      doorDirection = 'up';
      break;
    case 'right':
      doorDirection = 'left';
      break;
    case 'left':
      doorDirection = 'right';
      break;
    default:
      break;
  }
  if (roomNumber === 'e') {
    roomBlocks.push(block)
  } else {
    roomBlocks.push({ ...block, hasDoor: true, doorDirection });
  }
  roomBlocks = roomBlocks.map(b => {
    b.roomNumber = roomNumber;
    if (enterance)
      return { ...b, type: 'enterance' }
    return { ...b, type: 'room' }
  });

  roomBlocks.forEach(rb => {
    newGrid[rb.y][rb.x] = { ...rb }
  });

  let addedWalls = await addWalls(newGrid, roomBlocks, roomNumber);

  if (final)
    return { ...addedWalls };
  return await addDoors(addedWalls.grid, addedWalls.roomBlocks, doorCount);
}

const addWalls = async (grid, room, roomNumber) => {
  let newGrid = grid;
  let newRoomBlocks = [];
  room.forEach(rb => {
    const around = whatsAround(grid, rb);
    let walls = [];
    Object.entries(around).forEach(entry => {
      const [key, value] = entry;
      if (value.roomNumber === roomNumber)
        return;
      walls.push(key);
    })
    newRoomBlocks.push({ ...rb, walls })
    newGrid[rb.y][rb.x] = { ...rb, walls }
  });
  return { grid: newGrid, roomBlocks: newRoomBlocks };
}

export const whatsAround = (grid, block) => {
  let around = { up: {}, down: {}, left: {}, right: {} };
  if (!!grid[block.y - 1])
    around['up'] = { ...grid[block.y - 1][block.x] }
  if (!!grid[block.y + 1])
    around['down'] = { ...grid[block.y + 1][block.x] }
  if (!!grid[block.y][block.x - 1])
    around['left'] = { ...grid[block.y][block.x - 1] }
  if (!!grid[block.y][block.x + 1])
    around['right'] = { ...grid[block.y][block.x + 1] }
  return around
}

export const howManyDoors = async () => {
  let doorCount = getRandomInt(9);
  if (doorCount <= 5) {
    return doorCount = 1;
  } else if (doorCount > 5 && doorCount < 8) {
    return doorCount = 2;
  } else {
    return doorCount = 3;
  }
}

const addDoors = async (g, roomBlocks, doorCount, doorsPlaced = 0) => {
  let newGrid = g;
  let doorBlocks = [];
  roomBlocks.forEach((b) => {
    let rb = b;
    let blockSur = surroundings(newGrid, rb);
    if (blockSur.directions.length) {
      if (doorsPlaced < doorCount) {
        if (!rb.hasDoor) {
          const doorDirection = getRandomDirection(newGrid, rb);
          doorsPlaced += 1;
          newGrid[b.y][b.x] = {
            ...b,
            type: b.type,
            hasDoor: true,
            doorDirection
          }
          doorBlocks.push(newGrid[b.y][b.x]);
        }
      }
    }
  });
  return { grid: newGrid, doorBlocks };
}

// const directionOfRoom = async (radius, direction) => {
//   switch (direction) {
//     case 'up':
//       delete radius['down'];
//       delete radius['down-right'];
//       delete radius['down-left'];
//       break;
//     case 'down':
//       delete radius['up'];
//       delete radius['up-right'];
//       delete radius['up-left'];
//       break;
//     case 'right':
//       delete radius['left'];
//       delete radius['down-left'];
//       delete radius['up-left'];
//       break;
//     case 'left':
//       delete radius['right'];
//       delete radius['down-right'];
//       delete radius['up-right'];
//       break;
//     default:
//       break;
//   }
//   return await radius;
// }