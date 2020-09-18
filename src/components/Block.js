import React from 'react';
import clsx from 'clsx';

const Block = props => {
  const { type, direction, doorDirection, hasDoor, x, y, roomNumber, prevDirection } = props;
  let bendName = null;
  if (prevDirection && direction)
    bendName = `${prevDirection}-${direction}`
  return (
    <div className={clsx("Block", doorDirection, type, bendName, `room-${roomNumber}`, { hasDoor, bend: (prevDirection !== direction) })}>
      <span className="room-number">
        {roomNumber}
      </span>
      {!type &&
        <span className="numberPlaceholder">
          {x}-{y}
        </span>
      }
    </div>
  );
}

export default Block;