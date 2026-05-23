export const mockWorkspaceData = {
  app: {
    title: "AI Hub",
  },
  workspace: {
    modelLabel: "Local Llama 3",
    privacyLabel: "Local Privacy Guard: Data is not uploaded.",
    privacyStatus: "Online",
    promptPlaceholder: "Ask anything about your local files, notes, or running services…",
    activeContextLabel: "Mounted local context",
  },
  contextSources: [
    { id: "project-alpha", label: "Project Alpha.md", style: "default" },
    { id: "q1-report", label: "Q1_Report.pdf", style: "soft" },
  ],
  availableSources: [
    { id: "alpha-plan", label: "Alpha Roadmap.md", style: "default" },
    { id: "service-runbook", label: "Service Runbook.md", style: "soft" },
    { id: "weekly-notes", label: "Weekly Notes.md", style: "default" },
  ],
  drawerPanels: {
    knowledgeBase: {
      title: "Knowledge Base",
      filesLabel: "128 Files",
      sizeLabel: "5.2GB indexed",
      progressLabel: "72%",
      statusLabel: "Indexed",
      collections: [
        { label: "Project Alpha", count: 42 },
        { label: "Research Library", count: 31 },
        { label: "Personal Docs", count: 55 },
      ],
    },
    localFiles: {
      title: "Local Files",
      actions: ["Drag Files", "Sync"],
      hint: "Drop files here or click to browse",
      supportText: "Supports pdf, md, docx, txt, csv, jpg, png",
      fileTypes: [
        { label: "PDF", value: "45%", width: 45 },
        { label: "MD", value: "25%", width: 25 },
        { label: "DOCX", value: "15%", width: 15 },
        { label: "Other", value: "15%", width: 15 },
      ],
    },
    markdownNotes: {
      title: "Markdown Notes / Obsidian",
      statusLine: "24 Files, Last Sync: 2 mins ago",
      connectionLabel: "Connection: Active",
      notes: [
        "Project Alpha Overview.md",
        "Q1 Retrospective.md",
        "Ideas Backlog.md",
      ],
    },
    localServices: {
      title: "Local Services",
      items: [
        { label: "Server Status", value: "Running", tone: "success" },
        { label: "Model", value: "Local Llama 3" },
        { label: "Port", value: "8080" },
        { label: "Logs", value: "View Logs", tone: "link" },
      ],
    },
  },
  messages: [
    {
      id: "m1",
      role: "user",
      text: "What are the key takeaways from Q1 performance?",
      timestamp: "10:21 AM",
    },
    {
      id: "m2",
      role: "assistant",
      text:
        "Q1 showed solid growth across key metrics.\n\n- Revenue up 18% YoY, driven by enterprise expansion.\n- Gross margin improved to 62%.\n- R&D investment increased to support upcoming launch.",
      timestamp: "10:21 AM",
    },
    {
      id: "m3",
      role: "user",
      text: "Yes, include a breakdown by segment.",
      timestamp: "10:22 AM",
    },
    {
      id: "m4",
      role: "assistant",
      text: "Here’s a breakdown by segment with highlights and a comparison to Q4.",
      attachment: {
        title: "Q1_Segment_Breakdown.pdf",
        meta: "512 KB",
      },
      timestamp: "10:22 AM",
    },
  ],
  simulatedReplies: [
    {
      text:
        "I can summarize the segments from the mounted sources:\n\n- Enterprise remains the strongest growth contributor.\n- SMB improved in volume, but margin is still uneven.\n- Services stayed stable and helped offset seasonal swings.",
      attachment: {
        title: "Segment_Summary.md",
        meta: "Mock context result",
      },
    },
    {
      text:
        "Using the current local context, here’s a concise view:\n\n- Revenue quality improved alongside growth.\n- Margin expansion looks durable if service costs stay flat.\n- The next question worth asking is whether Q2 pipeline quality matches Q1 momentum.",
    },
    {
      text:
        "From the attached notes and reports, the most notable signal is alignment: product, sales, and research all point to the same launch window.\n\nIf you want, I can keep the same sources mounted and turn this into a compact action summary.",
    },
  ],
};
