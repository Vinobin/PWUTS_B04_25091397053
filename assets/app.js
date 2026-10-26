"use strict";

const main = document.querySelector("#main");
const currency = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
const money = (n) => currency.format(n);
let menus = [];
let cart = {};
let category = "Semua";
let navigation = 0;
let toastTimer;

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

try {
  const stored = JSON.parse(localStorage.getItem("kantinkita-cart-bintang"));
  if (stored && typeof stored === "object" && !Array.isArray(stored)) cart = stored;
} catch { cart = {}; }

function saveCart() {
  try { localStorage.setItem("kantinkita-cart-bintang", JSON.stringify(cart)); } catch (err) { console.warn("LocalStorage tidak tersedia:", err); }
  updateBadge();
}

function updateBadge() {
  const count = Object.values(cart).reduce((sum, qty) => sum + (Number(qty) || 0), 0);
  const badge = document.querySelector("#cart-count");
  const inline = document.querySelector("#cart-inline-count");
  if (badge) badge.textContent = count;
  if (inline) inline.textContent = count;
}

function notify(message) {
  const box = document.querySelector("#toast");
  if (!box) return;
  box.textContent = message;
  box.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { box.hidden = true; }, 2600);
}

function items() {
  return menus.filter((m) => cart[m.id_menu]).map((m) => ({ ...m, jumlah: cart[m.id_menu] }));
}

function total() {
  return items().reduce((sum, m) => sum + Number(m.harga) * m.jumlah, 0);
}

function card(m) {
  return `<article class="card">
    <img src="${escapeHTML(m.gambar)}" alt="Ilustrasi ${escapeHTML(m.nama_menu)}" loading="lazy">
    <div class="card-body">
      <div class="tag"><span>${escapeHTML(m.kategori)}</span><span>${m.stok > 0 ? `Stok ${m.stok}` : "Habis"}</span></div>
      <h3>${escapeHTML(m.nama_menu)}</h3><p>${escapeHTML(m.deskripsi)}</p>
      <div class="card-bottom"><strong>${money(m.harga)}</strong>
        <button type="button" class="add" data-add="${m.id_menu}" ${m.stok <= 0 || (cart[m.id_menu] || 0) >= m.stok ? "disabled" : ""}>
          ${m.stok <= 0 ? "Habis" : (cart[m.id_menu] || 0) >= m.stok ? "Maks. stok" : "+ Tambah"}
        </button>
      </div>
    </div>
  </article>`;
}

function renderMenu() {
  const search = main.querySelector("#search");
  const sort = main.querySelector("#sort");
  const listEl = main.querySelector("#menu-list");
  const resultEl = main.querySelector("#result-count");
  if (!search || !sort || !listEl || !resultEl) return;
  const q = search.value.trim().toLocaleLowerCase("id");
  const filtered = menus.filter((m) => (category === "Semua" || category === m.kategori) &&
    (m.nama_menu + " " + m.deskripsi).toLocaleLowerCase("id").includes(q));
  if (sort.value === "low") filtered.sort((a, b) => a.harga - b.harga);
  if (sort.value === "high") filtered.sort((a, b) => b.harga - a.harga);
  resultEl.textContent = `${filtered.length} menu ditemukan`;
  listEl.innerHTML = filtered.length ? filtered.map(card).join("") :
    '<p class="empty-results">Menu tidak ditemukan, Coba kategori atau kata kunci lain</p>';
}

function renderCart() {
  const box = main.querySelector("#cart");
  if (!box) return;
  const current = items();
  if (!current.length) {
    box.innerHTML = '<p class="cart-empty">Keranjang masih kosong<br>Pilih menu favoritmu terlebih dahulu</p>';
    return;
  }
  box.innerHTML = current.map((m) => `<div class="cart-line">
    <div><b>${escapeHTML(m.nama_menu)}</b><span>${money(m.harga * m.jumlah)}</span></div>
    <div class="quantity">
      <button type="button" data-change="${m.id_menu}" data-delta="-1" aria-label="Kurangi ${escapeHTML(m.nama_menu)}">−</button>
      <span aria-label="Jumlah pesanan">${m.jumlah}</span>
      <button type="button" data-change="${m.id_menu}" data-delta="1" aria-label="Tambah ${escapeHTML(m.nama_menu)}" ${m.jumlah >= m.stok ? "disabled" : ""}>+</button>
      <button type="button" class="remove" data-remove="${m.id_menu}" aria-label="Hapus ${escapeHTML(m.nama_menu)}">Hapus</button>
    </div></div>`).join("") + `<div class="total"><b>Total</b><b>${money(total())}</b></div>`;
}

function change(id, delta) {
  const menu = menus.find((m) => m.id_menu === id);
  if (!menu) return;
  const quantity = (cart[id] || 0) + delta;
  if (quantity > menu.stok) { notify("Jumlah sudah mencapai stok yang tersedia"); return; }
  if (quantity <= 0) delete cart[id];
  else cart[id] = quantity;
  saveCart();
  renderCart();
  if (main.querySelector("#menu-list")) renderMenu();
  if (main.querySelector("#favorites")) main.querySelector("#favorites").innerHTML = menus.slice(0, 3).map(card).join("");
}

async function route() {
  const seq = ++navigation;
  const hash = location.hash.slice(1);
  const page = ["beranda", "menu", "pesan"].includes(hash) ? hash : "beranda";
  main.setAttribute("aria-busy", "true");
  try {
    const res = await fetch(`pages/${page}.html`, { cache: "no-store" });
    if (!res.ok) throw new Error(`File pages/${page}.html tidak ditemukan (HTTP ${res.status}).`);
    const html = await res.text();
    if (seq !== navigation) return;
    main.innerHTML = html;
    document.querySelectorAll(".navigation a").forEach((link) => {
      if (link.hash === `#${page}`) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    document.title = ({ beranda: "Beranda", menu: "Menu Kantin", pesan: "Pemesanan" })[page] + " • KantinKita";
    if (page === "beranda") {
      const favorites = main.querySelector("#favorites");
      if (favorites) favorites.innerHTML = menus.slice(0, 3).map(card).join("");
    }
    if (page === "menu") {
      category = "Semua";
      renderMenu();
      main.querySelector("#search")?.addEventListener("input", renderMenu);
      main.querySelector("#sort")?.addEventListener("change", renderMenu);
    }
    if (page === "pesan") {
      main.querySelector("#order-form")?.addEventListener("submit", submitOrder);
      ["nama", "email", "jenis_pengguna", "metode_pembayaran", "catatan", "setuju"].forEach((id) => {
        const field = document.getElementById(id);
        if (field && document.getElementById(`${id}-error`)) field.setAttribute("aria-describedby", `${id}-error`);
      });
    }
    updateBadge();
    renderCart();
    window.scrollTo(0, 0);
  } catch (err) {
    if (seq !== navigation) return;
    console.error(err);
    main.innerHTML = `<div class="notice"><h2>Halaman belum bisa dibuka.</h2><p id="load-error"></p><button type="button" id="retry" class="button">Coba lagi</button></div>`;
    main.querySelector("#load-error").textContent = err.message;
    main.querySelector("#retry").addEventListener("click", route);
  } finally { if (seq === navigation) main.removeAttribute("aria-busy"); }
}

main.addEventListener("click", (event) => {
  const btn = event.target.closest("button");
  if (!btn || btn.disabled) return;
  if (btn.dataset.add) {
    const id = Number(btn.dataset.add);
    const before = cart[id] || 0;
    change(id, 1);
    if ((cart[id] || 0) > before) notify("Menu ditambahkan ke keranjang");
  }
  if (btn.dataset.change) change(Number(btn.dataset.change), Number(btn.dataset.delta));
  if (btn.dataset.remove) {
    delete cart[Number(btn.dataset.remove)];
    saveCart(); renderCart();
    if (main.querySelector("#menu-list")) renderMenu();
  }
  if (btn.dataset.category) {
    category = btn.dataset.category;
    main.querySelectorAll("[data-category]").forEach((chip) => {
      chip.classList.toggle("selected", chip === btn);
      chip.setAttribute("aria-pressed", String(chip === btn));
    });
    renderMenu();
  }
});

function setError(id, text) {
  const field = document.getElementById(id);
  const errorEl = document.getElementById(`${id}-error`);
  if (field) field.setAttribute("aria-invalid", String(Boolean(text)));
  if (errorEl) errorEl.textContent = text;
}

function showReceipt(data, selected, result) {
  const receipt = main.querySelector("#receipt");
  if (!receipt) return;
  receipt.replaceChildren();
  function node(tag, className, text, parent = receipt) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    el.textContent = text;
    parent.append(el);
    return el;
  }
  node("p", "receipt-eyebrow", "BUKTI PEMESANAN KANTINKITA");
  node("h2", "", "Terima kasih, " + data.nama + "!");
  node("p", "receipt-code", result.kode);
  const grid = node("div", "receipt-grid", "");
  [
    ["Nama pemesan", data.nama],
    ["Email", data.email],
    ["Kategori pengguna", data.jenis_pengguna],
    ["Metode pembayaran", ({ tunai: "Tunai di kantin", transfer: "Transfer bank", qris: "QRIS" })[data.metode_pembayaran]],
    ["Status pesanan", "Menunggu"],
    ["Catatan pesanan", data.catatan || "Tidak ada catatan"],
  ].forEach(([label, value]) => {
    const item = node("div", "receipt-info", "", grid);
    node("small", "", label, item);
    node("strong", "", value, item);
  });
  const lines = node("div", "receipt-items", "");
  selected.forEach((m) => {
    const row = node("div", "receipt-row", "", lines);
    node("span", "", m.nama_menu + " × " + m.jumlah, row);
    node("strong", "", money(m.harga * m.jumlah), row);
  });
  const totalRow = node("div", "receipt-total", "");
  node("span", "", "Total pembayaran", totalRow);
  node("span", "", money(result.total), totalRow);
  const back = document.createElement("a");
  back.href = "#menu"; back.className = "button"; back.textContent = "Pesan menu lainnya →";
  receipt.append(back);
  receipt.hidden = false;
  receipt.focus({ preventScroll: true });
  receipt.scrollIntoView({ behavior: "smooth", block: "start" });
}

function submitOrder(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const message = main.querySelector("#form-message");
  if (!message) return;
  message.textContent = "";

  const data = Object.fromEntries(new FormData(form).entries());
  data.nama = (data.nama || "").trim();
  data.email = (data.email || "").trim();
  data.catatan = (data.catatan || "").trim();

  const checks = [
    ["nama", data.nama.length < 2 || data.nama.length > 100, "Nama harus terdiri dari 2–100 karakter"],
    ["email", !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) || data.email.length > 150, "Masukkan email yang valid (maks. 150 karakter)"],
    ["jenis_pengguna", !["Mahasiswa", "Dosen", "Staf", "Satpam", "Lainnya"].includes(data.jenis_pengguna), "Pilih kategori pengguna"],
    ["metode_pembayaran", !["tunai", "transfer", "qris"].includes(data.metode_pembayaran), "Pilih metode pembayaran"],
    ["catatan", data.catatan.length > 200, "Catatan maksimal 200 karakter."],
    ["setuju", !form.querySelector("#setuju")?.checked, "Centang persetujuan sebelum memesan"],
  ];
  let first = "";
  for (const [id, bad, text] of checks) {
    setError(id, bad ? text : "");
    if (bad && !first) first = id;
  }

  const selected = items();
  if (!selected.length) {
    message.textContent = "Keranjang masih kosong, Pilih makanan atau minuman terlebih dahulu";
  }
  if (first) {
    document.getElementById(first)?.focus();
    return;
  }
  if (!selected.length) {
    message.scrollIntoView({ block: "center" });
    return;
  }

  const result = {
    kode: "KK-" + Date.now().toString(36).toUpperCase(),
    total: total(),
  };
  cart = {};
  saveCart();
  renderCart();
  showReceipt(data, selected, result);
  form.reset();
  notify("Simulasi pemesanan berhasil, Lihat bukti contoh di bawah");
}

async function init() {
  if (!main) return;
  try {
   
    const res = await fetch("assets/menu.json", { cache: "no-store" });
    if (!res.ok) throw new Error("Data menu gagal dimuat. Periksa assets/menu.json");
    menus = await res.json();
    if (!Array.isArray(menus)) throw new Error("Format menu.json harus berupa array");
    menus = menus.map((m) => ({
      ...m,
      id_menu: Number(m.id_menu),
      harga: Number(m.harga),
      stok: Number(m.stok),
    }));

    const clean = {};
    for (const m of menus) {
      const qty = cart[m.id_menu];
      if (Number.isInteger(qty) && qty > 0 && m.stok > 0) {
        clean[m.id_menu] = Math.min(qty, m.stok);
      }
    }
    cart = clean;
    saveCart();
    window.addEventListener("hashchange", route);
    await route();
  } catch (err) {
    console.error(err);
    main.innerHTML = '<div class="notice"><h2>Data menu gagal dimuat.</h2><p id="init-error"></p><p>Jalankan website melalui localhost (Apache XAMPP aktif) agar fitur AJAX berfungsi.</p></div>';
    main.querySelector("#init-error").textContent = err.message;
  }
}

init();
