(function () {
  "use strict";
  var ITEMS = (window.DATA || []).map(function (d, i) {
    return { id: i + 1, cat: d[0], t: d[1], c: d[2], s: d[3], r: d[4] || [] };
  });
  var CATS = window.CATS;
  var REFS = window.REFS;
  var catById = {};
  CATS.forEach(function (c) { catById[c.id] = c; });

  var $ = function (id) { return document.getElementById(id); };
  var state = { cat: "all", q: "", favOnly: false };
  var favs = {};
  try { favs = JSON.parse(localStorage.getItem("dsos-favs") || "{}") || {}; } catch (e) { favs = {}; }
  function saveFavs() { try { localStorage.setItem("dsos-favs", JSON.stringify(favs)); } catch (e) {} }

  function esc(s) { return String(s).replace(/[&<>"]/g, function (m) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]; }); }

  // categories
  var chipsHtml = '<button class="chip on" data-cat="all">전체 ' + ITEMS.length + '</button>';
  CATS.forEach(function (c) {
    var n = ITEMS.filter(function (it) { return it.cat === c.id; }).length;
    chipsHtml += '<button class="chip" data-cat="' + c.id + '">' + c.emoji + " " + esc(c.name) + " " + n + "</button>";
  });
  $("cats").innerHTML = chipsHtml;
  $("cats").addEventListener("click", function (e) {
    var b = e.target.closest(".chip"); if (!b) return;
    state.cat = b.dataset.cat;
    Array.prototype.forEach.call($("cats").children, function (x) { x.classList.toggle("on", x === b); });
    render();
  });

  // quick picks
  var QUICK = [
    ["밤 11시, 너무 배고파요", "야식"], ["진짜 배고픈 건지 모르겠어요", "가짜 배고픔"],
    ["먹어도 먹어도 배고파요", "계속 배고픔"], ["단 게 미친 듯이 당겨요", "단 것"],
    ["몸무게가 안 빠져요", "정체기"], ["방금 폭식했어요", "폭식"],
    ["오늘 회식이에요", "회식"], ["운동하기 싫어요", "운동하기 싫"]
  ];
  $("quickGrid").innerHTML = QUICK.map(function (q) {
    return '<button class="qbtn" data-q="' + esc(q[1]) + '">' + esc(q[0]) + "<small>“" + esc(q[1]) + "” 찾기</small></button>";
  }).join("");
  $("quickGrid").addEventListener("click", function (e) {
    var b = e.target.closest(".qbtn"); if (!b) return;
    $("q").value = b.dataset.q; state.q = b.dataset.q; render();
    $("list").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  $("q").addEventListener("input", function () { state.q = this.value.trim(); render(); });
  $("favToggle").addEventListener("click", function () {
    state.favOnly = !state.favOnly; this.classList.toggle("on", state.favOnly); render();
  });
  $("randomBtn").addEventListener("click", function () {
    var pool = filtered(); if (!pool.length) pool = ITEMS;
    open(pool[Math.floor(Math.random() * pool.length)].id);
  });

  function norm(s) { return String(s).toLowerCase().replace(/\s+/g, ""); }
  ITEMS.forEach(function (it) {
    var c = catById[it.cat];
    it._hay = norm([it.t, it.c, it.s.join(" "), c ? c.name : ""].join(" "));
  });

  function filtered() {
    var words = state.q ? state.q.split(/\s+/).map(norm).filter(Boolean) : [];
    return ITEMS.filter(function (it) {
      if (state.cat !== "all" && it.cat !== state.cat) return false;
      if (state.favOnly && !favs[it.id]) return false;
      for (var i = 0; i < words.length; i++) if (it._hay.indexOf(words[i]) < 0) return false;
      return true;
    });
  }

  function render() {
    var list = filtered();
    $("quick").hidden = !!state.q || state.favOnly;
    $("count").textContent = list.length + "개의 상황";
    $("empty").hidden = list.length > 0;
    $("list").innerHTML = list.map(function (it) {
      var c = catById[it.cat];
      return '<li class="item"><div class="main" data-id="' + it.id + '">' +
        '<div class="no">#' + it.id + " · " + c.emoji + " " + esc(c.name) + "</div>" +
        "<h3>" + esc(it.t) + "</h3><p>" + esc(it.s[0]) + "</p></div>" +
        '<button class="star' + (favs[it.id] ? " on" : "") + '" data-star="' + it.id + '" aria-label="저장">★</button></li>';
    }).join("");
  }

  $("list").addEventListener("click", function (e) {
    var s = e.target.closest("[data-star]");
    if (s) { toggleFav(+s.dataset.star); s.classList.toggle("on", !!favs[s.dataset.star]); return; }
    var m = e.target.closest(".main"); if (m) open(+m.dataset.id);
  });

  function toggleFav(id) { if (favs[id]) delete favs[id]; else favs[id] = 1; saveFavs(); }

  function refHtml(key) {
    var r = REFS[key]; if (!r) return "";
    return "<li>" + esc(r) + "</li>";
  }

  var current = null;
  function open(id) {
    var it = ITEMS[id - 1]; if (!it) return; current = id;
    var c = catById[it.cat];
    $("sheetBody").innerHTML =
      '<span class="tag">' + c.emoji + " " + esc(c.name) + " · #" + it.id + "</span>" +
      "<h2>" + esc(it.t) + "</h2>" +
      "<h4>왜 이런 일이 생기나요</h4><p class='why'>" + esc(it.c) + "</p>" +
      "<h4>이렇게 해보세요</h4><ol class='sol'>" + it.s.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ol>" +
      (it.r.length ? "<h4>근거 자료</h4><ul class='refs'>" + it.r.map(refHtml).join("") + "</ul>" : "") +
      "<div class='sheet-actions'><button class='btn' id='favInSheet'>" + (favs[id] ? "★ 저장됨" : "☆ 저장하기") + "</button>" +
      "<button class='ghost' id='nextRandom'>🎲 다른 팁</button></div>";
    show();
    $("favInSheet").onclick = function () { toggleFav(id); this.textContent = favs[id] ? "★ 저장됨" : "☆ 저장하기"; render(); };
    $("nextRandom").onclick = function () { open(ITEMS[Math.floor(Math.random() * ITEMS.length)].id); };
    try { history.replaceState(null, "", "#" + id); } catch (e) {}
  }
  function show() { $("sheet").hidden = false; $("backdrop").hidden = false; $("sheet").scrollTop = 0; document.body.style.overflow = "hidden"; }
  function hide() {
    $("sheet").hidden = true; $("backdrop").hidden = true; document.body.style.overflow = ""; current = null;
    try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}
  }
  $("closeSheet").onclick = hide; $("backdrop").onclick = hide;
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") hide(); });

  $("showRefs").addEventListener("click", function (e) {
    e.preventDefault();
    var keys = Object.keys(REFS).sort(function (a, b) { return REFS[a].localeCompare(REFS[b]); });
    $("sheetBody").innerHTML = "<span class='tag'>📚 참고 문헌</span><h2>참고 문헌 " + keys.length + "건</h2>" +
      "<p class='why'>각 해결법은 아래의 논문·가이드라인·책의 결론을 바탕으로 일상에서 실천할 수 있게 정리했습니다. 개별 연구의 효과 크기는 사람마다 다를 수 있습니다.</p>" +
      "<ul class='refs'>" + keys.map(refHtml).join("") + "</ul>";
    show();
  });

  render();
  var h = parseInt(location.hash.slice(1), 10);
  if (h) open(h);
})();
