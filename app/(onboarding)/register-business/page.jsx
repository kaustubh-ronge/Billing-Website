import { submitRegistration } from "@/actions/registration";
import { checkUser } from "@/lib/checkUser";
import { redirect } from "next/navigation";
import { Building2, ArrowRight, FileText, Phone, MapPin } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default async function RegisterBusinessPage() {
  const user = await checkUser();

  // If somehow they got here but shouldn't be here, redirect them
  if (!user) redirect("/sign-in");
  if (user.systemRole === "ADMIN") redirect("/admin");
  if (user.registrationRequest && user.registrationRequest.status === "PENDING") redirect("/pending-approval");
  if (user.shopId) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Subtle background gradient */}
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
              1
            </div>
            <span className="text-sm font-medium text-foreground hidden sm:inline">Register</span>
          </div>
          <div className="h-px w-12 bg-border" />
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-bold">
              2
            </div>
            <span className="text-sm font-medium text-muted-foreground hidden sm:inline">Review</span>
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

      {/* Header */}
      <div className="w-full max-w-lg text-center mb-6">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
          <Building2 className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Register Your Business
        </h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
          Tell us about your business to get started. Our team will review your application and get you up and running.
        </p>
      </div>

      {/* Registration Form Card */}
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-base">Business Details</CardTitle>
          <CardDescription>
            Fields marked with <span className="text-destructive">*</span> are required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={submitRegistration} className="space-y-5">
            {/* Business Name */}
            <div className="space-y-2">
              <Label htmlFor="businessName" className="text-sm font-medium text-foreground">
                Business Name <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="businessName"
                  name="businessName"
                  type="text"
                  required
                  className="pl-9 h-10"
                  placeholder="e.g. Acme Trading Co."
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Your registered business or trade name.
              </p>
            </div>

            {/* Tax ID */}
            <div className="space-y-2">
              <Label htmlFor="taxId" className="text-sm font-medium text-foreground">
                Tax ID / GSTIN
              </Label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="taxId"
                  name="taxId"
                  type="text"
                  className="pl-9 h-10"
                  placeholder="e.g. 22AAAAA0000A1Z5"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Optional. Your GST Identification Number or Tax ID.
              </p>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium text-foreground">
                Business Phone
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  className="pl-9 h-10"
                  placeholder="e.g. +91 98765 43210"
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm font-medium text-foreground">
                Business Address
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Textarea
                  id="address"
                  name="address"
                  rows={3}
                  className="pl-9 min-h-[80px]"
                  placeholder="Street, City, State, PIN Code"
                />
              </div>
            </div>

            {/* Submit */}
            <Button type="submit" className="w-full h-10 gap-2 mt-2" size="lg">
              Submit Application
              <ArrowRight className="h-4 w-4" />
            </Button>

            <p className="text-xs text-center text-muted-foreground pt-1">
              By submitting, you agree to our platform terms. Your application will be reviewed within 24-48 hours.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
