import React from 'react';
import clsx from 'clsx';

const Block = props => {
  const { type, direction, doorDirection, hasDoor, x, y, roomNumber, prevDirection, walls } = props;
  let bendName = null;
  if (prevDirection && direction)
    bendName = `${prevDirection}-${direction}`

  const renderCorners = () => {
    let corners = []
    if (walls.includes('up') && walls.includes('left'))
      corners.push('up-left');
    if (walls.includes('up') && walls.includes('right'))
      corners.push('up-right');
    if (walls.includes('down') && walls.includes('left'))
      corners.push('down-left');
    if (walls.includes('down') && walls.includes('right'))
      corners.push('down-right');
    return corners.map(c => {
      return <div className={`corner ${c}`}></div>
    })
  }

  return (
    <div className={clsx("Block", doorDirection, type, bendName, `room-${roomNumber}`, { hasDoor, bend: (prevDirection !== direction) })}>
      {!type &&
        <span className="numberPlaceholder">
          {x}-{y}
        </span>
      }
      {walls && walls.map(direction => {
        return <div key={direction} className={`wall ${direction}`}></div>
      })}
      {walls && walls.length > 1 && renderCorners()}
    </div>
  );
}

export default Block;