import { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export default function StripeRootProvider({ children }: Props) {
  return <>{children}</>;
}
