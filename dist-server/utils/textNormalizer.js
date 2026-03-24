"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.escapeXml = escapeXml;
exports.normalizeBrandText = normalizeBrandText;
exports.normalizeScript = normalizeScript;
function escapeXml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
function normalizeBrandText(text) {
    return text.replace(/JB(?:³|3)\s*AI/gi, 'JB 3 A I');
}
function normalizeScript(text) {
    const branded = normalizeBrandText(text);
    return escapeXml(branded);
}
