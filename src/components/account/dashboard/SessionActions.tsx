'use client';

import { useTransition } from 'react';
import { Loader2, LogOut, MonitorSmartphone } from 'lucide-react';
import { signOut } from '@/actions/auth';
import { signOutEverywhere } from '@/actions/account';
import { useConfirm } from '@/components/ui/ConfirmDialog';

/** "Sign out of this device" + "Sign out of all devices" (confirmed first). */
export function SessionActions() {
  const confirm = useConfirm();
  const [pendingLocal, startLocal] = useTransition();
  const [pendingAll, startAll] = useTransition();

  return (
    <div className="space-y-2.5">
      <button
        type="button"
        disabled={pendingLocal || pendingAll}
        onClick={() => startLocal(() => signOut())}
        className="fb-press flex h-11 w-full items-center justify-center gap-2 rounded-full border-2 border-[#cce2d4] bg-white px-5 text-sm font-bold text-[#112a1d] hover:border-[#1a663b] hover:bg-[#f0f7f2] disabled:opacity-60 cursor-pointer"
      >
        {pendingLocal ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <LogOut className="h-4 w-4" aria-hidden />}
        Sign out of this device
      </button>
      <button
        type="button"
        disabled={pendingLocal || pendingAll}
        onClick={async () => {
          const ok = await confirm({
            title: 'Sign out of all devices?',
            description: 'Every browser and phone signed in to your account — including this one — will be signed out. You’ll need your password to sign back in.',
            confirmLabel: 'Sign out everywhere',
            tone: 'danger',
          });
          if (ok) startAll(() => signOutEverywhere());
        }}
        className="fb-press flex h-11 w-full items-center justify-center gap-2 rounded-full border-2 border-red-200 bg-white px-5 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-60 cursor-pointer"
      >
        {pendingAll ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <MonitorSmartphone className="h-4 w-4" aria-hidden />}
        Sign out of all devices
      </button>
    </div>
  );
}
