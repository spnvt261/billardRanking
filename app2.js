let playersData = [];

function filterQualifiedPlayers(playersData1) {
  playersData = playersData1.filter(p => p.racks >= 30 && p.matches >= 5);
}

// Gọi hàm
filterQualifiedPlayers(playersData1);
// console.log(playersData);

function getSlides(playersData){
  const topElo = [...playersData].sort((a,b)=> b.elo - a.elo)[0];
  const topMatches = [...playersData].sort((a,b)=> b.matches - a.matches)[0];
  const topRacks = [...playersData].sort((a,b)=> b.racks - a.racks)[0];
  const topRackRate = [...playersData].sort((a,b)=> (b.winRacks/b.racks) - (a.winRacks/a.racks))[0];
  const topFinals = [...playersData].sort((a,b)=> (b.finals/b.attends) - (a.finals/a.attends))[0];
  const topChampions = [...playersData].sort((a,b)=> b.champions - a.champions)[0];
  const topSoCham = [...playersData].filter(p=>p.soCham>0).sort((a,b)=> b.soCham - a.soCham)[0];

  return [
    {
      kicker:"Người có Elo cao nhất",
      title: topElo.name,
      detail: `${topElo.elo} điểm Elo`,
      value: topElo.elo,
      unit:"Elo",
      icon:"⭐"
    },
    {
      kicker:"Người đấu nhiều trận nhất",
      title: topMatches.name,
      detail:`${topMatches.matches} trận • ${topMatches.winMatches} thắng (${Math.round(topMatches.winMatches/topMatches.matches*100)}%)`,
      value: topMatches.matches,
      unit:"trận",
      icon:"🎯"
    },
    {
      kicker:"Người đấu nhiều racks nhất",
      title: topRacks.name,
      detail:`${topRacks.racks} racks`,
      value: topRacks.racks,
      unit:"racks",
      icon:"🎱"
    },
    {
      kicker:"Người có tỉ lệ thắng rack cao nhất",
      title: topRackRate.name,
      detail:`${topRackRate.winRacks} / ${topRackRate.racks} (${(topRackRate.winRacks/topRackRate.racks*100).toFixed(2)}%)`,
      value: (topRackRate.winRacks/topRackRate.racks*100).toFixed(2),
      unit:"%",
      icon:"🔥"
    },
    {
      kicker:"Người có tỉ lệ vào chung kết nhiều nhất",
      title: topFinals.name,
      detail:`${topFinals.finals}/${topFinals.attends} giải (${(topFinals.finals/topFinals.attends*100).toFixed(1)}%)`,
      value: (topFinals.finals/topFinals.attends*100).toFixed(1),
      unit:"%",
      icon:"🏁"
    },
    {
      kicker:"Người vô địch nhiều nhất",
      title: topChampions.name,
      detail:`${topChampions.champions} lần vô địch`,
      value: topChampions.champions,
      unit:"🏆",
      icon:"🏆"
    },
    ...(topSoCham ? [{
      kicker:"Người đi chấm nhiều nhất",
      title: topSoCham.name,
      detail:`${topSoCham.soCham} lần chấm`,
      value: topSoCham.soCham,
      unit:"lần",
      icon:"📝"
    }] : [])
  ];
}

const stats = getSlides(playersData);
// console.log(stats);

// ===== SLIDESHOW =====
const stage = document.getElementById("stage");
const skipBtn = document.getElementById("skip-btn");
let index = 0;
const SLIDE_DURATION = 4000;
let autoPlay;

function countUp(element, toValue, unit){
  if(toValue === null || isNaN(toValue)) return;
  let current = 0;
  const step = toValue/40;
  const timer = setInterval(()=>{
    current += step;
    if(current >= toValue){
      current = toValue;
      clearInterval(timer);
    }
    element.textContent = Math.round(current) + " " + unit;
  }, 50);
}

function renderSlide(i){
  const s = stats[i];
  stage.classList.remove("fade-in");
  stage.classList.add("fade-out");
  setTimeout(()=>{
    stage.innerHTML = `
      <div class="fade-in">
        <div class="text-blue-800 uppercase tracking-widest text-sm mb-2">${s.icon} ${s.kicker}</div>
        <div class="text-4xl md:text-6xl font-extrabold mb-3">
          ${s.value!==null ? `<span id="count">0</span>` : s.title}
        </div>
        ${s.value!==null ? `<div class="text-xl font-semibold">${s.title}</div>` : ""}
        <div class="text-gray-600 mt-2">${s.detail}</div>
      </div>
    `;
    if(s.value!==null){
      countUp(document.getElementById("count"), s.value, s.unit);
    }
    stage.classList.remove("fade-out");
    stage.classList.add("fade-in");
  }, 300);
}

function next(){
  if(index < stats.length){
    renderSlide(index);
    index++;
  } else {
    clearInterval(autoPlay);
    renderResults();
  }
}
function renderResults(){
    // Xóa slideshow + skip button
  document.getElementById("slideshow").remove();
  document.getElementById("skip-btn").remove();
  document.getElementById("header").classList.remove("hidden");
  document.getElementById("chart").classList.remove("hidden");
  const container = document.getElementById("main-wrap");
  container.className = "container mx-auto py-8 space-y-6";
  // Bảng 1: Elo
  let table1 = [...playersData].sort((a,b)=> b.elo - a.elo);
  // Bảng 2: Racks
  let table2 = [...playersData].sort((a,b)=> b.racks - a.racks);
  // Bảng 3: Tỉ lệ thắng rack
  let table3 = [...playersData].sort((a,b)=> (b.winRacks/b.racks) - (a.winRacks/a.racks));
  // Bảng 4: Thành tích giải
  let table4 = [...playersData].sort((a,b)=> (b.finals/b.attends) - (a.finals/a.attends));
  // Bảng 5: Điểm (số chấm)
  let table5 = [...playersData].sort((a,b)=> b.soCham - a.soCham);

  container.innerHTML = `
    <div class="bg-white p-4 rounded shadow mb-6">
        <p>Một số bảng tổng kết <br>
        (Chỉ tính players có match > 4 và racks >30 )</p>
    </div>
    <!-- Bảng 1 -->
    <div class="bg-white p-4 rounded shadow mb-6">
      <h2 class="text-xl font-bold text-blue-900 mb-2">Top tính theo Elo</h2>
      <table class="w-full border text-sm">
        <thead class="bg-blue-800 text-white">
          <tr>
            <th class="p-2 text-left">#</th>
            <th class="p-2 text-left">Player</th>
            <th class="p-2 text-left">Elo</th>
            <th class="p-2 text-left">Số trận</th>
            <th class="p-2 text-left">Tỉ lệ thắng</th>
          </tr>
        </thead>
        <tbody>
          ${table1.map((p,i)=>`
            <tr class="border-b">
              <td class="p-2">${i+1}</td>
              <td class="p-2">${p.name}</td>
              <td class="p-2">${p.elo}</td>
              <td class="p-2">${p.matches}</td>
              <td class="p-2">${Math.round(p.winMatches/p.matches*100)}%</td>
            </tr>`).join("")}
        </tbody>
      </table>
    </div>

    <!-- Bảng 2 -->
    <div class="bg-white p-4 rounded shadow mb-6">
      <h2 class="text-xl font-bold text-blue-900 mb-2">Top tính theo số racks</h2>
      <table class="w-full border text-sm">
        <thead class="bg-blue-800 text-white">
          <tr>
            <th class="p-2 text-left">#</th>
            <th class="p-2 text-left">Player</th>
            <th class="p-2 text-left">Số racks</th>
            <th class="p-2 text-left">Tỉ lệ thắng</th>
          </tr>
        </thead>
        <tbody>
          ${table2.map((p,i)=>`
            <tr class="border-b">
              <td class="p-2">${i+1}</td>
              <td class="p-2">${p.name}</td>
              <td class="p-2">${p.racks}</td>
              <td class="p-2">${Math.round(p.winRacks/p.racks*100)}%</td>
            </tr>`).join("")}
        </tbody>
      </table>
    </div>

    <!-- Bảng 3 -->
    <div class="bg-white p-4 rounded shadow mb-6">
      <h2 class="text-xl font-bold text-blue-900 mb-2">Top tính theo lệ thắng / rack</h2>
      <table class="w-full border text-sm">
        <thead class="bg-blue-800 text-white">
          <tr>
            <th class="p-2 text-left">#</th>
            <th class="p-2 text-left">Player</th>
            <th class="p-2 text-left">Tỉ lệ thắng theo racks</th>
          </tr>
        </thead>
        <tbody>
          ${table3.map((p,i)=>`
            <tr class="border-b">
              <td class="p-2">${i+1}</td>
              <td class="p-2">${p.name}</td>
              <td class="p-2">${Math.round(p.winRacks)} / ${p.racks} (${(p.winRacks/p.racks*100).toFixed(2)}%)</td>
            </tr>`).join("")}
        </tbody>
      </table>
    </div>

    <!-- Bảng 4 -->
    <div class="bg-white p-4 rounded shadow mb-6">
      <h2 class="text-xl font-bold text-blue-900 mb-2">Top vào chung kết</h2>
      <table class="w-full border text-sm">
        <thead class="bg-blue-800 text-white">
          <tr>
            <th class="p-2 text-left">#</th>
            <th class="p-2 text-left">Player</th>
            <th class="p-2 text-left">Số lần tham dự giải</th>
            <th class="p-2 text-left">Số lần nhận giải</th>
            <th class="p-2 text-left">Tỉ lệ vào top</th>
            <th class="p-2 text-left">Vô địch</th>
          </tr>
        </thead>
        <tbody>
          ${table4.map((p,i)=>`
            <tr class="border-b">
              <td class="p-2">${i+1}</td>
              <td class="p-2">${p.name}</td>
              <td class="p-2">${p.attends}</td>
              <td class="p-2">${p.finals}</td>
              <td class="p-2">${((p.finals/p.attends)*100).toFixed(1)}%</td>
              <td class="p-2">${p.champions}</td>
            </tr>`).join("")}
        </tbody>
      </table>
    </div>

    <!-- Bảng 5 -->
    <div class="bg-white p-4 rounded shadow mb-6">
      <h2 class="text-xl font-bold text-blue-900 mb-2">Top đi chấm</h2>
      <table class="w-full border text-sm">
        <thead class="bg-blue-800 text-white">
          <tr>
            <th class="p-2 text-left">#</th>
            <th class="p-2 text-left">Player</th>
            <th class="p-2 text-left">Số chấm</th>
          </tr>
        </thead>
        <tbody>
          ${table5.map((p,i)=>`
            <tr class="border-b">
              <td class="p-2">${i+1}</td>
              <td class="p-2">${p.name}</td>
              <td class="p-2">${p.soCham}</td>
            </tr>`).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function startAutoPlay(){
  next(); 
  autoPlay = setInterval(next, SLIDE_DURATION);
}

skipBtn.addEventListener("click", ()=>{
  clearInterval(autoPlay);
  renderResults();
});

startAutoPlay();