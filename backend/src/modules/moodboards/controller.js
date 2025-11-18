import * as moodboardService from "./service.js";
import { sendResponse } from "../../utils/responseHandler.js";
import { asyncHandler } from "../../middlewares/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import archiver from "archiver";
import path from "path";
import fs from "fs";
import Tenant from "../tenants/model.js";
import UsageLog from '../dashboard/model.js'
import GalleryImage from '../gallery/model.js'
import puppeteer from 'puppeteer';

const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || "/snap/bin/chromium";

export const createMoodboard = asyncHandler(async (req, res) => {
    const tenant_id = req.user.tenant_id;
    const user_id = req.user.id;

    const textData = req.body.textData || [];
    const files = req.files || [];

    // 1. Create GalleryImage docs and prepare moodboard.gallery_images data
    const moodboardGalleryImages = await Promise.all(
        files.map(async (file, index) => {
            const tags = req.body.tags?.[index]
                ? req.body.tags[index].split(',').map(tag => tag.trim())
                : [];
              const hostUrl = process.env.BASE_URL;

            const galleryImage = await GalleryImage.create({
                url:`${hostUrl}/${file.path.replace(/^public[\\/]/, "").replace(/\\/g, "/")}`,
                name: file.originalname,
                description: req.body.descriptions?.[index] || null,
                source: req.body.sources?.[index] || null,
                tags,
                status: 'uploaded',
                tenant_id,
                user_id,
            });

            return {
                galleryImage: galleryImage._id,
                name: file.originalname,
                description: req.body.descriptions?.[index] || null,
                source: req.body.sources?.[index] || null,
                tags,
            };
        })
    );

    // 2. Process text data
    const processedTextData = textData.map(item => ({
        text: item.text,
        source: item.source || null,
        tags: item.tags
            ? item.tags.split(',').map(tag => tag.trim())
            : [],
    }));

    // 3. Collect all tags from gallery and textData
    const allTags = [
        ...moodboardGalleryImages.flatMap(img => img.tags),
        ...processedTextData.flatMap(text => text.tags),
    ].filter(Boolean);

    // 4. Update Tenant tags
    if (allTags.length > 0) {
        const tenant = await Tenant.findById(tenant_id);
        if (tenant) {
            const currentTags = tenant.tags || [];
            const mergedTags = Array.from(new Set([...currentTags, ...allTags]));
            tenant.tags = mergedTags;
            await tenant.save();
        }
    }

    // 5. Prepare and create moodboard
    const moodboardData = {
        name: req.body.name,
        comment: req.body.comment || null,
        notes: req.body.notes || null,
        user_id,
        tenant_id,
        project_ids: req.body.project_ids
            ? JSON.parse(req.body.project_ids)
            : [],
        gallery_images: moodboardGalleryImages,
        textData: processedTextData,
    };

    const moodboard = await moodboardService.createMoodboard(moodboardData);

    sendResponse(res, {
        statusCode: 201,
        data: moodboard,
        message: "Moodboard created",
    });
});


export const getMoodboards = asyncHandler(async (req, res) => {
    const query = { ...req.query, tenant_id: req.user.tenant_id, user_id: req.user.id };
    const moodboards = await moodboardService.getMoodboards(query);
    sendResponse(res, { data: moodboards });
});

export const getMoodboardById = asyncHandler(async (req, res) => {
    const moodboard = await moodboardService.getMoodboardById(
        req.params.id,
        req.user.id,
        req.user.tenant_id,
        req.user.roles,
    );
    
    sendResponse(res, { data: moodboard });
});

export const updateMoodboard = asyncHandler(async (req, res) => {
    const {
        name,
        project_ids,
        comment,
        notes,
        existingImages,
        removedImageIds,
    } = req.body;

    const textData = req.body.textData || [];

    // Parse arrays from request
    const parsedExistingImages = existingImages
        ? typeof existingImages === "string"
        ? JSON.parse(existingImages)
        : existingImages
        : [];

    console.log(parsedExistingImages, 'parsedExistingImages');

    const parsedRemovedImageIds = removedImageIds
        ? typeof removedImageIds === "string"
        ? JSON.parse(removedImageIds)
        : removedImageIds
        : [];

    const parsedProjectIds = project_ids
        ? typeof project_ids === "string"
        ? JSON.parse(project_ids)
        : project_ids
        : [];

    // Process new uploaded images - create GalleryImage documents
    const newGalleryImages = req.files
        ? await Promise.all(
            req.files.map(async (file, index) => {
                const tags = req.body.tags?.[index]
                    ? req.body.tags[index].split(",").map((tag) => tag.trim())
                    : [];
                
                const hostUrl = process.env.BASE_URL;
                
                const galleryImage = await GalleryImage.create({
                    url: `${hostUrl}/${file.path.replace(/^public[\\/]/, "").replace(/\\/g, "/")}`,
                    name: file.originalname,
                    description: req.body.descriptions?.[index] || null,
                    source: req.body.sources?.[index] || null,
                    tags,
                    status: 'uploaded',
                    tenant_id: req.user.tenant_id,
                    user_id: req.user.id,
                });

                return {
                    galleryImage: galleryImage._id,
                    name: file.originalname,
                    description: req.body.descriptions?.[index] || null,
                    source: req.body.sources?.[index] || null,
                    tags,
                };
            })
        )
        : [];

    // ✅ Collect tags for tenant update
    const allTags = [
        // new images tags
        ...newGalleryImages.flatMap((img) => img.tags),
        // existing images tags
        ...parsedExistingImages.flatMap((item) =>
            item.tags ? item.tags.split(",").map((tag) => tag.trim()) : []
        ),
        // textData tags
        ...textData.flatMap((item) =>
            item.tags ? item.tags.split(",").map((tag) => tag.trim()) : []
        ),
    ].filter((tag) => tag);

    if (allTags.length > 0) {
        const tenant = await Tenant.findById(req.user.tenant_id);
        if (tenant) {
            const currentTags = tenant.tags || [];
            tenant.tags = Array.from(new Set([...currentTags, ...allTags]));
            await tenant.save();
        }
    }

    const updateData = {
        name,
        project_ids: parsedProjectIds,
        comment,
        notes,
        existingImages: parsedExistingImages,
        removedImageIds: parsedRemovedImageIds,
        newGalleryImages,
        textData: textData.map((item) => ({
            text: item.text,
            source: item.source || null,
            tags: item.tags ? item.tags.split(",").map((tag) => tag.trim()) : [],
        })),
    };

    if (
        !name &&
        !project_ids &&
        !comment &&
        !notes &&
        newGalleryImages.length === 0 &&
        parsedExistingImages.length === 0 &&
        parsedRemovedImageIds.length === 0
    ) {
        throw new ApiError(400, "No update data provided");
    }

    const moodboard = await moodboardService.updateMoodboard(
        req.params.id,
        updateData,
        req.user.tenant_id,
        req.user,
        req.user.roles
    );
    sendResponse(res, { data: moodboard });
});

export const deleteMoodboard = asyncHandler(async (req, res) => {
    const moodboard = await moodboardService.deleteMoodboard(
        req.params.id,
        req.user.tenant_id,
        req.user
    );
    sendResponse(res, { data: moodboard });
});

export const addImage = asyncHandler(async (req, res) => {
    const images = req.files.map((file, index) => ({
        url: file.path.replace(/^public[\\/]/, "").replace(/\\/g, "/"),
        name: file.originalname,
        description: Array.isArray(req.body.descriptions)
            ? req.body.descriptions[index] || null
            : req.body.description || null,
    }));

    const moodboard = await moodboardService.addImage(
        req.params.id,
        images,
        req.user.tenant_id,
    );
    sendResponse(res, { data: moodboard });
});

export const removeImage = asyncHandler(async (req, res) => {
    const moodboard = await moodboardService.removeImage(
        req.params.id,
        req.params.imageId,
        req.user.tenant_id,
    );
    sendResponse(res, { data: moodboard });
});

export const addText = asyncHandler(async (req, res) => {
    const texts = Array.isArray(req.body.textData)
        ? req.body.textData
        : [{ text: req.body.text }]; // Accept both single or multiple text inputs

    const moodboard = await moodboardService.addText(
        req.params.id,
        texts,
        req.user.tenant_id
    );

    sendResponse(res, { data: moodboard });
});

export const removeText = asyncHandler(async (req, res) => {
    const moodboard = await moodboardService.removeText(
        req.params.id,
        req.params.textId,
        req.user.tenant_id
    );

    sendResponse(res, { data: moodboard });
});
export const fetchImageFromUrl = asyncHandler(async (req, res) => {
  const url = req.body.url;
    const moodboard = await moodboardService.fetchImageFromUrl(
        url
    );

    sendResponse(res, { data: moodboard });
});





export const downloadMoodboard = asyncHandler(async (req, res) => {
  const {
    includeImages = [],
    includeTextData = true,
    includeNotes = true,
    includeComment = true,
    includeProjects = true,
  } = req.body;

  const moodboard = await moodboardService.getMoodboardById(
    req.params.id,
    req.user.tenant_id
  );

  // Filter selected images
  const selectedImages = moodboard.gallery_images.filter((img) =>
    includeImages.includes(String(img._id))
  );

  // Generate HTML content for PDF
  const htmlContent = generatePDFContent(moodboard, selectedImages, {
    includeTextData,
    includeNotes,
    includeComment,
    includeProjects,
  });

  // Launch Puppeteer and generate PDF
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: executablePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Set the HTML content
    await page.setContent(htmlContent, { 
      waitUntil: 'networkidle0',
      timeout: 60000 
    });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      printBackground: true,
      scale: 0.8 
    });

    // Set response headers for PDF download
    const pdfName = `moodboard-${moodboard.name.replace(/[^a-zA-Z0-9]/g, "-")}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${pdfName}`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF buffer
    res.send(pdfBuffer);

    // Log usage
    await UsageLog.create({
      module: "moodboard",
      type: 'moodboard_downloaded',
      user_id: req.user.id,
      tenant_id: req.user.tenant_id,
      metadata: {
        name: moodboard.name,
        format: 'pdf',
        imageCount: selectedImages.length
      }
    });

  } finally {
    await browser.close();
  }
});


export const getTenantTags = asyncHandler(async (req, res) => {
    // console.log(req.user,"<<<<user")
  const tenantId = req.user?.tenant_id;

  if (!tenantId) {
    throw new ApiError(400, "Tenant ID not found for the user");
  }

  const search = req.query.search?.trim().toLowerCase();

  // If search is blank, return empty
  if (!search) {
    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "No search term provided.",
      data: [],
    });
  }

  const tags = await moodboardService.getTenantTags(tenantId, search);

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: `Found ${tags.length} matching tags.`,
    data: tags,
  });
});


export function generatePDFContent(moodboard, selectedImages, options) {
  const { includeTextData, includeNotes, includeComment, includeProjects } = options
  const textData = moodboard.textData

  const truncateText = (text, maxLength = 200) => {
    if (!text) return ""
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength).trim() + "..."
  }

  // New function to truncate text to single line with ellipsis
  const truncateToOneLine = (text, maxLength = 50) => {
    if (!text) return ""
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength).trim() + "..."
  }

  const processedImages = selectedImages.map((image) => {
    let imageSrc = ""
    if (image?.galleryImage?.url) {
      if (image.galleryImage.url.startsWith("/")) {
        const relativePath = image.galleryImage.url
        const filePath = path.join(process.cwd(), "public", relativePath)
        if (fs.existsSync(filePath)) {
          const imageBuffer = fs.readFileSync(filePath)
          const ext = path.extname(filePath).toLowerCase().substring(1)
          const mimeType = ext === "jpg" ? "jpeg" : ext
          imageSrc = `data:image/${mimeType};base64,${imageBuffer.toString("base64")}`
        }
      } else {
        imageSrc = image.galleryImage.url
      }
    }
    // console.log(moodboard,'<<<moodboard')
    return {
      ...image,
      src: imageSrc,
      notes: image.notes || "",
      source: image.source ||"",
      type: "image",
      date:image?.galleryImage?.created_at
    }
  })

  const processedTextData =
    includeTextData && Array.isArray(textData) && textData.length > 0
      ? textData.map((item, index) => ({
          _id: `text-${index}`,
          name: ``,
          description: item.text || "No Text",
          notes: "",
          source: item.source || "",
          type: "text",
          date:moodboard?.created_at
        }))
      : []

  const allItems = [...processedImages, ...processedTextData]

  const itemsPerPage = 6
  const pages = []
  for (let i = 0; i < allItems.length; i += itemsPerPage) {
    pages.push(allItems.slice(i, i + itemsPerPage))
  }

  const generatePageHeader = (pageNumber, totalPages) => `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="800" style="margin:0 auto;background-color:#ffffff;border-radius:8px;">
<tr>
<td class="header-section" style="padding:20px 30px 15px;text-align:center;border-radius:8px 8px 0 0;">
<h1 style="margin:0;font-size:28px;font-weight:bold;line-height:1.2;word-wrap:break-word;word-break:break-all;font-family:Arial,sans-serif;">
${moodboard.name}
</h1>
<div class="meta" style="margin:8px 0 4px;font-size:12px;color:#666;font-family:Arial,sans-serif;">Created: ${new Date(moodboard?.created_at).toLocaleDateString()}</div>
<div class="meta" style="margin:8px 0 4px;font-size:12px;color:#666;font-family:Arial,sans-serif;">Last Updated: ${new Date(moodboard?.updated_at).toLocaleDateString()}</div>
${includeComment && moodboard.comment ? `<div class="meta truncated-text" style="margin:4px 0;font-size:12px;color:#666;font-family:Arial,sans-serif;">Description: ${truncateText(moodboard.comment)}</div>` : ""}
<div class="meta" style="margin:4px 0;font-size:10px;color:#999;font-family:Arial,sans-serif;">Page ${pageNumber} of ${totalPages}</div>
</td>
</tr>
</table>`

  let html = `
    <!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{{SUBJECT_LINE}}</title>
<style>
  body, table, td, p, a, li, blockquote {
    -webkit-text-size-adjust: 100%;
    -ms-text-size-adjust: 100%;
  }
  table, td {
    mso-table-lspace: 0pt;
    mso-table-rspace: 0pt;
  }
  img {
    -ms-interpolation-mode: bicubic;
    border: 0;
    height: auto;
    line-height: 100%;
    outline: none;
    text-decoration: none;
  }
  @page {
    margin: 15mm;
    size: A4 landscape;
  }
  body {
    margin: 0;
    padding: 0;
    background-color: #fff;
    font-family: Arial, sans-serif;
  }
  table {
    width: 100% !important;
    max-width: 100% !important;
  }
  .page-break {
    page-break-before: always;
  }
  .no-break {
    page-break-inside: avoid;
  }
  .header-section {
    page-break-after: avoid;
  }
  .image-section {
    page-break-inside: avoid;
  }
  .truncated-text {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    max-height: 4.2em;
    line-height: 1.4;
    word-wrap: break-word;
    hyphens: auto;
  }
  .single-line-text {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }
  .text-card {
    background-color: #f8f9fa;
    border: 2px solid #666;
    border-radius: 8px;
    padding: 8px;
    height: 130px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    box-sizing: border-box;
  }
  .text-card-content {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    width: 100%;
  }
  .notes-content {
    white-space: pre-wrap;
    word-wrap: break-word;
    overflow-wrap: break-word;
    hyphens: auto;
    page-break-inside: auto;
  }
  /* Uniform font family for all text elements */
  h1, h2, h3, p, div, td {
    font-family: Arial, sans-serif !important;
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:Arial,sans-serif;">
<table width="100%">
<tr>
<td style="padding:10px 0;">
`

  const totalPages = pages.length + (includeNotes && moodboard.notes ? 1 : 0)

  pages.forEach((pageItems, pageIndex) => {
    if (pageIndex > 0) {
      html += `<div class="page-break"></div>`
    }

    html += generatePageHeader(pageIndex + 1, totalPages)

    html += `<tr><td class="image-section" style="padding:20px 15px;">`
    html += `<table role="presentation" cellspacing="8" cellpadding="0" border="0" width="100%">`

    pageItems.forEach((item, itemIndex) => {
      if (itemIndex % 3 === 0) {
        html += `<tr>`
      }

      if (item.type === "image") {
        html += `
      <td width="33.33%" class="no-break" style="padding:4px;border:2px solid #666;vertical-align:top;border-radius:8px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      <tr>
      <td style="text-align:center;padding-bottom:6px;">
      ${
        item.src
          ? `<img src="${item.src}" alt="${item.name}" width="130" height="130" style="width:130px;height:130px;object-fit:cover;border-radius:6px;">`
          : `<div style="width:130px;height:130px;background:#f4f4f4;color:#999;display:flex;align-items:center;justify-content:center;border-radius:6px;font-size:12px;font-family:Arial,sans-serif;">No Image</div>`
      }
      </td>
      </tr>
      <tr>
      <td style="text-align:center;">
      <h3 style="margin:0 0 6px;color:#2c3e50;font-size:13px;font-weight:bold;line-height:1.2;font-family:Arial,sans-serif;">${item.name || ""}</h3>
      ${item.description ? `<p class="truncated-text" style="margin:0;color:#666666;font-size:11px;line-height:1.4;font-family:Arial,sans-serif;">Description: ${truncateText(item.description)}</p>` : ""}
      ${item.source ? `<p class="single-line-text" style="margin:3px 0 0;color:#999999;font-size:10px;line-height:1.4;font-family:Arial,sans-serif;" title="${item.source}">Source: ${truncateToOneLine(item.source)}</p>` : ""}
      ${item.notes ? `<p class="truncated-text" style="margin:3px 0 0;color:#999999;font-size:10px;line-height:1.4;font-family:Arial,sans-serif;">Notes: ${truncateText(item.notes)}</p>` : ""}
      ${item.date ? `<p class="single-line-text" style="margin:3px 0 0;color:#999999;font-size:10px;line-height:1.4;font-family:Arial,sans-serif;">Date: ${new Date(item.date).toLocaleDateString()}</p>` : ""}
      ${Array.isArray(item.tags) && item.tags.length ? `<p style="margin:3px 0 0;color:#555555;font-size:10px;font-style:italic;font-family:Arial,sans-serif;">Tags: ${item.tags.join(", ")}</p>` : ""}
      </td>
      </tr>
      </table>
      </td>`
      } else {
        html += `
<td width="33.33%" class="no-break" style="padding:4px;border:2px solid #666;vertical-align:top;border-radius:8px;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
<tr>
<td style="text-align:center;padding-bottom:6px;">
<div class="text-card">
<div class="text-card-content">
<div class="truncated-text" style="word-wrap:break-word;line-height:1.3;font-size:11px;font-family:Arial,sans-serif;color:#333;text-align:center;">${truncateText(item.description, 100)}</div>
</div>
</div>
</td>
</tr>
<tr>
<td style="text-align:center;">
<h3 style="margin:0 0 6px;color:#2c3e50;font-size:13px;font-weight:bold;line-height:1.2;font-family:Arial,sans-serif;">${item.name}</h3>
${item.source ? `<p class="single-line-text" style="margin:0;color:#666666;font-size:11px;line-height:1.4;font-family:Arial,sans-serif;" title="${item.source}">Source: ${truncateToOneLine(item.source)}</p>` : ""}
${item.date ? `<p class="single-line-text" style="margin:3px 0 0;color:#999999;font-size:10px;line-height:1.4;font-family:Arial,sans-serif;">Date: ${new Date(item.date).toLocaleDateString()}</p>` : ""}
${Array.isArray(item.tags) && item.tags.length ? `<p style="margin:3px 0 0;color:#555555;font-size:10px;font-style:italic;font-family:Arial,sans-serif;">Tags: ${item.tags.join(", ")}</p>` : ""}
</td>
</tr>
</table>
</td>`
      }

      if ((itemIndex + 1) % 3 === 0 || itemIndex === pageItems.length - 1) {
        html += `</tr>`
      }
    })
    html += `</table></td></tr>`
  })

  if (includeNotes && moodboard.notes) {
    html += `<div class="page-break"></div>`
    html += generatePageHeader(totalPages, totalPages)
    html += `
<tr>
<td style="padding:20px 15px;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#ffffff;border-radius:8px;">
<tr>
<td style="padding:20px;text-align:left;">
<h2 style="margin:0 0 15px;color:#2c3e50;font-size:20px;font-weight:bold;font-family:Arial,sans-serif;">Notes</h2>
<div class="notes-content" style="color:#333;font-size:14px;line-height:1.6;font-family:Arial,sans-serif;">${moodboard.notes}</div>
</td>
</tr>
</table>
</td>
</tr>`
  }

  html += `
</table>
</td>
</tr>
</table>
</body>
</html>`
  return html
}







export const downloadMoodboardWithPDF = asyncHandler(async (req, res) => {
  const {
    includeImages = [],
    includeTextData = [],
    includeNotes = true,
    includeComment = true,
    includeProjects = true,
  } = req.body;

  const moodboard = await moodboardService.getMoodboardById(
    req.params.id,
    req.user.id,
    req.user.tenant_id,
    req.user.roles
  );
  const archive = archiver("zip", { zlib: { level: 9 } });
  const zipName = `moodboard-${moodboard.name.replace(/[^a-zA-Z0-9]/g, "-")}-with-pdf.zip`;

  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", `attachment; filename=${zipName}`);
  archive.pipe(res);

  // === Filter selected text ===
  let selectedTextItems = [];

  if (Array.isArray(includeTextData) && includeTextData.length > 0) {
    selectedTextItems = moodboard.textData?.filter(txt =>
      includeTextData.includes(String(txt._id))
    ) || [];
  }

  // === Generate Metadata File ===
  let metadata = `Moodboard Name: ${moodboard.name}\nCreated At: ${moodboard.created_at}\n`;

  if (includeComment) metadata += `Comment: ${moodboard.comment || "N/A"}\n`;
  if (includeNotes) metadata += `Notes: ${moodboard.notes || "N/A"}\n`;

  if (includeProjects) {
    const projects = moodboard.project_ids?.map((p) => p.name).join(", ");
    metadata += `Projects: ${projects || "None"}\n`;
  }

  // === Selected Text Section ===
  if (Array.isArray(includeTextData) && includeTextData.length > 0 && selectedTextItems.length) {
    metadata += `\nTextData:\n`;
    selectedTextItems.forEach((item, i) => {
      metadata += `  ${i + 1}. ${item.text}\n`;
      if (item.source) metadata += `     Source: ${item.source}\n`;
      if (item.tags?.length) metadata += `     Tags: ${item.tags.join(", ")}\n`;
    });
  }

  // === Image Section ===
  const selectedImages = moodboard.gallery_images.filter((img) =>
    includeImages.includes(String(img._id))
  );

  if (selectedImages.length) {
    metadata += `\nImages:\n`;
    selectedImages.forEach((img, i) => {
      // Use description for metadata display
      const displayName = img.description || img.name || `Image-${img._id}`;
      metadata += `  ${i + 1}. ${displayName}\n`;
      if (img.source) {
        metadata += `     Source: ${img.source}\n`;
      }
      if (img.tags && img.tags.length > 0) {
        metadata += `     Tags: ${img.tags.join(", ")}\n`;
      }
    });
  }

  // Add metadata file to archive
  archive.append(metadata, { name: "moodboard.txt" });

  // === Add Image Files to Archive ===
  for (const image of selectedImages) {
    if (!image?.galleryImage?.url) continue;
    
    const relativePath = new URL(image.galleryImage.url).pathname;
    const filePath = path.join("public", relativePath);

    // Get file extension from original URL
    const fileExtension = image.galleryImage.url.split(".").pop();
    
    // Use description as filename, sanitize it for filesystem
    let fileName;
    if (image.description && image.description.trim()) {
      // Sanitize description to be filesystem-safe
      const sanitizedDescription = image.description
        .trim()
        .replace(/[^a-zA-Z0-9\s-]/g, "") // Remove special characters
        .replace(/\s+/g, "-") // Replace spaces with hyphens
        .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
        .substring(0, 100); // Limit length to 100 characters
      
      fileName = `${sanitizedDescription}.${fileExtension}`;
    } else {
      // Fallback if no description is available
      fileName = image.name || `image-${image._id}.${fileExtension}`;
      
      // Optional: Log warning about missing description
      console.warn(`Image ${image._id} is missing description, using fallback name: ${fileName}`);
    }
    
    // Ensure unique filenames by adding index if needed
    const imageIndex = selectedImages.indexOf(image);
    if (imageIndex > 0) {
      const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
      fileName = `${nameWithoutExt}-${imageIndex + 1}.${fileExtension}`;
    }

    if (fs.existsSync(filePath)) {
      archive.file(filePath, { name: `images/${fileName}` });
    }
  }

  // === Generate and Add PDF to Archive ===
  let browser;
  try {
    // Generate HTML content for PDF
    const htmlContent = generatePDFContent(
      moodboard,
      selectedImages,
      {
        includeTextData: selectedTextItems.length > 0 ? selectedTextItems : null,
        includeNotes,
        includeComment,
        includeProjects,
      }
    );

    // Launch Puppeteer and generate PDF
    browser = await puppeteer.launch({
      headless: true,
      executablePath: executablePath,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Set the HTML content
    await page.setContent(htmlContent, { 
      waitUntil: 'networkidle0',
      timeout: 60000 
    });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      landscape: true,
      margin: {
        top: '20mm',
        bottom: '20mm',
        left: '15mm',
        right: '15mm'
      },
      printBackground: true
    });

    // Add PDF to archive    
    const pdfName = `moodboard-${moodboard.name.replace(/[^a-zA-Z0-9]/g, "-")}.pdf`;
    archive.append(Buffer.from(pdfBuffer), { name: pdfName });

  } catch (error) {
    console.error('Error generating PDF:', error);
    const errorMessage = `\nPDF Generation Error: ${error.message}\n`;
    archive.append(errorMessage, { name: "pdf-error.txt" });
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  // Finalize the archive
  await archive.finalize();

  // Log usage
  await UsageLog.create({
    module: "moodboard",
    type: 'moodboard_downloaded_with_pdf',
    user_id: req.user.id,
    tenant_id: req.user.tenant_id,
    metadata: {
      name: moodboard.name,
      format: 'zip_with_pdf',
      imageCount: selectedImages.length,
      includesPdf: true,
      includesImages: selectedImages.length > 0,
      includesTextData: includeTextData && moodboard.textData?.length > 0
    }
  });
});


export async function exportMoodboardToArchive(archive, moodboard, options = {}) {
  const {
    includeImages = [],
    includeTextData = [],
    includeNotes = true,
    includeComment = true,
    includeProjects = true,
    baseFolder = "" // e.g. "ProjectA/moodboards"
  } = options;

  // === Metadata
  let metadata = `Moodboard Name: ${moodboard.name}\nCreated At: ${moodboard.created_at}\n`;

  if (includeComment) metadata += `Comment: ${moodboard.comment || "N/A"}\n`;
  if (includeNotes) metadata += `Notes: ${moodboard.notes || "N/A"}\n`;

  if (includeProjects) {
    const projects = moodboard.project_ids?.map((p) => p.name).join(", ");
    metadata += `Projects: ${projects || "None"}\n`;
  }

  // === Text
  const selectedTextItems = moodboard.textData?.filter((txt) =>
    includeTextData.includes(String(txt._id))
  ) || [];

  if (selectedTextItems.length) {
    metadata += `\nTextData:\n`;
    selectedTextItems.forEach((item, i) => {
      metadata += `  ${i + 1}. ${item.text}\n`;
      if (item.source) metadata += `     Source: ${item.source}\n`;
      if (item.tags?.length) metadata += `     Tags: ${item.tags.join(", ")}\n`;
    });
  }

  // === Images
  const selectedImages = moodboard.gallery_images.filter((img) =>
    includeImages.includes(String(img._id))
  );

  if (selectedImages.length) {
    metadata += `\nImages:\n`;
    selectedImages.forEach((img, i) => {
      metadata += `  ${i + 1}. ${img.name || `Image-${img._id}`}\n`;
      if (img.source) metadata += `     Source: ${img.source}\n`;
      if (img.tags?.length) metadata += `     Tags: ${img.tags.join(", ")}\n`;
    });
  }

  archive.append(metadata, { name: `${baseFolder}/${moodboard.name}/moodboard.txt` });

  // === Image files
  for (const image of selectedImages) {
    if (!image?.galleryImage?.url) continue;

    const relativePath = new URL(image.galleryImage.url).pathname;
    const filePath = path.join("public", relativePath);

    const fileName =
      image.name || `image-${image._id}.${image.galleryImage.url.split(".").pop()}`;

    if (fs.existsSync(filePath)) {
      archive.file(filePath, { name: `${baseFolder}/${moodboard.name}/images/${fileName}` });
    }
  }

  // === PDF
  let browser;
  try {
    const htmlContent = generatePDFContent(moodboard, selectedImages, {
      includeTextData: selectedTextItems,
      includeNotes,
      includeComment,
      includeProjects,
    });

    browser = await puppeteer.launch({
      headless: true,
    executablePath: executablePath,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0", timeout: 60000 });

    const pdfBuffer = await page.pdf({
      format: "A4",
      landscape: true,
      margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" },
      printBackground: true,
    });

    const pdfName = `moodboard-${moodboard.name.replace(/[^a-zA-Z0-9]/g, "-")}.pdf`;
    archive.append(Buffer.from(pdfBuffer), {
      name: `${baseFolder}/${moodboard.name}/${pdfName}`,
    });
  } catch (err) {
    archive.append(`PDF Generation Error: ${err.message}`, {
      name: `${baseFolder}/${moodboard.name}/pdf-error.txt`,
    });
  } finally {
    if (browser) await browser.close();
  }
}