export const handleUsageTimeStart = ({ socket, module }) => {
  const emitUsageTimeStart = () => {
    socket.emit("usage-time-start", {
      module,
      socketId: socket.id,
    });
  };

  if (socket.connected) {
    emitUsageTimeStart();
  } else {
    socket.once("connect", emitUsageTimeStart); // use `.once` to avoid duplicate listeners
  }
};


export const handleUsageTimeEnd = ({ socket, module }) => {
  if (socket?.connected) {
    socket.emit("usage-time-end", {
      module,
      socketId: socket.id,
    });
  }
};
