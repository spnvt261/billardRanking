// app.js (sửa lại phần loadPage)
async function loadPage(page, queryString) {
    const app = document.getElementById("app");
    const params = new URLSearchParams(queryString || "");
    const id = params.get("id");  // ví dụ lấy ?id=4

    try {
        // Load HTML
        app.innerHTML = `
      <div class="flex flex-col items-center justify-center py-12">
        <div class="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p class="mt-4 text-gray-600 font-medium">Loading...</p>
      </div>
    `;

        // Chờ 0.5s để spinner hiển thị rõ ràng
        const delay = Math.floor(Math.random() * 300) + 1;
        await new Promise(resolve => setTimeout(resolve, delay));
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
            // ✅ Thêm class ép landscape
            document.body.classList.add("landscape-only");
        } else {
            if (header) header.style.display = "block";
            if (footer) footer.style.display = "block";
            app.classList.add("mt-20");
            // ✅ Xóa class khi ra khỏi score_counter
            document.body.classList.remove("landscape-only");
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
        app.innerHTML = `
  <div role="status" aria-live="polite" class="min-h-[260px] flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-xl text-center bg-white shadow-lg rounded-2xl p-8 mx-2">
      
      <div class="mx-auto w-28 h-28 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center mb-6">
        <!-- Decorative SVG -->
        <svg width="52" height="52" viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="9" stroke="#1E40AF" stroke-opacity="0.12" stroke-width="2"/>
          <path d="M9 9l6 6M15 9l-6 6" stroke="#1E40AF" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>

      <h1 class="text-3xl font-extrabold text-blue-800 mb-2">Page not found</h1>
      <p class="text-gray-600 mb-6">Không tìm thấy trang bạn yêu cầu. Có thể đường dẫn sai hoặc trang đã được di chuyển.</p>

      <div class="flex items-center justify-center gap-3 flex-wrap">
        <button id="go-home" class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300">
          <!-- home icon -->
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 10.5L12 4l9 6.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 21V11.5h14V21" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Về trang chủ
        </button>

        <button id="retry" class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-800 text-sm font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300">
          <!-- retry icon -->
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 11a8 8 0 10-2.8 5.6L20 20" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Thử lại
        </button>

        <button id="report" class="inline-block px-3 py-2 text-sm text-blue-700 hover:underline focus:outline-none">
          Báo lỗi / Gửi phản hồi
        </button>
      </div>

      <p class="mt-6 text-xs text-gray-400">URL: <span class="text-gray-600 break-all">${location.href}</span></p>
    </div>
  </div>
`;
        // === Gắn sự kiện cho các nút ===
        const goHome = document.getElementById("go-home");
        const retry = document.getElementById("retry");
        const report = document.getElementById("report");

        if (goHome) {
            goHome.addEventListener("click", () => {
                window.location.hash = "#/rankings"; // 👈 đổi trang mặc định về "rankings"
            });
        }

        if (retry) {
            retry.addEventListener("click", () => {
                router(); // 👈 gọi lại router() để thử load lại page
            });
        }
        if (report) {
            report.addEventListener("click", () => {
                const to = "sonsson2003@gmail.com";
                const subject = encodeURIComponent("Lỗi pages");
                const body = encodeURIComponent(
                    "Xin chào,\n\nTôi gặp lỗi khi truy cập trang.\n\n" +
                    "URL: " + location.href + "\n\n" +
                    "Chi tiết lỗi:\n" + (err?.message || "Không rõ") + "\n\n" +
                    "Mô tả thêm: "
                );
                window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
            });

        }

        // alert(err);
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
if (score_counter_url) {
    window.location.hash = `#/score_counter?id=${score_counter_url}`;
    // console.log(score_counter_url);
}

