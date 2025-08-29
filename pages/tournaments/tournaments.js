import { poolData, createData, updateData } from "../../data.js";
//js cho chọn loại giải đấu
// const document.getElementById("tournament-type") = document.getElementById("tournament-type");
// const document.getElementById("tournament-name") = document.getElementById("tournament-name");
// const document.getElementById("tournament-prize") = document.getElementById("tournament-prize");
// const document.getElementById("selected-players") = document.getElementById("selected-players");


// const document.getElementById("tournament-prize") = document.getElementById("tournament-prize");

function formatNumber(value) {
    return value.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Khi focus thì bỏ "đ" để dễ sửa
//   document.getElementById("tournament-prize").addEventListener("focus", function () {
//     this.value = this.value.replace(/[^\d]/g, ""); // chỉ giữ số
//   });

// Khi blur thì format lại có "đ"
document.getElementById("tournament-prize").addEventListener("blur", function () {
    let raw = this.value.replace(/\D/g, "");
    if (raw !== "") {
        this.value = formatNumber(raw) + "đ";
    }
});
let selectedPlayers = [];
// Hàm định dạng ngày từ Date object sang DD/MM/YYYY
function formatDateVN(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// Kiểm tra quyền admin
function checkAdminAccess() {
    const adminKey = localStorage.getItem('adminKey');
    // console.log('Admin Key:', adminKey);
    const adminElements = [
        document.getElementById('add-tournament-btn'),
        document.getElementById('logout-btn')
    ];
    adminElements.forEach(btn => {
        if (!btn) {
            // console.warn(`Element ${btn?.id} not found.`);
            return;
        }
        if (adminKey === 'admin_access') {
            btn.classList.remove('hidden');
            // console.log(`Removed hidden from ${btn.id}`);
        } else {
            btn.classList.add('hidden');
            // console.log(`Added hidden to ${btn.id}`);
        }
    });
}

// Điền danh sách người chơi vào select
async function populatePlayerSelect() {
    // await initializePoolData();
    const select = document.getElementById('tournament-players');
    select.innerHTML = '<option value="">-- Select a player --</option>';
    poolData.players.forEach(player => {
        if (player.name == "Chấm") {
            return;
        }
        if (!selectedPlayers.includes(player.id)) {
            const option = document.createElement('option');
            option.value = player.id;
            option.textContent = player.name;
            select.appendChild(option);
        }
    });
}

let currentPage = 1;
const pageSize = 6;
async function renderTournaments() {
    const grid = document.getElementById('tournaments-grid');
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    grid.innerHTML = '';
    loading.classList.remove('hidden');
    error.classList.add('hidden');

    try {
        if (!poolData.tournaments || poolData.tournaments.length === 0) {
            grid.innerHTML = '<p class="text-gray-600 col-span-full text-center">No tournaments found.</p>';
            return;
        }

        // Lọc chỉ lấy id < 1000 rồi sắp xếp giải mới nhất trước
        const sortedTournaments = poolData.tournaments
            .filter(t => parseInt(t.id, 10) < 1000)
            .sort((a, b) => b.id - a.id);

        // Tính phân trang
        const totalPages = Math.ceil(sortedTournaments.length / pageSize);
        if (currentPage > totalPages) currentPage = totalPages || 1;

        const startIndex = (currentPage - 1) * pageSize;
        const pageTournaments = sortedTournaments.slice(startIndex, startIndex + pageSize);

        // Render card cho các giải trong page hiện tại
        pageTournaments.forEach(tournament => {
            const card = document.createElement('div');
            card.className = 'bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow';
            const participants = tournament.players.length;
            const winner = tournament.top1Id
                ? poolData.players.find(p => p.id === tournament.top1Id)?.name || 'Unknown'
                : 'TBD';
            const playerNames = tournament.players
                .map(id => poolData.players.find(p => p.id == id)?.name)
                .join(', ');

            card.innerHTML = `
                <h3 class="text-xl font-semibold mb-2">
                    ${tournament.name} 
                    ${tournament.name !== 'Đền'
                    ? `<img src="https://cdn-icons-png.freepik.com/512/16853/16853146.png" alt="Cup" style="width:24px;display:inline-block;margin-left:5px;vertical-align:middle;">`
                    : `(${playerNames})`}
                    <span style="${tournament.status === 'Đang diễn ra' ? 'color: green' : 'display:none'}">
                        ${tournament.status}
                    </span>
                </h3>
                <p class="text-gray-600">Date: ${tournament.date}</p>
                <p class="text-gray-600">Location: ${tournament.location}</p>
                <p class="text-gray-600 truncate-150" title="${participants}">Participants: ${participants}</p>
                <p class="text-gray-600">${(tournament.name === 'Đền') ? 'Một điểm:' : 'Total Prize:'} ${tournament.prize}</p>
                <p class="text-gray-600">Winner: ${winner}</p>
                <a href="${(tournament.name === 'Đền' && tournament.status === 'Đang diễn ra')
                    ? `#/tourDen_ongoing?id=${tournament.id}`
                    : `#/tournament_details?id=${tournament.id}`}"
                    class="text-blue-600 hover:underline mt-2 inline-block">
                    Details
                </a>
            `;
            grid.appendChild(card);
        });

        // Render pagination buttons
        const pagination = document.getElementById('tournaments-pagination');
        pagination.innerHTML = '';
        for (let i = 1; i <= totalPages; i++) {
            const btn = document.createElement('button');
            btn.textContent = i;
            btn.className =
                `px-3 py-1 border rounded mx-1 ${i === currentPage
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300'
                }`;
            btn.addEventListener('click', () => {
                currentPage = i;
                renderTournaments();
            });
            pagination.appendChild(btn);
        }
    } catch (err) {
        error.classList.remove('hidden');
        error.textContent = `Error: ${err.message}`;
    } finally {
        loading.classList.add('hidden');
    }
}



// Khởi tạo trang
// document.addEventListener('DOMContentLoaded', () => {

//     renderTournaments().catch(error => {
//         console.error('Error rendering tournaments:', error);
//         document.getElementById('loading').classList.add('hidden');
//         document.getElementById('error').classList.remove('hidden');
//         document.getElementById('error').textContent = `Error: ${error.message}`;
//     });
//     checkAdminAccess();
// });
// Lấy phần tử input
// const document.getElementById('tournament-date') = document.getElementById('tournament-date');

// Gán giá trị ngày hiện tại theo định dạng 'vi-VN' (dd/mm/yyyy)
export function render() {
    renderTournaments();
    checkAdminAccess();
    document.getElementById("tournament-prize").addEventListener("input", function () {
        // Lấy số
        let raw = this.value.replace(/\D/g, "");

        if (raw === "") {
            this.value = "";
            return;
        }

        // Format bằng dấu phẩy
        this.value = formatNumber(raw) + "đ";

        // console.log(document.getElementById("tournament-prize").value);

    });
    document.getElementById("tournament-type").addEventListener("change", function () {
        if (this.value === "banden") {
            // Bắn đền
            document.getElementById("tournament-name").value = "Đền";
            document.getElementById("tournament-name").disabled = true;
            document.getElementById("tournament-prize").placeholder = "Bao tiền một điểm";
            document.getElementById("tournament-name").classList.add("bg-gray-200");
        } else {
            // Giải đấu
            document.getElementById("tournament-name").value = "";
            document.getElementById("tournament-name").disabled = false;
            document.getElementById("tournament-prize").placeholder = "Prize";
            document.getElementById("tournament-name").classList.remove("bg-gray-200");
        }
    });
    // Xử lý thêm giải đấu
    document.getElementById('add-tournament-btn')?.addEventListener('click', () => {
        document.getElementById('tournament-date').value = new Date().toLocaleDateString('vi-VN');
        selectedPlayers = [];
        document.getElementById('selected-players').innerHTML = '';
        populatePlayerSelect();
        document.getElementById('add-tournament-form').classList.remove('hidden');
    });

    document.getElementById('add-player-btn')?.addEventListener('click', () => {
        const playerId = document.getElementById('tournament-players').value;
        if (!playerId) {
            alert('Please select a player.');
            return;
        }
        if (!selectedPlayers.includes(playerId)) {
            selectedPlayers.push(playerId);
            const playerName = poolData.players.find(p => p.id === playerId)?.name || 'Unknown';
            const li = document.createElement('li');
            li.textContent = playerName;
            document.getElementById('selected-players').appendChild(li);
            populatePlayerSelect();
        }
    });

    document.getElementById('create-tournament').addEventListener('click', async () => {
        // if (document.getElementById("tournament-type").value === "banden") {
        //     const playerCount = document.getElementById("selected-players").querySelectorAll("li").length;
        //     if (playerCount !== 3) {
        //         alert("Bắn đền chỉ tạo khi có đúng 3 người chơi!");
        //         return;
        //     }
        // }
        const name = document.getElementById('tournament-name').value;
        const date = document.getElementById('tournament-date').value;
        const location = document.getElementById('tournament-location').value;
        const top1Point = document.getElementById('tournament-top1-points').value;
        const prize = document.getElementById('tournament-prize').value.trim() == '' ? 'N/A' : document.getElementById('tournament-prize').value;
        const top2Point = document.getElementById('tournament-top2-points').value;
        const otherPoint = document.getElementById('tournament-other-points').value;

        // Kiểm tra dữ liệu hợp lệ
        if (!name || !date || !location || !top1Point || !top2Point || !otherPoint || isNaN(top1Point) || isNaN(top2Point) || isNaN(otherPoint) || selectedPlayers.length < 2) {
            alert('Please fill in all fields with valid data and add at least 2 players.');
            return;
        }

        // Tạo giải đấu mới
        const validIds = poolData.tournaments
            .map(item => parseInt(item.id, 10))
            .filter(id => !isNaN(id) && id < 1000);

        const maxId = validIds.length > 0
            ? Math.max(...validIds) + 1
            : 1; // Nếu mảng rỗng thì bắt đầu từ 1
        const newTournament = {
            id: String(maxId),
            name,
            date: new Date().toLocaleDateString('vi-VN'),
            location,
            prize,
            players: [...selectedPlayers],
            top1_point: parseInt(top1Point),
            top2_point: parseInt(top2Point),
            other_point: parseInt(otherPoint),
            top1Id: '',
            top2Id: '',
            status: 'Đang diễn ra'
        };
        console.log(newTournament);

        createData('tournaments', newTournament);
        poolData.tournaments.push(newTournament);

        // Cập nhật lại bảng giải đấu
        renderTournaments();

        // Ẩn form và xóa dữ liệu
        document.getElementById('add-tournament-form').classList.add('hidden');
        document.getElementById('tournament-name').value = '';
        document.getElementById('tournament-date').value = '';
        document.getElementById('tournament-location').value = '';
        document.getElementById('tournament-top1-points').value = '';
        document.getElementById('tournament-prize').value = '';
        document.getElementById('tournament-top2-points').value = '';
        document.getElementById('tournament-other-points').value = '';
        selectedPlayers = [];
        // renderSelectedPlayers();
    });

    document.getElementById('cancel-tournament')?.addEventListener('click', () => {
        document.getElementById('add-tournament-form').classList.add('hidden');
        document.getElementById('tournament-name').value = '';
        document.getElementById('tournament-date').value = '';
        document.getElementById('tournament-location').value = '';
        document.getElementById('tournament-prize').value = '';
        document.getElementById('tournament-top1-points').value = '';
        document.getElementById('tournament-top2-points').value = '';
        document.getElementById('tournament-other-points').value = '';
        document.getElementById('selected-players').innerHTML = '';
        selectedPlayers = [];
    });
}
