import { useStripe } from "@stripe/stripe-react-native";

export function useStripeClient() {
  return useStripe();
}
