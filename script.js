// ===== Variabel & tipe data =====
const KEY = "inventaris_perangkat";
const URL_JSON = "data/devices.json";
let devices = [];        // array of object
let editId = null;       // null = mode tambah, angka = mode edit
let sedangEdit = false;  // boolean: true kalau form dalam mode edit

// ===== Elemen DOM =====
const form = document.getElementById("form-perangkat");
const inNama = document.getElementById("nama");
const inKategori = document.getElementById("kategori");
const inLokasi = document.getElementById("lokasi");
const inKondisi = document.getElementById("kondisi");
const btnSimpan = document.getElementById("btn-simpan");
const btnBatal = document.getElementById("btn-batal");
const btnReset = document.getElementById("btn-reset");
const btnHapusSemua = document.getElementById("btn-hapus-semua");
const judulForm = document.getElementById("judul-form");
const pesan = document.getElementById("pesan");
const cari = document.getElementById("cari");
const fKategori = document.getElementById("filter-kategori");
const fKondisi = document.getElementById("filter-kondisi");
const tabelBody = document.getElementById("tabel-body");
const kosong = document.getElementById("kosong");

// ===== Custom event: dipicu tiap data berubah =====
const eventDataBerubah = new Event("data-berubah");

// ===== localStorage =====
function simpanData() {
  localStorage.setItem(KEY, JSON.stringify(devices));
  document.dispatchEvent(eventDataBerubah);
}

// ===== AJAX: ambil data awal dari JSON dengan fetch() =====
async function ambilDataAwal() {
  try {
    const response = await fetch(URL_JSON);
    if (!response.ok) throw new Error("Status " + response.status);
    devices = await response.json();
    simpanData();
  } catch (error) {
    devices = [];
    tampilPesan("Gagal memuat JSON. Jalankan lewat Live Server! (" + error.message + ")", false);
    document.dispatchEvent(eventDataBerubah);
  }
}

async function mulai() {
  const tersimpan = localStorage.getItem(KEY);
  if (tersimpan !== null) {
    devices = JSON.parse(tersimpan);
    document.dispatchEvent(eventDataBerubah);
  } else {
    await ambilDataAwal();
  }
}

// ===== Fungsi bantu =====
function tampilPesan(teks, sukses) {
  pesan.textContent = teks;
  pesan.className = sukses ? "ok" : "";
}

function idBaru() {
  let max = 0;
  for (let i = 0; i < devices.length; i++) {
    if (devices[i].id > max) max = devices[i].id;
  }
  return max + 1;
}

// ===== Dashboard (perulangan, operator, Math) =====
function hitungDashboard() {
  let baik = 0;
  let rusak = 0;
  for (const d of devices) {
    if (d.kondisi === "Baik") {
      baik++;
    } else {
      rusak++;
    }
  }
  const total = devices.length;
  const persen = total > 0 ? Math.round((baik / total) * 100) : 0;

  document.getElementById("total").textContent = total;
  document.getElementById("baik").textContent = baik;
  document.getElementById("rusak").textContent = rusak;
  document.getElementById("persen").textContent = persen + "%";
}

// ===== Tampilkan tabel (DOM) + pencarian & filter =====
function tampilTabel() {
  const kata = cari.value.toLowerCase().trim();
  const hasil = devices.filter(function (d) {
    const cocokKata = d.nama.toLowerCase().includes(kata) || d.kategori.toLowerCase().includes(kata);
    const cocokKategori = fKategori.value === "" || d.kategori === fKategori.value;
    const cocokKondisi = fKondisi.value === "" || d.kondisi === fKondisi.value;
    return cocokKata && cocokKategori && cocokKondisi;
  });

  tabelBody.innerHTML = "";
  hasil.forEach(function (d, index) {
    const tr = document.createElement("tr");
    const kolom = [index + 1, d.nama, d.kategori, d.lokasi];
    kolom.forEach(function (isi) {
      const td = document.createElement("td");
      td.textContent = isi;
      tr.appendChild(td);
    });

    const tdKondisi = document.createElement("td");
    const badge = document.createElement("span");
    badge.className = "badge " + d.kondisi;
    badge.textContent = d.kondisi;
    tdKondisi.appendChild(badge);
    tr.appendChild(tdKondisi);

    const tdAksi = document.createElement("td");
    tdAksi.innerHTML =
      '<button class="btn-edit" data-aksi="edit" data-id="' + d.id + '">Edit</button> ' +
      '<button class="btn-hapus" data-aksi="hapus" data-id="' + d.id + '">Hapus</button>';
    tr.appendChild(tdAksi);

    tabelBody.appendChild(tr);
  });

  kosong.hidden = hasil.length > 0;
}

// ===== Mode form =====
function keModeTambah() {
  editId = null;
  sedangEdit = false;
  form.reset();
  judulForm.textContent = "Tambah Perangkat";
  btnSimpan.textContent = "Simpan";
  btnBatal.hidden = true;
}

// ===== EVENT =====
// Custom event -> perbarui tampilan
document.addEventListener("data-berubah", function () {
  hitungDashboard();
  tampilTabel();
});

// Submit form: tambah / edit
form.addEventListener("submit", function (e) {
  e.preventDefault();
  const nama = inNama.value.trim();
  const lokasi = inLokasi.value.trim();

  if (nama === "" || lokasi === "" || inKategori.value === "") {
    tampilPesan("Semua kolom wajib diisi!", false);
    return;
  }

  if (editId === null) {
    devices.push({ id: idBaru(), nama: nama, kategori: inKategori.value, lokasi: lokasi, kondisi: inKondisi.value });
    tampilPesan("Perangkat berhasil ditambahkan.", true);
  } else {
    for (let i = 0; i < devices.length; i++) {
      if (devices[i].id === editId) {
        devices[i].nama = nama;
        devices[i].kategori = inKategori.value;
        devices[i].lokasi = lokasi;
        devices[i].kondisi = inKondisi.value;
      }
    }
    tampilPesan("Perangkat berhasil diubah.", true);
  }
  simpanData();
  keModeTambah();
});

btnBatal.addEventListener("click", function () {
  keModeTambah();
  tampilPesan("", true);
});

// Klik tombol Edit / Hapus (event delegation)
tabelBody.addEventListener("click", function (e) {
  const aksi = e.target.dataset.aksi;
  if (!aksi) return;
  const id = Number(e.target.dataset.id);

  if (aksi === "hapus") {
    if (confirm("Yakin hapus perangkat ini?")) {
      devices = devices.filter(function (d) { return d.id !== id; });
      simpanData();
      tampilPesan("Perangkat dihapus.", true);
    }
  } else if (aksi === "edit") {
    const d = devices.find(function (item) { return item.id === id; });
    inNama.value = d.nama;
    inKategori.value = d.kategori;
    inLokasi.value = d.lokasi;
    inKondisi.value = d.kondisi;
    editId = id;
    sedangEdit = true;
    judulForm.textContent = "Edit Perangkat";
    btnSimpan.textContent = "Update";
    btnBatal.hidden = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
});

// Pencarian & filter
cari.addEventListener("keyup", tampilTabel);
fKategori.addEventListener("change", tampilTabel);
fKondisi.addEventListener("change", tampilTabel);

// Reset ke data awal JSON
btnReset.addEventListener("click", async function () {
  if (confirm("Kembalikan ke data awal dari JSON? Data sekarang akan hilang.")) {
    await ambilDataAwal();
    tampilPesan("Data dikembalikan ke data awal.", true);
  }
});

// Hapus semua perangkat
btnHapusSemua.addEventListener("click", function () {
  if (devices.length === 0) {
    tampilPesan("Tidak ada data untuk dihapus.", false);
    return;
  }
  if (confirm("Yakin hapus SEMUA " + devices.length + " perangkat? Tindakan ini tidak bisa dibatalkan.")) {
    devices = [];
    simpanData();
    keModeTambah();
    tampilPesan("Semua perangkat berhasil dihapus.", true);
  }
});

mulai();
