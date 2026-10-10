import React, { useMemo, useState } from "react";
import site from "./data/site.json";
import catalogue from "./data/products.json";
import Hero from "./components/Hero";
import GlassNav from "./components/GlassNav";
import Reveal from "./components/Reveal";
import Modal from "./components/Modal";
import Blobs from "./components/Blobs";
import { waLink, money } from "./lib/whatsapp";

const items = catalogue.items;
const wa = (text) => waLink(site.contact.whatsapp, text);
const priceText = (p) =>
  p.price === null || p.price === undefined
    ? site.currency.fallback
    : `${money(p.price, site.currency.symbol)} ${site.currency.priceNote || ""}`.trim();

// Department tree built from the products, in the order they first appear.
function buildTree(list) {
  const tree = new Map();
  list.forEach((p) => {
    if (!tree.has(p.category)) tree.set(p.category, new Set());
    if (p.subcategory) tree.get(p.category).add(p.subcategory);
  });
  return tree;
}

export default function App() {
  const [cat, setCat] = useState("All");
  const [sub, setSub] = useState(null);
  const [q, setQ] = useState("");
  const [quote, setQuote] = useState({});
  const [showQuote, setShowQuote] = useState(false);

  const tree = useMemo(() => buildTree(items), []);
  const needle = q.trim().toLowerCase();
  const shown = items.filter(
    (p) =>
      (cat === "All" || p.category === cat) &&
      (!sub || p.subcategory === sub) &&
      (!needle || `${p.name} ${p.sku} ${p.description || ""}`.toLowerCase().includes(needle))
  );

  const setQty = (id, n) =>
    setQuote((prev) => {
      const next = { ...prev };
      if (n <= 0) delete next[id];
      else next[id] = n;
      return next;
    });

  const ids = Object.keys(quote).filter((id) => items.some((p) => p.id === id));
  const total = ids.reduce((n, id) => n + quote[id], 0);
  const lines = ids.map((id) => ({ p: items.find((x) => x.id === id), qty: quote[id] }));
  const quoteText = `${site.quote.intro}\n${lines.map(({ p, qty }) => `- ${qty} x ${p.name} (SKU ${p.sku}, ${p.unit})`).join("\n")}\n${site.quote.outro}`;
  const countText = `${shown.length} ${shown.length === 1 ? "product" : "products"}`;

  return (
    <>
      <Blobs />
      <GlassNav site={site} links={site.nav.links} cta={site.nav.cta} message={site.nav.message} />
      <Hero site={site}>
        <a className="btn" href="#shop">{site.hero.primaryCta}</a>
        <a className="btn glass-dark" href={wa(site.bulk.message)} target="_blank" rel="noopener noreferrer">{site.hero.secondaryCta}</a>
      </Hero>

      <main className="max-w-6xl mx-auto">
        <Reveal as="section" id="shop" className="px-4 md:px-6 pt-14 pb-12 flex flex-col gap-5">
          <div className="glass rounded-[28px] p-3.5">
            <label htmlFor="q" className="sr-only">{site.shop.searchLabel}</label>
            <input
              id="q"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={site.shop.searchPlaceholder}
              className="w-full min-w-0 rounded-full px-5 py-3.5 text-base border border-white/90 bg-white/70 text-ink"
            />
          </div>

          <div className="flex flex-wrap gap-6 items-start">
            <aside className="glass rounded-3xl p-3.5 flex flex-col gap-1.5 flex-[0_1_250px] min-w-[200px]">
              <span className="mono text-xs tracking-wider uppercase text-muted px-1.5 py-1">{site.shop.departmentsLabel}</span>
              {["All", ...tree.keys()].map((c) => (
                <div key={c} className="flex flex-col gap-1">
                  <button
                    type="button"
                    className="dept text-left min-h-[46px] px-3.5 rounded-2xl font-semibold flex justify-between items-center"
                    aria-pressed={cat === c && !sub}
                    onClick={() => { setCat(c); setSub(null); }}
                  >
                    <span>{c === "All" ? site.shop.allLabel : c}</span>
                    <span className="mono text-xs">{c === "All" ? items.length : items.filter((p) => p.category === c).length}</span>
                  </button>
                  {cat === c && c !== "All" ? (
                    <div className="flex flex-col gap-0.5 pl-3">
                      {[...tree.get(c)].map((s) => (
                        <button
                          key={s}
                          type="button"
                          className="sub text-left min-h-[40px] px-3 rounded-[10px] text-sm font-medium text-muted"
                          aria-pressed={sub === s}
                          onClick={() => { setCat(c); setSub(s); }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </aside>

            <div className="flex-[3_1_520px] min-w-0 flex flex-col gap-2.5">
              <div className="flex flex-wrap justify-between gap-2">
                <span className="font-semibold" aria-live="polite">{countText}</span>
                <span className="text-[13px] text-muted">{site.shop.stockNote}</span>
              </div>
              {shown.map((p, i) => {
                const n = quote[p.id] || 0;
                return (
                  <Reveal key={p.id} delay={Math.min(i, 5) * 40} className="row glass rounded-[20px] px-[18px] py-3.5 flex flex-wrap gap-x-[18px] gap-y-2.5 items-center">
                    <div className="flex-[2_1_240px] min-w-0 flex flex-col gap-1">
                      <span className="mono text-xs text-muted">SKU {p.sku}</span>
                      <span className="font-semibold text-[17px]">{p.name}</span>
                      <span className="text-sm text-muted">{p.description}</span>
                    </div>
                    <div className="flex-[1_1_100px] min-w-0 flex flex-col gap-1">
                      <span className="font-display font-bold text-2xl">{priceText(p)}</span>
                      <span className="text-[13px] text-muted">{p.unit}</span>
                    </div>
                    <span className={`st-${p.stock} text-xs font-semibold px-3 py-1 rounded-full`}>{site.stock[p.stock] || p.stock}</span>
                    <button
                      type="button"
                      className="chip min-h-[46px] px-[18px] font-semibold text-sm"
                      style={n ? { borderColor: "var(--accent)", background: "rgba(232,89,12,.18)" } : undefined}
                      onClick={() => setQty(p.id, n + 1)}
                    >
                      {n ? `${site.shop.addedLabel} (${n})` : site.shop.addLabel}
                    </button>
                  </Reveal>
                );
              })}
              {shown.length === 0 ? (
                <div className="glass rounded-3xl p-9 text-center text-muted">
                  <p className="mb-4">{site.shop.emptyText}</p>
                  <a className="btn" href={wa(site.shop.emptyMessage + q)} target="_blank" rel="noopener noreferrer">{site.shop.emptyCta}</a>
                </div>
              ) : null}
            </div>
          </div>
        </Reveal>

        <Reveal as="section" id="bulk" className="glass mx-4 mb-5 rounded-[36px] px-7 py-10 flex flex-wrap gap-5 items-center justify-between" style={{ background: "rgba(232,89,12,.14)" }}>
          <div className="flex-[1_1_320px] min-w-0">
            <h2 className="text-4xl font-extrabold mb-1.5">{site.bulk.title}</h2>
            <p className="max-w-[50ch] leading-relaxed text-muted">{site.bulk.text}</p>
          </div>
          <a className="btn btn-dark" href={wa(site.bulk.message)} target="_blank" rel="noopener noreferrer">{site.bulk.cta}</a>
        </Reveal>

        <section id="delivery" className="px-4 pb-6 grid gap-4 md:grid-cols-2">
          {site.delivery.cards.map((c, i) => (
            <Reveal key={c.title} delay={i * 80} className="glass rounded-[28px] p-7 flex flex-col gap-3 items-start">
              <h2 className="text-3xl font-extrabold">{c.title}</h2>
              <p className="leading-relaxed text-muted">{c.text}</p>
              <a className="btn btn-ghost" href={wa(c.message)} target="_blank" rel="noopener noreferrer">{c.cta}</a>
            </Reveal>
          ))}
        </section>
      </main>

      <footer className="max-w-6xl mx-auto px-6 pt-4 pb-24 text-[13px] text-muted flex flex-wrap gap-x-6 gap-y-2 justify-between">
        <span>{site.footer.text}</span>
        <span>{site.business.sampleNotice} {site.footer.credit}</span>
      </footer>

      {total > 0 && !showQuote ? (
        <div className="glass fixed left-4 right-4 bottom-4 z-40 max-w-[560px] mx-auto rounded-full py-2.5 pl-6 pr-3 flex flex-wrap gap-x-4 gap-y-2 items-center justify-between" style={{ background: "rgba(255,255,255,.75)" }}>
          <span className="font-semibold">{total} {site.quote.barSuffix}</span>
          <button type="button" className="btn" onClick={() => setShowQuote(true)}>{site.quote.review}</button>
        </div>
      ) : null}

      <Modal open={showQuote} onClose={() => setShowQuote(false)} label={site.quote.title}>
        <div className="flex flex-col gap-3.5">
          <h3 className="text-3xl font-extrabold">{site.quote.title}</h3>
          {ids.length === 0 ? <p className="text-muted">{site.quote.empty}</p> : null}
          {lines.map(({ p, qty }) => (
            <div key={p.id} className="flex flex-wrap gap-x-4 gap-y-2 items-center pb-3 border-b border-black/10">
              <div className="flex-[1_1_220px] min-w-0">
                <div className="mono text-xs text-muted">SKU {p.sku}</div>
                <div className="font-semibold">{p.name}</div>
                <div className="text-[13px] text-muted">{p.unit}</div>
              </div>
              <div className="flex items-center gap-1.5">
                <button type="button" className="round" aria-label={`Fewer ${p.name}`} onClick={() => setQty(p.id, qty - 1)}>-</button>
                <span className="min-w-[36px] text-center font-semibold">{qty}</span>
                <button type="button" className="round" aria-label={`More ${p.name}`} onClick={() => setQty(p.id, qty + 1)}>+</button>
              </div>
              <button type="button" className="chip min-h-[44px] px-3.5 font-semibold" onClick={() => setQty(p.id, 0)}>Remove</button>
            </div>
          ))}
          {ids.length > 0 ? (
            <a className="btn" href={wa(quoteText)} target="_blank" rel="noopener noreferrer">{site.quote.send}</a>
          ) : null}
          <span className="text-[13px] text-muted">{site.quote.note}</span>
        </div>
      </Modal>
    </>
  );
}
