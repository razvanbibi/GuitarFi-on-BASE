export default function MaintenancePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6">
      <div className="max-w-lg text-center">
        <h1 className="text-4xl font-bold text-white">
          🚧 Under Maintenance
        </h1>

        <p className="mt-6 text-lg text-white/70">
          GuitarFi is currently undergoing an important update.
          We'll be back online soon with new improvements.
        </p>

        <p className="mt-3 text-white/50">
          Thank you for your patience and support.
        </p>
      </div>
    </main>
  );
}