import { describe, expect, it } from "vitest";
import { entraIssuer, parseAuthEnv, readAuthEnv } from "@/lib/auth/config";

const fullEnv = {
  AZURE_AD_TENANT_ID: "tenant-123",
  AZURE_AD_CLIENT_ID: "client-123",
  AZURE_AD_CLIENT_SECRET: "secret-123",
  AUTH_SECRET: "auth-secret-123",
};

describe("parseAuthEnv", () => {
  it("必須の認証 env が揃っていれば検証済みオブジェクトを返す", () => {
    expect(parseAuthEnv(fullEnv)).toEqual({
      AZURE_AD_TENANT_ID: "tenant-123",
      AZURE_AD_CLIENT_ID: "client-123",
      AZURE_AD_CLIENT_SECRET: "secret-123",
      AUTH_SECRET: "auth-secret-123",
    });
  });

  it("必須の認証 env が欠落していると例外を投げる", () => {
    expect(() => parseAuthEnv({})).toThrow();
  });
});

describe("readAuthEnv", () => {
  it("揃っていれば configured=true を返す", () => {
    expect(readAuthEnv(fullEnv).configured).toBe(true);
  });

  it("欠落していても例外を投げず configured=false を返す", () => {
    expect(readAuthEnv({}).configured).toBe(false);
  });
});

describe("entraIssuer", () => {
  it("テナント ID から v2.0 issuer を組み立てる", () => {
    expect(entraIssuer("tenant-123")).toBe("https://login.microsoftonline.com/tenant-123/v2.0");
  });

  it("テナント ID が無ければ undefined を返す", () => {
    expect(entraIssuer(undefined)).toBeUndefined();
  });
});
