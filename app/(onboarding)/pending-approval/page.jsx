import { checkUser } from "@/lib/checkUser";
import { redirect } from "next/navigation";
import { Clock, XCircle, Building2, CalendarDays, AlertCircle } from "lucide-react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default async function PendingApprovalPage() {
  const user = await checkUser();

  if (!user) redirect("/sign-in");
  if (user.systemRole === "ADMIN") redirect("/admin");
  if (user.shopId) redirect("/dashboard");
  if (!user.registrationRequest) redirect("/register-business");

  const req = user.registrationRequest;
  const isPending = req.status === "PENDING";

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,hsl(var(--primary)/0.08),transparent)]" />

      {/* Sign out button */}
      <div className="fixed top-4 right-4 z-50">
        <UserButton afterSignOutUrl="/" />
      </div>

      {/* Progress indicator */}
      <div className="w-full max-w-lg mb-8">
        <div className="flex items-center justify-center gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
              ✓
            </div>
            <span className="text-sm font-medium text-foreground hidden sm:inline">Register</span>
          </div>
          <div className="h-px w-12 bg-primary" />
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold animate-pulse">
              2
            </div>
            <span className="text-sm font-medium text-foreground hidden sm:inline">Review</span>
          </div>
          <div className="h-px w-12 bg-border" />
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-bold">
              3
            </div>
            <span className="text-sm font-medium text-muted-foreground hidden sm:inline">Activate</span>
          </div>
        </div>
      </div>

      {/* Status Icon & Headline */}
      <div className="w-full max-w-lg text-center mb-6">
        <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
          isPending
            ? "bg-amber-500/10 ring-1 ring-amber-500/20"
            : "bg-destructive/10 ring-1 ring-destructive/20"
        }`}>
          {isPending ? (
            <Clock className="h-8 w-8 text-amber-500" />
          ) : (
            <XCircle className="h-8 w-8 text-destructive" />
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          {isPending ? "Application Under Review" : "Application Not Approved"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
          {isPending
            ? "Your business registration is currently being reviewed. We'll update your status within 24-48 hours."
            : "Unfortunately, your application was not approved. Please contact our support team for more details."}
        </p>
      </div>

      {/* Details Card */}
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-base">Application Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Business Name</p>
                <p className="text-sm font-medium text-foreground">{req.businessName}</p>
              </div>
            </div>
            <Badge variant={isPending ? "secondary" : "destructive"}>
              {req.status}
            </Badge>
          </div>

          <Separator />

          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Submitted On</p>
              <p className="text-sm font-medium text-foreground">
                {new Date(req.createdAt).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          {!isPending && (
            <>
              <Separator />
              <div className="rounded-lg bg-destructive/5 border border-destructive/10 p-3 flex items-start gap-3">
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                <p className="text-xs text-destructive">
                  If you believe this was a mistake, please reach out to our support team with your application details.
                </p>
              </div>
            </>
          )}

          <div className="pt-2">
            <Button variant="outline" className="w-full" asChild>
              <Link href="/">Return to Homepage</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
