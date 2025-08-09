/*
 * HƯỚNG DẪN TÍCH HỢP LOADING INDICATOR TRONG HTML:
 * - Trong file HTML (như rankings.html), thêm phần tử loading:
 *   ```html
 *   <div id="loading" class="text-center text-gray-600">Loading data...</div>
 *   ```
 * - Lắng nghe sự kiện 'data-loading' và 'data-loaded':
 *   ```javascript
 *   window.addEventListener('data-loading', () => {
 *       document.getElementById('loading').classList.remove('hidden');
 *   });
 *   window.addEventListener('data-loaded', () => {
 *       document.getElementById('loading').classList.add('hidden');
 *   });
 *   ```
 * - Gọi await initializePoolData() trong hàm render:
 *   ```javascript
 *   async function renderPage() {
 *       await initializePoolData();
 *       // Hiển thị poolData.players, ...
 *   }
 *   renderPage();
 *   ```
 * - Đảm bảo HTML có logic xử lý poolData rỗng hoặc lỗi (như trong rankings.html).
 * testKey: 
 */

const poolData = {
    players: [],
    tournaments: [],
    matchHistory: [],
    history_point: []
};
const adminKey = localStorage.getItem('adminKey');

// const API_BASE_URL = 'https://tabfpepqvdcecwnewpfx.supabase.co/';
// const API_KEY = 'sb_secret_nqaF2Op0gKZ5b5Zh3wDBeg_UpbGY8rF';
// const SESSION_STORAGE_KEYS = {
//     players: 'poolData_players',
//     tournaments: 'poolData_tournaments',
//     matchHistory: 'poolData_matchHistory',
//     isInitialLoad: 'isInitialLoad'
// };

const API_BASE_URL = 'https://tabfpepqvdcecwnewpfx.supabase.co/rest/v1/';
const PUBLISHABLE_KEY = 'sb_publishable__7iV7NXURl8Jo9GKORvoFg_3N1Mvs4G';
const SECRET_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhYmZwZXBxdmRjZWN3bmV3cGZ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDY4NDg0MywiZXhwIjoyMDcwMjYwODQzfQ.bIsr5yGL7DEbBoDHxDeuZssIv1FKVDcHvVGxK9peODs';

// const API_BASE_URL = 'https://sjrexafyojloinbbraye.supabase.co/rest/v1/';
// const PUBLISHABLE_KEY = 'sb_publishable_f_OIbYVcEvNY2AbbmuArGg_onyUF8aR';
// const SECRET_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqcmV4YWZ5b2psb2luYmJyYXllIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDczMDQ1NywiZXhwIjoyMDcwMzA2NDU3fQ.tvWitEsTEAArKFT1byvNZ7wiO4j8TfHTl58ou_j042w';


const SESSION_STORAGE_KEYS = {
    players: 'poolData_players',
    tournaments: 'poolData_tournaments',
    matchHistory: 'poolData_matchHistory',
    history_point: 'poolData_historyPoint',
    isInitialLoad: 'isInitialLoad'
};

async function fetchData(tableName) {
    try {
        const response = await fetch(`${API_BASE_URL}${tableName}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'apikey': PUBLISHABLE_KEY,
                'Authorization': `Bearer ${SECRET_KEY}`
            }
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch ${tableName}: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error fetching ${tableName}:`, error);
        return [];
    }
}

async function createData(tableName, data) {
    try {
        const response = await fetch(`${API_BASE_URL}${tableName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SECRET_KEY,
                'Authorization': `Bearer ${SECRET_KEY}`,
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            throw new Error(`Failed to create ${tableName}: ${response.statusText}`);
        }
        const newData = await response.json();
        sessionStorage.removeItem(SESSION_STORAGE_KEYS[tableName]);
        sessionStorage.removeItem(SESSION_STORAGE_KEYS.isInitialLoad);
        return newData;
    } catch (error) {
        console.error(`Error creating ${tableName}:`, error);
        throw error;
    }
}

async function updateData(tableName, id, data) {
    try {
        const response = await fetch(`${API_BASE_URL}${tableName}?id=eq.${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SECRET_KEY,
                'Authorization': `Bearer ${SECRET_KEY}`,
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            throw new Error(`Failed to update ${tableName} with id ${id}: ${response.statusText}`);
        }
        const updatedData = await response.json();
        sessionStorage.removeItem(SESSION_STORAGE_KEYS[tableName]);
        sessionStorage.removeItem(SESSION_STORAGE_KEYS.isInitialLoad);
        return updatedData;
    } catch (error) {
        console.error(`Error updating ${tableName}:`, error);
        throw error;
    }
}

async function deleteData(tableName, id) {
    try {
        const response = await fetch(`${API_BASE_URL}${tableName}?id=eq.${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SECRET_KEY,
                'Authorization': `Bearer ${SECRET_KEY}`
            }
        });
        if (!response.ok) {
            throw new Error(`Failed to delete ${tableName} with id ${id}: ${response.statusText}`);
        }
        sessionStorage.removeItem(SESSION_STORAGE_KEYS[tableName]);
        sessionStorage.removeItem(SESSION_STORAGE_KEYS.isInitialLoad);
        return true;
    } catch (error) {
        console.error(`Error deleting ${tableName}:`, error);
        throw error;
    }
}

async function initializePoolData() {
    const isInitialLoad = sessionStorage.getItem(SESSION_STORAGE_KEYS.isInitialLoad)

    try {

        // Phát sự kiện bắt đầu tải dữ liệu
        window.dispatchEvent(new CustomEvent('data-loading'));

        // checkAdminAccess();
        // Kiểm tra SessionStorage
        const storedPlayers = sessionStorage.getItem(SESSION_STORAGE_KEYS.players);
        const storedTournaments = sessionStorage.getItem(SESSION_STORAGE_KEYS.tournaments);
        const storedMatchHistory = sessionStorage.getItem(SESSION_STORAGE_KEYS.matchHistory);
        const storedHistoryPoint = sessionStorage.getItem(SESSION_STORAGE_KEYS.history_point);


        // Khởi tạo dữ liệu từ SessionStorage nếu không rỗng
        let playersData = storedPlayers ? JSON.parse(storedPlayers) : null;
        let tournamentsData = storedTournaments ? JSON.parse(storedTournaments) : null;
        let matchHistoryData = storedMatchHistory ? JSON.parse(storedMatchHistory) : null;
        let historyPointData = storedHistoryPoint ? JSON.parse(storedHistoryPoint) : null;


        // Kiểm tra dữ liệu rỗng và gọi API nếu cần
        const fetchPromises = [];
        if (!playersData || playersData.length === 0) {
            fetchPromises.push(fetchData('players').then(data => {
                playersData = data;
                sessionStorage.setItem(SESSION_STORAGE_KEYS.players, JSON.stringify(data));
            }));
        }
        if (!tournamentsData || tournamentsData.length === 0) {
            fetchPromises.push(fetchData('tournaments').then(data => {
                tournamentsData = data;
                sessionStorage.setItem(SESSION_STORAGE_KEYS.tournaments, JSON.stringify(data));
            }));
        }
        if (!matchHistoryData || matchHistoryData.length === 0) {
            fetchPromises.push(fetchData('match-history').then(data => {
                matchHistoryData = data;
                sessionStorage.setItem(SESSION_STORAGE_KEYS.matchHistory, JSON.stringify(data));
            }));
        }
        if (!historyPointData || historyPointData.length === 0) {
            fetchPromises.push(fetchData('history_point').then(data => {
                historyPointData = data;
                sessionStorage.setItem(SESSION_STORAGE_KEYS.history_point, JSON.stringify(data));
            }));
        }
        // Chờ tất cả API hoàn tất (nếu có)
        if (fetchPromises.length > 0) {
            await Promise.all(fetchPromises);
        }

        // Gán dữ liệu vào poolData
        poolData.players = playersData || [];
        poolData.tournaments = tournamentsData || [];
        poolData.matchHistory = matchHistoryData || [];
        poolData.history_point = historyPointData || []
        if (poolData.players) {
            
            // Duyệt qua từng người chơi trong poolData.players
            for (const player of poolData.players) {
                // Tính tổng điểm từ history_point cho playerId tương ứng
                const totalPoints = poolData.history_point
                    .filter(history => parseInt(history.playerId) === parseInt(player.id))
                    .reduce((sum, history) => sum + parseInt(history.point), 0);
                // console.log(totalPoints);
                // console.log(player);
                
                player.points = totalPoints;
                // console.log(player);
                
            }
        }
        // Phát sự kiện hoàn tất tải dữ liệu
        window.dispatchEvent(new CustomEvent('data-loaded'));
        // if(isInitialLoad == null){
        //     console.log(1);

        //     // load = false;
        //     sessionStorage.setItem(SESSION_STORAGE_KEYS.isInitialLoad, JSON.stringify("1"));
        //     window.location.assign(window.location.href);
        //     // setTimeout(1000)

        // }
    } catch (error) {
        console.error('Error initializing poolData:', error);
        // Phát sự kiện lỗi tải dữ liệu
        window.dispatchEvent(new CustomEvent('data-loaded', { detail: { error: error.message } }));
    }
    if (isInitialLoad == null) {
        console.log(1);

        // load = false;
        sessionStorage.setItem(SESSION_STORAGE_KEYS.isInitialLoad, JSON.stringify("1"));
        window.location.assign(window.location.href);

        // setTimeout(1000)

    }


}

// Gọi hàm khởi tạo ngay khi file được tải
initializePoolData().catch(error => {
    console.error('Error initializing poolData:', error);
    window.dispatchEvent(new CustomEvent('data-loaded', { detail: { error: error.message } }));
});

async function addPlayerPoints(playerId, score) {
    if (!playerId || typeof score !== 'number' || isNaN(score) || score < 0) {
        throw new Error('Invalid playerId or score. Score must be a non-negative number.');
    }

    // await initializePoolData(); // Đảm bảo poolData được khởi tạo

    const player = poolData.players.find(p => p.id === playerId);
    if (!player) {
        throw new Error(`Player with ID ${playerId} not found.`);
    }
    const maxId = poolData.history_point.length > 0
        ? Math.max(...poolData.history_point.map(item => parseInt(item.id, 10))) + 1
        : 3; // Nếu mảng rỗng, bắt đầu từ 1
    // console.log(Math.max(...poolData.history_point.map(item => parseInt(item.id, 10))));

    const newDataHistoryPoint = {
        id: maxId,
        playerId: parseInt(player.id, 10),
        point: score,
        date: new Date().toLocaleDateString('vi-VN')
    }
    // console.log(newDataHistoryPoint);
    poolData.history_point.push(newDataHistoryPoint);

    const newPoints = player.points + score;
    try {
        await updateData('players', playerId, { points: newPoints });
        await createData('history_point', newDataHistoryPoint);
        player.points = newPoints; // Cập nhật poolData.players cục bộ
        return { playerId, newPoints };
    } catch (error) {
        throw new Error(`Failed to update points for player ${playerId}: ${error.message}`);
    }
}
function checkAdminAccess() {
    // const adminKey = localStorage.getItem('adminKey');
    // console.log(adminKey);

    if (adminKey) {
        document.getElementById('add-match-btn')?.classList.remove('hidden');
        document.getElementById('add-player-btn')?.classList.remove('hidden');
        document.getElementById('add-tournament-btn')?.classList.remove('hidden');
    }
}

function loadData() {
    sessionStorage.clear();
    initializePoolData();
}
