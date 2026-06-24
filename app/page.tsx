import { HealthCheck } from "@/features/health/components/HealthCheck";

export default function Home() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-bold">reader-eval</h1>
      <p className="mt-2 text-gray-600">リーダー研修 評価システム（Next.js フルスタック）</p>
      <HealthCheck />
    </main>
  );
}
