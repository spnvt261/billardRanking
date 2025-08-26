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

    poolData.tournaments.forEach(t => {
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

// Gọi hàm
initializePoolData().then(() => {
  // console.log(poolData.players);
  initPlayersData();
  updatePlayersElo(playersData1, poolData.history_point);
  updatePlayersMatches(
    playersData1,
    { matchHistory: poolData.matchHistory, players: poolData.players }
  );
  updatePlayersRacks(playersData1, { matchHistory: poolData.matchHistory, players: poolData.players });
  updatePlayersTournamentStats(playersData1, { tournaments: poolData.tournaments });
  updatePlayersSoCham(playersData1, { matchHistory: poolData.matchHistory, players: poolData.players });
})


// console.log(playersData1);
