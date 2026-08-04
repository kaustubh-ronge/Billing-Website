import { db } from "@/lib/prisma";
import Link from "next/link";
import { ArrowRight, Building2, Clock, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function RegistrationQueuePage({ searchParams }) {
  const params = await searchParams;
  const page = parseInt(params?.page || "1");
  const limit = 10;
  const skip = (page - 1) * limit;

  const [requests, total] = await Promise.all([
    db.registrationRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: true },
      skip,
      take: limit,
    }),
    db.registrationRequest.count(),
  ]);

  const totalPages = Math.ceil(total / limit);

  // We can also count totals for badges separately
  const [pendingCount, approvedCount, rejectedCount] = await Promise.all([
    db.registrationRequest.count({ where: { status: "PENDING" } }),
    db.registrationRequest.count({ where: { status: "APPROVED" } }),
    db.registrationRequest.count({ where: { status: "REJECTED" } }),
  ]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Registration Queue</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review and manage business registration applications.
          </p>
        </div>
      </div>

      {/* Summary Badges */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary" className="gap-1.5 px-3 py-1">
          <span className="text-foreground font-semibold">{requests.length}</span> Total
        </Badge>
        <Badge variant="secondary" className="gap-1.5 px-3 py-1">
          <span className="h-2 w-2 rounded-full bg-amber-500 inline-block" />
          <span className="text-foreground font-semibold">{pendingCount}</span> Pending
        </Badge>
        <Badge variant="secondary" className="gap-1.5 px-3 py-1">
          <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
          <span className="text-foreground font-semibold">{approvedCount}</span> Approved
        </Badge>
        <Badge variant="secondary" className="gap-1.5 px-3 py-1">
          <span className="h-2 w-2 rounded-full bg-red-500 inline-block" />
          <span className="text-foreground font-semibold">{rejectedCount}</span> Rejected
        </Badge>
      </div>

      {/* Table Card */}
      <Card>
        <CardContent className="p-0">
          {requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-4">
                <Clock className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-base font-medium text-foreground">No registration requests</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                When new businesses register on the platform, their applications will appear here for your review.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business</TableHead>
                  <TableHead>Applicant</TableHead>
                  <TableHead className="hidden sm:table-cell">Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg bg-muted shrink-0">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <span className="font-medium text-foreground">{req.businessName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm text-foreground">{req.user?.name}</p>
                        <p className="text-xs text-muted-foreground">{req.user?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        req.status === "PENDING" ? "secondary" :
                        req.status === "APPROVED" ? "default" :
                        "destructive"
                      }>
                        {req.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/requests/${req.id}`} className="gap-1">
                          Review <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-border">
              <span className="text-[11px] text-muted-foreground font-sans">Page {page} of {totalPages}</span>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  asChild={page > 1}
                  className="rounded-xl px-3 text-xs gap-1 font-bold"
                >
                  {page > 1 ? (
                    <Link href={`/admin/requests?page=${page - 1}`}>
                      Prev
                    </Link>
                  ) : (
                    <span>Prev</span>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  asChild={page < totalPages}
                  className="rounded-xl px-3 text-xs gap-1 font-bold"
                >
                  {page < totalPages ? (
                    <Link href={`/admin/requests?page=${page + 1}`}>
                      Next
                    </Link>
                  ) : (
                    <span>Next</span>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
