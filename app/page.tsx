import { IdentityGate } from "@/components/identity-gate";
import { PartnerPairing } from "@/components/partner-pairing";
import { SpaceBubbleApp } from "@/components/space-bubble-app";

export default function Home() {
  return (
    <IdentityGate>
      <SpaceBubbleApp />
      <PartnerPairing />
    </IdentityGate>
  );
}
