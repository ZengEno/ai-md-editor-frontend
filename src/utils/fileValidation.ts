export interface ValidationResult {
    isValid: boolean;
    error: string;
}

export class FileNameValidator {
    private static readonly VALID_CHARS_REGEX = /^[a-zA-Z0-9_\- ]+$/;

    static validate(
        name: string,
        options: {
            currentFileId?: string;
            existingFiles?: string[];
            extension?: string;
        } = {}
    ): ValidationResult {
        const {
            currentFileId,
            existingFiles = [],
            extension = '.md'
        } = options;

        // Remove extension for validation
        const nameWithoutExt = name.endsWith(extension) 
            ? name.slice(0, -extension.length) 
            : name;

        // Check if empty
        if (!nameWithoutExt.trim()) {
            return {
                isValid: false,
                error: 'File name cannot be empty'
            };
        }

        // Check for valid characters
        if (!this.VALID_CHARS_REGEX.test(nameWithoutExt)) {
            return {
                isValid: false,
                error: 'File name can only contain letters, numbers, spaces, hyphens and underscores'
            };
        }

        // Check length
        if (nameWithoutExt.length > 255) {
            return {
                isValid: false,
                error: 'File name is too long'
            };
        }

        // Check for duplicates
        const finalName = nameWithoutExt + extension;
        const isDuplicate = existingFiles.some(existingName => {
            // If we're renaming a file, exclude it from duplicate check
            if (currentFileId && existingName === finalName) {
                return false;
            }
            return existingName.toLowerCase() === finalName.toLowerCase();
        });

        if (isDuplicate) {
            return {
                isValid: false,
                error: `A file named "${finalName}" already exists`
            };
        }

        return {
            isValid: true,
            error: ''
        };
    }

    static sanitizeName(name: string, extension = '.md'): string {
        // Remove extension if present
        const nameWithoutExt = name.endsWith(extension) 
            ? name.slice(0, -extension.length) 
            : name;

        // Add extension back
        return nameWithoutExt + extension;
    }
} 