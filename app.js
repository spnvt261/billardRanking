// app.js

// app.js (sửa lại phần loadPage)
async function loadPage(page, queryString) {
  const app = document.getElementById("app");
  const params = new URLSearchParams(queryString || "");
  const id = params.get("id");  // ví dụ lấy ?id=4

  try {
    // Load HTML
    const res = await fetch(`pages/${page}/${page}.html`);
    if (!res.ok) throw new Error("Page not found");
    app.innerHTML = await res.text();
    
    // ✅ Xử lý full screen cho score_counter
    const header = document.getElementById("header");
    const footer = document.getElementById("footer");
    if (page === "score_counter") {
       if (header) header.style.display = "none";
       if (footer) footer.style.display = "none";
      app.classList.remove("mt-20");
    } else {
      if (header) header.style.display = "block";
      if (footer) footer.style.display = "block";
      app.classList.add("mt-20");
    }

    // Load CSS
    document.querySelectorAll("link[data-page-style]").forEach(el => el.remove());
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `pages/${page}/${page}.css`;
    link.setAttribute("data-page-style", page);
    document.head.appendChild(link);

    // ✅ Highlight nav link hiện tại
    document.querySelectorAll("nav a").forEach(a => {
      a.classList.remove("font-bold");
      const targetPage = a.getAttribute("href").replace("#/", "");
      if (targetPage === page) {
        a.classList.add("font-bold");
      }
    });

    // Import JS module và gọi render()
    const module = await import(`./pages/${page}/${page}.js`);
    if (typeof module.render === "function") {
      module.render({ id });
    }

  } catch (err) {
    app.innerHTML = "<h2>Page not found</h2>";
    console.error(err);
  }
}

function router() {
  let hash = window.location.hash || "#/rankings";
  let [path, queryString] = hash.replace("#/", "").split("?");
  let page = path.replace(".html", "");

  loadPage(page, queryString);
}

// Khi dữ liệu poolData sẵn sàng mới start router
window.addEventListener("poolDataReady", () => {
  // console.log("🚀 poolData ready, start router");
  window.addEventListener("hashchange", router);
  router();
});

let score_counter_url = JSON.parse(localStorage.getItem("score_counter_url"))
if(score_counter_url){
  window.location.hash=`#/score_counter?id=${score_counter_url}`;
  // console.log(score_counter_url);
}