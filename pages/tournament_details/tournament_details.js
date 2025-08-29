import { poolData, createData, updateData, checkAdminAccess, addPlayerPoints } from "../../data.js"; // nhớ export từ data.js
export function render({ id }) {

    // Hàm định dạng ngày sang DD/MM/YYYY
    function formatDateVN(date) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    // Lấy ID giải đấu từ URL
    // const urlParams = new URLSearchParams(window.location.search);

    // console.log(poolData);

    const adminKey = localStorage.getItem("adminKey");
    // Tìm giải đấu
    const tournament = poolData.tournaments.find(t => t.id == id);
    const tournamentId = tournament.id;

    if (!tournament) {
        document.getElementById('tournament-title').textContent = 'Tournament Not Found';
        document.getElementById('tournament-name').textContent = 'N/A';
        document.getElementById('tournament-date').textContent = 'N/A';
        document.getElementById('tournament-location').textContent = 'N/A';
        document.getElementById('tournament-participants').textContent = '0';
        document.getElementById('tournament-prize').textContent = 'N/A';
        document.getElementById('tournament-top1-points').textContent = '0';
        document.getElementById('tournament-top2-points').textContent = '0';
        document.getElementById('tournament-other-points').textContent = '0';
        document.getElementById('tournament-status').textContent = 'N/A';
        alert("Sai id tournament");
        window.location.href = "#/tournaments";
    }
    else {
        // Hiển thị thông tin giải đấu
        if (tournament.name == "Đền") {
            document.getElementById('label-tounament-type').textContent = "Một điểm:";
            document.getElementById('matches-section').classList.add("hidden");
            document.getElementById('div-rack-history-chart').classList.remove("hidden");
            document.getElementById('all-racks-history').classList.remove("hidden");
            if (tournament.status == "Đang diễn ra") {
                window.location.href = `#/tourDen_ongoing?id=${tournament.id}`;
            }
        }
        document.getElementById('tournament-title').textContent = tournament.name;
        document.getElementById('tournament-name').textContent = tournament.name;
        document.getElementById('tournament-date').textContent = tournament.date;
        document.getElementById('tournament-location').textContent = tournament.location;
        const participantCount = tournament.players ? tournament.players.length : 0;
        document.getElementById('tournament-participants').textContent = participantCount;
        document.getElementById('tournament-prize').textContent = tournament.prize;
        document.getElementById('tournament-top1-points').textContent = tournament.top1_point;
        document.getElementById('tournament-top2-points').textContent = tournament.top2_point;
        document.getElementById('tournament-other-points').textContent = tournament.other_point;
        const top1Player = poolData.players.find(p => p.id == tournament.top1Id)?.name || 'N/A';
        const top2Player = poolData.players.find(p => p.id == tournament.top2Id)?.name || 'N/A';
        document.getElementById('tournament-status').textContent = tournament.status;
        document.getElementById('tournament-status').className = tournament.status === 'Đang diễn ra' ? 'ongoing' : 'finished';

        // Hiển thị hoặc ẩn các tính năng dựa trên trạng thái giải đấu
        const isOngoing = tournament.status == 'Đang diễn ra';
        const endTournamentSection = document.getElementById('end-tournament-section');
        const addMatchBtn = document.getElementById('add-match-btn-in-tour');
        const addPlayerBtn = document.getElementById('select-player-btn');
        const endTournamentBtn = document.getElementById('end-tournament-btn');
        if (isOngoing && adminKey) {
            addMatchBtn.classList.remove('hidden');
            addPlayerBtn.classList.remove('hidden');
            endTournamentBtn.classList.remove('hidden')
            // Chỉ hiển thị nút Kết thúc giải khi có cả top1Id và top2Id
            if (tournament.top1Id && tournament.top2Id) {
                endTournamentSection.classList.remove('hidden');
            }
        }

        async function endTournament(champion,runnerUp){
            tournament.status = 'Đã kết thúc';
            document.getElementById('tournament-status').classList.remove('ongoing');
            document.getElementById('tournament-status').classList.add('finished');
            document.getElementById('tournament-status').textContent = tournament.status;
            addMatchBtn.classList.add('hidden');
            addPlayerBtn.classList.add('hidden');
            endTournamentBtn.classList.add('hidden')
            // console.log(tournament);
            const newTournament = {
                ...tournament,
                status: 'Đã kết thúc'
            }
            // console.log(newTournament);


            try {
                // Cập nhật dữ liệu giải đấu
                await updateData('tournaments', tournament.id, newTournament);

                // Cập nhật điểm cho nhà vô địch và á quân
                await addPlayerPoints(champion.id, tournament.top1_point, tournament.id, "Vô địch");
                await addPlayerPoints(runnerUp.id, tournament.top2_point, tournament.id, "Á quân");

                // Cập nhật điểm cho các người chơi khác tham gia giải
                if (tournament.other_point > 0) {
                    const otherPlayers = poolData.players.filter(player =>

                        participantIds.includes(player.id) &&
                        player.id !== tournament.top1Id &&
                        player.id !== tournament.top2Id
                    );
                    for (const player of otherPlayers) {
                        await addPlayerPoints(player.id, tournament.other_point, tournament.id, null);
                    }
                }


                // Làm mới dữ liệu
                // await initializePoolData();
            } catch (error) {
                console.error('Error ending tournament:', error);
                alert('Failed to end tournament. Please try again.');
            }
        }

        // Xử lý nút kết thúc giải
        document.getElementById('end-tournament-btn').addEventListener('click', async () => {
            if (!tournament.top1Id || !tournament.top2Id) {
                alert('Cannot end tournament: Both Top 1 and Top 2 players must be selected.');
                return;
            }
            const champion = poolData.players.find(player => player.id === tournament.top1Id) || 'Chưa chọn';
            const runnerUp = poolData.players.find(player => player.id === tournament.top2Id) || 'Chưa chọn';

            // Hiển thị thông báo xác nhận
            if (!confirm(`Bạn có chắc chắn muốn kết thúc giải đấu với người vô địch là ${champion.name} và á quân là ${runnerUp.name}?`)) {
                return;
            }
            endTournament(champion,runnerUp)

        });

        // Hiển thị danh sách trận đấu
        function renderMatchsTable() {
            const matchesTable = document.getElementById('matches-table');
            matchesTable.innerHTML = '';
            const matches = poolData.matchHistory.filter(match => match.tournamentId == tournamentId);
            let indexShow = 0;
            matches
                .sort((a, b) => parseInt(a.tournamentMatchId) - parseInt(b.tournamentMatchId))
                .forEach(match => {
                    const row = document.createElement('tr');
                    row.className = 'border-b';
                    const player1 = poolData.players.find(u => u.id == match.player1Id)?.name || 'Unknown';
                    const player2 = poolData.players.find(u => u.id == match.player2Id)?.name || 'Unknown';
                    const player1Class = match.winnerId == match.player1Id ? 'text-green-600' : 'text-red-600';
                    const player2Class = match.winnerId == match.player2Id ? 'text-green-600' : 'text-red-600';
                    if (player2 === "Chấm") {
                        // Nếu là trận đi chấm
                        row.classList.add("bg-yellow-100"); // nền vàng
                        row.innerHTML = `
                    <td class="p-3">-</td>
                    <td class="p-3">${match.matchType || 'N/A'}</td>
                    <td class="p-3">
                        <span class="${player1Class}">${player1}</span> đi chấm +${match.score1} elo
                    </td>
                `;
                    } else {
                        indexShow += 1;
                        row.innerHTML = `
                    <td class="p-3">${indexShow}</td>
                    <td class="p-3">${match.matchType || 'N/A'}</td>
                    <td class="p-3">
                        <span class="${player1Class}">${player1}</span> ${match.score1} - ${match.score2} <span class="${player2Class}">${player2}</span>
                    </td>
                `;
                    }
                    matchesTable.appendChild(row);
                });
        }
        renderMatchsTable();


        // Hiển thị xếp hạng người chơi trong giải đấu
        const rankingsTable = document.getElementById('rankings-table');
        const noResults = document.getElementById('no-results');
        const participantIds = tournament.players || []

        renderPlayerRankings(tournament)
        // Hiển thị bảng Player Rankings
        async function renderPlayerRankings(tournament) {
            // await initializePoolData();
            const tableBody = document.getElementById('rankings-table-body');
            tableBody.innerHTML = '';
            // Sắp xếp người chơi: Vô địch -> Hạng 2 -> Other
            const sortedPlayers = [...tournament.players].sort((a, b) => {
                if (a === tournament.top1Id) return -2; // Vô địch đầu tiên
                if (b === tournament.top1Id) return 2;
                if (a === tournament.top2Id) return -1; // Hạng 2 thứ hai
                if (b === tournament.top2Id) return 1;
                return 0; // Giữ nguyên thứ tự cho Other
            });

            sortedPlayers.forEach(playerId => {
                const player = poolData.players.find(p => p.id === playerId);
                if (!player) return;

                const row = document.createElement('tr');
                row.className = 'border-b';

                let rankContent = '-';
                let pointsReceived = tournament.other_point;
                if (tournament.top1Id && player.id === tournament.top1Id) {
                    rankContent = '<span class="bg-yellow-600 text-white px-2 py-1 rounded">1</span>';
                    pointsReceived = tournament.top1_point;
                } else if (tournament.top2Id && player.id === tournament.top2Id) {
                    rankContent = '<span class="bg-gray-600 text-white px-2 py-1 rounded">2</span>';
                    pointsReceived = tournament.top2_point;
                }

                row.innerHTML = `
            <td class="p-3">${rankContent}</td>
            <td class="p-3">${player.name}</td>
            <td class="p-3">${pointsReceived}</td>
        `;
                tableBody.appendChild(row);
            });

        }

        // Điền danh sách người chơi vào select (form thêm trận đấu)
        const player1Select = document.getElementById('match-player1');
        const player2Select = document.getElementById('match-player2');
        const score2Input = document.getElementById('match-score2');

        // Function to populate player1 dropdown (excluding "Chấm")
        function populatePlayer1Dropdown() {
            player1Select.innerHTML = '<option value="">Select Player 1</option>';
            poolData.players
                .filter(player => player.name !== 'Chấm' && participantIds.includes(player.id))
                .forEach(player => {
                    const option = document.createElement('option');
                    option.value = player.id;
                    option.textContent = player.name;
                    player1Select.appendChild(option);
                });
        }

        // Function to populate player2 dropdown based on player1 selection
        function populatePlayer2Dropdown(selectedPlayer1Id) {
            player2Select.innerHTML = '<option value="">Select Player 2</option>';

            // Always add "Chấm" at the top
            const chamPlayer = poolData.players.find(player => player.name === 'Chấm');
            if (chamPlayer) {
                const chamOption = document.createElement('option');
                chamOption.value = chamPlayer.id;
                chamOption.textContent = chamPlayer.name;
                player2Select.appendChild(chamOption);
            }

            // Add other players, excluding the selected player1
            poolData.players
                .filter(player => player.id !== selectedPlayer1Id && player.name !== 'Chấm' && participantIds.includes(player.id))
                .forEach(player => {
                    const option = document.createElement('option');
                    option.value = player.id;
                    option.textContent = player.name;
                    player2Select.appendChild(option);
                });
        }
        // Function to handle score2 input based on player2 selection
        function handleScore2Input() {
            const selectedPlayer2 = poolData.players.find(player => player.id === player2Select.value);
            if (selectedPlayer2 && selectedPlayer2.name === 'Chấm') {
                document.getElementById('score2-label').classList.add('hidden');
                // document.getElementById('match-type-label').classList.add('hidden');
                score2Input.classList.add('hidden');
                score2Input.value = 0;
            } else {
                // document.getElementById('match-type-label').classList.remove('hidden');
                score2Input.classList.remove('hidden');
                score2Input.value = ''; // Clear value when not "Chấm"
            }
        }

        // Initial population of player1 dropdown
        populatePlayer1Dropdown();

        // Event listener for player1 selection change
        player1Select.addEventListener('change', (e) => {
            populatePlayer2Dropdown(e.target.value);
            handleScore2Input(); // Update score2 input when player1 changes
        });

        // Event listener for player2 selection change
        player2Select.addEventListener('change', handleScore2Input);

        // Điền danh sách người chơi vào select cho thêm người chơi
        const newPlayerSelect = document.getElementById('new-player');
        poolData.players
            .forEach(player => {
                // Chỉ thêm người chơi chưa được chọn làm Top 1 hoặc Top 2
                if (participantIds.includes(player.id)) {
                    const option = document.createElement('option');
                    option.value = player.id;
                    option.textContent = player.name;
                    newPlayerSelect.appendChild(option);
                }
            });

        // Xử lý hiển thị/ẩn form thêm trận đấu
        const addMatchForm = document.getElementById('add-match-form');
        addMatchBtn.addEventListener('click', () => {
            addMatchForm.classList.toggle('hidden');
            // Reset form khi mở
            document.getElementById('match-player1').value = '';
            document.getElementById('match-score1').value = '';
            document.getElementById('match-player2').value = '';
            document.getElementById('match-score2').value = '';
            document.getElementById('match-type').value = '';
        });

        // Xử lý lưu trận đấu mới
        document.getElementById('save-match').addEventListener('click', () => {
            const player1Id = document.getElementById('match-player1').value;
            const score1 = document.getElementById('match-score1').value;
            const player2Id = document.getElementById('match-player2').value;
            const score2 = document.getElementById('match-score2').value;
            const matchType = document.getElementById('match-type').value;
            const player1name = poolData.players.find(u => u.id === player1Id)?.name || 'Unknown';
            const player2name = poolData.players.find(u => u.id === player2Id)?.name || 'Unknown';

            // Kiểm tra dữ liệu hợp lệ
            if (!player1Id || !player2Id || !score1 || !score2 || !matchType || player1Id == player2Id) {
                alert('Please fill in all fields with valid data. Player 1 and Player 2 must be different.');
                return;
            }
            if (parseInt(score1) == parseInt(score2)) {
                alert('Scores cannot be equal. Please ensure one player has a higher score.');
                return;
            }
            const winnerId = parseInt(score1) > parseInt(score2) ? player1Id : player2Id;
            tournament.top1Id = winnerId;
            tournament.top2Id = player1Id == winnerId?player2Id :player1Id 
            const championUp = poolData.players.find(u => u.id === tournament.top1Id);
            const runnerUp = poolData.players.find(u => u.id === tournament.top1Id);
            // console.log(winnerId,player1Id,player2Id);
            if (matchType == "Chung kết") {
                if (confirm(`Chung kết tỉ số [ ${player1name} ${score1} - ${score2} ${player2name} ] và người vô địch là ${championUp.name} ?`)) {
                    // console.log(tournament);
                    renderPlayerRankings(tournament);
                    endTournament(championUp,runnerUp);
                }
            } else {
                if (!confirm(`Bạn có chắc chắn kết quả là [ ${player1name} ${score1} - ${score2} ${player2name} ]là chính xác?`)) {
                    return;
                }
            }


            // Kiểm tra số trận tối đa của giải
            // const maxMatches = tournamentId == "1" ? 6 : 4;
            const currentMatches = poolData.matchHistory.filter(match => match.tournamentId == tournamentId).length;
            // if (currentMatches >= maxMatches) {
            //     alert(`This tournament has reached its maximum number of matches (${maxMatches}).`);
            //     return;
            // }

            // Xác định winnerId dựa trên tỉ số
            const maxId = poolData.matchHistory.length > 0
                ? Math.max(...poolData.matchHistory.map(item => parseInt(item.id, 10))) + 1
                : 1; // Nếu mảng rỗng, bắt đầu từ 1
            // Tạo trận đấu mới
            const newMatch = {
                id: String(maxId),
                player1Id,
                score1: parseInt(score1),
                player2Id,
                score2: parseInt(score2),
                winnerId,
                date: new Date().toLocaleDateString('vi-VN'),
                tournamentId,
                tournamentMatchId: String(currentMatches + 1),
                matchType
            };
            createData('match-history', newMatch);
            addPlayerPoints(player1Id, parseInt(score1), tournament.id, maxId);
            addPlayerPoints(player2Id, parseInt(score2), tournament.id, maxId);
            sessionStorage.removeItem('poolData_matchHistory');
            sessionStorage.removeItem('isInitialLoad');
            poolData.matchHistory.push(newMatch);
            renderMatchsTable()
            // Thêm hàng mới vào bảng
            // const row = document.createElement('tr');
            // row.className = 'border-b';
            // const player1 = poolData.players.find(u => u.id === newMatch.player1Id)?.name || 'Unknown';
            // const player2 = poolData.players.find(u => u.id === newMatch.player2Id)?.name || 'Unknown';
            // const player1Class = newMatch.winnerId === newMatch.player1Id ? 'text-green-600' : 'text-red-600';
            // const player2Class = newMatch.winnerId === newMatch.player2Id ? 'text-green-600' : 'text-red-600';
            // row.innerHTML = `
            //                     <td class="p-3">${newMatch.tournamentMatchId}</td>
            //                     <td class="p-3">${newMatch.matchType}</td>
            //                     <td class="p-3"><span class="${player1Class}">${player1}</span> ${newMatch.score1} - ${newMatch.score2} <span class="${player2Class}">${player2}</span></td>
            //                 `;
            // matchesTable.appendChild(row);

            // Sắp xếp bảng theo tournamentMatchId tăng dần
            // const rows = Array.from(matchesTable.querySelectorAll('tr'));
            // rows.sort((a, b) => {
            //     const idA = parseInt(a.querySelector('td:first-child').textContent) || 0;
            //     const idB = parseInt(b.querySelector('td:first-child').textContent) || 0;
            //     return idA - idB;
            // });

            // Xóa các hàng hiện tại và thêm lại các hàng đã sắp xếp
            // matchesTable.innerHTML = '';
            // rows.forEach(row => matchesTable.appendChild(row));


            // Ẩn form và xóa dữ liệu
            addMatchForm.classList.add('hidden');
            document.getElementById('match-player1').value = '';
            document.getElementById('match-score1').value = '';
            document.getElementById('match-player2').value = '';
            document.getElementById('match-score2').value = '';
            document.getElementById('match-type').value = '';
            // initializePoolData();
        });

        // Xử lý hủy form thêm trận đấu
        document.getElementById('cancel-match').addEventListener('click', () => {
            addMatchForm.classList.add('hidden');
            document.getElementById('match-player1').value = '';
            document.getElementById('match-score1').value = '';
            document.getElementById('match-player2').value = '';
            document.getElementById('match-score2').value = '';
            document.getElementById('match-type').value = '';
        });

        // Xử lý hiển thị/ẩn form thêm người chơi
        const addPlayerForm = document.getElementById('add-player-form');
        addPlayerBtn.addEventListener('click', () => {
            // console.log(1);

            addPlayerForm.classList.toggle('hidden');
            document.getElementById('new-player').value = '';
            document.getElementById('player-role').value = '';
        });

        let tempTournamentData = {
            top1Id: null,
            top2Id: null
        };

        // Xử lý lưu người chơi (Vô địch/Á quân)
        document.getElementById('save-player').addEventListener('click', async () => {
            const playerId = document.getElementById('new-player').value;
            const role = document.getElementById('player-role').value;

            if (!playerId || !role || !tournament) {
                alert('Please select a player and role.');
                return;
            }

            if (role === 'Tham gia') {
                alert('Cannot add new player. Please select Vô địch or Á quân.');
                return;
            }

            if (role === 'Vô địch') {
                if (tempTournamentData.top1Id && tempTournamentData.top1Id !== playerId) {
                    alert('A champion has already been selected.');
                    return;
                }
                if (playerId === tempTournamentData.top2Id) {
                    alert('Player is already set as runner-up.');
                    return;
                }
                tempTournamentData.top1Id = playerId;
            } else if (role === 'Á quân') {
                if (tempTournamentData.top2Id && tempTournamentData.top2Id !== playerId) {
                    alert('A runner-up has already been selected.');
                    return;
                }
                if (playerId === tempTournamentData.top1Id) {
                    alert('Player is already set as champion.');
                    return;
                }
                tempTournamentData.top2Id = playerId;
            } else {
                alert('Invalid role selected.');
                return;
            }
            // console.log(tournament);

            tournament.top1Id = role == 'Vô địch' ? playerId : tournament.top1Id;
            tournament.top2Id = role == 'Á quân' ? playerId : tournament.top2Id;

            await renderPlayerRankings(tournament);
            addPlayerForm.classList.add('hidden');
            document.getElementById('new-player').value = '';
            document.getElementById('player-role').value = '';
        });

        // Xử lý hủy form thêm người chơi
        document.getElementById('cancel-player').addEventListener('click', () => {
            addPlayerForm.classList.add('hidden');
            document.getElementById('new-player').value = '';
            document.getElementById('player-role').value = '';
        });
    }
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
    checkAdminAccess();
}