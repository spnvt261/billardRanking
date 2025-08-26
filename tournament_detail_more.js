let history_points_den = poolData.history_points_den;
// Lấy danh sách player
let listPlayers = poolData.players.filter(p => tournament.players.includes(p.id));

const defaultColors = ["#cce5ff", "#ffe5b4", "#e5ccff"];

// Khởi tạo bảng điểm
let scores = listPlayers.map((p, index) => {
    let old = history_points_den
        .filter(h => h.tournamentId === tournament.id && h.playerId === p.id)
        .reduce((sum, h) => sum + h.pointsReceived, 0);

    return {
        id: p.id,
        name: p.name,
        oldPoints: old,
        matchPoints: 0,
        current: old,
        color: defaultColors[index % defaultColors.length],
        cells: {} // sẽ chứa reference tới các <td>
    };
});
let currentPage = 1;
const rowsPerPage = 10;

function renderHistoryTable() {
    const thead = document.getElementById("history-head");
    const tbody = document.getElementById("history-body");

    // Render head
    thead.innerHTML = "<tr><th class='p-2 text-left'>Rack</th>" +
        listPlayers.map(p => `<th class='p-2'>${p.name}</th>`).join("") +
        "</tr>";

    // Gom dữ liệu theo rack
    let grouped = {};
    history_points_den
        .filter(h => h.tournamentId === tournament.id)
        .forEach(h => {
            if (!grouped[h.racks]) grouped[h.racks] = {};
            grouped[h.racks][h.playerId] = h.pointsReceived;
        });

    let rackNumbers = Object.keys(grouped)
        .map(r => parseInt(r))
        .sort((a, b) => a - b); // sắp xếp tăng dần (rack mới nhất trước)

    // Tính số trang
    const totalPages = Math.ceil(rackNumbers.length / rowsPerPage);
    if (currentPage > totalPages) currentPage = totalPages || 1;

    // Lấy racks của trang hiện tại
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const racksToShow = rackNumbers.slice(start, end);

    tbody.innerHTML = "";

    // Luôn hiện Rack 0 ở cuối cùng (chỉ 1 lần, trang đầu hoặc cuối tuỳ bạn)
    if (racksToShow.length == 0) {
        let row0 = `<tr class="border-b"><td class="p-2 font-bold">0</td>`;
        listPlayers.forEach(p => {
            row0 += `<td class="p-2 text-center">0</td>`;
        });
        row0 += "</tr>";
        tbody.innerHTML += row0;
    }

    // Render dữ liệu racks
    racksToShow.forEach(rack => {
        let row = `<tr class="border-b"><td class="p-2 font-bold">${rack}</td>`;
        listPlayers.forEach(p => {
            row += `<td class="p-2 text-center">${grouped[rack][p.id] ?? 0}</td>`;
        });
        row += "</tr>";
        tbody.innerHTML += row;
    });

    renderPagination(totalPages);
}
function renderPagination(totalPages) {
    const container = document.getElementById("history-pagination");
    container.innerHTML = "";

    // if (totalPages <= 1) return;

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement("button");
        btn.textContent = i;
        btn.className =
            "px-3 py-1 border rounded " +
            (i === currentPage
                ? "bg-blue-600 text-white"
                : "bg-gray-200 hover:bg-gray-300");
        btn.addEventListener("click", () => {
            currentPage = i;
            renderHistoryTable();
        });
        container.appendChild(btn);
    }
}
function renderRackHistoryChart(tournamentId) {
    // Lọc history theo tournament
    const history = history_points_den
        .filter(h => h.tournamentId === tournamentId)
        .sort((a, b) => a.racks - b.racks);

    if (history.length === 0) {
        document.getElementById("div-rack-history-chart").classList.add("hidden")
        return;
    }
    document.getElementById("div-rack-history-chart").classList.remove("hidden")
    // Lấy danh sách rack
    const racks = [...new Set(history.map(h => h.racks))].sort((a, b) => a - b);

    // Dataset cho từng player
    const datasets = listPlayers.map(player => {
        let cumulative = 0;
        const dataPoints = racks.map(rack => {
            const pointsThisRack = history
                .filter(h => h.playerId === player.id && h.racks === rack)
                .reduce((sum, h) => sum + h.pointsReceived, 0);
            cumulative += pointsThisRack;
            return cumulative;
        });

        // Lấy màu từ scores (hoặc defaultColors nếu chưa có)
        const scoreObj = scores.find(s => s.id === player.id);
        const color = scoreObj ? scoreObj.color : defaultColors[0];

        return {
            label: player.name,
            data: dataPoints,
            borderColor: color,
            backgroundColor: color,
            spanGaps: true,
            fill: false
        };
    });

    // Xoá chart cũ nếu có
    if (window.rackChart) {
        window.rackChart.destroy();
    }

    // Vẽ Chart.js
    const ctx = document.getElementById("rack-history-chart").getContext("2d");
    window.rackChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: racks,
            datasets: datasets
        },
        plugins: {
            legend: { position: "bottom" },
            title: {
                display: true,
                text: "Lịch sử điểm theo Rack"
            }
        },
        options: {
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true },
                x: {
                    title: { display: true, text: "Rack" }
                }
            }
        }
    });
}

renderHistoryTable();
renderRackHistoryChart(tournament.id);