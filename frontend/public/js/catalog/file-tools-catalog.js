export const fileToolsCatalog = [
  {
    displayName: "SafeActionSkill",
    name: "safe_action",
    description:
      "只生成安全操作计划，用于把文件整理意图转成说明，不执行任何真实动作。",
    safetyBoundary:
      "只生成安全操作计划，不执行删除、移动、重命名、复制等真实文件操作。",
    recommendedUse:
      "当你想先确认整理方案、风险点或步骤说明时使用。",
    forbidden: [
      "不执行真实文件操作",
      "不读取真实文件内容",
      "不扫描真实文件系统",
    ],
    example: "帮我整理文件",
  },
  {
    displayName: "FileAnalysisSkill",
    name: "file_analysis",
    description:
      "只根据用户手写的文本描述生成文件分析计划，不会直接读取目标文件。",
    safetyBoundary: "只生成文件分析计划，不读取真实文件。",
    recommendedUse:
      "当用户先提供目标和文件类型，想看分析思路或处理步骤时使用。",
    forbidden: [
      "不打开真实 PDF",
      "不读取 Word、Excel、图片等文件内容",
      "不执行真实文件分析",
    ],
    example: "帮我分析 PDF",
  },
  {
    displayName: "FileInventorySkill",
    name: "file_inventory",
    description:
      "只解析用户手动提供的文件清单文本，并整理出结构化结果。",
    safetyBoundary:
      "只解析用户手动提供的文件清单文本，不扫描真实文件系统。",
    recommendedUse:
      "当用户已经列出文件名、目标和分类想法，想先做文本级整理时使用。",
    forbidden: [
      "不读取真实目录",
      "不自动发现文件",
      "不修改任何文件",
    ],
    example: "文件清单：cet4.pdf，目标：总结重点",
  },
  {
    displayName: "ReadOnlyFileScannerSkill",
    name: "readonly_file_scanner",
    description:
      "设计为只读白名单目录内文件元信息的能力展示，当前页面只展示边界，不触发执行。",
    safetyBoundary:
      "只读白名单目录内文件元信息，不读取文件内容，不递归，不修改文件。",
    recommendedUse:
      "当需要先确认目录可见范围和元信息读取边界时使用。",
    forbidden: [
      "不读取文件正文",
      "不递归扫描子目录",
      "不执行复制、移动、删除、重命名",
    ],
    example: "扫描目录",
  },
  {
    displayName: "ReadOnlyTextPreviewSkill",
    name: "readonly_text_preview",
    description:
      "设计为只读白名单目录内 txt 或 md 小文件预览的能力展示，当前页面只展示边界，不触发执行。",
    safetyBoundary:
      "只读白名单目录内 txt 或 md 小文件预览，默认限制文件大小和预览长度，不读取 PDF、Word、Excel、图片。",
    recommendedUse:
      "当需要向用户解释可预览文件范围和预览限制时使用。",
    forbidden: [
      "不读取 PDF、Word、Excel、图片",
      "不预览超出白名单范围的文件",
      "不修改文件内容",
    ],
    example: "预览文件：data\\scan_sandbox\\a_note.txt",
  },
];
