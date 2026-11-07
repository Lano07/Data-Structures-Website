# Optional compiler service (design and starting implementation)

The Code Lab runs C++ with its own interpreter, in the browser. It covers the C++ used in COMP 2611 (see the site's
**C++ support** page, which is checked against g++ on every build) and refuses everything else by name. For code
outside that subset (classes with member functions, templates, the STL) a real compiler is needed. This folder
describes a small service that could provide one. **It is not deployed, and it has not been security-audited.**

## Threat model

Every request is untrusted code. It may try to: run forever, use all memory or disk, fork many processes, read files,
reach the network, or attack the host. The design assumes it will try all of these.

## Design

1. **One throw-away container per run**, started from a fixed image with only g++ and the C++ standard library.
2. **No network**: `--network none`.
3. **Read-only system**: `--read-only`, with a small private `tmpfs` working folder (16 MB) for the source, the program
   and its files. Nothing is shared between runs; the container is removed afterwards (`--rm`).
4. **An unprivileged user**: `--user 65534:65534`, `--cap-drop ALL`, `--security-opt no-new-privileges`.
5. **Hard limits**: memory 256 MB (`--memory 256m --memory-swap 256m`), 64 processes (`--pids-limit 64`), one CPU
   (`--cpus 1`), 10 seconds to compile, 2 seconds of CPU time to run (`ulimit -t 2` inside, plus an outer wall-clock
   timeout that kills the container), and output capped at 64 KB.
6. **A small HTTP front end** that accepts `POST /run` with `{ code, stdin }` (code at most 64 KB), returns
   `{ compiled, compileErrors, stdout, exitCode, timedOut }`, allows only the site's origin (CORS), limits the rate per
   address, and stores nothing.
7. Run the front end itself on a separate host or VM, so that even an escape from a container does not reach anything
   valuable. A stronger sandbox (gVisor, Firecracker or nsjail) can replace plain containers.

## Starting implementation

`server.mjs` (Node.js 18+, no packages) implements the front end and runs each request in Docker with the limits
above. It needs Docker on the host and the `gcc:13` image pulled. Treat it as a starting point for a reviewed
deployment, not a finished service.

## How the page would use it

The page would show a "Run with g++" button only when a service address is configured in its settings, and would label
the output as coming from the real compiler. That button is not built yet, so that no control appears that cannot work.
