import React from 'react';
import useSocket from '@/hooks/useSocket';
import { SocketRoom } from '@/types/enums/socket-room';
import { Log } from '@/types';
import { toast } from 'sonner';

const useSocketLogs = () => {
  const [logs, setLogs] = React.useState<Log[]>([]);
  const [isConnected, setIsConnected] = React.useState(true);
  const hasJoinedRef = React.useRef(false);

  const socket = useSocket('/ws');

  React.useEffect(() => {
    if (!socket || !isConnected) return;

    const handleConnect = () => {
      if (!hasJoinedRef.current) {
        socket.emit('joinRoom', SocketRoom.LOGGER);
        console.log('Joined room: LOGGER');
        hasJoinedRef.current = true;
      }
    };

    if (socket.connected) {
      handleConnect();
    } else {
      socket.on('connect', handleConnect);
    }

    socket.on('new-log', (data) => {
      setLogs((prevLogs) => [data, ...prevLogs]);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      toast.error('Erreur de connexion au serveur');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from the WebSocket server');
      hasJoinedRef.current = false;
    });

    return () => {
      if (socket && hasJoinedRef.current) {
        socket.emit('leaveRoom', SocketRoom.LOGGER);
        console.log('Left room: LOGGER');
        hasJoinedRef.current = false;
      }

      socket.off('connect', handleConnect);
      socket.off('new-log');
      socket.off('connect_error');
      socket.off('disconnect');
    };
  }, [socket, isConnected]);

  const toggleConnection = () => {
    if (socket) {
      if (isConnected) {
        socket.disconnect();
        toast.success('Déconnecté du serveur');
      } else {
        socket.connect();
        toast.success('Connecté au serveur');
      }
      setIsConnected((prev) => !prev);
    }
  };

  return {
    logs,
    isConnected,
    toggleConnection
  };
};

export default useSocketLogs;
