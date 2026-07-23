// Shared rendering + landing page behavior.
// All content comes from js/clips.data.js (window.PORTFOLIO_DATA).
(function () {
  var DATA = window.PORTFOLIO_DATA || { clips: [], testimonials: [] };

  var TINTS = {
    "Kinsta": "var(--tint-kinsta)",
    "rtCamp": "var(--tint-rtcamp)",
    "WP Rocket": "var(--tint-wprocket)",
    "WPMU DEV": "var(--tint-wpmudev)",
    "Multidots": "var(--tint-multidots)"
  };

  var TYPE_LABELS = {
    "thought-leadership": "thought leadership",
    "comparison": "comparison",
    "migration-guide": "migration guide",
    "performance-guide": "performance guide",
    "product-led": "product-led",
    "original-research": "original research",
    "roundup": "roundup",
    "deep-dive": "deep-dive guide",
    "explainer": "explainer",
    "security-guide": "security guide",
    "troubleshooting": "troubleshooting",
    "tutorial": "tutorial"
  };

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === "text") node.textContent = attrs[k];
      else if (k === "html") node.innerHTML = attrs[k];
      else node.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (c) node.appendChild(c); });
    return node;
  }

  // Build one article card. Used by both the landing featured grid
  // and the archive grid.
  function buildCard(clip, opts) {
    opts = opts || {};
    var card = el("article", { "class": "card reveal", "data-id": clip.id });

    // Media: OG image if present, publication monogram tile otherwise.
    var media = el("div", { "class": "card-media" });
    media.style.setProperty("--tint", TINTS[clip.publication] || "var(--accent-soft)");
    if (clip.image) {
      media.appendChild(el("img", {
        src: clip.image,
        alt: "",
        loading: "lazy",
        width: "1200",
        height: "630"
      }));
    } else {
      media.appendChild(el("span", { "class": "card-monogram", text: clip.publication, "aria-hidden": "true" }));
    }
    if (opts.showAudience && clip.audience) {
      media.appendChild(el("span", { "class": "card-audience", text: clip.audience }));
    }
    card.appendChild(media);

    var body = el("div", { "class": "card-body" });

    var meta = el("div", { "class": "card-meta" });
    meta.appendChild(el("span", { text: clip.publication }));
    meta.appendChild(el("span", { "aria-hidden": "true", text: "\u00b7" }));
    meta.appendChild(el("span", { text: TYPE_LABELS[clip.type] || clip.type }));
    if (clip.ghostwritten) {
      meta.appendChild(el("span", { "class": "ghost-flag", text: "ghostwritten" }));
    }
    if (clip.role) {
      meta.appendChild(el("span", { "class": "role-flag", text: clip.role }));
    }
    body.appendChild(meta);

    var h = el("h3", null, [el("a", { href: clip.url, target: "_blank", rel: "noopener", text: clip.title })]);
    body.appendChild(h);

    // External validation badge (e.g. cited by the tool's own project).
    if (clip.cite) {
      var check = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';
      var citeAttrs = { "class": "card-cite", html: check + "<span>" + clip.cite + "</span>" };
      var citeTag = "span";
      if (clip.citeUrl) {
        citeTag = "a";
        citeAttrs.href = clip.citeUrl;
        citeAttrs.target = "_blank";
        citeAttrs.rel = "noopener";
      }
      body.appendChild(el(citeTag, citeAttrs));
    }

    if (clip.description) {
      body.appendChild(el("p", { "class": "card-desc", text: clip.description }));
    }

    if (clip.metric) {
      body.appendChild(el("span", { "class": "card-metric", text: clip.metric }));
    }
    if (clip.note) {
      body.appendChild(el("span", { "class": "card-meta", text: clip.note }));
    }

    card.appendChild(body);
    return card;
  }

  // Expose for filter.js
  window.buildCard = buildCard;
  window.PORTFOLIO_HELPERS = { TYPE_LABELS: TYPE_LABELS };

  // ----- Featured grid (landing page) -----
  var featuredGrid = document.querySelector("[data-featured-grid]");
  if (featuredGrid) {
    var featuredClips = DATA.clips.filter(function (c) { return c.featured; });
    featuredClips.forEach(function (clip) {
      featuredGrid.appendChild(buildCard(clip, { showAudience: true }));
    });
    // Keep the heading's count in sync with the data automatically.
    var featuredCountNode = document.querySelector("[data-featured-count]");
    if (featuredCountNode) featuredCountNode.textContent = featuredClips.length;
  }

  // ----- Testimonials -----
  var tGrid = document.querySelector("[data-testimonials]");
  if (tGrid) {
    var section = tGrid.closest("section");
    if (DATA.showTestimonials === false) {
      if (section) section.hidden = true;
    } else {
      DATA.testimonials.forEach(function (t) {
        var fig = el("figure", { "class": "testimonial" + (t.placeholder ? " is-placeholder" : "") }, [
          el("blockquote", { text: t.quote }),
          el("figcaption", { html: "<strong>" + t.name + "</strong> \u00b7 " + t.role + ", " + t.company })
        ]);
        tGrid.appendChild(fig);
      });
    }
  }

  // ----- Publication logos: show the image only if the file exists -----
  document.querySelectorAll(".pub-link img").forEach(function (img) {
    function mark() { img.closest(".pub-link").classList.add("has-logo"); }
    if (img.complete && img.naturalWidth > 0) mark();
    else img.addEventListener("load", mark);
    // On error, nothing happens: the text wordmark stays visible.
  });

  // ----- Copy email -----
  document.querySelectorAll(".copy-email").forEach(function (btn) {
    var email = btn.getAttribute("data-email");
    var label = btn.querySelector("[data-label]");
    btn.addEventListener("click", function () {
      navigator.clipboard.writeText(email).then(function () {
        btn.classList.add("copied");
        if (label) label.textContent = "Copied!";
        setTimeout(function () {
          btn.classList.remove("copied");
          if (label) label.textContent = email;
        }, 1800);
      });
    });
  });

  // ----- Scroll-spy for landing nav -----
  var spyLinks = document.querySelectorAll("[data-spy]");
  if (spyLinks.length && "IntersectionObserver" in window) {
    var map = {};
    spyLinks.forEach(function (link) {
      var id = link.getAttribute("href").replace("#", "");
      map[id] = link;
    });
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          spyLinks.forEach(function (l) { l.classList.remove("is-active"); });
          var link = map[entry.target.id];
          if (link) link.classList.add("is-active");
        }
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    Object.keys(map).forEach(function (id) {
      var target = document.getElementById(id);
      if (target) observer.observe(target);
    });
  }

  // ----- Reveal on scroll -----
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var revealNodes = document.querySelectorAll(".reveal");
  if (!reduced && "IntersectionObserver" in window) {
    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    revealNodes.forEach(function (n) { revealObs.observe(n); });
  } else {
    revealNodes.forEach(function (n) { n.classList.add("is-visible"); });
  }

  // ----- Mobile nav toggle -----
  var navToggle = document.querySelector(".nav-toggle");
  var siteNav = document.getElementById("primary-nav");
  if (navToggle && siteNav) {
    var setOpen = function (open) {
      siteNav.classList.toggle("is-open", open);
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    };
    navToggle.addEventListener("click", function () {
      setOpen(!siteNav.classList.contains("is-open"));
    });
    // Close after choosing a link
    siteNav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });
    // Close on Escape, return focus to the button
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && siteNav.classList.contains("is-open")) {
        setOpen(false);
        navToggle.focus();
      }
    });
    // Close when clicking outside the header
    document.addEventListener("click", function (e) {
      if (siteNav.classList.contains("is-open") && !e.target.closest(".site-header")) {
        setOpen(false);
      }
    });
  }

  // ----- Sticky header: subtle shadow once scrolled -----
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 4);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }
})();
