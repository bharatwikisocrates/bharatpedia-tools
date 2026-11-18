/* Shared cross-link navigation for the Bharatpedia tools suite.
   Every tool page loads this file. It adds one navigation box at the
   top of the page:
   - "This page" links open the other page tools for the same article.
   - "This user" links open the other user tools for the same user.
   - "All tools" lists the whole suite.
   The subject is read from the page URL first and then from the
   tool's own input boxes, and link targets are refreshed as the
   user types, so a click always carries the current subject.
   It also fills a tool's inputs from the URL when the tool does not
   do that itself, and presses its main button when enough of the
   subject is present to run straight away. */
(function () {
  "use strict";

  var ALL_TOOLS = [
    ["index.html", "All Tools"],
    ["admin-command-center.html", "Admin Command Center"],
    ["csd-dashboard.html", "CSD Dashboard"],
    ["new-pages-patrol.html", "New Pages Patrol"],
    ["vandalism-radar.html", "Vandalism Radar"],
    ["draft-reviewer.html", "Draft Reviewer"],
    ["stale-draft-rescuer.html", "Stale Draft Rescuer"],
    ["block-manager.html", "Block Manager"],
    ["duplicate-finder.html", "Duplicate Finder"],
    ["file-analyzer.html", "File Analyzer"],
    ["image-gap-finder.html", "Image Gap Finder"],
    ["user-contributions-analyzer.html", "User Contributions"],
    ["afd-stats.html", "AfD Statistics"],
     ["autoedits.html", "Automated Edits"],
    ["afc-history.html", "AfC Review History"],
    ["sock-checker.html", "Account Overlap"],
    ["page-statistics.html", "Page Statistics"],
    ["wikiblame.html", "Find Addition / Removal"],
    ["page-edits-by-user.html", "Edits by User"],
    ["auto-interlinker.html", "Auto Interlinker"],
    ["reference-fixer.html", "Reference Fixer"],
    ["dead-link-checker.html", "Dead Link Checker"],
    ["fix-dead-links.html", "Fix Dead Links"]
  ];

  /* Page tools: file, label, URL parameter that carries the page. */
  var PAGE_TOOLS = [
    ["page-statistics.html", "Page Statistics", "title"],
    ["wikiblame.html", "Find Addition / Removal", "page"],
    ["page-edits-by-user.html", "Edits by User", "page"],
    ["auto-interlinker.html", "Auto Interlinker", "title"],
    ["reference-fixer.html", "Reference Fixer", "title"],
    ["dead-link-checker.html", "Dead Link Checker", "title"],
    ["fix-dead-links.html", "Fix Dead Links", "title"]
  ];

  /* User tools: file, label, URL parameter that carries the user. */
  var USER_TOOLS = [
    ["user-contributions-analyzer.html", "User Contributions", "user"],
   
    ["afd-stats.html", "AfD Statistics", "user"],
     ["autoedits.html", "Automated Edits", "user"],
    ["afc-history.html", "AfC Review History", "user"],
    ["page-edits-by-user.html", "Edits by User", "user"],
    ["sock-checker.html", "Account Overlap", "user"]
  ];

  /* Tools that do not read the URL themselves.
     Key: file. Value: input id -> URL parameters to try, the main
     button id, and whether every listed input must be filled
     before the button is pressed automatically. */
  var AUTOFILL = {
    "page-statistics.html": { inputs: { title: ["title", "page"] }, btn: "go", needAll: true },
    "dead-link-checker.html": { inputs: { title: ["title", "page"] }, btn: "go", needAll: true },
    "fix-dead-links.html": { inputs: { title: ["title", "page"] }, btn: "go", needAll: true },
    "auto-interlinker.html": { inputs: { title: ["title", "page"] }, btn: "go", needAll: true },
    "reference-fixer.html": { inputs: { title: ["title", "page"] }, btn: "scanBtn", needAll: true },
    "wikiblame.html": { inputs: { page: ["page", "title"] }, btn: null, needAll: true },
    "page-edits-by-user.html": { inputs: { page: ["page", "title"], user: ["user", "username"] }, btn: "go", needAll: true },
    "sock-checker.html": { inputs: { u1: ["user", "username", "u1"], u2: ["user2", "u2"] }, btn: "go", needAll: true },
    "duplicate-finder.html": { inputs: { q: ["q", "title", "page"] }, btn: null, needAll: true },
    "image-gap-finder.html": { inputs: { cat: ["cat", "category"] }, btn: null, needAll: true }
  };

  function currentFile() {
    var p = window.location.pathname.split("/").pop();
    return p ? decodeURIComponent(p) : "index.html";
  }

  function urlParams() {
    return new URLSearchParams(window.location.search);
  }

  function inputVal(id) {
    var e = document.getElementById(id);
    return e && typeof e.value === "string" ? e.value.trim() : "";
  }

  /* The current subject: URL first at load, live inputs after that. */
  function currentCtx() {
    var q = urlParams();
    var page = inputVal("title") || inputVal("page") || inputVal("titleInput") ||
      (q.get("title") || q.get("page") || "").trim();
    var user = inputVal("user") || inputVal("u1") ||
      (q.get("user") || q.get("username") || "").trim();
    var user2 = inputVal("u2") || (q.get("user2") || "").trim();
    return { page: page, user: user, user2: user2 };
  }

  function buildHref(kind, entry, ctx) {
    var file = entry[0], param = entry[2];
    var parts = [];
    if (kind === "page" && ctx.page) {
      parts.push(param + "=" + encodeURIComponent(ctx.page));
      if (file === "page-edits-by-user.html" && ctx.user) {
        parts.push("user=" + encodeURIComponent(ctx.user));
      }
    } else if (kind === "user" && ctx.user) {
      parts.push(param + "=" + encodeURIComponent(ctx.user));
      if (file === "sock-checker.html" && ctx.user2) {
        parts.push("user2=" + encodeURIComponent(ctx.user2));
      }
      if (file === "page-edits-by-user.html" && ctx.page) {
        parts.push("page=" + encodeURIComponent(ctx.page));
      }
    }
    return parts.length ? file + "?" + parts.join("&") : file;
  }

  function labelFor(file) {
    for (var i = 0; i < ALL_TOOLS.length; i++) {
      if (ALL_TOOLS[i][0] === file) return ALL_TOOLS[i][1];
    }
    return file;
  }

  function makeLink(kind, entry, ctx, here) {
    var a = document.createElement("a");
    a.textContent = entry[1];
    a.href = kind === "all" ? entry[0] : buildHref(kind, entry, ctx);
    if (kind !== "all") {
      a.setAttribute("data-bp-kind", kind);
      a.setAttribute("data-bp-file", entry[0]);
      a.setAttribute("data-bp-param", entry[2]);
    }
    if (entry[0] === here) {
      a.className = "bp-active";
      a.setAttribute("aria-current", "page");
    }
    return a;
  }

  function refreshLinks(nav) {
    var ctx = currentCtx();
    var links = nav.querySelectorAll("a[data-bp-kind]");
    for (var i = 0; i < links.length; i++) {
      var kind = links[i].getAttribute("data-bp-kind");
      var entry = [links[i].getAttribute("data-bp-file"), links[i].textContent,
        links[i].getAttribute("data-bp-param")];
      links[i].href = buildHref(kind, entry, ctx);
    }
  }

  function render() {
    var here = currentFile();
    var ctx = currentCtx();
    var inPage = PAGE_TOOLS.some(function (e) { return e[0] === here; });
    var inUser = USER_TOOLS.some(function (e) { return e[0] === here; });

    var nav = document.createElement("nav");
    nav.className = "bp-tools-nav";
    nav.setAttribute("aria-label", "Bharatpedia tools");

    var top = document.createElement("div");
    top.className = "bp-nav-top";
    var home = document.createElement("a");
    home.className = "bp-nav-home";
    home.href = "index.html";
    home.textContent = "Bharatpedia Tools";
    top.appendChild(home);
    var cur = document.createElement("span");
    cur.className = "bp-nav-current";
    cur.textContent = here === "index.html" ? "Pick a tool below, or open one and use these links to jump between tools for the same page or user." : "You are here: " + labelFor(here);
    top.appendChild(cur);
    nav.appendChild(top);

    if (inPage || ctx.page) {
      var row = document.createElement("div");
      row.className = "bp-nav-row";
      var lab = document.createElement("span");
      lab.className = "bp-nav-label";
      lab.textContent = "This page:";
      row.appendChild(lab);
      PAGE_TOOLS.forEach(function (e) { row.appendChild(makeLink("page", e, ctx, here)); });
      nav.appendChild(row);
    }

    if (inUser || ctx.user) {
      var urow = document.createElement("div");
      urow.className = "bp-nav-row";
      var ulab = document.createElement("span");
      ulab.className = "bp-nav-label";
      ulab.textContent = "This user:";
      urow.appendChild(ulab);
      USER_TOOLS.forEach(function (e) { urow.appendChild(makeLink("user", e, ctx, here)); });
      nav.appendChild(urow);
    }

    var det = document.createElement("details");
    det.className = "bp-nav-all";
    var sum = document.createElement("summary");
    sum.textContent = "All tools";
    det.appendChild(sum);
    var list = document.createElement("div");
    list.className = "bp-nav-all-list";
    ALL_TOOLS.forEach(function (e) { list.appendChild(makeLink("all", e, ctx, here)); });
    det.appendChild(list);
    nav.appendChild(det);

    var wrap = document.querySelector(".wrap") || document.body;
    wrap.insertBefore(nav, wrap.firstChild);

    document.addEventListener("input", function () { refreshLinks(nav); });
    nav.addEventListener("mousedown", function () { refreshLinks(nav); });
  }

  function autoFill() {
    var spec = AUTOFILL[currentFile()];
    if (!spec) return;
    var q = urlParams();
    var filledAny = false, allFilled = true;
    Object.keys(spec.inputs).forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) { allFilled = false; return; }
      if (el.value.trim()) { filledAny = true; return; }
      var v = "";
      spec.inputs[id].forEach(function (p) {
        if (!v && q.get(p)) v = q.get(p).trim();
      });
      if (v) { el.value = v; filledAny = true; }
      if (!el.value.trim()) allFilled = false;
    });
    if (spec.btn && filledAny && (!spec.needAll || allFilled)) {
      var btn = document.getElementById(spec.btn);
      if (btn && !btn.disabled) btn.click();
    }
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { buildHref: buildHref, PAGE_TOOLS: PAGE_TOOLS, USER_TOOLS: USER_TOOLS, ALL_TOOLS: ALL_TOOLS, AUTOFILL: AUTOFILL };
    return;
  }

  render();
  autoFill();
})();
