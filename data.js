// Global data object
 const poolData = {
  players: [],
  tournaments: [],
  matchHistory: [],
  history_point: [],
  history_points_den: []
};

const adminKey = localStorage.getItem("adminKey");

// API config
// const API_BASE_URL = "https://tabfpepqvdcecwnewpfx.supabase.co/rest/v1/";
// const PUBLISHABLE_KEY = "sb_publishable__7iV7NXURl8Jo9GKORvoFg_3N1Mvs4G";
// const SECRET_KEY ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhYmZwZXBxdmRjZWN3bmV3cGZ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDY4NDg0MywiZXhwIjoyMDcwMjYwODQzfQ.bIsr5yGL7DEbBoDHxDeuZssIv1FKVDcHvVGxK9peODs";

// test sever
const API_BASE_URL = 'https://sjrexafyojloinbbraye.supabase.co/rest/v1/';
const PUBLISHABLE_KEY = 'sb_publishable_f_OIbYVcEvNY2AbbmuArGg_onyUF8aR';
const SECRET_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqcmV4YWZ5b2psb2luYmJyYXllIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDczMDQ1NywiZXhwIjoyMDcwMzA2NDU3fQ.tvWitEsTEAArKFT1byvNZ7wiO4j8TfHTl58ou_j042w';

// ---------- API helpers ----------
async function fetchData(tableName) {
  try {
    const response = await fetch(`${API_BASE_URL}${tableName}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        apikey: PUBLISHABLE_KEY,
        Authorization: `Bearer ${SECRET_KEY}`,
      },
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
  let attempt = 0;
  let maxRetries = 20;
  while (attempt < maxRetries) {
    const response = await fetch(`${API_BASE_URL}${tableName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SECRET_KEY,
        Authorization: `Bearer ${SECRET_KEY}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      return await response.json(); // thành công
    }

    if (response.status === 409) {
      // Lỗi trùng khóa chính → tăng id rồi thử lại
      console.warn(
        `Conflict detected for id=${data.id}, trying with id=${parseInt(data.id, 10) + 1}`
      );
      data.id = String(parseInt(data.id, 10) + 1);
      attempt++;
      continue;
    }

    // Nếu là lỗi khác (không phải 409) thì dừng luôn
    const errorText = await response.text();
    throw new Error(
      `Failed to create ${tableName}: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  throw new Error(
    `Failed to create ${tableName} after ${maxRetries} retries due to conflicts.`
  );
}


async function updateData(tableName, id, data) {
  try {
    const response = await fetch(`${API_BASE_URL}${tableName}?id=eq.${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        apikey: SECRET_KEY,
        Authorization: `Bearer ${SECRET_KEY}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`Failed to update ${tableName} with id ${id}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error updating ${tableName}:`, error);
    throw error;
  }
}

async function deleteData(tableName, id) {
  try {
    const response = await fetch(`${API_BASE_URL}${tableName}?id=eq.${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        apikey: SECRET_KEY,
        Authorization: `Bearer ${SECRET_KEY}`,
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to delete ${tableName} with id ${id}: ${response.statusText}`);
    }
    return true;
  } catch (error) {
    console.error(`Error deleting ${tableName}:`, error);
    throw error;
  }
}
function lockToLandscape() {
  if (window.orientation !== 90 && window.orientation !== -90) {
    document.body.innerHTML = `
      <div style="display:flex;justify-content:center;align-items:center;
                  height:100vh;width:100vw;font-size:1.5rem;text-align:center;">
        Vui lòng xoay ngang để sử dụng Score Counter 📱↔️
      </div>`;
  }
}

function isInStandaloneMode() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

if (isInStandaloneMode()) {
  localStorage.setItem('adminKey', 'admin_access');
}

 async function initializePoolData() {
  try {
    // console.log("⏳ Loading pool data...");

    const [players, tournaments, matchHistory, historyPoint, historyPointsDen] =
      await Promise.all([
        fetchData("players"),
        fetchData("tournaments"),
        fetchData("match-history"),
        fetchData("history_point"),
        fetchData("history_points_den"),
      ]);

    poolData.players = players;
    poolData.tournaments = tournaments;
    poolData.matchHistory = matchHistory;
    poolData.history_point = historyPoint;
    poolData.history_points_den = historyPointsDen;

    // Tính điểm cho từng player
    for (const player of poolData.players) {
      const total = poolData.history_point
        .filter(h => parseInt(h.playerId) === parseInt(player.id))
        .reduce((sum, h) => sum + parseInt(h.point), 0);
      player.points = total;
    }

    // console.log("✅ Pool data ready", poolData);

    // Thông báo cho app.js là data đã sẵn sàng
    window.dispatchEvent(new Event("poolDataReady"));
  } catch (err) {
    console.error("❌ Error init poolData:", err);
  }
}

// gọi ngay khi load file data.js
initializePoolData();

// ---------- Business Logic ----------
async function addPlayerPoints(playerId, score, tournamentId, matchId) {
  if (!playerId || typeof score !== "number" || isNaN(score) || score < 0) {
    throw new Error("Invalid playerId or score. Score must be a non-negative number.");
  }

  const player = poolData.players.find((p) => p.id === playerId);
  if (!player) throw new Error(`Player with ID ${playerId} not found.`);

  const maxId =
    poolData.history_point.length > 0
      ? Math.max(...poolData.history_point.map((item) => parseInt(item.id, 10))) + 1
      : 1;

  const newDataHistoryPoint = {
    id: maxId,
    playerId: parseInt(player.id, 10),
    point: score,
    tournamentId: tournamentId,
    matchId: matchId,
    date: new Date().toLocaleDateString("vi-VN"),
  };

  poolData.history_point.push(newDataHistoryPoint);

  const newPoints = player.points + score;
  try {
    await createData("history_point", newDataHistoryPoint);
    player.points = newPoints;
    return { playerId, newPoints };
  } catch (error) {
    throw new Error(`Failed to update points for player ${playerId}: ${error.message}`);
  }
}

function checkAdminAccess() {
  if (adminKey) {
    document.getElementById("add-match-btn")?.classList.remove("hidden");
    document.getElementById("score-counter-btn")?.classList.remove("hidden");
    document.getElementById("add-player-btn")?.classList.remove("hidden");
    document.getElementById("add-tournament-btn")?.classList.remove("hidden");

    document.getElementById("add-action-section")?.classList.remove("hidden");
    document.getElementById("edit-point")?.classList.remove("hidden");
    document.getElementById("finish-rack")?.classList.remove("hidden");
  }
}

export {
  poolData,
  createData,
  updateData,
  initializePoolData,
  checkAdminAccess,
  addPlayerPoints
}