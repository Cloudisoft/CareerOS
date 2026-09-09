"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");

  if (status === "success") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
          <CheckCircle2 className="h-8 w-8 text-success" />
          <p className="font-medium text-foreground">Email verified</p>
          <p className="text-sm text-muted-foreground">Your account is now fully active.</p>
          <Button asChild className="mt-2">
            <Link href="/dashboard">Go to dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (status === "invalid") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
          <XCircle className="h-8 w-8 text-destructive" />
          <p className="font-medium text-foreground">This link is invalid or expired</p>
          <p className="text-sm text-muted-foreground">
            Verification links expire after 24 hours. Log in and request a new one from your
            account settings.
          </p>
          <Button asChild variant="secondary" className="mt-2">
            <Link href="/login">Back to log in</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
        <p className="font-medium text-foreground">Check your inbox</p>
        <p className="text-sm text-muted-foreground">
          We've sent a verification link to your email address.
        </p>
      </CardContent>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
