import React, { useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { Spinner } from '@/components/shared';

const DisconnectComponent = () => {
  useEffect(() => {
    signOut({ callbackUrl: '/login' });
  }, []);

  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <Spinner size="large" show={true} />
    </div>
  );
};

export default DisconnectComponent;
