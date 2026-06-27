import { db } from "@/lib/prisma";
import { Building2, Clock, Users, TrendingUp, ArrowRight, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function AdminDashboard() {
  const [pendingCount, approvedCount, rejectedCount, totalOrgs, totalUsers, recentRequests] = await Promise.all([
    db.registrationRequest.count({ where: { status: "PENDING" } }),
    db.registrationRequest.count({ where: { status: "APPROVED" } }),
    db.registrationRequest.count({ where: { status: "REJECTED" } }),
    db.shop.count(),
    db.user.count(),
    db.registrationRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { user: true },
    }),
  ]);

  const stats = [
    {
      label: "Pending Approvals",
      value: pendingCount,
      icon: Clock,
      description: "Awaiting review",
      accent: pendingCount > 0 ? "text-amber-500" : "text-muted-foreground",
      bgAccent: pendingCount > 0 ? "bg-amber-500/10" : "bg-muted",
    },
    {
      label: "Active Organizations",
      value: totalOrgs,
      icon: Building2,
      description: "Approved businesses",
      accent: "text-emerald-500",
      bgAccent: "bg-emerald-500/10",
    },
    {
      label: "Total Users",
      value: totalUsers,
      icon: Users,
      description: "Registered accounts",
      accent: "text-primary",
      bgAccent: "bg-primary/10",
    },
    {
      label: "Approved",
      value: approvedCount,
      icon: CheckCircle,
      description: "Total approved",
      accent: "text-emerald-500",
      bgAccent: "bg-emerald-500/10",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Platform Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monitor registrations, manage organizations, and review applications.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-1">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bgAccent}`}>
                  <stat.icon className={`h-5 w-5 ${stat.accent}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Applications</CardTitle>
            <CardDescription>Latest business registration requests.</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/requests" className="gap-1.5">
              View All <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">No applications yet</p>
              <p className="text-xs text-muted-foreground mt-1">New business applications will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentRequests.map((req) => (
                <Link
                  key={req.id}
                  href={`/admin/requests/${req.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{req.businessName}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {req.user?.name} · {new Date(req.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={
                      req.status === "PENDING" ? "secondary" :
                      req.status === "APPROVED" ? "default" :
                      "destructive"
                    }>
                      {req.status}
                    </Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
