import { AuthGate } from "@/components/auth-gate";
import { PartnerPairing } from "@/components/partner-pairing";
import { SpaceBubbleApp } from "@/components/space-bubble-app";

export default function Home() {
  return (
    <AuthGate>
      <SpaceBubbleApp />
      <PartnerPairing />
    </AuthGate>
  );
}
