import { spawn } from "node:child_process";

export async function copyMetadataWithExiftool(
    sourcePath: string,
    targetPath: string,
): Promise<void> {
    await new Promise<void>((resolve, reject) => {
        const process = spawn("exiftool", [
            "-overwrite_original",
            "-TagsFromFile",
            sourcePath,
            "-all:all",
            targetPath,
        ]);

        let stderr = "";

        process.stderr.on("data", (chunk) => {
            stderr += chunk.toString();
        });

        process.on("error", (error) => {
            reject(error);
        });

        process.on("close", (code) => {
            if (code === 0) {
                resolve();
                return;
            }

            reject(
                new Error(`exiftool failed with exit code ${code}: ${stderr}`),
            );
        });
    });
}
