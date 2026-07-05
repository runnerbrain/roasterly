let raw = "{'beans': \"Sweet Maria's\", 'other': 'value'}";
console.log("Raw:", raw);

let js = raw
  .replace(/\bTrue\b/g,  'true')
  .replace(/\bFalse\b/g, 'false')
  .replace(/\bNone\b/g,  'null')
  .replace(/'((?:[^'\\]|\\.)*)'/g, (_match, content) => {
    const fixed = content
      .replace(/\\'/g, "'")
      .replace(/"/g, '\\"');
    return `"${fixed}"`;
  });

js = js.replace(/"((?:[^"\\]|\\.)*)"/g, (_match, content) => {
  return `"${content.replace(/'/g, "\\'")}"`;
});
console.log("Parsed:", js);

try { JSON.parse(js); console.log("Success"); } catch(e) { console.error("JSON error:", e.message); }
