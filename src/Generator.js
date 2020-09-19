import './App.css';

import { CHAIN_ROOM_MAX, MAX_HEIGHT, MAX_WIDTH, ROOM_MAX } from './settings';
import React, { Component } from 'react';
import { getNextBlock, getRandomDirection, getRandomInt, getStartingBlock, makeRoom, surroundings } from './utils';

import Block from './components/Block';
import Timeout from 'await-timeout';

class Generator extends Component {
  constructor() {
    super();
    this.state = {
      grid: [],
      roomCount: 0,
      chainRoomMax: 0
    }
  }

  componentDidMount () {
    this.makeGrid();
  }

  init = () => {
    this.setState({ roomCount: 0 })
    this.setState({ chainRoomMax: 0 })
    const starterGrid = this.makeGrid();
    this.start(starterGrid);
  }

  makeGrid = () => {
    let newGrid = [];
    for (let y = 0; y < MAX_HEIGHT; y++) {
      newGrid[y] = [];
    }
    for (let y = 0; y < MAX_HEIGHT; y++) {
      for (let x = 0; x < MAX_WIDTH; x++) {
        newGrid[y][x] = { x, y };
      }
    }
    this.setState({ grid: newGrid });
    return newGrid;
  }

  start = async (starterGrid) => {
    const startingBlock = getStartingBlock();
    const roomMade = await makeRoom(starterGrid, startingBlock, null, 'e', true);
    let newGrid = await this.startChain({ ...roomMade });
    this.setState({ grid: newGrid });
  }

  startChain = async ({ grid, doorBlocks, chainCount = 0 }) => {
    this.setState({ chainRoomMax: 0 })
    let chain = await this.takeStep({ grid, doorBlocks });
    if (chain.otherDoors && (chainCount < 5)) {
      chainCount += 1;
      await this.startChain({ grid: chain.grid, doorBlocks: chain.otherDoors, chainCount });
    }

    // remove doors that go nowhere
    chain.otherDoors.forEach(d => {
      let doorNextBlock = getNextBlock(chain.grid, d, d.doorDirection)
      if (!doorNextBlock || !doorNextBlock.type) {
        delete chain.grid[d.y][d.x].hasDoor;
        delete chain.grid[d.y][d.x].doorDirection;
      }
    })
    return chain.grid;
  }

  takeStep = async ({ grid, currentBlock, doorBlocks, otherDoors }) => {
    let newGrid = grid; // make a copy of the grid so far
    let nextBlock = null;
    let nextRoom = null;
    let mainBlock = currentBlock;
    let restOfDoors = otherDoors || [];

    if (doorBlocks) {
      // if this step has doors
      if (doorBlocks.length > 1) {
        // if there are multiple doors
        let randomDoor = getRandomInt(doorBlocks.length); // choose one door to go through
        mainBlock = doorBlocks[randomDoor]; // this one

        let otherRoomDoors = doorBlocks.filter(b => b !== mainBlock); // the rest of the doors are saved for later
        restOfDoors.push(...otherRoomDoors);
      } else {
        // if the room only has one exiting door
        mainBlock = doorBlocks[0]; // choose the only door
      }
    }

    if (mainBlock) {
      this.setState({ grid: newGrid })
      await Timeout.set(50);

      if (!surroundings(newGrid, mainBlock).directions.length)
        return { grid: newGrid, otherDoors: restOfDoors.filter(b => b !== mainBlock) }

      // get the next block
      nextBlock = getNextBlock(newGrid, mainBlock, mainBlock.doorDirection || mainBlock.direction);



      // randomly decide if the next block should become a room or a hallway
      let type = getRandomInt(3) === 1 ? 'room' : 'hallway';
      if (!surroundings(newGrid, nextBlock).directions.length)
        type = 'room';
      const direction = getRandomDirection(newGrid, nextBlock);

      if (type === 'hallway') {
        nextBlock = {
          ...nextBlock,
          type: 'hallway',
          direction,
          prevDirection: mainBlock.doorDirection || mainBlock.direction
        }
        newGrid[nextBlock.y][nextBlock.x] = nextBlock;
      }
      if (type === 'room') {
        nextRoom = await makeRoom(newGrid, nextBlock, (mainBlock.doorDirection || mainBlock.direction), this.state.roomCount, false, (this.state.chainRoomMax === CHAIN_ROOM_MAX - 1))
      }

      // if the next block is not a room take another step
      if (!(nextBlock.roomNumber >= 0)) {
        newGrid = await (await this.takeStep({ grid: newGrid, currentBlock: nextBlock, otherDoors: restOfDoors })).grid;
      }

      if (nextRoom) {
        this.setState({ roomCount: this.state.roomCount += 1 });
        this.setState({ chainRoomMax: this.state.chainRoomMax += 1 });
        if (this.state.chainRoomMax >= CHAIN_ROOM_MAX) // no more rooms, start next chain
          return ({ ...nextRoom, otherDoors: restOfDoors })
        await this.takeStep({ ...nextRoom, otherDoors: restOfDoors });
      }
    }

    return { grid: newGrid, otherDoors: restOfDoors }
  }

  // takeStep = async ({ grid, doorBlocks, currentBlock, hallwayLength = 0, otherDoors = [], prevDirection }) => {
  //   let newGrid = grid;
  //   if (doorBlocks) {
  //     let randomDoor = getRandomInt(doorBlocks.length);
  //     let mainBlock = doorBlocks[randomDoor];
  //     let restOfDoors = doorBlocks.filter(b => b !== mainBlock);
  //     if (restOfDoors.length)
  //       otherDoors.push(...restOfDoors);
  //     if (!mainBlock)
  //       return { grid: newGrid, otherDoors };
  //     const nextBlock = getNextBlock(newGrid, mainBlock, mainBlock.doorDirection);
  //     console.log('wait')
  //     await Timeout.set(1000);
  //     await this.takeStep({ grid: newGrid, currentBlock: nextBlock, hallwayLength: hallwayLength += 1, otherDoors })
  //     doorBlocks.forEach(async db => {
  //       const nextBlock = getNextBlock(newGrid, db, db.doorDirection);
  //       console.log('wait')
  //       await Timeout.set(1000);
  //       await this.takeStep({ grid: newGrid, currentBlock: nextBlock, hallwayLength: hallwayLength += 1 })
  //     })
  //   } else if (currentBlock) {
  //     let shouldMakeRoom = getRandomInt(3) === 1;
  //     let type = shouldMakeRoom ? 'room' : 'hallway';
  //     if (hallwayLength > 4)
  //       type = 'room'
  //     if (type === 'room' && this.state.roomCount < ROOM_MAX) {
  //       let roomCount = this.state.roomCount += 1;
  //       this.setState({ roomCount });
  //       const roomMade = await makeRoom(newGrid, currentBlock, currentBlock.direction, false, roomCount, (getRandomInt(10) === 3 || roomCount >= ROOM_MAX));
  //       if (roomCount < ROOM_MAX) {
  //         console.log('wait')
  //         await Timeout.set(1000);
  //         await this.takeStep({ ...roomMade, roomCount, otherDoors });
  //       }
  //       return await roomMade.grid;
  //     } else if (type === 'room') {
  //       const finalRoom = await makeRoom(newGrid, currentBlock, currentBlock.direction, false, null, true);
  //       return await finalRoom.grid;
  //     }
  //     if (type === 'hallway') {
  //       let direction = getRandomDirection(newGrid, currentBlock);
  //       newGrid[currentBlock.y][currentBlock.x] = { ...currentBlock, type: direction ? 'hallway' : 'room', direction, prevDirection: prevDirection || currentBlock.direction };
  //       const nextBlock = getNextBlock(newGrid, currentBlock, direction);
  //       await this.takeStep({ grid: newGrid, currentBlock: nextBlock, otherDoors, prevDirection: direction });
  //     }
  //   }
  //   console.log('wait')
  //   await Timeout.set(1000);
  //   return await { grid: newGrid, otherDoors };
  // }

  renderGrid = () => {
    return this.state.grid.map((y, indexY) => {
      return <div key={indexY} className="grid-row">
        {this.state.grid[indexY].map((x, indexX) => {
          return <Block key={`${indexX}`}{...x} />
        })}
      </div>
    })
  }

  render () {
    return <div className="Generator">
      <header>Auto Generated Dungeons</header>
      <button onClick={this.init}>Generate</button>
      <div className="grid-container">
        {this.renderGrid()}
      </div>
    </div>
  }
}

export default Generator