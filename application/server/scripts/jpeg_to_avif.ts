import fs from "node:fs/promises";
import path from "node:path";

import { PUBLIC_PATH } from "../src/paths.js";
import { runFfmpeg } from "../src/utils/ffmpeg.js";

async function convertDirectory(dir: string, maxWidth: number): Promise<void> {
    const files = await fs.readdir(dir);

    console.log("Start convert files", dir, files);
    for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        if (ext !== ".jpg" && ext !== ".jpeg") continue;

        const name = path.basename(file, ext);
        const newFile = `${name}.avif`;

        await runFfmpeg([
            "-y",
            "-i",
            path.resolve(dir, file),
            "-vf",
            `scale='min(iw,${maxWidth})':-1`,
            "-c:v",
            "libaom-av1",
            "-still-picture",
            "1",
            "-b:v",
            "0",
            path.resolve(dir, `./${newFile}`),
        ]);

        console.log(
            `outputed: ${path.relative(PUBLIC_PATH, path.resolve(dir, newFile))}`,
        );
    }
}

(async () => {
    const imagesDir = path.resolve(PUBLIC_PATH, "./images");
    const profilesDir = path.resolve(imagesDir, "./profiles");

    await convertDirectory(imagesDir, 600);
    await convertDirectory(profilesDir, 200);
})();
