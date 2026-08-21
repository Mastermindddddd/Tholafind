import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper paper-texture px-5 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-brick">
            Start your first hunt
          </p>
          <h1 className="mt-2 font-display text-2xl font-semibold text-ink">
            Create your Tholafind account
          </h1>
        </div>
        <SignUp
          appearance={{
            elements: {
              card: 'shadow-card border border-line',
              formButtonPrimary: 'bg-pine hover:bg-pineDeep text-paper',
            },
          }}
        />
      </div>
    </div>
  );
}
