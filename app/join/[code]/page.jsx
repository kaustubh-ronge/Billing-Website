"use client";
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';
import { Users, CheckCircle, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function JoinPage() {
  const { code } = useParams();
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const [status, setStatus] = useState('idle'); // idle | joining | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.push(`/sign-up?redirect_url=/join/${code}`);
      return;
    }
    // Auto-join once authenticated
    joinShop();
  }, [isLoaded, isSignedIn]);

  const joinShop = async () => {
    setStatus('joining');
    try {
      const res = await fetch('/api/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: code }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('success');
        setMessage(data.shopName);
        toast.success(`Joined ${data.shopName}!`);
        setTimeout(() => router.push('/dashboard'), 2500);
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to join team');
        toast.error(data.error || 'Failed to join team');
      }
    } catch {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  };

  if (!isLoaded || status === 'joining') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          </div>
          <p className="text-sm font-semibold text-gray-600">Joining your team…</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4 max-w-sm mx-auto px-4">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
            <CheckCircle className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="text-xl font-black text-gray-900">You're in!</h1>
          <p className="text-sm text-gray-500">You've joined <strong>{message}</strong>. Redirecting to your dashboard…</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4 max-w-sm mx-auto px-4">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50">
            <Users className="h-8 w-8 text-rose-600" />
          </div>
          <h1 className="text-xl font-black text-gray-900">Could not join team</h1>
          <p className="text-sm text-rose-600 font-medium">{message}</p>
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:underline">
            Go to Dashboard <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
