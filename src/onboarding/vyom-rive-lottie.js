/* Vendored as-is from the design package "vyom-onboarding-launchwithspark" (web/vyom-rive-lottie.js).
   OnboardingLaunch feeds it lottie-web and the Rive runtime. Do not edit: replace it from the package. */
/*!
 * vyom-rive-lottie.js: puts the live Spark Rive character on top of the vyom-onboarding Lottie
 * and keeps it in sync with it.
 *
 * Everything in the animation except Spark (Vyom, the Goal icon, the trail, ...) is drawn by the
 * Lottie itself. The Lottie only carries one invisible placeholder layer, "Spark", whose transform
 * (centre, scale, rotation, opacity) is baked frame by frame, plus comp markers named
 * "spark:<input>=<value>" for every expression / trigger / look-direction change. This script:
 *   1. loads sparkstatemachine.riv into a canvas laid over the Lottie,
 *   2. on every drawn Lottie frame, moves that canvas onto the placeholder,
 *   3. fires the marker cues into the Rive view model as the playhead passes them.
 *
 * The Lottie plays comp frames ip..op (20..202, the "Start" and "End" markers of the AE comp).
 * Marker frames are comp frames, so cues before ip are run in the warm-up and cues after op are
 * dropped. If the Lottie has a top-level "rive" block (vyom-onboarding.json does), its warm-up is used.
 *
 * Needs lottie-web (5.8+) and @rive-app/canvas (2.x, view-model data binding).
 *
 *   const anim = lottie.loadAnimation({ container, renderer: 'svg', autoplay: false, loop: false, path: 'lottie/vyom-onboarding.json' });
 *   VyomRiveLottie.attach({ animation: anim, stage: container, spark: { src: 'rive/sparkstatemachine.riv' } })
 *     .then(ctrl => anim.play());
 */
(function (root) {
  'use strict';

  // How the .riv is set up. This matches the file and the way the video was made — change only if
  // the .riv changes (artboard / state machine names, layout size).
  var CHARACTERS = {
    spark: {
      layer: 'Spark', artboard: 'Spark', stateMachine: 'SparkCharacter', file: 'rive/sparkstatemachine.riv',
      box: 300, scaleFactor: 1.5,                // canvas 300 css px, laid out at 200 units (= placeholder box)
      init: function (vi) { ['sparkPositionX', 'sparkPositionY', 'chatPositionX', 'chatPositionY'].forEach(function (k) { num(vi, k, 100); }); },
    },
  };
  // The app's own launch cues, in seconds before comp frame 0. The warm-up runs these, then the
  // markers between comp frame 0 and the Lottie's first frame (ip), so play only once they've run.
  var WARMUP = [
    { at: -3.6, cue: 'spark:trigger=flyIn' },
    { at: -3.55, cue: 'spark:expression=happy' },   // Spark stays happy the whole way
  ];

  function num(vi, k, v) { try { vi.number(k).value = v; } catch (e) { warn('number ' + k, e); } }
  function trig(vi, k) { try { vi.trigger(k).trigger(); } catch (e) { warn('trigger ' + k, e); } }
  function enumSet(vi, k, v) { try { vi.enum(k).value = v; } catch (e) { warn('enum ' + k, e); } }
  function bool(vi, k, v) { try { vi.boolean(k).value = v; } catch (e) { warn('boolean ' + k, e); } }
  function warn(what, e) { if (root.console) console.warn('[vyom-rive-lottie] ' + what + ': ' + (e && e.message)); }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  // "spark:expression=happy" -> { who: 'spark', input: 'expression', value: 'happy' }; input "trigger" fires value
  function parseCue(s) {
    var m = /^\s*(\w+)\s*:\s*(\w+)\s*=\s*([\w-]+)\s*$/.exec(s || '');
    return m ? { who: m[1].toLowerCase(), input: m[2], value: m[3] } : null;
  }

  function loadRive(R, cfg, source, canvas) {
    return new Promise(function (resolve, reject) {
      var opts = {
        canvas: canvas, artboard: cfg.artboard, stateMachines: cfg.stateMachine, autoplay: true, autoBind: true,
        layout: cfg.fit === 'Contain' ? new R.Layout({ fit: R.Fit.Contain }) : new R.Layout({ fit: R.Fit.Layout, layoutScaleFactor: cfg.scaleFactor }),
        onLoad: function () {
          try { r.resizeDrawingSurfaceToCanvas(Math.max(1, root.devicePixelRatio || 1)); } catch (e) {}
          cfg.init(r.viewModelInstance);
          resolve(r);
        },
        onLoadError: function (e) { reject(new Error('could not load ' + cfg.artboard + ': ' + e)); },
      };
      if (source.buffer) opts.buffer = source.buffer; else opts.src = source.src;
      var r = new R.Rive(opts);
    });
  }

  function findLayer(anim, name) {
    var els = (anim.renderer && anim.renderer.elements) || [];
    for (var i = 0; i < els.length; i++) if (els[i] && els[i].data && els[i].data.nm === name) return els[i];
    return null;
  }

  function attach(o) {
    var R = o.rive || root.rive;
    var anim = o.animation, stage = o.stage;
    if (!R || !anim || !stage) return Promise.reject(new Error('attach needs { animation, stage } and the Rive runtime'));
    if (getComputedStyle(stage).position === 'static') stage.style.position = 'relative';

    var whenLottie = anim.isLoaded ? Promise.resolve() : new Promise(function (r) { anim.addEventListener('DOMLoaded', r); });
    var chars = {};
    var names, canvases;
    function makeCanvases() { return names.map(function (who) {
      var cfg = CHARACTERS[who], cv = document.createElement('canvas');
      cv.className = 'rive-' + who;
      cv.style.cssText = 'position:absolute;left:0;top:0;width:' + cfg.box + 'px;height:' + cfg.box +
        'px;transform-origin:50% 50%;pointer-events:none;opacity:0;will-change:transform,opacity;';
      stage.appendChild(cv);
      return cv;
    }); }

    return whenLottie.then(function () {
      // only the characters that have a placeholder layer in this Lottie
      names = Object.keys(CHARACTERS).filter(function (who) {
        var ok = !!findLayer(anim, CHARACTERS[who].layer);
        if (!ok) warn('no "' + CHARACTERS[who].layer + '" layer in this Lottie, ' + who + ' skipped', null);
        return ok;
      });
      canvases = makeCanvases();
      return Promise.all(names.map(function (who, i) {
        return loadRive(R, CHARACTERS[who], o[who] || { src: CHARACTERS[who].file || (who + '.riv') }, canvases[i]).then(function (r) {
          chars[who] = { rive: r, vi: r.viewModelInstance, canvas: canvases[i], cfg: CHARACTERS[who], layer: findLayer(anim, CHARACTERS[who].layer) };
          if (!chars[who].layer) warn('placeholder layer "' + CHARACTERS[who].layer + '" not found', null);
        });
      }));
    }).then(function () {
      var data = anim.animationData, ip = data.ip || 0, fps = data.fr || 30, total = Math.round(data.op - ip);
      // one marker can carry several cues for the same frame, separated by ";". Frames here are
      // the Lottie's own (anim.currentFrame, 0 = comp frame ip); cues before 0 go to the warm-up.
      var markers = [], early = [];
      (data.markers || []).forEach(function (m) {
        String(m.cm || '').split(';').forEach(function (part) {
          var c = parseCue(part); if (!c || !chars[c.who]) return;
          var f = Math.round(m.tm) - ip;
          if (f < 0) early.push({ at: f / fps, cue: c }); else if (f < total) markers.push({ frame: f, cue: c });
        });
      });
      markers.sort(function (a, b) { return a.frame - b.frame; });
      // the Lottie's own "rive" block (if it has one) carries the warm-up; otherwise use the defaults
      var warm = data.rive && data.rive.warmup
        ? data.rive.warmup.map(function (w) { return { at: -w.secondsBeforeStart, cue: parseCue(w.cue) }; }).filter(function (w) { return w.cue && chars[w.cue.who]; })
        : WARMUP.map(function (w) { return { at: w.at - ip / fps, cue: parseCue(w.cue) }; }).concat(early);
      warm.sort(function (a, b) { return a.at - b.at; });

      function fire(c) {
        var ch = chars[c.who]; if (!ch) return;
        if (c.input === 'trigger') trig(ch.vi, c.value);
        else if (c.value === 'true' || c.value === 'false') bool(ch.vi, c.input, c.value === 'true');
        else enumSet(ch.vi, c.input, c.value);
      }
      // after a jump (scrub/seek), re-apply the latest enum value of each input; triggers can't be replayed
      function settle(frame) {
        var last = {};
        markers.forEach(function (m) { if (m.frame <= frame && m.cue.input !== 'trigger') last[m.cue.who + ':' + m.cue.input] = m.cue; });
        Object.keys(last).forEach(function (k) { fire(last[k]); });
      }

      // placeholder transform -> canvas css transform, in stage pixels (handles letterboxing)
      function place() {
        var sw = stage.clientWidth, sh = stage.clientHeight, k = Math.min(sw / data.w, sh / data.h);
        var ox = (sw - data.w * k) / 2, oy = (sh - data.h * k) / 2;
        names.forEach(function (who) {
          var ch = chars[who]; if (!ch || !ch.layer || !ch.layer.finalTransform) return;
          var m = ch.layer.finalTransform.mat.props;               // [a b . . c d . . . . . . tx ty . .]
          var a = m[0], b = m[1], tx = m[12], ty = m[13];
          var s = Math.sqrt(a * a + b * b), rot = Math.atan2(b, a) * 180 / Math.PI;
          var op = ch.layer.finalTransform.mProp.o ? ch.layer.finalTransform.mProp.o.v : 1;
          if (op > 1) op /= 100;
          var hidden = ch.layer.isInRange === false || ch.layer.hidden;
          var cx = ox + tx * k, cy = oy + ty * k, half = ch.cfg.box / 2;
          var css = s * k / ch.cfg.scaleFactor;                    // artboard unit -> css px
          ch.canvas.style.transform = 'translate(' + (cx - half).toFixed(2) + 'px,' + (cy - half).toFixed(2) + 'px) rotate(' + rot.toFixed(2) + 'deg) scale(' + css.toFixed(4) + ')';
          ch.canvas.style.opacity = hidden ? '0' : String(Math.max(0, Math.min(1, op)));
        });
      }

      var lastFrame = null;
      function onFrame() {
        var f = anim.currentFrame;
        if (lastFrame !== null) {
          var step = f - lastFrame;
          if (step >= 0 && step < 6) {
            markers.forEach(function (m) { if (m.frame > lastFrame && m.frame <= f) fire(m.cue); });
          } else if (step < 0 && lastFrame > total - 6 && f < 6) {             // looped round
            markers.forEach(function (m) { if (m.frame > lastFrame) fire(m.cue); });
            early.forEach(function (m) { fire(m.cue); });                       // the pre-start cues, at once
            markers.forEach(function (m) { if (m.frame <= f) fire(m.cue); });
          } else {
            settle(f);                                                           // scrubbed / jumped
          }
        }
        lastFrame = f;
        place();
      }
      anim.addEventListener('drawnFrame', onFrame);
      anim.addEventListener('enterFrame', onFrame);
      root.addEventListener('resize', place);
      place();

      var ctrl = {
        characters: chars,
        markers: markers,
        warmUpCues: warm,
        // play the launch cues and the cues before the first frame (about 4.3 s); resolves when the
        // Lottie's first frame matches the video
        warmUp: function () {
          var chain = Promise.resolve(), prev = warm[0].at;
          warm.forEach(function (w) {
            chain = chain.then(function () { return wait((w.at - prev) * 1000); }).then(function () { prev = w.at; fire(w.cue); });
          });
          return chain.then(function () { return wait(-prev * 1000); }).then(function () { lastFrame = anim.currentFrame; place(); });
        },
        place: place,
        settle: settle,
        destroy: function () {
          anim.removeEventListener('drawnFrame', onFrame);
          anim.removeEventListener('enterFrame', onFrame);
          root.removeEventListener('resize', place);
          names.forEach(function (who) { if (chars[who]) { chars[who].rive.cleanup(); chars[who].canvas.remove(); } });
        },
      };
      return o.warmUp === false ? ctrl : ctrl.warmUp().then(function () { return ctrl; });
    });
  }

  root.VyomRiveLottie = { attach: attach, parseCue: parseCue, CHARACTERS: CHARACTERS, WARMUP: WARMUP };
})(typeof window !== 'undefined' ? window : this);
