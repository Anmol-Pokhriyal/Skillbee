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
