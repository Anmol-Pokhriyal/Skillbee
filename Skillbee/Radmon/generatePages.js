const fs = require("fs");
const axios = require("axios");
const ejs = require("ejs");
const path = require("path");

const baseDir = "./templates"; // Set the base directory for template lookup
const templatePath = `${baseDir}/page.ejs`;

// Check if the base directory exists
if (!fs.existsSync(baseDir)) {
  console.error("Base directory does not exist:", baseDir);
  process.exit(1);
}

// Create the generated_pages directory if it doesn't exist
const generatedPagesDir = "./generated_pages";
if (!fs.existsSync(generatedPagesDir)) {
  fs.mkdirSync(generatedPagesDir);
}

// Read the EJS template file
const templateContent = fs.readFileSync(templatePath, "utf-8");

async function fetchData() {
  const apiUrl = "https://www.boredapi.com/api/activity";
  try {
    const response = await axios.get(apiUrl);
    return response.data;
  } catch (error) {
    console.error("Error fetching data:", error);
    return null;
  }
}

async function generatePages(pageCount) {
  const pages = [];

  try {
    for (let i = 1; i <= pageCount; i++) {
      const data = await fetchData();
      if (data) {
        console.log(`Page ${i} data:`, data);
        const renderedPage = ejs.render(templateContent, data); // Render the template using EJS

        // Create a new folder for the page
        const pageDir = path.join(generatedPagesDir, `${i}`);
        fs.mkdirSync(pageDir);

        // Write the rendered page to a file in the page folder
        const pageFilename = `index.html`;
        const pagePath = path.join(pageDir, pageFilename);
        fs.writeFileSync(pagePath, renderedPage);

        pages.push({ filename: pageFilename, folder: i });
      }
    }

    return pages;
  } catch (error) {
    console.error("Error generating pages:", error);
    return [];
  }
}

const pageCount = 10; // Change this to 100 for generating 100 pages
generatePages(pageCount)
  .then((pages) => {
    console.log(`${pageCount} unique pages generated successfully!`);

    // Start the server after generating pages
    const http = require("http");

    const server = http.createServer((req, res) => {
      const pagePath = req.url;
      const pageIndex = parseInt(pagePath.substring(1));

      if (pagePath === "/") {
        // Handle root request with a list of clickable pages
        const pageLinks = Array.from({ length: pageCount }, (_, i) => i + 1);
        const pageLinksHtml = pageLinks.map(
          (pageNum) => `<li><a href="/${pageNum}">Page ${pageNum}</a></li>`
        );

        const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>Generated Pages</title>
          </head>
          <body>
            <h1>Generated Pages List:</h1>
            <ul>
              ${pageLinksHtml.join("\n")}
            </ul>
          </body>
          </html>
        `;

        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(html);
      } else if (pageIndex >= 1 && pageIndex <= pageCount) {
        // Handle requests for individual generated pages
        const pageFilename = `page_${pageIndex}.html`;
        const pagePath = path.join(generatedPagesDir, pageFilename);
        const pageContent = fs.readFileSync(pagePath, "utf-8");
        const pageData = { content: pageContent };
        if (pageData) {
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(pageData.content);
        } else {
          res.writeHead(404, { "Content-Type": "text/plain" });
          res.end("Page not found.");
        }
      } else {
        // Handle other requests with a 404 error
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Page not found.");
      }
    });

    const port = 3000;
    server.listen(port, () => {
      console.log(`Server is running at http://localhost:${port}/`);
    });
  })
  .catch((error) => {
    console.error("Error generating pages:", error);
  });
