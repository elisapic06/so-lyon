/* ============================================================
   So Lyon — écran de lancement (splash) + enreટgistrement du SW
   ============================================================ */
(function () {
  // splash : disparaît dès que l'app est prête
  const splash = document.createElement("div");
  splash.id = "splash";
  splash.innerHTML = `
    <div class="splash-inner">
      <div class="splash-logo">so<span>lyon</span></div>
      <div class="splash-city">Lyon</div>
    </div>`;
  document.body.appendChild(splash);

  function hideSplash() {
    const s = document.getElementById("splash");
    if (s) {
      s.classList.add("hide");
      setTimeout(() => s.remove(), 450);
    }
  }
  // sécurité : max 2.2s
  setTimeout(hideSplash, 2200);
  window.addEventListener("load", () => setTimeout(hideSplash, 350));

  // enregistrement du service worker (hors environnement de dev de fichier)
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch(() => {});
    });
  }

  // bannière d'installation iOS (une seule fois, si pas encore installée)
  if (!navigator.standalone && /iPhone|iPad/i.test(navigator.userAgent)) {
    try {
      if (!localStorage.getItem("so-lyon-ios-hint")) {
        setTimeout(() => {
          const tip = document.createElement("div");
          tip.id = "ios-install-tip";
          tip.innerHTML = `
            <div class="iit-inner">
              <b>Installe So Lyon</b>
              <span>Touche <b>Partager</b> <span class="iit-share"></span> puis <b>« Sur l'écran d'accueil »</b></span>
              <button class="iit-close" onclick="this.closest('#ios-install-tip').remove()">Plus tard</button>
            </div>`;
          document.body.appendChild(tip);
          tip.querySelector(".iit-close").addEventListener("click", () => {
            localStorage.setItem("so-lyon-ios-hint", "1");
          });
        }, 2500);
      }
    } catch (e) {}
  }
})();
