"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";

export function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full h-10 gap-2 mt-2" size="lg" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Submitting...
        </>
      ) : (
        <>
          Submit Application
          <ArrowRight className="h-4 w-4" />
        </>
      )}
    </Button>
  );
}
