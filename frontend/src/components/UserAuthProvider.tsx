'use client';

import { useUserAuth } from '@/hooks/useUserAuth';

export function UserAuthProvider() {
  useUserAuth();
  return null;
}
