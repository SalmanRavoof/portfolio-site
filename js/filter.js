// Archive page: renders all clips and filters them by publication,
// topic, and content type. Filter state lives in the URL query string
// (?pub=kinsta&topic=performance&type=tutorial) so any filtered view
// can be bookmarked or shared in a pitch email.
(function () {
  var DATA = window.PORTFOLIO_DATA;
  var grid = document.querySelector("[data-archive-grid]");
  if (!DATA || !grid) return;

  var TYPE_LABELS = (window.PORTFOLIO_HELPERS || {}).TYPE_LABELS || {};

  function slug(s) {
    return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }
  function labelize(s) { return String(s).replace(/-/g, " "); }

  // Collect available filter values from the data itself.
  function unique(getter) {
    var seen = {};
    var out = [];
    DATA.clips.forEach(function (c) {
      [].concat(getter(c)).forEach(function (v) {
        if (v && !seen[slug(v)]) { seen[slug(v)] = true; out.push(v); }
      });
    });
    return out;
  }

  var AXES = [
    // Publication filter is hidden from the UI, but every clip keeps its
    // `publication` field (used for the card meta + monogram). To bring the
    // filter back, uncomment:
    // { key: "pub", label: "Publication", values: unique(function (c) { return c.publication; }),
    //   match: function (c, v) { return slug(c.publication) === v; },
    //   display: function (v) { return v; } },
    { key: "topic", label: "Topic", values: unique(function (c) { return c.topics; }),
      match: function (c, v) { return c.topics.some(function (t) { return slug(t) === v; }); },
      display: labelize },
    { key: "credit", label: "Credit", values: ["Authored", "Editorial"],
      match: function (c, v) { return v === "editorial" ? !!c.role : !c.role; },
      display: function (v) { return v.charAt(0).toUpperCase() + v.slice(1); } }
    // Content type filter is hidden from the UI, but every clip keeps its
    // `type` field in clips.data.js. To bring the filter back, uncomment:
    // ,{ key: "type", label: "Content type", values: unique(function (c) { return c.type; }),
    //   match: function (c, v) { return slug(c.type) === v; },
    //   display: function (v) { return TYPE_LABELS[v] || labelize(v); } }
  ];

  var state = {};
  AXES.forEach(function (a) { state[a.key] = null; });

  // --- Read initial state from the URL ---
  var params = new URLSearchParams(location.search);
  AXES.forEach(function (a) {
    var v = params.get(a.key);
    if (v && a.values.some(function (val) { return slug(val) === slug(v); })) {
      state[a.key] = slug(v);
    }
  });

  // --- Build filter chips ---
  var groupsRoot = document.querySelector("[data-filter-groups]");
  AXES.forEach(function (axis) {
    var group = document.createElement("div");
    group.className = "filter-group";
    group.setAttribute("role", "group");
    group.setAttribute("aria-label", "Filter by " + axis.label.toLowerCase());

    var label = document.createElement("span");
    label.className = "filter-label";
    label.textContent = axis.label;
    group.appendChild(label);

    axis.values.forEach(function (value) {
      var chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chip";
      chip.textContent = axis.display(slug(value)) === slug(value) ? value : axis.display(slug(value));
      chip.dataset.axis = axis.key;
      chip.dataset.value = slug(value);
      chip.setAttribute("aria-pressed", String(state[axis.key] === slug(value)));
      chip.addEventListener("click", function () {
        state[axis.key] = state[axis.key] === chip.dataset.value ? null : chip.dataset.value;
        render();
      });
      group.appendChild(chip);
    });
    groupsRoot.appendChild(group);
  });

  var countNode = document.querySelector("[data-filter-count]");
  var clearBtn = document.querySelector("[data-filter-clear]");
  var shareBtn = document.querySelector("[data-filter-share]");
  var emptyNode = document.querySelector("[data-archive-empty]");
  var activeBadge = document.querySelector("[data-filter-active]");

  // Mobile: expand/collapse the filter panel
  var filterToggle = document.querySelector("[data-filter-toggle]");
  var filterPanel = document.getElementById("filter-panel");
  if (filterToggle && filterPanel) {
    filterToggle.addEventListener("click", function () {
      var open = filterPanel.classList.toggle("is-open");
      filterToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  if (clearBtn) clearBtn.addEventListener("click", function () {
    AXES.forEach(function (a) { state[a.key] = null; });
    render();
  });

  if (shareBtn) shareBtn.addEventListener("click", function () {
    navigator.clipboard.writeText(location.href).then(function () {
      var original = shareBtn.textContent;
      shareBtn.textContent = "Link copied!";
      setTimeout(function () { shareBtn.textContent = original; }, 1800);
    });
  });

  // --- Render all cards once; filtering toggles visibility ---
  var cards = {};
  DATA.clips.forEach(function (clip) {
    var card = window.buildCard(clip, {});
    card.classList.remove("reveal"); // archive relies on filters, keep it instant
    cards[clip.id] = { node: card, clip: clip };
    grid.appendChild(card);
  });

  function matches(clip) {
    return AXES.every(function (a) {
      return !state[a.key] || a.match(clip, state[a.key]);
    });
  }

  function render() {
    var visible = 0;
    Object.keys(cards).forEach(function (id) {
      var show = matches(cards[id].clip);
      cards[id].node.hidden = !show;
      if (show) visible++;
    });

    var activeCount = AXES.filter(function (a) { return state[a.key]; }).length;
    if (countNode) {
      // No total is surfaced (this is the full archive); only report the
      // match count while filters are active so the number never goes stale.
      countNode.textContent = activeCount
        ? "Showing " + visible + (visible === 1 ? " piece" : " pieces")
        : "";
    }
    // Badge on the mobile toggle so active filters are visible while collapsed
    if (activeBadge) {
      activeBadge.textContent = activeCount;
      activeBadge.hidden = activeCount === 0;
    }
    if (emptyNode) emptyNode.hidden = visible !== 0;

    // Chips
    document.querySelectorAll(".chip").forEach(function (chip) {
      chip.setAttribute("aria-pressed", String(state[chip.dataset.axis] === chip.dataset.value));
    });

    // URL
    var p = new URLSearchParams();
    AXES.forEach(function (a) { if (state[a.key]) p.set(a.key, state[a.key]); });
    var qs = p.toString();
    try {
      history.replaceState(null, "", location.pathname + (qs ? "?" + qs : ""));
    } catch (e) {
      // file:// origins reject replaceState in some browsers; filtering
      // still works, the URL just won't update until the site is hosted.
    }
  }

  render();
})();
