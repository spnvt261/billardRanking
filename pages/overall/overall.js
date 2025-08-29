import { poolData, createData, updateData, checkAdminAccess } from "../../data.js"; // nhớ export từ data.js

//Chart ==============================================
function parseVNDate(str) {
    let [day, month, year] = str.split('/').map(Number);
    return new Date(year, month - 1, day);
}

function toVNString(date) {
    return date.toLocaleDateString('vi-VN');
}

const defaultColors = [
    "#2ECC71", // Xanh lá cây
    "#9B59B6", // Tím
    "#F1C40F", // Vàng
    "#1ABC9C", // Xanh ngọc
    "#FF5733", // Đỏ cam
    "#33FF57", // Xanh lá sáng
    "#34495E", // Xám xanh đậm

    "#E74C3C", // Đỏ tươi
    "#3498DB", // Xanh dương
    "#E67E22", // Cam đất
    "#16A085", // Xanh teal
    "#8E44AD", // Tím đậm
    "#D35400", // Cam đậm
    "#27AE60", // Xanh lá đậm
    "#2980B9", // Xanh biển
    "#BDC3C7", // Xám sáng
    "#7F8C8D", // Xám trung tính
    "#F39C12", // Vàng cam
    "#2C3E50", // Xanh navy đậm
    "#C0392B"  // Đỏ rượu vang
];


function getRandomColor() {
    const r = Math.floor(Math.random() * 200);
    const g = Math.floor(Math.random() * 200);
    const b = Math.floor(Math.random() * 200);
    return `rgb(${r}, ${g}, ${b})`;
}

async function renderAllPlayersChart() {
    const canvas = document.getElementById('all-players-chart');
    if (!canvas) return;                      // page chưa có canvas thì thoát
    const ctx = canvas.getContext('2d');

    if (chartInstance) {                      // tránh vẽ chồng khi re-render
        chartInstance.destroy();
        chartInstance = null;
    }

    // Tìm ngày nhỏ nhất & lớn nhất
    const allDatesInHistory = poolData.history_point
        .filter(h => h.date)
        .map(h => parseVNDate(h.date));

    const minDateOverall = parseVNDate("29/07/2025");
    const endDate = new Date();

    // Tạo labels nhưng bỏ bớt ngày không biến động
    let labels = [];
    let stagnantCount = 0;

    let currentDate = new Date(minDateOverall);
    while (currentDate <= endDate) {
        const dateStr = toVNString(currentDate);

        // Kiểm tra xem ngày này có ai nhận điểm không
        const hasChange = poolData.history_point.some(h => h.date === dateStr && h.point !== 0);

        if (hasChange) {
            stagnantCount = 0;
            labels.push(dateStr);
        } else {
            stagnantCount++;
            // Chỉ giữ tối đa 2 ngày liên tiếp không biến động
            if (stagnantCount <= 2) {
                labels.push(dateStr);
            }
        }

        currentDate.setDate(currentDate.getDate() + 1);
    }

    // Dataset cho mỗi người
    const datasets = poolData.players
        .filter(player => player.name !== "Chấm")
        .filter(player => !player.name.includes("Khách"))
        .map(player => {
            const playerHistory = poolData.history_point
                .filter(h => h.playerId == player.id && h.date)
                .sort((a, b) => parseVNDate(a.date) - parseVNDate(b.date));

            if (playerHistory.length === 0) return null;

            // Start date = 1 ngày trước khi có điểm đầu tiên
            const firstDate = parseVNDate(playerHistory[0].date);
            firstDate.setDate(firstDate.getDate() - 1);

            let cumulative = 0;
            const dataPoints = labels.map(date => {
                const dateObj = parseVNDate(date);
                if (dateObj < firstDate) return null;

                const pointsOnDate = playerHistory
                    .filter(h => h.date === date)
                    .reduce((sum, h) => sum + h.point, 0);
                cumulative += pointsOnDate;
                return cumulative;
            });

            return {
                label: player.name,
                data: dataPoints,
                borderColor: defaultColors[player.id] ? defaultColors[player.id] : getRandomColor(),
                spanGaps: true,
                fill: false
            };
        })
        .filter(dataset => dataset !== null);

    // Vẽ Chart.js
    // const ctx = document.getElementById('all-players-chart').getContext('2d');
    chartInstance = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets },
        plugins: {
            legend: { position: 'bottom' },
            title: { display: true, text: 'Điểm tích lũy theo ngày của tất cả người chơi' }
        },
        options: {
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true },
                x: { ticks: { maxTicksLimit: 10 } }
            }
        }
    });
}

// renderAllPlayersChart();

// Tính toán ======================================
let playersData1 = [];
function initPlayersData() {
    // Reset mảng playersData
    playersData1.length = 0;

    // Lọc và gán id + name
    poolData.players
        .filter(p => p.name !== "Chấm" && !p.name.includes("Khách"))
        .forEach(p => {
            playersData1.push({
                id: p.id,
                name: p.name
            });
        });
}



function updatePlayersElo(playersData, history_point) {
    // Tính tổng điểm của từng playerId từ history_point
    let eloMap = {};
    history_point.forEach(record => {
        if (!eloMap[record.playerId]) {
            eloMap[record.playerId] = 0;
        }
        eloMap[record.playerId] += record.point;
    });

    // Gán elo vào playersData
    playersData.forEach(p => {
        p.elo = eloMap[p.id] || 0;  // nếu không có trong history_point thì elo = 0
    });
}

// console.log(playersData);

function updatePlayersMatches(playersData, poolData) {
    // Hàm helper để lấy danh sách ID người chơi từ teamId
    function getPlayerIds(teamId) {
        const teamIdStr = String(teamId);
        if (teamIdStr.length === 8) {
            // Trận đôi: tách thành 2 phần 4 ký tự
            const part1 = teamIdStr.substring(0, 4);
            const part2 = teamIdStr.substring(4, 8);
            return [String(parseInt(part1) - 1000), String(parseInt(part2) - 1000)];
        }
        // Trận đơn: trả về ID đơn
        return [teamIdStr];
    }

    playersData.forEach(player => {
        const playerId = player.id;

        let totalMatches = 0;
        let wins = 0;

        poolData.matchHistory.forEach(m => {
            const team1Ids = getPlayerIds(m.player1Id);
            const team2Ids = getPlayerIds(m.player2Id);
            const isPlayerInMatch = team1Ids.includes(String(playerId)) || team2Ids.includes(String(playerId));
            if (!isPlayerInMatch) return;

            const opponentTeamIds = team1Ids.includes(String(playerId)) ? team2Ids : team1Ids;
            const opponentNames = opponentTeamIds.map(id => poolData.players.find(p => p.id == id)?.name || 'Unknown');
            if (opponentNames.includes('Chấm')) return;

            totalMatches++;
            if ((team1Ids.includes(String(playerId)) && m.winnerId == m.player1Id) ||
                (team2Ids.includes(String(playerId)) && m.winnerId == m.player2Id)) {
                wins++;
            }
        });

        player.matches = totalMatches;
        player.winMatches = wins;
    });
}

function updatePlayersRacks(playersData, poolData) {
    playersData.forEach(player => {
        const playerId = player.id;
        let totalRacks = 0;
        let wonRacks = 0;

        poolData.matchHistory.forEach(m => {
            // Lấy team1
            const team1Ids = String(m.player1Id).length === 8
                ? [
                    String(parseInt(m.player1Id.substring(0, 4)) - 1000),
                    String(parseInt(m.player1Id.substring(4, 8)) - 1000)
                ]
                : [String(m.player1Id)];

            // Lấy team2
            const team2Ids = String(m.player2Id).length === 8
                ? [
                    String(parseInt(m.player2Id.substring(0, 4)) - 1000),
                    String(parseInt(m.player2Id.substring(4, 8)) - 1000)
                ]
                : [String(m.player2Id)];

            // Player có trong trận không?
            const isPlayerInMatch = team1Ids.includes(String(playerId)) || team2Ids.includes(String(playerId));
            if (!isPlayerInMatch) return;

            // Đối thủ có phải "Chấm" không?
            const opponentTeamIds = team1Ids.includes(String(playerId)) ? team2Ids : team1Ids;
            const opponentNames = opponentTeamIds.map(
                id => poolData.players.find(p => p.id == id)?.name || 'Unknown'
            );
            if (opponentNames.includes('Chấm')) return;

            // Tính tổng số racks trận này
            const racksThisMatch = (m.score1 || 0) + (m.score2 || 0);
            totalRacks += racksThisMatch;

            // Cộng số racks thắng cho player
            if (team1Ids.includes(String(playerId))) {
                wonRacks += (m.score1 || 0);
            } else {
                wonRacks += (m.score2 || 0);
            }
        });

        player.racks = totalRacks;
        player.winRacks = wonRacks;
    });
}


function updatePlayersTournamentStats(playersData, poolData) {
    playersData.forEach(player => {
        let attends = 0;
        let finals = 0;
        let champions = 0;

        poolData.tournaments.filter(t => t.tournamentId > 0 && t.tournamentId < 1000).forEach(t => {
            // Bỏ qua giải có tên chứa "Đền"
            if (t.name.includes("Đền")) return;

            // Nếu player có tham dự
            if (t.players.includes(player.id)) {
                attends++;

                // Nếu vào chung kết
                if (t.top1Id === player.id || t.top2Id === player.id) {
                    finals++;
                }

                // Nếu vô địch
                if (t.top1Id === player.id) {
                    champions++;
                }
            }
        });

        player.attends = attends;
        player.finals = finals;
        player.champions = champions;
    });
}

function updatePlayersSoCham(playersData, poolData) {
    // Helper: lấy danh sách playerIds từ teamId
    function getPlayerIds(teamId) {
        const teamIdStr = String(teamId);
        if (teamIdStr.length === 8) {
            // Trận đôi: tách thành 2 phần 4 ký tự
            const part1 = teamIdStr.substring(0, 4);
            const part2 = teamIdStr.substring(4, 8);
            return [String(parseInt(part1) - 1000), String(parseInt(part2) - 1000)];
        }
        return [teamIdStr]; // Trận đơn
    }

    playersData.forEach(player => {
        let ChamDon = 0;
        let ChamDoi = 0;

        poolData.matchHistory.forEach(m => {
            const team1Ids = getPlayerIds(m.player1Id);
            const team2Ids = getPlayerIds(m.player2Id);

            // Player có trong trận không?
            const isPlayerInMatch =
                team1Ids.includes(String(player.id)) || team2Ids.includes(String(player.id));
            if (!isPlayerInMatch) return;

            // Đội đối thủ
            const opponentTeamIds = team1Ids.includes(String(player.id)) ? team2Ids : team1Ids;
            const opponentNames = opponentTeamIds.map(
                id => poolData.players.find(p => p.id == id)?.name || "Unknown"
            );

            // Có "Chấm" không?
            if (opponentNames.includes("Chấm")) {
                // Nếu là trận đôi
                if (m.matchType === "doubles" || String(m.player1Id).length === 8 || String(m.player2Id).length === 8) {
                    ChamDoi++;
                } else {
                    ChamDon++;
                }
            }
        });

        player.soCham = ChamDon + ChamDoi;
    });
}
// console.log(poolData.players);

// initPlayersData();
// updatePlayersElo(playersData1, poolData.history_point);
// updatePlayersMatches(
//     playersData1,
//     { matchHistory: poolData.matchHistory, players: poolData.players }
// );
// updatePlayersRacks(playersData1, { matchHistory: poolData.matchHistory, players: poolData.players });
// updatePlayersTournamentStats(playersData1, { tournaments: poolData.tournaments });
// updatePlayersSoCham(playersData1, { matchHistory: poolData.matchHistory, players: poolData.players });


// console.log(playersData1);

//Showw ==================================


let playersData = [];
function filterQualifiedPlayers(playersData1) {
    playersData = playersData1.filter(p => p.racks >= 30 && p.matches >= 5);
}

// Gọi hàm
filterQualifiedPlayers(playersData1);
// console.log(playersData);

function getSlides(playersData) {
    const topElo = [...playersData].sort((a, b) => b.elo - a.elo)[0];
    const topMatches = [...playersData].sort((a, b) => b.matches - a.matches)[0];
    const topRacks = [...playersData].sort((a, b) => b.racks - a.racks)[0];
    const topRackRate = [...playersData].sort((a, b) => (b.winRacks / b.racks) - (a.winRacks / a.racks))[0];
    const topFinals = [...playersData].sort((a, b) => (b.finals / b.attends) - (a.finals / a.attends))[0];
    const topChampions = [...playersData].sort((a, b) => b.champions - a.champions)[0];
    const topSoCham = [...playersData].filter(p => p.soCham > 0).sort((a, b) => b.soCham - a.soCham)[0];
    // console.log(2);

    return [
        {
            kicker: "Người có Elo cao nhất",
            title: topElo.name,
            detail: `${topElo.elo} điểm Elo`,
            value: topElo.elo,
            unit: "Elo",
            icon: "⭐"
        },
        {
            kicker: "Người đấu nhiều trận nhất",
            title: topMatches.name,
            detail: `${topMatches.matches} trận • ${topMatches.winMatches} thắng (${Math.round(topMatches.winMatches / topMatches.matches * 100)}%)`,
            value: topMatches.matches,
            unit: "trận",
            icon: "🎯"
        },
        {
            kicker: "Người đấu nhiều racks nhất",
            title: topRacks.name,
            detail: `${topRacks.racks} racks`,
            value: topRacks.racks,
            unit: "racks",
            icon: "🎱"
        },
        {
            kicker: "Người có tỉ lệ thắng rack cao nhất",
            title: topRackRate.name,
            detail: `${topRackRate.winRacks} / ${topRackRate.racks} (${(topRackRate.winRacks / topRackRate.racks * 100).toFixed(2)}%)`,
            value: (topRackRate.winRacks / topRackRate.racks * 100).toFixed(2),
            unit: "%",
            icon: "🔥"
        },
        {
            kicker: "Người có tỉ lệ vào chung kết nhiều nhất",
            title: topFinals.name,
            detail: `${topFinals.finals}/${topFinals.attends} giải (${(topFinals.finals / topFinals.attends * 100).toFixed(1)}%)`,
            value: (topFinals.finals / topFinals.attends * 100).toFixed(1),
            unit: "%",
            icon: "🏁"
        },
        {
            kicker: "Người vô địch nhiều nhất",
            title: topChampions.name,
            detail: `${topChampions.champions} lần vô địch`,
            value: topChampions.champions,
            unit: "🏆",
            icon: "🏆"
        },
        ...(topSoCham ? [{
            kicker: "Người đi chấm nhiều nhất",
            title: topSoCham.name,
            detail: `${topSoCham.soCham} lần chấm`,
            value: topSoCham.soCham,
            unit: "lần",
            icon: "📝"
        }] : [])
    ];
}

// if (playersData.length == 0) {
//     initializePoolData().then(() => {
//         location.reload();
//     })
// }
// const stats = getSlides(playersData);
// console.log(stats);

// ===== SLIDESHOW =====
let stage, skipBtn;        // <- khai báo ở đầu file
let autoPlay = null;
let index = 0;
let stats = [];
let chartInstance = null;
const SLIDE_DURATION = 4000;
// let autoPlay;

function countUp(element, toValue, unit) {
    if (toValue === null || isNaN(toValue)) return;
    let current = 0;
    const step = toValue / 40;
    const timer = setInterval(() => {
        current += step;
        if (current >= toValue) {
            current = toValue;
            clearInterval(timer);
        }
        element.textContent = Math.round(current) + " " + unit;
    }, 50);
}

function renderSlide(i) {

    const s = stats[i];
    stage.classList.remove("fade-in");
    stage.classList.add("fade-out");
    setTimeout(() => {
        stage.innerHTML = `
      <div class="fade-in">
        <div class="text-blue-800 uppercase tracking-widest text-sm mb-2">${s.icon} ${s.kicker}</div>
        <div class="text-4xl md:text-6xl font-extrabold mb-3">
          ${s.value !== null ? `<span id="count">0</span>` : s.title}
        </div>
        ${s.value !== null ? `<div class="text-xl font-semibold">${s.title}</div>` : ""}
        <div class="text-gray-600 mt-2">${s.detail}</div>
      </div>
    `;
        if (s.value !== null) {

            countUp(document.getElementById("count"), s.value, s.unit);
        }
        stage.classList.remove("fade-out");
        stage.classList.add("fade-in");
    }, 300);
}

function next() {
    if (!stage || !stats || stats.length === 0) {
        renderResults();
        return;
    }
    if (index < stats.length) {
        renderSlide(index);
        index++;
    } else {
        if (autoPlay) { clearInterval(autoPlay); autoPlay = null; }
        renderResults();
    }
}
function renderResults() {
    // Xóa slideshow + skip button
    document.getElementById("slideshow").remove();
    document.getElementById("skip-btn").remove();
    document.getElementById("header").classList.remove("hidden-important");

    document.getElementById("chart").classList.remove("hidden");
    renderAllPlayersChart();
    const container = document.getElementById("main-wrap");
    container.className = "container mx-auto py-8 space-y-6";
    // Bảng 1: Elo
    let table1 = [...playersData]
        .filter(p => p.elo > 0) // bỏ những ai elo = 0
        .sort((a, b) => b.elo - a.elo)
        .slice(0, 5);

    // Bảng 2: Racks
    let table2 = [...playersData]
        .filter(p => p.racks > 0)
        .sort((a, b) => b.racks - a.racks)
        .slice(0, 5);

    // Bảng 3: Tỉ lệ thắng rack
    let table3 = [...playersData]
        .filter(p => p.racks > 0 && p.winRacks > 0) // tránh chia 0
        .sort((a, b) => (b.winRacks / b.racks) - (a.winRacks / a.racks))
        .slice(0, 5);

    // Bảng 4: Thành tích giải
    let table4 = [...playersData]
        .filter(p => p.attends > 0 && p.finals > 0)
        .sort((a, b) => (b.finals / b.attends) - (a.finals / a.attends))
        .slice(0, 5);

    // Bảng 5: Điểm (số chấm)
    let table5 = [...playersData]
        .filter(p => p.soCham > 0)
        .sort((a, b) => b.soCham - a.soCham)
        .slice(0, 5);

    container.innerHTML = `
    <div class="bg-white p-4 rounded shadow mb-6">
        <p>Một số bảng tổng kết <br>
        (Chỉ tính players có match > 4 và racks >30 )</p>
    </div>
    <!-- Bảng 1 -->
    <div class="bg-white p-4 rounded shadow mb-6">
      <h2 class="text-xl font-bold text-blue-900 mb-2">Top 5 players Elo cao nhất</h2>
      <table class="w-full border text-sm">
        <thead class="bg-blue-800 text-white">
          <tr>
            <th class="p-2 text-left">#</th>
            <th class="p-2 text-left">Player</th>
            <th class="p-2 text-left">Elo</th>
            <th class="p-2 text-left">Số trận</th>
            <th class="p-2 text-left">Tỉ lệ thắng</th>
          </tr>
        </thead>
        <tbody>
          ${table1.map((p, i) => `
            <tr class="border-b">
              <td class="p-2">${i + 1}</td>
              <td class="p-2">${p.name}</td>
              <td class="p-2">${p.elo}</td>
              <td class="p-2">${p.matches}</td>
              <td class="p-2">${Math.round(p.winMatches)} / ${p.matches} (${(p.winMatches / p.matches * 100).toFixed(2)}%)</td>
            </tr>`).join("")}
        </tbody>
      </table>
    </div>

    <!-- Bảng 2 -->
    <div class="bg-white p-4 rounded shadow mb-6">
      <h2 class="text-xl font-bold text-blue-900 mb-2">Top 5 players chơi nhiều racks nhất</h2>
      <table class="w-full border text-sm">
        <thead class="bg-blue-800 text-white">
          <tr>
            <th class="p-2 text-left">#</th>
            <th class="p-2 text-left">Player</th>
            <th class="p-2 text-left">Số racks</th>
            <th class="p-2 text-left">Tỉ lệ thắng</th>
          </tr>
        </thead>
        <tbody>
          ${table2.map((p, i) => `
            <tr class="border-b">
              <td class="p-2">${i + 1}</td>
              <td class="p-2">${p.name}</td>
              <td class="p-2">${p.racks}</td>
              <td class="p-2">${Math.round(p.winRacks / p.racks * 100)}%</td>
            </tr>`).join("")}
        </tbody>
      </table>
    </div>

    <!-- Bảng 3 -->
    <div class="bg-white p-4 rounded shadow mb-6">
      <h2 class="text-xl font-bold text-blue-900 mb-2">Top 5 players có tỉ lệ thắng / rack cao nhất</h2>
      <table class="w-full border text-sm">
        <thead class="bg-blue-800 text-white">
          <tr>
            <th class="p-2 text-left">#</th>
            <th class="p-2 text-left">Player</th>
            <th class="p-2 text-left">Tỉ lệ thắng theo racks</th>
          </tr>
        </thead>
        <tbody>
          ${table3.map((p, i) => `
            <tr class="border-b">
              <td class="p-2">${i + 1}</td>
              <td class="p-2">${p.name}</td>
              <td class="p-2">${Math.round(p.winRacks)} / ${p.racks} (${(p.winRacks / p.racks * 100).toFixed(2)}%)</td>
            </tr>`).join("")}
        </tbody>
      </table>
    </div>

    <!-- Bảng 4 -->
    <div class="bg-white p-4 rounded shadow mb-6">
      <h2 class="text-xl font-bold text-blue-900 mb-2">Top 5 players có tỉ lệ vào chung kết nhiều nhất</h2>
      <table class="w-full border text-sm">
        <thead class="bg-blue-800 text-white">
          <tr>
            <th class="p-2 text-left">#</th>
            <th class="p-2 text-left">Player</th>
            <th class="p-2 text-left">Số lần tham dự</th>
            <th class="p-2 text-left">Số lần vào top</th>
            <th class="p-2 text-left">Tỉ lệ vào top</th>
            <th class="p-2 text-left">Vô địch</th>
          </tr>
        </thead>
        <tbody>
          ${table4.map((p, i) => `
            <tr class="border-b">
              <td class="p-2">${i + 1}</td>
              <td class="p-2">${p.name}</td>
              <td class="p-2">${p.attends}</td>
              <td class="p-2">${p.finals}</td>
              <td class="p-2">${((p.finals / p.attends) * 100).toFixed(1)}%</td>
              <td class="p-2">${p.champions}</td>
            </tr>`).join("")}
        </tbody>
      </table>
    </div>

    <!-- Bảng 5 -->
    <div class="bg-white p-4 rounded shadow mb-6">
      <h2 class="text-xl font-bold text-blue-900 mb-2">Top 5 players đi chấm nhiều nhất</h2>
      <table class="w-full border text-sm">
        <thead class="bg-blue-800 text-white">
          <tr>
            <th class="p-2 text-left">#</th>
            <th class="p-2 text-left">Player</th>
            <th class="p-2 text-left">Số chấm</th>
          </tr>
        </thead>
        <tbody>
        ${table5.length == 0 ?
            `<tr class="border-b">
              <td class="p-2 font-bold">Chưa ai đi chấm</td>
            </tr>`
            : `${table5.map((p, i) => `
            <tr class="border-b">
              <td class="p-2">${i + 1}</td>
              <td class="p-2">${p.name}</td>
              <td class="p-2">${p.soCham}</td>
            </tr>`).join("")}`
        }
          
        </tbody>
      </table>
    </div>
  `;
}

async function startAutoPlay() {

    document.getElementById("header").classList.add("hidden-important");
    next();
    autoPlay = setInterval(next, SLIDE_DURATION);
}

// skipBtn.addEventListener("click", () => {
//     clearInterval(autoPlay);
//     renderResults();
// });
export function render() {
    document.getElementById("header").classList.add("hidden-important");
    // 1) Chuẩn bị lại dữ liệu MỖI LẦN page được render
    playersData1.length = 0;            // reset
    initPlayersData();
    updatePlayersElo(playersData1, poolData.history_point);
    updatePlayersMatches(playersData1, { matchHistory: poolData.matchHistory, players: poolData.players });
    updatePlayersRacks(playersData1, { matchHistory: poolData.matchHistory, players: poolData.players });
    updatePlayersTournamentStats(playersData1, { tournaments: poolData.tournaments });
    updatePlayersSoCham(playersData1, { matchHistory: poolData.matchHistory, players: poolData.players });

    playersData = [];                   // reset mảng lọc
    filterQualifiedPlayers(playersData1);
    stats = getSlides(playersData);     // gán vào biến module-scope

    // 2) Lấy lại DOM refs SAU khi HTML page đã được inject
    stage = document.getElementById("stage");
    skipBtn = document.getElementById("skip-btn");

    // Tránh bind trùng: gán handler mỗi lần render bằng onclick
    if (skipBtn) {
        skipBtn.onclick = () => {
            if (autoPlay) { clearInterval(autoPlay); autoPlay = null; }
            renderResults();               // bỏ slideshow, show bảng + chart
        };
    }

    // 3) Quyết định hiển thị: nếu có slideshow thì chạy, không thì render kết quả luôn
    const headerEl = document.getElementById("header");
    const hasSlideShow = !!document.getElementById("slideshow");

    if (hasSlideShow) {
        headerEl?.classList.add("hidden");
        index = 0;                       // reset vòng chiếu
        if (autoPlay) { clearInterval(autoPlay); autoPlay = null; }
        next();                          // chiếu slide đầu
        autoPlay = setInterval(next, SLIDE_DURATION);
    } else {
        headerEl?.classList.remove("hidden");
        renderResults();
    }
}
// renderAllPlayersChart();
// startAutoPlay();
