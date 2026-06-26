import { describe, expect, it, vi } from "vitest";
import { ConflictError, ValidationError } from "@/lib/shared/errors";
import {
  createOrganization,
  listOrganizations,
  setOrganizationActive,
  type OrganizationsDb,
} from "./organizationsService";

// organization テーブルのみを持つ Prisma クライアントのモックを作る。
function makeDb() {
  const organization = {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };
  return { db: { organization } as unknown as OrganizationsDb, organization };
}

const baseRow = {
  id: 1n,
  code: "PTU",
  name: "PTU部",
  sortOrder: 1,
  isActive: true,
  createdAt: new Date("2026-06-01T00:00:00.000Z"),
};

describe("listOrganizations", () => {
  it("DTO へ整形して返す（id は文字列・createdAt は ISO）", async () => {
    const { db, organization } = makeDb();
    organization.findMany.mockResolvedValue([baseRow]);

    const result = await listOrganizations(db);

    expect(result).toEqual([
      {
        id: "1",
        code: "PTU",
        name: "PTU部",
        sortOrder: 1,
        isActive: true,
        createdAt: "2026-06-01T00:00:00.000Z",
      },
    ]);
  });

  it("有効を先頭に表示順→コード昇順で取得する", async () => {
    const { db, organization } = makeDb();
    organization.findMany.mockResolvedValue([]);

    await listOrganizations(db);

    expect(organization.findMany).toHaveBeenCalledWith({
      orderBy: [{ isActive: "desc" }, { sortOrder: "asc" }, { code: "asc" }],
    });
  });
});

describe("createOrganization", () => {
  it("code・name の前後空白を除去して作成する", async () => {
    const { db, organization } = makeDb();
    organization.findUnique.mockResolvedValue(null);
    organization.create.mockResolvedValue({
      ...baseRow,
      code: "SRU",
      name: "SRU部",
      sortOrder: 2,
    });

    await createOrganization(db, { code: " SRU ", name: " SRU部 ", sortOrder: 2 });

    expect(organization.findUnique).toHaveBeenCalledWith({ where: { code: "SRU" } });
    expect(organization.create).toHaveBeenCalledWith({
      data: { code: "SRU", name: "SRU部", sortOrder: 2 },
    });
  });

  it("表示順未指定のときは 0 で作成する", async () => {
    const { db, organization } = makeDb();
    organization.findUnique.mockResolvedValue(null);
    organization.create.mockResolvedValue({ ...baseRow, sortOrder: 0 });

    await createOrganization(db, { code: "PTU", name: "PTU部" });

    expect(organization.create).toHaveBeenCalledWith({
      data: { code: "PTU", name: "PTU部", sortOrder: 0 },
    });
  });

  it("既に登録済みの組織コードは ConflictError を投げる", async () => {
    const { db, organization } = makeDb();
    organization.findUnique.mockResolvedValue(baseRow);

    await expect(createOrganization(db, { code: "PTU", name: "PTU部" })).rejects.toBeInstanceOf(
      ConflictError,
    );
    expect(organization.create).not.toHaveBeenCalled();
  });

  it("組織コードが空のときは ValidationError を投げる", async () => {
    const { db, organization } = makeDb();

    await expect(createOrganization(db, { code: "   ", name: "PTU部" })).rejects.toBeInstanceOf(
      ValidationError,
    );
    expect(organization.findUnique).not.toHaveBeenCalled();
  });

  it("組織名が空のときは ValidationError を投げる", async () => {
    const { db, organization } = makeDb();

    await expect(createOrganization(db, { code: "PTU", name: "   " })).rejects.toBeInstanceOf(
      ValidationError,
    );
    expect(organization.findUnique).not.toHaveBeenCalled();
  });
});

describe("setOrganizationActive", () => {
  it("id を BigInt に変換して isActive を更新する", async () => {
    const { db, organization } = makeDb();
    organization.update.mockResolvedValue(baseRow);

    await setOrganizationActive(db, "5", false);

    expect(organization.update).toHaveBeenCalledWith({
      where: { id: 5n },
      data: { isActive: false },
    });
  });
});
