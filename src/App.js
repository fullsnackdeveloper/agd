import './App.css';

import { MAX_HEIGHT, MAX_WIDTH, ROOM_MAX } from './settings';
import React, { useEffect, useRef, useState } from 'react';
import { getNextBlock, getRandomDirection, getRandomInt, getStartingBlock, surroundings } from './utils';

import Block from './components/Block';

const App = props => {
  const [grid, updateGrid] = useState([]);
  const [totalRoomNum, updateRoomNum] = useState(0);
  let renderGrid = useRef();

  const initGrid = () => {
    let newGrid = [];
    for (let y = 0; y < MAX_HEIGHT; y++) {
      newGrid[y] = [];
    }
    for (let y = 0; y < MAX_HEIGHT; y++) {
      for (let x = 0; x < MAX_WIDTH; x++) {
        newGrid[y][x] = { x, y };
      }
    }
    return newGrid
  }

  const activateBlock = (g, block, data) => {
    if (!g || !block)
      return
    g[block.y][block.x] = { ...g[block.y][block.x], ...data };
    return g;
  }

  const startGenerating = async () => {
    updateGrid([]);
    let initialGrid = await initGrid();
    const startingBlock = getStartingBlock();
    console.log('start')
    // activateBlock(initialGrid, startingBlock, 'Enter');
    const afterRoom = await makeRoom(initialGrid, startingBlock);
    openDoors(afterRoom.grid, afterRoom.doorBlocks);
    // await takeStep(newGrid, startingBlock);
  }

  const openDoors = (g, doorBlocks) => {
    doorBlocks.forEach(db => {
      let doorToHallway = getNextBlock(g, db, db.doorDirection);
      console.log(g, doorToHallway)
      takeStep(g, doorToHallway);
    })
  }







  const takeStep = async (g, cb, hallwayLength = 0, prevType) => {

    let hwLength = hallwayLength;
    let direction = getRandomDirection(g, cb);
    let shouldMakeRoom = getRandomInt(3) === 1;
    let type = shouldMakeRoom ? 'room' : 'hallway';
    if (hwLength > 4)
      type = 'room'
    // make room
    if (type === 'room') {
      if (totalRoomNum < ROOM_MAX) {
        updateRoomNum(totalRoomNum + 1);
        const afterRoom = await makeRoom(g, cb, direction);
        // openDoors(afterRoom.grid, afterRoom.doorBlocks);
      }
    }
    if (totalRoomNum >= ROOM_MAX)
      return null;

    // activate block
    let newGrid = await activateBlock(g, cb, { totalRoomNum, direction, type });
    updateGrid([...newGrid]);

    // restart if deadend hit
    let nextBlock = getNextBlock(g, cb, direction);
    if (!direction) {
      return null;
    }

    // count how many hallways
    if (type === 'hallway')
      hwLength += 1;

    console.log(totalRoomNum)
    if (g && nextBlock)
      setTimeout(async () => { await takeStep(g, nextBlock, hwLength, type) }, 10);
  }

  useEffect(() => {
    renderGrid.current = () => {
      return grid.map((y, indexY) => {
        return <div key={indexY} className="grid-row">
          {grid[indexY].map((x, indexX) => {
            return <Block key={`${indexX}`}{...x} />
          })}
        </div>
      })
    }
  }, [grid])

  return (
    <div className="App">
      <header>Auto Generated Dungeons</header>
      <button onClick={startGenerating}>Generate</button>
      <div className="grid-container">
        {renderGrid.current && renderGrid.current()}
      </div>
    </div>
  );
}

export default App;
