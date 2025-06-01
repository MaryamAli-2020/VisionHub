import { Logo } from "@/components/ui/logo";

export function SignInScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center max-w-md w-full space-y-8">
        <Logo size="lg" />
        {/* ...existing code... */}
      </div>
    </div>
  );
}