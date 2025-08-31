import { poolData, createData, updateData, checkAdminAccess, addPlayerPoints } from "../../data.js"; // nhớ export từ data.js
export async function render({ id }) {

    // --- Lấy tournamentId từ URL ---
    //Link {
    //     1000: race to ...
    //     2000: player1Id
    //     3000: player1TeamateId
    //     4000: player2Id
    //     5000: player2TeamateId
    //     6000: tournamentIdToSave,
    //     90000: tournamentId
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

    function noEndFinal() {
        if (tournament.name == "Chung kết" && score_counter_data_local.length != 0) {
            const endBtn = document.getElementById("endMatchBtn");
            endBtn.disabled = true;
            endBtn.classList.remove("bg-red-400", "hover:bg-red-600");
            endBtn.classList.add("bg-gray-400", "cursor-not-allowed");
        }
    }
    // let rawId = "100320043002400150039000005"
    const listId = parseIdsFromUrl(id)
    // console.log(listId);

    const tournamentId = listId.tournamentId;
    const tournament = poolData.tournaments.find(t => t.id === tournamentId);
    document.getElementById("tournament-name").textContent = tournament.name;
    let tournamentToSave = null;
    if (listId.tournamentIdToSave) {
        tournamentToSave = poolData.tournaments.find(t => t.id === listId.tournamentIdToSave)
        document.getElementById("tournament-name").textContent = tournamentToSave.name;
        document.getElementById("match-type").classList.remove('hidden');
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
    let cleanName = (name) => name.replace("(Khách)", "").toUpperCase();

    let team1Name = cleanName(player1.name);
    let team2Name = cleanName(player2.name);

    if (listId.player1TeamateId && listId.player2TeamateId) {
        player1Teamate = poolData.players.find(p => p.id === listId.player1TeamateId);
        player2Teamate = poolData.players.find(p => p.id === listId.player2TeamateId);

        team1Name = cleanName(player1.name) + " & " + cleanName(player1Teamate.name);
        team2Name = cleanName(player2.name) + " & " + cleanName(player2Teamate.name);
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
        //Chỉnh điểm của chấm
        const pointsReceived = desc == "Chấm" ? 1 : 1

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
            addMatchCham(selectedPlayer)
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
            addMatchCham(selectedPlayer)
        }

        saveScoreDataToLocalStorage()
        closeModalCfm();
        startCooldown();
        checkHill();
        checkEnd();
        noEndFinal();
    });

    async function addMatchCham(selectedPlayerValue) {
        // console.log(reasonSelect.value);
        if (reasonSelect.value != "Chấm") {
            return
        }
        let teamId;
        if (selectedPlayerValue == "p1") {
            teamId = listId.player1Id
            if (listId.player1TeamateId) {
                teamId = `${1000 + Number(listId.player1Id)}` + `${1000 + Number(listId.player1TeamateId)}`;
            }
        } else {
            teamId = listId.player2Id
            if (listId.player2TeamateId) {
                teamId = `${1000 + Number(listId.player2Id)}` + `${1000 + Number(listId.player2TeamateId)}`;
            }
        }
        let maxId = poolData.matchHistory.length > 0
            ? Math.max(...poolData.matchHistory.map(item => parseInt(item.id, 10))) + 1
            : 1; // Nếu mảng rỗng, bắt đầu từ 1
        let tournamentIdToSave = tournament.name
        let tour = null;
        let matchTypeToSave = '';
        if (listId.tournamentIdToSave) {
            tournamentIdToSave = listId.tournamentIdToSave;
            tour = listId.tournamentIdToSave
            matchTypeToSave = tournament.name;
        }
        const newMatch = {
            id: String(maxId),
            player1Id: teamId,
            score1: 10,
            player2Id: 7,
            score2: 0,
            winnerId: teamId,
            date: new Date().toLocaleDateString('vi-VN'),
            tournamentId: tournamentIdToSave,
            tournamentMatchId: null,
            matchType: matchTypeToSave,
            details: tournamentId
        }
        try {
            maxId = await createData('match-history', newMatch);
            if(listId.tournamentIdToSave){
                await addPlayerPoints(teamId,10,listId.tournamentIdToSave,maxId)
            }else{
                await addPlayerPoints(teamId,10,null,maxId)
            }
            poolData.matchHistory.push(newMatch);
            console.log(newMatch);
            
        } catch (err) {
            console.log(err);
            console.error("❌ Lỗi khi lưu:", err);

        }

    }

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
        reasonSelect.value = "Win";
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
            tr.className = `${item.description == "Chấm" ? "bg-yellow-200" : item.playerId == player1.id ? "bg-blue-300" : "bg-red-300"}`;
            // rack
            const tdRack = document.createElement("td");
            tdRack.className = `border px-2 py-`;
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
        let maxId = poolData.matchHistory.length > 0
            ? Math.max(...poolData.matchHistory.map(item => parseInt(item.id, 10))) + 1
            : 1; // Nếu mảng rỗng, bắt đầu từ 1
        const winnerId = parseInt(score1) > parseInt(score2) ? team1Id : (parseInt(score2) > parseInt(score1) ? team2Id : null);
        let tournamentIdToSave = tournament.name
        let tour = null;
        let matchTypeToSave = '';
        if (listId.tournamentIdToSave) {
            tournamentIdToSave = listId.tournamentIdToSave;
            tour = listId.tournamentIdToSave
            matchTypeToSave = tournament.name;
        }
        const newMatch = {
            id: String(maxId),
            player1Id: team1Id,
            score1: parseInt(score1),
            player2Id: team2Id,
            score2: parseInt(score2),
            winnerId,
            date: new Date().toLocaleDateString('vi-VN'),
            tournamentId: tournamentIdToSave,
            tournamentMatchId: null,
            matchType: matchTypeToSave,
            details: tournamentId
        }
        try {
            poolData.matchHistory.push(newMatch);
            maxId = await createData('match-history', newMatch);
            // console.log(maxId);

            if (score1 > 0) addPlayerPoints(listId.player1Id, score1, tour, maxId);
            if (score2 > 0) addPlayerPoints(listId.player2Id, score2, tour, maxId);
            if (matchTypeToSave == "Chung kết") {
                // console.log(tournamentToSave);
                const updatedTournament = {
                    ...tournamentToSave,
                    status: 'Đã kết thúc',
                    top1Id: winnerId,
                    top2Id: team1Id == winnerId ? team2Id : team1Id,
                }

                // console.log(updatedTournament);
                await updateData('tournaments', tournamentIdToSave, updatedTournament);
                addPlayerPoints(updatedTournament.top1Id, updatedTournament.top1_point, tournamentIdToSave, null)
                addPlayerPoints(updatedTournament.top2Id, updatedTournament.top2_point, tournamentIdToSave, null)
                // Cập nhật điểm cho các người chơi khác tham gia giải
                if (updatedTournament.other_point > 0) {
                    const otherPlayers = poolData.players.filter(player =>

                        updatedTournament.players.includes(player.id) &&
                        player.id !== updatedTournament.top1Id &&
                        player.id !== updatedTournament.top2Id
                    );
                    for (const player of otherPlayers) {
                        await addPlayerPoints(player.id, Number(updatedTournament.other_point), tournamentIdToSave, null);
                    }
                }

            }
            if (player1Teamate && player2Teamate) {
                addPlayerPoints(listId.player1TeamateId, score1, tour, maxId);
                addPlayerPoints(listId.player2TeamateId, score2, tour, maxId);
            }
            // console.log(score_counter_data_local);

            for (const item of score_counter_data_local) {
                createData("history_points_den", item);
            }
            console.log("✅ Lưu thành công toàn bộ score_counter_data_local!");
            if (matchTypeToSave == "Chung kết") {
                startConfettiChaimpion()
            } else {
                startConfetti()
            }
            showResultModal()
            deleteScoreDataLocalStorage()
        } catch (err) {
            console.log(err);
            console.error("❌ Lỗi khi lưu:", err);

        }
    }
    //End Match soon
    document.getElementById("endMatchBtn").addEventListener("click", () => {
        if (confirm("Xác nhận hủy trận đấu sớm ?")) {
            if (score_counter_data_local.length === 0) {
                deleteScoreDataLocalStorage();
                if (listId.tournamentIdToSave) {
                    window.location.hash = `#/tournament_details?id=${listId.tournamentIdToSave}`;
                    window.location.reload();
                } else {
                    window.location.hash = `#/match_history`;
                    window.location.reload();
                }
                return
            }
            endMatch()
        } else {
            return
        }
    })
    //thoát khỏi pages
    function outOfPage() {
        document.getElementById("resultModal").classList.add("hidden");
        //  window.location.reload();
        if (listId.tournamentIdToSave) {
            window.location.hash = `#/tournament_details?id=${listId.tournamentIdToSave}`;
            window.location.reload();
        } else {
            window.location.hash = `#/match_history`;
            window.location.reload();
        }
    }
    // Nút đóng modal
    document.getElementById("closeResultBtn").addEventListener("click", () => {
        outOfPage();

    });

    //local kiểm tra nếu không có url sẽ bị out
    let score_counter_url = JSON.parse(localStorage.getItem("score_counter_url"))
    if (!score_counter_url) {
        outOfPage()
    }

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
    noEndFinal()
    function startConfetti() {
        const canvas = document.getElementById('confettiCanvas');
        const ctx = canvas.getContext('2d');

        // Set canvas size
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Resize canvas on window resize
        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });

        // Confetti particle class
        class Confetti {
            constructor() {
                this.x = canvas.width / 2;
                this.y = canvas.height / 2;
                this.angle = Math.random() * Math.PI * 2;
                this.speed = Math.random() * 5 + 2;
                this.size = Math.random() * 8 + 4;
                this.color = `hsl(${Math.random() * 360}, 100%, 50%)`;
                this.vx = Math.cos(this.angle) * this.speed;
                this.vy = Math.sin(this.angle) * this.speed;
                this.gravity = 0.05;
                this.rotation = Math.random() * 360;
                this.spin = (Math.random() - 0.5) * 0.2;
                this.opacity = 1;
                this.life = 100;
            }
            update() {
                this.vy += this.gravity;
                this.x += this.vx;
                this.y += this.vy;
                this.rotation += this.spin;
                this.life--;
                this.opacity = this.life / 100;
                if (this.life <= 0) {
                    this.x = canvas.width / 2;
                    this.y = canvas.height / 2;
                    this.angle = Math.random() * Math.PI * 2;
                    this.speed = Math.random() * 5 + 2;
                    this.size = Math.random() * 8 + 4;
                    this.vx = Math.cos(this.angle) * this.speed;
                    this.vy = Math.sin(this.angle) * this.speed;
                    this.rotation = Math.random() * 360;
                    this.spin = (Math.random() - 0.5) * 0.2;
                    this.opacity = 1;
                    this.life = 100;
                }
            }
            draw() {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.rotation * Math.PI / 180);
                ctx.globalAlpha = this.opacity;
                ctx.fillStyle = this.color;
                ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
                ctx.restore();
            }
        }

        // Create confetti particles
        const confettiCount = 100;
        const confetti = Array.from({ length: confettiCount }, () => new Confetti());

        // Animation loop
        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            confetti.forEach(particle => {
                particle.update();
                particle.draw();
            });
            requestAnimationFrame(animate);
        }

        animate();
    }
    function startConfettiChaimpion() {
        const canvas = document.getElementById('confettiCanvas');
        const ctx = canvas.getContext('2d');
        const celebrationText = document.getElementById('celebrationText');

        // Show celebration text
        celebrationText.classList.remove('hidden');

        // Set canvas size
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Resize canvas on window resize
        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });

        // Confetti particle class
        class Confetti {
            constructor(isSide = false) {
                this.isSide = isSide;
                if (isSide) {
                    // Side confetti (falling from left/right edges)
                    this.x = Math.random() < 0.5 ? 0 : canvas.width;
                    this.y = Math.random() * canvas.height;
                    this.vx = this.x === 0 ? Math.random() * 2 + 1 : -(Math.random() * 2 + 1);
                    this.vy = Math.random() * 2 + 2;
                } else {
                    // Center confetti (fireworks from center)
                    this.x = canvas.width / 2;
                    this.y = canvas.height / 2;
                    this.angle = Math.random() * Math.PI * 2;
                    this.speed = Math.random() * 7 + 4;
                    this.vx = Math.cos(this.angle) * this.speed;
                    this.vy = Math.sin(this.angle) * this.speed;
                }
                this.size = Math.random() * 12 + 6;
                this.color = Math.random() < 0.7 ? '#ffd700' : `hsl(${Math.random() * 360}, 100%, 50%)`;
                this.gravity = isSide ? 0.15 : 0.1;
                this.rotation = Math.random() * 360;
                this.spin = (Math.random() - 0.5) * 0.4;
                this.opacity = 1;
                this.life = isSide ? 150 : 120;
                this.shape = Math.random() > 0.5 ? 'square' : 'circle';
            }
            update() {
                this.vy += this.gravity;
                this.x += this.vx;
                this.y += this.vy;
                this.rotation += this.spin;
                this.life -= 0.8;
                this.opacity = this.life / (this.isSide ? 150 : 120);
                if (this.life <= 0 || this.y > canvas.height || this.x < 0 || this.x > canvas.width) {
                    if (this.isSide) {
                        this.x = Math.random() < 0.5 ? 0 : canvas.width;
                        this.y = -this.size;
                        this.vx = this.x === 0 ? Math.random() * 2 + 1 : -(Math.random() * 2 + 1);
                        this.vy = Math.random() * 2 + 2;
                    } else {
                        this.x = canvas.width / 2;
                        this.y = canvas.height / 2;
                        this.angle = Math.random() * Math.PI * 2;
                        this.speed = Math.random() * 7 + 4;
                        this.vx = Math.cos(this.angle) * this.speed;
                        this.vy = Math.sin(this.angle) * this.speed;
                    }
                    this.size = Math.random() * 12 + 6;
                    this.color = Math.random() < 0.7 ? '#ffd700' : `hsl(${Math.random() * 360}, 100%, 50%)`;
                    this.rotation = Math.random() * 360;
                    this.spin = (Math.random() - 0.5) * 0.4;
                    this.opacity = 1;
                    this.life = this.isSide ? 150 : 120;
                    this.shape = Math.random() > 0.5 ? 'square' : 'circle';
                }
            }
            draw() {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.rotation * Math.PI / 180);
                ctx.globalAlpha = this.opacity;
                ctx.fillStyle = this.color;
                if (this.shape === 'square') {
                    ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
                } else {
                    ctx.beginPath();
                    ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }
        }

        // Trophy class
        class Trophy {
            constructor() {
                const edge = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
                const margin = 50;
                if (edge === 0) {
                    this.x = Math.random() * (canvas.width - 2 * margin) + margin;
                    this.y = margin;
                } else if (edge === 1) {
                    this.x = canvas.width - margin;
                    this.y = Math.random() * (canvas.height - 2 * margin) + margin;
                } else if (edge === 2) {
                    this.x = Math.random() * (canvas.width - 2 * margin) + margin;
                    this.y = canvas.height - margin;
                } else {
                    this.x = margin;
                    this.y = Math.random() * (canvas.height - 2 * margin) + margin;
                }
                this.size = 30 + Math.random() * 20;
                this.opacity = 1;
                this.life = 200;
                this.rotation = Math.random() * 360;
                this.spin = (Math.random() - 0.5) * 0.1;
            }
            update() {
                this.life -= 0.5;
                this.opacity = this.life / 200;
                this.rotation += this.spin;
                if (this.life <= 0) {
                    const edge = Math.floor(Math.random() * 4);
                    const margin = 50;
                    if (edge === 0) {
                        this.x = Math.random() * (canvas.width - 2 * margin) + margin;
                        this.y = margin;
                    } else if (edge === 1) {
                        this.x = canvas.width - margin;
                        this.y = Math.random() * (canvas.height - 2 * margin) + margin;
                    } else if (edge === 2) {
                        this.x = Math.random() * (canvas.width - 2 * margin) + margin;
                        this.y = canvas.height - margin;
                    } else {
                        this.x = margin;
                        this.y = Math.random() * (canvas.height - 2 * margin) + margin;
                    }
                    this.size = 30 + Math.random() * 20;
                    this.opacity = 1;
                    this.life = 200;
                    this.rotation = Math.random() * 360;
                    this.spin = (Math.random() - 0.5) * 0.1;
                }
            }
            draw() {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.rotation * Math.PI / 180);
                ctx.globalAlpha = this.opacity;
                ctx.fillStyle = '#ffd700';
                ctx.font = `${this.size}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('🏆', 0, 0);
                ctx.restore();
            }
        }

        // Create particles
        const confettiCount = 200;
        const sideConfettiCount = 50;
        const trophyCount = 8;
        const confetti = [
            ...Array.from({ length: confettiCount }, () => new Confetti(false)),
            ...Array.from({ length: sideConfettiCount }, () => new Confetti(true)),
            ...Array.from({ length: trophyCount }, () => new Trophy())
        ];

        // Animation loop
        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            confetti.forEach(particle => {
                particle.update();
                particle.draw();
            });
            requestAnimationFrame(animate);
        }

        animate();
    }
}