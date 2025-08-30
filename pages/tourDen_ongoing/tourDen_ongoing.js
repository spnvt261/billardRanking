import { poolData, createData, updateData, checkAdminAccess, addPlayerPoints } from "../../data.js"; // nhớ export từ data.js
export function render({ id }) {
    let history_points_den = poolData.history_points_den;
    // Lấy tournament (demo lấy tournament id=2 - "Đền")
    // Lấy id từ query string
    // const urlParams = getQueryParams();
    // const tournamentId = urlParams.get('id');

    // Tìm tournament theo id
    const tournament = poolData.tournaments.find(t => t.id == id);
    const adminKey = localStorage.getItem("adminKey");
    if (!tournament || tournament.name != "Đền") {
        alert("Sai id tournament");
        window.location.href = "#/tournaments";
    }
    if (tournament.name == "Đền" && tournament.status != "Đang diễn ra") {
        // alert("Sai id tournament");
        window.location.href = `#/tournament_details?id=${tournament.id}`;
    }
    document.getElementById("tournament-title").innerText = tournament.name + " - " + tournament.date;
    // document.getElementById("date-span").textContent = toString(tournament.date);


    // Lấy danh sách player
    let listPlayers = poolData.players.filter(p => tournament.players.includes(p.id));

    const defaultColors = [
        "#FF5733", // Đỏ cam
        "#2ECC71", // Xanh lá cây
        "#9B59B6", // Tím
        "#F1C40F", // Vàng
        "#1ABC9C", // Xanh ngọc
        "#33FF57", // Xanh lá sáng
        "#34495E"  // Xám xanh đậm
    ];

    const btn = document.getElementById('point-config-btn');
    const cfg = document.getElementById('point-config');
    const icon = document.getElementById('point-config-icon');
    const editPoint = document.getElementById('edit-point');

    if (!btn || !cfg) return;

    btn.addEventListener('click', () => {
        const isHidden = cfg.classList.toggle('hidden'); // true nếu ẩn sau toggle
        // Trạng thái aria
        btn.setAttribute('aria-expanded', String(!isHidden));
        cfg.setAttribute('aria-hidden', String(isHidden));

        // Xoay icon khi mở
        if (!isHidden) {
            icon.classList.add('rotate-90');
            // hiển thị phần edit-point khi mở (nếu muốn show luôn)
            editPoint.classList.remove('hidden');
        } else {
            icon.classList.remove('rotate-90');
            // ẩn phần edit-point khi đóng (giữ hành vi ban đầu)
            editPoint.classList.add('hidden');
        }
    });

    // Tắt form lúc load (đảm bảo trạng thái đồng bộ nếu JS chạy sau server-side)
    window.addEventListener('DOMContentLoaded', () => {
        cfg.classList.add('hidden');
        btn.setAttribute('aria-expanded', 'false');
        cfg.setAttribute('aria-hidden', 'true');
        editPoint.classList.add('hidden');
    });

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

    // Config điểm ăn
    let pointConfig = { 3: 1, 6: 2, 9: 3 };

    // Save config
    document.getElementById("save-config").addEventListener("click", () => {
        pointConfig[3] = parseInt(document.getElementById("point-3").value) || 1;
        pointConfig[6] = parseInt(document.getElementById("point-6").value) || 2;
        pointConfig[9] = parseInt(document.getElementById("point-9").value) || 3;

        ["point-3", "point-6", "point-9"].forEach(id => {
            document.getElementById(id).setAttribute("disabled", "disabled");
        });

        document.getElementById("save-config").classList.add("hidden");
        document.getElementById("edit-config").classList.remove("hidden");
        document.getElementById("point-config").classList.add("bg-gray-300");
    });

    //Ban đầu saved config
    ["point-3", "point-6", "point-9"].forEach(id => {
        document.getElementById(id).setAttribute("disabled", "disabled");
    });

    document.getElementById("save-config").classList.add("hidden");
    document.getElementById("edit-config").classList.remove("hidden");
    document.getElementById("point-config").classList.add("bg-gray-300");

    // Edit config (có confirm)
    document.getElementById("edit-config").addEventListener("click", () => {
        if (!confirm("Bạn có chắc chắn muốn chỉnh sửa cấu hình điểm?")) return;

        ["point-3", "point-6", "point-9"].forEach(id => {
            document.getElementById(id).removeAttribute("disabled");
        });

        document.getElementById("save-config").classList.remove("hidden");
        document.getElementById("edit-config").classList.add("hidden");
        document.getElementById("point-config").classList.remove("bg-gray-300");
    });
    let sortOrder = "desc"; // mặc định giảm dần

    function sortScores() {
        const tbody = document.getElementById("score-table");
        const rows = Array.from(tbody.rows);

        // B1: lưu vị trí cũ
        rows.forEach(row => {
            row._oldTop = row.getBoundingClientRect().top;
        });

        // B2: sắp xếp rows dựa vào điểm hiện tại trong scores
        rows.sort((a, b) => {
            const playerA = scores.find(s => s.id === a.dataset.id);
            const playerB = scores.find(s => s.id === b.dataset.id);

            return sortOrder === "asc"
                ? playerA.current - playerB.current
                : playerB.current - playerA.current;
        });

        // B3: reorder DOM theo thứ tự mới
        rows.forEach(row => tbody.appendChild(row));

        // B4: animate dịch chuyển (FLIP)
        rows.forEach(row => {
            const newTop = row.getBoundingClientRect().top;
            const delta = row._oldTop - newTop;

            if (delta) {
                row.style.transition = "none";
                row.style.transform = `translateY(${delta}px)`;

                // force reflow
                row.getBoundingClientRect();

                row.style.transition = "transform 0.5s ease";
                row.style.transform = "translateY(0)";
            }
        });

        // cleanup sau khi animation xong
        setTimeout(() => {
            rows.forEach(row => {
                row.style.transition = "";
                row.style.transform = "";
                delete row._oldTop;
            });
        }, 500);

        // B5: update icon
        const icon = document.getElementById("sort-icon");
        if (icon) {
            icon.textContent = sortOrder === "asc" ? "↑" : "↓";
        }
    }
    document.getElementById("sort-current").addEventListener("click", () => {
        sortOrder = sortOrder === "asc" ? "desc" : "asc";
        sortScores();
    });
    // Render dropdown
    function renderDropdowns() {
        const p1 = document.getElementById("player1");
        const p2 = document.getElementById("player2");
        p1.innerHTML = `<option value="">Player1</option>`;
        p2.innerHTML = `<option value="">Player2</option>`;
        listPlayers.forEach(pl => {
            p1.innerHTML += `<option value="${pl.id}">${pl.name}</option>`;
            p2.innerHTML += `<option value="${pl.id}">${pl.name}</option>`;
        });
    }

    // Render bảng chỉ 1 lần
    function renderTableInitial() {
        const tbody = document.getElementById("score-table");
        tbody.innerHTML = "";

        scores.forEach(s => {
            const row = document.createElement("tr");
            row.dataset.id = s.id;
            row.style.backgroundColor = s.color + "80";

            const tdName = document.createElement("td");
            tdName.className = "p-3";
            tdName.textContent = s.name;

            const tdOld = document.createElement("td");
            tdOld.className = "p-3";
            tdOld.textContent = s.oldPoints;

            const tdMatch = document.createElement("td");
            tdMatch.className = "p-3";
            tdMatch.textContent = s.matchPoints;

            const tdCurrent = document.createElement("td");
            tdCurrent.className = "p-3 font-bold";
            tdCurrent.textContent = s.current;

            row.appendChild(tdName);
            row.appendChild(tdOld);
            row.appendChild(tdMatch);
            row.appendChild(tdCurrent);

            tbody.appendChild(row);

            // lưu reference để update sau này
            s.cells = { tdOld, tdMatch, tdCurrent };
        });
    }

    // Cập nhật giá trị trong ô (không render lại)
    function updateTableValues() {
        scores.forEach(s => {
            if (s.cells.tdOld) s.cells.tdOld.textContent = s.oldPoints;
            if (s.cells.tdMatch) s.cells.tdMatch.textContent = s.matchPoints;
            if (s.cells.tdCurrent) s.cells.tdCurrent.textContent = s.current;

        });
        sortScores();
    }

    // Lưu hành động trong ván
    let currentActions = [];

    // Render bảng hành động
    function renderCurrentActions() {
        const tbody = document.getElementById("current-actions");
        tbody.innerHTML = "";
        if (currentActions.length == 0) {
            tbody.innerHTML = `<tr class="border-b"><td class="p-2">Ván này chưa có ai ăn điểm</td></tr>`;
        }
        currentActions.forEach((a, idx) => {
            tbody.innerHTML += `
      <tr class="border-b">
        <td class="p-2">${idx + 1}</td>
        <td class="p-2">${a.description}</td>
        <td class="p-2 text-center">
          <button class="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-700" onclick="removeAction(${idx})">X</button>
        </td>
      </tr>
    `;
        });
    }

    // Xóa hành động trong ván
    function removeAction(index) {
        const a = currentActions[index];
        let p1 = scores.find(s => s.id === a.player1Id);
        let p2 = scores.find(s => s.id === a.player2Id);

        p1.matchPoints -= a.pointAdd;
        p1.current -= a.pointAdd;
        p2.matchPoints += a.pointAdd;
        p2.current += a.pointAdd;

        currentActions.splice(index, 1);
        updateTableValues();
        renderCurrentActions();
    }
    // Gắn global để onclick gọi được
    window.renderCurrentActions = renderCurrentActions;
    window.removeAction = removeAction;
    renderCurrentActions();

    // Nút thêm hành động
    document.getElementById("add-action").addEventListener("click", () => {
        const player1Id = document.getElementById("player1").value;
        const player2Id = document.getElementById("player2").value;
        const ball = parseInt(document.getElementById("ball-type").value);

        if (!player1Id || !player2Id || !ball) {
            alert("Chọn đầy đủ người ăn, người bị ăn và loại ăn!");
            return;
        }
        if (player1Id === player2Id) {
            alert("Người ăn và bị ăn phải khác nhau!");
            return;
        }

        let pointAdd = pointConfig[ball];
        let p1 = scores.find(s => s.id === player1Id);
        let p2 = scores.find(s => s.id === player2Id);

        // cập nhật điểm
        p1.matchPoints += pointAdd;
        p1.current += pointAdd;
        p2.matchPoints -= pointAdd;
        p2.current -= pointAdd;

        currentActions.push({
            player1Id, player2Id, ball, pointAdd,
            p1Name: p1.name,
            p2Name: p2.name,
            description: `${p1.name} ăn ${ball} của ${p2.name}`,
            ball: ball
        });

        updateTableValues();
        renderCurrentActions();
        document.getElementById("player1").value = player1Id;
        document.getElementById("player2").value = player2Id;
        document.getElementById("ball-type").value = ball;
    });

    let maxRack = history_points_den
        .filter(h => h.tournamentId === tournament.id)
        .reduce((m, h) => Math.max(m, h.racks), 0);
    // Nút kết thúc rack
    // console.log("history_points_den:", history_points_den);
    document.getElementById("finish-rack").addEventListener("click", () => {
        if (currentActions.length === 0) {
            alert("Chưa có hành động nào!");
            return;
        }
        if (!confirm("Xác nhận kết thúc rack?")) return;

        let maxId = history_points_den.length > 0
            ? Math.max(...history_points_den.map(h => parseInt(h.id)))
            : 0;


        maxRack = maxRack + 1;

        scores.forEach(s => {
            maxId++;
            const newData = {
                id: String(maxId),
                playerId: s.id,
                tournamentId: tournament.id,
                racks: maxRack,
                pointsReceived: s.matchPoints
            }
            history_points_den.push(newData);
            //thêm dữ liệu vào bảng 
            createData('history_points_den', newData)
        });

        //Cộng 1 elo cho người ăn 9
        const nineActions = currentActions.filter(a => Number(a.ball) === 9);
        // console.log(nineActions);

        if (nineActions.length > 0) {
            nineActions.map(nineAction => {
                addPlayerPoints(nineAction.player1Id, 1, tournament.id, null)
            })
        }

        scores.forEach(s => {
            s.oldPoints = s.current;
            s.matchPoints = 0;
        });

        currentActions = [];
        updateTableValues();
        renderCurrentActions();
        // console.log(maxRack,currentRack);

        // console.log("history_points_den:", history_points_den);
        renderHistoryTable();
        renderRackHistoryChart(tournament.id);
        showCurrentRack();
    });

    function showCurrentRack() {
        document.getElementById("current-rack").textContent = maxRack + 1;
        document.getElementById("current-rack-2").textContent = maxRack + 1;
    }

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
            .sort((a, b) => b - a); // sắp xếp giảm dần (rack mới nhất trước)

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
    function getRandomColor() {
        const r = Math.floor(Math.random() * 200);
        const g = Math.floor(Math.random() * 200);
        const b = Math.floor(Math.random() * 200);
        return `rgb(${r}, ${g}, ${b})`;
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
            const color = scoreObj ? scoreObj.color : getRandomColor();

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
    document.getElementById('end-tournament-btn').addEventListener('click', async () => {
        // Sắp xếp copy của mảng scores theo current giảm dần
        const ranking = [...scores].sort((a, b) => b.current - a.current);
        let champion = ranking[0];
        let runnerUp = ranking[1];
        // console.log(champion,runnerUp);
        // Hiển thị thông báo xác nhận
        if (!confirm(`Bạn có chắc chắn muốn kết thúc mâm đền này với người vô địch là ${champion.name}(${champion.current} điểm) và á quân là ${runnerUp.name}(${runnerUp.current} điểm)?`)) {
            return;
        }
        const newTournament = {
            ...tournament,
            top1Id: champion.id,
            top2Id: runnerUp.id,
            status: "Đã kết thúc"
        }
        // console.log(newTournament);

        try {
            // Cập nhật dữ liệu giải đấu
            await updateData('tournaments', tournament.id, newTournament);
            tournament.status = "Đã kết thúc"
            // poolData.tournaments[tournament.id-1].status = "Đã kết thúc";
            // console.log(poolData.tournaments[tournament.id-1].status);

            // Cập nhật điểm cho nhà vô địch và á quân
            await addPlayerPoints(champion.id, tournament.top1_point, tournament.id, "Vô địch");
            await addPlayerPoints(runnerUp.id, tournament.top2_point, tournament.id, "Á quân");

            // Cập nhật điểm cho các người chơi khác tham gia giải

            if (tournament.other_point > 0) {
                const otherPlayers = poolData.players.filter(player =>

                    tournament.players.includes(player.id) &&
                    player.id !== champion.id &&
                    player.id !== runnerUp.id
                );
                // console.log(otherPlayers);

                for (const player of otherPlayers) {
                    await addPlayerPoints(player.id, tournament.other_point, tournament.id, null);
                }
            }
            // Làm mới dữ liệu
            // console.log(1);

            window.location.hash = `#/tournament_details?id=${tournament.id}`;
        } catch (error) {
            console.error('Error ending tournament:', error);
            alert('Failed to end tournament. Please try again.');
        }
    });


    showCurrentRack()
    // Gọi khi load
    renderDropdowns();
    renderTableInitial();
    updateTableValues();
    renderHistoryTable();
    renderRackHistoryChart(tournament.id);

    checkAdminAccess();
    if (tournament.status != "Đang diễn ra") {
        document.getElementById('add-action-section')?.classList.add('hidden');
        document.getElementById('edit-point')?.classList.add('hidden');
        document.getElementById('finish-rack')?.classList.add('hidden');
        document.getElementById('end-tournament-btn')?.classList.add('hidden');
    }
    if (!adminKey) {
        document.getElementById('end-tournament-btn')?.classList.add('hidden');
    }
}