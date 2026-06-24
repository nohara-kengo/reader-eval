"use client";

import { useEffect, useState } from "react";
import { fetchHealth } from "@/lib/health/client";

// フロント（UI）↔ バックエンド（/api/health route handler）の疎通状態
type ConnectionState = "loading" | "ok" | "error";

// 同一 Next.js アプリ内の API route handler を呼び出し、疎通状態を画面に表示する。
// フロントとバックエンドが疎通できていることの確認用コンポーネント。
export function HealthCheck() {
  const [state, setState] = useState<ConnectionState>("loading");
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    // アンマウント後の状態更新を防ぐためのフラグ
    let active = true;

    fetchHealth()
      .then((health) => {
        if (!active) return;
        setStatus(health.status);
        setState("ok");
      })
      .catch(() => {
        if (!active) return;
        setState("error");
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="mt-6 rounded-md border border-gray-200 p-4">
      <h2 className="text-sm font-semibold text-gray-700">バックエンド疎通確認（/api/health）</h2>
      {state === "loading" && <p className="mt-1 text-sm text-gray-500">確認中…</p>}
      {state === "ok" && <p className="mt-1 text-sm text-green-700">疎通 OK（status: {status}）</p>}
      {state === "error" && (
        <p className="mt-1 text-sm text-red-700">バックエンドへの疎通に失敗しました</p>
      )}
    </section>
  );
}
