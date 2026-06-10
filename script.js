let dataPengeluaran = [];
let targetBulanan = 0;

let grafikKategori = null;
let grafikHarian = null;

let filterBulan = new Date().getMonth() + 1;
let filterTahun = new Date().getFullYear();

let modeEdit = false;
let idEdit = null;
let currentUser = null;

let modeLogin = "admin";
let currentProfile = null;
let daftarProfiles = [];

let cacheSaranPintarAI = {};
let modeDemoPortfolio = false;
let riwayatDeteksiAI = [];

const BACKEND_URL = "https://wbditvqcdynxppquzqig.supabase.co/functions/v1";

function setButtonLoading(button, isLoading, loadingText = "sabar ya sayang") {
  if (!button) return;

  if (isLoading) {
    if (button.disabled) return;

    button.dataset.originalText = button.innerHTML;
    button.disabled = true;
    button.classList.add("btn-loading");
    button.innerHTML = `<span class="btn-spinner"></span>${loadingText}`;
    return;
  }

  button.disabled = false;
  button.classList.remove("btn-loading");

  if (button.id === "btnSimpan") {
    button.innerHTML = modeEdit ? "Update Data" : "Tambah Data";
  } else if (button.dataset.originalText) {
    button.innerHTML = button.dataset.originalText;
  }

  delete button.dataset.originalText;
}

document.addEventListener("DOMContentLoaded", async function () {

  pilihModeLogin("admin");


  setTanggalHariIni();

  aktifkanKategoriOtomatis();
  setFilterBulanIni();
  tampilkanTargetBulanan();
  tampilkanData();
  hitungRingkasan();
  analisisPengeluaran();
  tampilkanGrafikKategori();
  tampilkanRingkasanKategori();
  tampilkanGrafikHarian();

  await cekSessionLogin();

});

async function ambilProfileUser() {
  if (!currentUser) {
    return null;
  }

  const { data, error } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("user_id", currentUser.id)
    .single();

  if (error) {
    return null;
  }

  return data;
}

function userSedangAdmin() {
  return currentProfile &&
    currentProfile.role === "admin" &&
    currentProfile.status === "active";
}

async function cekAksesSetelahLogin() {
  currentProfile = await ambilProfileUser();

  if (!currentProfile) {
    await supabaseClient.auth.signOut();
    currentUser = null;

    tampilkanPopup(
      "Akun ini belum memiliki profil. Hubungi admin.",
      "error"
    );

    tampilkanModeLogout();
    return false;
  }

  if (currentProfile.status !== "active") {
    await supabaseClient.auth.signOut();
    currentUser = null;

    tampilkanPopup(
      "Akun ini sedang dinonaktifkan oleh admin.",
      "error"
    );

    tampilkanModeLogout();
    return false;
  }

  if (modeLogin === "admin" && currentProfile.role !== "admin") {
    await supabaseClient.auth.signOut();
    currentUser = null;

    tampilkanPopup(
      "Login ditolak. Akun ini bukan admin.",
      "error"
    );

    tampilkanModeLogout();
    return false;
  }

  if (modeLogin === "user" && currentProfile.role !== "user") {
    await supabaseClient.auth.signOut();
    currentUser = null;

    tampilkanPopup(
      "Login ditolak. Akun ini bukan user biasa.",
      "error"
    );

    tampilkanModeLogout();
    return false;
  }

  return true;
}

function togglePassword(inputId, button) {
  const input = document.getElementById(inputId);

  if (!input) return;

  const sedangTersembunyi = input.getAttribute("type") === "password";

  if (sedangTersembunyi) {
    input.setAttribute("type", "text");
    button.innerText = "🙈";
    button.classList.add("password-visible");
    button.setAttribute("aria-label", "Sembunyikan password");
  } else {
    input.setAttribute("type", "password");
    button.innerText = "👁";
    button.classList.remove("password-visible");
    button.setAttribute("aria-label", "Tampilkan password");
  }

  input.focus();
}

function setLoginLoading(isLoading) {
  const btnLogin = document.getElementById("btnLogin");
  const btnRegister = document.getElementById("btnRegister");
  const btnModeAdmin = document.getElementById("btnModeAdmin");
  const btnModeUser = document.getElementById("btnModeUser");

  if (!btnLogin) {
    return;
  }

  if (isLoading) {
    btnLogin.dataset.textAsli = btnLogin.innerText;
    btnLogin.innerText = "Memproses...";
    btnLogin.disabled = true;

    if (btnRegister) btnRegister.disabled = true;
    if (btnModeAdmin) btnModeAdmin.disabled = true;
    if (btnModeUser) btnModeUser.disabled = true;
  } else {
    if (btnLogin.dataset.textAsli) {
      btnLogin.innerText = btnLogin.dataset.textAsli;
    } else {
      btnLogin.innerText = modeLogin === "admin" ? "Login Admin" : "Login User";
    }

    btnLogin.disabled = false;

    if (btnRegister) btnRegister.disabled = false;
    if (btnModeAdmin) btnModeAdmin.disabled = false;
    if (btnModeUser) btnModeUser.disabled = false;
  }
}

function buatDataDemoPortfolio() {
  const tahun = new Date().getFullYear();
  const bulan = String(new Date().getMonth() + 1).padStart(2, "0");

  return [
    {
      id: "demo-1",
      user_id: "demo-user",
      tanggal: `${tahun}-${bulan}-02`,
      nama: "Nasi goreng",
      kategori: "Makanan",
      harga_satuan: 18000,
      qty: 2,
      jumlah: 36000
    },
    {
      id: "demo-2",
      user_id: "demo-user",
      tanggal: `${tahun}-${bulan}-04`,
      nama: "Bensin motor",
      kategori: "Transportasi",
      harga_satuan: 35000,
      qty: 1,
      jumlah: 35000
    },
    {
      id: "demo-3",
      user_id: "demo-user",
      tanggal: `${tahun}-${bulan}-07`,
      nama: "Paket internet",
      kategori: "Internet",
      harga_satuan: 75000,
      qty: 1,
      jumlah: 75000
    },
    {
      id: "demo-4",
      user_id: "demo-user",
      tanggal: `${tahun}-${bulan}-10`,
      nama: "Sabun dan rinso",
      kategori: "Belanja",
      harga_satuan: 42000,
      qty: 1,
      jumlah: 42000
    },
    {
      id: "demo-5",
      user_id: "demo-user",
      tanggal: `${tahun}-${bulan}-14`,
      nama: "Buku catatan",
      kategori: "Pendidikan",
      harga_satuan: 25000,
      qty: 2,
      jumlah: 50000
    },
    {
      id: "demo-6",
      user_id: "demo-user",
      tanggal: `${tahun}-${bulan}-17`,
      nama: "Obat flu",
      kategori: "Kesehatan",
      harga_satuan: 30000,
      qty: 1,
      jumlah: 30000
    },
    {
      id: "demo-7",
      user_id: "demo-user",
      tanggal: `${tahun}-${bulan}-21`,
      nama: "Kopi susu",
      kategori: "Makanan",
      harga_satuan: 18000,
      qty: 3,
      jumlah: 54000
    }
  ];
}

function buatRiwayatDemoAI() {
  return [
    {
      waktu: new Date().toLocaleString("id-ID"),
      input: "estih",
      hasil: "es teh",
      kategori: "Makanan",
      keterangan: "Sistem mendeteksi kemungkinan typo dan merapikan nama pengeluaran."
    },
    {
      waktu: new Date().toLocaleString("id-ID"),
      input: "bensn",
      hasil: "bensin",
      kategori: "Transportasi",
      keterangan: "Sistem menyesuaikan kategori berdasarkan pola nama pengeluaran."
    },
    {
      waktu: new Date().toLocaleString("id-ID"),
      input: "paket data",
      hasil: "paket internet",
      kategori: "Internet",
      keterangan: "Sistem mengenali pengeluaran sebagai kebutuhan internet."
    }
  ];
}

function masukModeDemoPortfolio() {
  modeDemoPortfolio = true;

  currentUser = {
    id: "demo-user",
    email: "demo@portfolio.local"
  };

  currentProfile = {
    username: "Demo Portfolio",
    role: "user",
    status: "active"
  };

  dataPengeluaran = buatDataDemoPortfolio();
  targetBulanan = 1500000;
  riwayatDeteksiAI = buatRiwayatDemoAI();
  cacheSaranPintarAI = {};

  setFilterBulanIni();
  tampilkanTargetBulanan();
  tampilkanModeLogin();

  tampilkanData();
  refreshTampilan();
  tampilkanRiwayatDeteksiAI();

  tampilkanPopup(
    "Mode Demo Portfolio aktif. Data yang tampil adalah data contoh untuk presentasi project.",
    "success",
    "Mode Demo"
  );
}

function catatRiwayatDeteksiAI(inputAwal, hasilDeteksi, kategori, keterangan) {
  riwayatDeteksiAI.unshift({
    waktu: new Date().toLocaleString("id-ID"),
    input: inputAwal,
    hasil: hasilDeteksi,
    kategori: kategori,
    keterangan: keterangan
  });

  if (riwayatDeteksiAI.length > 20) {
    riwayatDeteksiAI.pop();
  }

  tampilkanRiwayatDeteksiAI();
}

function tampilkanRiwayatDeteksiAI() {
  const tabel = document.getElementById("tabelRiwayatAI");

  if (!tabel) {
    return;
  }

  tabel.innerHTML = "";

  if (riwayatDeteksiAI.length === 0) {
    tabel.innerHTML = `
      <tr>
        <td colspan="5">Belum ada riwayat deteksi.</td>
      </tr>
    `;
    return;
  }

  riwayatDeteksiAI.forEach(function (item) {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${item.waktu}</td>
      <td>${item.input}</td>
      <td><span class="ai-history-badge">${item.hasil}</span></td>
      <td>${item.kategori}</td>
      <td>${item.keterangan}</td>
    `;

    tabel.appendChild(row);
  });
}

function bukaTabAdmin(tab) {
  const dashboardContent = document.getElementById("dashboardContent");
  const adminUserControl = document.getElementById("adminUserControl");
  const btnTabDashboard = document.getElementById("btnTabDashboard");
  const btnTabUser = document.getElementById("btnTabUser");

  if (!dashboardContent || !adminUserControl) {
    return;
  }

  if (tab === "dashboard") {
    dashboardContent.style.display = "block";
    adminUserControl.style.display = "none";

    if (btnTabDashboard) btnTabDashboard.classList.add("active");
    if (btnTabUser) btnTabUser.classList.remove("active");
  } else {
    dashboardContent.style.display = "none";
    adminUserControl.style.display = "block";

    if (btnTabDashboard) btnTabDashboard.classList.remove("active");
    if (btnTabUser) btnTabUser.classList.add("active");

    muatDaftarUserAdmin();
  }
}


function refreshTampilan() {
  hitungRingkasan();
  analisisPengeluaran();
  tampilkanGrafikKategori();
  tampilkanRingkasanKategori();
  tampilkanGrafikHarian();
  tampilkanSaranPintarAwal();
  tampilkanInsightItem();
  tampilkanRiwayatDeteksiAI();
}

function setButtonLoading(button, isLoading, loadingText = "sabar ya sayang") {
  if (!button) return;

  if (isLoading) {
    button.dataset.originalText = button.innerHTML;
    button.disabled = true;
    button.classList.add("btn-loading");
    button.innerHTML = `<span class="btn-spinner"></span>${loadingText}`;
  } else {
    button.disabled = false;
    button.classList.remove("btn-loading");

    if (button.dataset.originalText) {
      button.innerHTML = button.dataset.originalText;
      delete button.dataset.originalText;
    }
  }
}

function tampilkanPopup(pesan, tipe = "info", judul = "") {
  const container = document.getElementById("toastContainer");

  if (!container) {
    console.log(pesan);
    return;
  }

  const toast = document.createElement("div");
  toast.className = `toast ${tipe}`;

  const title = document.createElement("div");
  title.className = "toast-title";

  const message = document.createElement("div");
  message.className = "toast-message";

  if (judul !== "") {
    title.innerText = judul;
  } else {
    if (tipe === "success") title.innerText = "Berhasil";
    else if (tipe === "error") title.innerText = "Gagal";
    else if (tipe === "warning") title.innerText = "Perhatian";
    else title.innerText = "Informasi";
  }

  message.innerText = pesan;

  toast.appendChild(title);
  toast.appendChild(message);
  container.appendChild(toast);

  setTimeout(function () {
    toast.classList.add("keluar");

    setTimeout(function () {
      toast.remove();
    }, 250);
  }, 3500);
}

function tampilkanKeteranganAI(teks) {
  const box = document.getElementById("aiInfoBox");
  const text = document.getElementById("aiInfoText");

  if (!box || !text) {
    return;
  }

  if (!teks || teks.trim() === "") {
    box.style.display = "none";
    text.innerText = "";
    return;
  }

  text.innerText = teks;
  box.style.display = "block";
}

function tampilkanKonfirmasi(pesan, judul = "Konfirmasi") {
  return new Promise(function (resolve) {
    const modal = document.getElementById("confirmModal");
    const title = document.getElementById("confirmTitle");
    const message = document.getElementById("confirmMessage");
    const btnCancel = document.getElementById("confirmCancelBtn");
    const btnOk = document.getElementById("confirmOkBtn");

    if (!modal || !title || !message || !btnCancel || !btnOk) {
      resolve(confirm(pesan));
      return;
    }

    title.innerText = judul;
    message.innerText = pesan;

    modal.classList.add("show");

    function tutupModal(hasil) {
      modal.classList.remove("show");

      btnCancel.removeEventListener("click", batal);
      btnOk.removeEventListener("click", lanjut);
      modal.removeEventListener("click", klikLuar);

      resolve(hasil);
    }

    function batal() {
      tutupModal(false);
    }

    function lanjut() {
      tutupModal(true);
    }

    function klikLuar(event) {
      if (event.target === modal) {
        tutupModal(false);
      }
    }

    btnCancel.addEventListener("click", batal);
    btnOk.addEventListener("click", lanjut);
    modal.addEventListener("click", klikLuar);
  });
}

function aktifkanKategoriOtomatis() {
  const inputNama = document.getElementById("nama");
  const inputKategori = document.getElementById("kategori");

  inputNama.addEventListener("input", function () {
    const kategoriTerdeteksi = deteksiKategoriDariRiwayat(inputNama.value);
    inputKategori.value = kategoriTerdeteksi;
  });
}

async function simpanTargetBulanan() {
  const inputTarget = document.getElementById("targetBulanan");
  const nilaiTarget = Number(inputTarget.value);

  if (!currentUser) {
    tampilkanPopup("Kamu harus login terlebih dahulu.");
    return;
  }

  if (nilaiTarget <= 0) {
    tampilkanPopup("Masukkan target bulanan yang valid.");
    return;
  }

  const { error } = await supabaseClient
    .from("user_settings")
    .upsert({
      user_id: currentUser.id,
      target_bulanan: nilaiTarget,
      updated_at: new Date().toISOString()
    });

  if (error) {
    tampilkanPopup("Gagal menyimpan target bulanan: " + error.message);
    return;
  }

  targetBulanan = nilaiTarget;

  tampilkanTargetBulanan();
  analisisPengeluaran();

  tampilkanPopup("Target bulanan berhasil disimpan online.");
}

async function muatTargetBulananDariSupabase() {
  if (!currentUser) {
    return;
  }

  const { data, error } = await supabaseClient
    .from("user_settings")
    .select("target_bulanan")
    .eq("user_id", currentUser.id)
    .maybeSingle();

  if (error) {
    tampilkanPopup("Gagal mengambil target bulanan: " + error.message);
    return;
  }

  if (data) {
    targetBulanan = Number(data.target_bulanan) || 0;
  } else {
    targetBulanan = 0;
  }
}

function tampilkanTargetBulanan() {
  const inputTarget = document.getElementById("targetBulanan");
  const targetInfo = document.getElementById("targetInfo");

  if (targetBulanan > 0) {
    inputTarget.value = targetBulanan;
    targetInfo.innerText = `Target bulan ini: ${formatRupiah(targetBulanan)}`;
  } else {
    targetInfo.innerText = "Belum ada target bulanan.";
  }
}

function setTanggalHariIni() {
  const inputTanggal = document.getElementById("tanggal");

  const hariIni = new Date();
  const tahun = hariIni.getFullYear();
  const bulan = String(hariIni.getMonth() + 1).padStart(2, "0");
  const tanggal = String(hariIni.getDate()).padStart(2, "0");

  inputTanggal.value = `${tahun}-${bulan}-${tanggal}`;
}

async function tambahPengeluaran() {
  const tanggal = document.getElementById("tanggal").value;
  const namaInput = document.getElementById("nama").value.trim();
  const hargaSatuan = ambilAngkaInput("hargaSatuan");
  const qty = ambilAngkaInput("qty");
  const kategori = document.getElementById("kategori").value;

  if (!currentUser) {
    tampilkanPopup("Kamu harus login terlebih dahulu.");
    return;
  }

  if (tanggal === "" || namaInput === "" || hargaSatuan <= 0 || qty <= 0) {
    tampilkanPopup("Tanggal, nama pengeluaran, harga satuan, dan jumlah item wajib diisi.");
    return;
  }

  const totalBaru = hargaSatuan * qty;

  const hasilDeteksiHarga = deteksiHargaTidakWajar(namaInput, hargaSatuan);

  if (hasilDeteksiHarga.tidakWajar) {
    const lanjutSimpan = await tampilkanKonfirmasi(
      hasilDeteksiHarga.pesan,
      "Harga Tidak Wajar"
    );
    if (!lanjutSimpan) {
      return;
    }
  }

  const hasilDeteksiHarian = deteksiTotalHarianTidakWajar(tanggal, totalBaru);

  if (hasilDeteksiHarian.tidakWajar) {
    const lanjutSimpanHarian = await tampilkanKonfirmasi(
      hasilDeteksiHarian.pesan,
      "Total Harian Tidak Wajar"
    );
    if (!lanjutSimpanHarian) {
      return;
    }
  }

  const hasilBackend = await analisisPengeluaranDenganBackend(
    tanggal,
    namaInput,
    hargaSatuan,
    qty,
    kategori
  );

  if (hasilBackend && hasilBackend.alasan) {
    if (hasilBackend.nama_final && hasilBackend.nama_final !== namaInput) {
      tampilkanKeteranganAI(
        `Sistem mendeteksi kemungkinan typo "${namaInput}" dan merapikannya menjadi "${hasilBackend.nama_final}". ` +
        `Kategori yang dipilih: ${hasilBackend.kategori_final}. ` +
        `${hasilBackend.alasan}`
      );
    }

    if (hasilBackend && hasilBackend.alasan) {
      catatRiwayatDeteksiAI(
        namaInput,
        hasilBackend.nama_final || namaInput,
        hasilBackend.kategori_final || kategori,
        hasilBackend.alasan
      );
    }

    else {
      tampilkanKeteranganAI(
        `Sistem menganalisis "${namaInput}" sebagai kategori ${hasilBackend.kategori_final}. ` +
        `${hasilBackend.alasan}`
      );
    }
  }

  const namaFinal = hasilBackend.nama_final || namaInput;
  const kategoriFinal = hasilBackend.kategori_final || kategori;
  const hasilGabung = hasilBackend.gabung || { gabung: false };

  if (hasilGabung.gabung) {
    const qtyLama = Number(hasilGabung.qty_lama) || 1;
    const jumlahLama = Number(hasilGabung.jumlah_lama) || 0;

    const qtyGabungan = qtyLama + qty;
    const totalGabungan = jumlahLama + totalBaru;

    const lanjut = await tampilkanKonfirmasi(
      `Item mirip ditemukan pada tanggal yang sama:\n\n` +
      `"${namaInput}" akan digabung ke "${hasilGabung.nama_lama}".\n\n` +
      `Qty lama: ${qtyLama}\n` +
      `Qty tambahan: ${qty}\n` +
      `Qty baru: ${qtyGabungan}\n\n` +
      `Total baru: ${formatRupiah(totalGabungan)}\n\n` +
      `Lanjut gabungkan data?`,
      "Gabungkan Item"
    );

    if (!lanjut) {
      return;
    }

    const { error } = await supabaseClient
      .from("expenses")
      .update({
        nama: hasilGabung.nama_lama,
        kategori: hasilGabung.kategori_lama || kategoriFinal,
        harga_satuan: hargaSatuan,
        qty: qtyGabungan,
        jumlah: totalGabungan
      })
      .eq("id", hasilGabung.item_id)
      .eq("user_id", currentUser.id);

    if (error) {
      tampilkanPopup("Gagal menggabungkan data: " + error.message);
      return;
    }

    tampilkanKeteranganAI(
      `Sistem mendeteksi "${namaInput}" sebagai variasi atau typo dari "${hasilGabung.nama_lama}". ` +
      `Data digabung sehingga jumlah item dan total pengeluaran diperbarui.`
    );


  } else {
    const { error } = await supabaseClient.from("expenses").insert({
      user_id: currentUser.id,
      tanggal: tanggal,
      nama: namaFinal,
      harga_satuan: hargaSatuan,
      qty: qty,
      jumlah: totalBaru,
      kategori: kategoriFinal
    });

    if (error) {
      tampilkanPopup("Gagal menyimpan data: " + error.message);
      return;
    }
  }

  kosongkanForm();

  await muatDataPengeluaranDariSupabase();
  cacheSaranPintarAI = {};
  refreshTampilan();
}

async function simpanPengeluaranDemo() {
  const tanggal = document.getElementById("tanggal").value;
  const namaInput = document.getElementById("nama").value.trim();
  const hargaSatuan = ambilAngkaInput("hargaSatuan");
  const qty = ambilAngkaInput("qty");
  const kategoriInput = document.getElementById("kategori").value;

  if (tanggal === "" || namaInput === "" || hargaSatuan <= 0 || qty <= 0) {
    tampilkanPopup("Tanggal, nama pengeluaran, harga satuan, dan jumlah item wajib diisi.", "warning");
    return;
  }

  const namaFinal = rapikanNamaPengeluaran(namaInput);
  const kategoriFinal = deteksiKategoriOtomatis(namaFinal) || kategoriInput;
  const total = hargaSatuan * qty;

  if (modeEdit === true) {
    const indexData = dataPengeluaran.findIndex(function (item) {
      return item.id === idEdit;
    });

    if (indexData !== -1) {
      dataPengeluaran[indexData] = {
        ...dataPengeluaran[indexData],
        tanggal: tanggal,
        nama: namaFinal,
        harga_satuan: hargaSatuan,
        qty: qty,
        jumlah: total,
        kategori: kategoriFinal
      };
    }

    resetModeEdit();
    tampilkanPopup("Data demo berhasil diperbarui.", "success");
  } else {
    dataPengeluaran.push({
      id: "demo-" + Date.now(),
      user_id: "demo-user",
      tanggal: tanggal,
      nama: namaFinal,
      harga_satuan: hargaSatuan,
      qty: qty,
      jumlah: total,
      kategori: kategoriFinal
    });

    tampilkanPopup("Data demo berhasil ditambahkan.", "success");
  }

  catatRiwayatDeteksiAI(
    namaInput,
    namaFinal,
    kategoriFinal,
    "Mode demo: sistem merapikan nama dan menentukan kategori tanpa menyimpan ke database asli."
  );

  kosongkanForm();
  cacheSaranPintarAI = {};
  tampilkanData();
  refreshTampilan();
}

async function simpanPengeluaran() {
  const btnSimpan = document.getElementById("btnSimpan");

  if (btnSimpan && btnSimpan.disabled) {
    return;
  }

  setButtonLoading(btnSimpan, true);

  try {

    if (modeDemoPortfolio) {
      await simpanPengeluaranDemo();
      return;
    }

    if (modeEdit === true) {
      await updatePengeluaran();
    } else {
      await tambahPengeluaran();
    }
  } catch (error) {
    console.error("Gagal menyimpan pengeluaran:", error);
    tampilkanPopup("Terjadi kesalahan saat menyimpan data.", "error");
  } finally {
    setButtonLoading(btnSimpan, false);
  }
}

function simpanData() {
  localStorage.setItem("dataPengeluaran", JSON.stringify(dataPengeluaran));
}

function editData(id) {
  const dataDipilih = dataPengeluaran.find(function (item) {
    return item.id === id;
  });

  if (!dataDipilih) {
    tampilkanPopup("Data tidak ditemukan.");
    return;
  }

  document.getElementById("tanggal").value = dataDipilih.tanggal;
  document.getElementById("nama").value = dataDipilih.nama;
  document.getElementById("hargaSatuan").value = dataDipilih.harga_satuan;
  document.getElementById("qty").value = dataDipilih.qty;
  document.getElementById("kategori").value = dataDipilih.kategori;

  modeEdit = true;
  idEdit = id;

  document.getElementById("btnSimpan").innerText = "Update Data";
  document.getElementById("btnBatalEdit").style.display = "block";

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

async function updatePengeluaran() {
  const tanggal = document.getElementById("tanggal").value;
  const nama = document.getElementById("nama").value.trim();
  const hargaSatuan = ambilAngkaInput("hargaSatuan");
  const qty = ambilAngkaInput("qty");
  const kategori = document.getElementById("kategori").value;

  if (!currentUser) {
    tampilkanPopup("Kamu harus login terlebih dahulu.");
    return;
  }

  if (tanggal === "" || nama === "" || hargaSatuan <= 0 || qty <= 0) {
    tampilkanPopup("Tanggal, nama pengeluaran, harga satuan, dan jumlah item wajib diisi.");
    return;
  }

  const total = hargaSatuan * qty;

  const { error } = await supabaseClient
    .from("expenses")
    .update({
      tanggal: tanggal,
      nama: rapikanNamaPengeluaran(nama),
      harga_satuan: hargaSatuan,
      qty: qty,
      jumlah: total,
      kategori: kategori
    })
    .eq("id", idEdit)
    .eq("user_id", currentUser.id);

  if (error) {
    tampilkanPopup("Gagal memperbarui data: " + error.message);
    return;
  }

  resetModeEdit();
  kosongkanForm();

  await muatDataPengeluaranDariSupabase();
  cacheSaranPintarAI = {};
  refreshTampilan();

  tampilkanPopup("Data berhasil diperbarui.");
}

function batalEdit() {
  resetModeEdit();
  kosongkanForm();
  setTanggalHariIni();
}

function resetModeEdit() {
  modeEdit = false;
  idEdit = null;

  document.getElementById("btnSimpan").innerText = "Tambah Data";
  document.getElementById("btnBatalEdit").style.display = "none";
}

function kosongkanForm() {
  document.getElementById("nama").value = "";
  document.getElementById("hargaSatuan").value = "";
  document.getElementById("qty").value = "1";
}

function tampilkanData() {
  const tabel = document.getElementById("tabelPengeluaran");

  tabel.innerHTML = "";

  const searchInput = document.getElementById("searchInput");
  const filterKategoriInput = document.getElementById("filterKategori");
  const sortDataInput = document.getElementById("sortData");

  const keyword = searchInput ? searchInput.value.toLowerCase().trim() : "";
  const kategoriDipilih = filterKategoriInput ? filterKategoriInput.value : "Semua";
  const urutanDipilih = sortDataInput ? sortDataInput.value : "terbaru";

  let dataTerfilter = dataPengeluaran.filter(function (item) {
    const sesuaiBulanTahun = cekDataSesuaiFilter(item);

    const sesuaiKeyword =
      item.nama.toLowerCase().includes(keyword) ||
      item.kategori.toLowerCase().includes(keyword) ||
      String(item.jumlah).includes(keyword) ||
      item.tanggal.includes(keyword);

    const sesuaiKategori =
      kategoriDipilih === "Semua" || item.kategori === kategoriDipilih;

    return sesuaiBulanTahun && sesuaiKeyword && sesuaiKategori;
  });

  dataTerfilter.sort(function (a, b) {
    if (urutanDipilih === "terbaru") {
      return new Date(b.tanggal) - new Date(a.tanggal);
    }

    if (urutanDipilih === "terlama") {
      return new Date(a.tanggal) - new Date(b.tanggal);
    }

    if (urutanDipilih === "terbesar") {
      return b.jumlah - a.jumlah;
    }

    if (urutanDipilih === "terkecil") {
      return a.jumlah - b.jumlah;
    }

    if (urutanDipilih === "nama_az") {
      return a.nama.localeCompare(b.nama);
    }

    if (urutanDipilih === "nama_za") {
      return b.nama.localeCompare(a.nama);
    }

    return 0;
  });

  let tanggalSebelumnya = "";

  dataTerfilter.forEach(function (item, index) {
    if (item.tanggal !== tanggalSebelumnya) {
      const rowTanggal = document.createElement("tr");
      rowTanggal.className = "date-separator-row";

      rowTanggal.innerHTML = `
      <td colspan="7">
        <span>${formatTanggalIndonesia(item.tanggal)}</span>
      </td>
    `;

      tabel.appendChild(rowTanggal);
      tanggalSebelumnya = item.tanggal;
    }

    const row = document.createElement("tr");

    row.className = index % 2 === 0
      ? "expense-row expense-row-even"
      : "expense-row expense-row-odd";

    const hargaSatuan = Math.round(Number(item.harga_satuan) || 0);
    const qty = Math.round(Number(item.qty) || 1);
    const total = hargaSatuan * qty;

    row.innerHTML = `
    <td>${item.tanggal}</td>
    <td>${item.nama}</td>
    <td>${item.kategori}</td>
    <td>${formatRupiah(hargaSatuan)}</td>
    <td>x${qty}</td>
    <td>${formatRupiah(total)}</td>
    <td>
      <button class="edit-btn" onclick="editData('${item.id}')">Edit</button>
      <button class="delete-btn" onclick="hapusData('${item.id}')">Hapus</button>
    </td>
  `;

    tabel.appendChild(row);
  });

  if (dataTerfilter.length === 0) {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td colspan="7">Data tidak ditemukan.</td>
    `;

    tabel.appendChild(row);
  }
}

async function hapusData(id) {
  const yakin = await tampilkanKonfirmasi(
    "Data pengeluaran ini akan dihapus permanen. Apakah kamu yakin?",
    "Hapus Pengeluaran"
  );

  if (!yakin) {
    return;

    if (modeDemoPortfolio) {
      dataPengeluaran = dataPengeluaran.filter(function (item) {
        return item.id !== id;
      });

      if (idEdit === id) {
        resetModeEdit();
        kosongkanForm();
        setTanggalHariIni();
      }

      cacheSaranPintarAI = {};
      tampilkanData();
      refreshTampilan();

      tampilkanPopup("Data demo berhasil dihapus.", "success");
      return;
    }

  }

  if (!currentUser) {
    tampilkanPopup("Kamu harus login terlebih dahulu.");
    return;
  }

  const { error } = await supabaseClient
    .from("expenses")
    .delete()
    .eq("id", id)
    .eq("user_id", currentUser.id);

  if (error) {
    tampilkanPopup("Gagal menghapus data: " + error.message);
    return;
  }

  if (idEdit === id) {
    resetModeEdit();
    kosongkanForm();
    setTanggalHariIni();
  }

  await muatDataPengeluaranDariSupabase();
  cacheSaranPintarAI = {};
  refreshTampilan();
}

function hitungRingkasan() {
  const hariIni = new Date();
  const tanggalHariIni = formatTanggalInput(hariIni);

  let totalHariIni = 0;
  let totalBulanIni = 0;

  dataPengeluaran.forEach(function (item) {
    if (item.tanggal === tanggalHariIni) {
      totalHariIni += item.jumlah;
    }

    if (cekDataSesuaiFilter(item)) {
      totalBulanIni += item.jumlah;
    }
  });

  let prediksiAkhirBulan = 0;

  if (filterBulan === hariIni.getMonth() + 1 && filterTahun === hariIni.getFullYear()) {
    const tanggalSekarang = hariIni.getDate();
    const jumlahHariDalamBulan = new Date(filterTahun, filterBulan, 0).getDate();

    if (totalBulanIni > 0) {
      prediksiAkhirBulan = Math.round(
        (totalBulanIni / tanggalSekarang) * jumlahHariDalamBulan
      );
    }
  } else {
    prediksiAkhirBulan = totalBulanIni;
  }

  document.getElementById("totalHariIni").innerText = formatRupiah(totalHariIni);
  document.getElementById("totalBulanIni").innerText = formatRupiah(totalBulanIni);
  document.getElementById("prediksiBulan").innerText = formatRupiah(prediksiAkhirBulan);
}

function analisisPengeluaran() {
  const analisisText = document.getElementById("analisisText");

  const dataTerfilter = dataPengeluaran.filter(function (item) {
    return cekDataSesuaiFilter(item);
  });

  if (dataTerfilter.length === 0) {
    analisisText.innerText = "Belum ada data pada bulan dan tahun ini untuk dianalisis.";
    return;
  }

  const hariIni = new Date();
  const tanggalHariIni = formatTanggalInput(hariIni);

  let totalBulanIni = 0;
  let totalHariIni = 0;
  let tanggalYangAda = [];

  dataTerfilter.forEach(function (item) {
    totalBulanIni += item.jumlah;

    if (!tanggalYangAda.includes(item.tanggal)) {
      tanggalYangAda.push(item.tanggal);
    }

    if (item.tanggal === tanggalHariIni) {
      totalHariIni += item.jumlah;
    }
  });

  const jumlahHariDenganData = tanggalYangAda.length;
  const rataRataHarian = totalBulanIni / jumlahHariDenganData;

  let status = "";
  let saran = "";

  if (filterBulan === hariIni.getMonth() + 1 && filterTahun === hariIni.getFullYear()) {
    if (totalHariIni > rataRataHarian * 1.5) {
      status = "Boros";
      saran = "Pengeluaran hari ini lebih tinggi dari kebiasaan harianmu. Coba cek apakah ada pengeluaran yang sebenarnya tidak terlalu penting.";
    } else if (totalHariIni < rataRataHarian * 0.7) {
      status = "Hemat";
      saran = "Pengeluaran hari ini lebih rendah dari rata-rata. Ini cukup baik untuk menjaga keuangan.";
    } else {
      status = "Normal";
      saran = "Pengeluaran hari ini masih berada di sekitar rata-rata pengeluaranmu.";
    }
  } else {
    status = "Riwayat";
    saran = "Ini adalah data bulan yang dipilih. Gunakan grafik untuk melihat pola pengeluaran pada bulan tersebut.";
  }

  const jumlahHariDalamBulan = new Date(filterTahun, filterBulan, 0).getDate();

  let prediksiAkhirBulan = 0;

  if (filterBulan === hariIni.getMonth() + 1 && filterTahun === hariIni.getFullYear()) {
    prediksiAkhirBulan = Math.round(
      (totalBulanIni / hariIni.getDate()) * jumlahHariDalamBulan
    );
  } else {
    prediksiAkhirBulan = totalBulanIni;
  }

  let analisisTarget = "";

  if (targetBulanan > 0) {
    if (prediksiAkhirBulan > targetBulanan) {
      const selisih = prediksiAkhirBulan - targetBulanan;

      analisisTarget = `
Target bulanan: ${formatRupiah(targetBulanan)}
Prediksi / total bulan dipilih: ${formatRupiah(prediksiAkhirBulan)}
Status target: Melebihi target sekitar ${formatRupiah(selisih)}
      `;
    } else {
      const sisaTarget = targetBulanan - prediksiAkhirBulan;

      analisisTarget = `
Target bulanan: ${formatRupiah(targetBulanan)}
Prediksi / total bulan dipilih: ${formatRupiah(prediksiAkhirBulan)}
Status target: Masih aman. Sisa dari target ${formatRupiah(sisaTarget)}
      `;
    }
  } else {
    analisisTarget = `
Target bulanan: Belum diatur
    `;
  }

  const kategoriTerbesar = cariKategoriTerbesarBulanIni(filterBulan, filterTahun);

  let teksKategori = "";

  if (kategoriTerbesar !== null) {
    teksKategori = `
Kategori terbesar bulan ini: ${kategoriTerbesar.nama}
Total kategori tersebut: ${formatRupiah(kategoriTerbesar.total)}
    `;
  }

  analisisText.innerText = `
Status: ${status}

Total hari ini: ${formatRupiah(totalHariIni)}
Total bulan dipilih: ${formatRupiah(totalBulanIni)}
Rata-rata harian dari data yang ada: ${formatRupiah(rataRataHarian)}
Jumlah hari dengan data: ${jumlahHariDenganData} hari

${analisisTarget}

${teksKategori}

Saran:
${saran}
  `;
}



function cariKategoriTerbesarBulanIni(bulanIni, tahunIni) {
  let totalKategori = {};

  dataPengeluaran.forEach(function (item) {
    const tanggalItem = new Date(item.tanggal);
    const bulanItem = tanggalItem.getMonth() + 1;
    const tahunItem = tanggalItem.getFullYear();

    if (bulanItem === bulanIni && tahunItem === tahunIni) {
      if (!totalKategori[item.kategori]) {
        totalKategori[item.kategori] = 0;
      }

      totalKategori[item.kategori] += item.jumlah;
    }
  });

  let kategoriTerbesar = null;
  let totalTerbesar = 0;

  for (let kategori in totalKategori) {
    if (totalKategori[kategori] > totalTerbesar) {
      kategoriTerbesar = kategori;
      totalTerbesar = totalKategori[kategori];
    }
  }

  if (kategoriTerbesar === null) {
    return null;
  }

  return {
    nama: kategoriTerbesar,
    total: totalTerbesar
  };
}

function deteksiKategoriOtomatis(namaPengeluaran) {
  const nama = namaPengeluaran.toLowerCase().trim();

  if (nama === "") {
    return "Lainnya";
  }


  const kataKunciKategori = {
    "Makanan": [
      "aades", "aalpukat", "aam", "aamericano", "aaqua", "aayam", "abe", "adang", "adar", "addes", "ade",
      "adees", "ades", "adess", "adis", "ado", "ads", "aericano", "aes", "afer", "aging", "ahu", "aiam",
      "air", "ajan", "ajanan", "akan", "akar", "aket", "akso", "akwan", "alam", "alapan", "allpukat",
      "alpkat", "alpokat", "alppukat", "alpuat", "alpucat", "alpukaat", "alpukat", "alpuket", "alpukkat",
      "alpuukat", "alukat", "ambal", "ameericano", "ameicano", "amercano", "americano", "americanu",
      "americcano", "americeno", "ameriicano", "amerikano", "amerricano", "amerycano", "ampur", "angga",
      "anis", "antin", "aos", "apcay", "appuccino", "appucino", "aqa", "aqoa", "aqqua", "aqu", "aqua",
      "aquaa", "aque", "aquua", "arapan", "arden", "artabak", "arteg", "arung", "asgor", "asi", "atagor",
      "atering", "atte", "aua", "auk", "aus", "awon", "aya", "ayaam", "ayam", "ayam bakar",
      "ayam geprek", "ayam penyet", "ayamm", "ayem", "aym", "ayonaise", "ayur", "ayyam", "baagor",
      "baakar", "baakso", "baakwan", "baar", "baatagor", "bacar", "bacso", "bacwan", "bah", "baka",
      "bakaar", "bakan", "bakar", "bakarr", "baker", "bakkar", "bakkso", "bakkwan", "bako", "bakr",
      "baks", "bakso", "baksoo", "baksso", "baksu", "bakwaan", "bakwan", "bakwann", "bakwen", "bakwn",
      "bakwwan", "baso", "bataagor", "bataggor", "batagoor", "batagor", "batagur", "bataor", "bategor",
      "batgor", "battagor", "bawan", "bba", "bbakar", "bbakso", "bbakwan", "bbatagor", "bbihun",
      "bbiskuit", "bboba", "bbolu", "bbrownies", "bbuah", "bbubur", "bbungkus", "bbur", "bburger",
      "bekar", "bekso", "bhun", "bihhun", "bihn", "bihon", "bihu", "bihun", "bihunn", "bihuun", "biihun",
      "biiskuit", "bikuit", "biscuit", "biskit", "biskkuit", "biskoit", "biskuiit", "biskuit",
      "biskuuit", "biskuyt", "bisskuit", "bisuit", "biun", "blu", "bngkus", "boa", "boah", "bob", "boba",
      "bobaa", "bobba", "bobe", "bobur", "bol", "bollu", "bolo", "bolu", "boluu", "bongkus", "booba",
      "boolu", "borger", "bou", "bownies", "brger", "bronies", "broownies", "browies", "brownies",
      "browniies", "browniis", "brownnies", "brownyes", "browwnies", "brrownies", "bruwnies", "bua",
      "buaah", "buah", "buahh", "buba", "bubbur", "bubor", "bubr", "bubu", "bubur", "buburr", "bubuur",
      "bueh", "buger", "bugkus", "buh", "bulu", "bungcus", "bunggkus", "bungkkus", "bungkos", "bungkus",
      "bungkuus", "bungus", "bunkus", "bunngkus", "burer", "burgeer", "burger", "burgerr", "burgger",
      "burgir", "burgr", "burrger", "buuah", "buubur", "buur", "buurger", "byhun", "caabe", "caampur",
      "caapcay", "caappuccino", "caappucino", "caatering", "cab", "cabbe", "cabe", "cabee", "cabi",
      "cacay", "cae", "caering", "cammpur", "campor", "camppur", "campr", "campur", "campurr", "campuur",
      "camur", "cantin", "capay", "capcaay", "capcai", "capcay", "capcayy", "capccay", "capcey", "capcy",
      "capkay", "cappcay", "cappccino", "cappcino", "cappoccino", "cappocino", "capppuccino",
      "capppucino", "cappucccino", "cappucciino", "cappuccino", "cappuccinu", "cappuccyno", "cappuciino",
      "cappucino", "cappucinu", "cappuckino", "cappucyno", "cappukcino", "cappukino", "cappuuccino",
      "cappuucino", "capucino", "capur", "cateering", "cateing", "cateriing", "catering", "caterring",
      "cateryng", "catiring", "catring", "cattering", "cbe", "ccabe", "ccampur", "ccatering", "ccemilan",
      "cchicken", "ccilok", "ccilor", "ccimol", "ccoffee", "ccoklat", "ccorndog", "ccream", "ccrispy",
      "ccumi", "cdonald", "ceam", "cebab", "cebe", "cecap", "ceemilan", "ceilan", "celapa", "cemian",
      "cemiilan", "cemilaan", "cemilan", "cemilen", "cemillan", "cemlan", "cemmilan", "cempur",
      "cemylan", "centang", "centucky", "cepiting", "ceripik", "cerupuk", "cetoprak", "cffee", "chcken",
      "chhicken", "chiccen", "chiccken", "chicen", "chickeen", "chicken", "chickin", "chickken",
      "chiicken", "chiken", "chikken", "ciilok", "ciilor", "ciimol", "cilk", "cillok", "cillor", "cilo",
      "ciloc", "cilok", "cilokk", "cilook", "ciloor", "cilor", "cilorr", "cilr", "ciluk", "cilur",
      "cimilan", "ciml", "cimmol", "cimo", "cimol", "cimoll", "cimool", "cimul", "ciok", "ciol", "cior",
      "cispy", "cklat", "clok", "clor", "cmi", "cmol", "coclat", "cofee", "coffe", "coffee", "coffeee",
      "coffei", "cofffee", "coffie", "cofvee", "cokat", "cokklat", "coklaat", "coklat", "coklatt",
      "coklet", "cokllat", "coklt", "colat", "comi", "condog", "cooffee", "cooklat", "coorndog", "copi",
      "cordog", "cornddog", "corndog", "corndoog", "corndug", "cornndog", "cornog", "corrndog", "cotak",
      "covfee", "cram", "crea", "creaam", "cream", "creamm", "creeam", "creem", "crem", "cremes",
      "criam", "criispy", "crim", "cripy", "crispi", "crisppy", "crispy", "crispyy", "crisspy", "crisy",
      "crndog", "crream", "crrispy", "crspy", "cryspy", "cuffee", "cui", "cum", "cumi", "cumii", "cummi",
      "cumy", "cuning", "curndog", "cuumi", "cwetiau", "cylok", "cylor", "cymol", "daadar", "daaging",
      "daar", "dada", "dadaar", "dadar", "dadarr", "daddar", "dader", "dadr", "dagging", "dagig",
      "dagiing", "daging", "dagingg", "daginng", "dagng", "dagyng", "daing", "dang", "ddadar", "ddaging",
      "ddar", "ddendeng", "ddimsum", "ddonat", "dedar", "dedeng", "deendeng", "deging", "denddeng",
      "dendeeng", "dendeng", "dendenng", "dending", "dendng", "deneng", "denndeng", "des", "diimsum",
      "dimmsum", "dimsm", "dimsom", "dimssum", "dimsum", "dimsumm", "dimsuum", "dimum", "dindeng",
      "disum", "dmsum", "dnat", "dndeng", "doat", "dona", "donaat", "donat", "donatt", "donet", "donnat",
      "dont", "doonat", "duk", "dunat", "dymsum", "eafood", "ebab", "eblak", "ebus", "ecap", "ecel",
      "edes", "ekwan", "elapa", "ele", "elur", "emak", "emangka", "empe", "empek", "endang", "entang",
      "entucky", "enyet", "epiting", "eprek", "equa", "ercon", "eripik", "ermen", "eruk", "erupuk", "es",
      "es teh", "estoran", "etoprak", "eyam", "fench", "ffrench", "ffried", "ffries", "fied", "fies",
      "frech", "fred", "freench", "frencch", "french", "frenchh", "frenh", "frenkh", "frennch", "fres",
      "frid", "frie", "fried", "fried chicken", "friedd", "frieed", "friees", "fries", "friess", "friid",
      "friied", "friies", "friis", "frinch", "fris", "frnch", "frrench", "frried", "frries", "fryed",
      "fryes", "gaado", "gad", "gaddo", "gado", "gadoo", "gadu", "gao", "gdo", "gedo", "geeprek",
      "gepek", "gepprek", "geprec", "gepreek", "geprek", "geprekk", "geprik", "geprk", "geprrek",
      "gerek", "ggado", "ggeprek", "ggoreng", "ggorengan", "ggulai", "ggurame", "glai", "goeng",
      "goengan", "golai", "gooreng", "goorengan", "gorame", "goreeng", "goreengan", "goreg", "goregan",
      "goreng", "gorengan", "gorengen", "gorengg", "gorenggan", "gorenng", "gorenngan", "goring",
      "goringan", "gorng", "gorngan", "gorreng", "gorrengan", "grame", "greng", "grengan", "guai",
      "guame", "gula", "gulaai", "gulai", "gulaii", "gulay", "gulei", "guli", "gullai", "guraame",
      "gurae", "gurame", "guramee", "gurami", "guramme", "gureme", "gureng", "gurme", "gurrame",
      "guulai", "hai", "hhokben", "hhotdog", "hkben", "hoben", "hocben", "hodog", "hokbben", "hokbeen",
      "hokben", "hokbenn", "hokbin", "hokbn", "hoken", "hokkben", "hookben", "hootdog", "hotddog",
      "hotdg", "hotdog", "hotdogg", "hotdoog", "hotdug", "hotog", "hottdog", "htdog", "hutdog", "ian",
      "iang", "ica", "ican", "ice", "ice cream", "icheese", "idocafe", "idomie", "ihun", "iikan",
      "iindocafe", "iindomie", "iinstan", "iisotonik", "ika", "ikaan", "ikan", "ikann", "iken", "ikkan",
      "ikn", "ila", "ilor", "imol", "indcafe", "inddocafe", "inddomie", "indmie", "indoafe", "indocaafe",
      "indocafe", "indocafi", "indocave", "indoccafe", "indocefe", "indoie", "indokafe", "indomie",
      "indomii", "indomiie", "indommie", "indomye", "indoocafe", "indoomie", "indumie", "ineral",
      "inerale", "ingkong", "inndomie", "innstan", "insan", "insstan", "instaan", "instan", "instann",
      "insten", "instn", "insttan", "intan", "inum", "inuman", "iomay", "iotonik", "isang", "isol",
      "isoonik", "isootonik", "isotnik", "isotonic", "isotonik", "isotonnik", "isotonyk", "isotoonik",
      "isottonik", "isotunik", "issotonik", "istan", "izza", "jaajan", "jaajanan", "jaan", "jaanan",
      "jaja", "jajaan", "jajaanan", "jajan", "jajanaan", "jajanan", "jajanen", "jajann", "jajannan",
      "jajen", "jajenan", "jajjan", "jajjanan", "jajn", "jajnan", "jeeruk", "jejan", "jejanan", "jerk",
      "jerok", "jerruk", "jeru", "jeruc", "jeruk", "jerukk", "jeruuk", "jeuk", "jice", "jiruk", "jjajan",
      "jjan", "jjeruk", "jjuice", "joice", "juce", "juic", "juicce", "juice", "juicee", "juici", "juie",
      "juiice", "juike", "jus", "juuice", "kaantin", "kabe", "kan", "kanin", "kanntin", "kantiin",
      "kantin", "kantinn", "kantn", "kanttin", "kantyn", "katin", "kbab", "kcap", "keab", "keap",
      "keapa", "keba", "kebaab", "kebab", "kebabb", "kebb", "kebbab", "kebeb", "keca", "kecaap", "kecap",
      "kecapp", "keccap", "kecep", "kecp", "keebab", "keecap", "keelapa", "keentang", "keentucky",
      "keepiting", "keeripik", "keerupuk", "keetoprak", "keipik", "keiting", "kekap", "kelaa", "kelaapa",
      "kelapa", "kelapaa", "kelape", "kelappa", "kelepa", "kellapa", "kelpa", "kemes", "kenang",
      "kenntang", "kenntucky", "kentaang", "kentang", "kentanng", "kentcky", "kenteng", "kentin",
      "kentng", "kentocky", "kenttang", "kenttucky", "kentuccky", "kentuccy", "kentucki", "kentucky",
      "kentukky", "kentuucky", "keoprak", "kepiing", "kepiiting", "kepitiing", "kepiting", "kepitting",
      "kepityng", "keppiting", "kepting", "kepyting", "keriik", "keriipik", "keripic", "keripiik",
      "keripik", "kerippik", "keripyk", "keropuk", "kerpik", "kerpuk", "kerripik", "kerrupuk", "kerupok",
      "keruppuk", "kerupuc", "kerupuk", "kerupuuk", "keruuk", "keruupuk", "ketang", "ketiau",
      "ketooprak", "ketopprak", "ketoprac", "ketoprak", "ketoprek", "ketoprrak", "ketorak", "ketprak",
      "kettoprak", "kfc", "kibab", "kim", "kintang", "kkopi", "kkotak", "kkremes", "kkrim", "kkuning",
      "kkwetiau", "kning", "koak", "koi", "koning", "koopi", "kootak", "kop", "kopi", "kopi susu",
      "kopii", "koppi", "kopy", "kota", "kotaak", "kotac", "kotak", "kotakk", "kotek", "kotk", "kottak",
      "kpi", "kream", "kreemes", "krees", "kremees", "kremes", "kremess", "kremis", "kremmes", "krems",
      "kri", "kriim", "krim", "krimes", "krimm", "krm", "krmes", "krrim", "krym", "ktak", "kue", "kuing",
      "kumi", "kunig", "kuniing", "kuning", "kuningg", "kuninng", "kunng", "kunning", "kunyng", "kupi",
      "kweetiau", "kweiau", "kwetau", "kwetiaau", "kwetiao", "kwetiau", "kwetieu", "kwetiiau",
      "kwettiau", "kwetyau", "laalapan", "laapan", "laatte", "laauk", "lak", "lalaan", "lalaapan",
      "lalapaan", "lalapan", "lalapen", "lalappan", "lalepan", "lallapan", "lalpan", "laok", "late",
      "latt", "latte", "lattee", "latti", "lattte", "lau", "lauc", "lauk", "laukk", "lauuk", "le",
      "leak", "lee", "leele", "leemak", "lel", "lelapan", "lele", "lelee", "leli", "lelle", "lema",
      "lemaak", "lemac", "lemak", "lemakk", "lemek", "lemk", "lemmak", "lette", "leuk", "lile", "limak",
      "llatte", "llauk", "lle", "llele", "llemak", "llontong", "lntong", "lonntong", "lonong", "lontng",
      "lontong", "lontonng", "lontoong", "lonttong", "lontung", "loontong", "lotong", "ltte", "luk",
      "luntong", "maakan", "maalam", "maam", "maan", "maangga", "maanis", "maartabak", "maayonaise",
      "macan", "magga", "maionaise", "mais", "maka", "makaan", "makan", "makann", "maken", "makkan",
      "makn", "mala", "malaam", "malam", "malamm", "malem", "mallam", "malm", "manga", "mangga",
      "manggaa", "mangge", "manggga", "mani", "maniis", "manis", "maniss", "manngga", "mannis", "mans",
      "manys", "maonaise", "marabak", "marrtabak", "martaabak", "martabac", "martabak", "martabbak",
      "martabek", "martbak", "martebak", "marttabak", "matabak", "maynaise", "mayoaise", "mayonaaise",
      "mayonaise", "mayonaisi", "mayonayse", "mayoneise", "mayonnaise", "mayoonaise", "mccdonald", "mcd",
      "mcddonald", "mcdnald", "mcdoald", "mcdonaald", "mcdonald", "mcdoneld", "mcdonnald", "mcdoonald",
      "mcdunald", "mconald", "mda", "mdonald", "mecon", "meercon", "mekan", "melam", "mengga", "menis",
      "merccon", "mercn", "mercon", "merconn", "mercoon", "mercun", "merkon", "meron", "merrcon", "mi",
      "mie", "mie ayam", "mie instan", "mieral", "mierale", "miineral", "miinerale", "miinum",
      "miinuman", "mineal", "mineale", "mineeral", "mineerale", "mineraal", "mineraale", "mineral",
      "minerale", "minerali", "minerel", "minerele", "minerral", "minerrale", "miniral", "minirale",
      "minm", "minman", "minneral", "minnerale", "minnum", "minnuman", "minom", "minoman", "minral",
      "minrale", "minu", "minuan", "minum", "minumaan", "minuman", "minumen", "minumm", "minumman",
      "minuum", "minuuman", "mircon", "mium", "miuman", "mkan", "mlam", "mmalam", "mmangga", "mmanis",
      "mmineral", "mminum", "mminuman", "mmuda", "mngga", "mnis", "mnum", "moda", "mua", "mud", "muda",
      "mudaa", "mudda", "mude", "muuda", "mynum", "naasgor", "naasi", "nack", "nagor", "nai", "nas",
      "nasggor", "nasgoor", "nasgor", "nasgorr", "nasgr", "nasgur", "nasi", "nasi bungkus",
      "nasi goreng", "nasi kotak", "nasi padang", "nasii", "nasor", "nassgor", "nassi", "nasy", "nesgor",
      "nesi", "nia", "niila", "nil", "nila", "nilaa", "nile", "nilla", "nla", "nnasgor", "nnasi",
      "nnila", "nsi", "nstan", "nyla", "oba", "ocari", "odang", "oduk", "olaria", "olu", "onat",
      "ongkol", "opi", "orat", "oti", "oto", "paadang", "paaket", "paang", "paauk", "pacet", "padaang",
      "padag", "padang", "padangg", "padanng", "paddang", "padeng", "padng", "paet", "pak", "pake",
      "pakeet", "paket", "pakett", "pakit", "pakket", "pakt", "paok", "pau", "pauc", "pauk", "paukk",
      "pauuk", "pcari", "pcel", "pdang", "peccel", "pece", "peceel", "pecel", "pecel lele", "pecell",
      "pecil", "pecl", "pedang", "peecel", "peel", "peempek", "peenyet", "peermen", "pekel", "peket",
      "pemek", "pemen", "pemmpek", "pempec", "pempeek", "pempek", "pempekk", "pempik", "pempk",
      "pemppek", "penet", "peniet", "pennyet", "penyeet", "penyet", "penyett", "penyit", "penyt",
      "penyyet", "pepek", "peren", "permeen", "permen", "permenn", "permin", "permmen", "permn",
      "perrmen", "peuk", "peyet", "piang", "picel", "piisang", "piizza", "pimpek", "pinyet", "pirmen",
      "pisaang", "pisag", "pisang", "pisangg", "pisanng", "piseng", "pisng", "pissang", "piza", "pizz",
      "pizza", "pizzaa", "pizze", "pizzza", "pket", "poari", "pocaari", "pocai", "pocari", "pocarii",
      "pocarri", "pocary", "poccari", "poceri", "pocri", "pokari", "pop", "potih", "ppauk", "ppermen",
      "ppisang", "ppizza", "pputih", "psang", "ptih", "puih", "puk", "puth", "puti", "putih", "putihh",
      "putiih", "puttih", "putyh", "puutih", "pyzza", "pzza", "qua", "raawon", "raon", "rat", "rawn",
      "rawo", "rawon", "rawonn", "rawoon", "rawun", "rawwon", "rbus", "rca", "rcheese", "rebbus",
      "rebos", "rebs", "rebu", "rebus", "rebuss", "rebuus", "redang", "reebus", "reendang", "reestoran",
      "renang", "rendaang", "rendang", "rendanng", "renddang", "rendeng", "rendng", "renndang",
      "resoran", "resstoran", "restooran", "restoran", "restoren", "restorran", "restran", "resttoran",
      "resturan", "retoran", "reus", "rewon", "ria", "ribus", "ric", "rica", "ricaa", "ricca",
      "riccheese", "rice", "riceese", "richeeese", "richeese", "richeesi", "richeesse", "richeise",
      "richese", "richheese", "richiese", "ried", "ries", "riheese", "riica", "riisol", "rika", "rim",
      "rindang", "riol", "risl", "riso", "risol", "risoll", "risool", "rissol", "ristoran", "risul",
      "rmah", "rndang", "roi", "romah", "rooti", "rot", "roti", "rotii", "rotti", "roty", "rrawon",
      "rrebus", "rrica", "rrisol", "rroti", "rrumah", "rsol", "rti", "ruah", "ruma", "rumaah", "rumah",
      "rumah makan", "rumahh", "rumeh", "rumh", "rummah", "ruti", "ruumah", "rwon", "ryca", "rysol",
      "saambal", "saaos", "saapan", "saarapan", "saarden", "saaus", "saayur", "sabal", "sack", "saden",
      "safood", "saiur", "samal", "sambaal", "sambal", "samball", "sambbal", "sambel", "sambl",
      "sammbal", "sang", "sao", "saoos", "saos", "saoss", "saraan", "saraapan", "sarapaan", "sarapan",
      "sarapen", "sarappan", "sardden", "sardeen", "sarden", "sardenn", "sardin", "sardn", "saren",
      "sarepan", "sarpan", "sarrapan", "sarrden", "sas", "sau", "saur", "saus", "sauss", "sauus",
      "sayor", "sayr", "sayu", "sayur", "sayurr", "sayuur", "sayyur", "sblak", "seaafood", "seaffood",
      "seafod", "seafood", "seafoodd", "seafoood", "seafoud", "seafuod", "seangka", "seaood", "seavood",
      "sebak", "sebblak", "seblaak", "seblac", "seblak", "seblakk", "seblek", "seblk", "sebllak",
      "seeafood", "seeblak", "seemangka", "selak", "semaangka", "semagka", "semangca", "semanggka",
      "semangka", "semangke", "semanngka", "sembal", "semengka", "semmangka", "semngka", "seos",
      "serapan", "serden", "seus", "seyur", "siaang", "siag", "sian", "siang", "siangg", "sianng",
      "sieng", "sigkong", "siiang", "siingkong", "siiomay", "simay", "sing", "singcong", "singgkong",
      "singkkong", "singkong", "singkoong", "singkung", "singong", "sinkong", "sinngkong", "sioay",
      "siomaay", "siomai", "siomay", "siomayy", "siomey", "siommay", "siomy", "sioomay", "siumay",
      "slaria", "smbal", "snaack", "snac", "snacc", "snacck", "snack", "snackk", "snak", "snakk", "snck",
      "sneck", "sngkong", "snnack", "soaria", "solaaria", "solaia", "solaria", "solarie", "solariia",
      "solarria", "solarya", "soleria", "sollaria", "solria", "soo", "sooto", "sop", "sos", "sosu",
      "sot", "soto", "sotoo", "sotto", "sotu", "sowir", "srden", "ssaos", "ssaus", "ssayur", "ssiang",
      "ssoto", "ssu", "ssusu", "ssuwir", "sto", "suir", "sup", "sus", "suso", "sussu", "susu", "susuu",
      "suto", "suu", "suusu", "suuwir", "suwi", "suwiir", "suwir", "suwirr", "suwr", "suwwir", "suwyr",
      "swir", "syang", "taahu", "tah", "tahhu", "taho", "tahu", "tahuu", "tai", "tau", "tea", "tecwan",
      "teekwan", "teelur", "teempe", "teh", "tehu", "tekan", "tekkwan", "tekwaan", "tekwan", "tekwann",
      "tekwen", "tekwn", "tekwwan", "tellur", "telor", "telr", "telu", "telur", "telurr", "teluur",
      "teme", "temmpe", "temp", "tempe", "tempee", "tempi", "temppe", "tepe", "teur", "tewan", "tha",
      "thaai", "thai", "thai tea", "thaii", "thay", "thei", "thhai", "thi", "thu", "tikwan", "tilur",
      "timpe", "tlur", "tmpe", "tna", "tngkol", "togkol", "tona", "tongcol", "tonggkol", "tongkkol",
      "tongkol", "tongkool", "tongkul", "tongol", "tonkol", "tonngkol", "toongkol", "ttahu", "ttelur",
      "ttempe", "tthai", "ttuna", "tua", "tun", "tuna", "tunaa", "tune", "tunna", "tuuna", "uah", "uang",
      "uat", "ubi", "ubur", "uda", "udaang", "udag", "udan", "udang", "udangg", "udanng", "uddang",
      "udduk", "udeng", "udk", "udng", "udok", "udu", "uduc", "uduk", "udukk", "uduuk", "umah", "umi",
      "una", "ura", "uraat", "urat", "uratt", "uret", "urrat", "urt", "usu", "utih", "uudang", "uuduk",
      "uuk", "uurat", "uwir", "waafer", "waarteg", "waarung", "waer", "wafe", "wafeer", "wafer",
      "waferr", "waffer", "wafir", "wafr", "wareg", "warng", "warong", "warrteg", "warrung", "warteeg",
      "warteg", "wartegg", "wartg", "wartig", "wartteg", "warug", "warung", "warungg", "warunng",
      "waruung", "wateg", "waung", "waver", "wefer", "werteg", "werung", "wfer", "wrteg", "wrung", "yam",
      "ykan"
    ],
    "Transportasi": [
      "aangkot", "agkot", "ajak", "aksi", "aldo", "ambal", "andara", "angcot", "anggkot", "angkkot",
      "angkoot", "angkot", "angkott", "angkt", "angkut", "angot", "ankot", "anngkot", "apal", "arif",
      "arkir", "arkirr", "axi", "axim", "baandara", "badara", "ban", "banara", "bandaara", "bandara",
      "bandare", "bandarra", "banddara", "bandera", "bandra", "banndara", "bbandara", "bbengkel",
      "bbensin", "bbensinn", "bbluebird", "bbm", "bbusway", "beengkel", "beensin", "beensinn", "begkel",
      "bengcel", "bengel", "benggkel", "bengkeel", "bengkel", "bengkil", "bengkkel", "benin", "beninn",
      "benkel", "benngkel", "bennsin", "bennsinn", "bensiin", "bensiinn", "bensin", "bensinn",
      "bensinnn", "bensn", "bensnn", "benssin", "benssinn", "bensyn", "bensynn", "besin", "besinn",
      "bingkel", "binsin", "binsinn", "blebird", "blluebird", "bloebird", "blubird", "bluebbird",
      "bluebiird", "bluebird", "bluebyrd", "blueebird", "blueird", "bluibird", "bluuebird", "bnsin",
      "bnsinn", "bosway", "bp", "bsway", "bus", "busay", "bussway", "buswaay", "buswai", "busway",
      "buswayy", "buswey", "buswway", "buswy", "buusway", "capal", "cci", "ccuci", "cendaraan", "cereta",
      "coci", "cuc", "cucci", "cuci", "cuci mobil", "cuci motor", "cucii", "cucy", "cui", "cuki",
      "cuuci", "ddexlite", "deexlite", "delite", "dexite", "dexliite", "dexlite", "dexliti", "dexlitte",
      "dexllite", "dexlte", "dexlyte", "dexxlite", "dixlite", "e", "eetoll", "elabuhan", "elm",
      "endaraan", "ental", "eoll", "ereta", "erminal", "erry", "ertalit", "ertalite", "ertamaks",
      "ertamax", "ertamina", "ervice", "ervis", "esawat", "esin", "etll", "etol", "etoll", "etolll",
      "etooll", "ettoll", "etull", "ewa", "feerry", "ferr", "ferri", "ferrry", "ferry", "ferryy", "fery",
      "fferry", "firry", "frry", "gab", "gabbike", "gabcar", "gcar", "gfood", "ggocar", "ggofood",
      "ggojek", "ggoride", "ggrab", "ggrabbike", "ggrabcar", "gjek", "goar", "goca", "gocaar", "gocar",
      "gocarr", "goccar", "gocer", "gocr", "goek", "goffood", "gofod", "gofood", "gofoodd", "gofoood",
      "gofoud", "gofuod", "goide", "goje", "gojec", "gojeek", "gojek", "gojekk", "gojik", "gojjek",
      "gojk", "gokar", "goocar", "goofood", "goojek", "goood", "gooride", "gorde", "goridde", "goride",
      "goridee", "goridi", "gorie", "goriide", "gorride", "goryde", "govood", "gra", "graab",
      "graabbike", "graabcar", "grab", "grabar", "grabb", "grabbbike", "grabbcar", "grabbice",
      "grabbiike", "grabbike", "grabbiki", "grabbikke", "grabbyke", "grabcaar", "grabcar", "grabccar",
      "grabcer", "grabike", "grabkar", "gracar", "grb", "grbbike", "grbcar", "greb", "grebbike",
      "grebcar", "gride", "grrab", "gucar", "gufood", "gujek", "heelm", "hel", "hell", "hellm", "helm",
      "helmm", "hem", "hhelm", "hhujan", "hilm", "hjan", "hlm", "hojan", "huan", "huja", "hujaan",
      "hujan", "hujann", "hujen", "hujjan", "hujn", "huujan", "iket", "inyak", "isi", "isi bensin",
      "isi minyak", "itoll", "ivo", "jas", "jek", "jol", "kaal", "kaapal", "kapa", "kapaal", "kapal",
      "kapall", "kapel", "kapl", "kappal", "kedaraan", "keendaraan", "keereta", "keeta", "kenaraan",
      "kendaaraan", "kendaraan", "kendaraen", "kendarean", "kendarraan", "kenddaraan", "kenderaan",
      "kendraan", "kepal", "kerea", "kereeta", "kereta", "keretaa", "kerete", "keretta", "kerita",
      "kerreta", "kerta", "kkapal", "krl", "kuci", "lrt", "maaxim", "maim", "maxi", "maxiim", "maxim",
      "maximm", "maxm", "maxxim", "maxym", "mbil", "meesin", "mein", "mesi", "mesiin", "mesin", "mesinn",
      "mesn", "messin", "mesyn", "mexim", "miinyak", "minak", "miniak", "minnyak", "minyaak", "minyac",
      "minyak", "minyakk", "minyek", "minyk", "minyyak", "misin", "miyak", "mmaxim", "mmesin", "mmobil",
      "mmotor", "mobbil", "mobi", "mobiil", "mobil", "mobill", "mobl", "mobyl", "moil", "moobil", "moor",
      "mootor", "moto", "motoor", "motor", "motorr", "motr", "mottor", "motur", "mrt", "msin", "mtor",
      "mubil", "mutor", "mxim", "ngkos", "obil", "oek", "ogkos", "oje", "ojec", "ojeek", "ojek", "ojekk",
      "ojik", "ojjek", "ojjol", "ojk", "ojl", "ojo", "ojol", "ojoll", "ojool", "ojul", "olar", "oli",
      "oll", "ongcos", "onggkos", "ongkkos", "ongkoos", "ongkos", "ongkoss", "ongks", "ongkus", "ongos",
      "onkos", "onngkos", "oojek", "oojol", "ool", "otor", "paajak", "paak", "paarkir", "paarkirr",
      "paja", "pajaak", "pajac", "pajak", "pajakk", "pajek", "pajjak", "pajk", "pakir", "pakirr",
      "parcir", "parcirr", "parir", "parirr", "parkiir", "parkiirr", "parkir", "parkirr", "parkirrr",
      "parkkir", "parkkirr", "parkr", "parkrr", "parkyr", "parkyrr", "parrkir", "parrkirr", "peabuhan",
      "peawat", "peelabuhan", "peertalit", "peertalite", "peertamaks", "peertamax", "peertamina",
      "peesawat", "pejak", "pelaabuhan", "pelabbuhan", "pelabohan", "pelabuhan", "pelabuhen",
      "pelabuuhan", "pelauhan", "pelbuhan", "pelebuhan", "pellabuhan", "peralit", "peralite", "peramaks",
      "peramax", "peramina", "perkir", "perkirr", "perrtalit", "perrtalite", "perrtamaks", "perrtamax",
      "perrtamina", "pertaalit", "pertaalite", "pertaamaks", "pertaamax", "pertaamina", "pertalit",
      "pertalite", "pertaliti", "pertallit", "pertallite", "pertalyt", "pertalyte", "pertamacs",
      "pertamaks", "pertamax", "pertameks", "pertamex", "pertamina", "pertamine", "pertammaks",
      "pertammax", "pertammina", "pertamyna", "pertelit", "pertelite", "pertemaks", "pertemax",
      "pertemina", "pertlit", "pertlite", "pertmaks", "pertmax", "pertmina", "perttalit", "perttalite",
      "perttamaks", "perttamax", "perttamina", "pesaat", "pesaawat", "pesawaat", "pesawat", "pesawet",
      "pesawwat", "pesewat", "pessawat", "peswat", "petalit", "petalite", "petamaks", "petamax",
      "petamina", "pirtalit", "pirtamax", "pisawat", "pjak", "rab", "ransjakarta", "ransmetro",
      "ransport", "ransportasi", "ravel", "reental", "renal", "renntal", "rentaal", "rental",
      "rental mobil", "rental motor", "rentall", "rentel", "rentl", "renttal", "retal", "rintal",
      "rntal", "saaldo", "sado", "sald", "salddo", "saldo", "saldoo", "saldu", "salldo", "salo",
      "sasiun", "sea", "seervice", "seervis", "seewa", "seldo", "sell", "serice", "seris", "serrvice",
      "serrvis", "servce", "servicce", "service", "service motor", "servici", "serviice", "serviis",
      "servike", "servis", "servis motor", "serviss", "servs", "servvice", "servvis", "servyce",
      "servys", "sevice", "sevis", "sew", "sewa", "sewa mobil", "sewa motor", "sewaa", "sewe", "sewwa",
      "sheell", "shel", "shell", "shelll", "shhell", "shill", "shll", "sim", "sirvis", "siwa", "slar",
      "sldo", "snk", "soar", "sola", "solaar", "solar", "solarr", "soler", "sollar", "solr", "soolar",
      "srvis", "ssaldo", "ssewa", "sshell", "ssolar", "sstasiun", "sstnk", "staasiun", "staiun",
      "stasiiun", "stasion", "stasiun", "stasiuun", "stassiun", "stasun", "stasyun", "stesiun", "stk",
      "stn", "stnc", "stnk", "stnkk", "stnnk", "stsiun", "sttnk", "sular", "swa", "taaksi", "taambal",
      "taarif", "taaxi", "tabal", "tacsi", "tai", "taif", "taki", "takksi", "taks", "taksi", "taksii",
      "takssi", "taksy", "tamal", "tambaal", "tambal", "tambal ban", "tamball", "tambbal", "tambel",
      "tambl", "tammbal", "tansjakarta", "tansmetro", "tansport", "tansportasi", "tarf", "tari", "tarif",
      "tariff", "tariif", "tariv", "tarrif", "taryf", "tasi", "tavel", "tax", "taxi", "taxii", "taxxi",
      "taxy", "teerminal", "teksi", "tembal", "teminal", "terif", "terinal", "termiinal", "terminal",
      "terminel", "terminnal", "termminal", "termnal", "termynal", "terrminal", "texi", "ticet", "tiet",
      "tiiket", "tike", "tikeet", "tiket", "tiket kapal", "tiket kereta", "tiket pesawat", "tikett",
      "tikit", "tikket", "tikt", "tirminal", "tket", "tksi", "tll", "tmbal", "tnk", "tol", "toll",
      "tolll", "tooll", "traansjakarta", "traansmetro", "traansport", "traansportasi", "traavel",
      "trael", "tranjakarta", "tranmetro", "trannsjakarta", "trannsmetro", "trannsport", "trannsportasi",
      "tranport", "tranportasi", "transjacarta", "transjakarta", "transjakarte", "transjakerta",
      "transjekarta", "transjjakarta", "transmetro", "transmetru", "transmitro", "transmmetro",
      "transport", "transportasi", "transportasy", "transportesi", "transpport", "transpportasi",
      "transpurt", "transpurtasi", "transsjakarta", "transsmetro", "transsport", "transsportasi",
      "trasjakarta", "trasmetro", "trasport", "trasportasi", "traveel", "travel", "travell", "travil",
      "travl", "travvel", "trensmetro", "trensport", "trensportasi", "trevel", "trif", "trnsmetro",
      "trnsport", "trransport", "trravel", "trvel", "ttaxi", "ttiket", "ttoll", "tull", "txi", "uci",
      "ujan", "ujek", "ujol", "verry", "viivo", "vio", "viv", "vivo", "vivoo", "vivu", "vivvo", "vvivo",
      "vvo", "vyvo"
    ],
    "Internet": [
      "aadmin", "aaplikasi", "aaxis", "abel", "addmin", "adin", "admi", "admiin", "admin", "adminn",
      "admmin", "admn", "admyn", "ais", "aket", "alam", "alikasi", "amin", "ana", "angganan", "anking",
      "anva", "apcut", "apikasi", "apliasi", "aplicasi", "apliikasi", "aplikaasi", "aplikasi",
      "aplikasy", "aplikesi", "aplikkasi", "aplkasi", "apllikasi", "arian", "artu", "as", "ata", "axi",
      "axiis", "axis", "axiss", "axs", "axxis", "axys", "ayar", "baanking", "baar", "baayar", "baiar",
      "baking", "bancing", "baning", "bankiing", "banking", "bankinng", "bankking", "bankng", "bankyng",
      "bannking", "baya", "bayaar", "bayar", "bayar wifi", "bayarr", "bayer", "bayr", "bayyar",
      "bbanking", "bbayar", "bbiaya", "bbiznet", "bbulanan", "beyar", "biaa", "biaaya", "biaia", "biay",
      "biaya", "biayaa", "biaye", "biayya", "bieya", "biiaya", "biiznet", "binet", "biya", "bizet",
      "bizneet", "biznet", "biznett", "biznit", "biznnet", "biznt", "bizznet", "blanan", "bolanan",
      "buanan", "bulaan", "bulaanan", "bulanaan", "bulanan", "bulanen", "bulannan", "bulenan",
      "bullanan", "bulnan", "byu", "byznet", "bznet", "caanva", "caapcut", "cabel", "cacut", "cana",
      "cannva", "canv", "canva", "canvaa", "canve", "canvva", "capccut", "capcot", "capct", "capcut",
      "capcutt", "capcuut", "capkut", "cappcut", "caput", "cartu", "cava", "cbn", "ccanva", "ccapcut",
      "ccloud", "cenva", "clloud", "clod", "clood", "clooud", "clou", "cloud", "cloudd", "clouud",
      "clud", "cluud", "cnva", "connet", "coud", "cuota", "cuotaa", "daa", "daana", "daata", "dan",
      "dana", "danaa", "dane", "danna", "dat", "data", "data internet", "dataa", "date", "datta",
      "ddana", "ddata", "ddomain", "dena", "deta", "dmain", "dmin", "dna", "doain", "domaain", "domaiin",
      "domain", "domainn", "doman", "domayn", "domein", "domin", "dommain", "doomain", "dta", "eSIM",
      "eallet", "ebsite", "edmin", "eesim", "eewallet", "eim", "elepon", "elkomsel", "elpon", "eluler",
      "erdana", "erver", "esi", "esiim", "esim", "esimm", "esm", "essim", "esym", "ewaallet", "ewalet",
      "ewalleet", "ewallet", "ewallett", "ewallit", "ewalllet", "ewellet", "ewllet", "ewwallet", "exis",
      "fber", "ffiber", "ffirstmedia", "fflip", "fi", "fibber", "fibe", "fibeer", "fiber", "fiberr",
      "fibir", "fibr", "fier", "fiiber", "fiirstmedia", "fip", "firrstmedia", "firsmedia", "firsstmedia",
      "firstmedia", "firstmedie", "firstmedya", "firstmidia", "firstmmedia", "firsttmedia", "firtmedia",
      "fistmedia", "fli", "fliip", "flip", "flipp", "fllip", "flp", "flyp", "fyber", "ggithub", "ggopay",
      "gihub", "giithub", "githb", "githhub", "githob", "github", "githubb", "githuub", "gitthub",
      "gitub", "goay", "goopay", "gopa", "gopaay", "gopai", "gopay", "gopayy", "gopey", "goppay", "gopy",
      "gpay", "gthub", "gupay", "gythub", "haarian", "haian", "haran", "hariaan", "harian", "hariann",
      "harien", "hariian", "harin", "harrian", "haryan", "herian", "hhosting", "hhotspot", "hoosting",
      "hootspot", "hopeepay", "hosing", "hospot", "hossting", "hostiing", "hosting", "hostinng",
      "hostng", "hostting", "hostyng", "hoting", "hotpot", "hotsot", "hotspoot", "hotspot", "hotsppot",
      "hotsput", "hotsspot", "hottspot", "hp", "hree", "hsting", "htspot", "husting", "hutspot", "i-fi",
      "iber", "icconnet", "icnnet", "iconet", "iconneet", "iconnet", "iconnett", "iconnit", "iconnnet",
      "icoonnet", "icunnet", "idihome", "idosat", "ifi", "iiconnet", "iindihome", "iindosat",
      "iinternet", "ikonnet", "im3", "impati", "inddihome", "inddosat", "indhome", "indihhome",
      "indihome", "indihomi", "indihoome", "indihume", "indiihome", "indiome", "indoat", "indoosat",
      "indosaat", "indosat", "indoset", "indossat", "indsat", "indusat", "indyhome", "inernet",
      "inihome", "inkaja", "inndosat", "innternet", "inosat", "inteernet", "intenet", "internet",
      "internet banking", "internit", "internnet", "interrnet", "intirnet", "intrnet", "intternet",
      "isi", "isi pulsa", "isim", "iternet", "iwallet", "kaabel", "kaartu", "kabbel", "kabe", "kabeel",
      "kabel", "kabell", "kabil", "kabl", "kael", "karrtu", "kart", "karto", "karttu", "kartu", "kartuu",
      "karu", "katu", "kbel", "kebel", "kertu", "kkartu", "kkuota", "kkuotaa", "kloud", "koota",
      "kootaa", "kos", "kota", "kotaa", "kuoa", "kuoaa", "kuoota", "kuootaa", "kuot", "kuota", "kuotaa",
      "kuotaaa", "kuotae", "kuote", "kuotea", "kuotta", "kuottaa", "kuta", "kutaa", "kuuota",
      "laangganan", "lagganan", "lan", "langanan", "langgaanan", "langganan", "langganen", "langgannan",
      "langgenan", "langgganan", "lanngganan", "lay", "lengganan", "liinkaja", "likaja", "linaja",
      "lincaja", "linkaaja", "linkaja", "linkaje", "linkajja", "linkeja", "linkja", "linkkaja",
      "linnkaja", "lip", "llangganan", "m", "maalam", "maam", "mala", "malaam", "malam", "malamm",
      "malem", "mallam", "malm", "martfren", "mbile", "mdem", "melam", "mirepublic", "mlam", "mmalam",
      "mmobile", "mmodem", "mmyrepublic", "mnc", "mobbile", "mobie", "mobiile", "mobile",
      "mobile banking", "mobilee", "mobili", "mobille", "moble", "mobyle", "moddem", "mode", "modeem",
      "modem", "modemm", "modim", "modm", "moem", "moile", "moobile", "moodem", "mrepublic", "mudem",
      "myepublic", "myreepublic", "myrepoblic", "myreppublic", "myrepublic", "myrepublik", "myrepublyc",
      "myrepuublic", "myreublic", "myripublic", "neelpon", "nellpon", "nelon", "nelpn", "nelpon",
      "nelponn", "nelpoon", "nelppon", "nelpun", "nepon", "nilpon", "nlimited", "nline", "nlpon", "nmor",
      "nnomor", "nommor", "nomo", "nomoor", "nomor", "nomorr", "nomr", "nomur", "noomor", "noor",
      "numor", "odem", "oline", "omor", "onine", "onlie", "onliine", "onlimited", "online", "onlinee",
      "onlini", "onlinne", "onlline", "onlne", "onlyne", "onnline", "ooptik", "ooxygen", "opik",
      "opptik", "opti", "optic", "optiik", "optik", "optikk", "optk", "opttik", "optyk", "opup", "otik",
      "oucher", "outer", "ovo", "oxgen", "oxigen", "oxxygen", "oxyen", "oxygeen", "oxygen", "oxygenn",
      "oxyggen", "oxygin", "oxygn", "oxyygen", "oygen", "paaket", "pacet", "paet", "pake", "pakeet",
      "paket", "paket data", "paket telepon", "paket telpon", "pakett", "pakit", "pakket", "pakt", "pay",
      "pedana", "peerdana", "peket", "pemium", "perana", "perdaana", "perdana", "perdane", "perdanna",
      "perddana", "perdena", "perdna", "perrdana", "pirdana", "pket", "pla", "plaay", "plai", "play",
      "playy", "pley", "pllay", "plsa", "ply", "polsa", "pplay", "ppremium", "ppulsa", "preemium",
      "preium", "premiium", "premiom", "premium", "premiuum", "premmium", "premum", "premyum", "primium",
      "prmium", "pro", "ptik", "pula", "pullsa", "puls", "pulsa", "pulsaa", "pulse", "pulssa", "pusa",
      "puulsa", "qoota", "qota", "qquota", "quoa", "quoota", "quot", "quota", "quotaa", "quote",
      "quotta", "quta", "quuota", "quuta", "ransfer", "rmah", "romah", "rooter", "roouter", "roter",
      "rouer", "routeer", "router", "routerr", "routir", "routr", "routter", "rouuter", "rrouter",
      "rrumah", "ruah", "ruma", "rumaah", "rumah", "rumahh", "rumeh", "rumh", "rummah", "ruumah",
      "sartfren", "seeluler", "seerver", "seller", "selluler", "seloler", "seluer", "seluleer",
      "seluler", "selulir", "seluller", "seluuler", "serer", "serrver", "serveer", "server", "serverr",
      "servir", "servr", "servver", "seuler", "sever", "shhopeepay", "shoeepay", "shoopeepay",
      "shopeeepay", "shopeepai", "shopeepay", "shopeepey", "shopeeppay", "shopeipay", "shopepay",
      "shopiepay", "shoppeepay", "siimpati", "siluler", "sim", "simati", "simmpati", "simpaati",
      "simpati", "simpatti", "simpaty", "simpeti", "simppati", "simpti", "sipati", "sirver",
      "smaartfren", "smarfren", "smarrtfren", "smartffren", "smartfren", "smartfrin", "smarttfren",
      "smartvren", "smatfren", "smertfren", "smmartfren", "smpati", "sms", "srver", "tansfer",
      "teelepon", "teelkomsel", "teelpon", "teepon", "tekomsel", "telcomsel", "teleepon", "teleon",
      "telepon", "telepoon", "teleppon", "telepun", "telipon", "telkkomsel", "telkmsel", "telkommsel",
      "telkomsel", "telkomsil", "telkoomsel", "telkumsel", "tellepon", "tellkomsel", "tellpon",
      "telomsel", "telon", "telpn", "telpon", "telponn", "telpoon", "telppon", "telpun", "tepon", "thee",
      "thhree", "thre", "three", "threee", "threi", "thrie", "thrree", "tilepon", "tilpon", "tlpon",
      "toopup", "top", "top up pulsa", "topop", "topp", "toppup", "topu", "topup", "topupp", "topuup",
      "toup", "tpup", "traansfer", "tranfer", "trannsfer", "transfer", "transffer", "transfir",
      "transsfer", "transver", "trasfer", "tree", "trensfer", "tri", "trnsfer", "tthree", "ttopup",
      "tupup", "ulimited", "ulsa", "umah", "unimited", "unliimited", "unliited", "unlimiited",
      "unlimited", "unlimitid", "unlimmited", "unlimyted", "unllimited", "unlmited", "up", "vlip",
      "vocher", "voocher", "vooucher", "vouccher", "voucer", "voucheer", "voucher", "voucher internet",
      "vouchher", "vouchir", "vouher", "voukher", "vouucher", "vps", "w-fi", "wbsite", "webbsite",
      "webite", "websiite", "website", "websiti", "websitte", "webssite", "webste", "websyte",
      "weebsite", "wesite", "wfi", "wi", "wi--fi", "wi-f", "wi-ffi", "wi-fi", "wi-fii", "wi-fy", "wi-i",
      "wi-vi", "wif", "wiffi", "wifi", "wifi kos", "wifi rumah", "wifii", "wify", "wii", "wii-fi",
      "wiifi", "wivi", "wwi-fi", "wwifi", "wyfi", "xis", "xl"
    ],
    "Belanja": [
      "aadaptor", "aalat", "aaptor", "aaqua", "aat", "abel", "abun", "adaaptor", "adapor", "adapptor",
      "adaptoor", "adaptor", "adapttor", "adaptur", "adator", "addaptor", "adeptor", "adiah", "ado",
      "adptor", "ain", "ainan", "air", "ajan", "aju", "akaian", "aket", "aki", "ala", "alaat", "alat",
      "alat cukur", "alat mandi", "alat rumah", "alat tulis", "alatt", "alet", "allat", "alon", "alt",
      "ambut", "ampo", "ampu", "anci", "andal", "andbody", "andi", "anger", "angi", "aos", "apas", "apu",
      "aqa", "aqoa", "aqqua", "aqu", "aqua", "aquaa", "aque", "aquua", "ard", "arfum", "arphone", "arpu",
      "arung", "ashion", "asi", "asing", "asker", "asta", "aterai", "aua", "azada", "baaju", "baaterai",
      "baerai", "baj", "bajju", "bajo", "baju", "bajuu", "bateai", "bateerai", "bateraai", "baterai",
      "bateray", "baterei", "baterrai", "batirai", "batrai", "batterai", "bau", "bbaju", "bbedak",
      "bbelanja", "bbukalapak", "bdak", "beak", "beanja", "beda", "bedaak", "bedac", "bedak", "bedakk",
      "beddak", "bedek", "bedk", "beedak", "beelanja", "beju", "belaanja", "belaja", "belanja",
      "belanje", "belanjja", "belannja", "belenja", "bellanja", "belnja", "bidak", "bilanja", "bju",
      "bkalapak", "bokalapak", "bualapak", "bucalapak", "bud", "bukaalapak", "bukaapak", "bukalaapak",
      "bukalapac", "bukalapak", "bukalapek", "bukalepak", "bukallapak", "caard", "caasing", "cabel",
      "cad", "cado", "cain", "caing", "caki", "caos", "capas", "car", "card", "cardd", "carger", "carrd",
      "casig", "casiing", "casing", "casingg", "casinng", "casng", "cassing", "casyng", "ccard",
      "ccasing", "ccelana", "ccharger", "ccheckout", "cci", "ccotton", "ccuci", "ccukur", "ccukuran",
      "ceana", "ceckout", "ceelana", "celaa", "celaana", "celana", "celanaa", "celane", "celanna",
      "celena", "cellana", "celna", "cemeja", "cerd", "cerudung", "cesing", "ceyboard", "chaarger",
      "chager", "charer", "chargeer", "charger", "chargger", "chargir", "charrger", "chckout",
      "checckout", "checcout", "checkkout", "checkoot", "checkoout", "checkout", "checkuut", "checout",
      "cheeckout", "chekkout", "cherger", "chharger", "chrger", "cilana", "ckur", "ckuran", "coci",
      "cod", "cokur", "cokuran", "compor", "cootton", "coton", "cottn", "cotton", "cottonn", "cottoon",
      "cottton", "cottun", "crd", "cresek", "ctton", "cuc", "cucci", "cuci", "cucii", "cucur", "cucuran",
      "cucy", "cui", "cuki", "cukkur", "cukkuran", "cukor", "cukoran", "cukr", "cukran", "cuku",
      "cukuan", "cukur", "cukuraan", "cukuran", "cukuren", "cukurr", "cukurran", "cukuur", "cukuuran",
      "cutton", "cuuci", "cuukur", "cuur", "daasi", "dai", "das", "dasi", "dasii", "dassi", "dasy",
      "ddasi", "ddeodorant", "ddeterjen", "ddompet", "dedorant", "deeodorant", "deerjen", "deeterjen",
      "deoddorant", "deodoorant", "deodorant", "deodorent", "deodorrant", "deodrant", "deodurant",
      "deoodorant", "deoorant", "desi", "deteerjen", "detejen", "deterjen", "deterjin", "deterjjen",
      "deterrjen", "detirjen", "detrjen", "detterjen", "deudorant", "diterjen", "dmpet", "dol", "domet",
      "dommpet", "dompeet", "dompet", "dompett", "dompit", "domppet", "dompt", "doompet", "dopet", "dsi",
      "dumpet", "eaarphone", "eadset", "eans", "eaphone", "earhone", "earphhone", "earphone", "earphoni",
      "earphoone", "earphune", "earpone", "earpphone", "earrphone", "eber", "eearphone", "eelpiji",
      "eember", "elas", "elat", "eliji", "ellpiji", "elpii", "elpiiji", "elpiji", "elpijii", "elpijji",
      "elpijy", "elpji", "elppiji", "elpyji", "embber", "embe", "embeer", "ember", "emberr", "embir",
      "embr", "emeja", "emer", "emmber", "emori", "empered", "endok", "epatu", "epiji", "equa",
      "erlengkapan", "erudung", "erum", "ewangi", "eyboard", "faashion", "fahion", "fashdisk",
      "fashhion", "fashiion", "fashion", "fashioon", "fashiun", "fashon", "fashyon", "fasion",
      "fasshion", "feshion", "fflashdisk", "flaashdisk", "flahdisk", "flasdisk", "flashddisk",
      "flashdisc", "flashdisk", "flashdysk", "flashhdisk", "flasshdisk", "fleshdisk", "fllashdisk",
      "gaalon", "gaarpu", "gallon", "galn", "galo", "galon", "galonn", "galoon", "galun", "gaon", "gapu",
      "garp", "garpo", "garppu", "garpu", "garpuu", "garrpu", "garu", "gas", "gass", "gatis", "geas",
      "geelas", "gela", "gelaas", "gelas", "gelass", "geles", "gellas", "gelon", "gels", "gerpu",
      "ggalon", "ggarpu", "ggelas", "ggi", "ggigi", "gglass", "ggratis", "ggunting", "gig", "giggi",
      "gigi", "gigii", "gigy", "gii", "giigi", "gilas", "glaass", "glas", "glass", "glasss", "gless",
      "gllass", "glon", "glss", "gnting", "gonting", "graatis", "grais", "gratiis", "gratis",
      "gratis ongkir", "gratiss", "grats", "grattis", "gratys", "gretis", "grpu", "grratis", "grtis",
      "guning", "gunnting", "guntiing", "gunting", "guntinng", "guntng", "guntting", "guntyng", "guting",
      "guunting", "gygi", "haadiah", "haair", "haandbody", "haanger", "hadah", "hadbody", "haddiah",
      "hadiaah", "hadiah", "hadiahh", "hadieh", "hadih", "hadiiah", "hadset", "hadyah", "hager", "hai",
      "haiah", "haiir", "hair", "hair powder", "hairr", "hampoo", "hanbody", "handbbody", "handbodi",
      "handbody", "handboody", "handbudy", "handdbody", "handody", "haner", "hangeer", "hanger",
      "hangerr", "hangger", "hangir", "hangr", "hanndbody", "hannger", "har", "hayr", "hdiah",
      "heaadset", "headdset", "headet", "headseet", "headset", "headsit", "headsset", "heaset", "hedset",
      "heeadset", "heedset", "heir", "hendbody", "henger", "hhair", "hhanger", "hhoodie", "hir", "hodie",
      "hooddie", "hoode", "hoodie", "hoodiee", "hoodii", "hoodiie", "hoodye", "hooie", "hooodie", "hop",
      "hopee", "houdie", "hp", "huodie", "iat", "icat", "igi", "iikat", "ika", "ikaat", "ikat", "ikatt",
      "iket", "ikkat", "ikt", "iktok", "iktokshop", "ilbab", "imber", "inggang", "inso", "inyak",
      "iring", "isau", "issue", "isu", "jaaket", "jacet", "jaet", "jake", "jakeet", "jaket", "jakett",
      "jakit", "jakket", "jakt", "jans", "jas", "jeaans", "jean", "jeanns", "jeans", "jeanss", "jeas",
      "jeeans", "jeens", "jeket", "jens", "jians", "jibab", "jiilbab", "jilab", "jilbaab", "jilbab",
      "jilbabb", "jilbb", "jilbbab", "jilbeb", "jillbab", "jjaket", "jjeans", "jjilbab", "jlbab",
      "kaabel", "kaado", "kaain", "kaaki", "kaaos", "kaapas", "kaas", "kabbel", "kabe", "kabeel",
      "kabel", "kabell", "kabil", "kabl", "kaci", "kad", "kaddo", "kado", "kadoo", "kadu", "kael", "kai",
      "kaiin", "kain", "kainn", "kak", "kaki", "kakii", "kakki", "kaky", "kan", "kao", "kaoos", "kaos",
      "kaoss", "kapa", "kapaas", "kapas", "kapass", "kapes", "kappas", "kaps", "kard", "kas", "kat",
      "kaus", "kayn", "kbel", "kdo", "kebel", "keboard", "kedo", "keeja", "keemeja", "keerudung",
      "keeyboard", "keiboard", "kein", "keki", "kemea", "kemeeja", "kemeja", "kemejaa", "kemeje",
      "kemejja", "kemija", "kemja", "kemmeja", "keos", "kepas", "kerdung", "kerodung", "kerrudung",
      "keruddung", "kerudong", "kerudung", "keruduung", "keruudung", "keruung", "kesek", "keudung",
      "keybard", "keybboard", "keyboaard", "keyboard", "keyboerd", "keybooard", "keybuard", "keyoard",
      "kin", "kincare", "kkado", "kkain", "kkaki", "kkaos", "kkapas", "kki", "kkompor", "kkresek",
      "kmpor", "kommpor", "komor", "kompoor", "kompor", "komporr", "komppor", "kompr", "kompur",
      "koompor", "kopor", "kos", "kotton", "kreek", "kreesek", "kresec", "kreseek", "kresek", "kresekk",
      "kresik", "kresk", "kressek", "krisek", "kuci", "laada", "laampu", "laazada", "lammpu", "lamp",
      "lampo", "lamppu", "lampu", "lampuu", "lamu", "lap", "lapu", "lass", "lastik", "lat", "lazaa",
      "lazaada", "lazada", "lazadaa", "lazadda", "lazade", "lazda", "lazeda", "lazzada", "lem", "lempu",
      "lezada", "llampu", "llotion", "lmpu", "loion", "lootion", "lotiion", "lotin", "lotion", "lotionn",
      "lotioon", "lotiun", "loton", "lottion", "lotyon", "ltion", "maainan", "maandi", "maasker", "madi",
      "maian", "maiinan", "mainaan", "mainan", "mainann", "mainen", "mainn", "mainnan", "maker", "manan",
      "mand", "manddi", "mandi", "mandii", "mandy", "mani", "manndi", "mascer", "maser", "maskeer",
      "masker", "maskerr", "maskir", "maskker", "maskr", "massker", "maynan", "mber", "meemori",
      "meinan", "memmori", "memoi", "memoori", "memori", "memorii", "memorri", "memory", "memri",
      "memuri", "mendi", "meori", "mesker", "miinyak", "mimori", "minak", "miniak", "minnyak", "minyaak",
      "minyac", "minyak", "minyak wangi", "minyakk", "minyek", "minyk", "minyyak", "miyak", "mlto",
      "mmandi", "mmolto", "mmouse", "mndi", "mollto", "molo", "molt", "molto", "moltoo", "moltto",
      "moltu", "moolto", "moose", "moouse", "mose", "moto", "moue", "mous", "mouse", "mousee", "mousi",
      "mousse", "mouuse", "multo", "muse", "muuse", "ngkir", "oddol", "odl", "odo", "odol", "odoll",
      "odool", "odul", "ogkir", "okopedia", "olto", "omade", "ongcir", "onggkir", "ongir", "ongkiir",
      "ongkir", "ongkirr", "ongkkir", "ongkr", "ongkyr", "onkir", "onngkir", "oodol", "ool", "ootfit",
      "ooutfit", "opi", "otfit", "otton", "oucher", "oufit", "outffit", "outfiit", "outfit", "outfitt",
      "outft", "outfyt", "outit", "outtfit", "outvit", "owder", "owerbank", "paaian", "paakaian",
      "paanci", "paarfum", "paasta", "pacaian", "paci", "pafum", "pakaaian", "pakaan", "pakaiaan",
      "pakaian", "pakaien", "pakaiian", "pakayan", "pakeian", "pakian", "panc", "pancci", "panci",
      "pancii", "pancy", "pani", "panki", "pannci", "parffum", "parfm", "parfom", "parfum", "parfumm",
      "parfuum", "parrfum", "parum", "parvum", "pasa", "passta", "past", "pasta", "pasta gigi", "pastaa",
      "paste", "pastik", "pastta", "pata", "peangi", "peerlengkapan", "peewangi", "pel", "pelengkapan",
      "penci", "perengkapan", "perfum", "perleengkapan", "perlengcapan", "perlengkapan", "perlengkapen",
      "perlengkepan", "perlenngkapan", "perlingkapan", "perllengkapan", "perlngkapan", "pesta",
      "pewaangi", "pewagi", "pewanggi", "pewangi", "pewangy", "pewanngi", "pewengi", "pewngi",
      "pewwangi", "pia", "piau", "piggang", "piing", "piinggang", "piiring", "piisau", "pingang",
      "pinggaang", "pinggang", "pingganng", "pinggeng", "pingggang", "pinnggang", "pirig", "piriing",
      "piring", "piringg", "pirinng", "pirng", "pirring", "piryng", "pisa", "pisaau", "pisao", "pisau",
      "pisauu", "piseu", "pissau", "pisu", "piwangi", "plaastik", "plasik", "plasstik", "plastic",
      "plastiik", "plastik", "plasttik", "plastyk", "platik", "plestik", "pllastik", "pmade", "pnci",
      "pnggang", "poade", "poder", "poerbank", "pomaade", "pomadde", "pomade", "pomadee", "pomadi",
      "pomae", "pomde", "pomede", "pommade", "poomade", "poowder", "poowerbank", "powdder", "powdeer",
      "powder", "powderr", "powdir", "powdr", "powebank", "poweerbank", "power", "powerbanc",
      "powerbank", "powerbbank", "powerbenk", "powerrbank", "powirbank", "powrbank", "powwder",
      "powwerbank", "ppasta", "ppinggang", "ppiring", "ppisau", "ppowder", "ppria", "pra", "pri", "pria",
      "priaa", "prie", "priia", "pring", "prria", "prya", "psau", "psta", "puwder", "pynggang", "qua",
      "raambut", "rabut", "rambbut", "rambot", "rambt", "rambut", "rambutt", "rambuut", "rammbut",
      "ramut", "rembut", "ria", "riinso", "rinnso", "rino", "rins", "rinso", "rinsoo", "rinsso", "rinsu",
      "riso", "rmah", "rmbut", "rnso", "romah", "rrinso", "rrumah", "ruah", "ruma", "rumaah", "rumah",
      "rumahh", "rumeh", "rumh", "rummah", "ruumah", "rynso", "saabun", "saampo", "saandal", "saapu",
      "saarung", "sabbun", "sabn", "sabon", "sabu", "sabun", "sabun cuci piring", "sabun mandi",
      "sabunn", "sabuun", "sadal", "sammpo", "samo", "samp", "sampo", "sampoo", "samppo", "sampu",
      "sanal", "sandaal", "sandal", "sandall", "sanddal", "sandel", "sandl", "sanndal", "sap", "sapo",
      "sappu", "sapu", "sapuu", "sarng", "sarong", "sarrung", "sarug", "sarung", "sarungg", "sarunng",
      "saruung", "sau", "saun", "saung", "sbun", "scincare", "sd", "seater", "seatu", "sebun", "sedok",
      "seendok", "seepatu", "seerum", "sempo", "sendal", "senddok", "sendk", "sendoc", "sendok",
      "sendokk", "sendook", "senduk", "senndok", "senok", "sepaatu", "sepato", "sepattu", "sepatu",
      "sepatuu", "sepau", "sepetu", "seppatu", "septu", "sepu", "serm", "serom", "serrum", "seru",
      "serum", "serumm", "serung", "seruum", "seum", "shaampoo", "shammpoo", "shamoo", "shampoo",
      "shampooo", "shampou", "shamppoo", "shampuo", "shapoo", "shempoo", "shhampoo", "shhop", "shhopee",
      "sho", "shoee", "shoop", "shoopee", "shop", "shope", "shopee", "shopeee", "shopei", "shopie",
      "shopp", "shoppee", "shp", "shpee", "shup", "shupee", "siat", "sicat", "siikat", "sika", "sikaat",
      "sikat", "sikat gigi", "sikatt", "siket", "sikkat", "sikt", "sincare", "sindok", "sipatu", "sirum",
      "skat", "skicare", "skiincare", "skinare", "skincaare", "skincare", "skincari", "skinccare",
      "skincere", "skinkare", "skinncare", "smpo", "sndal", "snlight", "snscreen", "sonlight",
      "sonscreen", "sop", "sopee", "spu", "srum", "srung", "ssabun", "ssampo", "ssapu", "sserum",
      "sshop", "ssikat", "ssunlight", "ssunscreen", "ssweater", "sulight", "suncreen", "sunight",
      "sunlght", "sunligght", "sunlight", "sunliight", "sunllight", "sunlyght", "sunnlight",
      "sunnscreen", "sunsccreen", "sunscreen", "sunscrein", "sunscrien", "sunscrreen", "sunskreen",
      "sunsreen", "sunsscreen", "suunlight", "swater", "sweaater", "sweaer", "sweateer", "sweater",
      "sweatir", "sweatter", "sweeater", "sweeter", "sweter", "swiater", "tas", "teempered", "temered",
      "temmpered", "tempeered", "tempered", "tempered glass", "temperid", "temperred", "tempired",
      "temppered", "tempred", "tepered", "tictok", "tictokshop", "tiiktok", "tiiktokshop", "tiissue",
      "tiisu", "tikktok", "tikktokshop", "tikok", "tikokshop", "tiktk", "tiktkshop", "tiktoc",
      "tiktocshop", "tiktok", "tiktok shop", "tiktokk", "tiktokkshop", "tiktokshop", "tiktokshup",
      "tiktook", "tiktookshop", "tikttok", "tikttokshop", "tiktuk", "tiktukshop", "timpered", "tis",
      "tiso", "tisse", "tissoe", "tisssue", "tissu", "tissue", "tissuee", "tissui", "tissuue", "tisu",
      "tisue", "tisuu", "titok", "tiu", "tkopedia", "tlis", "tocopedia", "toi", "tokkopedia", "tokoedia",
      "tokoopedia", "tokopedia", "tokopedie", "tokopedya", "tokopeedia", "tokopidia", "tokoppedia",
      "tokpedia", "tolis", "toopi", "top", "topi", "topii", "toppi", "topy", "tpi", "tssue", "tsu",
      "ttissue", "ttisu", "ttopi", "ttulis", "tuis", "tuli", "tuliis", "tulis", "tuliss", "tullis",
      "tuls", "tulys", "tupi", "tuulis", "tyssue", "tysu", "uci", "udol", "ulis", "umah", "vocher",
      "voocher", "vooucher", "vouccher", "voucer", "voucheer", "voucher", "vouchher", "vouchir",
      "vouher", "voukher", "vouucher", "waajan", "waan", "waangi", "wagi", "waja", "wajaan", "wajan",
      "wajann", "wajen", "wajjan", "wajn", "wang", "wanggi", "wangi", "wangii", "wangy", "wani",
      "wanngi", "wejan", "wengi", "wjan", "wngi", "wwajan", "wwangi", "ykat"
    ],
    "Pendidikan": [
      "3d", "aaktuator", "aalat", "aarduino", "aartikel", "aat", "aautocad", "abel", "aboratorium",
      "actuator", "aduino", "akalah", "akktuator", "aktator", "aktoator", "akttuator", "aktuaator",
      "aktuator", "aktuattor", "aktuatur", "aktuetor", "aktutor", "aktuuator", "ala", "alaat", "alat",
      "alat praktikum", "alatt", "alet", "alkulator", "allat", "alt", "ambar", "ampus", "ang", "angka",
      "anva", "aotocad", "apan", "apasitor", "aper", "aporan", "ardduino", "ardino", "ardoino",
      "arduiino", "arduinno", "arduino", "arduinu", "arduno", "arduuino", "arduyno", "arikel",
      "arrduino", "arrtikel", "articel", "artiel", "artiikel", "artikeel", "artikel", "artikil",
      "artikkel", "artkel", "arttikel", "artykel", "atatan", "ateri", "atocad", "auocad", "autcad",
      "autoad", "autocaad", "autocad", "autoccad", "autoced", "autokad", "autoocad", "auttocad", "baya",
      "bbiaya", "bbinder", "bbook", "bbootcamp", "bbreadboard", "bbuku", "bbusur", "beadboard", "biaa",
      "biaaya", "biaia", "biay", "biaya", "biayaa", "biaye", "biayya", "bider", "bieya", "biiaya",
      "biinder", "bindder", "bindeer", "binder", "binderr", "bindir", "bindr", "biner", "binnder",
      "biya", "bku", "bnder", "bok", "boku", "boo", "booc", "boocamp", "book", "bookk", "boook",
      "boootcamp", "bootamp", "bootcaamp", "bootcammp", "bootcamp", "bootccamp", "bootcemp", "bootkamp",
      "boottcamp", "bosur", "botcamp", "bouk", "boutcamp", "bradboard", "breaadboard", "breaboard",
      "breadbboard", "breadboard", "breadboerd", "breadbuard", "breaddboard", "bredboard", "breeadboard",
      "breedboard", "bsur", "bucu", "buk", "bukku", "buko", "buku", "buku gambar", "buku tulis", "bukuu",
      "buok", "busor", "busr", "bussur", "busu", "busur", "busurr", "busuur", "buu", "buuku", "buur",
      "buusur", "bynder", "caanva", "caatan", "caatatan", "cabel", "cada", "calkulator", "campus",
      "cana", "cannva", "canv", "canva", "canvaa", "canve", "canvva", "capasitor", "cataan", "cataatan",
      "catataan", "catatan", "cataten", "catattan", "catetan", "cattan", "cattatan", "cava", "ccanva",
      "ccatatan", "ccoding", "ccoursera", "cding", "celas", "cenva", "certas", "cnva", "codding",
      "codig", "codiing", "coding", "codingg", "codinng", "codng", "codyng", "coing", "cooding",
      "coorsera", "cooursera", "corsera", "courera", "courrsera", "courseera", "coursera", "coursere",
      "coursira", "courssera", "cousera", "couursera", "cuding", "culiah", "cursus", "ddesain",
      "ddompet", "deain", "deesain", "demy", "desaain", "desaiin", "desain", "desainn", "desan",
      "desayn", "desein", "desin", "dessain", "digital art", "disain", "dmpet", "domet", "dommpet",
      "dompeet", "dompet", "dompett", "dompit", "domppet", "dompt", "doompet", "dopet", "dumpet", "e",
      "ebbook", "ebok", "eboo", "ebooc", "ebook", "ebookk", "eboook", "ebouk", "ebuok", "eebook",
      "eektronika", "eelektronika", "eesp32", "eet", "elas", "elat", "elatihan", "elay", "electronika",
      "eleektronika", "elekktronika", "elekronika", "elektronica", "elektronika", "elektronike",
      "elektronyka", "elektrronika", "elektrunika", "elekttronika", "eminar", "ena", "enelitian",
      "enggaris", "enghapus", "ensil", "ensor", "eook", "ep32", "ertas", "ertifikat", "es32", "esistor",
      "esp2", "esp3", "esp32", "esp322", "esp332", "espp32", "essp32", "ffotocopy", "ffotokopi",
      "foocopy", "fookopi", "footocopy", "footokopi", "fotcopy", "fotkopi", "fotoccopy", "fotocoopy",
      "fotocopi", "fotocopy", "fotocupy", "fotokkopi", "fotokoopi", "fotokopi", "fotokopy", "fotokupi",
      "fotoocopy", "fotookopi", "fotoopi", "fotoopy", "fottocopy", "fottokopi", "gaambar", "gabar",
      "gamar", "gambaar", "gambar", "gambarr", "gambbar", "gamber", "gambr", "gammbar", "gembar",
      "ggambar", "ggoogle", "gogle", "googe", "googgle", "google", "google meet", "googlee", "googli",
      "googlle", "goole", "gooogle", "gougle", "guogle", "hotocopy", "hotoshop", "hvs", "ibook", "idang",
      "ilid", "isp32", "isuda", "jaangka", "jagka", "janga", "jangca", "janggka", "jangka", "jangkaa",
      "jangke", "jangkka", "janka", "janngka", "jengka", "jian", "jiid", "jiilid", "jild", "jili",
      "jilid", "jilidd", "jiliid", "jillid", "jilyd", "jjilid", "jjumper", "jjurnal", "jlid", "jmper",
      "jomper", "jornal", "jrnal", "jumer", "jummper", "jumpeer", "jumper", "jumperr", "jumpir",
      "jumpper", "jumpr", "junal", "juper", "jural", "jurnaal", "jurnal", "jurnall", "jurnel", "jurnl",
      "jurnnal", "jurrnal", "juumper", "juurnal", "jylid", "kaabel", "kaalkulator", "kaampus",
      "kaapasitor", "kaasitor", "kabbel", "kabe", "kabeel", "kabel", "kabell", "kabil", "kabl", "kael",
      "kakulator", "kalculator", "kalkkulator", "kalklator", "kalkolator", "kalkulator", "kalkulatur",
      "kalkuletor", "kalkullator", "kalkuulator", "kammpus", "kampos", "kamppus", "kamps", "kampus",
      "kampuss", "kampuus", "kamus", "kapaasitor", "kapaitor", "kapasiitor", "kapasitor", "kapasitur",
      "kapassitor", "kapasytor", "kapesitor", "kappasitor", "kapus", "kbel", "keas", "kebel", "keelas",
      "keertas", "kela", "kelaas", "kelas", "kelas online", "kelass", "keles", "kellas", "kels",
      "kempus", "keras", "kerrtas", "kertaas", "kertas", "kertass", "kertes", "kerts", "kerttas",
      "ketas", "ketchup", "ketsa", "kilas", "killshare", "kirtas", "kkelas", "kkuliah", "kkursus",
      "kliah", "koliah", "korsus", "kripsi", "krsus", "kuiah", "kulah", "kuliaah", "kuliah", "kuliahh",
      "kulieh", "kulih", "kuliiah", "kulliah", "kurrsus", "kursos", "kurss", "kurssus", "kursus",
      "kursuss", "kursuus", "kurus", "kusus", "laaboratorium", "laaporan", "lab", "labboratorium",
      "laboatorium", "labooratorium", "laboraatorium", "laboratoriom", "laboratorium", "laboratoryum",
      "laboraturium", "laboretorium", "laborratorium", "labratorium", "laoran", "lapoan", "lapooran",
      "laporaan", "laporan", "laporen", "laporran", "lapporan", "lapran", "lapuran", "lat", "leporan",
      "maakalah", "maalah", "maateri", "macalah", "maeri", "makaah", "makaalah", "makalaah", "makalah",
      "makaleh", "makallah", "makelah", "makkalah", "maklah", "map", "mateeri", "matei", "materi",
      "materii", "materri", "matery", "matiri", "matri", "matteri", "mdul", "mee", "meeet", "meet",
      "meett", "meit", "met", "meteri", "miet", "mmeet", "mmodul", "moddul", "modl", "modol", "modu",
      "modul", "modull", "moduul", "moodul", "moul", "mudul", "nline", "nnotebook", "noebook",
      "nootebook", "notbook", "notebbook", "notebooc", "notebook", "noteboook", "notebouk", "notebuok",
      "noteebook", "noteook", "notibook", "oang", "odemy", "odul", "oga", "ojian", "oline", "onine",
      "onlie", "onliine", "online", "onlinee", "onlini", "onlinne", "onlline", "onlne", "onlyne",
      "onnline", "oogle", "ook", "oom", "oomasi", "ootomasi", "orkshop", "otmasi", "otoasi", "otomaasi",
      "otomasi", "otomassi", "otomasy", "otomesi", "otommasi", "otomsi", "otoomasi", "ottomasi", "paan",
      "paapan", "paaper", "paer", "paktikum", "papa", "papaan", "papan", "papann", "pape", "papeer",
      "papen", "paper", "paperr", "papir", "papn", "pappan", "papper", "papr", "pdf", "pea", "peatihan",
      "peelatihan", "peelitian", "peena", "peenelitian", "peenggaris", "peenghapus", "peensil",
      "peggaris", "peghapus", "pelaatihan", "pelaihan", "pelatihan", "pelatihen", "pelatiihan",
      "pelattihan", "pelatyhan", "peletihan", "pellatihan", "peltihan", "pen", "pena", "penaa", "pene",
      "peneelitian", "peneitian", "peneliitian", "penelitian", "penelitien", "penelityan", "penellitian",
      "penelytian", "pengapus", "pengaris", "penggaaris", "penggaris", "penggarris", "penggarys",
      "penggeris", "pengggaris", "pengghapus", "penghaapus", "penghapos", "penghapus", "penghepus",
      "penghhapus", "penhapus", "penil", "penilitian", "penlitian", "penna", "pennggaris", "pennghapus",
      "pennsil", "pensiil", "pensil", "pensill", "pensl", "penssil", "pensyl", "pepan", "peper", "pesil",
      "phhotocopy", "phhotoshop", "phoocopy", "phooshop", "phootocopy", "phootoshop", "photcopy",
      "photoccopy", "photocopi", "photocopy", "photocupy", "photokopy", "photoocopy", "photooshop",
      "photoshop", "photoshup", "photosshop", "photshop", "phottocopy", "phottoshop", "photucopy",
      "photushop", "phtoshop", "phutoshop", "pidol", "pina", "pinggaris", "pinghapus", "pinsil", "pint",
      "pinter", "pithon", "plc", "plpen", "pna", "pnggaris", "pnsil", "polpen", "poposal", "ppan",
      "ppapan", "ppaper", "ppena", "pper", "ppraktikum", "pprint", "pprinter", "pproposal", "ppulpen",
      "ppython", "praaktikum", "practikum", "prakikum", "prakktikum", "prakticum", "praktiikum",
      "praktikom", "praktikum", "prakttikum", "praktykum", "pratikum", "priint", "priinter", "prin",
      "priner", "prinnt", "prinnter", "print", "printeer", "printer", "printir", "printt", "printter",
      "prit", "priter", "prnt", "prnter", "prooposal", "proosal", "propoosal", "proposal", "proposel",
      "propossal", "propposal", "propsal", "propusal", "prposal", "prrint", "prrinter", "prroposal",
      "prynt", "prynter", "pthon", "pulen", "pullpen", "pulpeen", "pulpen", "pulpenn", "pulpin", "pulpn",
      "pulppen", "pupen", "puulpen", "pyhon", "pythhon", "pythn", "python", "pythonn", "pythoon",
      "pythun", "pyton", "pytthon", "pyython", "raining", "reay", "reelay", "reesistor", "reistor",
      "rela", "relaay", "relai", "relay", "relayy", "reley", "rellay", "rely", "resiistor", "resisstor",
      "resistor", "resisttor", "resistur", "resitor", "ressistor", "resstor", "resystor", "rilay",
      "rint", "risistor", "rlay", "sabilo", "sada", "scaa", "scaada", "scad", "scada", "scadaa",
      "scadda", "scade", "sccada", "scda", "sceda", "scetchup", "scetsa", "scillshare", "scripsi",
      "sdang", "seeminar", "seensor", "seertifikat", "seinar", "semiar", "semiinar", "seminaar",
      "seminar", "seminer", "seminnar", "semminar", "semnar", "semynar", "sennsor", "senor", "sensoor",
      "sensor", "sensorr", "sensr", "senssor", "sensur", "serifikat", "serrtifikat", "sertfikat",
      "sertiffikat", "sertificat", "sertifikat", "sertifiket", "sertifykat", "sertiifikat", "sertivikat",
      "serttifikat", "sesor", "setchup", "setsa", "siang", "sidaang", "sidag", "sidang", "sidangg",
      "sidanng", "siddang", "sideng", "sidng", "sidol", "siidang", "sillshare", "siminar", "sinsor",
      "skada", "skechup", "skeetchup", "skeetsa", "skesa", "sketa", "sketcchup", "sketchhup", "sketchop",
      "sketchup", "skethup", "sketkhup", "sketsa", "sketsaa", "sketse", "sketssa", "skettchup",
      "skettsa", "skiillshare", "skilllshare", "skillshare", "skillshari", "skillshere", "skillshhare",
      "skillsshare", "skilshare", "skipsi", "skitchup", "skitsa", "skketsa", "skkillshare", "skkripsi",
      "skllshare", "skriipsi", "skrippsi", "skripsi", "skripssi", "skripsy", "skrisi", "skrpsi",
      "skrripsi", "skrypsi", "snsor", "sp32", "spdol", "spiddol", "spidl", "spidol", "spidoll",
      "spidool", "spidul", "spiidol", "spiol", "spp", "sppidol", "spydol", "ssidang", "sstabilo",
      "staabilo", "stabbilo", "stabiilo", "stabillo", "stabilo", "stabilu", "stablo", "stabylo",
      "stailo", "stbilo", "stebilo", "taining", "tga", "tgas", "tlis", "toa", "tog", "toga", "togaa",
      "togas", "toge", "togga", "tolis", "tooga", "traaining", "traiing", "traiining", "trainiing",
      "training", "trainning", "trainyng", "traning", "trayning", "treining", "trining", "ttoga",
      "ttugas", "ttulis", "tuas", "tuga", "tugaas", "tugas", "tugass", "tuges", "tuggas", "tugs", "tuis",
      "tuli", "tuliis", "tulis", "tuliss", "tullis", "tuls", "tulys", "tuugas", "tuulis", "uaang", "uag",
      "uan", "uang", "uang kuliah", "uangg", "uanng", "uddemy", "udeemy", "udem", "udemi", "udemmy",
      "udemy", "udemyy", "udey", "udimy", "udmy", "uemy", "ueng", "ugas", "uian", "ujan", "ujia",
      "ujiaan", "ujian", "ujiann", "ujien", "ujiian", "ujin", "ujjian", "ujyan", "ukt", "uku", "ulis",
      "ung", "usur", "uuang", "wiisuda", "wisda", "wisoda", "wissuda", "wisua", "wisuda", "wisudaa",
      "wisudda", "wisude", "wisuuda", "wiuda", "wokshop", "woorkshop", "worcshop", "workhop",
      "workkshop", "workshhop", "workshop", "workshup", "worksshop", "worrkshop", "worshop", "wrkshop",
      "wsuda", "zom", "zoo", "zoom", "zoomm", "zooom", "zoum", "zuom", "zzoom"
    ],
    "Kesehatan": [
      "aag", "aalat", "aangin", "aantangin", "aantibiotik", "aapotek", "aapotik", "aat", "abut",
      "acamata", "agin", "akit", "aksin", "ala", "alaat", "alat", "alatt", "alep", "alet", "allat",
      "alsem", "alt", "ambal", "ambung", "anadol", "anangin", "and", "andsanitizer", "anggin", "angi",
      "angiin", "angin", "anginn", "angn", "angyn", "anibiotik", "anin", "anitizer", "anngin",
      "anntangin", "anntibiotik", "antaangin", "antagin", "antanggin", "antangin", "antangyn",
      "antanngin", "antbiotik", "antengin", "antibbiotik", "antibiiotik", "antibiotic", "antibiotik",
      "antibiotyk", "antibiutik", "antibyotik", "antiibiotik", "antiiotik", "antngin", "anttangin",
      "aotek", "aotik", "apid", "apoek", "apoik", "apootek", "apootik", "apotec", "apoteek", "apotek",
      "apotekk", "apotic", "apotiik", "apotik", "apotikk", "apotk", "apottek", "apottik", "apotyk",
      "appotek", "appotik", "aptek", "aptik", "aracetamol", "arah", "arasetamol", "asker", "ata",
      "atangin", "atuk", "ayu", "baalsem", "baatuk", "balem", "ballsem", "balseem", "balsem", "balsemm",
      "balsim", "balsm", "balssem", "basem", "bat", "batk", "batok", "battuk", "batu", "batuc", "batuk",
      "batukk", "batuuk", "bauk", "baya", "bbalsem", "bbatuk", "bberobat", "bbetadine", "bbiaya",
      "bbodrex", "bdrex", "beadine", "beerobat", "beetadine", "belsem", "beobat", "berbat", "beroat",
      "berobaat", "berobat", "berobbat", "berobet", "beroobat", "berrobat", "berubat", "betaadine",
      "betaddine", "betadiine", "betadine", "betadini", "betadyne", "betaine", "betdine", "betedine",
      "bettadine", "betuk", "biaa", "biaaya", "biaia", "biay", "biaya", "biaya berobat", "biayaa",
      "biaye", "biayya", "bieya", "biiaya", "birobat", "biya", "boddrex", "bodex", "bodreex", "bodrex",
      "bodrexx", "bodrix", "bodrrex", "bodrx", "boodrex", "borex", "budrex", "caabut", "cabbut", "cabot",
      "cabt", "cabu", "cabut", "cabutt", "cabuut", "cacamata", "caling", "caut", "cayu", "cbut",
      "ccabut", "ccounterpain", "cebut", "cek", "cek kesehatan", "cepala", "cesehatan", "clinik",
      "colesterol", "consultasi", "contak", "conterpain", "coonterpain", "coounterpain", "counerpain",
      "counnterpain", "counteerpain", "counterpain", "counterpayn", "counterpein", "countirpain",
      "countterpain", "couterpain", "daah", "daarah", "dara", "daraah", "darah", "darahh", "dareh",
      "darh", "darrah", "ddarah", "ddemam", "ddokter", "deam", "deemam", "dema", "demaam", "demam",
      "demamm", "demem", "demm", "demmam", "derah", "dimam", "dkter", "dmam", "docter", "doker",
      "dokkter", "dokteer", "dokter", "dokter gigi", "dokterr", "doktir", "doktr", "doktter", "dookter",
      "doter", "drah", "edis", "efleksi", "elat", "emam", "engin", "ensa", "ensi", "epala", "erban",
      "ermometer", "esehatan", "esep", "est", "etes", "ffisioterapi", "fiioterapi", "fiisioterapi",
      "fisiioterapi", "fisiooterapi", "fisioterapi", "fisioterapy", "fisioterepi", "fisiotirapi",
      "fisiotterapi", "fisiterapi", "fisiuterapi", "fisoterapi", "flu", "ggi", "ggigi", "ggula", "gig",
      "giggi", "gigi", "gigii", "gigy", "gii", "giigi", "gla", "gola", "gua", "gul", "gula", "gulaa",
      "gule", "gulla", "guula", "gygi", "haand", "haandsanitizer", "had", "hadsanitizer", "han", "hand",
      "hand sanitizer", "handanitizer", "handd", "handdsanitizer", "handsaanitizer", "handsanitizer",
      "handsanitizir", "handsanityzer", "handsanytizer", "handsenitizer", "handssanitizer", "hannd",
      "hanndsanitizer", "hend", "hhand", "hnd", "igi", "ijat", "inyak", "itamin", "kaacamata", "kaamata",
      "kaayu", "kacaamata", "kacaata", "kacamaata", "kacamata", "kacamate", "kacameta", "kacammata",
      "kaccamata", "kacemata", "kaiu", "kau", "kay", "kayo", "kayu", "kayuu", "kayyu", "keala",
      "keehatan", "keepala", "keesehatan", "kepaa", "kepaala", "kepala", "kepalaa", "kepale", "kepalla",
      "kepela", "kepla", "keppala", "keseatan", "keseehatan", "kesehaatan", "kesehatan", "kesehaten",
      "kesehetan", "kesehhatan", "keshatan", "kesihatan", "keyu", "kincare", "kinik", "kkayu", "kklinik",
      "kkolesterol", "kkonsultasi", "kkontak", "klesterol", "kliik", "kliinik", "klinic", "kliniik",
      "klinik", "klinikk", "klink", "klinnik", "klinyk", "kllinik", "knsultasi", "kntak", "koesterol",
      "koleesterol", "kolessterol", "kolesterol", "kolesterul", "kolestirol", "kolestterol", "koleterol",
      "kolisterol", "kollesterol", "konak", "konnsultasi", "konntak", "konsltasi", "konsoltasi",
      "konssultasi", "konsulltasi", "konsultasi", "konsultasy", "konsultesi", "konsuultasi", "kontaak",
      "kontac", "kontak", "kontakk", "kontek", "kontk", "konttak", "konultasi", "koontak", "kyu",
      "laambung", "labung", "lambbung", "lambng", "lambong", "lambung", "lambunng", "lambuung",
      "lammbung", "lamung", "lat", "leensa", "lembung", "lena", "lennsa", "lens", "lensa", "lensaa",
      "lense", "lenssa", "lesa", "lester", "linsa", "llambung", "llensa", "lnsa", "maa", "maaag", "maag",
      "maagg", "maasker", "maata", "maeg", "mag", "maker", "mascer", "maser", "maskeer", "masker",
      "maskerr", "maskir", "maskker", "maskr", "massker", "mat", "mata", "mataa", "mate", "matta",
      "mdis", "meag", "meddis", "medi", "mediis", "medis", "mediss", "meds", "medys", "meedis", "meis",
      "mesker", "meta", "midis", "miinyak", "milanta", "minak", "miniak", "minnyak", "minyaak", "minyac",
      "minyak", "minyak kayu putih", "minyakk", "minyek", "minyk", "minyyak", "miyak", "mlanta", "mmaag",
      "mmata", "mmedis", "mmylanta", "mta", "myanta", "mylaanta", "mylannta", "mylanta", "mylante",
      "mylantta", "mylata", "mylenta", "myllanta", "mylnta", "ngin", "oalit", "oat", "oba", "obaat",
      "obat", "obat batuk", "obat flu", "obatt", "obbat", "obet", "obt", "olak", "oobat", "ooralit",
      "oraalit", "orait", "oraliit", "oralit", "oralitt", "orallit", "oralt", "oralyt", "orelit",
      "orlit", "orralit", "orut", "paacetamol", "paadol", "paanadol", "paaracetamol", "paarasetamol",
      "paasetamol", "panaadol", "panaddol", "panadol", "panadool", "panadul", "panaol", "pandol",
      "panedol", "pannadol", "paraacetamol", "paraasetamol", "paraccetamol", "paraceetamol",
      "paracetamol", "paracetamul", "paracetemol", "paracitamol", "paraetamol", "paraketamol",
      "paraseetamol", "parasetamol", "parasetamul", "parasetemol", "parasitamol", "parassetamol",
      "parcetamol", "paresetamol", "parrasetamol", "peban", "peerban", "penadol", "peran", "perbaan",
      "perban", "perbann", "perbban", "perben", "perbn", "perrban", "pester", "piat", "piijat", "pija",
      "pijaat", "pijat", "pijatt", "pijet", "pijjat", "pijt", "pirban", "pjat", "pleester", "pleser",
      "plesster", "plesteer", "plester", "plestir", "plestter", "pleter", "plister", "pllester",
      "plster", "pomag", "poskesmas", "potein", "potih", "pperban", "ppijat", "ppromag", "pprotein",
      "ppuskesmas", "pputih", "prmag", "proag", "proein", "promaag", "promag", "promagg", "promeg",
      "promg", "prommag", "proomag", "prootein", "proteein", "proteiin", "protein", "proteyn", "protiin",
      "protin", "prottein", "prromag", "prrotein", "prtein", "prumag", "pskesmas", "ptih", "puih",
      "pukesmas", "puscesmas", "pusesmas", "puskeesmas", "puskesmas", "puskesmes", "puskessmas",
      "puskismas", "puskkesmas", "pusksmas", "puth", "puti", "putih", "putihh", "putiih", "puttih",
      "putyh", "puutih", "pyjat", "raapid", "raid", "rapd", "rapi", "rapid", "rapidd", "rapiid",
      "rappid", "rapyd", "reefleksi", "reep", "reesep", "refeksi", "reffleksi", "reflecsi", "refleeksi",
      "reflekksi", "refleksi", "refleksy", "refliksi", "reflksi", "reflleksi", "releksi", "repid",
      "rese", "reseep", "resep", "resepp", "resip", "resp", "ressep", "risep", "rmah", "romah", "rpid",
      "rrapid", "rresep", "rrumah", "rs", "rsep", "ruah", "ruma", "rumaah", "rumah", "rumah sakit",
      "rumahh", "rumeh", "rumh", "rummah", "rut", "ruumah", "saakit", "saalep", "saanitizer", "sab",
      "sacit", "saep", "sait", "saitizer", "saki", "sakiit", "sakit", "sakit kepala", "sakitt", "sakkit",
      "sakt", "sakyt", "sale", "saleep", "salep", "salepp", "saling", "salip", "sallep", "salp",
      "saniitizer", "saniizer", "sanitiizer", "sanitizer", "sanitizir", "sanittizer", "sanityzer",
      "sannitizer", "santizer", "sanytizer", "scaaling", "scaing", "scaliing", "scaling", "scalinng",
      "scalling", "scalng", "scalyng", "sccaling", "sceling", "scincare", "scling", "sekit", "selep",
      "sincare", "skicare", "skiincare", "skinare", "skincaare", "skincare", "skincari", "skinccare",
      "skincere", "skinkare", "skinncare", "skit", "slep", "soplemen", "sosu", "splemen", "ssalep",
      "ssu", "ssuplemen", "ssusu", "sswab", "sulemen", "supemen", "supleemen", "suplemen", "suplemin",
      "suplemmen", "suplimen", "supllemen", "suplmen", "supplemen", "sus", "suso", "sussu", "susu",
      "susuu", "suu", "suusu", "swa", "swaab", "swab", "swabb", "swb", "sweb", "swwab", "taambal",
      "tabal", "tamal", "tambaal", "tambal", "tambal gigi", "tamball", "tambbal", "tambel", "tambl",
      "tammbal", "teensi", "teermometer", "tees", "teest", "teetes", "tembal", "temometer", "teni",
      "tennsi", "tens", "tensi", "tensii", "tenssi", "tensy", "termmeter", "termmometer", "termometer",
      "termometir", "termomiter", "termommeter", "termoometer", "termumeter", "terometer", "terrmometer",
      "tes", "tesi", "tesst", "test", "testt", "tet", "tete", "tetees", "tetes", "tetess", "tetis",
      "tets", "tettes", "tinsi", "tist", "tites", "tlak", "tmbal", "tnsi", "toak", "tola", "tolaak",
      "tolac", "tolak", "tolakk", "tolek", "tolk", "tollak", "toolak", "tst", "ttensi", "ttes", "ttest",
      "ttetes", "ttolak", "ubat", "ula", "umah", "urot", "urrut", "urt", "uru", "urut", "urutt", "uruut",
      "usu", "utih", "uurut", "uut", "vaaksin", "vacsin", "vakin", "vakksin", "vaksiin", "vaksin",
      "vaksinn", "vaksn", "vakssin", "vaksyn", "vasin", "veksin", "viamin", "viitamin", "vitaamin",
      "vitain", "vitamiin", "vitamin", "vitammin", "vitamyn", "vitemin", "vitmin", "vittamin", "vtamin",
      "wab"
    ],
    "Hiburan": [
      "3d", "aanime", "adminton", "afe", "aime", "ain", "alan", "alorant", "aman", "ame", "amepad",
      "amera", "ames", "anga", "anie", "aniime", "anim", "anime", "animee", "animi", "animme", "anme",
      "annime", "antai", "anyme", "araoke", "arnet", "art", "baadminton", "baddminton", "badinton",
      "badmiinton", "badminnton", "badminton", "badmintun", "badmminton", "badmnton", "badmynton",
      "baminton", "bbadminton", "bbermain", "bbilliard", "bbioskop", "bbuku", "beermain", "bemain",
      "berain", "bermaain", "bermaiin", "bermain", "bermayn", "bermein", "bermin", "bermmain",
      "berrmain", "biilliard", "biioskop", "biliard", "billard", "billiaard", "billiard", "billiarrd",
      "billierd", "billiiard", "billliard", "billyard", "biokop", "biooskop", "bioscop", "bioskkop",
      "bioskoop", "bioskop", "bioskup", "biosop", "biosskop", "birmain", "biskop", "biuskop", "bku",
      "blliard", "boku", "bucu", "buk", "bukku", "buko", "buku", "bukuu", "buu", "buuku", "bylliard",
      "caafe", "cae", "caf", "cafe", "cafee", "caffe", "cafi", "camera", "caraoke", "cave", "ccafe",
      "ccinema", "ccoffee", "cefe", "cfe", "cffee", "cgv", "ciema", "ciinema", "cinea", "cineema",
      "cinema", "cinemaa", "cineme", "cinemma", "cinima", "cinma", "cinnema", "cnema", "cofee", "coffe",
      "coffee", "coffee shop", "coffeee", "coffei", "cofffee", "coffie", "cofvee", "colam", "comik",
      "conser", "cooffee", "covfee", "cuffee", "damond", "ddekorasi", "ddesain", "ddiamond", "ddigital",
      "ddisney", "deain", "decorasi", "deekorasi", "deesain", "dekkorasi", "dekoasi", "dekoorasi",
      "dekoraasi", "dekorasi", "dekorasy", "dekoresi", "dekorrasi", "dekrasi", "dekurasi", "desaain",
      "desaiin", "desain", "desainn", "desan", "desayn", "desein", "desin", "dessain", "dgital",
      "diaamond", "diammond", "diamnd", "diamond", "diamonnd", "diamoond", "diamund", "diaond",
      "diemond", "diggital", "digial", "digiital", "digitaal", "digital", "digital art", "digitel",
      "digittal", "digtal", "digytal", "diiamond", "diigital", "diisney", "diital", "dimond", "diney",
      "disain", "disey", "disneey", "disnei", "disney", "disneyy", "disniy", "disnney", "disny",
      "dissney", "dit", "dsney", "ealing", "ector", "eddit", "edi", "ediit", "edit", "editt", "edt",
      "edyt", "eedit", "eent", "eepic", "eevent", "egends", "eic", "eit", "ekreasi", "enang", "enar",
      "ender", "enime", "ensa", "enshin", "ental", "epc", "epi", "epic", "epicc", "epiic", "epik",
      "eppic", "epyc", "erchandise", "etflix", "eveent", "even", "evennt", "event", "eventt", "evet",
      "evint", "evnt", "evvent", "fee", "ff", "ffilm", "ffire", "ffitness", "ffoto", "ffotografi",
      "ffree", "ffutsal", "fie", "fiilm", "fiire", "fiitness", "fil", "fillm", "film", "filmm", "fim",
      "finess", "fir", "fire", "firee", "firi", "firre", "fitess", "fitneess", "fitness", "fitnesss",
      "fitniss", "fitnness", "fitnss", "fittness", "flm", "foo", "foografi", "footo", "footografi",
      "fot", "fotgrafi", "foto", "fotoggrafi", "fotografi", "fotografy", "fotogravi", "fotogrefi",
      "fotogrrafi", "fotoo", "fotoografi", "fotorafi", "fotsal", "fotto", "fottografi", "fotu", "fre",
      "free", "free fire", "freee", "frei", "frie", "frree", "ftness", "fto", "ftsal", "fusal", "futal",
      "futo", "futsaal", "futsal", "futsall", "futsel", "futsl", "futssal", "futtsal", "fuutsal", "fylm",
      "fyre", "fytness", "gaame", "gaamepad", "gaames", "gae", "gaepad", "gaes", "gam", "game", "gamead",
      "gamee", "gameepad", "gamees", "gamepaad", "gamepad", "gameped", "gameppad", "games", "gamess",
      "gami", "gamipad", "gamis", "gamme", "gammepad", "gammes", "gampad", "gams", "geenshin", "geme",
      "gemepad", "gemes", "genhin", "gennshin", "genshhin", "genshiin", "genshin", "genshyn", "gensin",
      "gensshin", "geshin", "ggame", "ggames", "ggenshin", "ggitar", "giar", "giitar", "ginshin", "gita",
      "gitaar", "gitar", "gitarr", "giter", "gitr", "gittar", "gme", "gmes", "gtar", "gym", "gytar",
      "haling", "hbi", "hburan", "heaaling", "heaing", "healiing", "healing", "healinng", "healling",
      "healng", "healyng", "heealing", "heeling", "heling", "hhiburan", "hhobi", "hhotstar", "hibburan",
      "hiboran", "hibran", "hibuan", "hiburaan", "hiburan", "hiburen", "hiburran", "hibuuran",
      "hiiburan", "hiuran", "hob", "hobbi", "hobi", "hobii", "hoby", "hoi", "hoobi", "hootstar", "hop",
      "hostar", "hotsar", "hotsstar", "hotstaar", "hotstar", "hotster", "hotsttar", "hottar", "hottstar",
      "htstar", "hubi", "hutstar", "iburan", "idit", "iiqiyi", "iiyi", "iket", "ilm", "ini", "ioutube",
      "ipic", "iqii", "iqiii", "iqiiyi", "iqiy", "iqiyi", "iqiyii", "iqiyy", "iqiyyi", "iqqiyi", "iqyi",
      "iqyyi", "ire", "isata", "itar", "ivent", "jaalan", "jaan", "jala", "jalaan", "jalan",
      "jalan jalan", "jalann", "jalen", "jallan", "jaln", "jelan", "jjalan", "jjoystick", "jlan",
      "joistick", "jooystick", "jostick", "joysick", "joysstick", "joysticc", "joystick", "joystiick",
      "joystikk", "joysttick", "joystyck", "joytick", "kaafe", "kaamera", "kaaoke", "kaaraoke", "kae",
      "kaera", "kaf", "kafe", "kafee", "kaffe", "kafi", "kamea", "kameera", "kamera", "kameraa",
      "kamere", "kamerra", "kamira", "kammera", "kamra", "karaaoke", "karake", "karaoce", "karaoke",
      "karaoki", "karaokke", "karaooke", "karauke", "kareoke", "kave", "kefe", "kfe", "kkafe", "kkolam",
      "kkomik", "kkonser", "klam", "kmik", "knser", "koam", "koik", "kola", "kolaam", "kolam", "kolamm",
      "kolem", "kollam", "kolm", "komi", "komic", "komiik", "komik", "komikk", "komk", "kommik", "komyk",
      "koner", "konnser", "konseer", "konser", "konserr", "konsir", "konsr", "konsser", "koolam",
      "koomik", "koonser", "koser", "kulam", "lahraga", "laystation", "lburan", "leegends", "leends",
      "leensa", "legeds", "legeends", "legendds", "legends", "legennds", "leggends", "leginds", "legnds",
      "lena", "lennsa", "lens", "lensa", "lensaa", "lense", "lenssa", "lesa", "lgends", "libburan",
      "liboran", "libran", "libuan", "liburaan", "liburan", "liburen", "liburran", "libuuran", "ligends",
      "liiburan", "linsa", "liuran", "llensa", "lnsa", "maain", "maanga", "maga", "mai", "maiin", "main",
      "mainn", "man", "mana", "mang", "manga", "mangaa", "mange", "mangga", "mannga", "mayn", "mbile",
      "mechandise", "meerchandise", "mein", "menga", "mercandise", "mercchandise", "merchaandise",
      "merchandise", "merchandisi", "merchandyse", "merchendise", "merchhandise", "merhandise",
      "merkhandise", "mii", "miini", "min", "mini", "mini soccer", "minii", "minni", "miny", "ml",
      "mmain", "mmanga", "mmini", "mmobile", "mmusik", "mnga", "mni", "mobbile", "mobie", "mobiile",
      "mobile", "mobile legends", "mobilee", "mobili", "mobille", "moble", "mobyle", "moile", "moobile",
      "mosik", "msik", "muik", "musi", "music", "musiik", "musik", "musikk", "musk", "mussik", "musyk",
      "muusik", "myni", "neetflix", "neflix", "netfflix", "netfix", "netfliix", "netflix", "netfllix",
      "netflyx", "netlix", "nettflix", "netvlix", "nitflix", "nngkrong", "nnongkrong", "nnonton",
      "nnovel", "nnton", "noel", "nogkrong", "nongcrong", "nonggkrong", "nongkkrong", "nongkrong",
      "nongkrrong", "nongkrung", "nongrong", "nonkrong", "nonngkrong", "nonnton", "nonon", "nontn",
      "nonton", "nontonn", "nontoon", "nontton", "nontun", "noongkrong", "noonton", "noovel", "noton",
      "nove", "noveel", "novel", "novell", "novil", "novl", "novvel", "nunton", "nuvel", "nvel",
      "oahraga", "obi", "oblox", "occer", "olaahraga", "olahaga", "olahhraga", "olahraaga", "olahraga",
      "olahrage", "olahrega", "olahrraga", "olaraga", "olehraga", "olhraga", "opup", "oster", "oto",
      "oucher", "outube", "ovel", "paantai", "panai", "panntai", "pantaai", "pantai", "pantaii",
      "pantay", "pantei", "panti", "panttai", "patai", "paystation", "pbg", "pemium", "pentai", "pic",
      "plaaystation", "plaistation", "plastation", "playsstation", "playstation", "playstatiun",
      "playstatyon", "playstetion", "playsttation", "playtation", "playystation", "pobg", "pooster",
      "poser", "posster", "posteer", "poster", "posterr", "postir", "postr", "postter", "poter",
      "potify", "pposter", "ppremium", "ppubg", "preemium", "preium", "premiium", "premiom", "premium",
      "premiuum", "premmium", "premum", "premyum", "primium", "prmium", "ps", "pster", "pub", "pubbg",
      "pubg", "pubgg", "pug", "puubg", "rblox", "reang", "recreasi", "reder", "ree", "reekreasi",
      "reenang", "reender", "reental", "rekeasi", "rekkreasi", "rekrasi", "rekreaasi", "rekreasi",
      "rekreasy", "rekreeasi", "rekreesi", "rekriasi", "rekrreasi", "renaang", "renag", "renal",
      "renang", "renangg", "renanng", "rendder", "rendeer", "render", "renderr", "rendir", "rendr",
      "reneng", "rener", "rennang", "rennder", "renng", "renntal", "rentaal", "rental", "rental ps",
      "rentall", "rentel", "rentl", "renttal", "retal", "rinang", "rinder", "rintal", "ripod", "rnang",
      "rnder", "rntal", "robblox", "robllox", "robloox", "roblox", "robloxx", "roblux", "roblx", "robox",
      "rolox", "rooblox", "rroblox", "sccer", "seam", "sear", "seenar", "sena", "senaar", "senar",
      "senarr", "sener", "sennar", "senr", "shhop", "sho", "shoop", "shop", "shopp", "shp", "shup",
      "siker", "sinar", "snar", "socccer", "socceer", "soccer", "soccerr", "soccir", "soccr", "socer",
      "socker", "sokcer", "sooccer", "sop", "sotify", "spoify", "spootify", "spotfy", "spotiffy",
      "spotifi", "spotify", "spotiify", "spotivy", "spottify", "spotyfy", "sppotify", "ssenar", "sshop",
      "ssoccer", "ssteam", "sstiker", "stam", "stea", "steaam", "steam", "steamm", "steeam", "steem",
      "stem", "stiam", "sticer", "stier", "stiiker", "stikeer", "stiker", "stikerr", "stikir", "stikker",
      "stikr", "stker", "stteam", "sttiker", "taaman", "taan", "tama", "tamaan", "taman", "tamann",
      "tamen", "tamman", "tamn", "team", "teman", "ticet", "tiet", "tiiket", "tike", "tikeet", "tiket",
      "tiket event", "tiket konser", "tikett", "tikit", "tikket", "tikt", "tipod", "tket", "tman",
      "toopup", "top", "top up", "topop", "topp", "toppup", "topu", "topup", "topupp", "topuup", "toup",
      "tpup", "triipod", "triod", "tripd", "tripod", "tripodd", "tripood", "trippod", "tripud", "trpod",
      "trripod", "trypod", "ttaman", "ttiket", "ttopup", "tupup", "ubg", "uku", "up", "vaalorant",
      "vallorant", "valoant", "valoorant", "valoraant", "valorant", "valorent", "valorrant", "valrant",
      "valurant", "vaorant", "vctor", "vecctor", "vecor", "vectoor", "vector", "vectorr", "vectr",
      "vecttor", "vectur", "veector", "vektor", "velorant", "vent", "vetor", "vilm", "vire", "viu",
      "vocher", "voocher", "vooucher", "voto", "vouccher", "voucer", "voucheer", "voucher",
      "voucher game", "vouchher", "vouchir", "vouher", "voukher", "vouucher", "vree", "waarnet", "wanet",
      "waret", "warneet", "warnet", "warnett", "warnit", "warnnet", "warnt", "warrnet", "wernet",
      "wiata", "wiisata", "wisaa", "wisaata", "wisata", "wisataa", "wisate", "wisatta", "wiseta",
      "wissata", "wista", "wrnet", "wsata", "xxi", "yootube", "yooutube", "yotube", "youtbe", "youtobe",
      "youttube", "youtubbe", "youtube", "youtube premium", "youtubi", "youtuube", "youube"
    ],
    "Tagihan": [
      "aadmin", "aakulaku", "aangsuran", "aasuransi", "aculaku", "addmin", "adin", "admi", "admiin",
      "admin", "adminn", "admmin", "admn", "admyn", "agihan", "agsuran", "aintenance", "air", "ajak",
      "akkulaku", "aklaku", "akolaku", "akuaku", "akulaaku", "akulacu", "akulakku", "akulako", "akulaku",
      "akuleku", "akulku", "amin", "ampah", "angganan", "anggsuran", "angsoran", "angsran", "angssuran",
      "angsuran", "angsuren", "angsurran", "angsuuran", "anguran", "ank", "anngsuran", "ansuran",
      "aptop", "artu", "asoransi", "asransi", "assuransi", "asuansi", "asuraansi", "asurannsi",
      "asuransi", "asuransy", "asurensi", "asurnsi", "asurransi", "asuuransi", "atm", "atungan",
      "aundry", "ayar", "aylater", "baank", "baar", "baayar", "baiar", "bak", "ban", "banc", "bank",
      "bankk", "bannk", "baya", "bayaar", "bayar", "bayarr", "bayer", "bayr", "bayyar", "bbank",
      "bbayar", "bbiaya", "bbpjs", "bbulanan", "benk", "beyar", "biaa", "biaaya", "biaia", "biay",
      "biaya", "biaya admin", "biaya transfer", "biayaa", "biaye", "biayya", "bieya", "biiaya", "biya",
      "bjs", "blanan", "bnk", "bolanan", "bpj", "bpjjs", "bpjs", "bpjss", "bppjs", "bps", "buanan",
      "bulaan", "bulaanan", "bulanaan", "bulanan", "bulanen", "bulannan", "bulenan", "bullanan",
      "bulnan", "carge", "cartu", "ccharge", "ccicilan", "ccilan", "ceamanan", "cebersihan", "chaarge",
      "chage", "chare", "charge", "chargee", "chargge", "chargi", "charrge", "cherge", "chharge",
      "chrge", "ciccilan", "cician", "ciciilan", "cicilaan", "cicilan", "cicilan hp", "cicilan laptop",
      "cicilan motor", "cicilen", "cicillan", "ciclan", "cicylan", "ciicilan", "ciilan", "contrak",
      "contrakan", "cost", "credit", "credivo", "dam", "dbit", "ddebit", "ddenda", "debbit", "debi",
      "debiit", "debit", "debitt", "debt", "debyt", "deda", "deebit", "deenda", "deit", "dena", "dend",
      "denda", "dendaa", "dendda", "dende", "dennda", "dibit", "dinda", "dmin", "dnda", "eamanan",
      "ebersihan", "ebit", "edmin", "elat", "embayaran", "enda", "erbaikan", "ervis", "ewa", "hhutang",
      "hopeepaylater", "hotang", "hp", "htang", "huang", "hutaang", "hutag", "hutang", "hutangg",
      "hutanng", "huteng", "hutng", "huttang", "huutang", "ifi", "iinternet", "iiuran", "inernet",
      "injaman", "innternet", "inteernet", "intenet", "internet", "internit", "internnet", "interrnet",
      "intirnet", "intrnet", "intternet", "ioran", "iran", "istrik", "iternet", "iuan", "iura", "iuraan",
      "iuran", "iurann", "iuren", "iurn", "iurran", "iuuran", "kaartu", "kamanan", "karrtu", "kart",
      "karto", "karttu", "kartu", "kartu debit", "kartu kredit", "kartuu", "karu", "kas", "katu",
      "kbersihan", "keaamanan", "keaanan", "keamaanan", "keamanan", "keamanen", "keamannan", "keamenan",
      "keammanan", "keamnan", "kebbersihan", "kebeersihan", "keberrsihan", "kebersihan", "kebersihen",
      "keberssihan", "kebersyhan", "kebesihan", "kebirsihan", "kebrsihan", "kedit", "kedivo",
      "keeamanan", "kertu", "kkartu", "kkontrak", "kkontrakan", "kkost", "kkredit", "kkredivo", "kntrak",
      "kntrakan", "konntrak", "konntrakan", "konrak", "konrakan", "kontak", "kontakan", "kontraak",
      "kontraakan", "kontrac", "kontracan", "kontrak", "kontrakan", "kontraken", "kontrek", "kontrekan",
      "kontrrak", "kontrrakan", "konttrak", "konttrakan", "koontrak", "koost", "kos", "kosst", "kost",
      "kostt", "kot", "krdit", "krdivo", "kreddit", "kreddivo", "krediit", "krediivo", "kredit",
      "kreditt", "kredivo", "kredivu", "kredivvo", "kredt", "kredvo", "kredyt", "kredyvo", "kreedit",
      "kreedivo", "kreit", "kreivo", "kridit", "kst", "kust", "laangganan", "laaptop", "laaundry",
      "lagganan", "landry", "langanan", "langgaanan", "langganan", "langganen", "langgannan",
      "langgenan", "langgganan", "lanngganan", "laondry", "lapop", "lapptop", "laptoop", "laptop",
      "laptopp", "laptp", "lapttop", "laptup", "latop", "laudry", "launddry", "laundri", "laundrry",
      "laundry", "launndry", "launry", "lauundry", "lengganan", "leptop", "leundry", "liistrik",
      "lisrik", "lisstrik", "listik", "listric", "listriik", "listrik", "listrrik", "listryk",
      "listtrik", "litrik", "llangganan", "llaptop", "llistrik", "maaintenance", "maiintenance",
      "mainenance", "mainntenance", "mainteenance", "maintenance", "maintenanci", "maintenanke",
      "maintenence", "maintinance", "mainttenance", "maitenance", "mbil", "mmobil", "mmotor", "mobbil",
      "mobi", "mobiil", "mobil", "mobill", "mobl", "mobyl", "moil", "moobil", "moor", "mootor", "moto",
      "motoor", "motor", "motorr", "motr", "mottor", "motur", "mtor", "mubil", "mutor", "obil", "oken",
      "ost", "otang", "otor", "paajak", "paak", "paatungan", "paaylater", "pailater", "paja", "pajaak",
      "pajac", "pajak", "pajak mobil", "pajak motor", "pajakk", "pajek", "pajjak", "pajk", "palater",
      "pam", "patngan", "patongan", "pattungan", "patugan", "patungan", "patungen", "patunggan",
      "patunngan", "patuungan", "paungan", "payater", "paylaater", "paylater", "paylatir", "paylatter",
      "payleter", "payllater", "paylter", "payylater", "pbb", "pda", "pdaam", "pdam", "pdamm", "pddam",
      "pdem", "pdm", "pebaikan", "pebayaran", "peembayaran", "peerbaikan", "pejak", "pemayaran",
      "pembaayaran", "pembaiaran", "pembayaran", "pembayaren", "pembayeran", "pembayyaran",
      "pembbayaran", "pembeyaran", "pembyaran", "pemi", "peraikan", "perbaaikan", "perbaican",
      "perbaiikan", "perbaikan", "perbaiken", "perbaykan", "perbbaikan", "perbeikan", "perbikan",
      "petungan", "piinjaman", "pijaman", "pinaman", "pinjaaman", "pinjaman", "pinjamen", "pinjamman",
      "pinjeman", "pinjjaman", "pinjman", "pinnjaman", "pjak", "pjs", "pln", "pnjaman", "ppdam",
      "ppremi", "preemi", "prei", "prem", "premi", "premii", "premmi", "premy", "primi", "prmi",
      "prremi", "ransfer", "remi", "rmah", "romah", "rrumah", "ruah", "ruma", "rumaah", "rumah",
      "rumahh", "rumeh", "rumh", "rummah", "ruumah", "saampah", "samah", "sammpah", "sampaah", "sampah",
      "sampahh", "sampeh", "samph", "samppah", "sapah", "saylater", "sea", "seervis", "seewa", "sempah",
      "seris", "serrvis", "serviis", "servis", "serviss", "servs", "servvis", "servys", "sevis", "sew",
      "sewa", "sewaa", "sewe", "sewwa", "shhopeepaylater", "shoeepaylater", "shoopeepaylater",
      "shopeeepaylater", "shopeepailater", "shopeepaylater", "shopeepaylatir", "shopeepayleter",
      "shopeepeylater", "shopeeppaylater", "shopeipaylater", "shopepaylater", "sirvis", "siwa", "smpah",
      "spaaylater", "spailater", "spalater", "spayater", "spaylaater", "spaylater", "spaylatir",
      "spayleter", "spayllater", "spayylater", "speylater", "srvis", "ssewa", "swa", "taagihan",
      "taggihan", "taghan", "tagian", "tagihaan", "tagihan", "tagihen", "tagihhan", "tagiihan",
      "tagyhan", "taihan", "tang", "tansfer", "tarik tunai", "teat", "teelat", "tegihan", "tela",
      "telaat", "telat", "telatt", "telet", "tellat", "telt", "tilat", "tken", "tlat", "tocen", "toen",
      "toke", "tokeen", "token", "token listrik", "tokenn", "tokin", "tokken", "tokn", "tooken",
      "traansfer", "tranfer", "trannsfer", "transfer", "transffer", "transfir", "transsfer", "transver",
      "trasfer", "trensfer", "trnsfer", "ttelat", "ttoken", "uang", "umah", "uran", "utaang", "utag",
      "utan", "utang", "utangg", "utanng", "uteng", "utng", "uttang", "uutang", "wfi", "wif", "wiffi",
      "wifi", "wifi bulanan", "wifii", "wify", "wii", "wiifi", "wivi", "wwifi", "wyfi"
    ],
    "Utang/Bon": [
      "utang",
      "hutang",
      "bon",
      "ngebon",
      "ngutang",
      "pinjam",
      "pinjaman",
      "dipinjam",
      "meminjam",
      "bayar utang",
      "bayar hutang",
      "bayar bon",
      "cicil utang",
      "cicil hutang",
      "cicilan utang",
      "cicilan hutang",
      "kasbon",
      "kas bon",
      "tempo",
      "bayar tempo",
      "bon warung",
      "bon kantin",
      "bon makan",
      "utang makan",
      "hutang makan",
      "utang teman",
      "hutang ke teman",
      "pinjam uang",
      "bayar pinjaman",
      "pelunasan",
      "lunas",
      "melunasi",
      "tagihan utang",
      "tagihan hutang"
    ],

    "Lainnya": [
      "aacara", "aadministrasi", "aamplop", "aara", "acaa", "acaara", "acar", "acara", "acaraa", "acare",
      "acarra", "accara", "acera", "acra", "addministrasi", "adiah", "adinistrasi", "admiinistrasi",
      "admiistrasi", "adminiistrasi", "administrasi", "administrasy", "administresi", "adminnistrasi",
      "adminystrasi", "admministrasi", "admnistrasi", "ahu", "ahun", "ain", "ainnya", "akara", "akat",
      "ambahan", "amlop", "ammplop", "ampllop", "amploop", "amplop", "amplopp", "amplp", "amplup",
      "ampop", "ampplop", "ampuran", "andom", "ang", "anitia", "antuan", "apat", "ape", "api", "aplop",
      "arang", "arik", "arkir", "arurat", "ash", "atm", "audara", "baang", "baantuan", "baarang",
      "banntuan", "bantan", "bantoan", "banttuan", "bantuaan", "bantuan", "bantuen", "bantuuan",
      "banuan", "baraang", "barag", "barang", "barangg", "baranng", "bareng", "barng", "barrang",
      "batuan", "baya", "bbantuan", "bbarang", "bbiaya", "berang", "biaa", "biaaya", "biaia", "biay",
      "biaya", "biaya tambahan", "biayaa", "biaye", "biayya", "bieya", "biiaya", "biya", "caampuran",
      "caash", "cah", "cammpuran", "camporan", "camppuran", "campran", "campuran", "campuren",
      "campurran", "campuuran", "camuran", "capuran", "cas", "cash", "cashh", "cassh", "ccampuran",
      "ccash", "ceamanan", "cebutuhan", "cegiatan", "cehilangan", "celuar", "celuarga", "cesh",
      "condangan", "consumsi", "corek", "csh", "cup", "daarurat", "darorat", "darrat", "darrurat",
      "daruat", "daruraat", "darurat", "daruret", "darurrat", "daruurat", "daurat", "ddarurat",
      "ddekorasi", "ddonasi", "decorasi", "deekorasi", "dekkorasi", "dekoasi", "dekoorasi", "dekoraasi",
      "dekorasi", "dekorasy", "dekoresi", "dekorrasi", "dekrasi", "dekurasi", "dnasi", "doasi",
      "donaasi", "donai", "donasi", "donasii", "donassi", "donasy", "donesi", "donnasi", "donsi",
      "doonasi", "eamanan", "ebutuhan", "edekah", "egiatan", "ehilangan", "eluar", "eluarga", "eman",
      "emplop", "enarikan", "endadak", "enitipan", "erbaikan", "erduga", "ffotocopy", "foocopy",
      "footocopy", "fotcopy", "fotoccopy", "fotocoopy", "fotocopi", "fotocopy", "fotocupy", "fotokopy",
      "fotoocopy", "fotoopy", "fottocopy", "haadiah", "hadah", "haddiah", "hadiaah", "hadiah", "hadiahh",
      "hadieh", "hadih", "hadiiah", "hadyah", "haiah", "hdiah", "iar", "icredible", "idak", "ifak",
      "ifaq", "iincredible", "iinfak", "iinfaq", "ikah", "inak", "inaq", "inccredible", "incedible",
      "incrdible", "increddible", "incredible", "incredibli", "incredyble", "increedible", "incridible",
      "incrredible", "infa", "infaak", "infaaq", "infac", "infak", "infakk", "infaq", "infaqq", "infek",
      "infeq", "inffak", "inffaq", "infk", "infq", "ini", "inkredible", "innfak", "innfaq", "invak",
      "invaq", "ips", "isc", "iscellaneous", "kamanan", "kash", "kbutuhan", "keaamanan", "keaanan",
      "keamaanan", "keamanan", "keamanen", "keamannan", "keamenan", "keammanan", "keamnan", "kebbutuhan",
      "kebotuhan", "kebtuhan", "kebutohan", "kebuttuhan", "kebutuhan", "kebutuhan mendadak", "kebutuhen",
      "kebutuuhan", "kebuuhan", "kebuutuhan", "keeamanan", "keegiatan", "keehilangan", "keeluar",
      "keeluarga", "kegatan", "keggiatan", "kegiaatan", "kegiatan", "kegiaten", "kegiattan", "kegietan",
      "kegiiatan", "kegitan", "kegyatan", "kehhilangan", "kehiangan", "kehiilangan", "kehilaangan",
      "kehilangan", "kehilangen", "kehilengan", "kehillangan", "kehlangan", "kehylangan", "kelar",
      "kelarga", "kelluar", "kelluarga", "keloar", "keloarga", "keluaar", "keluaarga", "keluar",
      "keluarga", "keluarge", "keluarr", "keluarrga", "keluer", "keluerga", "kelur", "kelurga",
      "keluuar", "keluuarga", "keuar", "kkondangan", "kkonsumsi", "kkorek", "kndangan", "knsumsi",
      "kodangan", "koek", "konangan", "kondaangan", "kondangan", "kondangen", "kondanngan", "konddangan",
      "kondengan", "kondngan", "konndangan", "konnsumsi", "konsmsi", "konsomsi", "konssumsi",
      "konsummsi", "konsumsi", "konsumsy", "konsuumsi", "konumsi", "koonsumsi", "koorek", "kore",
      "korec", "koreek", "korek", "korekk", "korik", "kork", "korrek", "krek", "laain", "laainnya",
      "lai", "laiin", "laiinnya", "lain", "lainn", "lainnia", "lainnnya", "lainnya", "lainnyaa",
      "lainnye", "lainnyya", "lainya", "lan", "lang", "lannya", "lar", "layn", "laynnya", "lein",
      "leinnya", "lia", "liaar", "liar", "liarr", "lier", "liiar", "lin", "lir", "llain", "lliar",
      "lyar", "medadak", "meendadak", "menadak", "mendaadak", "mendadac", "mendadak", "mendaddak",
      "mendadek", "menddadak", "menddak", "mendedak", "menndadak", "mic", "micellaneous", "mii", "miini",
      "miisc", "miiscellaneous", "min", "mini", "minii", "minni", "miny", "mis", "misc", "miscc",
      "misccellaneous", "misceellaneous", "miscellaneoos", "miscellaneous", "miscellaneuus",
      "miscellanious", "miscelleneous", "miscelllaneous", "miscillaneous", "miscllaneous", "misk",
      "missc", "mmini", "mmisc", "mni", "msc", "mum", "myni", "mysc", "nfaq", "ngkos", "niah", "nicah",
      "niikah", "nika", "nikaah", "nikah", "nikahh", "nikeh", "nikh", "nikkah", "nkah", "nknown",
      "nnikah", "oang", "occer", "oganisasi", "ogkos", "okok", "olang", "omum", "ongcos", "onggkos",
      "ongkkos", "ongkoos", "ongkos", "ongkoss", "ongks", "ongkus", "ongos", "onknown", "onkos",
      "onngkos", "oorganisasi", "oranisasi", "orgaanisasi", "orgaisasi", "organiisasi", "organisasi",
      "organisasy", "organisesi", "organnisasi", "organysasi", "orgenisasi", "orgganisasi", "paanitia",
      "paarkir", "paitia", "pakir", "paniia", "paniitia", "panitia", "panitie", "panitiia", "panittia",
      "panitya", "pannitia", "pantia", "panytia", "parcir", "parir", "parkiir", "parkir", "parkirr",
      "parkkir", "parkr", "parkyr", "parrkir", "pearikan", "pebaikan", "peenarikan", "peenitipan",
      "peerbaikan", "peitipan", "penaarikan", "penaikan", "penarican", "penariikan", "penarikan",
      "penariken", "penarrikan", "penarykan", "penerikan", "peniipan", "peniitipan", "penitiipan",
      "penitipan", "penitipen", "penittipan", "penitypan", "pennarikan", "pennitipan", "pentipan",
      "penytipan", "peraikan", "perbaaikan", "perbaican", "perbaiikan", "perbaikan", "perbaiken",
      "perbaykan", "perbbaikan", "perbeikan", "perbikan", "perkir", "pint", "pprint", "priint", "prin",
      "prinnt", "print", "printt", "prit", "prnt", "prrint", "prynt", "raandom", "raapat", "raat",
      "radom", "randdom", "randm", "random", "randomm", "randoom", "randum", "ranndom", "ranom", "rapa",
      "rapaat", "rapat", "rapatt", "rapet", "rappat", "rapt", "rendom", "repat", "rint", "rkok", "rndom",
      "rocok", "rokk", "rokkok", "roko", "rokoc", "rokok", "rokokk", "rokook", "rokuk", "rook", "rookok",
      "rosak", "rpat", "rrapat", "rrusak", "rsak", "ruak", "rusa", "rusaak", "rusac", "rusak", "rusakk",
      "rusek", "rusk", "russak", "ruusak", "saaudara", "sadara", "saodara", "sauara", "saudaara",
      "saudara", "saudare", "saudarra", "sauddara", "saudera", "saudra", "sauudara", "sccer", "sdekah",
      "seddekah", "sedeah", "sedecah", "sedeekah", "sedekaah", "sedekah", "sedekeh", "sedekkah",
      "sedikah", "sedkah", "seedekah", "smbangan", "socccer", "socceer", "soccer", "soccerr", "soccir",
      "soccr", "socer", "socker", "sokcer", "sombangan", "sooccer", "ssoccer", "ssumbangan", "subangan",
      "sumangan", "sumbaangan", "sumbangan", "sumbangen", "sumbanngan", "sumbbangan", "sumbengan",
      "sumbngan", "summbangan", "taahu", "taahun", "taambahan", "taarik", "tabahan", "tah", "tahhu",
      "tahhun", "tahn", "taho", "tahon", "tahu", "tahun", "tahunn", "tahuu", "tahuun", "taik", "tak",
      "tak terduga", "tamahan", "tambaahan", "tambahan", "tambahen", "tambahhan", "tambbahan",
      "tambehan", "tambhan", "tammbahan", "tari", "taric", "tariik", "tarik", "tarik tunai", "tarikk",
      "tark", "tarrik", "taryk", "tau", "taun", "tdak", "tean", "teduga", "teeman", "teerduga", "tehu",
      "tehun", "tema", "temaan", "teman", "temann", "tembahan", "temen", "temman", "temn", "terdduga",
      "terdga", "terdoga", "terduga", "terduge", "terdugga", "terduuga", "terik", "terrduga", "teruga",
      "thu", "thun", "tiak", "tida", "tidaak", "tidac", "tidak", "tidakk", "tiddak", "tidek", "tidk",
      "tiidak", "tiips", "timan", "tip", "tipps", "tips", "tipss", "tirduga", "tis", "tman", "tnai",
      "tonai", "tps", "trik", "ttahu", "ttahun", "tteman", "ttidak", "ttips", "ttunai", "tuai", "tuna",
      "tunaai", "tunai", "tunaii", "tunay", "tunei", "tuni", "tunnai", "tuunai", "typs", "uaang", "uag",
      "uan", "uang", "uang keluar", "uang rokok", "uangg", "uanng", "ueng", "uknown", "ulaang", "ulag",
      "ulan", "ulang", "ulangg", "ulanng", "uleng", "ullang", "ulng", "umm", "ummum", "umom", "umu",
      "umum", "umumm", "umuum", "uncnown", "ung", "unkknown", "unknnown", "unknoown", "unknown",
      "unknowwn", "unknuwn", "unknwn", "unkown", "unnknown", "uuang", "uulang", "uum", "uumum", "vaape",
      "vae", "vap", "vape", "vapee", "vapi", "vappe", "vepe", "vpe", "vvape", "zaakat", "zaat", "zacat",
      "zaka", "zakaat", "zakat", "zakatt", "zaket", "zakkat", "zakt", "zekat", "zkat"
    ]
  };


  // 1. Cek kecocokan langsung
  for (let kategori in kataKunciKategori) {
    for (let kata of kataKunciKategori[kategori]) {
      if (nama.includes(kata)) {
        return kategori;
      }
    }
  }

  // 2. Cek typo per kata
  const kataInput = nama.split(" ");

  let kategoriTerbaik = "Lainnya";
  let skorTerbaik = 0;

  for (let kategori in kataKunciKategori) {
    for (let kataKunci of kataKunciKategori[kategori]) {
      const kataKunciPecah = kataKunci.split(" ");

      for (let kataUser of kataInput) {
        for (let kataReferensi of kataKunciPecah) {
          const skor = hitungKemiripanKata(kataUser, kataReferensi);

          if (skor > skorTerbaik) {
            skorTerbaik = skor;
            kategoriTerbaik = kategori;
          }
        }
      }
    }
  }

  // Batas minimal kemiripan.
  // Semakin besar angkanya, semakin ketat.
  if (skorTerbaik >= 0.75) {
    return kategoriTerbaik;
  }

  return "Lainnya";
}

function rapikanNamaPengeluaran(nama) {
  const namaNormal = normalisasiNamaItem(nama);

  const kamusNama = {
    "es teh": ["es teh", "esteh", "es tehh", "estehh", "es teh manis"],
    "nasi goreng": ["nasi goreng", "nasgor", "nasi gorengg", "nasii goreng"],
    "kopi": ["kopi", "kopii", "coffe", "coffee"],
    "ayam penyet": ["ayam penyet", "ayam penyett", "aym penyet"],
    "bensin": ["bensin", "bensinn", "pertalite", "pertalit"],
    "kuota internet": ["kuota", "kuotaa", "paket data", "internet"],
    "rinso": ["rinso", "rinsso", "rinssoh"]
  };

  for (let namaBenar in kamusNama) {
    for (let variasi of kamusNama[namaBenar]) {
      const skor = hitungKemiripanKalimat(namaNormal, variasi);

      if (skor >= 0.82) {
        return namaBenar;
      }
    }
  }

  return namaNormal;
}


function hitungKemiripanKata(kata1, kata2) {
  if (kata1.length < 3 || kata2.length < 3) {
    return 0;
  }

  const jarak = hitungLevenshtein(kata1, kata2);
  const panjangTerbesar = Math.max(kata1.length, kata2.length);

  return 1 - jarak / panjangTerbesar;
}

function hitungLevenshtein(a, b) {
  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}


function formatRupiah(angka) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0
  }).format(angka);
}

function formatTanggalInput(date) {
  const tahun = date.getFullYear();
  const bulan = String(date.getMonth() + 1).padStart(2, "0");
  const tanggal = String(date.getDate()).padStart(2, "0");

  return `${tahun}-${bulan}-${tanggal}`;
}

function tampilkanGrafikKategori() {
  const canvas = document.getElementById("grafikKategori");

  if (!canvas) {
    return;
  }

  let totalKategori = {};

  dataPengeluaran.forEach(function (item) {
    if (cekDataSesuaiFilter(item)) {
      if (!totalKategori[item.kategori]) {
        totalKategori[item.kategori] = 0;
      }

      totalKategori[item.kategori] += item.jumlah;
    }
  });

  const labelKategori = Object.keys(totalKategori);
  const dataJumlah = Object.values(totalKategori);

  if (grafikKategori !== null) {
    grafikKategori.destroy();
  }

  grafikKategori = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: labelKategori.length > 0 ? labelKategori : ["Belum ada data"],
      datasets: [
        {
          label: "Pengeluaran",
          data: dataJumlah.length > 0 ? dataJumlah : [1]
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: "#e5e7eb"
          }
        }
      }
    }
  });
}

function tampilkanGrafikHarian() {
  const canvas = document.getElementById("grafikHarian");

  if (!canvas) {
    return;
  }

  let totalHarian = {};

  dataPengeluaran.forEach(function (item) {
    if (cekDataSesuaiFilter(item)) {
      if (!totalHarian[item.tanggal]) {
        totalHarian[item.tanggal] = 0;
      }

      totalHarian[item.tanggal] += item.jumlah;
    }
  });

  const tanggalUrut = Object.keys(totalHarian).sort();

  const dataJumlah = tanggalUrut.map(function (tanggal) {
    return totalHarian[tanggal];
  });

  const labelTanggal = tanggalUrut.map(function (tanggal) {
    const bagian = tanggal.split("-");
    return `${bagian[2]}/${bagian[1]}`;
  });

  if (grafikHarian !== null) {
    grafikHarian.destroy();
  }

  grafikHarian = new Chart(canvas, {
    type: "bar",
    data: {
      labels: labelTanggal.length > 0 ? labelTanggal : ["Belum ada data"],
      datasets: [
        {
          label: "Pengeluaran Harian",
          data: dataJumlah.length > 0 ? dataJumlah : [0]
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          ticks: {
            color: "#e5e7eb"
          },
          grid: {
            color: "#1f2937"
          }
        },
        y: {
          ticks: {
            color: "#e5e7eb",
            callback: function (value) {
              return "Rp" + value.toLocaleString("id-ID");
            }
          },
          grid: {
            color: "#1f2937"
          }
        }
      },
      plugins: {
        legend: {
          labels: {
            color: "#e5e7eb"
          }
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return "Pengeluaran: " + formatRupiah(context.raw);
            }
          }
        }
      }
    }
  });
}

function setFilterBulanIni() {
  const hariIni = new Date();

  filterBulan = hariIni.getMonth() + 1;
  filterTahun = hariIni.getFullYear();

  document.getElementById("filterBulan").value = filterBulan;
  document.getElementById("filterTahun").value = filterTahun;

  tampilkanInfoFilter();
}

function terapkanFilter() {
  const inputBulan = Number(document.getElementById("filterBulan").value);
  const inputTahun = Number(document.getElementById("filterTahun").value);

  if (inputBulan < 1 || inputBulan > 12 || inputTahun <= 0) {
    tampilkanPopup("Bulan atau tahun tidak valid.");
    return;
  }

  filterBulan = inputBulan;
  filterTahun = inputTahun;

  tampilkanInfoFilter();
  tampilkanData();
  hitungRingkasan();
  analisisPengeluaran();
  tampilkanGrafikKategori();
  tampilkanRingkasanKategori();
  tampilkanGrafikHarian();
}

function tampilkanInfoFilter() {
  const namaBulan = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  document.getElementById("filterInfo").innerText =
    `Menampilkan data: ${namaBulan[filterBulan - 1]} ${filterTahun}`;
}

function cekDataSesuaiFilter(item) {
  const tanggalItem = new Date(item.tanggal);
  const bulanItem = tanggalItem.getMonth() + 1;
  const tahunItem = tanggalItem.getFullYear();

  return bulanItem === filterBulan && tahunItem === filterTahun;
}




function tampilkanRingkasanKategori() {
  const tabel = document.getElementById("tabelRingkasanKategori");

  if (!tabel) {
    return;
  }

  tabel.innerHTML = "";

  let totalKategori = {};
  let totalSemua = 0;

  dataPengeluaran.forEach(function (item) {
    if (cekDataSesuaiFilter(item)) {
      if (!totalKategori[item.kategori]) {
        totalKategori[item.kategori] = 0;
      }

      totalKategori[item.kategori] += item.jumlah;
      totalSemua += item.jumlah;
    }
  });

  const kategoriArray = Object.keys(totalKategori).map(function (kategori) {
    return {
      nama: kategori,
      total: totalKategori[kategori],
      persen: (totalKategori[kategori] / totalSemua) * 100
    };
  });

  kategoriArray.sort(function (a, b) {
    return b.total - a.total;
  });

  if (kategoriArray.length === 0) {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td colspan="3">Belum ada data kategori pada bulan dan tahun ini.</td>
    `;

    tabel.appendChild(row);
    return;
  }

  kategoriArray.forEach(function (item) {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${item.nama}</td>
      <td>${formatRupiah(item.total)}</td>
      <td>${item.persen.toFixed(1)}%</td>
    `;

    tabel.appendChild(row);
  });
}

function deteksiPengeluaranTidakWajar(jumlahBaru) {
  const dataTerfilter = dataPengeluaran.filter(function (item) {
    return cekDataSesuaiFilter(item);
  });

  if (dataTerfilter.length < 5) {
    return {
      tidakWajar: false,
      pesan: "Data masih sedikit, sistem belum cukup mengenali pola pengeluaranmu."
    };
  }

  let total = 0;

  dataTerfilter.forEach(function (item) {
    total += item.jumlah;
  });

  const rataRata = total / dataTerfilter.length;

  if (jumlahBaru > rataRata * 3) {
    return {
      tidakWajar: true,
      pesan: `Pengeluaran ini cukup besar dibanding rata-rata transaksi kamu. Rata-rata transaksi: ${formatRupiah(rataRata)}.`
    };
  }

  return {
    tidakWajar: false,
    pesan: "Pengeluaran masih terlihat normal."
  };
}

function pilihModeLogin(mode) {
  modeLogin = mode;

  const adminLoginBox = document.getElementById("adminLoginBox");
  const userLoginBox = document.getElementById("userLoginBox");
  const btnModeAdmin = document.getElementById("btnModeAdmin");
  const btnModeUser = document.getElementById("btnModeUser");
  const btnRegister = document.getElementById("btnRegister");
  const btnLogin = document.getElementById("btnLogin");
  const authMessage = document.getElementById("authMessage");
  const loginReminder = document.getElementById("loginReminder");

  authMessage.innerText = "";

  if (mode === "admin") {
    adminLoginBox.style.display = "block";
    userLoginBox.style.display = "none";

    btnModeAdmin.classList.add("active");
    btnModeUser.classList.remove("active");

    btnRegister.style.display = "none";
    btnLogin.innerText = "Login Admin";

    if (loginReminder) {
      loginReminder.style.display = "none";
    }

  } else {
    adminLoginBox.style.display = "none";
    userLoginBox.style.display = "block";

    btnModeAdmin.classList.remove("active");
    btnModeUser.classList.add("active");

    btnRegister.style.display = "block";
    btnRegister.innerText = "Register User";
    btnLogin.innerText = "Login User";

    if (loginReminder) {
      loginReminder.style.display = "block";
    }
  }
}

function buatEmailUserDariUsername(username) {
  return username
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9._-]/g, "") + "@user.local";
}

function ambilCredentialLogin() {
  if (modeLogin === "admin") {
    return {
      tipe: "Admin",
      email: document.getElementById("emailInput").value.trim(),
      password: document.getElementById("adminPasswordInput").value.trim(),
      namaTampil: document.getElementById("emailInput").value.trim()
    };
  }

  const username = document.getElementById("usernameInput").value.trim();
  const emailUser = buatEmailUserDariUsername(username);

  return {
    tipe: "User",
    email: emailUser,
    password: document.getElementById("userPasswordInput").value.trim(),
    namaTampil: username
  };
}

function pilihModeLogin(mode) {
  modeLogin = mode;

  const adminLoginBox = document.getElementById("adminLoginBox");
  const userLoginBox = document.getElementById("userLoginBox");
  const btnModeAdmin = document.getElementById("btnModeAdmin");
  const btnModeUser = document.getElementById("btnModeUser");
  const btnRegister = document.getElementById("btnRegister");
  const btnLogin = document.getElementById("btnLogin");
  const authMessage = document.getElementById("authMessage");
  const loginReminder = document.getElementById("loginReminder");

  if (authMessage) {
    authMessage.innerText = "";
  }

  if (mode === "admin") {
    if (adminLoginBox) adminLoginBox.style.display = "block";
    if (userLoginBox) userLoginBox.style.display = "none";

    if (btnModeAdmin) btnModeAdmin.classList.add("active");
    if (btnModeUser) btnModeUser.classList.remove("active");

    if (btnRegister) btnRegister.style.display = "none";
    if (btnLogin) btnLogin.innerText = "Login Admin";

    if (loginReminder) loginReminder.style.display = "none";
  } else {
    if (adminLoginBox) adminLoginBox.style.display = "none";
    if (userLoginBox) userLoginBox.style.display = "block";

    if (btnModeAdmin) btnModeAdmin.classList.remove("active");
    if (btnModeUser) btnModeUser.classList.add("active");

    if (btnRegister) {
      btnRegister.style.display = "block";
      btnRegister.innerText = "Register User";
    }

    if (btnLogin) btnLogin.innerText = "Login User";

    if (loginReminder) loginReminder.style.display = "block";
  }
}

function buatEmailUserDariUsername(username) {
  return username
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9._-]/g, "") + "@user.local";
}

function ambilCredentialLogin() {
  if (modeLogin === "admin") {
    return {
      tipe: "Admin",
      email: document.getElementById("emailInput").value.trim(),
      password: document.getElementById("adminPasswordInput").value.trim()
    };
  }

  const username = document.getElementById("usernameInput").value.trim();

  return {
    tipe: "User",
    email: buatEmailUserDariUsername(username),
    password: document.getElementById("userPasswordInput").value.trim()
  };
}

async function ambilProfileUser() {
  if (!currentUser) {
    return null;
  }

  const { data, error } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("user_id", currentUser.id)
    .single();

  if (error) {
    return null;
  }

  return data;
}

function userSedangAdmin() {
  return currentProfile &&
    currentProfile.role === "admin" &&
    currentProfile.status === "active";
}

async function registerUser() {
  const credential = ambilCredentialLogin();
  const authMessage = document.getElementById("authMessage");

  if (modeLogin === "admin") {
    const pesan = "Admin tidak bisa register dari halaman ini. Silakan login dengan akun admin yang sudah terdaftar.";
    authMessage.innerText = pesan;
    tampilkanPopup(pesan, "warning");
    return;
  }

  const username = document.getElementById("usernameInput").value.trim();

  if (username === "") {
    const pesan = "Username wajib diisi.";
    authMessage.innerText = pesan;
    tampilkanPopup(pesan, "warning");
    return;
  }

  if (username.length < 3) {
    const pesan = "Username minimal 3 karakter.";
    authMessage.innerText = pesan;
    tampilkanPopup(pesan, "warning");
    return;
  }

  if (credential.password === "") {
    const pesan = "Password wajib diisi.";
    authMessage.innerText = pesan;
    tampilkanPopup(pesan, "warning");
    return;
  }

  if (credential.password.length < 6) {
    const pesan = "Password minimal 6 karakter.";
    authMessage.innerText = pesan;
    tampilkanPopup(pesan, "warning");
    return;
  }

  const { data, error } = await supabaseClient.auth.signUp({
    email: credential.email,
    password: credential.password,
    options: {
      data: {
        login_mode: "user",
        username: username
      }
    }
  });

  if (error) {
    const pesan = "Register user gagal: " + error.message;
    authMessage.innerText = pesan;
    tampilkanPopup(pesan, "error");
    return;
  }

  if (data.user) {
    await supabaseClient
      .from("profiles")
      .insert({
        user_id: data.user.id,
        username: username,
        email: credential.email,
        role: "user",
        status: "active"
      });
  }

  const pesan = "Register user berhasil. Silakan login menggunakan username dan password.";
  authMessage.innerText = pesan;
  tampilkanPopup(pesan, "success");
}

async function loginUser() {
  setLoginLoading(true);

  try {
    const credential = ambilCredentialLogin();
    const authMessage = document.getElementById("authMessage");

    if (credential.email === "" || credential.password === "") {
      const pesan = `${credential.tipe} dan password wajib diisi.`;
      authMessage.innerText = pesan;
      tampilkanPopup(pesan, "warning");
      return;
    }

    if (modeLogin === "user") {
      const username = document.getElementById("usernameInput").value.trim();

      if (username === "") {
        const pesan = "Username wajib diisi.";
        authMessage.innerText = pesan;
        tampilkanPopup(pesan, "warning");
        return;
      }
    }

    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: credential.email,
      password: credential.password
    });

    if (error) {
      const pesan = "Login gagal. Email, username, atau password tidak sesuai.";
      authMessage.innerText = pesan;
      tampilkanPopup(pesan, "error");
      return;
    }

    currentUser = data.user;

    currentProfile = await ambilProfileUser();

    if (!currentProfile) {
      await supabaseClient.auth.signOut();
      currentUser = null;

      const pesan = "Akun ini belum memiliki profil. Hubungi admin.";
      authMessage.innerText = pesan;
      tampilkanPopup(pesan, "error");
      return;
    }

    if (currentProfile.status !== "active") {
      await supabaseClient.auth.signOut();
      currentUser = null;

      const pesan = "Akun ini sedang dinonaktifkan oleh admin.";
      authMessage.innerText = pesan;
      tampilkanPopup(pesan, "error");
      return;
    }

    if (modeLogin === "admin" && currentProfile.role !== "admin") {
      await supabaseClient.auth.signOut();
      currentUser = null;

      const pesan = "Login ditolak. Akun ini bukan admin.";
      authMessage.innerText = pesan;
      tampilkanPopup(pesan, "error");
      return;
    }

    if (modeLogin === "user" && currentProfile.role !== "user") {
      await supabaseClient.auth.signOut();
      currentUser = null;

      const pesan = "Login ditolak. Akun ini bukan user biasa.";
      authMessage.innerText = pesan;
      tampilkanPopup(pesan, "error");
      return;
    }

    const pesan = "Login berhasil.";
    authMessage.innerText = pesan;
    tampilkanPopup(pesan, "success");

    tampilkanModeLogin();

    setTimeout(async function () {
      await muatAplikasiSetelahLogin();
    }, 100);

  } finally {
    setLoginLoading(false);
  }
}

async function logoutUser() {

  if (modeDemoPortfolio) {
    modeDemoPortfolio = false;
    currentUser = null;
    currentProfile = null;
    dataPengeluaran = [];
    targetBulanan = 0;
    riwayatDeteksiAI = [];
    cacheSaranPintarAI = {};

    tampilkanModeLogout();
    tampilkanPopup("Mode Demo Portfolio ditutup.", "info");
    return;
  }

  const { error } = await supabaseClient.auth.signOut();

  if (error) {
    tampilkanPopup("Logout gagal: " + error.message);
    return;
  }

  currentUser = null;
  currentProfile = null;
  daftarProfiles = [];
  dataPengeluaran = [];
  targetBulanan = 0;

  tampilkanModeLogout();
  tampilkanPopup("Logout berhasil.", "info");

}

async function cekSessionLogin() {
  const { data, error } = await supabaseClient.auth.getSession();

  if (error) {
    console.log(error);
    tampilkanModeLogout();
    return;
  }

  if (data.session && data.session.user) {
    currentUser = data.session.user;

    currentProfile = await ambilProfileUser();

    if (!currentProfile || currentProfile.status !== "active") {
      await supabaseClient.auth.signOut();
      currentUser = null;
      currentProfile = null;
      tampilkanModeLogout();
      return;
    }

    tampilkanModeLogin();
    muatAplikasiSetelahLogin();
  } else {
    tampilkanModeLogout();
  }
}

function tampilkanModeLogin() {
  const authSection = document.getElementById("authSection");
  const userSection = document.getElementById("userSection");
  const appSection = document.getElementById("appSection");

  if (authSection) {
    authSection.style.setProperty("display", "none", "important");
    authSection.classList.add("force-hidden");
  }

  if (userSection) {
    userSection.style.setProperty("display", "block", "important");
    userSection.classList.remove("force-hidden");
  }

  if (appSection) {
    appSection.style.setProperty("display", "block", "important");
    appSection.classList.remove("force-hidden");
  }

  const userInfo = document.getElementById("userInfo");

  if (userInfo) {
    if (currentProfile && currentProfile.role === "admin") {
      userInfo.innerText = "Login sebagai Admin: " + currentUser.email;
    } else if (currentProfile && currentProfile.username) {
      userInfo.innerText = "Login sebagai User: " + currentProfile.username;
    } else if (currentUser) {
      userInfo.innerText = "Login sebagai: " + currentUser.email;
    }
  }

  const adminTabMenu = document.getElementById("adminTabMenu");
  const adminUserControl = document.getElementById("adminUserControl");
  const dashboardContent = document.getElementById("dashboardContent");

  if (userSedangAdmin()) {
    if (adminTabMenu) adminTabMenu.style.setProperty("display", "grid", "important");
    if (dashboardContent) dashboardContent.style.setProperty("display", "block", "important");
    if (adminUserControl) adminUserControl.style.setProperty("display", "none", "important");

    bukaTabAdmin("dashboard");
  } else {
    if (adminTabMenu) adminTabMenu.style.setProperty("display", "none", "important");
    if (dashboardContent) dashboardContent.style.setProperty("display", "block", "important");
    if (adminUserControl) adminUserControl.style.setProperty("display", "none", "important");
  }

  window.scrollTo(0, 0);
}

async function muatDaftarUserAdmin() {
  if (!userSedangAdmin()) {
    return;
  }

  const tbody = document.getElementById("tabelKontrolUser");

  if (!tbody) {
    return;
  }

  tbody.innerHTML = `
    <tr>
      <td colspan="6">Memuat daftar user...</td>
    </tr>
  `;

  const { data, error } = await supabaseClient
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6">Gagal memuat user: ${error.message}</td>
      </tr>
    `;
    return;
  }

  daftarProfiles = data || [];

  if (daftarProfiles.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6">Belum ada user.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = "";

  daftarProfiles.forEach(function (profile) {
    const tr = document.createElement("tr");

    const statusClass = profile.status === "active" ? "active" : "disabled";
    const statusText = profile.status === "active" ? "Aktif" : "Nonaktif";

    let aksiHTML = "";

    if (profile.role === "admin") {
      aksiHTML = `<span class="info-text">Admin utama</span>`;
    } else {
      if (profile.status === "active") {
        aksiHTML += `
          <button class="btn-user-disable" onclick="ubahStatusUser('${profile.user_id}', 'disabled')">
            Nonaktifkan
          </button>
        `;
      } else {
        aksiHTML += `
          <button class="btn-user-enable" onclick="ubahStatusUser('${profile.user_id}', 'active')">
            Aktifkan
          </button>
        `;
      }

      aksiHTML += `
        <button class="btn-user-delete" onclick="hapusProfilUser('${profile.user_id}')">
          Hapus
        </button>
      `;
    }

    tr.innerHTML = `
      <td>${profile.username || "-"}</td>
      <td>${profile.email || "-"}</td>
      <td>${profile.role}</td>
      <td>
        <span class="user-status-badge ${statusClass}">
          ${statusText}
        </span>
      </td>
      <td>${formatTanggalIndonesia(profile.created_at)}</td>
      <td>
        <div class="user-action-row">
          ${aksiHTML}
        </div>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

async function tambahUserOlehAdmin() {
  if (!userSedangAdmin()) {
    tampilkanPopup("Akses ditolak. Hanya admin yang dapat menambah user.", "error");
    return;
  }

  const usernameInput = document.getElementById("adminNewUsername");
  const passwordInput = document.getElementById("adminNewPassword");

  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (username === "") {
    tampilkanPopup("Username user baru wajib diisi.", "warning");
    return;
  }

  if (username.length < 3) {
    tampilkanPopup("Username minimal 3 karakter.", "warning");
    return;
  }

  if (password.length < 6) {
    tampilkanPopup("Password minimal 6 karakter.", "warning");
    return;
  }

  const emailUser = buatEmailUserDariUsername(username);

  const tempClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  const { data, error } = await tempClient.auth.signUp({
    email: emailUser,
    password: password,
    options: {
      data: {
        login_mode: "user",
        username: username
      }
    }
  });

  if (error) {
    tampilkanPopup("Gagal membuat user: " + error.message, "error");
    return;
  }

  if (!data.user) {
    tampilkanPopup("User dibuat, tetapi data user belum tersedia. Pastikan email confirmation dimatikan.", "warning");
    return;
  }

  const { error: profileError } = await supabaseClient
    .from("profiles")
    .insert({
      user_id: data.user.id,
      username: username,
      email: emailUser,
      role: "user",
      status: "active"
    });

  if (profileError) {
    tampilkanPopup("User Auth berhasil dibuat, tetapi profil gagal disimpan: " + profileError.message, "error");
    return;
  }

  usernameInput.value = "";
  passwordInput.value = "";

  tampilkanPopup("User baru berhasil ditambahkan.", "success");

  await muatDaftarUserAdmin();
}

async function ubahStatusUser(userId, statusBaru) {
  if (!userSedangAdmin()) {
    tampilkanPopup("Akses ditolak.", "error");
    return;
  }

  const pesanKonfirmasi =
    statusBaru === "disabled"
      ? "User ini akan dinonaktifkan dan tidak bisa login. Lanjutkan?"
      : "User ini akan diaktifkan kembali. Lanjutkan?";

  const yakin = await tampilkanKonfirmasi(
    pesanKonfirmasi,
    "Ubah Status User"
  );

  if (!yakin) {
    return;
  }

  const { error } = await supabaseClient
    .from("profiles")
    .update({
      status: statusBaru
    })
    .eq("user_id", userId)
    .neq("role", "admin");

  if (error) {
    tampilkanPopup("Gagal mengubah status user: " + error.message, "error");
    return;
  }

  tampilkanPopup("Status user berhasil diperbarui.", "success");

  await muatDaftarUserAdmin();
}

async function hapusProfilUser(userId) {
  if (!userSedangAdmin()) {
    tampilkanPopup("Akses ditolak.", "error");
    return;
  }

  const yakin = await tampilkanKonfirmasi(
    "Profil user akan dihapus dari daftar kontrol. Akun Auth Supabase tidak terhapus. Lanjutkan?",
    "Hapus Profil User"
  );

  if (!yakin) {
    return;
  }

  const { error } = await supabaseClient
    .from("profiles")
    .delete()
    .eq("user_id", userId)
    .neq("role", "admin");

  if (error) {
    tampilkanPopup("Gagal menghapus profil user: " + error.message, "error");
    return;
  }

  tampilkanPopup("Profil user berhasil dihapus.", "success");

  await muatDaftarUserAdmin();
}

function tampilkanModeLogout() {
  const authSection = document.getElementById("authSection");
  const userSection = document.getElementById("userSection");
  const appSection = document.getElementById("appSection");

  if (authSection) {
    authSection.style.setProperty("display", "block", "important");
    authSection.classList.remove("force-hidden");
  }

  if (userSection) {
    userSection.style.setProperty("display", "none", "important");
    userSection.classList.add("force-hidden");
  }

  if (appSection) {
    appSection.style.setProperty("display", "none", "important");
    appSection.classList.add("force-hidden");
  }

  currentProfile = null;
  daftarProfiles = [];

  const userInfo = document.getElementById("userInfo");
  const authMessage = document.getElementById("authMessage");

  if (userInfo) userInfo.innerText = "Belum login.";
  if (authMessage) authMessage.innerText = "";

  const emailInput = document.getElementById("emailInput");
  const adminPasswordInput = document.getElementById("adminPasswordInput");
  const usernameInput = document.getElementById("usernameInput");
  const userPasswordInput = document.getElementById("userPasswordInput");

  if (emailInput) emailInput.value = "";
  if (adminPasswordInput) adminPasswordInput.value = "";
  if (usernameInput) usernameInput.value = "";
  if (userPasswordInput) userPasswordInput.value = "";

  pilihModeLogin("admin");
}

async function muatAplikasiSetelahLogin() {
  await muatTargetBulananDariSupabase();
  await muatDataPengeluaranDariSupabase();

  refreshTampilan();
}

function refreshTampilan() {
  tampilkanTargetBulanan();
  tampilkanData();
  hitungRingkasan();
  analisisPengeluaran();
  tampilkanSaranPintarAwal();
  tampilkanInsightItemSering();
  tampilkanGrafikKategori();

  if (typeof tampilkanRingkasanKategori === "function") {
    tampilkanRingkasanKategori();
  }

  tampilkanGrafikHarian();
}

async function muatDataPengeluaranDariSupabase() {
  if (!currentUser) {
    return;
  }

  const { data, error } = await supabaseClient
    .from("expenses")
    .select("*")
    .eq("user_id", currentUser.id)
    .order("tanggal", { ascending: false });

  if (error) {
    tampilkanPopup("Gagal mengambil data pengeluaran: " + error.message);
    return;
  }

  dataPengeluaran = data.map(function (item) {
    const hargaSatuan = Math.round(Number(item.harga_satuan) || 0);
    const qty = Math.round(Number(item.qty) || 1);

    let total = Math.round(Number(item.jumlah) || 0);

    if (hargaSatuan > 0 && qty > 0) {
      total = hargaSatuan * qty;
    }

    return {
      id: item.id,
      tanggal: item.tanggal,
      nama: item.nama,
      kategori: item.kategori,
      harga_satuan: hargaSatuan,
      qty: qty,
      jumlah: total
    };
  });
}

function exportPDF() {
  if (!currentUser) {
    tampilkanPopup("Kamu harus login terlebih dahulu.", "warning");
    return;
  }

  const dataTerfilter = dataPengeluaran.filter(function (item) {
    return cekDataSesuaiFilter(item);
  });

  if (dataTerfilter.length === 0) {
    tampilkanPopup("Tidak ada data pada bulan dan tahun yang dipilih.", "warning");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p", "mm", "a4");

  const developerName = "Riski Hidayat Pasaribu";
  const namaAplikasi = "Smart Expense Tracker";

  const namaPengguna =
    currentProfile && currentProfile.username
      ? currentProfile.username
      : currentUser.email;

  const namaBulan = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const bulanTeks = namaBulan[filterBulan - 1];
  const periode = `${bulanTeks} ${filterTahun}`;

  let totalBulan = 0;

  dataTerfilter.forEach(function (item) {
    totalBulan += item.jumlah;
  });

  const hariIni = new Date();
  const bulanSekarang = hariIni.getMonth() + 1;
  const tahunSekarang = hariIni.getFullYear();

  let prediksiAkhirBulan = totalBulan;

  if (filterBulan === bulanSekarang && filterTahun === tahunSekarang) {
    const tanggalSekarang = hariIni.getDate();
    const jumlahHariDalamBulan = new Date(filterTahun, filterBulan, 0).getDate();

    prediksiAkhirBulan = Math.round(
      (totalBulan / tanggalSekarang) * jumlahHariDalamBulan
    );
  }

  const tanggalCetak = new Date().toLocaleString("id-ID", {
    dateStyle: "long",
    timeStyle: "short"
  });

  const warnaUtama = [15, 23, 42];
  const warnaAksen = [56, 189, 248];
  const warnaAbu = [100, 116, 139];
  const warnaBorder = [226, 232, 240];

  // =========================
  // Header PDF
  // =========================
  doc.setFillColor(...warnaUtama);
  doc.rect(0, 0, 210, 34, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Laporan Pengeluaran Bulanan", 14, 15);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(namaAplikasi, 14, 22);

  doc.setDrawColor(...warnaAksen);
  doc.setLineWidth(0.8);
  doc.line(14, 28, 196, 28);

  // =========================
  // Informasi Laporan
  // =========================
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Informasi Laporan", 14, 44);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...warnaAbu);

  const metadataRows = [
    ["Aplikasi", namaAplikasi],
    ["Pengguna", namaPengguna],
    ["Akun", currentUser.email],
    ["Periode", periode],
    ["Tanggal Export", tanggalCetak]
  ];

  doc.autoTable({
    startY: 49,
    body: metadataRows,
    theme: "plain",
    styles: {
      font: "helvetica",
      fontSize: 10,
      cellPadding: 1.8,
      textColor: warnaAbu
    },
    columnStyles: {
      0: {
        cellWidth: 36,
        fontStyle: "bold",
        textColor: warnaUtama
      },
      1: {
        cellWidth: 140,
        textColor: warnaAbu
      }
    },
    margin: {
      left: 14,
      right: 14
    }
  });

  // =========================
  // Ringkasan Utama
  // =========================
  let yRingkasan = doc.lastAutoTable.finalY + 10;

  doc.setTextColor(...warnaUtama);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Ringkasan", 14, yRingkasan);

  const ringkasanRows = [
    ["Total Pengeluaran", formatRupiah(totalBulan)],
    ["Target Bulanan", targetBulanan > 0 ? formatRupiah(targetBulanan) : "Belum diatur"],
    ["Prediksi / Total Akhir Bulan", formatRupiah(prediksiAkhirBulan)],
    ["Jumlah Transaksi", `${dataTerfilter.length} transaksi`]
  ];

  if (targetBulanan > 0) {
    const selisih = targetBulanan - prediksiAkhirBulan;

    if (selisih >= 0) {
      ringkasanRows.push(["Status Target", `Aman, sisa ${formatRupiah(selisih)}`]);
    } else {
      ringkasanRows.push(["Status Target", `Melebihi target ${formatRupiah(Math.abs(selisih))}`]);
    }
  } else {
    ringkasanRows.push(["Status Target", "Belum ada target bulanan"]);
  }

  doc.autoTable({
    startY: yRingkasan + 5,
    head: [["Keterangan", "Nilai"]],
    body: ringkasanRows,
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 10,
      cellPadding: 3,
      lineColor: warnaBorder,
      lineWidth: 0.2
    },
    headStyles: {
      fillColor: warnaUtama,
      textColor: [255, 255, 255],
      fontStyle: "bold"
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: {
        cellWidth: 70,
        fontStyle: "bold",
        textColor: warnaUtama
      },
      1: {
        cellWidth: 110,
        textColor: [30, 41, 59]
      }
    },
    margin: {
      left: 14,
      right: 14
    }
  });

  // =========================
  // Ringkasan Kategori
  // =========================
  const kategoriRows = buatDataRingkasanKategoriPDF(dataTerfilter);

  let yKategori = doc.lastAutoTable.finalY + 10;

  doc.setTextColor(...warnaUtama);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Ringkasan Kategori", 14, yKategori);

  doc.autoTable({
    startY: yKategori + 5,
    head: [["Kategori", "Total", "Persentase"]],
    body: kategoriRows,
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 10,
      cellPadding: 3,
      lineColor: warnaBorder,
      lineWidth: 0.2
    },
    headStyles: {
      fillColor: warnaAksen,
      textColor: [2, 6, 23],
      fontStyle: "bold"
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 60, halign: "right" },
      2: { cellWidth: 50, halign: "center" }
    },
    margin: {
      left: 14,
      right: 14
    }
  });

  // =========================
  // Detail Pengeluaran
  // =========================
  let yDetail = doc.lastAutoTable.finalY + 10;

  doc.setTextColor(...warnaUtama);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Detail Pengeluaran", 14, yDetail);

  const dataUrut = [...dataTerfilter].sort(function (a, b) {
    return new Date(a.tanggal) - new Date(b.tanggal);
  });

  const detailRows = dataUrut.map(function (item, index) {
    return [
      index + 1,
      formatTanggalIndonesia(item.tanggal),
      item.nama,
      item.kategori,
      formatRupiah(item.harga_satuan),
      `x${item.qty}`,
      formatRupiah(item.jumlah)
    ];
  });

  doc.autoTable({
    startY: yDetail + 5,
    head: [["No", "Tanggal", "Nama", "Kategori", "Harga Satuan", "Qty", "Total"]],
    body: detailRows,
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 8.8,
      cellPadding: 2.4,
      lineColor: warnaBorder,
      lineWidth: 0.2
    },
    headStyles: {
      fillColor: warnaUtama,
      textColor: [255, 255, 255],
      fontStyle: "bold"
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 25 },
      2: { cellWidth: 42 },
      3: { cellWidth: 28 },
      4: { cellWidth: 30, halign: "right" },
      5: { cellWidth: 15, halign: "center" },
      6: { cellWidth: 30, halign: "right" }
    },
    margin: {
      left: 14,
      right: 14
    }
  });

  tambahFooterPDF(doc, developerName);

  const namaFile = `laporan-pengeluaran-${filterTahun}-${String(filterBulan).padStart(2, "0")}.pdf`;

  doc.save(namaFile);
}

function buatDataRingkasanKategoriPDF(data) {
  let totalKategori = {};
  let totalSemua = 0;

  data.forEach(function (item) {
    if (!totalKategori[item.kategori]) {
      totalKategori[item.kategori] = 0;
    }

    totalKategori[item.kategori] += item.jumlah;
    totalSemua += item.jumlah;
  });

  const hasil = Object.keys(totalKategori).map(function (kategori) {
    const total = totalKategori[kategori];
    const persen = totalSemua > 0 ? (total / totalSemua) * 100 : 0;

    return {
      kategori: kategori,
      total: total,
      persen: persen
    };
  });

  hasil.sort(function (a, b) {
    return b.total - a.total;
  });

  return hasil.map(function (item) {
    return [
      item.kategori,
      formatRupiah(item.total),
      `${item.persen.toFixed(1)}%`
    ];
  });
}

function formatTanggalIndonesia(tanggalString) {
  const tanggal = new Date(tanggalString);

  return tanggal.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

function tambahFooterPDF(doc, developerName) {
  const jumlahHalaman = doc.internal.getNumberOfPages();

  for (let i = 1; i <= jumlahHalaman; i++) {
    doc.setPage(i);

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(14, 285, 196, 285);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);

    doc.text(
      `Smart Expense Tracker | Developed by ${developerName}`,
      14,
      290
    );

    doc.text(`Halaman ${i} dari ${jumlahHalaman}`, 196, 290, {
      align: "right"
    });
  }
}

function normalisasiNamaItem(nama) {
  return nama
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function cariItemMiripDiHariYangSama(tanggal, namaBaru) {
  const namaBaruNormal = normalisasiNamaItem(namaBaru);

  let itemTerbaik = null;
  let skorTerbaik = 0;

  dataPengeluaran.forEach(function (item) {
    if (item.tanggal !== tanggal) {
      return;
    }

    const namaLamaNormal = normalisasiNamaItem(item.nama);

    const skor = hitungKemiripanKalimat(namaBaruNormal, namaLamaNormal);

    if (skor > skorTerbaik) {
      skorTerbaik = skor;
      itemTerbaik = item;
    }
  });

  if (itemTerbaik && skorTerbaik >= 0.75) {
    return itemTerbaik;
  }

  return null;
}

function hitungKemiripanKalimat(kalimat1, kalimat2) {
  const jarak = hitungLevenshtein(kalimat1, kalimat2);
  const panjangTerbesar = Math.max(kalimat1.length, kalimat2.length);

  if (panjangTerbesar === 0) {
    return 0;
  }

  return 1 - jarak / panjangTerbesar;
}

function ambilAngkaInput(id) {
  const input = document.getElementById(id);
  const nilai = input.value;

  const angkaBersih = nilai.replace(/[^\d]/g, "");

  return Number(angkaBersih);
}

function cariNamaDariRiwayat(namaInput) {
  const namaInputNormal = normalisasiNamaItem(namaInput);

  let namaTerbaik = null;
  let skorTerbaik = 0;
  let kategoriTerbaik = null;

  dataPengeluaran.forEach(function (item) {
    const namaRiwayat = normalisasiNamaItem(item.nama);

    const skor = hitungKemiripanKalimat(namaInputNormal, namaRiwayat);

    if (skor > skorTerbaik) {
      skorTerbaik = skor;
      namaTerbaik = item.nama;
      kategoriTerbaik = item.kategori;
    }
  });

  if (namaTerbaik && skorTerbaik >= 0.78) {
    return {
      ditemukan: true,
      nama: namaTerbaik,
      kategori: kategoriTerbaik,
      skor: skorTerbaik
    };
  }

  return {
    ditemukan: false,
    nama: rapikanNamaPengeluaran(namaInput),
    kategori: deteksiKategoriOtomatis(namaInput),
    skor: 0
  };
}

function deteksiKategoriDariRiwayat(namaInput) {
  const hasilRiwayat = cariNamaDariRiwayat(namaInput);

  if (hasilRiwayat.ditemukan) {
    return hasilRiwayat.kategori;
  }

  return deteksiKategoriOtomatis(namaInput);
}

function tampilkanSaranPintarLokal() {
  const saranText = document.getElementById("saranPintarText");

  if (!saranText) {
    return;
  }

  const dataTerfilter = dataPengeluaran.filter(function (item) {
    return cekDataSesuaiFilter(item);
  });

  if (dataTerfilter.length === 0) {
    saranText.innerText = "Belum ada data pada bulan dan tahun yang dipilih.";
    return;
  }

  let totalBulan = 0;
  let totalKategori = {};
  let totalHarian = {};

  dataTerfilter.forEach(function (item) {
    const totalItem = Number(item.jumlah) || 0;

    totalBulan += totalItem;

    if (!totalKategori[item.kategori]) {
      totalKategori[item.kategori] = 0;
    }

    totalKategori[item.kategori] += totalItem;

    if (!totalHarian[item.tanggal]) {
      totalHarian[item.tanggal] = 0;
    }

    totalHarian[item.tanggal] += totalItem;
  });

  const kategoriTerbesar = cariKategoriTerbesarDariObject(totalKategori);
  const jumlahHariDenganData = Object.keys(totalHarian).length;
  const rataRataHarian = totalBulan / jumlahHariDenganData;

  const hariIni = new Date();
  const bulanSekarang = hariIni.getMonth() + 1;
  const tahunSekarang = hariIni.getFullYear();

  const jumlahHariDalamBulan = new Date(filterTahun, filterBulan, 0).getDate();

  let prediksiAkhirBulan = totalBulan;

  if (filterBulan === bulanSekarang && filterTahun === tahunSekarang) {
    prediksiAkhirBulan = Math.round(
      (totalBulan / hariIni.getDate()) * jumlahHariDalamBulan
    );
  }

  let saran = "";

  saran += `Total pengeluaran bulan dipilih: ${formatRupiah(totalBulan)}\n`;
  saran += `Rata-rata pengeluaran harian: ${formatRupiah(rataRataHarian)}\n`;

  const prediksiPintar = hitungPrediksiPintarAkhirBulan();

  if (prediksiPintar.bisaDiprediksi) {
    saran += `Prediksi pintar akhir bulan: ${formatRupiah(prediksiPintar.prediksi)}\n`;
    saran += `Rata-rata hari kerja: ${formatRupiah(prediksiPintar.rataHariKerja)}\n`;
    saran += `Rata-rata akhir pekan: ${formatRupiah(prediksiPintar.rataWeekend)}\n`;
    saran += `Catatan pola: ${prediksiPintar.catatan}\n\n`;

    prediksiAkhirBulan = prediksiPintar.prediksi;
  } else {
    if (filterBulan === bulanSekarang && filterTahun === tahunSekarang) {
      saran += `Prediksi akhir bulan: ${formatRupiah(prediksiAkhirBulan)}\n\n`;
    } else {
      saran += `Total akhir bulan tersebut: ${formatRupiah(prediksiAkhirBulan)}\n\n`;
    }
  }

  if (kategoriTerbesar) {
    const persenKategori = (kategoriTerbesar.total / totalBulan) * 100;

    saran += `Kategori terbesar: ${kategoriTerbesar.nama}\n`;
    saran += `Total kategori tersebut: ${formatRupiah(kategoriTerbesar.total)} (${persenKategori.toFixed(1)}%)\n\n`;

    if (persenKategori >= 50) {
      saran += `Saran kategori: Pengeluaran ${kategoriTerbesar.nama} cukup dominan. Coba kurangi sedikit pada kategori ini agar pengeluaran lebih seimbang.\n\n`;
    } else if (persenKategori >= 35) {
      saran += `Saran kategori: Pengeluaran ${kategoriTerbesar.nama} cukup besar, tapi masih dalam batas wajar. Tetap pantau agar tidak mendominasi bulan ini.\n\n`;
    } else {
      saran += `Saran kategori: Pembagian kategori masih cukup seimbang.\n\n`;
    }
  }

  if (targetBulanan > 0) {
    if (prediksiAkhirBulan > targetBulanan) {
      const selisih = prediksiAkhirBulan - targetBulanan;
      const sisaHari = Math.max(jumlahHariDalamBulan - hariIni.getDate(), 1);
      const penguranganPerHari = Math.ceil(selisih / sisaHari);

      saran += `Status target: Prediksi melewati target bulanan.\n`;
      saran += `Kelebihan prediksi: ${formatRupiah(selisih)}\n`;
      saran += `Rekomendasi: Kurangi sekitar ${formatRupiah(penguranganPerHari)} per hari sampai akhir bulan agar lebih mendekati target.`;
    } else {
      const sisaTarget = targetBulanan - prediksiAkhirBulan;

      saran += `Status target: Masih aman.\n`;
      saran += `Perkiraan sisa dari target: ${formatRupiah(sisaTarget)}\n`;
      saran += `Rekomendasi: Pertahankan pola pengeluaran sekarang. Jangan menaikkan pengeluaran harian terlalu jauh.`;
    }
  } else {
    saran += `Target bulanan belum diatur.\n`;
    saran += `Rekomendasi: Atur target bulanan agar sistem bisa memberi saran penghematan yang lebih akurat.`;
  }

  saranText.innerText = saran;
}

async function buatSaranPintarAI() {
  const saranText = document.getElementById("saranPintarText");
  const btnSaran = document.getElementById("btnSaranPintar");

  if (!saranText) {
    return;
  }

  const dataTerfilter = dataPengeluaran.filter(function (item) {
    return cekDataSesuaiFilter(item);
  });

  if (dataTerfilter.length === 0) {
    saranText.innerText =
      "Belum ada data pada bulan dan tahun yang dipilih. Tambahkan data terlebih dahulu.";
    return;
  }

  if (!BACKEND_URL) {
    tampilkanSaranPintarLokal();
    return;
  }

  const totalData = dataTerfilter.reduce(function (total, item) {
    return total + (Number(item.jumlah) || 0);
  }, 0);

  const cacheKey =
    `${filterBulan}-${filterTahun}-${dataTerfilter.length}-${totalData}-${targetBulanan}`;

  if (cacheSaranPintarAI[cacheKey]) {
    saranText.innerText = cacheSaranPintarAI[cacheKey];
    return;
  }

  setButtonLoading(btnSaran, true);

  saranText.innerText =
    "Sedang menganalisis pola pengeluaran dan membuat saran pintar...";

  try {
    const namaBulan = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];

    const periode = `${namaBulan[filterBulan - 1]} ${filterTahun}`;

    const dataUntukAI = dataTerfilter.map(function (item) {
      return {
        tanggal: item.tanggal,
        nama: item.nama,
        kategori: item.kategori,
        qty: item.qty,
        jumlah: item.jumlah
      };
    });

    const response = await fetch(`${BACKEND_URL}/smart-suggestion`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        periode: periode,
        target_bulanan: targetBulanan,
        data_pengeluaran: dataUntukAI
      })
    });

    const hasil = await response.json();

    console.log("Hasil Saran Pintar:", hasil);

    if (!response.ok || !hasil.success || !hasil.saran) {
      tampilkanSaranPintarLokal();
      return;
    }

    if (hasil.source === "ai") {
      cacheSaranPintarAI[cacheKey] = hasil.saran;
    }

    saranText.innerText = hasil.saran;

  } catch (error) {
    console.warn("Gagal mengambil saran pintar:", error);
    tampilkanSaranPintarLokal();

  } finally {
    setButtonLoading(btnSaran, false);
  }
}

function cariKategoriTerbesarDariObject(totalKategori) {
  let namaTerbesar = null;
  let totalTerbesar = 0;

  for (let kategori in totalKategori) {
    if (totalKategori[kategori] > totalTerbesar) {
      namaTerbesar = kategori;
      totalTerbesar = totalKategori[kategori];
    }
  }

  if (!namaTerbesar) {
    return null;
  }

  return {
    nama: namaTerbesar,
    total: totalTerbesar
  };
}

function deteksiHargaTidakWajar(namaInput, hargaSatuanBaru) {
  const namaNormal = normalisasiNamaItem(namaInput);

  const riwayatHarga = dataPengeluaran
    .filter(function (item) {
      const namaItemNormal = normalisasiNamaItem(item.nama);
      const skor = hitungKemiripanKalimat(namaNormal, namaItemNormal);

      return skor >= 0.78 && Number(item.harga_satuan) > 0;
    })
    .map(function (item) {
      return Number(item.harga_satuan);
    });

  // Kalau riwayat masih sedikit, jangan langsung curiga
  if (riwayatHarga.length < 2) {
    return {
      tidakWajar: false,
      pesan: ""
    };
  }

  const rataRataHarga =
    riwayatHarga.reduce(function (total, harga) {
      return total + harga;
    }, 0) / riwayatHarga.length;

  const hargaTertinggi = Math.max(...riwayatHarga);
  const hargaTerendah = Math.min(...riwayatHarga);

  // Batas toleransi
  const batasAtas = rataRataHarga * 2.5;
  const batasBawah = rataRataHarga * 0.4;

  if (hargaSatuanBaru > batasAtas) {
    return {
      tidakWajar: true,
      pesan:
        `Harga "${namaInput}" terlihat jauh lebih tinggi dari biasanya.\n\n` +
        `Harga yang kamu input: ${formatRupiah(hargaSatuanBaru)}\n` +
        `Rata-rata riwayat: ${formatRupiah(rataRataHarga)}\n` +
        `Harga tertinggi sebelumnya: ${formatRupiah(hargaTertinggi)}\n\n` +
        `Tetap simpan data ini?`
    };
  }

  if (hargaSatuanBaru < batasBawah) {
    return {
      tidakWajar: true,
      pesan:
        `Harga "${namaInput}" terlihat jauh lebih rendah dari biasanya.\n\n` +
        `Harga yang kamu input: ${formatRupiah(hargaSatuanBaru)}\n` +
        `Rata-rata riwayat: ${formatRupiah(rataRataHarga)}\n` +
        `Harga terendah sebelumnya: ${formatRupiah(hargaTerendah)}\n\n` +
        `Tetap simpan data ini?`
    };
  }

  return {
    tidakWajar: false,
    pesan: ""
  };
}

function deteksiTotalHarianTidakWajar(tanggalInput, totalBaru) {
  let totalPerHari = {};

  dataPengeluaran.forEach(function (item) {
    if (!item.tanggal) {
      return;
    }

    if (!totalPerHari[item.tanggal]) {
      totalPerHari[item.tanggal] = 0;
    }

    totalPerHari[item.tanggal] += Number(item.jumlah) || 0;
  });

  const daftarTanggal = Object.keys(totalPerHari);

  // Kalau data harian masih sedikit, jangan langsung curiga
  if (daftarTanggal.length < 3) {
    return {
      tidakWajar: false,
      pesan: ""
    };
  }

  const totalHariIniSebelum = totalPerHari[tanggalInput] || 0;
  const totalHariIniSesudah = totalHariIniSebelum + totalBaru;

  const daftarTotalHariLain = daftarTanggal
    .filter(function (tanggal) {
      return tanggal !== tanggalInput;
    })
    .map(function (tanggal) {
      return totalPerHari[tanggal];
    });

  if (daftarTotalHariLain.length < 3) {
    return {
      tidakWajar: false,
      pesan: ""
    };
  }

  const rataRataHarian =
    daftarTotalHariLain.reduce(function (total, nilai) {
      return total + nilai;
    }, 0) / daftarTotalHariLain.length;

  const totalTertinggiSebelumnya = Math.max(...daftarTotalHariLain);

  const batasAtas = rataRataHarian * 2.5;

  if (totalHariIniSesudah > batasAtas && totalHariIniSesudah > totalTertinggiSebelumnya) {
    return {
      tidakWajar: true,
      pesan:
        `Total pengeluaran pada tanggal ${tanggalInput} terlihat jauh lebih tinggi dari biasanya.\n\n` +
        `Total hari ini setelah input: ${formatRupiah(totalHariIniSesudah)}\n` +
        `Rata-rata harian sebelumnya: ${formatRupiah(rataRataHarian)}\n` +
        `Total harian tertinggi sebelumnya: ${formatRupiah(totalTertinggiSebelumnya)}\n\n` +
        `Tetap simpan data ini?`
    };
  }

  return {
    tidakWajar: false,
    pesan: ""
  };
}

function buatTanggalLokal(tanggalString) {
  const pecah = tanggalString.split("-").map(Number);
  return new Date(pecah[0], pecah[1] - 1, pecah[2]);
}

function apakahWeekend(tanggalString) {
  const tanggal = buatTanggalLokal(tanggalString);
  const hari = tanggal.getDay();

  // 0 = Minggu, 6 = Sabtu
  return hari === 0 || hari === 6;
}

function hitungPrediksiPintarAkhirBulan() {
  const dataBulanIni = dataPengeluaran.filter(function (item) {
    return cekDataSesuaiFilter(item);
  });

  if (dataBulanIni.length === 0) {
    return {
      bisaDiprediksi: false,
      prediksi: 0,
      rataHariKerja: 0,
      rataWeekend: 0,
      catatan: "Belum ada data untuk membuat prediksi pintar."
    };
  }

  let totalPerHari = {};

  dataBulanIni.forEach(function (item) {
    if (!totalPerHari[item.tanggal]) {
      totalPerHari[item.tanggal] = 0;
    }

    totalPerHari[item.tanggal] += Number(item.jumlah) || 0;
  });

  let totalHariKerja = 0;
  let jumlahHariKerjaAdaData = 0;

  let totalWeekend = 0;
  let jumlahWeekendAdaData = 0;

  for (let tanggal in totalPerHari) {
    if (apakahWeekend(tanggal)) {
      totalWeekend += totalPerHari[tanggal];
      jumlahWeekendAdaData++;
    } else {
      totalHariKerja += totalPerHari[tanggal];
      jumlahHariKerjaAdaData++;
    }
  }

  const rataSemuaHari =
    Object.values(totalPerHari).reduce(function (total, nilai) {
      return total + nilai;
    }, 0) / Object.keys(totalPerHari).length;

  const rataHariKerja =
    jumlahHariKerjaAdaData > 0 ? totalHariKerja / jumlahHariKerjaAdaData : rataSemuaHari;

  const rataWeekend =
    jumlahWeekendAdaData > 0 ? totalWeekend / jumlahWeekendAdaData : rataSemuaHari;

  const hariIni = new Date();
  const bulanSekarang = hariIni.getMonth() + 1;
  const tahunSekarang = hariIni.getFullYear();

  const jumlahHariDalamBulan = new Date(filterTahun, filterBulan, 0).getDate();

  let totalSekarang = 0;

  Object.values(totalPerHari).forEach(function (nilai) {
    totalSekarang += nilai;
  });

  // Kalau bulan yang dilihat bukan bulan berjalan,
  // prediksi dianggap total real bulan tersebut.
  if (filterBulan !== bulanSekarang || filterTahun !== tahunSekarang) {
    return {
      bisaDiprediksi: true,
      prediksi: Math.round(totalSekarang),
      rataHariKerja: Math.round(rataHariKerja),
      rataWeekend: Math.round(rataWeekend),
      catatan: "Bulan yang dipilih bukan bulan berjalan, jadi nilai ini adalah total aktual bulan tersebut."
    };
  }

  let tambahanPrediksi = 0;
  let sisaHariKerja = 0;
  let sisaWeekend = 0;

  for (let hari = hariIni.getDate() + 1; hari <= jumlahHariDalamBulan; hari++) {
    const tanggalString =
      filterTahun +
      "-" +
      String(filterBulan).padStart(2, "0") +
      "-" +
      String(hari).padStart(2, "0");

    if (apakahWeekend(tanggalString)) {
      tambahanPrediksi += rataWeekend;
      sisaWeekend++;
    } else {
      tambahanPrediksi += rataHariKerja;
      sisaHariKerja++;
    }
  }

  let catatan = "";

  if (rataWeekend > rataHariKerja * 1.3) {
    catatan = "Pengeluaran akhir pekan cenderung lebih besar daripada hari kerja.";
  } else if (rataHariKerja > rataWeekend * 1.3) {
    catatan = "Pengeluaran hari kerja cenderung lebih besar daripada akhir pekan.";
  } else {
    catatan = "Pola pengeluaran hari kerja dan akhir pekan cukup seimbang.";
  }

  return {
    bisaDiprediksi: true,
    prediksi: Math.round(totalSekarang + tambahanPrediksi),
    rataHariKerja: Math.round(rataHariKerja),
    rataWeekend: Math.round(rataWeekend),
    sisaHariKerja: sisaHariKerja,
    sisaWeekend: sisaWeekend,
    catatan: catatan
  };
}

function tampilkanSaranPintarAwal() {
  const saranText = document.getElementById("saranPintarText");

  if (!saranText) {
    return;
  }

  const dataTerfilter = dataPengeluaran.filter(function (item) {
    return cekDataSesuaiFilter(item);
  });

  if (dataTerfilter.length === 0) {
    saranText.innerText =
      "Belum ada data pada bulan dan tahun yang dipilih. Tambahkan data terlebih dahulu untuk membuat saran pintar.";
    return;
  }

  saranText.innerText =
    "Data pengeluaran sudah siap dianalisis. Klik tombol Buat Saran Pintar untuk mendapatkan saran berdasarkan pola pengeluaran bulan ini.";
}

function tampilkanInsightItemSering() {
  const container = document.getElementById("insightItemText");

  if (!container) {
    return;
  }

  const dataTerfilter = dataPengeluaran.filter(function (item) {
    return cekDataSesuaiFilter(item);
  });

  if (dataTerfilter.length === 0) {
    container.innerText = "Belum ada data pada bulan dan tahun yang dipilih.";
    return;
  }

  let ringkasanItem = {};

  dataTerfilter.forEach(function (item) {
    const namaNormal = normalisasiNamaItem(item.nama);

    if (!ringkasanItem[namaNormal]) {
      ringkasanItem[namaNormal] = {
        nama: item.nama,
        kategori: item.kategori,
        totalQty: 0,
        totalUang: 0,
        jumlahTransaksi: 0
      };
    }

    ringkasanItem[namaNormal].totalQty += Number(item.qty) || 1;
    ringkasanItem[namaNormal].totalUang += Number(item.jumlah) || 0;
    ringkasanItem[namaNormal].jumlahTransaksi += 1;
  });

  const daftarItem = Object.values(ringkasanItem);

  daftarItem.sort(function (a, b) {
    if (b.totalQty !== a.totalQty) {
      return b.totalQty - a.totalQty;
    }

    return b.totalUang - a.totalUang;
  });

  const topItem = daftarItem.slice(0, 5);

  let html = "";

  html += `<p>Berikut item yang paling sering kamu beli pada bulan yang dipilih:</p>`;
  html += `<div class="item-insight-list">`;

  topItem.forEach(function (item, index) {
    html += `
      <div class="item-insight">
        <strong>${index + 1}. ${item.nama}</strong><br>
        Kategori: ${item.kategori}<br>
        Total qty: x${item.totalQty}<br>
        Total uang: ${formatRupiah(item.totalUang)}<br>
        Jumlah transaksi: ${item.jumlahTransaksi} kali
      </div>
    `;
  });

  html += `</div>`;

  const itemPalingSering = topItem[0];

  if (itemPalingSering) {
    html += buatSaranDariItemSering(itemPalingSering);
  }

  container.innerHTML = html;
}

function buatSaranDariItemSering(item) {
  let saran = "";

  saran += `<p><strong>Analisis:</strong><br>`;

  if (item.totalQty >= 10) {
    saran += `Item <strong>${item.nama}</strong> cukup sering dibeli bulan ini. Walaupun terlihat kecil, pengeluaran berulang seperti ini bisa cukup memengaruhi total bulanan.`;
  } else if (item.totalQty >= 5) {
    saran += `Item <strong>${item.nama}</strong> mulai cukup sering muncul. Masih wajar, tapi tetap bagus untuk dipantau.`;
  } else {
    saran += `Belum ada item yang terlalu sering dibeli. Pola pengeluaran item masih cukup normal.`;
  }

  saran += `</p>`;

  return saran;
}

async function ambilAccessTokenSupabase() {
  const { data, error } = await supabaseClient.auth.getSession();

  if (error || !data.session) {
    return null;
  }

  return data.session.access_token;
}

async function analisisPengeluaranDenganBackend(tanggal, nama, hargaSatuan, qty, kategori) {
  if (!BACKEND_URL) {
    return {
      success: false,
      nama_final: rapikanNamaPengeluaran(nama),
      kategori_final: deteksiKategoriDariRiwayat(nama),
      gabung: { gabung: false },
      sumber: "fallback_frontend"
    };
  }

  try {
    const accessToken = await ambilAccessTokenSupabase();

    if (!accessToken) {
      return {
        success: false,
        nama_final: rapikanNamaPengeluaran(nama),
        kategori_final: deteksiKategoriDariRiwayat(nama),
        gabung: { gabung: false },
        sumber: "fallback_no_token"
      };
    }

    const response = await fetch(`${BACKEND_URL}/analyze-expense`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        access_token: accessToken,
        tanggal: tanggal,
        nama: nama,
        harga_satuan: hargaSatuan,
        qty: qty,
        kategori: kategori
      })
    });

    const hasil = await response.json();

    if (!response.ok || !hasil.success) {
      console.warn("Backend gagal menganalisis:", hasil);

      return {
        success: false,
        nama_final: rapikanNamaPengeluaran(nama),
        kategori_final: deteksiKategoriDariRiwayat(nama),
        gabung: { gabung: false },
        sumber: "fallback_backend_error"
      };
    }

    return hasil;
  } catch (error) {
    console.warn("Tidak bisa terhubung ke backend:", error);

    return {
      success: false,
      nama_final: rapikanNamaPengeluaran(nama),
      kategori_final: deteksiKategoriDariRiwayat(nama),
      gabung: { gabung: false },
      sumber: "fallback_connection_error"
    };
  }
}

function toggleDashboardNav() {
  const nav = document.getElementById("floatingDashboardNav");

  if (!nav) {
    return;
  }

  nav.classList.toggle("open");
}

function scrollKeFitur(sectionId) {
  const target = document.getElementById(sectionId);
  const nav = document.getElementById("floatingDashboardNav");

  if (!target) {
    tampilkanPopup("Bagian dashboard ini belum ditemukan.", "warning");
    return;
  }

  target.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

  if (nav) {
    nav.classList.remove("open");
  }
}

document.addEventListener("click", function (event) {
  const nav = document.getElementById("floatingDashboardNav");

  if (!nav) {
    return;
  }

  if (!nav.contains(event.target)) {
    nav.classList.remove("open");
  }
});