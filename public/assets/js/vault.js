/* Recipe Vault: pick volumes and download them */
(function () {
  var base = "/downloads/recipe-vault/schoolaura-";
  var boxes = Array.prototype.slice.call(document.querySelectorAll(".pick input"));
  var label = document.getElementById("vault-count");
  var btn = document.getElementById("vault-dl");
  if (!btn) return;

  function chosen() { return boxes.filter(function (b) { return b.checked; }).map(function (b) { return b.value; }); }
  function update() {
    var n = chosen().length;
    label.textContent = n === 4 ? "All 4 volumes selected" : n === 0 ? "Choose at least one volume" : n + (n === 1 ? " volume" : " volumes") + " selected";
    btn.disabled = n === 0;
  }
  function fetchFile(slug) {
    var a = document.createElement("a");
    a.href = base + slug + ".pdf";
    a.download = "schoolaura-" + slug + ".pdf";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
  boxes.forEach(function (b) { b.addEventListener("change", update); });
  btn.addEventListener("click", function () {
    var list = chosen();
    if (!list.length) return;
    if (list.length === 4) { fetchFile("recipe-vault-complete"); SA.toast("Downloading the Complete Edition."); return; }
    list.forEach(function (slug, i) { setTimeout(function () { fetchFile(slug); }, i * 700); });
    SA.toast(list.length === 1 ? "Your download has started." : "Downloading " + list.length + " PDFs. Allow multiple downloads if your browser asks.");
  });
  update();
})();
