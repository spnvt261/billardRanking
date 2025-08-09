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

// Hàm lọc dữ liệu
function filterMatches() {
    const player1Id = document.getElementById('filter-player1').value;
    const player2Id = document.getElementById('filter-player2').value;
    const month = document.getElementById('filter-month').value;
    const year = document.getElementById('filter-year').value;
    const tournament = document.getElementById('filter-tournament').value;

    return poolData.matchHistory.filter(match => {
        // Lọc theo player
        let playerMatch = true;
        if (player1Id && player2Id) {
            playerMatch = (
                (match.player1Id == player1Id && match.player2Id == player2Id) ||
                (match.player1Id == player2Id && match.player2Id == player1Id)
            );
        } else if (player1Id) {
            playerMatch = match.player1Id == player1Id || match.player2Id == player1Id;
        } else if (player2Id) {
            playerMatch = match.player1Id == player2Id || match.player2Id == player2Id;
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
    paginatedMatches.forEach(match => {
        const row = document.createElement('tr');
        row.className = 'border-b';
        const player1 = poolData.players.find(u => u.id == match.player1Id)?.name || 'Unknown';
        const player2 = poolData.players.find(u => u.id == match.player2Id)?.name || 'Unknown';
        const player1Class = match.winnerId == match.player1Id ? 'text-green-600' : 'text-red-600';
        const player2Class = match.winnerId == match.player2Id ? 'text-green-600' : 'text-red-600';
        const tournamentName = poolData.tournaments.find(t => t.id == match.tournamentId)?.name || match.tournamentId;
        row.innerHTML = `
            <td class="p-3"><span class="${player1Class}">${player1}</span> ${match.score1} - ${match.score2} <span class="${player2Class}">${player2}</span></td>
            <td class="p-3">${match.date}</td>
            <td class="p-3">${tournamentName}</td>
        `;
        tableBody.appendChild(row);
        // loading.classList.add('hidden');
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
    
    if(paginatedMatches.length==0){
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
    poolData.players
        .filter(player => player.name !== 'Chấm')
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

// Xử lý lưu trận đấu mới
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
    if (!confirm(`Bạn có chắc chắn kết quả là ${player1name} ${score1} - ${score2} ${player2name} là chính xác?`)) {
        return;
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
checkAdminAccess();