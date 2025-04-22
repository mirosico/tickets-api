export const getTimeLeft = (reservedUntil: Date) => {
  const now = Date.now();
  const reservedUntilTime = new Date(reservedUntil).getTime();
  return Math.max(0, Math.floor((reservedUntilTime - now) / 1000));
};
