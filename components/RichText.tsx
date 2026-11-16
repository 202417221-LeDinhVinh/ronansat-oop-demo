"use client";

import React, { useMemo } from "react";
import katex from "katex";
import DOMPurify from "isomorphic-dompurify";

interface RichTextProps {
    content?: string | null;
    className?: string;
    as?: "div" | "span";
}

const ALLOWED_TAGS = [
    // Standard text formatting & structure
    "br", "b", "i", "u", "em", "strong", "p", "sup", "sub", "span", "div",
    "table", "thead", "tbody", "tr", "th", "td", "ul", "ol", "li",
    // KaTeX MathML elements
    "math", "annotation", "semantics", "mrow", "mi", "mn", "mo", "msup", "msub",
    "mfrac", "msqrt", "mroot", "mover", "munder", "munderover", "mtable", "mtr", "mtd",
    "mspace", "mpadded", "mphantom",
    // KaTeX SVG elements
    "svg", "path", "g", "line", "rect", "circle"
];

const ALLOWED_ATTR = [
    "class", "style", "aria-hidden", "viewBox", "width", "height", "fill", "stroke", "d", "xmlns", "encoding"
];

export function renderRichText(content?: string | null): string {
    if (!content) return "";

    // 1. Render display math: \[ ... \]
    let rendered = content.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => {
        try {
            return katex.renderToString(math.trim(), { displayMode: true, throwOnError: false });
        } catch {
            return math;
        }
    });

    // 2. Render inline math: \( ... \)
    rendered = rendered.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => {
        try {
            return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
        } catch {
            return math;
        }
    });

    // 3. Literal dollar signs outside math: \$ -> $
    rendered = rendered.replace(/\\\\\$/g, "$").replace(/\\\$/g, "$");

    // 4. Sanitize HTML with strict allow-list
    return DOMPurify.sanitize(rendered, {
        ALLOWED_TAGS,
        ALLOWED_ATTR
    });
}

export default function RichText({ content, className = "", as = "div" }: RichTextProps) {
    const html = useMemo(() => renderRichText(content), [content]);

    const Component = as;

    return (
        <Component
            className={`rich-text ${className}`}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}
