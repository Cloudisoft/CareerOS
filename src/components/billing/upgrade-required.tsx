import Link from "next/link";
import { Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function UpgradeRequired({ feature }: { feature: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
        <Lock className="h-8 w-8 text-primary" />
        <p className="font-medium text-foreground">{feature} requires a Career OS plan</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Upgrade to unlock this feature along with AI resume tools, Auto Apply, and more.
        </p>
        <Button asChild className="mt-2">
          <Link href="/pricing">View plans</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
