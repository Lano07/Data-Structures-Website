/* COMP 2611 Code Lab — the runner. Programs run off the page's main thread, in a Web Worker built from the interpreter's
   own source (the <script id="cpp-core"> element), so the page never freezes. Output streams in while the program runs,
   a program that reads cin pauses until you type a line, and Stop ends a runaway program at once.
   Where workers are not allowed, programs run on the page as before. */
(function (CL) {
  "use strict";
  var RN = CL.Runner = {};
  RN.DEFAULT_STEPS = 400000000;   // about a minute of work: a real compiler has no limit, but a stuck loop should still end
  RN.DEFAULT_OUT = 2000000;

  // ---------------------------------------------------------------- inside the worker
  function workerMain() {
    var cur = null;
    function post(m) { self.postMessage(m); }
    function clean(res) {
      // results go through structured clone: keep plain data only
      return { ok: res.ok, out: res.out, err: res.err, warnings: res.warnings || [], steps: res.steps, leaks: res.leaks, exitCode: res.exitCode,
        compiled: res.compiled, files: res.files || {}, echoes: res.echoes || [], errRanges: res.errRanges || [], needInput: !!res.needInput, line: res.line || 0 };
    }
    self.onmessage = function (e) {
      var m = e.data;
      if (m.t === "run") {
        var id = m.id, sentParts = 0, sentEchoes = 0, last = Date.now(), t0 = last;
        var opts = m.opts || {};
        opts.tick = function (rt) {
          var now = Date.now();
          if (now - last < 50) return;
          last = now;
          var chunk = "";
          for (var i = sentParts; i < rt.outParts.length; i++) chunk += rt.outParts[i];
          sentParts = rt.outParts.length;
          var ech = rt.echoes.length > sentEchoes ? rt.echoes.slice(sentEchoes) : null;
          sentEchoes = rt.echoes.length;
          post({ t: "out", id: id, chunk: chunk, echoes: ech, steps: rt.steps, ms: now - t0 });
        };
        var res;
        try { res = CPP.run(m.src, opts); }
        catch (ex) { res = { ok: false, compiled: true, out: "", err: { kind: "internal", msg: "The runner hit an internal problem: " + (ex && ex.message ? ex.message : ex), line: 0 } }; }
        var r = clean(res);
        r.ms = Date.now() - t0;
        post({ t: "done", id: id, res: r });
      } else if (m.t === "batch") {
        for (var j = 0; j < m.jobs.length; j++) {
          var job = m.jobs[j], t1 = Date.now(), rj;
          try { rj = clean(CPP.run(job.src, job.opts || {})); }
          catch (ex2) { rj = { ok: false, compiled: true, out: "", err: { kind: "internal", msg: String(ex2 && ex2.message || ex2), line: 0 } }; }
          rj.ms = Date.now() - t1;
          post({ t: "job", id: m.id, i: j, res: rj });
        }
        post({ t: "batchDone", id: m.id });
      }
    };
    post({ t: "ready" });
  }

  var blobUrl = null, workersOk = typeof Worker !== "undefined" && typeof Blob !== "undefined" && typeof URL !== "undefined" && !!URL.createObjectURL;
  function workerUrl() {
    if (blobUrl) return blobUrl;
    var el = document.getElementById("cpp-core");
    var core = el ? el.textContent : "";
    if (!core || core.indexOf("CPP") < 0) { workersOk = false; return null; }
    blobUrl = URL.createObjectURL(new Blob([core + "\n;(" + workerMain.toString() + ")();\n"], { type: "text/javascript" }));
    return blobUrl;
  }
  RN.workersAvailable = function () { return workersOk; };

  // ---------------------------------------------------------------- a runner: one worker, one job at a time
  function Runner() {
    this.w = null;
    this.ready = false;
    this.seq = 0;
    this.job = null;        // { id, kind, cb }
    this.queue = null;      // a job waiting for the worker to start
  }
  Runner.prototype.spawn = function () {
    var self = this;
    if (this.w || !workersOk) return;
    var url = workerUrl();
    if (!url) return;
    try { this.w = new Worker(url); }
    catch (e) { workersOk = false; this.w = null; return; }
    this.ready = false;
    this.w.onmessage = function (e) { self.onMsg(e.data); };
    this.w.onerror = function (e) {
      if (e && e.preventDefault) e.preventDefault();
      // the worker could not start (a strict security policy, for example): run on the page from now on
      if (!self.ready) { workersOk = false; self.kill(); var q = self.queue || (self.job && self.job.msg ? self.job : null); self.queue = null; self.job = null; if (q) self.dispatch(q); }
    };
  };
  Runner.prototype.onMsg = function (m) {
    if (m.t === "ready") {
      this.ready = true;
      if (this.queue) { var q = this.queue; this.queue = null; this.send(q); }
      return;
    }
    var j = this.job;
    if (!j || m.id !== j.id) return;
    if (m.t === "out") { if (j.cb.onOut) j.cb.onOut(m.chunk, m); }
    else if (m.t === "done") { this.job = null; if (j.cb.onDone) j.cb.onDone(m.res); }
    else if (m.t === "job") { if (j.cb.onResult) j.cb.onResult(m.i, m.res); }
    else if (m.t === "batchDone") { this.job = null; if (j.cb.onDone) j.cb.onDone(); }
  };
  Runner.prototype.send = function (j) {
    this.job = j;
    this.w.postMessage(j.msg);
  };
  Runner.prototype.dispatch = function (j) {
    var self = this;
    this.spawn();
    if (this.w) {
      if (this.ready) this.send(j);
      else { this.job = j; this.queue = j; }
      return;
    }
    // no worker: run on the page, after the browser has painted "running"
    this.job = j;
    setTimeout(function () {
      if (self.job !== j) return;
      if (j.msg.t === "run") {
        var t0 = Date.now(), res;
        try { res = CPP.run(j.msg.src, j.msg.opts); }
        catch (ex) { res = { ok: false, compiled: true, out: "", err: { kind: "internal", msg: String(ex && ex.message || ex), line: 0 } }; }
        res.ms = Date.now() - t0;
        self.job = null;
        if (j.cb.onDone) j.cb.onDone(res);
      } else {
        var i = 0;
        (function next() {
          if (self.job !== j) return;
          if (i >= j.msg.jobs.length) { self.job = null; if (j.cb.onDone) j.cb.onDone(); return; }
          var job = j.msg.jobs[i], t1 = Date.now(), r;
          try { r = CPP.run(job.src, job.opts || {}); } catch (ex) { r = { ok: false, compiled: true, out: "", err: { kind: "internal", msg: String(ex && ex.message || ex), line: 0 } }; }
          r.ms = Date.now() - t1;
          if (j.cb.onResult) j.cb.onResult(i, r);
          i++;
          setTimeout(next, 0);
        })();
      }
    }, 16);
  };
  // run one program. opts: stdin | stdinLines + stdinEOF, files, maxSteps, maxOut, now. cb: onOut(chunk, info), onDone(result)
  Runner.prototype.run = function (src, opts, cb) {
    this.stop(true);
    opts = Object.assign({ maxSteps: RN.DEFAULT_STEPS, maxOut: RN.DEFAULT_OUT }, opts || {});
    delete opts.tick;
    var j = { id: ++this.seq, kind: "run", cb: cb || {}, msg: null };
    j.msg = { t: "run", id: j.id, src: src, opts: opts };
    this.dispatch(j);
    return j.id;
  };
  // run many programs (the Code Gym's tests). jobs: [{src, opts}]. cb: onResult(i, result), onDone()
  Runner.prototype.batch = function (jobs, cb) {
    this.stop(true);
    var j = { id: ++this.seq, kind: "batch", cb: cb || {}, msg: null };
    j.msg = { t: "batch", id: j.id, jobs: jobs.map(function (x) { var o = Object.assign({}, x.opts || {}); delete o.tick; return { src: x.src, opts: o }; }) };
    this.dispatch(j);
    return j.id;
  };
  Runner.prototype.busy = function () { return !!this.job; };
  Runner.prototype.kill = function () {
    if (this.w) { try { this.w.terminate(); } catch (e) { /* ignore */ } }
    this.w = null;
    this.ready = false;
  };
  // stop whatever is running; a fresh worker starts straight away so the next run does not wait
  Runner.prototype.stop = function (quiet) {
    var j = this.job;
    this.job = null;
    this.queue = null;
    if (!j) return false;
    if (this.w) { this.kill(); this.spawn(); }
    if (!quiet && j.cb.onStopped) j.cb.onStopped();
    return true;
  };
  Runner.prototype.destroy = function () { this.job = null; this.queue = null; this.kill(); };
  RN.create = function () { return new Runner(); };

  // one shared runner for quick, short checks (quest answers, predicted output)
  var shared = null;
  RN.shared = function () { if (!shared) shared = new Runner(); return shared; };
  // run a short program and get the result back (Promise); never blocks the page when workers are available
  RN.check = function (src, opts) {
    return new Promise(function (resolve) {
      var r = new Runner();
      r.run(src, Object.assign({ maxSteps: 3000000, maxOut: 100000 }, opts || {}), {
        onDone: function (res) { r.destroy(); resolve(res); }
      });
    });
  };
})(CL);
