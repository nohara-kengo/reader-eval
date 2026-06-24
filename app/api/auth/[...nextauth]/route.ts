import { handlers } from "@/lib/auth";

// Auth.js の route handler。ロジックは持たず handlers に委譲する（app.md / service-layer.md）。
export const { GET, POST } = handlers;
