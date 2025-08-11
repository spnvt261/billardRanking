// function formatDateVN(date) {
//     const day = String(date.getDate()).padStart(2, '0');
//     const month = String(date.getMonth() + 1).padStart(2, '0');
//     const year = date.getFullYear();
//     return `${day}/${month}/${year}`;
// }
// window.addEventListener('data-loading', () => {
//     document.getElementById('loading').classList.remove('hidden');
// });
// window.addEventListener('data-loaded', () => {
//     document.getElementById('loading').classList.add('hidden');
// });
async function renderPage() {
    await initializePoolData();
}
// Hàm chuyển định dạng ngày DD/MM/YYYY thành Date object
function parseDateVN(dateStr) {
    const [day, month, year] = dateStr.split('/').map(Number);
    return new Date(year, month - 1, day);
}

// Thay hàm filterMatches trong match_history.js
function filterMatches() {
    const player1Id = document.getElementById('filter-player1').value;
    const player2Id = document.getElementById('filter-player2').value;
    const month = document.getElementById('filter-month').value;
    const year = document.getElementById('filter-year').value;
    const tournament = document.getElementById('filter-tournament').value;

    // Hàm helper để lấy danh sách ID người chơi từ teamId
    function getPlayerIds(teamId) {
        if (String(teamId).length === 8) {
            // Trận đôi: tách thành 2 phần 4 ký tự
            const part1 = String(teamId).substring(0, 4);
            const part2 = String(teamId).substring(4, 8);
            return [String(parseInt(part1) - 1000), String(parseInt(part2) - 1000)];
        }
        // Trận đơn: trả về ID đơn
        return [String(teamId)];
    }

    return poolData.matchHistory.filter(match => {
        // Lấy danh sách ID người chơi từ cả hai đội
        const team1Ids = getPlayerIds(match.player1Id);
        const team2Ids = getPlayerIds(match.player2Id);

        // Lọc theo người chơi
        let playerMatch = true;
        if (player1Id && player2Id) {
            // Cả hai player được chọn: kiểm tra xem có trận nào cả hai cùng tham gia
            playerMatch = (
                (team1Ids.includes(player1Id) && team2Ids.includes(player2Id)) ||
                (team1Ids.includes(player2Id) && team2Ids.includes(player1Id))
            );
        } else if (player1Id) {
            // Chỉ chọn player1: kiểm tra trong cả hai đội
            playerMatch = team1Ids.includes(player1Id) || team2Ids.includes(player1Id);
        } else if (player2Id) {
            // Chỉ chọn player2: kiểm tra trong cả hai đội
            playerMatch = team1Ids.includes(player2Id) || team2Ids.includes(player2Id);
        }

        // Lọc theo tháng và năm
        const matchDate = parseDateVN(match.date);
        const monthMatch = !month || (matchDate.getMonth() + 1) == parseInt(month);
        const yearMatch = !year || matchDate.getFullYear() == parseInt(year);

        // Lọc theo giải đấu
        const tournamentName = match.tournament || poolData.tournaments.find(t => t.id == match.tournamentId)?.name || 'Bàn nước';
        const tournamentMatch = !tournament || tournamentName == tournament;

        return playerMatch && monthMatch && yearMatch && tournamentMatch;
    }).sort((a, b) => parseDateVN(b.date) - parseDateVN(a.date));
}
const loading = document.getElementById('loading');
function renderMatchHistory(page = 1) {

    if (!poolData.matchHistory || poolData.matchHistory.length === 0) {
        loading.classList.remove('hidden');
        return;
    }
    loading.classList.add('hidden');
    const matches = filterMatches().sort((a, b) => parseInt(b.id) - parseInt(a.id)); // Sắp xếp id giảm dần
    const matchesPerPage = 10;
    const totalPages = Math.ceil(matches.length / matchesPerPage);
    const startIndex = (page - 1) * matchesPerPage;
    const endIndex = startIndex + matchesPerPage;
    const paginatedMatches = matches.slice(startIndex, endIndex);

    const tableBody = document.getElementById('history-table');
    tableBody.innerHTML = ''; // Xóa nội dung cũ
    // Thay đoạn code trong hàm renderMatchHistory
    paginatedMatches.forEach(match => {
        const row = document.createElement('tr');
        row.className = 'border-b';

        let player1Display, player2Display, player1Class, player2Class;

        // Hàm helper để lấy tên từ ID (xử lý team hoặc đơn)
        function getPlayerDisplay(playerId) {
            if (String(playerId).length === 8) {
                // Là team đôi: tách thành 2 phần 4 ký tự
                const part1 = String(playerId).substring(0, 4);
                const part2 = String(playerId).substring(4, 8);
                const id1 = parseInt(part1) - 1000;
                const id2 = parseInt(part2) - 1000;
                const name1 = poolData.players.find(u => u.id == id1)?.name || 'Unknown';
                const name2 = poolData.players.find(u => u.id == id2)?.name || 'Unknown';
                return `${name1} & ${name2}`;
            } else {
                // Là player đơn
                return poolData.players.find(u => u.id == playerId)?.name || 'Unknown';
            }
        }

        player1Display = getPlayerDisplay(match.player1Id);
        player2Display = getPlayerDisplay(match.player2Id);
        player1Class = match.winnerId == match.player1Id ? 'text-green-600' : 'text-red-600';
        player2Class = match.winnerId == match.player2Id ? 'text-green-600' : 'text-red-600';

        const tournamentName = poolData.tournaments.find(t => t.id == match.tournamentId)?.name || match.tournamentId || 'Bàn nước';

        row.innerHTML = `
        <td class="p-3"><span class="${player1Class}">${player1Display}</span> ${match.score1} - ${match.score2} <span class="${player2Class}">${player2Display}</span></td>
        <td class="p-3">${match.date}</td>
        <td class="p-3">${tournamentName}</td>
    `;
        tableBody.appendChild(row);
    });

    // Render phân trang
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';
    for (let i = 1; i <= totalPages; i++) {
        const button = document.createElement('button');
        button.className = `px-3 py-1 rounded ${i == page ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`;
        button.textContent = i;
        button.addEventListener('click', () => renderMatchHistory(i));
        pagination.appendChild(button);
    }

    if (paginatedMatches.length == 0) {
        tableBody.innerHTML = 'Không có trận nào';
        return
    }

}

// Gọi hàm render khi tải trang
renderMatchHistory();

// Điền danh sách người chơi vào select (form thêm trận đấu)
const player1Select = document.getElementById('player1-id');
const player2Select = document.getElementById('player2-id');
const score2Input = document.getElementById('score2');

// Function to populate player1 dropdown (excluding "Chấm")
function populatePlayer1Dropdown() {
    player1Select.innerHTML = '<option value="">Select Player 1</option>';
    // console.log(poolData.players);
    // console.log(poolData.players.filter(player => player.name.toLowerCase() != 'chấm'));
    poolData.players
        .filter(player => player.name.toLowerCase() != 'chấm')
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
        .filter(player => player.id !== selectedPlayer1Id && player.name !== 'Chấm')
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
        score2Input.classList.add('hidden');
        score2Input.value = 0;
    } else {
        document.getElementById('score2-label').classList.remove('hidden');
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

// Điền danh sách người chơi vào select (bộ lọc)
const filterPlayer1Select = document.getElementById('filter-player1');
const filterPlayer2Select = document.getElementById('filter-player2');
poolData.players.forEach(player => {
    const option1 = document.createElement('option');
    option1.value = player.id;
    option1.textContent = player.name;
    filterPlayer1Select.appendChild(option1);
    const option2 = document.createElement('option');
    option2.value = player.id;
    option2.textContent = player.name;
    filterPlayer2Select.appendChild(option2);
});

// Điền danh sách giải đấu vào select (bộ lọc)
const filterTournamentSelect = document.getElementById('filter-tournament');
poolData.tournaments.forEach(tournament => {
    const option = document.createElement('option');
    option.value = tournament.name;
    option.textContent = tournament.name;
    filterTournamentSelect.appendChild(option);
});

// Xử lý hiển thị form bộ lọc
const filterBtn = document.getElementById('filter-btn');
const filterForm = document.getElementById('filter-form');
const addMatchBtn = document.getElementById('add-match-btn');
const addMatchForm = document.getElementById('add-match-form');

filterBtn.addEventListener('click', () => {
    filterForm.classList.toggle('hidden');
    if (!filterForm.classList.contains('hidden')) {
        addMatchForm.classList.add('hidden'); // Đóng form thêm trận đấu
    }
});

// Xử lý hiển thị form thêm trận đấu
addMatchBtn.addEventListener('click', () => {
    addMatchForm.classList.toggle('hidden');
    if (!addMatchForm.classList.contains('hidden')) {
        filterForm.classList.add('hidden'); // Đóng form bộ lọc
    }
});

// Xử lý lưu trận đấu mới đơn
document.getElementById('save-match').addEventListener('click', () => {
    // console.log(poolData.matchHistory);

    const player1Id = document.getElementById('player1-id').value;
    const score1 = document.getElementById('score1').value;
    const player2Id = document.getElementById('player2-id').value;
    const score2 = document.getElementById('score2').value;
    const player1name = poolData.players.find(u => u.id === player1Id)?.name || 'Unknown';
    const player2name = poolData.players.find(u => u.id === player2Id)?.name || 'Unknown';

    // Kiểm tra dữ liệu hợp lệ
    if (!player1Id || !player2Id || player1Id == player2Id || score1 == '' || score2 == '' || isNaN(score1) || isNaN(score2)) {
        alert('Please select different players and enter valid scores.');
        return;
    }
    if (player2name == "Chấm") {
        if (!confirm(`Bạn có chắc ${player1name} đi chấm và nhận ${score1} Elo ?`)) {
            return;
        }
    } else {
        if (!confirm(`Bạn có chắc chắn kết quả là ${player1name} ${score1} - ${score2} ${player2name} là chính xác?`)) {
            return;
        }
    }


    // Tạo trận đấu mới
    const winnerId = parseInt(score1) > parseInt(score2) ? player1Id : (parseInt(score2) > parseInt(score1) ? player2Id : null);
    // Tìm id lớn nhất và cộng thêm 1
    const maxId = poolData.matchHistory.length > 0
        ? Math.max(...poolData.matchHistory.map(item => parseInt(item.id, 10))) + 1
        : 1; // Nếu mảng rỗng, bắt đầu từ 1
    const newMatch = {
        id: String(maxId),
        player1Id,
        score1: parseInt(score1),
        player2Id,
        score2: parseInt(score2),
        winnerId,
        date: new Date().toLocaleDateString('vi-VN'),
        tournamentId: 'Bàn nước',
        tournamentMatchId: '',
        matchType: '',
    };
    createData('match-history', newMatch);
    addPlayerPoints(player1Id, parseInt(score1));
    if (player2name != "Chấm") {
        addPlayerPoints(player2Id, parseInt(score2));
    }
    // console.log(poolData.matchHistory);

    sessionStorage.removeItem('poolData_matchHistory');
    poolData.matchHistory.push(newMatch);
    // console.log(poolData.matchHistory);
    // console.log(newMatch);

    // Xóa bộ lọc
    document.getElementById('filter-player1').value = '';
    document.getElementById('filter-player2').value = '';
    document.getElementById('filter-month').value = '';
    document.getElementById('filter-year').value = '';
    document.getElementById('filter-tournament').value = '';

    // Cập nhật lại bảng lịch sử trận đấu
    renderMatchHistory();

    // Ẩn form và xóa dữ liệu
    addMatchForm.classList.add('hidden');
    document.getElementById('player1-id').value = '';
    document.getElementById('score1').value = '';
    document.getElementById('player2-id').value = '';
    document.getElementById('score2').value = '';
    // console.log(poolData.matchHistory);

});

// Xử lý hủy form thêm trận đấu
document.getElementById('cancel-match').addEventListener('click', () => {
    addMatchForm.classList.add('hidden');
    document.getElementById('player1-id').value = '';
    document.getElementById('score1').value = '';
    document.getElementById('player2-id').value = '';
    document.getElementById('score2').value = '';
});
document.getElementById('cancel-match-doubles').addEventListener('click', () => {
    addMatchForm.classList.add('hidden');

    bluePlayer1Select.value = '';
    bluePlayer2Select.value = '';
    redPlayer1Select.value = '';
    redPlayer2Select.value = '';
    redScoreInput.value = '';
    blueScoreInput.value = ''
});

// Xử lý áp dụng bộ lọc
document.getElementById('apply-filter').addEventListener('click', () => {
    filterForm.classList.add('hidden');
    renderMatchHistory();
});

// Xử lý xóa bộ lọc
document.getElementById('clear-filter').addEventListener('click', () => {
    filterForm.classList.add('hidden');
    document.getElementById('filter-player1').value = '';
    document.getElementById('filter-player2').value = '';
    document.getElementById('filter-month').value = '';
    document.getElementById('filter-year').value = '';
    document.getElementById('filter-tournament').value = '';
    renderMatchHistory();
});
// Điền danh sách người chơi vào select (form thêm trận đấu)
const bluePlayer1Select = document.getElementById('blue-player1');
const bluePlayer2Select = document.getElementById('blue-player2');
const redPlayer1Select = document.getElementById('red-player1');
const redPlayer2Select = document.getElementById('red-player2');

function populatePlayerSelects() {
    const players = poolData.players;
    const chamPlayer = players.find(p => p.name.toLowerCase() === 'chấm'); // Tìm player "Chấm" (case-insensitive)
    const chamId = chamPlayer ? chamPlayer.id : null;

    // Selects cho Blue team: loại bỏ "Chấm"
    [bluePlayer1Select, bluePlayer2Select].forEach(select => {
        if (select) {
            select.innerHTML = '<option value="">Chọn người chơi</option>';
            players.forEach(player => {
                if (player.id !== chamId) { // Bỏ qua "Chấm"
                    const option = document.createElement('option');
                    option.value = player.id;
                    option.textContent = player.name;
                    select.appendChild(option);
                }
            });
        }
    });

    // Selects cho Red team: bao gồm "Chấm"
    [redPlayer1Select, redPlayer2Select].forEach(select => {
        if (select) {
            select.innerHTML = '<option value="">Chọn người chơi</option>';
            players.forEach(player => {
                const option = document.createElement('option');
                option.value = player.id;
                option.textContent = player.name;
                select.appendChild(option);
            });
        }
    });

    // Giữ nguyên cho singles selects (nếu có)
    // [player1Select, player2Select].forEach(select => {
    //     if (select) {
    //         select.innerHTML = '<option value="">Chọn người chơi</option>';
    //         players.forEach(player => {
    //             const option = document.createElement('option');
    //             option.value = player.id;
    //             option.textContent = player.name;
    //             select.appendChild(option);
    //         });
    //     }
    // });
}

// Gọi populate khi dữ liệu sẵn sàng
populatePlayerSelects();

// Xử lý chọn loại trận
const singlesRadio = document.getElementById('match-type-singles');
const doublesRadio = document.getElementById('match-type-doubles');
const singlesForm = document.getElementById('singles-form');
const doublesForm = document.getElementById('doubles-form');

function handleMatchTypeChange() {
    if (singlesRadio.checked) {
        singlesForm.classList.remove('hidden');
        doublesForm.classList.add('hidden');
    } else if (doublesRadio.checked) {
        singlesForm.classList.add('hidden');
        doublesForm.classList.remove('hidden');
    }
    // Reset selects khi chuyển loại
    populatePlayerSelects();
}

// Gắn sự kiện cho radio buttons
singlesRadio.addEventListener('change', handleMatchTypeChange);
doublesRadio.addEventListener('change', handleMatchTypeChange);

// Gọi lần đầu để đảm bảo trạng thái ban đầu
handleMatchTypeChange();

// Xử lý tránh chọn trùng player trong doubles
const doublesSelects = [bluePlayer1Select, bluePlayer2Select, redPlayer1Select, redPlayer2Select];

doublesSelects.forEach(select => {
    select.addEventListener('change', () => {
        const selectedValues = doublesSelects.map(s => s.value).filter(v => v !== '');
        doublesSelects.forEach(s => {
            Array.from(s.options).forEach(option => {
                if (option.value && selectedValues.includes(option.value) && option.value !== s.value) {
                    option.disabled = true;
                } else {
                    option.disabled = false;
                }
            });
        });
    });
});


const redScoreInput = document.getElementById('red-score');
const blueScoreInput = document.getElementById('blue-score');
const redScoreLabel = document.getElementById('red-score-label');
const redPlayer1Label = redPlayer1Select.parentElement.querySelector('label'); // Label của red-player1
const redPlayer2Label = redPlayer2Select.parentElement.querySelector('label'); // Label của red-player2

// Xử lý đặc biệt cho Red team với "Chấm"
function handleRedTeamSelection() {
    const red1Value = redPlayer1Select.value;
    const red2Value = redPlayer2Select.value;
    const red1Name = poolData.players.find(p => p.id === red1Value)?.name.toLowerCase();
    const red2Name = poolData.players.find(p => p.id === red2Value)?.name.toLowerCase();

    let isChamSelected = false;

    if (red1Name === 'chấm') {
        isChamSelected = true;
        // Ẩn player 2
        redPlayer2Select.classList.add('hidden');
        redPlayer2Label.classList.add('hidden');
        redPlayer2Select.value = ''; // Reset value
    } else if (red2Name === 'chấm') {
        isChamSelected = true;
        // Ẩn player 1
        redPlayer1Select.classList.add('hidden');
        redPlayer1Label.classList.add('hidden');
        redPlayer1Select.value = ''; // Reset value
    } else {
        // Hiện lại nếu không chọn "Chấm"
        redPlayer1Select.classList.remove('hidden');
        redPlayer1Label.classList.remove('hidden');
        redPlayer2Select.classList.remove('hidden');
        redPlayer2Label.classList.remove('hidden');
    }

    if (isChamSelected) {
        // Disable red-score và set value = 0
        redScoreInput.classList.add('hidden');
        redScoreLabel.classList.add('hidden');
        redScoreInput.value = 0;
    } else {
        redScoreInput.classList.remove('hidden');
        redScoreLabel.classList.remove('hidden');
    }
}

// Gắn sự kiện cho red selects
redPlayer1Select.addEventListener('change', () => {
    handleRedTeamSelection();
    // Kết hợp với logic tránh trùng (gọi lại nếu cần)
});
redPlayer2Select.addEventListener('change', () => {
    handleRedTeamSelection();
    // Kết hợp với logic tránh trùng (gọi lại nếu cần)
});

// Gọi lần đầu để reset trạng thái
handleRedTeamSelection();

document.getElementById('save-match-doubles').addEventListener('click', () => {
    const bluePlayer1Id = document.getElementById('blue-player1').value;
    const bluePlayer2Id = document.getElementById('blue-player2').value;
    const blueScore = document.getElementById('blue-score').value;
    const redPlayer1Id = document.getElementById('red-player1').value;
    const redPlayer2Id = document.getElementById('red-player2').value;
    const redScore = document.getElementById('red-score').value;

    const bluePlayer1Name = poolData.players.find(u => u.id === bluePlayer1Id)?.name || 'Unknown';
    const bluePlayer2Name = poolData.players.find(u => u.id === bluePlayer2Id)?.name || 'Unknown';
    const redPlayer1Name = poolData.players.find(u => u.id === redPlayer1Id)?.name || 'Unknown';
    const redPlayer2Name = poolData.players.find(u => u.id === redPlayer2Id)?.name || 'Unknown';

    // Kiểm tra dữ liệu hợp lệ
    const allPlayers = [bluePlayer1Id, bluePlayer2Id, redPlayer1Id, redPlayer2Id].filter(id => id !== '');
    if (!bluePlayer1Id || !bluePlayer2Id || (redPlayer1Id === '' && redPlayer2Id === '') ||
        new Set(allPlayers).size !== allPlayers.length || blueScore === '' || redScore === '' ||
        isNaN(blueScore) || isNaN(redScore) || blueScore == redScore) {
        alert('Vui lòng chọn người chơi khác nhau, đảm bảo đội Xanh đủ 2 người chơi và nhập điểm hợp lệ.');
        return;
    }
    if (redPlayer1Name == "Chấm" || redPlayer2Name == "Chấm") {
        if (!confirm(`Bạn có chắc ${bluePlayer1Name} & ${bluePlayer2Name} đi chấm và nhận ${blueScore} Elo ? `)) {
            return;
        }
    } else {
        if (!confirm(`Bạn có chắc chắn kết quả là ${bluePlayer1Name} & ${bluePlayer2Name} ${blueScore} - ${redScore} ${redPlayer1Name}${redPlayer2Name.toLowerCase() === 'chấm' ? '' : ' & ' + redPlayer2Name} là chính xác?`)) {
            return;
        }
    }



    // Tính blueTeamId và redTeamId bằng cách thêm 1000 vào từng ID rồi ghép chuỗi
    const blueTeamId = String(parseInt(bluePlayer1Id) + 1000) + String(parseInt(bluePlayer2Id) + 1000);
    let redTeamId;
    if (redPlayer1Name == "Chấm") {
        redTeamId = redPlayer1Id
    } else if (redPlayer2Name == "Chấm") {
        redTeamId = redPlayer2Id
    }
    else {
        redTeamId = String(parseInt(redPlayer1Id) + 1000) + String(parseInt(redPlayer2Id) + 1000);
    }


    // Tạo trận đấu mới
    const winnerId = parseInt(blueScore) > parseInt(redScore) ? blueTeamId : (parseInt(redScore) > parseInt(blueScore) ? redTeamId : null);
    const maxId = poolData.matchHistory.length > 0
        ? Math.max(...poolData.matchHistory.map(item => parseInt(item.id, 10))) + 1
        : 1;
    const newMatch = {
        id: String(maxId),
        player1Id: blueTeamId,
        score1: parseInt(blueScore),
        player2Id: redTeamId,
        score2: parseInt(redScore),
        winnerId,
        date: new Date().toLocaleDateString('vi-VN'),
        tournamentId: 'Đánh đôi',
        tournamentMatchId: '',
        matchType: '',
    };
    createData('match-history', newMatch);

    // Cập nhật điểm cho Blue team
    addPlayerPoints(bluePlayer1Id, parseInt(blueScore));
    addPlayerPoints(bluePlayer2Id, parseInt(blueScore));
    // console.log(newMatch);


    // Cập nhật điểm cho Red team
    if(redPlayer2Name != "Chấm" && redPlayer1Name != "Chấm"){
        addPlayerPoints(redPlayer1Id, parseInt(redScore));
        addPlayerPoints(redPlayer2Id, parseInt(redScore));
    }

    sessionStorage.removeItem('poolData_matchHistory');
    poolData.matchHistory.push(newMatch);

    // Xóa bộ lọc
    document.getElementById('filter-player1').value = '';
    document.getElementById('filter-player2').value = '';
    document.getElementById('filter-month').value = '';
    document.getElementById('filter-year').value = '';
    document.getElementById('filter-tournament').value = '';

    // Cập nhật bảng lịch sử trận đấu
    renderMatchHistory();

    // Ẩn form và xóa dữ liệu
    addMatchForm.classList.add('hidden');
    document.getElementById('blue-player1').value = '';
    document.getElementById('blue-player2').value = '';
    document.getElementById('blue-score').value = '';
    document.getElementById('red-player1').value = '';
    document.getElementById('red-player2').value = '';
    document.getElementById('red-score').value = '';
    handleRedTeamSelection(); // Reset trạng thái Red team
})


checkAdminAccess();