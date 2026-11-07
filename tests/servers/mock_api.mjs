// A stand-in for the Claude Messages API's streaming responses, for testing the tutor proxy without a key.
import http from "node:http";
http.createServer(async (req, res) => {
  const chunks = []; for await (const c of req) chunks.push(c);
  const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  const last = body.messages[body.messages.length - 1].content;
  const text = body.system && /JSON only/.test(body.system) ? '{"ok": true, "echo": ' + JSON.stringify(last.slice(0, 20)) + "}" : "Hello from the mock (" + body.model + ", " + req.headers["x-api-key"] + ")";
  res.writeHead(200, { "Content-Type": "text/event-stream" });
  res.write('event: message_start\ndata: {"type":"message_start"}\n\n');
  for (const part of text.match(/.{1,7}/g)) res.write("event: content_block_delta\ndata: " + JSON.stringify({ type: "content_block_delta", index: 0, delta: { type: "text_delta", text: part } }) + "\n\n");
  res.end('event: message_stop\ndata: {"type":"message_stop"}\n\n');
}).listen(9901);
