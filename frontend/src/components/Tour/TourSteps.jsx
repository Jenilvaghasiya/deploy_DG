// src/components/Tour/tourSteps.js

export const projectPageTourSteps = [
  {
    target: "body",
    content:
      "Welcome to Project Management! Here you can organize all your design projects and sub-projects.",
    placement: "center",
    disableBeacon: true,
  },
  {
    target: ".project-tree-container",
    content:
      "This is your project tree. It shows all your projects and their sub-projects in a hierarchical view. Click on any project to view its details.",
    placement: "right",
  },
  {
    target: ".create-new-project-btn",
    content:
      "Click here to create your first project and start organizing your work!",
    placement: "top",
  },
  // {
  //   target: '.edit-project-btn',
  //   content: 'Edit project details like name, dates, and description.',
  //   placement: 'bottom',
  // },
  // {
  //   target: '.download-pdf-btn',
  //   content: 'Download all project images as a PDF document.',
  //   placement: 'bottom',
  // },
  // {
  //   target: '.download-zip-btn',
  //   content: 'Download project images as a ZIP file, organized by status.',
  //   placement: 'bottom',
  // },
  // {
  //   target: '.delete-project-btn',
  //   content: 'Delete a project and all its sub-projects. Be careful - this cannot be undone!',
  //   placement: 'bottom',
  // },
  // {
  //   target: '.project-details-section',
  //   content: 'View project information including dates, description, and parent project.',
  //   placement: 'top',
  // },
  // {
  //   target: '.project-images-section',
  //   content: 'All images linked to this project are displayed here. Click any image to view it in full size.',
  //   placement: 'top',
  // },
  // {
  //   target: '.size-charts-section',
  //   content: 'View and manage size charts associated with this project.',
  //   placement: 'top',
  // },
  // {
  //   target: '.sub-projects-section',
  //   content: 'Sub-projects are shown here. You can create new sub-projects or navigate to existing ones.',
  //   placement: 'top',
  // },
  // {
  //   target: '.add-sub-project-btn',
  //   content: 'Create a new sub-project under the current project for better organization.',
  //   placement: 'left',
  // },
];

export const galleryTourSteps = [
  {
    target: "body",
    content: "Welcome to your Gallery! Let me show you around.",
    placement: "center",
    disableBeacon: true,
  },
  {
    target: ".gallery-tabs", // Tab container
    content: "Use these tabs to filter images by status.",
    // placement: 'bottom',
  },
  {
    target: ".list-grid-view", // View mode toggle
    content: "Switch between List and Grid view here.",
    placement: "bottom",
  },
  {
    target: ".upload-image", // Add button
    content: "Click here to upload new images.",
    placement: "right",
  },
  {
    target: ".image-actions", // First image
    content: "Hover over images to see available actions.",
    placement: "top",
  },
];

export const moodboardTourSteps = [
  {
    target: "body",
    content:
      "Welcome to your Moodboards! This is where you can create and manage visual collections.",
    placement: "center",
    disableBeacon: true,
  },
  {
    target: ".container h1", // Targets the page title
    content: "Here you can see all your moodboards in one place.",
    placement: "bottom",
  },
  {
    target: ".sorting", // Sort dropdown
    content: "Use this dropdown to sort your moodboards by date or name.",
    placement: "bottom",
  },
  {
    target: ".list-grid-view", // View mode toggle
    content:
      "Switch between List and Grid view to see your moodboards in different layouts.",
    placement: "bottom",
  },
  {
    target: ".create-moodboard-btn", // Create Moodboard button
    content:
      "Click here to create a new moodboard and start collecting your visual inspiration.",
    placement: "left",
  },
];

export const directMessagesTourSteps = [
  {
    target: "body",
    content:
      "Welcome to Direct Messages! Here you can communicate privately with your team members.",
    placement: "center",
    disableBeacon: true,
  },
  {
    target: 'input[placeholder="Search team members..."]',
    content:
      "Use the search bar to quickly find team members by name or email.",
    placement: "bottom",
    offset: 10,
  },
  {
    target: ".overflow-y-auto.flex-1 h3", // "Team Members" heading
    content:
      "All your team members are listed here. Click on any member to start a conversation.",
    placement: "right",
    offset: 10,
  },
  {
    target: ".overflow-y-auto.flex-1 .cursor-pointer:first-child", // First team member
    content:
      "Click on a team member to open their conversation. Active conversations are highlighted.",
    placement: "right",
    offset: 10,
  },
  {
    target: ".flex-1.flex.flex-col.overflow-hidden", // Right panel/conversation area
    content:
      "Your conversation will appear here. You can view message history and send new messages.",
    placement: "left",
    offset: 10,
  },
  // {
  //   target: 'textarea[placeholder*="Type"]', // Message input (assuming MessageInput has a textarea)
  //   content: 'Type your message here and press Enter or click Send to send it to your teammate.',
  //   placement: 'top',
  //   offset: 10,
  // },
];

export const broadcastMessagesTourSteps = [
  {
    target: "body",
    content:
      "Welcome to Tenant Announcements! This is where important messages are shared with your entire team.",
    placement: "center",
    disableBeacon: true,
  },
  {
    target: ".p-6.py-3.border-b", // Header section
    content:
      "All broadcast messages appear here. These announcements are visible to everyone in your organization.",
    placement: "bottom",
    offset: 10,
  },
  {
    target: ".message-input", // Message input (assuming MessageInput has a textarea)
    content:
      "Type your announcement here and press Send to broadcast it to all team members instantly.",
    placement: "top",
    offset: 10,
  },
];

export const textToSketchTourSteps = [
  {
    target: "body",
    content:
      "Welcome to Text to Sketch! Transform your ideas into visual sketches using AI.",
    placement: "center",
    disableBeacon: true,
  },
  {
    target: 'textarea[placeholder*="Describe your garment"]',
    content:
      "Describe your garment here. Be specific about style, fabric, colors, and details for best results.",
    placement: "bottom",
    offset: 10,
    spotlightClicks: true,
  },
  {
    target: ".variations-select",
    content:
      "You can generate 1 or 2 variations at a time. More variations give you different design options to choose from.",
    placement: "bottom",
    offset: 10,
    spotlightClicks: true,
  },
  {
    target: ".dg-submit",
    content:
      "Click here to generate your sketches. The AI will create visual designs based on your description.",
    placement: "top",
    offset: 10,
  },
];

export const variationsTourSteps = [
  {
    target: "body",
    content:
      "Welcome to Variations! Create multiple design variations from a single image.",
    placement: "center",
    disableBeacon: true,
  },
  {
    target: ".select-image-tabs", // Add this class to SelectImageTabs component
    content:
      "Start by selecting an image. You can upload a new one or choose from your gallery.",
    placement: "top",
    offset: 10,
  },
  {
    target: 'label:contains("Preview")',
    content:
      "Your selected image appears here. This is the base design for generating variations.",
    placement: "top",
    offset: 10,
  },
  {
    target: ".border-shadow-blur.border-2",
    content:
      "Check your image preview before generating. Make sure it clearly shows the design you want to vary.",
    placement: "bottom",
    offset: 10,
  },
  {
    target: 'label:contains("Number of Variations")',
    content:
      "Choose how many variations to create. Each one will be a unique interpretation.",
    placement: "top",
    offset: 10,
  },
  {
    target: ".prompt-field", // Show Prompt Field button
    content:
      "Discover advanced customization! Click here to access the prompt field for more control over your variations.",
    placement: "left",
    offset: 10,
    spotlightClicks: true,
  },
  {
    target: 'input[type="number"][min="1"][max="4"]',
    content:
      "You can generate 1 to 4 variations. More variations give you more design options to explore.",
    placement: "bottom",
    offset: 10,
    spotlightClicks: true,
  },
  {
    target: ".dg-submit",
    content:
      "Click here to generate variations. The AI will create new designs based on your original image.",
    placement: "top",
    offset: 10,
  },
];

export const combineImagesTourSteps = [
  {
    target: "body",
    content:
      "Welcome to Combine Images! Create unique designs by merging two different styles.",
    placement: "center",
    disableBeacon: true,
  },
  {
    target: ".select-image-tabs",
    content:
      "Start by selecting your two images: a base design and a style design to combine.",
    placement: "top",
    offset: 10,
  },
  {
    target: ".design-balance",
    content: "Control how much influence each design has on the final result.",
    placement: "top",
    offset: 10,
  },
  {
    target: ".color-scheme",
    content:
      "Choose how colors from both designs should be combined in the final result.",
    placement: "top",
    offset: 10,
  },
  {
    target: ".prompt-field", // Show Prompt Field button
    content:
      "Discover advanced customization! Click here to access the prompt field for more control over your variations.",
    placement: "left",
    offset: 10,
    spotlightClicks: true,
  },
  {
    target: ".choose-variation-number",
    content: "Choose how many different variations you want to generate.",
    placement: "bottom",
    offset: 10,
  },
  {
    target: ".generate-image",
    content: "Click here to start combining your designs!",
    placement: "top",
    offset: 10,
  },
];

export const mainSizeChartsPageTour = [
  {
    target: "h1",
    content:
      "Welcome to the Size Chart feature! This tool helps you create and manage size charts for your products.",
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: '[role="tablist"]',
    content:
      "You have two options for creating size charts. Let me show you both methods.",
    placement: "bottom",
  },
  {
    target: '[data-state="active"]',
    content:
      "The AI Generated tab uses artificial intelligence to automatically create size charts based on your product type and target audience.",
    placement: "bottom",
  },
  {
    target: '[value="password"]',
    content:
      "The Manual tab allows you to create custom size charts by entering measurements yourself. Click here to see the manual option.",
    placement: "bottom",
    spotlightClicks: true,
  },
  {
    target: '[role="tabpanel"]',
    content:
      "Great! You can switch between these tabs anytime. Each method has its own advantages depending on your needs.",
    placement: "center",
  },
];

export const sizeChartTourSteps = [
  {
    target: ".select-image-tabs", // Image upload tabs
    content:
      "Start by uploading or selecting an image of your garment. You can upload from your device or choose from your gallery.",
    placement: "top",
    disableBeacon: true,
  },
  {
    target: ".border-shadow-blur.border-2.border-dashed", // Preview image area
    content:
      "Preview your selected garment image here. This helps the AI understand what type of clothing to create a size chart for.",
    placement: "bottom",
  },
  {
    target: ".flex.items-center.space-x-2", // Show Prompt Field button
    content:
      "Click here to add custom prompt details if you want to provide specific instructions for your size chart generation.",
    placement: "left",
  },
  {
    target: '[ref="garmentLabelRef"]', // Garment Type selector
    content:
      "Select your garment type from the dropdown. The AI can auto-detect from your image or you can manually choose the specific type.",
    placement: "bottom",
  },
  {
    target: ".grid.grid-cols-2.gap-4", // Target Market and Measurement Unit
    content:
      "Choose your target market (US, EU, UK, Asia) and preferred measurement unit (inches or centimeters) for accurate sizing.",
    placement: "top",
  },
  {
    target: '[name="notes"]', // Custom Size Range input
    content:
      'Define your custom size range here. Enter sizes like "XXS, XS, S, M, L, XL, XXL" or any custom sizing you need.',
    placement: "top",
  },
  {
    target: ".bg-black\\/30.border-white\\/20", // Measurement Points Card
    content:
      "View and configure measurement points for your garment. Standard points are automatically selected based on garment type.",
    placement: "top",
  },
  {
    target: ".dg_btn", // Custom Tolerance Settings button
    content:
      "Click to customize tolerance settings for each measurement point. This allows for manufacturing variations in your size chart.",
    placement: "top",
  },
  {
    target: ".space-y-3", // Checkboxes section
    content:
      "Configure additional options: include grading (size differences), tolerance values, and international size conversion.",
    placement: "top",
  },
  {
    target: ".dg-submit", // Generate button
    content:
      "Generate your size chart! The AI will create a comprehensive measurement table based on your garment and specifications.",
    placement: "top",
  },
  {
    target: ".bg-white\\/20.backdrop-blur-md", // Generated size chart table
    content:
      "Your generated size chart appears here with detailed measurements for each size. You can edit values and save the chart.",
    placement: "top",
  },
];

export const imageEditorTourSteps = [
  {
    target: ".main-content", // Header section
    content:
      "Welcome to the Image Editor! Here you can edit and transform your images with powerful tools.",
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: ".SelectImageTabs", // Image upload tabs
    content:
      "Choose how you want to add your image - upload from your computer, select from gallery, or paste a URL.",
    placement: "bottom",
  },
  {
    target: ".main-area", // Main image area
    content:
      "Your image will appear here. Drop an image directly into this area or use the upload options.",
    placement: "right",
  },
];

export const postListSteps = [
  {
    target: ".main",
    content:
      "Welcome to the Post Creation form! Here you can create and share your posts with images.",
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: ".SelectImageTabs",
    content:
      "Choose an image for your post. You can upload from your computer or select from your existing uploads.",
    placement: "top",
  },
  {
    target: ".image",
    content:
      "Preview your selected image here before posting. Make sure it looks exactly how you want it!",
    placement: "top",
  },
  {
    target: ".description",
    content:
      "Add a detailed caption to your post. Tell your story or describe what makes this post special.",
    placement: "top",
  },
  {
    target: ".save-btn",
    content:
      "Once you're happy with everything, click here to share your post!",
    placement: "top",
  },
];

export const socialPostSteps = [
  {
    target: ".text-2xl.font-bold", // Header section
    content:
      "Welcome to the Posts Feed! Here you can view and interact with posts from all users.",
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: ".post-owner-name", // User info section
    content: "See who posted the content and when it was shared.",
    placement: "bottom",
  },
  {
    target: "img.w-full.rounded-xl", // Post image
    content: "Posts can include images along with text descriptions.",
    placement: "bottom",
  },
  {
    target: ".text-gray-200.pb-2", // Post description
    content: "Read the full description and details of each post.",
    placement: "top",
  },
  {
    target: ".flex.items-center.space-x-6", // Action buttons container
    content:
      "Interact with posts using these buttons to like, comment, review, or report.",
    placement: "top",
  },
];

export const dashboardTourSteps = [
  {
    target: ".text-2xl.font-semibold", // Overview header
    content:
      "Welcome to the Dashboard! Get a comprehensive view of platform usage, performance metrics, and activity logs.",
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: ".flex.flex-wrap.items-center.gap-4", // Filter section
    content:
      "Use these filters to customize your data view. Select date ranges and time periods to analyze specific timeframes.",
    placement: "bottom",
  },
  {
    target: ".lg\\:col-span-2.flex.flex-col", // Platform bar chart
    content:
      "This chart shows platform-specific performance data. Admins can filter by user to see individual contributions.",
    placement: "right",
  },
  {
    target: ".p-5.relative.rounded-xl.shadow-sm", // Total time chart
    content:
      "View the total time spent across all platforms in this summary visualization.",
    placement: "left",
  },
  {
    target: ".usage-time", // Usage Time chart (targeting by heading prop)
    content:
      "Analyze detailed usage time patterns. Filter by time type and user to get specific insights into platform usage.",
    placement: "right",
  },
  {
    target: ".output-chart", // NO. Of Outputs label
    content:
      "Track the number of outputs generated with detailed breakdowns by type and user.",
    placement: "right",
  },
];
