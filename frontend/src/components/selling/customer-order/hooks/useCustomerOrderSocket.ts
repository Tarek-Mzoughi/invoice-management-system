import React from 'react';
import useSocket from '@/hooks/useSocket';
import { toast } from 'sonner';
import { SocketRoom } from '@/types/enums/socket-room';
import { ResponseSequenceDto, Sequences } from '@/types';
import { useSequence } from '@/hooks/content/useSequence';
import { useTranslation } from 'react-i18next';

const useCustomerOrderSocket = (
  label: Sequences = Sequences.CUSTOMER_ORDER,
  enableRealtime: boolean = true,
  enabled: boolean = true
) => {
  const { t } = useTranslation('common');
  const { sequence, isSequencePending, refetchSequence } = useSequence({
    label,
    enabled
  });

  const [currentSequence, setCurrentSequence] = React.useState<Partial<ResponseSequenceDto> | null>(
    null
  );
  const hasJoinedRef = React.useRef(false);

  const socket = useSocket('/ws', enabled && enableRealtime);

  React.useEffect(() => {
    if (!enabled) {
      setCurrentSequence(null);
      return;
    }
    if (sequence) {
      setCurrentSequence(sequence);
    }
  }, [enabled, sequence]);

  React.useEffect(() => {
    if (!enabled || !enableRealtime) return;
    if (!socket) return;

    const handleConnect = () => {
      if (!hasJoinedRef.current) {
        socket.emit('joinRoom', SocketRoom.CUSTOMER_ORDER);
        hasJoinedRef.current = true;
      }
    };

    if (socket.connected) {
      handleConnect();
    } else {
      socket.on('connect', handleConnect);
    }

    socket.on('customerOrder-sequence-updated', (data) => {
      setCurrentSequence((prevSequence) =>
        prevSequence ? { ...prevSequence, next: data.value } : { next: data.value }
      );
      toast.info(t('notifications.sequence_updated'));
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      toast.error(t('notifications.socket_connection_error'));
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from the WebSocket server');
      hasJoinedRef.current = false;
    });

    return () => {
      if (socket && hasJoinedRef.current) {
        socket.emit('leaveRoom', SocketRoom.CUSTOMER_ORDER);
        console.log('Left room: CUSTOMER_ORDER_SEQUENCE');
        hasJoinedRef.current = false;
      }

      socket.off('connect', handleConnect);
      socket.off('customerOrder-sequence-updated');
      socket.off('connect_error');
      socket.off('disconnect');
    };
  }, [enabled, enableRealtime, socket, t]);

  return {
    currentSequence,
    isSequencePending,
    refetchSequence
  };
};

export default useCustomerOrderSocket;
