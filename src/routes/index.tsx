import { createFileRoute } from "@tanstack/react-router";
import DistortionVideo from "@assets/video/green-distortion.mp4";
import CurvyLogo from "@assets/icons/curvy-logo.svg?react";
import Curve from "@assets/icons/curve.svg?react";
import LogInModal from "@/features/authentication/components/LogInModal.tsx";
import { Button } from "@/shared/components/ui/simple/Button.tsx";
import { useEffect, useState } from "react";
import { AnimatePresence } from "motion/react";
import { CONNECT_STEPS } from "@/features/authentication/constants";
import { useAccount } from "@/app/hooks/extWallets/useAccount.ts";
import checkUserDetailsQueryOptions from "@/features/authentication/query/useCheckUserDetailsQuery.ts";
import { useQuery } from "@tanstack/react-query";
import ConnectModal from "@/features/authentication/components/ConnectModal.tsx";
import PasswordModal from "@/features/authentication/components/PasswordModal.tsx";
import { toast } from "sonner";
import { PublicPage } from "@/features/publicPage/components/PublicPage.tsx";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function HomePage() {
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [step, setStep] = useState(CONNECT_STEPS.WALLET);
  const navigate = Route.useNavigate();
  const { queryClient } = Route.useRouteContext();
  const { address, accountDeployed, network } = useAccount();

  const { data } = useQuery(checkUserDetailsQueryOptions(address));

  useEffect(() => {
    if (accountDeployed === false) {
      toast.error("Starknet account is not deployed, please deploy the account before connecting.", {
        id: "starknet-account-deployed",
      });
      return;
    }
    if (loginModalOpen) {
      if (address) {
        queryClient?.fetchQuery(checkUserDetailsQueryOptions(address)).then(({ data }) => {
          if (!data) navigate({ to: "/signup" });
          else {
            setStep(CONNECT_STEPS.PASSWORD);
          }
        });
      } else {
        setStep(CONNECT_STEPS.WALLET);
      }
    }
  }, [address, loginModalOpen, accountDeployed, network]);

  return (
    <>
      <div className={"flex flex-1 items-center py-20"}>
        <div className={"relative hidden flex-3 md:block"}>
          <video
            autoPlay
            loop
            muted
            className={"pointer-events-none object-cover object-left mix-blend-lighten"}
            src={DistortionVideo}
          />
          <div
            className={
              "absolute -inset-0.5 flex items-center justify-center shadow-[0_0_90px_70px_rgb(21,24,30)_inset]"
            }
          >
            <Curve className={"h-3/4"} />
          </div>
        </div>
        <div className={"flex h-full flex-2 flex-col items-center justify-between"}>
          <CurvyLogo className={"max-w-50"} />
          <div className={"text-6xl italic"}>
            <div className={"text-center font-medium md:text-left"}>Own Your Privacy</div>
            <div className={"text-center font-light md:text-left"}>Prove Compliance</div>
          </div>
          <Button
            size={"xl"}
            onClick={() => {
              if (data === undefined) {
                setStep(CONNECT_STEPS.WALLET);
                setLoginModalOpen(true);
                return;
              }

              if (accountDeployed === false) {
                toast.error("Starknet account is not deployed, please deploy the account before connecting.", {
                  id: "starknet-account-deployed",
                });
                return;
              }

              if (data === null) navigate({ to: "/signup" });
              else {
                setStep(CONNECT_STEPS.PASSWORD);
                setLoginModalOpen(true);
              }
            }}
          >
            Connect Wallet
          </Button>
        </div>
      </div>
      <LogInModal open={loginModalOpen} onOpenChange={setLoginModalOpen}>
        <AnimatePresence initial={false} mode={"popLayout"}>
          {step === CONNECT_STEPS.WALLET ? <ConnectModal /> : null}
          {step === CONNECT_STEPS.PASSWORD && data?.handle ? <PasswordModal handle={data?.handle} /> : null}
        </AnimatePresence>
      </LogInModal>
    </>
  );
}

function RouteComponent() {
  const { publicHandle } = Route.useRouteContext();

  return !publicHandle ? <HomePage /> : <PublicPage />;
}
