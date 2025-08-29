import { poolData, createData, updateData, checkAdminAccess, addPlayerPoints } from "../../data.js"; // nhớ export từ data.js
export async function render({ id }) {

    // --- Lấy tournamentId từ URL ---
    //Link {
    //     1000: race to ...
    //     2000: player1Id
    //     3000: player1TeamateId
    //     4000: player2Id
    //     5000: player2TeamateId
    //     60000: tournamentId
    // }
    function parseIdsFromUrl(rawId) {
        if (!rawId) {
            console.error("Không tìm thấy id trên URL");
            return null;
        }

        // Tách parts (mỗi 4 ký tự, riêng cuối cùng là 5 ký tự)
        const parts = [];
        for (let i = 0; i < rawId.length;) {
            if (i + 7 === rawId.length) {
                parts.push(rawId.slice(i, i + 7));
                break;
            } else {
                parts.push(rawId.slice(i, i + 4));
                i += 4;
            }
        }

        // Map keyCode → fieldName
        const keyMap = {
            1000: "raceTo",
            2000: "player1Id",
            3000: "player1TeamateId",
            4000: "player2Id",
            5000: "player2TeamateId",
            6000: "tournamentIdToSave",
            9000000: "tournamentId"
        };

        // Kết quả mặc định
        const ids = {
            raceTo: null,
            player1Id: null,
            player1TeamateId: null,
            player2Id: null,
            player2TeamateId: null,
            tournamentId: null,
            tournamentIdToSave: null
        };

        // Gán giá trị dựa trên prefix
        parts.forEach(p => {
            const num = Number(p);
            if (num >= 9000000) {
                ids[keyMap[9000000]] = String(num - 9000000);
            } else {
                const prefix = Math.floor(num / 1000) * 1000; // lấy 1000, 2000, ...
                if (keyMap[prefix]) {
                    if (prefix === 1000) {
                        ids[keyMap[prefix]] = num - prefix; // raceTo → int
                    } else {
                        ids[keyMap[prefix]] = String(num - prefix); // các id khác → string
                    }
                }
            }
        });

        return ids;
    }

    // let rawId = "100320043002400150039000005"
    const listId = parseIdsFromUrl(id)
    // console.log(listId);

    const tournamentId = listId.tournamentId;
    const tournament = poolData.tournaments.find(t => t.id === tournamentId);
    document.getElementById("tournament-name").textContent = tournament.name;
    if (listId.tournamentIdToSave) {
        const tournamentToSave = poolData.tournaments.find(t => t.id === listId.tournamentIdToSave)
        document.getElementById("tournament-name").textContent = tournamentToSave.name;
        document.getElementById("match-type").classList.remove('hidden') = tournament.name;
        document.getElementById("match-type").textContent = " - " + tournament.name;
    }
    if (!tournament) {
        alert("Không tìm thấy giải đấu!");
    }
    const raceTarget = listId.raceTo || 0;
    document.getElementById("raceTarget").textContent = raceTarget;

    // --- Lấy 2 player ---
    const player1 = poolData.players.find(p => p.id === listId.player1Id);
    const player2 = poolData.players.find(p => p.id === listId.player2Id);
    let player1Teamate;
    let player2Teamate
    let team1Name = player1.name.toUpperCase();
    let team2Name = player2.name.toUpperCase();
    if (listId.player1TeamateId && listId.player1TeamateId) {
        player1Teamate = poolData.players.find(p => p.id === listId.player1TeamateId);
        player2Teamate = poolData.players.find(p => p.id === listId.player2TeamateId);
        team1Name = player1.name.toUpperCase() + " & " + player1Teamate.name.toUpperCase();
        team2Name = player2.name.toUpperCase() + " & " + player2Teamate.name.toUpperCase();
    }
    // console.log(player1Teamate);
    // --- Gán tên ra UI ---
    document.getElementById("name1").textContent = team1Name;
    document.getElementById("name2").textContent = team2Name;

    // --- Khởi tạo / load từ localStorage ---
    let score_counter_data_local = JSON.parse(localStorage.getItem("score_counter_data_local")) || [];
    // localStorage.setItem("score_counter_url",JSON.stringify(id) )
    // --- Hàm lưu vào localStorage ---
    function saveScoreDataToLocalStorage() {
        localStorage.setItem("score_counter_data_local", JSON.stringify(score_counter_data_local));
    }

    function deleteScoreDataLocalStorage() {
        localStorage.removeItem("score_counter_data_local");
        localStorage.removeItem("score_counter_url");
        score_counter_data_local = []; // reset biến trong code luôn
    }

    // --- Biến lưu điểm hiện tại ---
    let score1 = score_counter_data_local
        .filter(h => h.tournamentId === tournamentId && h.playerId === player1.id)
        .reduce((sum, h) => sum + h.pointsReceived, 0);

    let score2 = score_counter_data_local
        .filter(h => h.tournamentId === tournamentId && h.playerId === player2.id)
        .reduce((sum, h) => sum + h.pointsReceived, 0);

    // hiển thị lên UI ngay khi load
    document.getElementById("score1").textContent = score1;
    document.getElementById("score2").textContent = score2;

    let selectedPlayer = null;
    let cooldown = false;

    // --- DOM modal ---
    const modalCfm = document.getElementById("modalCfm");
    const modalTitle = document.getElementById("modal-title");
    const reasonSelect = document.getElementById("reason");
    const customReason = document.getElementById("customReason");
    const confirmBtn = document.getElementById("confirmBtn");
    const cancelBtn = document.getElementById("cancelBtn");

    // --- Click mở modal ---
    document.getElementById("player1").addEventListener("click", () => openModal("p1"));
    document.getElementById("player2").addEventListener("click", () => openModal("p2"));

    function openModal(playerKey) {
        if (cooldown) {
            alert("Bạn phải chờ 30 giây mới có thể tăng điểm tiếp!");
            return;
        }
        selectedPlayer = playerKey;
        const playerName = playerKey === "p1" ? team1Name : team2Name;
        modalTitle.textContent = playerName + ` thắng ván này? (Rack ` + (score_counter_data_local.filter(h => h.tournamentId === tournamentId).length + 1) + " )";
        modalCfm.classList.remove("hidden");
    }

    // --- Hiện input khi chọn "Khác" ---
    reasonSelect.addEventListener("change", () => {
        if (reasonSelect.value === "Khác") {
            customReason.classList.remove("hidden");
        } else {
            customReason.classList.add("hidden");
        }
    });

    // --- Xác nhận tăng điểm ---
    confirmBtn.addEventListener("click", () => {
        if (!selectedPlayer) return;

        let desc = reasonSelect.value;
        if (desc === "Khác") {
            desc = customReason.value || null;
        }
        // console.log(desc=="Chấm");

        // Xác định rack hiện tại
        const rack = score_counter_data_local.filter(h => h.tournamentId === tournamentId).length + 1;
        const pointsReceived = desc == "Chấm" ? 2 : 1

        if (selectedPlayer === "p1") {
            score1 += pointsReceived;
            document.getElementById("score1").textContent = score1;
            score_counter_data_local.push({
                id: String(score_counter_data_local.length + 1),
                playerId: player1.id,
                tournamentId: tournamentId,
                racks: rack,
                pointsReceived: pointsReceived,
                description: `${desc}`
            });
        } else {
            score2 += pointsReceived;
            document.getElementById("score2").textContent = score2;
            score_counter_data_local.push({
                id: String(score_counter_data_local.length + 1),
                playerId: player2.id,
                tournamentId: tournamentId,
                racks: rack,
                pointsReceived: pointsReceived,
                description: `${desc}`
            });
        }

        saveScoreDataToLocalStorage()
        closeModalCfm();
        startCooldown();
        checkHill();
        checkEnd()
    });

    function checkEnd() {
        if (score1 == listId.raceTo || score2 == listId.raceTo) {
            endMatch();
        }
    }

    // --- Hủy modal ---
    cancelBtn.addEventListener("click", closeModalCfm);

    function closeModalCfm() {
        modalCfm.classList.add("hidden");
        customReason.value = "";
        reasonSelect.value = "Ăn bi đẹp";
        customReason.classList.add("hidden");
    }

    // --- Cooldown 30s ---
    function startCooldown() {
        // cooldown = true;
        // setTimeout(() => {
        //     cooldown = false;
        // }, 30000);
    }
    //View racks history
    document.getElementById("historyBtn").addEventListener("click", () => {
        const tbody = document.getElementById("historyTableBody");
        tbody.innerHTML = "";

        (score_counter_data_local || []).forEach((item, index) => {
            const tr = document.createElement("tr");

            // rack
            const tdRack = document.createElement("td");
            tdRack.className = "border px-2 py-1";
            tdRack.textContent = index + 1; // hoặc item.rack nếu có
            tr.appendChild(tdRack);

            // winner
            const tdWinner = document.createElement("td");
            tdWinner.className = "border px-2 py-1";
            if (item.playerId == player1.id) {
                tdWinner.textContent = team1Name.toUpperCase();
            } else if (item.playerId == player2.id) {
                tdWinner.textContent = team2Name.toUpperCase();
            } else {
                tdWinner.textContent = "Unknown";
            }
            tr.appendChild(tdWinner);

            // note
            const tdNote = document.createElement("td");
            tdNote.className = "border px-2 py-1";
            tdNote.textContent = item.description || "";
            tr.appendChild(tdNote);

            tbody.appendChild(tr);
        });

        // show modal
        document.getElementById("historyModal").classList.remove("hidden");
    });

    // nút đóng modal
    document.getElementById("closeHistory").addEventListener("click", () => {
        document.getElementById("historyModal").classList.add("hidden");
    });
    function showResultModal() {

        // Xác định màu cho đội thắng/thua
        let team1Class = "text-gray-800";
        let team2Class = "text-gray-800";

        if (score1 > score2) {
            team1Class = "text-green-600";
            team2Class = "text-red-600";
        } else if (score2 > score1) {
            team1Class = "text-red-600";
            team2Class = "text-green-600";
        }

        // Render kết quả
        const resultContent = document.getElementById("resultContent");
        resultContent.innerHTML = `
        <span class="${team1Class}">${player1.name.toUpperCase()}</span>
        <span class="mx-2">${score1} - ${score2}</span>
        <span class="${team2Class}">${player2.name.toUpperCase()}</span>
    `;

        // Hiện modal
        document.getElementById("resultModal").classList.remove("hidden");
    }
    //End match auto
    async function endMatch() {
        let team1Id = listId.player1Id
        let team2Id = listId.player2Id
        if (player1Teamate && player2Teamate) {
            team1Id = `${1000 + Number(listId.player1Id)}` + `${1000 + Number(listId.player1TeamateId)}`;
            team2Id = `${1000 + Number(listId.player2Id)}` + `${1000 + Number(listId.player2TeamateId)}`;
        }
        const maxId = poolData.matchHistory.length > 0
            ? Math.max(...poolData.matchHistory.map(item => parseInt(item.id, 10))) + 1
            : 1; // Nếu mảng rỗng, bắt đầu từ 1
        const winnerId = parseInt(score1) > parseInt(score2) ? team1Id : (parseInt(score2) > parseInt(score1) ? team2Id : null);
        const newMatch = {
            id: String(maxId),
            player1Id: team1Id,
            score1: parseInt(score1),
            player2Id: team2Id,
            score2: parseInt(score2),
            winnerId,
            date: new Date().toLocaleDateString('vi-VN'),
            tournamentId: tournament.name,
            tournamentMatchId: '',
            matchType: '',
            details: tournamentId
        }
        try {
            poolData.matchHistory.push(newMatch);
            createData('match-history', newMatch);
            addPlayerPoints(listId.player1Id, score1, null, maxId);
            addPlayerPoints(listId.player2Id, score2, null, maxId);
            if (player1Teamate && player2Teamate) {
                addPlayerPoints(listId.player1TeamateId, score1, null, maxId);
                addPlayerPoints(listId.player2TeamateId, score2, null, maxId);
            }
            // console.log(score_counter_data_local);
            
            for (const item of score_counter_data_local) {
                // console.log(item);
                await createData("history_points_den", item);
            }
             console.log("✅ Lưu thành công toàn bộ score_counter_data_local!");
            showResultModal()
            deleteScoreDataLocalStorage()
        } catch (err) {
            console.log(err);
            console.error("❌ Lỗi khi lưu:", error);

        }
    }
    //End Match soon
    document.getElementById("endMatchBtn").addEventListener("click", () => {

        if (confirm("Xác nhận hủy trận đấu sớm ?")) {
            if (score_counter_data_local.length === 0) {
                deleteScoreDataLocalStorage();
                window.location.hash = `#/match_history`;
                return
            }

        }
        endMatch()
        return

    })
    // Nút đóng modal
    document.getElementById("closeResultBtn").addEventListener("click", () => {
        document.getElementById("resultModal").classList.add("hidden");
        //  window.location.reload();
        window.location.hash = `#/match_history`;
        window.location.reload();
    });

    // --- Bật hiệu ứng lửa cho player1 ---
    function player1Hill() {
        const p1 = document.getElementById("player1");
        const name1 = document.getElementById("name1");
        const score1 = document.getElementById("score1");
        p1.classList.add("fire-blue");
        name1.classList.add("text-fire-blue");
        score1.classList.add("text-fire-blue");
    };

    function player2Hill() {
        const p1 = document.getElementById("player2");
        const name1 = document.getElementById("name2");
        const score1 = document.getElementById("score2");
        p1.classList.add("fire-red");
        name1.classList.add("text-fire-red");
        score1.classList.add("text-fire-red");
    };

    function player1Fire() {
        const p1 = document.getElementById("player1");
        const name1 = document.getElementById("name1");
        const score1 = document.getElementById("score1");
        p1.classList.add("fire");
        name1.classList.add("text-fire-blue");
        score1.classList.add("text-fire-blue");
    }
    function player2Fire() {
        const p = document.getElementById("player2");
        const name = document.getElementById("name2");
        const score = document.getElementById("score2");
        p.classList.add("fire");
        name.classList.add("text-fire-red");
        score.classList.add("text-fire-red");
    }

    function checkHill() {
        const p1Hill = (score1 === raceTarget - 1);
        const p2Hill = (score2 === raceTarget - 1);
        // console.log(p2Hill, score2);

        if (p1Hill && p2Hill) {
            // cả 2 cùng hill
            player1Fire();
            player2Fire();
        } else if (p1Hill) {
            player1Fire();
        } else if (p2Hill) {
            player2Fire();
        }
    }
    checkHill()
}