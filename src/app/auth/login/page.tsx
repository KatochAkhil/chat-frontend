import { AppProviders } from "@/components/providers/app-providers";
import { LoginScreen } from "@/components/auth/login-screen";

export default function LoginPage() {
  return (
    <AppProviders>
      <LoginScreen />
    </AppProviders>
  );
}
