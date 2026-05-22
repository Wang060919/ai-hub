function isMarkdownFence(line) {
  return line.trim().startsWith("```");
}

function matchUnorderedListItem(line) {
  return line.match(/^\s*[-*]\s+(.+)$/);
}

function matchOrderedListItem(line) {
  return line.match(/^\s*\d+\.\s+(.+)$/);
}

function appendPlainText(parent, text) {
  if (text) {
    parent.append(document.createTextNode(text));
  }
}

function appendInlineMarkdown(parent, text, options = {}) {
  const allowBold = options.allowBold !== false;
  let index = 0;

  while (index < text.length) {
    const nextCode = text.indexOf("`", index);
    const nextBold = allowBold ? text.indexOf("**", index) : -1;
    const hasCode = nextCode !== -1;
    const hasBold = nextBold !== -1;

    if (!hasCode && !hasBold) {
      appendPlainText(parent, text.slice(index));
      return;
    }

    const useCode = hasCode && (!hasBold || nextCode < nextBold);
    const tokenIndex = useCode ? nextCode : nextBold;
    appendPlainText(parent, text.slice(index, tokenIndex));

    if (useCode) {
      const endCode = text.indexOf("`", tokenIndex + 1);
      if (endCode === -1) {
        appendPlainText(parent, text.slice(tokenIndex));
        return;
      }

      const code = document.createElement("code");
      code.className = "markdown-inline-code";
      code.textContent = text.slice(tokenIndex + 1, endCode);
      parent.append(code);
      index = endCode + 1;
      continue;
    }

    const endBold = text.indexOf("**", tokenIndex + 2);
    if (endBold === -1) {
      appendPlainText(parent, text.slice(tokenIndex));
      return;
    }

    const strong = document.createElement("strong");
    appendInlineMarkdown(strong, text.slice(tokenIndex + 2, endBold), {
      allowBold: false,
    });
    parent.append(strong);
    index = endBold + 2;
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

function appendCodeBlock(container, codeLines) {
  const pre = document.createElement("pre");
  pre.className = "markdown-code-block";

  const code = document.createElement("code");
  code.textContent = codeLines.join("\n");

  pre.append(code);
  container.append(pre);
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

    if (isMarkdownFence(line)) {
      const codeLines = [];
      index += 1;

      while (index < lines.length && !isMarkdownFence(lines[index])) {
        codeLines.push(lines[index]);
        index += 1;
      }

      if (index < lines.length && isMarkdownFence(lines[index])) {
        index += 1;
      }

      appendCodeBlock(container, codeLines);
      continue;
    }

    if (matchUnorderedListItem(line)) {
      index = appendList(container, lines, index, false);
      continue;
    }

    if (matchOrderedListItem(line)) {
      index = appendList(container, lines, index, true);
      continue;
    }

    const paragraphLines = [];
    while (
      index < lines.length &&
      lines[index].trim() &&
      !isMarkdownFence(lines[index]) &&
      !matchUnorderedListItem(lines[index]) &&
      !matchOrderedListItem(lines[index])
    ) {
      paragraphLines.push(lines[index]);
      index += 1;
    }

    appendParagraph(container, paragraphLines);
  }
}
