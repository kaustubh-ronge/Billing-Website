"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Building2, CheckCircle, Loader2, ArrowRight, ShieldAlert, Mail } from 'lucide-react';

export default function JoinClient({
  token, valid, reason, orgName, roleName, inviteEmail, isOwnerInvite, signedIn, emailMatches,
}) {
  const router = useRouter();
  const [accepting, setAccepting] = useState(false);

  const accept = async () => {
    setAccepting(true);
    try {
      const res = await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Joined ${data.shopName}!`);
        router.push('/dashboard');
      } else {
        toast.error(data.error || 'Could not accept invitation');
        setAccepting(false);
      }
    } catch {
      toast.error('Network error. Please try again.');
      setAccepting(false);
    }
  };

  const Shell = ({ icon: Icon, iconClass, bgClass, title, children }) => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white border border-gray-150 rounded-xl shadow-sm p-8 text-center space-y-5">
        <div className={`inline-flex h-16 w-16 items-center justify-center rounded-lg ${bgClass}`}>
          <Icon className={`h-8 w-8 ${iconClass}`} />
        </div>
        <h1 className="text-xl font-black text-gray-900">{title}</h1>
        {children}
      </div>
    </div>
  );

  if (!valid) {
    const msg = {
      not_found: 'This invitation link is invalid.',
      used: 'This invitation has already been accepted or revoked.',
      expired: 'This invitation has expired. Ask the owner to send a new one.',
    }[reason] || 'This invitation is no longer valid.';
    return (
      <Shell icon={ShieldAlert} iconClass="text-rose-600" bgClass="bg-rose-50" title="Invitation unavailable">
        <p className="text-sm text-gray-500">{msg}</p>
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:underline">
          Go to homepage <ArrowRight className="h-4 w-4" />
        </Link>
      </Shell>
    );
  }

  return (
    <Shell icon={Building2} iconClass="text-blue-600" bgClass="bg-blue-50" title={`Join ${orgName}`}>
      <div className="space-y-1">
        <p className="text-sm text-gray-500">
          You've been invited to join <strong className="text-gray-900">{orgName}</strong>
          {isOwnerInvite ? ' as an Owner' : roleName ? <> as <strong className="text-gray-900">{roleName}</strong></> : ''}.
        </p>
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 bg-gray-100 rounded-md px-3 py-1 mt-2">
          <Mail className="h-3 w-3" /> {inviteEmail}
        </div>
      </div>

      {!signedIn && (
        <div className="space-y-3">
          <p className="text-xs text-gray-400">Create your account using the email above to join automatically.</p>
          <Link
            href={`/sign-up?redirect_url=${encodeURIComponent(`/join/${token}`)}`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 text-white font-bold px-6 py-2.5 text-sm hover:bg-gray-800"
          >
            Sign up to accept <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href={`/sign-in?redirect_url=${encodeURIComponent(`/join/${token}`)}`}
            className="block text-xs font-semibold text-blue-600 hover:underline"
          >
            Already have an account? Sign in
          </Link>
        </div>
      )}

      {signedIn && emailMatches && (
        <button
          onClick={accept}
          disabled={accepting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 text-white font-bold px-6 py-2.5 text-sm hover:bg-emerald-700 disabled:opacity-60"
        >
          {accepting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
          Accept & join
        </button>
      )}

      {signedIn && !emailMatches && (
        <div className="space-y-2">
          <p className="text-xs text-rose-600 font-medium">
            This invitation is for {inviteEmail}, but you're signed in with a different account.
            Sign out and sign in with the invited email to accept.
          </p>
          <Link href="/dashboard" className="text-xs font-semibold text-blue-600 hover:underline">
            Go to my dashboard
          </Link>
        </div>
      )}
    </Shell>
  );
}
