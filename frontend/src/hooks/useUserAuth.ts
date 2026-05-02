import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { logger } from '../utils/logger';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

export function useUserAuth() {
  const { address, isConnected } = useAccount();

  useEffect(() => {
    const registerUser = async () => {
      if (!address || !isConnected) return;

      try {
        logger.info('Registering user: '+ address, { component: 'useUserAuth', method: 'useUserAuth' });

        const response = await fetch(`${API_URL}/api/users/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ walletAddress: address }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        
        if (data.isNewUser) {
          logger.success('New user registered! '+ address, { component: 'useUserAuth', method: 'useUserAuth' });
        } else {
          logger.info('User logged in '+ address, { component: 'useUserAuth', method: 'useUserAuth' });
        }
      } catch (error: any) {
        logger.error('Failed to register user error: '+ error.message, { 
          component: 'useUserAuth', 
          method: 'useUserAuth' 
        });
      }
    };

    registerUser();
  }, [address, isConnected]);
}
