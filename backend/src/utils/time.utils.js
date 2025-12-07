// backend/src/utils/time.utils.js

export function parseDuration(durationString) {
  const value = parseInt(durationString.slice(0, -1), 10);
  const unit = durationString.slice(-1).toLowerCase();

  if (isNaN(value)) {
    throw new Error(`Invalid duration string: ${durationString}`);
  }

  switch (unit) {
    case 's': return value * 1000;
    case 'm': return value * 1000 * 60;
    case 'h': return value * 1000 * 60 * 60;
    case 'd': return value * 1000 * 60 * 60 * 24;
    // Add more units as needed
    default: throw new Error(`Unknown duration unit: ${unit} in ${durationString}`);
  }
}

