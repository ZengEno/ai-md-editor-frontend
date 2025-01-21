export interface Version {
    name: string;
    timestamp: string;
    filePath: string;
}

export interface VersionComparison {
    version: Version;
    content: string;
} 