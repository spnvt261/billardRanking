import { poolData, createData, updateData, checkAdminAccess } from "../../data.js"; // nhớ export từ data.js
// Hàm parse date VN (DD/MM/YYYY) thành Date object
function parseDateVN(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') {
        console.warn('Invalid date:', dateStr); // Log để debug
        return new Date(0); // Trả về date cũ nhất (1970-01-01) để sort đẩy xuống cuối
    }
    const parts = dateStr.split('/');
    if (parts.length !== 3) {
        console.warn('Invalid date format:', dateStr);
        return new Date(0);
    }
    const [day, month, year] = parts.map(Number);
    if (isNaN(day) || isNaN(month) || isNaN(year)) {
        console.warn('Invalid date numbers:', dateStr);
        return new Date(0);
    }
    return new Date(year, month - 1, day);
}
// Chuyển "30/7/2025" thành đối tượng Date
function parseVNDate(str) {
    let [day, month, year] = str.split('/').map(Number);
    return new Date(year, month - 1, day); // month - 1 vì JS đếm tháng từ 0
}

// Lấy playerId từ URL

let playerId;

function initData(data) {
    playerId = data.id;
}
// console.log(playerId);

function loadCountMatch() {
    // Tính tỉ lệ thắng trận (không tính trận với "Chấm")
    let totalMatches = 0, wins = 0;
    let totalSingles = 0, winsSingles = 0;
    let totalDoubles = 0, winsDoubles = 0;

    poolData.matchHistory.forEach(m => {
        function getPlayerIds(teamId) {
            const teamIdStr = String(teamId);
            if (teamIdStr.length === 8) {
                const part1 = teamIdStr.substring(0, 4);
                const part2 = teamIdStr.substring(4, 8);
                return [String(parseInt(part1) - 1000), String(parseInt(part2) - 1000)];
            }
            return [teamIdStr];
        }

        const team1Ids = getPlayerIds(m.player1Id);
        const team2Ids = getPlayerIds(m.player2Id);
        const isPlayerInMatch = team1Ids.includes(String(playerId)) || team2Ids.includes(String(playerId));
        if (!isPlayerInMatch) return;

        const opponentTeamIds = team1Ids.includes(String(playerId)) ? team2Ids : team1Ids;
        const opponentNames = opponentTeamIds.map(id => poolData.players.find(p => p.id == id)?.name || 'Unknown');
        if (opponentNames.includes('Chấm')) return;

        totalMatches++;

        const isWin = (team1Ids.includes(String(playerId)) && m.winnerId == m.player1Id) ||
            (team2Ids.includes(String(playerId)) && m.winnerId == m.player2Id);

        if (team1Ids.length === 1 && team2Ids.length === 1) {
            // Trận đơn
            totalSingles++;
            if (isWin) winsSingles++;
        } else {
            // Trận đôi
            totalDoubles++;
            if (isWin) winsDoubles++;
        }

        if (isWin) wins++;
    });
    const matchWinRate = totalMatches > 0 ? ((wins / totalMatches) * 100).toFixed(1) + "%" : "0%";
    const singlesWinRate = totalSingles > 0 ? ((winsSingles / totalSingles) * 100).toFixed(1) + "%" : "0%";
    const doublesWinRate = totalDoubles > 0 ? ((winsDoubles / totalDoubles) * 100).toFixed(1) + "%" : "0%";
    document.getElementById('player-winrate').textContent = `${wins}/${totalMatches} (${matchWinRate})`;
    document.getElementById('player-singles-count').textContent = `${totalSingles}`;
    document.getElementById('player-doubles-count').textContent = `${totalDoubles}`;
    document.getElementById('player-singles-winrate').textContent = `${winsSingles}/${totalSingles} (${singlesWinRate})`;
    document.getElementById('player-doubles-winrate').textContent = `${winsDoubles}/${totalDoubles} (${doublesWinRate})`;
}

function loadCountRack() {
    // Tính số rack
    let totalRacks = 0, wonRacks = 0;
    let totalRacksSingles = 0, wonRacksSingles = 0;
    let totalRacksDoubles = 0, wonRacksDoubles = 0;

    poolData.matchHistory.forEach(m => {
        const team1Ids = String(m.player1Id).length === 8
            ? [String(parseInt(m.player1Id.substring(0, 4)) - 1000), String(parseInt(m.player1Id.substring(4, 8)) - 1000)]
            : [String(m.player1Id)];

        const team2Ids = String(m.player2Id).length === 8
            ? [String(parseInt(m.player2Id.substring(0, 4)) - 1000), String(parseInt(m.player2Id.substring(4, 8)) - 1000)]
            : [String(m.player2Id)];

        const isPlayerInMatch = team1Ids.includes(String(playerId)) || team2Ids.includes(String(playerId));
        if (!isPlayerInMatch) return;

        const opponentTeamIds = team1Ids.includes(String(playerId)) ? team2Ids : team1Ids;
        const opponentNames = opponentTeamIds.map(id => poolData.players.find(p => p.id == id)?.name || 'Unknown');
        if (opponentNames.includes('Chấm')) return;

        const racksThisMatch = (m.score1 || 0) + (m.score2 || 0);
        totalRacks += racksThisMatch;

        let wonThisMatch = 0;
        if (team1Ids.includes(String(playerId))) {
            wonThisMatch = (m.score1 || 0);
            wonRacks += wonThisMatch;
        } else {
            wonThisMatch = (m.score2 || 0);
            wonRacks += wonThisMatch;
        }

        if (team1Ids.length === 1 && team2Ids.length === 1) {
            // Rack đơn
            totalRacksSingles += racksThisMatch;
            wonRacksSingles += wonThisMatch;
        } else {
            // Rack đôi
            totalRacksDoubles += racksThisMatch;
            wonRacksDoubles += wonThisMatch;
        }
    });

    const rackWinRate = totalRacks > 0 ? ((wonRacks / totalRacks) * 100).toFixed(1) + "%" : "0%";
    const rackWinRateSingles = totalRacksSingles > 0 ? ((wonRacksSingles / totalRacksSingles) * 100).toFixed(1) + "%" : "0%";
    const rackWinRateDoubles = totalRacksDoubles > 0 ? ((wonRacksDoubles / totalRacksDoubles) * 100).toFixed(1) + "%" : "0%";

    document.getElementById('player-racks-count').textContent = `${totalRacks}`;
    document.getElementById('player-racks-winrate').textContent = `${wonRacks}/${totalRacks} (${rackWinRate})`;
    document.getElementById('player-racks-singles-count').textContent = `${totalRacksSingles}`;
    document.getElementById('player-racks-doubles-count').textContent = `${totalRacksDoubles}`;
    document.getElementById('player-racks-singles-winrate').textContent = `${wonRacksSingles}/${totalRacksSingles} (${rackWinRateSingles})`;
    document.getElementById('player-racks-doubles-winrate').textContent = `${wonRacksDoubles}/${totalRacksDoubles} (${rackWinRateDoubles})`;
}


// Render trang sau khi data loaded
async function renderPlayerDetails() {
    // await initializePoolData(); // Từ data.js
    // console.log(1);

    const player = poolData.players.find(p => p.id == playerId);
    if (!player) {
        // alert('Player not found.1');
        // document.getElementById('loading').innerHTML('Player không tồn tại');
        // window.location.href = 'rankings.html';
        return;
    }

    // Hiển thị info cơ bản
    document.getElementById('player-avatar').src = player.images || 'https://cdn-icons-png.freepik.com/512/8428/8428718.png'; // Default nếu không có
    document.getElementById('player-name').textContent = player.name;
    document.getElementById('player-points').textContent = player.points;

    // 1. Hàm tính tổng điểm (Elo) từ history_point
    function getCurrentPoints(pid) {
        return poolData.history_point
            .filter(h => h.playerId == pid)
            .reduce((sum, h) => sum + (h.point || 0), 0);
    }

    // 2. Tạo mảng player hợp lệ (không tính Chấm và Khách)
    const validPlayers = poolData.players
        .filter(p => p.name !== "Chấm" && !p.name.includes("(Khách)"))
        .map(p => ({
            id: p.id,
            name: p.name,
            points: getCurrentPoints(p.id)
        }));

    // 3. Sắp xếp giảm dần theo Elo
    validPlayers.sort((a, b) => b.points - a.points);

    // 4. Nếu là khách thì hiện #Khách, ngược lại tính rank
    let rankText = "";
    if (player.name.includes("(Khách)")) {
        rankText = "#Khách";
    } else if (player.name === "Chấm") {
        rankText = "-"; // hoặc bỏ trống nếu muốn
    } else {
        const rank = validPlayers.findIndex(p => p.id == playerId) + 1;
        rankText = `#${rank}`;
    }
    document.getElementById('player-rank').textContent = rankText;

    // Tính số trận đối đầu với "Chấm" (trận đơn và trận đôi)
    function calculateMatchesAgainstCham(playerId) {
        let ChamDon = 0; // Số trận đơn đối đầu với "Chấm"
        let ChamDoi = 0; // Số trận đôi đối đầu với "Chấm"

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

        poolData.matchHistory.forEach(m => {
            // Lấy danh sách ID người chơi từ cả hai đội
            const team1Ids = getPlayerIds(m.player1Id);
            const team2Ids = getPlayerIds(m.player2Id);

            // Kiểm tra playerId có trong trận
            const isPlayerInMatch = team1Ids.includes(String(playerId)) || team2Ids.includes(String(playerId));
            if (!isPlayerInMatch) return;

            // Xác định đội đối thủ
            const opponentTeamIds = team1Ids.includes(String(playerId)) ? team2Ids : team1Ids;

            // Kiểm tra xem đối thủ có "Chấm" hay không
            const opponentNames = opponentTeamIds.map(id => poolData.players.find(p => p.id == id)?.name || 'Unknown');
            const hasCham = opponentNames.includes('Chấm');

            if (hasCham) {
                // Phân loại trận đơn hay đôi
                if (m.matchType === 'doubles' || String(m.player1Id).length === 8 || String(m.player2Id).length === 8) {
                    ChamDoi++;
                } else {
                    ChamDon++;
                }
            }
        });

        return { ChamDon, ChamDoi };
    }

    // Cách sử dụng: 
    const { ChamDon, ChamDoi } = calculateMatchesAgainstCham(playerId);
    // console.log(`Số trận đơn đối đầu với Chấm: ${ChamDon}`);
    // console.log(`Số trận đôi đối đầu với Chấm: ${ChamDoi}`);

    // Tính số trận
    // const matchesCountAll = poolData.matchHistory.filter(m => m.player1Id == playerId || m.player2Id == playerId).length;
    // Tính số trận, bao gồm cả trận đôi và loại bỏ trận với "Chấm"
    const matchesCount = poolData.matchHistory.filter(m => {
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

        // Lấy danh sách ID người chơi từ cả hai đội
        const team1Ids = getPlayerIds(m.player1Id);
        const team2Ids = getPlayerIds(m.player2Id);

        // Kiểm tra playerId có trong trận
        const isPlayerInMatch = team1Ids.includes(String(playerId)) || team2Ids.includes(String(playerId));
        if (!isPlayerInMatch) return false;

        // Xác định opponent team
        const opponentTeamIds = team1Ids.includes(String(playerId)) ? team2Ids : team1Ids;

        // Loại bỏ nếu opponent là "Chấm"
        const opponentNames = opponentTeamIds.map(id => poolData.players.find(p => p.id == id)?.name || 'Unknown');
        return !opponentNames.includes('Chấm');
    }).length;

    document.getElementById('player-matches-count').textContent = matchesCount;
    document.getElementById('cham-don').textContent = ChamDon;
    document.getElementById('cham-doi').textContent = ChamDoi;

    // Hiển thị giải thưởng
    const achievements = [];
    poolData.tournaments.forEach(t => {
        if (t.name == "Đền") {
            return;
        }
        if (t.top1Id == playerId) {
            achievements.push({ type: 'Vô địch', name: t.name, date: t.date });
        } else if (t.top2Id == playerId) {
            achievements.push({ type: 'Á quân', name: t.name, date: t.date });
        }
    });
    // Sort: Vô địch trước, rồi á quân, theo date desc
    achievements.sort((a, b) => {
        if (a.type === 'Vô địch' && b.type !== 'Vô địch') return -1;
        if (a.type !== 'Vô địch' && b.type === 'Vô địch') return 1;
        return parseDateVN(b.date) - parseDateVN(a.date);
    });
    const achievementsList = document.getElementById('achievements-list');
    achievements.forEach(ach => {
        const li = document.createElement('li');
        li.textContent = `${ach.type} - ${ach.name} (${ach.date})`;
        achievementsList.appendChild(li);
    });
    if (achievements.length === 0) {
        achievementsList.innerHTML = '<li>Chưa có giải thưởng</li>';
    }

    //Hiển thị giải đền
    const achievementsDen = [];
    poolData.tournaments.forEach(t => {
        if (t.name != "Đền") {
            return;
        }
        let type = ""
        if (t.top1Id == playerId) {
            // achievementsDen.push({ type: 'Top1', name: t.name, date: t.date });
            type = "Top1";
        } else if (t.top2Id == playerId) {
            // achievementsDen.push({ type: 'Top2', name: t.name, date: t.date });
            type = "Top2";
        }
        if (type == "") {
            return;
        }
        const participantsNames = t.players.map(id => poolData.players.find(p => p.id == id)?.name || 'Unknown').join(', ');
        achievementsDen.push({ type, name: t.name, date: t.date, participants: participantsNames });

    });
    // console.log(achievementsDen);

    // Sort: Top1 trước, rồi Top2, theo date desc
    achievementsDen.sort((a, b) => {
        if (a.type === 'Top1' && b.type !== 'Top2') return -1;
        if (a.type !== 'Top1' && b.type === 'Top2') return 1;
        return parseDateVN(b.date) - parseDateVN(a.date);
    });
    const achievementsDenList = document.getElementById('achievements-den-list');
    achievementsDen.forEach(ach => {
        const li = document.createElement('li');
        li.textContent = `${ach.type} ( mâm ${ach.participants} ) - ${ach.date}`;
        achievementsDenList.appendChild(li);
    });
    if (achievementsDen.length === 0) {
        achievementsDenList.innerHTML = '<li>Chưa có giải thưởng</li>';
    }

    // Hiển thị list trận đấu với pagination
    renderPlayerMatches(1);

    // Vẽ biểu đồ points history
    renderPointsChart();

    // Hiển thị sections
    document.getElementById('player-info').classList.remove('hidden');
    document.getElementById('matches-section').classList.remove('hidden');
    document.getElementById('points-chart-section').classList.remove('hidden');
}

// Render list trận đấu
function renderPlayerMatches(page = 1) {
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

    // Hàm helper để lấy tên hiển thị từ teamId
    function getPlayerDisplay(teamId) {
        const teamIdStr = String(teamId);
        if (teamIdStr.length === 8) {
            // Trận đôi: tách thành 2 phần 4 ký tự
            const part1 = teamIdStr.substring(0, 4);
            const part2 = teamIdStr.substring(4, 8);
            const id1 = parseInt(part1) - 1000;
            const id2 = parseInt(part2) - 1000;
            const name1 = poolData.players.find(u => u.id == id1)?.name || 'Unknown';
            const name2 = poolData.players.find(u => u.id == id2)?.name || 'Unknown';
            return `${name1} & ${name2}`;
        } else {
            // Trận đơn
            return poolData.players.find(u => u.id == teamId)?.name || 'Unknown';
        }
    }

    const matches = poolData.matchHistory
        .filter(m => {
            const team1Ids = getPlayerIds(m.player1Id);
            const team2Ids = getPlayerIds(m.player2Id);

            // Kiểm tra playerId có trong trận
            return team1Ids.includes(String(playerId)) || team2Ids.includes(String(playerId));
        })
        .sort((a, b) => parseInt(b.id) - parseInt(a.id));


    const matchesPerPage = 5;
    const totalPages = Math.ceil(matches.length / matchesPerPage);
    const startIndex = (page - 1) * matchesPerPage;
    const paginatedMatches = matches.slice(startIndex, startIndex + matchesPerPage);

    const tableBody = document.getElementById('player-matches-table');
    tableBody.innerHTML = '';
    paginatedMatches.forEach(match => {
        const team1Ids = getPlayerIds(match.player1Id);
        const team2Ids = getPlayerIds(match.player2Id);
        const player1Display = getPlayerDisplay(match.player1Id);
        const player2Display = getPlayerDisplay(match.player2Id);
        const player1Class = match.winnerId == match.player1Id ? 'text-green-600' : 'text-red-600';
        const player2Class = match.winnerId == match.player2Id ? 'text-green-600' : 'text-red-600';
        const tournament = poolData.tournaments.find(t => t.id == match.tournamentId);
        const tournamentCell = tournament
            ? `<a href="#/tournament_details?id=${tournament.id}" class="text-blue-400 underline">Giải ${tournament.name} <img src="https://cdn-icons-png.freepik.com/512/16853/16853146.png" alt="Cup" style="width:24px;display:inline-block;margin-left:5px;vertical-align:middle;"></a>`
            : match.tournamentId;
        const row = document.createElement('tr');

        // Kiểm tra xem đối thủ có phải "Chấm"
        const opponentTeamIds = team1Ids.includes(String(playerId)) ? team2Ids : team1Ids;
        const opponentNames = opponentTeamIds.map(id => poolData.players.find(p => p.id == id)?.name || 'Unknown');
        const isChamMatch = opponentNames.includes('Chấm');

        // Kiểm tra thắng/thua
        let isWin = false;
        if (team1Ids.includes(String(playerId)) && match.winnerId == match.player1Id) {
            isWin = true;
        }
        if (team2Ids.includes(String(playerId)) && match.winnerId == match.player2Id) {
            isWin = true;
        }

        // Thêm class màu nền
        if (isChamMatch) {
            row.className = "bg-yellow-100 hover:bg-yellow-200";
        } else {
            row.className = isWin ? "bg-green-100 hover:bg-green-200" : "bg-red-100 hover:bg-red-200";
        }
        let matchDisplay = "";

        // Nếu đối thủ là "Chấm"
        if (isChamMatch) {
            if (team1Ids.includes(String(playerId))) {
                matchDisplay = `${player1Display} đi chấm + ${match.score1} elo`;
            } else {
                matchDisplay = `${player2Display} đi chấm + ${match.score2} elo`;
            }
        } else {
            matchDisplay = `<span class="${player1Class}">${player1Display}</span> ${match.score1} - ${match.score2} <span class="${player2Class}">${player2Display}</span>`;
        }

        row.innerHTML = `
                    <td class="p-3">${matchDisplay}</td>
                    <td class="p-3">${match.date}</td>
                    <td class="p-3">${tournamentCell}</td>
                `;
        tableBody.appendChild(row);


    });
    if (paginatedMatches.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="3" class="p-3 text-center">Chưa có trận đấu</td></tr>';
    }

    // Pagination
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';
    for (let i = 1; i <= totalPages; i++) {
        const button = document.createElement('button');
        button.className = `px-3 py-1 rounded ${i === page ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`;
        button.textContent = i;
        button.addEventListener('click', () => renderPlayerMatches(i));
        pagination.appendChild(button);
    }
}


function renderPointsChart() {
    // Lấy lịch sử điểm của player hiện tại
    const playerHistory = poolData.history_point
        .filter(h => h.playerId == playerId && h.date)
        .sort((a, b) => parseDateVN(a.date) - parseDateVN(b.date));

    // Xác định ngày bắt đầu: ngày sớm nhất của player hoặc mặc định
    let startDate = parseVNDate("29/7/2025");
    let endDate = new Date(); // Ngày hiện tại

    const labels = [];
    let currentDate = new Date(startDate); // copy để tránh thay đổi startDate gốc

    while (currentDate <= endDate) {
        labels.push(currentDate.toLocaleDateString('vi-VN'));
        currentDate.setDate(currentDate.getDate() + 1);
    }
    // Tính điểm tích lũy cho mỗi ngày
    let cumulative = 0;
    const data = labels.map(date => {
        const pointsOnDate = playerHistory
            .filter(h => h.date === date)
            .reduce((sum, h) => sum + h.point, 0);
        cumulative += pointsOnDate;
        return cumulative;
    });
    // console.log(currentDate, endDate);


    // Nếu không có dữ liệu để vẽ
    if (playerHistory.length === 0) {
        const ctx = document.getElementById('points-chart').getContext('2d');
        ctx.font = '16px Arial';
        ctx.fillText('Chưa có lịch sử điểm', 10, 50);
        return;
    }
    // Vẽ biểu đồ
    const ctx = document.getElementById('points-chart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `${poolData.players.find(p => p.id == playerId).name}`,
                data: data,
                borderColor: 'blue',
                fill: false
            }]
        },
        options: {
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true },
                x: {
                    ticks: {
                        // Giảm số lượng label trên trục x để tránh chồng chéo
                        maxTicksLimit: 10
                    }
                }
            }
        }
    });
}



export function render({ id }) {
    const player = poolData.players.find(t => t.id == id);
    if (!player) {
        alert('Player not provided.');
        window.location.href = '#/rankings';
    }
    initData(player)

    renderPlayerDetails().catch(error => console.error('Error rendering player details:', error));
    loadCountMatch();
    loadCountRack();
    checkAdminAccess();
}