(function () {
  "use strict";

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------------------
     Sticky nav state on scroll
     ------------------------------------------------------------------ */
  var nav = document.getElementById("site-nav");
  function updateNavState() {
    if (window.scrollY > 8) nav.classList.add("nav-scrolled");
    else nav.classList.remove("nav-scrolled");
  }
  updateNavState();
  window.addEventListener("scroll", updateNavState, { passive: true });

  /* ---------------------------------------------------------------------
     Mobile menu
     ------------------------------------------------------------------ */
  var menuToggle = document.getElementById("menu-toggle");
  var mobileMenu = document.getElementById("mobile-menu");
  var iconOpen = document.getElementById("icon-open");
  var iconClose = document.getElementById("icon-close");

  function setMenu(open) {
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    mobileMenu.classList.toggle("open", open);
    iconOpen.classList.toggle("hidden", open);
    iconClose.classList.toggle("hidden", !open);
    document.body.classList.toggle("menu-open", open);
    if (open) {
      var firstLink = mobileMenu.querySelector("a");
      if (firstLink) firstLink.focus();
    } else {
      menuToggle.focus();
    }
  }

  menuToggle.addEventListener("click", function () {
    setMenu(!mobileMenu.classList.contains("open"));
  });

  mobileMenu.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      setMenu(false);
    });
  });

  // Escape closes the mobile menu; Tab is trapped between the toggle
  // button and the menu's links while it's open.
  document.addEventListener("keydown", function (e) {
    if (!mobileMenu.classList.contains("open")) return;
    if (e.key === "Escape" || e.key === "Esc") {
      setMenu(false);
      return;
    }
    if (e.key === "Tab") {
      var focusable = mobileMenu.querySelectorAll("a");
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        menuToggle.focus();
      } else if (!e.shiftKey && document.activeElement === menuToggle) {
        e.preventDefault();
        first.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        menuToggle.focus();
      }
    }
  });

  /* ---------------------------------------------------------------------
     Section-aware header theme + active nav link (scrollspy)
     ------------------------------------------------------------------ */
  var themedSections = Array.prototype.slice.call(document.querySelectorAll("[data-header-theme]"));
  if (nav && themedSections.length && "IntersectionObserver" in window) {
    var currentHeaderTheme = null;
    var headerObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var theme = entry.target.getAttribute("data-header-theme");
          if (theme !== currentHeaderTheme) {
            currentHeaderTheme = theme;
            nav.setAttribute("data-theme", theme);
          }
        });
      },
      { rootMargin: "-96px 0px -85% 0px", threshold: 0 }
    );
    themedSections.forEach(function (section) {
      headerObserver.observe(section);
    });
  }

  var navLinks = Array.prototype.slice.call(document.querySelectorAll("[data-nav-link]"));
  var navTargetIds = navLinks
    .map(function (link) {
      return link.getAttribute("href").slice(1);
    })
    .filter(function (id) {
      return document.getElementById(id);
    });
  if (navLinks.length && navTargetIds.length && "IntersectionObserver" in window) {
    function setCurrentNavLink(id) {
      navLinks.forEach(function (link) {
        var isCurrent = link.getAttribute("href") === "#" + id;
        link.classList.toggle("is-current", isCurrent);
        if (isCurrent) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    }
    var navSpyObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) setCurrentNavLink(entry.target.id);
        });
      },
      { rootMargin: "-96px 0px -70% 0px", threshold: 0 }
    );
    navTargetIds.forEach(function (id) {
      navSpyObserver.observe(document.getElementById(id));
    });
  }

  /* ---------------------------------------------------------------------
     Destination highlight: briefly flash the section a hero module,
     footer link, or nav link scrolls to
     ------------------------------------------------------------------ */
  var destinationLinks = document.querySelectorAll('.living-system a[href^="#"], .mobile-module[href^="#"]');
  destinationLinks.forEach(function (link) {
    link.addEventListener("click", function () {
      var target = document.getElementById(link.getAttribute("href").slice(1));
      if (!target) return;
      target.classList.remove("destination-highlight");
      void target.offsetWidth;
      target.classList.add("destination-highlight");
      setTimeout(function () {
        target.classList.remove("destination-highlight");
      }, 1300);
    });
  });

  /* ---------------------------------------------------------------------
     Scroll reveal
     ------------------------------------------------------------------ */
  var revealEls = document.querySelectorAll(".reveal");
  if (reducedMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  } else {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry, i) {
          if (entry.isIntersecting) {
            var el = entry.target;
            setTimeout(function () {
              el.classList.add("is-visible");
            }, (i % 6) * 60);
            revealObserver.unobserve(el);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) {
      revealObserver.observe(el);
    });
  }

  /* ---------------------------------------------------------------------
     One-shot "is-visible" reveal for the visual-proof compositions:
     orbit hero, before/after clusters, alternating showcases, collage.
     ------------------------------------------------------------------ */
  var groupEls = document.querySelectorAll(".orbit-stage, .collage, .chaos-cluster, .system-cluster, .showcase-row");
  if (reducedMotion || !("IntersectionObserver" in window)) {
    groupEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  } else {
    var groupObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            groupObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -60px 0px" }
    );
    groupEls.forEach(function (el) {
      groupObserver.observe(el);
    });
  }

  /* ---------------------------------------------------------------------
     Mouse-follow glow (hero + final CTA)
     ------------------------------------------------------------------ */
  if (!reducedMotion) {
    document.querySelectorAll("[data-mouse-glow]").forEach(function (container) {
      var glow = container.querySelector("[data-glow-el]");
      if (!glow) return;
      var raf = null;
      var pending = null;
      container.addEventListener("mousemove", function (e) {
        var rect = container.getBoundingClientRect();
        pending = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        if (!raf) {
          raf = requestAnimationFrame(function () {
            glow.style.transform = "translate(" + (pending.x - 300) + "px, " + (pending.y - 300) + "px)";
            raf = null;
          });
        }
      });
    });
  }

  /* ---------------------------------------------------------------------
     Hero living system: hover/focus highlighting + auto data-flow sequence
     ------------------------------------------------------------------ */
  var livingSystem = document.querySelector(".living-system");
  if (livingSystem) {
    var lsModules = Array.prototype.slice.call(livingSystem.querySelectorAll("[data-module]"));
    var lsLines = Array.prototype.slice.call(livingSystem.querySelectorAll("[data-line]"));
    var lsCore = livingSystem.querySelector(".system-core");
    var lsPulse = livingSystem.querySelector(".flow-pulse");

    function lsSetActive(key) {
      livingSystem.classList.add("has-active");
      lsModules.forEach(function (m) {
        m.classList.toggle("is-active", m.getAttribute("data-module") === key);
      });
      lsLines.forEach(function (l) {
        l.classList.toggle("is-active", l.getAttribute("data-line") === key);
      });
    }
    function lsClearActive() {
      livingSystem.classList.remove("has-active");
      lsModules.forEach(function (m) {
        m.classList.remove("is-active");
      });
      lsLines.forEach(function (l) {
        l.classList.remove("is-active");
      });
    }

    var lsUserActive = false;
    var lsInteractive = lsModules.concat(lsCore ? [lsCore] : []);
    lsInteractive.forEach(function (el) {
      var key = el.getAttribute("data-module");
      el.addEventListener("mouseenter", function () {
        lsUserActive = true;
        lsSetActive(key);
      });
      el.addEventListener("focus", function () {
        lsUserActive = true;
        lsSetActive(key);
      });
      el.addEventListener("mouseleave", function () {
        lsUserActive = false;
      });
      el.addEventListener("blur", function () {
        lsUserActive = false;
      });
    });
    livingSystem.addEventListener("mouseleave", function () {
      lsUserActive = false;
    });

    function lsTravelPulse(targetEl) {
      if (!lsPulse || !lsCore || !targetEl || reducedMotion || typeof lsPulse.animate !== "function") return;
      var coreRect = lsCore.getBoundingClientRect();
      var targetRect = targetEl.getBoundingClientRect();
      var dx = targetRect.left + targetRect.width / 2 - (coreRect.left + coreRect.width / 2);
      var dy = targetRect.top + targetRect.height / 2 - (coreRect.top + coreRect.height / 2);
      lsPulse.getAnimations().forEach(function (a) {
        a.cancel();
      });
      lsPulse.animate(
        [
          { transform: "translate(-50%, -50%)", opacity: 0, offset: 0 },
          { transform: "translate(-50%, -50%)", opacity: 1, offset: 0.12 },
          { transform: "translate(calc(-50% + " + dx + "px), calc(-50% + " + dy + "px))", opacity: 1, offset: 0.86 },
          { transform: "translate(calc(-50% + " + dx + "px), calc(-50% + " + dy + "px))", opacity: 0, offset: 1 },
        ],
        { duration: 1200, easing: "cubic-bezier(0.4, 0, 0.2, 1)" }
      );
    }

    var lsSequence = ["website", "crm", "aiWorkflow", "automation", "dashboard"];
    var lsSeqIndex = 0;
    var lsSeqTimer = null;
    var lsInView = false;

    function lsRunStep() {
      if (reducedMotion) return;
      if (!lsInView || lsUserActive) {
        lsSeqTimer = setTimeout(lsRunStep, 700);
        return;
      }
      var key = lsSequence[lsSeqIndex];
      var targetEl = livingSystem.querySelector('[data-module="' + key + '"]');
      if (targetEl) {
        lsSetActive(key);
        lsTravelPulse(targetEl);
      }
      var isLast = lsSeqIndex === lsSequence.length - 1;
      lsSeqIndex = (lsSeqIndex + 1) % lsSequence.length;
      lsSeqTimer = setTimeout(lsRunStep, isLast ? 3000 : 1700);
    }

    function lsStartSequence() {
      if (reducedMotion || lsSeqTimer) return;
      lsSeqTimer = setTimeout(lsRunStep, 1500);
    }
    function lsStopSequence() {
      if (lsSeqTimer) {
        clearTimeout(lsSeqTimer);
        lsSeqTimer = null;
      }
      lsClearActive();
    }

    if (reducedMotion) {
      lsModules.forEach(function (m) {
        m.classList.add("is-active");
      });
    } else if ("IntersectionObserver" in window) {
      var lsObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            lsInView = entry.isIntersecting;
            if (lsInView) lsStartSequence();
            else lsStopSequence();
          });
        },
        { threshold: 0.3 }
      );
      lsObserver.observe(livingSystem);
    }
  }

  /* ---------------------------------------------------------------------
     Roadmap (process): nodes light up + connecting line fills as you scroll
     ------------------------------------------------------------------ */
  var roadmap = document.getElementById("roadmap");
  if (roadmap) {
    var roadmapFill = document.getElementById("roadmap-fill");
    var roadmapNodes = Array.prototype.slice.call(roadmap.querySelectorAll("[data-roadmap-node]"));

    if (reducedMotion) {
      roadmapNodes.forEach(function (n) {
        n.classList.add("is-active");
      });
      if (roadmapFill) roadmapFill.style.height = "100%";
    } else {
      var nodeObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) entry.target.classList.add("is-active");
          });
        },
        { threshold: 0.5, rootMargin: "0px 0px -10% 0px" }
      );
      roadmapNodes.forEach(function (n) {
        nodeObserver.observe(n);
      });

      var fillTicking = false;
      function updateRoadmapFill() {
        fillTicking = false;
        var rect = roadmap.getBoundingClientRect();
        var vh = window.innerHeight;
        var total = rect.height;
        var scrolled = vh * 0.6 - rect.top;
        var pct = total > 0 ? Math.max(0, Math.min(1, scrolled / total)) : 0;
        if (roadmapFill) roadmapFill.style.height = pct * 100 + "%";
      }
      window.addEventListener(
        "scroll",
        function () {
          if (!fillTicking) {
            fillTicking = true;
            requestAnimationFrame(updateRoadmapFill);
          }
        },
        { passive: true }
      );
      updateRoadmapFill();
    }
  }

  /* ---------------------------------------------------------------------
     Live counters on dashboard mockups
     ------------------------------------------------------------------ */
  var counters = document.querySelectorAll("[data-count-to]");
  if (counters.length) {
    function formatCount(n) {
      return Math.round(n).toLocaleString("en-US");
    }
    function runCounter(el) {
      var target = parseFloat(el.getAttribute("data-count-to"));
      var prefix = el.getAttribute("data-prefix") || "";
      var suffix = el.getAttribute("data-suffix") || "";
      if (reducedMotion) {
        el.textContent = prefix + formatCount(target) + suffix;
        return;
      }
      var start = performance.now();
      var duration = 1100;
      function tick(now) {
        var t = Math.min(1, (now - start) / duration);
        var eased = 1 - Math.pow(1 - t, 3);
        el.textContent = prefix + formatCount(target * eased) + suffix;
        if (t < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }
    var counterObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            runCounter(entry.target);
            counterObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach(function (el) {
      counterObserver.observe(el);
    });
  }

  /* ---------------------------------------------------------------------
     Hero vapor-text cycler
     ------------------------------------------------------------------ */
  var vaporCanvas = document.getElementById("hero-vapor");
  if (vaporCanvas && window.VaporCycler) {
    new window.VaporCycler(vaporCanvas, {
      texts: ["Strategy.", "Systems.", "Build."],
      font: { fontFamily: "Space Grotesk, sans-serif", fontSize: "15px", fontWeight: 600 },
      color: "rgb(165, 162, 168)",
      spread: 3,
      density: 4,
      direction: "left-to-right",
      alignment: "left",
      animation: { vaporizeDuration: 1.4, fadeInDuration: 0.8, waitDuration: 1.6 },
    });
  }

  /* ---------------------------------------------------------------------
     Project inquiry form
     ------------------------------------------------------------------ */
  var form = document.getElementById("project-form");
  if (form) {
    var successEl = document.getElementById("form-success");
    var errorEl = document.getElementById("form-error");
    var errorHeadingEl = errorEl.querySelector("[data-error-heading]");
    var errorBodyEl = errorEl.querySelector("[data-error-body]");
    var submitBtn = document.getElementById("form-submit");
    var submitting = false;

    var ERROR_VALIDATION = {
      heading: "Something needs your attention above before this can be sent.",
      body: "",
    };
    var ERROR_NETWORK = {
      heading: "Your inquiry could not be sent.",
      body: 'Please try again or email us directly at <a href="mailto:info@systemizemethod.com" class="underline underline-offset-2">info@systemizemethod.com</a>.',
    };

    function showError(state) {
      errorHeadingEl.textContent = state.heading;
      errorBodyEl.innerHTML = state.body;
      errorBodyEl.classList.toggle("hidden", !state.body);
      errorEl.classList.remove("hidden");
    }

    function fieldWrap(el) {
      return el.closest(".field");
    }

    function validate() {
      var valid = true;

      ["name", "email", "description"].forEach(function (name) {
        var input = form.elements[name];
        var wrap = fieldWrap(input);
        var ok = input.value.trim().length > 0;
        if (name === "email" && ok) {
          ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
        }
        wrap.classList.toggle("field-invalid", !ok);
        if (ok) {
          input.removeAttribute("aria-invalid");
        } else {
          input.setAttribute("aria-invalid", "true");
        }
        if (!ok) valid = false;
      });

      var buildTypeWrap = form.querySelector('[data-field="buildType"]');
      var buildTypeChecked = form.querySelector('input[name="buildType"]:checked');
      buildTypeWrap.classList.toggle("field-invalid", !buildTypeChecked);
      buildTypeWrap.setAttribute("aria-invalid", buildTypeChecked ? "false" : "true");
      if (!buildTypeChecked) valid = false;

      return valid;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (submitting) return;
      successEl.classList.add("hidden");
      errorEl.classList.add("hidden");

      if (!validate()) {
        showError(ERROR_VALIDATION);
        var firstInvalid = form.querySelector(".field-invalid");
        if (firstInvalid) {
          firstInvalid.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" });
        }
        return;
      }

      // Honeypot: bots tend to fill every field. A human never sees or
      // fills #bot-field, so a non-empty value means treat it as spam by
      // silently pretending it succeeded rather than telling the bot why.
      if (form.elements["bot-field"] && form.elements["bot-field"].value) {
        form.reset();
        successEl.classList.remove("hidden");
        return;
      }

      submitting = true;
      submitBtn.disabled = true;

      fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(new FormData(form)).toString(),
      })
        .then(function (response) {
          submitting = false;
          submitBtn.disabled = false;
          if (!response.ok) throw new Error("Form submission failed with status " + response.status);
          form.reset();
          form.querySelectorAll(".field-invalid").forEach(function (el) {
            el.classList.remove("field-invalid");
          });
          form.querySelectorAll("[aria-invalid]").forEach(function (el) {
            el.removeAttribute("aria-invalid");
          });
          successEl.classList.remove("hidden");
          successEl.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" });
        })
        .catch(function () {
          submitting = false;
          submitBtn.disabled = false;
          showError(ERROR_NETWORK);
          errorEl.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" });
        });
    });
  }
})();
