// Check for M1 (issue #1): SMS login rules from SPEC 4.4.
import { beforeEach, describe, expect, it } from "vitest";
import { query } from "@/lib/db";
import { requestCode, userForToken, verifyCode } from "@/lib/auth-core";
import { sentSms } from "@/lib/sms";
import { demoBuilding, lastCode, phone, reset } from "./helpers";

describe("M1 login", () => {
  beforeEach(reset);

  it("an invited resident logs in with the SMS code and gets their own apartment", async () => {
    const d = await demoBuilding();
    expect(await requestCode(d.r1.phone)).toBe("sent");
    const code = lastCode(d.r1.phone);
    expect(code).toMatch(/^\d{6}$/);
    const token = await verifyCode(d.r1.phone, code);
    expect(token).toBeTruthy();
    const user = await userForToken(token!);
    expect(user).toMatchObject({ kind: "resident", apartmentId: d.apt1, buildingId: d.buildingId, floor: 1 });
  });

  it("stores only a hash of the code", async () => {
    const d = await demoBuilding();
    await requestCode(d.r0.phone);
    const [row] = await query<{ code_hash: string }>("SELECT code_hash FROM login_codes");
    expect(row.code_hash).not.toContain(lastCode(d.r0.phone));
  });

  it("a code can be used only once", async () => {
    const d = await demoBuilding();
    await requestCode(d.r0.phone);
    const code = lastCode(d.r0.phone);
    expect(await verifyCode(d.r0.phone, code)).toBeTruthy();
    expect(await verifyCode(d.r0.phone, code)).toBeNull();
  });

  it("locks the code after 5 wrong attempts, even if the right code comes next", async () => {
    const d = await demoBuilding();
    await requestCode(d.r0.phone);
    const code = lastCode(d.r0.phone);
    const wrong = code === "000000" ? "111111" : "000000";
    for (let i = 0; i < 5; i++) expect(await verifyCode(d.r0.phone, wrong)).toBeNull();
    expect(await verifyCode(d.r0.phone, code)).toBeNull();
  });

  it("an expired code does not work", async () => {
    const d = await demoBuilding();
    await requestCode(d.r0.phone);
    await query("UPDATE login_codes SET expires_at = now() - interval '1 second'");
    expect(await verifyCode(d.r0.phone, lastCode(d.r0.phone))).toBeNull();
  });

  it("sends nothing to an unknown number", async () => {
    expect(await requestCode(phone())).toBe("unknown");
    expect(sentSms).toHaveLength(0);
  });

  it("waits 60 s between codes and sends at most 3 per 15 minutes", async () => {
    const d = await demoBuilding();
    expect(await requestCode(d.r0.phone)).toBe("sent");
    expect(await requestCode(d.r0.phone)).toBe("too_soon");
    await query("UPDATE login_codes SET created_at = now() - interval '2 minutes'");
    expect(await requestCode(d.r0.phone)).toBe("sent");
    await query("UPDATE login_codes SET created_at = now() - interval '2 minutes'");
    expect(await requestCode(d.r0.phone)).toBe("sent");
    await query("UPDATE login_codes SET created_at = now() - interval '2 minutes'");
    expect(await requestCode(d.r0.phone)).toBe("rate_limited");
    expect(sentSms).toHaveLength(3);
  });

  it("a removed (moved-out) resident can not log in", async () => {
    const d = await demoBuilding();
    await query("UPDATE residents SET removed_at = now() WHERE id = $1", [d.r0.id]);
    expect(await requestCode(d.r0.phone)).toBe("unknown");
  });
});
