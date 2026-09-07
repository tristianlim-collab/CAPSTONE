const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

// You can switch the file served here:
// 'plain_report.html' for Black Box Testing
// 'plain_white_box_report.html' for White Box Testing
const FILE_TO_SERVE = 'plain_white_box_report.html';

const server = http.createServer((req, res) => {
  let filePath = path.join(__dirname, FILE_TO_SERVE);
  
  if (req.url === '/blackbox' || req.url === '/blackbox.html') {
    filePath = path.join(__dirname, 'plain_report.html');
  } else if (req.url === '/whitebox' || req.url === '/whitebox.html') {
    filePath = path.join(__dirname, 'plain_white_box_report.html');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error loading report file: ' + err.message);
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`GAOIRS Testing Report Server running at http://localhost:${PORT}/`);
  console.log(`- Default (White Box): http://localhost:${PORT}/`);
  console.log(`- Black Box Report: http://localhost:${PORT}/blackbox`);
  console.log(`- White Box Report: http://localhost:${PORT}/whitebox`);
});
