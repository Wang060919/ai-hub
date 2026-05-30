/* Markdown renderer — enhanced with headings, links, blockquotes, hr, code copy */

function isMarkdownFence(line) {
  return line.trim().startsWith("```");
}

function matchUnorderedListItem(line) {
  return line.match(/^\s*[-*]\s+(.+)$/);
}

function matchOrderedListItem(line) {
  return line.match(/^\s*\d+\.\s+(.+)$/);
}

function matchHeading(line) {
  const m = line.match(/^(#{1,6})\s+(.+)$/);
  if (!m) return null;
  return { level: m[1].length, text: m[2] };
}

function matchBlockquote(line) {
  const m = line.match(/^>\s?(.*)$/);
  return m ? m[1] : null;
}

function isHorizontalRule(line) {
  return /^(\s*[-*_]\s*){3,}$/.test(line.trim());
}

function appendPlainText(parent, text) {
  if (text) {
    parent.append(document.createTextNode(text));
  }
}

function escapeHtml(text) {
  const d = document.createElement("div");
  d.textContent = text;
  return d.innerHTML;
}

function appendInlineMarkdown(parent, text, options = {}) {
  const allowBold = options.allowBold !== false;
  let index = 0;

  while (index < text.length) {
    const nextLink = text.indexOf("[", index);
    const nextCode = text.indexOf("`", index);
    const nextBold = allowBold ? text.indexOf("**", index) : -1;
    const nextItalic = text.indexOf("*", index);
    const hasLink = nextLink !== -1;
    const hasCode = nextCode !== -1;
    const hasBold = nextBold !== -1;
    const hasItalic = nextItalic !== -1 && !hasBold;

    // Find the earliest token
    const candidates = [];
    if (hasLink) candidates.push({ type: "link", pos: nextLink });
    if (hasCode) candidates.push({ type: "code", pos: nextCode });
    if (hasBold) candidates.push({ type: "bold", pos: nextBold });
    if (hasItalic) candidates.push({ type: "italic", pos: nextItalic });

    if (candidates.length === 0) {
      appendPlainText(parent, text.slice(index));
      return;
    }

    candidates.sort((a, b) => a.pos - b.pos);
    const token = candidates[0];

    appendPlainText(parent, text.slice(index, token.pos));

    if (token.type === "link") {
      const closeBracket = text.indexOf("]", token.pos + 1);
      if (closeBracket === -1 || text[closeBracket + 1] !== "(") {
        appendPlainText(parent, text.slice(token.pos));
        return;
      }
      const closeParen = text.indexOf(")", closeBracket + 2);
      if (closeParen === -1) {
        appendPlainText(parent, text.slice(token.pos));
        return;
      }
      const linkText = text.slice(token.pos + 1, closeBracket);
      const href = text.slice(closeBracket + 2, closeParen);
      const a = document.createElement("a");
      a.className = "markdown-link";
      a.textContent = linkText;
      a.href = href;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      parent.append(a);
      index = closeParen + 1;
      continue;
    }

    if (token.type === "code") {
      const endCode = text.indexOf("`", token.pos + 1);
      if (endCode === -1) {
        appendPlainText(parent, text.slice(token.pos));
        return;
      }

      const code = document.createElement("code");
      code.className = "markdown-inline-code";
      code.textContent = text.slice(token.pos + 1, endCode);
      parent.append(code);
      index = endCode + 1;
      continue;
    }

    if (token.type === "bold") {
      const endBold = text.indexOf("**", token.pos + 2);
      if (endBold === -1) {
        appendPlainText(parent, text.slice(token.pos));
        return;
      }

      const strong = document.createElement("strong");
      appendInlineMarkdown(strong, text.slice(token.pos + 2, endBold), {
        allowBold: false,
      });
      parent.append(strong);
      index = endBold + 2;
      continue;
    }

    if (token.type === "italic") {
      const endItalic = text.indexOf("*", token.pos + 1);
      if (endItalic === -1) {
        appendPlainText(parent, text.slice(token.pos));
        return;
      }

      const em = document.createElement("em");
      appendInlineMarkdown(em, text.slice(token.pos + 1, endItalic), {
        allowBold: true,
      });
      parent.append(em);
      index = endItalic + 1;
      continue;
    }
  }
}

function appendParagraph(container, lines) {
  const paragraph = document.createElement("p");
  lines.forEach((line, index) => {
    if (index > 0) {
      paragraph.append(document.createElement("br"));
    }
    appendInlineMarkdown(paragraph, line);
  });
  container.append(paragraph);
}

function appendList(container, lines, startIndex, ordered) {
  const list = document.createElement(ordered ? "ol" : "ul");
  let index = startIndex;

  while (index < lines.length) {
    const match = ordered
      ? matchOrderedListItem(lines[index])
      : matchUnorderedListItem(lines[index]);

    if (!match) {
      break;
    }

    const item = document.createElement("li");
    appendInlineMarkdown(item, match[1]);
    list.append(item);
    index += 1;
  }

  container.append(list);
  return index;
}

function appendHeading(container, level, text) {
  const heading = document.createElement(`h${level}`);
  heading.className = `markdown-heading markdown-h${level}`;
  appendInlineMarkdown(heading, text);
  container.append(heading);
}

function appendBlockquote(container, lines, startIndex) {
  const blockquote = document.createElement("blockquote");
  blockquote.className = "markdown-blockquote";

  let index = startIndex;
  const quoteLines = [];

  while (index < lines.length) {
    const content = matchBlockquote(lines[index]);
    if (content === null) break;
    quoteLines.push(content);
    index += 1;
  }

  // Render inner content recursively
  if (quoteLines.length > 0) {
    const innerText = quoteLines.join("\n");
    const p = document.createElement("p");
    appendInlineMarkdown(p, innerText);
    blockquote.append(p);
  }

  container.append(blockquote);
  return index;
}

function appendCodeBlock(container, codeLines, lang) {
  const wrapper = document.createElement("div");
  wrapper.className = "markdown-code-wrapper";

  // Header with language label and copy button
  const header = document.createElement("div");
  header.className = "markdown-code-header";

  const langLabel = document.createElement("span");
  langLabel.className = "markdown-code-lang";
  langLabel.textContent = lang || "code";

  const copyBtn = document.createElement("button");
  copyBtn.className = "markdown-code-copy";
  copyBtn.type = "button";
  copyBtn.textContent = "复制";
  copyBtn.addEventListener("click", () => {
    const text = codeLines.join("\n");
    navigator.clipboard.writeText(text).then(() => {
      copyBtn.textContent = "已复制";
      copyBtn.classList.add("copied");
      setTimeout(() => {
        copyBtn.textContent = "复制";
        copyBtn.classList.remove("copied");
      }, 2000);
    }).catch(() => {
      copyBtn.textContent = "失败";
      setTimeout(() => { copyBtn.textContent = "复制"; }, 2000);
    });
  });

  header.append(langLabel, copyBtn);

  const pre = document.createElement("pre");
  pre.className = "markdown-code-block";

  const code = document.createElement("code");
  code.textContent = codeLines.join("\n");

  pre.append(code);
  wrapper.append(header, pre);
  container.append(wrapper);
}

export function renderAssistantMessageContent(container, content) {
  const rawContent = String(content || "");
  const normalizedContent = rawContent.trim() ? rawContent : "-";
  const lines = normalizedContent.replaceAll("\r\n", "\n").split("\n");
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      index += 1;
      continue;
    }

    // Code block
    if (isMarkdownFence(line)) {
      const lang = line.trim().slice(3).trim();
      const codeLines = [];
      index += 1;

      while (index < lines.length && !isMarkdownFence(lines[index])) {
        codeLines.push(lines[index]);
        index += 1;
      }

      if (index < lines.length && isMarkdownFence(lines[index])) {
        index += 1;
      }

      appendCodeBlock(container, codeLines, lang);
      continue;
    }

    // Horizontal rule
    if (isHorizontalRule(line)) {
      const hr = document.createElement("hr");
      hr.className = "markdown-hr";
      container.append(hr);
      index += 1;
      continue;
    }

    // Heading
    const heading = matchHeading(line);
    if (heading) {
      appendHeading(container, heading.level, heading.text);
      index += 1;
      continue;
    }

    // Blockquote
    if (matchBlockquote(line) !== null) {
      index = appendBlockquote(container, lines, index);
      continue;
    }

    // Unordered list
    if (matchUnorderedListItem(line)) {
      index = appendList(container, lines, index, false);
      continue;
    }

    // Ordered list
    if (matchOrderedListItem(line)) {
      index = appendList(container, lines, index, true);
      continue;
    }

    // Paragraph (collect contiguous lines)
    const paragraphLines = [];
    while (
      index < lines.length &&
      lines[index].trim() &&
      !isMarkdownFence(lines[index]) &&
      !matchUnorderedListItem(lines[index]) &&
      !matchOrderedListItem(lines[index]) &&
      !matchHeading(lines[index]) &&
      matchBlockquote(lines[index]) === null &&
      !isHorizontalRule(lines[index])
    ) {
      paragraphLines.push(lines[index]);
      index += 1;
    }

    appendParagraph(container, paragraphLines);
  }
}
