// Roteiro E2E: simula uma corrida completa entre passageiro@celeri.app e motorista@celeri.app.
// Uso: bun scripts/e2e-ride.ts   (lê VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY do .env)
import { createClient } from "@supabase/supabase-js";

const URL = process.env.VITE_SUPABASE_URL!;
const KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;
const PASSWORD = process.env.E2E_PASSWORD ?? "M0Suprem3";
const opts = { auth: { persistSession: false, autoRefreshToken: false } };

let failures = 0;
function check(label: string, ok: boolean, extra?: unknown) {
  console.log(`${ok ? "✅" : "❌"} ${label}`, extra !== undefined && !ok ? extra : "");
  if (!ok) failures++;
}
async function login(email: string) {
  const c = createClient(URL, KEY, opts);
  const { data, error } = await c.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw new Error(`Login ${email}: ${error.message}`);
  return { c, uid: data.user.id };
}

const pax = await login("passageiro@celeri.app");
const drv = await login("motorista@celeri.app");
check("Login passageiro e motorista", true);

// 1. Motorista online perto do centro de Montes Claros
const { data: driver } = await drv.c.from("drivers").select("*").eq("user_id", drv.uid).single();
check("Perfil de motorista aprovado", !!driver?.is_approved, driver);
const up = await drv.c.from("drivers")
  .update({ status: "available", location_lat: -16.7300, location_lng: -43.8600, rest_until: null })
  .eq("id", driver!.id);
check("Motorista fica disponível", !up.error, up.error);

// 2. Passageiro solicita corrida
const { data: ride, error: rErr } = await pax.c.from("rides").insert({
  passenger_id: pax.uid,
  origin_address: "Praça Dr. Carlos (E2E)", origin_lat: -16.7286, origin_lng: -43.8582,
  destination_address: "Montes Claros Shopping (E2E)", destination_lat: -16.7180, destination_lng: -43.8700,
  estimated_distance_km: 2.4, estimated_duration_min: 6, estimated_price: 9.5, status: "REQUESTED",
}).select().single();
check("Corrida solicitada", !!ride, rErr);
if (!ride) process.exit(1);

// 3. Matching oferece ao motorista
const offer = await pax.c.rpc("offer_ride_to_next_driver", { _ride_id: ride.id });
check("Oferta enviada ao motorista", (offer.data as any)?.driver_id === driver!.id, offer);

// 4. Motorista aceita
const acc = await drv.c.rpc("accept_offered_ride", { _ride_id: ride.id });
check("Motorista aceitou", (acc.data as any)?.ok === true, acc);

// 5. Avanço de status pelo motorista
for (const status of ["ARRIVING", "ARRIVED", "IN_PROGRESS"] as const) {
  const patch: any = { status };
  if (status === "IN_PROGRESS") patch.started_at = new Date().toISOString();
  const r = await drv.c.from("rides").update(patch).eq("id", ride.id).select("status").single();
  check(`Status → ${status}`, r.data?.status === status, r.error);
  const seen = await pax.c.from("rides").select("status").eq("id", ride.id).single();
  check(`  passageiro vê ${status}`, seen.data?.status === status, seen.error);
}

// 6. Conclusão + pagamento (fluxo do app do passageiro)
const finalPrice = 9.5;
const done = await pax.c.from("rides")
  .update({ status: "COMPLETED", final_price: finalPrice, completed_at: new Date().toISOString() })
  .eq("id", ride.id).select("status").single();
check("Corrida concluída", done.data?.status === "COMPLETED", done.error);

const { data: drvWalletBefore } = await drv.c.from("wallets").select("balance").eq("user_id", drv.uid).single();
const pay = await pax.c.rpc("process_ride_payment", {
  _ride_id: ride.id, _passenger_id: pax.uid, _driver_id: driver!.id, _amount: finalPrice,
});
check("Repasse para a carteira do motorista", pay.data === true, pay.error);
const payment = await pax.c.from("payments").insert({
  ride_id: ride.id, user_id: pax.uid, amount: finalPrice, method: "cash", status: "completed",
});
check("Pagamento registrado", !payment.error, payment.error);
const { data: drvWalletAfter } = await drv.c.from("wallets").select("balance").eq("user_id", drv.uid).single();
const gained = Number(drvWalletAfter?.balance ?? 0) - Number(drvWalletBefore?.balance ?? 0);
check(`Motorista recebeu R$ ${gained.toFixed(2)} líquido`, gained > 0 && gained <= finalPrice);

// 7. Avaliação
const rate = await pax.c.from("ratings").insert({
  ride_id: ride.id, from_user_id: pax.uid, to_user_id: drv.uid, score: 5, comment: "Pilotagem segura (E2E)",
});
check("Avaliação 5★ registrada", !rate.error, rate.error);

// 8. Motorista liberado
await drv.c.from("drivers").update({ status: "unavailable" }).eq("id", driver!.id);

console.log(`\nCorrida de teste: ${ride.id}`);
console.log(failures ? `❌ ${failures} falha(s)` : "🎉 Roteiro completo sem falhas");
process.exit(failures ? 1 : 0);
