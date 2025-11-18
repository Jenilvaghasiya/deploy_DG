import { writeFileSync } from "fs";
import { join } from "path";

const config = {
  navigationFallback: {
    rewrite: "index.html",
    exclude: [
      "/static/*",
      "/images/*",
      "/css/*",
      "/js/*",
      "/favicon.ico",
      "/*.png",
      "/*.jpg",
      "/*.svg"
    ]
  }
};

const outputPath = join(process.cwd(), "dist", "staticwebapp.config.json");
writeFileSync(outputPath, JSON.stringify(config, null, 2));

console.log("✅ staticwebapp.config.json added to dist/");
