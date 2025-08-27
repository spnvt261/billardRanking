import { poolData, createData, updateData, checkAdminAccess } from "../../data.js"; // nhớ export từ data.js
// Toggle Image URL khi chọn Friend / Guest
document.querySelectorAll('input[name="player-type"]').forEach(radio => {
    radio.addEventListener('change', () => {
        const imageInputContainer = document.getElementById('image-input-container');
        if (document.querySelector('input[name="player-type"]:checked').value === 'guest') {
            imageInputContainer.classList.add('hidden');
        } else {
            imageInputContainer.classList.remove('hidden');
        }
        // console.log(document.querySelector('input[name="player-type"]:checked').value);

    });
});
// renderPage();
// Hiển thị bảng xếp hạng
export async function renderRankings() {

    // await initializePoolData();
    const tableBody = document.getElementById('rankings-table');
    const loading = document.getElementById('loading');
    tableBody.innerHTML = '';

    try {
        if (!poolData.players || poolData.players.length === 0) {
            loading.classList.remove('hidden');
            return;
        }
        loading.classList.add('hidden');

        // Tách player thành 2 nhóm: Friend và Guest
        let friends = poolData.players.filter(p => !p.name.includes("(Khách)"));
        let guests = poolData.players.filter(p => p.name.includes("(Khách)"));

        // Sắp xếp friends theo điểm giảm dần
        friends.sort((a, b) => b.points - a.points);
        // Guest cũng có thể sắp theo điểm nếu muốn, hoặc giữ nguyên thứ tự
        guests.sort((a, b) => b.points - a.points);

        let indexShow = 0;

        // Render Friends
        friends.forEach(player => {
            if (player.name === "Chấm") return;
            indexShow++;

            let rankDisplay = `${indexShow}`;
            if (indexShow === 1) {
                rankDisplay = `<div style="background-color: #FFD700; color: white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-weight: bold;">${indexShow}</div>`;
            } else if (indexShow === 2) {
                rankDisplay = `<div style="background-color: #C0C0C0; color: white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-weight: bold;">${indexShow}</div>`;
            } else if (indexShow === 3) {
                rankDisplay = `<div style="background-color: #CD7F32; color: white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-weight: bold;">${indexShow}</div>`;
            }

            const imageSrc = (!player.images || player.images.trim() == '')
                ? '../images/default.jpg' : player.images;

            const row = document.createElement('tr');
            row.className = 'border-b';
            row.innerHTML = `
                <td class="p-3">${rankDisplay}</td>
                <td class="p-3 flex items-center space-x-2">
                    <a href="#/player_details.html?id=${player.id}" class="text-black underline hover:text-blue p-3 flex items-center space-x-2">
                        <div class="relative w-12 h-16" style="aspect-ratio: 3/4;">
                            <img src="${imageSrc}" alt="${player.name}" class="absolute inset-0 w-full h-full object-cover rounded">
                        </div>
                        <span>${player.name}</span>
                    </a>
                </td>
                <td class="p-3">${player.points}</td>
            `;
            tableBody.appendChild(row);
        });

        // Render Guests (Khách)
        guests.forEach(player => {
            const imageSrc = (!player.images || player.images.trim() == '')
                ? '../images/default.jpg' : player.images;

            const row = document.createElement('tr');
            row.className = 'border-b bg-gray-200'; // Nền xám
            row.innerHTML = `
                <td class="p-3 text-center">-</td>
                <td class="p-3 flex items-center space-x-2">
                    <a href="#/player_details.html?id=${player.id}" class="text-black underline hover:text-blue p-3 flex items-center space-x-2">
                        <div class="relative w-12 h-16" style="aspect-ratio: 3/4;">
                            <img src="${imageSrc}" alt="${player.name}" class="absolute inset-0 w-full h-full object-cover rounded">
                        </div>
                        <span>${player.name}</span>
                    </a>
                </td>
                <td class="p-3">${player.points}</td>
            `;
            tableBody.appendChild(row);
        });

    } finally {
        // loading.classList.add('hidden');
    }
}


// Gọi hàm render khi tải trang
renderRankings();

// Xử lý hiển thị form thêm người chơi
// const addPlayerBtn = document.getElementById('add-player-btn');
const addPlayerForm = document.getElementById('add-player-form');
// Xử lý lưu người chơi mới
// document.getElementById('save-player').addEventListener('click', () => {
//     let name = document.getElementById('player-name').value;
//     const image = document.getElementById('player-image').value;
//     const playerType = document.querySelector('input[name="player-type"]:checked').value;

//     if (playerType == "guest") {
//         name = "(Khách)" + name;
//     }

//     // Kiểm tra dữ liệu hợp lệ
//     if (!name) {
//         alert('Please fill in the Name field.');
//         return;
//     }

//     // Tạo người chơi mới
//     const maxId = poolData.players.length > 0
//         ? Math.max(...poolData.players.map(item => parseInt(item.id, 10))) + 1
//         : 1; // Nếu mảng rỗng, bắt đầu từ 1
//     const newPlayer = {
//         id: String(maxId),
//         name,
//         points: 0,
//         images: image.trim() == '' ? 'https://cdn-icons-png.freepik.com/512/8428/8428718.png' : image.trim()
//     };
//     createData('players', newPlayer)
//     poolData.players.push(newPlayer);

//     // Cập nhật lại bảng xếp hạng
//     renderRankings();

//     // Ẩn form và xóa dữ liệu
//     addPlayerForm.classList.add('hidden');
//     document.getElementById('player-name').value = '';
//     document.getElementById('player-image').value = '';
// });

// Xử lý hủy form
// document.getElementById('cancel-player').addEventListener('click', () => {
//     addPlayerForm.classList.add('hidden');
//     document.getElementById('player-name').value = '';
//     document.getElementById('player-image').value = '';
// });
export function render() {
    renderRankings();
    checkAdminAccess();
    const addPlayerBtn = document.getElementById('add-player-btn');
    if (addPlayerBtn) {
        addPlayerBtn.addEventListener('click', () => {
            document.getElementById('add-player-form').classList.toggle('hidden');
        });
    }
    const savePlayerBtn = document.getElementById('save-player');
    if (savePlayerBtn) {
        savePlayerBtn.addEventListener('click', () => {
            let name = document.getElementById('player-name').value;
            const image = document.getElementById('player-image').value;
            const playerType = document.querySelector('input[name="player-type"]:checked').value;

            if (playerType == "guest") {
                name = "(Khách)" + name;
            }

            // Kiểm tra dữ liệu hợp lệ
            if (!name) {
                alert('Please fill in the Name field.');
                return;
            }

            // Tạo người chơi mới
            const maxId = poolData.players.length > 0
                ? Math.max(...poolData.players.map(item => parseInt(item.id, 10))) + 1
                : 1; // Nếu mảng rỗng, bắt đầu từ 1
            const newPlayer = {
                id: String(maxId),
                name,
                points: 0,
                images: image.trim() == '' ? 'https://cdn-icons-png.freepik.com/512/8428/8428718.png' : image.trim()
            };
            createData('players', newPlayer)
            poolData.players.push(newPlayer);

            // Cập nhật lại bảng xếp hạng
            renderRankings();

            // Ẩn form và xóa dữ liệu
            addPlayerForm.classList.add('hidden');
            document.getElementById('player-name').value = '';
            document.getElementById('player-image').value = '';
        });
    }

    const cancelPlayerBtn = document.getElementById('cancel-player');
    if (cancelPlayerBtn) {
        cancelPlayerBtn.addEventListener('click', () => {
            document.getElementById('add-player-form').classList.add('hidden');
            document.getElementById('player-name').value = '';
        });
    }

}