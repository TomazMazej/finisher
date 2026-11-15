<script lang="ts">
  // Skrbniški pregled naročil: iskanje po emailu, kopiranje povezave, email kupcu prek mailto.
  interface Order {
    id: string;
    status: string;
    provider: string | null;
    email: string | null;
    lang: string;
    ref_code: string | null;
    amount_cents: number | null;
    currency: string | null;
    created_at: string;
    paid_at: string | null;
    distanceKm: number | null;
    raceDate: string | null;
    url: string;
  }
  interface Ref {
    ref_code: string;
    sales: number;
    cents: number;
  }

  let key = $state("");
  let q = $state("");
  let orders = $state<Order[]>([]);
  let refs = $state<Ref[]>([]);
  let error = $state("");
  let loading = $state(false);
  let copiedId = $state("");
  try {
    key = localStorage.getItem("adminKey") ?? "";
  } catch {}

  const RACE: Record<string, string> = { "10": "10 km", "21.0975": "polmaraton", "42.195": "maraton" };
  const race = (o: Order) => (o.distanceKm ? (RACE[String(o.distanceKm)] ?? `${o.distanceKm} km`) : "?");
  const money = (c: number | null, cur: string | null) =>
    c == null ? "" : `${(c / 100).toFixed(2).replace(".", ",")} ${(cur ?? "eur").toUpperCase()}`;
  const when = (iso: string | null) => (iso ? iso.slice(0, 16).replace("T", " ") : "");

  function mailto(o: Order) {
    const sl = o.lang !== "en";
    const subject = sl ? `Tvoj Finisher načrt: ${race(o)}` : `Your Finisher plan`;
    const body = sl
      ? `Živijo,\n\ntukaj je povezava do tvojega načrta (${race(o)}, ${o.raceDate ?? ""}):\n${o.url}\n\nShrani si jo, z njo prideš do načrta na kateri koli napravi.\n\nLep tek!\nTomaž, Finisher`
      : `Hi,\n\nhere is the link to your plan (${o.raceDate ?? ""}):\n${o.url}\n\nKeep it, it opens your plan on any device.\n\nHappy running!\nTomaž, Finisher`;
    return `mailto:${encodeURIComponent(o.email ?? "")}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  async function search() {
    if (!key.trim()) return;
    loading = true;
    error = "";
    try {
      const res = await fetch(`/api/admin/orders?q=${encodeURIComponent(q.trim())}`, {
        headers: { authorization: `Bearer ${key.trim()}` },
        cache: "no-store",
      });
      const body = (await res.json()) as { ok: boolean; orders?: Order[]; refs?: Ref[]; error?: string };
      if (!body.ok) {
        error = body.error === "UNAUTHORIZED" ? "Napačen ključ." : body.error === "ADMIN_DISABLED" ? "ADMIN_KEY ni nastavljen v Cloudflare." : "Napaka.";
        orders = [];
        return;
      }
      try {
        localStorage.setItem("adminKey", key.trim());
      } catch {}
      orders = body.orders ?? [];
      refs = body.refs ?? [];
    } catch {
      error = "Povezava ni uspela.";
    } finally {
      loading = false;
    }
  }

  async function copy(o: Order) {
    try {
      await navigator.clipboard.writeText(o.url);
      copiedId = o.id;
      setTimeout(() => (copiedId = ""), 2000);
    } catch {}
  }
</script>

<main class="admin">
  <h1>Skrbnik</h1>
  <form onsubmit={(e) => { e.preventDefault(); search(); }}>
    <label>Ključ <input type="password" autocomplete="off" bind:value={key} /></label>
    <label>Email ali ID naročila <input type="search" bind:value={q} placeholder="prazno = zadnjih 50" /></label>
    <button type="submit" disabled={loading || !key.trim()}>{loading ? "Iščem …" : "Išči"}</button>
  </form>
  {#if error}<p class="err" role="alert">{error}</p>{/if}

  {#if refs.length}
    <h2>Prodaja po kodah ustvarjalcev</h2>
    <table>
      <thead><tr><th>Koda</th><th>Prodaj</th><th>Znesek</th></tr></thead>
      <tbody>
        {#each refs as r}<tr><td>{r.ref_code}</td><td>{r.sales}</td><td>{money(r.cents, "eur")}</td></tr>{/each}
      </tbody>
    </table>
  {/if}

  {#if orders.length}
    <h2>Naročila ({orders.length})</h2>
    <ul class="orders">
      {#each orders as o (o.id)}
        <li class:paid={o.status === "paid"}>
          <div class="row1">
            <b>{o.email ?? "brez emaila"}</b>
            <span class="tag">{o.status}{o.provider ? ` · ${o.provider}` : ""}</span>
          </div>
          <div class="meta">
            {race(o)}, tekma {o.raceDate ?? "?"} · ustvarjeno {when(o.created_at)}{o.paid_at ? ` · plačano ${when(o.paid_at)}` : ""}
            {o.amount_cents != null ? ` · ${money(o.amount_cents, o.currency)}` : ""}{o.ref_code ? ` · koda ${o.ref_code}` : ""}
          </div>
          <div class="actions">
            <button type="button" onclick={() => copy(o)}>{copiedId === o.id ? "Kopirano" : "Kopiraj povezavo"}</button>
            {#if o.email}<a href={mailto(o)}>Pošlji email</a>{/if}
            <a href={o.url} target="_blank" rel="noopener noreferrer">Odpri</a>
          </div>
        </li>
      {/each}
    </ul>
  {:else if !loading && !error}
    <p class="muted">Vpiši ključ in klikni Išči.</p>
  {/if}
</main>

<style>
  .admin {
    max-width: 52rem;
    margin: 0 auto;
    padding: 1.25rem;
  }
  h1 {
    font: 800 2.4rem/1 var(--display);
  }
  form {
    display: grid;
    grid-template-columns: 1fr 1.5fr auto;
    gap: 0.75rem;
    align-items: end;
  }
  @media (max-width: 640px) {
    form {
      grid-template-columns: 1fr;
    }
  }
  label {
    display: grid;
    gap: 0.25rem;
    font-weight: 700;
  }
  input,
  button,
  .actions a {
    min-height: 44px;
    padding: 0 0.75rem;
    border: 2px solid var(--line);
    border-radius: var(--r-ui);
    background: var(--surface);
    color: var(--ink);
    font: inherit;
  }
  button {
    cursor: pointer;
    font-weight: 700;
  }
  form button {
    background: var(--bib-blue);
    border-color: var(--bib-blue);
    color: var(--bib-blue-ink);
  }
  .err {
    color: var(--amber);
    font-weight: 700;
  }
  table {
    border-collapse: collapse;
    margin-bottom: 1rem;
  }
  th,
  td {
    text-align: left;
    padding: 0.35rem 1rem 0.35rem 0;
    border-bottom: 1px solid var(--line);
  }
  .orders {
    list-style: none;
    padding: 0;
    display: grid;
    gap: 0.6rem;
  }
  .orders li {
    padding: 0.8rem 1rem;
    border: 2px solid var(--line);
    border-radius: var(--r-ui);
    background: var(--surface);
  }
  .orders li.paid {
    border-left: 6px solid var(--bib-blue);
  }
  .row1 {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }
  .tag,
  .meta,
  .muted {
    color: var(--ink-2);
    font-size: 0.9rem;
  }
  .actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-top: 0.5rem;
  }
  .actions a {
    display: inline-flex;
    align-items: center;
    text-decoration: none;
  }
</style>
