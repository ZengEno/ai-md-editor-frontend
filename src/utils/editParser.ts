import Logger from "./logger";

interface LineEdit {
    lineNumber: number;
    content: string;
}

export class EditParser {
    private static readonly MAX_LINE_NUMBER = 100000;

    // Parse line edits from edited article text
    static parseLineEdits(editedArticle: string): LineEdit[] {
        const lineEditRegex = /<line_(\d+)>([\s\S]*?)<\/line_\1>/g;
        const edits: Map<number, string> = new Map();

        let match;
        while ((match = lineEditRegex.exec(editedArticle)) !== null) {
            const lineNum = parseInt(match[1], 10);
            if (
                isNaN(lineNum) ||
                lineNum < 1 ||
                lineNum > this.MAX_LINE_NUMBER
            ) {
                Logger.warn(`Skipping invalid line number: ${lineNum}`);
                continue;
            }

            // match[2] contains the content between tags
            const content = match[2];
            edits.set(lineNum, content);
        }

        return Array.from(edits.entries())
            .map(([lineNumber, content]) => ({ lineNumber, content }))
            .sort((a, b) => a.lineNumber - b.lineNumber);
    }

    static validateContent(content: string): boolean {
        return content.length < 1000000; // Max line length
    }

    // Apply edits to original content
    static applyEdits(originalContent: string, edits: LineEdit[]): string {
        if (!originalContent) {
            throw new Error("Original content cannot be empty");
        }

        const lines = originalContent.split("\n");
        const maxLineNumber = Math.min(
            Math.max(lines.length, ...edits.map((edit) => edit.lineNumber)),
            this.MAX_LINE_NUMBER
        );

        // Extend array to accommodate new lines
        while (lines.length < maxLineNumber) {
            lines.push("");
        }

        // Apply edits with validation
        for (const edit of edits) {
            if (edit.lineNumber > 0) {
                if (!this.validateContent(edit.content)) {
                    Logger.warn(`Invalid content for line ${edit.lineNumber}`);
                    continue;
                }
                lines[edit.lineNumber - 1] = edit.content;
            }
        }

        return lines.join("\n");
    }
}
