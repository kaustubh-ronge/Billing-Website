import { db } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle, XCircle, Building2, User, Mail, Phone, MapPin, FileText, CalendarDays } from "lucide-react";
import { approveRequest, rejectRequest } from "@/actions/admin-requests";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default async function RequestDetailPage({ params }) {
  const { id } = await params;
  
  const req = await db.registrationRequest.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!req) notFound();

  const isPending = req.status === "PENDING";

  const businessFields = [
    { label: "Business Name", value: req.businessName, icon: Building2, required: true },
    { label: "Tax ID / GSTIN", value: req.taxId, icon: FileText },
    { label: "Phone", value: req.phone, icon: Phone },
    { label: "Address", value: req.address, icon: MapPin },
  ];

  const applicantFields = [
    { label: "Full Name", value: req.user.name, icon: User },
    { label: "Email Address", value: req.user.email, icon: Mail },
    { label: "Submitted On", value: new Date(req.createdAt).toLocaleString("en-IN", {
      year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
    }), icon: CalendarDays },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back Link */}
      <Button variant="ghost" size="sm" asChild>
        <Link href="/admin/requests" className="gap-1.5 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Queue
        </Link>
      </Button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Application Review
          </h1>
          <p className="text-sm text-muted-foreground">
            {req.businessName} · submitted by {req.user.name}
          </p>
        </div>
        <Badge
          variant={
            req.status === "PENDING" ? "secondary" :
            req.status === "APPROVED" ? "default" :
            "destructive"
          }
          className="px-3 py-1 self-start sm:self-auto"
        >
          {req.status}
        </Badge>
      </div>

      {/* Business Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Business Details</CardTitle>
          <CardDescription>Information provided by the applicant.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {businessFields.map((field, index) => (
            <div key={field.label}>
              {index > 0 && <Separator className="mb-4" />}
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0">
                  <field.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{field.label}</p>
                  <p className="text-sm text-foreground mt-0.5">
                    {field.value || (
                      <span className="text-muted-foreground italic">Not provided</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Applicant Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Applicant Profile</CardTitle>
          <CardDescription>User account information from Clerk.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {applicantFields.map((field, index) => (
            <div key={field.label}>
              {index > 0 && <Separator className="mb-4" />}
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0">
                  <field.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{field.label}</p>
                  <p className="text-sm text-foreground mt-0.5">{field.value}</p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Actions */}
      {isPending && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
              <form action={async () => {
                "use server";
                await rejectRequest(req.id);
              }}>
                <Button variant="destructive" className="w-full sm:w-auto gap-2">
                  <XCircle className="h-4 w-4" />
                  Reject Application
                </Button>
              </form>

              <form action={async () => {
                "use server";
                await approveRequest(req.id);
              }}>
                <Button className="w-full sm:w-auto gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Generate Shop ID & Approve
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
